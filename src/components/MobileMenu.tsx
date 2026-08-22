import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Home,
  MessageCircle,
  TrendingUp,
  CloudSun,
  Sprout,
  Lightbulb,
  Users,
  FileText,
  Beef,
  Info,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';

export function MobileMenu() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const items = [
    { to: '/', label: t('home') || 'Home', icon: Home },
    { to: '/chat', label: t('assistant') || 'Assistant', icon: MessageCircle },
    { to: '/market-prices', label: t('marketPrices') || 'Market Prices', icon: TrendingUp },
    { to: '/weather', label: t('weatherForecast') || 'Weather', icon: CloudSun },
    { to: '/crop-center', label: t('cropCenter') || 'Crop Center', icon: Sprout },
    { to: '/smart-crop-planner', label: t('smartCropPlanner') || 'Smart Crop Planner', icon: Lightbulb },
    { to: '/animal-husbandry', label: t('animalHusbandry') || 'Animal Husbandry', icon: Beef },
    { to: '/schemes', label: t('schemes') || 'Schemes', icon: FileText },
    { to: '/community', label: t('community') || 'Community', icon: Users },
    { to: '/profile', label: t('profile') || 'Profile', icon: UserIcon },
    { to: '/about', label: t('about') || 'About', icon: Info },
    { to: '/privacy', label: t('privacyPolicy') || 'Privacy', icon: Shield },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full min-h-11 min-w-11 text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[86vw] max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('appName') || 'Gram AI'}</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 grid gap-1 pb-8" aria-label="Main menu">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/85 transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-[18px] w-[18px] text-primary" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
