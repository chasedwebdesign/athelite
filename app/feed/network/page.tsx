'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePathname } from 'next/navigation'; 
import { 
  Users, 
  Star, 
  Crown, 
  Search, 
  SlidersHorizontal, 
  UserCircle2, 
  School, 
  Briefcase, 
  MessageSquare 
} from 'lucide-react';
import Link from 'next/link';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

const formatLastSeen = (dateString?: string | null) => {
  if (!dateString) return { text: "Status Unknown", color: "bg-slate-800/80 border-slate-700 text-slate-400", dot: "bg-slate-400" };
  const lastDate = new Date(dateString);
  const diffDays = Math.ceil(Math.abs(new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)); 
  if (diffDays <= 1) return { text: "Active Today", color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300", dot: "bg-emerald-400 animate-pulse" };
  if (diffDays <= 3) return { text: `Active ${diffDays}d ago`, color: "bg-amber-500/15 border-amber-500/30 text-amber-300", dot: "bg-amber-400" };
  if (diffDays <= 7) return { text: "Active this week", color: "bg-blue-500/15 border-blue-500/30 text-blue-300", dot: "bg-blue-400" };
  return { text: "Inactive > 1 Week", color: "bg-slate-800/80 border-slate-700 text-slate-400", dot: "bg-slate-500" };
};

const getCardStyles = (cardId: string | null | undefined) => {
  let id = cardId || 'base';
  if (id === 'default') id = 'base';
  return { 
    bgClass: id === 'base' ? 'bg-[#0B101A]' : `holo-card-${id}`,
    isFoil: ['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber', 'mythic-flare'].includes(id),
    hasGlare: ['hype', 'premium', 'mythic-flare'].includes(id),
    borderClass: id === 'base' ? 'border-white/10 hover:border-white/20' : 'border-white/20 shadow-xl'
  };
};

// Calculates the 5-year active recruiting window based on the annual June 22nd rollover
const getEligibleGradYearBounds = (now = new Date()) => {
  const currentYear = now.getFullYear();
  // Month index 5 = June (June 22nd at 00:00:00)
  const june22Cutoff = new Date(currentYear, 5, 22, 0, 0, 0, 0);
  const minGradYear = now >= june22Cutoff ? currentYear + 1 : currentYear;
  const maxGradYear = minGradYear + 4; // e.g., 2027 through 2031
  return { minGradYear, maxGradYear };
};

// Resolves the athlete's profile URL using custom_slug (with fallback to id)
const getAthleteProfileUrl = (athlete: any) => {
  const slug = typeof athlete?.custom_slug === 'string' ? athlete.custom_slug.trim() : '';
  if (slug && slug !== 'default') {
    return `/athlete/${slug}`;
  }
  return `/athlete/${athlete.id}`;
};

export default function NetworkPage() {
  const supabase = createClient();
  const pathname = usePathname();
  
  const [coachesList, setCoachesList] = useState<any[]>([]);
  const [recruitsList, setRecruitsList] = useState<any[]>([]);
  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAthleteState, setFilterAthleteState] = useState('');
  const [filterGradYear, setFilterGradYear] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [gradYearBounds, setGradYearBounds] = useState(() => getEligibleGradYearBounds());

  // Timer to keep the June 22nd class cutoff synced in real time
  useEffect(() => {
    const interval = setInterval(() => {
      const updated = getEligibleGradYearBounds();
      setGradYearBounds(prev =>
        prev.minGradYear !== updated.minGradYear || prev.maxGradYear !== updated.maxGradYear
          ? updated
          : prev
      );
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { 
    fetchUserAndNetwork(); 
  }, [gradYearBounds.minGradYear, gradYearBounds.maxGradYear]); 

  async function fetchUserAndNetwork() {
    const { data: { session } } = await supabase.auth.getSession();
    let vRole: 'guest' | 'athlete' | 'coach' = 'guest';

    if (session) {
      const { data: cData } = await supabase.from('coaches').select('id').eq('id', session.user.id).maybeSingle();
      if (cData) {
        vRole = 'coach';
      } else {
        const { data: aData } = await supabase.from('athletes').select('id').eq('id', session.user.id).maybeSingle();
        if (aData) vRole = 'athlete';
      }
      setViewerRole(vRole);
    }

    if (vRole !== 'coach') {
      const { data } = await supabase
        .from('coaches')
        .select('id, first_name, last_name, school_name, avatar_url, division, sport, coach_title')
        .order('school_name');
      if (data) setCoachesList(data);
    } else {
      const { minGradYear, maxGradYear } = getEligibleGradYearBounds();
      const { data } = await supabase
        .from('athletes')
        .select(`
          id, custom_slug, first_name, last_name, high_school, state, avatar_url, grad_year, trust_level, is_premium, equipped_border, equipped_card, last_login_date,
          athlete_sports (sport_name, position, custom_fit_score)
        `)
        .not('first_name', 'is', null)
        .gt('trust_level', 0)
        .gte('grad_year', minGradYear)
        .lte('grad_year', maxGradYear)
        .order('last_login_date', { ascending: false, nullsFirst: false })
        .limit(300);
      if (data) setRecruitsList(data);
    }
  }

  const availableSports = useMemo<string[]>(() => {
    const set = new Set<string>();
    recruitsList.forEach((r: any) => {
      if (Array.isArray(r.athlete_sports)) {
        r.athlete_sports.forEach((s: any) => {
          if (s?.sport_name) set.add(String(s.sport_name));
        });
      }
    });
    return Array.from(set).sort();
  }, [recruitsList]);

  const eligibleGradYearOptions = useMemo<number[]>(() => {
    const years: number[] = [];
    for (let y = gradYearBounds.minGradYear; y <= gradYearBounds.maxGradYear; y++) {
      years.push(y);
    }
    return years;
  }, [gradYearBounds]);

  const filteredDirectory = useMemo(() => {
    if (viewerRole !== 'coach') {
      return coachesList.filter((c: any) =>
        !searchQuery ||
        c.school_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.sport?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      const { minGradYear, maxGradYear } = gradYearBounds;

      return recruitsList
        .filter((athlete: any) => {
          // 1. Must be verified (trust_level > 0)
          const isVerified = Number(athlete.trust_level ?? 0) > 0;
          if (!isVerified) return false;

          // 2. Must fall within current eligible graduation class window (e.g., 2027 - 2031)
          const gradYearNum = Number(athlete.grad_year);
          const isCurrentClass =
            !Number.isNaN(gradYearNum) &&
            gradYearNum >= minGradYear &&
            gradYearNum <= maxGradYear;
          if (!isCurrentClass) return false;

          // 3. Search & dropdown filters
          const fullName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim().toLowerCase();
          const schoolName = (athlete.high_school || '').toLowerCase();
          const q = searchQuery.toLowerCase();
          const searchMatch = !searchQuery || fullName.includes(q) || schoolName.includes(q);
          const stateMatch = !filterAthleteState || athlete.state === filterAthleteState;
          const gradYearMatch = !filterGradYear || gradYearNum.toString() === filterGradYear;
          const sportMatch = !filterSport || athlete.athlete_sports?.some((s: any) => s.sport_name === filterSport);

          return searchMatch && stateMatch && gradYearMatch && sportMatch;
        })
        .sort((a: any, b: any) => {
          // Most recent login at the top; null/invalid dates pushed to the bottom
          const timeA = a.last_login_date ? new Date(a.last_login_date).getTime() : 0;
          const timeB = b.last_login_date ? new Date(b.last_login_date).getTime() : 0;
          const validTimeA = Number.isNaN(timeA) ? 0 : timeA;
          const validTimeB = Number.isNaN(timeB) ? 0 : timeB;

          if (validTimeB !== validTimeA) {
            return validTimeB - validTimeA;
          }
          // Tiebreaker: higher trust_level first
          return Number(b.trust_level ?? 0) - Number(a.trust_level ?? 0);
        });
    }
  }, [viewerRole, coachesList, recruitsList, searchQuery, filterAthleteState, filterGradYear, filterSport, gradYearBounds]);

  return (
    <main className="min-h-screen bg-[#06090F] text-white font-sans pb-32 relative selection:bg-blue-500/30 overflow-hidden">
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerGlare { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes voidPulse { 0%, 100% { background-size: 100% 100%; filter: brightness(1); } 50% { background-size: 120% 120%; filter: brightness(1.2); } }

        .holo-card-base { background-color: #0B101A; }
        .holo-card-obsidian { background: linear-gradient(135deg, #0f172a 0%, #334155 25%, #000000 50%, #0f172a 75%, #1e293b 100%); background-size: 300% 300%; }
        .holo-card-crimson { background: linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #450a0a 100%); background-size: 300% 300%; }
        .holo-card-sapphire { background: linear-gradient(135deg, #172554 0%, #0ea5e9 50%, #172554 100%); background-size: 300% 300%; }
        .holo-card-hype { background: linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent 100%), linear-gradient(135deg, #4f46e5 0%, #9333ea 25%, #ec4899 50%, #3b82f6 75%, #4f46e5 100%); background-size: 40px 40px, 300% 300%; }
        .holo-card-premium { background: repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px), linear-gradient(135deg, #b45309 0%, #f59e0b 25%, #fef08a 50%, #d97706 75%, #78350f 100%); background-size: 100% 100%, 300% 300%; }
        .holo-card-amethyst { background: radial-gradient(circle at 50% 50%, #c026d3 0%, #7e22ce 30%, #3b0764 80%, #000000 100%); animation: voidPulse 6s ease-in-out infinite; }
        .holo-card-cyber { background: linear-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.15) 1px, transparent 1px), linear-gradient(135deg, #022c22 0%, #064e3b 50%, #083344 100%); background-size: 20px 20px, 20px 20px, 100% 100%; box-shadow: inset 0 0 40px rgba(6, 182, 212, 0.3); }
        .holo-card-mythic-flare { background: radial-gradient(circle at 50% 50%, #f43f5e 0%, #881337 40%, #000000 100%); animation: voidPulse 8s ease-in-out infinite; }

        .animate-foil { animation: foilShift 15s ease-in-out infinite; }
        .holo-glare { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.35) 25%, transparent 30%); background-size: 200% auto; animation: shimmerGlare 8s infinite linear; pointer-events: none; mix-blend-mode: overlay; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 10px; }
      `}} />

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

        {/* 🚨 SMOOTH 2-TAB SEGMENTED NAV (NO TRENDING) 🚨 */}
        <div className="flex justify-center mb-10 w-full z-40 relative">
          <div className="flex items-center justify-between w-full max-w-sm md:max-w-none md:w-auto p-1.5 bg-[#0B101A] border border-white/10 rounded-2xl md:rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <Link 
              href="/feed" 
              className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-3 py-2 md:px-7 md:py-2.5 rounded-xl md:rounded-full text-[10px] md:text-sm transition-all whitespace-nowrap ${
                pathname === '/feed' 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Star className={`w-5 h-5 md:w-4 md:h-4 ${pathname === '/feed' ? 'text-blue-400 fill-blue-400/20 animate-pulse' : ''}`} /> 
              <span className="font-black uppercase tracking-wide md:normal-case md:tracking-normal md:font-bold">
                <span className="md:hidden">Featured</span>
                <span className="hidden md:inline">Featured Athletes</span>
              </span>
            </Link>

            <Link 
              href="/feed/network" 
              className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-3 py-2 md:px-7 md:py-2.5 rounded-xl md:rounded-full text-[10px] md:text-sm transition-all whitespace-nowrap ${
                pathname === '/feed/network' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Users className={`w-5 h-5 md:w-4 md:h-4 ${pathname === '/feed/network' ? 'text-emerald-400 fill-emerald-400/20 animate-pulse' : ''}`} /> 
              <span className="font-black uppercase tracking-wide md:normal-case md:tracking-normal md:font-bold">
                Directory
              </span>
            </Link>
          </div>
        </div>

        <div>
          {/* 🚨 SEARCH FILTERS 🚨 */}
          <div className="bg-[#0B101A] rounded-[2.5rem] p-5 md:p-8 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] mb-10 overflow-hidden isolate">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative group flex-1 w-full flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400" />
                  <input
                    type="text"
                    placeholder={viewerRole === 'coach' ? "Search verified athletes or high schools..." : "Search college coaches or schools..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#06090F] border border-white/10 hover:border-white/20 rounded-[1.5rem] pl-14 pr-6 py-4 text-white font-bold focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
                {viewerRole === 'coach' && (
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="sm:hidden flex items-center justify-center w-14 h-14 bg-[#06090F] border border-white/10 rounded-2xl text-slate-300 shrink-0"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {viewerRole === 'coach' && (
              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 ${showMobileFilters ? 'grid' : 'hidden sm:grid'}`}>
                <select
                  value={filterSport}
                  onChange={e => setFilterSport(e.target.value)}
                  className="w-full bg-[#06090F] border border-white/10 text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900">Any Sport</option>
                  {availableSports.map((sport: string) => (
                    <option key={sport} value={sport} className="bg-slate-900">{sport}</option>
                  ))}
                </select>

                <select
                  value={filterAthleteState}
                  onChange={e => setFilterAthleteState(e.target.value)}
                  className="w-full bg-[#06090F] border border-white/10 text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900">Any State</option>
                  {Array.from(new Set(recruitsList.map(r => r.state).filter(Boolean))).sort().map(s => (
                    <option key={s as string} value={s as string} className="bg-slate-900">{s as string}</option>
                  ))}
                </select>

                <select
                  value={filterGradYear}
                  onChange={e => setFilterGradYear(e.target.value)}
                  className="w-full bg-[#06090F] border border-white/10 text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900">
                    Any Class ({String(gradYearBounds.minGradYear).slice(-2)}–{String(gradYearBounds.maxGradYear).slice(-2)})
                  </option>
                  {eligibleGradYearOptions.map(y => (
                    <option key={y} value={String(y)} className="bg-slate-900">Class of {y}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 🚨 DIRECTORY CARDS GRID (GLITCH-FREE GPU COMPOSITING) 🚨 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {viewerRole !== 'coach' ? (
              filteredDirectory.map((coach: any) => (
                <div
                  key={coach.id}
                  className="bg-[#0B101A] border border-white/10 hover:border-blue-500/30 rounded-[2rem] p-6 transition-transform duration-300 flex flex-col justify-between h-full group hover:-translate-y-1 shadow-xl relative overflow-hidden isolate transform-gpu"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <AvatarWithBorder
                      avatarUrl={coach.avatar_url || ''}
                      sizeClasses="w-16 h-16 shadow-md border border-white/10 shrink-0"
                      borderId="none"
                      userRole="coach"
                    />
                    <div className="pt-1 w-full min-w-0">
                      <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors leading-tight truncate">
                        Coach {coach.first_name ? `${coach.first_name} ` : ''}{coach.last_name}
                      </h3>
                      <div className="flex flex-col gap-1.5 mt-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 truncate">
                          <School className="w-3 h-3 shrink-0 text-blue-400" /> <span className="truncate">{coach.school_name}</span>
                        </p>
                        {coach.sport && (
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 truncate">
                            <Briefcase className="w-3 h-3 shrink-0" /> 
                            <span className="truncate">{coach.sport} {coach.coach_title ? `- ${coach.coach_title}` : ''}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 🚨 CONTACT COACH BUTTON 🚨 */}
                  <div className="mt-auto">
                    {viewerRole === 'athlete' ? (
                      <Link 
                        href={`/dashboard/messages?compose=${coach.id}`} 
                        className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs"
                      >
                        <MessageSquare className="w-4 h-4" /> Message Coach
                      </Link>
                    ) : (
                      <Link 
                        href="/login" 
                        className="w-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs"
                      >
                        <MessageSquare className="w-4 h-4" /> Log in to Message
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              filteredDirectory.map((athlete: any) => {
                const cardStyles = getCardStyles(athlete.equipped_card);
                const lastSeen = formatLastSeen(athlete.last_login_date);
                const profileUrl = getAthleteProfileUrl(athlete);

                return (
                  <div
                    key={athlete.id}
                    className={`${cardStyles.bgClass} ${cardStyles.isFoil ? 'animate-foil' : ''} ${cardStyles.borderClass} rounded-[2rem] p-6 transition-transform duration-300 flex flex-col justify-between h-full group hover:-translate-y-1 border relative overflow-hidden isolate transform-gpu`}
                  >
                    {cardStyles.hasGlare && <div className="holo-glare rounded-[2rem] z-0"></div>}

                    <div className="flex items-start gap-4 mb-5 relative z-10">
                      <Link href={profileUrl} className="shrink-0 hover:scale-105 transition-transform block shadow-xl rounded-full bg-slate-900 border-2 border-white/20">
                        <AvatarWithBorder avatarUrl={athlete.avatar_url || ''} sizeClasses="w-16 h-16 shadow-md" borderId={athlete.equipped_border || 'none'} />
                      </Link>
                      <div className="min-w-0 pt-1 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={profileUrl} className="text-left font-bold text-lg text-white group-hover:text-indigo-400 transition-colors leading-tight truncate">
                            {athlete.first_name} {athlete.last_name}
                          </Link>
                          {athlete.is_premium && (
                            <Link
                              href="/pro"
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-cyan-500/25 via-purple-500/25 to-pink-500/25 border border-cyan-400/50 text-cyan-200 hover:scale-105 transition-transform shrink-0"
                            >
                              <Crown className="w-2.5 h-2.5 text-cyan-400" /> PRO Verified
                            </Link>
                          )}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate">
                          {athlete.high_school}{athlete.state ? ` • ${athlete.state}` : ''}{athlete.grad_year ? ` • '${String(athlete.grad_year).slice(-2)}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto relative z-10 space-y-3">
                      <div className={`flex items-center justify-center gap-1.5 w-full border rounded-xl py-1.5 ${lastSeen.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${lastSeen.dot}`}></div>
                        <span className="text-[9px] font-black uppercase tracking-widest">{lastSeen.text}</span>
                      </div>
                      
                      {/* 🚨 DUAL ACTIONS FOR COACHES 🚨 */}
                      <div className="flex gap-2 w-full">
                        <Link 
                          href={profileUrl} 
                          className="flex-1 bg-black/30 hover:bg-black/50 text-white border border-white/10 font-black py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs"
                        >
                          <UserCircle2 className="w-4 h-4" /> Profile
                        </Link>
                        <Link 
                          href={`/dashboard/messages?compose=${athlete.id}`} 
                          className="flex-1 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 font-black py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs"
                        >
                          <MessageSquare className="w-4 h-4" /> Message
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}