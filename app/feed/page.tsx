'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation'; 
import { 
  MessageSquare, Send, ShieldCheck, CheckCircle2, MapPin, Mail, X, Trophy, 
  School, UserCircle2, Users, AlertCircle, Flame, Target, Crown, Search, 
  Rocket, AlertTriangle, ChevronDown, Sparkles, Activity, Star, Zap, TrendingUp, 
  HelpCircle, MoreHorizontal, Edit2, Trash2, Flag, Paintbrush, Briefcase, 
  RefreshCw, ArrowDownWideNarrow, Info, SlidersHorizontal, Clock, Radio
} from 'lucide-react';
import Link from 'next/link';

import { AvatarWithBorder } from '@/components/AnimatedBorders';

const BAD_WORDS = ['fuck', 'shit', 'bitch', 'ass', 'asshole', 'dick', 'pussy', 'cunt', 'slut', 'whore', 'fag', 'faggot', 'nigger', 'nigga', 'retard', 'bastard', 'motherfucker'];

const containsBadWords = (text: string) => {
  return BAD_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  });
};

const censorText = (text: string) => {
  let censored = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'ig');
    censored = censored.replace(regex, '***');
  });
  return censored;
};

const ALL_TRACK_EVENTS = [
  '60 Meters', '100 Meters', '200 Meters', '400 Meters', '800 Meters', '1500 Meters', '1600 Meters', '3000 Meters', '3200 Meters',
  '100m Hurdles', '110m Hurdles', '200m Hurdles', '300m Hurdles', '400m Hurdles',
  'Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'
];

interface AthleteData {
  id: string;
  first_name: string;
  last_name: string;
  high_school: string;
  state: string;
  gender: string;
  avatar_url: string | null;
  trust_level: number;
  equipped_border?: string | null;
  equipped_title?: string | null; 
  equipped_card?: string | null; 
  grad_year?: number | null;
  is_premium?: boolean; 
  is_looking_for_college?: boolean;
  coins?: number;
  last_login_date?: string | null;
  athlete_sports?: {
    sport_name: string;
    position: string | null;
    level_of_play: string | null;
    metrics: { name: string; value: string }[] | null;
    custom_fit_score: number;
    is_active: boolean;
  }[];
}

interface CoachData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  school_name: string | null;
  avatar_url: string | null;
  coach_type: string;
  is_verified: boolean;
  division?: string | null;
  sport?: string | null;
  coach_title?: string | null;
}

interface CommentData {
  id: string; athlete_id: string; name: string; avatar_url: string | null; border: string | null; text: string; created_at: string;
}

interface Post {
  id: string; content: string; created_at: string; athlete_id: string; linked_pr_event?: string | null; linked_pr_mark?: string | null;  
  linked_prs?: { event: string; mark: string }[] | null; image_url?: string | null; likes?: string[]; 
  comments?: CommentData[]; is_boosted?: boolean; athletes: AthleteData;
}

const SPORT_OPTIONS = [
  'Track & Field', 'Cross Country', 'Football', 'Soccer', 'Lacrosse', 
  'Field Hockey', 'Basketball', 'Volleyball', 'Wrestling', 'Baseball', 
  'Softball', 'Golf', 'Tennis', 'Ice Hockey', 'Water Polo', 'Gymnastics'
];

const SPORT_POSITIONS: Record<string, string[]> = {
  'Football': ['QB', 'RB', 'WR', 'TE', 'OL', 'C', 'G', 'T', 'DL', 'DT', 'DE', 'EDGE', 'LB', 'ILB', 'OLB', 'CB', 'S', 'K', 'P', 'LS', 'ATH'],
  'Soccer': ['ST', 'CF', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'LM', 'RM', 'LB', 'RB', 'LWB', 'RWB', 'CB', 'GK'],
  'Basketball': ['PG', 'SG', 'CG', 'SF', 'PF', 'C'],
  'Baseball': ['RHP', 'LHP', 'C', '1B', '2B', '3B', 'SS', 'INF', 'LF', 'CF', 'RF', 'OF', 'UTIL'],
  'Softball': ['RHP', 'LHP', 'C', '1B', '2B', '3B', 'SS', 'INF', 'LF', 'CF', 'RF', 'OF', 'UTIL'],
  'Volleyball': ['OH', 'OPP', 'RS', 'MB', 'MH', 'S', 'L', 'DS'],
  'Lacrosse': ['ATT', 'MID', 'FOGO', 'LSM', 'DEF', 'G'],
  'Field Hockey': ['FWD', 'MID', 'DEF', 'GK'],
  'Ice Hockey': ['C', 'LW', 'RW', 'F', 'D', 'G'],
  'Water Polo': ['Attacker', 'Center', 'Center Defender', 'Utility', 'Goalkeeper']
};

const COACH_TITLES = [
  'Head Coach', 'Associate Head Coach', 'Assistant Coach', 
  'Director of Operations', 'Recruiting Coordinator', 'Graduate Assistant', 
  'Volunteer Assistant', 'Positional Coach', 'Strength & Conditioning'
];

const getScoreTier = (score: number) => {
  if (score >= 95) return 'Power 4 D1';
  if (score >= 85) return 'Mid-Major D1';
  if (score >= 75) return 'D1 Walk-On / Top D2';
  if (score >= 65) return 'D2 / D3 Prospect';
  if (score >= 55) return 'NAIA Prospect';
  if (score >= 40) return 'Strong Varsity';
  if (score >= 20) return 'Varsity Contributor';
  if (score > 0) return 'Developmental';
  return 'Unranked';
};

const getValidGradYears = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const isAfterRollover = today.getMonth() > 6 || (today.getMonth() === 6 && today.getDate() >= 15);
  const seniorYear = isAfterRollover ? currentYear + 1 : currentYear;
  return [seniorYear, seniorYear + 1, seniorYear + 2, seniorYear + 3];
};

const getCardStyles = (cardId: string | null | undefined, type: 'post' | 'dir') => {
  let id = cardId || 'base';
  if (id === 'default') id = 'base';

  const isFoil = ['hype', 'premium', 'crimson', 'sapphire'].includes(id);
  const isAnimated = ['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber'].includes(id);
  const hasGlare = ['hype', 'premium'].includes(id); 
  const hasTrophy = ['hype', 'premium'].includes(id);

  let bgClass = '';
  if (id === 'base') {
     bgClass = type === 'post' ? 'bg-white/[0.02]' : 'bg-gradient-to-b from-white/[0.05] to-transparent';
  } else {
     bgClass = `holo-card-${id}`;
  }

  return {
     bgClass,
     isFoil,
     isCustom: id !== 'base',
     isAnimated,
     hasGlare,
     hasTrophy,
     borderClass: id === 'base' ? (type === 'post' ? 'border-white/5 hover:border-white/10' : 'border-white/10') : 'border-white/20 shadow-xl'
  };
};

const formatLastSeen = (dateString?: string | null) => {
  if (!dateString) return { text: "Status Unknown", color: "bg-slate-500", dot: "bg-slate-400" };
  const lastDate = new Date(dateString);
  const today = new Date();
  
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays <= 1) return { text: "Active Today", color: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300", dot: "bg-emerald-400 animate-pulse" };
  if (diffDays <= 3) return { text: `Active ${diffDays}d ago`, color: "bg-amber-500/20 border-amber-500/30 text-amber-300", dot: "bg-amber-400" };
  if (diffDays <= 7) return { text: `Active this week`, color: "bg-blue-500/20 border-blue-500/30 text-blue-300", dot: "bg-blue-400" };
  return { text: "Inactive > 1 Week", color: "bg-slate-700/50 border-slate-600 text-slate-400", dot: "bg-slate-500" };
};

