import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/60 bg-muted/40 text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20c0-5 3-9 8-10-1 5-4 9-8 10z" />
                  <path d="M12 20c0-4-2-8-7-9 1 4 3 8 7 9z" />
                  <path d="M12 20V12" />
                </svg>
              </span>
              <span className="text-base font-semibold tracking-tight">{t('appName')}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('tagline')}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground/90">{t('quickActions')}</h3>
            <div className="flex flex-col gap-2">
              <Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('startChat')}
              </Link>
              <Link to="/schemes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('schemes')}
              </Link>
              <Link to="/crop-guidance" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('cropGuidance')}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground/90">{t('about')}</h3>
            <div className="flex flex-col gap-2">
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('about')}
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('contact')}
              </Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('privacyPolicy')}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-xs text-muted-foreground">
          ⚠️ {t('aiDisclaimer')}
        </div>

        <div className="mt-6 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
          © 2026 {t('appName')}. Made for Indian Farmers.
        </div>
      </div>
    </footer>
  );
}
