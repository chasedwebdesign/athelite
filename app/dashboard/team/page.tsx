'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Users, MessageSquare, Trophy, Zap, Shield, Flame, ArrowUpCircle, Send, CheckCircle2, ChevronRight, Lock, Unlock, Medal, Crown, Activity, Gift, Clock, Rocket, Coins, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';

// 🚨 REUSABLE COMPONENTS
import { ChasedCash } from '@/components/ChasedCash';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

// --- RECRUITING SCORE MATH ---
const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

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

// --- TYPES ---
interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  equipped_border: string | null;
  recruitment_score: number;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  timestamp: Date;
}

// --- CONSTANTS ---
const BOOST_TIERS = [
  { level: 0, name: "Offline", cost: 0, interval: "Never", intervalDays: 9999 },
  { level: 1, name: "Base Camp", cost: 5000, interval: "Every 2 Months", intervalDays: 60 },
  { level: 2, name: "Steady Stream", cost: 15000, interval: "Monthly", intervalDays: 30 },
  { level: 3, name: "Accelerated", cost: 35000, interval: "Every 3 Weeks", intervalDays: 21 },
  { level: 4, name: "Hyper Drive", cost: 75000, interval: "Every 2 Weeks", intervalDays: 14 },
  { level: 5, name: "Quantum", cost: 150000, interval: "Weekly", intervalDays: 7 },
  { level: 6, name: "THE FINAL BOSS", cost: 500000, interval: "2x a Week", intervalDays: 3.5, isMax: true },
];

const CASH_GEN_TIERS = [
  { level: 0, name: "Offline", cost: 0, reward: 0 },
  { level: 1, name: "Local Sponsor", cost: 15, reward: 500 },
  { level: 2, name: "Regional Deal", cost: 30, reward: 1000 },
  { level: 3, name: "National Campaign", cost: 45, reward: 1500 },
  { level: 4, name: "Pro Endorsement", cost: 60, reward: 2000, isMax: true },
];

