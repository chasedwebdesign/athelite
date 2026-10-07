'use client';

import React, { useState } from 'react';
import { Droplets, Timer, RefreshCw, Save, Activity, Plus, Trash2, Check, ChevronDown } from 'lucide-react';
import { compileSwimFitScore, AVAILABLE_SWIM_EVENTS, getSwimTierLabel } from '@/utils/SwimRecruitingEngine';

export interface SwimEditorProps {
  swimStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function SwimEditor({ swimStats, genderKey, onSync, showToast }: SwimEditorProps) {
  const initialMetrics = swimStats.metrics && swimStats.metrics.length > 0 
    ? swimStats.metrics.map((m: any, idx: number) => ({ ...m, id: `metric-${idx}`, isEditing: false }))
    : [{ id: 'init', name: '50 Free', value: '', isEditing: true }];

  const [metricList, setMetricList] = useState<{id: string; name: string; value: string; isEditing: boolean}[]>(initialMetrics);
  const [courseType, setCourseType] = useState<'SCY' | 'LCM' | 'SCM'>(swimStats.metaContext?.poolCourse || 'SCY');
  const [isSaving, setIsSaving] = useState(false);

  // Compute live score using a clean version of the array (stripping UI properties)
  const cleanMetricsForEngine = metricList.map(({ name, value }) => ({ name, value }));
  const { compositeScore, parsedMetrics } = compileSwimFitScore(
    genderKey,
    cleanMetricsForEngine,
    courseType
  );

  const activeTier = getSwimTierLabel(compositeScore);

  const handleUpdateEvent = (index: number, field: 'name' | 'value', newValue: string) => {
    const updated = [...metricList];
    updated[index][field] = newValue;
    setMetricList(updated);
  };

  const toggleEdit = (index: number, state: boolean) => {
    const updated = [...metricList];
    updated[index].isEditing = state;
    setMetricList(updated);
  };

  const handleAddEvent = () => {
    setMetricList([
      ...metricList, 
      { id: `new-${Date.now()}`, name: AVAILABLE_SWIM_EVENTS[0], value: '', isEditing: true }
    ]);
  };

  const handleRemoveEvent = (index: number) => {
    setMetricList(metricList.filter((_, i) => i !== index));
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    
    // Clean out empty values and UI states before pushing to DB
    const cleanedMetrics = metricList
      .filter(m => m.value.trim() !== '')
      .map(({ name, value }) => ({ name, value }));

    await onSync({
      ...swimStats,
      metrics: cleanedMetrics,
      calculatedRating: compositeScore,
      metaContext: { poolCourse: courseType }
    });

    // Reset all local items to view mode
    setMetricList(prev => prev.map(m => ({ ...m, isEditing: false })));

    showToast("Swimming & Diving metrics synced to database!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-4 sm:p-6 md:p-8 text-white shadow-2xl relative w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 sm:p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Droplets className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">Swim & Dive Engine</h3>
          </div>
          <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mt-2">
            Unweighted Average Matrix
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-md px-4 py-2 sm:py-3 rounded-2xl border border-slate-800 shadow-inner w-full md:w-auto justify-between md:justify-start">
            <div className="text-left">
              <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Recruitment Rating</span>
              <span className={`text-xs sm:text-sm font-black bg-gradient-to-r ${activeTier.color} bg-clip-text text-transparent`}>
                {activeTier.text}
              </span>
            </div>
            <div className={`text-xl sm:text-3xl font-black px-3 py-1 sm:px-4 sm:py-1.5 bg-gradient-to-br ${activeTier.color} text-white rounded-xl shadow-lg shrink-0`}>
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 pb-1 relative z-10 border-b border-slate-800/80 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <p className="text-[10px] sm:text-xs text-slate-500 font-bold leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex-1">
          <strong className="text-cyan-400">Tip:</strong> The engine automatically converts LCM/SCM times. Tap any tile below to edit your marks.
        </p>
        <div className="w-full sm:w-64 shrink-0 relative">
          <label className="text-[9px] font-black uppercase tracking-widest text-cyan-400 block mb-1.5 px-1">Pool Length</label>
          <select 
            value={courseType} 
            onChange={e => setCourseType(e.target.value as any)} 
            className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500/50 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none shadow-inner cursor-pointer appearance-none transition-colors"
          >
            <option value="SCY">SCY (Short Course Yards)</option>
            <option value="LCM">LCM (Long Course Meters)</option>
            <option value="SCM">SCM (Short Course Meters)</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-[26px] sm:top-7 pointer-events-none" />
        </div>
      </div>

      {/* COMPACT TAP-TO-EDIT GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 relative z-10">
        
        {metricList.map((metric, idx) => {
          const indScore = parsedMetrics.find(pm => pm.name === metric.name)?.score || 0;
          const indTier = getSwimTierLabel(indScore);

          // EDIT MODE (Expands to full width on mobile)
          if (metric.isEditing) {
            return (
              <div key={metric.id} className="col-span-2 sm:col-span-3 lg:col-span-4 bg-slate-900 border border-cyan-500/50 p-4 rounded-[1.25rem] shadow-[0_0_20px_rgba(6,182,212,0.1)] flex flex-col sm:flex-row items-center gap-3 animate-in zoom-in-95 duration-200">
                <div className="relative w-full sm:w-1/3">
                  <select 
                    value={metric.name} 
                    onChange={e => handleUpdateEvent(idx, 'name', e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500/50 rounded-xl px-3 py-3 text-sm font-bold outline-none text-slate-300 shadow-inner appearance-none cursor-pointer"
                  >
                    {AVAILABLE_SWIM_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-600 absolute right-3 top-3.5 pointer-events-none" />
                </div>
                
                <div className="relative w-full sm:w-1/3 flex-1">
                  <input 
                    type="text" 
                    placeholder="e.g. 17:01.50" 
                    value={metric.value} 
                    onChange={e => handleUpdateEvent(idx, 'value', e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500/50 rounded-xl px-3 py-3 text-sm font-bold tracking-wide outline-none text-white placeholder-slate-600 shadow-inner"
                  />
                  <Timer className="w-4 h-4 text-slate-600 absolute right-3 top-3.5 pointer-events-none" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                  <button 
                    onClick={() => toggleEdit(idx, false)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white px-4 py-3 rounded-xl transition-colors font-bold text-xs shrink-0"
                  >
                    <Check className="w-4 h-4" /> Done
                  </button>
                  <button 
                    onClick={() => handleRemoveEvent(idx)} 
                    className="w-11 h-11 flex items-center justify-center text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          }

          // VIEW MODE (Compact Tile)
          return (
            <div 
              key={metric.id} 
              onClick={() => toggleEdit(idx, true)}
              className="bg-slate-800/50 hover:bg-slate-700 border border-slate-700/80 hover:border-cyan-500/50 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all relative group animate-in fade-in duration-300 min-h-[90px]"
            >
              <div className="absolute top-2 right-2 flex items-center gap-1">
                {indScore > 0 && <span className="text-[8px] font-black text-cyan-400">{indScore}</span>}
                <div className={`w-1.5 h-1.5 rounded-full ${indTier?.color || 'bg-slate-500'} bg-gradient-to-r`} title={indTier?.text || 'Unranked'} />
              </div>
              
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 line-clamp-1 break-words">{metric.name}</span>
              <span className="text-xl sm:text-2xl font-black text-white">{metric.value || '--'}</span>
            </div>
          );
        })}

        {/* COMPACT ADD BUTTON */}
        <button 
          onClick={handleAddEvent}
          className="col-span-1 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 flex flex-col items-center justify-center text-slate-500 hover:text-cyan-400 transition-all cursor-pointer shadow-sm group p-4 min-h-[90px]"
        >
          <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-widest">Add Event</span>
        </button>

      </div>

      <div className="pt-6 relative z-10 flex flex-col sm:flex-row justify-end border-t border-slate-800/80 mt-6">
        <button 
          onClick={handleManualSave}
          disabled={isSaving}
          className="w-full sm:w-auto h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black px-8 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
          {isSaving ? 'Syncing Profile...' : 'Save & Sync Metrics'}
        </button>
      </div>
    </div>
  );
}