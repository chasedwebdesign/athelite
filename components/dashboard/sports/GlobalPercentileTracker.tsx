'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  AlertCircle, 
  Sparkles,
  RefreshCw,
  Trophy
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
  const [rankCategory, setRankCategory] = useState({
    title: 'Unranked', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', glow: '', bar: 'bg-slate-500'
  });

  useEffect(() => {
    let isMounted = true;

    const fetchPercentileData = async () => {
      setLoading(true);
      setError(null);

      try {
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

        if (isMounted && data) {
          const verifiedPool = data.filter((record: any) => 
            record.athletes && record.athletes.trust_level === 1
          );

          const totalPoolSize = verifiedPool.length;

          if (totalPoolSize <= 1) {
            setPercentile(100);
          } else {
            const scores: number[] = verifiedPool.map((r: any) => Number(r.custom_fit_score) || 0);
            
            const strictlyBelow = scores.filter((s: number) => s < currentScore).length;
            const equalTo = scores.filter((s: number) => s === currentScore).length;
            
            const rawPercentile = ((strictlyBelow + (0.5 * equalTo)) / totalPoolSize) * 100;
            setPercentile(Math.round(rawPercentile));
          }
        }
      } catch (err: any) {
        console.error("Percentile Engine Error:", err.message);
        if (isMounted) setError("Failed to sync matrix.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (athleteId && sportName) {
      fetchPercentileData();
    }

    return () => { isMounted = false; };
  }, [athleteId, sportName, currentScore]); 

  // Gamified Engine Theme Allocation
  useEffect(() => {
    if (percentile >= 95) {
      setRankCategory({ title: 'Legend', color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/50', glow: 'shadow-[0_0_20px_rgba(217,70,239,0.2)]', bar: 'bg-fuchsia-500' });
    } else if (percentile >= 85) {
      setRankCategory({ title: 'Champion', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/50', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]', bar: 'bg-purple-500' });
    } else if (percentile >= 70) {
      setRankCategory({ title: 'Elite', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/50', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]', bar: 'bg-blue-500' });
    } else if (percentile >= 50) {
      setRankCategory({ title: 'Pro', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.1)]', bar: 'bg-emerald-500' });
    } else {
      setRankCategory({ title: 'Contender', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/50', glow: 'shadow-[0_0_10px_rgba(245,158,11,0.05)]', bar: 'bg-amber-500' });
    }
  }, [percentile]);

  if (loading) {
    return (
      <div className="w-full max-w-sm bg-slate-900/40 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
          <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
        </div>
        <div className="flex-1 space-y-2 pr-2">
          <div className="h-2.5 w-24 bg-slate-800 rounded"></div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-sm bg-red-950/20 border border-red-900/50 rounded-2xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-900/30 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-red-400">{error}</p>
      </div>
    );
  }

  const topPercent = Math.max(1, 100 - percentile);

  return (
    <div className={`relative w-full max-w-sm bg-slate-900/60 backdrop-blur-xl border ${rankCategory.border} rounded-2xl p-3 flex items-center gap-4 group transition-all duration-500 ${rankCategory.glow}`}>
      
      {/* Dynamic Icon Box */}
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${rankCategory.bg} ${rankCategory.border}`}>
        <Trophy className={`w-5 h-5 ${rankCategory.color}`} />
      </div>

      <div className="flex-1 pr-1 min-w-0">
        <div className="flex justify-between items-end mb-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className={`text-[10px] font-black uppercase tracking-widest truncate ${rankCategory.color}`}>
              {rankCategory.title} Tier
            </span>
            {percentile >= 90 && <Sparkles className={`w-3 h-3 shrink-0 ${rankCategory.color} animate-pulse`} />}
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-300 shrink-0 ml-2">
            Top {topPercent}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/50">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out relative ${rankCategory.bar}`}
            style={{ width: `${percentile}%` }}
          >
             {/* Shimmer Effect */}
             <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}