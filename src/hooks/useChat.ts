import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ensureAnonymousSession, cacheUserId } from '@/lib/sessionSupabase';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useChat() {
  const { language } = useLanguage();
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

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: Message = { role: 'user', content: input };
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

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'x-session-id': currentSessionId,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          language 
        }),
      });

      if (!resp.ok || !resp.body) {
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
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, language, sessionId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
