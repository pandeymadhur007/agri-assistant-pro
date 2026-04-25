import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Banknote, Thermometer, FileText, Sprout } from 'lucide-react';
import { motion } from 'framer-motion';

interface Breed {
  id: string;
  category: string;
  name_en: string;
  name_hi: string | null;
  origin: string | null;
  emoji: string | null;
  daily_production: string | null;
  suitable_states: string[] | null;
  suitable_climate: string | null;
  characteristics_en: string | null;
  characteristics_hi: string | null;
  estimated_profit: string | null;
  related_schemes: string[] | null;
  display_order: number | null;
}

const TAB_META = [
  { key: 'cow',     en: 'Cow Breeds',     hi: 'गाय की नस्लें',  emoji: '🐄', desc: { en: 'Indian & foreign dairy breeds', hi: 'देशी और विदेशी डेयरी नस्लें' } },
  { key: 'buffalo', en: 'Buffalo Breeds', hi: 'भैंस की नस्लें', emoji: '🐃', desc: { en: 'High-yield Indian buffaloes',     hi: 'अधिक दूध देने वाली भैंसें' } },
  { key: 'goat',    en: 'Goat Farming',   hi: 'बकरी पालन',     emoji: '🐐', desc: { en: 'Popular meat & milk goats',      hi: 'लोकप्रिय मांस और दूध की बकरियां' } },
  { key: 'poultry', en: 'Poultry Farming', hi: 'मुर्गी पालन',  emoji: '🐔', desc: { en: 'Layers, broilers & native breeds', hi: 'अंडे, मांस और देसी नस्लें' } },
  { key: 'fish',    en: 'Fish Farming',   hi: 'मत्स्य पालन',   emoji: '🐟', desc: { en: 'Freshwater aquaculture',          hi: 'मीठे पानी की मछली पालन' } },
];

// Maps the short labels stored on animal_breeds.related_schemes to official URLs.
const SCHEME_LINKS: Record<string, string> = {
  'Rashtriya Gokul Mission': 'https://dahd.nic.in/schemes/programmes/rashtriya-gokul-mission',
  'PM Matsya Sampada Yojana': 'https://pmmsy.dof.gov.in/',
  'NABARD DEDS': 'https://www.nabard.org/',
  'NABARD Dairy Entrepreneurship Development Scheme': 'https://www.nabard.org/',
  'Poultry Venture Capital Fund': 'https://dahd.nic.in/',
  'Kamdhenu Yojana': 'https://dahd.nic.in/',
  'National Livestock Mission': 'https://nlm.udyamimitra.in/',
};

export default function AnimalHusbandry() {
  const { language } = useLanguage();
  const [tab, setTab] = useState('cow');
  const t = (en: string, hi: string) => (language === 'hi' ? hi : en);

  const { data: breeds, isLoading } = useQuery({
    queryKey: ['animal_breeds', tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('animal_breeds')
        .select('*')
        .eq('category', tab)
        .order('display_order');
      if (error) throw error;
      return (data ?? []) as Breed[];
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-amber-500/10 to-background py-8 px-4">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900 mb-3 text-3xl">
              🐄
            </div>
            <h1 className="text-3xl font-bold mb-2">{t('Animal Husbandry', 'पशुपालन')}</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t('Breeds, daily production, profitability & matching government schemes — all in one place.',
                 'नस्लें, दैनिक उत्पादन, लाभप्रदता और संबंधित सरकारी योजनाएं — एक ही स्थान पर।')}
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto mb-6 h-auto">
              {TAB_META.map(meta => (
                <TabsTrigger key={meta.key} value={meta.key} className="flex-col gap-1 py-2 text-xs">
                  <span className="text-xl" aria-hidden>{meta.emoji}</span>
                  <span>{language === 'hi' ? meta.hi : meta.en}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {TAB_META.map(meta => (
              <TabsContent key={meta.key} value={meta.key}>
                <p className="text-center text-muted-foreground mb-6">{language === 'hi' ? meta.desc.hi : meta.desc.en}</p>
                {isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : !breeds || breeds.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    {t('No breeds available yet.', 'अभी कोई नस्ल उपलब्ध नहीं।')}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {breeds.map((b, i) => (
                      <BreedCard key={b.id} breed={b} index={i} language={language} />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

function BreedCard({ breed, index, language }: { breed: Breed; index: number; language: string }) {
  const t = (en: string, hi: string) => (language === 'hi' ? hi : en);
  const name = language === 'hi' && breed.name_hi ? breed.name_hi : breed.name_en;
  const characteristics = language === 'hi' && breed.characteristics_hi ? breed.characteristics_hi : breed.characteristics_en;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
        {/* Image placeholder */}
        <div className="h-32 bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 flex items-center justify-center text-6xl select-none">
          {breed.emoji ?? '🐄'}
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-snug">{name}</CardTitle>
            {breed.origin && <Badge variant="secondary" className="shrink-0">{breed.origin}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          {breed.daily_production && (
            <div className="flex items-start gap-2 text-sm">
              <Sprout className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-medium">{t('Daily production', 'दैनिक उत्पादन')}</div>
                <div className="text-muted-foreground">{breed.daily_production}</div>
              </div>
            </div>
          )}
          {breed.suitable_climate && (
            <div className="flex items-start gap-2 text-sm">
              <Thermometer className="h-4 w-4 mt-0.5 text-orange-600 shrink-0" />
              <div>
                <div className="font-medium">{t('Climate', 'जलवायु')}</div>
                <div className="text-muted-foreground">{breed.suitable_climate}</div>
              </div>
            </div>
          )}
          {breed.suitable_states && breed.suitable_states.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
              <div>
                <div className="font-medium">{t('Suitable states', 'अनुकूल राज्य')}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {breed.suitable_states.slice(0, 4).map(s => (
                    <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                  ))}
                  {breed.suitable_states.length > 4 && (
                    <Badge variant="outline" className="text-[10px]">+{breed.suitable_states.length - 4}</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          {breed.estimated_profit && (
            <div className="flex items-start gap-2 text-sm">
              <Banknote className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
              <div>
                <div className="font-medium">{t('Estimated profit', 'अनुमानित लाभ')}</div>
                <div className="text-muted-foreground">{breed.estimated_profit}</div>
              </div>
            </div>
          )}
          {characteristics && (
            <p className="text-xs text-muted-foreground border-t pt-2 italic">{characteristics}</p>
          )}
          {breed.related_schemes && breed.related_schemes.length > 0 && (
            <div className="border-t pt-2">
              <div className="flex items-center gap-1 text-xs font-medium mb-1">
                <FileText className="h-3 w-3 text-purple-600" /> {t('Related schemes', 'संबंधित योजनाएं')}
              </div>
              <div className="flex flex-wrap gap-1">
                {breed.related_schemes.map(s => {
                  const href = SCHEME_LINKS[s] ?? '/schemes';
                  const isExternal = href.startsWith('http');
                  return (
                    <a
                      key={s}
                      href={href}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      className="inline-block"
                    >
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-normal cursor-pointer hover:bg-purple-100 hover:text-purple-800 transition-colors"
                      >
                        {s} ↗
                      </Badge>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
