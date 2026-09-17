import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, CalendarDays, CheckCircle2, ChevronRight, CloudSun, Droplets,
  FlaskConical, Leaf, Loader2, MapPin, Pencil, Ruler, Save, ScanLine, Sprout,
  Target, Tractor, X,
} from 'lucide-react';
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
import { useFarmPlan } from '@/hooks/useFarmPlan';
import { useClimateAlerts } from '@/hooks/useClimateAlerts';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const LAND = [['small', 'Less than 2 acres'], ['medium', '2 – 10 acres'], ['large', 'More than 10 acres']];
const SOIL = [['loamy', 'Loamy'], ['clay', 'Clay'], ['sandy', 'Sandy'], ['black', 'Black'], ['red', 'Red'], ['alluvial', 'Alluvial'], ['unknown', "Don't know"]];
const IRRIGATION = [['rainfed', 'Rain-fed'], ['canal', 'Canal'], ['borewell', 'Borewell / tube well'], ['drip', 'Drip / sprinkler']];
const GOALS = [['higher_yield', 'Higher yield'], ['lower_cost', 'Lower input cost'], ['better_price', 'Better market price'], ['organic', 'Move to organic']];

const pretty = (list: string[][], value?: string | null) => list.find(([key]) => key === value)?.[1] ?? value ?? '—';
const guideIcons = { crop: Sprout, water: Droplets, nutrient: FlaskConical, pest: ScanLine, weather: CloudSun };

