import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ExternalLink, FileText, CheckCircle2, Calendar, TrendingUp, Loader2 } from 'lucide-react';

interface EligibilityItem {
  id: string;
  label_en: string;
  label_hi?: string;
}

interface Scheme {
  id: string;
  name_en: string;
  name_hi: string | null;
  category: string;
  state: string | null;
  benefits_en: string | null;
  benefits_hi: string | null;
  eligibility_en: string | null;
  eligibility_hi: string | null;
  documents_en: string[] | null;
  documents_hi: string[] | null;
  how_to_apply_en: string | null;
  how_to_apply_hi: string | null;
  official_link: string | null;
  application_deadline: string | null;
  success_rate: number | null;
  eligibility_criteria: EligibilityItem[] | null;
}

const SchemeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);

  // Document checklist state (persisted in localStorage)
  const docKey = `scheme-docs-${id}`;
  const eligKey = `scheme-elig-${id}`;
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [checkedElig, setCheckedElig] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    setCheckedDocs(JSON.parse(localStorage.getItem(docKey) || '{}'));
    setCheckedElig(JSON.parse(localStorage.getItem(eligKey) || '{}'));
    (async () => {
      const { data } = await supabase.from('schemes').select('*').eq('id', id).maybeSingle();
      setScheme(data as unknown as Scheme);
      setLoading(false);
    })();
  }, [id]);

  const toggleDoc = (key: string) => {
    const next = { ...checkedDocs, [key]: !checkedDocs[key] };
    setCheckedDocs(next);
    localStorage.setItem(docKey, JSON.stringify(next));
  };
  const toggleElig = (key: string) => {
    const next = { ...checkedElig, [key]: !checkedElig[key] };
    setCheckedElig(next);
    localStorage.setItem(eligKey, JSON.stringify(next));
  };

  const name = scheme && language === 'hi' && scheme.name_hi ? scheme.name_hi : scheme?.name_en;
  const benefits = scheme && language === 'hi' && scheme.benefits_hi ? scheme.benefits_hi : scheme?.benefits_en;
  const eligibilityText = scheme && language === 'hi' && scheme.eligibility_hi ? scheme.eligibility_hi : scheme?.eligibility_en;
  const documents = scheme && language === 'hi' && scheme.documents_hi ? scheme.documents_hi : scheme?.documents_en;
  const howToApply = scheme && language === 'hi' && scheme.how_to_apply_hi ? scheme.how_to_apply_hi : scheme?.how_to_apply_en;

  const daysToDeadline = useMemo(() => {
    if (!scheme?.application_deadline) return null;
    const ms = new Date(scheme.application_deadline).getTime() - Date.now();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }, [scheme]);

  const docProgress = documents && documents.length > 0
    ? Math.round((Object.values(checkedDocs).filter(Boolean).length / documents.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 text-center text-muted-foreground">
          {t('noResults') || 'Scheme not found'}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/schemes')} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('back') || 'Back'}
        </Button>

        <div className="mb-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-3xl font-bold">{name}</h1>
            <Badge variant="secondary">{t(scheme.category) || scheme.category}</Badge>
          </div>
          {scheme.state && <p className="text-muted-foreground">{scheme.state}</p>}
        </div>

        {/* Smart insights row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {scheme.application_deadline && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
              <CardContent className="py-4 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-amber-600" />
                <div>
                  <div className="text-sm text-amber-700 dark:text-amber-400">{t('deadline') || 'Deadline'}</div>
                  <div className="font-semibold">
                    {new Date(scheme.application_deadline).toLocaleDateString()}
                    {daysToDeadline !== null && daysToDeadline > 0 && (
                      <span className="ml-2 text-sm text-amber-600">({daysToDeadline}d)</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {scheme.success_rate !== null && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <CardContent className="py-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="flex-1">
                  <div className="text-sm text-green-700 dark:text-green-400">{t('successRate') || 'Success rate'}</div>
                  <div className="font-semibold">{scheme.success_rate}%</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {benefits && (
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-lg">{t('benefits')}</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground whitespace-pre-line">{benefits}</p></CardContent>
          </Card>
        )}

        {/* Eligibility checklist */}
        {(scheme.eligibility_criteria?.length || eligibilityText) && (
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-lg">{t('eligibility')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {scheme.eligibility_criteria?.map((c) => {
                const label = language === 'hi' && c.label_hi ? c.label_hi : c.label_en;
                return (
                  <label key={c.id} className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={!!checkedElig[c.id]} onCheckedChange={() => toggleElig(c.id)} className="mt-1" />
                    <span className={checkedElig[c.id] ? 'line-through text-muted-foreground' : ''}>{label}</span>
                  </label>
                );
              })}
              {!scheme.eligibility_criteria?.length && eligibilityText && (
                <p className="text-muted-foreground whitespace-pre-line">{eligibilityText}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Document checklist */}
        {documents && documents.length > 0 && (
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('documents')}
                </CardTitle>
                <span className="text-sm text-muted-foreground">{docProgress}%</span>
              </div>
              <Progress value={docProgress} className="h-2 mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.map((doc, i) => {
                const key = `doc-${i}`;
                return (
                  <label key={key} className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={!!checkedDocs[key]} onCheckedChange={() => toggleDoc(key)} className="mt-1" />
                    <span className={checkedDocs[key] ? 'line-through text-muted-foreground' : ''}>{doc}</span>
                  </label>
                );
              })}
            </CardContent>
          </Card>
        )}

        {howToApply && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {t('howToApply')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">{howToApply}</p>
            </CardContent>
          </Card>
        )}

        {scheme.official_link && (
          <Button asChild size="lg" className="w-full">
            <a href={scheme.official_link} target="_blank" rel="noopener noreferrer">
              {t('applyNow')}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SchemeDetail;
