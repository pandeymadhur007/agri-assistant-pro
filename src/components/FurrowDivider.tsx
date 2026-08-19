import { cn } from '@/lib/utils';

interface FurrowDividerProps {
  className?: string;
}

/**
 * Signature motif — a hand-drawn furrow line, like a ploughed field row.
 * Same wave everywhere; used between major sections instead of hairlines.
 */
export function FurrowDivider({ className }: FurrowDividerProps) {
  return (
    <div className={cn('w-full select-none', className)} aria-hidden>
      <svg
        viewBox="0 0 1200 10"
        preserveAspectRatio="none"
        className="w-full h-[10px] furrow-line"
        fill="none"
      >
        <path
          d="M0 6 C 40 2, 80 9, 120 5 S 200 2, 240 6 S 320 9, 360 4 S 440 2, 480 6 S 560 9, 600 5 S 680 2, 720 6 S 800 9, 840 4 S 920 2, 960 6 S 1040 9, 1080 5 S 1160 2, 1200 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}