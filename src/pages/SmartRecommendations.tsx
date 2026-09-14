import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sprout, Loader2, TrendingUp, Droplets, Calendar, IndianRupee, Award, ShieldAlert, Mic, Camera, MessageCircle, Pencil, MapPin } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SEO } from '@/components/SEO';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useFarmProfile, cropAgeDays } from '@/hooks/useFarmProfile';

interface Recommendation {
  crop_name: string;
  crop_name_en: string;
  suitability_score: number;
  reason: string;
  expected_yield: string;
  investment_per_acre: string;
  expected_profit_per_acre: string;
  duration_days: number;
  water_requirement: 'low' | 'medium' | 'high';
  risk_level?: 'low' | 'medium' | 'high';
  risk_note?: string;
  why_gram_ai?: string;
  key_tips: string;
}

const STATES = [
  'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
];

const labels: Record<string, Record<string, string>> = {
  en: { title: 'Smart Crop Planner', sub: 'AI-powered crop planning, schedules, reminders, and farming guidance in one place.', state: 'State', soil: 'Soil Type', land: 'Land Size', budget: 'Budget per Acre', getRec: 'Get Recommendations', loading: 'Analyzing your farm profile...', back: 'Back', score: 'Match', yield: 'Yield', invest: 'Investment', profit: 'Profit', days: 'days', water: 'Water', tips: 'Tip', selectState: 'Select state', selectSoil: 'Select soil type', selectLand: 'Select land size', selectBudget: 'Select budget' },
  hi: { title: 'स्मार्ट फसल योजनाकार', sub: 'AI-संचालित फसल योजना, समय-सारिणी, रिमाइंडर और खेती मार्गदर्शन — एक ही जगह।', state: 'राज्य', soil: 'मिट्टी का प्रकार', land: 'जमीन का आकार', budget: 'प्रति एकड़ बजट', getRec: 'सुझाव प्राप्त करें', loading: 'आपकी जमीन का विश्लेषण हो रहा है...', back: 'वापस', score: 'मेल', yield: 'उपज', invest: 'निवेश', profit: 'मुनाफा', days: 'दिन', water: 'पानी', tips: 'टिप', selectState: 'राज्य चुनें', selectSoil: 'मिट्टी चुनें', selectLand: 'आकार चुनें', selectBudget: 'बजट चुनें' },
};

const soilOptions = [
  { value: 'loamy', en: 'Loamy', hi: 'दोमट' },
  { value: 'clay', en: 'Clay', hi: 'चिकनी' },
  { value: 'sandy', en: 'Sandy', hi: 'रेतीली' },
  { value: 'black', en: 'Black', hi: 'काली' },
  { value: 'red', en: 'Red', hi: 'लाल' },
  { value: 'alluvial', en: 'Alluvial', hi: 'जलोढ़' },
  { value: 'unknown', en: "Don't know", hi: 'पता नहीं' },
];

const landOptions = [
  { value: 'small', en: 'Small (<2 acres)', hi: 'छोटा (<2 एकड़)' },
  { value: 'medium', en: 'Medium (2-10 acres)', hi: 'मध्यम (2-10 एकड़)' },
  { value: 'large', en: 'Large (>10 acres)', hi: 'बड़ा (>10 एकड़)' },
];

const budgetOptions = [
  { value: 'low', en: 'Low (<₹20,000)', hi: 'कम (<₹20,000)' },
  { value: 'medium', en: 'Medium (₹20K-1L)', hi: 'मध्यम (₹20K-1L)' },
  { value: 'high', en: 'High (>₹1 Lakh)', hi: 'अधिक (>₹1 लाख)' },
];

