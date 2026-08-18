'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { 
  BarChart3, Info, Activity, Search, Calendar, 
  HelpCircle, UserCircle2, Mail, TrendingUp, ChevronDown, 
  ChevronUp, MoreHorizontal, Trash2, Crown, Lock, Eye, RefreshCw, Plus, CheckCircle2
} from 'lucide-react';
import { AvatarWithBorder } from '@/components/AnimatedBorders';
import ProGate from '@/components/ProGate';
import GlobalPercentileTracker from '@/components/dashboard/sports/GlobalPercentileTracker';
import SportEditorRegistry from '@/components/dashboard/sports/SportEditorRegistry';
import { SPORT_CONFIGS_META, ALL_SPORTS } from '@/utils/constants/RecruitingStandards';
import { Points } from '@/components/Points';

export const getTierStyles = (score: number) => {
  if (score >= 95) return { tier: 'Power 4 D1', nextTier: 'MAX RANK', scoreRequired: 99, colorClass: 'text-fuchsia-400', bgClass: 'bg-fuchsia-500/10', barClass: 'bg-fuchsia-500', borderClass: 'border-fuchsia-500/50', glowClass: 'shadow-[0_0_30px_rgba(217,70,239,0.4)]' };
  if (score >= 85) return { tier: 'Mid-Major D1', nextTier: 'Power 4 D1', scoreRequired: 95, colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10', barClass: 'bg-purple-500', borderClass: 'border-purple-500/50', glowClass: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]' };
  if (score >= 75) return { tier: 'Top D2 / Walk-On', nextTier: 'Mid-Major D1', scoreRequired: 85, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', barClass: 'bg-blue-500', borderClass: 'border-blue-500/50', glowClass: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' };
  if (score >= 65) return { tier: 'D2 / D3 Prospect', nextTier: 'Top D2 / Walk-On', scoreRequired: 75, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', barClass: 'bg-emerald-500', borderClass: 'border-emerald-500/50', glowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]' };
  if (score >= 55) return { tier: 'NAIA Prospect', nextTier: 'D2 / D3 Prospect', scoreRequired: 65, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', barClass: 'bg-amber-500', borderClass: 'border-amber-500/50', glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]' };
  if (score >= 40) return { tier: 'Strong Varsity', nextTier: 'NAIA Prospect', scoreRequired: 55, colorClass: 'text-slate-300', bgClass: 'bg-slate-500/20', barClass: 'bg-slate-400', borderClass: 'border-slate-400/50', glowClass: 'shadow-[0_0_15px_rgba(148,163,184,0.2)]' };
  if (score >= 20) return { tier: 'Varsity Contributor', nextTier: 'Strong Varsity', scoreRequired: 40, colorClass: 'text-slate-400', bgClass: 'bg-slate-500/10', barClass: 'bg-slate-500', borderClass: 'border-slate-500/30', glowClass: '' };
  if (score > 0) return { tier: 'Developmental', nextTier: 'Varsity Contributor', scoreRequired: 20, colorClass: 'text-slate-400', bgClass: 'bg-slate-500/5', barClass: 'bg-slate-600', borderClass: 'border-slate-600/30', glowClass: '' };
  
  return { tier: 'Unranked', nextTier: 'Developmental', scoreRequired: 10, colorClass: 'text-slate-500', bgClass: 'bg-slate-500/5', barClass: 'bg-slate-600', borderClass: 'border-slate-600/30', glowClass: '' };
};

