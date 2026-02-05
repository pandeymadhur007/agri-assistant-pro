import { Link } from 'react-router-dom';
import { MessageCircle, FileText, Sprout, Bug, CloudSun, Camera, TrendingUp, CalendarDays, Users, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="hero-pattern hero-gradient py-16 px-4 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>🌾</div>
          <div className="absolute top-20 right-10 text-4xl opacity-15 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>🌻</div>
          <div className="absolute bottom-10 left-1/4 text-3xl opacity-10 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>🌱</div>
          
          <div className="container mx-auto text-center relative z-10">
            {/* Logo/Icon */}
            <div className="relative mb-8 inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                <span className="text-5xl">🌾</span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg -rotate-12">
                <Sparkles className="w-5 h-5 text-accent-foreground" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">{t('appName')}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
              {t('tagline')}
            </p>
            
            <Link to="/chat">
              <button className="group bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-10 py-5 rounded-2xl text-lg font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300">
                <span className="flex items-center gap-3">
                  <MessageCircle className="w-6 h-6" />
                  {t('startChat')}
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </button>
            </Link>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="py-12 px-4 section-pattern">
          <div className="container mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              {t('quickActions')}
            </h2>
            
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {quickActions.map((action) => (
                <Link key={action.to} to={action.to}>
                  <Card className="h-full card-hover border-0 shadow-md hover:shadow-xl overflow-hidden group">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                      <div className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform duration-300',
                        action.gradient
                      )}>
                        <action.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm leading-tight">{action.title}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-12 px-4 bg-gradient-to-b from-background to-secondary/30">
          <div className="container mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg card-gradient">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">AI Crop Doctor</h3>
                  <p className="text-muted-foreground text-sm">Instant disease detection with treatment recommendations</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg card-gradient">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Live Mandi Prices</h3>
                  <p className="text-muted-foreground text-sm">Real-time market prices from mandis across India</p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg card-gradient">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CloudSun className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Smart Weather</h3>
                  <p className="text-muted-foreground text-sm">Farm-focused forecasts with crop advisory</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
