'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Activity, HelpCircle, Info, RefreshCw, Save, Target } from 'lucide-react';
import { compileIceHockeyFitScore, IceHockeyPositionGroup } from '@/utils/IceHockeyRecruitingEngine';

export interface IceHockeyEditorProps {
  hockeyStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function IceHockeyEditor({ hockeyStats, genderKey, onSync, showToast }: IceHockeyEditorProps) {
  const currentPos = (hockeyStats.position || 'Center') as IceHockeyPositionGroup;
  
  const [posGroup, setPosGroup] = useState<IceHockeyPositionGroup>(
    ['Center', 'Winger', 'Defenseman', 'Goaltender'].includes(currentPos) 
      ? currentPos 
      : 'Center'
  );
  
  const [level, setLevel] = useState(hockeyStats.level || 'Varsity Starter');
  const [games, setGames] = useState<number>(hockeyStats.metaContext?.gamesPlayed || 25);
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = hockeyStats.metaContext?.rawTotals || {};
  
  // Skater Stats
  const [goals, setGoals] = useState<string>(savedPayload.goals?.toString() || '');
  const [assists, setAssists] = useState<string>(savedPayload.assists?.toString() || '');
  const [plusMinus, setPlusMinus] = useState<string>(savedPayload.plusMinus?.toString() || '');

  // Goalie Stats
  const [savePct, setSavePct] = useState<string>(savedPayload.savePct?.toString() || '');
  const [gaa, setGaa] = useState<string>(savedPayload.gaa?.toString() || '');

  useEffect(() => {
    if (!hockeyStats.metaContext?.rawTotals) {
      setGoals(''); setAssists(''); setPlusMinus('');
      setSavePct(''); setGaa('');
    }
  }, [posGroup, hockeyStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const result: Record<string, number | null> = {};
    if (posGroup === 'Goaltender') {
      result.savePct = savePct === '' ? null : parseFloat(savePct);
      result.gaa = gaa === '' ? null : parseFloat(gaa);
    } else {
      result.goals = goals === '' ? null : parseFloat(goals);
      result.assists = assists === '' ? null : parseFloat(assists);
      result.plusMinus = plusMinus === '' ? null : parseFloat(plusMinus);
    }
    return result;
  }, [posGroup, goals, assists, plusMinus, savePct, gaa]);

  const { compositeScore, analyticalTrace } = compileIceHockeyFitScore(
    genderKey,
    posGroup,
    level,
    games,
    computedInputObject
  );

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const mockMetricsArray = analyticalTrace.map(t => ({
      name: t.metricLabel,
      value: t.perGameRate.toFixed(3).replace(/\.?0+$/, '') // Strip trailing zeros cleanly
    }));

    await onSync({
      position: posGroup,
      level: level,
      metrics: mockMetricsArray,
      calculatedRating: compositeScore,
      metaContext: {
        gamesPlayed: games,
        rawTotals: posGroup === 'Goaltender' 
          ? { savePct, gaa } 
          : { goals, assists, plusMinus }
      }
    });

    showToast("Ice Hockey performance log synchronized!", "success");
    setIsSaving(false);
  };

  const isGoalie = posGroup === 'Goaltender';

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <Target className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Ice Hockey Normalizer</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Engine evaluates volume relative to season length via <strong className="text-sky-400">Per-Game Normalization</strong>.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Scout Power Target</span>
              <span className="text-xs font-black bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                Dynamic Matrix Verified
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl shadow-lg shrink-0 shadow-sky-500/10">
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Tactical Position</label>
          <select value={posGroup} onChange={e => setPosGroup(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="Center">Center</option>
            <option value="Winger">Winger</option>
            <option value="Defenseman">Defenseman</option>
            <option value="Goaltender">Goaltender</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Club / Academy Tiers</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="JV / Dev Squad">JV / B-Level Club</option>
            <option value="Varsity Contributor">Varsity / A-Level Club</option>
            <option value="Varsity Starter">Varsity Core Starter / AA</option>
            <option value="All-Conference / Regional">All-Conference / Prep</option>
            <option value="All-State / National">All-State / National Auto-Bid</option>
            <option value="Elite Club (AAA / USHL / PWHL)">Elite Tier 1 (AAA / USHL / PWHL)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Games Played (Exposure)</label>
          <div className="relative">
            <input type="text" inputMode="numeric" value={games} onChange={e => setGames(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            <Activity className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 relative z-10">
        
        {isGoalie ? (
          <>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Save Percentage (SV%)
                <div className="relative group inline-block">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-sky-400 cursor-help transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                    Enter as a decimal (0.925) or percentage (92.5).
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              </label>
              <input type="text" inputMode="decimal" placeholder="(e.g. 0.920)" value={savePct} onChange={e => setSavePct(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-sky-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Goals Against Avg (GAA)
              </label>
              <input type="text" inputMode="decimal" placeholder="(e.g. 2.15)" value={gaa} onChange={e => setGaa(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-sky-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Total Goals (Season)
                <div className="relative group inline-block">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-sky-400 cursor-help transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                    Goals scored across the entire entered games duration.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              </label>
              <input type="text" inputMode="decimal" placeholder="(Optional)" value={goals} onChange={e => setGoals(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-sky-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Total Assists (Season)
              </label>
              <input type="text" inputMode="decimal" placeholder="(Optional)" value={assists} onChange={e => setAssists(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-sky-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Plus/Minus (+/-)
                <div className="relative group inline-block">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-sky-400 cursor-help transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                    Can be negative (e.g. -4).
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              </label>
              <input type="text" inputMode="decimal" placeholder="(Optional)" value={plusMinus} onChange={e => setPlusMinus(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-sky-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>
          </>
        )}
      </div>

      <div className="pt-6 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-800/80 mt-6">
        <div className="w-full md:w-2/3">
          {analyticalTrace.length > 0 && (
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Calculated Per-Game Normalizations
              </h4>
              <div className="flex flex-wrap gap-2">
                {analyticalTrace.map((block, idx) => (
                  <div key={idx} className="bg-slate-950/90 border border-slate-900 p-2.5 rounded-xl flex flex-col text-[11px] flex-1 min-w-[120px]">
                    <span className="font-black text-slate-300 truncate">{block.metricLabel}</span>
                    <span className="text-slate-400 font-medium mt-1">{isGoalie ? 'Logged' : 'Per Game'}: <strong className="text-white">{block.perGameRate.toFixed(2)}</strong></span>
                    <span className="text-[10px] font-bold text-sky-400 mt-0.5">Yield Index: {block.calibratedScore}/99</span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}