import { Link } from 'react-router-dom';
import { MessageCircle, FileText, Sprout, CloudSun, Camera, TrendingUp, Users, Lightbulb, HelpCircle, Brain, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { WeatherWidget } from '@/components/WeatherWidget';
import { ClimateAlertBanner } from '@/components/ClimateAlertBanner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition, StaggerContainer, StaggerItem, FadeIn } from '@/components/PageTransition';
import { SEO } from '@/components/SEO';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type QuickAction = {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  subtitle?: string;
  to: string;
  variant?: 'neutral' | 'mint' | 'ocean' | 'teal' | 'schemes';
};

function QuickTile({ action }: { action: QuickAction }) {
  const variant = action.variant || 'neutral';
  const tileClass =
    variant === 'mint'
      ? 'bg-gradient-to-br from-emerald-100/80 to-teal-50/60 dark:from-emerald-900/30 dark:to-teal-900/20 border-emerald-300/60 dark:border-emerald-500/30 shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_8px_30px_-12px_hsl(var(--primary)/0.35)]'
      : variant === 'ocean'
      ? 'bg-gradient-to-r from-[#1e3a8a] via-[#0e7490] to-[#15803d] text-white border-transparent'
      : variant === 'teal'
      ? 'bg-gradient-to-r from-teal-400 to-blue-500 text-white border-transparent'
      : variant === 'schemes'
      ? 'bg-card border-border'
      : 'bg-card border-border';
  const titleColor = variant === 'ocean' || variant === 'teal' ? 'text-white' : 'text-foreground';
  const subColor = variant === 'ocean' || variant === 'teal' ? 'text-white/80' : 'text-muted-foreground';
  const iconWrap =
    variant === 'ocean' || variant === 'teal'
      ? 'bg-white/15 ring-1 ring-white/25 text-white'
      : variant === 'mint'
      ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-700 dark:text-emerald-300'
      : 'bg-primary/10 ring-1 ring-primary/15 text-primary';
  return (
    <Link to={action.to} className="block group h-full">
      <Card className={cn('h-full card-hover cursor-pointer relative overflow-hidden rounded-2xl border transition-all duration-300', tileClass)}>
        <CardContent className="h-full p-5 flex flex-col items-center justify-center text-center gap-2.5 min-h-[140px]">
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.06]', iconWrap)}>
            {action.emoji ? (
              <span className="text-xl leading-none" aria-hidden>{action.emoji}</span>
            ) : action.icon ? (
              <action.icon className="h-5 w-5" strokeWidth={1.6} />
            ) : null}
          </div>
          <h3 className={cn('font-semibold text-[14px] leading-tight tracking-tight', titleColor)}>{action.title}</h3>
          {action.subtitle && (
            <p className={cn('text-[11px] leading-snug max-w-[16ch]', subColor)}>{action.subtitle}</p>
          )}
          {action.variant === 'schemes' && (
            <span className="mt-1 text-[10px] uppercase tracking-[0.18em] font-semibold text-primary">Explore →</span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

const Index = () => {
  const { t, language } = useLanguage();

  // Localized sub-tagline (one strong line per language)
  const subTaglines: Record<string, string> = {
    en: "Every farmer's digital companion",
    hi: 'किसान का डिजिटल साथी',
    mr: 'शेतकऱ्याचा डिजिटल साथी',
    te: 'రైతు యొక్క డిజిటల్ సహచరుడు',
    ta: 'விவசாயியின் டிஜிட்டல் துணை',
    bn: 'কৃষকের ডিজিটাল সঙ্গী',
  };

  const quickActions: QuickAction[] = [
    { icon: MessageCircle, title: t('startChat'), subtitle: 'Ask the AI anything', to: '/chat', variant: 'neutral' },
    { icon: Sprout, title: t('cropCenter'), subtitle: 'Care, scan & guidance', to: '/crop-center', variant: 'mint' },
    { emoji: '🐄', title: t('animalHusbandry'), subtitle: 'Livestock health & feed', to: '/animal-husbandry', variant: 'neutral' },
    { icon: Lightbulb, title: t('smartCropPlanner') || 'Smart Crop Planner', subtitle: 'Sow, irrigate, harvest', to: '/smart-crop-planner', variant: 'ocean' },
    { icon: TrendingUp, title: t('marketPrices'), subtitle: 'Live mandi rates', to: '/market-prices', variant: 'teal' },
    { icon: CloudSun, title: t('weatherForecast'), subtitle: 'Farm-focused forecast', to: '/weather', variant: 'neutral' },
    { icon: FileText, title: t('schemes'), subtitle: 'Govt benefits for you', to: '/schemes', variant: 'schemes' },
    { icon: Users, title: t('community'), subtitle: 'Connect with farmers', to: '/community', variant: 'neutral' },
  ];

  const featureCards = [
    { icon: Camera, title: 'AI Crop Doctor', desc: 'Instant disease detection with treatment recommendations', to: '/scan' },
    { icon: TrendingUp, title: 'Live Mandi Prices', desc: 'Real-time market prices from mandis across India', to: '/market-prices' },
    { icon: CloudSun, title: 'Smart Weather', desc: 'Farm-focused forecasts with crop advisory', to: '/weather' },
  ];

  const howItWorks = [
    { icon: HelpCircle, title: t('howStep1'), num: 1 },
    { icon: Brain, title: t('howStep2'), num: 2 },
    { icon: CheckCircle2, title: t('howStep3'), num: 3 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Gram AI — AI Farming Assistant for Indian Farmers"
        description="Gram AI helps Indian farmers with crop disease scans, live mandi prices, weather, schemes & voice support in 6 languages."
        path="/"
      />
      <Navbar />
      <PageTransition>
        <main className="flex-1">
          {/* Hero Section — calm, editorial */}
          <section className="hero-gradient pt-16 pb-12 md:pt-24 md:pb-16 px-4 relative overflow-hidden">
            <div className="container mx-auto max-w-3xl text-center relative z-10">
              <FadeIn delay={0.05}>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 backdrop-blur px-3 py-1 text-xs font-medium text-muted-foreground mb-6 shadow-soft">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  AI companion for every farmer
                </span>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground">
                  {t('appName')}
                </h1>
              </FadeIn>

              <FadeIn delay={0.18}>
                <p className="text-base md:text-lg text-muted-foreground mb-2 max-w-xl mx-auto leading-relaxed">
                  {t('tagline')}
                </p>
              </FadeIn>

              <FadeIn delay={0.22}>
                <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-xl mx-auto">
                  {subTaglines[language] || subTaglines.en}
                </p>
              </FadeIn>

              <FadeIn delay={0.28}>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link to="/chat">
                    <button className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-soft-md hover:-translate-y-0.5 transition-all duration-200">
                      <MessageCircle className="w-4 h-4" />
                      {t('startChat')}
                    </button>
                  </Link>
                  <Link to="/scan">
                    <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card text-foreground px-5 py-3 text-sm font-semibold hover:bg-muted transition-all duration-200">
                      <Camera className="w-4 h-4" />
                      Scan a crop
                    </button>
                  </Link>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* Weather Alert Widget */}
          <section className="px-4 mt-2 relative z-20">
            <div className="container mx-auto max-w-3xl">
              <div className="mb-3"><ClimateAlertBanner /></div>
              <WeatherWidget />
            </div>
          </section>

          {/* Quick Actions — centered pyramid (4 / 3 / 2) on desktop, 2-col grid on mobile */}
          <section className="py-14 px-4">
            <div className="container mx-auto max-w-5xl">
              <FadeIn>
                <div className="text-center mb-8">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    {t('quickActions')}
                  </h2>
                  <p className="text-sm font-semibold text-muted-foreground mt-1.5">
                    Tap any tile — every tool, one tap away.
                  </p>
                </div>
              </FadeIn>

              {/* Mobile: clean 2-col grid */}
              <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:hidden">
                {quickActions.map((action) => (
                  <StaggerItem key={action.to}>
                    <QuickTile action={action} />
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Desktop: 4-column grid */}
              <StaggerContainer className="hidden md:grid grid-cols-4 gap-5">
                {quickActions.map((action) => (
                  <StaggerItem key={action.to}>
                    <QuickTile action={action} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </section>

          {/* How It Works — minimal inline rhythm */}
          <section className="py-14 px-4">
            <div className="container mx-auto max-w-4xl">
              <FadeIn>
                <h2 className="text-xl md:text-2xl font-semibold text-center mb-10 text-foreground">
                  {t('howItWorks')}
                </h2>
              </FadeIn>
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {howItWorks.map((step) => (
                  <StaggerItem key={step.num}>
                <div className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card/60 hover:bg-card transition-colors">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-base tabular-nums">
                        {step.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[15px] text-foreground leading-snug">{step.title}</h3>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </section>

          {/* Feature Highlights */}
          <section className="py-14 px-4">
            <div className="container mx-auto max-w-5xl">
              <StaggerContainer className="grid md:grid-cols-3 gap-6">
                {featureCards.map((feature) => (
                  <StaggerItem key={feature.title}>
                    <Link to={feature.to}>
                      <Card className="h-full card-hover cursor-pointer">
                        <CardContent className="p-6">
                          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                            <feature.icon className="w-5 h-5" />
                          </div>
                          <h3 className="font-semibold text-[16px] mb-1.5 text-foreground tracking-tight">{feature.title}</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </section>
        </main>
      </PageTransition>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
