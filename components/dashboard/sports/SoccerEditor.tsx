'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Swords, Activity, HelpCircle, Info, RefreshCw, Save } from 'lucide-react';
import { compileSoccerFitScore, SoccerPositionGroup } from '@/utils/SoccerRecruitingEngine';

export interface SoccerEditorProps {
  soccerStats: any;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function SoccerEditor({ soccerStats, onSync, showToast }: SoccerEditorProps) {
  const currentPos = (soccerStats.position || 'FWD') as SoccerPositionGroup;
  
  const [posGroup, setPosGroup] = useState<SoccerPositionGroup>(['GK','DEF','MID','FWD'].includes(currentPos) ? currentPos : 'FWD');
  const [level, setLevel] = useState(soccerStats.level || 'Varsity Starter');
  const [games, setGames] = useState<number>(soccerStats.metaContext?.gamesPlayed || 14);
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = soccerStats.metaContext?.rawTotals || {};
  const [statA, setStatA] = useState<string>(savedPayload.statA?.toString() || '');
  const [statB, setStatB] = useState<string>(savedPayload.statB?.toString() || '');
  const [statC, setStatC] = useState<string>(savedPayload.statC?.toString() || '');

  useEffect(() => {
    if (!soccerStats.metaContext?.rawTotals) {
      setStatA(''); setStatB(''); setStatC('');
    }
  }, [posGroup, soccerStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const numA = statA === '' ? null : parseFloat(statA);
    const numB = statB === '' ? null : parseFloat(statB);
    const numC = statC === '' ? null : parseFloat(statC);

    let result: Record<string, number | null> = {};
    if (posGroup === 'GK') result = { savePct: numA, gaa: numB, cleanSheets: numC };
    else if (posGroup === 'DEF') result = { defactions: numA, cleanSheets: numB, passPct: numC };
    else if (posGroup === 'MID') result = { assists: numA, passPct: numB, goals: numC };
    else result = { goals: numA, assists: numB, minutes: numC };
    
    return result;
  }, [posGroup, statA, statB, statC]);

  const { compositeScore, analyticalTrace } = compileSoccerFitScore(
    posGroup,
    level,
    games,
    computedInputObject
  );

  const getPosLabels = () => {
    if (posGroup === 'GK') return { 
      labelA: { text: 'Overall Save %', tooltip: 'Percentage of shots on goal that you save.' }, 
      labelB: { text: 'Goals Against Avg (GAA)', tooltip: 'Average goals allowed per full match played.' }, 
      labelC: { text: 'Clean Sheets (Total)', tooltip: 'A full match played where the opponent scores zero goals.' } 
    };
    if (posGroup === 'DEF') return { 
      labelA: { text: 'Interceptions + Tackles', tooltip: 'Combined number of defensive stops and possession takeaways.' }, 
      labelB: { text: 'Clean Sheets (Total)', tooltip: 'A full match played where your team allows zero goals.' }, 
      labelC: { text: 'Pass Completion %', tooltip: 'Percentage of your passes that successfully reach a teammate.' } 
    };
    if (posGroup === 'MID') return { 
      labelA: { text: 'Total Assists', tooltip: 'Passes that directly lead to a goal being scored.' }, 
      labelB: { text: 'Pass Completion %', tooltip: 'Percentage of your passes that successfully reach a teammate.' }, 
      labelC: { text: 'Total Goals', tooltip: 'Total goals scored by you.' } 
    };
    return { 
      labelA: { text: 'Total Goals', tooltip: 'Total goals scored by you.' }, 
      labelB: { text: 'Total Assists', tooltip: 'Passes that directly lead to a goal being scored.' }, 
      labelC: { text: 'Total Minutes Played', tooltip: 'Estimated total minutes you spent on the pitch this season.' } 
    };
  };

  const labels = getPosLabels();

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const mockMetricsArray = analyticalTrace.map(t => ({
      name: t.metricLabel,
      value: t.perGameRate.toFixed(1)
    }));

    await onSync({
      position: posGroup,
      level: level,
      metrics: mockMetricsArray,
      calculatedRating: compositeScore,
      metaContext: {
        gamesPlayed: games,
        rawTotals: { statA, statB, statC }
      }
    });

    showToast("Soccer recruiting attributes committed securely!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Swords className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Soccer Analytics Matrix</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Dynamic positional mapping parameters utilizing <strong className="text-emerald-400">exposure rate tracking</strong>.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Scout Power Target</span>
              <span className="text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Dynamic Matrix Verified
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg shrink-0 shadow-emerald-500/10">
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Tactical Assignment Profile</label>
          <select value={posGroup} onChange={e => setPosGroup(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="GK">Goalkeeper (GK)</option>
            <option value="DEF">Defender (CB / Fullback)</option>
            <option value="MID">Midfielder (DM / CM / AM)</option>
            <option value="FWD">Forward / Striker (Winger / ST)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Club / Academy Tiers</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="JV / Dev Squad">JV / Dev Squad</option>
            <option value="Varsity Contributor">Varsity High School</option>
            <option value="Varsity Starter">Varsity Core Starter</option>
            <option value="All-Conference Tier">All-Conference / Regional Pool</option>
            <option value="Elite Club (ECNL / AAU / Next)">National Academy (ECNL / Next / EA)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Matches Played</label>
          <div className="relative">
            <input type="number" min="1" max="30" value={games} onChange={e => setGames(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white shadow-inner"/>
            <Activity className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            {labels.labelA.text}
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                {labels.labelA.tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="number" placeholder="0 (Optional)" value={statA} onChange={e => setStatA(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-emerald-500/50 transition-colors"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            {labels.labelB.text}
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                {labels.labelB.tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="number" placeholder="0 (Optional)" value={statB} onChange={e => setStatB(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-emerald-500/50 transition-colors"/>
        </div>

        {labels.labelC && (
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              {labels.labelC.text}
              <div className="relative group inline-block">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400 cursor-help transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                  {labels.labelC.tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </div>
            </label>
            <input type="number" placeholder="0 (Optional)" value={statC} onChange={e => setStatC(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-emerald-500/50 transition-colors"/>
          </div>
        )}
      </div>

      <div className="pt-6 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-800/80 mt-6">
        <div className="w-full md:w-2/3">
          {analyticalTrace.length > 0 && (
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Normalization Telemetry
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {analyticalTrace.map((block, idx) => (
                  <div key={idx} className="bg-slate-950/90 border border-slate-900 p-2.5 rounded-xl flex flex-col text-[11px]">
                    <span className="font-black text-slate-300 truncate">{block.metricLabel}</span>
                    <span className="text-slate-400 font-medium mt-1">Normalized: <strong className="text-white">{block.perGameRate.toFixed(2)}</strong></span>
                    <span className="text-[10px] font-bold text-emerald-400 mt-0.5">Yield Index: {block.calibratedScore}/99</span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save & Sync Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}