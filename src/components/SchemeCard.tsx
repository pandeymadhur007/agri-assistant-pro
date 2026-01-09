import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText, CheckCircle, Users } from 'lucide-react';

interface SchemeCardProps {
  scheme: {
    id: string;
    name_en: string;
    name_hi: string | null;
    category: string;
    benefits_en: string | null;
    benefits_hi: string | null;
    eligibility_en: string | null;
    eligibility_hi: string | null;
    documents_en: string[] | null;
    documents_hi: string[] | null;
    how_to_apply_en: string | null;
    how_to_apply_hi: string | null;
    official_link: string | null;
    state: string | null;
  };
}

export function SchemeCard({ scheme }: SchemeCardProps) {
  const { language, t } = useLanguage();

  const getName = () => {
    if (language === 'hi' && scheme.name_hi) return scheme.name_hi;
    return scheme.name_en;
  };

  const getBenefits = () => {
    if (language === 'hi' && scheme.benefits_hi) return scheme.benefits_hi;
    return scheme.benefits_en;
  };

  const getEligibility = () => {
    if (language === 'hi' && scheme.eligibility_hi) return scheme.eligibility_hi;
    return scheme.eligibility_en;
  };

  const getDocuments = () => {
    if (language === 'hi' && scheme.documents_hi) return scheme.documents_hi;
    return scheme.documents_en;
  };

  const getHowToApply = () => {
    if (language === 'hi' && scheme.how_to_apply_hi) return scheme.how_to_apply_hi;
    return scheme.how_to_apply_en;
  };

  const categoryColors: Record<string, string> = {
    farmers: 'bg-green-100 text-green-800',
    women: 'bg-pink-100 text-pink-800',
    students: 'bg-blue-100 text-blue-800',
    rural_workers: 'bg-orange-100 text-orange-800',
  };

  const categoryLabels: Record<string, string> = {
    farmers: t('farmers'),
    women: t('women'),
    students: t('students'),
    rural_workers: t('ruralWorkers'),
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{getName()}</CardTitle>
          <Badge className={categoryColors[scheme.category]}>
            {categoryLabels[scheme.category]}
          </Badge>
        </div>
        {scheme.state && (
          <CardDescription>{scheme.state}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        {getBenefits() && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              {t('benefits')}
            </div>
            <p className="text-sm text-muted-foreground">{getBenefits()}</p>
          </div>
        )}
        
        {getEligibility() && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              {t('eligibility')}
            </div>
            <p className="text-sm text-muted-foreground">{getEligibility()}</p>
          </div>
        )}

        {getDocuments() && getDocuments()!.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <FileText className="h-4 w-4 text-amber-600" />
              {t('documents')}
            </div>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {getDocuments()!.map((doc, i) => (
                <li key={i}>{doc}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      
      {scheme.official_link && (
        <CardFooter>
          <Button asChild className="w-full">
            <a href={scheme.official_link} target="_blank" rel="noopener noreferrer">
              {t('applyNow')}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export function useSchemes(category?: string, state?: string) {
  return useQuery({
    queryKey: ['schemes', category, state],
    queryFn: async () => {
      let query = supabase.from('schemes').select('*');
      
      if (category) {
        query = query.eq('category', category);
      }
      if (state) {
        query = query.eq('state', state);
      }
      
      const { data, error } = await query.order('name_en');
      if (error) throw error;
      return data;
    },
  });
}
