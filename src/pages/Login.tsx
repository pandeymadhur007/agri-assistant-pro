import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Phone, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.07-1.1-.16-1.6H12z"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [step, setStep] = useState<'choose' | 'phone' | 'otp' | 'profile'>('choose');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [accountType, setAccountType] = useState<'farmer' | 'buyer'>('farmer');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        // Check if profile exists; if not, ask for details
        checkProfile(data.session.user.id);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) checkProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('display_name, state').eq('user_id', uid).maybeSingle();
    if (data?.display_name && data?.state) {
      navigate('/');
    } else {
      setStep('profile');
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin + '/login' });
    if (result.error) {
      toast({ title: 'Google sign-in failed', description: String(result.error.message ?? result.error), variant: 'destructive' });
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!phone.match(/^\+?[1-9]\d{7,14}$/)) {
      toast({ title: language === 'hi' ? 'सही फोन नंबर डालें' : 'Enter a valid phone number (with country code)', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const formatted = phone.startsWith('+') ? phone : `+91${phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);
    if (error) {
      toast({ title: 'OTP failed', description: error.message, variant: 'destructive' });
    } else {
      setStep('otp');
      toast({ title: language === 'hi' ? 'OTP भेजा गया' : 'OTP sent' });
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    const formatted = phone.startsWith('+') ? phone : `+91${phone}`;
    const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' });
    setLoading(false);
    if (error) {
      toast({ title: 'Invalid OTP', description: error.message, variant: 'destructive' });
    }
    // onAuthStateChange will trigger checkProfile
  };

  const saveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (!name || !state) {
      toast({ title: language === 'hi' ? 'सभी फ़ील्ड भरें' : 'Please fill all fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    // Upsert profile
    const { error: pErr } = await supabase.from('profiles').upsert({
      user_id: user.id,
      display_name: name,
      state,
      phone: user.phone ?? phone ?? null,
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
    navigate('/');
  };

  const t = (en: string, hi: string) => (language === 'hi' ? hi : en);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            {step !== 'choose' && step !== 'profile' && (
              <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-2" onClick={() => setStep(step === 'otp' ? 'phone' : 'choose')}>
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
                <Button variant="outline" className="w-full h-12" onClick={() => setStep('phone')}>
                  <Phone className="h-5 w-5 mr-3" /> {t('Continue with Phone', 'फोन से जारी रखें')}
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate('/')}>
                  {t('Skip for now', 'अभी छोड़ें')}
                </Button>
              </>
            )}

            {step === 'phone' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('Phone number', 'फोन नंबर')}</Label>
                  <Input id="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <p className="text-xs text-muted-foreground">{t('Include country code (e.g. +91)', 'देश कोड शामिल करें (जैसे +91)')}</p>
                </div>
                <Button className="w-full" onClick={sendOtp} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('Send OTP', 'OTP भेजें')}
                </Button>
              </>
            )}

            {step === 'otp' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">{t('Enter 6-digit OTP', '6-अंकीय OTP दर्ज करें')}</Label>
                  <Input id="otp" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
                </div>
                <Button className="w-full" onClick={verifyOtp} disabled={loading || otp.length < 4}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('Verify & Login', 'सत्यापित करें')}
                </Button>
              </>
            )}

            {step === 'profile' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">{t('Your name', 'आपका नाम')}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">{t('State', 'राज्य')}</Label>
                  <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="Maharashtra" />
                </div>
                <div className="space-y-2">
                  <Label>{t('Account type', 'खाता प्रकार')}</Label>
                  <RadioGroup value={accountType} onValueChange={(v) => setAccountType(v as 'farmer' | 'buyer')} className="grid grid-cols-2 gap-2">
                    <Label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="farmer" /> {t('Farmer', 'किसान')}
                    </Label>
                    <Label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-accent">
                      <RadioGroupItem value="buyer" /> {t('Buyer', 'खरीदार')}
                    </Label>
                  </RadioGroup>
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
