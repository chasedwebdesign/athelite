'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Activity, HelpCircle, Info, RefreshCw, Save } from 'lucide-react';
import { compileVolleyballFitScore, VolleyballPositionGroup } from '@/utils/VolleyballRecruitingEngine';

export interface VolleyballEditorProps {
  volleyballStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function VolleyballEditor({ volleyballStats, genderKey, onSync, showToast }: VolleyballEditorProps) {
  const currentPos = (volleyballStats.position || 'Outside Hitter (OH)') as VolleyballPositionGroup;
  
  const [posGroup, setPosGroup] = useState<VolleyballPositionGroup>(['Setter (S)','Outside Hitter (OH)','Opposite Hitter (OPP)','Middle Blocker (MB)','Libero / Defensive Specialist (L/DS)'].includes(currentPos) ? currentPos : 'Outside Hitter (OH)');
  const [level, setLevel] = useState(volleyballStats.level || 'Varsity Starter');
  const [sets, setSets] = useState<number>(volleyballStats.metaContext?.setsPlayed || 60);
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = volleyballStats.metaContext?.rawTotals || {};
  const [kills, setKills] = useState<string>(savedPayload.kills?.toString() || '');
  const [assists, setAssists] = useState<string>(savedPayload.assists?.toString() || '');
  const [digs, setDigs] = useState<string>(savedPayload.digs?.toString() || '');
  const [blocks, setBlocks] = useState<string>(savedPayload.blocks?.toString() || '');
  const [aces, setAces] = useState<string>(savedPayload.aces?.toString() || '');
  const [hittingPct, setHittingPct] = useState<string>(savedPayload.hittingPct?.toString() || '');

  useEffect(() => {
    if (!volleyballStats.metaContext?.rawTotals) {
      setKills(''); setAssists(''); setDigs(''); setBlocks(''); setAces(''); setHittingPct('');
    }
  }, [posGroup, volleyballStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const result: Record<string, number | null> = {
      kills: kills === '' ? null : parseFloat(kills),
      assists: assists === '' ? null : parseFloat(assists),
      digs: digs === '' ? null : parseFloat(digs),
      blocks: blocks === '' ? null : parseFloat(blocks),
      aces: aces === '' ? null : parseFloat(aces),
      hittingPct: hittingPct === '' ? null : parseFloat(hittingPct),
    };
    return result;
  }, [kills, assists, digs, blocks, aces, hittingPct]);

  const { compositeScore, analyticalTrace } = compileVolleyballFitScore(
    genderKey,
    posGroup,
    level,
    sets,
    computedInputObject
  );

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const mockMetricsArray = analyticalTrace.map(t => ({
      name: t.metricLabel,
      value: t.perSetRate.toFixed(2)
    }));

    await onSync({
      position: posGroup,
      level: level,
      metrics: mockMetricsArray,
      calculatedRating: compositeScore,
      metaContext: {
        setsPlayed: sets,
        rawTotals: { kills, assists, digs, blocks, aces, hittingPct }
      }
    });

    showToast("Volleyball profile metrics updated successfully!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400">
              <Activity className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Volleyball Scouting Matrix</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Dynamic calculations scaling unweighted <strong className="text-orange-400">Per-Set performance indexes</strong>.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Scout Power Target</span>
              <span className="text-xs font-black bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Dynamic Matrix Verified
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-xl shadow-lg shrink-0 shadow-orange-500/10">
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Tactical Court Position</label>
          <select value={posGroup} onChange={e => setPosGroup(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="Setter (S)">Setter (S)</option>
            <option value="Outside Hitter (OH)">Outside Hitter (OH)</option>
            <option value="Opposite Hitter (OPP)">Opposite Hitter (OPP)</option>
            <option value="Middle Blocker (MB)">Middle Blocker (MB)</option>
            <option value="Libero / Defensive Specialist (L/DS)">Libero / DS (L/DS)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Club Tournament Tier</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="JV / Dev Squad">JV / Dev Squad</option>
            <option value="Varsity Contributor">Varsity High School</option>
            <option value="Varsity Starter">Varsity Core Starter</option>
            <option value="All-Conference Tier">All-Conference Pool</option>
            <option value="Elite Club (ECNL / AAU / Next)">National Club Travel (AAU Open)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Sets Played (Total)</label>
          <div className="relative">
            <input type="number" min="1" max="150" value={sets} onChange={e => setSets(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white shadow-inner"/>
            <Activity className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-4 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Total Kills
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-orange-400 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Total attacking points scored by striking the ball into the opponent's court.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="number" placeholder="(Optional)" value={kills} onChange={e => setKills(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-orange-500/50 transition-colors"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Total Assists
          </label>
          <input type="number" placeholder="(Optional)" value={assists} onChange={e => setAssists(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-orange-500/50 transition-colors"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Total Digs
          </label>
          <input type="number" placeholder="(Optional)" value={digs} onChange={e => setDigs(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-orange-500/50 transition-colors"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Total Blocks
          </label>
          <input type="number" placeholder="(Optional)" value={blocks} onChange={e => setBlocks(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-orange-500/50 transition-colors"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Service Aces
          </label>
          <input type="number" placeholder="(Optional)" value={aces} onChange={e => setAces(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-orange-500/50 transition-colors"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Hitting %
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-orange-400 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Attack efficiency index computed out of 100 (e.g. enter 32 for .320 Hitting %).
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="number" step="0.1" placeholder="(Optional)" value={hittingPct} onChange={e => setHittingPct(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-orange-500/50 transition-colors"/>
        </div>
      </div>

      <div className="pt-6 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-800/80 mt-6">
        <div className="w-full md:w-2/3">
          {analyticalTrace.length > 0 && (
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Calculated Per-Set Metrics
              </h4>
              <div className="flex flex-wrap gap-2">
                {analyticalTrace.map((block, idx) => (
                  <div key={idx} className="bg-slate-950/90 border border-slate-900 p-2.5 rounded-xl flex flex-col text-[11px] flex-1 min-w-[110px]">
                    <span className="font-black text-slate-300 truncate">{block.metricLabel}</span>
                    <span className="text-slate-400 font-medium mt-1">Rate/Set: <strong className="text-white">{block.perSetRate.toFixed(2)}</strong></span>
                    <span className="text-[10px] font-bold text-orange-400 mt-0.5">Scout Yield: {block.calibratedScore}/99</span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black px-8 rounded-xl shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save & Sync Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}