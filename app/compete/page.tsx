'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, Lock, Activity, Zap, Medal, Swords, ScrollText, X, ChevronRight, Flame, Trophy, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// 🚨 IMPORT REUSABLE COMPONENTS
import { ChasedCash } from '@/components/ChasedCash';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];
const DISTANCE_EVENTS = ['800', '1500', '1600', 'Mile', '3000', '3200', '5000', '10,000', '5K', '3 Mile'];

// --- MATH HELPERS FOR BOUNTIES ---
const parseMarkToNumber = (mark: string, event: string): number => {
  const cleanMark = mark.replace(/[a-zA-Z*]/g, '').trim();
  if (cleanMark.includes("'")) {
    const parts = cleanMark.split("'");
    const feet = parseFloat(parts[0]) || 0;
    const inches = parseFloat(parts[1]?.replace('"', '')) || 0;
    return ((feet * 12) + inches); 
  }
  if (cleanMark.includes(":")) {
    const parts = cleanMark.split(":");
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return (minutes * 60) + seconds; 
  }
  return parseFloat(cleanMark) || 0;
};

const calculateTargetMark = (baseMark: string, event: string, percentImprovement: number) => {
  const isField = FIELD_EVENTS.includes(event);
  const isDistance = DISTANCE_EVENTS.some(d => event.includes(d));
  const baseNum = parseMarkToNumber(baseMark, event);
  
  if (!baseNum) return '---';

  let targetNum = 0;
  if (isField) {
    targetNum = baseNum * (1 + (percentImprovement / 100));
  } else {
    targetNum = baseNum * (1 - (percentImprovement / 100));
  }

  if (isField) {
    const feet = Math.floor(targetNum / 12);
    const inches = Math.round((targetNum % 12) * 4) / 4; 
    return `${feet}' ${inches}"`;
  } else if (isDistance) {
    const mins = Math.floor(targetNum / 60);
    const secs = (targetNum % 60).toFixed(2).padStart(5, '0'); 
    return `${mins}:${secs}`;
  } else {
    return targetNum.toFixed(2);
  }
};