const SmartRecommendations = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { profile } = useFarmProfile();
  const t = labels[language] || labels.en;
  const isHi = language === 'hi' || language === 'mr';

  const [state, setState] = useState('');
  const [soil, setSoil] = useState('loamy');
  const [landSize, setLandSize] = useState('medium');
  const [budget, setBudget] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState('');
  const [season, setSeason] = useState('');

  // Prefill from the saved farm profile so the farmer never re-enters what we know.
  useEffect(() => {
    if (!profile) return;
    if (profile.state) setState(profile.state);
    if (profile.soil_type) setSoil(profile.soil_type);
    if (profile.land_size) setLandSize(profile.land_size);
  }, [profile]);

  const fetchRecommendations = async () => {
    if (!state) {
      toast({ title: t.selectState, variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crop-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          state, soil, landSize, budget, language,
          irrigation: profile?.irrigation ?? '',
          currentCrop: profile?.current_crop ?? '',
          location: profile?.location ?? '',
          goal: profile?.farming_goal ?? '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setRecommendations(data.recommendations || []);
      setSummary(data.summary || '');
      setSeason(data.season || '');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load recommendations';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const waterColor = (w: string) =>
    w === 'low'
      ? 'border-green-500/40 bg-green-500/15 text-green-200 dark:text-green-300'
      : w === 'medium'
      ? 'border-blue-500/40 bg-blue-500/15 text-blue-200 dark:text-blue-300'
      : 'border-orange-500/40 bg-orange-500/15 text-orange-200 dark:text-orange-300';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <SEO
        title="Smart Crop Recommendations"
        description="Get personalized crop and input recommendations based on your state, soil, season and farm conditions."
      />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Sprout className="w-7 h-7 text-primary" />
              {t.title}
            </h1>
            <p className="text-muted-foreground text-sm">{t.sub}</p>
          </div>
        </div>

        {/* Feature chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            'Crop Recommendations',
            'Growth Guidance',
            'Seasonal Planning',
            'Sowing Schedule',
            'Irrigation Planning',
            'Fertilizer Reminders',
            'Harvest Planning',
            'Smart Farming Tips',
          ].map((f) => (
            <Badge key={f} variant="secondary" className="font-normal">{f}</Badge>
          ))}
        </div>

        {/* Saved farm profile */}
        {profile?.onboarding_completed ? (
          <Card className="mb-6 border-primary/30">
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  {isHi ? 'मेरा खेत' : 'My Farm'}
                </div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  {[profile.location, profile.state].filter(Boolean).join(', ') || '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {[profile.current_crop, profile.soil_type, profile.irrigation].filter(Boolean).join(' · ')}
                  {cropAgeDays(profile) !== null && ` · ${cropAgeDays(profile)} ${isHi ? 'दिन' : 'days'}`}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/my-farm')} className="shrink-0">
                <Pencil className="w-4 h-4 mr-1" />{isHi ? 'बदलें' : 'Edit'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-dashed">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {isHi ? 'अपना खेत सेट करें ताकि सलाह आपकी जमीन के अनुसार मिले।' : 'Set up your farm so advice matches your land.'}
              </p>
              <Button size="sm" onClick={() => navigate('/onboarding')} className="shrink-0">
                {isHi ? 'सेट करें' : 'Set up'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Input Form */}
        <Card className="mb-6 border-primary/30 bg-card/95">
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">{t.state}</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger><SelectValue placeholder={t.selectState} /></SelectTrigger>
                <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">{t.soil}</Label>
              <Select value={soil} onValueChange={setSoil}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{soilOptions.map(o => <SelectItem key={o.value} value={o.value}>{isHi ? o.hi : o.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">{t.land}</Label>
              <Select value={landSize} onValueChange={setLandSize}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{landOptions.map(o => <SelectItem key={o.value} value={o.value}>{isHi ? o.hi : o.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">{t.budget}</Label>
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{budgetOptions.map(o => <SelectItem key={o.value} value={o.value}>{isHi ? o.hi : o.en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button onClick={fetchRecommendations} disabled={loading} className="w-full h-12">
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t.loading}</> : <><Sprout className="w-5 h-5 mr-2" />{t.getRec}</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {summary && (
          <Card className="mb-6 bg-gradient-to-br from-primary/15 to-primary/5 border-primary/30">
            <CardContent className="p-4">
              <Badge className="mb-2 bg-primary text-primary-foreground">{season}</Badge>
              <p className="text-foreground">{summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-transparent">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <span className="text-2xl">🌾</span>
                        {rec.crop_name}
                        {rec.crop_name_en !== rec.crop_name && (
                          <span className="text-sm font-normal text-muted-foreground">({rec.crop_name_en})</span>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground shrink-0">
                      <Award className="w-3 h-3 mr-1" />{rec.suitability_score}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                  <div className="bg-blue-500/10 rounded-lg p-3">
                    <div className="text-xs text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{t.yield}</div>
                    <div className="text-sm font-semibold text-foreground">{rec.expected_yield}</div>
                  </div>
                  <div className="bg-orange-500/10 rounded-lg p-3">
                    <div className="text-xs text-orange-700 dark:text-orange-300 mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3" />{t.invest}</div>
                    <div className="text-sm font-semibold text-foreground">{rec.investment_per_acre}</div>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-3">
                    <div className="text-xs text-green-700 dark:text-green-300 mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3" />{t.profit}</div>
                    <div className="text-sm font-semibold text-foreground">{rec.expected_profit_per_acre}</div>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-3">
                    <div className="text-xs text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{rec.duration_days} {t.days}</div>
                    <Badge variant="outline" className={waterColor(rec.water_requirement)}>
                      <Droplets className="w-3 h-3 mr-1" />{rec.water_requirement}
                    </Badge>
                  </div>
                  {rec.why_gram_ai && (
                    <div className="col-span-2 md:col-span-4 bg-primary/10 border-l-4 border-primary/70 rounded-r-lg p-3">
                      <div className="text-xs text-primary mb-1">{isHi ? 'ग्राम AI यह क्यों सुझा रहा है' : 'Why Gram AI recommends this'}</div>
                      <div className="text-sm text-foreground">{rec.why_gram_ai}</div>
                    </div>
                  )}
                  {rec.risk_level && (
                    <div className="col-span-2 md:col-span-4 flex items-start gap-2 rounded-lg border border-border p-3">
                      <ShieldAlert className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <Badge variant="outline" className={waterColor(rec.risk_level)}>
                          {isHi ? 'जोखिम' : 'Risk'}: {rec.risk_level}
                        </Badge>
                        {rec.risk_note && <p className="text-sm text-foreground mt-1.5">{rec.risk_note}</p>}
                      </div>
                    </div>
                  )}
                  <div className="col-span-2 md:col-span-4 bg-yellow-500/10 border-l-4 border-yellow-500/70 rounded-r-lg p-3">
                    <div className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">💡 {t.tips}</div>
                    <div className="text-sm text-foreground">{rec.key_tips}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Unified next steps — same farm context powers all three */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button variant="outline" className="h-12 justify-start" onClick={() => navigate('/chat', { state: { voice: true } })}>
            <Mic className="w-4 h-4 mr-2 text-primary" />{isHi ? 'ग्राम AI से बात करें' : 'Talk to Gram AI'}
          </Button>
          <Button variant="outline" className="h-12 justify-start" onClick={() => navigate('/scan')}>
            <Camera className="w-4 h-4 mr-2 text-primary" />{isHi ? 'फसल स्कैन करें' : 'Scan Crop'}
          </Button>
          <Button variant="outline" className="h-12 justify-start" onClick={() => navigate('/chat')}>
            <MessageCircle className="w-4 h-4 mr-2 text-primary" />{isHi ? 'ग्राम AI से पूछें' : 'Ask Gram AI'}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SmartRecommendations;
