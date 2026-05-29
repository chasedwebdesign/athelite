'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, Trophy, Search, Activity, ChevronRight, BookOpen, Users, 
  TrendingUp, Landmark, ChevronDown, ChevronUp, DollarSign, Percent, 
  Award, Gem, RotateCcw, Bookmark, RefreshCw, UserCircle2, School, 
  ShieldCheck, BookmarkPlus, Check, Trash2, FileText, Save, ArrowRight, 
  Medal, Plus, LogOut, X, Target, Dumbbell, Scale, Swords, CheckCircle2, 
  GraduationCap, Flame, Rocket, Crown, Calendar, Gift, Paintbrush, 
  Share2, AlertCircle, Lock, Eye, Globe, Link as LinkIcon, Image as ImageIcon, 
  Download, CheckSquare, Square
} from 'lucide-react';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

// 🚨 FUTURE SPORTS CONFIGURATION 🚨
const UPCOMING_SPORTS = [
  { id: 'basketball', name: 'Basketball', icon: Target, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'soccer', name: 'Soccer', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'football', name: 'Football', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'volleyball', name: 'Volleyball', icon: Activity, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-200' },
  { id: 'weightlifting', name: 'Weightlifting', icon: Dumbbell, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300' },
];

interface University {
  id: string;
  name: string;
  city: string;
  state: string;
  division: string;
  student_population: string;
  majors_offered: string[];
  programs: any[]; 
  acceptance_rate?: string;
  median_earnings?: number;
  tuition_in_state?: number;
  tuition_out_of_state?: number;
  tuition?: number;
}

function formatCurrency(num: number | null | undefined) {
  if (!num) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

const UMBRELLA_MAP: Record<string, string> = {
  'accounting': 'Business & Marketing',
  'finance': 'Business & Marketing',
  'marketing': 'Business & Marketing',
  'business': 'Business & Marketing',
  'sports management': 'Business & Marketing',
  'nursing': 'Health Professions & Nursing',
  'pre-med': 'Biological & Biomedical Sciences',
  'medicine': 'Health Professions & Nursing',
  'physical therapy': 'Health Professions & Nursing',
  'kinesiology': 'Kinesiology & Parks/Recreation',
  'exercise science': 'Kinesiology & Parks/Recreation',
  'graphic design': 'Visual & Performing Arts',
  'computer science': 'Computer & Information Sciences',
  'mechanical engineering': 'Engineering',
  'biology': 'Biological & Biomedical Sciences',
  'psychology': 'Psychology',
};

function getUmbrellaMajor(searchTerm: string): string {
  if (!searchTerm) return '';
  const term = searchTerm.toLowerCase().trim();
  if (UMBRELLA_MAP[term]) return UMBRELLA_MAP[term];
  for (const [key, umbrella] of Object.entries(UMBRELLA_MAP)) {
    if (term.includes(key)) return umbrella;
  }
  const allUmbrellas = Array.from(new Set(Object.values(UMBRELLA_MAP)));
  const directUmbrellaMatch = allUmbrellas.find(u => u.toLowerCase() === term);
  if (directUmbrellaMatch) return directUmbrellaMatch;
  return searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
}

const getRealStats = (college: any) => {
  if (!college) return { tuitionStr: 'N/A', salaryStr: 'N/A', gradRateStr: 'N/A', budgetStr: 'N/A', matchScore: 0, rawTuition: Infinity, rawSalary: 0 };
  
  const rawTuition = college.tuition_out_of_state || college.out_of_state_tuition || college.tuition_in_state || college.in_state_tuition || college.tuition || 0;
  const rawSalary = college.median_earnings || college.median_salary || college.ten_year_salary || college.post_grad_earnings || 0;
  const rawGradRate = college.graduation_rate || college.grad_rate || college.acceptance_rate || 0;
  const rawBudget = college.athletic_budget || college.total_revenue || college.budget || 0;

  const formatCurrencyLocal = (val: any) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : Number(val);
    if (!num || isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  const formatPercent = (val: any) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : Number(val);
    if (!num || isNaN(num)) return 'N/A';
    return num <= 1 ? `${(num * 100).toFixed(0)}%` : `${num.toFixed(0)}%`;
  };

  const formatBudget = (val: any) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : Number(val);
    if (!num || isNaN(num)) return 'N/A';
    if (num > 100000) return `$${(num / 1000000).toFixed(1)}M`;
    return `$${num}M`;
  };

  const seed = college.name ? college.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 100;
  const matchScore = 60 + (seed % 39);

  return {
    tuitionStr: formatCurrencyLocal(rawTuition) !== 'N/A' ? `${formatCurrencyLocal(rawTuition)}/yr` : 'N/A',
    salaryStr: formatCurrencyLocal(rawSalary),
    gradRateStr: formatPercent(rawGradRate),
    budgetStr: formatBudget(rawBudget),
    matchScore,
    rawTuition: Number(rawTuition) || Infinity, 
    rawSalary: Number(rawSalary) || 0,
  };
};

export default function DashboardHomebase() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athleteProfile, setAthleteProfile] = useState<any>(null);
  const [streak, setStreak] = useState(0); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [savedColleges, setSavedColleges] = useState<any[]>([]);
  
  // 🚨 PORTFOLIO EDITOR STATES (Stored dynamically in saved_resume)
  const [gpa, setGpa] = useState('');
  const [accolades, setAccolades] = useState<string[]>([]);
  const [newAccolade, setNewAccolade] = useState('');
  const [schoolPrefs, setSchoolPrefs] = useState('');
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // 🚨 SOCIAL CARD BUILDER STATES 🚨
  const [selectedPRs, setSelectedPRs] = useState<string[]>([]);
  const [selectedAccolades, setSelectedAccolades] = useState<string[]>([]);
  const [includeGPA, setIncludeGPA] = useState(true);
  const [isExportingCard, setIsExportingCard] = useState(false);

  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [compareList, setCompareList] = useState<any[]>([]);

  const [daysSinceJoin, setDaysSinceJoin] = useState(0);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  // --- Auth & Target Schools States ---
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAthlete, setIsAthlete] = useState<boolean>(false);
  const [savedCollegeIds, setSavedCollegeIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState<'home' | 'social' | 'rewards'>('home');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadHomebase() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: coachData } = await supabase.from('coaches').select('id').eq('id', session.user.id).maybeSingle();
      if (coachData) { router.push('/dashboard/coach'); return; }

      const { data: athleteData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();
      if (athleteData) {
        setAthleteProfile(athleteData);
        
        // LOAD STRUCTURED RESUME DATA
        let loadedAccolades: string[] = [];
        if (athleteData.saved_resume) {
          try {
            const parsed = JSON.parse(athleteData.saved_resume);
            setGpa(parsed.gpa || '');
            loadedAccolades = parsed.accolades || [];
            setAccolades(loadedAccolades);
            setSchoolPrefs(parsed.schoolPrefs || '');
          } catch (e) {
            setSchoolPrefs(athleteData.saved_resume);
          }
        }
        
        if (athleteData.created_at) {
          const diffTime = Math.abs(new Date().getTime() - new Date(athleteData.created_at).getTime());
          setDaysSinceJoin(Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        }

        // Initialize Builder Default States
        if (athleteData.prs && athleteData.prs.length > 0) {
          setSelectedPRs(athleteData.prs.slice(0, 3).map((p: any) => p.event));
        }
        if (loadedAccolades.length > 0) {
          setSelectedAccolades(loadedAccolades.slice(0, 3));
        }

        const todayStr = new Date().toLocaleDateString('en-CA');
        let currentStreak = athleteData.current_login_streak || 0;
        const lastLoginStr = athleteData.last_login_date;

        if (lastLoginStr === todayStr) {
          setStreak(currentStreak);
        } else {
          let newStreak = 1; 
          if (lastLoginStr) {
            const diffDays = Math.ceil(Math.abs(new Date(todayStr).getTime() - new Date(lastLoginStr).getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) newStreak = currentStreak + 1;
          }
          setStreak(newStreak);
          await supabase.from('athletes').update({ current_login_streak: newStreak, last_login_date: todayStr }).eq('id', athleteData.id);
        }
      }

      const { data: savedCollegesData } = await supabase
        .from('saved_colleges')
        .select(`id, college_id, universities (*)`)
        .eq('athlete_id', session.user.id);
        
      if (savedCollegesData) setSavedColleges(savedCollegesData);

      setLoading(false);
    }
    loadHomebase();
  }, [supabase, router]);

  useEffect(() => {
    async function fetchUserAndSaves() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        
        const { data: athleteData } = await supabase
          .from('athletes')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (athleteData) {
          setIsAthlete(true);
          const { data } = await supabase
            .from('saved_colleges')
            .select('college_id')
            .eq('athlete_id', session.user.id);
          
          if (data) {
            setSavedCollegeIds(new Set(data.map(d => d.college_id)));
          }
        }
      }
    }
    fetchUserAndSaves();
  }, [supabase]);

  useEffect(() => {
    const searchColleges = async () => {
      if (searchQuery.trim().length < 3) {
        setSearchResults([]);
        return;
      }
      const { data } = await supabase
        .from('universities')
        .select('id, name, state, division, logo_url')
        .ilike('name', `%${searchQuery.trim()}%`)
        .limit(6);
      
      if (data) setSearchResults(data);
    };
    
    const timeoutId = setTimeout(searchColleges, 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, supabase]);


  const handleSaveCollegeDashboard = async (collegeId: string) => {
    if (!athleteProfile?.id) return;
    try {
      const exists = savedColleges.some(c => c.college_id === collegeId);
      if (exists) return;
      await supabase.from('saved_colleges').insert({ athlete_id: athleteProfile.id, college_id: collegeId });
      const { data } = await supabase.from('saved_colleges').select(`id, college_id, universities (*)`).eq('athlete_id', athleteProfile.id);
      if (data) setSavedColleges(data);
      setSearchQuery('');
    } catch (err) { console.error(err); }
  };

  const handleRemoveCollegeDashboard = async (savedId: string) => {
    try {
      await supabase.from('saved_colleges').delete().eq('id', savedId);
      const removedItem = savedColleges.find(c => c.id === savedId);
      setSavedColleges(prev => prev.filter(c => c.id !== savedId));
      if (removedItem) setCompareList(prev => prev.filter(c => c.id !== removedItem.universities.id));
    } catch (err) { console.error(err); }
  };

  const toggleCompare = (college: any) => {
    const isAlreadyComparing = compareList.some(c => c.id === college.id);
    if (isAlreadyComparing) {
      setCompareList(prev => prev.filter(c => c.id !== college.id));
    } else {
      if (compareList.length >= 3) {
        showToast("You can only compare 3 colleges at a time.", "error");
        return;
      }
      setCompareList(prev => [...prev, college]);
    }
  };

  // 🚨 PORTFOLIO SAVE LOGIC (Saves as JSON to existing saved_resume column) 🚨
  const handleSavePortfolio = async () => {
    if (!athleteProfile?.id) return;
    setIsSavingResume(true);
    try {
      const payload = JSON.stringify({
        gpa,
        accolades,
        schoolPrefs
      });

      await supabase.from('athletes').update({ saved_resume: payload }).eq('id', athleteProfile.id);
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast("Portfolio details saved successfully!");
    } catch (err) { 
      console.error(err); 
      showToast("Failed to save portfolio.", "error");
    } finally { 
      setIsSavingResume(false); 
    }
  };

  const addAccolade = () => {
    if (newAccolade.trim().length > 0 && !accolades.includes(newAccolade.trim())) {
      const newAccs = [...accolades, newAccolade.trim()];
      setAccolades(newAccs);
      setNewAccolade('');
      if (selectedAccolades.length < 3) setSelectedAccolades([...selectedAccolades, newAccolade.trim()]);
    }
  };

  const removeAccolade = (acc: string) => {
    setAccolades(accolades.filter(a => a !== acc));
    setSelectedAccolades(selectedAccolades.filter(a => a !== acc));
  };

  // 🚨 DOWNLOAD SOCIAL GRAPHIC LOGIC 🚨
  const handleDownloadSocialCard = async () => {
    setIsExportingCard(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('social-card-export');
      if (!element) throw new Error("Card element not found.");
      
      const canvas = await html2canvas(element, { 
        backgroundColor: null, 
        scale: 3, // High-res export
        useCORS: true 
      });
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `${athleteProfile?.last_name}_RecruitingProfile.png`;
      link.href = dataUrl;
      link.click();
      showToast("Graphic exported successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export graphic.", "error");
    } finally {
      setIsExportingCard(false);
    }
  };

  const handleTogglePR = (event: string) => {
    if (selectedPRs.includes(event)) {
      setSelectedPRs(selectedPRs.filter(e => e !== event));
    } else {
      if (selectedPRs.length >= 4) return showToast("Max 4 PRs on the graphic.", "error");
      setSelectedPRs([...selectedPRs, event]);
    }
  };

  const handleToggleAccolade = (acc: string) => {
    if (selectedAccolades.includes(acc)) {
      setSelectedAccolades(selectedAccolades.filter(a => a !== acc));
    } else {
      if (selectedAccolades.length >= 3) return showToast("Max 3 Accolades on the graphic.", "error");
      setSelectedAccolades([...selectedAccolades, acc]);
    }
  };

  const handleAddSport = async (sportId: string) => {
    if (!athleteProfile?.id) return;
    try {
      const currentSports = athleteProfile.active_sports || [];
      if (currentSports.includes(sportId)) return;
      const newSports = [...currentSports, sportId];
      await supabase.from('athletes').update({ active_sports: newSports }).eq('id', athleteProfile.id);
      setAthleteProfile({ ...athleteProfile, active_sports: newSports });
      setShowAddSportModal(false);
      showToast("Track & Field portal added!", "success");
    } catch (err) { showToast("Failed to add sport", "error"); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleShareCode = async (code: string) => {
    const shareText = `Join me on ChasedSports! Use my invite code: ${code}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'ChasedSports Invite', text: shareText }); } catch (err) {}
    } else {
      await navigator.clipboard.writeText(shareText);
      showToast("Invite code copied to clipboard!", "success");
    }
  };

  const handleSubmitInviteCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!athleteProfile || !inviteCodeInput.trim()) return;
    setIsSubmittingCode(true);
    try {
        const cleanCode = inviteCodeInput.trim().replace(/\D/g, ''); 
        if (!cleanCode) throw new Error("Invalid invite code format.");

        const { data: referrers, error: searchError } = await supabase
          .from('athletes')
          .select('id, boosts_available, verified_referrals, unlocked_borders')
          .ilike('athletic_net_url', `%${cleanCode}%`)
          .limit(1);
          
        if (searchError || !referrers || referrers.length === 0) throw new Error("Code not found.");
        
        const referrer = referrers[0];
        if (referrer.id === athleteProfile.id) throw new Error("You cannot use your own code.");
        
        if (athleteProfile.trust_level > 0) {
            await supabase.rpc('reward_referrer', { referrer_id: referrer.id });
            let myBoosts = (athleteProfile.boosts_available || 0) + 1; 
            await supabase.from('athletes').update({ referred_by: referrer.id, boosts_available: myBoosts }).eq('id', athleteProfile.id);
            setAthleteProfile({ ...athleteProfile, referred_by: referrer.id, boosts_available: myBoosts });
        } else {
            await supabase.from('athletes').update({ referred_by: referrer.id }).eq('id', athleteProfile.id);
            setAthleteProfile({ ...athleteProfile, referred_by: referrer.id });
        }
        showToast("Invite code applied successfully!", "success");
        setInviteCodeInput('');
    } catch (err: any) { showToast(err.message, "error"); } finally { setIsSubmittingCode(false); }
  };

  const getStreakStyle = () => {
    if (streak >= 30) return { bg: 'bg-slate-900 border-slate-700 shadow-[0_0_15px_rgba(217,70,239,0.5)]', text: 'bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-fuchsia-400 text-transparent bg-clip-text animate-pulse', icon: 'text-cyan-400 fill-fuchsia-500 animate-bounce' }; 
    if (streak >= 14) return { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: 'text-purple-500 fill-purple-400 animate-pulse' }; 
    if (streak >= 7) return { bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-800', icon: 'text-cyan-500 fill-cyan-400' }; 
    if (streak >= 3) return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: 'text-red-500 fill-red-500 animate-pulse' }; 
    return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: 'text-orange-500 fill-orange-400' }; 
  };
  const streakTheme = getStreakStyle();

  const activeSports = athleteProfile?.active_sports || [];
  const primarySportQuery = activeSports.length > 0 ? activeSports[0] : 'general';

  const bestTuition = Math.min(...compareList.map(c => getRealStats(c).rawTuition));
  const bestSalary = Math.max(...compareList.map(c => getRealStats(c).rawSalary));
  const bestScore = Math.max(...compareList.map(c => getRealStats(c).matchScore));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Homebase...</p>
      </div>
    );
  }

  const myReferralCode = athleteProfile?.athletic_net_url?.match(/\d{5,}/)?.[0] || null;
  const isSkipped = athleteProfile?.athletic_net_url === 'skipped';
  const showCodeEntry = daysSinceJoin <= 7 && !athleteProfile?.referred_by && !isSkipped;
  
  const currentRefs = athleteProfile?.verified_referrals || 0;
  const cycle = Math.floor(currentRefs / 5);
  const base = cycle * 5;
  const progressInCycle = currentRefs - base;
  const progressPct = Math.min(100, (progressInCycle / 5) * 100);

  const milestones = [
    { count: base + 1, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 2, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 3, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 4, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 5, label: 'Plasma Border', icon: Crown, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500', isMajor: true },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-24 md:pb-12">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 font-bold text-sm border ${toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-slate-900 text-white border-slate-700'}`}>
            {toast.type === 'error' ? <X className="w-4 h-4 text-red-400" /> : <Check className="w-4 h-4 text-emerald-400" />} {toast.message}
          </div>
        </div>
      )}

      {/* ADD SPORT MODAL */}
      {showAddSportModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setShowAddSportModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Add a Sport</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Select another sport you compete in to add its portal to your Locker Room.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!activeSports.includes('track') && (
                <button 
                  onClick={() => handleAddSport('track')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 hover:shadow-md hover:scale-[1.02] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="block font-black text-slate-800 leading-none">Track & Field</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Add to Locker Room</span>
                  </div>
                </button>
              )}

              <div className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-slate-200 bg-slate-50 border-dashed opacity-70 cursor-not-allowed text-center ${!activeSports.includes('track') ? 'sm:col-span-1' : 'sm:col-span-2'}`}>
                <div>
                  <span className="block font-black text-slate-600 leading-none">More sports coming soon!</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-2 block">Basketball, Soccer, Football & more</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP NAV */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 overflow-hidden group-hover:scale-105 transition-transform">
            <Image src="/icon.png" alt="ChasedSports Icon" fill sizes="(max-width: 768px) 32px, 40px" className="object-contain" priority />
          </div>
          <span className="font-black text-slate-900 tracking-tight hidden sm:block text-xl">
            Chased<span className="text-blue-600">Sports</span>
          </span>
        </Link>
        
        <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl">
           <button onClick={() => setActiveTab('home')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'home' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}><BookOpen className="w-4 h-4"/> Home</button>
           <button onClick={() => setActiveTab('social')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'social' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}><ImageIcon className="w-4 h-4"/> Social Card</button>
           <button onClick={() => setActiveTab('rewards')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'rewards' ? 'bg-white shadow-sm text-fuchsia-600' : 'text-slate-500 hover:text-slate-800'}`}><Gift className="w-4 h-4"/> Rewards</button>
        </div>

        <button onClick={handleSignOut} className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
          Sign Out <LogOut className="w-4 h-4" />
        </button>
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* UNIVERSAL HERO PROFILE */}
      <div className="bg-slate-900 text-white pt-10 pb-20 md:pt-16 md:pb-32 px-5 md:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8 relative z-10">
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
            <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
              <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId={athleteProfile?.equipped_border} sizeClasses="w-24 h-24 md:w-32 md:h-32" />
            </div>
            <div className="text-center md:text-left flex-1">
              
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                  {athleteProfile?.first_name ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'Welcome, Athlete'}
                </h1>
                {streak > 0 && (
                  <button 
                    onClick={() => {
                      setActiveTab('rewards');
                      document.getElementById('dashboard-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-[10px] font-black tracking-widest uppercase shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer ${streakTheme.bg}`}
                  >
                    <Flame className={`w-3.5 h-3.5 mr-1.5 ${streakTheme.icon}`} />
                    <span className={streakTheme.text}>{streak} Day Login Streak</span>
                    <ChevronRight className={`w-3.5 h-3.5 ml-1 ${streakTheme.text} opacity-70`} />
                  </button>
                )}
              </div>

              <p className="text-base md:text-lg text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2 mb-6">
                <MapPin className="w-4 h-4 opacity-70" /> 
                {athleteProfile?.high_school || 'General Athlete Profile'} 
                {athleteProfile?.grad_year && ` • Class of ${athleteProfile.grad_year}`}
              </p>
              
              {activeSports.includes('track') ? (
                <Link href="/dashboard/track" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl transition-all shadow-md">
                   Enter Track Portal <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button onClick={() => setShowAddSportModal(true)} className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-50 font-black px-6 py-3 rounded-xl transition-all shadow-md">
                   <Plus className="w-4 h-4" /> Add Your Sport
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-4 md:-mt-16 relative z-20 space-y-6" id="dashboard-tabs">
        
        {/* MOBILE TAB SELECTOR */}
        <div className="sm:hidden flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-6">
           <button onClick={() => setActiveTab('home')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'home' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Homebase</button>
           <button onClick={() => setActiveTab('social')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'social' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}>Social</button>
           <button onClick={() => setActiveTab('rewards')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'rewards' ? 'bg-fuchsia-50 text-fuchsia-600' : 'text-slate-500 hover:text-slate-800'}`}>Rewards</button>
        </div>

        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* 🌟 PUBLIC ATHLETIC PORTFOLIO STATUS CARD 🌟 */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2rem] p-1 shadow-xl relative overflow-hidden mb-6">
              {athleteProfile?.trust_level > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500 rounded-[2rem] animate-[shimmerSlow_4s_linear_infinite] opacity-50" style={{ backgroundSize: '200% auto' }}></div>
              )}
              
              <div className="bg-slate-900 rounded-[1.8rem] p-6 md:p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left w-full md:w-auto">
                  <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId={athleteProfile?.equipped_border} sizeClasses="w-20 h-20 shrink-0" />
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                      <h2 className="text-2xl font-black text-white tracking-tight">
                        {athleteProfile?.first_name}'s Athletic Portfolio
                      </h2>
                      {athleteProfile?.trust_level > 0 ? (
                         <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                         <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                    </div>
                    
                    {athleteProfile?.trust_level > 0 ? (
                      <>
                        <p className="text-emerald-400/90 font-bold text-sm flex items-center justify-center sm:justify-start gap-1.5 mb-2">
                          <Globe className="w-4 h-4" /> Public & Indexed on National Database
                        </p>
                        <p className="text-slate-400 text-xs font-medium max-w-md mb-2">
                          Your portfolio is live! Note: New updates may take up to 24 hours to appear in global coach search results. Try searching Google for <strong className="text-white">"{athleteProfile?.first_name} {athleteProfile?.last_name} athletic portfolio"</strong>.
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-4 mt-4">
                          <div className="bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-700/50 flex items-center gap-3">
                            <Eye className="w-4 h-4 text-blue-400" />
                            <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Profile Views</p>
                               <p className="text-sm font-black text-white leading-none">{athleteProfile?.profile_views || 0}</p>
                            </div>
                          </div>
                          <div className="bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-700/50 flex items-center gap-3">
                            <Search className="w-4 h-4 text-fuchsia-400" />
                            <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Search Appearances</p>
                               <p className="text-sm font-black text-white leading-none">{athleteProfile?.search_appearances || 0}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-amber-400/90 font-bold text-sm flex items-center justify-center sm:justify-start gap-1.5 mb-2">
                          <Lock className="w-4 h-4" /> Unverified – Hidden from Coaches
                        </p>
                        <p className="text-slate-400 text-sm font-medium max-w-md">
                          You <strong className="text-white">must verify your profile</strong> to get it to show to the public as your official portfolio! Without verification, coaches cannot see your stats.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col w-full md:w-auto gap-3 shrink-0">
                  {athleteProfile?.trust_level > 0 ? (
                    <>
                      <Link 
                         href={`/athlete/${athleteProfile?.id}`} 
                         className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-6 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all hover:scale-105 flex items-center justify-center gap-2"
                      >
                         <Eye className="w-4 h-4" /> Preview Portfolio
                      </Link>
                      <Link 
                         href="/customize" 
                         className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2"
                      >
                         <Paintbrush className="w-4 h-4" /> Edit Design & Theme
                      </Link>
                      <button 
                         onClick={() => {
                           navigator.clipboard.writeText(`${window.location.origin}/athlete/${athleteProfile?.id}`);
                           showToast("Portfolio link copied to clipboard!", "success");
                         }}
                         className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-3 px-6 rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2"
                      >
                         <LinkIcon className="w-4 h-4" /> Copy Link
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                         href="/dashboard/track" 
                         className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-black py-3 px-6 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all hover:scale-105 flex items-center justify-center gap-2"
                      >
                         <ShieldCheck className="w-4 h-4" /> Verify Now
                      </Link>
                      <Link 
                         href={`/athlete/${athleteProfile?.id}`} 
                         className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2"
                      >
                         <Eye className="w-4 h-4" /> Preview Portfolio
                      </Link>
                      <Link 
                         href="/customize" 
                         className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2"
                      >
                         <Paintbrush className="w-4 h-4" /> Edit Design & Theme
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 🌟 NEW PORTFOLIO DETAILS EDITOR 🌟 */}
              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col h-full relative overflow-hidden z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center">
                      <FileText className="w-6 h-6 mr-3 text-emerald-500" /> Portfolio Details
                    </h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Add context to your public portfolio for college coaches.</p>
                  </div>
                  
                  <button 
                    onClick={handleSavePortfolio}
                    disabled={isSavingResume}
                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black px-5 py-2.5 rounded-xl text-sm transition-colors shadow-md disabled:opacity-50 shrink-0"
                  >
                    <Save className="w-4 h-4" /> {isSavingResume ? 'Saving...' : 'Save Portfolio'}
                  </button>
                </div>

                <div className="flex-1 flex flex-col gap-6">
                  
                  {/* GPA Field */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      <GraduationCap className="w-4 h-4 text-emerald-500" /> Unweighted GPA
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="5"
                      value={gpa} 
                      onChange={(e) => setGpa(e.target.value)}
                      placeholder="e.g., 3.85"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Accolades Field */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      <Medal className="w-4 h-4 text-emerald-500" /> Career Accolades
                    </label>
                    
                    <div className="space-y-2 mb-3">
                      {accolades.map((acc, i) => (
                        <div key={i} className="flex items-center justify-between bg-emerald-50 border border-emerald-100 text-emerald-900 px-4 py-2.5 rounded-xl text-sm font-bold">
                          <span className="truncate pr-4">{acc}</span>
                          <button onClick={() => removeAccolade(acc)} className="text-emerald-600 hover:text-red-500 shrink-0"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newAccolade} 
                        onChange={(e) => setNewAccolade(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addAccolade()}
                        placeholder="e.g., 2024 State Finalist"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                      <button 
                        onClick={addAccolade}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-xl flex items-center justify-center font-bold"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Preferences Field */}
                  <div className="flex-1 flex flex-col">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      <School className="w-4 h-4 text-emerald-500" /> School Preferences
                    </label>
                    <textarea 
                      value={schoolPrefs}
                      onChange={(e) => setSchoolPrefs(e.target.value)}
                      placeholder="What are you looking for in a college? (e.g., Preferred region, major, division, team culture)"
                      className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none min-h-[120px]"
                    />
                  </div>

                </div>
              </div>

              {/* RICH COLLEGE BOARD */}
              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                      <School className="w-5 h-5 mr-2 text-blue-600" /> Target Colleges
                    </h3>
                  </div>
                  <div className="bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg text-xs">
                    {savedColleges?.length || 0} Saved
                  </div>
                </div>

                <div className="relative mb-6">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-sm">
                     <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                     <input 
                       type="text" placeholder="Search for any college (e.g., Oregon)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full bg-transparent focus:outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400"
                     />
                  </div>
                  
                  {searchQuery.length >= 3 && searchResults.length > 0 && (
                     <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-64 overflow-y-auto">
                        {searchResults.map((uni: any) => {
                          const isAlreadySaved = savedColleges.some(c => c.college_id === uni.id);
                          return (
                            <div key={uni.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                <div className="flex items-center gap-4 flex-1 overflow-hidden pr-2">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                                      {uni.logo_url ? <img src={uni.logo_url} className="w-8 h-8 object-contain"/> : <School className="w-5 h-5 text-slate-400" />}
                                  </div>
                                  <div className="truncate">
                                      <p className="text-sm font-bold text-slate-900 truncate">{uni.name}</p>
                                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">{uni.division} • {uni.state}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleSaveCollegeDashboard(uni.id)} disabled={isAlreadySaved}
                                  className={`p-2.5 rounded-lg transition-colors border shrink-0 ${isAlreadySaved ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border-blue-200'}`}
                                >
                                  {isAlreadySaved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                                </button>
                            </div>
                          )
                        })}
                     </div>
                  )}
                </div>
                
                {savedColleges && savedColleges.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 flex-1 content-start">
                    {savedColleges.map((saved) => {
                      const college = saved.universities; 
                      if (!college) return null;
                      
                      const stats = getRealStats(college);
                      const isComparing = compareList.some(c => c.id === college.id);

                      return (
                        <div key={saved.id} className="group relative flex flex-col p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all">
                          <Link href={`/college/${college.id}?sport=${primarySportQuery}`} className="absolute inset-0 z-10" aria-label={`View ${college.name}`}></Link>
                          
                          <div className="flex items-start gap-4 mb-4 relative z-0">
                            <div className="w-12 h-12 bg-slate-50 rounded-full border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                              {college.logo_url ? <img src={college.logo_url} className="w-8 h-8 object-contain" /> : <School className="w-6 h-6 text-slate-400" />}
                            </div>
                            <div className="flex-1 truncate pt-1">
                              <h4 className="font-black text-base text-slate-900 truncate group-hover:text-blue-600 transition-colors">{college.name}</h4>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{college.division} • {college.state}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-4 relative z-0">
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Score</span>
                              <span className="font-black text-sm text-blue-600">{stats.matchScore > 0 ? stats.matchScore : '-'}</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tuition</span>
                              <span className="font-black text-sm text-slate-700">{stats.tuitionStr}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 relative z-20 mt-auto">
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(college); }}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border ${isComparing ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                              <Scale className="w-3.5 h-3.5" /> {isComparing ? 'Comparing' : 'Compare'}
                            </button>
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveCollegeDashboard(saved.id); }} 
                              className="px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                              title="Remove from board"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 border-dashed flex-1 flex flex-col items-center justify-center">
                    <School className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500 font-medium max-w-[200px] leading-relaxed">Search the database above to add colleges to your board.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* 🌟 SOCIAL CARD BUILDER TAB 🌟 */}
        {activeTab === 'social' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
             
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* BUILDER CONTROLS */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <ImageIcon className="w-6 h-6 text-emerald-500" />
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Social Graphic</h2>
                  </div>
                  <p className="text-slate-500 font-medium text-sm mb-6">Build a clean, branded recruiting graphic to post on Instagram or Twitter.</p>

                  <div className="space-y-6">
                    {/* Toggle PRs */}
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Include PRs (Max 4)</h4>
                      <div className="flex flex-col gap-2">
                        {athleteProfile?.prs && athleteProfile.prs.length > 0 ? (
                          athleteProfile.prs.map((pr: any, i: number) => (
                            <button 
                              key={i} 
                              onClick={() => handleTogglePR(pr.event)}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${selectedPRs.includes(pr.event) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                            >
                              <span className="font-bold text-sm text-slate-800">{pr.event} <span className="text-slate-400 font-medium ml-1">({pr.mark})</span></span>
                              {selectedPRs.includes(pr.event) ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-slate-300" />}
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 font-medium italic">No PRs synced yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Toggle Accolades */}
                    {accolades.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Include Accolades (Max 3)</h4>
                        <div className="flex flex-col gap-2">
                          {accolades.map((acc, i) => (
                            <button 
                              key={i} 
                              onClick={() => handleToggleAccolade(acc)}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${selectedAccolades.includes(acc) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                            >
                              <span className="font-bold text-sm text-slate-800 truncate pr-4">{acc}</span>
                              {selectedAccolades.includes(acc) ? <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Toggle GPA */}
                    {gpa && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Academics</h4>
                        <button 
                          onClick={() => setIncludeGPA(!includeGPA)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${includeGPA ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                        >
                          <span className="font-bold text-sm text-slate-800">Show GPA ({gpa})</span>
                          {includeGPA ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-slate-300" />}
                        </button>
                      </div>
                    )}

                    <button 
                      onClick={handleDownloadSocialCard}
                      disabled={isExportingCard || (selectedPRs.length === 0 && selectedAccolades.length === 0 && !includeGPA)}
                      className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                    >
                      {isExportingCard ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" /> Download High-Res PNG</>}
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD PREVIEW RENDER */}
              <div className="lg:col-span-7 flex justify-center items-start">
                <div className="sticky top-24 w-full flex justify-center">
                  
                  {/* The actual HTML card to be captured */}
                  <div 
                    id="social-card-export" 
                    className="relative w-full max-w-[400px] aspect-[4/5] bg-slate-900 rounded-3xl p-8 flex flex-col justify-between overflow-hidden shadow-2xl border border-slate-700/50"
                  >
                    {/* Background styling for that super clean, premium aesthetic */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none z-0"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none z-0"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none z-0"></div>

                    {/* Header */}
                    <div className="flex items-center gap-5 z-10">
                      <div className="shrink-0 bg-slate-800 p-1 rounded-full border border-slate-700 shadow-xl">
                        <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId="none" sizeClasses="w-20 h-20" />
                      </div>
                      <div>
                         <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none mb-1 drop-shadow-md">
                           {athleteProfile?.first_name} <br/>{athleteProfile?.last_name}
                         </h2>
                         <p className="font-bold text-slate-400 text-sm">
                           {athleteProfile?.high_school} {athleteProfile?.grad_year && `• Class of ${athleteProfile.grad_year}`}
                         </p>
                      </div>
                    </div>

                    {/* PRs Section */}
                    {selectedPRs.length > 0 && (
                      <div className="z-10 mt-8">
                         <h3 className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-4 border-b border-slate-800 pb-2">Official Verified Marks</h3>
                         <div className="flex flex-col gap-3">
                            {athleteProfile.prs.filter((pr: any) => selectedPRs.includes(pr.event)).map((pr: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-end">
                                    <span className="text-lg font-black text-slate-200">{pr.event}</span>
                                    <span className="text-2xl font-black text-white">{pr.mark}</span>
                                </div>
                            ))}
                         </div>
                      </div>
                    )}

                    {/* Footer: Italicized Accolades & Branding */}
                    <div className="z-10 mt-auto flex justify-between items-end pt-8">
                        <div className="flex-1 pr-6 border-l-2 border-emerald-500 pl-4 py-1">
                           <ul className="flex flex-col gap-2">
                              {selectedAccolades.map((acc, idx) => (
                                  <li key={idx} className="text-sm font-bold italic text-slate-300 leading-snug">"{acc}"</li>
                              ))}
                              {includeGPA && gpa && <li className="text-sm font-bold italic text-emerald-400 mt-1">Unweighted GPA: {gpa}</li>}
                           </ul>
                        </div>

                        {/* ChasedSports Watermark */}
                        <div className="text-right shrink-0">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Verified Profile</p>
                            <p className="text-lg font-black tracking-tighter text-white">Chased<span className="text-blue-500">Sports</span></p>
                        </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* 🚨 REWARDS TAB VIEW 🚨 */}
        {activeTab === 'rewards' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* 🚨 NEW STREAK REWARDS PATH 🚨 */}
            <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 shadow-xl border border-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none"></div>

              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 relative z-10">
                <div>
                  <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <Flame className="w-8 h-8 text-fuchsia-500" /> The Streak Path
                  </h3>
                  <p className="text-slate-400 font-medium text-lg mt-1">Log in daily to escalate your rewards. Don't break the chain.</p>
                </div>
                <div className="bg-slate-950 px-6 py-3 rounded-xl border border-slate-800 flex items-center gap-4 shadow-inner">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Streak</span>
                  <span className="text-3xl font-black text-fuchsia-400">{streak}</span>
                </div>
              </div>

              {/* 7-Day Track */}
              <div className="relative z-10 mb-8">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-center md:text-left">
                  Week {Math.floor(streak / 7) + 1} Progress
                </p>
                <div className="flex md:justify-center overflow-x-auto py-6 px-4 gap-4 hide-scrollbar snap-x">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const currentWeek = Math.floor(streak / 7);
                    const absoluteDay = (currentWeek * 7) + day;
                    
                    const isClaimed = absoluteDay <= streak;
                    const isNext = absoluteDay === streak + 1;
                    const isMilestone = day === 7;
                    const isMidWeekDrop = day === 4;
                    const boostRewardCount = currentWeek + 1;
                    
                    let cashReward = 10;
                    let boostReward = 0;
                    
                    if (isMidWeekDrop) {
                       cashReward = 100 + (currentWeek * 20);
                       boostReward += 1;
                    }
                    if (isMilestone) {
                       boostReward += boostRewardCount;
                    }

                    return (
                      <div key={day} className={`shrink-0 w-36 snap-start rounded-2xl p-5 flex flex-col items-center justify-center text-center border-2 transition-all ${
                        isClaimed ? 'bg-slate-800/50 border-slate-700 opacity-50' :
                        isNext ? 'bg-slate-800 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.2)] scale-105' :
                        isMilestone ? 'bg-gradient-to-b from-slate-800 to-indigo-900 border-indigo-500' :
                        isMidWeekDrop ? 'bg-gradient-to-b from-slate-800 to-emerald-900/40 border-emerald-500/50' :
                        'bg-slate-900 border-slate-800'
                      }`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isNext ? 'text-fuchsia-400' : 'text-slate-500'}`}>
                          Day {absoluteDay}
                        </span>

                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                          isClaimed ? 'bg-slate-800 text-slate-600' :
                          isMilestone ? 'bg-indigo-500/20 text-indigo-400' :
                          isMidWeekDrop ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {isClaimed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                           isMilestone ? <Rocket className="w-6 h-6" /> :
                           isMidWeekDrop ? <Calendar className="w-5 h-5" /> :
                           <DollarSign className="w-5 h-5 text-emerald-400" />}
                        </div>

                        <div className="flex flex-col gap-1 items-center">
                           {cashReward > 0 && (
                             <span className={`font-bold text-xs ${isMidWeekDrop && !isClaimed ? 'text-emerald-400' : 'text-white'}`}>
                               +{cashReward} Cash
                             </span>
                           )}
                           {boostReward > 0 && (
                             <span className={`font-bold text-xs ${(isMilestone || isMidWeekDrop) && !isClaimed ? 'text-indigo-400' : 'text-white'}`}>
                               +{boostReward} Boost{boostReward > 1 ? 's' : ''}
                             </span>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* REFERRAL PROGRAM WITH MILESTONES */}
            <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
              
              <div className="flex flex-col relative z-10 h-full">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight mb-3 flex items-center gap-3">
                    <Users className="w-6 h-6 text-emerald-400" /> Invite & Earn
                  </h3>
                  <p className="text-slate-300 font-medium text-sm mb-6 leading-relaxed">
                    Get <strong className="text-amber-400">1 Free Boost</strong> for every single teammate that uses your unique code. Reach 5 invites to unlock the exclusive Plasma Border!
                  </p>
                  
                  {!myReferralCode ? (
                    <div className="bg-slate-800 border border-slate-700 text-slate-400 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" /> Sync your Athletic.net profile to generate your unique invite code!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="bg-slate-950 px-6 py-4 rounded-xl border border-emerald-500/30 flex items-center justify-between shadow-inner">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Your Code:</span>
                        <span className="text-2xl font-mono font-black tracking-widest text-emerald-400">{myReferralCode}</span>
                      </div>
                      <button 
                        onClick={() => handleShareCode(myReferralCode)}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3.5 rounded-xl font-black transition-colors flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-4 h-4" /> Share Code
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-8 border-t border-slate-800">
                  <div className="flex items-end justify-between mb-8">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-400"/> Invites
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        You have <strong className="text-white">{currentRefs}</strong> verified invites.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Next Mega Bonus</span>
                      <span className="text-sm font-black text-amber-400">{base + 5} Invites</span>
                    </div>
                  </div>

                  {/* Visual Track */}
                  <div className="relative w-full h-3 bg-slate-950 rounded-full border border-slate-800 shadow-inner mb-6 mx-auto max-w-[95%]">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 rounded-full transition-all duration-1000" 
                      style={{ width: `${progressPct}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                    </div>

                    {milestones.map((m, i) => {
                      const posPct = ((m.count - base) / 5) * 100;
                      const isAchieved = currentRefs >= m.count;
                      const Icon = m.icon;
                      
                      return (
                        <div key={i} className="absolute top-1/2 flex flex-col items-center" style={{ left: `${posPct}%`, transform: 'translate(-50%, -50%)' }}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 z-10 transition-colors duration-500 ${isAchieved ? m.bg : 'bg-slate-800'} ${m.isMajor ? 'w-8 h-8 shadow-[0_0_15px_rgba(245,158,11,0.5)] border-4' : ''}`}>
                            {isAchieved ? <CheckCircle2 className="w-3 h-3 text-white" /> : <Icon className={`w-3 h-3 ${m.isMajor ? 'text-amber-400' : 'text-slate-500'}`} />}
                          </div>

                          <div className="absolute top-8 text-center w-20">
                            <span className={`block text-[9px] font-black mb-0.5 ${isAchieved ? m.color : 'text-slate-500'}`}>{m.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}