'use client';

import React, { useState } from 'react';
import { Plus, X, Activity, Medal, Trash2, ChevronDown } from 'lucide-react';

const TRACK_EVENTS = [
  '55 Meters', '60 Meters', '100 Meters', '200 Meters', '300 Meters', '400 Meters', 
  '500 Meters', '600 Meters', '800 Meters', '1000 Meters', '1500 Meters', 
  '1600 Meters', '1 Mile', '3000 Meters', '3200 Meters', '2 Mile', 
  '5000 Meters', '10000 Meters',
  '55m Hurdles', '60m Hurdles', '100m Hurdles', '110m Hurdles', 
  '300m Hurdles', '400m Hurdles', '2000m Steeplechase', '3000m Steeplechase',
  'Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault', 
  'Shot Put', 'Discus', 'Javelin', 'Hammer Throw', 'Weight Throw',
  'Pentathlon', 'Heptathlon', 'Decathlon'
];

interface TrackEditorProps {
  trackStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function TrackEditor({ trackStats, genderKey, onSync, showToast }: TrackEditorProps) {
  const [newEvent, setNewEvent] = useState('');
  const [newMark, setNewMark] = useState('');

  // Accolade specific state
  const [localAccolades, setLocalAccolades] = useState<string[]>(trackStats?.metaContext?.accolades || []);
  const [newAccolade, setNewAccolade] = useState('');

  const addMetric = () => {
    if (!newEvent || !newMark) return showToast('Event and Mark are required.', 'error');

    const newMetrics = [...(trackStats.metrics || [])];
    const existingIdx = newMetrics.findIndex(m => m.name === newEvent);
    
    if (existingIdx >= 0) {
      newMetrics[existingIdx] = { name: newEvent, value: newMark };
    } else {
      newMetrics.push({ name: newEvent, value: newMark });
    }

    onSync({ ...trackStats, metrics: newMetrics });
    setNewEvent('');
    setNewMark('');
  };

  const removeMetric = (index: number) => {
    const newMetrics = [...(trackStats.metrics || [])];
    newMetrics.splice(index, 1);
    onSync({ ...trackStats, metrics: newMetrics });
  };

  const addAccolade = () => {
    if (!newAccolade.trim()) return;
    const updated = [...localAccolades, newAccolade.trim()];
    setLocalAccolades(updated);
    setNewAccolade('');
    onSync({ ...trackStats, metaContext: { ...trackStats.metaContext, accolades: updated }});
  };

  const removeAccolade = (idx: number) => {
    const updated = localAccolades.filter((_, i) => i !== idx);
    setLocalAccolades(updated);
    onSync({ ...trackStats, metaContext: { ...trackStats.metaContext, accolades: updated }});
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-inner relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-slate-800/60 gap-4 relative z-10">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-2">
             Track & Field Profile
          </h3>
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">Manual PR Entry Overrides</p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div>
           <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> Verified Personal Bests</label>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
             {trackStats?.metrics?.map((m: any, idx: number) => (
                <div key={`track-pr-${idx}`} className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold shadow-sm">
                  <span className="text-slate-400 truncate pr-2">{m.name}: <span className="text-white font-black">{m.value}</span></span>
                  <button onClick={() => removeMetric(idx)} className="text-slate-500 hover:text-red-500 shrink-0"><X className="w-4 h-4"/></button>
                </div>
             ))}
           </div>

           <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <select 
                  value={newEvent} 
                  onChange={(e) => setNewEvent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                >
                  <option value="">Select Event...</option>
                  {TRACK_EVENTS.map((m: string) => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-3.5 pointer-events-none" />
              </div>
              <div className="flex gap-2 sm:w-1/3 shrink-0">
                <input 
                  type="text" placeholder="Mark (e.g. 10.85 or 22' 4.5)"
                  value={newMark} onChange={(e) => setNewMark(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMetric()}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button onClick={addMetric} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-xl font-bold transition-colors shrink-0 flex items-center justify-center shadow-md">
                  <Plus className="w-5 h-5"/>
                </button>
              </div>
           </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60">
           <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1.5"><Medal className="w-3.5 h-3.5"/> Track Accolades & Impact</label>
           
           <div className="space-y-2 mb-3">
              {localAccolades.map((acc, idx) => (
                <div key={`track-acc-${idx}`} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-xl">
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
               placeholder="e.g. State Qualifier, Team MVP, Sectional Champ" 
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