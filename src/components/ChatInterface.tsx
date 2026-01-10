import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChat, Message } from '@/hooks/useChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { cn } from '@/lib/utils';

export function ChatInterface() {
  const { t } = useLanguage();
  const { messages, isLoading, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string>('');
  
  // Voice features
  const { isListening, transcript, isSupported: micSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { isSpeaking, isSupported: ttsSupported, speak, stop: stopSpeaking } = useSpeechSynthesis();
  const [autoSpeak, setAutoSpeak] = useState(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Strip markdown for TTS
  const stripMarkdown = (text: string): string => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold**
      .replace(/\*([^*]+)\*/g, '$1')     // *italic*
      .replace(/__([^_]+)__/g, '$1')     // __bold__
      .replace(/_([^_]+)_/g, '$1')       // _italic_
      .replace(/~~([^~]+)~~/g, '$1')     // ~~strikethrough~~
      .replace(/`([^`]+)`/g, '$1')       // `code`
      .replace(/#+\s/g, '')              // # headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [links](url)
      .replace(/[•\-]\s/g, '')           // bullet points
      .trim();
  };

  // Auto-speak new assistant messages
  useEffect(() => {
    if (autoSpeak && messages.length > 0 && !isLoading) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content !== lastMessageRef.current) {
        lastMessageRef.current = lastMessage.content;
        const cleanText = stripMarkdown(lastMessage.content);
        speak(cleanText, 'en-IN'); // Indian English voice
      }
    }
  }, [messages, isLoading, autoSpeak, speak]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    stopListening();
    resetTranscript();
    sendMessage(input.trim());
    setInput('');
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleAutoSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setAutoSpeak(!autoSpeak);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <div className="text-6xl mb-4">🌾</div>
            <p className="text-lg">{t('welcomeMessage')}</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
              ग्र
            </div>
            <div className="rounded-lg bg-muted p-3">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t bg-background p-4">
        <div className="flex gap-2">
          {/* Mic button */}
          {micSupported && (
            <Button
              type="button"
              size="icon"
              variant={isListening ? "destructive" : "outline"}
              onClick={toggleMic}
              className={isListening ? "animate-pulse" : ""}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : t('chatPlaceholder')}
            className="min-h-[50px] max-h-[200px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          
          {/* TTS toggle button */}
          {ttsSupported && (
            <Button
              type="button"
              size="icon"
              variant={autoSpeak ? "default" : "outline"}
              onClick={toggleAutoSpeak}
              title={autoSpeak ? "Voice on" : "Voice off"}
            >
              {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function formatMessageContent(content: string) {
  // Replace "quoted text" with bold text
  const parts = content.split(/(".*?")/g);
  return parts.map((part, index) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      // Remove quotes and make bold
      return <strong key={index}>{part.slice(1, -1)}</strong>;
    }
    return part;
  });
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shrink-0',
          isUser
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {isUser ? '👤' : 'ग्र'}
      </div>
      <div
        className={cn(
          'rounded-lg p-3 max-w-[80%]',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <p className="whitespace-pre-wrap">{isUser ? message.content : formatMessageContent(message.content)}</p>
      </div>
    </div>
  );
}
