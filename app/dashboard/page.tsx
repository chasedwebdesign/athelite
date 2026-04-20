'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { UserCircle2, MapPin, School, Search, ShieldCheck, BookmarkPlus, Check, Trash2, FileText, Save, ArrowRight, Activity, Medal, Plus, LogOut, X, Target, Dumbbell } from 'lucide-react';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

// 🚨 FUTURE SPORTS CONFIGURATION 🚨
const UPCOMING_SPORTS = [
  { id: 'basketball', name: 'Basketball', icon: Target, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'soccer', name: 'Soccer', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'football', name: 'Football', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'volleyball', name: 'Volleyball', icon: Activity, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-200' },
  { id: 'weightlifting', name: 'Weightlifting', icon: Dumbbell, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300' },
];

export default function AthleteHomebase() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athleteProfile, setAthleteProfile] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  const [savedColleges, setSavedColleges] = useState<any[]>([]);
  
  const [resumeText, setResumeText] = useState('');
  const [isSavingResume, setIsSavingResume] = useState(false);

  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
        setResumeText(athleteData.saved_resume || '');
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
    const searchColleges = async () => {
      if (searchQuery.trim().length < 3) { setSearchResults([]); return; }
      setIsSearchingColleges(true);
      const { data } = await supabase.from('universities').select('id, name, state, division, logo_url').ilike('name', `%${searchQuery.trim()}%`).limit(6);
      if (data) setSearchResults(data);
      setIsSearchingColleges(false);
    };
    const timeoutId = setTimeout(searchColleges, 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, supabase]);

  const handleSaveCollege = async (collegeId: string) => {
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

  const handleRemoveCollege = async (savedId: string) => {
    try {
      await supabase.from('saved_colleges').delete().eq('id', savedId);
      setSavedColleges(prev => prev.filter(c => c.id !== savedId));
    } catch (err) { console.error(err); }
  };

  const handleSaveResume = async () => {
    if (!athleteProfile?.id) return;
    setIsSavingResume(true);
    try {
      await supabase.from('athletes').update({ saved_resume: resumeText }).eq('id', athleteProfile.id);
      showToast("Resume saved successfully!");
    } catch (err) { console.error(err); } finally { setIsSavingResume(false); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Homebase...</p>
      </div>
    );
  }

  const activeSports = athleteProfile?.active_sports || ['track'];

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-24 md:pb-12">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-slate-900 text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 font-bold text-sm border border-slate-700">
            <Check className="w-4 h-4 text-emerald-400" /> {toast.message}
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
              {UPCOMING_SPORTS.map((sport) => {
                const Icon = sport.icon;
                return (
                  <button 
                    key={sport.id}
                    onClick={() => {
                      setShowAddSportModal(false);
                      showToast(`${sport.name} portal is launching Fall 2026!`, 'success');
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border ${sport.border} ${sport.bg} hover:shadow-md hover:scale-[1.02] transition-all text-left`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                      <Icon className={`w-5 h-5 ${sport.color}`} />
                    </div>
                    <div>
                      <span className="block font-black text-slate-800 leading-none">{sport.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Coming Soon</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 🚨 UNIVERSAL TOP NAV (UPDATED TO ICON) 🚨 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-6 py-3 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 overflow-hidden group-hover:scale-105 transition-transform">
            <Image 
              src="/icon.png" 
              alt="ChasedSports Icon" 
              fill
              sizes="(max-width: 768px) 32px, 40px"
              className="object-contain"
              priority
            />
          </div>
          <span className="font-black text-slate-900 tracking-tight hidden sm:block text-xl">
            Chased<span className="text-blue-600">Sports</span>
          </span>
        </Link>

        <button onClick={handleSignOut} className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
          Sign Out <LogOut className="w-4 h-4" />
        </button>
      </nav>

      {/* UNIVERSAL HERO PROFILE */}
      <div className="bg-slate-900 text-white pt-10 pb-16 px-5 md:pt-16 md:pb-24 md:px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10">
          <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
            <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId={athleteProfile?.equipped_border} sizeClasses="w-24 h-24 md:w-32 md:h-32" />
          </div>
          <div className="text-center md:text-left flex-1 w-full">
            <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
              {athleteProfile?.first_name ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'Welcome, Athlete'}
            </h1>
            <p className="text-base md:text-lg text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
              <MapPin className="w-4 h-4 opacity-70" /> 
              {athleteProfile?.high_school || 'General Athlete Profile'} 
              {athleteProfile?.grad_year && ` • Class of ${athleteProfile.grad_year}`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-8 relative z-20 space-y-6">
        
        {/* DYNAMIC SPORTS LOCKER */}
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <Medal className="w-6 h-6 mr-3 text-blue-600" /> My Sports Locker
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Select a sport to view your specific stats, scouting reports, and leaderboards.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {activeSports.includes('track') && (
              <Link href="/dashboard/track" className="group relative bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-6 border border-blue-800 shadow-lg overflow-hidden hover:-translate-y-1 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[40px] rounded-full pointer-events-none group-hover:bg-blue-400/30 transition-colors"></div>
                <Activity className="w-10 h-10 text-blue-300 mb-4" />
                <h3 className="text-2xl font-black text-white mb-1">Track & Field</h3>
                <p className="text-blue-200/70 text-sm font-medium flex items-center">
                  Enter Portal <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </p>
              </Link>
            )}

            <button onClick={() => setShowAddSportModal(true)} className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 hover:bg-slate-100 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                <Plus className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Add Sport</h3>
              <p className="text-xs font-medium text-slate-400 mt-1">Join another portal</p>
            </button>

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* UNIVERSAL COLLEGE BOARD */}
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col">
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
                              onClick={() => handleSaveCollege(uni.id)} disabled={isAlreadySaved}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 content-start">
                {savedColleges.map((saved) => {
                  const college = saved.universities; 
                  if (!college) return null;
                  return (
                    <div key={saved.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 relative">
                      <div className="w-10 h-10 bg-white rounded-full border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {college.logo_url ? <img src={college.logo_url} className="w-6 h-6 object-contain" /> : <School className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div className="flex-1 truncate">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{college.name}</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{college.division}</p>
                      </div>
                      <button onClick={() => handleRemoveCollege(saved.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 border-dashed flex-1 flex flex-col items-center justify-center">
                <School className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500 font-medium">Search to add colleges to your board.</p>
              </div>
            )}
          </div>

          {/* UNIVERSAL MASTER RESUME */}
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center tracking-tight">
                  <FileText className="w-5 h-5 mr-2 text-emerald-500" /> Master Resume
                </h2>
              </div>
              <button onClick={handleSaveResume} disabled={isSavingResume} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black px-4 py-2 rounded-xl text-xs transition-colors shadow-md">
                <Save className="w-4 h-4" /> {isSavingResume ? 'Saving...' : 'Save'}
              </button>
            </div>
            <textarea 
              value={resumeText} onChange={(e) => setResumeText(e.target.value)}
              placeholder="Example:&#10;&#10;GPA: 3.9&#10;SAT: 1450&#10;Intended Major: Business&#10;&#10;• 3x Varsity Letterman&#10;• Team Captain"
              className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none min-h-[250px]"
            />
          </div>

        </div>
      </div>
    </main>
  );
}