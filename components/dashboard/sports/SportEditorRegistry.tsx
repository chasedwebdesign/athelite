'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle2, Plus, X, Medal, ShieldCheck, Trash2, Trophy, ChevronDown, Award, Edit3, School } from 'lucide-react';
import { evaluateMetric, getOverallTier, SportMetaConfig } from '@/utils/constants/RecruitingStandards';

// 🚨 Specific Editors
import XCEditor from './XCEditor';
import SwimEditor from './SwimEditor';
import TrackEditor from './TrackEditor'; 

const TEAM_SPORTS = [
  'Football', 'Soccer', 'Lacrosse', 'Field Hockey', 
  'Basketball', 'Volleyball', 'Baseball', 'Softball', 
  'Ice Hockey', 'Water Polo'
];

// 🚨 SET RESPONSES (Enforced strict values for typable inputs)
const TEAM_PLACEMENTS = [
  '1st Place (Champion)', '2nd Place', '3rd Place', '4th Place', '5th Place',
  '6th Place', '7th Place', '8th Place', '9th Place', '10th Place',
  '11th Place', '12th Place', 'Top 16 / Sweet 16', 'Top 32', 'Qualifier'
];

const INDIVIDUAL_PLACEMENTS = [
  '1st Place (Champion)', '2nd Place', '3rd Place', '4th Place', '5th Place',
  '6th Place', '7th Place', '8th Place', '9th Place', '10th Place',
  '11th Place', '12th Place', '13th-25th Place', '26th-50th Place', '51st+ Place', 'Qualifier'
];

const CONTRIBUTION_LEVELS = [
  'Starting / Core Contributor',
  'Started Some of the Time',
  'Not Starting / Reserve'
];

const COMPETITION_LEVELS = [
  'Conference / District',
  'State',
  'Regional',
  'National'
];

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

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// 🚨 Dynamic Theming Engine based on Equipped Cosmetics
const getEquippedStyles = (profile: any) => {
  const style = profile?.equipped_card || profile?.equipped_border || 'base';
  switch (style) {
    case 'obsidian': return { 
      bg: 'bg-slate-900/60', border: 'border-slate-600', glow: 'shadow-[0_0_20px_rgba(71,85,105,0.15)]',
      text: 'text-slate-300', highlight: 'text-white', icon: 'text-slate-400',
      focusRing: 'focus:ring-slate-500/30 focus:border-slate-500',
      glowLine: 'from-slate-500/0 via-slate-500/50 to-slate-500/0'
    };
    case 'crimson': return { 
      bg: 'bg-red-950/30', border: 'border-red-500/50', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
      text: 'text-red-200', highlight: 'text-red-400', icon: 'text-red-500',
      focusRing: 'focus:ring-red-500/30 focus:border-red-500',
      glowLine: 'from-red-500/0 via-red-500/50 to-red-500/0'
    };
    case 'sapphire': return { 
      bg: 'bg-blue-950/30', border: 'border-blue-500/50', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      text: 'text-blue-200', highlight: 'text-blue-400', icon: 'text-blue-500',
      focusRing: 'focus:ring-blue-500/30 focus:border-blue-500',
      glowLine: 'from-blue-500/0 via-blue-500/50 to-blue-500/0'
    };
    case 'hype': return { 
      bg: 'bg-indigo-950/30', border: 'border-indigo-500/50', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]',
      text: 'text-indigo-200', highlight: 'text-indigo-400', icon: 'text-indigo-500',
      focusRing: 'focus:ring-indigo-500/30 focus:border-indigo-500',
      glowLine: 'from-indigo-500/0 via-indigo-500/50 to-indigo-500/0'
    };
    case 'premium': return { 
      bg: 'bg-amber-950/30', border: 'border-amber-500/50', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      text: 'text-amber-200', highlight: 'text-amber-400', icon: 'text-amber-500',
      focusRing: 'focus:ring-amber-500/30 focus:border-amber-500',
      glowLine: 'from-amber-500/0 via-amber-500/50 to-amber-500/0'
    };
    case 'amethyst': return { 
      bg: 'bg-fuchsia-950/30', border: 'border-fuchsia-500/50', glow: 'shadow-[0_0_20px_rgba(217,70,239,0.15)]',
      text: 'text-fuchsia-200', highlight: 'text-fuchsia-400', icon: 'text-fuchsia-500',
      focusRing: 'focus:ring-fuchsia-500/30 focus:border-fuchsia-500',
      glowLine: 'from-fuchsia-500/0 via-fuchsia-500/50 to-fuchsia-500/0'
    };
    case 'cyber': return { 
      bg: 'bg-cyan-950/30', border: 'border-cyan-500/50', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      text: 'text-cyan-200', highlight: 'text-cyan-400', icon: 'text-cyan-500',
      focusRing: 'focus:ring-cyan-500/30 focus:border-cyan-500',
      glowLine: 'from-cyan-500/0 via-cyan-500/50 to-cyan-500/0'
    };
    default: return { 
      bg: 'bg-slate-950/50', border: 'border-slate-800', glow: 'shadow-lg',
      text: 'text-slate-400', highlight: 'text-white', icon: 'text-indigo-500',
      focusRing: 'focus:ring-indigo-500/30 focus:border-indigo-500',
      glowLine: 'from-indigo-500/0 via-indigo-500/50 to-indigo-500/0'
    };
  }
};

