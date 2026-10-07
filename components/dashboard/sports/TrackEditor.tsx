'use client';

import React, { useState } from 'react';
import { Activity, Plus, ChevronDown, RefreshCw, Timer, Save, Check, Trash2 } from 'lucide-react';
import { evaluateMetric } from '@/utils/constants/RecruitingStandards'; 

const TRACK_EVENTS = [
  '55 Meters', '60 Meters', '100 Meters', '200 Meters', '300 Meters', '400 Meters', 
  '500 Meters', '600 Meters', '800 Meters', '1000 Meters', '1500 Meters', 
  '1600 Meters', '1 Mile', '3000 Meters', '3200 Meters', '2 Mile', 
  '55m Hurdles', '60m Hurdles', '100m Hurdles', '110m Hurdles', 
  '300m Hurdles', '400m Hurdles',
  'Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault', 
  'Shot Put', 'Discus', 'Javelin'
];

export interface TrackEditorProps {
  trackStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  displayRating?: number;
}

export default function TrackEditor({ trackStats, genderKey, onSync, showToast, displayRating = 0 }: TrackEditorProps) {
  const initialMetrics = trackStats.metrics && trackStats.metrics.length > 0 
    ? trackStats.metrics.map((m: any, idx: number) => ({ ...m, id: `metric-${idx}`, isEditing: false }))
    : [{ id: 'init', name: '100 Meters', value: '', isEditing: true }];

  const [metricList, setMetricList] = useState<{id: string; name: string; value: string; isEditing: boolean}[]>(initialMetrics);
  const [isSaving, setIsSaving] = useState(false);

  const checkIsDistance = (eventName: string) => 
    ['Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault', 'Shot Put', 'Discus', 'Javelin'].includes(eventName);

  const sanitizeMark = (event: string, mark: string) => {
    let sanitized = mark.trim();
    if ((event.includes('Meters') || event.includes('Mile')) && sanitized.includes(':') && !sanitized.includes('.')) {
      sanitized += '.00';
    }
    return sanitized;
  };

  const getCalculatedScore = (eventName: string, markValue: string) => {
    if (!markValue) return 0;
    const cleanMark = sanitizeMark(eventName, markValue);
    const nativeResult = evaluateMetric(genderKey, 'Track & Field', eventName, cleanMark, 'Varsity');
    const nativeScore = nativeResult?.score || 10;
    
    if (nativeScore > 10) return nativeScore;

    if (eventName === '3000 Meters') {
      const parts = cleanMark.split(':');
      if (parts.length === 2) {
        const mins = parseInt(parts[0], 10);
        const secs = parseFloat(parts[1]);
        if (!isNaN(mins) && !isNaN(secs)) {
          const totalSeconds = (mins * 60) + secs;
          const convertedSeconds = totalSeconds * 1.0737; 
          
          const newMins = Math.floor(convertedSeconds / 60);
          const newSecs = (convertedSeconds % 60).toFixed(2);
          const proxyMark = `${newMins}:${newSecs.padStart(5, '0')}`;
          
          const proxyResult = evaluateMetric(genderKey, 'Track & Field', '3200 Meters', proxyMark, 'Varsity');
          return proxyResult?.score || 10;
        }
      }
    }
    return nativeScore;
  };

  const getTierLabel = (score: number) => {
    if (score >= 95) return { text: 'Power 4 D1 Elite', color: 'from-fuchsia-500 to-indigo-500 shadow-fuchsia-500/20', solid: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30' };
    if (score >= 85) return { text: 'Mid-Major D1 Priority', color: 'from-purple-500 to-blue-500 shadow-purple-500/20', solid: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
    if (score >= 75) return { text: 'Top D2 / D1 Walk-on', color: 'from-blue-500 to-cyan-500 shadow-blue-500/20', solid: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
    if (score >= 65) return { text: 'Solid D2 / High D3', color: 'from-emerald-500 to-teal-500 shadow-emerald-500/20', solid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    if (score >= 55) return { text: 'D3 / NAIA Prospect', color: 'from-amber-500 to-orange-500 shadow-amber-500/20', solid: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    if (score >= 40) return { text: 'Strong Varsity', color: 'from-slate-500 to-slate-700 shadow-slate-500/20', solid: 'bg-slate-500/20 text-slate-300 border-slate-400/50' };
    return { text: 'Developing Varsity', color: 'from-slate-700 to-slate-800 shadow-slate-500/20', solid: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
  };

  const getActiveScore = () => {
    if (displayRating > 0) return displayRating;
    let highest = 0;
    metricList.forEach((m) => {
      const s = getCalculatedScore(m.name, m.value);
      if (s > highest) highest = s;
    });
    return highest;
  };

  const activeScore = getActiveScore();
  const activeTier = getTierLabel(activeScore);

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
      { id: `new-${Date.now()}`, name: TRACK_EVENTS[0], value: '', isEditing: true }
    ]);
  };

  const handleRemoveEvent = (index: number) => {
    setMetricList(metricList.filter((_, i) => i !== index));
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const cleanedMetrics = metricList
      .filter(m => m.value.trim() !== '')
      .map(({ name, value }) => ({ 
        name, 
        value: sanitizeMark(name, value),
        score: getCalculatedScore(name, value)
      }));

    await onSync({
      ...trackStats,
      metrics: cleanedMetrics,
      calculatedRating: activeScore
    });

    setMetricList(prev => prev
      .filter(m => m.value.trim() !== '')
      .map(m => ({ ...m, value: sanitizeMark(m.name, m.value), isEditing: false }))
    );

    showToast("Track & Field metrics synced to database!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2.5rem] p-4 sm:p-6 md:p-8 text-white shadow-2xl relative w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 sm:p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">Track & Field Engine</h3>
          </div>
        </div>

        {activeScore > 0 && (
          <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-md px-4 py-2 sm:py-3 rounded-2xl border border-slate-800 shadow-inner w-full md:w-auto justify-between md:justify-start">
            <div className="text-left">
              <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">Recruitment Rating</span>
              <span className={`text-xs sm:text-sm font-black bg-gradient-to-r ${activeTier.color} bg-clip-text text-transparent`}>
                {activeTier.text}
              </span>
            </div>
            <div className={`text-xl sm:text-3xl font-black px-3 py-1 sm:px-4 sm:py-1.5 bg-gradient-to-br ${activeTier.color} text-white rounded-xl shadow-lg shrink-0`}>
              {activeScore}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 pb-1 relative z-10 border-b border-slate-800/80 mb-5">
        <p className="text-[10px] sm:text-xs text-slate-500 font-bold leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800">
          <strong className="text-emerald-400">Tip:</strong> Enter distance marks using spaces (<code className="text-emerald-300 bg-emerald-950 px-1 rounded">52 6.5</code> = 52' 6.5"). Tap any tile below to edit it.
        </p>
      </div>

      {/* COMPACT GRID LAYOUT */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 relative z-10">
        
        {metricList.map((metric, idx) => {
          const isDistance = checkIsDistance(metric.name);
          const indScore = getCalculatedScore(metric.name, metric.value);
          const indTier = getTierLabel(indScore);

          // EDIT MODE (Expands to full width on mobile)
          if (metric.isEditing) {
            return (
              <div key={metric.id} className="col-span-2 sm:col-span-3 lg:col-span-4 bg-slate-900 border border-emerald-500/50 p-4 rounded-[1.25rem] shadow-[0_0_20px_rgba(16,185,129,0.1)] flex flex-col sm:flex-row items-center gap-3 animate-in zoom-in-95 duration-200">
                <div className="relative w-full sm:w-1/3">
                  <select 
                    value={metric.name} 
                    onChange={e => handleUpdateEvent(idx, 'name', e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500/50 rounded-xl px-3 py-3 text-sm font-bold outline-none text-slate-300 shadow-inner appearance-none cursor-pointer"
                  >
                    {TRACK_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-600 absolute right-3 top-3.5 pointer-events-none" />
                </div>
                
                <div className="relative w-full sm:w-1/3 flex-1">
                  <input 
                    type="text" 
                    placeholder={isDistance ? "e.g. 52 6.5" : "e.g. 10.85"} 
                    value={metric.value} 
                    onChange={e => handleUpdateEvent(idx, 'value', e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500/50 rounded-xl px-3 py-3 text-sm font-bold tracking-wide outline-none text-white placeholder-slate-600 shadow-inner"
                  />
                  {isDistance ? (
                    <Activity className="w-4 h-4 text-slate-600 absolute right-3 top-3.5 pointer-events-none" />
                  ) : (
                    <Timer className="w-4 h-4 text-slate-600 absolute right-3 top-3.5 pointer-events-none" />
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                  <button 
                    onClick={() => toggleEdit(idx, false)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white px-4 py-3 rounded-xl transition-colors font-bold text-xs shrink-0"
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
              className="bg-slate-800/50 hover:bg-slate-700 border border-slate-700/80 hover:border-emerald-500/50 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all relative group animate-in fade-in duration-300"
            >
              <div className="absolute top-2 right-2 flex items-center gap-1">
                {indScore > 0 && <span className="text-[8px] font-black text-emerald-400">{indScore}</span>}
                <div className={`w-1.5 h-1.5 rounded-full ${indTier.color} bg-gradient-to-r`} title={indTier.text} />
              </div>
              
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1 line-clamp-1 break-words">{metric.name}</span>
              <span className="text-xl sm:text-2xl font-black text-white">{metric.value || '--'}</span>
            </div>
          );
        })}

        {/* COMPACT ADD BUTTON */}
        <button 
          onClick={handleAddEvent}
          className="col-span-1 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 flex flex-col items-center justify-center text-slate-500 hover:text-emerald-400 transition-all cursor-pointer shadow-sm group p-4 min-h-[90px]"
        >
          <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-widest">Add Event</span>
        </button>

      </div>

      <div className="pt-6 relative z-10 flex flex-col sm:flex-row justify-end border-t border-slate-800/80 mt-6">
        <button 
          onClick={handleManualSave}
          disabled={isSaving}
          className="w-full sm:w-auto h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-8 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
          {isSaving ? 'Syncing Profile...' : 'Save & Sync Metrics'}
        </button>
      </div>
    </div>
  );
}