import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO } from '@/components/SEO';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh',
];

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [step, setStep] = useState<'choose' | 'profile'>('choose');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [accountType, setAccountType] = useState<'farmer' | 'buyer' | 'other'>('farmer');
  const [accountTypeOther, setAccountTypeOther] = useState('');

  useEffect(() => {
    // Guest (anonymous) sessions are created by chat — they are not real logins.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && !data.user.is_anonymous) checkProfile(data.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      if (u && !u.is_anonymous) setTimeout(() => checkProfile(u.id), 0);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async (uid: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, state, phone, onboarding_completed')
      .eq('user_id', uid)
      .maybeSingle();
    if (data?.display_name && data?.state) {
      navigate(data?.onboarding_completed ? '/my-farm' : '/onboarding');
    } else {
      // pre-fill what we already have
      if (data?.display_name) setName(data.display_name);
      if (data?.state) setState(data.state);
      if (data?.phone) setPhone(data.phone);
      setStep('profile');
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: `${window.location.origin}/login`,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;

      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (data.user && !data.user.is_anonymous) {
        await checkProfile(data.user.id);
      }
    } catch (error) {
      toast({
        title: 'Google sign-in failed',
        description: `${t('Check that this website is allowed for Google sign-in in your authentication settings.', 'जांचें कि आपकी प्रमाणीकरण सेटिंग में इस वेबसाइट से Google साइन-इन की अनुमति है।')} (${window.location.origin})`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (!name.trim() || !state.trim() || !phone.trim()) {
      toast({ title: language === 'hi' ? 'सभी फ़ील्ड भरें' : 'Please fill all fields', variant: 'destructive' });
      return;
    }
    if (accountType === 'other' && !accountTypeOther.trim()) {
      toast({ title: language === 'hi' ? 'कृपया बताएं' : 'Please specify your role', variant: 'destructive' });
      return;
    }
    setLoading(true);
    // Upsert profile with all captured fields
    const { error: pErr } = await supabase.from('profiles').upsert({
      user_id: user.id,
      display_name: name.trim(),
      state: state.trim(),
      phone: phone.trim(),
      account_type_other: accountType === 'other' ? accountTypeOther.trim() : null,
      language,
    }, { onConflict: 'user_id' });

    // Insert role only if none exists
    const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', user.id).maybeSingle();
    if (!existing) {
      await supabase.from('user_roles').insert({ user_id: user.id, role: accountType });
    }
    setLoading(false);
    if (pErr) {
      toast({ title: 'Could not save profile', description: pErr.message, variant: 'destructive' });
      return;
    }
    toast({ title: language === 'hi' ? 'स्वागत है!' : 'Welcome!' });
    navigate('/onboarding');
  };

  const t = (en: string, hi: string) => (language === 'hi' ? hi : en);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <SEO title="Sign In" description="Sign in to Gram AI to save scans, reminders and personalised farming advice." />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            {step === 'profile' && (
              <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-2" onClick={() => setStep('choose')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t('Back', 'वापस')}
              </Button>
            )}
            <CardTitle className="text-2xl">
              {step === 'profile' ? t('Complete your profile', 'अपनी प्रोफ़ाइल पूरी करें') : t('Login to Gram AI', 'ग्राम AI में लॉगिन')}
            </CardTitle>
            <CardDescription>
              {step === 'profile'
                ? t('Tell us a bit about you', 'अपने बारे में बताएं')
                : t('Login is optional — all features work without it', 'लॉगिन वैकल्पिक है — सभी सुविधाएं बिना लॉगिन के भी काम करती हैं')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'choose' && (
              <>
                <Button variant="outline" className="w-full h-12" onClick={handleGoogle} disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><GoogleIcon /><span className="ml-3">{t('Continue with Google', 'Google से जारी रखें')}</span></>}
                </Button>
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-2 text-xs text-muted-foreground">{t('or', 'या')}</span>
                  </div>
                </div>
                <Button variant="secondary" className="w-full h-12" onClick={() => navigate('/auth')} disabled={loading}>
                  {t('Continue with email', 'ईमेल से जारी रखें')}
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate('/')}>
                  {t('Skip for now', 'अभी छोड़ें')}
                </Button>
              </>
            )}

            {step === 'profile' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">{t('Full name', 'पूरा नाम')}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('Phone number', 'फोन नंबर')}</Label>
                  <Input id="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">{t('State', 'राज्य')}</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger id="state"><SelectValue placeholder={t('Select your state', 'अपना राज्य चुनें')} /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('Account type', 'खाता प्रकार')}</Label>
                  <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as 'farmer' | 'buyer' | 'other')} className="grid grid-cols-3 gap-2">
                    <Label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="farmer" /> {t('Farmer', 'किसान')}
                    </Label>
                    <Label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="buyer" /> {t('Buyer', 'खरीदार')}
                    </Label>
                    <Label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="other" /> {t('Other', 'अन्य')}
                    </Label>
                  </RadioGroup>
                  {accountType === 'other' && (
                    <Input
                      placeholder={t('Please specify (e.g. agronomist, NGO, student)', 'कृपया बताएं (जैसे एग्रोनोमिस्ट, एनजीओ, छात्र)')}
                      value={accountTypeOther}
                      onChange={(e) => setAccountTypeOther(e.target.value)}
                      maxLength={60}
                    />
                  )}
                </div>
                <Button className="w-full" onClick={saveProfile} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('Save & Continue', 'सेव करें')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
