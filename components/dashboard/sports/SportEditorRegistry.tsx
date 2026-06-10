'use client';

import React, { useState } from 'react';
import { CheckCircle2, Plus, X } from 'lucide-react';

// ==========================================
// 🚨 IMPORT ALL SPECIFIC SPORT EDITORS
// ==========================================
import XCEditor from './XCEditor';
import SwimEditor from './SwimEditor';
import FootballEditor from './FootballEditor';
import SoccerEditor from './SoccerEditor';
import LacrosseEditor from './LacrosseEditor';
import FieldHockeyEditor from './FieldHockeyEditor';
import BasketballEditor from './BasketballEditor';
import VolleyballEditor from './VolleyballEditor';
import WrestlingEditor from './WrestlingEditor';
import BaseballEditor from './BaseballEditor';
import SoftballEditor from './SoftballEditor';
import GolfEditor from './GolfEditor';
import TennisEditor from './TennisEditor';
import IceHockeyEditor from './IceHockeyEditor';
import WaterPoloEditor from './WaterPoloEditor';
import GymnasticsEditor from './GymnasticsEditor';
import BowlingEditor from './BowlingEditor';
import FencingEditor from './FencingEditor';

// Import our Engine Constants
import { evaluateMetric, getOverallTier, SportMetaConfig } from '@/utils/constants/RecruitingStandards';

