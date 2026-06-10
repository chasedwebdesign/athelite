'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Swords, Activity, HelpCircle, Info, RefreshCw, Save } from 'lucide-react';
import { compileFieldHockeyFitScore, FieldHockeyPositionGroup } from '@/utils/FieldHockeyRecruitingEngine';

export interface FieldHockeyEditorProps {
  fieldHockeyStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function FieldHockeyEditor({ fieldHockeyStats, genderKey, onSync, showToast }: FieldHockeyEditorProps) {
  const currentPos = (fieldHockeyStats.position || 'Forward') as FieldHockeyPositionGroup;
  
  const [posGroup, setPosGroup] = useState<FieldHockeyPositionGroup>(['Forward','Midfielder','Defender','Goalkeeper'].includes(currentPos) ? currentPos : 'Forward');
  const [level, setLevel] = useState(fieldHockeyStats.level || 'Varsity Starter');
  const [games, setGames] = useState<number>(fieldHockeyStats.metaContext?.gamesPlayed || 16);
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = fieldHockeyStats.metaContext?.rawTotals || {};
  const [statA, setStatA] = useState<string>(savedPayload.statA?.toString() || '');
  const [statB, setStatB] = useState<string>(savedPayload.statB?.toString() || '');
  const [statC, setStatC] = useState<string>(savedPayload.statC?.toString() || '');

  useEffect(() => {
    if (!fieldHockeyStats.metaContext?.rawTotals) {
      setStatA(''); setStatB(''); setStatC('');
    }
  }, [posGroup, fieldHockeyStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const numA = statA === '' ? null : parseFloat(statA);
    const numB = statB === '' ? null : parseFloat(statB);
    const numC = statC === '' ? null : parseFloat(statC);

    let result: Record<string, number | null> = {};
    if (posGroup === 'Forward') result = { goals: numA, assists: numB };
    else if (posGroup === 'Midfielder') result = { goals: numA, assists: numB, defSaves: numC };
    else if (posGroup === 'Defender') result = { defSaves: numA, assists: numB, goals: numC };
    else result = { savePct: numA, gaa: numB }; 
    
    return result;
  }, [posGroup, statA, statB, statC]);

  const { compositeScore, analyticalTrace } = compileFieldHockeyFitScore(
    genderKey,
    posGroup,
    level,
    games,
    computedInputObject
  );

  const getPosLabels = () => {
    if (posGroup === 'Forward') return { 
      labelA: { text: 'Total Goals', tooltip: 'Total goals scored during the season.' }, 
      labelB: { text: 'Total Assists', tooltip: 'Passes directly leading to a goal.' }, 
      labelC: null 
    };
    if (posGroup === 'Midfielder') return { 
      labelA: { text: 'Total Goals', tooltip: 'Total goals scored during the season.' }, 
      labelB: { text: 'Total Assists', tooltip: 'Passes directly leading to a goal.' }, 
      labelC: { text: 'Defensive Saves', tooltip: 'Stopping a shot from crossing the goal line as a field player.' } 
    };
    if (posGroup === 'Defender') return { 
      labelA: { text: 'Defensive Saves', tooltip: 'Stopping a shot from crossing the goal line as a field player.' }, 
      labelB: { text: 'Total Assists', tooltip: 'Passes directly leading to a goal (e.g. from corners).' }, 
      labelC: { text: 'Total Goals', tooltip: 'Total goals scored (e.g. corner hits).' } 
    };
    return { 
      labelA: { text: 'Save Percentage (%)', tooltip: 'Percentage of shots on goal that are saved (e.g. 78).' }, 
      labelB: { text: 'Goals Against Avg (GAA)', tooltip: 'Average goals allowed per full game played.' }, 
      labelC: null 
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

    showToast("Field Hockey scouting profile committed successfully!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500">
              <Swords className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Field Hockey Matrix</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Validating metrics against <strong className="text-amber-500">{genderKey} specific benchmarks</strong>.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Scout Power Target</span>
              <span className="text-xs font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Dynamic Matrix Verified
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-lg shrink-0 shadow-amber-500/10">
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Positional Assignment</label>
          <select value={posGroup} onChange={e => setPosGroup(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="Forward">Forward</option>
            <option value="Midfielder">Midfielder</option>
            <option value="Defender">Defender</option>
            <option value="Goalkeeper">Goalkeeper</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Club / Academy Tiers</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="JV / Dev Squad">JV / Dev Squad</option>
            <option value="Varsity Contributor">Varsity High School</option>
            <option value="Varsity Starter">Varsity Core Starter</option>
            <option value="All-Conference Tier">All-Conference / Regional</option>
            <option value="Elite Club (ECNL / AAU / Next)">National Club Travel Team (Nexus / Max FH)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Games Played (Exposure)</label>
          <div className="relative">
            <input type="number" min="1" max="40" value={games} onChange={e => setGames(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white shadow-inner"/>
            <Activity className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            {labels.labelA.text}
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-amber-500 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                {labels.labelA.tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="number" placeholder="0 (Optional)" value={statA} onChange={e => setStatA(e.target.value)} className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-amber-500/50 transition-colors"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            {labels.labelB.text}
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-amber-500 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                {labels.labelB.tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="number" placeholder="0 (Optional)" value={statB} onChange={e => setStatB(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-amber-500/50 transition-colors"/>
        </div>

        {labels.labelC && (
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              {labels.labelC.text}
              <div className="relative group inline-block">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-amber-500 cursor-help transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                  {labels.labelC.tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </div>
            </label>
            <input type="number" placeholder="0 (Optional)" value={statC} onChange={e => setStatC(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-amber-500/50 transition-colors"/>
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
                    <span className="text-[10px] font-bold text-amber-500 mt-0.5">Yield Index: {block.calibratedScore}/99</span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save & Sync Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}