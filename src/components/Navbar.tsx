import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, FileText, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, Language } from '@/lib/i18n';

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'home' },
    { path: '/assistant', icon: MessageCircle, label: 'assistant' },
    { path: '/market-prices', icon: FileText, label: 'marketPrices' },
    { path: '/calendar', icon: FileText, label: 'calendar' },
    { path: '/community', icon: FileText, label: 'community' },
    { path: '/schemes', icon: FileText, label: 'schemes' },
  ];

  const currentLang = LANGUAGES.find(l => l.code === language);

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
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t(item.label)}</span>
                </Button>
              </Link>
            );
          })}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{currentLang?.nativeName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LANGUAGES.map(lang => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as Language)}
                  className={language === lang.code ? 'bg-accent' : ''}
                >
                  {lang.nativeName} ({lang.name})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
