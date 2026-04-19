import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground text-primary font-bold text-sm">
                ग्र
              </div>
              <span className="text-lg font-bold">{t('appName')}</span>
            </div>
            <p className="text-sm opacity-90">{t('tagline')}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">{t('quickActions')}</h3>
            <div className="flex flex-col gap-2">
              <Link to="/chat" className="text-sm opacity-90 hover:opacity-100 hover:underline">
                {t('startChat')}
              </Link>
              <Link to="/schemes" className="text-sm opacity-90 hover:opacity-100 hover:underline">
                {t('schemes')}
              </Link>
              <Link to="/crop-guidance" className="text-sm opacity-90 hover:opacity-100 hover:underline">
                {t('cropGuidance')}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">{t('about')}</h3>
            <div className="flex flex-col gap-2">
              <Link to="/about" className="text-sm opacity-90 hover:opacity-100 hover:underline">
                {t('about')}
              </Link>
              <Link to="/contact" className="text-sm opacity-90 hover:opacity-100 hover:underline">
                {t('contact')}
              </Link>
              <Link to="/privacy" className="text-sm opacity-90 hover:opacity-100 hover:underline">
                {t('privacyPolicy')}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-md border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3 text-xs">
          ⚠️ {t('aiDisclaimer')}
        </div>

        <div className="mt-6 border-t border-primary-foreground/20 pt-4 text-center text-sm opacity-90">
          © 2026 {t('appName')}. Made for Indian Farmers.
        </div>
      </div>
    </footer>
  );
}
