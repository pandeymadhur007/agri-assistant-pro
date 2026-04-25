import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sprout, Loader2, TrendingUp, Droplets, Calendar, IndianRupee, Award } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

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
  key_tips: string;
}

const STATES = [
  'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
];

const labels: Record<string, Record<string, string>> = {
  en: { title: 'Smart Crop Recommendations', sub: 'Get AI-powered crop suggestions tailored to your land', state: 'State', soil: 'Soil Type', land: 'Land Size', budget: 'Budget per Acre', getRec: 'Get Recommendations', loading: 'Analyzing your farm profile...', back: 'Back', score: 'Match', yield: 'Yield', invest: 'Investment', profit: 'Profit', days: 'days', water: 'Water', tips: 'Tip', selectState: 'Select state', selectSoil: 'Select soil type', selectLand: 'Select land size', selectBudget: 'Select budget' },
  hi: { title: 'स्मार्ट फसल सुझाव', sub: 'अपनी जमीन के लिए AI-आधारित फसल सुझाव पाएं', state: 'राज्य', soil: 'मिट्टी का प्रकार', land: 'जमीन का आकार', budget: 'प्रति एकड़ बजट', getRec: 'सुझाव प्राप्त करें', loading: 'आपकी जमीन का विश्लेषण हो रहा है...', back: 'वापस', score: 'मेल', yield: 'उपज', invest: 'निवेश', profit: 'मुनाफा', days: 'दिन', water: 'पानी', tips: 'टिप', selectState: 'राज्य चुनें', selectSoil: 'मिट्टी चुनें', selectLand: 'आकार चुनें', selectBudget: 'बजट चुनें' },
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
        body: JSON.stringify({ state, soil, landSize, budget, language }),
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

  const waterColor = (w: string) => w === 'low' ? 'bg-green-100 text-green-800' : w === 'medium' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 to-white">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Sprout className="w-7 h-7 text-emerald-600" />
              {t.title}
            </h1>
            <p className="text-muted-foreground text-sm">{t.sub}</p>
          </div>
        </div>

        {/* Input Form */}
        <Card className="mb-6 border-emerald-200">
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
              <Button onClick={fetchRecommendations} disabled={loading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700">
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t.loading}</> : <><Sprout className="w-5 h-5 mr-2" />{t.getRec}</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {summary && (
          <Card className="mb-6 bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200">
            <CardContent className="p-4">
              <Badge className="mb-2 bg-emerald-600">{season}</Badge>
              <p className="text-emerald-900">{summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-transparent">
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
                    <Badge className="bg-emerald-600 text-white shrink-0">
                      <Award className="w-3 h-3 mr-1" />{rec.suitability_score}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-blue-700 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{t.yield}</div>
                    <div className="text-sm font-semibold text-blue-900">{rec.expected_yield}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-xs text-orange-700 mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3" />{t.invest}</div>
                    <div className="text-sm font-semibold text-orange-900">{rec.investment_per_acre}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-700 mb-1 flex items-center gap-1"><IndianRupee className="w-3 h-3" />{t.profit}</div>
                    <div className="text-sm font-semibold text-green-900">{rec.expected_profit_per_acre}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-xs text-purple-700 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{rec.duration_days} {t.days}</div>
                    <Badge variant="outline" className={waterColor(rec.water_requirement)}>
                      <Droplets className="w-3 h-3 mr-1" />{rec.water_requirement}
                    </Badge>
                  </div>
                  <div className="col-span-2 md:col-span-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-3">
                    <div className="text-xs text-yellow-800 mb-1">💡 {t.tips}</div>
                    <div className="text-sm text-yellow-900">{rec.key_tips}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SmartRecommendations;
