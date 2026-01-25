import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, MessageSquare, ThumbsUp, Search, Plus, CheckCircle, Clock, BadgeCheck, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  crop_category: string | null;
  tags: string[] | null;
  upvotes: number;
  reply_count: number;
  is_resolved: boolean;
  created_at: string;
  user_id: string;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

const Community = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [expertIds, setExpertIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
    fetchPosts();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      if (postsData) {
        setPosts(postsData);
        
        // Fetch profiles for all post authors
        const userIds = [...new Set(postsData.map(p => p.user_id))];
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', userIds);
          
          if (profilesData) {
            const profileMap: Record<string, UserProfile> = {};
            profilesData.forEach(p => { profileMap[p.user_id] = p; });
            setProfiles(profileMap);
          }

          // Fetch expert roles
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('user_id', userIds)
            .eq('role', 'expert');
          
          if (rolesData) {
            setExpertIds(new Set(rolesData.map(r => r.user_id)));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(p => 
    searchQuery === '' || 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const labels = {
    en: {
      title: 'Farmer Community',
      subtitle: 'Ask questions, share knowledge, help each other',
      searchPlaceholder: 'Search questions...',
      askQuestion: 'Ask Question',
      login: 'Login to Ask',
      replies: 'replies',
      upvotes: 'upvotes',
      resolved: 'Resolved',
      expert: 'Expert',
      noQuestions: 'No questions yet. Be the first to ask!',
      loading: 'Loading community...',
      anonymous: 'Farmer',
    },
    hi: {
      title: 'किसान समुदाय',
      subtitle: 'सवाल पूछें, ज्ञान साझा करें, एक दूसरे की मदद करें',
      searchPlaceholder: 'प्रश्न खोजें...',
      askQuestion: 'सवाल पूछें',
      login: 'पूछने के लिए लॉगिन करें',
      replies: 'जवाब',
      upvotes: 'अपवोट',
      resolved: 'हल हो गया',
      expert: 'विशेषज्ञ',
      noQuestions: 'अभी कोई सवाल नहीं। पहले पूछने वाले बनें!',
      loading: 'समुदाय लोड हो रहा है...',
      anonymous: 'किसान',
    }
  };

  const l = labels[language as keyof typeof labels] || labels.en;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{l.title}</h1>
              <p className="text-sm text-muted-foreground">{l.subtitle}</p>
            </div>
          </div>
          <Button 
            onClick={() => user ? navigate('/community/post') : navigate('/auth')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {user ? l.askQuestion : l.login}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={l.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Posts */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{l.loading}</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{l.noQuestions}</div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const profile = profiles[post.user_id];
              const isExpert = expertIds.has(post.user_id);
              const displayName = profile?.display_name || l.anonymous;

              return (
                <Card 
                  key={post.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/community/post/${post.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-muted-foreground">{displayName}</span>
                          {isExpert && (
                            <Badge className="bg-blue-600 text-xs gap-1">
                              <BadgeCheck className="h-3 w-3" />
                              {l.expert}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg line-clamp-2">{post.title}</h3>
                      </div>
                      {post.is_resolved && (
                        <Badge className="bg-green-600 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {l.resolved}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {post.upvotes} {l.upvotes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {post.reply_count} {l.replies}
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Community;