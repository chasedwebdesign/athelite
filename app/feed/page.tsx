'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation'; 
import { MessageSquare, Send, Clock, ShieldCheck, Medal, CheckCircle2, MapPin, Mail, Lock, X, Trophy, ExternalLink, GraduationCap, ChevronDown, School, UserCircle2, Users, Coffee, Globe, Reply, AlertCircle, MoreHorizontal, Flag } from 'lucide-react';
import Link from 'next/link';

// 🚨 IMPORT THE BORDER COMPONENT
import { AvatarWithBorder } from '@/components/AnimatedBorders';

// 🚨 PROFANITY FILTER LIST
const BAD_WORDS = [
  'fuck', 'shit', 'bitch', 'ass', 'asshole', 'dick', 'pussy', 'cunt', 'slut', 'whore', 'fag', 'faggot', 'nigger', 'nigga', 'retard', 'bastard', 'motherfucker'
];

const containsBadWords = (text: string) => {
  return BAD_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  });
};

// --- EARNED TITLES DICTIONARY ---
const EARNED_TITLES = [
  { id: 'legend', name: 'Legend', badgeClass: 'legend-badge' },
  { id: 'champion', name: 'Champion', badgeClass: 'champion-badge' },
  { id: 'elite', name: 'Elite', badgeClass: 'elite-badge' },
  { id: 'master', name: 'Master', badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300' },
  { id: 'contender', name: 'Contender', badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
  { id: 'challenger', name: 'Challenger', badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300' },
  { id: 'prospect', name: 'Prospect', badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300' },
];

interface AthleteData {
  first_name: string;
  last_name: string;
  high_school: string;
  avatar_url: string | null;
  trust_level: number;
  prs: { event: string; mark: string }[] | null;
  equipped_border?: string | null;
  equipped_title?: string | null; 
  majors?: string | null;
  grad_year?: number | null;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  athlete_id: string;
  linked_pr_event?: string | null;
  linked_pr_mark?: string | null;
  channel?: string | null;
  athletes: AthleteData;
}

export default function FeedPage() {
  const supabase = createClient();
  const router = useRouter(); 
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User State
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(''); 
  const [currentUserProfile, setCurrentUserProfile] = useState<AthleteData | null>(null);
  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');
  const [coachType, setCoachType] = useState<string | null>(null);
  const [isVerifiedAthlete, setIsVerifiedAthlete] = useState(false);
  const [isVerifiedCoach, setIsVerifiedCoach] = useState(false);
  const [myPRs, setMyPRs] = useState<{event: string, mark: string}[]>([]);
  const [isGraduated, setIsGraduated] = useState(false);
  
  // Tab State
  const [feedTab, setFeedTab] = useState<'main' | 'global' | 'legacy'>('main');

  // Post Creator State
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPRIndex, setSelectedPRIndex] = useState<string>('');
  const [myMajors, setMyMajors] = useState('');
  const postInputRef = useRef<HTMLTextAreaElement>(null); 
  
  const [isPosting, setIsPosting] = useState(false);
  const [timeUntilNextPost, setTimeUntilNextPost] = useState<string | null>(null);

  // Messaging & UI State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'pitch' | 'chat'>('pitch');
  const [selectedPostForMessage, setSelectedPostForMessage] = useState<Post | null>(null);
  
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // Auto-filled sender info
  const [senderName, setSenderName] = useState('');
  const [senderSchool, setSenderSchool] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchFeedAndUser();
  }, [supabase]);

  async function fetchFeedAndUser() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setCurrentUserId(session.user.id);
      setCurrentUserEmail(session.user.email || '');

      const { data: cData } = await supabase.from('coaches').select('trust_level, first_name, last_name, school_name, coach_type').eq('id', session.user.id).maybeSingle();
      
      if (cData) {
        setViewerRole('coach');
        setIsVerifiedCoach(cData.trust_level > 0);
        setCoachType(cData.coach_type);
        setSenderName(`${cData.first_name} ${cData.last_name}`);
        setSenderSchool(cData.school_name || '');
        setSenderEmail(session.user.email || '');
      } else {
        const { data: aData } = await supabase
          .from('athletes')
          .select('first_name, last_name, high_school, avatar_url, trust_level, prs, equipped_border, equipped_title, majors, grad_year')
          .eq('id', session.user.id)
          .maybeSingle();

        if (aData) {
          setViewerRole('athlete');
          setIsVerifiedAthlete(aData.trust_level > 0);
          setCurrentUserProfile(aData as AthleteData);
          setMyMajors(aData.majors || '');
          setSenderName(`${aData.first_name} ${aData.last_name}`);
          setSenderSchool(aData.high_school || '');
          setSenderEmail(session.user.email || '');
          
          if (aData.prs) setMyPRs(aData.prs);

          if (aData.grad_year) {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth(); 
            const activeGradYearCutoff = currentMonth > 5 ? currentYear + 1 : currentYear;
            if (aData.grad_year < activeGradYearCutoff) {
              setIsGraduated(true);
            }
          }
          
          if (aData.trust_level > 0) {
            const { data: recentPosts } = await supabase
              .from('posts')
              .select('created_at, channel')
              .eq('athlete_id', session.user.id)
              .order('created_at', { ascending: false })
              .limit(10);

            const lastMainPost = recentPosts?.find(p => !p.channel || p.channel === 'main');

            if (lastMainPost) {
              const lastPostTime = new Date(lastMainPost.created_at).getTime();
              const currentTime = new Date().getTime();
              const hoursSinceLastPost = (currentTime - lastPostTime) / (1000 * 60 * 60);

              if (hoursSinceLastPost < 24) {
                const hoursLeft = Math.ceil(24 - hoursSinceLastPost);
                setTimeUntilNextPost(`${hoursLeft}h remaining`);
              }
            }
          }
        }
      }
    }

    const { data: feedData } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, athlete_id, linked_pr_event, linked_pr_mark, channel,
        athletes (first_name, last_name, high_school, avatar_url, trust_level, prs, equipped_border, equipped_title, majors, grad_year)
      `)
      .order('created_at', { ascending: false });

    if (feedData) setPosts(feedData as unknown as Post[]);
    setLoading(false);
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !currentUserId) return;
    if (feedTab === 'main' && timeUntilNextPost) return; 

    if (containsBadWords(newPostContent)) {
      showToast("Your update contains inappropriate language. Please keep it clean and professional.");
      return;
    }
    
    setIsPosting(true);
    try {
      if (feedTab === 'main') {
        await supabase.from('athletes').update({ majors: myMajors }).eq('id', currentUserId);
      }

      const prToLink = (feedTab === 'main' && selectedPRIndex !== '') ? myPRs[Number(selectedPRIndex)] : null;
      
      const { error } = await supabase.from('posts').insert({
        athlete_id: currentUserId,
        content: newPostContent,
        linked_pr_event: prToLink?.event || null,
        linked_pr_mark: prToLink?.mark || null,
        channel: feedTab 
      });

      if (error) throw error;
      
      setNewPostContent('');
      setSelectedPRIndex('');
      
      if (feedTab === 'main') {
        setTimeUntilNextPost('24h remaining');
      }
      
      fetchFeedAndUser(); 
      showToast("Posted successfully!", "success");
    } catch (err: any) { 
      showToast(`Error posting: ${err.message}`); 
    } finally { 
      setIsPosting(false); 
    }
  };

  const handleReply = (firstName: string, lastName: string) => {
    setNewPostContent((prev) => prev ? prev + ` @${firstName} ${lastName} ` : `@${firstName} ${lastName} `);
    
    if (postInputRef.current) {
      postInputRef.current.focus();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactClick = (post: Post) => {
    if (viewerRole === 'guest' || !currentUserId) {
      router.push('/login?reason=contact');
      return;
    }
    if (viewerRole === 'coach' && !isVerifiedCoach) {
      showToast("Please verify your coaching profile on the dashboard to send direct pitches.");
      return;
    }
    if (viewerRole === 'athlete' && !isVerifiedAthlete) {
      showToast("Please sync your Athletic.net profile to message other athletes.");
      return;
    }

    const mode = (viewerRole === 'coach' && coachType === 'college') ? 'pitch' : 'chat';
    openMessageModal(post, mode);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostForMessage) return;

    if (containsBadWords(messageContent)) {
      showToast("Your message contains inappropriate language. Please keep it clean and professional.");
      return;
    }

    setIsSending(true);
    
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const checkEmail = currentUserEmail || senderEmail;
      
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_email', checkEmail)
        .gte('created_at', twentyFourHoursAgo);

      if (count !== null && count >= 10) {
        showToast("Daily Limit Reached: You can only send 10 new connection requests or pitches per day.");
        setIsSending(false);
        return;
      }

      const { error } = await supabase.from('messages').insert({
        athlete_id: selectedPostForMessage.athlete_id,
        sender_name: senderName, 
        sender_school: senderSchool, 
        sender_email: senderEmail, 
        content: messageContent,
        status: 'pending' 
      });
      
      if (error) throw error;
      setSendSuccess(true);
      setTimeout(() => {
        setIsMessageModalOpen(false);
        setSendSuccess(false);
        setMessageContent('');
      }, 2000);
    } catch (error: any) { 
      showToast(`Failed to send message: ${error.message}`); 
    } finally { 
      setIsSending(false); 
    }
  };

  const openMessageModal = (post: Post, mode: 'pitch' | 'chat') => {
    setSelectedPostForMessage(post);
    setModalMode(mode);
    setSendSuccess(false);
    setIsMessageModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    if (isToday) return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getListGlowClass = (border?: string | null) => {
    if (border === 'border-legend') return 'list-item-legend';
    if (border === 'border-champion') return 'list-item-champion';
    if (border === 'border-elite') return 'list-item-elite';
    return 'hover:bg-slate-50/50'; 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Network...</p>
      </div>
    );
  }

  const filteredPosts = posts.filter(post => {
    if (feedTab === 'main') return !post.channel || post.channel === 'main';
    return post.channel === feedTab;
  });

  const canViewGlobal = viewerRole === 'athlete' && !isGraduated;
  const canViewLegacy = viewerRole === 'athlete' && isGraduated;

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32 relative">
      
      {/* --- IN-APP TOAST NOTIFICATION --- */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />}
            <p className="text-sm font-bold leading-tight">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* INVISIBLE OVERLAY TO CLOSE DROPDOWNS PERFECTLY */}
      {openDropdownId && (
        <div 
          className="fixed inset-0 z-[80]" 
          onClick={() => setOpenDropdownId(null)}
        />
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        
        .legend-badge { background: linear-gradient(90deg, #6b21a8 0%, #d946ef 20%, #6b21a8 40%, #d946ef 60%, #6b21a8 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #e879f9; }
        .champion-badge { background: linear-gradient(90deg, #991b1b 0%, #ef4444 20%, #991b1b 40%, #ef4444 60%, #991b1b 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #f87171; }
        .elite-badge { background: linear-gradient(90deg, #0f172a 0%, #475569 20%, #0f172a 40%, #475569 60%, #0f172a 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #94a3b8; }
        
        .list-item-legend { animation: pulse-legend-list 5s ease-in-out infinite; }
        @keyframes pulse-legend-list {
          0%, 100% { box-shadow: inset 4px 0 0 #d946ef, inset 0 0 20px rgba(217, 70, 239, 0.03); background-color: rgba(217, 70, 239, 0.01); }
          50% { box-shadow: inset 4px 0 0 #e879f9, inset 0 0 40px rgba(217, 70, 239, 0.08); background-color: rgba(217, 70, 239, 0.03); }
        }
        .list-item-champion { animation: pulse-champion-list 5s ease-in-out infinite; }
        @keyframes pulse-champion-list {
          0%, 100% { box-shadow: inset 4px 0 0 #ef4444, inset 0 0 20px rgba(239, 68, 68, 0.03); background-color: rgba(239, 68, 68, 0.01); }
          50% { box-shadow: inset 4px 0 0 #f87171, inset 0 0 40px rgba(239, 68, 68, 0.08); background-color: rgba(239, 68, 68, 0.03); }
        }
        .list-item-elite { animation: pulse-elite-list 5s ease-in-out infinite; }
        @keyframes pulse-elite-list {
          0%, 100% { box-shadow: inset 4px 0 0 #64748b, inset 0 0 20px rgba(100, 116, 139, 0.03); background-color: rgba(100, 116, 139, 0.01); }
          50% { box-shadow: inset 4px 0 0 #94a3b8, inset 0 0 40px rgba(100, 116, 139, 0.08); background-color: rgba(100, 116, 139, 0.03); }
        }
      `}} />

      <div className="max-w-3xl mx-auto px-6 pt-12">
        
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">The Network</h1>
          <p className="text-slate-500 font-medium text-lg">Live updates and conversations from verified athletes.</p>
        </div>

        {/* DYNAMIC TAB BAR */}
        <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
          <button 
            onClick={() => setFeedTab('main')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${feedTab === 'main' ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <Globe className="w-4 h-4" /> Global Feed
          </button>
          
          {canViewGlobal && (
            <button 
              onClick={() => setFeedTab('global')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${feedTab === 'global' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'}`}
            >
              <Users className="w-4 h-4" /> Athlete Chat
            </button>
          )}

          {canViewLegacy && (
            <button 
              onClick={() => setFeedTab('legacy')}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${feedTab === 'legacy' ? 'bg-amber-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'}`}
            >
              <Coffee className="w-4 h-4" /> Legacy Lounge
            </button>
          )}
        </div>

        {/* --- POST CREATOR --- */}
        {viewerRole === 'athlete' && isVerifiedAthlete && (feedTab === 'main' || feedTab === 'global' || feedTab === 'legacy') && (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 mb-8 relative overflow-hidden z-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none"></div>
            
            {feedTab === 'main' && timeUntilNextPost ? (
              <div className="flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Post Submitted!</h3>
                <p className="text-slate-500 font-medium max-w-sm">
                  To keep the feed high-quality for coaches, athletes can only post to the Main Feed once every 24 hours. Check back in <span className="font-black text-blue-600">{timeUntilNextPost}</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreatePost} className="p-6 md:p-8 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className={`w-5 h-5 ${feedTab === 'legacy' ? 'text-amber-600' : 'text-blue-600'}`} />
                  <span className="font-bold text-slate-800 text-lg">
                    {feedTab === 'main' ? 'Create Recruiting Update' : 'Send Message'}
                  </span>
                </div>

                <div className="space-y-4 mb-4">
                  {feedTab === 'main' && (
                    <>
                      <div className="relative">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={myMajors} onChange={(e) => setMyMajors(e.target.value)} placeholder="Target Major (e.g. Business)" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                      </div>

                      <div className="relative">
                        <select value={selectedPRIndex} onChange={(e) => setSelectedPRIndex(e.target.value)} className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl pl-10 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                          <option value="">Attach a PR to this post (Optional)</option>
                          {myPRs.map((pr, index) => <option key={index} value={index}>{pr.event} - {pr.mark}</option>)}
                        </select>
                        <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </>
                  )}

                  <textarea 
                    ref={postInputRef}
                    required 
                    maxLength={feedTab === 'main' ? 280 : 500} 
                    value={newPostContent} 
                    onChange={(e) => setNewPostContent(e.target.value)} 
                    placeholder={feedTab === 'main' ? "Just hit a new PR at the state meet! Looking forward to upcoming visits..." : "Say something to the group..."} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none h-24" 
                  />
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={isPosting || !newPostContent.trim()} className={`bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-3.5 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2`}>
                    {isPosting ? 'Sending...' : <><Send className="w-4 h-4" /> Send</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* --- THE SEAMLESS TIMELINE LIST --- */}
        <div>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-200 border-dashed shadow-sm">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-900 mb-2">Nothing here yet...</h3>
              <p className="text-slate-500 font-medium">Be the first to post in this channel!</p>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col divide-y divide-slate-100 relative z-0">
              {filteredPosts.map((post) => {
                const isMyPost = currentUserId === post.athlete_id;
                const isChatMode = feedTab !== 'main';
                
                const activeTitle = EARNED_TITLES.find(t => t.id === post.athletes.equipped_title);

                // 💬 CHAT BUBBLE RENDER
                if (isChatMode) {
                  return (
                    <div key={post.id} className="p-5 sm:p-6 flex items-start gap-4 transition-colors group relative hover:bg-slate-50/50">
                      
                      {/* 🚨 UPDATED CHAT AVATAR TO USE AvatarWithBorder */}
                      <Link href={`/athlete/${post.athlete_id}`} className="shrink-0 z-10 hover:opacity-90 transition-opacity">
                        <AvatarWithBorder 
                          avatarUrl={post.athletes.avatar_url} 
                          borderId={post.athletes.equipped_border} 
                          sizeClasses="w-10 h-10" 
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          
                          <div className="flex items-center gap-2 truncate pr-2">
                            <Link href={`/athlete/${post.athlete_id}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity truncate">
                              <h4 className="font-black text-[15px] text-slate-900 truncate">{post.athletes.first_name} {post.athletes.last_name}</h4>
                              {post.athletes.trust_level > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                            </Link>
                            
                            {activeTitle && activeTitle.id !== 'prospect' && (
                              <span className={`hidden sm:inline-block px-2 py-0.5 rounded-[4px] text-[9px] font-black tracking-widest uppercase text-white ${activeTitle.badgeClass}`}>
                                {activeTitle.name}
                              </span>
                            )}
                          </div>
                          
                          {/* OPTIONS MENU */}
                          <div className="flex items-center gap-1 relative">
                            <span className="text-[10px] font-bold text-slate-400 shrink-0">{formatDate(post.created_at)}</span>
                            <button 
                              onClick={() => setOpenDropdownId(openDropdownId === post.id ? null : post.id)} 
                              className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors relative z-[90]"
                            >
                              <MoreHorizontal className="w-4 h-4 pointer-events-none" />
                            </button>
                            
                            {openDropdownId === post.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-100">
                                <Link href={`/athlete/${post.athlete_id}`} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                  <UserCircle2 className="w-4 h-4 mr-2.5" /> View Profile
                                </Link>
                                {!isMyPost && (
                                  <button onClick={() => { setOpenDropdownId(null); handleContactClick(post); }} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left">
                                    <MessageSquare className="w-4 h-4 mr-2.5" /> Request a Chat
                                  </button>
                                )}
                                <button onClick={() => { setOpenDropdownId(null); showToast('Post reported to moderators. Thank you.', 'success'); }} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left border-t border-slate-100 mt-1 pt-2">
                                  <Flag className="w-4 h-4 mr-2.5" /> Report Post
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Highlight @Mentions in blue text */}
                        <p className="text-slate-700 font-medium text-sm whitespace-pre-wrap">
                          {post.content.split(/(@\S+\s\S+)/).map((part, i) => 
                            part.startsWith('@') ? <span key={i} className="text-blue-600 font-bold bg-blue-50 px-1 rounded">{part}</span> : part
                          )}
                        </p>

                        {/* REPLY BUTTON */}
                        {viewerRole === 'athlete' && isVerifiedAthlete && (
                          <div className="mt-2 flex justify-start sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleReply(post.athletes.first_name, post.athletes.last_name)}
                              className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors hover:bg-slate-100 px-2 py-1 rounded-md"
                            >
                              <Reply className="w-3.5 h-3.5" /> Reply
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }

                // 🏆 MAIN FEED CARD RENDER
                return (
                  <div key={post.id} className={`p-6 sm:p-8 transition-all duration-300 group relative z-0 hover:z-10 ${getListGlowClass(post.athletes.equipped_border)}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4 min-w-0">
                        
                        {/* 🚨 UPDATED MAIN FEED AVATAR TO USE AvatarWithBorder */}
                        <Link href={`/athlete/${post.athlete_id}`} className="shrink-0 group-hover:scale-105 transition-transform z-10">
                          <AvatarWithBorder 
                            avatarUrl={post.athletes.avatar_url} 
                            borderId={post.athletes.equipped_border} 
                            sizeClasses="w-12 h-12 sm:w-14 sm:h-14" 
                          />
                        </Link>

                        <div className="min-w-0 pt-0.5">
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/athlete/${post.athlete_id}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                              <h3 className="font-black text-lg sm:text-xl text-slate-900 tracking-tight leading-tight truncate">{post.athletes.first_name} {post.athletes.last_name}</h3>
                              {post.athletes.trust_level > 0 && (
                                <span title="Verified" className="flex items-center shrink-0">
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                </span>
                              )}
                            </Link>
                            
                            {activeTitle && activeTitle.id !== 'prospect' && (
                              <span className={`hidden sm:inline-block px-2.5 py-0.5 rounded-[5px] text-[10px] font-black tracking-widest uppercase text-white ${activeTitle.badgeClass}`}>
                                {activeTitle.name}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs sm:text-sm font-bold text-slate-500 flex items-center mt-1 truncate">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" /> <span className="truncate">{post.athletes.high_school}</span>
                          </p>

                          {post.athletes.majors && (
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="flex items-center bg-slate-50 border border-slate-200 text-slate-600 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider truncate">
                                <GraduationCap className="w-3 h-3 mr-1 text-purple-500 shrink-0"/> <span className="truncate">{post.athletes.majors}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 relative z-20">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 shrink-0 mt-1 pl-2">{formatDate(post.created_at)}</span>
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === post.id ? null : post.id)} 
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors mt-0.5 relative z-[90]"
                        >
                          <MoreHorizontal className="w-5 h-5 pointer-events-none" />
                        </button>
                        
                        {openDropdownId === post.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-100">
                            <Link href={`/athlete/${post.athlete_id}`} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                              <UserCircle2 className="w-4 h-4 mr-2.5" /> View Profile
                            </Link>
                            {!isMyPost && (
                              <button onClick={() => { setOpenDropdownId(null); handleContactClick(post); }} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left">
                                <MessageSquare className="w-4 h-4 mr-2.5" /> Request a Chat
                              </button>
                            )}
                            <button onClick={() => { setOpenDropdownId(null); showToast('Post reported to moderators. Thank you.', 'success'); }} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left border-t border-slate-100 mt-1 pt-2">
                              <Flag className="w-4 h-4 mr-2.5" /> Report Post
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-700 font-medium text-[15px] sm:text-base leading-relaxed mb-4 whitespace-pre-wrap ml-0 sm:ml-16">
                      {post.content}
                    </p>

                    {post.linked_pr_event && (
                      <div className="ml-0 sm:ml-16 inline-flex items-center bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl shadow-sm truncate">
                        <Trophy className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                        <span className="text-[10px] sm:text-xs font-black text-blue-800 uppercase tracking-widest mr-3 truncate">{post.linked_pr_event}</span>
                        <span className="text-sm sm:text-base font-black text-blue-600 shrink-0">{post.linked_pr_mark}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- SIMPLIFIED MESSAGING MODAL --- */}
      {isMessageModalOpen && selectedPostForMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-slate-900">{modalMode === 'pitch' ? `Message ${selectedPostForMessage.athletes.first_name}` : `Connect with ${selectedPostForMessage.athletes.first_name}`}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{modalMode === 'pitch' ? 'College Coach Pitch' : 'Connection Request'}</p>
              </div>
              <button onClick={() => setIsMessageModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            
            {sendSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
                <h4 className="text-2xl font-black text-slate-900 mb-2">Sent!</h4>
                <p className="text-slate-500 font-medium">Your message has been securely delivered to their dashboard.</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="p-6 space-y-5 relative">
                
                <p className="text-[10px] font-black text-amber-500 bg-amber-50 rounded-lg px-3 py-2 text-center uppercase tracking-widest border border-amber-200 flex items-center justify-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Daily Limit: 10 Pitches/Requests</span>
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                      {viewerRole === 'coach' ? <School className="w-5 h-5 text-blue-600" /> : <UserCircle2 className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{senderName}</p>
                      <p className="text-xs font-bold text-slate-500 truncate">{senderSchool} • {senderEmail}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 ml-2" />
                </div>

                <div className="space-y-1.5 mt-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Message</label>
                  <textarea required value={messageContent} onChange={(e) => setMessageContent(e.target.value)} rows={5} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium resize-none" placeholder={modalMode === 'pitch' ? `Hi ${selectedPostForMessage.athletes.first_name}...` : `Hey ${selectedPostForMessage.athletes.first_name}...`}></textarea>
                </div>

                <button type="submit" disabled={isSending} className={`w-full text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${modalMode === 'pitch' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-500'}`}>
                  {isSending ? 'Sending...' : <><Send className="w-5 h-5" /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}