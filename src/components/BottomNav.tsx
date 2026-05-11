import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  MessageCircle,
  TrendingUp,
  MoreHorizontal,
  Camera,
  CalendarDays,
  CloudSun,
  Users,
  FileText,
  Sprout,
  Bug,
  Lightbulb,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const { t } = useLanguage();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = [
    { to: '/', label: t('home'), icon: Home },
    { to: '/chat', label: t('assistant') || 'Assistant', icon: MessageCircle },
    { to: '/market-prices', label: t('marketPrices'), icon: TrendingUp },
  ];

  const moreItems = [
    { to: '/crop-center', label: t('cropCenter'), icon: Sprout },
    { to: '/recommendations', label: t('smartRec'), icon: Lightbulb },
    { to: '/calendar', label: t('calendar'), icon: CalendarDays },
    { to: '/weather', label: t('weatherForecast'), icon: CloudSun },
    { to: '/community', label: t('community'), icon: Users },
    { to: '/schemes', label: t('schemes'), icon: FileText },
  ];

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-3 left-3 right-3 z-50 rounded-2xl border border-border/70 bg-background/85 backdrop-blur-xl shadow-soft-lg"
        aria-label="Bottom navigation"
      >
        <ul className="grid grid-cols-4 p-1.5 gap-1">
          {primary.map((item) => {
            const active = isActive(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-medium transition-all duration-200',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className={cn('h-[18px] w-[18px]', active && 'stroke-[2.2]')} />
                  <span className="leading-none truncate max-w-[70px]">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="w-full flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  aria-label="More"
                >
                  <MoreHorizontal className="h-[18px] w-[18px]" />
                  <span className="leading-none">More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>More</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-3 gap-3 mt-4 pb-6">
                  {moreItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card p-3 text-center hover:bg-muted transition-all duration-200 shadow-soft"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium leading-tight">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
      {/* Spacer so content isn't hidden behind floating bar on mobile */}
      <div className="md:hidden h-20" aria-hidden />
    </>
  );
}