// Exponential Rewards Array
const BOUNTY_TIERS = [
  { percent: 1, reward: 100, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  { percent: 2, reward: 225, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  { percent: 3, reward: 400, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { percent: 4, reward: 650, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { percent: 5, reward: 1000, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', isMax: true },
];

interface LeaderboardEntry {
  id: string; name: string; eventDisplay: string; oldMark: string; newMark: string;
  improvementValue: number; improvementText: string; border: string | null; avatar: string | null;
  isMe: boolean; prCount: number; rank: number;
}

export default function CompetePage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [userCoins, setUserCoins] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState<'bounties' | 'leaderboard'>('bounties');
  
  // Athlete specific data
  const [athletePrs, setAthletePrs] = useState<any[]>([]);
  const [bountyTargets, setBountyTargets] = useState<any[]>([]); // Independent Bounty Baseline
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  // Action States
  const [selectedBounty, setSelectedBounty] = useState<any | null>(null);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    async function loadCompeteData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: aData } = await supabase
        .from('athletes')
        .select('id, trust_level, coins, prs, base_prs, bounty_targets')
        .eq('id', session.user.id)
        .maybeSingle();

      if (aData) {
        setIsVerified(aData.trust_level > 0);
        setUserCoins(aData.coins || 0);
        setAthleteId(aData.id);
        setAthletePrs(aData.prs || []);
        
        // Fetch active bounty targets, or generate them from current PRs if empty
        let activeBounties = aData.bounty_targets;
        if (!activeBounties || activeBounties.length === 0) {
            activeBounties = aData.base_prs || aData.prs || [];
        }
        setBountyTargets(activeBounties);
      }

      // Leaderboard Math
      const { data: allAthletes } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, avatar_url, equipped_border, prs, base_prs, trust_level')
        .not('base_prs', 'is', null)
        .gt('trust_level', 0);

      if (allAthletes) {
        const processedBoard: Omit<LeaderboardEntry, 'rank'>[] = [];

        for (const ath of allAthletes) {
          let eventImprovements: { event: string; pct: number; oldMark: string; newMark: string }[] = [];

          if (ath.prs && ath.base_prs) {
            ath.prs.forEach((currentRecord: any) => {
              const baseRecord = ath.base_prs.find((b: any) => b.event === currentRecord.event);
              if (baseRecord && baseRecord.mark !== currentRecord.mark) {
                const currentNum = parseMarkToNumber(currentRecord.mark, currentRecord.event);
                const baseNum = parseMarkToNumber(baseRecord.mark, currentRecord.event);
                const isField = FIELD_EVENTS.includes(currentRecord.event);
                let pctImprovement = 0;
                
                if (isField && currentNum > baseNum) pctImprovement = ((currentNum - baseNum) / baseNum) * 100;
                else if (!isField && currentNum < baseNum && currentNum > 0) pctImprovement = ((baseNum - currentNum) / baseNum) * 100;

                if (pctImprovement > 0) {
                  eventImprovements.push({ event: currentRecord.event, pct: pctImprovement, oldMark: baseRecord.mark, newMark: currentRecord.mark });
                }
              }
            });
          }

          if (eventImprovements.length > 0) {
            eventImprovements.sort((a, b) => b.pct - a.pct);
            const topImprovements = eventImprovements.slice(0, 3);
            const totalStackedPct = topImprovements.reduce((sum, item) => sum + item.pct, 0);
            const prCount = topImprovements.length;
            const bestEventData = topImprovements[0];

            processedBoard.push({
              id: ath.id, name: `${ath.first_name} ${ath.last_name}`,
              eventDisplay: prCount > 1 ? `${bestEventData.event} (+${prCount - 1} more)` : bestEventData.event,
              oldMark: bestEventData.oldMark, newMark: bestEventData.newMark,
              improvementValue: totalStackedPct, improvementText: `+${totalStackedPct.toFixed(2)}%`,
              border: ath.equipped_border, avatar: ath.avatar_url,
              isMe: ath.id === session.user.id, prCount: prCount
            });
          }
        }

        const rankedBoard = processedBoard
          .sort((a, b) => b.improvementValue - a.improvementValue)
          .map((p, idx) => ({ ...p, rank: idx + 1 }));

        setLeaderboardData(rankedBoard);
      }
      setLoading(false);
    }
    loadCompeteData();
  }, [supabase, router]);

  // ==========================================
  // 🚨 THE BOUNTY CLAIM FUNCTION
  // ==========================================
  const handleClaimBounty = async (event: string, reward: number, newPRMark: string) => {
    if (!athleteId) return;
    setIsClaiming(event);
    
    try {
        const newCoins = userCoins + reward;
        
        // Overwrite the specific event's target with the new PR
        const newBountyTargets = bountyTargets.map(bt => 
            bt.event === event ? { ...bt, mark: newPRMark } : bt
        );

        const { error } = await supabase.from('athletes').update({
            coins: newCoins,
            bounty_targets: newBountyTargets
        }).eq('id', athleteId);

        if (error) throw error;

        setUserCoins(newCoins);
        setBountyTargets(newBountyTargets);
        showToast(`Bounty Claimed! +${reward} ChasedCash. New targets generated!`, 'success');
    } catch (err: any) {
        showToast(err.message, 'error');
    } finally {
        setIsClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Arena...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32 relative">
      
      {/* IN-APP TOAST */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />}
            <p className="text-sm font-bold leading-tight">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* 🚨 THE BOUNTY DETAILS MODAL */}
      {selectedBounty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setSelectedBounty(null)}></div>
          
          <div className="bg-slate-900 border border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[2rem] w-full max-w-lg relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500"></div>
            
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest mb-3">
                    Active Contract
                  </span>
                  <h2 className="text-3xl font-black text-white tracking-tight">{selectedBounty.event}</h2>
                  <p className="text-slate-400 font-medium text-sm mt-1">Baseline PR: <span className="text-white font-bold">{selectedBounty.mark}</span></p>
                </div>
                <button onClick={() => setSelectedBounty(null)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {BOUNTY_TIERS.map((tier) => {
                  const targetMark = calculateTargetMark(selectedBounty.mark, selectedBounty.event, tier.percent);
                  return (
                    <div key={tier.percent} className={`flex items-center justify-between p-4 rounded-xl border ${tier.bg} ${tier.border} relative overflow-hidden group`}>
                      {tier.isMax && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-2xl rounded-full pointer-events-none"></div>}
                      
                      <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-black ${tier.color}`}>{tier.percent}% Better</span>
                          {tier.isMax && <Flame className="w-4 h-4 text-amber-500" />}
                        </div>
                        <div className="text-white font-medium text-sm flex items-center">
                          Target: <span className="font-black text-lg ml-2 font-mono tracking-tight">{targetMark}</span>
                        </div>
                      </div>

                      <div className="relative z-10 text-right shrink-0 bg-slate-900/50 py-2 px-4 rounded-lg border border-white/5 flex items-center gap-2">
                        <ChasedCash className="w-6 h-5" />
                        <span className="font-black text-xl text-white">{tier.reward}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs text-slate-500 font-medium">Bounties are automatically cleared for claiming when you sync a new PR from the Dashboard that hits these exact targets.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 pt-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black tracking-widest uppercase mb-4 shadow-sm">
              <Zap className="w-4 h-4 mr-2" /> Active Season
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2">Competitions</h1>
            <p className="text-slate-500 font-medium text-lg">Crush your goals to earn massive ChasedCash payouts.</p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between gap-6 md:min-w-[200px] border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Your Bank</p>
              <div className="flex items-center gap-2">
                <ChasedCash className="w-8 h-6" />
                <span className="text-2xl font-black tracking-tight text-slate-900">{userCoins}</span>
              </div>
            </div>
            <Link href="/shop" className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2.5 rounded-xl transition-colors">
              <span className="font-bold text-slate-600 text-xs uppercase">Shop</span>
            </Link>
          </div>
        </div>

        {!isVerified && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-2xl mb-8 flex items-start gap-4">
            <Lock className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <h4 className="text-red-900 font-bold mb-1">Competitions Locked</h4>
              <p className="text-red-700 text-sm font-medium mb-3">You must verify your Athletic.net profile to participate in PR Bounties and Leaderboards.</p>
              <Link href="/dashboard" className="inline-block bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors">
                Verify Now
              </Link>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
          <button onClick={() => setActiveTab('bounties')} className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold whitespace-nowrap transition-all ${activeTab === 'bounties' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            <Target className="w-5 h-5" /> PR Bounties
          </button>
          <button onClick={() => setActiveTab('leaderboard')} className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold whitespace-nowrap transition-all ${activeTab === 'leaderboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'}`}>
            <TrendingUp className="w-5 h-5" /> Most Improved
          </button>
        </div>

        {/* =========================================
            TAB 1: PR BOUNTIES (GAMIFIED & CLAIMABLE)
        ========================================= */}
        {activeTab === 'bounties' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* RPG Style Hero Banner */}
            <div className="bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="w-20 h-20 bg-slate-800/80 border-2 border-slate-600 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(0,0,0,0.5)] transform -rotate-3">
                  <Swords className="w-10 h-10 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl font-black mb-2 tracking-tight">The Bounty Board</h2>
                  <p className="text-slate-300 font-medium text-lg leading-relaxed max-w-2xl">
                    Every event is an active contract. The game sets the targets automatically based on exponential percentage improvements. The harder the PR, the higher the payout.
                  </p>
                </div>
              </div>
            </div>

            {/* RPG Style Contract Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bountyTargets.length > 0 ? bountyTargets.map((bt, idx) => {
                
                // 🚨 CHECK IF BOUNTY IS CLAIMABLE 🚨
                const currentRecord = athletePrs.find(p => p.event === bt.event);
                const currentMark = currentRecord?.mark || bt.mark;
                
                const currentNum = parseMarkToNumber(currentMark, bt.event);
                const baseNum = parseMarkToNumber(bt.mark, bt.event);
                const isField = FIELD_EVENTS.includes(bt.event);
                let pctImprovement = 0;
                
                if (isField && currentNum > baseNum) pctImprovement = ((currentNum - baseNum) / baseNum) * 100;
                else if (!isField && currentNum < baseNum && currentNum > 0) pctImprovement = ((baseNum - currentNum) / baseNum) * 100;

                let achievedTier = null;
                // Check highest tier first
                for (const tier of [...BOUNTY_TIERS].reverse()) {
                    if (pctImprovement >= tier.percent) {
                        achievedTier = tier;
                        break;
                    }
                }

                const isClaimable = achievedTier !== null && isVerified;

                return (
                  <div key={idx} className={`rounded-[2rem] p-1 shadow-xl relative overflow-hidden group transition-all ${
                    isClaimable ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 animate-pulse-slow' : 'bg-slate-900 border border-slate-800 hover:border-slate-600'
                  } ${!isVerified ? 'opacity-60 grayscale-[50%]' : ''}`}>
                    
                    {isClaimable ? (
                      /* 🚨 CLAIMABLE STATE UI 🚨 */
                      <div className="bg-gradient-to-b from-emerald-950 to-slate-900 h-full rounded-[1.8rem] p-6 sm:p-8 flex flex-col relative z-10 shadow-inner">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
                        
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className="flex items-center text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 animate-pulse">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Target Destroyed
                            </span>
                            <h3 className="text-2xl font-black text-white tracking-tight">{bt.event}</h3>
                          </div>
                          <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-500/50">
                            Tier {achievedTier!.percent} Cleared
                          </div>
                        </div>

                        <div className="bg-black/40 rounded-2xl p-4 border border-emerald-500/30 mb-8 shadow-inner flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Old Target</span>
                            <span className="text-xl font-medium text-slate-300 line-through">{bt.mark}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-emerald-500" />
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">New PR!</span>
                            <span className="text-2xl font-black text-emerald-400">{currentMark}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleClaimBounty(bt.event, achievedTier!.reward, currentMark)}
                          disabled={isClaiming === bt.event}
                          className="mt-auto w-full relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-900 py-4 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:-translate-y-1"
                        >
                          <span className="font-black tracking-widest text-sm uppercase flex items-center relative z-10">
                            {isClaiming === bt.event ? (
                              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Claiming...</>
                            ) : (
                              <>Claim {achievedTier!.reward} <ChasedCash className="w-5 h-4 ml-1.5 mr-1" /> Cash</>
                            )}
                          </span>
                        </button>
                      </div>
                    ) : (
                      /* 🔒 NORMAL/PENDING STATE UI 🔒 */
                      <div className="bg-slate-900 h-full rounded-[1.8rem] p-6 sm:p-8 flex flex-col relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <span className="flex items-center text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">
                              <ScrollText className="w-3 h-3 mr-1.5" /> Active Contract
                            </span>
                            <h3 className="text-2xl font-black text-white tracking-tight">{bt.event}</h3>
                          </div>
                          <div className="bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-700">
                            Pending
                          </div>
                        </div>

                        <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800 mb-8 shadow-inner">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Baseline Target</span>
                          <span className="text-3xl font-black text-slate-200 tracking-tight">{bt.mark}</span>
                        </div>

                        <button 
                          onClick={() => setSelectedBounty(bt)}
                          disabled={!isVerified}
                          className="mt-auto w-full group/btn relative overflow-hidden bg-slate-800 hover:bg-slate-700 border border-slate-600 py-4 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                          <span className="font-black tracking-widest text-sm text-slate-300 group-hover/btn:text-white uppercase flex items-center relative z-10">
                            View Bounty Tiers <ChevronRight className="w-4 h-4 ml-1" />
                          </span>
                        </button>
                      </div>
                    )}

                    {!isVerified && <div className="absolute inset-0 z-20" />}
                  </div>
                );
              }) : (
                <div className="col-span-1 md:col-span-2 text-center py-16 bg-white rounded-[2rem] border border-slate-200 border-dashed">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-lg font-black text-slate-900">No events found</h4>
                  <p className="text-sm text-slate-500 font-medium mt-1 max-w-sm mx-auto">Sync your profile on the Dashboard to generate your bounty contracts.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================
            TAB 2: MOST IMPROVED LEADERBOARD
        ========================================= */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* 🚨 LEADERBOARD PAYOUT BANNER 🚨 */}
            <div className="bg-slate-900 rounded-[2rem] p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg tracking-tight">Season End Payouts</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Hold your rank to earn!</p>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center items-center gap-3 relative z-10">
                 <div className="bg-slate-800 border border-yellow-500/50 text-yellow-400 text-sm font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                   1st: 1000 <ChasedCash className="w-5 h-4" />
                 </div>
                 <div className="bg-slate-800 border border-slate-600 text-slate-300 text-sm font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                   2nd: 700 <ChasedCash className="w-5 h-4" />
                 </div>
                 <div className="bg-slate-800 border border-amber-700/50 text-amber-600 text-sm font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                   3rd: 500 <ChasedCash className="w-5 h-4" />
                 </div>
                 <div className="bg-blue-900/50 border border-blue-500/50 text-blue-400 text-sm font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                   Top 50%: 200 <ChasedCash className="w-5 h-4" />
                 </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50">
                <h3 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                  <TrendingUp className="w-7 h-7 text-blue-600" /> Stacked Improvement Rank
                </h3>
                <p className="text-slate-500 font-medium">Ranked by the <strong className="text-slate-700">cumulative total percentage</strong> of improvement across your top 3 events this season. Multi-event athletes get rewarded for improving everywhere!</p>
              </div>

              {leaderboardData.length > 0 ? (
                <div className="flex flex-col divide-y divide-slate-100">
                  {leaderboardData.map((athlete) => {
                    const isTop50 = athlete.rank <= Math.ceil(leaderboardData.length / 2);
                    let reward = 0;
                    if (athlete.rank === 1) reward = 1000;
                    else if (athlete.rank === 2) reward = 700;
                    else if (athlete.rank === 3) reward = 500;
                    else if (isTop50) reward = 200;

                    return (
                      <div key={athlete.id} className={`p-4 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors hover:bg-slate-50 ${athlete.isMe ? 'bg-blue-50/50' : ''}`}>
                        
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-8 shrink-0 text-center">
                            <span className={`font-black text-lg ${athlete.rank === 1 ? 'text-yellow-500' : athlete.rank === 2 ? 'text-slate-400' : athlete.rank === 3 ? 'text-amber-600' : 'text-slate-300'}`}>
                              #{athlete.rank}
                            </span>
                          </div>

                          <Link href={`/athlete/${athlete.id}`} className="shrink-0 hover:scale-105 transition-transform z-10">
                            <AvatarWithBorder avatarUrl={athlete.avatar} borderId={athlete.border} sizeClasses="w-12 h-12" />
                          </Link>

                          <div className="flex-1 min-w-0">
                            <Link href={`/athlete/${athlete.id}`} className="hover:text-blue-600 transition-colors">
                              <h4 className="font-bold text-slate-900 truncate text-base">{athlete.name}</h4>
                            </Link>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">{athlete.eventDisplay}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end sm:text-right w-full sm:w-auto mt-2 sm:mt-0 pl-12 sm:pl-0 gap-6">
                          <div className="flex flex-col sm:items-end">
                            <div className="inline-flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-lg font-black text-sm mb-1 shadow-sm border border-green-200">
                              {athlete.improvementText}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400">
                              {athlete.prCount === 1 ? (
                                <><span className="line-through">{athlete.oldMark}</span> <span className="mx-1">→</span> <span className="text-slate-700">{athlete.newMark}</span></>
                              ) : (
                                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">Top {athlete.prCount} PRs Stacked</span>
                              )}
                            </p>
                          </div>

                          {reward > 0 && (
                            <div className="inline-flex items-center justify-center gap-1.5 bg-slate-900 px-3 py-2 rounded-xl shadow-md border border-slate-800 shrink-0">
                              <div className="flex flex-col items-start">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Projected</span>
                                <span className="text-sm font-black text-green-400 leading-none">+{reward}</span>
                              </div>
                              <ChasedCash className="w-5 h-4 ml-1" />
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 font-medium">
                  <Medal className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-lg font-black text-slate-900">The Season Just Started!</h4>
                  <p className="text-sm mt-1">No stacked PRs have been recorded yet. Be the first to sync an improved mark!</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}