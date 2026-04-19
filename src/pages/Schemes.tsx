import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { useSchemes } from '@/components/SchemeCard';
import { SchemeEligibilityChecker } from '@/components/SchemeEligibilityChecker';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Calendar, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';

const STATES = [
  'All India', 'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
];

const PREFERRED_STATE_KEY = 'gram-ai-preferred-state';

const Schemes = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('');
  const [state, setState] = useState<string>(() => localStorage.getItem(PREFERRED_STATE_KEY) || '');
  const { data: schemes, isLoading } = useSchemes(category || undefined);

  const onStateChange = (val: string) => {
    const v = val === 'all' ? '' : val;
    setState(v);
    if (v) localStorage.setItem(PREFERRED_STATE_KEY, v);
    else localStorage.removeItem(PREFERRED_STATE_KEY);
  };

  const categories = [
    { value: 'farmers', label: t('farmers') },
    { value: 'women', label: t('women') },
    { value: 'students', label: t('students') },
    { value: 'rural_workers', label: t('ruralWorkers') },
  ];

  // Personalized "For You" — rank by deadline + state match + success rate
  const { forYou, others } = useMemo(() => {
    if (!schemes) return { forYou: [], others: [] };
    const score = (s: any) => {
      let pts = 0;
      if (state && (s.state === state || !s.state)) pts += 30;
      if (s.application_deadline) {
        const days = (new Date(s.application_deadline).getTime() - Date.now()) / 86400000;
        if (days > 0 && days < 90) pts += 20;
      }
      if (typeof s.success_rate === 'number') pts += s.success_rate / 5;
      return pts;
    };
    const ranked = [...schemes].sort((a, b) => score(b) - score(a));
    return { forYou: ranked.slice(0, 3), others: ranked.slice(3) };
  }, [schemes, state]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="hero-pattern bg-gradient-to-b from-purple-500/10 to-background py-8 px-4">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900 mb-3">
              <FileText className="w-7 h-7 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{t('schemes')}</h1>
            <p className="text-muted-foreground">Find government schemes for farmers and rural workers</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-3 mb-6">
            <Select value={category} onValueChange={(val) => setCategory(val === 'all' ? '' : val)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCategories')}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={state} onValueChange={onStateChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('filterByState')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStates')}</SelectItem>
                {STATES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Eligibility Checker — quick personalized matcher */}
          {schemes && schemes.length > 0 && (
            <div className="mb-8">
              <SchemeEligibilityChecker
                schemes={schemes}
                language={language}
                onOpenScheme={(id) => navigate(`/schemes/detail/${id}`)}
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <>
              {forYou.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">{t('forYou') || 'For You'}</h2>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {forYou.map((s: any) => (
                      <SchemeIntelligenceCard key={s.id} scheme={s} language={language} onOpen={() => navigate(`/schemes/detail/${s.id}`)} t={t} />
                    ))}
                  </div>
                </section>
              )}

              {others.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-3">{t('allSchemes') || 'All Schemes'}</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {others.map((s: any) => (
                      <SchemeIntelligenceCard key={s.id} scheme={s} language={language} onOpen={() => navigate(`/schemes/detail/${s.id}`)} t={t} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

function SchemeIntelligenceCard({ scheme, language, onOpen, t }: any) {
  const name = language === 'hi' && scheme.name_hi ? scheme.name_hi : scheme.name_en;
  const benefits = language === 'hi' && scheme.benefits_hi ? scheme.benefits_hi : scheme.benefits_en;
  const days = scheme.application_deadline
    ? Math.ceil((new Date(scheme.application_deadline).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer" onClick={onOpen}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{name}</CardTitle>
          <Badge variant="secondary" className="shrink-0">{t(scheme.category) || scheme.category}</Badge>
        </div>
        {scheme.state && <CardDescription>{scheme.state}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {benefits && <p className="text-sm text-muted-foreground line-clamp-3">{benefits}</p>}
        <div className="flex flex-wrap gap-2">
          {days !== null && days > 0 && (
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {days}d left
            </Badge>
          )}
          {typeof scheme.success_rate === 'number' && (
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {scheme.success_rate}%
            </Badge>
          )}
        </div>
      </CardContent>
      <div className="px-6 pb-4">
        <Button variant="ghost" size="sm" className="w-full justify-between">
          {t('viewDetails') || 'View details'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

export default Schemes;
