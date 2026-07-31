'use client';

import React, { useState } from 'react';
import { Target, Medal, Trash2, Save, Plus } from 'lucide-react';

interface GolfEditorProps {
  golfStats: any;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function GolfEditor({ golfStats, onSync, showToast }: GolfEditorProps) {
  
  const getMetric = (name: string) => golfStats.metrics?.find((m: any) => m.name === name)?.value || '';
  
  const [avgScore, setAvgScore] = useState(getMetric('18-Hole Avg Score'));
  const [handicap, setHandicap] = useState(getMetric('Current Handicap Index'));
  
  const [localAccolades, setLocalAccolades] = useState<string[]>(golfStats?.metaContext?.accolades || []);
  const [newAccolade, setNewAccolade] = useState('');

  const handleSaveStats = () => {
    const newMetrics = [];
    if (avgScore) newMetrics.push({ name: '18-Hole Avg Score', value: avgScore });
    if (handicap) newMetrics.push({ name: 'Current Handicap Index', value: handicap });

    onSync({ ...golfStats, metrics: newMetrics });
    showToast('Golf baseline metrics saved.', 'success');
  };

  const addAccolade = () => {
    if (!newAccolade.trim()) return;
    const updated = [...localAccolades, newAccolade.trim()];
    setLocalAccolades(updated);
    setNewAccolade('');
    onSync({ ...golfStats, metaContext: { ...golfStats.metaContext, accolades: updated }});
  };

  const removeAccolade = (idx: number) => {
    const updated = localAccolades.filter((_, i) => i !== idx);
    setLocalAccolades(updated);
    onSync({ ...golfStats, metaContext: { ...golfStats.metaContext, accolades: updated }});
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-inner relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-600/10 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-slate-800/60 gap-4 relative z-10">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
             Golf Baseline
          </h3>
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">Single-Stat Focus Matrix</p>
        </div>
        <button onClick={handleSaveStats} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 px-5 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 transition-transform active:scale-[0.98]">
           <Save className="w-4 h-4" /> Save Stats
        </button>
      </div>

      <div className="space-y-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target className="w-16 h-16 text-emerald-500" /></div>
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2 block relative z-10">18-Hole Tournament Average</label>
              <input 
                type="number" step="0.1" placeholder="e.g. 74.5"
                value={avgScore} onChange={(e) => setAvgScore(e.target.value)}
                className="w-full bg-transparent text-3xl font-black text-white focus:outline-none relative z-10 placeholder-slate-700"
              />
           </div>
           
           <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block relative z-10">USGA Handicap Index</label>
              <div className="flex items-center text-3xl font-black text-white relative z-10">
                 <span className="text-slate-600 mr-1">+</span>
                 <input 
                   type="number" step="0.1" placeholder="1.2"
                   value={handicap} onChange={(e) => setHandicap(e.target.value)}
                   className="w-full bg-transparent focus:outline-none placeholder-slate-700"
                 />
              </div>
           </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60">
           <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1.5"><Medal className="w-3.5 h-3.5"/> Golf Accolades & Impact</label>
           
           <div className="space-y-2 mb-3">
              {localAccolades.map((acc, idx) => (
                <div key={`golf-acc-${idx}`} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl">
                   <div className="flex items-center gap-3">
                     <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Honor</span>
                     <span className="text-sm font-bold text-white">{acc}</span>
                   </div>
                   <button onClick={() => removeAccolade(idx)} className="text-slate-500 hover:text-red-500 transition-colors p-1 rounded-lg">
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
           </div>

           <div className="flex gap-2">
             <input 
               type="text" 
               placeholder="e.g. State Medalist, Club Champion, 2x All-District" 
               value={newAccolade} 
               onChange={(e) => setNewAccolade(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && addAccolade()}
               className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
             />
             <button onClick={addAccolade} className="bg-slate-800 hover:bg-slate-700 text-white px-5 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shrink-0 flex items-center justify-center">
               Add Honor
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}