interface SportRegistryProps {
  sport: string;
  sportStats: any;
  genderKey: string;
  athleteProfile: any;
  config: SportMetaConfig;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function SportEditorRegistry({ 
  sport, sportStats, genderKey, athleteProfile, config, onSync, showToast 
}: SportRegistryProps) {
  
  // Local state for the generic fallback editor
  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');

  // ==========================================
  // 1. ROUTE TO CUSTOM EDITORS
  // ==========================================
  if (sport === 'Cross Country') return <XCEditor xcStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Swimming & Diving') return <SwimEditor swimStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Football') return <FootballEditor footballStats={sportStats} onSync={onSync} showToast={showToast} />;
  if (sport === 'Soccer') return <SoccerEditor soccerStats={sportStats} onSync={onSync} showToast={showToast} />;
  if (sport === 'Lacrosse') return <LacrosseEditor lacrosseStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Field Hockey') return <FieldHockeyEditor fieldHockeyStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Basketball') return <BasketballEditor basketballStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Volleyball') return <VolleyballEditor volleyballStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Wrestling') return <WrestlingEditor wrestlingStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Baseball') return <BaseballEditor baseballStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Softball') return <SoftballEditor softballStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Golf') return <GolfEditor golfStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Tennis') return <TennisEditor tennisStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Ice Hockey') return <IceHockeyEditor hockeyStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Water Polo') return <WaterPoloEditor waterPoloStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Gymnastics') return <GymnasticsEditor gymnasticsStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Bowling') return <BowlingEditor bowlingStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;
  if (sport === 'Fencing') return <FencingEditor fencingStats={sportStats} genderKey={genderKey} onSync={onSync} showToast={showToast} />;

  // ==========================================
  // 2. FALLBACK TO GENERIC EDITOR 
  // (For Track & Field, or any new unmapped sport)
  // ==========================================
  const rating = sportStats?.calculatedRating || 0;
  const tier = getOverallTier(rating);

  const updateSportMeta = (field: 'position' | 'level', value: string) => {
    onSync({ ...sportStats, [field]: value });
  };

  const addSportMetric = () => {
    const name = newMetricName.trim();
    const val = newMetricValue.trim();
    if (!name || !val) return;

    const newMetrics = [...(sportStats.metrics || [])];
    const existingIdx = newMetrics.findIndex(m => m.name.toLowerCase() === name.toLowerCase());
    
    if (existingIdx >= 0) newMetrics[existingIdx] = { name, value: val }; 
    else newMetrics.push({ name, value: val });

    setNewMetricName('');
    setNewMetricValue('');
    onSync({ ...sportStats, metrics: newMetrics });
  };

  const removeSportMetric = (index: number) => {
    const newMetrics = [...(sportStats.metrics || [])];
    newMetrics.splice(index, 1);
    onSync({ ...sportStats, metrics: newMetrics });
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 pb-4 border-b border-slate-100 gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
             {sport} Metrics
             {sport === 'Track & Field' && <span title="Managed by Track Portal"><CheckCircle2 className="w-5 h-5 text-blue-500" /></span>}
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {!config?.requiresLevel ? 'Deterministic Mark Evaluation' : 'Skill Stat Allocation Profile'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {rating > 0 && (
            <div className={`flex items-center gap-4 ${tier.bg} border ${tier.border} p-3 rounded-2xl shadow-sm`}>
               <div className="text-right hidden sm:block">
                  <span className={`block text-[10px] font-black uppercase tracking-widest ${tier.color}`}>{tier.label}</span>
                  <span className="text-xs font-medium text-slate-600">{tier.desc}</span>
               </div>
               <div className="w-px h-10 bg-black/10 hidden sm:block"></div>
               <div className="text-center shrink-0 min-w-[3rem]">
                 <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Score</span>
                 <span className={`text-2xl font-black leading-none ${tier.color}`}>{rating}</span>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {config?.requiresLevel && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Position / Group</label>
              <select 
                value={sportStats?.position || ''} 
                onChange={(e) => updateSportMeta('position', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Target...</option>
                {config.positions?.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Level Of Play</label>
              <select 
                value={sportStats?.level || ''} 
                onChange={(e) => updateSportMeta('level', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Level...</option>
                <option value="JV / Dev Squad">JV / Dev Squad</option>
                <option value="Varsity Contributor">Varsity Contributor</option>
                <option value="Varsity Starter">Varsity Starter</option>
                <option value="All-Conference Tier">All-Conference Tier</option>
                <option value="All-State / National">All-State / National</option>
                <option value="Elite Club (ECNL / AAU / Next)">Elite Club / Travel</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block border-t border-slate-100 pt-4">Fine-Tuned Verification Metrics</label>
          
          {sport === 'Track & Field' && athleteProfile?.prs && athleteProfile.prs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 opacity-70">
              {athleteProfile.prs.map((m: any, idx: number) => {
                const evaluation = evaluateMetric(genderKey, sport, m.event, m.mark, sportStats?.level);
                return (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                      <span className="text-slate-500 truncate pr-2">{m.event}: <span className="text-slate-900 font-black">{m.mark}</span></span>
                      {evaluation && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-100/50 border border-blue-200 px-2 py-0.5 rounded-md ml-auto sm:ml-0 whitespace-nowrap">
                          {evaluation.currentTier}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {sportStats?.metrics?.map((m: any, idx: number) => {
                  const evaluation = evaluateMetric(genderKey, sport, m.name, m.value, sportStats?.level);
                  return (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-slate-500 truncate pr-2">{m.name}: <span className="text-slate-900 font-black">{m.value}</span></span>
                        {evaluation && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-100/50 border border-blue-200 px-2 py-0.5 rounded-md w-fit">
                            {evaluation.currentTier}
                          </span>
                        )}
                      </div>
                      <button onClick={() => removeSportMetric(idx)} className="text-slate-400 hover:text-red-500 shrink-0 ml-2"><X className="w-4 h-4"/></button>
                    </div>
                  )
                })}
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" list={`metrics-${sport}`} placeholder="Metric Category"
                  value={newMetricName} onChange={(e) => setNewMetricName(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <datalist id={`metrics-${sport}`}>
                  {config?.defaultMetrics?.map((m: string) => <option key={m} value={m}>{m}</option>)}
                </datalist>

                <div className="flex gap-2 sm:w-1/3 shrink-0">
                  <input 
                    type="text" inputMode="decimal" placeholder={!config?.requiresLevel ? "Time (e.g. 10.54 / 4:12)" : "Value (e.g. 18.4)"}
                    value={newMetricValue} onChange={(e) => setNewMetricValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSportMetric()}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button onClick={addSportMetric} className="bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-xl font-bold transition-colors shrink-0 flex items-center justify-center shadow-md">
                    <Plus className="w-5 h-5"/>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}