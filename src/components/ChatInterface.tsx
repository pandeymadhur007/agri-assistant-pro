import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChat, Message } from '@/hooks/useChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCloudSpeechRecognition } from '@/hooks/useCloudSpeechRecognition';
import { useMurfTTS } from '@/hooks/useMurfTTS';
import { cn } from '@/lib/utils';

// Clean AI response by removing any markdown formatting
function cleanAIResponse(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')       // Remove *italic*
    .replace(/__([^_]+)__/g, '$1')       // Remove __bold__
    .replace(/_([^_]+)_/g, '$1')         // Remove _italic_
    .replace(/~~([^~]+)~~/g, '$1')       // Remove ~~strikethrough~~
    .replace(/`([^`]+)`/g, '$1')         // Remove `code`
    .replace(/^#+\s/gm, '')              // Remove # headers
    .replace(/^\s*[-*]\s+/gm, '')        // Remove - or * bullet points
    .replace(/^\s*\d+\.\s+/gm, (match, offset, str) => {
      // Keep numbered lists but ensure clean formatting
      const num = match.trim().replace('.', '');
      return `${num}. `;
    })
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove [links](url)
    .replace(/\n{3,}/g, '\n\n')          // Reduce multiple newlines
    .trim();
}

// Strip markdown for TTS (more aggressive)
function stripMarkdownForTTS(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

export function ChatInterface() {
  const { t, language } = useLanguage();
  const { messages, isLoading, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string>('');
  
  // Voice features
  const { isRecording, isProcessing, transcript, isSupported: micSupported, startRecording, stopRecording, resetTranscript } = useCloudSpeechRecognition();
  const { isPlaying, isLoading: ttsLoading, isSupported: ttsSupported, speak, stop: stopSpeaking } = useMurfTTS();
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  // Derived state for mic button
  const isListening = isRecording || isProcessing;

  // Suggested questions based on current language
  const suggestedQuestions = [
    t('suggestedQ1'),
    t('suggestedQ2'),
    t('suggestedQ3'),
    t('suggestedQ4'),
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Auto-speak new assistant messages
  useEffect(() => {
    if (autoSpeak && messages.length > 0 && !isLoading) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content !== lastMessageRef.current) {
        lastMessageRef.current = lastMessage.content;
        const cleanText = stripMarkdownForTTS(lastMessage.content);
        speak(cleanText, language);
      }
    }
  }, [messages, isLoading, autoSpeak, speak, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    stopRecording();
    resetTranscript();
    sendMessage(input.trim());
    setInput('');
  };

  const handleSuggestedQuestion = (question: string) => {
    if (isLoading) return;
    sendMessage(question);
  };

  const toggleMic = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(language);
    }
  };

  const toggleAutoSpeak = () => {
    if (isPlaying) {
      stopSpeaking();
    }
    setAutoSpeak(!autoSpeak);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-6xl mb-4">🌾</div>
            <h2 className="text-xl font-semibold mb-2">{t('welcomeMessage')}</h2>
            <p className="text-muted-foreground mb-6 text-sm max-w-md">
              {t('chatHelperText')}
            </p>
            
            {/* Suggested question chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-full transition-colors text-secondary-foreground"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
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
              className={isRecording ? "animate-pulse" : ""}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? "Recording..." : isProcessing ? "Transcribing..." : t('chatPlaceholder')}
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
              disabled={ttsLoading}
            >
              {ttsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : autoSpeak ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const displayContent = isUser ? message.content : cleanAIResponse(message.content);

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shrink-0',
          isUser
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {isUser ? '👤' : 'ग्र'}
      </div>
      <div
        className={cn(
          'rounded-lg p-4 max-w-[80%] shadow-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{displayContent}</p>
      </div>
    </div>
  );
}
