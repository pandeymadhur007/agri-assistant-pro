import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Logo } from '@/components/Logo';

const SUPPORT_EMAIL = 'gramaiofficial@gmail.com';

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-muted/40 text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Logo showTagline className="mb-3" aria-label={t('appName')} />
            <p className="text-sm text-muted-foreground leading-relaxed">{t('tagline')}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground/90">{t('quickActions')}</h3>
            <nav className="flex flex-col gap-2" aria-label={t('quickActions')}>
              <Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('startChat')}
              </Link>
              <Link to="/schemes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('schemes')}
              </Link>
              <Link to="/crop-center" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('cropGuidance')}
              </Link>
              <Link to="/market-prices" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('marketPrices')}
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground/90">{t('about')}</h3>
            <nav className="flex flex-col gap-2" aria-label={t('about')}>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('about')}
              </Link>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors break-all"
              >
                {t('contact')}: {SUPPORT_EMAIL}
              </a>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('privacyPolicy')}
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-xs text-muted-foreground">
          ⚠️ {t('aiDisclaimer')}
        </div>

        <div className="mt-6 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
          © {year} {t('appName')}. Made for Indian Farmers.
        </div>
      </div>
    </footer>
  );
}
