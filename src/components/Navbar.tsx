import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Globe, User as UserIcon, LogOut, LogIn, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, Language } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from '@/components/NotificationBell';

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const currentLang = LANGUAGES.find(l => l.code === language);
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
      return;
    }

    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
      return;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
    setIsDarkMode(prefersDark);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleThemeToggle = () => {
    const nextThemeIsDark = !isDarkMode;
    document.documentElement.classList.toggle('dark', nextThemeIsDark);
    localStorage.setItem('theme', nextThemeIsDark ? 'dark' : 'light');
    setIsDarkMode(nextThemeIsDark);
  };

  const initial = (user?.user_metadata?.display_name || user?.email || 'U').toString().charAt(0).toUpperCase();

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
        {user && <NotificationBell />}
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-primary/50 text-primary"
          onClick={handleThemeToggle}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="default" className="gap-2 border-primary/50 text-primary font-medium px-3 sm:px-4">
              <Globe className="h-5 w-5" />
              <span className="text-sm font-semibold hidden sm:inline">{currentLang?.nativeName}</span>
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

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full border-primary/50 bg-primary text-primary-foreground font-semibold">
                  {initial}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  <UserIcon className="h-4 w-4 mr-2" /> {language === 'hi' ? 'प्रोफ़ाइल' : 'Profile'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> {language === 'hi' ? 'लॉगआउट' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="icon" className="rounded-full border-primary/50 text-primary" onClick={() => navigate('/login')} aria-label="Login">
              <LogIn className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
