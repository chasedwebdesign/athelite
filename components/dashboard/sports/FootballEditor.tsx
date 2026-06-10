'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Target as TargetIcon, Activity, HelpCircle, Info, RefreshCw, Save } from 'lucide-react';
import { compileFootballFitScore, FootballPositionGroup } from '@/utils/FootballRecruitingEngine';

export interface FootballEditorProps {
  footballStats: any;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function FootballEditor({ footballStats, onSync, showToast }: FootballEditorProps) {
  const currentPos = (footballStats.position?.split('(')[1]?.replace(')', '')?.trim() || footballStats.position || 'QB') as FootballPositionGroup;
  
  const [posGroup, setPosGroup] = useState<FootballPositionGroup>(['QB','RB','WR_TE','OL','DL_LB','DB','ST'].includes(currentPos) ? currentPos : 'QB');
  const [level, setLevel] = useState(footballStats.level || 'Varsity Starter');
  const [games, setGames] = useState<number>(footballStats.metaContext?.gamesPlayed || 10);
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = footballStats.metaContext?.rawTotals || {};
  const [statA, setStatA] = useState<string>(savedPayload.statA?.toString() || '');
  const [statB, setStatB] = useState<string>(savedPayload.statB?.toString() || '');
  const [statC, setStatC] = useState<string>(savedPayload.statC?.toString() || '');

  useEffect(() => {
    if (!footballStats.metaContext?.rawTotals) {
      setStatA(''); setStatB(''); setStatC('');
    }
  }, [posGroup, footballStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const numA = statA === '' ? null : parseFloat(statA);
    const numB = statB === '' ? null : parseFloat(statB);
    const numC = statC === '' ? null : parseFloat(statC);

    const result: Record<string, number | null> = {};
    if (posGroup === 'QB') { result.passingYards = numA; result.passingTDs = numB; result.completionPct = numC; }
    else if (posGroup === 'RB') { result.rushingYards = numA; result.yardsPerCarry = numB; result.totalTDs = numC; }
    else if (posGroup === 'WR_TE') { result.receivingYards = numA; result.yardsPerCatch = numB; result.receivingTDs = numC; }
    else if (posGroup === 'OL') { result.pancakes = numA; result.sacksAllowed = numB; }
    else if (posGroup === 'DL_LB') { result.tackles = numA; result.tfl = numB; result.sacks = numC; }
    else if (posGroup === 'DB') { result.pbus = numA; result.interceptions = numB; }
    else { result.fgPct = numA; result.puntAvg = numB; }
    
    return result;
  }, [posGroup, statA, statB, statC]);

  // TypeScript Strict Fix: Cast computedInputObject as any to bypass index signature mismatches
  const { compositeScore, structuralTrace } = compileFootballFitScore(
    posGroup,
    level,
    games,
    computedInputObject as any 
  );

  const getPosLabels = () => {
    if (posGroup === 'QB') return { 
      labelA: { text: 'Total Passing Yards', tooltip: 'Total gross passing yards for the season.' }, 
      labelB: { text: 'Total Passing TDs', tooltip: 'Total passing touchdowns thrown.' }, 
      labelC: { text: 'Completion %', tooltip: 'Percentage of passes caught by a receiver.' } 
    };
    if (posGroup === 'RB') return { 
      labelA: { text: 'Total Rushing Yards', tooltip: 'Total rushing yards accumulated.' }, 
      labelB: { text: 'Yards Per Carry (YPC)', tooltip: 'Average yards gained per rushing attempt.' }, 
      labelC: { text: 'Total Touchdowns', tooltip: 'Combined rushing and receiving TDs.' } 
    };
    if (posGroup === 'WR_TE') return { 
      labelA: { text: 'Total Receiving Yards', tooltip: 'Total yards gained from catching passes.' }, 
      labelB: { text: 'Yards Per Catch', tooltip: 'Average yards gained per reception.' }, 
      labelC: { text: 'Total Receiving TDs', tooltip: 'Total touchdowns scored via reception.' } 
    };
    if (posGroup === 'OL') return { 
      labelA: { text: 'Total Pancake Blocks', tooltip: 'Knocking a defender flat on their back.' }, 
      labelB: { text: 'Total Sacks Allowed', tooltip: 'Number of times your blocking assignment sacked the QB.' }, 
      labelC: null 
    };
    if (posGroup === 'DL_LB') return { 
      labelA: { text: 'Total Tackles', tooltip: 'Combined solo and assisted tackles.' }, 
      labelB: { text: 'Tackles For Loss (TFL)', tooltip: 'Tackles made behind the line of scrimmage.' }, 
      labelC: { text: 'Quarterback Sacks', tooltip: 'Tackling the QB behind the line of scrimmage.' } 
    };
    if (posGroup === 'DB') return { 
      labelA: { text: 'Pass Breakups (PBU)', tooltip: 'Deflecting or knocking away an intended pass.' }, 
      labelB: { text: 'Interceptions Forced', tooltip: 'Catching a pass intended for the opposing team.' }, 
      labelC: null 
    };
    return { 
      labelA: { text: 'Field Goal % (Season)', tooltip: 'Percentage of successful field goals.' }, 
      labelB: { text: 'Punt Average Yards', tooltip: 'Average distance per punt.' }, 
      labelC: null 
    };
  };

  const labels = getPosLabels();

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const mockMetricsArray = structuralTrace.map(t => ({
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
        courseDifficulty: 'standard',
        rawTotals: { statA, statB, statC }
      }
    });

    showToast("Football scouting profile committed successfully!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <TargetIcon className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Football Contextual Normalizer</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Enforces strict <strong className="text-blue-400">Volume-to-Rate conversions</strong> via games tracking.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Composite Scout Rating</span>
              <span className="text-xs font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Fit Target Level Score
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg shrink-0 shadow-blue-500/10">
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Target Positional Group</label>
          <select value={posGroup} onChange={e => setPosGroup(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="QB">Quarterback (QB)</option>
            <option value="RB">Running Back (RB)</option>
            <option value="WR_TE">Receiver / Tight End (WR/TE)</option>
            <option value="OL">Offensive Lineman (OL)</option>
            <option value="DL_LB">Defensive Line / Linebacker (DL/LB)</option>
            <option value="DB">Defensive Back (DB)</option>
            <option value="ST">Special Teams (K/P)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Competition Level Profile</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="JV / Dev Squad">JV / Dev Squad</option>
            <option value="Varsity Contributor">Varsity Contributor</option>
            <option value="Varsity Starter">Varsity Starter</option>
            <option value="All-Conference Tier">All-Conference Tier</option>
            <option value="All-State / National">All-State / National</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Games Played (Exposure Denominator)</label>
          <div className="relative">
            <input type="number" min="1" max="16" value={games} onChange={e => setGames(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white shadow-inner"/>
            <Activity className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            {labels.labelA.text}
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                {labels.labelA.tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="number" placeholder="0 (Optional)" value={statA} onChange={e => setStatA(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-blue-500/50 transition-colors"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            {labels.labelB.text}
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                {labels.labelB.tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="number" placeholder="0 (Optional)" value={statB} onChange={e => setStatB(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-blue-500/50 transition-colors"/>
        </div>

        {labels.labelC && (
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              {labels.labelC.text}
              <div className="relative group inline-block">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400 cursor-help transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                  {labels.labelC.tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </div>
            </label>
            <input type="number" placeholder="0 (Optional)" value={statC} onChange={e => setStatC(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-blue-500/50 transition-colors"/>
          </div>
        )}
      </div>

      <div className="pt-6 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-800/80 mt-6">
        <div className="w-full md:w-2/3">
          {structuralTrace.length > 0 && (
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Per-Game Rate Compilers Active
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {structuralTrace.map((traceBlock, idx) => (
                  <div key={idx} className="bg-slate-950/90 border border-slate-900 p-2.5 rounded-xl flex flex-col text-[11px]">
                    <span className="font-black text-slate-300 truncate">{traceBlock.metricLabel}</span>
                    <span className="text-slate-400 font-medium mt-1">Per Game: <strong className="text-white">{traceBlock.perGameRate.toFixed(1)}</strong></span>
                    <span className="text-[10px] font-bold text-blue-400 mt-0.5">Metric Yield: {traceBlock.calibratedScore}/99</span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing Stats...' : 'Save & Sync Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}