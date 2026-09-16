import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Sprout,
  CloudSun,
  Camera,
  TrendingUp,
  Users,
  Beef,
  Landmark,
  Tractor,
  ClipboardCheck,
  ListChecks,
  ScanLine,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { WeatherWidget } from '@/components/WeatherWidget';
import { ClimateAlertBanner } from '@/components/ClimateAlertBanner';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageTransition, StaggerContainer, StaggerItem, FadeIn } from '@/components/PageTransition';
import { SEO } from '@/components/SEO';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type TileVariant = 'primary' | 'secondary' | 'neutral' | 'weather' | 'schemes' | 'community';

type QuickAction = {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  variant: TileVariant;
};

const tileVariantClass: Record<TileVariant, string> = {
  primary: 'tile-primary',
  secondary: 'tile-secondary',
  neutral: 'tile-neutral',
  weather: 'tile-neutral',
  schemes: 'tile-schemes',
  community: 'tile-community',
};

const iconVariantClass: Record<TileVariant, string> = {
  primary: 'tile-icon-primary',
  secondary: 'tile-icon-secondary',
  neutral: 'tile-icon-neutral',
  weather: 'tile-icon-weather',
  schemes: 'tile-icon-neutral',
  community: 'tile-icon-neutral',
};

function QuickTile({ action }: { action: QuickAction }) {
  const isPrimary = action.variant === 'primary';
  const isSecondary = action.variant === 'secondary';
  const isGradient = isPrimary || isSecondary;

  const titleColor = isPrimary
    ? 'text-white'
    : isSecondary
      ? 'text-white'
      : 'text-foreground';

  return (
    <Link to={action.to} className="block group h-full">
      <div
        className={cn(
          'h-full rounded-[20px] border card-hover cursor-pointer relative overflow-hidden',
          'flex flex-col items-center justify-center text-center',
          'p-5 md:p-6 min-h-[168px] md:min-h-[180px] gap-4',
          tileVariantClass[action.variant],
        )}
      >
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center',
            'transition-transform duration-300 ease-out',
            'group-hover:-translate-y-0.5 group-hover:scale-[1.05]',
            iconVariantClass[action.variant],
          )}
        >
          <action.icon className="h-[22px] w-[22px]" strokeWidth={1.5} />
        </div>
        <div className="space-y-1.5">
          <h3 className={cn('font-sans font-medium text-[15px] leading-tight tracking-tight', titleColor)}>
            {action.title}
          </h3>
        </div>
        {action.variant === 'schemes' && (
          <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-secondary/80 dark:text-primary/80">
            Explore →
          </span>
        )}
      </div>
    </Link>
  );
}

