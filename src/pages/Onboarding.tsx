import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, Sprout } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SEO } from '@/components/SEO';
import { Logo } from '@/components/Logo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const STATES = [
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Gujarat','Haryana','Himachal Pradesh','Jharkhand',
  'Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu',
  'Telangana','Uttar Pradesh','Uttarakhand','West Bengal',
];

const LAND = [
  { v: 'small', en: 'Less than 2 acres', hi: '2 एकड़ से कम' },
  { v: 'medium', en: '2 – 10 acres', hi: '2 – 10 एकड़' },
  { v: 'large', en: 'More than 10 acres', hi: '10 एकड़ से अधिक' },
];
const SOIL = [
  { v: 'loamy', en: 'Loamy', hi: 'दोमट' },
  { v: 'clay', en: 'Clay', hi: 'चिकनी' },
  { v: 'sandy', en: 'Sandy', hi: 'रेतीली' },
  { v: 'black', en: 'Black', hi: 'काली' },
  { v: 'red', en: 'Red', hi: 'लाल' },
  { v: 'alluvial', en: 'Alluvial', hi: 'जलोढ़' },
  { v: 'unknown', en: "Don't know", hi: 'पता नहीं' },
];
const IRRIGATION = [
  { v: 'rainfed', en: 'Rain-fed', hi: 'वर्षा आधारित' },
  { v: 'canal', en: 'Canal', hi: 'नहर' },
  { v: 'borewell', en: 'Borewell / tube well', hi: 'बोरवेल / ट्यूबवेल' },
  { v: 'drip', en: 'Drip / sprinkler', hi: 'ड्रिप / स्प्रिंकलर' },
];
const GOALS = [
  { v: 'higher_yield', en: 'Higher yield', hi: 'अधिक उपज' },
  { v: 'lower_cost', en: 'Lower input cost', hi: 'कम लागत' },
  { v: 'better_price', en: 'Better market price', hi: 'बेहतर बाजार भाव' },
  { v: 'organic', en: 'Move to organic', hi: 'जैविक खेती' },
];
const LANGS = [
  { v: 'en', label: 'English' },
  { v: 'hi', label: 'हिन्दी' },
  { v: 'mr', label: 'मराठी' },
  { v: 'te', label: 'తెలుగు' },
  { v: 'ta', label: 'தமிழ்' },
  { v: 'bn', label: 'বাংলা' },
];

type Choice = { v: string; en?: string; hi?: string; label?: string };

