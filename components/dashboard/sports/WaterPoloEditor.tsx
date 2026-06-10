'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Droplets, Activity, HelpCircle, Info, RefreshCw, Save } from 'lucide-react';
import { compileWaterPoloFitScore, WaterPoloPositionGroup } from '@/utils/WaterPoloRecruitingEngine';

export interface WaterPoloEditorProps {
  waterPoloStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function WaterPoloEditor({ waterPoloStats, genderKey, onSync, showToast }: WaterPoloEditorProps) {
  const currentPos = (waterPoloStats.position || 'Driver') as WaterPoloPositionGroup;
  
  const [posGroup, setPosGroup] = useState<WaterPoloPositionGroup>(
    ['Driver', 'Utility', 'Center Forward (2M Attack)', 'Center Defender (2M Guard)', 'Goalkeeper'].includes(currentPos) 
      ? currentPos 
      : 'Driver'
  );
  
  const [level, setLevel] = useState(waterPoloStats.level || 'Varsity Starter');
  const [games, setGames] = useState<number>(waterPoloStats.metaContext?.gamesPlayed || 20);
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = waterPoloStats.metaContext?.rawTotals || {};
  
  // Field Player Stats
  const [goals, setGoals] = useState<string>(savedPayload.goals?.toString() || '');
  const [assists, setAssists] = useState<string>(savedPayload.assists?.toString() || '');
  const [steals, setSteals] = useState<string>(savedPayload.steals?.toString() || '');
  const [sprints, setSprints] = useState<string>(savedPayload.sprints?.toString() || '');

  // Goalie Stats
  const [saves, setSaves] = useState<string>(savedPayload.saves?.toString() || '');
  const [savePct, setSavePct] = useState<string>(savedPayload.savePct?.toString() || '');

  useEffect(() => {
    if (!waterPoloStats.metaContext?.rawTotals) {
      setGoals(''); setAssists(''); setSteals(''); setSprints('');
      setSaves(''); setSavePct('');
    }
  }, [posGroup, waterPoloStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const result: Record<string, number | null> = {};
    if (posGroup === 'Goalkeeper') {
      result.saves = saves === '' ? null : parseFloat(saves);
      result.savePct = savePct === '' ? null : parseFloat(savePct);
    } else {
      result.goals = goals === '' ? null : parseFloat(goals);
      result.assists = assists === '' ? null : parseFloat(assists);
      result.steals = steals === '' ? null : parseFloat(steals);
      result.sprints = sprints === '' ? null : parseFloat(sprints);
    }
    return result;
  }, [posGroup, goals, assists, steals, sprints, saves, savePct]);

  const { compositeScore, analyticalTrace } = compileWaterPoloFitScore(
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
      value: t.perGameRate.toFixed(2).replace(/\.?0+$/, '')
    }));

    await onSync({
      position: posGroup,
      level: level,
      metrics: mockMetricsArray,
      calculatedRating: compositeScore,
      metaContext: {
        gamesPlayed: games,
        rawTotals: posGroup === 'Goalkeeper' 
          ? { saves, savePct } 
          : { goals, assists, steals, sprints }
      }
    });

    showToast("Water Polo performance logged successfully!", "success");
    setIsSaving(false);
  };

  const isGoalie = posGroup === 'Goalkeeper';

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20 text-teal-400">
              <Droplets className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Water Polo Index</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Engine normalizes raw stats into <strong className="text-teal-400">Per-Game Efficiencies</strong>.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Scout Power Target</span>
              <span className="text-xs font-black bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Dynamic Matrix Verified
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-xl shadow-lg shrink-0 shadow-teal-500/10">
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Pool Position Assignment</label>
          <select value={posGroup} onChange={e => setPosGroup(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="Driver">Driver / Attacker</option>
            <option value="Utility">Utility</option>
            <option value="Center Forward (2M Attack)">Center Forward (2M Attack)</option>
            <option value="Center Defender (2M Guard)">Center Defender (2M Guard)</option>
            <option value="Goalkeeper">Goalkeeper</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Club / Academy Tiers</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="JV / Dev Squad">JV / Dev Squad</option>
            <option value="Varsity Contributor">Varsity High School</option>
            <option value="Varsity Starter">Varsity Core Starter</option>
            <option value="All-Conference / Regional">All-Conference / Regional</option>
            <option value="All-State / National">All-State / National</option>
            <option value="Elite Club (ODP / Junior Olympics)">Elite Club (ODP / Junior Olympics)</option>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 relative z-10">
        
        {isGoalie ? (
          <>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Total Saves (Season)
                <div className="relative group inline-block">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-teal-400 cursor-help transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                    Sum of all verified saves over the stated games played.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              </label>
              <input type="text" inputMode="decimal" placeholder="(e.g. 180)" value={saves} onChange={e => setSaves(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-teal-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Save Percentage
                <div className="relative group inline-block">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-teal-400 cursor-help transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                    Enter as decimal (0.55) or percent (55).
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              </label>
              <input type="text" inputMode="decimal" placeholder="(e.g. 0.58)" value={savePct} onChange={e => setSavePct(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-teal-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Total Goals
              </label>
              <input type="text" inputMode="decimal" placeholder="(Optional)" value={goals} onChange={e => setGoals(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-teal-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Total Assists
              </label>
              <input type="text" inputMode="decimal" placeholder="(Optional)" value={assists} onChange={e => setAssists(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-teal-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Total Steals
              </label>
              <input type="text" inputMode="decimal" placeholder="(Optional)" value={steals} onChange={e => setSteals(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-teal-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Sprints Won
              </label>
              <input type="text" inputMode="decimal" placeholder="(Optional)" value={sprints} onChange={e => setSprints(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-teal-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
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
                    <span className="text-slate-400 font-medium mt-1">Value: <strong className="text-white">{block.perGameRate.toFixed(2)}</strong></span>
                    <span className="text-[10px] font-bold text-teal-400 mt-0.5">Yield Index: {block.calibratedScore}/99</span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}