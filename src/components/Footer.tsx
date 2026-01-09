import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                ग्र
              </div>
              <span className="text-lg font-bold">{t('appName')}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t('tagline')}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('quickActions')}</h3>
            <div className="flex flex-col gap-2">
              <Link to="/assistant" className="text-sm text-muted-foreground hover:text-primary">
                {t('assistant')}
              </Link>
              <Link to="/schemes" className="text-sm text-muted-foreground hover:text-primary">
                {t('schemes')}
              </Link>
              <Link to="/crop-guidance" className="text-sm text-muted-foreground hover:text-primary">
                {t('cropGuidance')}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t('about')}</h3>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">{t('contact')}</span>
              <span className="text-sm text-muted-foreground">{t('disclaimer')}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
          © 2026 {t('appName')}. Made for Indian Farmers.
        </div>
      </div>
    </footer>
  );
}
