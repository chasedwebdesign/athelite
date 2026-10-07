'use client';

import React, { useState } from 'react';
import { Target, Trophy, Trash2, Save, Check, Plus, X, Activity, Edit3 } from 'lucide-react';

interface GolfEditorProps {
  golfStats: any;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function GolfEditor({ golfStats, onSync, showToast }: GolfEditorProps) {
  
  const getMetric = (name: string) => golfStats.metrics?.find((m: any) => m.name === name)?.value || '';
  
  const [avgScore, setAvgScore] = useState(getMetric('18-Hole Avg Score'));
  const [handicap, setHandicap] = useState(getMetric('Current Handicap Index'));
  
  // Tap-to-edit UI states
  const [isEditingAvg, setIsEditingAvg] = useState(!avgScore);
  const [isEditingHandicap, setIsEditingHandicap] = useState(!handicap);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dense Accolades states
  const [localAccolades, setLocalAccolades] = useState<string[]>(golfStats?.metaContext?.accolades || []);
  const [newAccolade, setNewAccolade] = useState('');
  const [showAccoladeForm, setShowAccoladeForm] = useState(false);

  const handleSaveStats = async () => {
    setIsSaving(true);
    const newMetrics = [];
    if (avgScore) newMetrics.push({ name: '18-Hole Avg Score', value: avgScore });
    if (handicap) newMetrics.push({ name: 'Current Handicap Index', value: handicap });

    await onSync({ ...golfStats, metrics: newMetrics });
    
    // Collapse inputs back into tile view
    if (avgScore) setIsEditingAvg(false);
    if (handicap) setIsEditingHandicap(false);
    
    showToast('Golf baseline metrics saved.', 'success');
    setIsSaving(false);
  };

  const addAccolade = () => {
    if (!newAccolade.trim()) return;
    const updated = [...localAccolades, newAccolade.trim()];
    setLocalAccolades(updated);
    setNewAccolade('');
    setShowAccoladeForm(false);
    onSync({ ...golfStats, metaContext: { ...golfStats.metaContext, accolades: updated }});
    showToast('Honor added to profile.', 'success');
  };

  const removeAccolade = (idx: number) => {
    const updated = localAccolades.filter((_, i) => i !== idx);
    setLocalAccolades(updated);
    onSync({ ...golfStats, metaContext: { ...golfStats.metaContext, accolades: updated }});
    showToast('Honor removed.', 'success');
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-4 sm:p-6 md:p-8 text-white shadow-2xl relative w-full animate-in fade-in duration-300">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-600/10 blur-[90px] rounded-full pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 sm:p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">Golf Baseline</h3>
          </div>
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-2">Single-Stat Focus Matrix</p>
        </div>
      </div>

      <div className="pt-4 pb-1 relative z-10 border-b border-slate-800/80 mb-5">
        <p className="text-[10px] sm:text-xs text-slate-500 font-bold leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800">
          <strong className="text-emerald-400">Tip:</strong> Tap on the metric tiles below to update your 18-hole average and current USGA Handicap Index.
        </p>
      </div>

      {/* COMPACT TAP-TO-EDIT GRID */}
      <div className="grid grid-cols-2 gap-3 relative z-10 mb-6">
        
        {/* AVERAGE SCORE TILE */}
        {isEditingAvg ? (
          <div className="col-span-2 bg-slate-900 border border-emerald-500/50 p-4 rounded-[1.25rem] shadow-[0_0_20px_rgba(16,185,129,0.1)] flex flex-col sm:flex-row items-center gap-3 animate-in zoom-in-95 duration-200">
            <div className="w-full sm:flex-1 relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1.5 block">18-Hole Tournament Average</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="e.g. 74.5" 
                  value={avgScore} 
                  onChange={e => setAvgScore(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white shadow-inner placeholder-slate-600"
                />
                <Target className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-0 sm:pt-5">
              <button 
                onClick={() => setIsEditingAvg(false)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white px-5 py-3 rounded-xl transition-colors font-bold text-xs shrink-0"
              >
                <Check className="w-4 h-4" /> Done
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsEditingAvg(true)}
            className="col-span-1 bg-slate-800/50 hover:bg-slate-700 border border-slate-700/80 hover:border-emerald-500/50 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all relative group animate-in fade-in duration-300 min-h-[90px]"
          >
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mb-1">18-Hole Avg</span>
            <span className="text-2xl sm:text-3xl font-black text-white">{avgScore || '--'}</span>
          </div>
        )}

        {/* HANDICAP TILE */}
        {isEditingHandicap ? (
          <div className="col-span-2 bg-slate-900 border border-emerald-500/50 p-4 rounded-[1.25rem] shadow-[0_0_20px_rgba(16,185,129,0.1)] flex flex-col sm:flex-row items-center gap-3 animate-in zoom-in-95 duration-200">
            <div className="w-full sm:flex-1 relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1.5 block">USGA Handicap Index</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-black text-slate-500">+</span>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="e.g. 1.2" 
                  value={handicap} 
                  onChange={e => setHandicap(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500/50 rounded-xl pl-8 pr-4 py-3 text-sm font-bold outline-none text-white shadow-inner placeholder-slate-600"
                />
              </div>
            </div>
            <div className="flex items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-0 sm:pt-5">
              <button 
                onClick={() => setIsEditingHandicap(false)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white px-5 py-3 rounded-xl transition-colors font-bold text-xs shrink-0"
              >
                <Check className="w-4 h-4" /> Done
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsEditingHandicap(true)}
            className="col-span-1 bg-slate-800/50 hover:bg-slate-700 border border-slate-700/80 hover:border-emerald-500/50 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all relative group animate-in fade-in duration-300 min-h-[90px]"
          >
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mb-1">Handicap</span>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {handicap ? `+${handicap}` : '--'}
            </span>
          </div>
        )}
      </div>

      <div className="pt-2 relative z-10 flex flex-col sm:flex-row justify-end border-t border-slate-800/80">
        <button 
          onClick={handleSaveStats}
          disabled={isSaving}
          className="w-full sm:w-auto h-12 mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-8 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        >
          <Save className="w-4 h-4" /> 
          {isSaving ? 'Syncing...' : 'Save Metrics'}
        </button>
      </div>

      {/* DENSE ACCOLADES SECTION */}
      <div className={`bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-4 sm:p-6 md:p-8 relative mt-8 z-10`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pb-4 border-b border-slate-800/60 gap-3">
           <div>
             <h4 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
               <Trophy className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> 
               Accolades & Impact
             </h4>
           </div>
           {!showAccoladeForm && (
             <button 
               onClick={() => setShowAccoladeForm(true)}
               className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 justify-center shrink-0 shadow-lg"
             >
               <Plus className="w-3.5 h-3.5" /> Add Honor
             </button>
           )}
        </div>

        {!showAccoladeForm && localAccolades.length === 0 && (
          <div 
            onClick={() => setShowAccoladeForm(true)}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-[1.5rem] text-center cursor-pointer hover:bg-slate-800/30 transition-all mt-2`}
          >
             <Trophy className="w-8 h-8 text-amber-500/50 mb-2" />
             <h4 className="text-sm font-black text-slate-300">No Honors Logged</h4>
          </div>
        )}

        {localAccolades.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
            {localAccolades.map((acc, idx) => (
              <div key={idx} className={`bg-slate-800/40 border border-slate-700 p-3 rounded-2xl flex items-center gap-3 relative overflow-hidden group transition-colors hover:border-emerald-500/30`}>
                <div className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0 pr-12">
                   <h3 className="text-sm font-black text-white truncate">{acc}</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">Career Honor</p>
                </div>
                <div className="absolute right-3 flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => removeAccolade(idx)}
                    className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAccoladeForm && (
          <div className="bg-slate-950 border border-emerald-500/30 p-4 sm:p-5 rounded-2xl relative mt-3 animate-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                 Add New Honor
               </span>
               <button onClick={() => { setShowAccoladeForm(false); setNewAccolade(''); }} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white bg-slate-900 rounded-lg"><X className="w-4 h-4"/></button>
             </div>
             
             <div className="mb-4">
                <input 
                  type="text" 
                  value={newAccolade} 
                  onChange={(e) => setNewAccolade(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && addAccolade()}
                  placeholder="e.g. State Medalist, Club Champion..." 
                  className={`w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500/50 transition-colors placeholder-slate-600`} 
                />
             </div>

             <button onClick={addAccolade} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg">Save Record</button>
          </div>
        )}
      </div>

    </div>
  );
}