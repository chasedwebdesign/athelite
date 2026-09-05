'use client';

import React, { useState } from 'react';
import { Droplets, Timer, RefreshCw, Save, Activity, Plus, Trash2 } from 'lucide-react';
import { compileSwimFitScore, AVAILABLE_SWIM_EVENTS, getSwimTierLabel } from '@/utils/SwimRecruitingEngine';

export interface SwimEditorProps {
  swimStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function SwimEditor({ swimStats, genderKey, onSync, showToast }: SwimEditorProps) {
  // Map existing metrics or default to a single empty event
  const initialMetrics = swimStats.metrics && swimStats.metrics.length > 0 
    ? swimStats.metrics 
    : [{ name: '50 Free', value: '' }];

  const [metricList, setMetricList] = useState<{name: string; value: string}[]>(initialMetrics);
  const [courseType, setCourseType] = useState<'SCY' | 'LCM' | 'SCM'>(swimStats.metaContext?.poolCourse || 'SCY');
  const [isSaving, setIsSaving] = useState(false);

  // Compute live score using the dynamic array
  const { compositeScore, parsedMetrics } = compileSwimFitScore(
    genderKey,
    metricList,
    courseType
  );

  const activeTier = getSwimTierLabel(compositeScore);

  const handleUpdateEvent = (index: number, field: 'name' | 'value', newValue: string) => {
    const updated = [...metricList];
    updated[index][field] = newValue;
    setMetricList(updated);
  };

  const handleAddEvent = () => {
    setMetricList([...metricList, { name: AVAILABLE_SWIM_EVENTS[0], value: '' }]);
  };

  const handleRemoveEvent = (index: number) => {
    setMetricList(metricList.filter((_, i) => i !== index));
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    
    // Clean out empty values before saving
    const cleanedMetrics = metricList.filter(m => m.value.trim() !== '');

    await onSync({
      ...swimStats,
      metrics: cleanedMetrics,
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
            <span className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Droplets className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Swim & Dive Engine</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Engine evaluates your <strong className="text-cyan-400">unweighted average</strong> composite rating.
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

      <div className="pt-6 pb-2 relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-800/80 mb-6">
        <div className="w-full sm:w-1/3">
          <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block mb-2 px-1">Pool Length Modifier</label>
          <select 
            value={courseType} 
            onChange={e => setCourseType(e.target.value as any)} 
            className="w-full bg-slate-950 border border-cyan-500/30 text-cyan-100 rounded-xl px-4 py-3 text-sm font-bold outline-none shadow-inner cursor-pointer appearance-none"
          >
            <option value="SCY">SCY (Short Course Yards) - Base</option>
            <option value="LCM">LCM (Long Course Meters) - Auto Conv.</option>
            <option value="SCM">SCM (Short Course Meters) - Auto Conv.</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        
        {metricList.map((metric, idx) => (
          <div key={idx} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-sm group transition-all hover:border-slate-700">
             <div className="flex justify-between items-center mb-3">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Event {idx + 1}</label>
               {metricList.length > 1 && (
                 <button 
                   onClick={() => handleRemoveEvent(idx)} 
                   className="text-slate-500 hover:text-red-400 transition-colors p-1 bg-slate-900 rounded-md hover:bg-red-500/10 opacity-100 md:opacity-0 group-hover:opacity-100"
                   title="Remove Event"
                 >
                   <Trash2 className="w-3.5 h-3.5" />
                 </button>
               )}
             </div>
             
             <select 
               value={metric.name} 
               onChange={e => handleUpdateEvent(idx, 'name', e.target.value)} 
               className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3 py-2.5 text-sm font-bold outline-none text-slate-300 shadow-inner mb-3 transition-colors appearance-none cursor-pointer"
             >
               {AVAILABLE_SWIM_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
             </select>
             
             <div className="relative">
               <input 
                 type="text" 
                 placeholder="e.g. 17:01.50" 
                 value={metric.value} 
                 onChange={e => handleUpdateEvent(idx, 'value', e.target.value)} 
                 className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm font-bold tracking-wide outline-none text-white placeholder-slate-600 shadow-inner transition-colors"
               />
               <Timer className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
             </div>
          </div>
        ))}

        <button 
          onClick={handleAddEvent}
          className="h-full min-h-[140px] rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-cyan-400 transition-all cursor-pointer shadow-sm group"
        >
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest mt-1">Add Event</span>
        </button>

      </div>

      <div className="pt-6 relative z-10 flex flex-col xl:flex-row gap-6 items-start xl:items-end justify-between border-t border-slate-800/80 mt-6">
        <div className="w-full xl:w-2/3">
          {parsedMetrics.length > 0 && (
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-4 backdrop-blur-md">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-2">
                <Activity className="w-3.5 h-3.5" /> Individual Event Scores
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parsedMetrics.map((metric, i) => {
                  const indTier = getSwimTierLabel(metric.score);
                  const rawMark = metricList.find(m => m.name === metric.name)?.value || '--';
                  
                  return (
                    <div key={i} className={`bg-slate-950/80 border p-3.5 rounded-xl flex justify-between items-center group transition-all hover:border-slate-700 ${i === 0 ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-slate-800'}`}>
                      <div className="min-w-0 pr-2">
                        <span className={`font-black text-sm block truncate ${i === 0 ? 'text-cyan-400' : 'text-slate-200'}`}>
                          {metric.name}
                        </span>
                        <span className="text-slate-500 font-medium text-[11px] block mt-0.5">
                          Raw Mark: <strong className="text-slate-400">{rawMark}</strong>
                        </span>
                      </div>
                      
                      <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${indTier.solid}`}>
                          {indTier.text}
                        </span>
                        <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase">
                          Score: {metric.score}/99
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="w-full xl:w-auto shrink-0 flex">
          <button 
            onClick={handleManualSave}
            disabled={isSaving}
            className="w-full xl:w-auto h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black px-8 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing Profile...' : 'Save & Sync Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}