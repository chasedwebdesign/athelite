'use client';

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trophy, Medal, MapPin, Activity, Target, ChevronDown, TrendingUp, Users, Info, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  high_school: string;
  state: string;
  school_size?: string | null;
  conference?: string | null;
  grad_year: number;
  trust_level: number;
  avatar_url?: string | null;
  gender?: string; 
  prs: { event: string; mark: string; date?: string; meet?: string }[];
  rank?: number;
  tier?: { name: string; classes: string; border?: string; cardClass?: string };
  targetMark?: string;
  targetMeet?: string; 
  improvementDelta?: number;
}

const FILTER_EVENTS = [
  '100 Meters', '200 Meters', '400 Meters', '800 Meters', '1500 Meters', '1600 Meters', 
  '1 Mile', '3000 Meters', '3200 Meters', '5000 Meters', '100m Hurdles', '110m Hurdles', '300m Hurdles', 
  '400m Hurdles', 'Shot Put', 'Discus', 'Javelin', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'
];

const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

function LeaderboardContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  
  const [leaderboardMode, setLeaderboardMode] = useState<'overall' | 'improvement'>('overall');
  const [selectedGender, setSelectedGender] = useState(searchParams.get('gender') || 'Boys');
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get('event') || '100 Meters');
  
  const [selectedScope, setSelectedScope] = useState(searchParams.get('state') || 'National');
  const [selectedSize, setSelectedSize] = useState(searchParams.get('size') || 'All');
  const [selectedConference, setSelectedConference] = useState(searchParams.get('conference') || 'All');

  useEffect(() => {
    async function fetchAthletes() {
      const { data } = await supabase.from('athletes').select('*').gt('trust_level', 0);
      if (data) setAthletes(data as Athlete[]);
      setLoading(false);
    }
    fetchAthletes();
  }, [supabase]);

  const handleScopeChange = (newState: string) => {
      setSelectedScope(newState);
      setSelectedSize('All');
      setSelectedConference('All');
  }

  const handleSizeChange = (newSize: string) => {
      setSelectedSize(newSize);
      setSelectedConference('All');
  }

  const parseMarkForSorting = (mark: string, event: string): number => {
    const cleanMark = mark.replace(/[a-zA-Z]/g, '').trim();
    const isField = FIELD_EVENTS.includes(event);
    if (cleanMark.includes("'")) {
      const parts = cleanMark.split("'");
      const feet = parseFloat(parts[0]) || 0;
      const inches = parseFloat(parts[1]?.replace('"', '')) || 0;
      return isField ? -((feet * 12) + inches) : ((feet * 12) + inches); 
    }
    if (cleanMark.includes(":")) {
      const parts = cleanMark.split(":");
      const minutes = parseFloat(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return (minutes * 60) + seconds; 
    }
    const val = parseFloat(cleanMark) || 99999;
    return isField ? -val : val;
  };

  const getRankedAthletes = () => {
    let globalPool = athletes.filter(a => {
      const hasEvent = a.prs?.some(pr => pr.event === selectedEvent);
      const matchesGender = (a.gender || 'Boys') === selectedGender; 
      return hasEvent && matchesGender;
    });

    globalPool.forEach(a => {
      const eventMarks = a.prs.filter(pr => pr.event === selectedEvent);
      a.targetMark = eventMarks[0]?.mark || '';
      a.targetMeet = eventMarks[0]?.meet || ''; 
      
      if (eventMarks.length > 1) {
        const newestVal = parseMarkForSorting(eventMarks[0].mark, selectedEvent);
        const oldestVal = parseMarkForSorting(eventMarks[eventMarks.length - 1].mark, selectedEvent);
        a.improvementDelta = Math.abs(oldestVal - newestVal); 
      } else {
        a.improvementDelta = 0;
      }
    });

    globalPool.sort((a, b) => {
      if (leaderboardMode === 'improvement') {
        return (b.improvementDelta || 0) - (a.improvementDelta || 0);
      } else {
        const valA = parseMarkForSorting(a.targetMark!, selectedEvent);
        const valB = parseMarkForSorting(b.targetMark!, selectedEvent);
        return valA - valB;
      }
    });

    // UPDATED: Added Card Classes to inject pulsing glows into the Leaderboard Cards!
    const globalTotal = globalPool.length;
    globalPool.forEach((athlete, index) => {
      const percentile = index / globalTotal;

      if (percentile <= 0.01 || index === 0) {
        athlete.tier = { name: 'LEGEND', classes: 'legend-badge', border: 'border-legend', cardClass: 'card-legend' };
      } else if (percentile <= 0.05) {
        athlete.tier = { name: 'CHAMPION', classes: 'champion-badge', border: 'border-champion', cardClass: 'card-champion' };
      } else if (percentile <= 0.15) {
        athlete.tier = { name: 'ELITE', classes: 'elite-badge', border: 'border-elite', cardClass: 'card-elite' };
      } else if (percentile <= 0.30) {
        athlete.tier = { name: 'MASTER', classes: 'bg-blue-900 text-blue-100 border border-blue-500' };
      } else if (percentile <= 0.50) {
        athlete.tier = { name: 'CONTENDER', classes: 'bg-emerald-900 text-emerald-100 border border-emerald-500' };
      } else if (percentile <= 0.75) {
        athlete.tier = { name: 'CHALLENGER', classes: 'bg-orange-900 text-orange-100 border border-orange-500' };
      } else {
        athlete.tier = { name: 'PROSPECT', classes: 'bg-slate-800 text-slate-300 border border-slate-600' };
      }
    });

    let filtered = globalPool.filter(a => {
      const matchesState = selectedScope === 'National' || a.state === selectedScope;
      const matchesSize = selectedSize === 'All' || a.school_size === selectedSize;
      const matchesConf = selectedConference === 'All' || a.conference === selectedConference;
      return matchesState && matchesSize && matchesConf;
    });

    filtered.forEach((athlete, index) => {
      athlete.rank = index + 1;
    });

    return filtered;
  };

  const rankedAthletes = getRankedAthletes();
  const topThree = rankedAthletes.slice(0, 3);
  const theRest = rankedAthletes.slice(3);
  
  const availableStates = Array.from(new Set(athletes.map(a => a.state).filter(Boolean))).sort();
  const athletesInCurrentState = selectedScope === 'National' ? athletes : athletes.filter(a => a.state === selectedScope);
  const availableSizes = Array.from(new Set(athletesInCurrentState.map(a => a.school_size).filter(Boolean))).sort();
  const athletesInCurrentSize = selectedSize === 'All' ? athletesInCurrentState : athletesInCurrentState.filter(a => a.school_size === selectedSize);
  const availableConferences = Array.from(new Set(athletesInCurrentSize.map(a => a.conference).filter(Boolean))).sort();

  useEffect(() => {
    if (!loading && rankedAthletes.length > 0) {
      const hash = window.location.hash;
      if (hash) {
        const elementId = hash.substring(1); 
        const element = document.getElementById(`athlete-${elementId}`);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-4', 'ring-offset-[#0f172a]', 'z-50');
            setTimeout(() => element.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-4', 'ring-offset-[#0f172a]', 'z-50'), 3000);
          }, 500);
        }
      }
    }
  }, [loading, rankedAthletes, selectedEvent]); 

  return (
    <main className="min-h-screen bg-[#0f172a] font-sans pb-32 selection:bg-blue-500/30">
      
      {/* NEW: MESMERIZING LIQUID ANIMATIONS & CARD GLOWS */}
      <style dangerouslySetInnerHTML={{__html: `
        /* The liquid drift animation */
        @keyframes liquidPan {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        /* Shimmer used for badges */
        @keyframes shimmerSlow {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        /* --- LEGEND (Top 1%) --- */
        .legend-badge {
          background: linear-gradient(90deg, #6b21a8 0%, #d946ef 20%, #6b21a8 40%, #d946ef 60%, #6b21a8 80%);
          background-size: 200% auto;
          animation: shimmerSlow 4s linear infinite;
          color: white;
          border: 1px solid #e879f9;
          box-shadow: 0 0 15px rgba(217, 70, 239, 0.5);
          font-weight: 900;
        }
        .border-legend {
          background: linear-gradient(135deg, #7e22ce, #d946ef, #a21caf, #7e22ce);
          background-size: 300% 300%;
          animation: liquidPan 8s ease-in-out infinite;
          padding: 4px;
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(217, 70, 239, 0.5);
        }
        .card-legend {
          animation: pulse-legend 5s ease-in-out infinite;
        }
        @keyframes pulse-legend {
          0%, 100% { box-shadow: 0 0 30px rgba(217, 70, 239, 0.15), inset 0 0 20px rgba(217, 70, 239, 0.05); border-color: rgba(217, 70, 239, 0.3); }
          50% { box-shadow: 0 0 50px rgba(217, 70, 239, 0.3), inset 0 0 30px rgba(217, 70, 239, 0.1); border-color: rgba(217, 70, 239, 0.6); }
        }

        /* --- CHAMPION (Top 5%) --- */
        .champion-badge {
          background: linear-gradient(90deg, #991b1b 0%, #ef4444 20%, #991b1b 40%, #ef4444 60%, #991b1b 80%);
          background-size: 200% auto;
          animation: shimmerSlow 4s linear infinite;
          color: white;
          border: 1px solid #f87171;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
          font-weight: 900;
        }
        .border-champion {
          background: linear-gradient(135deg, #b91c1c, #ef4444, #dc2626, #b91c1c);
          background-size: 300% 300%;
          animation: liquidPan 8s ease-in-out infinite;
          padding: 4px;
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
        }
        .card-champion {
          animation: pulse-champion 5s ease-in-out infinite;
        }
        @keyframes pulse-champion {
          0%, 100% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.15), inset 0 0 20px rgba(239, 68, 68, 0.05); border-color: rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 50px rgba(239, 68, 68, 0.3), inset 0 0 30px rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.6); }
        }

        /* --- ELITE (Top 15%) --- */
        .elite-badge {
          background: linear-gradient(90deg, #0f172a 0%, #475569 20%, #0f172a 40%, #475569 60%, #0f172a 80%);
          background-size: 200% auto;
          animation: shimmerSlow 4s linear infinite;
          color: white;
          border: 1px solid #94a3b8;
          box-shadow: 0 0 15px rgba(148, 163, 184, 0.3);
          font-weight: 900;
        }
        .border-elite {
          background: linear-gradient(135deg, #1e293b, #64748b, #475569, #1e293b);
          background-size: 300% 300%;
          animation: liquidPan 8s ease-in-out infinite;
          padding: 4px;
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(148, 163, 184, 0.4);
        }
        .card-elite {
          animation: pulse-elite 5s ease-in-out infinite;
        }
        @keyframes pulse-elite {
          0%, 100% { box-shadow: 0 0 30px rgba(148, 163, 184, 0.1), inset 0 0 20px rgba(148, 163, 184, 0.05); border-color: rgba(148, 163, 184, 0.3); }
          50% { box-shadow: 0 0 50px rgba(148, 163, 184, 0.2), inset 0 0 30px rgba(148, 163, 184, 0.1); border-color: rgba(148, 163, 184, 0.5); }
        }
      `}} />

      {/* RANK GLOSSARY MODAL */}
      {isRankModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/90 backdrop-blur-sm p-6" onClick={() => setIsRankModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-[2rem] p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-white">Global Rank Tiers</h3>
              <button onClick={() => setIsRankModalOpen(false)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-400 mb-6 font-medium">Tiers are permanently attached to your profile based on your standing in the National Leaderboards.</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase legend-badge">Legend</span>
                <span className="text-sm font-bold text-slate-300">Top 1%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase champion-badge">Champion</span>
                <span className="text-sm font-bold text-slate-300">Top 5%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase elite-badge">Elite</span>
                <span className="text-sm font-bold text-slate-300">Top 15%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-blue-900 text-blue-100 border border-blue-500">Master</span>
                <span className="text-sm font-bold text-slate-300">Top 30%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-emerald-900 text-emerald-100 border border-emerald-500">Contender</span>
                <span className="text-sm font-bold text-slate-300">Top 50%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-orange-900 text-orange-100 border border-orange-500">Challenger</span>
                <span className="text-sm font-bold text-slate-300">Top 75%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-slate-800 text-slate-300 border border-slate-600">Prospect</span>
                <span className="text-sm font-bold text-slate-300">Unranked</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative pt-20 pb-12 px-6 text-center border-b border-slate-800 bg-gradient-to-b from-slate-900 to-[#0f172a] overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          
          <div className="absolute right-0 top-0 hidden md:block">
            <button onClick={() => setIsRankModalOpen(true)} className="flex items-center px-4 py-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors shadow-sm">
              <Info className="w-4 h-4 mr-2" /> Rank Info
            </button>
          </div>

          <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-blue-400 text-sm font-bold tracking-widest uppercase mb-6 shadow-sm">
            <Trophy className="w-4 h-4 mr-2" /> Global PR League
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-8">
            The Leaderboards
          </h1>

          <div className="md:hidden flex justify-center mb-8">
            <button onClick={() => setIsRankModalOpen(true)} className="flex items-center px-4 py-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors shadow-sm">
              <Info className="w-4 h-4 mr-2" /> Rank Info
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex bg-slate-800/80 p-1.5 rounded-2xl w-full sm:w-[280px] border border-slate-700/50 backdrop-blur-sm">
              <button onClick={() => setLeaderboardMode('overall')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${leaderboardMode === 'overall' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                <Trophy className="w-4 h-4 mr-2"/> PRs
              </button>
              <button onClick={() => setLeaderboardMode('improvement')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${leaderboardMode === 'improvement' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                <TrendingUp className="w-4 h-4 mr-2"/> Growth
              </button>
            </div>
            
            <div className="flex bg-slate-900/80 p-1.5 rounded-2xl w-full sm:w-[280px] border border-slate-700 shadow-inner">
              <button onClick={() => setSelectedGender('Boys')} className={`flex-1 py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-all ${selectedGender === 'Boys' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
                Boys
              </button>
              <button onClick={() => setSelectedGender('Girls')} className={`flex-1 py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-all ${selectedGender === 'Girls' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
                Girls
              </button>
            </div>
          </div>
          
          <div className="bg-slate-800/50 p-4 sm:p-6 rounded-[2rem] border border-slate-700 backdrop-blur-md">
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Activity className="w-5 h-5" /></div>
                <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-2xl pl-12 pr-10 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold appearance-none cursor-pointer">
                  {FILTER_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><MapPin className="w-5 h-5" /></div>
                <select value={selectedScope} onChange={(e) => handleScopeChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-2xl pl-12 pr-10 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold appearance-none cursor-pointer">
                  <option value="National">🇺🇸 National Overall</option>
                  {availableStates.map(state => <option key={state} value={state}>{state}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {selectedScope !== 'National' && (
              <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Users className="w-5 h-5" /></div>
                  <select value={selectedSize} onChange={(e) => handleSizeChange(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-2xl pl-12 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium appearance-none cursor-pointer text-sm">
                    <option value="All">All Divisions</option>
                    {availableSizes.map(size => <option key={size as string} value={size as string}>{size}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Trophy className="w-5 h-5" /></div>
                  <select value={selectedConference} onChange={(e) => setSelectedConference(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-2xl pl-12 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium appearance-none cursor-pointer text-sm">
                    <option value="All">All Conferences</option>
                    {availableConferences.map(conf => <option key={conf as string} value={conf as string}>{conf}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold animate-pulse">Calculating Global Ranks...</p>
          </div>
        ) : rankedAthletes.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-slate-700 border-dashed">
            <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-white mb-2">No athletes found</h3>
            <p className="text-slate-400 font-medium max-w-md mx-auto">Try adjusting your filters, or invite athletes from this conference to sync their profiles!</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 items-end">
              {topThree.map((athlete, idx) => {
                const isFirst = idx === 0;
                const podiumHeight = isFirst ? 'h-[380px]' : idx === 1 ? 'h-[320px]' : 'h-[280px]';
                const medalColor = isFirst ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : 'text-amber-600';
                
                // If they don't have a special card class (like Legend/Champion), default to the generic slate border
                const cardGlowClass = athlete.tier?.cardClass || 'border-slate-700 shadow-2xl';

                return (
                  <Link href={`/athlete/${athlete.id}`} id={`athlete-${athlete.id}`} key={athlete.id} className={`relative bg-slate-800/50 rounded-[2rem] border flex flex-col items-center justify-start p-6 text-center transition-all duration-300 hover:-translate-y-4 hover:bg-slate-800 cursor-pointer group scroll-mt-32 ${podiumHeight} ${cardGlowClass} ${isFirst ? 'md:-translate-y-8' : ''}`}>
                    <div className={`absolute -top-6 w-12 h-12 rounded-full border-4 border-[#0f172a] flex items-center justify-center font-black text-xl z-20 transition-transform group-hover:scale-110 ${isFirst ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900' : 'bg-slate-700 text-white'}`}>
                      #{athlete.rank}
                    </div>
                    
                    <div className={`${athlete.tier?.border || 'border-4 border-slate-700'} rounded-full mt-4 mb-4 shrink-0 transition-colors`}>
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-900 shadow-inner">
                        {athlete.avatar_url ? <img src={athlete.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Medal className={`w-10 h-10 ${medalColor}`} /></div>}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-white leading-tight mb-0.5 truncate w-full px-2 group-hover:text-blue-400 transition-colors">{athlete.first_name} {athlete.last_name}</h3>
                    
                    <div className="text-sm font-semibold text-slate-400 truncate w-full px-2 mb-2 flex flex-col gap-0.5">
                      <span>{athlete.high_school}</span>
                      <span className="text-xs font-medium opacity-80">
                        {athlete.school_size && `${athlete.school_size}`}
                        {athlete.school_size && athlete.conference && ' • '}
                        {athlete.conference && `${athlete.conference}`}
                      </span>
                    </div>
                    
                    <div className={`mt-auto w-full py-2 rounded-xl text-xs font-black tracking-widest uppercase mb-4 ${athlete.tier?.classes}`}>
                      {athlete.tier?.name}
                    </div>

                    <div className="absolute -bottom-5 bg-[#0f172a] border-2 border-slate-700 px-6 py-2 rounded-full font-black text-2xl text-white shadow-xl group-hover:border-blue-500/50 group-hover:text-blue-400 transition-colors">
                      {athlete.targetMark}
                    </div>
                  </Link>
                );
              })}
            </div>

            {theRest.length > 0 && (
              <div className="bg-slate-800/40 border border-slate-700 rounded-[2rem] overflow-hidden shadow-2xl">
                {theRest.map((athlete) => (
                  <Link href={`/athlete/${athlete.id}`} id={`athlete-${athlete.id}`} key={athlete.id} className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors last:border-0 group cursor-pointer scroll-mt-32">
                    <div className="flex items-center gap-4 sm:gap-6 w-1/2">
                      <span className="text-2xl font-black text-slate-500 w-8 text-center">{athlete.rank}</span>
                      
                      <div className={`${athlete.tier?.border || 'border border-slate-600'} rounded-full hidden sm:block shrink-0 transition-colors`}>
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-900">
                          {athlete.avatar_url ? <img src={athlete.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Activity className="w-5 h-5 text-slate-500" /></div>}
                        </div>
                      </div>
                      
                      <div className="truncate pr-4">
                        <h4 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors truncate">{athlete.first_name} {athlete.last_name}</h4>
                        <div className="flex items-center text-xs font-bold text-slate-400 truncate gap-1">
                          <span>{athlete.high_school}</span>
                          <span className="hidden lg:inline text-slate-600">•</span>
                          <span className="hidden lg:inline font-medium">
                            {athlete.school_size && `${athlete.school_size} `}
                            {athlete.conference && `${athlete.conference}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-8 justify-end">
                      {athlete.targetMeet && athlete.targetMeet.trim() !== '' && (
                        <span className="hidden lg:flex items-center text-xs font-medium text-slate-400 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3 mr-1 shrink-0" /> {athlete.targetMeet}
                        </span>
                      )}
                      <span className={`hidden sm:inline-block px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${athlete.tier?.classes}`}>
                        {athlete.tier?.name}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-white text-right w-24 group-hover:text-blue-400 transition-colors">{athlete.targetMark}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div></div>}>
      <LeaderboardContent />
    </Suspense>
  )
}