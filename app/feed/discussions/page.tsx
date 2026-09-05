'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation'; 
import { MessageSquare, Send, ShieldCheck, CheckCircle2, AlertCircle, Flame, Users, Star, Crown, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

export default function DiscussionsPage() {
  const supabase = createClient();
  const router = useRouter(); 
  const pathname = usePathname();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');

  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [isSubmittingDiscussion, setIsSubmittingDiscussion] = useState(false);
  const [animatingHype, setAnimatingHype] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => { 
    fetchFeedAndUser(); 
  }, []); 

  // Realtime
  useEffect(() => {
    const feedChannel = supabase.channel('public:posts').on(
        'postgres_changes', { event: '*', schema: 'public', table: 'posts' },
        async (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new.channel !== 'featured') {
            const { data: newPost } = await supabase.from('posts').select(`id, content, created_at, athlete_id, likes, comments, athletes (id, first_name, last_name, avatar_url, equipped_border, is_premium)`).eq('id', payload.new.id).maybeSingle();
            if (newPost) setPosts((cur) => cur.some(p => p.id === newPost.id) ? cur : [newPost, ...cur]);
          }
          if (payload.eventType === 'UPDATE') setPosts((cur) => cur.map((p) => p.id === payload.new.id ? { ...p, ...payload.new } : p));
          if (payload.eventType === 'DELETE') setPosts((cur) => cur.filter((p) => p.id !== payload.old.id));
        }
    ).subscribe();
    return () => { supabase.removeChannel(feedChannel); };
  }, [supabase]);

  async function fetchFeedAndUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
      const { data: cData } = await supabase.from('coaches').select('*').eq('id', session.user.id).maybeSingle();
      if (cData) setViewerRole('coach');
      else {
        const { data: aData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();
        if (aData) { setViewerRole('athlete'); setCurrentUserProfile(aData); }
      }
    }
    const { data: feedData } = await supabase.from('posts')
      .select(`id, content, created_at, athlete_id, likes, comments, athletes (id, first_name, last_name, avatar_url, equipped_border, is_premium)`)
      .neq('channel', 'featured')
      .order('created_at', { ascending: false }).limit(100);
    setPosts(feedData || []);
    setLoading(false);
  }

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionContent.trim() || !currentUserId || viewerRole !== 'athlete') return;
    if (currentUserProfile?.trust_level === 0) return showToast("You must be verified to post.", "error");

    setIsSubmittingDiscussion(true);
    try {
      const { data, error } = await supabase.from('posts').insert({
        athlete_id: currentUserId, content: newDiscussionContent.trim(), channel: 'main'
      }).select(`id, content, created_at, athlete_id, likes, comments, athletes (id, first_name, last_name, avatar_url, equipped_border, is_premium)`).single();
      if (error) throw error;
      setPosts([data, ...posts]);
      setNewDiscussionContent('');
    } catch (err: any) { showToast(err.message, "error"); }
    finally { setIsSubmittingDiscussion(false); }
  };

  const handleToggleFire = async (postId: string, postAuthorId: string) => {
    if (!currentUserId) return router.push('/login');
    if (viewerRole === 'athlete' && (currentUserProfile?.trust_level || 0) === 0) return showToast("You must be verified to hype.", "error");

    setAnimatingHype(postId);
    setTimeout(() => setAnimatingHype(null), 300);

    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;
    const hasLiked = targetPost.likes?.includes(currentUserId);

    setPosts(currentPosts => currentPosts.map(post => {
      if (post.id === postId) {
        const likes = post.likes || [];
        return { ...post, likes: hasLiked ? likes.filter((id: string) => id !== currentUserId) : [...likes, currentUserId] };
      }
      return post;
    }));
    
    await supabase.rpc('toggle_post_like', { p_post_id: postId, p_user_id: currentUserId });
    
    if (!hasLiked && postAuthorId !== currentUserId) {
      try {
        const rewardRef = `[HYPE_REF:${postId}_${currentUserId}]`;
        const { data: existingReward } = await supabase.from('messages').select('id').eq('athlete_id', postAuthorId).eq('sender_school', 'ChasedRewards').like('content', `%${rewardRef}%`).maybeSingle();
        if (!existingReward) {
          // Rule applied: 1 point for verification posts, otherwise 5
          const isVerif = targetPost.content?.toLowerCase().includes("a new athlete has verified!");
          const pointsAwarded = isVerif ? 1 : 5;

          if (viewerRole === 'athlete' && currentUserProfile) {
             const { data: myData } = await supabase.from('athletes').select('coins').eq('id', currentUserId).single();
             await supabase.from('athletes').update({ coins: (myData?.coins || 0) + pointsAwarded }).eq('id', currentUserId);
          }
          const { data: receiverData } = await supabase.from('athletes').select('coins').eq('id', postAuthorId).single();
          if (receiverData) {
            await supabase.from('athletes').update({ coins: (receiverData.coins || 0) + pointsAwarded }).eq('id', postAuthorId);
            await supabase.from('messages').insert({
                athlete_id: postAuthorId, sender_name: 'ChasedSystem', sender_school: 'ChasedRewards', sender_email: 'rewards@chasedsports.com',
                content: `🔥 Someone hyped your post! You gained ${pointsAwarded} Points!\n\n${rewardRef}`, is_read: false, status: 'active'
            });
          }
        }
      } catch (e) { console.error("Reward Error", e); }
    }
  };

  return (
    <main className="min-h-screen bg-[#06090F] text-white font-sans pb-32 relative selection:bg-blue-500/30 overflow-hidden">
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'bg-rose-950/90 border-rose-900/50 text-rose-200' : 'bg-emerald-950/90 border-emerald-900/50 text-emerald-200'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />}
            <p className="text-xs font-bold leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 relative z-30">
        
        {/* 🚨 CENTERED HERO TEXT 🚨 */}
        <div className="flex flex-col items-center justify-center text-center gap-3 mb-8">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white flex items-center justify-center gap-3">
                The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Network</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm md:text-base flex items-center justify-center gap-2">
                Multi-Sport Hub & Recruiting Directory
            </p>
        </div>

        {/* 🚨 DECLUTTERED & MODERNIZED SEGMENTED NAV 🚨 */}
        <div className="flex justify-center mb-10 w-full px-2">
          <div className="inline-flex items-center gap-1.5 p-1.5 bg-[#0B101A]/80 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-full overflow-x-auto custom-scrollbar max-w-full shadow-2xl">
            <Link 
              href="/feed" 
              className={`px-4 sm:px-6 py-2.5 rounded-xl md:rounded-full text-[11px] sm:text-sm font-black uppercase tracking-wider sm:normal-case sm:tracking-normal sm:font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                pathname === '/feed' 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Star className={`w-4 h-4 ${pathname === '/feed' ? 'text-blue-400 fill-blue-400/20 animate-pulse' : ''}`} /> 
              Featured Athletes
            </Link>
            <Link 
              href="/feed/discussions" 
              className={`px-4 sm:px-6 py-2.5 rounded-xl md:rounded-full text-[11px] sm:text-sm font-black uppercase tracking-wider sm:normal-case sm:tracking-normal sm:font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                pathname === '/feed/discussions' 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Flame className={`w-4 h-4 ${pathname === '/feed/discussions' ? 'text-rose-400 fill-rose-400/20 animate-pulse' : ''}`} /> 
              Trending Discussions
            </Link>
            <Link 
              href="/feed/network" 
              className={`px-4 sm:px-6 py-2.5 rounded-xl md:rounded-full text-[11px] sm:text-sm font-black uppercase tracking-wider sm:normal-case sm:tracking-normal sm:font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                pathname === '/feed/network' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Users className={`w-4 h-4 ${pathname === '/feed/network' ? 'text-emerald-400 fill-emerald-400/20 animate-pulse' : ''}`} /> 
              Directory
            </Link>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-8">
            {viewerRole === 'athlete' && currentUserId && (
                <div className="mb-10 bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.3)] relative group">
                    {currentUserProfile?.trust_level === 0 && (
                        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center rounded-[2rem]">
                            <ShieldCheck className="w-10 h-10 text-rose-500 mb-3" />
                            <h4 className="text-white font-black text-lg">Verification Required</h4>
                        </div>
                    )}
                    <div className="flex gap-4">
                        <AvatarWithBorder avatarUrl={currentUserProfile?.avatar_url || ''} sizeClasses="w-12 h-12 hidden sm:block" borderId={currentUserProfile?.equipped_border || 'none'} />
                        <div className="flex-1">
                            <form onSubmit={handleCreateDiscussion} className="flex flex-col gap-3">
                                <textarea value={newDiscussionContent} onChange={(e) => setNewDiscussionContent(e.target.value)} placeholder="What's on your mind? Ask the community..." className="w-full bg-black/40 border border-white/5 hover:border-white/10 text-white rounded-[1.5rem] p-4 min-h-[100px] resize-none focus:outline-none focus:border-blue-500/50 font-medium text-sm transition-all" />
                                <div className="flex justify-end">
                                    <button type="submit" disabled={isSubmittingDiscussion || !newDiscussionContent.trim()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg disabled:opacity-50 flex items-center gap-2">
                                        {isSubmittingDiscussion ? 'Posting...' : <><Send className="w-4 h-4" /> Share</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-20 animate-pulse"><Flame className="w-8 h-8 text-white/20 mx-auto" /></div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.01] rounded-[2rem] border border-white/5 border-dashed">
                    <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">The arena is quiet...</h3>
                </div>
            ) : (
                posts.map(post => {
                    if (!post.athletes) return null;
                    const likesCount = post.likes ? post.likes.length : 0;
                    const iLikedThis = post.likes ? post.likes.includes(currentUserId || '') : false;
                    const isVerificationPost = post.content?.toLowerCase().includes("a new athlete has verified!");

                    return (
                        <div key={post.id} className="relative z-0">
                            {isVerificationPost ? (
                                <div className="bg-blue-950/20 backdrop-blur-xl border border-blue-500/30 p-5 sm:p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-5 transition-all hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 border border-blue-500/30">
                                            <ShieldCheck className="w-7 h-7 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight leading-none mb-1">New Athlete Verified!</h3>
                                            <p className="text-xs font-bold text-blue-400/80 uppercase tracking-widest">{post.athletes.first_name} {post.athletes.last_name} joined the ranks.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <button onClick={() => handleToggleFire(post.id, post.athlete_id)} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-black transition-all ${iLikedThis ? 'bg-blue-600 text-white shadow-lg' : 'bg-black/30 hover:bg-black/50 text-slate-300 border border-white/5'}`}>
                                            <Flame className={`w-3.5 h-3.5 ${iLikedThis ? 'fill-current text-orange-400' : ''}`} /> {likesCount > 0 ? likesCount : '0'}
                                        </button>
                                        <Link href={`/athlete/${post.athlete_id}`} className="flex-1 sm:flex-none bg-white text-slate-900 hover:bg-slate-200 px-6 py-3 rounded-xl font-black text-sm text-center transition-transform hover:scale-105 shrink-0 whitespace-nowrap shadow-md">
                                            View Profile
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white/[0.03] backdrop-blur-md rounded-[2rem] p-6 sm:p-8 transition-all border border-white/10 hover:border-indigo-500/30">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <Link href={`/athlete/${post.athlete_id}`} className="shrink-0 hover:scale-105 transition-transform shadow-md rounded-full border border-white/5">
                                                <AvatarWithBorder avatarUrl={post.athletes.avatar_url || ''} sizeClasses="w-12 h-12" borderId={post.athletes.equipped_border || 'none'} />
                                            </Link>
                                            <div>
                                                <Link href={`/athlete/${post.athlete_id}`} className="font-black text-lg text-white hover:text-blue-400 flex items-center gap-1.5 leading-none mb-1">
                                                    {post.athletes.first_name} {post.athletes.last_name}
                                                    {post.athletes.is_premium && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                                                </Link>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-slate-200 font-medium whitespace-pre-wrap mb-5 leading-relaxed text-sm sm:text-base">
                                        {post.content}
                                    </p>
                                    <div className="border-t border-white/10 pt-5 flex items-center gap-3">
                                        <button onClick={() => handleToggleFire(post.id, post.athlete_id)} className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm ${iLikedThis ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-black/20 hover:bg-black/40 text-slate-300 border border-white/5'}`}>
                                            <Flame className={`w-3.5 h-3.5 ${iLikedThis ? 'fill-current text-indigo-400 animate-pulse' : 'text-slate-400'}`} /> {likesCount > 0 ? likesCount : '0'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </main>
  );
}