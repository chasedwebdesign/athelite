'use client';

import React from 'react';
import { Gift, CheckCircle2, Coins, Users, Rocket, Crown, Copy, AlertCircle } from 'lucide-react';

interface RewardsProps {
  athleteProfile: any;
  streak: number;
  coins: number;
  awardedToday: number;
  handleShareCode: (code: string) => void;
}

export default function Rewards({ athleteProfile, streak, coins, awardedToday, handleShareCode }: RewardsProps) {
  const myReferralCode = athleteProfile?.athletic_net_url?.match(new RegExp('\\d{5,}'))?.[0] || null;
  const currentRefs = athleteProfile?.verified_referrals || 0;
  const cycle = Math.floor(currentRefs / 5);
  const base = cycle * 5;
  const progressInCycle = currentRefs - base;
  const progressPct = Math.min(100, (progressInCycle / 5) * 100);

  const milestones = [
    { count: base + 1, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 2, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 3, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 4, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 5, label: 'Plasma Border', icon: Crown, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500', isMajor: true },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-black text-white flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <span className="flex items-center gap-3"><Gift className="w-8 h-8 text-emerald-400" /> Daily Check-In Rewards</span>
              </h2>
              <p className="text-slate-400 font-medium text-sm">
                Your daily ChasedCash reward compounds by 2% every consecutive day you log in. Hit the 7-day mark for a massive 1k bonus!
              </p>
            </div>

            {awardedToday > 0 && (
               <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg animate-in zoom-in duration-300">
                  <CheckCircle2 className="w-5 h-5 shrink-0"/> You claimed +{awardedToday} ChasedCash today!
               </div>
            )}

            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                  <span className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">Login Streak: <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{streak} Days</span></span>
                  <span className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">Balance: <span className="text-amber-400 flex items-center gap-1.5"><Coins className="w-4 h-4"/> {coins}</span></span>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {[...Array(7)].map((_, i) => {
                    const dayNumInCycle = i + 1;
                    const cycleStartStreak = Math.floor(Math.max(0, streak - 1) / 7) * 7;
                    const targetStreak = cycleStartStreak + dayNumInCycle;
                    const isToday = targetStreak === streak;
                    const isPast = targetStreak < streak;
                    const baseReward = 100;
                    const rewardVal = Math.round(baseReward * Math.pow(1.02, targetStreak - 1));
                    const isBonusDay = dayNumInCycle === 7;
                    const totalRewardForDay = isBonusDay ? rewardVal + 1000 : rewardVal;

                    return (
                       <div key={`reward-${i}`} className={`relative p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 text-center transition-all ${isPast ? 'bg-slate-900 border-slate-800 opacity-60' : isToday ? 'bg-emerald-900/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.02] z-10' : 'bg-slate-900 border-slate-700'}`}>
                          {isPast && <div className="absolute top-1.5 right-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/></div>}
                          <span className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-emerald-400' : 'text-slate-500'}`}>Day {targetStreak}</span>
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-700">
                             {isBonusDay ? <Gift className={`w-5 h-5 ${isPast ? 'text-slate-500' : 'text-fuchsia-400'}`} /> : <Coins className={`w-5 h-5 ${isPast ? 'text-slate-500' : 'text-amber-400'}`} />}
                          </div>
                          <span className={`text-xs font-black ${isToday ? 'text-white' : 'text-slate-300'}`}>+{totalRewardForDay}</span>
                       </div>
                    );
                  })}
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
                <Users className="w-8 h-8 text-fuchsia-500" /> Referral Squad
              </h2>
              <p className="text-slate-400 font-medium text-sm">
                Invite teammates. Every 5 verified recruits grants premium rewards and team boosts. Total Recruits: <span className="text-white font-black">{currentRefs}</span>
              </p>
            </div>
            
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-inner">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Cycle Progress</span>
                  <span className="text-xl font-black text-fuchsia-400">{progressInCycle} <span className="text-slate-600 text-sm">/ 5</span></span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden shadow-inner">
                   <div className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full transition-all duration-700 relative" style={{ width: `${progressPct}%` }}>
                     <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                   </div>
                </div>
              </div>

              {myReferralCode ? (
                <div className="bg-slate-900 border border-fuchsia-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Your Invite Code</p>
                    <p className="text-2xl font-mono font-black text-white tracking-widest selection:bg-fuchsia-500/30">
                      {myReferralCode}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleShareCode(myReferralCode)} 
                    className="w-full sm:w-auto bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black py-3 px-6 rounded-xl transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 shrink-0"
                  >
                    <Copy className="w-5 h-5" /> Copy Code
                  </button>
                </div>
              ) : (
                <div className="text-xs text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 p-4 rounded-xl text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> Sync an Athletic.net profile to generate your referral code.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-10 border-t border-slate-800/80 relative z-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8 text-center sm:text-left">Upcoming Milestones</h3>
          <div className="flex flex-col sm:flex-row justify-between relative gap-6 sm:gap-0">
            <div className="absolute top-1/2 -translate-y-1/2 left-8 right-8 h-1 bg-slate-800 hidden sm:block z-0"></div>
            {milestones.map((ms, idx) => {
              const isAchieved = currentRefs >= ms.count;
              const Icon = ms.icon;
              return (
                <div key={`milestone-${idx}`} className="relative z-10 flex flex-row sm:flex-col items-center gap-4 sm:gap-0">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full flex items-center justify-center border-4 border-slate-900 transition-all duration-500 ${isAchieved ? `${ms.bg} text-white shadow-[0_0_30px_rgba(217,70,239,0.4)] scale-110` : 'bg-slate-800 text-slate-600'}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="sm:mt-4 text-left sm:text-center flex-1">
                    <div className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${isAchieved ? ms.color : 'text-slate-500'}`}>
                      {ms.count} Recruits
                    </div>
                    <div className={`text-sm sm:text-sm font-bold mt-0.5 sm:mt-1 ${isAchieved ? 'text-white' : 'text-slate-400'}`}>
                      {ms.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}