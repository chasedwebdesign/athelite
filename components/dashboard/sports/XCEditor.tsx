'use client';

import React, { useState } from 'react';
import { Activity, Timer, Info, RefreshCw, Save } from 'lucide-react';
import { compileCrossCountryFitScore, formatSecondsToXCTime } from '@/utils/XCRecruitingEngine';

export interface XCEditorProps {
  xcStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function XCEditor({ xcStats, genderKey, onSync, showToast }: XCEditorProps) {
  const [v5k, setV5k] = useState(xcStats.metrics?.find((m: any) => m.name === '5K XC')?.value || '');
  const [v3m, setV3m] = useState(xcStats.metrics?.find((m: any) => m.name === '3-Mile XC')?.value || '');
  const [difficulty, setDifficulty] = useState<'fast' | 'standard' | 'tactical'>(xcStats.metaContext?.courseDifficulty || 'standard');
  const [isSaving, setIsSaving] = useState(false);

  const { compositeScore, parsedMetrics } = compileCrossCountryFitScore(
    genderKey,
    [
      { name: '5K XC', value: v5k },
      { name: '3-Mile XC', value: v3m }
    ],
    difficulty
  );

  const getTierLabel = (score: number) => {
    if (score >= 95) return { text: 'Power 4 D1 Elite', color: 'from-fuchsia-500 to-indigo-500 shadow-fuchsia-500/20' };
    if (score >= 85) return { text: 'Mid-Major D1 Priority', color: 'from-purple-500 to-blue-500 shadow-purple-500/20' };
    if (score >= 75) return { text: 'Top D2 / D1 Walk-on', color: 'from-blue-500 to-cyan-500 shadow-blue-500/20' };
    if (score >= 65) return { text: 'Solid D2 / High D3', color: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' };
    if (score >= 55) return { text: 'D3 / NAIA Prospect', color: 'from-amber-500 to-orange-500 shadow-amber-500/20' };
    return { text: 'Developing Varsity Track', color: 'from-slate-600 to-slate-800 shadow-slate-500/20' };
  };

  const activeTier = getTierLabel(compositeScore);

  const handleManualSave = async () => {
    setIsSaving(true);
    const updatedMetrics = [
      { name: '5K XC', value: v5k },
      { name: '3-Mile XC', value: v3m }
    ].filter(m => m.value.trim() !== '');

    await onSync({
      ...xcStats,
      metrics: updatedMetrics,
      calculatedRating: compositeScore,
      metaContext: { courseDifficulty: difficulty }
    });

    showToast("Cross Country metrics synced to database!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Cross Country Overhaul Module</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Running Division Parameters: <strong className="text-slate-200">{genderKey} Engine Standard</strong>
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Recruitment Rating</span>
              <span className={`text-xs font-black bg-gradient-to-r ${activeTier.color} bg-clip-text text-transparent`}>
                {activeTier.text}
              </span>
            </div>
            <div className={`text-2xl font-black px-3 py-1 bg-gradient-to-br ${activeTier.color} text-white rounded-xl shadow-lg shrink-0`}>
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">5K XC Metric (MM:SS)</label>
          <div className="relative">
            <input 
              type="text" placeholder="e.g. 15:42" value={v5k}
              onChange={(e) => setV5k(e.target.value)} 
              className="w-full bg-slate-900/60 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm font-bold tracking-wide outline-none transition-all text-white placeholder-slate-600 shadow-inner"
            />
            <Timer className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">3-Mile XC Metric (MM:SS)</label>
          <div className="relative">
            <input 
              type="text" placeholder="e.g. 14:55" value={v3m}
              onChange={(e) => setV3m(e.target.value)} 
              className="w-full bg-slate-900/60 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm font-bold tracking-wide outline-none transition-all text-white placeholder-slate-600 shadow-inner"
            />
            <Timer className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Course Terrain Blueprint</label>
          <select
            value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}
            className="w-full bg-slate-900/60 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all text-slate-300 shadow-inner cursor-pointer"
          >
            <option value="fast">Flat / Fast (Track Style)</option>
            <option value="standard">Standard / Rolling Hills</option>
            <option value="tactical">Severe / Cross Country Heavy</option>
          </select>
        </div>
      </div>

      <div className="pt-6 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-800/80 mt-6">
        <div className="w-full md:w-1/2">
          {parsedMetrics.length > 0 && (
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Normalization Log Trace
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {parsedMetrics.map((metric, i) => (
                  <div key={i} className="bg-slate-950/80 border border-slate-900 p-3 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-black text-slate-300 block">{metric.name}</span>
                      <span className="text-slate-500 font-medium text-[11px]">
                        Raw Clock: <strong className="text-slate-400">{metric.raw}</strong>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-emerald-400 block">
                        Adjusted: {formatSecondsToXCTime(metric.adjustedSeconds)}
                      </span>
                      <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase">
                        Score: {metric.score}/99
                      </span>
                    </div>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-8 rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save & Sync Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}