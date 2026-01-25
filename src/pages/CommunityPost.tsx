import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CROP_CATEGORIES = [
  { en: 'Wheat', hi: 'गेहूं' },
  { en: 'Rice/Paddy', hi: 'धान' },
  { en: 'Cotton', hi: 'कपास' },
  { en: 'Sugarcane', hi: 'गन्ना' },
  { en: 'Vegetables', hi: 'सब्जियां' },
  { en: 'Fruits', hi: 'फल' },
  { en: 'Pulses', hi: 'दालें' },
  { en: 'Oilseeds', hi: 'तिलहन' },
  { en: 'Other', hi: 'अन्य' },
];

const CommunityNewPost = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [cropCategory, setCropCategory] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUser(user);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
      
      const { error } = await supabase.from('community_posts').insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        crop_category: cropCategory || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
      });

      if (error) throw error;

      toast({
        title: language === 'hi' ? 'सवाल पोस्ट हो गया!' : 'Question Posted!',
        description: language === 'hi' ? 'आपका सवाल समुदाय में पोस्ट हो गया है।' : 'Your question has been posted to the community.',
      });

      navigate('/community');
    } catch (error) {
      console.error('Error posting:', error);
      toast({
        title: language === 'hi' ? 'त्रुटि' : 'Error',
        description: language === 'hi' ? 'पोस्ट करने में समस्या हुई।' : 'Failed to post your question.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    en: {
      back: 'Back to Community',
      title: 'Ask a Question',
      subtitle: 'Get help from fellow farmers and experts',
      questionTitle: 'Question Title',
      questionTitlePlaceholder: 'E.g., Why are my wheat leaves turning yellow?',
      details: 'Details',
      detailsPlaceholder: 'Describe your problem in detail. Include information about your crop, soil, weather, and what you have tried...',
      cropCategory: 'Crop Category',
      selectCrop: 'Select crop',
      tags: 'Tags (comma separated)',
      tagsPlaceholder: 'E.g., disease, pest, irrigation',
      submit: 'Post Question',
      submitting: 'Posting...',
    },
    hi: {
      back: 'समुदाय पर वापस',
      title: 'सवाल पूछें',
      subtitle: 'साथी किसानों और विशेषज्ञों से मदद लें',
      questionTitle: 'सवाल का शीर्षक',
      questionTitlePlaceholder: 'जैसे: मेरी गेहूं की पत्तियां पीली क्यों हो रही हैं?',
      details: 'विवरण',
      detailsPlaceholder: 'अपनी समस्या का विस्तार से वर्णन करें। अपनी फसल, मिट्टी, मौसम और क्या प्रयास किए हैं, इसकी जानकारी दें...',
      cropCategory: 'फसल श्रेणी',
      selectCrop: 'फसल चुनें',
      tags: 'टैग (कॉमा से अलग)',
      tagsPlaceholder: 'जैसे: रोग, कीट, सिंचाई',
      submit: 'सवाल पोस्ट करें',
      submitting: 'पोस्ट हो रहा है...',
    }
  };

  const l = labels[language as keyof typeof labels] || labels.en;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/community')} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          {l.back}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{l.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{l.subtitle}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{l.questionTitle}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={l.questionTitlePlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">{l.details}</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={l.detailsPlaceholder}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{l.cropCategory}</Label>
                <Select value={cropCategory} onValueChange={setCropCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={l.selectCrop} />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.en} value={cat.en}>
                        {language === 'hi' ? cat.hi : cat.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">{l.tags}</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={l.tagsPlaceholder}
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={loading || !title.trim() || !content.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {l.submitting}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {l.submit}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default CommunityNewPost;