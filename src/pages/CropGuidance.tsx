import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sprout, Droplets, Sun, Calendar, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { SEO } from '@/components/SEO';

interface CropGuide {
  id: string;
  name: string;
  season: string;
  water: string;
  soil: string;
  steps: string[];
}

const GUIDES: CropGuide[] = [
  {
    id: 'wheat',
    name: 'Wheat (गेहूँ)',
    season: 'Rabi — sow Nov, harvest Mar–Apr',
    water: '4–6 irrigations; critical at crown root stage (21 days)',
    soil: 'Well-drained loam, pH 6.0–7.5',
    steps: [
      'Prepare a fine seedbed with 2–3 ploughings.',
      'Use certified seed at 100 kg/ha; treat with fungicide before sowing.',
      'Apply 120:60:40 NPK kg/ha — half N at sowing, rest at first irrigation.',
      'Weed control at 30–35 days; watch for yellow rust in cool humid weather.',
      'Harvest when grain hardens and moisture is near 12%.',
    ],
  },
  {
    id: 'rice',
    name: 'Rice (धान)',
    season: 'Kharif — nursery Jun, transplant Jul, harvest Oct–Nov',
    water: 'Keep 3–5 cm standing water till grain filling',
    soil: 'Clay or clay-loam with good water retention',
    steps: [
      'Raise nursery for 21–25 days before transplanting.',
      'Transplant 2–3 seedlings per hill at 20×15 cm spacing.',
      'Apply nitrogen in three splits — basal, tillering, panicle initiation.',
      'Scout weekly for stem borer and leaf folder; use pheromone traps.',
      'Drain the field 10 days before harvest.',
    ],
  },
  {
    id: 'cotton',
    name: 'Cotton (कपास)',
    season: 'Kharif — sow May–Jun, pick Oct–Jan',
    water: 'Irrigate at flowering and boll formation; avoid waterlogging',
    soil: 'Deep black cotton soil, pH 6.5–8.0',
    steps: [
      'Sow on ridges at 90×60 cm spacing for Bt hybrids.',
      'Apply farmyard manure 10 t/ha before sowing.',
      'Monitor pink bollworm from square formation using pheromone traps.',
      'Top-dress nitrogen at 30 and 60 days after sowing.',
      'Pick clean, dry bolls in the morning to protect fibre quality.',
    ],
  },
  {
    id: 'tomato',
    name: 'Tomato (टमाटर)',
    season: 'Year-round in most regions; avoid heavy monsoon planting',
    water: 'Light, frequent irrigation — drip preferred',
    soil: 'Sandy loam rich in organic matter, pH 6.0–7.0',
    steps: [
      'Transplant 25–30 day old seedlings at 60×45 cm.',
      'Stake plants within 3 weeks to keep fruit off the soil.',
      'Mulch to reduce blight splash and conserve moisture.',
      'Spray for early blight at first leaf-spot symptoms.',
      'Harvest at breaker stage for distant markets.',
    ],
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane (गन्ना)',
    season: 'Plant Oct–Nov or Feb–Mar; harvest after 10–12 months',
    water: 'Heavy requirement; irrigate every 7–12 days in summer',
    soil: 'Deep, well-drained loam, pH 6.5–7.5',
    steps: [
      'Use 3-budded setts from disease-free 8–10 month old cane.',
      'Plant in furrows 90 cm apart with setts end to end.',
      'Earth up at 90–120 days to prevent lodging.',
      'Trash mulching conserves moisture and suppresses weeds.',
      'Harvest at peak maturity — test brix before cutting.',
    ],
  },
  {
    id: 'onion',
    name: 'Onion (प्याज)',
    season: 'Rabi — transplant Dec–Jan, harvest Apr–May',
    water: 'Stop irrigation 15 days before harvest for better storage',
    soil: 'Friable loam with high organic matter, pH 6.0–7.0',
    steps: [
      'Transplant 6–7 week old seedlings at 15×10 cm.',
      'Apply sulphur-containing fertiliser for pungency and yield.',
      'Control thrips early — they cause severe leaf scorch.',
      'Weed twice in the first 45 days; onion competes poorly.',
      'Cure bulbs in shade for 7 days before storage.',
    ],
  },
];

interface Props {
  embedded?: boolean;
}

const CropGuidance = ({ embedded = false }: Props) => {
  const { language } = useLanguage();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GUIDES;
    return GUIDES.filter((g) => g.name.toLowerCase().includes(q) || g.season.toLowerCase().includes(q));
  }, [query]);

  const body = (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      {!embedded && (
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'hi' ? 'फसल मार्गदर्शन' : 'Crop Guidance'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {language === 'hi'
              ? 'बुवाई से कटाई तक चरण-दर-चरण मार्गदर्शन।'
              : 'Step-by-step cultivation guidance from sowing to harvest.'}
          </p>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={language === 'hi' ? 'फसल खोजें…' : 'Search a crop…'}
          aria-label={language === 'hi' ? 'फसल खोजें' : 'Search a crop'}
          className="h-11 pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Sprout className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {language === 'hi'
                ? 'यह फसल सूची में नहीं है — सहायक से पूछें।'
                : 'That crop is not in the list yet — ask the assistant.'}
            </p>
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/chat">
                <MessageCircle className="mr-2 h-4 w-4" />
                {language === 'hi' ? 'सहायक से पूछें' : 'Ask the assistant'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {filtered.map((guide) => (
            <AccordionItem
              key={guide.id}
              value={guide.id}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card px-4"
            >
              <AccordionTrigger className="py-4 text-left text-base font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{guide.name}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5">
                <div className="mb-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                  <span className="flex items-start gap-2">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {guide.season}
                  </span>
                  <span className="flex items-start gap-2">
                    <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {guide.water}
                  </span>
                  <span className="flex items-start gap-2">
                    <Sun className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {guide.soil}
                  </span>
                </div>
                <ol className="space-y-2">
                  {guide.steps.map((step, i) => (
                    <li key={step} className="flex gap-3 text-sm text-foreground/85">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );

  if (embedded) return body;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Crop Cultivation Guidance"
        description="Step-by-step sowing, irrigation, fertiliser and harvest guidance for wheat, rice, cotton, tomato, sugarcane and onion."
      />
      <Navbar />
      <main className="flex-1">{body}</main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default CropGuidance;
