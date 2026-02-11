import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, FileText, Sprout, Bug, CloudSun, Camera, TrendingUp, CalendarDays, Users, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { PageTransition, StaggerContainer, StaggerItem, FadeIn } from '@/components/PageTransition';
import { cn } from '@/lib/utils';

const Index = () => {
  const { t } = useLanguage();

  const quickActions = [
    { icon: MessageCircle, title: t('startChat'), to: '/chat', gradient: 'from-emerald-500 to-green-600' },
    { icon: Camera, title: t('scanCrop'), to: '/scan', gradient: 'from-teal-500 to-cyan-600' },
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <PageTransition>
        <main className="flex-1">
          {/* Hero Section */}
          <section className="hero-pattern hero-gradient py-16 px-4 relative overflow-hidden">
            {/* Decorative elements */}
            <motion.div 
              className="absolute top-10 left-10 text-6xl opacity-20"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              🌾
            </motion.div>
            <motion.div 
              className="absolute top-20 right-10 text-4xl opacity-15"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              🌻
            </motion.div>
            <motion.div 
              className="absolute bottom-10 left-1/4 text-3xl opacity-10"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              🌱
            </motion.div>
            
            <div className="container mx-auto text-center relative z-10">
              {/* Logo/Icon */}
              <FadeIn delay={0.1}>
                <div className="relative mb-8 inline-block">
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
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  <span className="gradient-text">{t('appName')}</span>
                </h1>
              </FadeIn>
              
              <FadeIn delay={0.3}>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
                  {t('tagline')}
                </p>
              </FadeIn>
              
              <FadeIn delay={0.4}>
                <Link to="/chat">
                  <motion.button 
                    className="group bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-10 py-5 rounded-2xl text-lg font-semibold shadow-xl shadow-primary/25"
                    whileHover={{ y: -4, boxShadow: '0 25px 50px -12px hsl(var(--primary) / 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <span className="flex items-center gap-3">
                      <MessageCircle className="w-6 h-6" />
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

          {/* Quick Actions Section */}
          <section className="py-12 px-4 section-pattern">
            <div className="container mx-auto">
              <FadeIn>
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                  {t('quickActions')}
                </h2>
              </FadeIn>
              
              <StaggerContainer className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {quickActions.map((action, index) => (
                  <StaggerItem key={action.to}>
                    <Link to={action.to}>
                      <motion.div
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      >
                        <Card className="h-full border-0 shadow-md hover:shadow-xl overflow-hidden group transition-shadow duration-300">
                          <CardContent className="p-4 flex flex-col items-center text-center gap-3">
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

          {/* Feature Highlights */}
          <section className="py-12 px-4 bg-gradient-to-b from-background to-secondary/30">
            <div className="container mx-auto">
              <StaggerContainer className="grid md:grid-cols-3 gap-6">
                {featureCards.map((feature, index) => (
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
    </div>
  );
};

export default Index;
