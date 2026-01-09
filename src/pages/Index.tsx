import { Link } from 'react-router-dom';
import { MessageCircle, FileText, Sprout, Bug, Droplets } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { QuickActionCard } from '@/components/QuickActionCard';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const { t } = useLanguage();

  const quickActions = [
    { icon: MessageCircle, title: t('startChat'), description: t('welcomeMessage'), to: '/chat', color: 'bg-primary' },
    { icon: Sprout, title: t('cropGuidance'), description: '', to: '/crop-guidance', color: 'bg-green-600' },
    { icon: Bug, title: t('pestDisease'), description: '', to: '/pest-disease', color: 'bg-amber-600' },
    { icon: Droplets, title: t('soilIrrigation'), description: '', to: '/soil-irrigation', color: 'bg-blue-600' },
    { icon: FileText, title: t('schemes'), description: '', to: '/schemes', color: 'bg-purple-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
          <div className="container mx-auto text-center">
            <div className="text-7xl mb-6">🌾</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('appName')}</h1>
            <p className="text-xl text-muted-foreground mb-8">{t('tagline')}</p>
            <Link to="/chat">
              <button className="bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary/90 transition-colors">
                {t('startChat')} →
              </button>
            </Link>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">{t('quickActions')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {quickActions.map((action) => (
                <QuickActionCard key={action.to} {...action} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
