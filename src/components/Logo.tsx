import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  'aria-label'?: string;
}

export function Logo({ className, 'aria-label': ariaLabel }: LogoProps) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={cn(
        'flex items-center gap-2 select-none transition-colors duration-300',
        isDarkMode ? 'text-white' : 'text-[#111827]',
        className
      )}
      aria-label={ariaLabel}
      role="img"
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Stem */}
        <path
          d="M20 35C20 35 20 28 20 24C20 18 17 14 12 11"
          stroke="#3D8B5D"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M20 24C20 24 23 18 28 15"
          stroke="#3D8B5D"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Left leaf */}
        <path
          d="M12 11C8 13 6 17 7 21C7 21 11 20 14 17C16 14 15 11 12 11Z"
          fill="#4CAF7A"
          stroke="#3D8B5D"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Right leaf */}
        <path
          d="M28 15C32 13 34 17 33 21C33 21 29 20 26 17C24 14 25 11 28 15Z"
          fill="#4CAF7A"
          stroke="#3D8B5D"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Soil line */}
        <path
          d="M14 35H26"
          stroke="#8D6E63"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="flex items-baseline gap-0.5">
        <span className="text-[1.35rem] font-bold tracking-tight leading-none">
          Gram
        </span>
        <span className="text-[1.35rem] font-extrabold tracking-tight leading-none">
          AI
        </span>
      </span>
    </div>
  );
}
