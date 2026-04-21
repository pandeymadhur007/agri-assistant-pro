import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogOut, User as UserIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Profile() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [role, setRole] = useState<string>('farmer');

  const t = (en: string, hi: string) => (language === 'hi' ? hi : en);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setEmail(user.email ?? null);
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (profile) {
        setName(profile.display_name ?? '');
        setState(profile.state ?? '');
        setPhone(profile.phone ?? user.phone ?? '');
      } else {
        setPhone(user.phone ?? '');
      }
      const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
      if (roleRow) setRole(roleRow.role);
      setLoading(false);
    })();
  }, [navigate]);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      display_name: name,
      state,
      phone,
      language,
    }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('Profile updated', 'प्रोफ़ाइल अपडेट हुई') });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30 pb-24 md:pb-0">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                {(name || email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle>{name || t('Your Profile', 'आपकी प्रोफ़ाइल')}</CardTitle>
                <p className="text-sm text-muted-foreground">{email || phone}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent text-xs font-medium capitalize">{role}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{t('Name', 'नाम')}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('Phone', 'फोन')}</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('State', 'राज्य')}</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button onClick={save} disabled={saving} className="flex-1">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t('Save changes', 'सेव करें')}
                  </Button>
                  <Button variant="outline" onClick={logout} className="text-destructive border-destructive/50">
                    <LogOut className="h-4 w-4 mr-2" /> {t('Logout', 'लॉगआउट')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