interface SportRegistryProps {
  sport: string;
  sportStats: any;
  genderKey: string;
  athleteProfile: any;
  config: SportMetaConfig;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onDisable?: () => void;
  onDelete?: () => void;
}

export default function SportEditorRegistry({ 
  sport, sportStats, genderKey, athleteProfile, config, onSync, showToast, onDisable, onDelete 
}: SportRegistryProps) {
  
  const isTeamSport = TEAM_SPORTS.includes(sport);
  const isTrack = sport === 'Track & Field';

  const eq = getEquippedStyles(athleteProfile);

  // Generic Metric States (Only used if NOT a team sport and NOT an individual specific editor)
  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');

  // 🚨 Unified Accolades & Placements State
  const [localAccolades, setLocalAccolades] = useState<any[]>(sportStats?.metaContext?.accolades || []);
  const [showAccoladeForm, setShowAccoladeForm] = useState(false);
  
  const [accCategory, setAccCategory] = useState<'HS_Team' | 'Club_Team' | 'Individual' | 'Honor' | ''>('');
  const [accLevel, setAccLevel] = useState('');
  const [accPlacement, setAccPlacement] = useState('');
  const [accContribution, setAccContribution] = useState('');
  const [accHonorText, setAccHonorText] = useState('');

  const updateSportMeta = (field: string, value: string) => {
    onSync({ ...sportStats, [field]: value });
  };

  const updateMetaContext = (field: string, value: string) => {
    onSync({
      ...sportStats,
      metaContext: {
        ...(sportStats?.metaContext || {}),
        [field]: value
      }
    });
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

  const saveAccoladesData = (updatedAccolades: any[]) => {
    onSync({
      ...sportStats,
      metaContext: {
        ...(sportStats?.metaContext || {}),
        accolades: updatedAccolades
      }
    });
    showToast('Placements & honors synced successfully!', 'success');
  };

  const handleAddAccolade = () => {
    let newAcc: any = null;

    if (accCategory === 'HS_Team' || accCategory === 'Club_Team') {
      if (!accLevel || !accPlacement || !accContribution) {
        return showToast('Please fill out all placement fields.', 'error');
      }
      if (!TEAM_PLACEMENTS.includes(accPlacement)) {
        return showToast('Invalid entry. Please select a placement from the predefined dropdown list.', 'error');
      }
      newAcc = { type: accCategory, level: accLevel, placement: accPlacement, contribution: accContribution };
    
    } else if (accCategory === 'Individual') {
      if (!accLevel || !accPlacement) {
        return showToast('Please select a competition level and placement.', 'error');
      }
      if (!INDIVIDUAL_PLACEMENTS.includes(accPlacement)) {
        return showToast('Invalid entry. Please select an individual placement from the predefined dropdown list.', 'error');
      }
      newAcc = { type: accCategory, level: accLevel, placement: accPlacement };
    
    } else if (accCategory === 'Honor') {
      if (!accHonorText.trim()) {
        return showToast('Please enter a description for your custom honor.', 'error');
      }
      newAcc = { type: 'Honor', text: accHonorText.trim() };
    }

    if (newAcc) {
      const updated = [...localAccolades, newAcc];
      setLocalAccolades(updated);
      
      // Reset Form State
      setShowAccoladeForm(false);
      setAccCategory('');
      setAccLevel('');
      setAccPlacement('');
      setAccContribution('');
      setAccHonorText('');
      
      saveAccoladesData(updated);
    }
  };

  const handleRemoveAccolade = (indexToRemove: number) => {
    const updated = localAccolades.filter((_, idx) => idx !== indexToRemove);
    setLocalAccolades(updated);
    saveAccoladesData(updated);
  };

  // 🚨 Action Bar: Enable direct sport disabling/wiping via the Registry if dashboard doesn't override
  const handleDisableSport = async () => {
    if (onDisable) return onDisable();
    if (!athleteProfile?.id) return;
    try {
      const supabase = createClient();
      await supabase.from('athlete_sports').update({ is_active: false }).eq('athlete_id', athleteProfile.id).eq('sport_name', sport);
      showToast(`${sport} has been disabled.`, 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast('Failed to disable sport.', 'error');
    }
  };

  const handleDeleteSport = async () => {
    if (onDelete) return onDelete();
    if (!athleteProfile?.id) return;
    if (!window.confirm(`Are you sure you want to permanently delete all ${sport} data?`)) return;
    try {
      const supabase = createClient();
      await supabase.from('athlete_sports').delete().eq('athlete_id', athleteProfile.id).eq('sport_name', sport);
      showToast(`${sport} data has been completely removed.`, 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast('Failed to delete sport.', 'error');
    }
  };

  // 🚨 Score Engine: Determine the Top Metric dynamically for Track & Swim Sections
  const getDisplayScore = () => {
    if (sport === 'Track & Field' || sport === 'Swimming & Diving') {
      if (!sportStats?.metrics || sportStats.metrics.length === 0) return 0;
      let topScore = 0;
      sportStats.metrics.forEach((m: any) => {
        const evalLevel = sport === 'Track & Field' ? 'Varsity' : (sportStats?.level || 'Varsity');
        const evalResult = evaluateMetric(genderKey, sport, m.name, m.value, evalLevel);
        const metricScore = m.score || evalResult?.score || 0;
        if (metricScore > topScore) topScore = metricScore;
      });
      // Fallback safely to computed rating if manual stat injection overrides logic
      return Math.max(topScore, sportStats?.calculatedRating || 0);
    }
    return sportStats?.calculatedRating || 0;
  };

  const rating = getDisplayScore();
  const tier = getOverallTier(rating);

  // 🚨 Custom Component Hook-up
  const renderCustomEditor = () => {
    // Pass the equipped theme down in case the custom editors want to utilize it!
    const props = { sportStats, genderKey, onSync, showToast, athleteProfile, config, displayRating: rating, displayTier: tier, equippedTheme: eq };
    if (isTeamSport) return null; 
    switch (sport) {
      case 'Cross Country': return <XCEditor xcStats={sportStats} {...props} />;
      case 'Swimming & Diving': return <SwimEditor swimStats={sportStats} {...props} />;
      case 'Track & Field': return <TrackEditor trackStats={sportStats} {...props} />;
      default: return null;
    }
  };

  const CustomEditorComponent = renderCustomEditor();

  return (
    <div className="flex flex-col gap-5 relative">
      
      {/* 🚨 SPORT CONTROLS: Disable & Delete Bar 🚨 */}
      <div className="flex justify-end items-center gap-3 mb-1">
        <button 
          onClick={handleDisableSport}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-500 bg-slate-900/40 hover:bg-slate-900 px-4 py-2 rounded-xl transition-colors border border-slate-800/50 shadow-sm"
        >
          Disable {sport}
        </button>
        <button 
          onClick={handleDeleteSport}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 bg-slate-900/40 hover:bg-slate-900 px-4 py-2 rounded-xl transition-colors border border-slate-800/50 flex items-center gap-1.5 shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete {sport}
        </button>
      </div>

      {CustomEditorComponent ? (
        CustomEditorComponent
      ) : (
        <div className={`bg-slate-900/80 backdrop-blur-xl border-2 ${eq.border} ${eq.glow} rounded-3xl p-6 md:p-8 relative overflow-hidden animate-in fade-in duration-300`}>
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${eq.glowLine}`}></div>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 pb-4 border-b border-slate-800/60 gap-4">
            <div>
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                 {isTeamSport ? 'Core Baseline Settings' : `${sport} Metrics`}
                 {isTrack && <span title="Managed by Track Portal"><CheckCircle2 className={`w-5 h-5 ${eq.icon}`} /></span>}
              </h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                {isTeamSport ? 'Deterministic Baseline Profile' : (!config?.requiresLevel ? 'Deterministic Mark Evaluation' : 'Skill Stat Allocation Profile')}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {rating > 0 && (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {config?.requiresLevel && (
                <>
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Position / Group</label>
                    <select 
                      value={sportStats?.position || ''} 
                      onChange={(e) => updateSportMeta('position', e.target.value)}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing} appearance-none transition-all`}
                    >
                      <option value="">Select Target...</option>
                      {config.positions?.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-9 pointer-events-none" />
                  </div>
                  
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Level Of Play</label>
                    <select 
                      value={sportStats?.level || ''} 
                      onChange={(e) => updateSportMeta('level', e.target.value)}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing} appearance-none transition-all`}
                    >
                      <option value="">Select Level...</option>
                      <option value="JV / Dev Squad">JV / Dev Squad</option>
                      <option value="Varsity Contributor">Varsity Contributor</option>
                      <option value="Varsity Starter">Varsity Starter</option>
                      <option value="All-Conference Tier">All-Conference Tier</option>
                      <option value="All-State / National">All-State / National</option>
                      <option value="Elite Club (ECNL / AAU / Next)">Elite Club / Travel</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-9 pointer-events-none" />
                  </div>
                </>
              )}
              
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block flex items-center gap-1">
                  <School className="w-3 h-3" /> School Size (Enrollment)
                </label>
                <select 
                  value={sportStats?.metaContext?.schoolSize || ''} 
                  onChange={(e) => updateMetaContext('schoolSize', e.target.value)}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing} appearance-none transition-all`}
                >
                  <option value="">Select Size...</option>
                  <option value="Small (< 500)">Small (&lt; 500 students)</option>
                  <option value="Medium (500 - 999)">Medium (500 - 999 students)</option>
                  <option value="Large (1,000 - 1,999)">Large (1,000 - 1,999 students)</option>
                  <option value="Mega (2,000+)">Mega (2,000+ students)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-9 pointer-events-none" />
              </div>
            </div>

            {!isTeamSport && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2 border-t border-slate-800/60 pt-6">
                   {isTrack && <ShieldCheck className="w-4 h-4 text-emerald-500" />} 
                   {isTrack ? 'Fine-Tuned Verification Metrics' : 'Custom Event / Stat Entries'}
                </p>
                
                {isTrack && sportStats?.metrics && sportStats.metrics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 opacity-90">
                    {sportStats.metrics.map((m: any, idx: number) => {
                      const evalLevel = sport === 'Track & Field' ? 'Varsity' : (sportStats?.level || 'Varsity');
                      const evaluation = evaluateMetric(genderKey, sport, m.name, m.value, evalLevel);
                      const metricScore = m.score || evaluation?.score || 10;
                      const tierStyles = getLocalTierStyles(metricScore);
                      
                      return (
                        <div key={idx} className={`flex justify-between items-center ${eq.bg} border ${eq.border} rounded-2xl px-4 py-3 text-sm font-bold shadow-sm group transition-transform hover:scale-[1.02] hover:${eq.glow}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full justify-between">
                            <span className={`${eq.text} truncate pr-2`}>{m.name}: <span className={`${eq.highlight} font-black`}>{m.value}</span></span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0 border ${tierStyles.colorClass} ${tierStyles.bgClass} ${tierStyles.borderClass}`}>
                              {tierStyles.tier}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity pl-2 shrink-0">
                            <button 
                              onClick={() => {
                                setNewMetricName(m.name);
                                setNewMetricValue(m.value);
                                removeSportMetric(idx);
                              }} 
                              className={`text-slate-500 hover:${eq.icon} p-1.5 bg-slate-950 rounded-md hover:bg-slate-900 transition-colors`}
                              title="Edit Score"
                            >
                              <Edit3 className="w-4 h-4"/>
                            </button>
                            <button onClick={() => removeSportMetric(idx)} className="text-slate-500 hover:text-red-500 p-1.5 bg-slate-950 rounded-md hover:bg-red-500/10 transition-colors" title="Delete Score">
                              <X className="w-4 h-4"/>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : isTrack ? (
                   <div className={`bg-slate-950/50 border border-dashed ${eq.border} rounded-2xl p-6 text-center`}>
                     <p className={`text-sm ${eq.text} font-bold`}>No verified track marks found.</p>
                     <p className="text-xs text-slate-500 mt-1">Sync your Athletic.net profile in the Track Portal to populate this matrix.</p>
                   </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {sportStats?.metrics?.map((m: any, idx: number) => {
                        const evalLevel = sport === 'Track & Field' ? 'Varsity' : (sportStats?.level || 'Varsity');
                        const evaluation = evaluateMetric(genderKey, sport, m.name, m.value, evalLevel);
                        const metricScore = m.score || evaluation?.score || 10;
                        const tierStyles = getLocalTierStyles(metricScore);
                        
                        return (
                          <div key={idx} className={`flex justify-between items-center ${eq.bg} border ${eq.border} rounded-2xl px-4 py-3 text-sm font-bold shadow-sm group transition-transform hover:scale-[1.02] hover:${eq.glow}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className={`${eq.text} truncate pr-2`}>{m.name}: <span className={`${eq.highlight} font-black`}>{m.value}</span></span>
                              {evaluation && (
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border w-fit ${tierStyles.colorClass} ${tierStyles.bgClass} ${tierStyles.borderClass}`}>
                                  {tierStyles.tier}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity pl-2 shrink-0">
                              <button 
                                onClick={() => {
                                  setNewMetricName(m.name);
                                  setNewMetricValue(m.value);
                                  removeSportMetric(idx);
                                }} 
                                className={`text-slate-500 hover:${eq.icon} p-1.5 bg-slate-950 rounded-md hover:bg-slate-900 transition-colors`}
                                title="Edit Score"
                              >
                                <Edit3 className="w-4 h-4"/>
                              </button>
                              <button onClick={() => removeSportMetric(idx)} className="text-slate-500 hover:text-red-500 p-1.5 bg-slate-950 rounded-md hover:bg-red-500/10 transition-colors" title="Delete Score">
                                <X className="w-4 h-4"/>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className={`bg-slate-950 p-3 rounded-2xl border ${eq.border} flex flex-col sm:flex-row gap-2`}>
                      <input 
                        type="text" list={`metrics-${sport}`} placeholder="Metric Category"
                        value={newMetricName} onChange={(e) => setNewMetricName(e.target.value)}
                        className={`flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing} shadow-sm transition-all`}
                      />
                      <datalist id={`metrics-${sport}`}>
                        {config?.defaultMetrics?.map((m: string) => <option key={m} value={m}>{m}</option>)}
                      </datalist>
                      <div className="flex gap-2 sm:w-1/3 shrink-0">
                        <input 
                          type="text" inputMode="decimal" placeholder="Value (e.g. 18.4)"
                          value={newMetricValue} onChange={(e) => setNewMetricValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addSportMetric()}
                          className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing} shadow-sm transition-all`}
                        />
                        <button onClick={addSportMetric} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl font-bold transition-colors shrink-0 flex items-center justify-center shadow-md">
                          <Plus className="w-5 h-5"/>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🚨 UNIFIED SEASON ACCOLADES & PLACEMENTS */}
      <div className={`bg-slate-900/80 backdrop-blur-xl border-2 ${eq.border} ${eq.glow} rounded-3xl p-6 md:p-8 relative overflow-hidden animate-in fade-in duration-300 mt-2`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-800/60 gap-4">
           <div>
             <h4 className="text-xl font-black text-white flex items-center gap-2">
               <Trophy className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> 
               Season Placements & Honors
             </h4>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                Log your High School, Club/Travel, and Individual accolades.
             </p>
           </div>
           {!showAccoladeForm && (
             <button 
               onClick={() => setShowAccoladeForm(true)}
               className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center gap-2 w-full sm:w-auto justify-center"
             >
               <Plus className="w-4 h-4" /> Add Rank
             </button>
           )}
        </div>

        {!showAccoladeForm && localAccolades.length === 0 && (
          <div 
            onClick={() => setShowAccoladeForm(true)}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed ${eq.border} rounded-2xl text-center group cursor-pointer hover:bg-slate-800/30 transition-all mt-2`}
          >
             <div className="w-14 h-14 bg-slate-950 rounded-full flex items-center justify-center shadow-inner border border-slate-800 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Medal className="w-7 h-7 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
             </div>
             <h4 className="text-sm font-black text-slate-200 mb-1">No Placements or Honors Logged</h4>
             <p className="text-xs font-medium text-slate-500 max-w-sm">College coaches track team success and personal leadership. Tap here to add your ranks and build your resume.</p>
          </div>
        )}

        {localAccolades.length > 0 && (
          <div className="space-y-3 mb-4">
            {localAccolades.map((acc, idx) => {
              
              let BadgeUI = null;
              let TitleUI = null;

              if (acc.type === 'HS_Team' || acc.type === 'Club_Team') {
                 const isHS = acc.type === 'HS_Team';
                 BadgeUI = (
                    <div className={`border px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 text-center ${isHS ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'}`}>
                      {isHS ? 'HS Team' : 'Club Team'} • {acc.level}
                    </div>
                 );
                 TitleUI = (
                    <div className="flex flex-col min-w-0">
                       <span className="text-sm font-black text-slate-200 truncate">{acc.placement}</span>
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{acc.contribution}</span>
                    </div>
                 );
              } else if (acc.type === 'Individual') {
                 BadgeUI = (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 text-center">
                      Individual • {acc.level}
                    </div>
                 );
                 TitleUI = <span className="text-sm font-black text-slate-200 truncate">{acc.placement}</span>;
              } else if (acc.type === 'Honor' || acc.type === 'other') {
                 BadgeUI = (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 text-center flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" /> Award
                    </div>
                 );
                 TitleUI = <span className="text-sm font-black text-slate-200 truncate">{acc.text}</span>;
              } else if (acc.type === 'state') {
                 BadgeUI = (
                    <div className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 text-center">
                      Legacy • Rank
                    </div>
                 );
                 TitleUI = (
                    <div className="flex flex-col min-w-0">
                       <span className="text-sm font-black text-slate-200 truncate">{getOrdinal(acc.placement)} Place</span>
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{acc.contribution}</span>
                    </div>
                 );
              }

              return (
                <div key={idx} className={`bg-slate-950 border ${eq.border} p-4 rounded-xl flex items-center justify-between group transition-all hover:${eq.glow}`}>
                  <div className="flex items-center gap-4 w-full pr-4">
                    {BadgeUI}
                    {TitleUI}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setAccCategory(acc.type || '');
                        if (acc.type === 'Honor') {
                          setAccHonorText(acc.text || '');
                        } else {
                          setAccLevel(acc.level || '');
                          setAccPlacement(acc.placement || '');
                          setAccContribution(acc.contribution || '');
                        }
                        setShowAccoladeForm(true);
                        handleRemoveAccolade(idx);
                      }}
                      className={`text-slate-500 hover:${eq.icon} hover:bg-slate-800 transition-colors p-2 rounded-lg`}
                      title="Edit Entry"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleRemoveAccolade(idx)}
                      className="text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors p-2 rounded-lg"
                      title="Remove Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showAccoladeForm && (
          <div className="bg-slate-950 border border-indigo-500/30 p-6 rounded-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 shadow-[0_0_30px_rgba(79,70,229,0.1)]">
             <div className="flex items-center justify-between mb-5">
               <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Step 1: Select Context</span>
               <button onClick={() => { setShowAccoladeForm(false); setAccCategory(''); }} className="text-slate-500 hover:text-white transition-colors bg-slate-900 p-1.5 rounded-lg"><X className="w-4 h-4"/></button>
             </div>
             
             <div className="flex flex-wrap sm:flex-nowrap gap-3 mb-6">
               <button 
                 onClick={() => setAccCategory('HS_Team')}
                 className={`flex-1 py-3 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest border-2 transition-all ${accCategory === 'HS_Team' ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'}`}
               >
                 High School Team
               </button>
               <button 
                 onClick={() => setAccCategory('Club_Team')}
                 className={`flex-1 py-3 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest border-2 transition-all ${accCategory === 'Club_Team' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'}`}
               >
                 Club / Travel Team
               </button>
               {!isTeamSport && (
                 <button 
                   onClick={() => setAccCategory('Individual')}
                   className={`flex-1 py-3 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest border-2 transition-all ${accCategory === 'Individual' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'}`}
                 >
                   Individual Rank
                 </button>
               )}
               <button 
                 onClick={() => setAccCategory('Honor')}
                 className={`flex-1 py-3 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest border-2 transition-all ${accCategory === 'Honor' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'}`}
               >
                 Custom Honor
               </button>
             </div>

             {(accCategory === 'HS_Team' || accCategory === 'Club_Team') && (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Level of Competition</label>
                    <select
                      value={accLevel}
                      onChange={(e) => setAccLevel(e.target.value)}
                      className={`w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm font-bold text-white outline-none appearance-none transition-all ${eq.focusRing}`}
                    >
                      <option value="" className="text-slate-500">Select level...</option>
                      {COMPETITION_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-10 pointer-events-none" />
                  </div>
                  
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Team Placement</label>
                    <input
                      type="text"
                      list={`team-placements-${sport}`}
                      value={accPlacement}
                      onChange={(e) => setAccPlacement(e.target.value)}
                      placeholder="Type or select..."
                      className={`w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm font-bold text-white outline-none placeholder-slate-600 transition-all ${eq.focusRing}`}
                    />
                    <datalist id={`team-placements-${sport}`}>
                      {TEAM_PLACEMENTS.map(p => <option key={p} value={p} />)}
                    </datalist>
                  </div>
                  
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Your Contribution</label>
                    <select
                      value={accContribution}
                      onChange={(e) => setAccContribution(e.target.value)}
                      className={`w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm font-bold text-white outline-none appearance-none transition-all ${eq.focusRing}`}
                    >
                      <option value="" className="text-slate-500">Select impact...</option>
                      {CONTRIBUTION_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-10 pointer-events-none" />
                  </div>
               </div>
             )}

             {accCategory === 'Individual' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Level of Competition</label>
                    <select
                      value={accLevel}
                      onChange={(e) => setAccLevel(e.target.value)}
                      className={`w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm font-bold text-white outline-none appearance-none transition-all ${eq.focusRing}`}
                    >
                      <option value="" className="text-slate-500">Select level...</option>
                      {COMPETITION_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-10 pointer-events-none" />
                  </div>
                  
                  <div className="relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Individual Placement</label>
                    <input
                      type="text"
                      list={`ind-placements-${sport}`}
                      value={accPlacement}
                      onChange={(e) => setAccPlacement(e.target.value)}
                      placeholder="Type or select..."
                      className={`w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm font-bold text-white outline-none placeholder-slate-600 transition-all ${eq.focusRing}`}
                    />
                    <datalist id={`ind-placements-${sport}`}>
                      {INDIVIDUAL_PLACEMENTS.map(p => <option key={p} value={p} />)}
                    </datalist>
                  </div>
               </div>
             )}

             {accCategory === 'Honor' && (
               <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Honor / Award Title</label>
                  <input
                    type="text"
                    value={accHonorText}
                    onChange={(e) => setAccHonorText(e.target.value)}
                    placeholder="e.g. All-Conference 1st Team, Team MVP, Team Captain"
                    className={`w-full bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-sm font-bold text-white outline-none placeholder-slate-600 transition-all ${eq.focusRing}`}
                  />
               </div>
             )}

             {accCategory && (
               <button 
                 onClick={handleAddAccolade}
                 className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.3)] active:scale-[0.98]"
               >
                 <Plus className="w-4 h-4" /> Save Record
               </button>
             )}
          </div>
        )}
      </div>

    </div>
  );
}