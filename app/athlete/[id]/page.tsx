'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  CheckCircle2, MapPin, Mail, X, Send, Lock, Trophy, Calendar, 
  Share2, ArrowLeft, Activity, Globe, School, UserCircle2, 
  Clock, Star, ShieldCheck, AlertTriangle, Search, BookOpen, 
  Eye, Link as LinkIcon, FileText, GraduationCap, Medal, Target
} from 'lucide-react';
import Link from 'next/link';

import { AvatarWithBorder } from '@/components/AnimatedBorders'; 

interface AthleteSport {
  id: string;
  athlete_id: string;
  sport_name: string;
  position: string | null;
  level_of_play: string | null;
  athleticism_tier: string | null;
  custom_fit_score: number;
  metrics: { name: string; value: string }[];
  meta_context: { accolades?: any[] } | null;
  is_active: boolean;
}

interface AthleteProfile {
  id: string;
  first_name: string;
  last_name: string;
  high_school: string;
  state: string;
  grad_year: number;
  trust_level: number;
  gender: string;
  avatar_url?: string;
  equipped_border?: string | null;
  equipped_card?: string | null;
  equipped_title?: string | null; 
  profile_views?: number; 
  search_appearances?: number;
  saved_resume?: string | null;
}

interface AthletePost {
  id: string;
  content: string;
  created_at: string;
  linked_pr_event?: string | null;
  linked_pr_mark?: string | null;
}