export default function MyFarm() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { profile, loading, userId, save } = useFarmProfile();
  const isHi = language === 'hi' || language === 'mr';
  const t = (en: string, hi: string) => isHi ? hi : en;
  const age = cropAgeDays(profile);
  const { priorities, guidance, weather, weatherLoading, reminders, stage } = useFarmPlan(profile, userId, age, isHi);
  const { alerts } = useClimateAlerts(language);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    location: '', state: '', land_size: '', soil_type: '', irrigation: '', current_crop: '', crop_sown_date: '', farming_goal: '',
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (!data.user) navigate('/login'); });
  }, [navigate]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      location: profile.location ?? '', state: profile.state ?? '', land_size: profile.land_size ?? '',
      soil_type: profile.soil_type ?? '', irrigation: profile.irrigation ?? '', current_crop: profile.current_crop ?? '',
      crop_sown_date: profile.crop_sown_date ?? '', farming_goal: profile.farming_goal ?? '',
    });
  }, [profile]);

  const submit = async () => {
    setSaving(true);
    const { error } = await save({ ...form, crop_sown_date: form.crop_sown_date || null, onboarding_completed: true });
    setSaving(false);
    if (error) {
      toast({ title: t('Could not save', 'सेव नहीं हुआ'), description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: t('Your personalized plan is updated', 'आपकी व्यक्तिगत योजना अपडेट हो गई') });
    setEditing(false);
  };

  const profileFacts = useMemo(() => [
    { icon: MapPin, label: t('Location', 'स्थान'), value: [profile?.location, profile?.state].filter(Boolean).join(', ') || '—' },
    { icon: Ruler, label: t('Land', 'जमीन'), value: pretty(LAND, profile?.land_size) },
    { icon: Leaf, label: t('Soil', 'मिट्टी'), value: pretty(SOIL, profile?.soil_type) },
    { icon: Droplets, label: t('Water', 'सिंचाई'), value: pretty(IRRIGATION, profile?.irrigation) },
    { icon: Sprout, label: t('Crop', 'फसल'), value: profile?.current_crop || '—' },
    { icon: Target, label: t('Goal', 'लक्ष्य'), value: pretty(GOALS, profile?.farming_goal) },
  ], [profile, isHi]);

  if (loading) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-24 md:pb-0">
      <SEO title="My Farm — Personalized Farming Plan" description="Your personalized daily farming plan, priorities, crop guidance, weather advice, timeline and reminders." />
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border/60 bg-muted/30 px-4 py-8 md:py-10">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-2"><Tractor className="h-4 w-4" />{t('Personalized for your farm', 'आपके खेत के लिए व्यक्तिगत')}</div>
                <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground">{t('My Farm', 'मेरा खेत')}</h1>
                <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
                  {t('Your daily plan uses your farm details, crop stage, local weather and goals.', 'आपकी दैनिक योजना खेत की जानकारी, फसल की अवस्था, स्थानीय मौसम और लक्ष्य के अनुसार बनती है।')}
                </p>
              </div>
              {profile?.onboarding_completed && !editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="shrink-0"><Pencil className="h-4 w-4 mr-1.5" />{t('Edit', 'बदलें')}</Button>
              )}
            </div>

            {profile?.onboarding_completed && !editing && (
              <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {profileFacts.map((fact) => <div key={fact.label} className="shrink-0 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs"><fact.icon className="h-3.5 w-3.5 text-primary" /><span className="text-muted-foreground">{fact.label}</span><span className="font-semibold">{fact.value}</span></div>)}
              </div>
            )}
          </div>
        </section>

        <div className="container mx-auto max-w-5xl px-4 py-7 md:py-10 space-y-10">
          {!profile?.onboarding_completed && !editing ? (
            <Card className="border-primary/25"><CardContent className="p-7 text-center space-y-4"><Tractor className="h-10 w-10 mx-auto text-primary" /><div><h2 className="font-display text-2xl font-semibold">{t('Build your farming plan', 'अपनी खेती योजना बनाएं')}</h2><p className="text-sm text-muted-foreground mt-2">{t('Add your land, crop, soil, irrigation, sowing date and goal to start.', 'शुरू करने के लिए जमीन, फसल, मिट्टी, सिंचाई, बुवाई की तारीख और लक्ष्य जोड़ें।')}</p></div><Button onClick={() => navigate('/onboarding')} className="h-12">{t('Set up My Farm', 'मेरा खेत सेट करें')}</Button></CardContent></Card>
          ) : editing ? (
            <EditFarm form={form} setForm={setForm} saving={saving} submit={submit} cancel={() => setEditing(false)} t={t} />
          ) : (
            <>
              <section aria-labelledby="priorities-title">
                <div className="flex items-end justify-between gap-3 mb-4"><div><p className="text-xs font-semibold uppercase text-primary">{t('Your daily plan', 'आपकी दैनिक योजना')}</p><h2 id="priorities-title" className="font-display text-2xl md:text-3xl font-semibold">{t("Today’s Priorities", 'आज की प्राथमिकताएं')}</h2></div>{weatherLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : weather && <span className="text-sm text-muted-foreground whitespace-nowrap">{weather.temperature}°C · {weather.rainProbability}% {t('rain', 'बारिश')}</span>}</div>
                <div className="grid md:grid-cols-3 gap-3">
                  {priorities.map((item, index) => <motion.div key={item.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06 }} className={cn('rounded-lg border p-4', item.tone === 'warning' ? 'border-destructive/25 bg-destructive/5' : item.tone === 'weather' ? 'border-info/25 bg-info/5' : 'border-border bg-card')}><div className="flex items-start gap-3"><div className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{index + 1}</div><div><h3 className="font-semibold leading-snug">{item.title}</h3><p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.detail}</p></div></div></motion.div>)}
                </div>
              </section>

              {alerts.length > 0 && <section aria-labelledby="alerts-title"><h2 id="alerts-title" className="font-display text-2xl font-semibold mb-4">{t('Active Alerts', 'सक्रिय अलर्ट')}</h2><div className="space-y-2">{alerts.slice(0, 3).map(alert => <div key={alert.id} className="flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4"><AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" /><div><p className="font-semibold">{alert.title}</p><p className="text-sm text-muted-foreground mt-1">{alert.message}</p></div></div>)}</div></section>}

              <section aria-labelledby="guidance-title"><div className="mb-4"><p className="text-xs font-semibold uppercase text-primary">{profile?.current_crop || t('Your crop', 'आपकी फसल')} · {age === null ? stage : `${t('Day', 'दिन')} ${age}`}</p><h2 id="guidance-title" className="font-display text-2xl md:text-3xl font-semibold">{t('Personalized Guidance', 'व्यक्तिगत मार्गदर्शन')}</h2></div><div className="divide-y divide-border border-y border-border">{guidance.map(item => { const Icon = guideIcons[item.key as keyof typeof guideIcons] || Leaf; return <div key={item.key} className="flex gap-4 py-5"><div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></div><div><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.detail}</p></div></div>; })}</div></section>

              <section className="grid md:grid-cols-[1.3fr_.7fr] gap-8" aria-labelledby="timeline-title">
                <div><h2 id="timeline-title" className="font-display text-2xl font-semibold mb-5">{t('Crop Timeline', 'फसल समयरेखा')}</h2><div className="relative pl-6 border-l border-border space-y-7">{[
                  { title: t('Sowing', 'बुवाई'), detail: profile?.crop_sown_date ? new Date(`${profile.crop_sown_date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : t('Add sowing date', 'बुवाई की तारीख जोड़ें'), done: age !== null },
                  { title: t('Current stage', 'वर्तमान अवस्था'), detail: stage, done: true },
                  { title: t('Next review', 'अगली समीक्षा'), detail: t('Review progress and update crop condition in 7 days.', '7 दिनों में प्रगति देखें और फसल की स्थिति अपडेट करें।'), done: false },
                  { title: t('Harvest planning', 'कटाई की योजना'), detail: t('Gram AI will adjust this as the crop grows.', 'फसल बढ़ने के साथ ग्राम AI इसे अपडेट करेगा।'), done: false },
                ].map((point) => <div key={point.title} className="relative"><span className={cn('absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-background', point.done ? 'bg-primary' : 'bg-muted-foreground')} /><h3 className="font-semibold">{point.title}</h3><p className="text-sm text-muted-foreground mt-1 capitalize">{point.detail}</p></div>)}</div></div>
                <div><div className="flex items-center justify-between mb-5"><h2 className="font-display text-2xl font-semibold">{t('Reminders', 'रिमाइंडर')}</h2><CalendarDays className="h-5 w-5 text-primary" /></div>{reminders.length ? <div className="space-y-3">{reminders.map(reminder => <div key={reminder.id} className="rounded-lg border border-border p-3"><p className="text-xs text-primary font-semibold">{new Date(`${reminder.reminder_date}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</p><p className="font-medium text-sm mt-1">{reminder.message || reminder.reminder_type || t('Farm task', 'खेत का काम')}</p></div>)}</div> : <div className="rounded-lg border border-dashed border-border p-5 text-center"><CheckCircle2 className="h-6 w-6 text-primary mx-auto" /><p className="text-sm font-medium mt-2">{t('No upcoming reminders', 'कोई आगामी रिमाइंडर नहीं')}</p><p className="text-xs text-muted-foreground mt-1">{t('Your next farm tasks will appear here.', 'आपके अगले खेत के काम यहां दिखाई देंगे।')}</p></div>}</div>
              </section>

              <section className="border-t border-border pt-7"><div className="grid sm:grid-cols-2 gap-3"><Button className="h-12 justify-between" onClick={() => navigate('/chat')}><span>{t('Ask Gram AI about my farm', 'मेरे खेत के बारे में ग्राम AI से पूछें')}</span><ChevronRight className="h-4 w-4" /></Button><Button variant="outline" className="h-12 justify-between" onClick={() => navigate('/scan')}><span>{t('Scan my crop', 'मेरी फसल स्कैन करें')}</span><ScanLine className="h-4 w-4 text-primary" /></Button></div></section>
            </>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function EditFarm({ form, setForm, saving, submit, cancel, t }: { form: Record<string, string>; setForm: (value: Record<string, string>) => void; saving: boolean; submit: () => void; cancel: () => void; t: (en: string, hi: string) => string }) {
  return <Card><CardContent className="p-5 md:p-7 grid md:grid-cols-2 gap-4"><Field label={t('Village / district', 'गाँव / जिला')}><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} maxLength={80} /></Field><Field label={t('State', 'राज्य')}><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={60} /></Field><Field label={t('Land size', 'जमीन')}><Picker value={form.land_size} onChange={value => setForm({ ...form, land_size: value })} options={LAND} /></Field><Field label={t('Soil', 'मिट्टी')}><Picker value={form.soil_type} onChange={value => setForm({ ...form, soil_type: value })} options={SOIL} /></Field><Field label={t('Irrigation', 'सिंचाई')}><Picker value={form.irrigation} onChange={value => setForm({ ...form, irrigation: value })} options={IRRIGATION} /></Field><Field label={t('Current crop', 'वर्तमान फसल')}><Input value={form.current_crop} onChange={e => setForm({ ...form, current_crop: e.target.value })} maxLength={40} /></Field><Field label={t('Sowing date', 'बुवाई की तारीख')}><Input type="date" max={new Date().toISOString().slice(0, 10)} value={form.crop_sown_date} onChange={e => setForm({ ...form, crop_sown_date: e.target.value })} /></Field><Field label={t('Goal', 'लक्ष्य')}><Picker value={form.farming_goal} onChange={value => setForm({ ...form, farming_goal: value })} options={GOALS} /></Field><div className="md:col-span-2 flex gap-3 pt-2"><Button onClick={submit} disabled={saving} className="flex-1 h-12">{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}{t('Save & update plan', 'सेव करें और योजना अपडेट करें')}</Button><Button variant="outline" className="h-12" onClick={cancel} disabled={saving}><X className="h-4 w-4 mr-1" />{t('Cancel', 'रद्द')}</Button></div></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }
function Picker({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[][] }) { return <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger><SelectContent>{options.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>; }