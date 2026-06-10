'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Activity, HelpCircle, Info, RefreshCw, Save, Sparkles } from 'lucide-react';
import { compileGymnasticsFitScore, GymnasticsPositionGroup } from '@/utils/GymnasticsRecruitingEngine';

export interface GymnasticsEditorProps {
  gymnasticsStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function GymnasticsEditor({ gymnasticsStats, genderKey, onSync, showToast }: GymnasticsEditorProps) {
  const currentPos = (gymnasticsStats.position || 'All-Around') as GymnasticsPositionGroup;
  
  const [posGroup, setPosGroup] = useState<GymnasticsPositionGroup>(
    ['All-Around', 'Vault Specialist', 'Bars Specialist', 'Beam Specialist', 'Floor Specialist'].includes(currentPos) 
      ? currentPos 
      : 'All-Around'
  );
  
  const [level, setLevel] = useState(gymnasticsStats.level || 'All-State / National');
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = gymnasticsStats.metaContext?.rawTotals || {};
  
  const [aa, setAa] = useState<string>(savedPayload.aa?.toString() || '');
  const [vault, setVault] = useState<string>(savedPayload.vault?.toString() || '');
  const [bars, setBars] = useState<string>(savedPayload.bars?.toString() || '');
  const [beam, setBeam] = useState<string>(savedPayload.beam?.toString() || '');
  const [floor, setFloor] = useState<string>(savedPayload.floor?.toString() || '');

  useEffect(() => {
    if (!gymnasticsStats.metaContext?.rawTotals) {
      setAa(''); setVault(''); setBars(''); setBeam(''); setFloor('');
    }
  }, [posGroup, gymnasticsStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const result: Record<string, number | null> = {
      aa: aa === '' ? null : parseFloat(aa),
      vault: vault === '' ? null : parseFloat(vault),
      bars: bars === '' ? null : parseFloat(bars),
      beam: beam === '' ? null : parseFloat(beam),
      floor: floor === '' ? null : parseFloat(floor),
    };
    return result;
  }, [aa, vault, bars, beam, floor]);

  const { compositeScore, analyticalTrace } = compileGymnasticsFitScore(
    genderKey,
    posGroup,
    level,
    computedInputObject
  );

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const mockMetricsArray = analyticalTrace.map(t => ({
      name: t.metricLabel,
      value: t.rawValue.toFixed(3).replace(/\.?0+$/, '') // Clean decimal formatting
    }));

    await onSync({
      position: posGroup,
      level: level,
      metrics: mockMetricsArray,
      calculatedRating: compositeScore,
      metaContext: {
        rawTotals: { aa, vault, bars, beam, floor }
      }
    });

    showToast("Gymnastics routines logged and verified!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Gymnastics Precision Engine</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Engine evaluates routine peaks against <strong className="text-indigo-400">Level 10 & Elite Standards</strong>.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Scout Power Target</span>
              <span className="text-xs font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Dynamic Matrix Verified
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg shrink-0 shadow-indigo-500/10">
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Positional Assignment</label>
          <select value={posGroup} onChange={e => setPosGroup(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="All-Around">All-Around</option>
            <option value="Vault Specialist">Vault Specialist</option>
            <option value="Bars Specialist">Uneven Bars Specialist</option>
            <option value="Beam Specialist">Balance Beam Specialist</option>
            <option value="Floor Specialist">Floor Exercise Specialist</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Club / Academy Tiers</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="JV / Dev Squad">Developmental (Level 7 or lower)</option>
            <option value="Varsity Contributor">Level 8</option>
            <option value="Varsity Starter">Level 9</option>
            <option value="All-Conference Tier">High Level 9</option>
            <option value="All-State / National">Level 10</option>
            <option value="Elite Club (Level 10 / Elite)">Elite / Olympic Pathway</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4 pt-4 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            All-Around (AA)
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Out of 40.0 points.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          <input type="text" inputMode="decimal" placeholder="(e.g. 38.5)" value={aa} onChange={e => setAa(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-indigo-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Vault Score
          </label>
          <input type="text" inputMode="decimal" placeholder="(e.g. 9.75)" value={vault} onChange={e => setVault(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-indigo-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Uneven Bars
          </label>
          <input type="text" inputMode="decimal" placeholder="(Optional)" value={bars} onChange={e => setBars(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-indigo-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Balance Beam
          </label>
          <input type="text" inputMode="decimal" placeholder="(Optional)" value={beam} onChange={e => setBeam(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-indigo-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Floor Exercise
          </label>
          <input type="text" inputMode="decimal" placeholder="(Optional)" value={floor} onChange={e => setFloor(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-indigo-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
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
                    <span className="text-slate-400 font-medium mt-1">Logged: <strong className="text-white">{block.rawValue.toFixed(3).replace(/\.?0+$/, '')}</strong></span>
                    <span className="text-[10px] font-bold text-indigo-400 mt-0.5">Yield Index: {block.calibratedScore}/99</span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}