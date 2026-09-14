import { useState, useCallback, useEffect } from 'react';
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
    // Prevent duplicate sends from rapid double-clicks / Enter mashing
    if (isLoading) return;
    const userMsg: Message = { role: 'user', content: input, images: images?.length ? images : undefined };
    setMessages(prev => [...prev, userMsg]);

    setIsLoading(true);

    let assistantSoFar = '';

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
      
      // Update session ID if it changed
      if (currentSessionId !== sessionId) {
        setSessionId(currentSessionId);
        cacheUserId(currentSessionId);
      }

      // 60s timeout — chat streams can be long but should not hang forever
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 60_000);
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'x-session-id': currentSessionId,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMsg].map(toApiMessage),
          language,
          farmContext: farmContext(profile),
        }),

        signal: ac.signal,
      });
      clearTimeout(timer);

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
          if (jsonStr === '[DONE]') break;

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
      setIsLoading(false);
    }
  }, [messages, language, sessionId, isLoading, profile]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
