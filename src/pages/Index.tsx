import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Sprout,
  CloudSun,
  Camera,
  TrendingUp,
  Users,
  Lightbulb,
  HelpCircle,
  Brain,
  CheckCircle2,
  Beef,
  Landmark,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { WeatherWidget } from '@/components/WeatherWidget';
import { ClimateAlertBanner } from '@/components/ClimateAlertBanner';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageTransition, StaggerContainer, StaggerItem, FadeIn } from '@/components/PageTransition';
import { SEO } from '@/components/SEO';
import { FurrowDivider } from '@/components/FurrowDivider';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type QuickAction = {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
};

function QuickTile({ action }: { action: QuickAction }) {
  return (
    <Link to={action.to} className="block group h-full">
      <div
        className={cn(
          'h-full rounded-lg border border-clay/55 bg-card card-hover cursor-pointer relative overflow-hidden',
          'flex flex-col items-center justify-center text-center',
          'p-5 md:p-6 min-h-[160px] md:min-h-[172px] gap-3.5',
        )}
      >
        <action.icon className="h-6 w-6 text-foreground" strokeWidth={1.5} />
        <h3 className="font-display font-semibold text-[15px] leading-tight text-foreground">
          {action.title}
        </h3>
      </div>
    </Link>
  );
}

function CropGrowthIllustration() {
  return (
    <svg viewBox="0 0 120 48" className="w-full h-14 text-primary/50" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.g
          key={i}
          transform={`translate(${12 + i * 22}, 44)`}
          initial={{ opacity: 0, scaleY: 0.2 }}
          whileInView={{ opacity: 1, scaleY: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: i * 0.12, ease: 'easeOut' }}
          style={{ transformOrigin: 'bottom' }}
        >
          <line x1="0" y1="0" x2="0" y2={-(14 + i * 6)} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="0" cy={-(18 + i * 6)} rx="3.2" ry="6" fill="currentColor" opacity={0.45 + i * 0.11} />
          <ellipse cx="-4" cy={-(10 + i * 4)} rx="4" ry="2" fill="currentColor" opacity={0.25 + i * 0.08} />
        </motion.g>
      ))}
    </svg>
  );
}

function MandiChartIllustration() {
  const line = 'M0 40 Q20 35 35 28 T60 22 T85 14 T120 8';
  const points: Array<[number, number]> = [
    [12, 37], [35, 28], [60, 22], [85, 14], [112, 9],
  ];
  return (
    <svg viewBox="0 0 120 48" className="w-full h-14" aria-hidden>
      <motion.path
        d={line}
        fill="none"
        stroke="hsl(var(--clay))"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
      {points.map(([cx, cy], i) => (
        <motion.circle
          key={cx}
          cx={cx}
          cy={cy}
          r="2"
          fill="hsl(var(--clay))"
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.3, delay: 0.35 + i * 0.18 }}
        />
      ))}
    </svg>

  );
}

