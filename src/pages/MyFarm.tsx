import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, Leaf, Loader2, MapPin, Pencil, Ruler, Sprout, CalendarDays, Target, Save, X } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useFarmProfile, cropAgeDays } from '@/hooks/useFarmProfile';
import { supabase } from '@/integrations/supabase/client';

const LAND = [['small', 'Less than 2 acres'], ['medium', '2 – 10 acres'], ['large', 'More than 10 acres']];
const SOIL = [['loamy', 'Loamy'], ['clay', 'Clay'], ['sandy', 'Sandy'], ['black', 'Black'], ['red', 'Red'], ['alluvial', 'Alluvial'], ['unknown', "Don't know"]];
const IRRIGATION = [['rainfed', 'Rain-fed'], ['canal', 'Canal'], ['borewell', 'Borewell / tube well'], ['drip', 'Drip / sprinkler']];
const GOALS = [['higher_yield', 'Higher yield'], ['lower_cost', 'Lower input cost'], ['better_price', 'Better market price'], ['organic', 'Move to organic']];

const pretty = (list: string[][], v?: string | null) => list.find(([k]) => k === v)?.[1] ?? v ?? '—';

export default function MyFarm() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { profile, loading, save } = useFarmProfile();
  const t = (en: string, hi: string) => (language === 'hi' || language === 'mr' ? hi : en);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    location: '', state: '', land_size: '', soil_type: '', irrigation: '', current_crop: '', crop_sown_date: '',
    farming_goal: '',
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (!data.user) navigate('/login'); });
  }, [navigate]);

  useEffect(() => {
    if (profile) {
      setForm({
        location: profile.location ?? '',
        state: profile.state ?? '',
        land_size: profile.land_size ?? '',
        soil_type: profile.soil_type ?? '',
        irrigation: profile.irrigation ?? '',
        current_crop: profile.current_crop ?? '',
        crop_sown_date: profile.crop_sown_date ?? '',
        farming_goal: profile.farming_goal ?? '',
      });
    }
  }, [profile]);

  const submit = async () => {
    setSaving(true);
    const { error } = await save({ ...form, crop_sown_date: form.crop_sown_date || null, onboarding_completed: true });
    setSaving(false);
    if (error) {
      toast({ title: t('Could not save', 'सेव नहीं हुआ'), description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: t('Farm details updated', 'खेत की जानकारी अपडेट हुई') });
    setEditing(false);
  };

  const age = cropAgeDays(profile);

  const rows = [
    { icon: MapPin, label: t('Location', 'स्थान'), value: [profile?.location, profile?.state].filter(Boolean).join(', ') || '—' },
    { icon: Ruler, label: t('Land size', 'जमीन'), value: pretty(LAND, profile?.land_size) },
    { icon: Leaf, label: t('Soil', 'मिट्टी'), value: pretty(SOIL, profile?.soil_type) },
    { icon: Droplets, label: t('Irrigation', 'सिंचाई'), value: pretty(IRRIGATION, profile?.irrigation) },
    { icon: Sprout, label: t('Current crop', 'वर्तमान फसल'), value: profile?.current_crop || '—' },
    { icon: CalendarDays, label: t('Crop age', 'फसल की आयु'), value: age === null ? '—' : `${age} ${t('days', 'दिन')}` },
    { icon: Target, label: t('Goal', 'लक्ष्य'), value: pretty(GOALS, profile?.farming_goal) },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background pb-24 md:pb-0">
      <SEO title="My Farm" description="Your saved farm details — land, soil, irrigation and current crop — used to personalise Gram AI advice." />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold">{t('My Farm', 'मेरा खेत')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('Gram AI uses these details in chat, voice and crop scans.', 'ग्राम AI इन्हीं जानकारियों से चैट, आवाज़ और स्कैन में सलाह देता है।')}
            </p>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="shrink-0">
              <Pencil className="h-4 w-4 mr-1" /> {t('Edit', 'बदलें')}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !profile?.onboarding_completed && !editing ? (
          <Card><CardContent className="p-6 text-center space-y-4">
            <p className="text-muted-foreground">{t('You have not set up your farm yet.', 'आपने अभी तक अपना खेत सेट नहीं किया है।')}</p>
            <Button onClick={() => navigate('/onboarding')} className="h-12">{t('Set up my farm', 'मेरा खेत सेट करें')}</Button>
          </CardContent></Card>
        ) : editing ? (
          <Card><CardContent className="p-5 space-y-4">
            <Field label={t('Village / district', 'गाँव / जिला')}>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength={80} />
            </Field>
            <Field label={t('State', 'राज्य')}>
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={60} />
            </Field>
            <Field label={t('Land size', 'जमीन')}>
              <Picker value={form.land_size} onChange={(v) => setForm({ ...form, land_size: v })} options={LAND} />
            </Field>
            <Field label={t('Soil', 'मिट्टी')}>
              <Picker value={form.soil_type} onChange={(v) => setForm({ ...form, soil_type: v })} options={SOIL} />
            </Field>
            <Field label={t('Irrigation', 'सिंचाई')}>
              <Picker value={form.irrigation} onChange={(v) => setForm({ ...form, irrigation: v })} options={IRRIGATION} />
            </Field>
            <Field label={t('Current crop', 'वर्तमान फसल')}>
              <Input value={form.current_crop} onChange={(e) => setForm({ ...form, current_crop: e.target.value })} maxLength={40} />
            </Field>
            <Field label={t('Sowing date', 'बुवाई की तारीख')}>
              <Input type="date" max={new Date().toISOString().slice(0, 10)} value={form.crop_sown_date}
                onChange={(e) => setForm({ ...form, crop_sown_date: e.target.value })} />
            </Field>
            <Field label={t('Goal', 'लक्ष्य')}>
              <Picker value={form.farming_goal} onChange={(v) => setForm({ ...form, farming_goal: v })} options={GOALS} />
            </Field>
            <div className="flex gap-3 pt-1">
              <Button onClick={submit} disabled={saving} className="flex-1 h-12">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {t('Save', 'सेव करें')}
              </Button>
              <Button variant="outline" className="h-12" onClick={() => setEditing(false)} disabled={saving}>
                <X className="h-4 w-4 mr-1" /> {t('Cancel', 'रद्द')}
              </Button>
            </div>
          </CardContent></Card>
        ) : (
          <>
            <Card><CardContent className="p-2">
              {rows.map((r, i) => (
                <motion.div key={r.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-3 py-3.5 border-b border-border last:border-0">
                  <r.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-muted-foreground flex-1">{r.label}</span>
                  <span className="text-sm font-semibold text-right">{r.value}</span>
                </motion.div>
              ))}
            </CardContent></Card>
            <Button className="w-full h-12 mt-5" onClick={() => navigate('/smart-crop-planner')}>
              {t('Open Smart Crop Planner', 'स्मार्ट फसल योजनाकार खोलें')}
            </Button>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function Picker({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
      <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
}
