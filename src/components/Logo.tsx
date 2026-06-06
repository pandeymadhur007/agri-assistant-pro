import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import logoLight from '@/assets/gram-ai-logo-light-v3.png.asset.json';
import logoDark from '@/assets/gram-ai-logo-dark-v2.png.asset.json';

interface LogoProps {
  className?: string;
  'aria-label'?: string;
}

export function Logo({ className, 'aria-label': ariaLabel }: LogoProps) {
  const { isDarkMode } = useTheme();
  const src = isDarkMode ? logoDark.url : logoLight.url;
  return (
    <img
      src={src}
      alt={ariaLabel || 'Gram AI'}
      className={cn('object-contain transition-opacity duration-300', className)}
    />
  );
}