export default function TeamHeadquarters() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'perks' | 'treasure' | 'track' | 'chat'>('perks');
  
  // User & Team State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamName, setTeamName] = useState("Your Team");
  
  // Athlete Wallets
  const [userCoins, setUserCoins] = useState(0);
  const [userBoosts, setUserBoosts] = useState(0);

  // Collective Vault State
  const [teamBoostFund, setTeamBoostFund] = useState(0); 
  const [teamCashGenFund, setTeamCashGenFund] = useState(0); 
  const [upgradeTokens, setUpgradeTokens] = useState(0); 
  
  // Claim States
  const [timeUntilBoostClaim, setTimeUntilBoostClaim] = useState<number | null>(null);
  const [timeUntilCashClaim, setTimeUntilCashClaim] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  // UI Modals, Inputs & Toasts
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showContributeModal, setShowContributeModal] = useState<'boost_gen' | 'cash_gen' | 'upgrades' | null>(null);
  const [contributionAmount, setContributionAmount] = useState<number | string>('');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Helper for in-app toasts
  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    async function loadTeamData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userData } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, high_school, coins, boosts_available, last_boost_claim, last_cash_claim')
        .eq('id', session.user.id)
        .maybeSingle();

      if (userData && userData.high_school) {
        setCurrentUser(userData);
        setUserCoins(userData.coins || 0);
        setUserBoosts(userData.boosts_available || 0); 
        setTeamName(userData.high_school);

        const { data: teammates } = await supabase
          .from('athletes')
          .select('id, first_name, last_name, avatar_url, equipped_border, prs, gender')
          .eq('high_school', userData.high_school)
          .gt('trust_level', 0);

        if (teammates) {
          const processed = teammates.map(t => {
            let bestScore = 0;
            if (t.prs && t.prs.length > 0) {
              t.prs.forEach((pr: any) => {
                const score = getEventScore(pr.mark, pr.event, t.gender || 'Boys');
                if (score > bestScore) bestScore = score;
              });
            }
            return {
              id: t.id,
              first_name: t.first_name,
              last_name: t.last_name,
              avatar_url: t.avatar_url,
              equipped_border: t.equipped_border,
              recruitment_score: bestScore
            };
          }).sort((a, b) => b.recruitment_score - a.recruitment_score);

          setTeamMembers(processed);
        }

        // Fetch Team Vault Info
        const { data: teamData } = await supabase
          .from('teams')
          .select('boost_tokens, cash_gen_tokens, upgrade_tokens')
          .eq('high_school_name', userData.high_school)
          .maybeSingle();

        if (teamData) {
          setTeamBoostFund(teamData.boost_tokens || 0);
          setTeamCashGenFund(teamData.cash_gen_tokens || 0);
          setUpgradeTokens(teamData.upgrade_tokens || 0);
          
          // --- CALCULATE BOOST TIMER ---
          let activeBoostTier = 0;
          for (let i = BOOST_TIERS.length - 1; i >= 0; i--) {
            if ((teamData.boost_tokens || 0) >= BOOST_TIERS[i].cost) {
              activeBoostTier = i;
              break;
            }
          }

          if (activeBoostTier > 0) {
            const lastBoostClaim = userData.last_boost_claim ? new Date(userData.last_boost_claim).getTime() : 0;
            const now = new Date().getTime();
            const intervalMs = BOOST_TIERS[activeBoostTier].intervalDays * 24 * 60 * 60 * 1000;
            const timeSinceLastClaim = now - lastBoostClaim;
            
            if (timeSinceLastClaim >= intervalMs) {
              setTimeUntilBoostClaim(0); 
            } else {
              setTimeUntilBoostClaim(intervalMs - timeSinceLastClaim); 
            }
          }

          // --- CALCULATE CASH TIMER ---
          let activeCashTier = 0;
          for (let i = CASH_GEN_TIERS.length - 1; i >= 0; i--) {
            if ((teamData.cash_gen_tokens || 0) >= CASH_GEN_TIERS[i].cost) {
              activeCashTier = i;
              break;
            }
          }

          if (activeCashTier > 0) {
            const lastCashClaim = userData.last_cash_claim ? new Date(userData.last_cash_claim).getTime() : 0;
            const now = new Date().getTime();
            const weeklyMs = 7 * 24 * 60 * 60 * 1000;
            const timeSinceLastCashClaim = now - lastCashClaim;

            if (timeSinceLastCashClaim >= weeklyMs) {
              setTimeUntilCashClaim(0);
            } else {
              setTimeUntilCashClaim(weeklyMs - timeSinceLastCashClaim);
            }
          }
        }
      }
      
      setChatMessages([
        { id: '1', sender_id: 'sys', sender_name: 'System', text: 'Welcome to the Team Chat.', timestamp: new Date() }
      ]);
      
      setLoading(false);
    }
    loadTeamData();
  }, [supabase]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentUser) return;
    
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender_id: currentUser.id,
      sender_name: currentUser.first_name,
      text: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages([...chatMessages, newMsg]);
    setChatInput('');
  };

  const handleContribute = async () => {
    const amount = Number(contributionAmount);
    if (isNaN(amount) || amount <= 0 || !showContributeModal || !currentUser) return;

    if (showContributeModal === 'cash_gen' && amount > userBoosts) return;
    if (showContributeModal !== 'cash_gen' && amount > userCoins) return;

    try {
      const { error } = await supabase.rpc('contribute_to_team_vault', {
        p_athlete_id: currentUser.id,
        p_amount: amount,
        p_vault_type: showContributeModal
      });

      if (error) throw error;

      if (showContributeModal === 'cash_gen') {
        setUserBoosts(prev => prev - amount);
        setTeamCashGenFund(prev => prev + amount);
        showToast(`Successfully sacrificed ${amount} Boosts!`, 'success');
      } else if (showContributeModal === 'boost_gen') {
        setUserCoins(prev => prev - amount);
        setTeamBoostFund(prev => prev + amount);
        showToast(`Successfully contributed ${amount} ChasedCash!`, 'success');
      } else if (showContributeModal === 'upgrades') {
        setUserCoins(prev => prev - amount);
        setUpgradeTokens(prev => prev + amount);
        showToast(`Successfully contributed ${amount} ChasedCash!`, 'success');
      }

      setShowContributeModal(null);
      setContributionAmount('');
      
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleClaimReward = async (type: 'boost' | 'cash') => {
    if (!currentUser || isClaiming) return;
    setIsClaiming(true);

    try {
      if (type === 'boost') {
        const { error } = await supabase.rpc('claim_team_boost', { p_athlete_id: currentUser.id });
        if (error) throw error;

        let activeTier = 0;
        for (let i = BOOST_TIERS.length - 1; i >= 0; i--) {
          if (teamBoostFund >= BOOST_TIERS[i].cost) { activeTier = i; break; }
        }
        
        setUserBoosts(prev => prev + 1);
        const intervalMs = BOOST_TIERS[activeTier].intervalDays * 24 * 60 * 60 * 1000;
        setTimeUntilBoostClaim(intervalMs);
        showToast("Supply Drop Claimed! +1 Boost added to your inventory.", 'success');
        
      } else {
        let activeTier = 0;
        for (let i = CASH_GEN_TIERS.length - 1; i >= 0; i--) {
          if (teamCashGenFund >= CASH_GEN_TIERS[i].cost) { activeTier = i; break; }
        }
        const rewardAmount = CASH_GEN_TIERS[activeTier].reward;

        const { error } = await supabase.rpc('claim_team_cash', { 
          p_athlete_id: currentUser.id,
          p_amount: rewardAmount 
        });
        if (error) throw error;

        setUserCoins(prev => prev + rewardAmount);
        const weeklyMs = 7 * 24 * 60 * 60 * 1000;
        setTimeUntilCashClaim(weeklyMs);
        showToast(`Payload Claimed! +${rewardAmount} ChasedCash added to your wallet.`, 'success');
      }
      
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  const formatTime = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- Calculate Current Status ---
  let currentBoostTier = 0;
  for (let i = BOOST_TIERS.length - 1; i >= 0; i--) {
    if (teamBoostFund >= BOOST_TIERS[i].cost) { currentBoostTier = i; break; }
  }
  const nextBoostTier = BOOST_TIERS[currentBoostTier + 1] || null;
  const boostProgressPct = nextBoostTier ? Math.min(100, (teamBoostFund / nextBoostTier.cost) * 100) : 100;

  let currentCashTier = 0;
  for (let i = CASH_GEN_TIERS.length - 1; i >= 0; i--) {
    if (teamCashGenFund >= CASH_GEN_TIERS[i].cost) { currentCashTier = i; break; }
  }
  const nextCashTier = CASH_GEN_TIERS[currentCashTier + 1] || null;
  const cashProgressPct = nextCashTier ? Math.min(100, (teamCashGenFund / nextCashTier.cost) * 100) : 100;

  // 🚨 CALCULATE DYNAMIC UI UPGRADE TIER 🚨
  let uiUpgradeLevel = 0;
  if (upgradeTokens >= 50000) uiUpgradeLevel = 3;
  else if (upgradeTokens >= 25000) uiUpgradeLevel = 2;
  else if (upgradeTokens >= 10000) uiUpgradeLevel = 1;

  // Render Modal Values Dynamically
  const isDonatingBoosts = showContributeModal === 'cash_gen';
  const maxDonation = isDonatingBoosts ? userBoosts : userCoins;
  const modalCurrencyName = isDonatingBoosts ? 'Boosts' : 'ChasedCash';

  // 🚨 DYNAMIC THEME CLASSES GENERATED FROM UPGRADES 🚨
  const globalBgClass = uiUpgradeLevel >= 3 
    ? 'min-h-screen bg-slate-950 text-white font-sans pb-32 gold-dust-bg' 
    : 'min-h-screen bg-slate-950 text-white font-sans pb-32';
    
  const headerClass = uiUpgradeLevel >= 1 
    ? 'header-custom-banner border-b border-indigo-500/30' 
    : 'bg-slate-900 border-b border-slate-800';

  const cardBorderClass = uiUpgradeLevel >= 3 
    ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
    : 'border-slate-800 shadow-xl';

  return (
    <main className={globalBgClass}>
      
      {/* 🚨 CSS INJECTIONS FOR DYNAMIC THEMES AND ARROW REMOVAL 🚨 */}
      <style dangerouslySetInnerHTML={{__html: `
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        
        /* Level 1: Custom Header Pattern */
        .header-custom-banner {
          background: linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(30,27,75,1) 100%);
          position: relative;
        }
        .header-custom-banner::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.5;
        }

        /* Level 2: Animated Roster Badges */
        .roster-premium {
          background: linear-gradient(to right, rgba(15,23,42,1), rgba(15,23,42,1)) padding-box,
                      linear-gradient(90deg, #3b82f6, #a855f7, #3b82f6) border-box;
          border: 1px solid transparent !important;
          background-size: 200% auto;
          animation: shimmerSlow 3s linear infinite;
          border-radius: 1rem;
          margin-bottom: 0.5rem;
        }

        /* Level 3: Gold Background Dust */
        .gold-dust-bg {
          background-image: radial-gradient(rgba(245, 158, 11, 0.05) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}} />

      {/* 🚨 DYNAMIC CONTRIBUTION MODAL 🚨 */}
      {showContributeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowContributeModal(null)}></div>
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 relative z-10 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black mb-2">Fund the {showContributeModal === 'upgrades' ? 'Upgrades' : 'Generator'}</h3>
            <p className="text-slate-400 text-sm font-medium mb-6">Contribute your personal {modalCurrencyName} to unlock team-wide upgrades.</p>
            
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 mb-6 flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Your Balance</span>
              <div className="flex items-center gap-1.5 font-black text-xl text-white">
                {maxDonation} {isDonatingBoosts ? <Zap className="w-5 h-5 text-amber-500" /> : <ChasedCash className="w-5 h-4 text-emerald-400" />}
              </div>
            </div>

            <div className="relative mb-6">
              <input 
                type="number" 
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                placeholder="Enter amount..."
                className={`w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-16 py-4 text-xl font-black focus:outline-none transition-colors ${isDonatingBoosts ? 'focus:border-amber-500' : 'focus:border-emerald-500'}`}
                max={maxDonation}
              />
              <button 
                onClick={() => setContributionAmount(maxDonation)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded hover:bg-slate-600 transition-colors"
              >
                MAX
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowContributeModal(null)} className="flex-1 py-3.5 rounded-xl font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors">Cancel</button>
              <button 
                onClick={handleContribute} 
                disabled={!contributionAmount || Number(contributionAmount) <= 0 || Number(contributionAmount) > maxDonation}
                className={`flex-1 py-3.5 rounded-xl font-black text-slate-950 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isDonatingBoosts ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}
              >
                Donate <ArrowUpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP TOAST */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />}
            <p className="text-sm font-bold leading-tight">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* 🚨 DYNAMIC HEADER APPLIED HERE 🚨 */}
      <div className={`pt-12 pb-6 px-6 relative overflow-hidden ${headerClass}`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-black tracking-widest uppercase mb-3">
              <Shield className="w-3 h-3 mr-1.5 text-blue-400" /> Team Headquarters
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">{teamName}</h1>
            <p className="text-slate-400 font-medium flex items-center gap-2">
              <Users className="w-4 h-4" /> {teamMembers.length} Active Athletes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/50 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <ChasedCash className="w-5 h-5 text-emerald-400" />
              <span className="font-black text-white">{userCoins}</span>
            </div>
            <div className="bg-slate-950/50 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              <span className="font-black text-white">{userBoosts}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8">
        
        {/* TAB NAVIGATION */}
        <div className="flex gap-2 mb-8 border-b border-slate-800 pb-px overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab('perks')} className={`px-6 py-3 font-bold text-sm tracking-wide transition-all border-b-2 whitespace-nowrap ${activeTab === 'perks' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <Rocket className="w-4 h-4 inline mr-2 -mt-0.5" /> Perks
          </button>
          <button onClick={() => setActiveTab('treasure')} className={`px-6 py-3 font-black text-sm tracking-wide transition-all border-b-2 whitespace-nowrap rounded-t-lg ${activeTab === 'treasure' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <Gift className="w-4 h-4 inline mr-2 -mt-0.5" /> Treasure
          </button>
          <button onClick={() => setActiveTab('track')} className={`px-6 py-3 font-bold text-sm tracking-wide transition-all border-b-2 whitespace-nowrap ${activeTab === 'track' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <Activity className="w-4 h-4 inline mr-2 -mt-0.5" /> Track (Recruiting)
          </button>
          <button onClick={() => setActiveTab('chat')} className={`px-6 py-3 font-bold text-sm tracking-wide transition-all border-b-2 whitespace-nowrap ${activeTab === 'chat' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <MessageSquare className="w-4 h-4 inline mr-2 -mt-0.5" /> Team Chat
          </button>
        </div>

        {/* =========================================
            TAB 1: PERKS (FUNDING THE GENERATORS)
        ========================================= */}
        {activeTab === 'perks' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* BOOST GENERATOR */}
            <div className={`bg-slate-900 border rounded-[2rem] p-6 md:p-8 relative overflow-hidden group flex flex-col ${cardBorderClass}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-amber-500/10 transition-colors"></div>
              
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div>
                  <h3 className="text-2xl font-black mb-1 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-amber-500" /> Boost Generator
                  </h3>
                  <p className="text-slate-400 text-sm font-medium">Pool ChasedCash to generate free feed boosts for the entire team.</p>
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 mb-6 relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Output</p>
                  <p className="text-xl font-black text-amber-400">{BOOST_TIERS[currentBoostTier].interval}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Level</p>
                  <p className="text-xl font-black text-white">{currentBoostTier}</p>
                </div>
              </div>

              <div className="mt-auto">
                {nextBoostTier ? (
                  <div className="relative z-10 mb-6">
                    <div className="flex justify-between text-sm font-bold mb-3">
                      <span className="text-slate-300 flex items-center gap-1.5"><Lock className="w-4 h-4 text-slate-500" /> Next: {nextBoostTier.name}</span>
                      <span className="text-amber-500 font-black">{teamBoostFund.toLocaleString()} / {nextBoostTier.cost.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full" style={{ width: `${boostProgressPct}%` }}></div>
                    </div>
                    <p className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Unlocks: {nextBoostTier.interval}</p>
                  </div>
                ) : (
                  <div className="relative z-10 mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center">
                    <Flame className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                    <h4 className="text-lg font-black text-amber-400 mb-1">MAX LEVEL REACHED</h4>
                    <p className="text-sm text-amber-200/70 font-medium">Generating 2 boosts a week.</p>
                  </div>
                )}

                <button onClick={() => setShowContributeModal('boost_gen')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl transition-colors relative z-10 flex items-center justify-center gap-2">
                  Fund with <ChasedCash className="w-5 h-4" />
                </button>
              </div>
            </div>

            {/* CASH GENERATOR */}
            <div className={`bg-slate-900 border rounded-[2rem] p-6 md:p-8 relative overflow-hidden group flex flex-col ${cardBorderClass}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
              
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div>
                  <h3 className="text-2xl font-black mb-1 flex items-center gap-2">
                    <Coins className="w-6 h-6 text-emerald-500" /> Cash Generator
                  </h3>
                  <p className="text-slate-400 text-sm font-medium">Sacrifice your personal Boosts to permanently increase the team's weekly ChasedCash payout.</p>
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 mb-6 relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Weekly Payout</p>
                  <p className="text-xl font-black text-emerald-400">+{CASH_GEN_TIERS[currentCashTier].reward.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Level</p>
                  <p className="text-xl font-black text-white">{currentCashTier}</p>
                </div>
              </div>

              <div className="mt-auto">
                {nextCashTier ? (
                  <div className="relative z-10 mb-6">
                    <div className="flex justify-between text-sm font-bold mb-3">
                      <span className="text-slate-300 flex items-center gap-1.5"><Lock className="w-4 h-4 text-slate-500" /> Next: {nextCashTier.name}</span>
                      <span className="text-emerald-500 font-black">{teamCashGenFund} / {nextCashTier.cost}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full" style={{ width: `${cashProgressPct}%` }}></div>
                    </div>
                    <p className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Unlocks: +{nextCashTier.reward}/week</p>
                  </div>
                ) : (
                  <div className="relative z-10 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                    <Flame className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <h4 className="text-lg font-black text-emerald-400 mb-1">MAX LEVEL REACHED</h4>
                    <p className="text-sm text-emerald-200/70 font-medium">Generating 2,000 Cash a week.</p>
                  </div>
                )}

                <button onClick={() => setShowContributeModal('cash_gen')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl transition-colors relative z-10 flex items-center justify-center gap-2">
                  Fund with <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                </button>
              </div>
            </div>

            {/* UI UPGRADE GOALS (Spans bottom) */}
            <div className={`lg:col-span-2 bg-slate-900 border rounded-[2rem] p-6 md:p-8 relative overflow-hidden group flex flex-col md:flex-row gap-8 ${cardBorderClass}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-fuchsia-500/10 transition-colors"></div>
              
              <div className="md:w-1/3 relative z-10">
                <h3 className="text-2xl font-black mb-1 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-fuchsia-500" /> Hub Upgrades
                </h3>
                <p className="text-slate-400 text-sm font-medium mb-6">Unlock aesthetic upgrades to make your team page stand out.</p>
                <button onClick={() => setShowContributeModal('upgrades')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                  Fund with <ChasedCash className="w-5 h-4" />
                </button>
              </div>

              <div className="md:w-2/3 space-y-4 relative z-10">
                <div className={`p-4 rounded-2xl border ${uiUpgradeLevel >= 1 ? 'bg-fuchsia-500/10 border-fuchsia-500/30' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`font-black ${uiUpgradeLevel >= 1 ? 'text-fuchsia-400' : 'text-slate-300'}`}>Custom Team Banner</h4>
                    {uiUpgradeLevel >= 1 ? <Unlock className="w-4 h-4 text-fuchsia-500" /> : <span className="text-xs font-bold text-slate-500">10,000 <ChasedCash className="w-3 h-3 inline" /></span>}
                  </div>
                  {uiUpgradeLevel < 1 && (
                    <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3">
                      <div className="bg-fuchsia-600 h-full rounded-full" style={{ width: `${Math.min(100, (upgradeTokens / 10000) * 100)}%` }}></div>
                    </div>
                  )}
                </div>

                <div className={`p-4 rounded-2xl border ${uiUpgradeLevel >= 2 ? 'bg-fuchsia-500/10 border-fuchsia-500/30' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`font-black ${uiUpgradeLevel >= 2 ? 'text-fuchsia-400' : 'text-slate-300'}`}>Animated Roster Badges</h4>
                    {uiUpgradeLevel >= 2 ? <Unlock className="w-4 h-4 text-fuchsia-500" /> : <span className="text-xs font-bold text-slate-500">25,000 <ChasedCash className="w-3 h-3 inline" /></span>}
                  </div>
                  {uiUpgradeLevel < 2 && (
                    <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3">
                      <div className="bg-fuchsia-600 h-full rounded-full" style={{ width: `${Math.min(100, (upgradeTokens / 25000) * 100)}%` }}></div>
                    </div>
                  )}
                </div>

                 <div className={`p-4 rounded-2xl border ${uiUpgradeLevel >= 3 ? 'bg-fuchsia-500/10 border-fuchsia-500/30' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`font-black ${uiUpgradeLevel >= 3 ? 'text-fuchsia-400' : 'text-slate-300'}`}>Gold Trim Aesthetics</h4>
                    {uiUpgradeLevel >= 3 ? <Unlock className="w-4 h-4 text-fuchsia-500" /> : <span className="text-xs font-bold text-slate-500">50,000 <ChasedCash className="w-3 h-3 inline" /></span>}
                  </div>
                  {uiUpgradeLevel < 3 && (
                    <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3">
                      <div className="bg-fuchsia-600 h-full rounded-full" style={{ width: `${Math.min(100, (upgradeTokens / 50000) * 100)}%` }}></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            TAB 2: TREASURE (CLAIM THE LOOT)
        ========================================= */}
        {activeTab === 'treasure' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* CLAIM SUPPLY DROP */}
            <div className={`bg-slate-900 border rounded-[2rem] p-6 relative overflow-hidden flex flex-col ${cardBorderClass}`}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none"></div>
              <div className="relative z-10 text-center mb-6">
                 <Zap className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                 <h3 className="text-2xl font-black text-white">Supply Drop</h3>
                 <p className="text-sm text-slate-400 font-medium">Claims +1 Feed Boost to your inventory.</p>
              </div>

              <div className="mt-auto relative z-10">
                {currentBoostTier === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center">
                     <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Generator Offline</p>
                     <p className="text-xs text-slate-600 mt-2">Fund the generator in Perks to unlock.</p>
                  </div>
                ) : timeUntilBoostClaim === 0 ? (
                  <button 
                    onClick={() => handleClaimReward('boost')}
                    disabled={isClaiming}
                    className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-amber-950 font-black py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-[1.02] disabled:opacity-50"
                  >
                    {isClaiming ? 'Claiming...' : 'Claim 1x Boost'}
                  </button>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center">
                    <Clock className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                    <h4 className="font-black text-slate-300 mb-1">Generating Payload...</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Ready in {timeUntilBoostClaim ? formatTime(timeUntilBoostClaim) : '--'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CLAIM CASH PAYLOAD */}
            <div className={`bg-slate-900 border rounded-[2rem] p-6 relative overflow-hidden flex flex-col ${cardBorderClass}`}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>
              <div className="relative z-10 text-center mb-6">
                 <Coins className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                 <h3 className="text-2xl font-black text-white">Cash Payout</h3>
                 <p className="text-sm text-slate-400 font-medium">Claims weekly ChasedCash for the team.</p>
              </div>

              <div className="mt-auto relative z-10">
                {currentCashTier === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center">
                     <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Generator Offline</p>
                     <p className="text-xs text-slate-600 mt-2">Fund the generator in Perks to unlock.</p>
                  </div>
                ) : timeUntilCashClaim === 0 ? (
                  <button 
                    onClick={() => handleClaimReward('cash')}
                    disabled={isClaiming}
                    className="w-full bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-emerald-950 font-black py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-[1.02] disabled:opacity-50"
                  >
                    {isClaiming ? 'Claiming...' : `Claim +${CASH_GEN_TIERS[currentCashTier].reward} Cash`}
                  </button>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center">
                    <Clock className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                    <h4 className="font-black text-slate-300 mb-1">Signing Contracts...</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Ready in {timeUntilCashClaim ? formatTime(timeUntilCashClaim) : '--'}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* =========================================
            TAB 3: TRACK LEADERBOARD
        ========================================= */}
        {activeTab === 'track' && (
          <div className={`animate-in fade-in slide-in-from-bottom-4 bg-slate-900 border rounded-[2rem] overflow-hidden ${cardBorderClass}`}>
            <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                <Activity className="w-7 h-7 text-emerald-500" /> Team Recruitment Rank
              </h3>
              <p className="text-slate-400 font-medium text-sm">Ranked purely by individual recruiting scores. No rewards, just bragging rights.</p>
            </div>

            <div className="flex flex-col p-2 gap-2">
              {teamMembers.map((athlete, idx) => {
                const rank = idx + 1;
                const isTop3 = rank <= 3;
                
                // 🚨 APPLY LEVEL 2 ANIMATED BADGES IF UNLOCKED
                const rosterClass = (isTop3 && uiUpgradeLevel >= 2)
                  ? 'roster-premium hover:brightness-110'
                  : 'border-b border-slate-800/50 hover:bg-slate-800/50 rounded-xl';

                return (
                  <Link href={`/athlete/${athlete.id}`} key={athlete.id} className={`p-4 md:p-6 flex items-center gap-4 transition-all block w-full text-left cursor-pointer group ${rosterClass} ${athlete.id === currentUser?.id ? 'bg-emerald-900/10' : ''}`}>
                    <div className="w-8 shrink-0 text-center">
                      {rank === 1 ? <Crown className="w-6 h-6 mx-auto text-yellow-400" /> :
                       rank === 2 ? <Medal className="w-6 h-6 mx-auto text-slate-300" /> :
                       rank === 3 ? <Medal className="w-6 h-6 mx-auto text-amber-600" /> :
                       <span className="font-black text-lg text-slate-600">#{rank}</span>}
                    </div>
                    
                    <AvatarWithBorder avatarUrl={athlete.avatar_url} borderId={athlete.equipped_border} sizeClasses="w-12 h-12 shadow-md shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate text-lg group-hover:text-emerald-400 transition-colors">{athlete.first_name} {athlete.last_name}</h4>
                    </div>
                    
                    <div className="text-right shrink-0 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Score</span>
                       <span className={`font-black text-xl ${isTop3 ? 'text-emerald-400' : 'text-slate-300'}`}>{athlete.recruitment_score}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================
            TAB 4: TEAM CHAT
        ========================================= */}
        {activeTab === 'chat' && (
          <div className={`animate-in fade-in slide-in-from-bottom-4 bg-slate-900 border rounded-[2rem] flex flex-col h-[600px] overflow-hidden ${cardBorderClass}`}>
            <div className="p-4 md:p-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-purple-500" /> Team Chat
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-950/50">
              {chatMessages.map(msg => {
                const isMe = msg.sender_id === currentUser?.id;
                const isSystem = msg.sender_id === 'sys';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-6">
                      <span className="bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{msg.text}</span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <Link href={`/athlete/${msg.sender_id}`} className="text-[10px] font-bold text-slate-500 hover:text-purple-400 transition-colors mb-1 ml-1">{msg.sender_name}</Link>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm md:text-base font-medium ${isMe ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Message the team..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 text-white placeholder-slate-500"
                />
                <button type="submit" disabled={!chatInput.trim()} className="bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-xl transition-colors disabled:opacity-50">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}