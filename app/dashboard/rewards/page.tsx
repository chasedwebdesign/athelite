'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Gift, CheckCircle2, Users, Rocket, Crown, Copy, AlertCircle, 
  Package, LayoutTemplate, Sparkles, Diamond, Calendar, Trophy, ChevronRight, RefreshCw, Zap
} from 'lucide-react';
import { LootBoxVisual } from '@/components/LootBoxVisual';
import { Points } from '@/components/Points';

interface RewardsProps {
  athleteProfile?: any;
  streak?: number; 
  coins?: number;
  awardedToday?: number;
  awardedBoxToday?: string | null;
  canClaimDaily?: boolean;
  isClaimingDaily?: boolean;
  onClaimDaily?: () => void | Promise<void>;
  handleShareCode?: (code: string) => void;
  claimedReferrals?: number;
  onClaimReferral?: (count: number, pts: number, hasBox: boolean) => void | Promise<void>;
  onSubmitReferralCode?: (code: string) => Promise<{ success: boolean }>;
}

export default function Rewards({ 
  athleteProfile, 
  streak: loginProgress = 0, 
  coins = 0, 
  awardedToday = 0, 
  awardedBoxToday = null,
  canClaimDaily = false,
  isClaimingDaily = false,
  onClaimDaily,
  handleShareCode,
  claimedReferrals = 0,
  onClaimReferral,
  onSubmitReferralCode
}: RewardsProps) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [claimingRefCount, setClaimingRefCount] = useState<number | null>(null);

  // If a user navigates directly to /dashboard/rewards URL, redirect to /dashboard?view=rewards so state is hydrated
  useEffect(() => {
    if (!athleteProfile) {
      router.replace('/dashboard?view=rewards');
    }
  }, [athleteProfile, router]);

  if (!athleteProfile) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-black uppercase tracking-widest text-cyan-400 animate-pulse">Loading Rewards...</p>
      </div>
    );
  }

  const isPro = Boolean(athleteProfile?.is_premium);
  const proMultiplier = isPro ? 3 : 1;

  // Check if 7 days have passed since account creation
  const isOfferExpired = athleteProfile?.created_at 
    ? new Date().getTime() > new Date(athleteProfile.created_at).getTime() + (7 * 24 * 60 * 60 * 1000)
    : true;

  const myReferralCode = athleteProfile?.custom_slug || null;
  const currentRefs = athleteProfile?.verified_referrals || 0;
  
  // Driving the cycle based on CLAIMED referrals locks them into claiming blocks of 5
  const refCycle = Math.floor(claimedReferrals / 5);
  const refBase = refCycle * 5;
  const progressInCycle = Math.max(0, currentRefs - refBase);
  const progressPct = Math.min(100, (progressInCycle / 5) * 100);

  // Base referral points multiplied by 3x if the athlete is PRO
  const getRewardAmount = (count: number) => {
    let base = 500;
    if (count === 1) base = 100;
    else if (count === 2) base = 200;
    else if (count === 3) base = 300;
    else if (count === 4) base = 400;
    return base * proMultiplier;
  };

  const milestones = [
    { count: refBase + 1, hasBox: (refBase + 1) <= 5, pts: getRewardAmount(refBase + 1) },
    { count: refBase + 2, hasBox: (refBase + 2) <= 5, pts: getRewardAmount(refBase + 2) },
    { count: refBase + 3, hasBox: (refBase + 3) <= 5, pts: getRewardAmount(refBase + 3) },
    { count: refBase + 4, hasBox: (refBase + 4) <= 5, pts: getRewardAmount(refBase + 4) },
    { count: refBase + 5, hasBox: (refBase + 5) <= 5, pts: getRewardAmount(refBase + 5) },
  ];

  // If canClaimDaily is true, the user is about to claim day (loginProgress + 1)
  const targetDayProgress = canClaimDaily ? loginProgress + 1 : Math.max(1, loginProgress);
  const safeProgress = Math.max(0, targetDayProgress - 1);
  const cycleCount = Math.floor(safeProgress / 28);
  const cycleMultiplier = 1 + (cycleCount * 0.5);
  const effectiveMultiplier = cycleMultiplier * proMultiplier;
  const dayNumInCycle = (safeProgress % 28) + 1; 
  const cycleProgressPct = Math.min(100, ((canClaimDaily ? dayNumInCycle - 1 : dayNumInCycle) / 28) * 100);
  const cycleStartDay = cycleCount * 28;

  const getRewardForDay = (dayInTrack: number) => {
    const dayOfWeek = ((dayInTrack - 1) % 7) + 1;
    const weekOfCycle = Math.floor((dayInTrack - 1) / 7) + 1;
    
    let boxType: string | null = null;
    let boxLabel = "";
    let tier: 'standard' | 'premium' | 'ultra' | null = null;
    let Icon: React.ElementType = Points;
    let iconColor = "text-amber-400";
    let glow = "";
    
    let baseCoins = 20;
    if (dayInTrack === 28) baseCoins = 500;
    else if (dayInTrack === 14) baseCoins = 250;
    else if (dayOfWeek === 7) baseCoins = 100;

    if (dayOfWeek === 1) { 
      boxType = "std_card"; boxLabel = "Standard Card Box"; tier = "standard"; Icon = Package; iconColor = "text-blue-400"; glow = "shadow-[0_0_15px_rgba(96,165,250,0.3)]";
    } else if (dayOfWeek === 5) { 
      boxType = "std_border"; boxLabel = "Standard Border Box"; tier = "standard"; Icon = LayoutTemplate; iconColor = "text-blue-400"; glow = "shadow-[0_0_15px_rgba(96,165,250,0.3)]";
    } else if (dayOfWeek === 3) {
      boxType = weekOfCycle % 2 !== 0 ? "prem_card" : "prem_border";
      boxLabel = weekOfCycle % 2 !== 0 ? "Premium Card Box" : "Premium Border Box";
      tier = "premium";
      Icon = weekOfCycle % 2 !== 0 ? Package : LayoutTemplate;
      iconColor = "text-purple-400";
      glow = "shadow-[0_0_15px_rgba(168,85,247,0.3)]";
    } else if (dayOfWeek === 7) {
      boxType = weekOfCycle % 2 !== 0 ? "ultra_card" : "ultra_border";
      boxLabel = weekOfCycle % 2 !== 0 ? "Ultra Card Box" : "Ultra Border Box";
      tier = "ultra";
      Icon = weekOfCycle % 2 !== 0 ? Sparkles : Diamond;
      iconColor = "text-fuchsia-400";
      glow = "shadow-[0_0_30px_rgba(217,70,239,0.5)]";
    }

    return { boxType, boxLabel, tier, Icon, iconColor, glow, baseCoins, isMajor: dayOfWeek === 7 || dayInTrack === 14 || dayInTrack === 28 };
  };

  const todayRewardPreview = getRewardForDay(dayNumInCycle);
  const todayPointsAmount = Math.round(todayRewardPreview.baseCoins * effectiveMultiplier);

  const handleInviteSubmit = async () => {
    if (!onSubmitReferralCode) return;
    setIsSubmittingInvite(true);
    const res = await onSubmitReferralCode(inviteCode);
    setIsSubmittingInvite(false);
    if (res.success) {
      setInviteCode('');
    }
  };

  const handleMilestoneClick = async (count: number, pts: number, hasBox: boolean) => {
    if (!onClaimReferral || claimingRefCount !== null) return;
    setClaimingRefCount(count);
    await onClaimReferral(count, pts, hasBox);
    setClaimingRefCount(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* PRO 3X MULTIPLIER STATUS BANNER */}
      <div className={`rounded-3xl p-4 sm:p-5 border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl ${
        isPro
          ? 'bg-gradient-to-r from-cyan-950/60 via-purple-950/60 to-pink-950/60 border-cyan-400/40'
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center gap-3.5 text-center sm:text-left flex-col sm:flex-row">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            isPro
              ? 'bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
          }`}>
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                {isPro ? '3x PRO Point Multiplier Active' : 'Want 3x Points on Every Daily Login & Referral?'}
              </h3>
              {isPro && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
                  3x Boosted
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              {isPro
                ? 'All daily login rewards, cycle bonuses, and referral milestones below are automatically tripled!'
                : `Upgrade to PRO to triple today's login reward from +${Math.round(todayRewardPreview.baseCoins * cycleMultiplier)} to +${Math.round(todayRewardPreview.baseCoins * cycleMultiplier * 3)} Points and earn 3x on referrals.`}
            </p>
          </div>
        </div>

        {!isPro && (
          <Link
            href="/pro"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:scale-105 transition-transform text-center shrink-0 whitespace-nowrap"
          >
            Unlock 3x Points
          </Link>
        )}
      </div>

      <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-8 md:p-12 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-fuchsia-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 relative z-10">
          
          {/* LEFT: REWARD TRACK */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)] relative">
                    <Calendar className="w-6 h-6 text-emerald-400" />
                    {canClaimDaily && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(225,29,72,0.8)] border-2 border-slate-900">
                        1
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Reward Track</h2>
                    <p className="text-emerald-400 font-bold text-sm flex items-center gap-1.5 uppercase tracking-widest">
                      Level {cycleCount + 1} Earner {isPro && '• 3x PRO'}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-slate-400 font-medium text-sm mt-3">
                Claim your daily points and rotating loot drops right here. Complete a 28-day cycle to boost all future point gains by <span className="text-white font-bold">+0.5x!</span>
              </p>
            </div>

            {/* UNCLAIMED DAILY LOGIN LOOT BANNER (REPLACES ANNOYING FULL-SCREEN MODAL) */}
            {canClaimDaily ? (
              <div className="bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-900 border-2 border-emerald-400/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_35px_rgba(16,185,129,0.25)] animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 relative">
                    <Gift className="w-6 h-6 text-emerald-300 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                        Day {targetDayProgress} Reward Ready
                      </span>
                      {isPro && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded-full">
                          3x PRO Applied
                        </span>
                      )}
                    </div>
                    <p className="text-base sm:text-lg font-black text-white mt-0.5">
                      +{todayPointsAmount} Points {todayRewardPreview.boxLabel && <span className="text-emerald-300">+ 1x {todayRewardPreview.boxLabel}</span>}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isClaimingDaily}
                  onClick={() => onClaimDaily && onClaimDaily()}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isClaimingDaily ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Claiming...</>
                  ) : (
                    <><Zap className="w-4 h-4 fill-slate-950" /> Claim Day {targetDayProgress} Loot</>
                  )}
                </button>
              </div>
            ) : (awardedToday > 0 || awardedBoxToday) ? (
              <div className="bg-gradient-to-r from-emerald-900/60 to-emerald-800/40 border border-emerald-500/50 text-emerald-100 px-5 py-4 rounded-2xl text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-in zoom-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-2 rounded-full"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0"/></div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-emerald-400/80 mb-0.5">Today's Loot Secured</span>
                    You claimed <span className="text-white">+{awardedToday} Points</span> {awardedBoxToday && <span className="text-emerald-300">and 1x <span className="text-white">{awardedBoxToday}</span></span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/80 border border-slate-800 px-5 py-3.5 rounded-2xl text-xs font-bold text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Today's login reward has been claimed. Come back tomorrow for Day {loginProgress + 1}!
                </span>
              </div>
            )}

            <div className="bg-slate-950 p-5 sm:p-7 rounded-[2rem] border border-slate-800 shadow-inner relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
                <div className="w-full sm:w-1/2">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" /> Cycle Progress
                    </span>
                    <span className="text-xs font-black text-emerald-400">{canClaimDaily ? dayNumInCycle - 1 : dayNumInCycle} <span className="text-slate-600">/ 28</span></span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden shadow-inner border border-slate-800">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 relative" style={{ width: `${cycleProgressPct}%` }}></div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-center sm:text-right bg-slate-900/50 px-3.5 py-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Multiplier</span>
                    <span className="text-sm font-black text-emerald-400">
                      {effectiveMultiplier.toFixed(1)}x {isPro && <span className="text-[10px] text-cyan-400">(3x PRO)</span>}
                    </span>
                  </div>
                  <div className="text-center sm:text-right bg-slate-900/50 px-3.5 py-2 rounded-xl border border-slate-800">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Total Points</span>
                    <span className="text-sm font-black text-amber-400 flex items-center justify-center sm:justify-end gap-1.5">
                      <Points className="w-4 h-4"/> {coins.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3">
                {[...Array(28)].map((_, i) => {
                  const cellDay = i + 1; 
                  const absoluteTargetDay = cycleStartDay + cellDay;
                  
                  const isPast = absoluteTargetDay <= loginProgress;
                  const isClaimableToday = canClaimDaily && absoluteTargetDay === loginProgress + 1;
                  const isNextTomorrow = !canClaimDaily && absoluteTargetDay === loginProgress + 1;
                  
                  const rewardData = getRewardForDay(cellDay);
                  const totalRewardForDay = Math.round(rewardData.baseCoins * effectiveMultiplier);

                  return (
                    <div
                      key={`reward-${i}`}
                      onClick={() => {
                        if (isClaimableToday && onClaimDaily && !isClaimingDaily) {
                          onClaimDaily();
                        }
                      }}
                      className={`group relative p-2 sm:p-3 rounded-2xl border-2 flex flex-col items-center justify-between text-center transition-all duration-300 aspect-[3/4] sm:aspect-[4/5] ${
                        isPast
                          ? 'bg-slate-900/50 border-slate-800 opacity-60 grayscale-[0.3]'
                          : isClaimableToday
                            ? 'bg-emerald-900/40 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)] scale-[1.06] z-10 cursor-pointer ring-2 ring-emerald-400/30'
                            : isNextTomorrow
                              ? 'bg-emerald-950/20 border-emerald-500/50 scale-[1.02] z-10'
                              : 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-800/50'
                      }`}
                    >
                      {isPast && (
                        <div className="absolute -top-1.5 -right-1.5 bg-slate-950 rounded-full p-0.5 shadow-md z-20">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500"/>
                        </div>
                      )}

                      {isClaimableToday && (
                        <div className="absolute -top-2 -right-2 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg z-20 uppercase">
                          Claim
                        </div>
                      )}
                      
                      <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest shrink-0 relative z-10 ${isClaimableToday || isNextTomorrow ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-slate-500'}`}>
                        Day {absoluteTargetDay}
                      </span>
                      
                      <div className="w-full flex-1 flex items-center justify-center min-h-0 my-1 sm:my-2">
                        <div className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0 ${rewardData.glow && !isPast ? rewardData.glow : ''} ${isClaimableToday ? 'animate-pulse-glow' : ''}`}>
                          {rewardData.tier && !isPast ? (
                            <LootBoxVisual tier={rewardData.tier} size="sm" />
                          ) : (
                            <div className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${isPast ? 'text-slate-600' : rewardData.iconColor}`}>
                              <rewardData.Icon className="w-full h-full" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <span className={`font-black shrink-0 relative z-10 ${isClaimableToday ? 'text-emerald-300 text-xs sm:text-sm drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]' : isNextTomorrow ? 'text-amber-400 text-xs sm:text-sm' : 'text-[10px] sm:text-xs text-slate-400 group-hover:text-amber-400 transition-colors'}`}>
                        +{totalRewardForDay}
                      </span>
                      
                      {rewardData.boxType && !isPast && (
                        <div className="absolute -bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 bg-slate-800 border border-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-md text-white whitespace-nowrap z-30 pointer-events-none shadow-xl">
                          {rewardData.boxLabel}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: REFERRAL SQUAD */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.2)] relative">
                  <Users className="w-6 h-6 text-fuchsia-400" />
                  {currentRefs > claimedReferrals && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(225,29,72,0.8)] border-2 border-slate-900">
                      {currentRefs - claimedReferrals}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">Referral Squad</h2>
                  <p className="text-fuchsia-400 font-bold text-sm flex items-center gap-1.5 uppercase tracking-widest">
                    Level {refCycle + 1} Recruiter {isPro && '• 3x PRO Bounty'}
                  </p>
                </div>
              </div>
              <p className="text-slate-400 font-medium text-sm mt-3">
                Invite teammates. Every verified recruit (Trust Level 1+) grants an increasing bounty of <span className="text-amber-400 font-bold">{isPro ? '3x Boosted Points' : 'Points'}</span>! Total Recruits: <span className="text-white font-black">{currentRefs}</span>
              </p>
            </div>
            
            <div className="bg-slate-950 p-6 sm:p-8 rounded-[2rem] border border-slate-800 space-y-8 shadow-inner">
              
              {!athleteProfile?.referred_by && !isOfferExpired && (
                <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(59,130,246,0.15)] relative overflow-hidden animate-in fade-in duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none"></div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1 flex items-center gap-2 relative z-10">
                    <Users className="w-4 h-4 text-blue-400" /> Have an Invite Code?
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mb-4 relative z-10">
                    Enter a teammate's invite code to claim <span className="text-amber-400 font-bold">+{500 * proMultiplier} Points</span> & <span className="text-cyan-400 font-bold">1x Standard Box</span>.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 relative z-10">
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="e.g. jsmith2027"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <button
                      onClick={handleInviteSubmit}
                      disabled={isSubmittingInvite || !inviteCode.trim()}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                      {isSubmittingInvite ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Claim Pack'}
                    </button>
                  </div>
                </div>
              )}

              {currentRefs >= 5 ? (
                <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-6 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-full"><Trophy className="w-6 h-6 text-amber-400" /></div>
                    <span className="text-sm font-black text-slate-300 uppercase tracking-widest">Total Recruits</span>
                  </div>
                  <span className="text-5xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">
                    {currentRefs}
                  </span>
                </div>
              ) : (
                <div className="space-y-3 relative">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Rocket className="w-3.5 h-3.5" /> Tier Progress
                    </span>
                    <span className="text-xl font-black text-amber-400">{progressInCycle} <span className="text-slate-600 text-sm">/ 5</span></span>
                  </div>
                  <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden shadow-inner border border-slate-800 relative">
                    <div className="absolute inset-0 flex justify-between px-1 pointer-events-none z-10">
                      {[1,2,3,4].map(n => <div key={n} className="w-px h-full bg-slate-950/50"></div>)}
                    </div>
                    <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-700 relative z-0" style={{ width: `${progressPct}%` }}></div>
                  </div>
                </div>
              )}

              {myReferralCode ? (
                <div className="bg-slate-900 border border-fuchsia-500/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative z-10 flex-1 min-w-0 w-full">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Your Tactical Invite Code</p>
                    <p className="text-lg sm:text-xl font-mono font-black text-white tracking-widest selection:bg-fuchsia-500/30 drop-shadow-md break-all">
                      {myReferralCode}
                    </p>
                    <p className="text-[10px] text-fuchsia-400/80 mt-2 font-medium">
                      *Friends must reach Trust Level 1 to enter this code.
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleShareCode && handleShareCode(myReferralCode)} 
                    className="relative z-10 w-full md:w-auto bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(192,38,211,0.4)] flex items-center justify-center gap-2 shrink-0 border border-fuchsia-400/50 hover:border-fuchsia-300"
                  >
                    <Copy className="w-5 h-5" /> Copy Code
                  </button>
                </div>
              ) : (
                <div className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 shadow-inner">
                  <AlertCircle className="w-8 h-8 opacity-80" /> 
                  <p>Set a Custom Slug in your profile to generate your unique tactical invite code. (Friends must reach Trust Level 1 to use it!)</p>
                </div>
              )}
            </div>
            
            <div className="pt-8 border-t border-slate-800/80 relative z-10">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8 text-center flex items-center justify-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" /> Upcoming Milestones {isPro && '(3x PRO Boosted)'}
              </h3>
              
              <div className="flex flex-col sm:flex-row justify-between relative gap-6 sm:gap-0 px-2 sm:px-0">
                <div className="absolute top-1/2 -translate-y-1/2 left-8 right-8 h-1.5 bg-slate-800 rounded-full hidden sm:block z-0 shadow-inner"></div>
                
                {milestones.map((ms, idx) => {
                  const isAchieved = currentRefs >= ms.count;
                  const isNext = currentRefs + 1 === ms.count;
                  const isClaimed = claimedReferrals >= ms.count;
                  const canClaim = isAchieved && !isClaimed && (ms.count === claimedReferrals + 1);
                  
                  return (
                    <div key={`milestone-${idx}`} className="relative z-10 flex flex-row sm:flex-col items-center gap-5 sm:gap-0 group">
                      
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full flex items-center justify-center border-[4px] transition-all duration-500 relative
                        ${isAchieved ? 'bg-amber-500/10 border-amber-400 text-white shadow-[0_0_30px_rgba(251,191,36,0.6)] scale-110' : 
                          isNext ? 'bg-slate-900 border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.2)] group-hover:scale-105 group-hover:border-amber-400' : 
                          'bg-slate-900 border-slate-800'}`}>
                        
                        {canClaim && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-lg z-30">
                            1
                          </span>
                        )}

                        <div className={`transition-all duration-300 flex items-center justify-center w-full h-full relative ${!isAchieved && !isNext ? 'opacity-40 grayscale group-hover:opacity-60' : ''} ${isAchieved ? 'drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]' : ''}`}>
                          {ms.hasBox ? (
                            <>
                              <LootBoxVisual tier="ultra" size="sm" />
                              <div className={`absolute -bottom-1 -right-1 bg-slate-950 rounded-full p-0.5 border border-slate-800 shadow-xl ${isAchieved || isNext ? 'opacity-100' : 'opacity-0'}`}>
                                <Points className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                              </div>
                            </>
                          ) : (
                            <Points className={`w-6 h-6 sm:w-8 sm:h-8 ${isAchieved || isNext ? 'text-amber-400' : 'text-slate-400'}`} />
                          )}
                        </div>
                      </div>

                      {/* Mobile Connector Line */}
                      {idx !== milestones.length - 1 && (
                        <div className={`absolute left-7 top-14 bottom-[-1.5rem] w-1 sm:hidden ${isAchieved ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
                      )}

                      <div className="sm:mt-4 text-left sm:text-center flex-1">
                        <div className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest ${isAchieved ? 'text-amber-400' : isNext ? 'text-slate-400' : 'text-slate-600'}`}>
                          {ms.count} Recruits
                        </div>
                        <div className={`text-xs sm:text-sm font-bold mt-1.5 flex flex-col items-start sm:items-center gap-1 ${isAchieved ? 'text-white' : isNext ? 'text-slate-300' : 'text-slate-500'}`}>
                          {ms.hasBox && <span className={isAchieved ? 'text-slate-200' : ''}>Ultra Box</span>}
                          
                          {canClaim ? (
                            <button 
                              type="button"
                              disabled={claimingRefCount === ms.count}
                              onClick={() => handleMilestoneClick(ms.count, ms.pts, ms.hasBox)} 
                              className="bg-amber-500 hover:bg-amber-400 text-amber-950 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(251,191,36,0.6)] transition-transform active:scale-95 w-full sm:w-auto mt-1 cursor-pointer"
                            >
                              {claimingRefCount === ms.count ? 'Claiming...' : `Claim +${ms.pts}`}
                            </button>
                          ) : isClaimed ? (
                            <span className="text-emerald-400 flex items-center justify-center gap-1 font-black text-[10px] sm:text-xs uppercase tracking-widest mt-1 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5"/> Claimed
                            </span>
                          ) : (
                            <span className={`flex items-center gap-1 font-black ${isAchieved ? 'text-amber-400' : ''}`}>
                              {ms.hasBox && <span className="text-slate-500">+</span>} {ms.pts} <Points className="w-3.5 h-3.5 inline-block"/>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {isNext && (
                        <div className="hidden sm:flex absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
                          <ChevronRight className="w-5 h-5 text-amber-500 rotate-90" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}