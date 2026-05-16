import { Link } from 'react-router-dom';
import { MessageCircle, FileText, Sprout, CloudSun, Camera, TrendingUp, CalendarDays, Users, Lightbulb, HelpCircle, Brain, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { WeatherWidget } from '@/components/WeatherWidget';
import { ClimateAlertBanner } from '@/components/ClimateAlertBanner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition, StaggerContainer, StaggerItem, FadeIn } from '@/components/PageTransition';
import { SEO } from '@/components/SEO';

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

  const quickActions = [
    { icon: MessageCircle, title: t('startChat'), to: '/chat' },
    { icon: Sprout, title: t('cropCenter'), to: '/crop-center' },
    { emoji: '🐄', title: t('animalHusbandry'), to: '/animal-husbandry' },
    { icon: Lightbulb, title: t('smartRec'), to: '/recommendations' },
    { icon: TrendingUp, title: t('marketPrices'), to: '/market-prices' },
    { icon: CalendarDays, title: t('calendar'), to: '/calendar' },
    { icon: Users, title: t('community'), to: '/community' },
    { icon: CloudSun, title: t('weatherForecast'), to: '/weather' },
    { icon: FileText, title: t('schemes'), to: '/schemes' },
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
                <p className="text-sm md:text-base text-muted-foreground/80 mb-8 max-w-xl mx-auto">
                  {subTaglines[language] || subTaglines.en}
                </p>
              </FadeIn>

              <FadeIn delay={0.28}>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link to="/chat">
                    <button className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-medium shadow-soft-md hover:-translate-y-0.5 transition-all duration-200">
                      <MessageCircle className="w-4 h-4" />
                      {t('startChat')}
                    </button>
                  </Link>
                  <Link to="/scan">
                    <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card text-foreground px-5 py-3 text-sm font-medium hover:bg-muted transition-all duration-200">
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

          {/* Quick Actions Section */}
          <section className="py-14 px-4">
            <div className="container mx-auto max-w-5xl">
              <FadeIn>
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                      {t('quickActions')}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Everything you need, one tap away.</p>
                  </div>
                </div>
              </FadeIn>

              <StaggerContainer className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 items-stretch">
                {quickActions.map((action) => (
                  <StaggerItem key={action.to} className="h-full">
                    <Link to={action.to} className="block h-full">
                      <Card className="h-full card-hover cursor-pointer">
                        <CardContent className="h-full p-4 flex flex-col items-center justify-center text-center gap-3 min-h-[112px]">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            {'emoji' in action && action.emoji ? (
                              <span className="text-xl leading-none" aria-hidden>{action.emoji}</span>
                            ) : (
                              'icon' in action && action.icon ? <action.icon className="h-5 w-5" /> : null
                            )}
                          </div>
                          <h3 className="font-medium text-[13px] leading-tight text-foreground">{action.title}</h3>
                        </CardContent>
                      </Card>
                    </Link>
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
                    <div className="flex items-start gap-4 p-5 rounded-2xl border border-border/50 bg-card/60 hover:bg-card transition-colors">
                      <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm tabular-nums">
                        {step.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                          <step.icon className="w-4 h-4" />
                          <span className="text-[11px] uppercase tracking-wider font-medium">Step</span>
                        </div>
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
