import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Sprout, Bug } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import Scan from './Scan';
import CropGuidance from './CropGuidance';
import PestDisease from './PestDisease';
import { SEO } from '@/components/SEO';

const titles: Record<string, { title: string; subtitle: string }> = {
  en: { title: 'Crop Center', subtitle: 'Scan, learn, and protect your crops — all in one place' },
  hi: { title: 'फसल केंद्र', subtitle: 'स्कैन करें, सीखें और अपनी फसलों की रक्षा करें — एक ही जगह' },
  mr: { title: 'पीक केंद्र', subtitle: 'स्कॅन करा, शिका आणि तुमच्या पिकांचे संरक्षण करा' },
  te: { title: 'పంట కేంద్రం', subtitle: 'స్కాన్ చేయండి, నేర్చుకోండి, మీ పంటలను రక్షించండి' },
  ta: { title: 'பயிர் மையம்', subtitle: 'ஸ்கேன் செய்யுங்கள், கற்றுக்கொள்ளுங்கள், உங்கள் பயிர்களை பாதுகாக்கவும்' },
  bn: { title: 'ফসল কেন্দ্র', subtitle: 'স্ক্যান করুন, শিখুন এবং আপনার ফসল রক্ষা করুন' },
};

const tabLabels: Record<string, { scan: string; guide: string; pest: string }> = {
  en: { scan: 'Scan & Diagnose', guide: 'Crop Guidance', pest: 'Pest & Disease' },
  hi: { scan: 'स्कैन और निदान', guide: 'फसल मार्गदर्शन', pest: 'कीट और रोग' },
  mr: { scan: 'स्कॅन आणि निदान', guide: 'पीक मार्गदर्शन', pest: 'कीड व रोग' },
  te: { scan: 'స్కాన్ & నిర్ధారణ', guide: 'పంట మార్గదర్శనం', pest: 'కీటకాలు & వ్యాధులు' },
  ta: { scan: 'ஸ்கேன் & கண்டறிதல்', guide: 'பயிர் வழிகாட்டுதல்', pest: 'பூச்சி & நோய்' },
  bn: { scan: 'স্ক্যান ও নির্ণয়', guide: 'ফসল নির্দেশিকা', pest: 'কীট ও রোগ' },
};

const VALID_TABS = ['scan', 'guidance', 'pest'] as const;
type TabKey = typeof VALID_TABS[number];

const CropCenter = () => {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const t = titles[language] || titles.en;
  const tl = tabLabels[language] || tabLabels.en;

  const initial = (searchParams.get('tab') as TabKey) || 'scan';
  const activeTab = VALID_TABS.includes(initial) ? initial : 'scan';

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'scan' }, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${t.title} — Scan, Guide & Pest Help`}
        description="Scan crops for diseases, get step-by-step cultivation guidance, and identify pests — instant AI help in your language."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to use Gram AI Crop Center",
          step: [
            { "@type": "HowToStep", name: "Scan", text: "Upload a photo of your crop to detect disease." },
            { "@type": "HowToStep", name: "Guidance", text: "Read step-by-step cultivation guidance." },
            { "@type": "HowToStep", name: "Pest & Disease", text: "Diagnose pests and get treatment advice." }
          ]
        }}
      />
      <Navbar />

      <div className="hero-pattern bg-gradient-to-b from-primary/10 to-background py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 mb-3">
            <Sprout className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })}
        >
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 h-auto">
            <TabsTrigger value="scan" className="gap-2 py-2.5">
              <Camera className="w-4 h-4" />
              <span className="truncate">{tl.scan}</span>
            </TabsTrigger>
            <TabsTrigger value="guidance" className="gap-2 py-2.5">
              <Sprout className="w-4 h-4" />
              <span className="truncate">{tl.guide}</span>
            </TabsTrigger>
            <TabsTrigger value="pest" className="gap-2 py-2.5">
              <Bug className="w-4 h-4" />
              <span className="truncate">{tl.pest}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-2">
            <Scan embedded />
          </TabsContent>
          <TabsContent value="guidance" className="mt-2">
            <CropGuidance embedded />
          </TabsContent>
          <TabsContent value="pest" className="mt-2">
            <PestDisease embedded />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default CropCenter;
