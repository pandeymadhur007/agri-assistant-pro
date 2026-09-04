import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Loader2, Volume2, VolumeX, Plus, Camera, ImageIcon, X, Mic, Square, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChat, Message } from '@/hooks/useChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMurfTTS } from '@/hooks/useMurfTTS';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { cn } from '@/lib/utils';
import { compressToDataUrl } from '@/lib/imageCompress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

const MAX_ATTACHMENTS = 4;

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
  const location = useLocation();
  const { messages, isLoading, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [attaching, setAttaching] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string>('');
  const prefillSentRef = useRef(false);


  // Auto-send prefill from scan result page
  useEffect(() => {
    const prefill = (location.state as { prefill?: string } | null)?.prefill;
    if (prefill && !prefillSentRef.current && messages.length === 0) {
      prefillSentRef.current = true;
      sendMessage(prefill);
    }
  }, [location.state, messages.length, sendMessage]);

  // TTS
  const { isPlaying, isLoading: ttsLoading, isSupported: ttsSupported, speak, stop: stopSpeaking } = useMurfTTS();
  // Off by default: typing users shouldn't get audio playback hijacking the screen.
  // Turned on automatically while the voice assistant is in use.
  const [autoSpeak, setAutoSpeak] = useState(false);

  // Continuous voice assistant (ChatGPT-style)
  const handleTranscript = useCallback((text: string) => {
    setInput('');
    setAutoSpeak(true);
    sendMessage(text);
  }, [sendMessage]);

  const {
    state: voiceState,
    interim,
    error: voiceError,
    permission: micPermission,
    isSupported: voiceSupported,
    start: startListening,
    stop: stopListening,
    cancel: cancelListening,
    retry: retryMic,
  } = useVoiceAssistant({
    language,
    isThinking: isLoading,
    isSpeaking: isPlaying,
    stopSpeaking,
    onTranscript: handleTranscript,
    pushToTalk: true,
  });

  // Press-and-hold voice control (ChatGPT / Claude style).
  const holdRef = useRef<{ x: number; y: number } | null>(null);
  const [cancelArmed, setCancelArmed] = useState(false);
  const CANCEL_DISTANCE = 70;

  const voiceBusy = isLoading || attaching || voiceState === 'thinking';

  const handleHoldStart = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (voiceBusy || !voiceSupported) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    holdRef.current = { x: e.clientX, y: e.clientY };
    setCancelArmed(false);
    void startListening();
  };

  const handleHoldMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!holdRef.current) return;
    const dx = e.clientX - holdRef.current.x;
    const dy = e.clientY - holdRef.current.y;
    setCancelArmed(Math.hypot(dx, dy) > CANCEL_DISTANCE);
  };

  const handleHoldEnd = () => {
    if (!holdRef.current) return;
    holdRef.current = null;
    if (cancelArmed) cancelListening();
    else stopListening();
    setCancelArmed(false);
  };


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

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      toast({ title: `You can attach up to ${MAX_ATTACHMENTS} photos.`, variant: 'destructive' });
      return;
    }
    setAttaching(true);
    try {
      const picked = Array.from(files).slice(0, room).filter((f) => f.type.startsWith('image/'));
      const encoded = await Promise.all(picked.map((f) => compressToDataUrl(f)));
      setAttachments((prev) => [...prev, ...encoded]);
    } catch {
      toast({ title: 'Could not read that photo. Please try another one.', variant: 'destructive' });
    } finally {
      setAttaching(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || attaching) return;
    if (!input.trim() && attachments.length === 0) return;
    stopListening();
    sendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);
  };

  const handleSuggestedQuestion = (question: string) => {
    if (isLoading) return;
    sendMessage(question);
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
          <div className="flex gap-3 animate-fade-in">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
              ग्र
            </div>
            <div className="rounded-lg bg-muted px-4 py-3 flex items-center gap-1.5 shadow-sm">
              <span className="sr-only">Assistant is typing</span>
              <span className="h-2 w-2 rounded-full bg-primary/70 animate-typing-dot [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-primary/70 animate-typing-dot [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-primary/70 animate-typing-dot [animation-delay:300ms]" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t bg-background p-3 pb-[88px] md:pb-4">
        {/* hidden pickers */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />

        {(voiceError || micPermission === 'denied') && (
          <div
            role="alert"
            className="mb-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <p className="font-medium">
              {voiceError === 'permission-denied' || micPermission === 'denied'
                ? 'Microphone access is blocked'
                : voiceError === 'no-microphone'
                  ? 'No microphone found'
                  : voiceError === 'unsupported'
                    ? 'Voice input is not supported in this browser'
                    : voiceError === 'rate-limited'
                      ? 'Voice service is busy'
                      : 'Could not understand that clip'}
            </p>
            <p className="mt-0.5 text-destructive/85">
              {voiceError === 'permission-denied' || micPermission === 'denied'
                ? 'Tap the lock icon in your browser address bar (or Settings → Site permissions), allow the microphone, then tap Retry.'
                : voiceError === 'no-microphone'
                  ? 'Connect a microphone or use the keyboard to type your question.'
                  : voiceError === 'unsupported'
                    ? 'Please type your question instead, or open Gram AI in Chrome.'
                    : 'Hold the mic, speak close to the phone, and release when done.'}
            </p>
            {voiceError !== 'unsupported' && voiceError !== 'no-microphone' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 h-8 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => void retryMic()}
                disabled={voiceBusy}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry microphone
              </Button>
            )}
          </div>
        )}


        <div
          className={cn(
            'rounded-3xl border bg-card/80 backdrop-blur px-2 py-2 shadow-sm transition-colors',
            voiceState === 'listening' && 'border-primary ring-1 ring-primary/30',
          )}
        >
          {/* Attachment previews */}
          {(attachments.length > 0 || attaching) && (
            <div className="flex flex-wrap gap-2 px-1.5 pb-2">
              {attachments.map((src, i) => (
                <div key={i} className="relative h-16 w-16 overflow-hidden rounded-xl border">
                  <img src={src} alt={`Attached crop photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    aria-label="Remove photo"
                    className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5 text-foreground shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {attaching && (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}

          <div className="flex items-end gap-1.5">
            {/* Attach: camera / gallery */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 shrink-0 rounded-full"
                  aria-label="Add a photo"
                  disabled={isLoading}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-52">
                <DropdownMenuItem onSelect={() => cameraInputRef.current?.click()}>
                  <Camera className="mr-2 h-4 w-4" /> Take a photo
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => galleryInputRef.current?.click()}>
                  <ImageIcon className="mr-2 h-4 w-4" /> Upload from gallery
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                voiceState === 'listening' ? (interim || 'Listening…') :
                voiceState === 'thinking' ? 'Thinking…' :
                voiceState === 'speaking' ? 'Speaking…' :
                attachments.length > 0 ? 'Ask about this photo…' :
                t('chatPlaceholder')
              }
              rows={1}
              className="min-h-[40px] max-h-[160px] flex-1 resize-none border-0 bg-transparent px-1 py-2 shadow-none focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />

            {/* TTS toggle */}
            {ttsSupported && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-10 w-10 shrink-0 rounded-full"
                onClick={toggleAutoSpeak}
                title={autoSpeak ? 'Voice replies on' : 'Voice replies off'}
                aria-label={autoSpeak ? 'Turn voice replies off' : 'Turn voice replies on'}
                disabled={ttsLoading}
              >
                {ttsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : autoSpeak ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            )}

            {/* Mic — press and hold to talk; becomes Send once there is something to send */}
            {input.trim() || attachments.length > 0 || !voiceSupported ? (
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full"
                disabled={isLoading || attaching || (!input.trim() && attachments.length === 0)}
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                onPointerDown={handleHoldStart}
                onPointerMove={handleHoldMove}
                onPointerUp={handleHoldEnd}
                onPointerCancel={handleHoldEnd}
                onContextMenu={(e) => e.preventDefault()}
                disabled={voiceBusy}
                aria-label={
                  voiceBusy
                    ? 'Voice unavailable while sending'
                    : voiceState === 'listening'
                      ? cancelArmed ? 'Release to cancel recording' : 'Release to send recording'
                      : 'Press and hold to talk'
                }
                title="Press and hold to talk. Slide away to cancel."
                className={cn(
                  'relative h-10 w-10 shrink-0 touch-none select-none rounded-full transition-colors',
                  voiceState === 'listening' && !cancelArmed && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                  cancelArmed && 'bg-muted text-muted-foreground hover:bg-muted',
                )}
              >
                {voiceState === 'listening' && !cancelArmed && (
                  <span className="pointer-events-none absolute inset-0 rounded-full bg-destructive/40 animate-ping" />
                )}
                {voiceBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : cancelArmed ? (
                  <X className="relative h-4 w-4" />
                ) : voiceState === 'listening' ? (
                  <Square className="relative h-4 w-4" />
                ) : voiceState === 'speaking' ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {voiceState === 'listening' && (
            <p className="mt-1.5 px-2 text-center text-[11px] text-muted-foreground">
              {cancelArmed ? 'Release to cancel' : 'Release to send · slide away to cancel'}
            </p>
          )}
        </div>


        {!voiceSupported && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Voice input needs microphone access in this browser — please type instead.
          </p>
        )}
      </form>

    </div>
  );
}

/**
 * The vision prompt makes the model open an image answer with
 * "Photo reading: <what it sees> | Confidence: high|medium|low".
 * We lift that line out into a source/confidence banner.
 */
function extractVisionHeader(text: string) {
  const match = text.match(/^\s*Photo reading:\s*([^\n|]+)\|\s*Confidence:\s*(high|medium|low)\s*/i);
  if (!match) return null;
  return {
    reading: match[1].trim(),
    confidence: match[2].toLowerCase() as 'high' | 'medium' | 'low',
    rest: text.slice(match[0].length).trim(),
  };
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const cleaned = isUser ? message.content : cleanAIResponse(message.content);
  const vision = isUser ? null : extractVisionHeader(cleaned);
  const displayContent = vision ? vision.rest : cleaned;


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
        {message.images && message.images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Attached crop photo ${i + 1}`}
                loading="lazy"
                className="h-24 w-24 rounded-lg object-cover"
              />
            ))}
          </div>
        )}
        {displayContent && <p className="whitespace-pre-wrap leading-relaxed">{displayContent}</p>}
      </div>
    </div>
  );
}
