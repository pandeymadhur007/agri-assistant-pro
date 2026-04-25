import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, User, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) navigate('/');
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split('@')[0],
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: language === 'hi' ? 'यह ईमेल पहले से रजिस्टर्ड है' : 'Email already registered',
            description: language === 'hi' ? 'कृपया लॉगिन करें या दूसरा ईमेल उपयोग करें।' : 'Please login or use a different email.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        // Create profile
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          display_name: displayName || email.split('@')[0],
          phone: phone || null,
          language: language,
        });

        // Assign default farmer role
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: 'farmer',
        });

        toast({
          title: language === 'hi' ? 'अकाउंट बन गया!' : 'Account Created!',
          description: language === 'hi' ? 'आप अब लॉग इन हैं।' : 'You are now logged in.',
        });

        navigate('/');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: language === 'hi' ? 'त्रुटि' : 'Error',
        description: error.message || (language === 'hi' ? 'साइन अप में समस्या हुई।' : 'Failed to sign up.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login')) {
          toast({
            title: language === 'hi' ? 'गलत ईमेल या पासवर्ड' : 'Invalid email or password',
            description: language === 'hi' ? 'कृपया सही जानकारी दें।' : 'Please check your credentials.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: language === 'hi' ? 'लॉगिन सफल!' : 'Login Successful!',
      });

      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: language === 'hi' ? 'त्रुटि' : 'Error',
        description: error.message || (language === 'hi' ? 'लॉगिन में समस्या हुई।' : 'Failed to login.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    en: {
      title: 'Welcome to Gram AI',
      subtitle: 'Login or create account to access all features',
      login: 'Login',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      name: 'Your Name',
      phone: 'Phone (Optional)',
      loginBtn: 'Login',
      signupBtn: 'Create Account',
      loggingIn: 'Logging in...',
      creatingAccount: 'Creating account...',
    },
    hi: {
      title: 'ग्राम AI में आपका स्वागत है',
      subtitle: 'सभी सुविधाओं के लिए लॉगिन करें या अकाउंट बनाएं',
      login: 'लॉगिन',
      signup: 'साइन अप',
      email: 'ईमेल',
      password: 'पासवर्ड',
      name: 'आपका नाम',
      phone: 'फोन (वैकल्पिक)',
      loginBtn: 'लॉगिन',
      signupBtn: 'अकाउंट बनाएं',
      loggingIn: 'लॉगिन हो रहा है...',
      creatingAccount: 'अकाउंट बन रहा है...',
    }
  };

  const l = labels[language as keyof typeof labels] || labels.en;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
              ग्र
            </div>
            <CardTitle className="text-2xl">{l.title}</CardTitle>
            <CardDescription>{l.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{l.login}</TabsTrigger>
                <TabsTrigger value="signup">{l.signup}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{l.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{l.password}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {l.loggingIn}
                      </>
                    ) : (
                      l.loginBtn
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{l.name}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">{l.phone}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{l.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{l.password}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {l.creatingAccount}
                      </>
                    ) : (
                      l.signupBtn
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;