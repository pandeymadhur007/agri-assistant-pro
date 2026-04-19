import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
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
      </div>
    </nav>
  );
}
