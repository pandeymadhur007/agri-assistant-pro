import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Globe, Home, Menu, MessageCircle, Camera, TrendingUp, CalendarDays, FileText, Users, CloudSun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, Language } from '@/lib/i18n';

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const currentLang = LANGUAGES.find(l => l.code === language);
  const [open, setOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t('home'), icon: Home },
    { to: '/chat', label: t('startChat'), icon: MessageCircle },
    { to: '/scan', label: t('scanCrop'), icon: Camera },
    { to: '/market-prices', label: t('marketPrices'), icon: TrendingUp },
    { to: '/calendar', label: t('calendar'), icon: CalendarDays },
    { to: '/weather', label: t('weatherForecast'), icon: CloudSun },
    { to: '/community', label: t('community'), icon: Users },
    { to: '/schemes', label: t('schemes'), icon: FileText },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
            ग्र
          </div>
          <span className="text-xl font-bold text-primary">{t('appName')}</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Desktop: Home button */}
          <Link to="/" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              <span>{t('home')}</span>
            </Button>
          </Link>

          {/* Language selector — always visible */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="gap-2 border-primary/50 text-primary font-medium px-3 sm:px-4">
                <Globe className="h-5 w-5" />
                <span className="text-sm font-semibold">{currentLang?.nativeName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {LANGUAGES.map(lang => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as Language)}
                  className={`cursor-pointer ${language === lang.code ? 'bg-accent font-semibold' : ''}`}
                >
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">({lang.name})</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile: hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-primary">{t('appName')}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium hover:bg-accent transition-colors"
                  >
                    <link.icon className="h-5 w-5 text-primary" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
