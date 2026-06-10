'use client';

import React, { useState } from 'react';
import { Droplets, Timer, Info, RefreshCw, Save } from 'lucide-react';
import { compileSwimFitScore, AVAILABLE_SWIM_EVENTS } from '@/utils/SwimRecruitingEngine';

export interface SwimEditorProps {
  swimStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function SwimEditor({ swimStats, genderKey, onSync, showToast }: SwimEditorProps) {
  const initialMetrics = swimStats.metrics || [];
  const getInitialEvent = (idx: number, fallback: string) => initialMetrics[idx]?.name || fallback;
  const getInitialTime = (idx: number) => initialMetrics[idx]?.value || '';

  const [e1Name, setE1Name] = useState(getInitialEvent(0, '50 Free'));
  const [e1Time, setE1Time] = useState(getInitialTime(0));
  
  const [e2Name, setE2Name] = useState(getInitialEvent(1, '100 Free'));
  const [e2Time, setE2Time] = useState(getInitialTime(1));
  
  const [e3Name, setE3Name] = useState(getInitialEvent(2, '100 Fly'));
  const [e3Time, setE3Time] = useState(getInitialTime(2));

  const [courseType, setCourseType] = useState<'SCY' | 'LCM' | 'SCM'>(swimStats.metaContext?.poolCourse || 'SCY');
  const [isSaving, setIsSaving] = useState(false);

  const { compositeScore, parsedMetrics } = compileSwimFitScore(
    genderKey,
    [
      { name: e1Name, value: e1Time },
      { name: e2Name, value: e2Time },
      { name: e3Name, value: e3Time }
    ],
    courseType
  );

  const getTierLabel = (score: number) => {
    if (score >= 95) return { text: 'Power 4 D1 Elite', color: 'from-sky-500 to-indigo-500 shadow-sky-500/20' };
    if (score >= 85) return { text: 'Mid-Major D1 Priority', color: 'from-blue-500 to-cyan-500 shadow-blue-500/20' };
    if (score >= 75) return { text: 'Top D2 / D1 Walk-on', color: 'from-cyan-500 to-teal-500 shadow-cyan-500/20' };
    if (score >= 65) return { text: 'Solid D2 / High D3', color: 'from-teal-500 to-emerald-500 shadow-teal-500/20' };
    if (score >= 55) return { text: 'D3 / NAIA Prospect', color: 'from-emerald-500 to-green-500 shadow-emerald-500/20' };
    return { text: 'Developing Varsity Swimmer', color: 'from-slate-600 to-slate-800 shadow-slate-500/20' };
  };

  const activeTier = getTierLabel(compositeScore);

  const handleManualSave = async () => {
    setIsSaving(true);
    const updatedMetrics = [
      { name: e1Name, value: e1Time },
      { name: e2Name, value: e2Time },
      { name: e3Name, value: e3Time }
    ].filter(m => m.value.trim() !== '');

    await onSync({
      ...swimStats,
      metrics: updatedMetrics,
      calculatedRating: compositeScore,
      metaContext: { poolCourse: courseType }
    });

    showToast("Swimming & Diving metrics synced to database!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
              <Droplets className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Swim & Dive Overhaul Module</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Engine prioritizes your <strong className="text-cyan-400">Anchor Event</strong> (65% weight).
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 relative z-10">
        <div className="md:col-span-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Event 1 (Primary)</label>
           <select value={e1Name} onChange={e => setE1Name(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3 py-2.5 text-sm font-bold outline-none text-slate-300 shadow-inner mb-3">
             {AVAILABLE_SWIM_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
           </select>
           <div className="relative">
             <input type="text" placeholder="e.g. 21.45" value={e1Time} onChange={e => setE1Time(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm font-bold tracking-wide outline-none text-white placeholder-slate-600 shadow-inner"/>
             <Timer className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
           </div>
        </div>

        <div className="md:col-span-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Event 2 (Versatility)</label>
           <select value={e2Name} onChange={e => setE2Name(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3 py-2.5 text-sm font-bold outline-none text-slate-300 shadow-inner mb-3">
             {AVAILABLE_SWIM_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
           </select>
           <div className="relative">
             <input type="text" placeholder="e.g. 48.10" value={e2Time} onChange={e => setE2Time(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm font-bold tracking-wide outline-none text-white placeholder-slate-600 shadow-inner"/>
             <Timer className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
           </div>
        </div>

        <div className="md:col-span-4 space-y-4">
           <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Event 3 (Tertiary)</label>
             <select value={e3Name} onChange={e => setE3Name(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3 py-2.5 text-sm font-bold outline-none text-slate-300 shadow-inner mb-3">
               {AVAILABLE_SWIM_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
             </select>
             <div className="relative">
               <input type="text" placeholder="e.g. 52.33" value={e3Time} onChange={e => setE3Time(e.target.value)} className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm font-bold tracking-wide outline-none text-white placeholder-slate-600 shadow-inner"/>
               <Timer className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
             </div>
           </div>

           <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block mb-2">Pool Length Modifier</label>
             <select value={courseType} onChange={e => setCourseType(e.target.value as any)} className="w-full bg-slate-950 border border-cyan-500/30 text-cyan-100 rounded-xl px-4 py-3 text-sm font-bold outline-none shadow-inner cursor-pointer">
               <option value="SCY">SCY (Short Course Yards) - Base</option>
               <option value="LCM">LCM (Long Course Meters) - Auto Conv.</option>
               <option value="SCM">SCM (Short Course Meters) - Auto Conv.</option>
             </select>
           </div>
        </div>
      </div>

      <div className="pt-6 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-800/80 mt-6">
        <div className="w-full md:w-3/5">
          {parsedMetrics.length > 0 && (
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Anchor Matrix Trace
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {parsedMetrics.map((metric, i) => (
                  <div key={i} className={`bg-slate-950/80 border p-3 rounded-xl flex flex-col text-xs ${i === 0 ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-slate-800'}`}>
                    <span className={`font-black truncate ${i===0 ? 'text-cyan-400' : 'text-slate-300'}`}>{metric.name}</span>
                    <div className="flex justify-between mt-2">
                      <span className="text-slate-500 font-medium text-[10px]">Weight: <strong className="text-white">{metric.appliedWeight}</strong></span>
                      <span className="text-[10px] font-black text-slate-400">Score: {metric.score}</span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black px-8 rounded-xl shadow-lg shadow-cyan-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save & Sync Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}