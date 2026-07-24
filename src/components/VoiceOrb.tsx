import { Mic, Loader2, Volume2, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VoiceState } from '@/hooks/useVoiceAssistant';

interface Props {
  state: VoiceState;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

const STATE_LABEL: Record<VoiceState, string> = {
  idle: 'Tap to talk',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking — tap to interrupt',
  processing: 'Processing…',
};

export function VoiceOrb({ state, onClick, disabled, label, className }: Props) {
  const Icon =
    state === 'thinking' ? Loader2 :
    state === 'speaking' ? Volume2 :
    state === 'listening' ? Square :
    Mic;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || state === 'thinking'}
        aria-label={STATE_LABEL[state]}
        className={cn(
          'relative flex h-14 w-14 items-center justify-center rounded-full',
          'bg-primary text-primary-foreground shadow-lg transition-all',
          'hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed',
          state === 'listening' && 'bg-destructive',
        )}
      >
        {/* Animated waves while listening */}
        {state === 'listening' && (
          <>
            <span className="pointer-events-none absolute inset-0 rounded-full bg-destructive/40 animate-ping" />
            <span className="pointer-events-none absolute -inset-2 rounded-full border border-destructive/50 animate-pulse" />
            <span className="pointer-events-none absolute -inset-4 rounded-full border border-destructive/25 animate-pulse [animation-delay:200ms]" />
          </>
        )}
        {state === 'speaking' && (
          <span className="pointer-events-none absolute -inset-1 rounded-full border-2 border-primary/50 animate-pulse" />
        )}
        <Icon className={cn('h-6 w-6 relative', state === 'thinking' && 'animate-spin')} />
      </button>
      <span className="text-xs text-muted-foreground min-h-[1rem] text-center max-w-[220px] truncate">
        {label || STATE_LABEL[state]}
      </span>
    </div>
  );
}