'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Swords, Activity, HelpCircle, Info, RefreshCw, Save } from 'lucide-react';
import { compileFencingFitScore, FencingPositionGroup } from '@/utils/FencingRecruitingEngine';

export interface FencingEditorProps {
  fencingStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function FencingEditor({ fencingStats, genderKey, onSync, showToast }: FencingEditorProps) {
  const currentPos = (fencingStats.position || 'Foil Specialist') as FencingPositionGroup;
  
  const [posGroup, setPosGroup] = useState<FencingPositionGroup>(
    ['Foil Specialist', 'Épée Specialist', 'Sabre Specialist'].includes(currentPos) 
      ? currentPos 
      : 'Foil Specialist'
  );
  
  const [level, setLevel] = useState(fencingStats.level || 'Varsity Starter');
  const [bouts, setBouts] = useState<number>(fencingStats.metaContext?.gamesPlayed || 20); // Mapping gamesPlayed to bouts for UI consistency
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = fencingStats.metaContext?.rawTotals || {};
  
  const [nationalPoints, setNationalPoints] = useState<string>(savedPayload.nationalPoints?.toString() || '');
  const [winPct, setWinPct] = useState<string>(savedPayload.winPct?.toString() || '');
  const [touchesScored, setTouchesScored] = useState<string>(savedPayload.touchesScored?.toString() || '');
  const [touchesReceived, setTouchesReceived] = useState<string>(savedPayload.touchesReceived?.toString() || '');

  useEffect(() => {
    if (!fencingStats.metaContext?.rawTotals) {
      setNationalPoints(''); setWinPct(''); setTouchesScored(''); setTouchesReceived('');
    }
  }, [posGroup, fencingStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const result: Record<string, number | null> = {
      nationalPoints: nationalPoints === '' ? null : parseFloat(nationalPoints),
      winPct: winPct === '' ? null : parseFloat(winPct),
      touchesScored: touchesScored === '' ? null : parseFloat(touchesScored),
      touchesReceived: touchesReceived === '' ? null : parseFloat(touchesReceived),
    };
    return result;
  }, [nationalPoints, winPct, touchesScored, touchesReceived]);

  const { compositeScore, analyticalTrace } = compileFencingFitScore(
    genderKey,
    level,
    bouts,
    computedInputObject
  );

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const mockMetricsArray = analyticalTrace.map(t => ({
      name: t.metricLabel,
      value: t.rawValue !== undefined ? t.rawValue.toFixed(1).replace(/\.?0+$/, '') : '0'
    }));

    await onSync({
      position: posGroup,
      level: level,
      metrics: mockMetricsArray,
      calculatedRating: compositeScore,
      metaContext: {
        gamesPlayed: bouts, // Keep schema consistency
        rawTotals: { nationalPoints, winPct, touchesScored, touchesReceived }
      }
    });

    showToast("Fencing metrics logged and secured!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-500/10 rounded-xl border border-slate-500/20 text-slate-400">
              <Swords className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Fencing Strike Normalizer</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Engine evaluates <strong className="text-slate-300">USFA Points & Touch Differentials</strong>.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Scout Power Target</span>
              <span className="text-xs font-black bg-gradient-to-r from-slate-300 to-zinc-400 bg-clip-text text-transparent">
                Dynamic Matrix Verified
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-slate-400 to-zinc-600 text-white rounded-xl shadow-lg shrink-0 shadow-slate-500/10">
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Weapon Specialization</label>
          <select value={posGroup} onChange={e => setPosGroup(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="Foil Specialist">Foil Specialist</option>
            <option value="Épée Specialist">Épée Specialist</option>
            <option value="Sabre Specialist">Sabre Specialist</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Competition / Division Tier</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="JV / Dev Squad">JV / Dev Squad</option>
            <option value="Varsity Contributor">Varsity Contributor</option>
            <option value="Varsity Starter">Varsity Core Starter</option>
            <option value="All-Conference / Regional">Regional Ranked (ROC)</option>
            <option value="All-State / National">National Point Holder (NAC)</option>
            <option value="Elite Club (USFA National / NAC)">Elite / Top 50 National</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Total Bouts Fenced (Exposure)</label>
          <div className="relative">
            <input type="text" inputMode="numeric" value={bouts} onChange={e => setBouts(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            <Activity className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            USFA National Points
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Leave blank if you do not compete in National American Cups (NAC).
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="text" inputMode="decimal" placeholder="(Optional)" value={nationalPoints} onChange={e => setNationalPoints(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-[0_0_10px_rgba(148,163,184,0.05)] focus:border-slate-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Regional Win %
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Percentage out of 100 (e.g. 75 for 75%).
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="text" inputMode="decimal" placeholder="(e.g. 75)" value={winPct} onChange={e => setWinPct(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-slate-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Total Touches Scored
          </label>
          <input type="text" inputMode="decimal" placeholder="(Season Total)" value={touchesScored} onChange={e => setTouchesScored(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-slate-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Total Touches Received
          </label>
          <input type="text" inputMode="decimal" placeholder="(Season Total)" value={touchesReceived} onChange={e => setTouchesReceived(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-slate-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
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
                    <span className="text-slate-400 font-medium mt-1">Value: <strong className="text-white">{block.rawValue?.toFixed(2).replace(/\.?0+$/, '') || '0'}</strong></span>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">Yield Index: {block.calibratedScore}/99</span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-slate-600 to-zinc-600 hover:from-slate-500 hover:to-zinc-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}