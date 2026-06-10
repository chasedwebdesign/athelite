'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, Search, ChevronRight, Users, ChevronDown, ChevronUp, 
  Bookmark, RefreshCw, UserCircle2, School, ShieldCheck, Check, Trash2, 
  FileText, Save, ArrowRight, Plus, X, Globe, CheckCircle2, Flame,
  Rocket, Crown, Gift, Paintbrush, Share2, AlertCircle, Lock, Link as LinkIcon, ImageIcon, 
  Download, CheckSquare, Square, Mail, Sparkles, Smartphone, Edit3, Scale
} from 'lucide-react';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

// Import our new centralized Registry & Constants
import SportEditorRegistry from '@/components/dashboard/sports/SportEditorRegistry';
import { 
  SPORT_CONFIGS_META, ALL_SPORTS, SUGGESTED_MAJORS, US_STATES, 
  evaluateMetric, getOverallTier, getRealStats 
} from '@/utils/constants/RecruitingStandards';

export default function DashboardHomebase() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athleteProfile, setAthleteProfile] = useState<any>(null);
  const [streak, setStreak] = useState(0); 
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '', last_name: '', high_school: '', state: '', conference: '', gender: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [savedColleges, setSavedColleges] = useState<any[]>([]);
  
  const [isSportsMenuOpen, setIsSportsMenuOpen] = useState(false);
  const [isCollegesOpen, setIsCollegesOpen] = useState(false);
  const sportsMenuRef = useRef<HTMLDivElement>(null);

  const [gpa, setGpa] = useState('');
  const [intendedMajor, setIntendedMajor] = useState('');
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const majorDropdownRef = useRef<HTMLDivElement>(null);

  const [accolades, setAccolades] = useState<string[]>([]);
  const [newAccolade, setNewAccolade] = useState('');
  const [schoolPrefs, setSchoolPrefs] = useState('');

  const [sportStats, setSportStats] = useState<Record<string, any>>({});

  const [selectedPRs, setSelectedPRs] = useState<string[]>([]);
  const [selectedAccolades, setSelectedAccolades] = useState<string[]>([]);
  const [includeGPA, setIncludeGPA] = useState(true);
  const [includeMajor, setIncludeMajor] = useState(true);
  const [isExportingCard, setIsExportingCard] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'social' | 'rewards'>('home');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const goToTab = (tab: 'home' | 'social' | 'rewards') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (majorDropdownRef.current && !majorDropdownRef.current.contains(event.target as Node)) setShowMajorDropdown(false);
      if (sportsMenuRef.current && !sportsMenuRef.current.contains(event.target as Node)) setIsSportsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadHomebase() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: coachData } = await supabase.from('coaches').select('id').eq('id', session.user.id).maybeSingle();
      if (coachData) { router.push('/dashboard/coach'); return; }

      const { data: athleteData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();
      if (athleteData) {
        
        let loadedAccolades: string[] = [];
        let parsedResume: any = {};
        if (athleteData.saved_resume) {
          try {
            parsedResume = typeof athleteData.saved_resume === 'string' ? JSON.parse(athleteData.saved_resume) : athleteData.saved_resume;
            setGpa(parsedResume.gpa || '');
            setIntendedMajor(parsedResume.intendedMajor || '');
            loadedAccolades = parsedResume.accolades || [];
            setAccolades(loadedAccolades);
            setSchoolPrefs(parsedResume.schoolPrefs || '');
          } catch (e) {
            setSchoolPrefs(athleteData.saved_resume as string);
          }
        }

        setProfileForm({
          first_name: athleteData.first_name || '',
          last_name: athleteData.last_name || '',
          high_school: athleteData.high_school || '',
          state: athleteData.state || '',
          conference: parsedResume.conference || '',
          gender: athleteData.gender || ''
        });

        if (!athleteData.first_name || !athleteData.high_school || !athleteData.state || !athleteData.gender) {
          setIsProfileModalOpen(true);
        }

        let { data: relationalSports, error: fetchErr } = await supabase
          .from('athlete_sports')
          .select('*')
          .eq('athlete_id', athleteData.id)
          .eq('is_active', true);

        if (fetchErr && (fetchErr.code === '42703' || fetchErr.message?.includes('is_active'))) {
           const fallback = await supabase.from('athlete_sports').select('*').eq('athlete_id', athleteData.id);
           relationalSports = fallback.data;
           fetchErr = fallback.error;
        }

        if (!fetchErr && relationalSports) {
          const mappedSportStats: any = {};
          const activeSportsFromDB: string[] = [];

          relationalSports.forEach(row => {
            activeSportsFromDB.push(row.sport_name);
            let parsedMetrics = [];
            let parsedMetaContext = {};
            try { parsedMetrics = Array.isArray(row.metrics) ? row.metrics : JSON.parse(row.metrics); } catch (e) {}
            try { parsedMetaContext = row.meta_context ? (typeof row.meta_context === 'string' ? JSON.parse(row.meta_context) : row.meta_context) : {}; } catch (e) {}
            
            mappedSportStats[row.sport_name] = {
              position: row.position || '',
              level: row.level_of_play || '',
              metrics: parsedMetrics || [],
              calculatedRating: row.custom_fit_score || 0,
              metaContext: parsedMetaContext
            };
          });

          setSportStats(mappedSportStats);
          
          if (activeSportsFromDB.length > 0) {
            athleteData.sports = activeSportsFromDB;
          }
        }

        const finalSportsList = athleteData.sports || [];

        finalSportsList.forEach((sport: string) => {
          if (!sportStats[sport]) {
            setSportStats(prev => ({
              ...prev,
              [sport]: { position: '', level: '', metrics: [], calculatedRating: 0, metaContext: {} }
            }));
          }
        });

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

        setAthleteProfile(athleteData);
      }

      const { data: savedCollegesData } = await supabase.from('saved_colleges').select(`id, college_id, universities (*)`).eq('athlete_id', session.user.id);
      if (savedCollegesData) {
        setSavedColleges(savedCollegesData);
        if (savedCollegesData.length > 0) setIsCollegesOpen(true); 
      }

      setLoading(false);
    }
    loadHomebase();
  }, [supabase, router]);

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

  const handleSaveProfile = async () => {
    if (!profileForm.first_name || !profileForm.last_name || !profileForm.high_school || !profileForm.state || !profileForm.gender) {
      showToast("Please fill out all required fields to continue.", "error");
      return;
    }
    
    try {
      await supabase.from('athletes').update({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        high_school: profileForm.high_school,
        state: profileForm.state,
        gender: profileForm.gender
      }).eq('id', athleteProfile.id);
      
      let currentResume = typeof athleteProfile.saved_resume === 'string' ? JSON.parse(athleteProfile.saved_resume) : (athleteProfile.saved_resume || {});
      currentResume.conference = profileForm.conference;
      await supabase.from('athletes').update({ saved_resume: currentResume }).eq('id', athleteProfile.id);

      setAthleteProfile({ 
        ...athleteProfile, 
        first_name: profileForm.first_name, 
        last_name: profileForm.last_name,
        high_school: profileForm.high_school,
        state: profileForm.state,
        gender: profileForm.gender,
        saved_resume: currentResume
      });
      
      setIsProfileModalOpen(false);
      showToast("Profile identity secured. Welcome to Homebase.", "success");
    } catch (err) {
      showToast("Failed to save profile.", "error");
    }
  };

  const syncSportToSupabase = async (sport: string, updatedData: any) => {
    if (!athleteProfile?.id) return;
    
    const genderKey = athleteProfile?.gender === 'Girls' || athleteProfile?.gender === 'Women' ? 'Girls' : 'Boys';
    const spec = SPORT_CONFIGS_META[sport];
    let rating = 0;
    
    // Evaluate metrics for generic fallback sports
    if (!['Cross Country', 'Swimming & Diving', 'Football', 'Soccer', 'Lacrosse', 'Field Hockey', 'Basketball', 'Volleyball', 'Wrestling'].includes(sport) && spec) {
        let baseRankScore = 45;
        if (spec.requiresLevel) {
          if (updatedData.level === 'JV / Dev Squad') baseRankScore = 40;
          else if (updatedData.level === 'Varsity Contributor') baseRankScore = 60;
          else if (updatedData.level === 'Varsity Starter') baseRankScore = 70;
          else if (updatedData.level === 'All-Conference Tier') baseRankScore = 80;
          else if (updatedData.level === 'All-State / National') baseRankScore = 90;
          else if (updatedData.level === 'Elite Club (ECNL / AAU / Next)') baseRankScore = 85;
          else baseRankScore = 50;
        } else {
          baseRankScore = 60;
        }

        let highestMetricScore = 0;
        let totalMetricScore = 0;
        let validMetricCount = 0;

        if (updatedData.metrics && updatedData.metrics.length > 0) {
          updatedData.metrics.forEach((m: {name: string, value: string}) => {
             const evalResult = evaluateMetric(genderKey, sport, m.name, m.value, updatedData.level);
             if (evalResult) {
               validMetricCount++;
               totalMetricScore += evalResult.score;
               if (evalResult.score > highestMetricScore) highestMetricScore = evalResult.score;
             }
          });
        }

        if (spec.requiresLevel) {
           if (validMetricCount > 0) {
              const avgMetricScore = totalMetricScore / validMetricCount;
              const statPower = (avgMetricScore * 0.4) + (highestMetricScore * 0.6);
              rating = Math.round((baseRankScore * 0.4) + (statPower * 0.6));
           } else {
              rating = Math.max(15, baseRankScore - 35);
           }
        } else {
           rating = validMetricCount > 0 ? highestMetricScore : 0;
        }
        updatedData.calculatedRating = Math.min(99, Math.max(10, rating));
    }
    
    setSportStats(prev => ({ ...prev, [sport]: updatedData }));

    let payload: any = {
      athlete_id: athleteProfile.id,
      sport_name: sport,
      position: updatedData.position || null,
      level_of_play: updatedData.level || null,
      athleticism_tier: null,
      metrics: updatedData.metrics || [],
      custom_fit_score: updatedData.calculatedRating,
      meta_context: updatedData.metaContext || {},
      is_active: true
    };

    let { error } = await supabase.from('athlete_sports').upsert(payload, { onConflict: 'athlete_id, sport_name' });

    if (error && error.message.includes('is_active')) {
      delete payload.is_active;
      const fallback = await supabase.from('athlete_sports').upsert(payload, { onConflict: 'athlete_id, sport_name' });
      error = fallback.error;
    }

    if (error) console.error("Supabase Sync Error: ", error.message);
  };

  const handleToggleSport = async (sportName: string) => {
    if (!athleteProfile?.id) return;
    try {
      const currentSports = athleteProfile.sports || [];
      let newSports;
      
      if (currentSports.includes(sportName)) {
        newSports = currentSports.filter((s: string) => s !== sportName);
        let payload: any = { athlete_id: athleteProfile.id, sport_name: sportName, is_active: false };
        let { error } = await supabase.from('athlete_sports').upsert(payload, { onConflict: 'athlete_id, sport_name' });
        
        if (error && error.message.includes('is_active')) {
          delete payload.is_active; 
          await supabase.from('athlete_sports').delete().eq('athlete_id', athleteProfile.id).eq('sport_name', sportName);
        }
      } else {
        newSports = [...currentSports, sportName];
        const blankStats = { position: '', level: '', metrics: [], metaContext: {} };
        if (!sportStats[sportName]) setSportStats(prev => ({ ...prev, [sportName]: blankStats }));
        await syncSportToSupabase(sportName, blankStats);
      }

      setAthleteProfile({ ...athleteProfile, sports: newSports });
      supabase.from('athletes').update({ sports: newSports }).eq('id', athleteProfile.id).then();
      showToast(`${sportName} array alignment updated.`, 'success');
    } catch (err) {
      showToast("Failed to update sports alignment", "error");
    }
  };

  const handleRemoveCollegeDashboard = async (savedId: string) => {
    try {
      await supabase.from('saved_colleges').delete().eq('id', savedId);
      setSavedColleges(prev => prev.filter(c => c.id !== savedId));
      showToast("College removed.", "success");
    } catch (err) { console.error(err); }
  };

  const autoSavePortfolio = async (overrides?: Partial<{ gpa: string, intendedMajor: string, accolades: string[], schoolPrefs: string }>) => {
    if (!athleteProfile?.id) return;
    try {
      let currentResume = typeof athleteProfile.saved_resume === 'string' ? JSON.parse(athleteProfile.saved_resume) : (athleteProfile.saved_resume || {});
      const { sportStats: legacyStats, ...cleanResume } = currentResume;
      
      const payload = {
        ...cleanResume,
        gpa: overrides?.gpa ?? gpa, 
        intendedMajor: overrides?.intendedMajor ?? intendedMajor, 
        accolades: overrides?.accolades ?? accolades, 
        schoolPrefs: overrides?.schoolPrefs ?? schoolPrefs
      };

      await supabase.from('athletes').update({ saved_resume: payload }).eq('id', athleteProfile.id);
      setAthleteProfile((prev: any) => ({ ...prev, saved_resume: payload }));
    } catch (err) { 
      console.error(err); 
    }
  };

  const addAccolade = () => {
    if (newAccolade.trim().length > 0 && !accolades.includes(newAccolade.trim())) {
      const newAccs = [...accolades, newAccolade.trim()];
      setAccolades(newAccs);
      setNewAccolade('');
      if (selectedAccolades.length < 3) setSelectedAccolades([...selectedAccolades, newAccolade.trim()]);
      autoSavePortfolio({ accolades: newAccs });
    }
  };

  const removeAccolade = (acc: string) => {
    const newAccs = accolades.filter(a => a !== acc);
    setAccolades(newAccs);
    setSelectedAccolades(selectedAccolades.filter(a => a !== acc));
    autoSavePortfolio({ accolades: newAccs });
  };

  const handleDownloadSocialCard = async () => {
    setIsExportingCard(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('social-card-export');
      if (!element) throw new Error("Card element not found.");
      
      const canvas = await html2canvas(element, { backgroundColor: null, scale: 3, useCORS: true });
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
    if (selectedPRs.includes(event)) setSelectedPRs(selectedPRs.filter(e => e !== event));
    else {
      if (selectedPRs.length >= 4) return showToast("Max 4 PRs on the graphic.", "error");
      setSelectedPRs([...selectedPRs, event]);
    }
  };

  const handleToggleAccolade = (acc: string) => {
    if (selectedAccolades.includes(acc)) setSelectedAccolades(selectedAccolades.filter(a => a !== acc));
    else {
      if (selectedAccolades.length >= 3) return showToast("Max 3 Accolades on the graphic.", "error");
      setSelectedAccolades([...selectedAccolades, acc]);
    }
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

  const userSports = athleteProfile?.sports || [];
  const primarySportQuery = userSports.length > 0 ? userSports[0] : 'general';
  const genderKey = athleteProfile?.gender === 'Girls' || athleteProfile?.gender === 'Women' ? 'Girls' : 'Boys';


  const RenderHomeTab = useMemo(() => {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/email-builder" className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-[2rem] p-6 sm:p-8 shadow-md border border-blue-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[40px] rounded-full pointer-events-none"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <Mail className="w-6 h-6 text-blue-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl font-black text-white mb-1">Email Studio</h3>
            <p className="text-blue-100/70 text-sm font-medium">Auto-generate customized templates using sport-specific metrics.</p>
          </Link>

          <div onClick={() => goToTab('social')} className="bg-gradient-to-br from-emerald-900 to-teal-950 rounded-[2rem] p-6 sm:p-8 shadow-md border border-emerald-800 relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[40px] rounded-full pointer-events-none"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                <ImageIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl font-black text-white mb-1">Portfolio & Fine-Tuning</h3>
            <p className="text-emerald-100/70 text-sm font-medium">Manage your public website and build custom social graphics.</p>
          </div>
        </div>

        {userSports.includes('Track & Field') && (
          <div className="bg-gradient-to-br from-indigo-900 to-blue-950 rounded-[2rem] p-6 md:p-8 shadow-xl border border-indigo-800 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
             <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-blue-400"/> Track & Field Extensions Unlocked
             </h2>
             <p className="text-indigo-200 mb-6 font-medium text-sm">Deterministic tracking tools active for your verified race marks.</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/track" className="bg-white/10 hover:bg-white/20 border border-white/10 p-6 rounded-2xl transition-all shadow-sm">
                   <h3 className="text-lg font-bold text-white mb-1">Track Portal</h3>
                   <p className="text-sm text-indigo-200">Synchronize official Athletic.net entries to claim profile verification status.</p>
                </Link>
                <Link href="/dashboard/email-builder" className="bg-white/10 hover:bg-white/20 border border-white/10 p-6 rounded-2xl transition-all shadow-sm">
                   <h3 className="text-lg font-bold text-white mb-1">Email Template Builder</h3>
                   <p className="text-sm text-indigo-200">Inject verified segment times cleanly into college coaching introduction templates.</p>
                </Link>
             </div>
          </div>
        )}

        {/* 🚨 DYNAMIC SPORT REGISTRY 🚨 */}
        {userSports.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {userSports.map((sport: string) => {
              const config = SPORT_CONFIGS_META[sport];
              if (!config) return null;
              
              return (
                <SportEditorRegistry 
                  key={sport}
                  sport={sport}
                  sportStats={sportStats[sport] || { metrics: [], metaContext: {} }}
                  genderKey={genderKey}
                  athleteProfile={athleteProfile}
                  config={config}
                  onSync={(updatedData) => syncSportToSupabase(sport, updatedData)}
                  showToast={showToast}
                />
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
           <button 
             onClick={() => setIsCollegesOpen(!isCollegesOpen)} 
             className="w-full flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 bg-white hover:bg-slate-50 transition-colors gap-4"
           >
              <div className="flex items-center gap-4 text-left">
                 <div className="w-14 h-14 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                    <Bookmark className="w-6 h-6 text-blue-600 fill-blue-600" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Target Colleges Board</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">{savedColleges.length} programs loaded in tracked database metrics</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 self-end md:self-auto">
                {isCollegesOpen ? <ChevronUp className="w-6 h-6 text-slate-400 shrink-0" /> : <ChevronDown className="w-6 h-6 text-slate-400 shrink-0" />}
              </div>
           </button>

           {isCollegesOpen && (
              <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 animate-in fade-in slide-in-from-top-4 duration-300">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                      <Scale className="w-5 h-5 text-blue-500" /> College Comparison Board
                    </h3>
                    <Link href="/search" className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 justify-center">
                       Find More Colleges <Search className="w-4 h-4" />
                    </Link>
                 </div>

                 {savedColleges.length > 0 ? (
                   <div className="overflow-x-auto custom-scrollbar pb-4">
                     <table className="w-full text-left min-w-[900px]">
                       <thead>
                         <tr className="border-b-2 border-slate-200">
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Program</th>
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Athletic Match</th>
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Net Tuition / Yr</th>
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">10-Yr Salary</th>
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Acceptance</th>
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Size</th>
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500 text-center">Action</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {savedColleges.map((saved: any) => {
                            const college = saved.universities; 
                            if (!college) return null;
                            const stats = getRealStats(college);

                            return (
                              <tr key={saved.id} className="bg-white hover:bg-blue-50/50 transition-colors group">
                                <td className="p-4 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden">
                                    {college.logo_url ? <img src={college.logo_url} className="w-6 h-6 object-contain" /> : <School className="w-5 h-5 text-slate-400" />}
                                  </div>
                                  <div className="truncate max-w-[200px]">
                                    <Link href={`/college/${college.id}?sport=${primarySportQuery}`} className="font-black text-slate-900 hover:text-blue-600 transition-colors block truncate">{college.name}</Link>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{college.division} • {college.state}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">{stats.matchScore > 0 ? stats.matchScore : '-'}</span>
                                </td>
                                <td className="p-4 font-black text-slate-700">{stats.tuitionStr}</td>
                                <td className="p-4 font-black text-emerald-600">{stats.salaryStr}</td>
                                <td className="p-4 font-bold text-slate-600">{stats.gradRateStr}</td>
                                <td className="p-4 font-bold text-slate-600">{stats.popStr}</td>
                                <td className="p-4 text-center">
                                  <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveCollegeDashboard(saved.id); }} 
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors inline-block"
                                    title="Remove from board"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            )
                         })}
                       </tbody>
                     </table>
                   </div>
                 ) : (
                   <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center">
                      <School className="w-12 h-12 text-slate-300 mb-4" />
                      <h4 className="text-lg font-black text-slate-900 mb-1">Your board is empty</h4>
                      <p className="text-sm text-slate-500 font-medium max-w-sm leading-relaxed mb-6">Head over to the Matchmaker to search the database and add colleges to compare.</p>
                      <Link href="/search" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-md">
                         Open College Finder
                      </Link>
                   </div>
                 )}
              </div>
           )}
        </div>
      </div>
    )
  }, [userSports, sportStats, savedColleges, isCollegesOpen, athleteProfile]);

  const RenderSocialTab = useMemo(() => {
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           <div className="lg:col-span-7 space-y-6">
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden z-20 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="flex items-center gap-4 mb-5 relative z-10">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl border border-blue-500/30 flex items-center justify-center shrink-0">
                    {athleteProfile?.trust_level > 0 ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Lock className="w-6 h-6 text-amber-500" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">{athleteProfile?.trust_level > 0 ? "Portfolio Live" : "Portfolio Unverified"}</h3>
                    <p className="text-xs font-medium text-slate-400">{athleteProfile?.trust_level > 0 ? "Coaches can search and view your profile." : "Sync a sport to verify and go public."}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 relative z-10">
                  <Link 
                     href="/customize" 
                     className="bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                  >
                     <Paintbrush className="w-4 h-4" /> Edit Theme & Design
                  </Link>
                  {athleteProfile?.trust_level > 0 && (
                    <button 
                       onClick={() => {
                         navigator.clipboard.writeText(`${window.location.origin}/athlete/${athleteProfile?.id}`);
                         showToast("Portfolio link copied to clipboard!", "success");
                       }}
                       className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                       <LinkIcon className="w-4 h-4" /> Copy Link
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-6 border-b border-slate-100 gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 flex items-center">
                        <FileText className="w-6 h-6 mr-3 text-blue-500" /> Public Resume Details
                      </h2>
                      <p className="text-slate-500 font-medium text-sm mt-1">Fine-tune academics and honors for your public profile.</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div>
                          <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Unweighted GPA Scale</label>
                          <input 
                            type="number" step="0.01" min="0" max="5" 
                            value={gpa} 
                            onChange={(e) => setGpa(e.target.value)} 
                            onBlur={() => autoSavePortfolio()}
                            placeholder="e.g. 3.95" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                       </div>
                       <div className="relative" ref={majorDropdownRef}>
                          <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Intended Major Category</label>
                          <input 
                            type="text" 
                            value={intendedMajor} 
                            onFocus={() => setShowMajorDropdown(true)} 
                            onChange={(e) => { 
                              setIntendedMajor(e.target.value); 
                              setShowMajorDropdown(true); 
                            }} 
                            onBlur={() => autoSavePortfolio()}
                            placeholder="Search categories..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {showMajorDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto custom-scrollbar p-1">
                              {SUGGESTED_MAJORS.filter(m => m.toLowerCase().includes(intendedMajor.toLowerCase())).map((m: string, idx: number) => (
                                <button 
                                  key={idx} type="button" 
                                  onClick={() => { 
                                    setIntendedMajor(m); 
                                    setShowMajorDropdown(false);
                                    autoSavePortfolio(); 
                                  }} 
                                  className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          )}
                       </div>
                    </div>

                    <div>
                       <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Platform Honors / Accolades</label>
                       <div className="space-y-2 mb-3">
                          {accolades.map((acc: string, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-blue-50 border border-blue-100 text-blue-950 px-4 py-2.5 rounded-xl text-sm font-bold">
                              <span className="truncate">{acc}</span>
                              <button onClick={() => removeAccolade(acc)} className="text-blue-500 hover:text-red-500 shrink-0"><X className="w-4 h-4"/></button>
                            </div>
                          ))}
                       </div>
                       <div className="flex gap-2">
                         <input 
                           type="text" 
                           value={newAccolade} 
                           onChange={(e) => setNewAccolade(e.target.value)} 
                           onKeyDown={(e) => { if (e.key === 'Enter') addAccolade(); }} 
                           placeholder="Add accolade (e.g. Regional Champion)" 
                           className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                         />
                         <button onClick={() => addAccolade()} className="bg-slate-950 hover:bg-slate-800 text-white px-4 rounded-xl font-bold transition-colors shrink-0">
                           <Plus className="w-5 h-5"/>
                         </button>
                       </div>
                    </div>

                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">School Culture Preferences</label>
                      <textarea 
                        value={schoolPrefs} 
                        onChange={(e) => setSchoolPrefs(e.target.value)} 
                        onBlur={() => autoSavePortfolio()}
                        placeholder="Define target program cultures or regional limits for coach searches..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                      />
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-5 flex justify-center items-start lg:sticky lg:top-36 max-h-[calc(100vh-10rem)] overflow-y-auto hide-scrollbar pb-6 px-2">
              <div className="w-full max-w-[340px] mx-auto bg-slate-950 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-800 relative aspect-[9/19] flex flex-col shrink-0">
                 <div className="absolute top-0 inset-x-0 h-5 bg-slate-950 rounded-b-xl w-28 mx-auto z-10 flex items-center justify-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                   <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                 </div>
                 <div className="flex-1 bg-white rounded-[2.2rem] overflow-hidden relative shadow-inner">
                    <iframe 
                      src={`/athlete/${athleteProfile?.id || ''}`}
                      className="absolute inset-0 w-full h-full border-0 pointer-events-none custom-scrollbar"
                      title="Dynamic Device Portfolio Preview"
                    />
                 </div>
                 <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                    <Smartphone className="w-3 h-3"/> Active Live Synchronization
                 </div>
              </div>
           </div>
        </div>

        <hr className="border-slate-200"/>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           <div className="lg:col-span-5">
              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-2">
                    <ImageIcon className="w-5 h-5 text-emerald-500" /> Export Parameter Matrix
                 </h3>
                 <p className="text-slate-500 font-medium text-xs mb-6">Allocate elements to display inside the compiled high-res layout output.</p>

                 <div className="space-y-6">
                    <div>
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Display Metrics (Max 4)</h4>
                       <div className="flex flex-col gap-1.5">
                         {athleteProfile?.prs?.map((pr: any, i: number) => (
                           <button key={i} onClick={() => handleTogglePR(pr.event)} className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selectedPRs.includes(pr.event) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                              <span className="text-xs font-bold text-slate-800">{pr.event} <span className="text-slate-400 font-medium ml-1">({pr.mark})</span></span>
                              {selectedPRs.includes(pr.event) ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4 text-slate-300" />}
                           </button>
                         ))}
                       </div>
                    </div>

                    <div>
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Display Honors (Max 3)</h4>
                       <div className="flex flex-col gap-1.5">
                         {accolades.map((acc: string, i: number) => (
                           <button key={i} onClick={() => handleToggleAccolade(acc)} className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selectedAccolades.includes(acc) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                              <span className="text-xs font-bold text-slate-800 truncate pr-2">{acc}</span>
                              {selectedAccolades.includes(acc) ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4 text-slate-300" />}
                           </button>
                         ))}
                       </div>
                    </div>

                    <button onClick={handleDownloadSocialCard} disabled={isExportingCard} className="w-full bg-slate-900 text-white font-black py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2">
                       {isExportingCard ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4"/> Compile High-Res Canvas</>}
                    </button>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-7 flex justify-center items-start lg:sticky lg:top-36 max-h-[calc(100vh-10rem)] overflow-y-auto hide-scrollbar pb-6 px-2">
              <div id="social-card-export" className="relative w-full max-w-[420px] h-auto aspect-[4/5] bg-slate-900 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between overflow-hidden border border-slate-700/50 shadow-2xl shrink-0">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

                 <div className="flex items-center gap-4 z-10 shrink-0">
                    <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId="none" sizeClasses="w-16 h-16 shadow-lg border border-slate-800 shrink-0" />
                    <div className="min-w-0">
                       <h2 className="text-xl sm:text-2xl font-black uppercase text-white leading-none mb-1 truncate">{athleteProfile?.first_name} <br/>{athleteProfile?.last_name}</h2>
                       <p className="text-xs font-bold text-slate-400 truncate">{athleteProfile?.high_school} {athleteProfile?.grad_year && `• CO ${athleteProfile.grad_year}`}</p>
                    </div>
                 </div>

                 <div className="z-10 mt-6 space-y-2.5 shrink-0">
                    {athleteProfile?.prs?.filter((p: any) => selectedPRs.includes(p.event)).map((pr: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-end border-b border-slate-800/60 pb-1.5">
                         <span className="text-sm font-black text-slate-300 truncate pr-2">{pr.event}</span>
                         <span className="text-xl font-black text-white shrink-0">{pr.mark}</span>
                      </div>
                    ))}
                 </div>

                 <div className="z-10 mt-auto flex justify-between items-end pt-6 border-t border-slate-800 shrink-0">
                    <div className="flex-1 border-l-2 border-emerald-500 pl-3 overflow-hidden pr-2">
                       {selectedAccolades.map((acc: string, idx: number) => <p key={idx} className="text-xs font-bold italic text-slate-400 mb-0.5 truncate">"{acc}"</p>)}
                       {includeGPA && gpa && <p className="text-xs font-black text-emerald-400 mt-1 truncate">GPA: {gpa}</p>}
                       {includeMajor && intendedMajor && <p className="text-xs font-black text-blue-400 truncate">Major: {intendedMajor}</p>}
                    </div>
                    <div className="text-right shrink-0">
                       <p className="text-[18px] font-black tracking-tighter text-white">Chased<span className="text-blue-500">Sports</span></p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    )
  }, [athleteProfile, gpa, intendedMajor, accolades, schoolPrefs, newAccolade, selectedPRs, selectedAccolades, isExportingCard, showMajorDropdown]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Homebase...</p>
      </div>
    );
  }

  const myReferralCode = athleteProfile?.athletic_net_url?.match(/\d{5,}/)?.[0] || null;
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
      
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 font-bold text-sm border ${toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-slate-900 text-white border-slate-700'}`}>
            {toast.type === 'error' ? <X className="w-4 h-4 text-red-400" /> : <Check className="w-4 h-4 text-emerald-400" />} {toast.message}
          </div>
        </div>
      )}

      {/* 🚨 GAMIFIED ONBOARDING GATE (Mandatory Profile Setup) 🚨 */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white relative">
               <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[50px] rounded-full"></div>
               <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                 <ShieldCheck className="w-8 h-8 text-amber-300" /> Secure Your Profile
               </h2>
               <p className="text-blue-100 font-medium">Recruiting standards are dynamic and separated by gender and region. Establish your core identity to unlock the platform.</p>
               
               {athleteProfile?.first_name && athleteProfile?.high_school && athleteProfile?.state && athleteProfile?.gender && (
                 <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                   <X className="w-5 h-5 text-white" />
                 </button>
               )}
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">First Name <span className="text-red-500">*</span></label>
                  <input type="text" value={profileForm.first_name} onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="First Name"/>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" value={profileForm.last_name} onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Last Name"/>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">High School Name <span className="text-red-500">*</span></label>
                <input type="text" value={profileForm.high_school} onChange={(e) => setProfileForm({...profileForm, high_school: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. West Linn High School"/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">State <span className="text-red-500">*</span></label>
                  <select value={profileForm.state} onChange={(e) => setProfileForm({...profileForm, state: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select State...</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Conference / League (Optional)</label>
                  <input type="text" value={profileForm.conference} onChange={(e) => setProfileForm({...profileForm, conference: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Three Rivers League"/>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Athletic Gender Division <span className="text-red-500">*</span></label>
                <div className="flex gap-3">
                  <button onClick={() => setProfileForm({...profileForm, gender: 'Boys'})} className={`flex-1 py-3.5 rounded-xl font-black text-sm transition-all shadow-sm border-2 ${profileForm.gender === 'Boys' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300'}`}>Boys</button>
                  <button onClick={() => setProfileForm({...profileForm, gender: 'Girls'})} className={`flex-1 py-3.5 rounded-xl font-black text-sm transition-all shadow-sm border-2 ${profileForm.gender === 'Girls' ? 'bg-fuchsia-50 border-fuchsia-500 text-fuchsia-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-fuchsia-300'}`}>Girls</button>
                </div>
              </div>

              <button onClick={handleSaveProfile} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2 mt-4">
                 <Save className="w-5 h-5"/> Secure Profile Identity
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* 🌟 RESTRUCTURED HERO SECTION (WHITE BG, FIXES DROPDOWN OVERLAP) 🌟 */}
      <div className={`bg-white text-slate-900 pb-16 md:pb-20 px-5 md:px-6 relative transition-all duration-300 z-30 pt-10 shadow-sm border-b border-slate-200`}>
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8 relative z-30">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
            <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
              <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId={athleteProfile?.equipped_border} sizeClasses="w-24 h-24 md:w-32 md:h-32" />
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
                  {athleteProfile?.first_name ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'Welcome, Athlete'}
                </h1>
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors border border-slate-200"
                  title="Update Profile Details"
                >
                  <Edit3 className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <p className="text-base md:text-lg text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mb-6">
                <MapPin className="w-4 h-4 opacity-70" /> 
                {athleteProfile?.high_school || 'General Athlete Profile'} 
                {athleteProfile?.grad_year && ` • Class of ${athleteProfile.grad_year}`}
              </p>
              
              <div className="relative inline-block text-left" ref={sportsMenuRef}>
                 <button 
                   onClick={() => setIsSportsMenuOpen(!isSportsMenuOpen)}
                   className="inline-flex items-center gap-2 font-black px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-cyan-500 hover:bg-cyan-400 text-white border border-cyan-400"
                 >
                    Add / Update Sports <ChevronDown className={`w-4 h-4 transition-transform ${isSportsMenuOpen ? 'rotate-180' : ''}`} />
                 </button>
                 
                 {isSportsMenuOpen && (
                   <div className="absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-3 w-[280px] sm:w-[480px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border-2 border-cyan-100 p-3 sm:p-4 z-[100] max-h-[70vh] overflow-y-auto custom-scrollbar text-slate-900 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2 border-b border-slate-100 mb-2">Sport Specifications</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {ALL_SPORTS.map((sport: string) => {
                         const isActive = userSports.includes(sport);
                         return (
                           <div 
                             key={sport} 
                             onMouseDown={(e) => { e.preventDefault(); handleToggleSport(sport); }}
                             className="flex items-center gap-3 w-full text-left p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                           >
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${isActive ? 'bg-cyan-500 border-cyan-500' : 'bg-white border-slate-300 group-hover:border-cyan-300'}`}>
                                 {isActive && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className={`text-sm font-bold truncate select-none ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{sport}</span>
                           </div>
                         )
                       })}
                     </div>
                   </div>
                 )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 🌟 GLOBAL FLOATING TABS OVERLAY 🌟 */}
      {/* Placed here so they flow cleanly underneath the Hero Dropdown */}
      <div className="sticky top-20 md:top-24 z-20 w-full flex justify-center px-4 mt-6 animate-in slide-in-from-bottom-4 duration-500 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-full shadow-lg border border-slate-200/50 inline-flex gap-1 pointer-events-auto">
          <button 
            onClick={() => goToTab('home')} 
            className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <UserCircle2 className="w-4 h-4" /> <span className="hidden sm:inline">Homebase</span>
          </button>
          <button 
            onClick={() => goToTab('social')} 
            className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'social' ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <ImageIcon className="w-4 h-4" /> <span className="hidden sm:inline">Portfolio & Performance</span>
          </button>
          <button 
            onClick={() => goToTab('rewards')} 
            className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'rewards' ? 'bg-fuchsia-500 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <Gift className="w-4 h-4" /> <span className="hidden sm:inline">Rewards</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 relative z-10 space-y-6">
        
        {activeTab === 'home' && RenderHomeTab}
        {activeTab === 'social' && RenderSocialTab}
        
        {activeTab === 'rewards' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                {/* Streak Section */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
                      <Flame className="w-8 h-8 text-orange-500" /> Login Streak
                    </h2>
                    <p className="text-slate-400 font-medium text-sm">
                      Keep the momentum going. Daily logins yield passive ChasedCash generation for your team dashboard.
                    </p>
                  </div>
                  <div className="flex items-center gap-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 w-fit">
                    <span className="text-6xl font-black bg-gradient-to-br from-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-sm">
                      {streak}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-300 uppercase tracking-widest">Days</span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Streak</span>
                    </div>
                  </div>
                </div>

                {/* Referral Section */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
                      <Users className="w-8 h-8 text-fuchsia-500" /> Referral Squad
                    </h2>
                    <p className="text-slate-400 font-medium text-sm">
                      Invite teammates. Every 5 verified recruits grants premium rewards and team boosts. Total Recruits: <span className="text-white font-black">{currentRefs}</span>
                    </p>
                  </div>
                  
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Cycle Progress</span>
                        <span className="text-xl font-black text-fuchsia-400">{progressInCycle} <span className="text-slate-600 text-sm">/ 5</span></span>
                      </div>
                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden shadow-inner">
                         <div className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full transition-all duration-700 relative" style={{ width: `${progressPct}%` }}>
                           <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                         </div>
                      </div>
                    </div>

                    {myReferralCode ? (
                      <button onClick={() => handleShareCode(myReferralCode)} className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2">
                        <Share2 className="w-5 h-5" /> Copy My Invite Code
                      </button>
                    ) : (
                      <div className="text-xs text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 p-4 rounded-xl text-center flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> Sync an Athletic.net profile to generate your referral code.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gamified Milestones Track */}
              <div className="mt-12 pt-10 border-t border-slate-800/80 relative z-10">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8 text-center sm:text-left">Upcoming Milestones</h3>
                <div className="flex flex-col sm:flex-row justify-between relative gap-6 sm:gap-0">
                  <div className="absolute top-1/2 -translate-y-1/2 left-8 right-8 h-1 bg-slate-800 hidden sm:block z-0"></div>
                  {milestones.map((ms, idx) => {
                    const isAchieved = currentRefs >= ms.count;
                    const Icon = ms.icon;
                    return (
                      <div key={idx} className="relative z-10 flex flex-row sm:flex-col items-center gap-4 sm:gap-0">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full flex items-center justify-center border-4 border-slate-900 transition-all duration-500 ${isAchieved ? `${ms.bg} text-white shadow-[0_0_20px_rgba(217,70,239,0.4)] scale-110` : 'bg-slate-800 text-slate-600'}`}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="sm:mt-4 text-left sm:text-center flex-1">
                          <div className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${isAchieved ? ms.color : 'text-slate-500'}`}>
                            {ms.count} Recruits
                          </div>
                          <div className={`text-sm sm:text-sm font-bold mt-0.5 sm:mt-1 ${isAchieved ? 'text-white' : 'text-slate-400'}`}>
                            {ms.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}