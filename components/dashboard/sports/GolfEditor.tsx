'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Flag, Activity, HelpCircle, Info, RefreshCw, Save } from 'lucide-react';
import { compileGolfFitScore, GolfPositionGroup } from '@/utils/GolfRecruitingEngine';

export interface GolfEditorProps {
  golfStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function GolfEditor({ golfStats, genderKey, onSync, showToast }: GolfEditorProps) {
  const [level, setLevel] = useState(golfStats.level || 'Varsity Starter');
  const [tournaments, setTournaments] = useState<number>(golfStats.metaContext?.tournamentsPlayed || 10);
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = golfStats.metaContext?.rawTotals || {};
  const [avg18, setAvg18] = useState<string>(savedPayload.avg18?.toString() || '');
  const [avg9, setAvg9] = useState<string>(savedPayload.avg9?.toString() || '');
  const [wins, setWins] = useState<string>(savedPayload.wins?.toString() || '');
  const [drive, setDrive] = useState<string>(savedPayload.drive?.toString() || '');

  useEffect(() => {
    if (!golfStats.metaContext?.rawTotals) {
      setAvg18(''); setAvg9(''); setWins(''); setDrive('');
    }
  }, [golfStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const result: Record<string, number | null> = {
      avg18: avg18 === '' ? null : parseFloat(avg18),
      avg9: avg9 === '' ? null : parseFloat(avg9),
      wins: wins === '' ? null : parseFloat(wins),
      drive: drive === '' ? null : parseFloat(drive),
    };
    return result;
  }, [avg18, avg9, wins, drive]);

  const { compositeScore, analyticalTrace } = compileGolfFitScore(
    genderKey,
    level,
    tournaments,
    computedInputObject
  );

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const mockMetricsArray = analyticalTrace.map(t => ({
      name: t.metricLabel,
      value: t.rawValue.toString()
    }));

    await onSync({
      position: 'Golfer', // Fixed position since everyone is a golfer
      level: level,
      metrics: mockMetricsArray,
      calculatedRating: compositeScore,
      metaContext: {
        tournamentsPlayed: tournaments,
        rawTotals: { avg18, avg9, wins, drive }
      }
    });

    showToast("Golf metrics verified and secured!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500">
              <Flag className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Golf Course Normalizer</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Engine evaluates <strong className="text-emerald-500">Scoring Consistency</strong> across standardized distances.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Scout Power Target</span>
              <span className="text-xs font-black bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                Dynamic Matrix Verified
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl shadow-lg shrink-0 shadow-emerald-500/10">
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Competition / Course Tier</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="JV / Dev Squad">JV / Dev Squad (Local Munis)</option>
            <option value="Varsity Contributor">Varsity Contributor</option>
            <option value="Varsity Starter">Varsity Core Starter</option>
            <option value="All-Conference Tier">All-Conference / Regional</option>
            <option value="All-State / National">All-State / National</option>
            <option value="Elite Club (AJGA / Junior Am)">Elite Tour (AJGA / Junior Am)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Tournaments Played (Consistency Rating)</label>
          <div className="relative">
            <input type="text" inputMode="numeric" value={tournaments} onChange={e => setTournaments(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            <Activity className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            18-Hole Average
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-500 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Your average score across 18 holes in verified competition.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="text" inputMode="decimal" placeholder="(e.g. 74.2)" value={avg18} onChange={e => setAvg18(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-emerald-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            9-Hole Average
          </label>
          <input type="text" inputMode="decimal" placeholder="(e.g. 36.8)" value={avg9} onChange={e => setAvg9(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-emerald-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Avg. Driving Distance (Yds)
          </label>
          <input type="text" inputMode="decimal" placeholder="(Optional)" value={drive} onChange={e => setDrive(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-emerald-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Total Wins
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-500 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Total varsity or club tournament wins.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="text" inputMode="decimal" placeholder="(Optional)" value={wins} onChange={e => setWins(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-emerald-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>
      </div>

      <div className="pt-6 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-800/80 mt-6">
        <div className="w-full md:w-2/3">
          {analyticalTrace.length > 0 && (
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Normalization Telemetry
              </h4>
              <div className="flex flex-wrap gap-2">
                {analyticalTrace.map((block, idx) => (
                  <div key={idx} className="bg-slate-950/90 border border-slate-900 p-2.5 rounded-xl flex flex-col text-[11px] flex-1 min-w-[120px]">
                    <span className="font-black text-slate-300 truncate">{block.metricLabel}</span>
                    <span className="text-slate-400 font-medium mt-1">Logged: <strong className="text-white">{block.rawValue}</strong></span>
                    <span className="text-[10px] font-bold text-emerald-500 mt-0.5">Yield Index: {block.calibratedScore}/99</span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}