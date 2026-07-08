import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  'aria-label'?: string;
  showTagline?: boolean;
  compact?: boolean;
}

function SproutMark({ isDark, className }: { isDark: boolean; className?: string }) {
  const leafStroke = isDark ? '#4ADE80' : '#5A9E72';
  const leafFill = isDark ? 'transparent' : '#8FBC9A';
  const stemStroke = isDark ? '#4ADE80' : '#4A8B62';
  const soilFill = isDark ? '#8B6914' : '#9B7653';

  return (
    <svg
      viewBox="0 0 44 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', isDark && 'drop-shadow-[0_0_8px_rgba(74,222,128,0.35)]', className)}
      aria-hidden
    >
      <ellipse cx="22" cy="43" rx="13" ry="3.5" fill={soilFill} opacity={0.85} />
      <path
        d="M9 41C14 37 30 37 35 41"
        stroke={soilFill}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M22 39C22 28 22 20 22 12"
        stroke={stemStroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 16C16 10 10 12 8 18C13 20 18 18 22 16Z"
        fill={leafFill}
        stroke={leafStroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M22 16C28 10 34 12 36 18C31 20 26 18 22 16Z"
        fill={leafFill}
        stroke={leafStroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
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
              'font-medium',
              isDarkMode ? 'text-zinc-300' : 'text-zinc-700',
            )}
          >
            Gram
          </span>
          <span
            className={cn(
              'font-medium',
              isDarkMode
                ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.45)]'
                : 'text-emerald-700',
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
