'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { 
  BarChart3, Info, Activity, Search, Calendar, 
  HelpCircle, UserCircle2, Mail, TrendingUp, ChevronDown, 
  Trash2, Crown, Lock, Eye, RefreshCw, Plus, CheckCircle2,
  LayoutGrid
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

  const [isSportsMenuOpen, setIsSportsMenuOpen] = useState(false);
  const sportsMenuRef = React.useRef<HTMLDivElement>(null);
  
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [localUnlocked, setLocalUnlocked] = useState(false);
  
  // Master-Detail Grid State
  const [activeSportView, setActiveSportView] = useState<string | null>(null);
  const [scoreInfoExpanded, setScoreInfoExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!state || !actions) {
      const tab = searchParams.get('tab');
      router.replace(`/dashboard?view=performance${tab ? `&tab=${tab}` : ''}`);
    }
  }, [state, actions, router, searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sportsMenuRef.current && !sportsMenuRef.current.contains(event.target as Node)) {
        setIsSportsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!state || !actions) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(99,102,241,0.4)]"></div>
        <p className="text-indigo-400 font-black uppercase tracking-widest text-xs animate-pulse">Syncing Homebase Data...</p>
      </div>
    );
  }

  const {
    athleteProfile, sportStats, userSports, disabledSportsList,
    socialSubTab, dailyViews, monthlyViews, allRecentViewers,
    recentViewers, showImpressionTooltip, gatingMode, genderKey
  } = state;

  const {
    setSocialSubTab, getDisplayRating, setSportActiveState,
    setSportToDelete, syncSportToSupabase, showToast, setShowImpressionTooltip,
    setShowAllViewersModal, handleContactCoach, handleToggleSportDropdown
  } = actions;

  const hasUnlockedAnalytics = useMemo(() => {
    if (localUnlocked) return true;
    if (gatingMode?.hasAccess) return true;
    if (athleteProfile?.unlocked_features?.includes('basic_analytics')) return true;
    return false;
  }, [athleteProfile, gatingMode, localUnlocked]);

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
        setLocalUnlocked(true); 
        showToast("Basic Analytics unlocked successfully!", "success");
    }
    setIsUnlocking(false);
  };

  const toggleScoreInfo = (sport: string) => {
    setScoreInfoExpanded(prev => ({ ...prev, [sport]: !prev[sport] }));
  };

  // Grid Tile Renderer
  const renderSportGridCard = (sport: string, isActive: boolean) => {
    const displayRating = getDisplayRating(sport);
    const tierStyles = getTierStyles(displayRating);

    return (
      <div 
        key={`grid-${sport}`}
        onClick={() => setActiveSportView(isActive ? null : sport)}
        className={`relative p-4 sm:p-5 cursor-pointer transition-all duration-300 shadow-lg group flex flex-col justify-between min-h-[136px] rounded-[1.5rem] ${
          isActive 
            ? 'scale-[1.02] z-20' 
            : 'hover:-translate-y-1 z-10'
        }`}
      >
        <div className={`absolute inset-0 rounded-[1.5rem] border-2 overflow-hidden transition-all duration-300 ${
          isActive 
            ? `${tierStyles.borderClass}${tierStyles.glowClass} bg-slate-800 ring-2 ring-inset ring-white/10` 
            : 'border-white/5 bg-slate-900/60 group-hover:bg-slate-800/60 group-hover:border-white/20'
        }`}>
          <div className={`absolute top-0 right-0 w-32 h-32 ${tierStyles.bgClass} blur-3xl opacity-30 group-hover:opacity-60 transition-opacity rounded-full pointer-events-none`}></div>
        </div>
        
        <div className="flex justify-between items-start mb-4 relative z-10">
           <div className={`p-2.5 sm:p-3 rounded-2xl border transition-all duration-300 ${isActive ? 'bg-indigo-500/30 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-110' : 'bg-indigo-500/10 border-indigo-500/30 group-hover:scale-110'}`}>
             <Activity className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-indigo-200' : 'text-indigo-400'}`} />
           </div>
           
           {displayRating > 0 ? (
             <div className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border ${tierStyles.borderClass} ${tierStyles.bgClass} flex items-center gap-1 shadow-sm`}>
                <span className={`text-base sm:text-lg font-black ${tierStyles.colorClass} leading-none`}>{displayRating}</span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">/99</span>
             </div>
           ) : (
             <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-slate-700 bg-slate-800/50 flex items-center gap-1">
                <span className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Unranked</span>
             </div>
           )}
        </div>
        
        <div className="relative z-10 mt-auto pt-2 flex-1 flex items-end">
           <h3 className="text-base font-black text-white tracking-tight leading-snug whitespace-normal break-words">{sport}</h3>
        </div>

        {isActive && (
          <svg 
            width="100" 
            height="28" 
            viewBox="0 0 100 28" 
            className="absolute -bottom-[25px] left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_6px_8px_rgba(59,130,246,0.6)] pointer-events-none"
          >
            <path d="M 0 0 L 0 3 C 20 3, 35 11, 40 16 L 47 23 Q 50 26, 53 23 L 60 16 C 65 11, 80 3, 100 3 L 100 0 Z" fill="#1e293b" />
            <path d="M 0 3 C 20 3, 35 11, 40 16 L 47 23 Q 50 26, 53 23 L 60 16 C 65 11, 80 3, 100 3" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>
    );
  };

  // Expanded Editor Renderer
  const renderIsolatedSportBlock = (sport: string) => {
    const stats = sportStats[sport] || { calculatedRating: 0 };
    const displayRating = getDisplayRating(sport);
    const tierStyles = getTierStyles(displayRating);
    const config = SPORT_CONFIGS_META[sport];
    
    if (!config) return null;

    return (
      <div 
        key={sport} 
        className={`backdrop-blur-2xl border flex-1 transition-all duration-500 ${getEquippedGlow(athleteProfile?.equipped_border)} z-10 rounded-[2rem] overflow-visible shadow-2xl`}
      >
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 rounded-t-[2rem] gap-4 sm:gap-2">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto flex-1">
            <div className={`p-3 bg-indigo-500/20 rounded-xl sm:rounded-2xl border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.3)] shrink-0`}>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-300" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">{sport} Profile</h3>
              <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-0.5 break-words whitespace-normal leading-relaxed">
                 Manage specific metrics and honors
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 shrink-0 w-full sm:w-auto border-t border-white/5 sm:border-transparent pt-3 sm:pt-0">
             <div className="relative z-10 flex items-center">
               <div className={`pl-4 pr-2 py-1.5 sm:px-4 sm:py-2 rounded-[1.25rem] border ${tierStyles.borderClass} ${tierStyles.bgClass} ${tierStyles.glowClass} flex items-center gap-1 sm:gap-2`}>
                 <div className="flex items-baseline gap-0.5 sm:gap-1">
                    <span className={`text-xl sm:text-2xl font-black ${tierStyles.colorClass}`}>{displayRating}</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">/99</span>
                 </div>
                 <button 
                   onClick={(e) => { e.stopPropagation(); toggleScoreInfo(sport); }} 
                   className="ml-1 sm:ml-2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors focus:outline-none shrink-0"
                   title="View Score Specifications"
                 >
                   <Info className="w-4 h-4" />
                 </button>
               </div>
             </div>
          </div>
        </div>
        
        {scoreInfoExpanded[sport] && (
          <div className="px-4 sm:px-6 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-slate-900/80 border border-slate-700/50 p-4 sm:p-5 rounded-xl text-xs sm:text-sm text-slate-300 leading-relaxed shadow-inner backdrop-blur-md">
              <strong className="text-white block mb-2 font-black tracking-wide text-sm">Recruitment Score Specifications</strong>
              This score (1-99) evaluates your verified metrics against college division averages for <span className="text-indigo-400 font-bold">{sport}</span>. 
              Higher scores unlock higher tiers (e.g., <span className="text-fuchsia-400 font-bold">95+ = Power 4 D1</span>, <span className="text-purple-400 font-bold">85+ = Mid-Major D1</span>). 
              The algorithm dynamically dictates your matchmaking visibility to programs of that exact caliber.
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 border-t border-white/10 bg-black/20 rounded-b-[2rem]">
           {stats.calculatedRating > 0 && athleteProfile?.id && (
              <div className="mb-6 px-2 sm:px-4">
                 <GlobalPercentileTracker athleteId={athleteProfile.id} sportName={sport} currentScore={stats.calculatedRating} />
              </div>
           )}

           <SportEditorRegistry 
             sport={sport}
             sportStats={sportStats[sport] || { metrics: [], metaContext: {} }}
             genderKey={genderKey}
             athleteProfile={athleteProfile}
             config={config}
             onSync={(updatedData) => syncSportToSupabase(sport, updatedData)}
             showToast={showToast}
             onDisable={() => { setActiveSportView(null); setSportActiveState(sport, false); }}
             onDelete={() => { setActiveSportView(null); setSportToDelete(sport); }}
           />
        </div>
      </div>
    );
  };

  const renderDisabledSportBlock = (sport: string) => (
    <div key={`disabled-${sport}`} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between opacity-70 hover:opacity-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300 group gap-2">
       <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
         <div className="p-2 sm:p-2.5 bg-white/5 rounded-xl border border-white/10 group-hover:border-white/20 transition-colors shrink-0">
           <Activity className="w-4 h-4 text-slate-400" />
         </div>
         <div className="min-w-0 flex-1">
           <h4 className="text-sm font-black text-slate-200 truncate">{sport}</h4>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">Currently Disabled</p>
         </div>
       </div>
       <div className="flex items-center gap-2 shrink-0">
         <button onClick={() => setSportActiveState(sport, true)} className="text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-3 sm:px-4 py-2 rounded-xl transition-all border border-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] shadow-sm">Enable</button>
         <button onClick={() => setSportToDelete(sport)} className="text-xs font-bold bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white w-10 h-10 flex items-center justify-center rounded-xl transition-all border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] shadow-sm"><Trash2 className="w-4 h-4" /></button>
       </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="w-full flex justify-center mb-8 px-4 sm:px-0">
        <div className="grid grid-cols-2 gap-3 sm:gap-5 w-full max-w-[500px]">
          <button 
            onClick={() => { setSocialSubTab('performance'); setActiveSportView(null); }} 
            className={`w-full px-2 sm:px-6 py-3.5 sm:py-4 rounded-[1.25rem] text-[11px] sm:text-sm font-black transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 border ${
              socialSubTab === 'performance' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_8px_30px_rgba(99,102,241,0.4)] border-indigo-400/50 scale-[1.02] ring-1 ring-white/10' 
                : 'bg-slate-900/60 backdrop-blur-2xl text-slate-400 hover:text-white hover:bg-slate-800 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5'
            }`}
          >
            <Activity className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" /> 
            <span>Performance Hub</span>
          </button>
          
          <button 
            onClick={() => setSocialSubTab('analytics')} 
            className={`w-full px-2 sm:px-6 py-3.5 sm:py-4 rounded-[1.25rem] text-[11px] sm:text-sm font-black transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 border ${
              socialSubTab === 'analytics' 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_8px_30px_rgba(37,99,235,0.4)] border-blue-400/50 scale-[1.02] ring-1 ring-white/10' 
                : 'bg-slate-900/60 backdrop-blur-2xl text-slate-400 hover:text-white hover:bg-slate-800 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5'
            }`}
          >
            <BarChart3 className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" /> 
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {socialSubTab === 'performance' && (
         <div className={`backdrop-blur-2xl rounded-[2.5rem] p-4 sm:p-6 md:p-10 border transition-all duration-500 ${getEquippedGlow(athleteProfile?.equipped_border)}`}>
            
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-white/10 gap-5">
               <div>
                 <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                   <LayoutGrid className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] shrink-0" /> 
                   Performance Hub
                 </h2>
                 <p className="text-slate-400 font-medium text-xs sm:text-sm mt-2 break-words whitespace-normal">
                   Tap any sport tile below to view and edit your stats.
                 </p>
               </div>
               
               <div className="relative inline-block text-left w-full sm:w-auto shrink-0" ref={sportsMenuRef}>
                 <button onClick={() => setIsSportsMenuOpen(!isSportsMenuOpen)} className="inline-flex items-center justify-center w-full sm:w-auto gap-2 font-black px-5 sm:px-6 py-4 sm:py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-cyan-500 hover:bg-cyan-400 text-white border border-cyan-400 text-sm">
                    <Plus className="w-4 h-4 shrink-0" /> Add / Update Sports <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isSportsMenuOpen ? 'rotate-180' : ''}`} />
                 </button>
                 
                 {isSportsMenuOpen && (
                   <div className="absolute right-0 left-0 sm:left-auto mt-3 w-full sm:w-[320px] max-w-[calc(100vw-2rem)] bg-slate-900 rounded-2xl shadow-2xl border border-cyan-500/30 p-3 sm:p-4 z-[100] max-h-[60vh] overflow-y-auto custom-scrollbar text-white text-left animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-2 border-b border-slate-800 mb-2">Sport Specifications</p>
                      <div className="grid grid-cols-1 gap-2">
                        {ALL_SPORTS.map((sport: string) => {
                          const isActive = sportStats[sport]?.isActive === true;
                          return (
                            <div key={sport} onMouseDown={(e) => { e.preventDefault(); handleToggleSportDropdown(sport); }} className="flex items-center gap-3 w-full text-left p-3 sm:p-4 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors group">
                               <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${isActive ? 'bg-cyan-500 border-cyan-500' : 'bg-slate-950 border-slate-700 group-hover:border-cyan-500'}`}>
                                  {isActive && <CheckCircle2 className="w-3 h-3 text-white" />}
                               </div>
                               <span className={`text-sm font-bold break-words whitespace-normal leading-tight select-none ${isActive ? 'text-white' : 'text-slate-400'}`}>{sport}</span>
                            </div>
                          )
                        })}
                      </div>
                   </div>
                 )}
               </div>
            </div>
            
            {/* Master-Detail Content */}
            <div className="animate-in fade-in duration-300">
               {Object.keys(sportStats).length > 0 && userSports.length > 0 ? (
                 <div>
                   {/* 2-Column Dashboard Grid */}
                   <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 relative mb-6">
                     {userSports.map((sport: string) => renderSportGridCard(sport, activeSportView === sport))}
                   </div>

                   {/* Smoothly Expanding Editor Rendered Below the Grid */}
                   {activeSportView && (
                     <div className="mt-6 animate-in slide-in-from-top-6 fade-in duration-500 ease-out">
                       {renderIsolatedSportBlock(activeSportView)}
                     </div>
                   )}

                   {disabledSportsList.length > 0 && (
                     <div className="pt-8 border-t border-white/10 mt-8">
                       <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 px-1">Disabled Sports</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                         {disabledSportsList.map((sport: string) => renderDisabledSportBlock(sport))}
                       </div>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center border-2 border-dashed border-white/10 rounded-[2rem] bg-black/20 backdrop-blur-md mt-4">
                   <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-inner mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                     <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500" />
                   </div>
                   <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">No Sports Loaded</h3>
                   <p className="text-xs sm:text-sm font-medium text-slate-400 max-w-md mb-8">To rank in the matchmaker algorithm, add your sport from the dropdown above.</p>
                 </div>
               )}
            </div>
         </div>
      )}

      {socialSubTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className={`backdrop-blur-2xl rounded-[2.5rem] p-4 sm:p-6 md:p-10 border relative overflow-hidden transition-all duration-500 ${getEquippedGlow(athleteProfile?.equipped_border)}`}>
            <div className="flex items-center justify-between mb-6 sm:mb-8 pb-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center tracking-tight">
                  <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 mr-3 text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)] shrink-0" /> Scouting Analytics
                </h2>
                <p className="text-slate-400 font-medium mt-2 text-xs sm:text-sm break-words whitespace-normal">See exactly how much traction your profile is getting with college coaches.</p>
              </div>
            </div>

            <div className={`relative ${!hasUnlockedAnalytics ? 'min-h-[350px]' : ''}`}>
              <div className="mb-6 sm:mb-8">
                <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-[2rem] p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-md transition-all duration-500 hover:border-blue-400/40 hover:shadow-[0_10px_40px_rgba(59,130,246,0.15)] text-center sm:text-left">
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center justify-center sm:justify-start gap-1.5 drop-shadow-sm"><Eye className="w-4 h-4 shrink-0" /> All-Time Profile Clicks</p>
                    <h3 className="text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-md">{athleteProfile?.profile_views || 0}</h3>
                  </div>
                  <div className="max-w-[220px]">
                    <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed break-words whitespace-normal">Coaches have actively clicked to view your full profile and metrics.</p>
                  </div>
                </div>
              </div>

              <div className="relative rounded-[2rem] border border-white/10 bg-black/20 p-5 sm:p-8 overflow-hidden backdrop-blur-md">
                {!hasUnlockedAnalytics && (
                  <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6 sm:p-8">
                    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-slate-800 text-slate-400 font-black tracking-widest text-[10px] uppercase px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">Locked</div>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 sm:mb-5 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                      <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-slate-300" />
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">Basic Analytics Locked</h3>
                    
                    <p className="text-slate-400 text-xs sm:text-sm font-medium mb-6 max-w-lg leading-relaxed break-words whitespace-normal">
                      Unlock basic analytics to track your feed impressions and see <strong className="text-white">how many</strong> people view your profile. Upgrade to <strong className="text-amber-400">Premium</strong> below to see exactly <strong className="text-amber-400">WHO</strong> is viewing it.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                      <button 
                        onClick={handleUnlockAnalytics}
                        disabled={isUnlocking}
                        className="w-full sm:w-auto justify-center bg-slate-800 hover:bg-slate-700 text-white font-black px-5 sm:px-6 py-4 sm:py-3.5 rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-[11px] sm:text-sm border border-slate-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isUnlocking ? <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" /> : <Points className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />} 
                        Unlock for 1,000 pts
                      </button>
                      
                      <Link href="/pro" className="w-full sm:w-auto justify-center bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black px-5 sm:px-6 py-4 sm:py-3.5 rounded-xl shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform flex items-center gap-2 text-[11px] sm:text-sm tracking-wide active:scale-95">
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-md shrink-0" /> Get Premium
                      </Link>
                    </div>

                    {athleteProfile && (athleteProfile.coins || 0) < 1000 && (
                      <p className="text-xs text-red-400 mt-4 font-bold">You only have {(athleteProfile.coins || 0).toLocaleString()} / 1,000 points.</p>
                    )}
                  </div>
                )}

                <div className={`${!hasUnlockedAnalytics ? 'opacity-20 select-none blur-[4px] pointer-events-none' : ''}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
                    <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-lg relative transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-slate-800/60">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          Feed Impressions
                          <button onClick={() => setShowImpressionTooltip(!showImpressionTooltip)} className="w-8 h-8 flex items-center justify-center -ml-1 text-slate-500 hover:text-emerald-400 transition-colors focus:outline-none"><HelpCircle className="w-4 h-4 shrink-0" /></button>
                        </p>
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{athleteProfile?.search_appearances || 0}</h3>
                      {showImpressionTooltip && hasUnlockedAnalytics && (
                        <div className="absolute top-14 left-0 w-[200px] sm:w-[220px] bg-slate-800 text-slate-200 text-[10px] sm:text-xs p-4 sm:p-5 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 border border-white/10 break-words whitespace-normal">
                          <p className="mb-4 leading-relaxed font-medium">Number of times your profile appeared directly on a coach's screen.</p>
                          <button onClick={() => setShowImpressionTooltip(false)} className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2 sm:py-2.5 rounded-lg transition-colors border border-white/5">Got it</button>
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-slate-800/60">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Views Today</p>
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0" />
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{dailyViews || 0}</h3>
                    </div>
                    <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:bg-slate-800/60">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Views This Month</p>
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 shrink-0" />
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{monthlyViews || 0}</h3>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6 sm:pt-8">
                      <div className="flex items-center justify-between mb-5 sm:mb-6">
                        <p className="text-xs sm:text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><UserCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 shrink-0" /> Recent Coach Views</p>
                        {allRecentViewers.length > 3 && (
                          <button onClick={() => setShowAllViewersModal(true)} className="text-[10px] font-black text-indigo-300 hover:text-white uppercase tracking-widest bg-indigo-500/10 hover:bg-indigo-500/30 px-3 sm:px-4 py-2 rounded-xl transition-all border border-indigo-500/20 shadow-sm shrink-0">View All ({allRecentViewers.length})</button>
                        )}
                      </div>
                      
                      <ProGate athleteProfile={athleteProfile} featureName="Advanced View Logs">
                        {recentViewers.length > 0 ? (
                          <div className="space-y-3 sm:space-y-4">
                            {recentViewers.map((coach: any, idx: number) => (
                              <div key={`view-${idx}`} className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 shadow-sm hover:bg-white/10 hover:border-white/20 transition-all group gap-2">
                                <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                                  <AvatarWithBorder avatarUrl={coach.avatar_url} borderId="none" sizeClasses="w-10 h-10 sm:w-12 sm:h-12 shadow-md shrink-0 group-hover:scale-105 transition-transform" userRole="coach" />
                                  <div className="min-w-0 flex-1 pr-2">
                                    <p className="font-black text-white text-sm sm:text-base tracking-tight truncate">Coach {coach.last_name}</p>
                                    <p className="text-xs font-bold text-slate-400 line-clamp-2 break-words whitespace-normal">{coach.school_name}</p>
                                  </div>
                                </div>
                                <button onClick={() => handleContactCoach(coach.email)} className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center shrink-0 hover:bg-indigo-500 hover:text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all border border-indigo-500/20"><Mail className="w-5 h-5 shrink-0" /></button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-6 sm:p-8 text-center backdrop-blur-sm">
                            <p className="text-xs sm:text-sm font-medium text-slate-400 italic break-words whitespace-normal">No recent views from verified coaches yet.</p>
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
        <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(99,102,241,0.4)]"></div>
        <p className="text-indigo-400 font-black uppercase tracking-widest text-[10px] sm:text-xs animate-pulse">Loading Analytics...</p>
      </div>
    }>
      <PerformanceStatsContent {...props} />
    </Suspense>
  );
}