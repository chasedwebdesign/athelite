'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle2, Plus, X, Medal, ShieldCheck, Trash2, Trophy, ChevronDown, Award, Edit3, School, Check, Globe, User, Activity } from 'lucide-react';
import { evaluateMetric, getOverallTier, SportMetaConfig } from '@/utils/constants/RecruitingStandards';

// 🚨 Specific Editors
import XCEditor from '@/components/dashboard/sports/XCEditor';
import SwimEditor from '@/components/dashboard/sports/SwimEditor';
import TrackEditor from '@/components/dashboard/sports/TrackEditor';
import WrestlingEditor from '@/components/dashboard/sports/WrestlingEditor';

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
  if (score >= 95) return { tier: 'Power 4 D1', colorClass: 'text-fuchsia-400', bgClass: 'bg-fuchsia-500/10', borderClass: 'border-fuchsia-500/30' };
  if (score >= 85) return { tier: 'Mid-Major D1', colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/30' };
  if (score >= 75) return { tier: 'Top D2 / Walk-On', colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/30' };
  if (score >= 65) return { tier: 'D2 / D3 Prospect', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/30' };
  if (score >= 55) return { tier: 'NAIA Prospect', colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/30' };
  if (score >= 40) return { tier: 'Strong Varsity', colorClass: 'text-slate-300', bgClass: 'bg-slate-500/20', borderClass: 'border-slate-400/50' };
  if (score >= 20) return { tier: 'Varsity Contributor', colorClass: 'text-slate-400', bgClass: 'bg-slate-500/10', borderClass: 'border-slate-500/30' };
  return { tier: 'Developmental', colorClass: 'text-slate-500', bgClass: 'bg-slate-500/5', borderClass: 'border-slate-600/30' };
};

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// 🚨 Dynamic Theming Engine
const getEquippedStyles = (profile: any) => {
  const style = profile?.equipped_card || profile?.equipped_border || 'base';
  switch (style) {
    case 'obsidian': return { 
      bg: 'bg-slate-900/60', border: 'border-slate-600', glow: 'shadow-[0_0_20px_rgba(71,85,105,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(71,85,105,0.15)]',
      text: 'text-slate-300', highlight: 'text-white', icon: 'text-slate-400',
      focusRing: 'focus:ring-slate-500/30 focus:border-slate-500',
      glowLine: 'from-slate-500/0 via-slate-500/50 to-slate-500/0'
    };
    case 'crimson': return { 
      bg: 'bg-red-950/30', border: 'border-red-500/50', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
      text: 'text-red-200', highlight: 'text-red-400', icon: 'text-red-500',
      focusRing: 'focus:ring-red-500/30 focus:border-red-500',
      glowLine: 'from-red-500/0 via-red-500/50 to-red-500/0'
    };
    case 'sapphire': return { 
      bg: 'bg-blue-950/30', border: 'border-blue-500/50', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      text: 'text-blue-200', highlight: 'text-blue-400', icon: 'text-blue-500',
      focusRing: 'focus:ring-blue-500/30 focus:border-blue-500',
      glowLine: 'from-blue-500/0 via-blue-500/50 to-blue-500/0'
    };
    case 'hype': return { 
      bg: 'bg-indigo-950/30', border: 'border-indigo-500/50', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]',
      text: 'text-indigo-200', highlight: 'text-indigo-400', icon: 'text-indigo-500',
      focusRing: 'focus:ring-indigo-500/30 focus:border-indigo-500',
      glowLine: 'from-indigo-500/0 via-indigo-500/50 to-indigo-500/0'
    };
    case 'premium': return { 
      bg: 'bg-amber-950/30', border: 'border-amber-500/50', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      text: 'text-amber-200', highlight: 'text-amber-400', icon: 'text-amber-500',
      focusRing: 'focus:ring-amber-500/30 focus:border-amber-500',
      glowLine: 'from-amber-500/0 via-amber-500/50 to-amber-500/0'
    };
    case 'amethyst': return { 
      bg: 'bg-fuchsia-950/30', border: 'border-fuchsia-500/50', glow: 'shadow-[0_0_20px_rgba(217,70,239,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(217,70,239,0.15)]',
      text: 'text-fuchsia-200', highlight: 'text-fuchsia-400', icon: 'text-fuchsia-500',
      focusRing: 'focus:ring-fuchsia-500/30 focus:border-fuchsia-500',
      glowLine: 'from-fuchsia-500/0 via-fuchsia-500/50 to-fuchsia-500/0'
    };
    case 'cyber': return { 
      bg: 'bg-cyan-950/30', border: 'border-cyan-500/50', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      text: 'text-cyan-200', highlight: 'text-cyan-400', icon: 'text-cyan-500',
      focusRing: 'focus:ring-cyan-500/30 focus:border-cyan-500',
      glowLine: 'from-cyan-500/0 via-cyan-500/50 to-cyan-500/0'
    };
    default: return { 
      bg: 'bg-slate-950/50', border: 'border-slate-800', glow: 'shadow-lg', hoverGlow: 'hover:shadow-lg',
      text: 'text-slate-400', highlight: 'text-white', icon: 'text-indigo-500',
      focusRing: 'focus:ring-indigo-500/30 focus:border-indigo-500',
      glowLine: 'from-indigo-500/0 via-indigo-500/50 to-indigo-500/0'
    };
  }
};

interface SportRegistryProps {
  sport?: string;
  sportName?: string;
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
  sport, sportName, sportStats, genderKey, athleteProfile, config, onSync, showToast, onDisable, onDelete 
}: SportRegistryProps) {
  
  const actualSport = sport || sportName || sportStats?.sport_name || sportStats?.sport || '';
  
  const isTeamSport = TEAM_SPORTS.includes(actualSport);
  const isTrack = actualSport === 'Track & Field';

  const eq = getEquippedStyles(athleteProfile);

  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');
  
  const [editingGenericIdx, setEditingGenericIdx] = useState<number | null>(null);
  const [editGenericName, setEditGenericName] = useState('');
  const [editGenericValue, setEditGenericValue] = useState('');

  const [localAccolades, setLocalAccolades] = useState<any[]>(sportStats?.metaContext?.accolades || []);
  const [showAccoladeForm, setShowAccoladeForm] = useState(false);
  const [editingAccoladeIdx, setEditingAccoladeIdx] = useState<number | null>(null); 
  
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

  const saveEditedGenericMetric = () => {
    if (editingGenericIdx === null) return;
    const name = editGenericName.trim();
    const val = editGenericValue.trim();
    if (!name || !val) return;

    const newMetrics = [...(sportStats.metrics || [])];
    newMetrics[editingGenericIdx] = { name, value: val };
    
    onSync({ ...sportStats, metrics: newMetrics });
    setEditingGenericIdx(null);
    showToast('Metric updated successfully', 'success');
  };

  const removeSportMetric = (index: number) => {
    const newMetrics = [...(sportStats.metrics || [])];
    newMetrics.splice(index, 1);
    onSync({ ...sportStats, metrics: newMetrics });
    if (editingGenericIdx === index) setEditingGenericIdx(null);
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
      let updated;
      if (editingAccoladeIdx !== null) {
        updated = [...localAccolades];
        updated[editingAccoladeIdx] = newAcc;
      } else {
        updated = [...localAccolades, newAcc];
      }
      
      setLocalAccolades(updated);
      
      setShowAccoladeForm(false);
      setAccCategory('');
      setAccLevel('');
      setAccPlacement('');
      setAccContribution('');
      setAccHonorText('');
      setEditingAccoladeIdx(null); 
      
      saveAccoladesData(updated);
    }
  };

  const handleRemoveAccolade = (indexToRemove: number) => {
    const updated = localAccolades.filter((_, idx) => idx !== indexToRemove);
    setLocalAccolades(updated);
    saveAccoladesData(updated);
  };

  const handleDisableSport = async () => {
    if (onDisable) return onDisable();
    if (!athleteProfile?.id) return;
    try {
      const supabase = createClient();
      await supabase.from('athlete_sports').update({ is_active: false }).eq('athlete_id', athleteProfile.id).eq('sport_name', actualSport);
      showToast(`${actualSport} has been disabled.`, 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast('Failed to disable sport.', 'error');
    }
  };

  const handleDeleteSport = async () => {
    if (onDelete) return onDelete();
    if (!athleteProfile?.id) return;
    if (!window.confirm(`Are you sure you want to permanently delete all ${actualSport} data?`)) return;
    try {
      const supabase = createClient();
      await supabase.from('athlete_sports').delete().eq('athlete_id', athleteProfile.id).eq('sport_name', actualSport);
      showToast(`${actualSport} data has been completely removed.`, 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast('Failed to delete sport.', 'error');
    }
  };

  const getDisplayScore = () => {
    if (actualSport === 'Track & Field' || actualSport === 'Swimming & Diving') {
      if (!sportStats?.metrics || sportStats.metrics.length === 0) return 0;
      let topScore = 0;
      sportStats.metrics.forEach((m: any) => {
        const evalLevel = actualSport === 'Track & Field' ? 'Varsity' : (sportStats?.level || 'Varsity');
        const evalResult = evaluateMetric(genderKey, actualSport, m.name, m.value, evalLevel);
        const metricScore = m.score || evalResult?.score || 0;
        if (metricScore > topScore) topScore = metricScore;
      });
      return Math.max(topScore, sportStats?.calculatedRating || 0);
    }
    return sportStats?.calculatedRating || 0;
  };

  const rating = getDisplayScore();
  const tier = getOverallTier(rating);

  const renderCustomEditor = () => {
    const props = { sportStats, genderKey, onSync, showToast, athleteProfile, config, displayRating: rating, displayTier: tier, equippedTheme: eq };
    if (isTeamSport) return null; 
    switch (actualSport) {
      case 'Cross Country': return <XCEditor xcStats={sportStats} {...props} />;
      case 'Swimming & Diving': return <SwimEditor swimStats={sportStats} {...props} />;
      case 'Track & Field': return <TrackEditor trackStats={sportStats} {...props} />;
      case 'Wrestling': return <WrestlingEditor wrestlingStats={sportStats} {...props} />;
      default: return null;
    }
  };

  const CustomEditorComponent = renderCustomEditor();

  return (
    <div className="flex flex-col gap-4 relative">
      
      {/* 🚨 SPORT CONTROLS 🚨 */}
      <div className="flex justify-end items-center gap-2 mb-1">
        <button 
          onClick={handleDisableSport}
          className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-500 bg-slate-900/40 hover:bg-slate-900 px-3 py-1.5 rounded-lg transition-colors border border-slate-800/50 shadow-sm"
        >
          Disable
        </button>
        <button 
          onClick={handleDeleteSport}
          className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 bg-slate-900/40 hover:bg-slate-900 px-3 py-1.5 rounded-lg transition-colors border border-slate-800/50 flex items-center gap-1 shadow-sm"
        >
          <Trash2 className="w-3 h-3" /> Delete
        </button>
      </div>

      {CustomEditorComponent ? (
        CustomEditorComponent
      ) : (
        <div className={`bg-slate-900/80 backdrop-blur-xl border-2 ${eq.border} ${eq.glow} rounded-[2rem] p-4 sm:p-6 md:p-8 relative animate-in fade-in duration-300`}>
          <div className={`absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r ${eq.glowLine}`}></div>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-5 pb-4 border-b border-slate-800/60 gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                 {isTeamSport ? 'Core Baseline Settings' : `${actualSport} Metrics`}
                 {isTrack && <span title="Managed by Track Portal"><CheckCircle2 className={`w-4 h-4 ${eq.icon}`} /></span>}
              </h3>
              <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                {isTeamSport ? 'Deterministic Baseline Profile' : (!config?.requiresLevel ? 'Deterministic Mark Evaluation' : 'Skill Stat Allocation Profile')}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {rating > 0 && (
                <div className={`flex items-center gap-4 ${tier.bg} border ${tier.border} p-3 rounded-2xl shadow-sm w-full md:w-auto justify-between md:justify-start`}>
                   <div className="text-left md:text-right">
                      <span className={`block text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${tier.color}`}>{tier.label}</span>
                   </div>
                   <div className="w-px h-8 bg-black/20 hidden md:block"></div>
                   <div className="text-center shrink-0 min-w-[3rem]">
                     <span className={`text-xl font-black leading-none ${tier.color}`}>{rating}</span>
                   </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {config?.requiresLevel && (
                <>
                  <div className="relative">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Position / Group</label>
                    <select 
                      value={sportStats?.position || ''} 
                      onChange={(e) => updateSportMeta('position', e.target.value)}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing} appearance-none transition-all`}
                    >
                      <option value="">Select Target...</option>
                      {config.positions?.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-8 pointer-events-none" />
                  </div>
                  
                  <div className="relative">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Level Of Play</label>
                    <select 
                      value={sportStats?.level || ''} 
                      onChange={(e) => updateSportMeta('level', e.target.value)}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing} appearance-none transition-all`}
                    >
                      <option value="">Select Level...</option>
                      <option value="JV / Dev Squad">JV / Dev Squad</option>
                      <option value="Varsity Contributor">Varsity Contributor</option>
                      <option value="Varsity Starter">Varsity Starter</option>
                      <option value="All-Conference Tier">All-Conference Tier</option>
                      <option value="All-State / National">All-State / National</option>
                      <option value="Elite Club (ECNL / AAU / Next)">Elite Club / Travel</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-8 pointer-events-none" />
                  </div>
                </>
              )}
              
              <div className="relative">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1">
                  <School className="w-3 h-3" /> School Size
                </label>
                <select 
                  value={sportStats?.metaContext?.schoolSize || ''} 
                  onChange={(e) => updateMetaContext('schoolSize', e.target.value)}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing} appearance-none transition-all`}
                >
                  <option value="">Select Size...</option>
                  <option value="Small (< 500)">Small (&lt; 500 students)</option>
                  <option value="Medium (500 - 999)">Medium (500 - 999 students)</option>
                  <option value="Large (1,000 - 1,999)">Large (1,000 - 1,999 students)</option>
                  <option value="Mega (2,000+)">Mega (2,000+ students)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-8 pointer-events-none" />
              </div>
            </div>

            {!isTeamSport && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5 border-t border-slate-800/60 pt-5">
                   <Activity className="w-3 h-3 text-indigo-400" /> Custom Event / Stat Entries
                </p>
                
                {/* 🚨 REPLACED LIST WITH DENSE GRID VIEW 🚨 */}
                {sportStats?.metrics && sportStats.metrics.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                    {sportStats.metrics.map((m: any, idx: number) => {
                      const evalLevel = sportStats?.level || 'Varsity';
                      const evaluation = evaluateMetric(genderKey, actualSport, m.name, m.value, evalLevel);
                      const metricScore = m.score || evaluation?.score || 10;
                      
                      // INLINE EDIT MODE (Expands to full width)
                      if (editingGenericIdx === idx) {
                        return (
                          <div key={idx} className="col-span-full bg-slate-900 border border-indigo-500/40 p-3 rounded-2xl flex flex-col sm:flex-row items-center gap-2">
                            <input 
                              type="text" 
                              value={editGenericName} 
                              onChange={(e) => setEditGenericName(e.target.value)} 
                              className="w-full sm:w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-300"
                              placeholder="Event / Category"
                            />
                            <input 
                              type="text" 
                              value={editGenericValue} 
                              onChange={(e) => setEditGenericValue(e.target.value)} 
                              className="w-full sm:w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white"
                              placeholder="Value"
                            />
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button onClick={saveEditedGenericMetric} className="flex-1 sm:flex-none bg-emerald-500/20 text-emerald-400 rounded-lg px-4 py-2 font-bold text-xs"><Check className="w-4 h-4 mx-auto" /></button>
                              <button onClick={() => setEditingGenericIdx(null)} className="flex-1 sm:flex-none bg-slate-800 text-slate-400 rounded-lg px-4 py-2 font-bold text-xs"><X className="w-4 h-4 mx-auto" /></button>
                            </div>
                          </div>
                        );
                      }

                      // COMPACT VIEW MODE
                      return (
                        <div 
                          key={idx} 
                          onClick={() => {
                            setEditingGenericIdx(idx);
                            setEditGenericName(m.name);
                            setEditGenericValue(m.value);
                          }}
                          className={`bg-slate-800/50 border border-slate-700/80 hover:border-indigo-500/50 p-3 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer relative group animate-in fade-in duration-200`}
                        >
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            {metricScore > 0 && <span className="text-[8px] font-black text-indigo-400">{metricScore}</span>}
                          </div>
                          <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider mb-0.5 line-clamp-1">{m.name}</span>
                          <span className="text-lg font-black text-white">{m.value}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className={`bg-slate-900/50 p-3 rounded-2xl border ${eq.border} shadow-inner flex flex-col sm:flex-row gap-2`}>
                  <div className="relative flex-1">
                    <input 
                      type="text" list={`metrics-${actualSport}`} placeholder="Add New Metric / Event"
                      value={newMetricName} onChange={(e) => setNewMetricName(e.target.value)}
                      className={`w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-xs font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing}`}
                    />
                    <datalist id={`metrics-${actualSport}`}>
                      {config?.defaultMetrics?.map((m: string) => <option key={m} value={m}>{m}</option>)}
                    </datalist>
                  </div>
                  <div className="flex gap-2 sm:w-1/3 shrink-0">
                    <input 
                      type="text" inputMode="decimal" placeholder="Value"
                      value={newMetricValue} onChange={(e) => setNewMetricValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addSportMetric()}
                      className={`w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-xs font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing}`}
                    />
                    <button onClick={addSportMetric} className="bg-indigo-600 hover:bg-indigo-500 text-white w-12 sm:w-auto px-3 rounded-xl font-bold flex items-center justify-center">
                      <Plus className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🚨 UNIFIED SEASON ACCOLADES & PLACEMENTS (CONDENSED) 🚨 */}
      <div className={`bg-slate-900/80 backdrop-blur-xl border-2 ${eq.border} ${eq.glow} rounded-[2rem] p-4 sm:p-6 md:p-8 relative mt-1`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pb-4 border-b border-slate-800/60 gap-3">
           <div>
             <h4 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
               <Trophy className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> 
               Placements & Honors
             </h4>
           </div>
           {!showAccoladeForm && (
             <button 
               onClick={() => setShowAccoladeForm(true)}
               className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 justify-center shrink-0"
             >
               <Plus className="w-3.5 h-3.5" /> Add Rank
             </button>
           )}
        </div>

        {!showAccoladeForm && localAccolades.length === 0 && (
          <div 
            onClick={() => setShowAccoladeForm(true)}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed ${eq.border} rounded-[1.5rem] text-center cursor-pointer hover:bg-slate-800/30 transition-all mt-2`}
          >
             <Medal className="w-8 h-8 text-amber-500/50 mb-2" />
             <h4 className="text-sm font-black text-slate-300">No Placements Logged</h4>
          </div>
        )}

        {localAccolades.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
            {localAccolades.map((acc, idx) => {
              let IconUI = null;
              if (acc.type === 'HS_Team') IconUI = <School className="w-5 h-5 text-amber-400" />;
              else if (acc.type === 'Club_Team') IconUI = <Globe className="w-5 h-5 text-cyan-400" />;
              else if (acc.type === 'Individual') IconUI = <User className="w-5 h-5 text-emerald-400" />;
              else IconUI = <Award className="w-5 h-5 text-indigo-400" />;

              const displayTitle = acc.type === 'Honor' || acc.type === 'other' ? acc.text : (acc.type === 'state' ? `${getOrdinal(acc.placement)} Place` : acc.placement);
              const displaySub = acc.contribution || (acc.type === 'Honor' || acc.type === 'other' ? 'Career Accolade' : 'Tournament Rank');

              return (
                <div key={idx} className={`bg-slate-800/40 border border-slate-700 p-3 rounded-2xl flex items-center gap-3 relative overflow-hidden group`}>
                  <div className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center shrink-0">
                    {IconUI}
                  </div>
                  <div className="flex-1 min-w-0 pr-12">
                     <h3 className="text-sm font-black text-white truncate">{displayTitle}</h3>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{displaySub}</p>
                  </div>
                  {/* Absolute positioning for tight Edit/Delete buttons */}
                  <div className="absolute right-3 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingAccoladeIdx(idx); 
                        setAccCategory(acc.type || '');
                        if (acc.type === 'Honor') setAccHonorText(acc.text || '');
                        else { setAccLevel(acc.level || ''); setAccPlacement(acc.placement || ''); setAccContribution(acc.contribution || ''); }
                        setShowAccoladeForm(true);
                      }}
                      className="w-7 h-7 flex items-center justify-center bg-slate-700 rounded-lg text-slate-300 hover:text-white"
                    ><Edit3 className="w-3.5 h-3.5" /></button>
                    <button 
                      onClick={() => handleRemoveAccolade(idx)}
                      className="w-7 h-7 flex items-center justify-center bg-red-500/10 text-red-400 rounded-lg"
                    ><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Keeping Accolade Form mostly identical, just tightened padding slightly */}
        {showAccoladeForm && (
          <div className="bg-slate-950 border border-indigo-500/30 p-4 sm:p-5 rounded-2xl relative mt-3 animate-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                 {editingAccoladeIdx !== null ? 'Edit Accolade' : 'Add Accolade'}
               </span>
               <button onClick={() => { setShowAccoladeForm(false); setAccCategory(''); setEditingAccoladeIdx(null); }} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white bg-slate-900 rounded-lg"><X className="w-4 h-4"/></button>
             </div>
             
             {/* Category Buttons... */}
             <div className="grid grid-cols-2 gap-2 mb-5">
               <button onClick={() => setAccCategory('HS_Team')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border ${accCategory === 'HS_Team' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>HS Team</button>
               <button onClick={() => setAccCategory('Club_Team')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border ${accCategory === 'Club_Team' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>Club Team</button>
               {!isTeamSport && <button onClick={() => setAccCategory('Individual')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border ${accCategory === 'Individual' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>Individual</button>}
               <button onClick={() => setAccCategory('Honor')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border ${accCategory === 'Honor' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>Honor</button>
             </div>

             {(accCategory === 'HS_Team' || accCategory === 'Club_Team') && (
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {/* Select Level, Placement, Contribution - Tightened py-2.5 */}
                  <div className="relative">
                    <select value={accLevel} onChange={(e) => setAccLevel(e.target.value)} className={`w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold text-white outline-none appearance-none`}>
                      <option value="">Level...</option>
                      {COMPETITION_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <input type="text" list={`team-placements-${actualSport}`} value={accPlacement} onChange={(e) => setAccPlacement(e.target.value)} placeholder="Placement..." className={`w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold text-white outline-none`} />
                    <datalist id={`team-placements-${actualSport}`}>{TEAM_PLACEMENTS.map(p => <option key={p} value={p} />)}</datalist>
                  </div>
                  <div className="relative">
                    <select value={accContribution} onChange={(e) => setAccContribution(e.target.value)} className={`w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold text-white outline-none appearance-none`}>
                      <option value="">Contribution...</option>
                      {CONTRIBUTION_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
               </div>
             )}

             {accCategory === 'Individual' && (
               <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="relative">
                    <select value={accLevel} onChange={(e) => setAccLevel(e.target.value)} className={`w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold text-white outline-none appearance-none`}>
                      <option value="">Level...</option>
                      {COMPETITION_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <input type="text" list={`ind-placements-${actualSport}`} value={accPlacement} onChange={(e) => setAccPlacement(e.target.value)} placeholder="Placement..." className={`w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold text-white outline-none`} />
                    <datalist id={`ind-placements-${actualSport}`}>{INDIVIDUAL_PLACEMENTS.map(p => <option key={p} value={p} />)}</datalist>
                  </div>
               </div>
             )}

             {accCategory === 'Honor' && (
               <div className="mb-4">
                  <input type="text" value={accHonorText} onChange={(e) => setAccHonorText(e.target.value)} placeholder="e.g. All-Conference 1st Team" className={`w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold text-white outline-none`} />
               </div>
             )}

             {accCategory && (
               <button onClick={handleAddAccolade} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-xl transition-all">Save Record</button>
             )}
          </div>
        )}
      </div>

    </div>
  );
}