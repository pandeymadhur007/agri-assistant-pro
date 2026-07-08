import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import lightLogo from '@/assets/gram-ai-logo-light-v4.png.asset.json';
import darkLogo from '@/assets/gram-ai-logo-dark-v3.png.asset.json';

interface LogoProps {
  className?: string;
  'aria-label'?: string;
  showTagline?: boolean;
  compact?: boolean;
}

export function Logo({ className, 'aria-label': ariaLabel, showTagline = false, compact = false }: LogoProps) {
  const { isDarkMode } = useTheme();
  const src = isDarkMode ? darkLogo.url : lightLogo.url;

  const height = showTagline
    ? (compact ? 'h-11' : 'h-14 sm:h-16')
    : (compact ? 'h-9' : 'h-10 sm:h-11');

  return (
    <div
      className={cn('flex items-center select-none', className)}
      aria-label={ariaLabel || 'Gram AI — Intelligence Through Growth'}
      role="img"
    >
      <img
        src={src}
        alt="Gram AI — Intelligence Through Growth"
        className={cn(height, 'w-auto object-contain')}
        draggable={false}
      />
    </div>
  );
}