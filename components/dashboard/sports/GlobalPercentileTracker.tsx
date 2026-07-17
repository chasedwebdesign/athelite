'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Globe, 
  TrendingUp, 
  Trophy, 
  Activity, 
  AlertCircle, 
  Sparkles,
  RefreshCw,
  Target
} from 'lucide-react';

interface GlobalPercentileTrackerProps {
  athleteId: string;
  sportName: string;
  currentScore: number;
}

export default function GlobalPercentileTracker({ 
  athleteId, 
  sportName, 
  currentScore 
}: GlobalPercentileTrackerProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Metrics State
  const [percentile, setPercentile] = useState<number>(0);
  const [totalVerified, setTotalVerified] = useState<number>(0);
  const [rankCategory, setRankCategory] = useState<{
    title: string;
    color: string;
    bg: string;
    border: string;
    glow: string;
    stroke: string;
  }>({
    title: 'Unranked', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', glow: '', stroke: 'text-slate-600'
  });

  useEffect(() => {
    let isMounted = true;

    const fetchPercentileData = async () => {
      setLoading(true);
      setError(null);

      try {
        // To avoid complex Supabase syntax errors, we fetch the relational data and do the heavy math in JS
        // athlete_sports.athlete_id references athletes.id
        const { data, error: fetchError } = await supabase
          .from('athlete_sports')
          .select(`
            custom_fit_score,
            athletes!inner(
              id,
              trust_level
            )
          `)
          .eq('sport_name', sportName)
          .eq('is_active', true);

        if (fetchError) throw fetchError;

        if (isMounted) {
          // 1. JS Array Parsing: Filter strictly for verified athletes (trust_level === 1)
          const verifiedPool = data.filter((record: any) => 
            record.athletes && record.athletes.trust_level === 1
          );

          const totalPoolSize = verifiedPool.length;
          setTotalVerified(totalPoolSize);

          if (totalPoolSize <= 1) {
            // If the user is the only verified athlete or pool is empty
            setPercentile(100);
          } else {
            // 2. JS Math: Calculate standard competitive percentile
            // Percentile Formula: ((Strictly Below + (0.5 * Equal)) / Total) * 100
            const scores = verifiedPool.map((r: any) => r.custom_fit_score || 0);
            const strictlyBelow = scores.filter(s => s < currentScore).length;
            const equalTo = scores.filter(s => s === currentScore).length;
            
            const rawPercentile = ((strictlyBelow + (0.5 * equalTo)) / totalPoolSize) * 100;
            setPercentile(Math.round(rawPercentile));
          }
        }
      } catch (err: any) {
        console.error("Percentile Engine Error:", err.message);
        if (isMounted) setError("Failed to synchronize with global leaderboards.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (athleteId && sportName) {
      fetchPercentileData();
    }

    return () => { isMounted = false; };
  }, [athleteId, sportName, currentScore, supabase]);

  // Gamified Engine Theme Allocation
  useEffect(() => {
    if (percentile >= 95) {
      setRankCategory({ title: 'Legend', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/50', glow: 'shadow-[0_0_30px_rgba(217,70,239,0.3)]', stroke: 'text-fuchsia-500' });
    } else if (percentile >= 85) {
      setRankCategory({ title: 'Champion', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/50', glow: 'shadow-[0_0_25px_rgba(168,85,247,0.25)]', stroke: 'text-purple-500' });
    } else if (percentile >= 70) {
      setRankCategory({ title: 'Elite', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/50', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]', stroke: 'text-blue-500' });
    } else if (percentile >= 50) {
      setRankCategory({ title: 'Pro', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]', stroke: 'text-emerald-500' });
    } else {
      setRankCategory({ title: 'Contender', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/50', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]', stroke: 'text-amber-500' });
    }
  }, [percentile]);

  // SVG Circular Math
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentile / 100) * circumference;

  if (loading) {
    return (
      <div className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-6 flex flex-col items-center justify-center min-h-[160px]">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mb-3" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Querying Global Matrix...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-950/20 border border-red-900/50 rounded-[2rem] p-6 flex flex-col items-center justify-center min-h-[160px] text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mb-3 drop-shadow-md" />
        <p className="text-xs font-black uppercase tracking-widest text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full bg-slate-900/60 backdrop-blur-xl border ${rankCategory.border} rounded-[2rem] p-6 sm:p-8 overflow-hidden group transition-all duration-500 ${rankCategory.glow}`}>
      {/* Background Ambient FX */}
      <div className={`absolute top-[-20%] right-[-10%] w-48 h-48 rounded-full blur-[60px] pointer-events-none opacity-40 transition-colors duration-700 ${rankCategory.bg.replace('/10', '')}`}></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Info & Gamified Titles */}
        <div className="flex-1 text-center sm:text-left w-full">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <Globe className="w-4 h-4 text-slate-400" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Verified Global Database
            </h3>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1 flex items-center justify-center sm:justify-start gap-3">
            Top {100 - percentile}%
            {percentile >= 90 && <Sparkles className={`w-5 h-5 ${rankCategory.color} animate-pulse`} />}
          </h2>
          
          <p className="text-sm font-medium text-slate-400 mb-5 leading-relaxed max-w-sm">
            Your recruit rating currently outranks <strong className="text-white">{percentile}%</strong> of the <strong className="text-white">{totalVerified}</strong> verified {sportName} athletes on the platform.
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-3">
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-widest shadow-sm ${rankCategory.bg} ${rankCategory.color} ${rankCategory.border}`}>
              <Trophy className="w-3.5 h-3.5" />
              {rankCategory.title} Tier
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-slate-300">
              <Activity className="w-3.5 h-3.5" /> Score: {currentScore}
            </span>
          </div>
        </div>

        {/* Right Side: Animated SVG Meter */}
        <div className="relative shrink-0 flex items-center justify-center drop-shadow-xl">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Meter Background */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-slate-800"
            />
            {/* Meter Foreground Glow */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`${rankCategory.stroke} opacity-30 blur-[4px]`}
            />
            {/* Meter Foreground Line */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`${rankCategory.stroke} transition-all duration-1000 ease-out`}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <Target className={`w-6 h-6 mb-1 ${rankCategory.color}`} />
            <span className="text-xl font-black text-white leading-none">{percentile}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">PCTL</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}