import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Globe, User as UserIcon, LogOut, LogIn, Moon } from 'lucide-react';
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
import { useTheme } from '@/contexts/ThemeContext';
import logoAsset from '@/assets/gram-ai-logo.png.asset.json';

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const currentLang = LANGUAGES.find(l => l.code === language);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const initial = (user?.user_metadata?.display_name || user?.email || 'U').toString().charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group" aria-label={t('appName')}>
          <img
            src={logoAsset.url}
            alt={t('appName')}
            width={140}
            height={40}
            className="h-9 w-auto object-contain transition-transform group-hover:scale-[1.03]"
          />
        </Link>

        <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground"
          onClick={toggleTheme}
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <Moon className="h-5 w-5" />
        </Button>
        {user && <NotificationBell />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-full text-foreground/80 px-3 sm:px-3.5">
              <Globe className="h-5 w-5" />
              <span className="text-sm font-medium hidden sm:inline">{currentLang?.nativeName}</span>
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
                <Button variant="default" size="icon" className="rounded-full font-semibold h-9 w-9">
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
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground" onClick={() => navigate('/login')} aria-label="Login">
              <LogIn className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
