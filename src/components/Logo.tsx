import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  'aria-label'?: string;
  showTagline?: boolean;
  compact?: boolean;
}

function SproutMark({ isDark, className }: { isDark: boolean; className?: string }) {
  const leaf = isDark ? '#45D483' : '#27824D';
  const stem = isDark ? '#45D483' : '#347A4F';
  const soil = isDark ? '#8F6D45' : '#8F6746';

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <path d="M11 53.5C18.5 46.8 45.5 46.8 53 53.5" stroke={soil} strokeWidth="4" strokeLinecap="round" />
      <path d="M32 50V22" stroke={stem} strokeWidth="4" strokeLinecap="round" />
      <path d="M31.5 30.5C17.5 30.5 9.5 21.5 11.5 9.5C24 8.5 33.5 16 34.5 27.5L31.5 30.5Z" fill={leaf} />
      <path d="M32.5 30.5C46.5 30.5 54.5 21.5 52.5 9.5C40 8.5 30.5 16 29.5 27.5L32.5 30.5Z" fill={leaf} />
      <path d="M17.5 14.5L29.5 26.5M46.5 14.5L34.5 26.5" stroke={isDark ? '#0B2116' : '#EAF5ED'} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

export function Logo({ className, 'aria-label': ariaLabel, showTagline = false, compact = false }: LogoProps) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={cn('flex items-center gap-2.5 select-none', className)}
      aria-label={ariaLabel || 'Gram AI — Intelligence Through Growth'}
      role="img"
    >
      <SproutMark isDark={isDarkMode} className={compact ? 'h-8 w-8' : 'h-9 w-9'} />
      <div className="flex flex-col min-w-0">
        <div
          className={cn(
            'flex items-baseline leading-none tracking-tight',
            compact ? 'text-[17px]' : 'text-lg sm:text-xl',
          )}
        >
          <span
            className={cn(
              'font-semibold',
              isDarkMode ? 'text-zinc-100' : 'text-zinc-800',
            )}
          >
            Gram
          </span>
          <span
            className={cn(
              'font-semibold',
              isDarkMode ? 'text-emerald-400' : 'text-emerald-700',
            )}
          >
            AI
          </span>
        </div>
        {showTagline && (
          <span
            className={cn(
              'mt-1 uppercase tracking-[0.14em] text-muted-foreground font-normal',
              compact ? 'text-[7px]' : 'text-[8px] sm:text-[9px]',
            )}
          >
            Intelligence Through Growth
          </span>
        )}
      </div>
    </div>
  );
}
