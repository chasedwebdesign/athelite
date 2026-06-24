'use client';

import React, { useState } from 'react';
import { CheckCircle2, Plus, X, Medal, Save, ShieldCheck, Trash2, Trophy } from 'lucide-react';
import { evaluateMetric, getOverallTier, SportMetaConfig } from '@/utils/constants/RecruitingStandards';

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

// Helper to generate gamified styling for the individual PR pill badges
const getLocalTierStyles = (score: number) => {
  if (score >= 95) return { tier: 'Power 4 D1', colorClass: 'text-fuchsia-400', bgClass: 'bg-fuchsia-500/10', borderClass: 'border-fuchsia-500/50' };
  if (score >= 85) return { tier: 'Mid-Major D1', colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/50' };
  if (score >= 75) return { tier: 'Top D2 / Walk-On', colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/50' };
  if (score >= 65) return { tier: 'D2 / D3 Prospect', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/50' };
  if (score >= 55) return { tier: 'NAIA Prospect', colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/50' };
  if (score >= 40) return { tier: 'Strong Varsity', colorClass: 'text-slate-300', bgClass: 'bg-slate-500/20', borderClass: 'border-slate-400/50' };
  if (score >= 20) return { tier: 'Varsity Contributor', colorClass: 'text-slate-400', bgClass: 'bg-slate-500/10', borderClass: 'border-slate-500/30' };
  return { tier: 'Developmental', colorClass: 'text-slate-500', bgClass: 'bg-slate-500/5', borderClass: 'border-slate-600/30' };
};

// Helper for ordinal numbers (1st, 2nd, 3rd)
const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

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
  
  // ==========================================
  // STATE: GENERIC FALLBACK EDITOR
  // ==========================================
  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');

  // ==========================================
  // STATE: ACCOLADES
  // ==========================================
  const [localAccolades, setLocalAccolades] = useState<any[]>(sportStats?.metaContext?.accolades || []);
  const [showAccoladeForm, setShowAccoladeForm] = useState(false);
  const [accType, setAccType] = useState<'state' | 'other' | null>(null);
  const [accPlacement, setAccPlacement] = useState<number | ''>('');
  const [accContribution, setAccContribution] = useState('');
  const [accOtherText, setAccOtherText] = useState('');

  // ==========================================
  // GENERIC EDITOR ACTIONS
  // ==========================================
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

  // ==========================================
  // ACCOLADES ACTIONS
  // ==========================================
  const saveAccoladesData = (updatedAccolades: any[]) => {
    onSync({
      ...sportStats,
      metaContext: {
        ...(sportStats?.metaContext || {}),
        accolades: updatedAccolades
      }
    });
    showToast('Accolades synced successfully!', 'success');
  };

  const handleAddAccolade = () => {
    let newAcc: any = null;
    
    if (accType === 'state') {
      if (accPlacement === '' || !accContribution) {
        showToast('Please select both a placement and contribution level.', 'error');
        return;
      }
      newAcc = { type: 'state', placement: Number(accPlacement), contribution: accContribution };
    } else if (accType === 'other') {
      if (!accOtherText.trim()) {
        showToast('Please enter a description for your custom accolade.', 'error');
        return;
      }
      newAcc = { type: 'other', text: accOtherText.trim() };
    }

    if (newAcc) {
      const updated = [...localAccolades, newAcc];
      setLocalAccolades(updated);
      
      // Reset Form
      setShowAccoladeForm(false);
      setAccType(null);
      setAccPlacement('');
      setAccContribution('');
      setAccOtherText('');
      
      // Auto-save to Supabase instantly
      saveAccoladesData(updated);
    }
  };

  const handleRemoveAccolade = (indexToRemove: number) => {
    const updated = localAccolades.filter((_, idx) => idx !== indexToRemove);
    setLocalAccolades(updated);
    saveAccoladesData(updated); // Auto-save on deletion
  };

  // ==========================================
  // RENDER CUSTOM EDITOR ROUTER
  // ==========================================
  const renderCustomEditor = () => {
    const props = { sportStats, genderKey, onSync, showToast, athleteProfile, config };
    switch (sport) {
      case 'Cross Country': return <XCEditor xcStats={sportStats} {...props} />;
      case 'Swimming & Diving': return <SwimEditor swimStats={sportStats} {...props} />;
      case 'Football': return <FootballEditor footballStats={sportStats} {...props} />;
      case 'Soccer': return <SoccerEditor soccerStats={sportStats} {...props} />;
      case 'Lacrosse': return <LacrosseEditor lacrosseStats={sportStats} {...props} />;
      case 'Field Hockey': return <FieldHockeyEditor fieldHockeyStats={sportStats} {...props} />;
      case 'Basketball': return <BasketballEditor basketballStats={sportStats} {...props} />;
      case 'Volleyball': return <VolleyballEditor volleyballStats={sportStats} {...props} />;
      case 'Wrestling': return <WrestlingEditor wrestlingStats={sportStats} {...props} />;
      case 'Baseball': return <BaseballEditor baseballStats={sportStats} {...props} />;
      case 'Softball': return <SoftballEditor softballStats={sportStats} {...props} />;
      case 'Golf': return <GolfEditor golfStats={sportStats} {...props} />;
      case 'Tennis': return <TennisEditor tennisStats={sportStats} {...props} />;
      case 'Ice Hockey': return <IceHockeyEditor hockeyStats={sportStats} {...props} />;
      case 'Water Polo': return <WaterPoloEditor waterPoloStats={sportStats} {...props} />;
      case 'Gymnastics': return <GymnasticsEditor gymnasticsStats={sportStats} {...props} />;
      case 'Bowling': return <BowlingEditor bowlingStats={sportStats} {...props} />;
      case 'Fencing': return <FencingEditor fencingStats={sportStats} {...props} />;
      default: return null;
    }
  };

  const CustomEditorComponent = renderCustomEditor();
  const isTrack = sport === 'Track & Field';
  const rating = sportStats?.calculatedRating || 0;
  const tier = getOverallTier(rating);

  return (
    <div className="flex flex-col gap-5">
      
      {/* ----------------------------------------------------- */}
      {/* 1. CUSTOM EDITOR OR GENERIC FALLBACK                  */}
      {/* ----------------------------------------------------- */}
      {CustomEditorComponent ? (
        CustomEditorComponent
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-inner relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0"></div>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 pb-4 border-b border-slate-800/60 gap-4">
            <div>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                 {sport} Metrics
                 {isTrack && <span title="Managed by Track Portal"><CheckCircle2 className="w-5 h-5 text-blue-500" /></span>}
              </h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                {!config?.requiresLevel ? 'Deterministic Mark Evaluation' : 'Skill Stat Allocation Profile'}
              </p>
            </div>
            
            {/* Tier Badge for Generic Sports */}
            <div className="flex items-center gap-4">
              {!isTrack && rating > 0 && (
                <div className={`flex items-center gap-4 ${tier.bg} border ${tier.border} p-3 rounded-2xl shadow-sm`}>
                   <div className="text-right hidden sm:block">
                      <span className={`block text-[10px] font-black uppercase tracking-widest ${tier.color}`}>{tier.label}</span>
                      <span className={`text-xs font-medium ${tier.color} opacity-80`}>{tier.desc}</span>
                   </div>
                   <div className="w-px h-10 bg-black/20 hidden sm:block"></div>
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2 border-t border-slate-800/60 pt-6">
                 {isTrack && <ShieldCheck className="w-4 h-4 text-emerald-500" />} 
                 {isTrack ? 'Fine-Tuned Verification Metrics' : 'Custom Event / Stat Entries'}
              </p>
              
              {isTrack && sportStats?.metrics && sportStats.metrics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 opacity-90">
                  {sportStats.metrics.map((m: any, idx: number) => {
                    const evaluation = evaluateMetric(genderKey, sport, m.name, m.value, sportStats?.level);
                    const tierStyles = getLocalTierStyles(evaluation?.score || 10);
                    return (
                      <div key={idx} className="flex justify-between items-center bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors rounded-xl px-4 py-3 text-sm font-bold shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full justify-between">
                          <span className="text-slate-400 truncate pr-2">{m.name}: <span className="text-white font-black">{m.value}</span></span>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0 border ${tierStyles.colorClass} ${tierStyles.bgClass} ${tierStyles.borderClass}`}>
                            {tierStyles.tier}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : isTrack ? (
                 <div className="bg-slate-950/50 border border-dashed border-slate-800 rounded-xl p-6 text-center">
                   <p className="text-sm text-slate-500 font-bold">No verified track marks found.</p>
                   <p className="text-xs text-slate-600 mt-1">Sync your Athletic.net profile in the Track Portal to populate this matrix.</p>
                 </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {sportStats?.metrics?.map((m: any, idx: number) => {
                      const evaluation = evaluateMetric(genderKey, sport, m.name, m.value, sportStats?.level);
                      const tierStyles = getLocalTierStyles(evaluation?.score || 10);
                      return (
                        <div key={idx} className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-slate-400 truncate pr-2">{m.name}: <span className="text-white font-black">{m.value}</span></span>
                            {evaluation && (
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border w-fit ${tierStyles.colorClass} ${tierStyles.bgClass} ${tierStyles.borderClass}`}>
                                {tierStyles.tier}
                              </span>
                            )}
                          </div>
                          <button onClick={() => removeSportMetric(idx)} className="text-slate-500 hover:text-red-500 shrink-0 ml-2"><X className="w-4 h-4"/></button>
                        </div>
                      )
                    })}
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" list={`metrics-${sport}`} placeholder="Metric Category"
                      value={newMetricName} onChange={(e) => setNewMetricName(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                    <datalist id={`metrics-${sport}`}>
                      {config?.defaultMetrics?.map((m: string) => <option key={m} value={m}>{m}</option>)}
                    </datalist>

                    <div className="flex gap-2 sm:w-1/3 shrink-0">
                      <input 
                        type="text" inputMode="decimal" placeholder={!config?.requiresLevel ? "Time (e.g. 10.54)" : "Value (e.g. 18.4)"}
                        value={newMetricValue} onChange={(e) => setNewMetricValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSportMetric()}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button onClick={addSportMetric} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl font-bold transition-colors shrink-0 flex items-center justify-center shadow-md">
                        <Plus className="w-5 h-5"/>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- */}
      {/* 2. ACCOLADES SECTION (Always Renders Below Sport Editor) */}
      {/* ----------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-inner relative overflow-hidden animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-4">
           <h4 className="text-sm font-black text-white flex items-center gap-2">
             <Medal className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> 
             Season Accolades & Impact
           </h4>
           {/* If accolades exist, the add button moves to the top right to save space */}
           {!showAccoladeForm && localAccolades.length > 0 && (
             <button 
               onClick={() => setShowAccoladeForm(true)}
               className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
             >
               <Plus className="w-3 h-3" /> Add
             </button>
           )}
        </div>

        {/* 🚨 GAMIFIED EMPTY STATE 🚨 */}
        {!showAccoladeForm && localAccolades.length === 0 && (
          <div 
            onClick={() => setShowAccoladeForm(true)}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700/50 rounded-2xl text-center group cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all mt-2"
          >
             <div className="w-14 h-14 bg-slate-950 rounded-full flex items-center justify-center shadow-inner border border-slate-800 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-7 h-7 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
             </div>
             <h4 className="text-sm font-black text-slate-200 mb-1">No Season Honors Logged</h4>
             <p className="text-xs font-medium text-slate-500 max-w-sm">Coaches filter for proven winners. Tap here to add your state placements or custom honors to boost your profile's visibility.</p>
          </div>
        )}

        {/* List of Existing Accolades */}
        {localAccolades.length > 0 && (
          <div className="space-y-2 mb-6">
            {localAccolades.map((acc, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between group transition-colors hover:border-slate-700">
                <div className="flex items-center gap-3">
                  {acc.type === 'state' ? (
                    <>
                      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                        {getOrdinal(acc.placement)} in State
                      </div>
                      <span className="text-sm font-bold text-slate-300">{acc.contribution}</span>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                        Custom Honor
                      </div>
                      <span className="text-sm font-bold text-slate-300">{acc.text}</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleRemoveAccolade(idx)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg opacity-0 group-hover:opacity-100"
                  title="Remove Accolade"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Accolade Form */}
        {showAccoladeForm && (
          <div className="bg-slate-950 border border-indigo-500/30 p-5 rounded-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 shadow-[0_0_30px_rgba(79,70,229,0.1)]">
             <div className="flex items-center justify-between mb-4">
               <span className="text-xs font-black uppercase tracking-widest text-slate-400">Select Accolade Type</span>
               <button onClick={() => { setShowAccoladeForm(false); setAccType(null); }} className="text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
             </div>
             
             {/* Type Selector Buttons */}
             <div className="flex flex-col sm:flex-row gap-3 mb-5">
               <button 
                 onClick={() => setAccType('state')}
                 className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${accType === 'state' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
               >
                 State Placement
               </button>
               <button 
                 onClick={() => setAccType('other')}
                 className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${accType === 'other' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
               >
                 Custom Honor
               </button>
             </div>

             {/* Inputs for State Placement */}
             {accType === 'state' && (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 animate-in fade-in duration-300">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Placement (Raw Rank)</label>
                    <select
                      value={accPlacement}
                      onChange={(e) => setAccPlacement(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm font-bold text-white focus:border-amber-500 outline-none appearance-none"
                    >
                      <option value="" className="text-slate-500">Select placement...</option>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{getOrdinal(num)} Place</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Contribution Level</label>
                    <select
                      value={accContribution}
                      onChange={(e) => setAccContribution(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm font-bold text-white focus:border-amber-500 outline-none appearance-none"
                    >
                      <option value="" className="text-slate-500">Select impact...</option>
                      <option value="Varsity Starter">Varsity Starter / Core Scorer</option>
                      <option value="Varsity Assist">Varsity Contributor / Assist</option>
                      <option value="Varsity Bench">Varsity Bench / Reserve</option>
                    </select>
                  </div>
               </div>
             )}

             {/* Inputs for Custom Honor */}
             {accType === 'other' && (
               <div className="mb-5 animate-in fade-in duration-300">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Honor Title</label>
                  <input
                    type="text"
                    value={accOtherText}
                    onChange={(e) => setAccOtherText(e.target.value)}
                    placeholder="e.g. All-Conference 1st Team, Team Captain"
                    className="w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm font-bold text-white focus:border-indigo-500 outline-none placeholder-slate-600"
                  />
               </div>
             )}

             {/* Auto-Save Form Button */}
             {accType && (
               <button 
                 onClick={handleAddAccolade}
                 className={`w-full text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${accType === 'state' ? 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.4)]' : 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)]'}`}
               >
                 <Plus className="w-4 h-4" /> Add & Sync Honor
               </button>
             )}
          </div>
        )}
      </div>

    </div>
  );
}