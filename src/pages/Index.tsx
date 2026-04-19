import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, FileText, Sprout, Bug, CloudSun, Camera, TrendingUp, CalendarDays, Users, Sparkles, Lightbulb, HelpCircle, Brain, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { WeatherWidget } from '@/components/WeatherWidget';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition, StaggerContainer, StaggerItem, FadeIn } from '@/components/PageTransition';
import { cn } from '@/lib/utils';

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
    { icon: MessageCircle, title: t('startChat'), to: '/chat', gradient: 'from-emerald-500 to-green-600' },
    { icon: Camera, title: t('scanCrop'), to: '/scan', gradient: 'from-teal-500 to-cyan-600' },
    { icon: Lightbulb, title: t('smartRec'), to: '/recommendations', gradient: 'from-yellow-500 to-amber-600' },
    { icon: TrendingUp, title: t('marketPrices'), to: '/market-prices', gradient: 'from-orange-500 to-amber-600' },
    { icon: CalendarDays, title: t('calendar'), to: '/calendar', gradient: 'from-blue-500 to-indigo-600' },
    { icon: Users, title: t('community'), to: '/community', gradient: 'from-purple-500 to-violet-600' },
    { icon: CloudSun, title: t('weatherForecast'), to: '/weather', gradient: 'from-sky-500 to-blue-600' },
    { icon: Sprout, title: t('cropGuidance'), to: '/crop-guidance', gradient: 'from-lime-500 to-green-600' },
    { icon: Bug, title: t('pestDisease'), to: '/pest-disease', gradient: 'from-rose-500 to-red-600' },
    { icon: FileText, title: t('schemes'), to: '/schemes', gradient: 'from-fuchsia-500 to-purple-600' },
  ];

  const featureCards = [
    { icon: Camera, title: 'AI Crop Doctor', desc: 'Instant disease detection with treatment recommendations', gradient: 'from-emerald-400 to-green-600', to: '/scan' },
    { icon: TrendingUp, title: 'Live Mandi Prices', desc: 'Real-time market prices from mandis across India', gradient: 'from-orange-400 to-amber-600', to: '/market-prices' },
    { icon: CloudSun, title: 'Smart Weather', desc: 'Farm-focused forecasts with crop advisory', gradient: 'from-blue-400 to-indigo-600', to: '/weather' },
  ];

  const heroBadges = ['AI Powered', 'Free', '6 Languages'];

  const howItWorks = [
    { icon: HelpCircle, title: t('howStep1'), num: 1 },
    { icon: Brain, title: t('howStep2'), num: 2 },
    { icon: CheckCircle2, title: t('howStep3'), num: 3 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <PageTransition>
        <main className="flex-1">
          {/* Hero Section */}
          <section className="hero-pattern hero-gradient py-16 px-4 relative overflow-hidden">
            {/* Subtle decorative wheat — consistent size + gentle opacity */}
            <motion.div
              className="absolute top-12 left-6 md:left-16 text-5xl pointer-events-none select-none"
              style={{ opacity: 0.15 }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            >
              🌾
            </motion.div>
            <motion.div
              className="absolute top-12 right-6 md:right-16 text-5xl pointer-events-none select-none"
              style={{ opacity: 0.15 }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              aria-hidden
            >
              🌾
            </motion.div>

            <div className="container mx-auto text-center relative z-10">
              {/* Logo/Icon */}
              <FadeIn delay={0.1}>
                <div className="relative mb-6 inline-block">
                  <motion.div
                    className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30"
                    initial={{ rotate: 3 }}
                    whileHover={{ rotate: 0, scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <span className="text-5xl">🌾</span>
                  </motion.div>
                  <motion.div
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg"
                    initial={{ rotate: -12 }}
                    animate={{ rotate: [-12, -8, -12] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Sparkles className="w-5 h-5 text-accent-foreground" />
                  </motion.div>
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <h1 className="text-4xl md:text-6xl font-bold mb-3">
                  <span className="gradient-text">{t('appName')}</span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.25}>
                <p className="text-lg md:text-xl text-foreground/80 font-medium mb-2 max-w-lg mx-auto">
                  {t('tagline')}
                </p>
              </FadeIn>

              <FadeIn delay={0.3}>
                <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-lg mx-auto">
                  {subTaglines[language] || subTaglines.en}
                </p>
              </FadeIn>

              {/* Badge pills */}
              <FadeIn delay={0.35}>
                <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                  {heroBadges.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {b}
                    </span>
                  ))}
                </div>
              </FadeIn>

              <FadeIn delay={0.4}>
                <Link to="/chat" className="block max-w-[280px] mx-auto">
                  <motion.button
                    className="w-full group bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-6 py-4 rounded-2xl text-base md:text-lg font-semibold shadow-xl shadow-primary/25"
                    whileHover={{ y: -4, boxShadow: '0 25px 50px -12px hsl(var(--primary) / 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <MessageCircle className="w-5 h-5" />
                      {t('startChat')}
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </span>
                  </motion.button>
                </Link>
              </FadeIn>
            </div>
          </section>

          {/* Stats strip */}
          <section className="px-4 -mt-4 relative z-20">
            <div className="container mx-auto max-w-3xl">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-sm font-medium text-primary">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> 10,000+ Farmers Helped
                  </span>
                  <span className="opacity-40">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> 6 Languages
                  </span>
                  <span className="opacity-40">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> 100% Free
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Weather Alert Widget */}
          <section className="px-4 mt-6 relative z-20">
            <div className="container mx-auto max-w-3xl">
              <WeatherWidget />
            </div>
          </section>

          {/* Quick Actions Section */}
          <section className="py-12 px-4 section-pattern">
            <div className="container mx-auto">
              <FadeIn>
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                  {t('quickActions')}
                </h2>
              </FadeIn>

              <StaggerContainer className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 items-stretch">
                {quickActions.map((action) => (
                  <StaggerItem key={action.to} className="h-full">
                    <Link to={action.to} className="block h-full">
                      <motion.div
                        className="h-full"
                        whileHover={{ y: -4, boxShadow: '0 10px 24px -10px hsl(var(--primary) / 0.25)' }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <Card className="h-full min-h-[140px] border-0 shadow-md hover:shadow-xl overflow-hidden group transition-shadow duration-300">
                          <CardContent className="h-full p-5 flex flex-col items-center justify-center text-center gap-3">
                            <motion.div
                              className={cn(
                                'w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg',
                                action.gradient
                              )}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            >
                              <action.icon className="h-7 w-7 text-white" />
                            </motion.div>
                            <h3 className="font-semibold text-sm leading-tight">{action.title}</h3>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-12 px-4 bg-background">
            <div className="container mx-auto max-w-4xl">
              <FadeIn>
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
                  {t('howItWorks')}
                </h2>
              </FadeIn>
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {howItWorks.map((step) => (
                  <StaggerItem key={step.num}>
                    <div className="relative h-full rounded-2xl border border-border bg-card p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow">
                        {step.num}
                      </div>
                      <div className="mt-3 mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <step.icon className="w-7 h-7" />
                      </div>
                      <h3 className="font-semibold text-base">{step.title}</h3>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </section>

          {/* Feature Highlights */}
          <section className="py-12 px-4 bg-gradient-to-b from-background to-secondary/30">
            <div className="container mx-auto">
              <StaggerContainer className="grid md:grid-cols-3 gap-6">
                {featureCards.map((feature) => (
                  <StaggerItem key={feature.title}>
                    <Link to={feature.to}>
                      <motion.div
                        whileHover={{ y: -6 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        <Card className="border-0 shadow-lg card-gradient h-full cursor-pointer">
                          <CardContent className="p-6 text-center">
                            <motion.div
                              className={cn(
                                'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg bg-gradient-to-br',
                                feature.gradient
                              )}
                              whileHover={{ scale: 1.1, rotate: -5 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            >
                              <feature.icon className="w-8 h-8 text-white" />
                            </motion.div>
                            <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground text-sm">{feature.desc}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
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
