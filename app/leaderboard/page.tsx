'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trophy, Medal, MapPin, Activity, Target, ChevronDown, TrendingUp, Zap } from 'lucide-react';

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  high_school: string;
  state: string;
  grad_year: number;
  trust_level: number;
  avatar_url?: string | null;
  prs: { event: string; mark: string; date?: string; meet?: string }[];
  rank?: number;
  tier?: { name: string; classes: string };
  targetMark?: string;
  targetMeet?: string; // NEW: Added targetMeet to extract the meet location
  improvementDelta?: number;
}

const FILTER_EVENTS = [
  '100 Meters', '200 Meters', '400 Meters', '800 Meters', '1500 Meters', '1600 Meters', 
  '1 Mile', '3000 Meters', '3200 Meters', '5000 Meters', '100m Hurdles', '110m Hurdles', '300m Hurdles', 
  '400m Hurdles', 'Shot Put', 'Discus', 'Javelin', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'
];

const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

export default function LeaderboardPage() {
  const supabase = createClient();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('100 Meters');
  const [selectedScope, setSelectedScope] = useState('National');
  const [leaderboardMode, setLeaderboardMode] = useState<'overall' | 'improvement'>('overall');

  useEffect(() => {
    async function fetchAthletes() {
      const { data } = await supabase.from('athletes').select('*').gt('trust_level', 0);
      if (data) setAthletes(data as Athlete[]);
      setLoading(false);
    }
    fetchAthletes();
  }, [supabase]);

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
    let filtered = athletes.filter(a => {
      const hasEvent = a.prs?.some(pr => pr.event === selectedEvent);
      const matchesScope = selectedScope === 'National' || a.state === selectedScope;
      return hasEvent && matchesScope;
    });

    filtered.forEach(a => {
      const eventMarks = a.prs.filter(pr => pr.event === selectedEvent);
      a.targetMark = eventMarks[0]?.mark || '';
      a.targetMeet = eventMarks[0]?.meet || ''; // Extract the meet name!
      
      if (eventMarks.length > 1) {
        const newestVal = parseMarkForSorting(eventMarks[0].mark, selectedEvent);
        const oldestVal = parseMarkForSorting(eventMarks[eventMarks.length - 1].mark, selectedEvent);
        a.improvementDelta = Math.abs(oldestVal - newestVal); 
      } else {
        a.improvementDelta = 0;
      }
    });

    filtered.sort((a, b) => {
      if (leaderboardMode === 'improvement') {
        return (b.improvementDelta || 0) - (a.improvementDelta || 0);
      } else {
        const valA = parseMarkForSorting(a.targetMark!, selectedEvent);
        const valB = parseMarkForSorting(b.targetMark!, selectedEvent);
        return valA - valB;
      }
    });

    const total = filtered.length;
    filtered.forEach((athlete, index) => {
      athlete.rank = index + 1;
      const percentile = index / total;

      // THE REGAL RANKING SYSTEM
      if (percentile <= 0.01 || index === 0) {
        athlete.tier = { name: 'LEGEND', classes: 'legend-badge' };
      } else if (percentile <= 0.05) {
        athlete.tier = { name: 'GRANDMASTER', classes: 'bg-slate-900 text-slate-100 border border-slate-700 shadow-md' };
      } else if (percentile <= 0.15) {
        athlete.tier = { name: 'MASTER', classes: 'bg-purple-100 text-purple-800 border border-purple-300' };
      } else if (percentile <= 0.30) {
        athlete.tier = { name: 'ELITE', classes: 'bg-blue-100 text-blue-800 border border-blue-300' };
      } else if (percentile <= 0.50) {
        athlete.tier = { name: 'CONTENDER', classes: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
      } else if (percentile <= 0.75) {
        athlete.tier = { name: 'CHALLENGER', classes: 'bg-orange-100 text-orange-800 border border-orange-300' };
      } else {
        athlete.tier = { name: 'PROSPECT', classes: 'bg-slate-100 text-slate-600 border border-slate-300' };
      }
    });

    return filtered;
  };

  const rankedAthletes = getRankedAthletes();
  const topThree = rankedAthletes.slice(0, 3);
  const theRest = rankedAthletes.slice(3);
  const availableStates = Array.from(new Set(athletes.map(a => a.state).filter(Boolean))).sort();

  return (
    <main className="min-h-screen bg-[#0f172a] font-sans pb-32 selection:bg-blue-500/30">
      
      {/* CUSTOM CSS FOR THE LEGEND SHIMMER */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .legend-badge {
          background: linear-gradient(90deg, #FFDF00 0%, #FFF8B0 20%, #FFDF00 40%, #FFF8B0 60%, #FFDF00 80%);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          color: #714200;
          border: 1px solid #FDE047;
          box-shadow: 0 0 15px rgba(253, 224, 71, 0.4);
          font-weight: 900;
        }
      `}} />

      <div className="relative pt-20 pb-12 px-6 text-center border-b border-slate-800 bg-gradient-to-b from-slate-900 to-[#0f172a] overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-blue-400 text-sm font-bold tracking-widest uppercase mb-6 shadow-sm">
            <Trophy className="w-4 h-4 mr-2" /> Global PR League
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-8">
            The Leaderboards
          </h1>

          <div className="flex bg-slate-800/80 p-1.5 rounded-2xl mb-8 max-w-md mx-auto border border-slate-700/50 backdrop-blur-sm">
            <button onClick={() => setLeaderboardMode('overall')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${leaderboardMode === 'overall' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              <Trophy className="w-4 h-4 mr-2"/> Overall PRs
            </button>
            <button onClick={() => setLeaderboardMode('improvement')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${leaderboardMode === 'improvement' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              <TrendingUp className="w-4 h-4 mr-2"/> Improvement
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-slate-800/50 p-4 rounded-3xl border border-slate-700 backdrop-blur-md max-w-2xl mx-auto">
            <div className="relative w-full sm:w-1/2">
              <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-2xl pl-6 pr-10 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold appearance-none cursor-pointer">
                {FILTER_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative w-full sm:w-1/2">
              <select value={selectedScope} onChange={(e) => setSelectedScope(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-2xl pl-6 pr-10 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold appearance-none cursor-pointer">
                <option value="National">🇺🇸 National Overall</option>
                {availableStates.map(state => <option key={state} value={state}>State: {state}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
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
            <h3 className="text-2xl font-black text-white mb-2">No data yet</h3>
            <p className="text-slate-400 font-medium">Be the first athlete to sync a PR for this event!</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 items-end">
              {topThree.map((athlete, idx) => {
                const isFirst = idx === 0;
                const podiumHeight = isFirst ? 'h-[360px]' : idx === 1 ? 'h-[300px]' : 'h-[260px]';
                const medalColor = isFirst ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : 'text-amber-600';
                
                return (
                  <div key={athlete.id} className={`relative bg-slate-800/50 rounded-[2rem] border border-slate-700 flex flex-col items-center justify-start p-6 text-center shadow-2xl transition-transform hover:-translate-y-2 ${podiumHeight} ${isFirst ? 'md:-translate-y-8 border-blue-500/50 bg-slate-800 shadow-blue-900/50' : ''}`}>
                    <div className={`absolute -top-6 w-12 h-12 rounded-full border-4 border-[#0f172a] flex items-center justify-center font-black text-xl z-20 ${isFirst ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900' : 'bg-slate-700 text-white'}`}>
                      #{athlete.rank}
                    </div>
                    
                    <div className="w-24 h-24 rounded-full border-4 border-slate-700 overflow-hidden bg-slate-900 mt-4 mb-4 shadow-inner shrink-0">
                      {athlete.avatar_url ? <img src={athlete.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Medal className={`w-10 h-10 ${medalColor}`} /></div>}
                    </div>
                    
                    <h3 className="text-xl font-black text-white leading-tight mb-0.5 truncate w-full px-2">
                      {athlete.first_name} {athlete.last_name}
                    </h3>
                    
                    {/* Combine High School & State */}
                    <div className="text-sm font-semibold text-slate-300 truncate w-full px-2 mb-1">
                      {athlete.high_school}{athlete.state ? `, ${athlete.state}` : ''}
                    </div>
                    
                    {/* THE NEW MEET LOCATION PIN */}
                    <div className="flex items-center justify-center text-xs font-bold text-slate-400 mb-4 w-full px-4">
                      {athlete.targetMeet ? (
                        <>
                          <MapPin className="w-3.5 h-3.5 mr-1 shrink-0 text-blue-400" />
                          <span className="truncate" title={athlete.targetMeet}>{athlete.targetMeet}</span>
                        </>
                      ) : (
                        <span className="h-4"></span> // Spacer if meet is somehow missing
                      )}
                    </div>
                    
                    <div className={`mt-auto w-full py-2 rounded-xl text-xs font-black tracking-widest uppercase ${athlete.tier?.classes}`}>
                      {athlete.tier?.name}
                    </div>

                    <div className="absolute -bottom-5 bg-[#0f172a] border-2 border-slate-700 px-6 py-2 rounded-full font-black text-2xl text-white shadow-xl">{athlete.targetMark}</div>
                  </div>
                );
              })}
            </div>

            {theRest.length > 0 && (
              <div className="bg-slate-800/40 border border-slate-700 rounded-[2rem] overflow-hidden shadow-2xl">
                {theRest.map((athlete) => (
                  <div key={athlete.id} className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors last:border-0 group">
                    <div className="flex items-center gap-4 sm:gap-6 w-1/2">
                      <span className="text-2xl font-black text-slate-500 w-8 text-center">{athlete.rank}</span>
                      <div className="w-12 h-12 rounded-full border border-slate-600 overflow-hidden bg-slate-900 hidden sm:block shrink-0">
                        {athlete.avatar_url ? <img src={athlete.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Activity className="w-5 h-5 text-slate-500" /></div>}
                      </div>
                      <div className="truncate pr-4">
                        <h4 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors truncate">{athlete.first_name} {athlete.last_name}</h4>
                        <div className="flex items-center text-xs font-bold text-slate-400 truncate">
                          {athlete.high_school}{athlete.state ? `, ${athlete.state}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-8 justify-end">
                      {/* Show the Meet in the list view too! */}
                      {athlete.targetMeet && (
                        <span className="hidden lg:flex items-center text-xs font-medium text-slate-400 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3 mr-1 shrink-0" /> {athlete.targetMeet}
                        </span>
                      )}
                      <span className={`hidden sm:inline-block px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${athlete.tier?.classes}`}>
                        {athlete.tier?.name}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-white text-right w-24">{athlete.targetMark}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}