export default function Onboarding() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage() as { language: string; setLanguage?: (l: string) => void };
  const { toast } = useToast();
  const isHi = language === 'hi' || language === 'mr';
  const t = (en: string, hi: string) => (isHi ? hi : en);
  const label = (o: Choice) => o.label ?? (isHi ? o.hi ?? o.en ?? o.v : o.en ?? o.v);

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [state, setState] = useState('');
  const [landSize, setLandSize] = useState('');
  const [soil, setSoil] = useState('');
  const [irrigation, setIrrigation] = useState('');
  const [crop, setCrop] = useState('');
  const [sownDate, setSownDate] = useState('');
  const [goal, setGoal] = useState('');
  const [lang, setLang] = useState(language);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      const { data } = await supabase
        .from('profiles')
        .select('display_name, state, location, land_size, soil_type, irrigation, current_crop, crop_sown_date, farming_goal, language')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setName(data.display_name ?? '');
        setState(data.state ?? '');
        setLocation(data.location ?? '');
        setLandSize(data.land_size ?? '');
        setSoil(data.soil_type ?? '');
        setIrrigation(data.irrigation ?? '');
        setCrop(data.current_crop ?? '');
        setSownDate(data.crop_sown_date ?? '');
        setGoal(data.farming_goal ?? '');
        setLang(data.language ?? language);
      }
      setChecking(false);
    })();
  }, [navigate, language]);

  const steps = useMemo(() => ([
    {
      key: 'name',
      title: t('What is your name?', 'आपका नाम क्या है?'),
      valid: () => name.trim().length > 1,
      body: (
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60}
          placeholder={t('e.g. Ramesh Kumar', 'जैसे रमेश कुमार')} className="h-12" />
      ),
    },
    {
      key: 'location',
      title: t('Where is your farm?', 'आपका खेत कहाँ है?'),
      valid: () => state !== '' && location.trim().length > 1,
      body: (
        <div className="space-y-3">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80}
            placeholder={t('Village / district', 'गाँव / जिला')} className="h-12" />
          <div className="grid grid-cols-2 gap-2">
            {STATES.map((s) => (
              <button key={s} type="button" onClick={() => setState(s)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${state === s ? 'border-primary bg-primary/10 font-semibold' : 'border-border hover:bg-muted'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'land',
      title: t('How much land do you farm?', 'आप कितनी जमीन पर खेती करते हैं?'),
      valid: () => landSize !== '',
      body: <Options options={LAND} value={landSize} onChange={setLandSize} label={label} />,
    },
    {
      key: 'soil',
      title: t('What type of soil do you have?', 'आपकी मिट्टी किस प्रकार की है?'),
      valid: () => soil !== '',
      body: <Options options={SOIL} value={soil} onChange={setSoil} label={label} />,
    },
    {
      key: 'irrigation',
      title: t('How do you water your fields?', 'आप सिंचाई कैसे करते हैं?'),
      valid: () => irrigation !== '',
      body: <Options options={IRRIGATION} value={irrigation} onChange={setIrrigation} label={label} />,
    },
    {
      key: 'crop',
      title: t('Which crop is growing right now?', 'अभी कौन सी फसल लगी है?'),
      valid: () => crop.trim().length > 1,
      body: (
        <div className="space-y-3">
          <Input value={crop} onChange={(e) => setCrop(e.target.value)} maxLength={40}
            placeholder={t('e.g. Wheat, Tomato, Cotton', 'जैसे गेहूँ, टमाटर, कपास')} className="h-12" />
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">{t('Sowing date (optional)', 'बुवाई की तारीख (वैकल्पिक)')}</Label>
            <Input type="date" value={sownDate} max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setSownDate(e.target.value)} className="h-12" />
          </div>
        </div>
      ),
    },
    {
      key: 'goal',
      title: t('What matters most to you this season?', 'इस मौसम में आपकी प्राथमिकता क्या है?'),
      valid: () => goal !== '',
      body: <Options options={GOALS} value={goal} onChange={setGoal} label={label} />,
    },
    {
      key: 'language',
      title: t('Which language should Gram AI use?', 'ग्राम AI किस भाषा में बात करे?'),
      valid: () => lang !== '',
      body: <Options options={LANGS} value={lang} onChange={setLang} label={label} />,
    },
  ]), [name, state, location, landSize, soil, irrigation, crop, sownDate, goal, lang, isHi]);

  const current = steps[step];
  const progress = Math.round(((step + (done ? 1 : 0)) / steps.length) * 100);

  const finish = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      display_name: name.trim(),
      state,
      location: location.trim(),
      land_size: landSize,
      soil_type: soil,
      irrigation,
      current_crop: crop.trim(),
      crop_sown_date: sownDate || null,
      farming_goal: goal,
      language: lang,
      onboarding_completed: true,
    }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      toast({ title: t('Could not save your farm profile', 'फार्म प्रोफ़ाइल सेव नहीं हुई'), description: error.message, variant: 'destructive' });
      return;
    }
    setLanguage?.(lang);
    setDone(true);
    setTimeout(() => navigate('/my-farm'), 1400);
  };

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title="Set up your farm profile" description="Tell Gram AI about your land, soil, irrigation and crop to get advice made for your farm." />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-lg flex flex-col">
        <div className="flex justify-center mb-6"><Logo className="h-9" /></div>

        {done ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{t('Your farm profile is ready.', 'आपकी फार्म प्रोफ़ाइल तैयार है।')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('Gram AI will now answer using your land, soil and crop.', 'अब ग्राम AI आपकी जमीन, मिट्टी और फसल के अनुसार सलाह देगा।')}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{t('Step', 'चरण')} {step + 1} / {steps.length}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
              </div>
            </div>

            <Card className="border-border">
              <CardContent className="p-5 space-y-5">
                <h1 className="text-xl font-bold flex items-start gap-2">
                  <Sprout className="h-5 w-5 text-primary mt-1 shrink-0" />
                  {current.title}
                </h1>
                <motion.div key={current.key} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
                  {current.body}
                </motion.div>
              </CardContent>
            </Card>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="h-12" disabled={step === 0 || saving}
                onClick={() => setStep((s) => Math.max(0, s - 1))}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t('Back', 'वापस')}
              </Button>
              <Button className="flex-1 h-12" disabled={!current.valid() || saving}
                onClick={() => (step === steps.length - 1 ? finish() : setStep((s) => s + 1))}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {step === steps.length - 1 ? t('Finish', 'पूरा करें') : t('Continue', 'आगे बढ़ें')}
                {step < steps.length - 1 && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Options({ options, value, onChange, label }: {
  options: Choice[];
  value: string;
  onChange: (v: string) => void;
  label: (o: Choice) => string;
}) {
  return (
    <div className="grid gap-2">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm transition-colors min-h-[48px] ${value === o.v ? 'border-primary bg-primary/10 font-semibold' : 'border-border hover:bg-muted'}`}>
          {label(o)}
          {value === o.v && <Check className="h-4 w-4 text-primary" />}
        </button>
      ))}
    </div>
  );
}
