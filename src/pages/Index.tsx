import { Link } from 'react-router-dom';
import { MessageCircle, FileText, Sprout, Bug, CloudSun, Camera, TrendingUp, CalendarDays, Users, Download } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { QuickActionCard } from '@/components/QuickActionCard';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const { t } = useLanguage();

  const quickActions = [
    { icon: MessageCircle, title: t('startChat'), description: t('chatHelperText'), to: '/chat', color: 'bg-primary' },
    { icon: Camera, title: t('scanCrop'), description: '', to: '/scan', color: 'bg-emerald-600' },
    { icon: TrendingUp, title: t('marketPrices'), description: '', to: '/market-prices', color: 'bg-orange-600' },
    { icon: CalendarDays, title: t('calendar'), description: '', to: '/calendar', color: 'bg-teal-600' },
    { icon: Users, title: t('community'), description: '', to: '/community', color: 'bg-indigo-600' },
    { icon: CloudSun, title: t('weatherForecast'), description: '', to: '/weather', color: 'bg-blue-600' },
    { icon: Sprout, title: t('cropGuidance'), description: '', to: '/crop-guidance', color: 'bg-green-600' },
    { icon: Bug, title: t('pestDisease'), description: '', to: '/pest-disease', color: 'bg-amber-600' },
    { icon: FileText, title: t('schemes'), description: '', to: '/schemes', color: 'bg-purple-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section with pattern background */}
        <section className="hero-pattern bg-gradient-to-b from-primary/10 to-background py-12 px-4">
          <div className="container mx-auto text-center">
            {/* Farming illustration */}
            <div className="relative mb-6">
              <div className="text-7xl">🌾</div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2 text-3xl opacity-60">
                <span>🌱</span>
                <span>🌻</span>
                <span>🌱</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">{t('appName')}</h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">{t('tagline')}</p>
            <Link to="/chat">
              <button className="bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg">
                {t('startChat')} →
              </button>
            </Link>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="section-pattern py-10 px-4">
          <div className="container mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-6">{t('quickActions')}</h2>
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-9 gap-3">
              {quickActions.map((action) => (
                <QuickActionCard key={action.to} {...action} />
              ))}
            </div>
          </div>
        </section>

        {/* Install Banner */}
        <section className="px-4 pb-10">
          <div className="container mx-auto">
            <Link to="/install">
              <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-xl p-4 flex items-center justify-between hover:bg-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t('installApp')}</p>
                    <p className="text-xs text-muted-foreground">{t('installAppDesc')}</p>
                  </div>
                </div>
                <span className="text-primary text-xl">→</span>
              </div>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
