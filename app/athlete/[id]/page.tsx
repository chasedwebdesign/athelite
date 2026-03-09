'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Medal, CheckCircle2, MapPin, Mail, X, Send, MessageSquare, Lock, Trophy, Calendar, Share2, ArrowLeft, Activity, Globe, School, UserCircle2, Clock, Star, Instagram, Check } from 'lucide-react';
import Link from 'next/link';

// 🚨 IMPORTED REUSABLE BORDER COMPONENT
import { AvatarWithBorder } from '@/components/AnimatedBorders'; 

interface AthleteProfile {
  id: string;
  first_name: string;
  last_name: string;
  high_school: string;
  state: string;
  grad_year: number;
  trust_level: number;
  gender: string;
  prs: { event: string; mark: string; date?: string; meet?: string }[];
  avatar_url?: string;
  equipped_border?: string | null;
  equipped_title?: string | null; // Added to fetch their equipped rank
}

interface AthletePost {
  id: string;
  content: string;
  created_at: string;
  linked_pr_event?: string | null;
  linked_pr_mark?: string | null;
}

// --- EARNED TITLES INVENTORY ---
const EARNED_TITLES = [
  { id: 'legend', name: 'Legend', reqPercentile: 0.01, badgeClass: 'legend-badge', unlockText: 'Reach Top 1%' },
  { id: 'champion', name: 'Champion', reqPercentile: 0.05, badgeClass: 'champion-badge', unlockText: 'Reach Top 5%' },
  { id: 'elite', name: 'Elite', reqPercentile: 0.15, badgeClass: 'elite-badge', unlockText: 'Reach Top 15%' },
  { id: 'master', name: 'Master', reqPercentile: 0.30, badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300', unlockText: 'Reach Top 30%' },
  { id: 'contender', name: 'Contender', reqPercentile: 0.50, badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300', unlockText: 'Reach Top 50%' },
  { id: 'challenger', name: 'Challenger', reqPercentile: 0.75, badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300', unlockText: 'Reach Top 75%' },
  { id: 'prospect', name: 'Prospect', reqPercentile: 1.0, badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300', unlockText: 'Standard Rank' },
];

export default function PublicAthleteProfile() {
  const params = useParams();
  const router = useRouter();
  const athleteId = params.id as string;
  const supabase = createClient();
  
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [posts, setPosts] = useState<AthletePost[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'accolades' | 'activity'>('accolades');

  // USER STATE
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');
  const [coachType, setCoachType] = useState<string | null>(null);
  const [isVerifiedCoach, setIsVerifiedCoach] = useState(false);
  const [isVerifiedAthlete, setIsVerifiedAthlete] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  
  // WATCHLIST STATE
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // MESSAGING STATE
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'pitch' | 'chat'>('pitch');
  
  // Auto-filled sender info
  const [senderName, setSenderName] = useState('');
  const [senderSchool, setSenderSchool] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function fetchProfileAndUser() {
      // 1. Fetch the Profile being viewed
      const { data: athleteData } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', athleteId)
        .single();

      if (athleteData) {
        setAthlete(athleteData as AthleteProfile);
      }

      // 2. Fetch their posts
      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: false });

      if (postData) {
        setPosts(postData as AthletePost[]);
      }

      // 3. Fetch current logged-in user to see if they can interact
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setCurrentUserId(session.user.id);
        setCurrentUserEmail(session.user.email || '');

        if (session.user.id === athleteId) {
          setIsSelf(true);
        }

        const { data: cData } = await supabase
          .from('coaches')
          .select('first_name, last_name, school_name, coach_type')
          .eq('id', session.user.id)
          .maybeSingle();

        if (cData) {
          setViewerRole('coach');
          
          const hasCompleteProfile = !!(cData.first_name && cData.last_name && cData.school_name);
          setIsVerifiedCoach(hasCompleteProfile);
          
          setCoachType(cData.coach_type);
          setSenderName(`${cData.first_name || 'Coach'} ${cData.last_name || ''}`.trim());
          setSenderSchool(cData.school_name || 'Unknown University');
          setSenderEmail(session.user.email || '');

          const { data: savedData } = await supabase
            .from('saved_recruits')
            .select('id')
            .eq('coach_id', session.user.id)
            .eq('athlete_id', athleteId)
            .maybeSingle();
          
          if (savedData) setIsSaved(true);

        } else {
          const { data: aData } = await supabase
            .from('athletes')
            .select('id, trust_level, first_name, last_name, high_school')
            .eq('id', session.user.id)
            .maybeSingle();
            
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

    if (athleteId) {
      fetchProfileAndUser();
    }
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
    } catch (err: any) {
      alert(`Failed to update watchlist: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
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

  const handleSendMessage = async (e: React.FormEvent) => {
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
    
    // Attempt native share first for mobile users!
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${athlete?.first_name} ${athlete?.last_name} | ChasedSports`,
          text: `Check out my verified Track & Field stats and national rank on ChasedSports! 🏃💨`,
          url: url,
        });
        return; // Exit if share was successful
      } catch (err) {
        console.log('Native share canceled or failed:', err);
      }
    } 
    
    // Fallback for desktop or failed shares
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-center p-6">
        <Activity className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-3xl font-black text-slate-900 mb-2">Athlete Not Found</h1>
        <p className="text-slate-500 mb-6">This profile may have been removed or does not exist.</p>
        <button onClick={() => router.push('/')} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl">Return Home</button>
      </div>
    );
  }

  // Find the equipped title for styling
  const activeTitle = EARNED_TITLES.find(t => t.id === athlete.equipped_title) || EARNED_TITLES[6];

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      
      {/* GLOBAL BADGE ANIMATION CLASSES */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .legend-badge { background: linear-gradient(90deg, #6b21a8 0%, #d946ef 20%, #6b21a8 40%, #d946ef 60%, #6b21a8 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #e879f9; box-shadow: 0 0 15px rgba(217, 70, 239, 0.5); font-weight: 900; }
        .champion-badge { background: linear-gradient(90deg, #991b1b 0%, #ef4444 20%, #991b1b 40%, #ef4444 60%, #991b1b 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #f87171; box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); font-weight: 900; }
        .elite-badge { background: linear-gradient(90deg, #0f172a 0%, #475569 20%, #0f172a 40%, #475569 60%, #0f172a 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #94a3b8; box-shadow: 0 0 15px rgba(148, 163, 184, 0.3); font-weight: 900; }
      `}} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>

        {/* HERO CARD */}
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 md:p-12 border border-slate-200 shadow-xl relative overflow-hidden mb-6 transition-all duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            
            {/* 🚨 REPLACED WITH AVATAR WITH BORDER COMPONENT */}
            <AvatarWithBorder 
                avatarUrl={athlete.avatar_url || null} 
                borderId={athlete.equipped_border} 
                sizeClasses="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40"
            />

            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2 justify-center md:justify-start">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                  {athlete.first_name} {athlete.last_name}
                </h1>
                {athlete.trust_level > 0 && (
                  <div className="inline-flex items-center bg-green-50 border border-green-200 px-3 py-1 rounded-full w-max mx-auto md:mx-0">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-1.5" />
                    <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Verified</span>
                  </div>
                )}
              </div>

              {/* 🚨 DISPLAY EQUIPPED TITLE */}
              <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase text-white ${activeTitle.badgeClass}`}>
                    {activeTitle.name} Rank
                  </span>
              </div>
              
              <p className="text-sm sm:text-base md:text-lg font-bold text-slate-500 mb-6 flex flex-col md:flex-row items-center gap-2 md:gap-4 justify-center md:justify-start text-balance">
                <span className="flex items-center"><MapPin className="w-4 h-4 md:w-5 md:h-5 mr-1" /> {athlete.high_school} {athlete.state ? `, ${athlete.state}` : ''}</span>
                <span className="hidden md:inline text-slate-300">•</span>
                <span>Class of {athlete.grad_year || '202X'}</span>
                <span className="hidden md:inline text-slate-300">•</span>
                <span>{athlete.gender || 'Boys'} Division</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                {!isSelf && (
                  <>
                    {viewerRole === 'guest' ? (
                      <Link href="/login" className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200">
                        <Lock className="w-5 h-5" /> Log in to Connect
                      </Link>
                    ) : (viewerRole === 'coach' && !isVerifiedCoach) ? (
                      <div className="w-full sm:w-auto bg-slate-100 text-slate-400 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 border border-slate-200">
                        <Lock className="w-5 h-5" /> Update Profile to Message
                      </div>
                    ) : (
                      <button onClick={handleContactClick} className="w-full sm:w-auto bg-slate-900 hover:bg-blue-600 text-white font-black py-3.5 px-8 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg">
                        <Mail className="w-5 h-5" /> Contact
                      </button>
                    )}

                    {/* COACH WATCHLIST BUTTON */}
                    {viewerRole === 'coach' && (
                      <button 
                        onClick={handleToggleSave} 
                        disabled={isSaving} 
                        className={`w-full sm:w-auto border py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 font-bold shadow-sm ${
                          isSaved 
                            ? 'bg-yellow-50 text-yellow-600 border-yellow-300 hover:bg-yellow-100 hover:border-yellow-400' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-yellow-400 hover:text-yellow-600 hover:shadow-md'
                        }`}
                      >
                        <Star className={`w-5 h-5 transition-colors ${isSaved ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400 group-hover:text-yellow-500'}`} />
                        {isSaved ? 'Saved to Watchlist' : 'Save Recruit'}
                      </button>
                    )}
                  </>
                )}
                
                {/* ENHANCED SHARE BUTTON */}
                <button onClick={handleCopyLink} className="w-full sm:w-auto bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-300 text-blue-700 font-black py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                  {copySuccess ? <><CheckCircle2 className="w-5 h-5 text-green-500" /> Copied!</> : <><Share2 className="w-5 h-5" /> Share Profile</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 mb-6 sm:mb-8 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('accolades')}
            className={`px-4 sm:px-6 py-4 font-bold text-sm sm:text-base flex items-center gap-2 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'accolades' ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Trophy className="w-5 h-5" /> Accolades
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`px-4 sm:px-6 py-4 font-bold text-sm sm:text-base flex items-center gap-2 border-b-4 transition-colors whitespace-nowrap ${activeTab === 'activity' ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Globe className="w-5 h-5" /> Activity
          </button>
        </div>

        {/* ACCOLADES */}
        {activeTab === 'accolades' && (
          <div className="animate-in fade-in duration-300">
            {athlete.prs && athlete.prs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {athlete.prs.map((pr, index) => (
                  <div key={index} className="bg-white p-5 sm:p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between group hover:border-blue-300 transition-colors gap-3 sm:gap-0">
                    <div className="flex-1 pr-0 sm:pr-4 min-w-0">
                      <span className="block text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Event</span>
                      <span className="font-black text-lg sm:text-xl text-slate-900 truncate block">{pr.event}</span>
                      {(pr.date || pr.meet) && (
                        <div className="flex items-center text-[10px] sm:text-xs text-slate-500 font-medium mt-1 sm:mt-2">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-slate-400 shrink-0" /> 
                          <span className="whitespace-nowrap">{pr.date}</span>
                          <span className="mx-1.5 sm:mx-2 text-slate-300">•</span> 
                          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-slate-400 shrink-0" /> 
                          <span className="truncate">{pr.meet}</span>
                        </div>
                      )}
                    </div>
                    <div className="sm:text-right pt-3 sm:pt-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-slate-100 shrink-0">
                      <span className="block text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-widest mb-0.5 sm:mb-1">Mark</span>
                      <span className="font-black text-2xl sm:text-3xl text-blue-600 whitespace-nowrap">{pr.mark}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-8 sm:p-10 rounded-[2rem] border border-slate-200 border-dashed text-center">
                <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">No times recorded yet</h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">This athlete has not synced any official results.</p>
              </div>
            )}
          </div>
        )}

        {/* ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="animate-in fade-in duration-300 space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="bg-white p-5 sm:p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      
                      {/* 🚨 REPLACED FEED POST AVATAR */}
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

      {/* --- SIMPLIFIED MESSAGING MODAL --- */}
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