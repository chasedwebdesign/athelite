'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, Crosshair, Crown, Lock, Activity, Zap, Medal, Swords, ScrollText, X, ChevronRight, Flame, Trophy, CheckCircle2, RefreshCw, AlertCircle, Search, MapPin, Skull, Gift, Share2, ShieldCheck, School } from 'lucide-react';
import Link from 'next/link';

// 🚨 IMPORT REUSABLE COMPONENTS
import { ChasedCash } from '@/components/ChasedCash';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];
const DISTANCE_EVENTS = ['800', '1500', '1600', 'Mile', '3000', '3200', '5000', '10,000', '5K', '3 Mile'];

// --- MATH HELPERS ---
const parseMarkToNumber = (mark: string, event: string): number => {
  if (!mark) return 0;
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

const formatDelta = (delta: number, isField: boolean): string => {
  if (isField) {
    const absDelta = Math.abs(delta);
    const feet = Math.floor(absDelta / 12);
    const inches = absDelta % 12;
    if (feet > 0) return `${feet}' ${inches.toFixed(1).replace(/\.0$/, '')}"`;
    return `${inches.toFixed(1).replace(/\.0$/, '')}"`;
  } else {
    return `${Math.abs(delta).toFixed(2)}s`;
  }
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

const BOUNTY_TIERS = [
  { percent: 1, reward: 100, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  { percent: 2, reward: 225, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  { percent: 3, reward: 400, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { percent: 4, reward: 650, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { percent: 5, reward: 1000, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', isMax: true },
];

const RECRUITING_STANDARDS: Record<string, Record<string, { t1: number, t2: number, t3: number, t4: number, t5: number, t6: number, t7: number, isField?: boolean }>> = {
  'Boys': {
    '60 Meters': { t1: 6.75, t2: 6.90, t3: 7.05, t4: 7.20, t5: 7.40, t6: 7.60, t7: 8.00 },
    '100 Meters': { t1: 10.5, t2: 10.8, t3: 11.0, t4: 11.3, t5: 11.6, t6: 11.9, t7: 12.6 },
    '200 Meters': { t1: 21.2, t2: 21.8, t3: 22.2, t4: 22.8, t5: 23.5, t6: 24.5, t7: 26.0 },
    '400 Meters': { t1: 47.5, t2: 49.0, t3: 50.0, t4: 51.5, t5: 53.0, t6: 55.0, t7: 58.0 },
    '800 Meters': { t1: 112, t2: 115, t3: 117, t4: 120, t5: 125, t6: 130, t7: 140 }, 
    '1500 Meters': { t1: 231, t2: 239, t3: 244, t4: 250, t5: 264, t6: 275, t7: 300 },
    '1600 Meters': { t1: 250, t2: 258, t3: 264, t4: 270, t5: 285, t6: 295, t7: 320 }, 
    '3000 Meters': { t1: 500, t2: 518, t3: 532, t4: 546, t5: 574, t6: 600, t7: 660 },
    '3200 Meters': { t1: 540, t2: 560, t3: 575, t4: 590, t5: 620, t6: 650, t7: 720 }, 
    '110m Hurdles': { t1: 13.8, t2: 14.2, t3: 14.6, t4: 15.0, t5: 15.5, t6: 16.5, t7: 18.5 },
    '200m Hurdles': { t1: 24.5, t2: 25.5, t3: 26.5, t4: 27.5, t5: 29.0, t6: 30.5, t7: 33.0 },
    '300m Hurdles': { t1: 37.0, t2: 38.5, t3: 39.5, t4: 41.0, t5: 42.5, t6: 44.5, t7: 48.0 },
    '400m Hurdles': { t1: 52.0, t2: 54.0, t3: 56.0, t4: 58.0, t5: 60.0, t6: 63.0, t7: 68.0 },
    'Long Jump': { t1: 288, t2: 270, t3: 260, t4: 252, t5: 240, t6: 228, t7: 204, isField: true }, 
    'Triple Jump': { t1: 588, t2: 564, t3: 540, t4: 516, t5: 492, t6: 468, t7: 420, isField: true }, 
    'High Jump': { t1: 82, t2: 78, t3: 76, t4: 74, t5: 70, t6: 66, t7: 60, isField: true }, 
    'Pole Vault': { t1: 198, t2: 186, t3: 174, t4: 162, t5: 150, t6: 132, t7: 108, isField: true },
    'Shot Put': { t1: 720, t2: 660, t3: 600, t4: 540, t5: 480, t6: 444, t7: 360, isField: true }, 
    'Discus': { t1: 2220, t2: 2040, t3: 1860, t4: 1740, t5: 1620, t6: 1440, t7: 1080, isField: true },
    'Javelin': { t1: 2340, t2: 2160, t3: 2040, t4: 1920, t5: 1800, t6: 1620, t7: 1200, isField: true },
    'Hammer': { t1: 2400, t2: 2160, t3: 1920, t4: 1740, t5: 1560, t6: 1320, t7: 960, isField: true }
  },
  'Girls': {
    '60 Meters': { t1: 7.45, t2: 7.65, t3: 7.85, t4: 8.05, t5: 8.30, t6: 8.60, t7: 9.20 },
    '100 Meters': { t1: 11.7, t2: 12.1, t3: 12.4, t4: 12.8, t5: 13.2, t6: 13.6, t7: 14.5 },
    '200 Meters': { t1: 24.2, t2: 24.8, t3: 25.5, t4: 26.2, t5: 27.0, t6: 28.5, t7: 31.0 },
    '400 Meters': { t1: 54.5, t2: 57.0, t3: 58.5, t4: 60.5, t5: 63.0, t6: 66.0, t7: 72.0 },
    '800 Meters': { t1: 130, t2: 135, t3: 140, t4: 145, t5: 152, t6: 160, t7: 175 }, 
    '1500 Meters': { t1: 268, t2: 282, t3: 291, t4: 300, t5: 314, t6: 330, t7: 375 },
    '1600 Meters': { t1: 290, t2: 305, t3: 315, t4: 325, t5: 340, t6: 360, t7: 400 }, 
    '3000 Meters': { t1: 583, t2: 611, t3: 638, t4: 666, t5: 694, t6: 730, t7: 840 },
    '3200 Meters': { t1: 630, t2: 660, t3: 690, t4: 720, t5: 750, t6: 800, t7: 900 }, 
    '100m Hurdles': { t1: 13.8, t2: 14.3, t3: 14.8, t4: 15.5, t5: 16.5, t6: 17.8, t7: 20.0 },
    '200m Hurdles': { t1: 28.0, t2: 29.0, t3: 30.5, t4: 32.0, t5: 34.0, t6: 36.0, t7: 40.0 },
    '300m Hurdles': { t1: 42.5, t2: 44.5, t3: 46.5, t4: 48.5, t5: 51.0, t6: 54.0, t7: 59.0 },
    '400m Hurdles': { t1: 60.0, t2: 63.0, t3: 66.0, t4: 69.0, t5: 72.0, t6: 76.0, t7: 85.0 },
    'Long Jump': { t1: 234, t2: 222, t3: 210, t4: 198, t5: 186, t6: 174, t7: 150, isField: true }, 
    'Triple Jump': { t1: 480, t2: 456, t3: 432, t4: 408, t5: 384, t6: 360, t7: 312, isField: true },
    'High Jump': { t1: 68, t2: 64, t3: 62, t4: 60, t5: 58, t6: 54, t7: 50, isField: true }, 
    'Pole Vault': { t1: 156, t2: 144, t3: 132, t4: 120, t5: 108, t6: 90, t7: 72, isField: true },
    'Shot Put': { t1: 540, t2: 480, t3: 432, t4: 396, t5: 360, t6: 324, t7: 264, isField: true }, 
    'Discus': { t1: 1800, t2: 1620, t3: 1500, t4: 1380, t5: 1260, t6: 1080, t7: 840, isField: true },
    'Javelin': { t1: 1740, t2: 1560, t3: 1440, t4: 1320, t5: 1200, t6: 1020, t7: 780, isField: true },
    'Hammer': { t1: 1920, t2: 1680, t3: 1500, t4: 1320, t5: 1140, t6: 960, t7: 720, isField: true }
  }
};

// 🚨 FIXED PARSEMARKTONUMBER ARGUMENT
const getEventScore = (markStr: string, event: string, gender: string): number => {
  const standards = RECRUITING_STANDARDS[gender] || RECRUITING_STANDARDS['Boys'];
  
  const normalizedEvent = event
    .replace(/Meter\b/i, 'Meters')
    .replace('100 Meter Hurdles', '100m Hurdles')
    .replace('110 Meter Hurdles', '110m Hurdles')
    .replace('200 Meter Hurdles', '200m Hurdles')
    .replace('300 Meter Hurdles', '300m Hurdles')
    .replace('400 Meter Hurdles', '400m Hurdles');

  const eventStds = standards[normalizedEvent] || standards[event];
  if (!eventStds) return 5;

  const val = parseMarkToNumber(markStr, event);
  
  let score = 5;
  if (eventStds.isField) {
    if (val >= eventStds.t1) score = 95 + Math.min(4, ((val - eventStds.t1) / (eventStds.t1 * 0.05)) * 4);
    else if (val >= eventStds.t2) score = 85 + ((val - eventStds.t2) / (eventStds.t1 - eventStds.t2)) * 10;
    else if (val >= eventStds.t3) score = 75 + ((val - eventStds.t3) / (eventStds.t2 - eventStds.t3)) * 10;
    else if (val >= eventStds.t4) score = 65 + ((val - eventStds.t4) / (eventStds.t3 - eventStds.t4)) * 10;
    else if (val >= eventStds.t5) score = 55 + ((val - eventStds.t5) / (eventStds.t4 - eventStds.t5)) * 10;
    else if (val >= eventStds.t6) score = 40 + ((val - eventStds.t6) / (eventStds.t5 - eventStds.t6)) * 14;
    else if (val >= eventStds.t7) score = 20 + ((val - eventStds.t7) / (eventStds.t6 - eventStds.t7)) * 19;
    else { const t8 = eventStds.t7 * 0.85; if (val >= t8) { score = 5 + ((val - t8) / (eventStds.t7 - t8)) * 14; } else { score = 5; } }
  } else {
    if (val <= eventStds.t1) score = 95 + Math.min(4, ((eventStds.t1 - val) / (eventStds.t1 * 0.05)) * 4);
    else if (val <= eventStds.t2) score = 85 + ((eventStds.t2 - val) / (eventStds.t2 - eventStds.t1)) * 10;
    else if (val <= eventStds.t3) score = 75 + ((eventStds.t3 - val) / (eventStds.t3 - eventStds.t2)) * 10;
    else if (val <= eventStds.t4) score = 65 + ((eventStds.t4 - val) / (eventStds.t4 - eventStds.t3)) * 10;
    else if (val <= eventStds.t5) score = 55 + ((eventStds.t5 - val) / (eventStds.t5 - eventStds.t4)) * 10;
    else if (val <= eventStds.t6) score = 40 + ((eventStds.t6 - val) / (eventStds.t6 - eventStds.t5)) * 14;
    else if (val <= eventStds.t7) score = 20 + ((eventStds.t7 - val) / (eventStds.t7 - eventStds.t6)) * 19;
    else { const t8 = eventStds.t7 * 1.15; if (val <= t8) { score = 5 + ((t8 - val) / (t8 - eventStds.t7)) * 14; } else { score = 5; } }
  }
  return Math.min(99, Math.max(5, Math.round(score)));
};

interface LeaderboardEntry {
  id: string; name: string; high_school: string; eventDisplay: string; oldMark: string; newMark: string;
  improvementValue: number; improvementText: string; border: string | null; avatar: string | null;
  isMe: boolean; prCount: number; rank: number;
}

interface TeamEntry {
  name: string;
  score: number;
  athletes: number;
  rank: number;
}

interface PR { event: string; mark: string; }

interface AthleteProfile {
  id: string; first_name: string; last_name: string; high_school: string; state: string;
  avatar_url: string | null; equipped_border: string | null; prs: PR[] | null; rival_ids: string[] | null;
  trust_level: number; coins: number; athletic_net_url: string | null; created_at: string;
  referred_by: string | null; verified_referrals: number; unlocked_borders: string[] | null;
  gender: string | null;
}

export default function CompetePage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [userCoins, setUserCoins] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState<'bounties' | 'leaderboard' | 'rivals' | 'teams'>('bounties');
  
  const [currentUser, setCurrentUser] = useState<AthleteProfile | null>(null);
  const [athletePrs, setAthletePrs] = useState<any[]>([]);
  const [bountyTargets, setBountyTargets] = useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamEntry[]>([]);
  
  const [activeRivals, setActiveRivals] = useState<AthleteProfile[]>([]);
  const [recommendedRivals, setRecommendedRivals] = useState<AthleteProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AthleteProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

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

      try {
        const { data: aData, error } = await supabase
          .from('athletes')
          .select('id, first_name, last_name, high_school, state, gender, avatar_url, equipped_border, trust_level, coins, prs, base_prs, bounty_targets, rival_ids, athletic_net_url, created_at, referred_by, verified_referrals, unlocked_borders')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (aData) {
          setIsVerified(aData.trust_level > 0);
          setUserCoins(aData.coins || 0);
          setAthleteId(aData.id);
          setAthletePrs(aData.prs || []);
          setCurrentUser(aData as AthleteProfile);
          
          const refCode = aData.athletic_net_url?.match(/athlete\/(\d+)/i)?.[1] || null;
          setMyReferralCode(refCode);
          
          if (aData.created_at) {
            const diffTime = Math.abs(new Date().getTime() - new Date(aData.created_at).getTime());
            const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            setShowCodeEntry(days <= 7 && !aData.referred_by);
          }
          
          let activeBounties = aData.bounty_targets || [];
          setBountyTargets(activeBounties);

          if (aData.rival_ids && aData.rival_ids.length > 0) {
            const { data: rData } = await supabase
              .from('athletes')
              .select('id, first_name, last_name, high_school, state, gender, avatar_url, equipped_border, prs')
              .in('id', aData.rival_ids);
            if (rData) setActiveRivals(rData as AthleteProfile[]);
          }

          if (aData.state && aData.prs && aData.prs.length > 0) {
            const topEvent = aData.prs[0];
            const myVal = parseMarkToNumber(topEvent.mark, topEvent.event);
            const isField = FIELD_EVENTS.includes(topEvent.event);

            const { data: recs } = await supabase
              .from('athletes')
              .select('id, first_name, last_name, high_school, state, gender, avatar_url, equipped_border, prs')
              .eq('state', aData.state)
              .eq('gender', aData.gender)
              .neq('id', aData.id)
              .limit(15);
            
            if (recs) {
               const validRecs = recs.filter(r => {
                 if (aData.rival_ids?.includes(r.id)) return false;
                 const matchPr = r.prs?.find((p: any) => p.event === topEvent.event);
                 if (!matchPr) return false;
                 const rVal = parseMarkToNumber(matchPr.mark, topEvent.event);
                 return isField ? rVal > myVal : rVal < myVal && rVal > 0;
               });
               setRecommendedRivals(validRecs.slice(0, 3) as AthleteProfile[]);
            }
          }
        }
      } catch (err: any) {
        console.error("Error loading user data:", err.message);
      }

      // Leaderboard & Team Battle Math
      const { data: allAthletes } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, high_school, avatar_url, equipped_border, prs, base_prs, trust_level')
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
              id: ath.id, name: `${ath.first_name} ${ath.last_name}`, high_school: ath.high_school || 'Unknown School',
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

        // 🚨 PROCESS TEAM STANDINGS 🚨
        const teamsMap: Record<string, { name: string; score: number; athletes: number }> = {};
        
        rankedBoard.forEach(ath => {
          const hs = ath.high_school;
          if (!teamsMap[hs]) teamsMap[hs] = { name: hs, score: 0, athletes: 0 };
          teamsMap[hs].score += ath.improvementValue;
          teamsMap[hs].athletes += 1;
        });

        const rankedTeams = Object.values(teamsMap)
          .sort((a, b) => b.score - a.score)
          .map((t, idx) => ({ ...t, rank: idx + 1 }));
          
        setTeamLeaderboard(rankedTeams);
      }
      setLoading(false);
    }
    loadCompeteData();
  }, [supabase, router]);

  const handleClaimBounty = async (event: string, reward: number, newPRMark: string) => {
    if (!athleteId) return;
    setIsClaiming(event);
    
    try {
        const newCoins = userCoins + reward;
        const newBountyTargets = bountyTargets.map(bt => bt.event === event ? { ...bt, mark: newPRMark } : bt);

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

  const handleClaimOvertake = async (event: string, reward: number, rivalId: string) => {
    if (!athleteId) return;
    setIsClaiming(event + '_overtake');
    
    try {
        const newCoins = userCoins + reward;
        
        const updatedBounties = bountyTargets.map(bt => {
           if (bt.type === 'rival_hunt' && bt.rivalId === rivalId && bt.event === event) {
               return { ...bt, status: 'claimed' };
           }
           return bt;
        });

        const { error } = await supabase.from('athletes').update({ 
          coins: newCoins,
          bounty_targets: updatedBounties 
        }).eq('id', athleteId);

        if (error) throw error;

        setUserCoins(newCoins);
        setBountyTargets(updatedBounties);
        showToast(`Target Overtaken! +${reward} ChasedCash!`, 'success');
    } catch (err: any) {
        showToast(err.message, 'error');
    } finally {
        setIsClaiming(null);
    }
  };

  const handleShareCode = async (code: string) => {
    const shareText = `Join me on ChasedSports! Use my invite code: ${code}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'ChasedSports Invite', text: shareText }); } catch (err) {}
    } else {
      await navigator.clipboard.writeText(shareText);
      showToast("Invite code copied to clipboard!", "success");
    }
  };

  const handleSubmitInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !inviteCodeInput.trim()) return;
    setIsSubmittingCode(true);
    try {
        const { data: referrer } = await supabase.from('athletes').select('id, coins, verified_referrals, unlocked_borders').ilike('athletic_net_url', `%athlete/${inviteCodeInput.trim()}/%`).maybeSingle();
        if (!referrer || referrer.id === currentUser.id) throw new Error("Invalid invite code.");
        await supabase.from('athletes').update({ referred_by: referrer.id }).eq('id', currentUser.id);
        
        if (currentUser.trust_level > 0) {
            const newCoins = (referrer.coins || 0) + 300; 
            const newReferralCount = (referrer.verified_referrals || 0) + 1; 
            let newUnlocked = referrer.unlocked_borders || ['none'];
            if (newReferralCount >= 5 && !newUnlocked.includes('plasma-surge')) newUnlocked = [...newUnlocked, 'plasma-surge'];
            await supabase.from('athletes').update({ coins: newCoins, verified_referrals: newReferralCount, unlocked_borders: newUnlocked }).eq('id', referrer.id);
        }
        setCurrentUser({ ...currentUser, referred_by: referrer.id });
        setShowCodeEntry(false);
        showToast("Invite code applied successfully!", "success");
        setInviteCodeInput('');
    } catch (err: any) { showToast(err.message, "error"); } finally { setIsSubmittingCode(false); }
  };

  const handleSearchRivals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const { data } = await supabase
      .from('athletes')
      .select('id, first_name, last_name, high_school, state, avatar_url, equipped_border, prs, trust_level')
      .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,high_school.ilike.%${searchQuery}%`)
      .neq('id', currentUser?.id)
      .limit(10);

    const filtered = (data || []).filter(a => !activeRivals.some(ar => ar.id === a.id));
    setSearchResults(filtered as AthleteProfile[]);
    setIsSearching(false);
  };

  const handleAddRival = async (newRival: AthleteProfile) => {
    if (!currentUser) return;
    if (activeRivals.length >= 5) {
      showToast('You can only have 5 active rivals at a time.', 'error');
      return;
    }

    try {
      const updatedRivalIds = [...(currentUser.rival_ids || []), newRival.id];
      
      let newContracts: any[] = [];
      currentUser.prs?.forEach(myPr => {
        const rivalPr = newRival.prs?.find(p => p.event === myPr.event);
        if (rivalPr) {
          const isField = FIELD_EVENTS.includes(myPr.event);
          const myVal = parseMarkToNumber(myPr.mark, myPr.event);
          const rVal = parseMarkToNumber(rivalPr.mark, myPr.event);
          const amIWinning = isField ? myVal > rVal : myVal < rVal && myVal > 0;
          
          if (!amIWinning) {
            newContracts.push({
              type: 'rival_hunt',
              rivalId: newRival.id,
              event: myPr.event,
              status: 'active'
            });
          }
        }
      });

      const updatedBounties = [...bountyTargets, ...newContracts];

      const { error } = await supabase.from('athletes').update({ 
        rival_ids: updatedRivalIds,
        bounty_targets: updatedBounties
      }).eq('id', currentUser.id);

      if (error) throw error;
      
      setActiveRivals([...activeRivals, newRival]);
      setCurrentUser({ ...currentUser, rival_ids: updatedRivalIds });
      setBountyTargets(updatedBounties);
      setSearchQuery('');
      setSearchResults([]);
      setRecommendedRivals(recommendedRivals.filter(r => r.id !== newRival.id));
      showToast(`${newRival.first_name} added to your Tracking List.`, 'success');
      
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRemoveRival = async (rivalId: string) => {
    if (!currentUser) return;
    try {
      const updatedRivalIds = (currentUser.rival_ids || []).filter(id => id !== rivalId);
      const updatedBounties = bountyTargets.filter(bt => !(bt.type === 'rival_hunt' && bt.rivalId === rivalId));

      await supabase.from('athletes').update({ 
        rival_ids: updatedRivalIds,
        bounty_targets: updatedBounties
      }).eq('id', currentUser.id);

      setActiveRivals(activeRivals.filter(r => r.id !== rivalId));
      setCurrentUser({ ...currentUser, rival_ids: updatedRivalIds });
      setBountyTargets(updatedBounties);
      showToast("Rival dropped.", "success");
    } catch (err: any) {
      showToast(err.message, 'error');
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

  const standardBounties = bountyTargets.filter(bt => !bt.type);

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
              <p className="text-red-700 text-sm font-medium mb-3">You must verify your Athletic.net profile to participate in PR Bounties, Leaderboards, and Head-to-Head matchups.</p>
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
          <button onClick={() => setActiveTab('teams')} className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold whitespace-nowrap transition-all ${activeTab === 'teams' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'}`}>
            <ShieldCheck className="w-5 h-5" /> Team Battle
          </button>
          <button onClick={() => setActiveTab('rivals')} className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold whitespace-nowrap transition-all ${activeTab === 'rivals' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200'}`}>
            <Swords className="w-5 h-5" /> Rivals ({activeRivals.length}/5)
          </button>
        </div>

        {/* =========================================
            TAB 1: PR BOUNTIES 
        ========================================= */}
        {activeTab === 'bounties' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="w-20 h-20 bg-slate-800/80 border-2 border-slate-600 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(0,0,0,0.5)] transform -rotate-3">
                  <Target className="w-10 h-10 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl font-black mb-2 tracking-tight">The Bounty Board</h2>
                  <p className="text-slate-300 font-medium text-lg leading-relaxed max-w-2xl">
                    Every event is an active contract. The game sets the targets automatically based on exponential percentage improvements. The harder the PR, the higher the payout.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {standardBounties.length > 0 ? standardBounties.map((bt, idx) => {
                const currentRecord = athletePrs.find(p => p.event === bt.event);
                const currentMark = currentRecord?.mark || bt.mark;
                
                const currentNum = parseMarkToNumber(currentMark, bt.event);
                const baseNum = parseMarkToNumber(bt.mark, bt.event);
                const isField = FIELD_EVENTS.includes(bt.event);
                let pctImprovement = 0;
                
                if (isField && currentNum > baseNum) pctImprovement = ((currentNum - baseNum) / baseNum) * 100;
                else if (!isField && currentNum < baseNum && currentNum > 0) pctImprovement = ((baseNum - currentNum) / baseNum) * 100;

                let achievedTier = null;
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
            
            <div className="bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="w-20 h-20 bg-slate-800/80 border-2 border-slate-600 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(0,0,0,0.5)] transform -rotate-3">
                  <TrendingUp className="w-10 h-10 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl font-black mb-2 tracking-tight">Weekly Improvement</h2>
                  <p className="text-slate-300 font-medium text-lg leading-relaxed max-w-2xl">
                    Ranked by your cumulative percentage improvement across your top 3 events this week. Hold your rank by Sunday night to earn the payout!
                  </p>
                </div>
              </div>
              
              <div className="mt-8 flex flex-wrap justify-center md:justify-start items-center gap-3 relative z-10">
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
                  <Trophy className="w-7 h-7 text-blue-600" /> Stacked Improvement Rank
                </h3>
                <p className="text-slate-500 font-medium">Multi-event athletes get rewarded for improving everywhere!</p>
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
                            <AvatarWithBorder avatarUrl={athlete.avatar ?? null} borderId={athlete.border ?? null} sizeClasses="w-12 h-12" />
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

        {/* =========================================
            TAB 3: TEAM BATTLE 🚨
        ========================================= */}
        {activeTab === 'teams' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/20 blur-[80px] rounded-full pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="w-20 h-20 bg-slate-800/80 border-2 border-slate-600 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(0,0,0,0.5)] transform rotate-3">
                  <ShieldCheck className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl font-black mb-2 tracking-tight">High School Clash</h2>
                  <p className="text-slate-300 font-medium text-lg leading-relaxed max-w-2xl">
                    Represent <strong className="text-emerald-400">{currentUser?.high_school || 'your school'}</strong>. Your individual percentage improvements are added to your school's total score. Dominate the state.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <School className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-900">Team Standings</h3>
                   <p className="text-slate-500 font-medium text-sm">Combined percentage improvements from all verified athletes.</p>
                </div>
              </div>
              
              {teamLeaderboard.length > 0 ? (
                <div className="flex flex-col divide-y divide-slate-100">
                  {teamLeaderboard.map((team) => (
                    <div key={team.name} className={`p-4 md:p-6 flex items-center justify-between transition-colors hover:bg-slate-50 ${team.name === currentUser?.high_school ? 'bg-emerald-50/50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-8 shrink-0 text-center">
                          <span className={`font-black text-lg ${team.rank === 1 ? 'text-yellow-500' : team.rank === 2 ? 'text-slate-400' : team.rank === 3 ? 'text-amber-600' : 'text-slate-300'}`}>
                            #{team.rank}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">{team.name}</h4>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{team.athletes} Active Athlete{team.athletes > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-black text-lg shadow-sm border border-emerald-200">
                          +{team.score.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                 <div className="p-12 text-center text-slate-500 font-medium">
                   <School className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                   <h4 className="text-lg font-black text-slate-900">No Teams Found</h4>
                   <p className="text-sm mt-1">Get your teammates to sign up and log PRs to put your school on the map!</p>
                 </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================
            TAB 4: THE RIVALS ARENA 🚨
        ========================================= */}
        {activeTab === 'rivals' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            
            <div className="bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-slate-800 mb-6">
              <div className="absolute top-0 left-0 w-96 h-96 bg-red-500/20 blur-[100px] rounded-full pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="w-20 h-20 bg-slate-800/80 border-2 border-slate-600 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(0,0,0,0.5)] transform rotate-3">
                  <Swords className="w-10 h-10 text-red-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl font-black mb-2 tracking-tight">The Rivals Arena</h2>
                  <p className="text-slate-300 font-medium text-lg leading-relaxed max-w-2xl">
                    Target athletes who are faster than you to earn dynamic ChasedCash payouts, or track your friends and local competitors just for fun to assert your dominance.
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIVE RIVALS LIST */}
            {activeRivals.length > 0 && (
              <div className="space-y-6 mb-8">
                {activeRivals.map(r => {
                  const shared = currentUser?.prs?.filter(myPr => r.prs?.some(rPr => rPr.event === myPr.event)) || [];
                  const isHunting = bountyTargets.some(bt => bt.type === 'rival_hunt' && bt.rivalId === r.id && bt.status === 'active');
                  
                  return (
                    <div key={r.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                      
                      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 bg-slate-50 relative z-10">
                        <div className="flex items-center gap-4">
                          <AvatarWithBorder avatarUrl={r.avatar_url ?? null} borderId={r.equipped_border ?? null} sizeClasses="w-16 h-16 shadow-md" />
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{r.first_name} {r.last_name}</h3>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest"><MapPin className="w-3 h-3 inline mr-1 -mt-0.5" /> {r.high_school}</p>
                              <span className="text-slate-300">•</span>
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${isHunting ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                {isHunting ? '🎯 Active Target' : '👀 Tracking'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveRival(r.id)} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow-md shrink-0">
                          Drop Target <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-6 md:p-8 relative z-10">
                        {shared.length === 0 ? (
                           <div className="text-center py-6">
                             <p className="text-slate-500 font-medium">No shared events. They need to sync their PRs.</p>
                           </div>
                        ) : (
                          <div className="space-y-4">
                            {shared.map((myPr, idx) => {
                              const rivalPr = r.prs?.find(p => p.event === myPr.event);
                              if (!rivalPr) return null;

                              const isField = FIELD_EVENTS.includes(myPr.event);
                              const myVal = parseMarkToNumber(myPr.mark, myPr.event);
                              const rivalVal = parseMarkToNumber(rivalPr.mark, myPr.event);
                              
                              let amIWinning = false;
                              if (isField) amIWinning = myVal > rivalVal;
                              else amIWinning = myVal < rivalVal && myVal > 0;

                              const isTied = myVal === rivalVal;
                              const delta = myVal - rivalVal;
                              const formattedDelta = formatDelta(delta, isField);

                              const hasClaimed = bountyTargets.some(bt => bt.type === 'rival_claim' && bt.rivalId === r.id && bt.event === myPr.event);
                              const hasActiveHunt = bountyTargets.some(bt => bt.type === 'rival_hunt' && bt.rivalId === r.id && bt.event === myPr.event && bt.status === 'active');

                              const rivalScore = getEventScore(rivalPr.mark, myPr.event, r.gender || 'Boys');
                              const dynamicReward = 100 + Math.floor((rivalScore - 40) * 15);

                              return (
                                <div key={idx} className={`bg-slate-50 border rounded-[1.5rem] p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${amIWinning && hasActiveHunt ? 'border-emerald-300 shadow-lg shadow-emerald-500/10' : 'border-slate-200'}`}>
                                  
                                  <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className={`p-3 rounded-2xl shadow-sm border shrink-0 ${amIWinning ? 'bg-blue-100 text-blue-600 border-blue-200' : isTied ? 'bg-slate-200 text-slate-600 border-slate-300' : 'bg-red-100 text-red-600 border-red-200'}`}>
                                      <Trophy className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{myPr.event}</p>
                                      <h4 className={`text-lg font-black ${amIWinning ? 'text-blue-700' : isTied ? 'text-slate-700' : 'text-red-700'}`}>
                                        {amIWinning ? 'You are leading' : isTied ? 'Dead Tie' : `${r.first_name} is leading`}
                                      </h4>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto mx-auto">
                                    <div className="text-center w-20 sm:w-24">
                                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">You</span>
                                      <span className={`font-black text-xl tracking-tight ${amIWinning ? 'text-blue-600' : 'text-slate-700'}`}>{myPr.mark}</span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200"></div>
                                    <div className="text-center w-20 sm:w-24 relative group cursor-help">
                                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">{r.first_name}</span>
                                      <span className={`font-black text-xl tracking-tight ${!amIWinning && !isTied ? 'text-red-600' : 'text-slate-700'}`}>{rivalPr.mark}</span>
                                      
                                      <div className="absolute -top-3 -right-3 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                        SCORE: {rivalScore}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-2 w-full md:w-44 shrink-0">
                                    {!isTied ? (
                                      <div className={`text-right w-full flex items-center justify-between md:block ${amIWinning ? 'text-blue-600' : 'text-red-600'}`}>
                                        <span className="md:block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-0.5">Difference</span>
                                        <span className="font-black text-2xl tracking-tighter">{amIWinning ? '+' : '-'}{formattedDelta}</span>
                                      </div>
                                    ) : (
                                      <div className="text-right text-slate-400 w-full flex items-center justify-between md:block">
                                        <span className="md:block text-[10px] font-bold uppercase tracking-widest mb-0.5">Difference</span>
                                        <span className="font-black text-2xl tracking-tighter">0.00</span>
                                      </div>
                                    )}
                                    
                                    <div className="w-full mt-2">
                                      {hasClaimed ? (
                                        <div className="w-full bg-slate-200 text-slate-400 font-black text-[10px] px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 border border-slate-300">
                                          <CheckCircle2 className="w-3.5 h-3.5" /> Defeated
                                        </div>
                                      ) : amIWinning && hasActiveHunt ? (
                                        <button 
                                          onClick={() => handleClaimOvertake(myPr.event, dynamicReward, r.id)}
                                          disabled={isClaiming === myPr.event + '_overtake'}
                                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5 hover:scale-105 disabled:opacity-50 animate-pulse-slow"
                                        >
                                          {isClaiming === myPr.event + '_overtake' ? (
                                            <><RefreshCw className="w-3 h-3 animate-spin" /> Claiming...</>
                                          ) : (
                                            <>Claim {dynamicReward} <ChasedCash className="w-4 h-3.5" /> Bounty</>
                                          )}
                                        </button>
                                      ) : hasActiveHunt ? (
                                        <div className="w-full bg-slate-900 text-slate-400 font-bold text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg flex items-center justify-center border border-slate-700">
                                          Beat to earn {dynamicReward} Cash
                                        </div>
                                      ) : (
                                        <div className="w-full bg-blue-50 text-blue-600 font-bold text-[10px] uppercase tracking-widest px-3 py-2 rounded-lg flex items-center justify-center border border-blue-200">
                                          <Crown className="w-3 h-3 mr-1" /> Dominating
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* SEARCH AND ADD MORE RIVALS */}
            {activeRivals.length < 5 && (
              <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-sm">
                      <Crosshair className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Acquire a Target</h2>
                    <p className="text-slate-500 font-medium">Search for athletes faster than you to place active bounties on them. You have {5 - activeRivals.length} open slots.</p>
                  </div>

                  <form onSubmit={handleSearchRivals} className="flex flex-col sm:flex-row gap-3 mb-10">
                    <div className="relative flex-1">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search by name or high school..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-lg shadow-inner"
                      />
                    </div>
                    <button type="submit" disabled={isSearching} className="bg-slate-900 hover:bg-black text-white px-8 rounded-xl font-black transition-colors shrink-0 disabled:opacity-50 text-lg shadow-lg">
                      {isSearching ? '...' : 'Search'}
                    </button>
                  </form>

                  {/* RECOMMENDATIONS */}
                  {!searchQuery && recommendedRivals.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Recommended Targets in {currentUser?.state || 'your area'}
                      </h4>
                      <div className="space-y-3">
                        {recommendedRivals.map((athlete) => (
                          <div key={athlete.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-xl hover:border-red-300 transition-colors group">
                            <div className="flex items-center gap-4">
                              <AvatarWithBorder avatarUrl={athlete.avatar_url ?? null} borderId={athlete.equipped_border ?? null} sizeClasses="w-10 h-10" />
                              <div>
                                <h4 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">{athlete.first_name} {athlete.last_name}</h4>
                                <p className="text-xs font-medium text-slate-500 flex items-center"><MapPin className="w-3 h-3 mr-1" /> {athlete.high_school}</p>
                              </div>
                            </div>
                            <button onClick={() => handleAddRival(athlete)} className="bg-white hover:bg-red-500 text-slate-700 hover:text-white border border-slate-200 hover:border-red-600 font-black px-4 py-2 rounded-lg transition-all text-xs shadow-sm">
                              Target
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-3 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Search Results</p>
                      {searchResults.map((athlete) => (
                        <div key={athlete.id} className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl hover:border-red-300 transition-colors group shadow-sm">
                          <div className="flex items-center gap-4">
                            <AvatarWithBorder avatarUrl={athlete.avatar_url ?? null} borderId={athlete.equipped_border ?? null} sizeClasses="w-10 h-10" />
                            <div>
                              <h4 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">{athlete.first_name} {athlete.last_name}</h4>
                              <p className="text-xs font-medium text-slate-500 flex items-center"><MapPin className="w-3 h-3 mr-1" /> {athlete.high_school}</p>
                            </div>
                          </div>
                          <button onClick={() => handleAddRival(athlete)} className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 hover:border-red-600 font-black px-4 py-2 rounded-lg transition-all shadow-sm text-xs">
                            Target
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}