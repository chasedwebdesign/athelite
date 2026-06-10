'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Target, HelpCircle, Info, RefreshCw, Save } from 'lucide-react';
import { compileTennisFitScore, TennisPositionGroup } from '@/utils/TennisRecruitingEngine';

export interface TennisEditorProps {
  tennisStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function TennisEditor({ tennisStats, genderKey, onSync, showToast }: TennisEditorProps) {
  const currentPos = (tennisStats.position || 'Singles Player') as TennisPositionGroup;
  
  const [posGroup, setPosGroup] = useState<TennisPositionGroup>(
    ['Singles Player', 'Doubles Player'].includes(currentPos) 
      ? currentPos 
      : 'Singles Player'
  );
  
  const [level, setLevel] = useState(tennisStats.level || 'Varsity Starter');
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = tennisStats.metaContext?.rawTotals || {};
  
  const [utr, setUtr] = useState<string>(savedPayload.utr?.toString() || '');
  const [winPct, setWinPct] = useState<string>(savedPayload.winPct?.toString() || '');
  const [careerWins, setCareerWins] = useState<string>(savedPayload.careerWins?.toString() || '');
  const [firstServePct, setFirstServePct] = useState<string>(savedPayload.firstServePct?.toString() || '');

  useEffect(() => {
    if (!tennisStats.metaContext?.rawTotals) {
      setUtr(''); setWinPct(''); setCareerWins(''); setFirstServePct('');
    }
  }, [posGroup, tennisStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const result: Record<string, number | null> = {
      utr: utr === '' ? null : parseFloat(utr),
      winPct: winPct === '' ? null : parseFloat(winPct),
      careerWins: careerWins === '' ? null : parseFloat(careerWins),
      firstServePct: firstServePct === '' ? null : parseFloat(firstServePct),
    };
    return result;
  }, [utr, winPct, careerWins, firstServePct]);

  const { compositeScore, analyticalTrace } = compileTennisFitScore(
    genderKey,
    level,
    computedInputObject
  );

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const mockMetricsArray = analyticalTrace.map(t => ({
      name: t.metricLabel,
      value: t.rawValue.toString()
    }));

    await onSync({
      position: posGroup,
      level: level,
      metrics: mockMetricsArray,
      calculatedRating: compositeScore,
      metaContext: {
        rawTotals: { utr, winPct, careerWins, firstServePct }
      }
    });

    showToast("Tennis metrics verified and secured!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-lime-500/10 rounded-xl border border-lime-500/20 text-lime-500">
              <Target className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Tennis UTR Normalizer</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Engine heavily prioritizes <strong className="text-lime-500">Universal Tennis Rating (UTR)</strong> and Win Rate.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Scout Power Target</span>
              <span className="text-xs font-black bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text text-transparent">
                Dynamic Matrix Verified
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-lime-500 to-green-600 text-white rounded-xl shadow-lg shrink-0 shadow-lime-500/10">
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Positional Focus</label>
          <select value={posGroup} onChange={e => setPosGroup(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="Singles Player">Primary Singles</option>
            <option value="Doubles Player">Primary Doubles</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Club / Academy Tiers</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="JV / Dev Squad">JV / Dev Squad</option>
            <option value="Varsity Contributor">Varsity Contributor</option>
            <option value="Varsity Starter">Varsity Core Starter</option>
            <option value="All-Conference Tier">All-Conference / Regional</option>
            <option value="All-State / National">All-State / National</option>
            <option value="Elite Club (ITF / USTA National)">Elite Club (ITF / USTA National)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Verified UTR
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-lime-500 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Universal Tennis Rating (e.g. 10.5).
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="text" inputMode="decimal" placeholder="(e.g. 10.5)" value={utr} onChange={e => setUtr(e.target.value)} className="w-full bg-slate-950 border border-lime-500/40 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-[0_0_15px_rgba(132,204,22,0.1)] focus:border-lime-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Overall Win %
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-lime-500 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Percentage out of 100 (e.g. 85 for 85%).
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="text" inputMode="decimal" placeholder="(e.g. 85)" value={winPct} onChange={e => setWinPct(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-lime-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Career Wins
          </label>
          <input type="text" inputMode="decimal" placeholder="(Optional)" value={careerWins} onChange={e => setCareerWins(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-lime-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            First Serve %
          </label>
          <input type="text" inputMode="decimal" placeholder="(e.g. 68)" value={firstServePct} onChange={e => setFirstServePct(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-lime-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
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
                    <span className="text-[10px] font-bold text-lime-500 mt-0.5">Yield Index: {block.calibratedScore}/99</span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-500 hover:to-green-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}