const Index = () => {
  const { t, language } = useLanguage();

  const subTaglines: Record<string, string> = {
    en: "Every farmer's digital companion",
    hi: 'किसान का डिजिटल साथी',
    mr: 'शेतकऱ्याचा डिजिटल साथी',
    te: 'రైతు యొక్క డిజిటల్ సహచరుడు',
    ta: 'விவசாயியின் டிஜிட்டல் துணை',
    bn: 'কৃষকের ডিজিটাল সঙ্গী',
  };

  const quickActions: QuickAction[] = [
    { icon: MessageCircle, title: t('startChat'), description: 'Ask farming questions instantly', to: '/chat', variant: 'neutral' },
    { icon: TrendingUp, title: t('marketPrices'), description: 'Live mandi price updates', to: '/market-prices', variant: 'secondary' },
    { icon: CloudSun, title: t('weatherForecast'), description: 'Weather forecasts and alerts', to: '/weather', variant: 'weather' },
    { icon: Beef, title: t('animalHusbandry'), description: 'Livestock care and management', to: '/animal-husbandry', variant: 'neutral' },
    { icon: Landmark, title: t('schemes'), description: 'Farmer benefits and subsidies', to: '/schemes', variant: 'schemes' },
    { icon: Tractor, title: t('smartCropPlanner') || 'My Farm', description: 'Your personalized daily farming plan', to: '/my-farm', variant: 'secondary' },
    { icon: Sprout, title: t('cropCenter'), description: 'Crop guides and recommendations', to: '/crop-center', variant: 'primary' },
    { icon: Users, title: t('community'), description: 'Connect with fellow farmers', to: '/community', variant: 'community' },
  ];

  const howToUse = [
    { icon: Tractor, label: 'Set up My Farm' },
    { icon: ClipboardCheck, label: 'Get personalized plan' },
    { icon: ListChecks, label: "Follow Today’s Priorities" },
    { icon: MessageCircle, label: 'Ask Gram AI' },
    { icon: ScanLine, label: 'Scan crops' },
    { icon: Sprout, label: 'Track your farm' },
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
          {/* Hero */}
          <section className="hero-gradient pt-12 pb-10 md:pt-20 md:pb-14 px-4 relative overflow-hidden">
            <div className="container mx-auto max-w-3xl text-center relative z-10">
              <FadeIn delay={0.05}>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm px-4 py-1.5 text-xs font-normal text-muted-foreground mb-8 shadow-soft tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  AI Companion for Every Farmer
                </span>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h1 className="text-4xl md:text-[3.25rem] font-medium mb-5 text-foreground leading-[1.1]">
                  {t('appName')}
                </h1>
              </FadeIn>

              <FadeIn delay={0.16}>
                <p className="text-lg md:text-xl text-foreground/80 mb-2 max-w-lg mx-auto leading-relaxed font-normal">
                  {t('tagline')}
                </p>
              </FadeIn>

              <FadeIn delay={0.2}>
                <p className="text-sm md:text-base text-muted-foreground mb-10 max-w-md mx-auto">
                  {subTaglines[language] || subTaglines.en}
                </p>
              </FadeIn>

              <FadeIn delay={0.26}>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link to="/chat">
                    <button className="inline-flex items-center gap-2.5 rounded-2xl btn-hero-primary px-6 py-3.5 text-sm font-medium transition-all duration-200">
                      <MessageCircle className="w-4 h-4" />
                      {t('startChat')}
                    </button>
                  </Link>
                  <Link to="/scan">
                    <button className="inline-flex items-center gap-2.5 rounded-2xl btn-hero-secondary px-6 py-3.5 text-sm font-medium transition-all duration-200">
                      <Camera className="w-4 h-4" />
                      Scan a crop
                    </button>
                  </Link>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* Weather */}
          <section className="px-4 -mt-2 relative z-20">
            <div className="container mx-auto max-w-3xl">
              <div className="mb-3"><ClimateAlertBanner /></div>
              <WeatherWidget />
            </div>
          </section>

          {/* Quick Actions */}
          <section className="py-12 md:py-16 px-4">
            <div className="container mx-auto max-w-5xl">
              <FadeIn>
                <div className="text-center mb-10">
                  <h2 className="font-display text-3xl md:text-[2rem] font-medium text-foreground tracking-tight">
                    {t('quickActions')}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tap any tile — every tool, one tap away.
                  </p>
                </div>
              </FadeIn>

              <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-5">
                {quickActions.map((action) => (
                  <StaggerItem key={action.to}>
                    <QuickTile action={action} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </section>

          {/* How to use */}
          <section className="py-12 md:py-16 px-4 border-t border-border/50">
            <div className="container mx-auto max-w-4xl">
              <FadeIn>
                <h2 className="font-display text-3xl md:text-[2rem] font-medium text-center mb-12 text-foreground tracking-tight">
                  How to Use Gram AI
                </h2>
              </FadeIn>

              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-7">
                {howToUse.map((step, index) => (
                  <StaggerItem key={step.label}>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 shrink-0 rounded-full border border-primary/20 bg-primary/10 text-primary flex items-center justify-center">
                        <step.icon className="w-5 h-5" strokeWidth={1.6} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-muted-foreground tabular-nums">0{index + 1}</span>
                        <p className="font-medium text-foreground leading-snug">{step.label}</p>
                      </div>
                    </div>
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