export default function FeedPage() {
  const supabase = createClient();
  const router = useRouter(); 
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [coachesList, setCoachesList] = useState<CoachData[]>([]);
  const [recruitsList, setRecruitsList] = useState<AthleteData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(''); 
  const [currentUserProfile, setCurrentUserProfile] = useState<AthleteData | null>(null);
  const [coachProfile, setCoachProfile] = useState<CoachData | null>(null);
  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');
  
  const [isUpperclassman, setIsUpperclassman] = useState(false);
  
  const [feedTab, setFeedTab] = useState<'feed' | 'network'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filterDivision, setFilterDivision] = useState('');
  const [filterCoachSport, setFilterCoachSport] = useState('');
  const [filterTitle, setFilterTitle] = useState('');

  const [filterAthleteState, setFilterAthleteState] = useState('');
  const [filterGradYear, setFilterGradYear] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterTargetScore, setFilterTargetScore] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false); 

  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [isSubmittingDiscussion, setIsSubmittingDiscussion] = useState(false);

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<{ id: string, name: string, school: string, role: string } | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [existingThread, setExistingThread] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [isCheckingThread, setIsCheckingThread] = useState(false);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{postId: string, commentId: string} | null>(null);

  const [reportModal, setReportModal] = useState<{type: 'post'|'comment', id: string, targetId: string, content: string} | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate Language');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editDivision, setEditDivision] = useState('');
  const [editSport, setEditSport] = useState('');
  const [editCoachTitle, setEditCoachTitle] = useState('');
  const [schoolOptions, setSchoolOptions] = useState<{id: string, name: string, division: string}[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);
  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [animatingHype, setAnimatingHype] = useState<string | null>(null);
  const [coinPopId, setCoinPopId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => { 
    fetchFeedAndUser(); 
  }, []); 

  useEffect(() => {
    if (feedTab === 'network') {
      if (viewerRole !== 'coach') fetchCoaches();
      if (viewerRole === 'coach') fetchRecruits();
    }
  }, [feedTab, viewerRole]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.more-dropdown')) setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUniversities = async () => {
      if (!editSchoolName || editSchoolName.length < 2) {
        setSchoolOptions([]);
        return;
      }
      setIsSearchingSchool(true);
      const { data } = await supabase.from('universities').select('id, name, division').ilike('name', `%${editSchoolName}%`).order('name').limit(10);
      if (data) setSchoolOptions(data);
      setIsSearchingSchool(false);
    };
    const timeoutId = setTimeout(searchUniversities, 300);
    return () => clearTimeout(timeoutId);
  }, [editSchoolName]);

  async function fetchFeedAndUser() {
    const { data: { session } } = await supabase.auth.getSession();
    
    let currentTrustLevel = 0;
    let currentFirstName = '';
    let isAthlete = false;
    let uId = '';

    if (session) {
      uId = session.user.id;
      setCurrentUserId(uId);
      setCurrentUserEmail(session.user.email || '');

      const { data: cData } = await supabase.from('coaches').select('*').eq('id', session.user.id).maybeSingle();
      
      if (cData) {
        setViewerRole('coach');
        setCoachProfile(cData);
      } else {
        const { data: aData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();

        if (aData) {
          setViewerRole('athlete');
          setCurrentUserProfile(aData as AthleteData);
          currentTrustLevel = aData.trust_level || 0;
          currentFirstName = aData.first_name || '';
          isAthlete = true;
          
          if (aData.grad_year) {
            const currentYear = new Date().getFullYear();
            if (aData.grad_year <= currentYear + 2) setIsUpperclassman(true);
          }
        }
      }
    }

    if (isAthlete && currentTrustLevel >= 1 && uId) {
       const welcomeMsg = `A new athlete has verified! Welcome ${currentFirstName} to the trusted network.`;
       
       // FIX: Using .limit(1) instead of .maybeSingle() prevents cascading duplication
       // if a race condition ever creates more than 1 welcome message.
       const { data: existingWelcomeRows } = await supabase.from('posts')
          .select('id')
          .eq('athlete_id', uId)
          .eq('content', welcomeMsg)
          .limit(1);

       if (!existingWelcomeRows || existingWelcomeRows.length === 0) {
           await supabase.from('posts').insert({
               athlete_id: uId,
               content: welcomeMsg
           });
       }
    }

    const { data: feedData } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, athlete_id, linked_pr_event, linked_pr_mark, linked_prs, image_url, likes, comments, is_boosted,
        athletes (id, first_name, last_name, high_school, state, gender, avatar_url, trust_level, equipped_border, equipped_title, equipped_card, grad_year, is_premium, is_looking_for_college, athlete_sports (sport_name, position, custom_fit_score, metrics))
      `)
      .order('created_at', { ascending: false })
      .limit(100);
      
    setPosts((feedData as unknown as Post[]) || []);
    setLoading(false);
  }

  async function fetchCoaches() {
    const { data, error } = await supabase
      .from('coaches')
      .select('id, first_name, last_name, school_name, avatar_url, coach_type, is_verified, division, sport, coach_title')
      .order('school_name', { ascending: true });
      
    if (error) showToast("Could not load coaches.", "error");
    if (data) setCoachesList(data as unknown as CoachData[]);
  }

  async function fetchRecruits() {
    const { data, error } = await supabase
      .from('athletes')
      .select(`
        id, first_name, last_name, high_school, state, gender, avatar_url, grad_year, trust_level, is_premium, is_looking_for_college, equipped_border, equipped_card, last_login_date,
        athlete_sports (sport_name, position, level_of_play, metrics, custom_fit_score, is_active)
      `)
      .not('first_name', 'is', null)
      .order('trust_level', { ascending: false })
      .limit(300);

    if (error) {
      console.error("Supabase Recruits Fetch Error:", error.message);
      showToast("Could not load recruiting boards.", "error");
    }

    if (data) {
      const validRecruits = (data as unknown as AthleteData[]).filter(r => {
          const fName = r.first_name || '';
          const lName = r.last_name || '';
          return fName.trim().length > 0 && lName.trim().length > 0;
      });
      setRecruitsList(validRecruits);
    }
  }

  const handleEditToggle = () => {
    if (!coachProfile) return;
    setEditFirstName(coachProfile.first_name || '');
    setEditLastName(coachProfile.last_name || '');
    setEditSchoolName(coachProfile.school_name || '');
    setEditDivision(coachProfile.division || '');
    setEditSport(coachProfile.sport || '');
    setEditCoachTitle(coachProfile.coach_title || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!coachProfile?.id) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase.from('coaches').update({
        first_name: editFirstName.trim(), last_name: editLastName.trim(),
        school_name: editSchoolName.trim(), division: editDivision.trim() || null,
        sport: editSport.trim(), coach_title: editCoachTitle.trim()
      }).eq('id', coachProfile.id);

      if (error) throw error;

      setCoachProfile(prev => prev ? { 
        ...prev, first_name: editFirstName.trim(), last_name: editLastName.trim(), 
        school_name: editSchoolName.trim(), division: editDivision.trim() || null,
        sport: editSport.trim(), coach_title: editCoachTitle.trim()
      } : null);
      
      setIsEditingProfile(false);
      showToast("Profile updated successfully!", "success");
    } catch (err: any) { showToast(`Failed to save profile: ${err.message}`); } 
    finally { setIsSavingProfile(false); }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionContent.trim() || !currentUserId || viewerRole !== 'athlete') return;

    if (currentUserProfile?.trust_level === 0) {
        showToast("You must be verified (Trust Level 1) to post in the feed.", "error");
        return;
    }

    let finalContent = newDiscussionContent.trim();
    let wasCensored = false;

    if (containsBadWords(finalContent)) {
      finalContent = censorText(finalContent);
      wasCensored = true;
      supabase.from('reports').insert({ reporter_id: currentUserId, reported_id: currentUserId, content_type: 'post', content_id: 'new', content_snapshot: newDiscussionContent, reason: 'Auto-detected Profanity' }).then(); 
    }

    setIsSubmittingDiscussion(true);
    try {
      const { data, error } = await supabase.from('posts').insert({
        athlete_id: currentUserId,
        content: finalContent
      }).select(`
        id, content, created_at, athlete_id, linked_pr_event, linked_pr_mark, linked_prs, image_url, likes, comments, is_boosted,
        athletes (id, first_name, last_name, high_school, state, gender, avatar_url, trust_level, equipped_border, equipped_title, equipped_card, grad_year, is_premium, is_looking_for_college)
      `).single();

      if (error) throw error;

      setPosts([data as unknown as Post, ...posts]);
      setNewDiscussionContent('');
      
      if (wasCensored) showToast("Warning: Inappropriate language was removed.", "error");
      else showToast("Post shared with the community!", "success");
    } catch (err: any) { showToast(err.message, "error"); }
    finally { setIsSubmittingDiscussion(false); }
  };

  const handleSavePostEdit = async (postId: string) => {
    if (!editPostContent.trim()) return;
    let finalContent = editPostContent.trim();
    let wasCensored = false;

    if (containsBadWords(finalContent)) {
      finalContent = censorText(finalContent);
      wasCensored = true;
      if (currentUserId) supabase.from('reports').insert({ reporter_id: currentUserId, reported_id: currentUserId, content_type: 'post', content_id: postId, content_snapshot: editPostContent, reason: 'Auto-detected Profanity' }).then(); 
    }

    try {
      const { error } = await supabase.from('posts').update({ content: finalContent }).eq('id', postId);
      if (error) throw error;
      setPosts(posts.map(p => p.id === postId ? { ...p, content: finalContent } : p));
      setEditingPostId(null);
      if (wasCensored) showToast("Warning: Inappropriate language was removed and flagged.", "error");
      else showToast("Post updated successfully.", "success");
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await supabase.from('posts').delete().eq('id', postToDelete);
      setPosts(posts.filter(p => p.id !== postToDelete));
      showToast("Post deleted successfully.", "success");
    } catch (err: any) { 
      showToast(err.message, "error"); 
    } finally {
      setPostToDelete(null);
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      const targetPost = posts.find(p => p.id === commentToDelete.postId);
      if (!targetPost || !targetPost.comments) return;
      
      const updatedComments = targetPost.comments.filter(c => c.id !== commentToDelete.commentId);
      await supabase.from('posts').update({ comments: updatedComments }).eq('id', commentToDelete.postId);
      setPosts(posts.map(p => p.id === commentToDelete.postId ? { ...p, comments: updatedComments } : p));
      showToast("Comment deleted successfully.", "success");
    } catch (err: any) { 
      showToast(err.message, "error"); 
    } finally {
      setCommentToDelete(null);
    }
  };

  const handleSaveCommentEdit = async (postId: string, commentId: string) => {
    if (!editCommentContent.trim()) return;
    let finalContent = editCommentContent.trim();
    if (containsBadWords(finalContent)) finalContent = censorText(finalContent);

    try {
      const targetPost = posts.find(p => p.id === postId);
      if (!targetPost || !targetPost.comments) return;
      const updatedComments = targetPost.comments.map(c => c.id === commentId ? { ...c, text: finalContent } : c);
      await supabase.from('posts').update({ comments: updatedComments }).eq('id', postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
      setEditingCommentId(null);
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !reportModal) return;
    setIsSubmittingReport(true);
    try {
      await supabase.from('reports').insert({
        reporter_id: currentUserId, reported_id: reportModal.targetId,
        content_type: reportModal.type, content_id: reportModal.id,
        content_snapshot: reportModal.content, reason: reportReason
      });
      showToast("Report submitted successfully.", "success");
      setReportModal(null);
    } catch (err: any) { showToast("Failed to submit report.", "error"); } 
    finally { setIsSubmittingReport(false); }
  };

  const handleToggleFire = async (postId: string, postAuthorId: string) => {
    if (!currentUserId) { router.push('/login'); return; }
    
    if (viewerRole === 'athlete' && (currentUserProfile?.trust_level || 0) === 0) {
        showToast("You must be verified (Trust Level 1) to give Hype.", "error");
        return;
    }

    setAnimatingHype(postId);
    setTimeout(() => setAnimatingHype(null), 300);

    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;
    const hasLiked = targetPost.likes?.includes(currentUserId);

    // Optimistically update the UI to feel lightning fast
    setPosts(currentPosts => currentPosts.map(post => {
      if (post.id === postId) {
        const likes = post.likes || [];
        return { ...post, likes: hasLiked ? likes.filter(id => id !== currentUserId) : [...likes, currentUserId] };
      }
      return post;
    }));
    
    // Toggle the actual like mapping array in the DB
    await supabase.rpc('toggle_post_like', { p_post_id: postId, p_user_id: currentUserId });
    
    // =========================================================================
    // 🚨 ANTI-FARMING SECURE CHASEDCASH REWARD ALGORITHM 🚨
    // =========================================================================
    if (!hasLiked && postAuthorId !== currentUserId) {
      try {
        // We use the messages table as a secure, server-side audit log to prevent un-hype/re-hype farming
        const rewardRef = `[HYPE_REF:${postId}_${currentUserId}]`;

        // Check if this exact user has ever triggered a reward for this exact post
        const { data: existingReward } = await supabase
          .from('messages')
          .select('id')
          .eq('athlete_id', postAuthorId)
          .eq('sender_school', 'ChasedRewards')
          .like('content', `%${rewardRef}%`)
          .maybeSingle();

        if (!existingReward) {
          // 1. Give 5 ChasedCash to the LIKER (if they are an athlete)
          if (viewerRole === 'athlete' && currentUserProfile) {
             // Fetch absolute latest to prevent race conditions instead of relying on local state
             const { data: myData } = await supabase.from('athletes').select('coins').eq('id', currentUserId).single();
             const myNewCoins = (myData?.coins || 0) + 5;
             await supabase.from('athletes').update({ coins: myNewCoins }).eq('id', currentUserId);
             setCurrentUserProfile(prev => prev ? { ...prev, coins: myNewCoins } : null);
          }

          // 2. Give 5 ChasedCash to the POSTER
          const { data: receiverData } = await supabase.from('athletes').select('coins, first_name').eq('id', postAuthorId).single();
          if (receiverData) {
            await supabase.from('athletes').update({ coins: (receiverData.coins || 0) + 5 }).eq('id', postAuthorId);

            const senderName = viewerRole === 'coach' ? `Coach ${coachProfile?.last_name || ''}` : `${currentUserProfile?.first_name || ''} ${currentUserProfile?.last_name || ''}`;
            
            // Insert the audit log via the direct messaging system so the user gets notified AND we block future farming
            await supabase.from('messages').insert({
                athlete_id: postAuthorId,
                sender_name: 'ChasedSports System',
                sender_school: 'ChasedRewards',
                sender_email: 'rewards@chasedsports.com',
                content: `🔥 ${senderName.trim()} just hyped your post! Just a reminder: Every time you receive hype on your posts, you gain 5 ChasedCash per like! Keep up the great work.\n\n${rewardRef}`,
                is_read: false,
                status: 'active'
            });
          }

          setCoinPopId(postId);
          setTimeout(() => setCoinPopId(null), 1000);
        }
      } catch (e) {
         console.error("Hype Reward Error", e);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault(); 
    
    if (viewerRole === 'athlete' && (currentUserProfile?.trust_level || 0) === 0) {
        showToast("You must be verified (Trust Level 1) to comment.", "error");
        return;
    }

    const text = commentInputs[postId];
    if (!text || !text.trim() || !currentUserId) return;
    let finalContent = text.trim();
    if (containsBadWords(finalContent)) finalContent = censorText(finalContent);

    setIsSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const myAvatar = viewerRole === 'coach' ? coachProfile?.avatar_url : currentUserProfile?.avatar_url;
      const myBorder = viewerRole === 'coach' ? 'none' : currentUserProfile?.equipped_border;
      const myName = viewerRole === 'coach' ? `Coach ${coachProfile?.last_name || ''}` : currentUserProfile?.first_name + ' ' + currentUserProfile?.last_name;

      const newComment: CommentData = {
        id: Math.random().toString(), athlete_id: currentUserId, name: myName.trim(),
        avatar_url: myAvatar || '', border: myBorder || 'none', text: finalContent, created_at: new Date().toISOString()
      };

      setPosts(currentPosts => currentPosts.map(post => post.id === postId ? { ...post, comments: [...(post.comments || []), newComment] } : post));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));

      const targetPost = posts.find(p => p.id === postId);
      await supabase.from('posts').update({ comments: [...(targetPost?.comments || []), newComment] }).eq('id', postId);
    } catch (err: any) { showToast("Failed to submit: " + err.message); } 
    finally { setIsSubmittingComment(prev => ({ ...prev, [postId]: false })); }
  };

  const toggleComments = (postId: string) => { setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] })); };

  const openMessageModal = async (id: string, name: string, school: string, role: string) => {
    if (viewerRole === 'guest' || !currentUserId) { router.push('/login?reason=contact'); return; }
    
    if (viewerRole === 'athlete' && role === 'coach' && (currentUserProfile?.trust_level || 0) < 1) {
       showToast("You must be verified (Trust Level 1) to direct message coaches.", "error");
       return;
    }
    
    setMessageRecipient({ id, name, school, role });
    setSendSuccess(false); 
    setMessageContent(''); 
    setShowDuplicateWarning(false);
    setExistingThread(null);
    setIsMessageModalOpen(true);
    setIsCheckingThread(true);

    try {
      let fetchQuery = supabase.from('messages').select('*');

      if (role === 'coach') {
         fetchQuery = fetchQuery.eq('athlete_id', currentUserId).eq('coach_id', id);
      } else if (viewerRole === 'coach' && role === 'athlete') {
         fetchQuery = fetchQuery.eq('athlete_id', id).eq('coach_id', currentUserId);
      } else {
         fetchQuery = fetchQuery.or(`and(athlete_id.eq.${id},sender_id.eq.${currentUserId}),and(athlete_id.eq.${currentUserId},sender_id.eq.${id})`);
      }

      const { data, error } = await fetchQuery.order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (error) {
         if (error.message.includes('coach_id') || error.message.includes('sender_id')) {
            showToast("DATABASE ERROR: Please run the provided SQL snippet to add missing routing columns.", "error");
            setIsMessageModalOpen(false); 
            return;
         }
         throw error;
      }

      if (data) setExistingThread(data);

    } catch (e) {
      console.error("Thread Check Error:", e);
    } finally {
      setIsCheckingThread(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageRecipient || !currentUserId) return;

    if (existingThread && !showDuplicateWarning) {
      setShowDuplicateWarning(true);
      return;
    }

    let finalContent = messageContent.trim();
    if (containsBadWords(finalContent)) finalContent = censorText(finalContent);

    setIsSending(true);
    try {
      if (!isUpperclassman && messageRecipient.role === 'coach') {
         finalContent = `[⚠️ NCAA COMPLIANCE WARNING: The sender is an underclassman (Freshman/Sophomore). Per NCAA rules, you cannot reply to this message until June 15th after their Sophomore year.]\n\n${finalContent}`;
      }

      if (existingThread) {
        const newReply = {
          sender_id: currentUserId,
          content: finalContent,
          created_at: new Date().toISOString()
        };
        const updatedHistory = [...(existingThread.chat_history || []), newReply];
        
        const { error } = await supabase.from('messages').update({
          chat_history: updatedHistory,
          status: 'active',
          is_read: false
        }).eq('id', existingThread.id);
        
        if (error) throw error;

      } else {
        const senderName = viewerRole === 'coach' 
          ? `Coach ${coachProfile?.last_name || ''}`.trim()
          : `${currentUserProfile?.first_name || ''} ${currentUserProfile?.last_name || ''}`.trim();

        const senderSchool = viewerRole === 'coach'
          ? coachProfile?.school_name || ''
          : currentUserProfile?.high_school || '';

        let finalAthleteId = currentUserId;
        let finalCoachId = null;

        if (viewerRole === 'athlete' && messageRecipient.role === 'coach') {
          finalAthleteId = currentUserId;
          finalCoachId = messageRecipient.id;
        } else if (viewerRole === 'coach' && messageRecipient.role === 'athlete') {
          finalAthleteId = messageRecipient.id;
          finalCoachId = currentUserId;
        }

        const { error } = await supabase.from('messages').insert({
          athlete_id: finalAthleteId,
          coach_id: finalCoachId,
          sender_id: currentUserId,
          sender_name: senderName || 'Unknown',
          sender_school: senderSchool || 'Unknown',
          sender_email: currentUserEmail, 
          content: finalContent, 
          status: 'pending',
          is_read: false,
          chat_history: []
        });

        if (error) {
           if (error.message.includes('coach_id') || error.message.includes('sender_id')) {
              showToast("DATABASE ERROR: You must run the provided SQL snippet to send messages.", "error");
              setIsSending(false);
              return;
           }
           throw error;
        }
      }
      
      setSendSuccess(true);
      setTimeout(() => { setIsMessageModalOpen(false); setSendSuccess(false); setMessageContent(''); setShowDuplicateWarning(false); setExistingThread(null); }, 2000);
    } catch (error: any) { 
      console.error("Messaging Error:", error);
      showToast(`Database Error: ${error?.message || 'Check browser console'}`, 'error'); 
    } finally { 
      setIsSending(false); 
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString); const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    if (isToday) return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const FeedSkeleton = () => (
    <div className="space-y-8 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 bg-white/5 rounded-full shrink-0" />
            <div className="space-y-2 flex-1 pt-1">
              <div className="w-32 h-4 bg-white/5 rounded" />
              <div className="w-24 h-3 bg-white/5 rounded" />
            </div>
          </div>
          <div className="space-y-3 mb-6"><div className="w-full h-3 bg-white/5 rounded" /><div className="w-5/6 h-3 bg-white/5 rounded" /></div>
        </div>
      ))}
    </div>
  );

  const validGradYears = useMemo(() => getValidGradYears(), []);

  const filteredDirectory = useMemo(() => {
    if (viewerRole !== 'coach') {
      const baseFiltered = coachesList.filter(c => {
        const matchQuery = !searchQuery || c.school_name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.first_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchDiv = !filterDivision || c.division === filterDivision;
        const matchSport = !filterCoachSport || c.sport === filterCoachSport;
        return matchQuery && matchDiv && matchSport;
      });
      const exactMatches = baseFiltered.filter(c => !filterTitle || c.coach_title === filterTitle);
      return exactMatches.length > 0 ? exactMatches : baseFiltered;
    } else {
      return recruitsList.filter(athlete => {
        const fullName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim().toLowerCase();
        const searchMatch = !searchQuery || fullName.includes(searchQuery.toLowerCase()) || (athlete.high_school && athlete.high_school.toLowerCase().includes(searchQuery.toLowerCase()));
        const stateMatch = !filterAthleteState || athlete.state === filterAthleteState;
        const gradYearMatch = !filterGradYear || athlete.grad_year?.toString() === filterGradYear;
        
        let sportMatch = false;
        let positionMatch = false;
        let sportData = null;

        if (filterSport) {
          sportData = athlete.athlete_sports?.find(s => s.sport_name === filterSport && s.is_active);
          sportMatch = !!sportData;
          if (sportMatch && filterPosition) {
             positionMatch = !!sportData?.metrics?.some(m => m.name.toLowerCase().includes(filterPosition.toLowerCase())) || !!sportData?.position?.toLowerCase().includes(filterPosition.toLowerCase());
          } else {
             positionMatch = true;
          }
        } else {
          sportMatch = true;
          positionMatch = true;
        }

        let scoreMatch = true;
        if (filterTargetScore && sportMatch && sportData) {
          const targetNum = parseInt(filterTargetScore);
          if (!isNaN(targetNum)) {
             if (sportData.custom_fit_score < targetNum) scoreMatch = false;
          }
        }

        return searchMatch && stateMatch && gradYearMatch && sportMatch && positionMatch && scoreMatch;
      });
    }
  }, [viewerRole, coachesList, recruitsList, searchQuery, filterDivision, filterCoachSport, filterTitle, filterAthleteState, filterGradYear, filterSport, filterPosition, filterTargetScore]);

  const positionOptions = filterSport === 'Track & Field' ? ALL_TRACK_EVENTS : (SPORT_POSITIONS[filterSport] || []);
  const filteredSports = SPORT_OPTIONS.filter(s => s.toLowerCase().includes(editSport.toLowerCase()) && s.toLowerCase() !== editSport.toLowerCase());
  const filteredTitles = COACH_TITLES.filter(t => t.toLowerCase().includes(editCoachTitle.toLowerCase()) && t.toLowerCase() !== editCoachTitle.toLowerCase());
  const profileIncomplete = viewerRole === 'coach' && coachProfile && (!coachProfile.first_name || !coachProfile.last_name || !coachProfile.school_name || !coachProfile.sport || !coachProfile.coach_title);

  return (
    <main className="min-h-screen bg-[#06090F] text-white font-sans pb-32 relative selection:bg-blue-500/30 overflow-hidden">
      
      {/* GLOWS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerGlare { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes pulseHype { 0% { transform: scale(1); } 50% { transform: scale(1.15) rotate(-5deg); } 100% { transform: scale(1); } }
        @keyframes floatUpFade { 0% { opacity: 0; transform: translateY(10px) scale(0.8); } 20% { opacity: 1; transform: translateY(0px) scale(1.2); } 80% { opacity: 1; transform: translateY(-30px) scale(1); } 100% { opacity: 0; transform: translateY(-40px) scale(0.9); } }
        
        .holo-card-base { background: transparent; }
        .holo-card-obsidian { background: linear-gradient(135deg, #0f172a 0%, #334155 25%, #000000 50%, #0f172a 75%, #1e293b 100%); background-size: 300% 300%; }
        .holo-card-crimson { background: linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #450a0a 100%); background-size: 300% 300%; }
        .holo-card-sapphire { background: linear-gradient(135deg, #172554 0%, #0ea5e9 50%, #172554 100%); background-size: 300% 300%; }
        
        .holo-card-hype { background: linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent 100%), linear-gradient(135deg, #4f46e5 0%, #9333ea 25%, #ec4899 50%, #3b82f6 75%, #4f46e5 100%); background-size: 40px 40px, 300% 300%; }
        .holo-card-premium { background: repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px), linear-gradient(135deg, #b45309 0%, #f59e0b 25%, #fef08a 50%, #d97706 75%, #78350f 100%); background-size: 100% 100%, 300% 300%; }

        .animate-foil { animation: foilShift 15s ease-in-out infinite; }
        .holo-glare { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%); background-size: 200% auto; animation: shimmerGlare 8s infinite linear; pointer-events: none; z-index: 10; mix-blend-mode: overlay;}
        .hype-pop { animation: pulseHype 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .coin-float { position: absolute; top: -20px; left: 50%; margin-left: -20px; color: #4ade80; font-weight: 900; font-size: 1.1rem; text-shadow: 0 2px 10px rgba(74,222,128,0.4); pointer-events: none; animation: floatUpFade 1s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 50; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 10px; }
      `}} />

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'bg-rose-950/90 border-rose-900/50 text-rose-200' : 'bg-emerald-950/90 border-emerald-900/50 text-emerald-200'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />}
            <p className="text-xs font-bold leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      {/* 🚨 DELETE CONFIRMATION MODALS (REPLACING NATIVE ALERTS) 🚨 */}
      {(postToDelete || commentToDelete) && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => { setPostToDelete(null); setCommentToDelete(null); }}></div>
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-sm shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-400 border border-rose-500/30">
            <div className="bg-rose-950/30 border-b border-rose-900/50 p-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-white tracking-tight">Confirm Deletion</h3>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-0.5">This cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                Are you absolutely sure you want to permanently delete this {postToDelete ? 'post' : 'comment'}?
              </p>

              <div className="flex gap-3 w-full">
                <button onClick={() => { setPostToDelete(null); setCommentToDelete(null); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors border border-white/10">
                  Cancel
                </button>
                <button onClick={postToDelete ? confirmDeletePost : confirmDeleteComment} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 SCORING GUIDE MODAL 🚨 */}
      {showScoringModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowScoringModal(false)}></div>
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-400 border border-indigo-500/30">
            <div className="bg-indigo-950/30 border-b border-indigo-900/50 p-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/30">
                  <Star className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-white tracking-tight">Scoring System</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Overall Recruiting Metrics</p>
                </div>
              </div>
              <button onClick={() => setShowScoringModal(false)} className="relative z-10 p-2 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 md:p-8 space-y-4">
              <p className="text-sm text-slate-300 font-medium leading-relaxed mb-6">
                ChasedSports standardizes metrics across all sports, positions, and genders into a master <strong className="text-white">0-99 score</strong> to identify prospects instantly.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                  <div className="w-16 text-center shrink-0"><span className="text-xl font-black text-fuchsia-400">95+</span></div>
                  <div>
                    <h4 className="font-black text-white text-sm">Power 4 D1</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Top tier national talent. Immediate impact at major programs.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                  <div className="w-16 text-center shrink-0"><span className="text-xl font-black text-purple-400">85+</span></div>
                  <div>
                    <h4 className="font-black text-white text-sm">Mid-Major D1</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Strong D1 prospect. Competitive at the mid-major level.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                  <div className="w-16 text-center shrink-0"><span className="text-xl font-black text-blue-400">75+</span></div>
                  <div>
                    <h4 className="font-black text-white text-sm">D1 Walk-On / Top D2</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Fringe D1 standard or high-impact D2 recruit.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                  <div className="w-16 text-center shrink-0"><span className="text-xl font-black text-emerald-400">65+</span></div>
                  <div>
                    <h4 className="font-black text-white text-sm">D2 / D3 Prospect</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Solid collegiate potential for competitive D2/D3 programs.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 COACH PROFILE EDIT MODAL 🚨 */}
      {viewerRole === 'coach' && isEditingProfile && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsEditingProfile(false)}></div>
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-400 border border-indigo-500/30">
            <div className="bg-indigo-950/30 border-b border-indigo-900/50 p-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/30">
                  <Briefcase className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-white tracking-tight">Complete Profile</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">NCAA Directory Setup</p>
                </div>
              </div>
              <button onClick={() => setIsEditingProfile(false)} className="relative z-10 p-2 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 md:p-8 space-y-4">
               <div className="grid grid-cols-2 gap-3 mb-1">
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                   <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} placeholder="John" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1" />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                   <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} placeholder="Doe" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1" />
                 </div>
               </div>

               <div className="relative">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">University Name</label>
                 <div className="relative">
                   <input type="text" value={editSchoolName} onChange={e => { setEditSchoolName(e.target.value); setEditDivision(''); setShowSchoolDropdown(true); }} onFocus={() => { if (editSchoolName.length >= 2) setShowSchoolDropdown(true); }} onBlur={() => setShowSchoolDropdown(false)} placeholder="Search for your university..." className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1 pr-10" />
                   {isSearchingSchool && <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5"><RefreshCw className="w-4 h-4 text-slate-500 animate-spin" /></div>}
                 </div>
                 {showSchoolDropdown && schoolOptions.length > 0 && (
                   <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                     {schoolOptions.map(option => (
                       <button key={option.id} type="button" onMouseDown={(e) => { e.preventDefault(); setEditSchoolName(option.name); setEditDivision(option.division || ''); setShowSchoolDropdown(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex justify-between items-center border-b border-slate-700/50 last:border-0">
                         <span className="truncate pr-2">{option.name}</span>
                         {option.division && <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-900 px-2 py-0.5 rounded">{option.division}</span>}
                       </button>
                     ))}
                   </div>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-3 mb-2">
                 <div className="relative">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sport</label>
                   <input type="text" value={editSport} onChange={e => { setEditSport(e.target.value); setShowSportDropdown(true); }} onFocus={() => setShowSportDropdown(true)} onBlur={() => setShowSportDropdown(false)} placeholder="e.g. Football" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1" />
                   {showSportDropdown && filteredSports.length > 0 && (
                     <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                       {filteredSports.map(sport => (
                         <button key={sport} type="button" onMouseDown={(e) => { e.preventDefault(); setEditSport(sport); setShowSportDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">{sport}</button>
                       ))}
                     </div>
                   )}
                 </div>
                 <div className="relative">
                   <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 transition-colors ${!editSport.trim() ? 'text-slate-600' : 'text-slate-400'}`}>Title</label>
                   <input type="text" value={editCoachTitle} onChange={e => { setEditCoachTitle(e.target.value); setShowTitleDropdown(true); }} onFocus={() => setShowTitleDropdown(true)} onBlur={() => setShowTitleDropdown(false)} disabled={!editSport.trim()} placeholder={editSport.trim() ? "e.g. Head Coach" : "Select a sport first"} className={`w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1 transition-all ${!editSport.trim() ? 'opacity-50 cursor-not-allowed bg-slate-800' : ''}`} />
                   {showTitleDropdown && editSport.trim() && filteredTitles.length > 0 && (
                     <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                       {filteredTitles.map(title => (
                         <button key={title} type="button" onMouseDown={(e) => { e.preventDefault(); setEditCoachTitle(title); setShowTitleDropdown(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">{title}</button>
                       ))}
                     </div>
                   )}
                 </div>
               </div>

               <div className="mt-4">
                 <button onClick={handleSaveProfile} disabled={isSavingProfile || !editFirstName.trim() || !editLastName.trim() || !editSchoolName.trim() || !editSport.trim() || !editCoachTitle.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center">
                   {isSavingProfile ? 'Saving...' : 'Save Profile'}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 MESSAGING MODAL WITH THREAD APPENDING LOGIC 🚨 */}
      {isMessageModalOpen && messageRecipient && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMessageModalOpen(false)}></div>
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-400 border border-white/10">
            <div className="bg-white/[0.02] border-b border-white/5 p-6 md:p-8 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-white tracking-tight">Message</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5"><Target className="w-3 h-3 text-blue-500"/> {messageRecipient.name}</p>
                </div>
              </div>
              <button onClick={() => setIsMessageModalOpen(false)} className="relative z-10 p-2 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white rounded-full transition-colors border border-transparent hover:border-white/10"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 md:p-8">
              {sendSuccess ? (
                <div className="text-center py-8 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-500/30">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h4 className="text-3xl font-black text-white mb-2 tracking-tight">Delivered!</h4>
                  <p className="text-slate-400 text-sm">Sent directly to {messageRecipient.name}'s secure inbox.</p>
                </div>
              ) : isCheckingThread ? (
                <div className="text-center py-8 animate-in fade-in">
                  <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-slate-400 text-sm font-bold animate-pulse">Establishing connection...</p>
                </div>
              ) : showDuplicateWarning ? (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-[1.5rem] p-6 flex flex-col items-center justify-center shadow-inner text-center animate-in zoom-in-95 duration-300">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="font-black text-white text-lg mb-1">Active Conversation Exists</h4>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed mb-6">
                    You have already contacted {messageRecipient.name}. Sending this will instantly append to your existing chat thread.
                  </p>
                  <div className="flex w-full gap-3">
                    <button type="button" onClick={() => setShowDuplicateWarning(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors border border-white/10">
                      Cancel
                    </button>
                    <button onClick={() => handleSendMessage()} disabled={isSending} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                      {isSending ? 'Sending...' : 'Confirm & Send'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-6 animate-in fade-in duration-300">
                  {!isUpperclassman && messageRecipient.role === 'coach' && (
                     <div className="bg-amber-500/10 border border-amber-500/30 rounded-[1.5rem] p-5 flex items-start gap-4 shadow-inner">
                         <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                         <div>
                             <h4 className="font-black text-amber-400 text-sm mb-1">NCAA Underclassman Alert</h4>
                             <p className="text-[11px] font-medium text-amber-200/70 leading-relaxed">
                                 Because you are a Freshman or Sophomore, NCAA rules prohibit coaches from replying to your direct messages until June 15th after your Sophomore year. <strong className="text-amber-400 font-black">They will still receive this message</strong>, but cannot respond yet.
                             </p>
                         </div>
                     </div>
                  )}

                  <textarea 
                    required value={messageContent} onChange={e => setMessageContent(e.target.value)} placeholder="Write your secure message..."
                    className="w-full bg-black/40 border border-white/10 text-white rounded-[1.5rem] p-5 h-40 resize-none focus:outline-none focus:border-blue-500/50 font-medium text-sm placeholder:text-slate-600 transition-all"
                  />
                  <button type="submit" disabled={isSending || !messageContent.trim()} className="w-full bg-white hover:bg-slate-200 text-slate-900 font-black py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    {isSending ? 'Encrypting & Sending...' : <><Send className="w-4 h-4" /> Send Secure Message</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 relative z-30">
        
        {/* 🚨 HEADER 🚨 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 text-white flex items-center gap-3">
                  The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Network</span>
                </h1>
                <p className="text-slate-400 font-medium text-sm md:text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" /> Multi-Sport Hub & Recruiting Directory
                </p>
            </div>
            
            {profileIncomplete && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                <button onClick={handleEditToggle} className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-400 text-white px-5 py-2.5 rounded-2xl font-black transition-all shadow-lg hover:-translate-y-0.5">
                  <AlertTriangle className="w-4 h-4" /> Complete Profile
                </button>
              </div>
            )}
        </div>

        {/* 🚨 MAIN TAB BAR 🚨 */}
        <div className="flex gap-4 mb-8 overflow-x-auto custom-scrollbar pb-1 border-b border-white/5 relative">
          <button onClick={() => setFeedTab('feed')} className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${feedTab === 'feed' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <Flame className="w-4 h-4" /> Trending Discussions 
            {feedTab === 'feed' && <><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /><div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" /></>}
          </button>
          <button onClick={() => setFeedTab('network')} className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${feedTab === 'network' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <Users className="w-4 h-4" /> {viewerRole === 'coach' ? 'Athlete Finder' : 'Coach Finder'}
            {feedTab === 'network' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />}
          </button>
        </div>

        {/* ======================= TAB: TRENDING DISCUSSIONS ======================= */}
        {feedTab === 'feed' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                
                {/* 🚨 THE COMMUNITY HUB / DISCUSSION CREATOR 🚨 */}
                {viewerRole === 'athlete' && currentUserId && (
                  <div className="mb-10 bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.3)] relative overflow-hidden group">
                     {/* 🚨 TRUST LEVEL OVERLAY 🚨 */}
                     {currentUserProfile?.trust_level === 0 && (
                        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center rounded-[2rem]">
                           <ShieldCheck className="w-10 h-10 text-rose-500 mb-3" />
                           <h4 className="text-white font-black text-lg">Verification Required</h4>
                           <p className="text-slate-300 text-sm mt-1 max-w-sm text-center">You must be verified (Trust Level 1) to join the global discussion.</p>
                        </div>
                     )}
                     
                     <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                     <div className="flex gap-4">
                        <AvatarWithBorder avatarUrl={currentUserProfile?.avatar_url || ''} sizeClasses="w-12 h-12 shadow-md hidden sm:block" borderId={currentUserProfile?.equipped_border || 'none'} />
                        <div className="flex-1">
                          <form onSubmit={handleCreateDiscussion} className="flex flex-col gap-3">
                             <textarea 
                               value={newDiscussionContent} 
                               onChange={(e) => setNewDiscussionContent(e.target.value)} 
                               placeholder="What's on your mind? Ask the community..." 
                               className="w-full bg-black/40 border border-white/5 hover:border-white/10 text-white rounded-[1.5rem] p-4 min-h-[100px] resize-none focus:outline-none focus:border-blue-500/50 focus:bg-black/60 font-medium text-sm placeholder:text-slate-500 transition-all shadow-inner"
                             />
                             <div className="flex justify-between items-center">
                               {currentUserProfile?.is_looking_for_college ? (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                     <Radio className="w-3 h-3 animate-pulse" /> Beacon Active
                                  </div>
                               ) : (
                                  <div></div>
                               )}
                               <button type="submit" disabled={isSubmittingDiscussion || !newDiscussionContent.trim() || currentUserProfile?.trust_level === 0} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">
                                 {isSubmittingDiscussion ? 'Posting...' : <><Send className="w-4 h-4" /> Share</>}
                               </button>
                             </div>
                          </form>
                        </div>
                     </div>
                  </div>
                )}

                <div className="space-y-8">
                    {loading ? (
                        <FeedSkeleton />
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20 bg-white/[0.01] rounded-[2rem] border border-white/5 border-dashed relative overflow-hidden">
                            <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">The arena is quiet...</h3>
                            <p className="text-slate-500 text-sm">Be the first to ignite the feed with an update.</p>
                        </div>
                    ) : (
                        posts.map(post => {
                            if (!post.athletes) return null;

                            const isPRAlert = !!(post.linked_pr_event || (post.linked_prs && post.linked_prs.length > 0));
                            const isVerificationPost = post.content?.startsWith("A new athlete has verified!");
                            const likesCount = post.likes ? post.likes.length : 0;
                            const iLikedThis = post.likes ? post.likes.includes(currentUserId || '') : false;
                            
                            const allComments = post.comments || [];
                            const isCommentsOpen = expandedComments[post.id];
                            const commentsCount = allComments.length;

                            const prEvent = post.linked_pr_event || post.linked_prs?.[0]?.event;
                            const prMark = post.linked_pr_mark || post.linked_prs?.[0]?.mark;
                            
                            // Visuals
                            const cardStyles = getCardStyles(post.athletes.equipped_card, 'post');
                            const isMyPost = post.athlete_id === currentUserId;
                            const isEditingThisPost = editingPostId === post.id;
                            const showBeacon = post.athletes.is_looking_for_college;
                            
                            // 🚨 Verification Lock States 🚨
                            const isUnverifiedAthlete = viewerRole === 'athlete' && (currentUserProfile?.trust_level || 0) === 0;

                            // Calculate dynamic verification post stats if necessary
                            let verifTargetScore = 0;
                            let verifTargetSportStr = "Athletics";
                            let verifTargetMetrics: { name: string; value: string }[] | null = null;
                            let verifTierLabel = 'Unranked';

                            if (isVerificationPost && post.athletes.athlete_sports) {
                                const msHigh = post.athletes.athlete_sports.length > 0
                                    ? Math.max(...post.athletes.athlete_sports.map(s => s.custom_fit_score))
                                    : 0;
                                verifTargetScore = msHigh;
                                const activeTopSport = post.athletes.athlete_sports.find(s => s.custom_fit_score === msHigh);
                                if (activeTopSport) {
                                    verifTargetSportStr = `${activeTopSport.sport_name} ${activeTopSport.position ? `• ${activeTopSport.position}` : ''}`;
                                    verifTargetMetrics = activeTopSport.metrics;
                                }
                                verifTierLabel = getScoreTier(verifTargetScore);
                            }

                            return (
                                <div key={post.id} className="relative z-0">
                                    {isPRAlert ? (
                                        // 🚨 SUPER DUPER HOLOGRAPHIC PR ALERT CARD 🚨
                                        <div className="relative group hover:-translate-y-1 transition-transform duration-500 z-10 hover:z-20">
                                            {cardStyles.isAnimated && <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-blue-600 to-cyan-500 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>}
                                            <div className={`${cardStyles.bgClass} ${cardStyles.isAnimated ? 'animate-foil border-white/20 shadow-2xl' : 'border-white/10 shadow-lg'} rounded-[2rem] p-6 sm:p-8 text-white relative overflow-hidden border`}>
                                                
                                                {cardStyles.hasGlare && <div className="holo-glare rounded-[2rem]"></div>}
                                                {cardStyles.isAnimated && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>}
                                                
                                                <div className="absolute top-4 right-4 z-50 more-dropdown">
                                                  <button onClick={() => setActiveDropdown(activeDropdown === post.id ? null : post.id)} className="p-1.5 bg-black/20 hover:bg-black/40 rounded-lg text-white/70 hover:text-white transition-colors border border-white/10 backdrop-blur-md">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                  </button>
                                                  {activeDropdown === post.id && (
                                                    <div className="absolute right-0 mt-2 w-36 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden py-1">
                                                      {isMyPost ? (
                                                        <>
                                                          <button onClick={() => { setEditingPostId(post.id); setEditPostContent(post.content || ""); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                                            <Edit2 className="w-4 h-4" /> Edit
                                                          </button>
                                                          <button onClick={() => { setPostToDelete(post.id); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2 border-t border-white/5">
                                                            <Trash2 className="w-4 h-4" /> Delete
                                                          </button>
                                                        </>
                                                      ) : (
                                                        <button onClick={() => { setReportModal({ type: 'post', id: post.id, targetId: post.athlete_id, content: post.content }); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2">
                                                          <Flag className="w-4 h-4" /> Report
                                                        </button>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>

                                                <div className="relative z-20 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-6 pt-4">
                                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 flex-1 w-full min-w-0">
                                                        <div className="relative shrink-0">
                                                            <Link href={`/athlete/${post.athlete_id}`} className="relative shrink-0 transition-transform shadow-xl rounded-full border-2 border-white/40 bg-slate-900 block group-hover:scale-105 duration-300">
                                                                <AvatarWithBorder avatarUrl={post.athletes.avatar_url || ''} sizeClasses="w-16 h-16 sm:w-20 sm:h-20" borderId={post.athletes.equipped_border || 'none'} />
                                                            </Link>
                                                        </div>

                                                        <div className="flex-1 text-center sm:text-left flex flex-col items-center sm:items-start w-full min-w-0">
                                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                                                              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-sm ${cardStyles.isCustom ? 'bg-white/10 border border-white/20 text-white backdrop-blur-md' : 'bg-slate-700/50 border border-slate-600 text-slate-300'}`}>
                                                                  <Zap className={`w-3 h-3 ${cardStyles.isCustom ? 'text-yellow-300 animate-pulse' : 'text-slate-400'}`}/> New Stat / PR
                                                              </div>
                                                              {showBeacon && (
                                                                 <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 backdrop-blur-md">
                                                                    <Target className="w-3 h-3 animate-pulse" /> Actively Recruiting
                                                                 </div>
                                                              )}
                                                            </div>
                                                            <Link href={`/athlete/${post.athlete_id}`} className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight hover:text-white/80 transition-colors drop-shadow-md leading-none mb-2 flex items-center justify-center sm:justify-start gap-2 flex-wrap w-full">
                                                                <span>{post.athletes.first_name} {post.athletes.last_name}</span>
                                                                {post.athletes.is_premium && <Crown className="w-5 h-5 text-yellow-400 drop-shadow-sm shrink-0" />}
                                                            </Link>
                                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                                                                <span className="bg-black/20 px-2.5 py-1 rounded-md text-white/80 font-bold text-[9px] tracking-widest uppercase flex items-center gap-1 border border-white/5 backdrop-blur-sm">
                                                                    <MapPin className="w-3 h-3 opacity-80 shrink-0" /> <span className="truncate max-w-[150px]">{post.athletes.high_school}</span> <span className="hidden sm:inline">•</span> <span className="hidden sm:inline">{post.athletes.state}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={`${cardStyles.isCustom ? 'bg-black/20 border-white/20' : 'bg-black/40 border-slate-700/50'} backdrop-blur-md border p-6 rounded-[1.5rem] flex flex-col items-center justify-center shadow-inner w-full md:w-auto shrink-0 min-w-[180px]`}>
                                                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1 text-center ${cardStyles.isCustom ? 'text-white/70' : 'text-slate-400'}`}>{prEvent}</span>
                                                        <span className="text-[clamp(2.5rem,6vw,4.5rem)] leading-none font-black tracking-tighter text-white drop-shadow-md text-center whitespace-nowrap w-full">
                                                            {prMark}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {(post.content || isEditingThisPost) && (
                                                    <div className="relative z-20 mt-6 bg-black/30 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-white/10 shadow-inner">
                                                        {isEditingThisPost ? (
                                                          <div className="flex flex-col gap-3">
                                                            <textarea value={editPostContent} onChange={(e) => setEditPostContent(e.target.value)} className="w-full bg-black/40 text-white rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-white/50 resize-none h-24 border border-white/5" />
                                                            <div className="flex gap-2 justify-end">
                                                              <button onClick={() => setEditingPostId(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors">Cancel</button>
                                                              <button onClick={() => handleSavePostEdit(post.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold text-white transition-colors shadow-sm">Save</button>
                                                            </div>
                                                          </div>
                                                        ) : (
                                                          <p className="text-sm md:text-base font-medium italic text-white/90 whitespace-pre-wrap">"{post.content}"</p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="relative z-20 mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        <div className="relative flex-1 sm:flex-none">
                                                            {coinPopId === post.id && <span className="coin-float">+5 💸</span>}
                                                            <button onClick={() => handleToggleFire(post.id, post.athlete_id)} className={`w-full flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-300 shadow-sm backdrop-blur-md ${iLikedThis ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-black/20 hover:bg-black/40 text-white border border-white/5 hover:border-white/10'} ${animatingHype === post.id ? 'hype-pop' : ''}`}>
                                                                <Flame className={`w-3.5 h-3.5 ${iLikedThis ? 'fill-current text-orange-500 animate-pulse' : 'text-white'}`} /> {likesCount > 0 ? likesCount : 'Hype'}
                                                            </button>
                                                        </div>
                                                        <button onClick={() => toggleComments(post.id)} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm backdrop-blur-md ${isCommentsOpen ? 'bg-blue-600 text-white' : 'bg-black/20 hover:bg-black/40 text-white border border-white/5 hover:border-white/10'}`}>
                                                            <MessageSquare className="w-4 h-4" /> {commentsCount > 0 ? commentsCount : 'Comment'}
                                                        </button>
                                                    </div>
                                                    {viewerRole !== 'guest' && post.athlete_id !== currentUserId && (
                                                        <button onClick={() => openMessageModal(post.athlete_id, post.athletes.first_name, post.athletes.high_school, 'athlete')} className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-black text-slate-900 bg-white hover:bg-slate-200 px-5 py-2.5 rounded-xl transition-all shadow-lg hover:-translate-y-0.5">
                                                            <Mail className="w-4 h-4" /> Connect
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                {/* COMMENTS */}
                                                {isCommentsOpen && (
                                                    <div className="mt-5 pt-5 border-t border-white/10 relative z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <div className="space-y-4 mb-4 max-h-60 overflow-y-auto px-4 py-3 -mx-4 custom-scrollbar">
                                                            {allComments.map(comment => (
                                                                <div key={comment.id} className="flex items-start gap-3 group/comment">
                                                                    <div className="shrink-0 pt-1">
                                                                        <AvatarWithBorder avatarUrl={comment.avatar_url || ''} borderId={comment.border || 'none'} sizeClasses="w-8 h-8 shadow-sm" />
                                                                    </div>
                                                                    <div className="bg-black/30 backdrop-blur-md border border-white/10 p-3 rounded-2xl rounded-tl-none text-white w-full max-w-[85%] shadow-inner relative">
                                                                        <div className="absolute top-2 right-2 z-50 more-dropdown opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                                                          <button onClick={() => setActiveDropdown(activeDropdown === comment.id ? null : comment.id)} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors">
                                                                            <MoreHorizontal className="w-4 h-4" />
                                                                          </button>
                                                                          {activeDropdown === comment.id && (
                                                                            <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden py-1 z-50">
                                                                              {comment.athlete_id === currentUserId ? (
                                                                                <>
                                                                                  <button onClick={() => { setEditingCommentId(comment.id); setEditCommentContent(comment.text); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                                                                    <Edit2 className="w-3 h-3" /> Edit
                                                                                  </button>
                                                                                  <button onClick={() => { setCommentToDelete({postId: post.id, commentId: comment.id}); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2 border-t border-white/5">
                                                                                    <Trash2 className="w-3 h-3" /> Delete
                                                                                  </button>
                                                                                </>
                                                                              ) : (
                                                                                <button onClick={() => { setReportModal({ type: 'comment', id: comment.id, targetId: comment.athlete_id, content: comment.text }); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2">
                                                                                  <Flag className="w-3 h-3" /> Report
                                                                                </button>
                                                                              )}
                                                                            </div>
                                                                          )}
                                                                        </div>
                                                                        <div className="flex items-center justify-between mb-1.5 pr-6">
                                                                            <p className="text-[10px] font-black opacity-80 flex items-center gap-2 uppercase tracking-widest text-white">
                                                                                {comment.name}
                                                                                {comment.athlete_id === post.athlete_id && <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[8px] px-2 py-0.5 rounded shadow-sm">Author</span>}
                                                                            </p>
                                                                            <span className="text-[9px] text-white/40 font-bold">{formatDate(comment.created_at)}</span>
                                                                        </div>
                                                                        {editingCommentId === comment.id ? (
                                                                           <div className="flex flex-col gap-2 mt-2">
                                                                             <input type="text" value={editCommentContent} onChange={(e) => setEditCommentContent(e.target.value)} className="bg-black/40 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 w-full border border-white/5" />
                                                                             <div className="flex gap-2 justify-end">
                                                                               <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] font-bold text-white transition-colors">Cancel</button>
                                                                               <button onClick={() => handleSaveCommentEdit(post.id, comment.id)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-[10px] font-bold text-white transition-colors shadow-sm">Save</button>
                                                                             </div>
                                                                           </div>
                                                                        ) : (
                                                                           <p className="text-sm font-medium leading-relaxed pr-6">{comment.text}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {allComments.length === 0 && <p className="text-xs text-white/50 font-bold italic text-center py-4">Be the first to hype this up!</p>}
                                                        </div>
                                                        <form onSubmit={(e) => handleAddComment(e, post.id)} className={`flex gap-3 items-center bg-black/20 p-2 rounded-full border border-white/10 backdrop-blur-md w-full transition-opacity ${isUnverifiedAthlete ? 'opacity-60' : ''}`}>
                                                            <input 
                                                              type="text" 
                                                              value={commentInputs[post.id] || ''} 
                                                              onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})} 
                                                              placeholder={isUnverifiedAthlete ? "Verification required to comment..." : "Reply to the thread..."} 
                                                              disabled={isUnverifiedAthlete}
                                                              className={`flex-1 bg-transparent px-4 py-1.5 text-sm font-bold text-white focus:outline-none w-full ${isUnverifiedAthlete ? 'cursor-not-allowed placeholder:text-slate-400' : 'placeholder:text-slate-500'}`} 
                                                            />
                                                            <button type="submit" disabled={isUnverifiedAthlete || isSubmittingComment[post.id] || !commentInputs[post.id]?.trim()} className="bg-white/10 hover:bg-white/20 text-white w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-50 transition-transform hover:scale-105 active:scale-95 shrink-0">
                                                              {isUnverifiedAthlete ? <ShieldCheck className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5 ml-0.5" />}
                                                            </button>
                                                        </form>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        // 📝 STANDARD DISCUSSION THREAD POST 📝
                                        <div className="bg-white/[0.03] backdrop-blur-md rounded-[2rem] p-6 sm:p-8 transition-all duration-300 relative group overflow-hidden border border-white/10 hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)]">
                                            
                                            <div className="absolute top-4 right-4 z-50 more-dropdown opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => setActiveDropdown(activeDropdown === post.id ? null : post.id)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
                                                <MoreHorizontal className="w-5 h-5" />
                                              </button>
                                              {activeDropdown === post.id && (
                                                <div className="absolute right-0 mt-2 w-36 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden py-1">
                                                  {isMyPost ? (
                                                    <>
                                                      <button onClick={() => { setEditingPostId(post.id); setEditPostContent(post.content || ""); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                                        <Edit2 className="w-4 h-4" /> Edit
                                                      </button>
                                                      <button onClick={() => { setPostToDelete(post.id); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2 border-t border-white/5">
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                      </button>
                                                    </>
                                                  ) : (
                                                    <button onClick={() => { setReportModal({ type: 'post', id: post.id, targetId: post.athlete_id, content: post.content }); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2">
                                                      <Flag className="w-4 h-4" /> Report
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                            
                                            <div className="relative z-20 flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <Link href={`/athlete/${post.athlete_id}`} className="shrink-0 hover:scale-105 transition-transform shadow-md rounded-full border border-white/5">
                                                        <AvatarWithBorder avatarUrl={post.athletes.avatar_url || ''} sizeClasses="w-12 h-12" borderId={post.athletes.equipped_border || 'none'} />
                                                    </Link>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                          <Link href={`/athlete/${post.athlete_id}`} className={`font-black text-lg transition-colors tracking-tight leading-none flex items-center gap-1.5 ${post.athletes.is_premium ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 hover:to-blue-500' : 'text-white hover:text-blue-400'}`}>
                                                              {post.athletes.first_name} {post.athletes.last_name}
                                                              {post.athletes.is_premium && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                                                          </Link>
                                                          {showBeacon && (
                                                             <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                                                <Radio className="w-2.5 h-2.5" /> Recruiting
                                                             </div>
                                                          )}
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                                                            <span className="truncate max-w-[120px]">{post.athletes.high_school}</span> <span className="hidden sm:inline">•</span> <span>{formatDate(post.created_at)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {isEditingThisPost ? (
                                              <div className="flex flex-col gap-3 mb-5">
                                                <textarea value={editPostContent} onChange={(e) => setEditPostContent(e.target.value)} className="w-full bg-black/40 text-white rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none h-24 border border-white/5" />
                                                <div className="flex gap-2 justify-end">
                                                  <button onClick={() => setEditingPostId(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors">Cancel</button>
                                                  <button onClick={() => handleSavePostEdit(post.id)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white transition-colors shadow-sm">Save</button>
                                                </div>
                                              </div>
                                            ) : isVerificationPost ? (
                                              <div className="relative z-20 bg-emerald-950/20 backdrop-blur-xl border border-emerald-500/30 p-6 sm:p-8 rounded-[2rem] shadow-[0_0_40px_rgba(16,185,129,0.1)] flex flex-col items-center gap-6 overflow-hidden mb-5">
                                                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-bl-full blur-2xl pointer-events-none"></div>
                                                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-tr-full blur-2xl pointer-events-none"></div>
                                        
                                                  <div className="flex flex-col items-center text-center gap-2 relative z-10">
                                                      <ShieldCheck className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] mb-2" />
                                                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{post.content}</h3>
                                                      <p className="text-xs font-bold text-emerald-400/80 uppercase tracking-widest flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Official Scouting Data Unlocked</p>
                                                  </div>
                                        
                                                  <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
                                                      <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center backdrop-blur-md shadow-inner">
                                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Class</span>
                                                          <span className="text-lg font-black text-white">'{post.athletes.grad_year ? post.athletes.grad_year.toString().slice(-2) : 'XX'}</span>
                                                      </div>
                                                      <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center backdrop-blur-md shadow-inner text-center">
                                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sport</span>
                                                          <span className="text-xs font-black text-white truncate w-full px-2">{verifTargetSportStr.split('•')[0]}</span>
                                                      </div>
                                                      {verifTargetScore > 0 ? (
                                                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center backdrop-blur-md shadow-inner col-span-2 sm:col-span-2 relative overflow-hidden group">
                                                              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 animate-[shimmerGlare_3s_infinite_linear] pointer-events-none"></div>
                                                              <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest mb-1">Ovr Rating</span>
                                                              <div className="flex items-end gap-2">
                                                                  <span className="text-3xl font-black text-emerald-400 leading-none drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">{verifTargetScore}</span>
                                                                  <span className="text-[10px] font-bold text-emerald-300/70 mb-0.5">{verifTierLabel}</span>
                                                              </div>
                                                          </div>
                                                      ) : (
                                                          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center backdrop-blur-md shadow-inner col-span-2 sm:col-span-2">
                                                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                                                               <span className="text-sm font-black text-slate-300">Evaluating Profile...</span>
                                                          </div>
                                                      )}
                                                  </div>
                                        
                                                  {verifTargetMetrics && verifTargetMetrics.length > 0 && (
                                                      <div className="w-full flex flex-wrap justify-center gap-2 relative z-10">
                                                          {verifTargetMetrics.slice(0, 4).map((m, i) => (
                                                              <div key={i} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 backdrop-blur-md">
                                                                  <span className="text-[10px] uppercase font-bold text-slate-400">{m.name}</span>
                                                                  <span className="text-xs font-black text-white">{m.value}</span>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  )}
                                              </div>
                                            ) : (
                                              <p className="relative z-20 text-slate-200 font-medium whitespace-pre-wrap mb-5 leading-relaxed text-sm sm:text-base pr-8">
                                                  {post.content}
                                              </p>
                                            )}
                                            
                                            {post.image_url && (
                                                <div className="relative z-20 rounded-2xl overflow-hidden border border-white/5 shadow-md mb-6 group-hover:shadow-lg transition-shadow">
                                                    <img src={post.image_url} alt="" className="max-h-[400px] w-full object-cover transform hover:scale-105 transition-transform duration-700" />
                                                </div>
                                            )}

                                            <div className="relative z-20 border-t border-white/10 pt-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                                    <div className="relative flex-1 sm:flex-none">
                                                        {coinPopId === post.id && <span className="coin-float">+5 💸</span>}
                                                        <button onClick={() => handleToggleFire(post.id, post.athlete_id)} className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-300 shadow-sm ${iLikedThis ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : (isVerificationPost ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-black/20 hover:bg-black/40 text-slate-300 border border-white/5 hover:border-white/10')} ${animatingHype === post.id ? 'hype-pop' : ''}`}>
                                                            <Flame className={`w-3.5 h-3.5 ${iLikedThis ? 'fill-current text-indigo-400 animate-pulse' : (isVerificationPost ? 'text-emerald-400' : 'text-slate-400')}`} /> {likesCount > 0 ? likesCount : (isVerificationPost ? 'Hype (+5 Cash)' : 'Hype')}
                                                        </button>
                                                    </div>
                                                    <button onClick={() => toggleComments(post.id)} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm ${isCommentsOpen ? 'bg-white/10 text-white' : 'bg-black/20 hover:bg-black/40 text-slate-300 border border-white/5 hover:border-white/10'}`}>
                                                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> {commentsCount > 0 ? commentsCount : 'Reply'}
                                                    </button>
                                                </div>
                                                {viewerRole !== 'guest' && post.athlete_id !== currentUserId && (
                                                    <button onClick={() => openMessageModal(post.athlete_id, post.athletes.first_name, post.athletes.high_school, 'athlete')} className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-black bg-white/5 text-slate-300 hover:bg-white/10 px-5 py-2.5 rounded-xl transition-colors hover:text-white border border-white/5">
                                                        <Mail className="w-3.5 h-3.5" /> Connect
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {/* COMMENTS */}
                                            {isCommentsOpen && (
                                                <div className="mt-5 pt-5 border-t border-white/10 relative z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto px-4 py-3 -mx-4 custom-scrollbar">
                                                        {allComments.map(comment => (
                                                            <div key={comment.id} className="flex items-start gap-3 group/comment">
                                                                <div className="shrink-0 pt-1">
                                                                    <AvatarWithBorder avatarUrl={comment.avatar_url || ''} borderId={comment.border || 'none'} sizeClasses="w-8 h-8 shadow-sm" />
                                                                </div>
                                                                <div className="bg-black/20 border border-white/5 p-3 rounded-2xl rounded-tl-none text-slate-200 w-full max-w-[85%] shadow-inner relative">
                                                                    <div className="absolute top-2 right-2 z-50 more-dropdown opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                                                      <button onClick={() => setActiveDropdown(activeDropdown === comment.id ? null : comment.id)} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors">
                                                                        <MoreHorizontal className="w-4 h-4" />
                                                                      </button>
                                                                      {activeDropdown === comment.id && (
                                                                        <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden py-1 z-50">
                                                                          {comment.athlete_id === currentUserId ? (
                                                                            <>
                                                                              <button onClick={() => { setEditingCommentId(comment.id); setEditCommentContent(comment.text); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                                                                <Edit2 className="w-3 h-3" /> Edit
                                                                              </button>
                                                                              <button onClick={() => { setCommentToDelete({postId: post.id, commentId: comment.id}); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2 border-t border-white/5">
                                                                                <Trash2 className="w-3 h-3" /> Delete
                                                                              </button>
                                                                            </>
                                                                          ) : (
                                                                            <button onClick={() => { setReportModal({ type: 'comment', id: comment.id, targetId: comment.athlete_id, content: comment.text }); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2">
                                                                              <Flag className="w-3 h-3" /> Report
                                                                            </button>
                                                                          )}
                                                                        </div>
                                                                      )}
                                                                    </div>
                                                                    <div className="flex items-center justify-between mb-1.5 pr-6">
                                                                        <p className="text-[10px] font-black opacity-80 flex items-center gap-2 uppercase tracking-widest text-white">
                                                                            {comment.name}
                                                                            {comment.athlete_id === post.athlete_id && <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[8px] px-2 py-0.5 rounded shadow-sm">Author</span>}
                                                                        </p>
                                                                        <span className="text-[9px] text-slate-500 font-bold">{formatDate(comment.created_at)}</span>
                                                                    </div>
                                                                    {editingCommentId === comment.id ? (
                                                                       <div className="flex flex-col gap-2 mt-2">
                                                                         <input type="text" value={editCommentContent} onChange={(e) => setEditCommentContent(e.target.value)} className="bg-black/40 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 w-full border border-white/5" />
                                                                         <div className="flex gap-2 justify-end">
                                                                           <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] font-bold text-white transition-colors">Cancel</button>
                                                                           <button onClick={() => handleSaveCommentEdit(post.id, comment.id)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-[10px] font-bold text-white transition-colors shadow-sm">Save</button>
                                                                         </div>
                                                                       </div>
                                                                    ) : (
                                                                       <p className="text-sm font-medium leading-relaxed pr-6">{comment.text}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {allComments.length === 0 && <p className="text-xs text-slate-500 font-bold italic text-center py-4">Be the first to join the conversation!</p>}
                                                    </div>
                                                    <form onSubmit={(e) => handleAddComment(e, post.id)} className={`flex gap-3 items-center bg-black/20 p-2 rounded-full border border-white/10 backdrop-blur-md w-full transition-opacity ${isUnverifiedAthlete ? 'opacity-60' : ''}`}>
                                                        <input 
                                                          type="text" 
                                                          value={commentInputs[post.id] || ''} 
                                                          onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})} 
                                                          placeholder={isUnverifiedAthlete ? "Verification required to comment..." : "Reply to the thread..."} 
                                                          disabled={isUnverifiedAthlete}
                                                          className={`flex-1 bg-transparent px-4 py-1.5 text-sm font-bold text-white focus:outline-none w-full ${isUnverifiedAthlete ? 'cursor-not-allowed placeholder:text-slate-400' : 'placeholder:text-slate-500'}`} 
                                                        />
                                                        <button type="submit" disabled={isUnverifiedAthlete || isSubmittingComment[post.id] || !commentInputs[post.id]?.trim()} className="bg-white/10 hover:bg-white/20 text-white w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-50 transition-transform hover:scale-105 active:scale-95 shrink-0">
                                                          {isUnverifiedAthlete ? <ShieldCheck className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5 ml-0.5" />}
                                                        </button>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        )}

        {/* ======================= TAB: NETWORK DIRECTORY ======================= */}
        {feedTab === 'network' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                
                {/* 🚨 ULTRA-GLASSY ENHANCED SEARCH FILTERS 🚨 */}
                <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] p-5 md:p-8 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] mb-10 z-20 relative overflow-visible">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 rounded-[2.5rem] pointer-events-none"></div>
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-5 items-center justify-between">
                      <div className="relative group flex-1 w-full flex gap-3">
                          <div className="relative flex-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
                            <input 
                                type="text" 
                                placeholder={viewerRole === 'coach' ? "Search athletes..." : "Search coaches..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/20 border border-white/5 hover:border-white/10 rounded-[1.5rem] pl-14 pr-6 py-4 text-white font-bold focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm md:text-base placeholder:text-slate-500 shadow-inner backdrop-blur-md"
                            />
                          </div>
                          {/* Mobile Filter Toggle Button */}
                          <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="sm:hidden flex items-center justify-center w-14 h-14 bg-black/20 border border-white/10 rounded-2xl text-slate-300 hover:text-white transition-colors shrink-0">
                             <SlidersHorizontal className="w-5 h-5" />
                          </button>
                      </div>
                      {viewerRole === 'coach' && (
                        <button onClick={() => setShowScoringModal(true)} className="hidden sm:flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-4 py-2.5 rounded-xl shrink-0 h-full min-h-[54px]">
                          <Info className="w-4 h-4" /> Scoring Guide
                        </button>
                      )}
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${showMobileFilters ? 'block' : 'hidden sm:grid'}`}>
                      {viewerRole !== 'coach' ? (
                        <>
                          <div className="relative group">
                            <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 appearance-none cursor-pointer transition-all shadow-inner backdrop-blur-md">
                              <option value="" className="bg-slate-900">All Divisions</option>
                              <option value="NCAA D1" className="bg-slate-900">NCAA D1</option>
                              <option value="NCAA D2" className="bg-slate-900">NCAA D2</option>
                              <option value="NCAA D3" className="bg-slate-900">NCAA D3</option>
                              <option value="NAIA" className="bg-slate-900">NAIA</option>
                              <option value="NJCAA" className="bg-slate-900">NJCAA / JUCO</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          </div>

                          <div className="relative group">
                            <select value={filterCoachSport} onChange={e => setFilterCoachSport(e.target.value)} className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 appearance-none cursor-pointer transition-all shadow-inner backdrop-blur-md">
                              <option value="" className="bg-slate-900">All Sports</option>
                              {SPORT_OPTIONS.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          </div>

                          <div className="relative group">
                            <select value={filterTitle} onChange={e => setFilterTitle(e.target.value)} className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 appearance-none cursor-pointer transition-all shadow-inner backdrop-blur-md">
                              <option value="" className="bg-slate-900">All Titles / Jobs</option>
                              {COACH_TITLES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          </div>
                        </>
                      ) : (
                        // 🏃‍♂️ MULTI-SPORT ATHLETE FILTERS FOR COACHES 🏃‍♂️
                        <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="relative group">
                            <select value={filterAthleteState} onChange={e => setFilterAthleteState(e.target.value)} className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 appearance-none cursor-pointer transition-all shadow-inner backdrop-blur-md">
                              <option value="" className="bg-slate-900">State</option>
                              {Array.from(new Set(recruitsList.map(r => r.state).filter(Boolean))).sort().map(s => (
                                <option key={s} value={s} className="bg-slate-900">{s}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          </div>

                          <div className="relative group">
                            <select value={filterGradYear} onChange={e => setFilterGradYear(e.target.value)} className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 appearance-none cursor-pointer transition-all shadow-inner backdrop-blur-md">
                              <option value="" className="bg-slate-900">Class</option>
                              {validGradYears.map(y => (
                                <option key={y} value={y.toString()} className="bg-slate-900">{y}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          </div>

                          <div className="relative group">
                            <select value={filterSport} onChange={e => { setFilterSport(e.target.value); setFilterPosition(''); }} className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 appearance-none cursor-pointer transition-all shadow-inner backdrop-blur-md">
                              <option value="" className="bg-slate-900">Sport</option>
                              {SPORT_OPTIONS.map(s => (
                                <option key={s} value={s} className="bg-slate-900">{s}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          </div>
                          
                          <div className="relative group">
                            <select disabled={!filterSport} value={filterPosition} onChange={e => setFilterPosition(e.target.value)} className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 appearance-none cursor-pointer transition-all shadow-inner backdrop-blur-md disabled:opacity-50">
                              <option value="" className="bg-slate-900">{filterSport === 'Track & Field' ? 'Event...' : 'Position...'}</option>
                              {positionOptions.map(p => (
                                <option key={p} value={p} className="bg-slate-900">{p}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                          </div>

                          <div className="relative group col-span-2 md:col-span-1">
                            <Target className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${!filterSport ? 'text-slate-600' : 'text-indigo-400'}`} />
                            <input 
                              type="number" 
                              placeholder="Min Score..."
                              value={filterTargetScore}
                              onChange={e => setFilterTargetScore(e.target.value)}
                              disabled={!filterSport}
                              className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 transition-all placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner backdrop-blur-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {viewerRole !== 'coach' ? (
                        // 🎓 COACHES DIRECTORY 🎓
                        filteredDirectory.length > 0 ? (
                            (filteredDirectory as CoachData[]).map(coach => (
                                <div key={coach.id} className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-500 flex flex-col justify-between h-full group hover:-translate-y-1 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full z-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start gap-4 mb-6 relative z-10">
                                        <AvatarWithBorder avatarUrl={coach.avatar_url || ''} sizeClasses="w-16 h-16 shadow-md border border-white/5" borderId="none" />
                                        <div className="pt-1 w-full min-w-0">
                                            <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors leading-tight truncate">Coach {coach.last_name}</h3>
                                            <div className="flex flex-col gap-1.5 mt-1.5">
                                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 truncate">
                                                <School className="w-3 h-3 shrink-0" /> <span className="truncate">{coach.school_name}</span>
                                              </p>
                                              {(coach.coach_title || coach.sport) && (
                                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 truncate">
                                                  <Briefcase className="w-3 h-3 shrink-0" /> 
                                                  <span className="truncate">{coach.coach_title || 'Coach'} • {coach.sport || 'Athletics'}</span>
                                                </p>
                                              )}
                                              {coach.division && (
                                                <div className="mt-1">
                                                  <span className="text-[9px] font-black text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest backdrop-blur-md">
                                                    {coach.division}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                      onClick={() => openMessageModal(coach.id, `Coach ${coach.last_name}`, coach.school_name || 'Coach', 'coach')} 
                                      className={`w-full font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm relative z-10 backdrop-blur-md shadow-inner ${currentUserProfile?.trust_level === 0 ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-white/5 hover:border-rose-500/50 hover:text-rose-400' : 'bg-white/10 hover:bg-blue-600 text-white border border-transparent'}`}
                                    >
                                        {currentUserProfile?.trust_level === 0 ? (
                                          <><ShieldCheck className="w-4 h-4" /> Message Coach (Locked)</>
                                        ) : (
                                          <><Mail className="w-4 h-4" /> Message Coach</>
                                        )}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-1 sm:col-span-2 text-center py-20 bg-white/[0.03] backdrop-blur-xl rounded-[2rem] border border-white/5 border-dashed shadow-inner">
                                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">No coaches found</h3>
                                <p className="text-slate-500 text-sm">Try adjusting your filters or searching for a different school.</p>
                            </div>
                        )
                    ) : (
                        // 🏃‍♂️ NEW MULTI-SPORT ATHLETES DIRECTORY (COACH VIEW) 🏃‍♂️
                        filteredDirectory.length > 0 ? (
                            (filteredDirectory as AthleteData[]).map(athlete => {
                                const cardStyles = getCardStyles(athlete.equipped_card, 'dir');
                                const lastSeen = formatLastSeen(athlete.last_login_date);
                                
                                // Determine primary stat block to show based on filter
                                let targetScore = 0;
                                let targetSportStr = "Athletics";
                                let targetMetrics = null;

                                if (filterSport) {
                                   const activeSport = athlete.athlete_sports?.find(s => s.sport_name === filterSport && s.is_active);
                                   if (activeSport) {
                                      targetScore = activeSport.custom_fit_score;
                                      targetSportStr = `${activeSport.sport_name} ${activeSport.position ? `• ${activeSport.position}` : ''}`;
                                      targetMetrics = activeSport.metrics;
                                   }
                                } else {
                                   // Highest sport score
                                   const msHigh = athlete.athlete_sports && athlete.athlete_sports.length > 0 
                                      ? Math.max(...athlete.athlete_sports.map(s => s.custom_fit_score)) 
                                      : 0;
                                   
                                   targetScore = msHigh;
                                   const activeTopSport = athlete.athlete_sports?.find(s => s.custom_fit_score === targetScore);
                                   if (activeTopSport) {
                                      targetSportStr = `${activeTopSport.sport_name} ${activeTopSport.position ? `• ${activeTopSport.position}` : ''}`;
                                      targetMetrics = activeTopSport.metrics;
                                   }
                                }

                                const tierLabel = getScoreTier(targetScore);

                                return (
                                  <div key={athlete.id} className={`${cardStyles.bgClass} ${cardStyles.isFoil ? 'animate-foil shadow-lg' : ''} ${cardStyles.borderClass} backdrop-blur-xl rounded-[2rem] p-6 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-500 flex flex-col justify-between h-full group hover:-translate-y-1 relative overflow-hidden border`}>
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full z-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                      
                                      {cardStyles.hasGlare && <div className="holo-glare rounded-[2rem]"></div>}
                                      {cardStyles.isFoil && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>}

                                      <div className="flex items-start gap-4 mb-5 relative z-10">
                                          <Link href={`/athlete/${athlete.id}`} className="shrink-0 hover:scale-105 transition-transform block shadow-xl rounded-full bg-slate-900 border-2 border-white/20">
                                              <AvatarWithBorder avatarUrl={athlete.avatar_url || ''} sizeClasses="w-16 h-16 shadow-md" borderId={athlete.equipped_border || 'none'} />
                                          </Link>
                                          
                                          <div className="min-w-0 pt-1 w-full flex justify-between gap-2">
                                              <div className="flex-1 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                  <Link href={`/athlete/${athlete.id}`} className="text-left font-bold text-lg text-white group-hover:text-indigo-400 transition-colors leading-tight truncate flex items-center gap-1.5">
                                                      {athlete.first_name} {athlete.last_name}
                                                      {athlete.is_premium && <Crown className="w-3.5 h-3.5 text-yellow-400 drop-shadow-sm shrink-0" />}
                                                  </Link>
                                                </div>

                                                <div className="flex flex-col gap-1 mt-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                                                        {athlete.high_school} • {athlete.state}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate mt-0.5">
                                                        {targetSportStr}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                      <p className="text-[9px] font-black text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30 uppercase tracking-widest backdrop-blur-md">
                                                          CO {athlete.grad_year || 'N/A'}
                                                      </p>
                                                      {athlete.is_looking_for_college && (
                                                        <p className="text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1 backdrop-blur-md">
                                                            <Target className="w-2.5 h-2.5" /> Recruiting
                                                        </p>
                                                      )}
                                                    </div>
                                                </div>
                                              </div>
                                              
                                              {/* 🚨 DYNAMIC ALGORITHM SCORE BADGE 🚨 */}
                                              {targetScore > 0 && (
                                                <div className="flex flex-col items-center shrink-0 bg-black/40 border border-white/10 rounded-2xl p-3 shadow-inner">
                                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ovr Score</span>
                                                  <span className={`text-2xl font-black leading-none ${
                                                    targetScore >= 85 ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]' :
                                                    targetScore >= 65 ? 'text-emerald-400' :
                                                    'text-blue-400'
                                                  }`}>
                                                    {targetScore}
                                                  </span>
                                                  <span className="text-[8px] font-bold text-slate-500 mt-1 max-w-[50px] text-center leading-tight truncate">{tierLabel}</span>
                                                </div>
                                              )}
                                          </div>
                                      </div>

                                      {/* METRICS RENDERER */}
                                      {targetMetrics && targetMetrics.length > 0 && (
                                          <div className="flex flex-wrap gap-1.5 mt-2 mb-5 relative z-10">
                                              {targetMetrics.slice(0, 3).map((m, i) => (
                                                  <div key={i} className="px-2 py-1.5 rounded-lg flex items-center gap-1.5 shadow-inner border backdrop-blur-md bg-black/20 border-white/10">
                                                      <span className="text-[8px] uppercase font-bold text-slate-400 truncate max-w-[80px]">{m.name}</span>
                                                      <span className="text-[10px] font-black text-white shrink-0">{m.value}</span>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                      
                                      <div className="mt-auto relative z-10 space-y-3">
                                          {/* 🚨 THE LAST SEEN INDICATOR 🚨 */}
                                          <div className={`flex items-center justify-center gap-1.5 w-full border border-white/5 rounded-xl py-1.5 backdrop-blur-md ${lastSeen.color}`}>
                                             <div className={`w-1.5 h-1.5 rounded-full ${lastSeen.dot}`}></div>
                                             <span className="text-[9px] font-black uppercase tracking-widest">{lastSeen.text}</span>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-3">
                                            <Link href={`/athlete/${athlete.id}`} className="bg-black/20 hover:bg-black/40 text-white border border-white/10 font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs backdrop-blur-md shadow-inner">
                                                <UserCircle2 className="w-4 h-4" /> Profile
                                            </Link>
                                            <button onClick={() => openMessageModal(athlete.id, athlete.first_name, athlete.high_school, 'athlete')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs shadow-lg border border-indigo-500">
                                                <Mail className="w-4 h-4" /> Message
                                            </button>
                                          </div>
                                      </div>
                                  </div>
                                );
                            })
                        ) : (
                            <div className="col-span-1 sm:col-span-2 text-center py-20 bg-white/[0.03] backdrop-blur-xl rounded-[2rem] border border-white/5 border-dashed shadow-inner">
                                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">No athletes found</h3>
                                <p className="text-slate-500 text-sm">Try adjusting your filters or searching for a different sport.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        )}

      </div>
    </main>
  );
}