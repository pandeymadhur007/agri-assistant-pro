import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bug, ShieldCheck, Pill, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { SEO } from '@/components/SEO';

interface PestEntry {
  id: string;
  name: string;
  crops: string;
  symptoms: string;
  treatment: string;
  prevention: string;
}

const PESTS: PestEntry[] = [
  {
    id: 'pink-bollworm',
    name: 'Pink Bollworm',
    crops: 'Cotton',
    symptoms: 'Rosetted flowers, holes in bolls, stained lint and damaged seeds.',
    treatment: 'Install 5 pheromone traps/acre; spray recommended insecticide only at ETL (8 moths/trap for 3 nights).',
    prevention: 'Follow sowing windows, destroy crop residue, avoid extending the crop beyond December.',
  },
  {
    id: 'fall-armyworm',
    name: 'Fall Armyworm',
    crops: 'Maize, sorghum',
    symptoms: 'Ragged whorl leaves, moist sawdust-like frass in the leaf funnel.',
    treatment: 'Hand-pick egg masses; apply approved bio-pesticide or emamectin benzoate into the whorl in the evening.',
    prevention: 'Early sowing, intercrop with pulses, encourage natural enemies with flowering border rows.',
  },
  {
    id: 'stem-borer',
    name: 'Rice Stem Borer',
    crops: 'Rice',
    symptoms: 'Dead hearts in vegetative stage; white ear heads at flowering.',
    treatment: 'Release Trichogramma cards; use granular insecticide in standing water at ETL.',
    prevention: 'Clip seedling tips before transplanting, remove stubble, avoid excess nitrogen.',
  },
  {
    id: 'yellow-rust',
    name: 'Yellow Rust',
    crops: 'Wheat',
    symptoms: 'Yellow-orange powdery stripes along leaf veins in cool, humid weather.',
    treatment: 'Spray propiconazole 25 EC at first appearance; repeat after 15 days if it spreads.',
    prevention: 'Grow resistant varieties, avoid late sowing and excess nitrogen.',
  },
  {
    id: 'early-blight',
    name: 'Early Blight',
    crops: 'Tomato, potato',
    symptoms: 'Brown concentric-ring spots on older leaves, progressing upward.',
    treatment: 'Remove affected leaves; spray mancozeb at 7–10 day intervals during humid spells.',
    prevention: 'Rotate crops, mulch to stop soil splash, keep foliage dry with drip irrigation.',
  },
  {
    id: 'thrips',
    name: 'Thrips',
    crops: 'Onion, chilli, cotton',
    symptoms: 'Silvery streaks, curled leaves, stunted growth and flower drop.',
    treatment: 'Use blue sticky traps; spray neem oil 3 ml/L, escalate to recommended insecticide at ETL.',
    prevention: 'Avoid water stress, remove weed hosts, do not spray broad-spectrum chemicals repeatedly.',
  },
];

interface Props {
  embedded?: boolean;
}

const PestDisease = ({ embedded = false }: Props) => {
  const { language } = useLanguage();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PESTS;
    return PESTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.crops.toLowerCase().includes(q) || p.symptoms.toLowerCase().includes(q),
    );
  }, [query]);

  const body = (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      {!embedded && (
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'hi' ? 'कीट और रोग' : 'Pest & Disease'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {language === 'hi'
              ? 'सामान्य कीट-रोग पहचानें और सुरक्षित उपचार अपनाएँ।'
              : 'Identify common pests and diseases and use safe, recommended treatments.'}
          </p>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={language === 'hi' ? 'कीट, रोग या फसल खोजें…' : 'Search a pest, disease or crop…'}
          aria-label={language === 'hi' ? 'कीट खोजें' : 'Search pests'}
          className="h-11 pl-9"
        />
      </div>

      <Card className="mb-4 border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground/85">
            {language === 'hi'
              ? 'निश्चित नहीं? पत्ती की फ़ोटो स्कैन करें और AI निदान पाएँ।'
              : 'Not sure what it is? Scan a leaf photo for an AI diagnosis.'}
          </p>
          <Button asChild className="min-h-11 shrink-0">
            <Link to="/crop-center?tab=scan">
              <Camera className="mr-2 h-4 w-4" />
              {language === 'hi' ? 'फसल स्कैन करें' : 'Scan crop'}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Bug className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {language === 'hi' ? 'कोई मिलान नहीं मिला।' : 'No matches found.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {filtered.map((pest) => (
            <AccordionItem
              key={pest.id}
              value={pest.id}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card px-4"
            >
              <AccordionTrigger className="py-4 text-left text-base font-semibold hover:no-underline">
                <span className="flex flex-wrap items-center gap-2">
                  <Bug className="h-4 w-4 shrink-0 text-primary" />
                  <span>{pest.name}</span>
                  <Badge variant="secondary" className="font-normal">{pest.crops}</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-5 text-sm">
                <p className="text-foreground/85">{pest.symptoms}</p>
                <p className="flex gap-2 text-muted-foreground">
                  <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{pest.treatment}</span>
                </p>
                <p className="flex gap-2 text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{pest.prevention}</span>
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <p className="mt-5 rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
        {language === 'hi'
          ? 'कोई भी रसायन प्रयोग करने से पहले लेबल पढ़ें और स्थानीय कृषि अधिकारी से सलाह लें।'
          : 'Always read the label and confirm dosage with your local agriculture officer before using any chemical.'}
      </p>
    </div>
  );

  if (embedded) return body;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Pest & Disease Guide"
        description="Identify common Indian crop pests and diseases with symptoms, safe treatments and prevention tips."
      />
      <Navbar />
      <main className="flex-1">{body}</main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default PestDisease;
