'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Swords, HelpCircle, Info, RefreshCw, Save, Activity } from 'lucide-react';
import { compileWrestlingFitScore } from '@/utils/WrestlingRecruitingEngine';

export interface WrestlingEditorProps {
  wrestlingStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function WrestlingEditor({ wrestlingStats, genderKey, onSync, showToast }: WrestlingEditorProps) {
  const currentLevel = wrestlingStats.level || 'Varsity Starter';
  
  const [level, setLevel] = useState(currentLevel);
  const [matches, setMatches] = useState<number>(wrestlingStats.metaContext?.matchesPlayed || 30);
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = wrestlingStats.metaContext?.rawTotals || {};
  const [winPct, setWinPct] = useState<string>(savedPayload.winPct?.toString() || '');
  const [takedowns, setTakedowns] = useState<string>(savedPayload.takedowns?.toString() || '');
  const [pins, setPins] = useState<string>(savedPayload.pins?.toString() || '');
  const [careerWins, setCareerWins] = useState<string>(savedPayload.careerWins?.toString() || '');

  useEffect(() => {
    if (!wrestlingStats.metaContext?.rawTotals) {
      setWinPct(''); setTakedowns(''); setPins(''); setCareerWins('');
    }
  }, [wrestlingStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const result: Record<string, number | null> = {
      winPct: winPct === '' ? null : parseFloat(winPct),
      takedowns: takedowns === '' ? null : parseFloat(takedowns),
      pins: pins === '' ? null : parseFloat(pins),
      careerWins: careerWins === '' ? null : parseFloat(careerWins),
    };
    return result;
  }, [winPct, takedowns, pins, careerWins]);

  const { compositeScore, analyticalTrace } = compileWrestlingFitScore(
    genderKey,
    level,
    matches,
    computedInputObject
  );

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const mockMetricsArray = analyticalTrace.map(t => ({
      name: t.metricLabel,
      value: t.perMatchRate?.toFixed(1) || '0'
    }));

    await onSync({
      level: level,
      metrics: mockMetricsArray,
      calculatedRating: compositeScore,
      metaContext: {
        matchesPlayed: matches,
        rawTotals: { winPct, takedowns, pins, careerWins }
      }
    });

    showToast("Wrestling performance profile mapped successfully!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
              <Swords className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Wrestling Dominance Engine</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Evaluates raw match volume against <strong className="text-rose-400">Aggression & Win Rate</strong> metrics.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Scout Power Target</span>
              <span className="text-xs font-black bg-gradient-to-r from-rose-400 to-red-400 bg-clip-text text-transparent">
                Dynamic Matrix Verified
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-xl shadow-lg shrink-0 shadow-rose-500/10">
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
            <option value="All-State / National">All-State / National Placer</option>
            <option value="Elite Club (ECNL / AAU / Next)">Fargo / Super 32 National Tier</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Total Matches Wrestled (Season Exposure)</label>
          <div className="relative">
            <input type="number" min="1" max="60" value={matches} onChange={e => setMatches(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white shadow-inner"/>
            <Activity className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Overall Win %
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-rose-400 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Winning percentage out of 100 (e.g. enter 85 for 85%).
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="number" placeholder="(Optional)" value={winPct} onChange={e => setWinPct(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-rose-500/50 transition-colors"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Total Takedowns
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-rose-400 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Total takedowns accumulated over the entire season.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="number" placeholder="(Optional)" value={takedowns} onChange={e => setTakedowns(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-rose-500/50 transition-colors"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Total Pins / Falls
          </label>
          <input type="number" placeholder="(Optional)" value={pins} onChange={e => setPins(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-rose-500/50 transition-colors"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Career Wins
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-rose-400 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Total varsity career wins across all seasons.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="number" placeholder="(Optional)" value={careerWins} onChange={e => setCareerWins(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-rose-500/50 transition-colors"/>
        </div>
      </div>

      <div className="pt-6 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-800/80 mt-6">
        <div className="w-full md:w-2/3">
          {analyticalTrace.length > 0 && (
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Calculated Per-Match Normalizations
              </h4>
              <div className="flex flex-wrap gap-2">
                {analyticalTrace.map((block, idx) => (
                  <div key={idx} className="bg-slate-950/90 border border-slate-900 p-2.5 rounded-xl flex flex-col text-[11px] flex-1 min-w-[120px]">
                    <span className="font-black text-slate-300 truncate">{block.metricLabel}</span>
                    <span className="text-slate-400 font-medium mt-1">Value: <strong className="text-white">{block.perMatchRate?.toFixed(2)}</strong></span>
                    <span className="text-[10px] font-bold text-rose-400 mt-0.5">Scout Yield: {block.calibratedScore}/99</span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}