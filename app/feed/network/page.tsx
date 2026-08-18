'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePathname } from 'next/navigation'; 
import { ShieldCheck, CheckCircle2, AlertCircle, Flame, Users, Star, Crown, Search, SlidersHorizontal, ChevronDown, UserCircle2, School, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

const formatLastSeen = (dateString?: string | null) => {
  if (!dateString) return { text: "Status Unknown", color: "bg-slate-500", dot: "bg-slate-400" };
  const lastDate = new Date(dateString);
  const diffDays = Math.ceil(Math.abs(new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)); 
  if (diffDays <= 1) return { text: "Active Today", color: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300", dot: "bg-emerald-400 animate-pulse" };
  if (diffDays <= 3) return { text: `Active ${diffDays}d ago`, color: "bg-amber-500/20 border-amber-500/30 text-amber-300", dot: "bg-amber-400" };
  if (diffDays <= 7) return { text: `Active this week`, color: "bg-blue-500/20 border-blue-500/30 text-blue-300", dot: "bg-blue-400" };
  return { text: "Inactive > 1 Week", color: "bg-slate-700/50 border-slate-600 text-slate-400", dot: "bg-slate-500" };
};

const getCardStyles = (cardId: string | null | undefined) => {
  let id = cardId || 'base'; if (id === 'default') id = 'base';
  return { 
    bgClass: id === 'base' ? 'bg-gradient-to-b from-white/[0.05] to-transparent' : `holo-card-${id}`,
    isFoil: ['hype', 'premium', 'crimson', 'sapphire'].includes(id),
    hasGlare: ['hype', 'premium'].includes(id),
    borderClass: id === 'base' ? 'border-white/10' : 'border-white/20 shadow-xl'
  };
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

  useEffect(() => { 
    fetchUserAndNetwork(); 
  }, []); 

  async function fetchUserAndNetwork() {
    const { data: { session } } = await supabase.auth.getSession();
    let vRole: 'guest' | 'athlete' | 'coach' = 'guest';

    if (session) {
      const { data: cData } = await supabase.from('coaches').select('id').eq('id', session.user.id).maybeSingle();
      if (cData) vRole = 'coach';
      else {
        const { data: aData } = await supabase.from('athletes').select('id').eq('id', session.user.id).maybeSingle();
        if (aData) vRole = 'athlete';
      }
      setViewerRole(vRole);
    }

    if (vRole !== 'coach') {
      const { data } = await supabase.from('coaches').select('id, first_name, last_name, school_name, avatar_url, division, sport, coach_title').order('school_name');
      if (data) setCoachesList(data);
    } else {
      const { data } = await supabase.from('athletes').select(`id, first_name, last_name, high_school, state, avatar_url, grad_year, is_premium, equipped_border, equipped_card, last_login_date, athlete_sports (sport_name, position, custom_fit_score)`).not('first_name', 'is', null).order('trust_level', { ascending: false }).limit(300);
      if (data) setRecruitsList(data);
    }
  }

  const filteredDirectory = useMemo(() => {
    if (viewerRole !== 'coach') {
      return coachesList.filter(c => !searchQuery || c.school_name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.last_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    } else {
      return recruitsList.filter(athlete => {
        const fullName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim().toLowerCase();
        const searchMatch = !searchQuery || fullName.includes(searchQuery.toLowerCase());
        const stateMatch = !filterAthleteState || athlete.state === filterAthleteState;
        const gradYearMatch = !filterGradYear || athlete.grad_year?.toString() === filterGradYear;
        const sportMatch = !filterSport || athlete.athlete_sports?.some((s: any) => s.sport_name === filterSport);
        return searchMatch && stateMatch && gradYearMatch && sportMatch;
      });
    }
  }, [viewerRole, coachesList, recruitsList, searchQuery, filterAthleteState, filterGradYear, filterSport]);

  return (
    <main className="min-h-screen bg-[#06090F] text-white font-sans pb-32 relative selection:bg-blue-500/30 overflow-hidden">
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .holo-card-base { background: transparent; }
        .holo-card-hype { background: linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent 100%), linear-gradient(135deg, #4f46e5 0%, #9333ea 25%, #ec4899 50%, #3b82f6 75%, #4f46e5 100%); background-size: 40px 40px, 300% 300%; }
        .holo-card-premium { background: repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px), linear-gradient(135deg, #b45309 0%, #f59e0b 25%, #fef08a 50%, #d97706 75%, #78350f 100%); background-size: 100% 100%, 300% 300%; }
        .animate-foil { animation: foilShift 15s ease-in-out infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 10px; }
      `}} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 relative z-30">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 text-white flex items-center gap-3">
                  The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Network</span>
                </h1>
                <p className="text-slate-400 font-medium text-sm md:text-base flex items-center gap-2">
                   Multi-Sport Hub & Recruiting Directory
                </p>
            </div>
        </div>

        {/* 🚨 SHARED TABS NAVIGATION 🚨 */}
        <div className="flex gap-4 mb-8 overflow-x-auto custom-scrollbar pb-1 border-b border-white/5 relative">
          <Link href="/feed" className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${pathname === '/feed' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <Star className="w-4 h-4" /> Featured Athletes 
          </Link>
          <Link href="/feed/discussions" className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${pathname === '/feed/discussions' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <Flame className="w-4 h-4" /> Trending Discussions
          </Link>
          <Link href="/feed/network" className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${pathname === '/feed/network' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <Users className="w-4 h-4" /> Directory
            {pathname === '/feed/network' && <><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /><div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" /></>}
          </Link>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* 🚨 SEARCH FILTERS 🚨 */}
            <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] p-5 md:p-8 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] mb-10">
                <div className="flex flex-col sm:flex-row gap-4 mb-5 items-center">
                  <div className="relative group flex-1 w-full flex gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400" />
                        <input type="text" placeholder={viewerRole === 'coach' ? "Search athletes..." : "Search coaches..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/20 border border-white/5 hover:border-white/10 rounded-[1.5rem] pl-14 pr-6 py-4 text-white font-bold focus:outline-none focus:border-indigo-500/50" />
                      </div>
                      <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="sm:hidden flex items-center justify-center w-14 h-14 bg-black/20 border border-white/10 rounded-2xl text-slate-300 shrink-0"><SlidersHorizontal className="w-5 h-5" /></button>
                  </div>
                </div>

                {viewerRole === 'coach' && (
                  <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${showMobileFilters ? 'block' : 'hidden sm:grid'}`}>
                    <select value={filterAthleteState} onChange={e => setFilterAthleteState(e.target.value)} className="w-full bg-black/20 border border-white/5 text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none appearance-none">
                        <option value="" className="bg-slate-900">Any State</option>
                        {Array.from(new Set(recruitsList.map(r => r.state).filter(Boolean))).sort().map(s => <option key={s as string} value={s as string} className="bg-slate-900">{s as string}</option>)}
                    </select>
                    <select value={filterGradYear} onChange={e => setFilterGradYear(e.target.value)} className="w-full bg-black/20 border border-white/5 text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none appearance-none">
                        <option value="" className="bg-slate-900">Any Class</option>
                        {Array.from(new Set(recruitsList.map(r => r.grad_year).filter(Boolean))).sort().map(y => <option key={y as string} value={y as string} className="bg-slate-900">{y as string}</option>)}
                    </select>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {viewerRole !== 'coach' ? (
                    filteredDirectory.map(coach => (
                        <div key={coach.id} className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 transition-all duration-500 flex flex-col justify-between h-full group hover:-translate-y-1 relative">
                            <div className="flex items-start gap-4 mb-6 relative z-10">
                                <AvatarWithBorder avatarUrl={coach.avatar_url || ''} sizeClasses="w-16 h-16 shadow-md border border-white/5" borderId="none" />
                                <div className="pt-1 w-full min-w-0">
                                    <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors leading-tight truncate">Coach {coach.last_name}</h3>
                                    <div className="flex flex-col gap-1.5 mt-1.5">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 truncate">
                                        <School className="w-3 h-3 shrink-0" /> <span className="truncate">{coach.school_name}</span>
                                      </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    filteredDirectory.map(athlete => {
                        const cardStyles = getCardStyles(athlete.equipped_card);
                        const lastSeen = formatLastSeen(athlete.last_login_date);
                        return (
                          <div key={athlete.id} className={`${cardStyles.bgClass} ${cardStyles.isFoil ? 'animate-foil shadow-lg' : ''} ${cardStyles.borderClass} backdrop-blur-xl rounded-[2rem] p-6 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-500 flex flex-col justify-between h-full group hover:-translate-y-1 border relative`}>
                              <div className="flex items-start gap-4 mb-5 relative z-10">
                                  <Link href={`/athlete/${athlete.id}`} className="shrink-0 hover:scale-105 transition-transform block shadow-xl rounded-full bg-slate-900 border-2 border-white/20">
                                      <AvatarWithBorder avatarUrl={athlete.avatar_url || ''} sizeClasses="w-16 h-16 shadow-md" borderId={athlete.equipped_border || 'none'} />
                                  </Link>
                                  <div className="min-w-0 pt-1 w-full">
                                      <Link href={`/athlete/${athlete.id}`} className="text-left font-bold text-lg text-white group-hover:text-indigo-400 transition-colors leading-tight truncate flex items-center gap-1.5">
                                          {athlete.first_name} {athlete.last_name}
                                          {athlete.is_premium && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                                      </Link>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                          {athlete.high_school} • {athlete.state}
                                      </p>
                                  </div>
                              </div>
                              <div className="mt-auto relative z-10 space-y-3">
                                  <div className={`flex items-center justify-center gap-1.5 w-full border border-white/5 rounded-xl py-1.5 backdrop-blur-md ${lastSeen.color}`}>
                                     <div className={`w-1.5 h-1.5 rounded-full ${lastSeen.dot}`}></div>
                                     <span className="text-[9px] font-black uppercase tracking-widest">{lastSeen.text}</span>
                                  </div>
                                  <Link href={`/athlete/${athlete.id}`} className="bg-black/20 hover:bg-black/40 text-white border border-white/10 font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs shadow-inner">
                                      <UserCircle2 className="w-4 h-4" /> View Profile
                                  </Link>
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