export const getEquippedGlow = (border?: string) => {
  if (!border || border === 'none') return 'border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-white/20 bg-slate-900/60';
  
  const b = border.toLowerCase();
  if (b.includes('legend')) return 'border-amber-500/30 shadow-[0_8px_32px_rgba(245,158,11,0.15)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.3)] hover:border-amber-500/50 bg-amber-900/20';
  if (b.includes('champion')) return 'border-red-500/30 shadow-[0_8px_32px_rgba(239,68,68,0.15)] hover:shadow-[0_8px_32px_rgba(239,68,68,0.3)] hover:border-red-500/50 bg-red-900/20';
  if (b.includes('elite')) return 'border-purple-500/30 shadow-[0_8px_32px_rgba(168,85,247,0.15)] hover:shadow-[0_8px_32px_rgba(168,85,247,0.3)] hover:border-purple-500/50 bg-purple-900/20';
  if (b.includes('diamond')) return 'border-sky-500/30 shadow-[0_8px_32px_rgba(56,189,248,0.15)] hover:shadow-[0_8px_32px_rgba(56,189,248,0.3)] hover:border-sky-500/50 bg-sky-900/20';
  if (b.includes('pro')) return 'border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.15)] hover:shadow-[0_8px_32px_rgba(16,185,129,0.3)] hover:border-emerald-500/50 bg-emerald-900/20';
  if (b.includes('mythic')) return 'border-fuchsia-500/30 shadow-[0_8px_32px_rgba(217,70,239,0.15)] hover:shadow-[0_8px_32px_rgba(217,70,239,0.3)] hover:border-fuchsia-500/50 bg-fuchsia-900/20';
  
  return 'border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-white/20 bg-slate-900/60';
};

interface PerformanceStatsProps {
  state?: any; 
  actions?: any;
}

