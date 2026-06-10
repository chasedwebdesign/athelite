'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Target, Activity, HelpCircle, Info, RefreshCw, Save } from 'lucide-react';
import { compileBowlingFitScore } from '@/utils/BowlingRecruitingEngine';

export interface BowlingEditorProps {
  bowlingStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function BowlingEditor({ bowlingStats, genderKey, onSync, showToast }: BowlingEditorProps) {
  const currentLevel = bowlingStats.level || 'Varsity Starter';
  
  const [level, setLevel] = useState(currentLevel);
  const [games, setGames] = useState<number>(bowlingStats.metaContext?.gamesPlayed || 30);
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = bowlingStats.metaContext?.rawTotals || {};
  const [seasonAvg, setSeasonAvg] = useState<string>(savedPayload.seasonAvg?.toString() || '');
  const [highGame, setHighGame] = useState<string>(savedPayload.highGame?.toString() || '');
  const [highSeries, setHighSeries] = useState<string>(savedPayload.highSeries?.toString() || '');
  const [strikePct, setStrikePct] = useState<string>(savedPayload.strikePct?.toString() || '');
  const [sparePct, setSparePct] = useState<string>(savedPayload.sparePct?.toString() || '');

  useEffect(() => {
    if (!bowlingStats.metaContext?.rawTotals) {
      setSeasonAvg(''); setHighGame(''); setHighSeries(''); setStrikePct(''); setSparePct('');
    }
  }, [bowlingStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const result: Record<string, number | null> = {
      seasonAvg: seasonAvg === '' ? null : parseFloat(seasonAvg),
      highGame: highGame === '' ? null : parseFloat(highGame),
      highSeries: highSeries === '' ? null : parseFloat(highSeries),
      strikePct: strikePct === '' ? null : parseFloat(strikePct),
      sparePct: sparePct === '' ? null : parseFloat(sparePct),
    };
    return result;
  }, [seasonAvg, highGame, highSeries, strikePct, sparePct]);

  const { compositeScore, analyticalTrace } = compileBowlingFitScore(
    genderKey,
    level,
    games,
    computedInputObject
  );

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const mockMetricsArray = analyticalTrace.map(t => ({
      name: t.metricLabel,
      value: t.rawValue?.toString() || '0'
    }));

    await onSync({
      position: 'Bowler', // Fixed position
      level: level,
      metrics: mockMetricsArray,
      calculatedRating: compositeScore,
      metaContext: {
        gamesPlayed: games,
        rawTotals: { seasonAvg, highGame, highSeries, strikePct, sparePct }
      }
    });

    showToast("Bowling performance profile mapped successfully!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
              <Target className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Bowling Strike Engine</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Evaluates raw game volume against <strong className="text-cyan-400">Consistency & Conversion</strong> metrics.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Scout Power Target</span>
              <span className="text-xs font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Dynamic Matrix Verified
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-xl shadow-lg shrink-0 shadow-cyan-500/10">
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Competition Level Profile</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="JV / Dev Squad">JV / Dev Squad</option>
            <option value="Varsity Contributor">Varsity High School</option>
            <option value="Varsity Starter">Varsity Core Starter</option>
            <option value="All-Conference Tier">All-Conference / Regional Pool</option>
            <option value="All-State / National">All-State / National Qualifier</option>
            <option value="USBC Junior Gold / Elite">USBC Junior Gold / Elite Travel</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Total Games Bowled (Exposure)</label>
          <div className="relative">
            <input type="text" inputMode="numeric" value={games} onChange={e => setGames(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            <Activity className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-4 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Season Average
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Average score per game (Max 300).
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="text" inputMode="decimal" placeholder="(e.g. 215.4)" value={seasonAvg} onChange={e => setSeasonAvg(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-cyan-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            High Game
          </label>
          <input type="text" inputMode="decimal" placeholder="(Max 300)" value={highGame} onChange={e => setHighGame(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-cyan-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            High Series (3-Game)
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Standard 3-game series total (Max 900).
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="text" inputMode="decimal" placeholder="(Max 900)" value={highSeries} onChange={e => setHighSeries(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-cyan-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Strike %
          </label>
          <input type="text" inputMode="decimal" placeholder="(e.g. 58.5)" value={strikePct} onChange={e => setStrikePct(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-cyan-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Spare Conversion %
          </label>
          <input type="text" inputMode="decimal" placeholder="(e.g. 82.0)" value={sparePct} onChange={e => setSparePct(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-cyan-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>
      </div>

      <div className="pt-6 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-800/80 mt-6">
        <div className="w-full md:w-2/3">
          {analyticalTrace.length > 0 && (
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Calculated Normalizations
              </h4>
              <div className="flex flex-wrap gap-2">
                {analyticalTrace.map((block, idx) => (
                  <div key={idx} className="bg-slate-950/90 border border-slate-900 p-2.5 rounded-xl flex flex-col text-[11px] flex-1 min-w-[120px]">
                    <span className="font-black text-slate-300 truncate">{block.metricLabel}</span>
                    <span className="text-slate-400 font-medium mt-1">Value: <strong className="text-white">{block.rawValue?.toFixed(1)}</strong></span>
                    <span className="text-[10px] font-bold text-cyan-400 mt-0.5">Scout Yield: {block.calibratedScore}/99</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-auto self-stretch flex items-end">
          <button 
            onClick={handleManualSave}
            disabled={isSaving}
            className="w-full md:w-auto h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}