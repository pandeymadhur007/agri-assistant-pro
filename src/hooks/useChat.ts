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
    // Prevent duplicate sends from rapid double-clicks / Enter mashing
    if (isLoading) return;
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

    // The session is only used to personalise answers with recent scans.
    // It must never block the chat itself — an auth hiccup used to kill every reply.
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
        currentSessionId = await ensureAnonymousSession();
        if (currentSessionId) {
          setSessionId(currentSessionId);
          cacheUserId(currentSessionId);
        }
      } catch {
        currentSessionId = null;
      }
    }

    // Only send a bounded slice of history — long threads slowed the model down.
    const history = [...messages, userMsg].slice(-12);

    const callChat = async (): Promise<Response> => {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 60_000);
      try {
        return await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            ...(currentSessionId ? { 'x-session-id': currentSessionId } : {}),
          },
          body: JSON.stringify({ messages: history, language }),
          signal: ac.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    };

    try {
      let resp = await callChat();

      // One retry for transient upstream failures (never for 4xx — those are terminal).
      if (resp.status >= 500) {
        await new Promise(r => setTimeout(r, 700));
        resp = await callChat();
      }

      if (!resp.ok || !resp.body) {
        let serverMsg = '';
        try {
          const j = await resp.json();
          serverMsg = typeof j?.error === 'string' ? j.error : '';
        } catch { /* non-JSON body */ }
        if (resp.status === 429) throw new Error(serverMsg || 'Too many requests. Please wait a moment and try again.');
        if (resp.status === 402) throw new Error(serverMsg || 'AI service is temporarily unavailable. Please try again later.');
        throw new Error(serverMsg || 'Failed to start stream');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let done = false;

      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { done = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            // Partial JSON chunk — put it back and wait for the rest.
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (!assistantSoFar.trim()) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'I could not generate a reply just now. Please ask again.' },
        ]);
      }
    } catch (e) {
      console.error('Chat error:', e);
      const msg = e instanceof Error && e.name === 'AbortError'
        ? 'Response timed out. Please try again.'
        : e instanceof Error && e.message && e.message !== 'Failed to start stream'
          ? e.message
          : 'Sorry, I encountered an error. Please try again.';
      if (assistantSoFar.trim()) {
        updateAssistant(`\n\n(${msg})`);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, language, sessionId, isLoading]);


  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
