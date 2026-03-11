'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation'; 
import { MessageSquare, Send, Clock, ShieldCheck, CheckCircle2, MapPin, Mail, Lock, X, Trophy, GraduationCap, ChevronDown, School, UserCircle2, Users, Coffee, Globe, Reply, AlertCircle, MoreHorizontal, Flag, Flame, Target, Image as ImageIcon, Crown, Sparkles, Rocket, EyeOff, FileText } from 'lucide-react';
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

const PRO_BADGES = [
  { id: 'visiting', label: '✈️ Planning Visits', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  { id: 'academic', label: '📚 High Academic', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'ready', label: '✍️ Ready to Sign', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'rising', label: '🚀 Fast Riser', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
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
  is_premium?: boolean; 
  boosts_available?: number;
  saved_resume?: string | null; 
}

interface CommentData {
  id: string;
  athlete_id: string;
  name: string;
  avatar_url: string | null;
  border: string | null;
  text: string;
  created_at: string;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  athlete_id: string;
  linked_pr_event?: string | null; 
  linked_pr_mark?: string | null;  
  linked_prs?: { event: string; mark: string }[] | null; 
  channel?: string | null;
  image_url?: string | null; 
  likes?: string[]; 
  is_bounty?: boolean; 
  bounty_amount?: number;
  comments?: CommentData[]; 
  pro_badge?: string | null;
  is_boosted?: boolean;
  hide_rank?: boolean; 
  attached_resume?: string | null; 
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
  const [feedTab, setFeedTab] = useState<'recruiting' | 'athlete' | 'bounties' | 'legacy'>('recruiting');

  // Post Creator State
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPRIndex, setSelectedPRIndex] = useState<string>(''); 
  const [selectedPRs, setSelectedPRs] = useState<number[]>([]); 
  const [myMajors, setMyMajors] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null); 
  const [selectedProBadge, setSelectedProBadge] = useState<string | null>(null);
  const [hideRank, setHideRank] = useState(false);
  
  // Resume State
  const [showResumeInput, setShowResumeInput] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [viewingResumePost, setViewingResumePost] = useState<Post | null>(null);

  const postInputRef = useRef<HTMLTextAreaElement>(null); 
  const [isPosting, setIsPosting] = useState(false);
  const [timeUntilNextPost, setTimeUntilNextPost] = useState<string | null>(null);
  const [isBoosting, setIsBoosting] = useState(false);

  // Comments State
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Messaging & UI State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'pitch' | 'chat'>('pitch');
  const [selectedPostForMessage, setSelectedPostForMessage] = useState<Post | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
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

      const { data: cData } = await supabase.from('coaches').select('trust_level, first_name, last_name, school_name, coach_type, avatar_url').eq('id', session.user.id).maybeSingle();
      
      if (cData) {
        setViewerRole('coach');
        setIsVerifiedCoach(cData.trust_level > 0);
        setCoachType(cData.coach_type);
        setSenderName(`Coach ${cData.last_name}`);
        setSenderSchool(cData.school_name || '');
        setSenderEmail(session.user.email || '');
      } else {
        const { data: aData } = await supabase
          .from('athletes')
          .select('first_name, last_name, high_school, avatar_url, trust_level, prs, equipped_border, equipped_title, majors, grad_year, is_premium, boosts_available, saved_resume')
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
          setResumeText(aData.saved_resume || ''); 
          
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

            const lastMainPost = recentPosts?.find(p => !p.channel || p.channel === 'recruiting');

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
        id, content, created_at, athlete_id, linked_pr_event, linked_pr_mark, linked_prs, channel, image_url, likes, is_bounty, bounty_amount, comments, pro_badge, is_boosted, hide_rank, attached_resume,
        athletes (first_name, last_name, high_school, avatar_url, trust_level, prs, equipped_border, equipped_title, majors, grad_year, is_premium)
      `)
      .order('is_boosted', { ascending: false })
      .order('created_at', { ascending: false });
    
    setPosts((feedData || []) as unknown as Post[]);
    setLoading(false);
  }

  const handleTogglePRSelection = (index: number) => {
    setSelectedPRs(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    if (feedTab === 'recruiting' && timeUntilNextPost) return; 

    const isPremium = currentUserProfile?.is_premium;

    let contentToSubmit = newPostContent.trim();
    if (feedTab === 'recruiting' && !isPremium) {
      const prLinked = selectedPRIndex !== '' ? myPRs[Number(selectedPRIndex)] : null;
      let automatedPitch = "I am officially looking for college track and field opportunities!";
      if (myMajors) automatedPitch += ` I am planning to major in ${myMajors}.`;
      if (prLinked) automatedPitch += ` Check out my verified mark in the ${prLinked.event}.`;
      contentToSubmit = automatedPitch;
    }

    if (!contentToSubmit) return;

    if (containsBadWords(contentToSubmit) || (showResumeInput && containsBadWords(resumeText))) {
      showToast("Your update contains inappropriate language.");
      return;
    }
    
    setIsPosting(true);
    try {
      if (feedTab === 'recruiting') {
        const updates: any = { majors: myMajors };
        if (isPremium && showResumeInput) {
          updates.saved_resume = resumeText;
        }
        await supabase.from('athletes').update(updates).eq('id', currentUserId);
      }

      let uploadedImageUrl = null;
      if (mediaFile) {
        uploadedImageUrl = URL.createObjectURL(mediaFile); 
      }

      const finalLinkedPRs = isPremium 
        ? selectedPRs.map(i => myPRs[i]) 
        : (selectedPRIndex !== '' ? [myPRs[Number(selectedPRIndex)]] : null);

      const finalBadge = (feedTab === 'recruiting' && isPremium) ? selectedProBadge : null;
      const finalHideRank = isPremium ? hideRank : false;
      const finalAttachedResume = (feedTab === 'recruiting' && isPremium && showResumeInput && resumeText.trim()) ? resumeText : null;
      
      const { error } = await supabase.from('posts').insert({
        athlete_id: currentUserId,
        content: contentToSubmit,
        linked_prs: finalLinkedPRs,
        channel: feedTab,
        image_url: uploadedImageUrl,
        pro_badge: finalBadge,
        hide_rank: finalHideRank,
        attached_resume: finalAttachedResume
      });

      if (error) throw error;
      
      setNewPostContent('');
      setSelectedPRIndex('');
      setSelectedPRs([]);
      setMediaFile(null);
      setSelectedProBadge(null);
      setHideRank(false);
      setShowResumeInput(false);
      
      if (feedTab === 'recruiting') {
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

  // 🚨 BOOST POST LOGIC 🚨
  const handleBoostPost = async (postId: string) => {
    if (!currentUserProfile || !currentUserId) return;
    
    const availableBoosts = currentUserProfile.boosts_available || 0;

    if (availableBoosts <= 0) {
      showToast("You are out of Boosts! Upgrade or visit the Vault to get more.", "error");
      return;
    }

    if (!confirm(`Are you sure you want to Boost this post? You have ${availableBoosts} boosts remaining.`)) {
      return;
    }

    setIsBoosting(true);
    try {
      const { error } = await supabase.rpc('apply_post_boost', { 
        p_post_id: postId, 
        p_athlete_id: currentUserId 
      });

      if (error) throw error;

      // Optimistically update UI
      setPosts(currentPosts => currentPosts.map(post => 
        post.id === postId ? { ...post, is_boosted: true } : post
      ));
      
      setCurrentUserProfile({
        ...currentUserProfile,
        boosts_available: availableBoosts - 1
      });

      showToast(`Post Boosted! You have ${availableBoosts - 1} boosts left.`, "success");
    } catch (err: any) {
      console.error(err);
      showToast("Failed to boost: " + err.message);
    } finally {
      setIsBoosting(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim() || !currentUserId) return;

    if (containsBadWords(text)) {
      showToast("Your text contains inappropriate language.");
      return;
    }

    setIsSubmittingComment(true);
    try {
      const myAvatar = viewerRole === 'coach' ? null : currentUserProfile?.avatar_url;
      const myBorder = viewerRole === 'coach' ? 'none' : currentUserProfile?.equipped_border;

      const newComment: CommentData = {
        id: Math.random().toString(), 
        athlete_id: currentUserId,
        name: senderName,
        avatar_url: myAvatar || '', 
        border: myBorder || 'none',
        text: text.trim(),
        created_at: new Date().toISOString()
      };

      setPosts(currentPosts => currentPosts.map(post => {
        if (post.id === postId) {
          return { ...post, comments: [...(post.comments || []), newComment] };
        }
        return post;
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));

      const { error } = await supabase.rpc('add_post_comment', { 
        p_post_id: postId, 
        p_athlete_id: currentUserId, 
        p_name: newComment.name,
        p_avatar_url: newComment.avatar_url,
        p_border: newComment.border,
        p_text: newComment.text
      });

      if (error) throw error;

    } catch (err: any) {
      console.error(err);
      showToast("Failed to submit: " + err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleToggleFire = async (postId: string) => {
    if (!currentUserId) {
      router.push('/login');
      return;
    }

    setPosts(currentPosts => currentPosts.map(post => {
      if (post.id === postId) {
        const likes = post.likes || [];
        const hasLiked = likes.includes(currentUserId);
        const newLikes = hasLiked ? likes.filter(id => id !== currentUserId) : [...likes, currentUserId];
        return { ...post, likes: newLikes };
      }
      return post;
    }));

    await supabase.rpc('toggle_post_like', { p_post_id: postId, p_user_id: currentUserId });
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
    if (containsBadWords(messageContent)) return showToast("Keep it clean.");

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
    } finally { setIsSending(false); }
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

  // 🚨 MASSIVE GLOW UP FOR BOOSTED POSTS 🚨
  const getListGlowClass = (border?: string | null, isBoosted?: boolean, isPremium?: boolean) => {
    if (isBoosted) return 'ring-[3px] ring-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.3)] bg-slate-900 z-20 border-transparent';
    if (isPremium) return 'bg-slate-900 border-slate-800 text-slate-200 hover:z-10 shadow-xl';
    
    if (border === 'border-legend') return 'list-item-legend bg-white';
    if (border === 'border-champion') return 'list-item-champion bg-white';
    if (border === 'border-elite') return 'list-item-elite bg-white';
    
    return 'bg-white border-slate-200 hover:z-10 hover:bg-slate-50/50 shadow-sm'; 
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
    if (feedTab === 'recruiting') return !post.channel || post.channel === 'recruiting' || post.channel === 'main'; 
    if (feedTab === 'bounties') return post.is_bounty === true;
    return post.channel === feedTab;
  });

  const canViewAthleteFeed = viewerRole === 'athlete' && !isGraduated;
  const canViewLegacy = viewerRole === 'athlete' && isGraduated;
  const canUserInteract = (viewerRole === 'athlete' && isVerifiedAthlete) || (viewerRole === 'coach' && isVerifiedCoach);

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32 relative">
      
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />}
            <p className="text-sm font-bold leading-tight">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {openDropdownId && (
        <div className="fixed inset-0 z-[80]" onClick={() => setOpenDropdownId(null)} />
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .legend-badge { background: linear-gradient(90deg, #6b21a8 0%, #d946ef 20%, #6b21a8 40%, #d946ef 60%, #6b21a8 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #e879f9; }
        .champion-badge { background: linear-gradient(90deg, #991b1b 0%, #ef4444 20%, #991b1b 40%, #ef4444 60%, #991b1b 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #f87171; }
        .elite-badge { background: linear-gradient(90deg, #0f172a 0%, #475569 20%, #0f172a 40%, #475569 60%, #0f172a 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #94a3b8; }
        .list-item-legend { animation: pulse-legend-list 5s ease-in-out infinite; }
        @keyframes pulse-legend-list { 0%, 100% { box-shadow: inset 4px 0 0 #d946ef, inset 0 0 20px rgba(217, 70, 239, 0.03); background-color: rgba(217, 70, 239, 0.01); } 50% { box-shadow: inset 4px 0 0 #e879f9, inset 0 0 40px rgba(217, 70, 239, 0.08); background-color: rgba(217, 70, 239, 0.03); } }
        .list-item-champion { animation: pulse-champion-list 5s ease-in-out infinite; }
        @keyframes pulse-champion-list { 0%, 100% { box-shadow: inset 4px 0 0 #ef4444, inset 0 0 20px rgba(239, 68, 68, 0.03); background-color: rgba(239, 68, 68, 0.01); } 50% { box-shadow: inset 4px 0 0 #f87171, inset 0 0 40px rgba(239, 68, 68, 0.08); background-color: rgba(239, 68, 68, 0.03); } }
        .list-item-elite { animation: pulse-elite-list 5s ease-in-out infinite; }
        @keyframes pulse-elite-list { 0%, 100% { box-shadow: inset 4px 0 0 #64748b, inset 0 0 20px rgba(100, 116, 139, 0.03); background-color: rgba(100, 116, 139, 0.01); } 50% { box-shadow: inset 4px 0 0 #94a3b8, inset 0 0 40px rgba(100, 116, 139, 0.08); background-color: rgba(100, 116, 139, 0.03); } }
      `}} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12">
        
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">The Network</h1>
          <p className="text-slate-500 font-medium text-lg">Live updates, bounties, and conversations from verified athletes.</p>
        </div>

        {/* DYNAMIC TAB BAR */}
        <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
          <button onClick={() => setFeedTab('recruiting')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${feedTab === 'recruiting' ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            <ShieldCheck className="w-4 h-4" /> Recruiting
          </button>
          {canViewAthleteFeed && (
            <button onClick={() => setFeedTab('athlete')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${feedTab === 'athlete' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'}`}>
              <Users className="w-4 h-4" /> Athlete Feed
            </button>
          )}
          <button onClick={() => setFeedTab('bounties')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${feedTab === 'bounties' ? 'bg-amber-500 text-amber-950 shadow-md' : 'bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300'}`}>
            <Target className="w-4 h-4" /> Bounties
          </button>
          {canViewLegacy && (
            <button onClick={() => setFeedTab('legacy')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${feedTab === 'legacy' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'}`}>
              <Coffee className="w-4 h-4" /> Legacy Lounge
            </button>
          )}
        </div>

        {/* 🚨 HIGHLIGHTED BANNERS 🚨 */}
        {feedTab === 'recruiting' && (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-[2rem] p-6 mb-8 text-white relative overflow-hidden shadow-lg border border-blue-700 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="relative z-10 flex items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shrink-0 mx-auto sm:mx-0">
                <School className="w-7 h-7 text-blue-300" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight mb-1">The Recruitment Zone</h3>
                <p className="text-blue-200/90 text-sm font-medium">College Coaches actively monitor this feed. Post your verified PRs and official visit recaps here to get noticed.</p>
              </div>
            </div>
          </div>
        )}

        {feedTab === 'athlete' && (
          <div className="bg-slate-100 rounded-[2rem] p-6 mb-8 border border-slate-200 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border border-slate-200 shrink-0 mx-auto sm:mx-0 shadow-sm">
                <Users className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Athlete Only Feed</h3>
                <p className="text-slate-500 text-sm font-medium">Coaches cannot see this tab. Hype up your teammates, ask questions, or just talk track.</p>
              </div>
            </div>
          </div>
        )}

        {/* --- POST CREATOR --- */}
        {viewerRole === 'athlete' && isVerifiedAthlete && (feedTab === 'recruiting' || feedTab === 'athlete' || feedTab === 'legacy') && (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 mb-8 relative overflow-hidden z-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none"></div>
            
            {feedTab === 'recruiting' && timeUntilNextPost ? (
              <div className="flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Pitch Submitted!</h3>
                <p className="text-slate-500 font-medium max-w-sm mb-6">
                  To keep the recruiting feed high-quality for coaches, athletes can only post here once every 24 hours.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 flex items-center justify-center gap-2 shadow-inner">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-black text-slate-700 tracking-wider uppercase text-sm">Cooldown: {timeUntilNextPost}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreatePost} className="p-6 md:p-8 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className={`w-5 h-5 ${feedTab === 'athlete' ? 'text-blue-500' : 'text-indigo-600'}`} />
                  <span className="font-bold text-slate-800 text-lg">
                    {feedTab === 'recruiting' ? 'Create Recruiting Pitch' : 'Share an accomplishment or thought...'}
                  </span>
                </div>

                <div className="space-y-4 mb-4">
                  
                  {feedTab === 'recruiting' && (
                    <>
                      <div className="relative z-10">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={myMajors} onChange={(e) => setMyMajors(e.target.value)} placeholder="Target Major (e.g. Business)" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                      </div>
                    </>
                  )}

                  {/* 🚨 FREE VS PRO EDITOR LOGIC 🚨 */}
                  {feedTab === 'recruiting' && !currentUserProfile?.is_premium ? (
                    // FREE USER LOGIC (Single PR Dropdown + Locked Editor)
                    <>
                      <div className="relative z-10">
                        <select value={selectedPRIndex} onChange={(e) => setSelectedPRIndex(e.target.value)} className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl pl-10 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                          <option value="">Highlight a PR (Optional)</option>
                          {myPRs.map((pr, index) => <option key={index} value={index}>{pr.event} - {pr.mark}</option>)}
                        </select>
                        <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                      <div className="relative mt-2">
                        <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-xl border border-slate-200">
                          <Link href="/pro" className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-black px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                            <Lock className="w-4 h-4" /> Unlock Custom Pitches
                          </Link>
                        </div>
                        <textarea disabled placeholder="Free users get an automated pitch. Upgrade to Pro to write custom recruiting letters!" className="w-full bg-slate-50 border border-slate-200 text-slate-400 rounded-xl p-4 font-medium resize-none h-28 cursor-not-allowed" />
                      </div>
                    </>
                  ) : feedTab === 'recruiting' && currentUserProfile?.is_premium ? (
                    // PRO USER EDITOR 
                    <div className="p-1 rounded-[1.1rem] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 animate-[shimmerSlow_4s_linear_infinite] bg-[length:200%_auto] mt-4 relative z-0 shadow-lg shadow-amber-500/20">
                      <div className="bg-slate-900 rounded-xl p-4 relative z-10">
                        
                        {/* Status Tag Selector */}
                        <div className="mb-4 overflow-x-auto hide-scrollbar flex gap-2 pb-1">
                          {PRO_BADGES.map(badge => (
                            <button 
                              key={badge.id}
                              type="button"
                              onClick={() => setSelectedProBadge(badge.id === selectedProBadge ? null : badge.id)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border ${selectedProBadge === badge.id ? badge.color : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                            >
                              {badge.label}
                            </button>
                          ))}
                        </div>

                        {/* Multi-Select PR Pills */}
                        {myPRs.length > 0 && (
                          <div className="mb-4">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Trophy className="w-3 h-3"/> Attach PRs</p>
                            <div className="flex flex-wrap gap-2">
                              {myPRs.map((pr, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleTogglePRSelection(idx)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${selectedPRs.includes(idx) ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                                >
                                  {pr.event}: {pr.mark}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
                          <span className="text-xs font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-widest"><Crown className="w-3.5 h-3.5" /> Pro Editor</span>
                          
                          <div className="flex items-center gap-2">
                            {/* Hide League Toggle */}
                            <button 
                              type="button" 
                              onClick={() => setHideRank(!hideRank)} 
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${hideRank ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                            >
                              <EyeOff className="w-3 h-3" /> {hideRank ? 'Rank Hidden' : 'Hide Rank'}
                            </button>
                            
                            {/* 🚨 Attach Resume Toggle 🚨 */}
                            <button 
                              type="button" 
                              onClick={() => setShowResumeInput(!showResumeInput)} 
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${showResumeInput ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                            >
                              <FileText className="w-3 h-3" /> {showResumeInput ? 'Resume Attached' : 'Attach Resume'}
                            </button>
                          </div>
                        </div>
                        
                        <textarea 
                          ref={postInputRef}
                          required 
                          maxLength={500} 
                          value={newPostContent} 
                          onChange={(e) => setNewPostContent(e.target.value)} 
                          placeholder="Write a custom pitch to coaches..." 
                          className="w-full bg-transparent border-none text-white focus:outline-none font-medium resize-none h-24 placeholder:text-slate-500 mb-2" 
                        />

                        {/* 🚨 Resume Editor Area 🚨 */}
                        {showResumeInput && (
                          <div className="mt-2 pt-3 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <FileText className="w-3 h-3" /> Athletic Resume (Saves automatically)
                            </p>
                            <textarea 
                              value={resumeText} 
                              onChange={(e) => setResumeText(e.target.value)} 
                              placeholder="GPA: 3.9&#10;SAT: 1450&#10;Key Achievements: State Finalist 2023..." 
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 font-medium resize-none h-32 placeholder:text-slate-600" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // STANDARD ATHLETE FEED BOX
                    <textarea 
                      ref={postInputRef}
                      required 
                      maxLength={500} 
                      value={newPostContent} 
                      onChange={(e) => setNewPostContent(e.target.value)} 
                      placeholder="Just finished a brutal 400m repeat workout... anyone else's legs dead?" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none h-24" 
                    />
                  )}

                </div>

                {mediaFile && (
                  <div className="relative w-max mb-4">
                    <img src={URL.createObjectURL(mediaFile)} alt="Upload Preview" onError={(e) => e.currentTarget.style.display = 'none'} className="h-24 rounded-lg object-cover border border-slate-200 shadow-sm" />
                    <button type="button" onClick={() => setMediaFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                  
                  {/* 🚨 MEDIA UPLOAD LOCK FOR FREE USERS IN RECRUITING */}
                  {(feedTab !== 'recruiting' || currentUserProfile?.is_premium) ? (
                    <label className="cursor-pointer flex items-center justify-center p-2.5 bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-full transition-colors">
                      <ImageIcon className="w-5 h-5" />
                      <input type="file" accept="image/*,video/mp4" className="hidden" onChange={(e) => { if (e.target.files && e.target.files[0]) setMediaFile(e.target.files[0]); }} />
                    </label>
                  ) : (
                    <div className="p-2.5 flex items-center justify-center text-slate-300 cursor-not-allowed" title="Media uploads are a Pro feature in the Recruiting Zone">
                       <Lock className="w-4 h-4 opacity-50" />
                    </div>
                  )}

                  <button type="submit" disabled={isPosting || (currentUserProfile?.is_premium || feedTab !== 'recruiting' ? !newPostContent.trim() : false)} className={`bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-3 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2`}>
                    {isPosting ? 'Sending...' : <><Send className="w-4 h-4" /> Post</>}
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
              {feedTab === 'bounties' ? (
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              ) : (
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              )}
              <h3 className="text-2xl font-black text-slate-900 mb-2">Nothing here yet...</h3>
              <p className="text-slate-500 font-medium">Be the first to make some noise!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {filteredPosts.map((post) => {
                const isMyPost = currentUserId === post.athlete_id;
                const isRecruiting = post.channel === 'recruiting' || !post.channel || post.channel === 'main';
                const activeTitle = EARNED_TITLES.find(t => t.id === post.athletes.equipped_title);
                const activeBadge = PRO_BADGES.find(b => b.id === post.pro_badge);
                const isPremiumPost = post.athletes.is_premium && isRecruiting; 
                
                const likesCount = post.likes ? post.likes.length : 0;
                const iLikedThis = post.likes ? post.likes.includes(currentUserId || '') : false;
                
                // Comments Logic
                const allComments = post.comments || [];
                const responders = new Set(allComments.filter(c => c.athlete_id !== post.athlete_id).map(c => c.athlete_id));
                const uniqueRespondersCount = responders.size;
                const hasResponded = responders.has(currentUserId || '');
                const commentsCount = allComments.length;
                const isCommentsOpen = expandedComments[post.id];

                let visibleComments = allComments;
                if (isRecruiting && !isMyPost) {
                   const myFirstName = senderName.split(' ')[0];
                   visibleComments = allComments.filter(c => 
                     c.athlete_id === currentUserId || 
                     (c.athlete_id === post.athlete_id && c.text.includes(`@${myFirstName}`))
                   );
                }

                const allowCommentInput = canUserInteract && (!isRecruiting || isMyPost || !hasResponded);

                // 🚨 AUTOMATED BOUNTY CARD
                if (post.is_bounty) {
                  return (
                    <div key={post.id} className="p-6 sm:p-8 bg-amber-50/50 hover:bg-amber-50 transition-colors relative group rounded-[2rem] border border-amber-100 shadow-sm overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Target className="w-24 h-24 text-amber-500" />
                      </div>
                      <div className="flex items-center gap-4 mb-4 relative z-10">
                        <Link href={`/athlete/${post.athlete_id}`} className="shrink-0 group-hover:scale-105 transition-transform">
                          <AvatarWithBorder avatarUrl={post.athletes.avatar_url} borderId={post.athletes.equipped_border} sizeClasses="w-12 h-12" />
                        </Link>
                        <div>
                          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-0.5">Bounty Claimed!</p>
                          <Link href={`/athlete/${post.athlete_id}`} className="font-black text-lg text-slate-900 hover:text-blue-600 transition-colors">
                            {post.athletes.first_name} {post.athletes.last_name}
                          </Link>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm relative z-10 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Shattered Target PR</span>
                          <span className="font-black text-xl text-slate-800">{post.linked_pr_event}: <span className="text-amber-500">{post.linked_pr_mark}</span></span>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Payout</span>
                          <span className="font-black text-2xl text-emerald-500">+{post.bounty_amount} Cash</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-4 relative z-10">
                        <button onClick={() => handleToggleFire(post.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${iLikedThis ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-white text-slate-500 hover:bg-orange-50 hover:text-orange-500 border border-slate-200'}`}>
                          <Flame className={`w-4 h-4 ${iLikedThis ? 'fill-current' : ''}`} /> {likesCount > 0 ? likesCount : 'Fire'}
                        </button>
                        <span className="text-xs font-bold text-slate-400 ml-auto">{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  )
                }

                // 🏆 STANDARD / PREMIUM FEED CARD RENDER 
                return (
                  <div key={post.id} className={`p-6 sm:p-8 transition-all duration-300 relative z-0 rounded-[2rem] border shadow-sm ${getListGlowClass(post.athletes.equipped_border, post.is_boosted, isPremiumPost)}`}>
                    
                    {post.is_boosted && (
                      <div className="flex items-center gap-2 mb-5 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 px-4 py-1.5 rounded-lg w-max shadow-md">
                        <Rocket className="w-4 h-4" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Boosted Pitch</span>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4 min-w-0">
                        
                        <Link href={`/athlete/${post.athlete_id}`} className="shrink-0 group-hover:scale-105 transition-transform z-10">
                          <AvatarWithBorder avatarUrl={post.athletes.avatar_url} borderId={post.athletes.equipped_border} sizeClasses="w-12 h-12 sm:w-14 sm:h-14" />
                        </Link>

                        <div className="min-w-0 pt-0.5">
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/athlete/${post.athlete_id}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                              <h3 className={`font-black text-lg sm:text-xl tracking-tight leading-tight truncate ${isPremiumPost ? 'text-white' : 'text-slate-900'}`}>
                                {post.athletes.first_name} {post.athletes.last_name}
                              </h3>
                              {post.athletes.trust_level > 0 && (
                                <span title="Verified" className="flex items-center shrink-0">
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                </span>
                              )}
                              {post.athletes.is_premium && (
                                <span title="Pro Member" className={`flex items-center shrink-0 p-0.5 rounded ml-1 ${isPremiumPost ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                                  <Crown className="w-3 h-3" />
                                </span>
                              )}
                            </Link>
                            
                            {/* Render Rank Title (Unless Hidden) */}
                            {activeTitle && activeTitle.id !== 'prospect' && !post.hide_rank && (
                              <span className={`hidden sm:inline-block px-2.5 py-0.5 rounded-[5px] text-[10px] font-black tracking-widest uppercase text-white ${activeTitle.badgeClass}`}>
                                {activeTitle.name}
                              </span>
                            )}
                          </div>
                          
                          <p className={`text-xs sm:text-sm font-bold flex items-center mt-1 truncate ${isPremiumPost ? 'text-slate-400' : 'text-slate-500'}`}>
                            <MapPin className="w-3.5 h-3.5 mr-1 opacity-70 shrink-0" /> <span className="truncate">{post.athletes.high_school}</span>
                          </p>

                          {/* TAGS ROW */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {post.athletes.majors && (
                              <span className={`flex items-center text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider truncate border ${isPremiumPost ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                <GraduationCap className={`w-3 h-3 mr-1 shrink-0 ${isPremiumPost ? 'text-indigo-400' : 'text-purple-500'}`}/> <span className="truncate">{post.athletes.majors}</span>
                              </span>
                            )}
                            
                            {/* 🚨 RENDER PRO BADGE IF EXISTS 🚨 */}
                            {activeBadge && (
                              <span className={`flex items-center text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${activeBadge.color}`}>
                                {activeBadge.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 relative z-20">
                        <span className={`text-[10px] sm:text-xs font-bold shrink-0 mt-1 pl-2 ${isPremiumPost ? 'text-slate-500' : 'text-slate-400'}`}>{formatDate(post.created_at)}</span>
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === post.id ? null : post.id)} 
                          className={`p-1.5 rounded-full transition-colors mt-0.5 relative z-[90] ${isPremiumPost ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
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
                                <Mail className="w-4 h-4 mr-2.5" /> Direct Message
                              </button>
                            )}
                            <button onClick={() => { setOpenDropdownId(null); showToast('Post reported.', 'success'); }} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left border-t border-slate-100 mt-1 pt-2">
                              <Flag className="w-4 h-4 mr-2.5" /> Report Post
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className={`font-medium text-[15px] sm:text-base leading-relaxed mb-4 whitespace-pre-wrap ml-0 sm:ml-16 ${isPremiumPost ? 'text-slate-200' : 'text-slate-700'}`}>
                      {post.content.split(/(@\S+)/).map((part, i) => 
                        part.startsWith('@') ? <span key={i} className={`font-bold px-1 rounded ${isPremiumPost ? 'text-blue-400 bg-blue-500/20' : 'text-blue-600 bg-blue-50'}`}>{part}</span> : part
                      )}
                    </p>

                    {/* FIXED EMPTY IMAGE BUG */}
                    {post.image_url && post.image_url.length > 5 && post.image_url !== 'null' && (
                      <div className="ml-0 sm:ml-16 mb-6">
                        <img src={post.image_url} onError={(e) => e.currentTarget.style.display = 'none'} alt="Attached media" className={`rounded-2xl max-h-96 w-full object-cover border ${isPremiumPost ? 'border-slate-700' : 'border-slate-200'}`} />
                      </div>
                    )}

                    <div className="ml-0 sm:ml-16 flex flex-col gap-5">
                      
                      {/* 🚨 THE GRAND MULTI-PR LIST RENDERER 🚨 */}
                      {(post.linked_prs && post.linked_prs.length > 0) ? (
                        <div className="flex flex-col gap-3">
                          {post.linked_prs.map((pr, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border shadow-sm ${isPremiumPost ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-blue-50 to-white border-blue-100'}`}>
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className={`p-2.5 sm:p-3 rounded-xl shadow-inner ${isPremiumPost ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                                  <Trophy className={`w-5 h-5 sm:w-6 sm:h-6 ${isPremiumPost ? 'text-blue-400' : 'text-blue-600'}`} />
                                </div>
                                <div className="flex flex-col">
                                  <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${isPremiumPost ? 'text-slate-500' : 'text-slate-400'}`}>Verified Event</span>
                                  <span className={`text-sm sm:text-lg font-black uppercase tracking-tight ${isPremiumPost ? 'text-slate-200' : 'text-slate-900'}`}>{pr.event}</span>
                                </div>
                              </div>
                              <div className={`text-2xl sm:text-3xl font-black tracking-tighter ${isPremiumPost ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-blue-600'}`}>
                                {pr.mark}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : post.linked_pr_event ? (
                        /* Legacy Single PR Fallback */
                        <div className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border shadow-sm ${isPremiumPost ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-blue-50 to-white border-blue-100'}`}>
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`p-2.5 sm:p-3 rounded-xl shadow-inner ${isPremiumPost ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                              <Trophy className={`w-5 h-5 sm:w-6 sm:h-6 ${isPremiumPost ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${isPremiumPost ? 'text-slate-500' : 'text-slate-400'}`}>Verified Event</span>
                              <span className={`text-sm sm:text-lg font-black uppercase tracking-tight ${isPremiumPost ? 'text-slate-200' : 'text-slate-900'}`}>{post.linked_pr_event}</span>
                            </div>
                          </div>
                          <div className={`text-2xl sm:text-3xl font-black tracking-tighter ${isPremiumPost ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-blue-600'}`}>
                            {post.linked_pr_mark}
                          </div>
                        </div>
                      ) : null}

                      {/* 🚨 ACTIONS ROW */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button onClick={() => handleToggleFire(post.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-colors shadow-sm ${iLikedThis ? 'bg-orange-500 text-white' : (isPremiumPost ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200')}`}>
                          <Flame className={`w-4 h-4 ${iLikedThis ? 'fill-current' : ''}`} /> {likesCount > 0 ? likesCount : 'Hype'}
                        </button>
                        
                        <button onClick={() => toggleComments(post.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-colors shadow-sm ${isCommentsOpen ? (isPremiumPost ? 'bg-blue-500 text-white border border-blue-500' : 'bg-blue-600 text-white border border-blue-600') : (isPremiumPost ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200')}`}>
                          <MessageSquare className="w-4 h-4" /> 
                          {isRecruiting ? (uniqueRespondersCount > 0 ? `${uniqueRespondersCount} Responses` : 'Respond') : (commentsCount > 0 ? commentsCount : 'Comment')}
                        </button>

                        {/* 🚨 VIEW RESUME BUTTON */}
                        {post.attached_resume && (
                          <button onClick={() => setViewingResumePost(post)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-colors shadow-sm ${isPremiumPost ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}>
                            <FileText className="w-4 h-4" /> View Resume
                          </button>
                        )}

                        {/* 🚨 BOOST BUTTON UI */}
                        {isMyPost && isRecruiting && !post.is_boosted && (
                          <button 
                            disabled={isBoosting}
                            onClick={() => handleBoostPost(post.id)} 
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-colors bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] ml-auto border border-amber-300 disabled:opacity-50"
                          >
                            <Rocket className="w-4 h-4" /> {isBoosting ? 'Boosting...' : 'Boost'}
                          </button>
                        )}
                      </div>

                      {/* 🚨 COMMENTS / RESPONSES SECTION 🚨 */}
                      {isCommentsOpen && (
                        <div className={`mt-2 pt-5 border-t relative z-10 animate-in fade-in slide-in-from-top-2 duration-200 ${isPremiumPost ? 'border-slate-800' : 'border-slate-100'}`}>
                          
                          {isRecruiting && !isMyPost && (
                            <div className={`mb-4 text-xs font-bold p-4 rounded-2xl flex items-center gap-3 border ${isPremiumPost ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-blue-50 text-blue-800 border-blue-100'}`}>
                              <Lock className="w-5 h-5 shrink-0 text-blue-500" />
                              Responses on recruiting pitches are private. Only you and the athlete can see this thread.
                            </div>
                          )}

                          <div className="space-y-5 mb-4 max-h-64 overflow-y-auto px-4 py-2 hide-scrollbar">
                            {visibleComments.map(comment => (
                              <div key={comment.id} className="flex items-start gap-3">
                                <div className="shrink-0 pt-0.5">
                                  <AvatarWithBorder avatarUrl={comment.avatar_url} borderId={comment.border} sizeClasses="w-8 h-8" />
                                </div>
                                <div className="flex flex-col items-start w-full">
                                  <div className={`px-4 py-2.5 rounded-2xl rounded-tl-none border max-w-[90%] sm:max-w-[85%] ${isPremiumPost ? (comment.athlete_id === post.athlete_id ? 'bg-blue-900/30 border-blue-500/30 text-slate-200' : 'bg-slate-800 border-slate-700 text-slate-300') : (comment.athlete_id === post.athlete_id ? 'bg-blue-50 border-blue-100 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700')}`}>
                                    <p className={`text-[11px] font-black mb-0.5 flex items-center gap-1.5 ${isPremiumPost ? 'text-white' : 'text-slate-900'}`}>
                                      {comment.name}
                                      {comment.athlete_id === post.athlete_id && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest">Author</span>}
                                    </p>
                                    <p className="text-sm font-medium whitespace-pre-wrap">
                                      {comment.text.split(/(@\S+)/).map((part, i) => 
                                        part.startsWith('@') ? <span key={i} className={`${isPremiumPost ? 'text-blue-400' : 'text-blue-600'} font-bold`}>{part}</span> : part
                                      )}
                                    </p>
                                  </div>
                                  
                                  {isMyPost && comment.athlete_id !== currentUserId && (
                                    <button 
                                      onClick={() => {
                                        const firstName = comment.name.split(' ')[0];
                                        setCommentInputs(prev => ({...prev, [post.id]: `@${firstName} `}));
                                      }} 
                                      className={`text-[10px] font-bold mt-1 ml-2 flex items-center gap-1 transition-colors ${isPremiumPost ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-600'}`}
                                    >
                                      <Reply className="w-3 h-3" /> Reply
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {visibleComments.length === 0 && (
                              <p className={`text-sm font-bold italic ${isPremiumPost ? 'text-slate-600' : 'text-slate-400'}`}>No responses yet.</p>
                            )}
                          </div>
                          
                          {allowCommentInput ? (
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={commentInputs[post.id] || ''} 
                                onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})} 
                                placeholder={isRecruiting ? "Send a private response..." : "Add a comment..."} 
                                className={`flex-1 rounded-full px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 border shadow-inner ${isPremiumPost ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-950' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'}`} 
                              />
                              <button 
                                onClick={() => handleAddComment(post.id)} 
                                disabled={isSubmittingComment || !commentInputs[post.id]?.trim()} 
                                className="bg-blue-600 hover:bg-blue-500 text-white w-11 h-11 flex items-center justify-center rounded-full disabled:opacity-50 transition-colors shrink-0 shadow-md"
                              >
                                <Send className="w-4 h-4 ml-0.5" />
                              </button>
                            </div>
                          ) : (
                            isRecruiting && hasResponded && !isMyPost ? (
                              <div className={`text-sm font-bold p-4 rounded-2xl text-center flex items-center justify-center gap-2 border ${isPremiumPost ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                <CheckCircle2 className="w-5 h-5" /> You have responded to this pitch.
                              </div>
                            ) : null
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 🚨 RESUME VIEWER MODAL 🚨 */}
      {viewingResumePost && viewingResumePost.attached_resume && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 border border-emerald-200">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-xl leading-tight">{viewingResumePost.athletes.first_name}'s Resume</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Attached to Recruiting Pitch</p>
                </div>
              </div>
              <button onClick={() => setViewingResumePost(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto bg-white flex-1">
              <div className="prose prose-slate max-w-none font-medium whitespace-pre-wrap text-slate-700 leading-relaxed">
                {viewingResumePost.attached_resume}
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}