function WeatherIllustration() {
  const bars = [26, 34, 20, 40, 30, 44, 24];
  return (
    <div className="flex items-end justify-between gap-1.5 h-14" aria-hidden>
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-md bg-gradient-to-t from-sky-400/20 to-sky-400/70"
          initial={{ height: 4, opacity: 0 }}
          whileInView={{ height: h, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, delay: i * 0.07, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        initial={{ opacity: 0, rotate: -20 }}
        whileInView={{ opacity: 1, rotate: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="self-start"
      >
        <CloudSun className="h-6 w-6 text-amber-400/80" strokeWidth={1.5} />
      </motion.div>
    </div>
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
    { icon: MessageCircle, title: t('startChat'), description: 'Ask farming questions instantly', to: '/chat' },
    { icon: Camera, title: 'AI Crop Doctor', description: 'Scan a crop for instant diagnosis', to: '/scan' },
    { icon: TrendingUp, title: t('marketPrices'), description: 'Live mandi price updates', to: '/market-prices' },
    { icon: CloudSun, title: t('weatherForecast'), description: 'Weather forecasts and alerts', to: '/weather' },
    { icon: Beef, title: t('animalHusbandry'), description: 'Livestock care and management', to: '/animal-husbandry' },
    { icon: Landmark, title: t('schemes'), description: 'Farmer benefits and subsidies', to: '/schemes' },
    { icon: Lightbulb, title: t('smartCropPlanner') || 'Smart Crop Planner', description: 'Planning, schedules and reminders', to: '/smart-crop-planner' },
    { icon: Sprout, title: t('cropCenter'), description: 'Crop guides and recommendations', to: '/crop-center' },
    { icon: Users, title: t('community'), description: 'Connect with fellow farmers', to: '/community' },
  ];

  const howItWorks = [
    {
      stepIcon: HelpCircle,
      stepTitle: t('howStep1'),
      num: 1,
      featureIcon: Camera,
      featureTitle: 'AI Crop Doctor',
      featureDesc: 'Instant disease detection with treatment recommendations',
      illustration: <CropGrowthIllustration />,
      to: '/scan',
    },
    {
      stepIcon: Brain,
      stepTitle: t('howStep2'),
      num: 2,
      featureIcon: TrendingUp,
      featureTitle: 'Live Mandi Prices',
      featureDesc: 'Real-time market prices from mandis across India',
      illustration: <MandiChartIllustration />,
      to: '/market-prices',
    },
    {
      stepIcon: CheckCircle2,
      stepTitle: t('howStep3'),
      num: 3,
      featureIcon: CloudSun,
      featureTitle: 'Smart Weather',
      featureDesc: 'Farm-focused forecasts with crop advisory',
      illustration: <WeatherIllustration />,
      to: '/weather',
    },
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
                <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-clay/50 bg-card px-4 py-1.5 mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-clay" />
                  AI Companion for Every Farmer
                </span>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h1 className="text-5xl md:text-[4rem] font-bold mb-5 text-foreground leading-[1.05]">
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
                    <button className="inline-flex items-center gap-2.5 rounded-full btn-hero-primary px-6 py-3.5 text-sm font-semibold transition-colors duration-200">
                      <MessageCircle className="w-4 h-4" />
                      {t('startChat')}
                    </button>
                  </Link>
                  <Link to="/scan">
                    <button className="inline-flex items-center gap-2.5 rounded-full btn-hero-secondary px-6 py-3.5 text-sm font-semibold transition-colors duration-200">
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
                  <h2 className="font-display text-3xl md:text-[2.5rem] font-bold text-foreground">
                    {t('quickActions')}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tap any tile — every tool, one tap away.
                  </p>
                </div>
              </FadeIn>

              <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 gap-3.5 md:gap-5">
                {quickActions.map((action) => (
                  <StaggerItem key={action.to}>
                    <QuickTile action={action} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </section>

          <div className="px-4"><div className="container mx-auto max-w-5xl"><FurrowDivider /></div></div>

          {/* How It Works + Feature Highlights */}
          <section className="py-12 md:py-16 px-4">
            <div className="container mx-auto max-w-5xl">
              <FadeIn>
                <h2 className="font-display text-3xl md:text-[2.5rem] font-bold text-center mb-12 text-foreground">
                  {t('howItWorks')}
                </h2>
              </FadeIn>

              <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {howItWorks.map((step) => (
                  <StaggerItem key={step.num}>
                    <div className="flex flex-col h-full">
                      {/* Step header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="shrink-0 w-9 h-9 rounded-full border border-clay/60 text-clay flex items-center justify-center font-mono text-sm tabular-nums">
                          {step.num}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="eyebrow flex items-center gap-1.5">
                            <step.stepIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                            Step
                          </div>
                          <h3 className="font-display font-semibold text-[16px] text-foreground leading-snug truncate mt-0.5">
                            {step.stepTitle}
                          </h3>
                        </div>
                      </div>

                      {/* Feature card */}
                      <Link to={step.to} className="block group flex-1">
                        <div className="h-full rounded-lg border border-clay/50 bg-card card-hover p-6 flex flex-col">
                          <step.featureIcon className="w-6 h-6 text-foreground mb-4" strokeWidth={1.5} />
                          <h4 className="font-display font-semibold text-[18px] mb-1.5 text-foreground">
                            {step.featureTitle}
                          </h4>
                          <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">
                            {step.featureDesc}
                          </p>
                          <div className="mt-auto opacity-90 group-hover:opacity-100 transition-opacity">
                            {step.illustration}
                          </div>
                        </div>
                      </Link>
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
