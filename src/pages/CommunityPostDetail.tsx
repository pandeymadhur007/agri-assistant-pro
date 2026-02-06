import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ThumbsUp, MessageSquare, Send, Loader2, Clock, BadgeCheck, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Validation constants for replies
const REPLY_MIN_LENGTH = 10;
const REPLY_MAX_LENGTH = 3000;

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

interface Reply {
  id: string;
  content: string;
  upvotes: number;
  is_expert_answer: boolean;
  is_accepted: boolean;
  created_at: string;
  user_id: string;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
}

const CommunityPostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [expertIds, setExpertIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkUser();
    if (id) fetchPost();
  }, [id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      // Fetch user's upvotes
      const { data } = await supabase
        .from('upvotes')
        .select('post_id, reply_id')
        .eq('user_id', user.id);
      if (data) {
        const upvoteSet = new Set<string>();
        data.forEach(u => {
          if (u.post_id) upvoteSet.add(`post_${u.post_id}`);
          if (u.reply_id) upvoteSet.add(`reply_${u.reply_id}`);
        });
        setUserUpvotes(upvoteSet);
      }
    }
  };

  const fetchPost = async () => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (postError) throw postError;
      setPost(postData);

      const { data: repliesData } = await supabase
        .from('community_replies')
        .select('*')
        .eq('post_id', id)
        .order('upvotes', { ascending: false });

      if (repliesData) setReplies(repliesData);

      // Fetch profiles
      const userIds = [postData.user_id, ...(repliesData?.map(r => r.user_id) || [])];
      const uniqueIds = [...new Set(userIds)];
      
      if (uniqueIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', uniqueIds);
        
        if (profilesData) {
          const profileMap: Record<string, UserProfile> = {};
          profilesData.forEach(p => { profileMap[p.user_id] = p; });
          setProfiles(profileMap);
        }

        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('user_id', uniqueIds)
          .eq('role', 'expert');
        
        if (rolesData) {
          setExpertIds(new Set(rolesData.map(r => r.user_id)));
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (type: 'post' | 'reply', targetId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const key = `${type}_${targetId}`;
    const hasUpvoted = userUpvotes.has(key);

    try {
      if (hasUpvoted) {
        // Remove upvote
        await supabase
          .from('upvotes')
          .delete()
          .eq('user_id', user.id)
          .eq(type === 'post' ? 'post_id' : 'reply_id', targetId);
        
        setUserUpvotes(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        // Add upvote
        await supabase
          .from('upvotes')
          .insert({
            user_id: user.id,
            [type === 'post' ? 'post_id' : 'reply_id']: targetId,
          });
        
        setUserUpvotes(prev => new Set([...prev, key]));
      }
      
      // Refresh data
      fetchPost();
    } catch (error) {
      console.error('Error toggling upvote:', error);
    }
  };

  const isReplyValid = () => {
    const trimmedContent = replyContent.trim();
    return trimmedContent.length >= REPLY_MIN_LENGTH && trimmedContent.length <= REPLY_MAX_LENGTH;
  };

  const handleReply = async () => {
    if (!user || !id) return;

    const trimmedContent = replyContent.trim();
    
    // Validate reply
    if (trimmedContent.length < REPLY_MIN_LENGTH) {
      toast({
        title: language === 'hi' ? 'सत्यापन त्रुटि' : 'Validation Error',
        description: language === 'hi' 
          ? `जवाब कम से कम ${REPLY_MIN_LENGTH} अक्षरों का होना चाहिए।`
          : `Reply must be at least ${REPLY_MIN_LENGTH} characters.`,
        variant: 'destructive',
      });
      return;
    }
    
    if (trimmedContent.length > REPLY_MAX_LENGTH) {
      toast({
        title: language === 'hi' ? 'सत्यापन त्रुटि' : 'Validation Error',
        description: language === 'hi'
          ? `जवाब ${REPLY_MAX_LENGTH} अक्षरों से अधिक नहीं हो सकता।`
          : `Reply cannot exceed ${REPLY_MAX_LENGTH} characters.`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const isExpert = expertIds.has(user.id);
      
      await supabase.from('community_replies').insert({
        post_id: id,
        user_id: user.id,
        content: trimmedContent.slice(0, REPLY_MAX_LENGTH),
        is_expert_answer: isExpert,
      });

      setReplyContent('');
      fetchPost();
      
      toast({
        title: language === 'hi' ? 'जवाब पोस्ट हो गया!' : 'Reply Posted!',
      });
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: language === 'hi' ? 'त्रुटि' : 'Error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const labels = {
    en: {
      back: 'Back to Community',
      expert: 'Expert',
      resolved: 'Resolved',
      upvotes: 'upvotes',
      replies: 'Replies',
      writeReply: 'Write your reply...',
      postReply: 'Post Reply',
      loginToReply: 'Login to Reply',
      noReplies: 'No replies yet. Be the first to help!',
      loading: 'Loading...',
      anonymous: 'Farmer',
    },
    hi: {
      back: 'समुदाय पर वापस',
      expert: 'विशेषज्ञ',
      resolved: 'हल हो गया',
      upvotes: 'अपवोट',
      replies: 'जवाब',
      writeReply: 'अपना जवाब लिखें...',
      postReply: 'जवाब पोस्ट करें',
      loginToReply: 'जवाब देने के लिए लॉगिन करें',
      noReplies: 'अभी कोई जवाब नहीं। पहले मदद करने वाले बनें!',
      loading: 'लोड हो रहा है...',
      anonymous: 'किसान',
    }
  };

  const l = labels[language as keyof typeof labels] || labels.en;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{l.loading}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => navigate('/community')} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            {l.back}
          </Button>
          <p className="text-center text-muted-foreground">Post not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  const postProfile = profiles[post.user_id];
  const postIsExpert = expertIds.has(post.user_id);
  const postHasUpvoted = userUpvotes.has(`post_${post.id}`);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate('/community')} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          {l.back}
        </Button>

        {/* Main Post */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">
                {postProfile?.display_name || l.anonymous}
              </span>
              {postIsExpert && (
                <Badge className="bg-blue-600 text-xs gap-1">
                  <BadgeCheck className="h-3 w-3" />
                  {l.expert}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                <Clock className="h-3 w-3 inline mr-1" />
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
              {post.is_resolved && (
                <Badge className="bg-green-600 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {l.resolved}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">{post.title}</h1>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap mb-4">{post.content}</p>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {post.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}

            <Button
              variant={postHasUpvoted ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => handleUpvote('post', post.id)}
            >
              <ThumbsUp className="h-4 w-4" />
              {post.upvotes} {l.upvotes}
            </Button>
          </CardContent>
        </Card>

        {/* Reply Form */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value.slice(0, REPLY_MAX_LENGTH))}
              placeholder={l.writeReply}
              rows={3}
              disabled={!user}
              minLength={REPLY_MIN_LENGTH}
              maxLength={REPLY_MAX_LENGTH}
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {replyContent.length}/{REPLY_MAX_LENGTH} ({language === 'hi' ? `न्यूनतम ${REPLY_MIN_LENGTH}` : `min ${REPLY_MIN_LENGTH}`})
              </p>
              <Button
                onClick={user ? handleReply : () => navigate('/auth')}
                disabled={submitting || (user && !isReplyValid())}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {user ? l.postReply : l.loginToReply}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{l.replies} ({replies.length})</h2>
        </div>

        {replies.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{l.noReplies}</p>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => {
              const replyProfile = profiles[reply.user_id];
              const replyIsExpert = expertIds.has(reply.user_id);
              const replyHasUpvoted = userUpvotes.has(`reply_${reply.id}`);

              return (
                <Card key={reply.id} className={reply.is_expert_answer ? 'border-blue-200 bg-blue-50/50' : ''}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">
                        {replyProfile?.display_name || l.anonymous}
                      </span>
                      {replyIsExpert && (
                        <Badge className="bg-blue-600 text-xs gap-1">
                          <BadgeCheck className="h-3 w-3" />
                          {l.expert}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap mb-3">{reply.content}</p>
                    <Button
                      variant={replyHasUpvoted ? 'default' : 'outline'}
                      size="sm"
                      className="gap-2"
                      onClick={() => handleUpvote('reply', reply.id)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {reply.upvotes}
                    </Button>
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

export default CommunityPostDetail;