const EARNED_TITLES = [
  { id: 'legend', name: 'Legend', reqPercentile: 0.01, badgeClass: 'legend-badge', unlockText: 'Reach Top 1%' },
  { id: 'champion', name: 'Champion', reqPercentile: 0.05, badgeClass: 'champion-badge', unlockText: 'Reach Top 5%' },
  { id: 'elite', name: 'Elite', reqPercentile: 0.15, badgeClass: 'elite-badge', unlockText: 'Reach Top 15%' },
  { id: 'master', name: 'Master', reqPercentile: 0.30, badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300', unlockText: 'Reach Top 30%' },
  { id: 'contender', name: 'Contender', reqPercentile: 0.50, badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300', unlockText: 'Reach Top 50%' },
  { id: 'challenger', name: 'Challenger', reqPercentile: 0.75, badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300', unlockText: 'Reach Top 75%' },
  { id: 'prospect', name: 'Prospect', reqPercentile: 1.0, badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300', unlockText: 'Standard Rank' },
];

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function PublicAthletePortfolio() {
  const params = useParams();
  const router = useRouter();
  const athleteId = params.id as string;
  const supabase = createClient();
  
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [athleteSports, setAthleteSports] = useState<AthleteSport[]>([]);
  const [posts, setPosts] = useState<AthletePost[]>([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'accolades' | 'activity'>('accolades');

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');
  const [coachType, setCoachType] = useState<string | null>(null);
  const [isVerifiedCoach, setIsVerifiedCoach] = useState(false);
  const [isVerifiedAthlete, setIsVerifiedAthlete] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'pitch' | 'chat'>('pitch');
  const [senderName, setSenderName] = useState('');
  const [senderSchool, setSenderSchool] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const hasLoggedView = useRef(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function fetchProfileAndUser() {
      // 1. Fetch Core Athlete Profile
      const { data: athleteData } = await supabase.from('athletes').select('*').eq('id', athleteId).single();
      if (athleteData) setAthlete(athleteData as AthleteProfile);

      // 2. Fetch Athlete Sports (Replaces old PR array logic)
      const { data: sportsData } = await supabase
        .from('athlete_sports')
        .select('*')
        .eq('athlete_id', athleteId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (sportsData) setAthleteSports(sportsData as AthleteSport[]);

      // 3. Fetch Posts
      const { data: postData } = await supabase.from('posts').select('*').eq('athlete_id', athleteId).order('created_at', { ascending: false });
      if (postData) setPosts(postData as AthletePost[]);

      // 4. Resolve Auth & View State
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setCurrentUserId(session.user.id);
        setCurrentUserEmail(session.user.email || '');

        if (session.user.id === athleteId) setIsSelf(true);

        const { data: cData } = await supabase.from('coaches').select('id, first_name, last_name, school_name, coach_type').eq('id', session.user.id).maybeSingle();

        if (cData) {
          setViewerRole('coach');
          const hasCompleteProfile = !!(cData.first_name && cData.last_name && cData.school_name);
          setIsVerifiedCoach(hasCompleteProfile);
          setCoachType(cData.coach_type);
          setSenderName(`${cData.first_name || 'Coach'} ${cData.last_name || ''}`.trim());
          setSenderSchool(cData.school_name || 'Unknown University');
          setSenderEmail(session.user.email || '');

          const { data: savedData } = await supabase.from('saved_recruits').select('id').eq('coach_id', session.user.id).eq('athlete_id', athleteId).maybeSingle();
          if (savedData) setIsSaved(true);

          if (athleteData && !hasLoggedView.current) {
             hasLoggedView.current = true;
             const { error: rpcError } = await supabase.rpc('log_profile_view', {
                target_athlete_id: athleteId,
                viewing_coach_id: session.user.id
             });
             if (rpcError) console.error("❌ RPC ERROR:", rpcError);
          }

        } else {
          const { data: aData } = await supabase.from('athletes').select('id, trust_level, first_name, last_name, high_school').eq('id', session.user.id).maybeSingle();
          if (aData) {
            setViewerRole('athlete');
            setIsVerifiedAthlete(aData.trust_level > 0);
            setSenderName(`${aData.first_name} ${aData.last_name}`);
            setSenderSchool(aData.high_school || '');
            setSenderEmail(session.user.email || '');
          }
        }
      }
      setLoading(false);
    }

    if (athleteId) fetchProfileAndUser();
  }, [athleteId, supabase]);

  const handleToggleSave = async () => {
    if (!currentUserId || viewerRole !== 'coach') return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await supabase.from('saved_recruits').delete().eq('coach_id', currentUserId).eq('athlete_id', athleteId);
        setIsSaved(false);
      } else {
        await supabase.from('saved_recruits').insert({ coach_id: currentUserId, athlete_id: athleteId });
        setIsSaved(true);
      }
    } catch (err: any) { alert(`Failed to update watchlist: ${err.message}`); } finally { setIsSaving(false); }
  };

  const handleContactClick = () => {
    if (viewerRole === 'guest' || !currentUserId) {
      alert("Please create an account or log in to contact athletes.");
      router.push('/login');
      return;
    }
    if (viewerRole === 'coach' && !isVerifiedCoach) {
      alert("Please complete your coach profile (Name & School) on your dashboard to send direct pitches.");
      return;
    }
    if (viewerRole === 'athlete' && !isVerifiedAthlete) {
      alert("Please sync your Athletic.net profile to message other athletes.");
      return;
    }

    const mode = (viewerRole === 'coach' && coachType === 'college') ? 'pitch' : 'chat';
    setModalMode(mode);
    setIsMessageModalOpen(true);
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!athlete) return;
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
        alert("Daily Limit Reached: To protect athletes from spam, you can only send 10 new connection requests or pitches per day. Please try again tomorrow!");
        setIsSending(false);
        return;
      }

      const { error } = await supabase.from('messages').insert({
        athlete_id: athlete.id,
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
      alert(`Failed to send message: ${error.message}`); 
    } finally { 
      setIsSending(false); 
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${athlete?.first_name} ${athlete?.last_name} | Official Athletic Portfolio`,
          text: `Check out my verified Track & Field stats and national rank on my ChasedSports Portfolio! 📈🏃‍♂️`,
          url: url,
        });
        return; 
      } catch (err) { console.log('Native share canceled or failed:', err); }
    } 
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    showToast("Portfolio link copied to clipboard!", "success");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Portfolio...</p>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-center p-6">
        <Activity className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-3xl font-black text-slate-900 mb-2">Portfolio Not Found</h1>
        <p className="text-slate-500 mb-6">This athlete's portfolio may have been removed or does not exist.</p>
        <button onClick={() => router.push('/')} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl">Return Home</button>
      </div>
    );
  }

  const activeTitle = EARNED_TITLES.find(t => t.id === athlete.equipped_title) || EARNED_TITLES[6];
  const isVerified = athlete.trust_level > 0;

  let parsedResume = { gpa: '', accolades: [] as string[], schoolPrefs: '' };
  if (athlete.saved_resume) {
    try {
      const parsed = JSON.parse(athlete.saved_resume);
      parsedResume = {
         gpa: parsed.gpa || '',
         accolades: parsed.accolades || [],
         schoolPrefs: parsed.schoolPrefs || ''
      };
    } catch (e) {
      parsedResume.schoolPrefs = athlete.saved_resume;
    }
  }
  
  let cardType = athlete.equipped_card || 'base';
  if (cardType === 'default') cardType = 'base';
  
  let containerClass = "bg-slate-900 border-slate-800 text-white shadow-2xl";
  let nameClass = "text-white";
  let metaClass = "text-slate-400";
  let dividerClass = "text-slate-600";
  let primaryBtnClass = "bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-transparent";
  let secondaryBtnClass = "bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white shadow-sm";
  let loginBtnClass = "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700";
  let badgeClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-400";
  let unverifiedBadgeClass = "bg-slate-800/80 border-slate-700 text-slate-400 backdrop-blur-sm";
  let saveBtnBaseClass = "bg-slate-800 text-slate-300 border-slate-700 hover:border-yellow-400 hover:text-yellow-400";
  
  let backgroundEffects = <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none z-0"></div>;

  const isAnimated = ['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber'].includes(cardType);

  if (cardType !== 'base') {
    containerClass = `holo-card-${cardType} border-white/20 shadow-2xl text-white`;
    if (isAnimated) containerClass += " animate-foil";
    
    nameClass = "text-white drop-shadow-md";
    metaClass = "text-white/80 font-medium";
    dividerClass = "text-white/40";
    primaryBtnClass = "bg-white/10 hover:bg-white/20 text-white shadow-lg border-white/20 backdrop-blur-md";
    secondaryBtnClass = "bg-black/20 hover:bg-black/30 border border-white/20 text-white shadow-sm backdrop-blur-md";
    loginBtnClass = "bg-black/40 hover:bg-black/60 text-white border border-white/20 backdrop-blur-sm";
    badgeClass = "bg-black/30 border-white/20 text-white backdrop-blur-sm";
    saveBtnBaseClass = "bg-black/20 text-white border-white/20 hover:border-yellow-400 hover:text-yellow-400 backdrop-blur-md";
    
    backgroundEffects = (
      <>
        {['hype', 'premium'].includes(cardType) && <div className="holo-glare rounded-[2.5rem]"></div>}
        {isAnimated && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay"></div>}
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerGlare { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes cyberScan { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(1000%); opacity: 0; } }
        @keyframes voidPulse { 0%, 100% { background-size: 100% 100%; filter: brightness(1); } 50% { background-size: 120% 120%; filter: brightness(1.2); } }
        
        .legend-badge { background: linear-gradient(90deg, #6b21a8 0%, #d946ef 20%, #6b21a8 40%, #d946ef 60%, #6b21a8 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #e879f9; box-shadow: 0 0 15px rgba(217, 70, 239, 0.5); font-weight: 900; }
        .champion-badge { background: linear-gradient(90deg, #991b1b 0%, #ef4444 20%, #991b1b 40%, #ef4444 60%, #991b1b 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #f87171; box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); font-weight: 900; }
        .elite-badge { background: linear-gradient(90deg, #0f172a 0%, #475569 20%, #0f172a 40%, #475569 60%, #0f172a 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #94a3b8; box-shadow: 0 0 15px rgba(148, 163, 184, 0.3); font-weight: 900; }
        
        .holo-card-base { background: transparent; }
        .holo-card-obsidian { background: linear-gradient(135deg, #0f172a 0%, #334155 25%, #000000 50%, #0f172a 75%, #1e293b 100%); background-size: 300% 300%; }
        .holo-card-crimson { background: linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #450a0a 100%); background-size: 300% 300%; }
        .holo-card-sapphire { background: linear-gradient(135deg, #172554 0%, #0ea5e9 50%, #172554 100%); background-size: 300% 300%; }
        
        .holo-card-hype { 
          background: 
            linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent 100%),
            linear-gradient(135deg, #4f46e5 0%, #9333ea 25%, #ec4899 50%, #3b82f6 75%, #4f46e5 100%); 
          background-size: 40px 40px, 300% 300%; 
        }

        .holo-card-premium { 
          background: 
            repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px),
            linear-gradient(135deg, #b45309 0%, #f59e0b 25%, #fef08a 50%, #d97706 75%, #78350f 100%); 
          background-size: 100% 100%, 300% 300%; 
        }

        .holo-card-amethyst { 
          background: radial-gradient(circle at 50% 50%, #c026d3 0%, #7e22ce 30%, #3b0764 80%, #000000 100%); 
          animation: voidPulse 6s ease-in-out infinite;
        }
        .holo-card-amethyst::before {
          content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.1;
          background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 2px, #fff 3px, #fff 4px);
        }

        .holo-card-cyber { 
          background: 
            linear-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.15) 1px, transparent 1px),
            linear-gradient(135deg, #022c22 0%, #064e3b 50%, #083344 100%);
          background-size: 20px 20px, 20px 20px, 100% 100%;
          box-shadow: inset 0 0 40px rgba(6, 182, 212, 0.3);
        }
        .holo-card-cyber::after {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 8px;
          background: rgba(34, 211, 238, 0.8); filter: blur(3px); box-shadow: 0 0 20px #22d3ee;
          animation: cyberScan 3s linear infinite;
        }
        
        .animate-foil { animation: foilShift 15s ease-in-out infinite; }
        .holo-glare { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%); background-size: 200% auto; animation: shimmerGlare 8s infinite linear; pointer-events: none; z-index: 10; mix-blend-mode: overlay;}
      `}} />

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 font-bold text-sm border ${toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-slate-900 text-white border-slate-700'}`}>
            {toast.type === 'error' ? <X className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />} {toast.message}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>

          {isSelf && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200">
                <Search className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{athlete.search_appearances || 0} Search Views</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-200">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{athlete.profile_views || 0} Profile Clicks</span>
              </div>
            </div>
          )}
        </div>

        <div className={`rounded-[2.5rem] p-6 sm:p-8 md:p-12 border relative overflow-hidden mb-6 transition-all duration-300 ${containerClass}`}>
          {backgroundEffects}
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            
            <AvatarWithBorder 
                avatarUrl={athlete.avatar_url || null} 
                borderId={athlete.equipped_border} 
                sizeClasses="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40"
            />

            <div className="flex-1 text-center md:text-left w-full">
              
              <div className="mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5 opacity-80`}>
                  <BookOpen className="w-3.5 h-3.5" /> Athletic Portfolio
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2 justify-center md:justify-start">
                <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${nameClass}`}>
                  {athlete.first_name} {athlete.last_name}
                </h1>
                
                {isVerified ? (
                  <div className={`inline-flex items-center border px-3 py-1 rounded-full w-max mx-auto md:mx-0 ${badgeClass}`}>
                    <ShieldCheck className="w-4 h-4 mr-1.5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Verified Indexed</span>
                  </div>
                ) : (
                  <div className={`inline-flex items-center border px-3 py-1 rounded-full w-max mx-auto md:mx-0 ${unverifiedBadgeClass}`}>
                    <span title="This profile's results are self-reported and not officially indexed.">
                      <AlertTriangle className="w-4 h-4 mr-1.5 inline" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest">Unverified</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase text-white shadow-sm ${activeTitle.badgeClass}`}>
                    {activeTitle.name} Rank
                  </span>
              </div>
              
              <p className={`text-sm sm:text-base md:text-lg mb-6 flex flex-col md:flex-row items-center gap-2 md:gap-4 justify-center md:justify-start text-balance ${metaClass}`}>
                <span className="flex items-center"><MapPin className="w-4 h-4 md:w-5 md:h-5 mr-1" /> {athlete.high_school} {athlete.state ? `, ${athlete.state}` : ''}</span>
                <span className={`hidden md:inline ${dividerClass}`}>•</span>
                <span>Class of {athlete.grad_year || '202X'}</span>
                <span className={`hidden md:inline ${dividerClass}`}>•</span>
                <span>{athlete.gender || 'Boys'} Division</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                {!isSelf && (
                  <>
                    {viewerRole === 'guest' ? (
                      <Link href="/login" className={`w-full sm:w-auto font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 border ${loginBtnClass}`}>
                        <Lock className="w-5 h-5" /> Log in to Connect
                      </Link>
                    ) : (viewerRole === 'coach' && !isVerifiedCoach) ? (
                      <div className={`w-full sm:w-auto font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 border ${loginBtnClass}`}>
                        <Lock className="w-5 h-5" /> Update Profile to Message
                      </div>
                    ) : (
                      <button onClick={handleContactClick} className={`w-full sm:w-auto font-black py-3.5 px-8 rounded-xl transition-colors flex items-center justify-center gap-2 ${primaryBtnClass}`}>
                        <Mail className="w-5 h-5" /> Contact Athlete
                      </button>
                    )}

                    {viewerRole === 'coach' && (
                      <button 
                        onClick={handleToggleSave} 
                        disabled={isSaving} 
                        className={`w-full sm:w-auto py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 font-bold ${
                          isSaved 
                            ? 'bg-yellow-50 text-yellow-600 border border-yellow-300 hover:bg-yellow-100 hover:border-yellow-400 shadow-sm' 
                            : `${saveBtnBaseClass} border shadow-sm`
                        }`}
                      >
                        <Star className={`w-5 h-5 transition-colors ${isSaved ? 'fill-yellow-500 text-yellow-500' : 'opacity-70 group-hover:text-yellow-500'}`} />
                        {isSaved ? 'Saved to Watchlist' : 'Save Recruit'}
                      </button>
                    )}
                  </>
                )}
                
                <button onClick={handleCopyLink} className={`w-full sm:w-auto font-black py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 border ${secondaryBtnClass}`}>
                  {copySuccess ? <><CheckCircle2 className="w-5 h-5" /> Copied!</> : <><Share2 className="w-5 h-5" /> Share Portfolio</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {viewerRole === 'coach' && !isVerified && (
           <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl mb-6 flex items-start gap-3 shadow-sm">
             <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
             <div>
               <h4 className="font-black text-sm">Unofficial Data Notice</h4>
               <p className="text-sm font-medium mt-1">This athlete has not yet linked their Athletic.net profile. The times listed below are self-reported and have not been indexed by our verified scraping engine.</p>
             </div>
           </div>
        )}

        <div className="flex border-b border-slate-200 mb-6 sm:mb-8 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('accolades')}
            className={`px-4 sm:px-6 py-4 font-bold text-sm sm:text-base flex items-center gap-2 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'accolades' ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Trophy className="w-5 h-5" /> Stats & Academics
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`px-4 sm:px-6 py-4 font-bold text-sm sm:text-base flex items-center gap-2 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'activity' ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Globe className="w-5 h-5" /> Feed Activity
          </button>
        </div>

        {activeTab === 'accolades' && (
          <div className="animate-in fade-in duration-300">
            
            {(parsedResume.gpa || parsedResume.accolades.length > 0 || parsedResume.schoolPrefs) && (
              <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm mb-6 space-y-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <FileText className="w-5 h-5 text-blue-500" /> Athlete Overview
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {parsedResume.gpa && (
                     <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Unweighted GPA</p>
                       <p className="text-3xl font-black text-slate-800">{parsedResume.gpa}</p>
                     </div>
                   )}
                   {parsedResume.accolades.length > 0 && (
                     <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Medal className="w-3.5 h-3.5" /> Career Highlights</p>
                       <div className="flex flex-wrap gap-2">
                         {parsedResume.accolades.map((acc, i) => (
                           <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold">{acc}</span>
                         ))}
                       </div>
                     </div>
                   )}
                </div>

                {parsedResume.schoolPrefs && (
                   <div className="pt-4 border-t border-slate-100">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><School className="w-3.5 h-3.5" /> School Preferences</p>
                     <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{parsedResume.schoolPrefs}</p>
                   </div>
                )}
              </div>
            )}

            {athleteSports && athleteSports.length > 0 ? (
              <div className="space-y-6">
                {athleteSports.map((sport) => (
                  <div key={sport.id} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    
                    {/* Sport Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-5 mb-5 gap-4">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                          {sport.sport_name}
                        </h3>
                        <p className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-2">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs uppercase tracking-widest">{sport.position || 'Athlete'}</span>
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs uppercase tracking-widest">{sport.level_of_play || 'Varsity'}</span>
                        </p>
                      </div>
                      
                      {sport.athleticism_tier && (
                        <div className="shrink-0 bg-blue-50 border border-blue-100 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-center shadow-sm">
                          Tier: {sport.athleticism_tier}
                        </div>
                      )}
                    </div>

                    {/* Metrics Grid */}
                    {sport.metrics && sport.metrics.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4 text-slate-400" /> Core Metrics
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {sport.metrics.map((m: any, i: number) => (
                            <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 truncate w-full" title={m.name}>{m.name}</span>
                              <span className="font-black text-lg text-slate-800 truncate w-full" title={m.value}>{m.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Accolades List */}
                    {sport.meta_context?.accolades && sport.meta_context.accolades.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                          <Medal className="w-4 h-4 text-amber-500" /> Season Accolades
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {sport.meta_context.accolades.map((acc: any, i: number) => (
                            <div key={i} className="inline-flex items-center bg-amber-50 border border-amber-200 pl-1.5 pr-3 py-1.5 rounded-xl shadow-sm gap-2">
                              {acc.type === 'state' ? (
                                <>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-200/50 px-2 py-1 rounded-lg">
                                    {getOrdinal(acc.placement)} in State
                                  </span>
                                  <span className="text-xs font-bold text-amber-900">{acc.contribution}</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg">
                                    Honor
                                  </span>
                                  <span className="text-xs font-bold text-slate-700">{acc.text}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-8 sm:p-10 rounded-[2rem] border border-slate-200 border-dashed text-center">
                <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">No times or sports recorded yet</h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">This athlete has not synced any verified data to their profile.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="animate-in fade-in duration-300 space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="bg-white p-5 sm:p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      
                      <AvatarWithBorder 
                        avatarUrl={athlete.avatar_url || null} 
                        borderId={athlete.equipped_border} 
                        sizeClasses="w-12 h-12"
                      />
                      
                      <div>
                        <h4 className="font-black text-sm sm:text-base text-slate-900 leading-tight">{athlete.first_name} {athlete.last_name}</h4>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400">{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-700 font-medium text-sm sm:text-[15px] mb-4 whitespace-pre-wrap">{post.content}</p>
                  {post.linked_pr_event && (
                    <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 px-3 py-1.5 rounded-xl shadow-sm mt-2 flex-wrap">
                      <Trophy className="w-3.5 h-3.5 text-blue-500 mr-2 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mr-2">{post.linked_pr_event}</span>
                      <span className="text-xs font-black text-blue-600">{post.linked_pr_mark}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-slate-50 p-8 sm:p-10 rounded-[2rem] border border-slate-200 border-dashed text-center">
                <Globe className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">No Activity Yet</h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">This athlete hasn't posted any updates to the global feed.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {isMessageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-slate-900">{modalMode === 'pitch' ? `Message ${athlete.first_name}` : `Connect with ${athlete.first_name}`}</h3>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">{modalMode === 'pitch' ? 'College Coach Pitch' : 'Connection Request'}</p>
              </div>
              <button onClick={() => setIsMessageModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            {sendSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">Sent!</h4>
                <p className="text-sm sm:text-base text-slate-500 font-medium">Your message has been securely delivered to their dashboard.</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="p-4 sm:p-6 space-y-4 sm:space-y-5 relative">
                
                <p className="text-[10px] font-black text-amber-500 bg-amber-50 rounded-lg px-3 py-2 text-center uppercase tracking-widest border border-amber-200 flex items-center justify-center gap-1.5 mb-2">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Daily Limit: 10 Pitches/Requests</span>
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                      {viewerRole === 'coach' ? <School className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /> : <UserCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{senderName}</p>
                      <p className="text-[10px] sm:text-xs font-bold text-slate-500 truncate">{senderSchool} • {senderEmail}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0 ml-2" />
                </div>

                <div className="space-y-1.5 mt-2">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider">Message</label>
                  <textarea required value={messageContent} onChange={(e) => setMessageContent(e.target.value)} rows={4} className="w-full text-sm sm:text-base border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium resize-none" placeholder={modalMode === 'pitch' ? `Hi ${athlete.first_name}...` : `Hey ${athlete.first_name}...`}></textarea>
                </div>

                <button type="submit" disabled={isSending} className={`w-full text-white font-black py-3 sm:py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base ${modalMode === 'pitch' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-500'}`}>
                  {isSending ? 'Sending...' : <><Send className="w-4 h-4 sm:w-5 sm:h-5" /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}