function PerformanceStatsContent({ state, actions }: PerformanceStatsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local Component States
  const [isSportsMenuOpen, setIsSportsMenuOpen] = useState(false);
  const sportsMenuRef = React.useRef<HTMLDivElement>(null);

  const [isUnlocking, setIsUnlocking] = useState(false);
  const [localUnlocked, setLocalUnlocked] = useState(false);

  // Next.js Page Route Guard: If accessed directly without props, redirect to the real hub.
  useEffect(() => {
    if (!state || !actions) {
      const tab = searchParams.get('tab');
      // Forward the intent to the main dashboard instead of stripping it
      router.replace(`/dashboard?view=performance${tab ? `&tab=${tab}` : ''}`);
    }
  }, [state, actions, router, searchParams]);

  // Handle clicking outside of the local sports dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sportsMenuRef.current && !sportsMenuRef.current.contains(event.target as Node)) {
        setIsSportsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // RENDER LOADING FALLBACK WHILE REDIRECTING
  if (!state || !actions) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(99,102,241,0.4)]"></div>
        <p className="text-indigo-400 font-black uppercase tracking-widest text-xs animate-pulse">Syncing Homebase Data...</p>
      </div>
    );
  }

  const {
    athleteProfile, sportStats, userSports, disabledSportsList, collapsedSports,
    socialSubTab, dailyViews, monthlyViews, allRecentViewers,
    recentViewers, showImpressionTooltip, gatingMode, genderKey, sportMenuOpen
  } = state;

  const {
    setSocialSubTab, toggleSportCollapse, getDisplayRating, setSportMenuOpen, setSportActiveState,
    setSportToDelete, syncSportToSupabase, showToast, setShowImpressionTooltip,
    setShowAllViewersModal, handleContactCoach, handleToggleSportDropdown
  } = actions;

  // Evaluate if the user has unlocked the basic numeric analytics
  const hasUnlockedAnalytics = useMemo(() => {
    if (localUnlocked) return true;
    if (gatingMode?.hasAccess) return true;
    if (athleteProfile?.unlocked_features?.includes('basic_analytics')) return true;
    return false;
  }, [athleteProfile, gatingMode, localUnlocked]);

  // Handle Point Unlock Transaction
  const handleUnlockAnalytics = async () => {
    if (!athleteProfile || isUnlocking) return;

    const currentCoins = athleteProfile.coins || 0;
    if (currentCoins < 1000) {
        showToast(`Not enough points! You need 1,000 points.`, "error");
        return;
    }

    setIsUnlocking(true);
    const newCoins = currentCoins - 1000;
    const newFeatures = [...(athleteProfile.unlocked_features || []), 'basic_analytics'];

    const supabase = createClient();
    const { error } = await supabase
        .from('athletes')
        .update({ coins: newCoins, unlocked_features: newFeatures })
        .eq('id', athleteProfile.id);

    if (error) {
        showToast("Failed to process transaction. Please try again.", "error");
    } else {
        setLocalUnlocked(true); // Instant UI Update
        showToast("Basic Analytics unlocked successfully!", "success");
    }
    setIsUnlocking(false);
  };

  // DUAL-LAYER PERSISTENCE: Fallback to localStorage if parent load missed it, and ensure DB errors are caught.
  const handleCollapseToggle = async (sport: string) => {
    const isCurrentlyCollapsed = collapsedSports[sport] === true;
    const sendState = !isCurrentlyCollapsed;
    
    // 1. Optimistic UI update
    toggleSportCollapse(sport);

    // 2. Local Storage sync for instant client-side persistence on reload
    if (typeof window !== 'undefined' && athleteProfile?.id) {
      localStorage.setItem(`chased_collapse_${athleteProfile.id}_${sport}`, String(sendState));
    }

    // 3. Persist strict boolean to Supabase
    if (athleteProfile?.id) {
      const supabase = createClient();
      const { error } = await supabase
        .from('athlete_sports')
        .update({ is_collapsed: sendState }) 
        .eq('athlete_id', athleteProfile.id)
        .eq('sport_name', sport);
        
      if (error) {
        showToast(`Failed to save layout preference for ${sport}.`, 'error');
      }
    }
  };

  const renderSportBlock = (sport: string) => {
    // Check state first, fallback to localStorage if parent is out of sync during hydration
    let isCollapsed = collapsedSports[sport] === true;
    if (typeof window !== 'undefined' && athleteProfile?.id && collapsedSports[sport] === undefined) {
      const localState = localStorage.getItem(`chased_collapse_${athleteProfile.id}_${sport}`);
      if (localState) isCollapsed = localState === 'true';
    }

    const stats = sportStats[sport] || { calculatedRating: 0 };
    const displayRating = getDisplayRating(sport);
    const tierStyles = getTierStyles(displayRating);
    const displayLevelText = (sport === 'Track & Field' || sport === 'Swimming & Diving') ? 'Deterministic Evaluation' : (stats.level || tierStyles.tier);
    const config = SPORT_CONFIGS_META[sport];
    
    if (!config) return null;

    return (
      <div 
        key={sport} 
        className={`backdrop-blur-2xl rounded-[2rem] border flex-1 transition-all duration-500 group ${getEquippedGlow(athleteProfile?.equipped_border)} ${sportMenuOpen === sport ? 'overflow-visible z-50' : 'overflow-hidden z-10'}`}
      >
        <div 
          onClick={() => handleCollapseToggle(sport)} 
          className="w-full flex items-center justify-between p-6 hover:bg-white/[0.03] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300`}>
              <TrendingUp className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-black text-white tracking-tight">{sport}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">{displayLevelText}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
             <div className={`px-4 py-2 rounded-xl border ${tierStyles.borderClass} ${tierStyles.bgClass} ${tierStyles.glowClass} flex items-center gap-2 transition-all duration-500 group-hover:scale-105`}>
                <span className={`text-xl sm:text-2xl font-black ${tierStyles.colorClass}`}>{displayRating}</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">/99</span>
             </div>

             <div className="relative z-50">
               <button 
                 onClick={(e) => { e.stopPropagation(); setSportMenuOpen(sportMenuOpen === sport ? null : sport); }}
                 className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all hover:shadow-lg focus:outline-none"
               >
                 <MoreHorizontal className="w-5 h-5" />
               </button>
               {sportMenuOpen === sport && (
                 <div className="absolute top-full right-0 mt-3 w-48 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden py-1 animate-in zoom-in-95 duration-200">
                   <button 
                     onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setSportMenuOpen(null); setSportActiveState(sport, false); }}
                     className="w-full text-left px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                   >
                     Disable Sport
                   </button>
                   <button 
                     onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setSportMenuOpen(null); setSportToDelete(sport); }}
                     className="w-full text-left px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                   >
                     <Trash2 className="w-4 h-4" /> Delete Stats
                   </button>
                 </div>
               )}
             </div>
             <div className="hidden sm:flex text-slate-500 group-hover:text-indigo-400 transition-colors bg-white/5 p-2 rounded-full border border-white/5">
               {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
             </div>
          </div>
        </div>
        
        {/* Smooth Glassy Dropdown Content */}
        {!isCollapsed && (
          <div className="p-4 sm:p-6 border-t border-white/10 bg-black/20 animate-in fade-in slide-in-from-top-4 duration-500 rounded-b-[2rem]">
             {stats.calculatedRating > 0 && athleteProfile?.id && (
                <div className="mb-6 px-2 sm:px-4">
                   <GlobalPercentileTracker athleteId={athleteProfile.id} sportName={sport} currentScore={stats.calculatedRating} />
                </div>
             )}
             <div className="bg-indigo-500/5 p-4 border border-indigo-500/20 rounded-2xl mb-6 mx-2 sm:mx-4 text-xs font-medium text-indigo-300 shadow-inner flex items-start gap-3 backdrop-blur-sm">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">Your baseline rank will <strong className="text-indigo-200 font-black">ONLY</strong> be calculated through the <strong className="text-indigo-200 font-black">Season Placement</strong> section. Unless you compete in a stat-based sport (e.g., Track, Swimming, XC, Bowling, Golf).</p>
             </div>
             <SportEditorRegistry 
               sport={sport}
               sportStats={sportStats[sport] || { metrics: [], metaContext: {} }}
               genderKey={genderKey}
               athleteProfile={athleteProfile}
               config={config}
               onSync={(updatedData) => syncSportToSupabase(sport, updatedData)}
               showToast={showToast}
               onDisable={() => setSportActiveState(sport, false)}
               onDelete={() => setSportToDelete(sport)}
             />
          </div>
        )}
      </div>
    );
  };

  const renderDisabledSportBlock = (sport: string) => (
    <div key={`disabled-${sport}`} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between opacity-70 hover:opacity-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300 group">
       <div className="flex items-center gap-4">
         <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 group-hover:border-white/20 transition-colors">
           <Activity className="w-4 h-4 text-slate-400" />
         </div>
         <div>
           <h4 className="text-sm font-black text-slate-200">{sport}</h4>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Currently Disabled</p>
         </div>
       </div>
       <div className="flex items-center gap-2">
         <button onClick={() => setSportActiveState(sport, true)} className="text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-4 py-2 rounded-xl transition-all border border-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] shadow-sm">Enable</button>
         <button onClick={() => setSportToDelete(sport)} className="text-xs font-bold bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-3 py-2 rounded-xl transition-all border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] shadow-sm"><Trash2 className="w-4 h-4" /></button>
       </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      
      {/* 🚨 PERFECTLY CENTERED GLOSSY SUB-NAVIGATION */}
      <div className="w-full flex justify-center mb-8">
        <div className="inline-flex bg-slate-900/60 backdrop-blur-2xl p-1.5 rounded-[1.25rem] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <button 
            onClick={() => setSocialSubTab('performance')} 
            className={`px-8 py-3.5 rounded-xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${socialSubTab === 'performance' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Activity className="w-4 h-4" /> Performance Hub
          </button>
          <button 
            onClick={() => setSocialSubTab('analytics')} 
            className={`px-8 py-3.5 rounded-xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap ${socialSubTab === 'analytics' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)] scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <BarChart3 className="w-4 h-4" /> Analytics
          </button>
        </div>
      </div>

      {socialSubTab === 'performance' && (
         <div className={`backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-10 border transition-all duration-500 ${getEquippedGlow(athleteProfile?.equipped_border)}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-white/10 gap-4">
               <div>
                 <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                   <Activity className="w-7 h-7 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" /> Performance Hub
                 </h2>
                 <p className="text-slate-400 font-medium text-sm mt-2">Manage, update, and evaluate your sport-specific stats to increase match rating.</p>
               </div>
               
               {/* Add / Update Sports Dropdown */}
               <div className="relative inline-block text-left w-full sm:w-auto" ref={sportsMenuRef}>
                 <button onClick={() => setIsSportsMenuOpen(!isSportsMenuOpen)} className="inline-flex items-center justify-center w-full sm:w-auto gap-2 font-black px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-cyan-500 hover:bg-cyan-400 text-white border border-cyan-400">
                    <Plus className="w-4 h-4" /> Add / Update Sports <ChevronDown className={`w-4 h-4 transition-transform ${isSportsMenuOpen ? 'rotate-180' : ''}`} />
                 </button>
                 
                 {isSportsMenuOpen && (
                   <div className="absolute right-0 mt-3 w-[280px] sm:w-[320px] bg-slate-900 rounded-2xl shadow-2xl border border-cyan-500/30 p-3 sm:p-4 z-[100] max-h-[60vh] overflow-y-auto custom-scrollbar text-white text-left animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-2 border-b border-slate-800 mb-2">Sport Specifications</p>
                      <div className="grid grid-cols-1 gap-2">
                        {ALL_SPORTS.map((sport: string) => {
                          const isActive = sportStats[sport]?.isActive === true;
                          return (
                            <div key={sport} onMouseDown={(e) => { e.preventDefault(); handleToggleSportDropdown(sport); }} className="flex items-center gap-3 w-full text-left p-3 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors group">
                               <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${isActive ? 'bg-cyan-500 border-cyan-500' : 'bg-slate-950 border-slate-700 group-hover:border-cyan-500'}`}>
                                  {isActive && <CheckCircle2 className="w-3 h-3 text-white" />}
                               </div>
                               <span className={`text-sm font-bold truncate select-none ${isActive ? 'text-white' : 'text-slate-400'}`}>{sport}</span>
                            </div>
                          )
                        })}
                      </div>
                   </div>
                 )}
               </div>
            </div>
            
            {Object.keys(sportStats).length > 0 ? (
               <div className="grid grid-cols-1 gap-8">
                 {userSports.map((sport: string) => renderSportBlock(sport))}
                 {disabledSportsList.length > 0 && (
                   <div className="pt-8 border-t border-white/10 mt-4">
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 px-1">Disabled Sports</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                       {disabledSportsList.map((sport: string) => renderDisabledSportBlock(sport))}
                     </div>
                   </div>
                 )}
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-white/10 rounded-[2rem] bg-black/20 backdrop-blur-md">
                 <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-inner mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                   <Activity className="w-10 h-10 text-slate-500" />
                 </div>
                 <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No Sports Loaded</h3>
                 <p className="text-sm font-medium text-slate-400 max-w-md mb-8">To rank in the matchmaker algorithm, add your sport from the Hero Header dropdown above.</p>
               </div>
            )}
         </div>
      )}

      {socialSubTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className={`backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-10 border relative overflow-hidden transition-all duration-500 ${getEquippedGlow(athleteProfile?.equipped_border)}`}>
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
              <div>
                <h2 className="text-3xl font-black text-white flex items-center tracking-tight">
                  <BarChart3 className="w-7 h-7 mr-3 text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" /> Scouting Analytics
                </h2>
                <p className="text-slate-400 font-medium mt-2">See exactly how much traction your profile is getting with college coaches.</p>
              </div>
            </div>

            <div className={`relative ${!hasUnlockedAnalytics ? 'min-h-[350px]' : ''}`}>
              <div className="mb-8">
                <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-[2rem] p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-md transition-all duration-500 hover:border-blue-400/40 hover:shadow-[0_10px_40px_rgba(59,130,246,0.15)]">
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 drop-shadow-sm"><Eye className="w-4 h-4" /> All-Time Profile Clicks</p>
                    <h3 className="text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-md">{athleteProfile?.profile_views || 0}</h3>
                  </div>
                  <div className="text-center sm:text-right max-w-[220px]">
                    <p className="text-sm font-medium text-slate-300 leading-relaxed">Coaches have actively clicked to view your full profile and metrics.</p>
                  </div>
                </div>
              </div>

              <div className="relative rounded-[2rem] border border-white/10 bg-black/20 p-8 overflow-hidden backdrop-blur-md">
                
                {/* 🚨 DYNAMIC POINTS LOCK / PREMIUM UPSELL OVERLAY 🚨 */}
                {!hasUnlockedAnalytics && (
                  <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8">
                    <div className="absolute top-6 right-6 bg-slate-800 text-slate-400 font-black tracking-widest text-[10px] uppercase px-3 py-1 rounded-lg border border-white/10 shadow-sm">Locked</div>
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-5 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                      <Lock className="w-7 h-7 text-slate-300" />
                    </div>
                    
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Basic Analytics Locked</h3>
                    
                    <p className="text-slate-400 text-sm font-medium mb-6 max-w-lg leading-relaxed">
                      Unlock basic analytics to track your feed impressions and see <strong className="text-white">how many</strong> people view your profile. Upgrade to <strong className="text-amber-400">Premium</strong> below to see exactly <strong className="text-amber-400">WHO</strong> is viewing it.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <button 
                        onClick={handleUnlockAnalytics}
                        disabled={isUnlocking}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-black px-6 py-3.5 rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-sm border border-slate-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isUnlocking ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Points className="w-5 h-5 text-amber-400" />} 
                        Unlock for 1,000 pts
                      </button>
                      
                      <Link href="/pro" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black px-6 py-3.5 rounded-xl shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform flex items-center gap-2 text-sm tracking-wide active:scale-95">
                        <Crown className="w-5 h-5 drop-shadow-md" /> Get Premium
                      </Link>
                    </div>

                    {athleteProfile && (athleteProfile.coins || 0) < 1000 && (
                      <p className="text-xs text-red-400 mt-4 font-bold">You only have {(athleteProfile.coins || 0).toLocaleString()} / 1,000 points.</p>
                    )}
                  </div>
                )}

                {/* Blurring active when points aren't met */}
                <div className={`${!hasUnlockedAnalytics ? 'opacity-20 select-none blur-[4px] pointer-events-none' : ''}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                    <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-lg relative transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-slate-800/60">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          Feed Impressions
                          <button onClick={() => setShowImpressionTooltip(!showImpressionTooltip)} className="text-slate-500 hover:text-emerald-400 transition-colors focus:outline-none"><HelpCircle className="w-4 h-4" /></button>
                        </p>
                        <Search className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h3 className="text-4xl font-black text-white tracking-tight">{athleteProfile?.search_appearances || 0}</h3>
                      {showImpressionTooltip && hasUnlockedAnalytics && (
                        <div className="absolute top-14 left-0 w-[220px] bg-slate-800 text-slate-200 text-xs p-5 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 border border-white/10">
                          <p className="mb-4 leading-relaxed font-medium">Number of times your profile appeared directly on a coach's screen.</p>
                          <button onClick={() => setShowImpressionTooltip(false)} className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2.5 rounded-lg transition-colors border border-white/5">Got it</button>
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-slate-800/60">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Views Today</p>
                        <Activity className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-4xl font-black text-white tracking-tight">{dailyViews || 0}</h3>
                    </div>
                    <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:bg-slate-800/60">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Views This Month</p>
                        <Calendar className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h3 className="text-4xl font-black text-white tracking-tight">{monthlyViews || 0}</h3>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-8">
                      <div className="flex items-center justify-between mb-6">
                        <p className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><UserCircle2 className="w-5 h-5 text-indigo-400" /> Recent Coach Views</p>
                        {allRecentViewers.length > 3 && (
                          <button onClick={() => setShowAllViewersModal(true)} className="text-[10px] font-black text-indigo-300 hover:text-white uppercase tracking-widest bg-indigo-500/10 hover:bg-indigo-500/30 px-4 py-2 rounded-xl transition-all border border-indigo-500/20 shadow-sm">View All ({allRecentViewers.length})</button>
                        )}
                      </div>
                      
                      {/* Premium Only Lock stays active beneath the numbers! */}
                      <ProGate athleteProfile={athleteProfile} featureName="Advanced View Logs">
                        {recentViewers.length > 0 ? (
                          <div className="space-y-4">
                            {recentViewers.map((coach: any, idx: number) => (
                              <div key={`view-${idx}`} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 shadow-sm hover:bg-white/10 hover:border-white/20 transition-all group">
                                <div className="flex items-center gap-5">
                                  <AvatarWithBorder avatarUrl={coach.avatar_url} borderId="none" sizeClasses="w-12 h-12 shadow-md group-hover:scale-105 transition-transform" userRole="coach" />
                                  <div>
                                    <p className="font-black text-white text-base tracking-tight">Coach {coach.last_name}</p>
                                    <p className="text-xs font-bold text-slate-400 truncate max-w-[220px]">{coach.school_name}</p>
                                  </div>
                                </div>
                                <button onClick={() => handleContactCoach(coach.email)} className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center hover:bg-indigo-500 hover:text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all border border-indigo-500/20"><Mail className="w-5 h-5" /></button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm">
                            <p className="text-sm font-medium text-slate-400 italic">No recent views from verified coaches yet.</p>
                          </div>
                        )}
                      </ProGate>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PerformanceStats(props: PerformanceStatsProps) {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(99,102,241,0.4)]"></div>
        <p className="text-indigo-400 font-black uppercase tracking-widest text-xs animate-pulse">Loading Analytics...</p>
      </div>
    }>
      <PerformanceStatsContent {...props} />
    </Suspense>
  );
}