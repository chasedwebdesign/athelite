'use client';

import React, { useState } from 'react';
import { Target, Medal, Trash2, Save } from 'lucide-react';

interface BowlingEditorProps {
  bowlingStats: any;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function BowlingEditor({ bowlingStats, onSync, showToast }: BowlingEditorProps) {
  
  const getMetric = (name: string) => bowlingStats.metrics?.find((m: any) => m.name === name)?.value || '';
  
  const [avgScore, setAvgScore] = useState(getMetric('Season Average'));
  const [highGame, setHighGame] = useState(getMetric('High Game'));
  
  const [localAccolades, setLocalAccolades] = useState<string[]>(bowlingStats?.metaContext?.accolades || []);
  const [newAccolade, setNewAccolade] = useState('');

  const handleSaveStats = () => {
    const newMetrics = [];
    if (avgScore) newMetrics.push({ name: 'Season Average', value: avgScore });
    if (highGame) newMetrics.push({ name: 'High Game', value: highGame });

    onSync({ ...bowlingStats, metrics: newMetrics });
    showToast('Bowling baseline metrics saved.', 'success');
  };

  const addAccolade = () => {
    if (!newAccolade.trim()) return;
    const updated = [...localAccolades, newAccolade.trim()];
    setLocalAccolades(updated);
    setNewAccolade('');
    onSync({ ...bowlingStats, metaContext: { ...bowlingStats.metaContext, accolades: updated }});
  };

  const removeAccolade = (idx: number) => {
    const updated = localAccolades.filter((_, i) => i !== idx);
    setLocalAccolades(updated);
    onSync({ ...bowlingStats, metaContext: { ...bowlingStats.metaContext, accolades: updated }});
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-inner relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-slate-800/60 gap-4 relative z-10">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
             Bowling Baseline
          </h3>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Single-Stat Focus Matrix</p>
        </div>
        <button onClick={handleSaveStats} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2 px-5 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 transition-transform active:scale-[0.98]">
           <Save className="w-4 h-4" /> Save Stats
        </button>
      </div>

      <div className="space-y-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target className="w-16 h-16 text-indigo-500" /></div>
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2 block relative z-10">Season Average Score</label>
              <input 
                type="number" placeholder="e.g. 215"
                value={avgScore} onChange={(e) => setAvgScore(e.target.value)}
                className="w-full bg-transparent text-3xl font-black text-white focus:outline-none relative z-10 placeholder-slate-700"
              />
           </div>
           
           <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block relative z-10">Official High Game</label>
              <input 
                type="number" placeholder="e.g. 300" max="300"
                value={highGame} onChange={(e) => setHighGame(e.target.value)}
                className="w-full bg-transparent text-3xl font-black text-white focus:outline-none relative z-10 placeholder-slate-700"
              />
           </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60">
           <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1.5"><Medal className="w-3.5 h-3.5"/> Bowling Accolades & Impact</label>
           
           <div className="space-y-2 mb-3">
              {localAccolades.map((acc, idx) => (
                <div key={`bowl-acc-${idx}`} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl">
                   <div className="flex items-center gap-3">
                     <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Honor</span>
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
               placeholder="e.g. 300 Game Club, State Singles Champion, Sectional Winner" 
               value={newAccolade} 
               onChange={(e) => setNewAccolade(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && addAccolade()}
               className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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