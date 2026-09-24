import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ensureAnonymousSession, cacheUserId } from '@/lib/sessionSupabase';
import { farmContext, useFarmProfile } from '@/hooks/useFarmProfile';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  /** Data URLs of attached images (user messages only) */
  images?: string[];
}

type ApiBlock =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

function toApiMessage(m: Message): { role: string; content: string | ApiBlock[] } {
  if (m.role === 'user' && m.images?.length) {
    return {
      role: m.role,
      content: [
        { type: 'text', text: m.content || 'Please look at this crop photo and help me.' },
        ...m.images.map((url) => ({ type: 'image_url' as const, image_url: { url } })),
      ],
    };
  }
  return { role: m.role, content: m.content };
}


export function useChat() {
  const { language } = useLanguage();
  const { profile } = useFarmProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sendLockRef = useRef(false);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      const id = await ensureAnonymousSession();
      if (id) {
        setSessionId(id);
        cacheUserId(id);
      }
    };
    initSession();
  }, []);

  const sendMessage = useCallback(async (input: string, images?: string[]) => {
    // State updates are asynchronous; a ref closes the rapid double-submit window.
    if (sendLockRef.current) return;
    sendLockRef.current = true;
    const userMsg: Message = { role: 'user', content: input, images: images?.length ? images : undefined };
    setMessages(prev => [...prev, userMsg]);

    setIsLoading(true);

    let assistantSoFar = '';
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const updateAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      // Ensure we have a session
      const currentSessionId = sessionId || await ensureAnonymousSession();
      if (!currentSessionId) {
        throw new Error('Failed to create session');
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Your session expired. Please refresh and try again.');
      }
      
      // Update session ID if it changed
      if (currentSessionId !== sessionId) {
        setSessionId(currentSessionId);
        cacheUserId(currentSessionId);
      }

      // 60s timeout — chat streams can be long but should not hang forever
      const ac = new AbortController();
      timeoutId = setTimeout(() => ac.abort(), 60_000);
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMsg].map(toApiMessage),
          language,
          farmContext: farmContext(profile),
        }),

        signal: ac.signal,
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error('Too many requests. Please wait a moment.');
        if (resp.status === 402) throw new Error('AI service is temporarily unavailable. Please try again later.');
        throw new Error('Failed to start stream');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            await reader.cancel();
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
      // Some servers flush the final SSE event without a trailing newline.
      const finalLine = textBuffer.trim();
      if (finalLine.startsWith('data: ')) {
        const jsonStr = finalLine.slice(6).trim();
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch { /* Ignore an incomplete final event. */ }
        }
      }
    } catch (e) {
      console.error('Chat error:', e);
      const msg = e instanceof Error && e.name === 'AbortError'
        ? 'Response timed out. Please try again.'
        : e instanceof Error && e.message && e.message !== 'Failed to start stream'
          ? e.message
          : 'Sorry, I encountered an error. Please try again.';
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: msg },
      ]);
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      sendLockRef.current = false;
      setIsLoading(false);
    }
  }, [messages, language, sessionId, isLoading, profile]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
