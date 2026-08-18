'use client';

import React, { useState } from 'react';
import { Activity, Plus, X, ChevronDown, Info, RefreshCw, Timer, ShieldCheck } from 'lucide-react';
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
  const [newEvent, setNewEvent] = useState('');
  const [newMark, setNewMark] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Determine if the current selected event is a field/distance event for dynamic UX
  const isDistanceEvent = ['Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault', 'Shot Put', 'Discus', 'Javelin'].includes(newEvent);

  // Engine alignment: Replicates XCEditor tiering logic
  const getTierLabel = (score: number) => {
    if (score >= 95) return { text: 'Power 4 D1 Elite', color: 'from-fuchsia-500 to-indigo-500 shadow-fuchsia-500/20' };
    if (score >= 85) return { text: 'Mid-Major D1 Priority', color: 'from-purple-500 to-blue-500 shadow-purple-500/20' };
    if (score >= 75) return { text: 'Top D2 / D1 Walk-on', color: 'from-blue-500 to-cyan-500 shadow-blue-500/20' };
    if (score >= 65) return { text: 'Solid D2 / High D3', color: 'from-emerald-500 to-teal-500 shadow-emerald-500/20' };
    if (score >= 55) return { text: 'D3 / NAIA Prospect', color: 'from-amber-500 to-orange-500 shadow-amber-500/20' };
    if (score >= 40) return { text: 'Strong Varsity', color: 'from-slate-500 to-slate-700 shadow-slate-500/20' };
    return { text: 'Developing Varsity Track', color: 'from-slate-700 to-slate-800 shadow-slate-500/20' };
  };

  // Helper to proxy missing engine standards (like 3000m) to their closest equivalent (3200m)
  const getCalculatedScore = (eventName: string, markValue: string) => {
    // 1. Try Native Engine Evaluation
    const nativeResult = evaluateMetric(genderKey, 'Track & Field', eventName, markValue, 'Varsity');
    const nativeScore = nativeResult?.score || 10;
    
    if (nativeScore > 10) return nativeScore;

    // 2. If engine returns 10 (unrecognized event), use conversion proxy for 3000 Meters
    if (eventName === '3000 Meters') {
      const parts = markValue.split(':');
      if (parts.length === 2) {
        const mins = parseInt(parts[0], 10);
        const secs = parseFloat(parts[1]);
        if (!isNaN(mins) && !isNaN(secs)) {
          const totalSeconds = (mins * 60) + secs;
          const convertedSeconds = totalSeconds * 1.0737; // Standard NFHS 3k to 3200m multiplier
          
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

  // Dynamically calculate the highest score if not passed from Registry
  const getActiveScore = () => {
    if (displayRating > 0) return displayRating;
    let highest = 0;
    (trackStats?.metrics || []).forEach((m: any) => {
      const s = m.score || getCalculatedScore(m.name, m.value);
      if (s > highest) highest = s;
    });
    return highest;
  };

  const activeScore = getActiveScore();
  const activeTier = getTierLabel(activeScore);

  // Normalizer: Solves the flat time issue by coercing standard database formatting
  const sanitizeMark = (event: string, mark: string) => {
    let sanitized = mark.trim();
    if ((event.includes('Meters') || event.includes('Mile')) && sanitized.includes(':') && !sanitized.includes('.')) {
      sanitized += '.00';
    }
    return sanitized;
  };

  const addMetric = async () => {
    if (!newEvent || !newMark) return showToast('Event and Mark are required.', 'error');

    setIsSaving(true);
    const formattedMark = sanitizeMark(newEvent, newMark);
    const newMetrics = [...(trackStats.metrics || [])];
    const existingIdx = newMetrics.findIndex((m: any) => m.name === newEvent);

    // Pre-evaluate to ensure immediate UI feedback and database indexing
    const calculatedScore = getCalculatedScore(newEvent, formattedMark);

    if (existingIdx >= 0) {
      newMetrics[existingIdx] = { name: newEvent, value: formattedMark, score: calculatedScore };
    } else {
      newMetrics.push({ name: newEvent, value: formattedMark, score: calculatedScore });
    }

    await onSync({ ...trackStats, metrics: newMetrics });
    setNewEvent('');
    setNewMark('');
    setIsSaving(false);
    showToast(`${newEvent} mark calculated and synced!`, 'success');
  };

  const removeMetric = async (index: number) => {
    setIsSaving(true);
    const newMetrics = [...(trackStats.metrics || [])];
    newMetrics.splice(index, 1);
    await onSync({ ...trackStats, metrics: newMetrics });
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Track & Field Overhaul Module</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Track & Field Parameters: <strong className="text-slate-200">{genderKey} Engine Standard</strong>
          </p>
        </div>

        {activeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Recruitment Rating</span>
              <span className={`text-xs font-black bg-gradient-to-r ${activeTier.color} bg-clip-text text-transparent`}>
                {activeTier.text}
              </span>
            </div>
            <div className={`text-2xl font-black px-3 py-1 bg-gradient-to-br ${activeTier.color} text-white rounded-xl shadow-lg shrink-0`}>
              {activeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 relative z-10">
        
        {/* Data Entry Left Side */}
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Select Event Discipline</label>
            <div className="relative">
              <select 
                value={newEvent} 
                onChange={(e) => setNewEvent(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm font-bold tracking-wide outline-none transition-all text-white placeholder-slate-600 shadow-inner appearance-none"
              >
                <option value="">Select Event...</option>
                {TRACK_EVENTS.map((m: string) => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Verified Mark (MM:SS.ms or FF' II")</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder={isDistanceEvent ? "e.g. 52 6.5 or 150 4" : "e.g. 9:20.00 or 10.85"} 
                  value={newMark}
                  onChange={(e) => setNewMark(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMetric()}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm font-bold tracking-wide outline-none transition-all text-white placeholder-slate-600 shadow-inner"
                />
                {isDistanceEvent ? (
                  <Activity className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
                ) : (
                  <Timer className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
                )}
              </div>
              <button 
                onClick={addMetric}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 rounded-xl font-bold transition-all shrink-0 flex items-center justify-center shadow-lg shadow-emerald-900/20 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[9px] text-slate-500 font-medium mt-2">
              {isDistanceEvent 
                ? "* Formatting tip: Enter distance marks using spaces for feet and inches (e.g., 52 6.5 equals 52' 6.5\")."
                : "* Formatting tip: The engine auto-corrects flat times (e.g., 9:20 → 9:20.00) to ensure accurate indexing."}
            </p>
          </div>
        </div>

        {/* Normalization Log Trace Right Side */}
        <div className="h-full">
          <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 h-full flex flex-col">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-3">
              <Info className="w-3.5 h-3.5" /> Normalization Log Trace
            </h4>
            
            {(!trackStats?.metrics || trackStats.metrics.length === 0) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl opacity-60">
                <ShieldCheck className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-400">No verified marks indexed.</p>
                <p className="text-[10px] text-slate-500 mt-1">Add marks to populate the tier breakdown matrix.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2 max-h-[400px]">
                {trackStats.metrics.map((metric: any, i: number) => {
                  const metricScore = metric.score || getCalculatedScore(metric.name, metric.value);
                  const tier = getTierLabel(metricScore);

                  return (
                    <div key={i} className="bg-slate-950/80 border border-slate-900 p-3 rounded-xl flex justify-between items-center text-xs group transition-all hover:border-slate-700">
                      <div>
                        <span className="font-black text-slate-200 block text-sm">{metric.name}</span>
                        <span className="text-slate-500 font-medium text-[11px]">
                          Raw Mark: <strong className="text-slate-400">{metric.value}</strong>
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-widest bg-gradient-to-r ${tier.color} bg-clip-text text-transparent block mb-0.5`}>
                            {tier.text}
                          </span>
                          <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase">
                            Score: {metricScore}/99
                          </span>
                        </div>
                        <button onClick={() => removeMetric(i)} disabled={isSaving} className="text-slate-600 hover:text-red-500 p-1.5 bg-slate-900 rounded-md hover:bg-red-500/10 transition-colors">
                          <X className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}