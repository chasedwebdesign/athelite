'use client';

import React, { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, Search, ChevronRight, Users, ChevronDown, ChevronUp, 
  Bookmark, RefreshCw, UserCircle2, School, Check, Trash2, 
  Save, ArrowRight, Plus, X, Globe, CheckCircle2, Flame,
  Rocket, Crown, Gift, Lock, ImageIcon, 
  Mail, Sparkles, Edit3, Scale, Activity,
  TrendingUp, BarChart3, Eye, Calendar,
  Map, ShieldAlert, Camera, LayoutDashboard, Package, LayoutTemplate, Diamond
} from 'lucide-react';
import { AvatarWithBorder } from '@/components/AnimatedBorders';
import { Points } from '@/components/Points';
import EmailVerification from '@/components/EmailVerification';
import { SPORT_CONFIGS_META, US_STATES, evaluateMetric, getRealStats } from '@/utils/constants/RecruitingStandards';
import { LootBoxVisual } from '@/components/LootBoxVisual';

import PerformanceStats from './performance-stats/page';
import Rewards from './rewards/page';

const normalizeHSName = (name: string) => {
  let clean = name.replace(/\b(High School|H\.S\.|High)\b/gi, 'HS').trim();
  clean = clean.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  clean = clean.replace(/\bHs\b/g, 'HS');
  return clean;
};

const parseNumericStat = (rawStr: string | number | null | undefined, fallback: number): number => {
  if (typeof rawStr === 'number') return rawStr;
  if (!rawStr) return fallback;
  const cleaned = String(rawStr).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
};

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
  if (!border || border === 'none') return 'border-blue-500/20 shadow-[0_8px_32px_rgba(59,130,246,0.15)] bg-slate-900/60';
  
  const b = border.toLowerCase();
  if (b.includes('legend')) return 'border-amber-500/30 shadow-[0_8px_32px_rgba(245,158,11,0.15)] bg-amber-900/20';
  if (b.includes('champion')) return 'border-red-500/30 shadow-[0_8px_32px_rgba(239,68,68,0.15)] bg-red-900/20';
  if (b.includes('elite')) return 'border-purple-500/30 shadow-[0_8px_32px_rgba(168,85,247,0.15)] bg-purple-900/20';
  if (b.includes('diamond')) return 'border-sky-500/30 shadow-[0_8px_32px_rgba(56,189,248,0.15)] bg-sky-900/20';
  if (b.includes('pro')) return 'border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.15)] bg-emerald-900/20';
  if (b.includes('mythic')) return 'border-fuchsia-500/30 shadow-[0_8px_32px_rgba(217,70,239,0.15)] bg-fuchsia-900/20';
  
  return 'border-blue-500/20 shadow-[0_8px_32px_rgba(59,130,246,0.15)] bg-slate-900/60';
};

const getThemeConfig = (cardType: string | null | undefined) => {
  const safeCardType = cardType === 'default' || !cardType ? 'base' : cardType;
  const isBase = safeCardType === 'base';

  if (isBase) {
    return {
      isDark: false,
      pageBg: 'bg-slate-50',
      pagePattern: 'opacity-[0.03]',
      heroCard: 'bg-white/80 backdrop-blur-2xl border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)]',
      heroName: 'text-slate-900',
      heroMeta: 'text-slate-600 font-semibold',
      heroDivider: 'text-slate-300',
      btnPrimary: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/30 border-transparent',
      btnSecondary: 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm',
      sectionBg: 'bg-white/80 backdrop-blur-2xl',
      sectionBorder: 'border-slate-200',
      sectionShadow: 'shadow-xl shadow-slate-200/50',
      subCardBg: 'bg-slate-50',
      subCardBorder: 'border-slate-100',
      textHeader: 'text-slate-900',
      textSub: 'text-slate-500',
      textMuted: 'text-slate-400',
      iconColor: 'text-blue-600',
    };
  }

  const map: Record<string, any> = {
    obsidian: { glow: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]', border: 'border-blue-500/30', accent: 'text-blue-400', borderHover: 'hover:border-blue-400', ring: 'focus:ring-blue-500' },
    crimson: { glow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]', border: 'border-red-500/50', accent: 'text-red-400', borderHover: 'hover:border-red-400', ring: 'focus:ring-red-500' },
    sapphire: { glow: 'shadow-[0_0_30px_rgba(59,130,246,0.2)]', border: 'border-blue-500/50', accent: 'text-blue-400', borderHover: 'hover:border-blue-400', ring: 'focus:ring-blue-500' },
    hype: { glow: 'shadow-[0_0_30px_rgba(99,102,241,0.2)]', border: 'border-indigo-500/50', accent: 'text-indigo-400', borderHover: 'hover:border-indigo-400', ring: 'focus:ring-indigo-500' },
    premium: { glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]', border: 'border-amber-500/50', accent: 'text-amber-400', borderHover: 'hover:border-amber-400', ring: 'focus:ring-amber-500' },
    amethyst: { glow: 'shadow-[0_0_30px_rgba(217,70,239,0.2)]', border: 'border-fuchsia-500/50', accent: 'text-fuchsia-400', borderHover: 'hover:border-fuchsia-400', ring: 'focus:ring-fuchsia-500' },
    cyber: { glow: 'shadow-[0_0_30px_rgba(6,182,212,0.2)]', border: 'border-cyan-500/50', accent: 'text-cyan-400', borderHover: 'hover:border-cyan-400', ring: 'focus:ring-cyan-500' },
    'mythic-flare': { glow: 'shadow-[0_0_40px_rgba(244,63,94,0.3)]', border: 'border-rose-500/50', accent: 'text-rose-400', borderHover: 'hover:border-rose-400', ring: 'focus:ring-rose-500' },
  };

  const t = map[safeCardType] || map.obsidian;
  const isAnimated = ['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber', 'mythic-flare'].includes(safeCardType);
  const animationClass = isAnimated ? 'animate-foil' : '';

  return {
    isDark: true,
    pageBg: 'bg-slate-950',
    pagePattern: 'opacity-10',
    heroCard: `holo-card-${safeCardType} border-blue-500/20 shadow-2xl text-white ${animationClass}`,
    heroName: 'text-white drop-shadow-md',
    heroMeta: 'text-blue-100 font-medium',
    heroDivider: 'text-white/40',
    btnPrimary: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/30 border border-blue-400/50 backdrop-blur-md',
    btnSecondary: 'bg-blue-900/30 hover:bg-blue-800/40 border border-blue-500/30 text-white shadow-sm backdrop-blur-md',
    sectionBg: 'bg-[#0B1221]/80 backdrop-blur-3xl',
    sectionBorder: t.border,
    sectionShadow: t.glow,
    subCardBg: 'bg-blue-950/30',
    subCardBorder: 'border-blue-500/20',
    textHeader: 'text-white drop-shadow-md',
    textSub: 'text-blue-100/80',
    textMuted: 'text-blue-200/50',
    iconColor: t.accent,
  };
};

const triggerVibration = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (e) {}
  }
};

export const getRewardForDay = (dayInCycle: number) => {
  const dayOfWeek = ((dayInCycle - 1) % 7) + 1;
  const weekOfCycle = Math.floor((dayInCycle - 1) / 7) + 1;

  let boxType = null;
  let boxLabel = "";
  let tier: 'standard' | 'premium' | 'ultra' | null = null;
  let Icon: React.ElementType = Points;
  let iconColor = "text-amber-400";
  let glow = "";
  
  let baseCoins = 20;
  if (dayInCycle === 28) baseCoins = 500;
  else if (dayInCycle === 14) baseCoins = 250;
  else if (dayOfWeek === 7) baseCoins = 100;

  if (dayOfWeek === 1) { 
    boxType = "std_card"; boxLabel = "Std Card Box"; tier = "standard"; Icon = Package; iconColor = "text-blue-400"; glow = "shadow-[0_0_15px_rgba(96,165,250,0.3)]";
  } else if (dayOfWeek === 5) { 
    boxType = "std_border"; boxLabel = "Std Border Box"; tier = "standard"; Icon = LayoutTemplate; iconColor = "text-blue-400"; glow = "shadow-[0_0_15px_rgba(96,165,250,0.3)]";
  } else if (dayOfWeek === 3) {
    boxType = weekOfCycle % 2 !== 0 ? "prem_card" : "prem_border";
    boxLabel = weekOfCycle % 2 !== 0 ? "Prem Card Box" : "Prem Border Box";
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
    glow = "shadow-[0_0_20px_rgba(217,70,239,0.4)]";
  }

  return { boxType, boxLabel, tier, Icon, iconColor, glow, baseCoins, isMajor: dayOfWeek === 7 || dayInCycle === 14 || dayInCycle === 28 };
};

type AccoladeObj = { text: string; category: string };

function DashboardContent() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [athleteProfile, setAthleteProfile] = useState<any>(null);
  const [streak, setStreak] = useState(0); 
  const [coins, setCoins] = useState(0);
  const [awardedToday, setAwardedToday] = useState(0);
  const [awardedBoxToday, setAwardedBoxToday] = useState<string | null>(null);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  
  const [isEmailVerificationModalOpen, setIsEmailVerificationModalOpen] = useState(false);
  const [isTeamJoinModalOpen, setIsTeamJoinModalOpen] = useState(false);
  const [sportToDelete, setSportToDelete] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [teamForm, setTeamForm] = useState({ high_school: '', city: '', state: '' });
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamSearchResults, setTeamSearchResults] = useState<any[]>([]);
  const [isSearchingTeams, setIsSearchingTeams] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCity, setNewTeamCity] = useState('');
  const [newTeamState, setNewTeamState] = useState('');
  const [newTeamMascot, setNewTeamNameMascot] = useState('');
  const [newTeamDivision, setNewTeamDivision] = useState(''); 

  const teamDropdownRef = useRef<HTMLDivElement>(null);
  const majorDropdownRef = useRef<HTMLDivElement>(null);

  const [savedColleges, setSavedColleges] = useState<any[]>([]);
  const [isCollegesOpen, setIsCollegesOpen] = useState(false);
  const [collegeSortBy, setCollegeSortBy] = useState<'match' | 'tuition' | 'salary'>('match');
  const [sportMenuOpen, setSportMenuOpen] = useState<string | null>(null);

  const [gpa, setGpa] = useState('');
  const [intendedMajor, setIntendedMajor] = useState('');
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [accolades, setAccolades] = useState<AccoladeObj[]>([]);
  const [newAccolade, setNewAccolade] = useState('');
  const [schoolPrefs, setSchoolPrefs] = useState('');

  const [sportStats, setSportStats] = useState<Record<string, any>>({});
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedAccolades, setSelectedAccolades] = useState<string[]>([]);
  const [isExportingCard, setIsExportingCard] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'social' | 'rewards'>('home');
  const [socialSubTab, setSocialSubTab] = useState<'performance' | 'portfolio' | 'social_card' | 'analytics'>('performance');

  const [dailyViews, setDailyViews] = useState(0);
  const [monthlyViews, setMonthlyViews] = useState(0);
  const [allRecentViewers, setAllRecentViewers] = useState<any[]>([]);
  const [recentViewers, setRecentViewers] = useState<any[]>([]);
  const [showAllViewersModal, setShowAllViewersModal] = useState(false);
  const [showImpressionTooltip, setShowImpressionTooltip] = useState(false);
  const [collapsedSports, setCollapsedSports] = useState<Record<string, boolean>>({});

  const [homeReferralCode, setHomeReferralCode] = useState('');
  const [isSubmittingHomeRef, setIsSubmittingHomeRef] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>(null);
  const [isOfferExpired, setIsOfferExpired] = useState<boolean>(true);
  const [isTimerLoaded, setIsTimerLoaded] = useState(false);
  const [hasInitializedParams, setHasInitializedParams] = useState(false);

  useEffect(() => {
    if (hasInitializedParams) return;

    const view = searchParams.get('view');
    const tab = searchParams.get('tab');
    let shouldCleanUrl = false;

    if (view === 'performance') {
      setActiveTab('social');
      if (tab === 'analytics') {
        setSocialSubTab('analytics');
      } else if (tab === 'portfolio') {
        setSocialSubTab('portfolio');
      } else {
        setSocialSubTab('performance');
      }
      shouldCleanUrl = true;
    } else if (view === 'rewards') {
      setActiveTab('rewards');
      shouldCleanUrl = true;
    }

    if (shouldCleanUrl) {
      router.replace('/dashboard', { scroll: false });
    }

    setHasInitializedParams(true);
  }, [searchParams, hasInitializedParams, router]);

  const gatingMode = useMemo(() => {
    return {
      isPreLaunch: false,
      hasAccess: athleteProfile?.is_premium === true || athleteProfile?.is_founder === true,
      label: "PRO feature"
    };
  }, [athleteProfile]);

  const isProUnlocked = gatingMode.hasAccess;
  const proPointMultiplier = athleteProfile?.is_premium ? 3 : 1;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const goToTab = (tab: 'home' | 'social' | 'rewards') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactCoach = (coachEmail: string | null) => {
    if (!coachEmail) return showToast("This coach has not made their contact information public.", "error");
    window.location.href = `mailto:${coachEmail}?subject=Recruiting Inquiry from ChasedSports Profile`;
  };

  // 🚨 CLAIM DAILY REWARD INSIDE THE REWARDS TAB (WITH 3X PRO MULTIPLIER) 🚨
  const handleClaimDailyReward = async () => {
    if (!athleteProfile?.id || !canClaimDaily || isClaimingDaily) return;
    setIsClaimingDaily(true);

    try {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const nextDayProgress = streak + 1;
      const cycle = Math.floor((nextDayProgress - 1) / 28);
      const cycleMultiplier = 1 + (cycle * 0.5);
      const dayNumInCycle = ((nextDayProgress - 1) % 28) + 1;
      const dayOfWeek = ((dayNumInCycle - 1) % 7) + 1;
      const weekOfCycle = Math.floor((dayNumInCycle - 1) / 7) + 1;

      let baseCoins = 20;
      if (dayNumInCycle === 28) baseCoins = 500;
      else if (dayNumInCycle === 14) baseCoins = 250;
      else if (dayOfWeek === 7) baseCoins = 100;

      const earnedCoinsToday = Math.round(baseCoins * cycleMultiplier * proPointMultiplier);
      const updatedCoins = coins + earnedCoinsToday;

      let awardedBoxLabel: string | null = null;
      const updatePayload: Record<string, any> = {
        login_day_progress: nextDayProgress,
        last_login_date: todayStr,
        coins: updatedCoins,
      };

      if (dayOfWeek === 1) {
        updatePayload.standard_card_boxes = (athleteProfile.standard_card_boxes || 0) + 1;
        awardedBoxLabel = "Standard Card Box";
      } else if (dayOfWeek === 5) {
        updatePayload.standard_border_boxes = (athleteProfile.standard_border_boxes || 0) + 1;
        awardedBoxLabel = "Standard Border Box";
      } else if (dayOfWeek === 3) {
        if (weekOfCycle % 2 !== 0) {
          updatePayload.premium_card_boxes = (athleteProfile.premium_card_boxes || 0) + 1;
          awardedBoxLabel = "Premium Card Box";
        } else {
          updatePayload.premium_border_boxes = (athleteProfile.premium_border_boxes || 0) + 1;
          awardedBoxLabel = "Premium Border Box";
        }
      } else if (dayOfWeek === 7) {
        if (weekOfCycle % 2 !== 0) {
          updatePayload.ultra_card_boxes = (athleteProfile.ultra_card_boxes || 0) + 1;
          awardedBoxLabel = "Ultra Card Box";
        } else {
          updatePayload.ultra_border_boxes = (athleteProfile.ultra_border_boxes || 0) + 1;
          awardedBoxLabel = "Ultra Border Box";
        }
      }

      const { error } = await supabase
        .from('athletes')
        .update(updatePayload)
        .eq('id', athleteProfile.id);

      if (error) throw error;

      setStreak(nextDayProgress);
      setCoins(updatedCoins);
      setAwardedToday(earnedCoinsToday);
      setAwardedBoxToday(awardedBoxLabel);
      setCanClaimDaily(false);
      setAthleteProfile((prev: any) => ({
        ...prev,
        ...updatePayload
      }));

      triggerVibration([50, 100, 150]);
      showToast(
        `Claimed +${earnedCoinsToday} Points${awardedBoxLabel ? ` & 1x ${awardedBoxLabel}` : ''}!`,
        "success"
      );
    } catch (err: any) {
      showToast("Failed to claim daily reward.", "error");
    } finally {
      setIsClaimingDaily(false);
    }
  };

  // 🚨 CLAIM REFERRAL MILESTONE IN REWARDS TAB 🚨
  const handleClaimReferral = async (count: number, pts: number, hasBox: boolean) => {
    if (!athleteProfile?.id) return;
    try {
      const newCoins = (athleteProfile.coins || 0) + pts;
      const updatePayload: any = { claimed_referrals: count, coins: newCoins };

      if (hasBox) {
        updatePayload.ultra_card_boxes = (athleteProfile.ultra_card_boxes || 0) + 1;
      }

      const { error } = await supabase.from('athletes').update(updatePayload).eq('id', athleteProfile.id);
      if (error) throw error;

      setAthleteProfile((prev: any) => ({
        ...prev,
        claimed_referrals: count,
        coins: newCoins,
        ...(hasBox && { ultra_card_boxes: updatePayload.ultra_card_boxes })
      }));
      setCoins(newCoins);

      triggerVibration([50, 100, 150]);
      showToast(
        `Referral Milestone Claimed: +${pts} Points${hasBox ? ' & 1x Ultra Card Box' : ''}!`,
        "success"
      );
    } catch (err: any) {
      showToast("Failed to claim referral reward.", "error");
    }
  };

  const handleReferralSubmit = async (code: string) => {
    if (!code.trim()) { showToast("Please enter a code.", "error"); return { success: false }; }
    if (!athleteProfile?.id) { showToast("Profile not loaded.", "error"); return { success: false }; }

    const cleanCode = code.trim().toLowerCase();
    if (cleanCode === athleteProfile.custom_slug?.toLowerCase()) {
      showToast("You cannot use your own invite code.", "error");
      return { success: false };
    }

    try {
      const { data: referrer, error: referrerError } = await supabase
        .from('athletes')
        .select('id, verified_referrals')
        .ilike('custom_slug', cleanCode)
        .single();

      if (referrerError || !referrer) {
        showToast("Invalid or missing invite code.", "error");
        return { success: false };
      }

      const bonusPoints = 500 * proPointMultiplier;
      const newCoins = (athleteProfile.coins || 0) + bonusPoints;
      const newBoxes = (athleteProfile.standard_card_boxes || 0) + 1;

      const { error: updateError } = await supabase
        .from('athletes')
        .update({ 
          referred_by: referrer.id,
          coins: newCoins,
          standard_card_boxes: newBoxes
        })
        .eq('id', athleteProfile.id);

      if (updateError) throw updateError;

      await supabase
        .from('athletes')
        .update({ verified_referrals: (referrer.verified_referrals || 0) + 1 })
        .eq('id', referrer.id);

      setAthleteProfile((prev: any) => ({ 
        ...prev, 
        referred_by: referrer.id,
        coins: newCoins,
        standard_card_boxes: newBoxes
      }));
      setCoins(newCoins);
      triggerVibration([50, 100, 150]);
      showToast(`Starter Pack Claimed: +${bonusPoints} Points & 1x Standard Box!`, "success");
      return { success: true };
    } catch (err: any) {
      showToast("Failed to apply invite code.", "error");
      return { success: false };
    }
  };

  useEffect(() => {
    if (!athleteProfile?.created_at || athleteProfile.referred_by) {
      setIsTimerLoaded(true);
      return;
    }
    
    const createdAt = new Date(athleteProfile.created_at).getTime();
    const deadline = createdAt + (7 * 24 * 60 * 60 * 1000); 

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = deadline - now;
      
      if (diff <= 0) {
        setTimeLeft(null);
        setIsOfferExpired(true);
        setIsTimerLoaded(true);
        return;
      }
      
      setIsOfferExpired(false);
      const h = Math.floor(diff / (1000 * 60 * 60)); 
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ h, m, s });
      setIsTimerLoaded(true);
    };

    updateTimer();
    const int = setInterval(updateTimer, 1000);
    return () => clearInterval(int);
  }, [athleteProfile]);

  const toggleSportCollapse = (sport: string) => setCollapsedSports(prev => ({ ...prev, [sport]: !prev[sport] }));

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const userId = athleteProfile?.id;
    if (!file || !userId) return;
    setIsUploadingAvatar(true);

    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 500, useWebWorker: true });
      const fileName = `${userId}-avatar.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, compressedFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const urlWithTime = `${data.publicUrl}?t=${new Date().getTime()}`;
      const { error: dbError } = await supabase.from('athletes').update({ avatar_url: urlWithTime }).eq('id', userId);
      if (dbError) throw dbError;

      setAthleteProfile((prev: any) => ({ ...prev, avatar_url: urlWithTime }));
      showToast("Profile picture updated successfully!", "success");
      setIframeKey(prev => prev + 1);
    } catch (error: any) {
      showToast("Failed to upload profile picture.", "error");
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (majorDropdownRef.current && !majorDropdownRef.current.contains(event.target as Node)) setShowMajorDropdown(false);
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) setShowTeamDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true; 
    const searchTeams = async () => {
      if (teamSearchQuery.trim().length < 2 || teamSearchQuery === teamForm.high_school) {
        if (isMounted) { setTeamSearchResults([]); setIsSearchingTeams(false); }
        return;
      }
      if (isMounted) setIsSearchingTeams(true);
      
      const normalizedQuery = teamSearchQuery.trim()
        .replace(/\b(High School|H\.S\.|High)\b/gi, 'HS')
        .trim()
        .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
        .replace(/\bHs\b/g, 'HS');

      const { data, error } = await supabase.from('teams').select('id, high_school_name, city, state, division').ilike('high_school_name', `%${normalizedQuery}%`).limit(6);
      if (!isMounted) return; 
      if (!error && data) setTeamSearchResults(data);
      setIsSearchingTeams(false);
    };
    const timeoutId = setTimeout(searchTeams, 350);
    return () => { isMounted = false; clearTimeout(timeoutId); };
  }, [teamSearchQuery, teamForm.high_school, supabase]); 

  const selectExistingTeam = (team: any) => {
    setTeamForm(prev => ({ ...prev, high_school: team.high_school_name, city: team.city, state: team.state }));
    setTeamSearchQuery(team.high_school_name);
    setShowTeamDropdown(false);
  };

  const handleCreateNewTeam = async () => {
    if (!newTeamName || !newTeamCity || !newTeamState || !newTeamMascot || !newTeamDivision) return showToast("All fields, including Division, are required.", "error");
    
    try {
      const { error } = await supabase.from('teams').insert({
        high_school_name: normalizeHSName(newTeamName),
        city: newTeamCity.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()),
        state: newTeamState,
        mascol: newTeamMascot.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()),
        division: newTeamDivision
      }).select().single();
      if (error) throw error;
      setTeamForm(prev => ({ ...prev, high_school: normalizeHSName(newTeamName), city: newTeamCity, state: newTeamState }));
      setTeamSearchQuery(normalizeHSName(newTeamName));
      setShowAddTeamForm(false); setShowTeamDropdown(false);
      showToast(`${normalizeHSName(newTeamName)} added to database.`, "success");
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('unique')) showToast("This exact High School already exists.", "error");
      else showToast("Failed to create team.", "error");
    }
  };

  useEffect(() => {
    let isMounted = true; 
    async function loadHomebase() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return; 
      if (!session) return router.push('/login');

      const { data: coachData } = await supabase.from('coaches').select('id').eq('id', session.user.id).maybeSingle();
      if (!isMounted) return;
      if (coachData) return router.push('/dashboard/coach');

      const { data: athleteData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();
      if (!isMounted) return;

      if (athleteData) {
        let parsedResume: any = {};
        const masterAccolades: AccoladeObj[] = [];

        const sanitizeAccoladeText = (val: any, categoryStr: string): string => {
          const suffixCat = categoryStr && categoryStr !== 'General' ? ` (${categoryStr})` : '';
          if (!val) return '';
          if (typeof val === 'string') return `${val}${suffixCat}`.trim();
          if (typeof val === 'object') {
            if (val.type === 'HS_Team' || val.type === 'Club_Team') return `${val.placement} - ${val.level} ${val.type === 'HS_Team' ? 'HS Team' : 'Club'}${suffixCat}`;
            if (val.type === 'Individual') return `${val.placement} - ${val.level} Ind.${suffixCat}`;
            if (val.type === 'Honor') return `${val.text}${suffixCat}`;
            if (val.placement && val.type) return `${val.placement} - ${val.type}${suffixCat}`.trim();
            if (val.text) return `${val.text}${suffixCat}`.trim();
          }
          return `Legacy Accolade${suffixCat}`.trim();
        };

        if (athleteData.saved_resume) {
          try {
            parsedResume = typeof athleteData.saved_resume === 'string' ? JSON.parse(athleteData.saved_resume) : athleteData.saved_resume;
            setGpa(parsedResume.gpa || '');
            setIntendedMajor(parsedResume.intendedMajor || '');
            setSchoolPrefs(parsedResume.schoolPrefs || '');
            if (parsedResume.accolades && Array.isArray(parsedResume.accolades)) {
              parsedResume.accolades.forEach((a: any) => { const cleanText = sanitizeAccoladeText(a, 'General'); if (cleanText) masterAccolades.push({ text: cleanText, category: 'General' }); });
            }
          } catch (e: any) {}
        }
        
        if (athleteData.high_school) {
          setTeamForm({ high_school: athleteData.high_school, city: athleteData.city || '', state: athleteData.state || '' });
          setTeamSearchQuery(athleteData.high_school);
        }

        const { data: relationalSports } = await supabase.from('athlete_sports').select('*').eq('athlete_id', athleteData.id);
        if (!isMounted) return; 

        const mappedSportStats: any = {};
        const activeSportsFromDB: string[] = [];

        if (relationalSports) {
          relationalSports.forEach((row: any) => {
            const isActive = row.is_active !== false;
            if (isActive) activeSportsFromDB.push(row.sport_name);
            let parsedMetrics = []; let parsedMetaContext: any = {};
            try { parsedMetrics = Array.isArray(row.metrics) ? row.metrics : JSON.parse(row.metrics); } catch (e: any) {}
            try { parsedMetaContext = row.meta_context ? (typeof row.meta_context === 'string' ? JSON.parse(row.meta_context) : row.meta_context) : {}; } catch (e: any) {}
            
            if (parsedMetaContext.accolades && Array.isArray(parsedMetaContext.accolades)) {
              parsedMetaContext.accolades.forEach((a: any) => { const cleanText = sanitizeAccoladeText(a, row.sport_name); if (cleanText) masterAccolades.push({ text: cleanText, category: row.sport_name }); });
            }

            mappedSportStats[row.sport_name] = { position: row.position || '', level: row.level_of_play || '', metrics: parsedMetrics || [], calculatedRating: row.custom_fit_score || 0, metaContext: parsedMetaContext, isActive: isActive };
          });
          if (activeSportsFromDB.length > 0) athleteData.active_sports = activeSportsFromDB;
        }

        const finalSportsList = athleteData.active_sports || [];
        finalSportsList.forEach((sport: string) => { if (!mappedSportStats[sport]) mappedSportStats[sport] = { position: '', level: '', metrics: [], calculatedRating: 0, metaContext: {}, isActive: true }; });
        setSportStats(mappedSportStats);
        setAccolades(masterAccolades);
        if (masterAccolades.length > 0) setSelectedAccolades(masterAccolades.slice(0, 3).map(a => a.text));

        // Check if daily reward is unclaimed without popping up a modal
        const todayStr = new Date().toLocaleDateString('en-CA');
        const currentDayProgress = athleteData.login_day_progress || (athleteData.current_login_streak || 0); 
        const currentCoins = athleteData.coins || 0;
        const lastLoginStr = athleteData.last_login_date;

        setStreak(currentDayProgress);
        setCoins(currentCoins);
        setCanClaimDaily(lastLoginStr !== todayStr);
        setAthleteProfile(athleteData);

        try {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const { data: viewLogs } = await supabase.from('profile_view_logs').select('created_at, coaches(first_name, last_name, school_name, avatar_url, email)').eq('athlete_id', session.user.id).order('created_at', { ascending: false });
          if (!isMounted) return; 

          if (viewLogs) {
            const uniqueCoaches: any[] = []; const seenIds = new Set();
            for (const log of viewLogs as any[]) {
              const coachData = Array.isArray(log.coaches) ? log.coaches[0] : log.coaches;
              const cId = coachData ? coachData.school_name : null; 
              if (cId && !seenIds.has(cId) && coachData) { seenIds.add(cId); uniqueCoaches.push(coachData); }
            }
            setDailyViews(viewLogs.filter((log: any) => new Date(log.created_at) >= today).length);
            setMonthlyViews(viewLogs.filter((log: any) => new Date(log.created_at) >= firstOfMonth).length);
            setAllRecentViewers(uniqueCoaches);
            setRecentViewers(uniqueCoaches.slice(0, 3)); 
          }
        } catch (e: any) {}
      }

      const { data: savedCollegesData } = await supabase.from('saved_colleges').select('id, college_id, universities (*)').eq('athlete_id', session.user.id);
      if (!isMounted) return; 
      if (savedCollegesData) { setSavedColleges(savedCollegesData); if (savedCollegesData.length > 0) setIsCollegesOpen(true); }
      setLoading(false);
    }
    loadHomebase();
    return () => { isMounted = false; };
  }, [supabase, router]); 

  const handleSaveTeamJoin = async () => {
    if (!teamForm.high_school || !teamForm.state) return showToast("Please verify your school.", "error");
    try {
      await supabase.from('athletes').update({ high_school: teamForm.high_school, city: teamForm.city, state: teamForm.state }).eq('id', athleteProfile.id);
      setAthleteProfile({ ...athleteProfile, high_school: teamForm.high_school, city: teamForm.city, state: teamForm.state });
      setIsTeamJoinModalOpen(false); showToast(`Welcome to the ${teamForm.high_school} roster!`, "success");
    } catch (err: any) { showToast("Failed to join team.", "error"); }
  };

  const syncSportToSupabase = async (sport: string, updatedData: any, isNew: boolean = false) => {
    if (!athleteProfile?.id) return;
    const genderKey = athleteProfile?.gender === 'Girls' || athleteProfile?.gender === 'Women' ? 'Girls' : 'Boys';
    const spec = SPORT_CONFIGS_META[sport];
    let rating = 0;
    const TEAM_SPORTS = ['Football', 'Soccer', 'Lacrosse', 'Field Hockey', 'Basketball', 'Volleyball', 'Baseball', 'Softball', 'Ice Hockey', 'Water Polo'];

    const getAccoladeValue = (acc: any) => {
      let val = 0; const placeStr = String(acc.placement || '');
      if (acc.type === 'Honor') return 0; 
      if (acc.level === 'National') { if (placeStr.includes('1st')) val = 95; else if (placeStr.includes('2nd') || placeStr.includes('3rd') || placeStr.includes('Top 5')) val = 90; else val = 85; }
      else if (acc.level === 'State') { if (placeStr.includes('1st')) val = 85; else if (placeStr.includes('2nd') || placeStr.includes('3rd') || placeStr.includes('Top 5')) val = 75; else if (placeStr.includes('16') || placeStr.includes('8') || parseInt(placeStr) <= 16) val = 65; else val = 50; }
      else if (acc.level === 'Regional') { if (placeStr.includes('1st')) val = 60; else if (placeStr.includes('2nd') || placeStr.includes('3rd')) val = 50; else val = 40; }
      else if (acc.level === 'Conference / District') { if (placeStr.includes('1st')) val = 45; else if (placeStr.includes('2nd') || placeStr.includes('3rd')) val = 35; else val = 25; }
      else val = 10;
      if (acc.type === 'HS_Team' || acc.type === 'Club_Team') { if (acc.contribution === 'Not Starting / Reserve') val *= 0.3; else if (acc.contribution === 'Started Some of the Time') val *= 0.7; }
      return val;
    };

    const accolades = updatedData.metaContext?.accolades || [];
    const accoladeScores = accolades.map(getAccoladeValue).sort((a: number, b: number) => b - a);
    let totalAccoladeBonus = 0;
    if (accoladeScores.length > 0) totalAccoladeBonus += accoladeScores[0];        
    if (accoladeScores.length > 1) totalAccoladeBonus += accoladeScores[1] * 0.5;   
    if (accoladeScores.length > 2) totalAccoladeBonus += accoladeScores[2] * 0.25;  

    if (TEAM_SPORTS.includes(sport)) {
      rating = Math.round(totalAccoladeBonus);
      updatedData.calculatedRating = Math.min(99, Math.max(0, rating));
    } else if (!['Cross Country', 'Swimming & Diving', 'Track & Field', 'Gymnastics', 'Bowling', 'Fencing'].includes(sport) && spec) {
      let highestMetricScore = 0; let totalMetricScore = 0; let validMetricCount = 0;
      if (updatedData.metrics && updatedData.metrics.length > 0) {
        updatedData.metrics.forEach((m: {name: string, value: string}) => {
          const evalResult = evaluateMetric(genderKey, sport, m.name, m.value, updatedData.level);
          if (evalResult) { validMetricCount++; totalMetricScore += evalResult.score; if (evalResult.score > highestMetricScore) highestMetricScore = evalResult.score; }
        });
      }
      if (spec.requiresLevel) {
        if (validMetricCount > 0) rating = Math.round(((totalMetricScore / validMetricCount) * 0.4) + (highestMetricScore * 0.6) * 0.4 + (totalAccoladeBonus * 0.6));
        else rating = Math.max(0, totalAccoladeBonus);
      } else {
        rating = validMetricCount > 0 ? highestMetricScore : 0;
        rating += Math.min(totalAccoladeBonus * 0.3, 15);
      }
      updatedData.calculatedRating = Math.min(99, Math.max(0, rating));
    }
    setSportStats(prev => ({ ...prev, [sport]: updatedData }));

    const payload: any = { athlete_id: athleteProfile.id, sport_name: sport, position: updatedData.position || null, level_of_play: updatedData.level || null, athleticism_tier: null, metrics: updatedData.metrics || [], custom_fit_score: updatedData.calculatedRating, meta_context: updatedData.metaContext || {}, is_active: updatedData.isActive !== false };
    const { error } = await supabase.from('athlete_sports').upsert(payload, { onConflict: 'athlete_id, sport_name' });
    if (error && error.message.includes('is_active')) { delete payload.is_active; await supabase.from('athlete_sports').upsert(payload, { onConflict: 'athlete_id, sport_name' }); }
    if (!isNew) setIframeKey(prev => prev + 1);
  };

  const setSportActiveState = async (sportName: string, isActive: boolean) => {
    if (!athleteProfile?.id) return;
    try {
      await supabase.from('athlete_sports').update({ is_active: isActive }).eq('athlete_id', athleteProfile.id).eq('sport_name', sportName);
      let newSports = [...(athleteProfile.active_sports || [])];
      if (isActive && !newSports.includes(sportName)) newSports.push(sportName);
      if (!isActive) newSports = newSports.filter((s: string) => s !== sportName);
      await supabase.from('athletes').update({ active_sports: newSports }).eq('id', athleteProfile.id);
      setSportStats(prev => ({ ...prev, [sportName]: { ...(prev[sportName] || {}), isActive } }));
      setAthleteProfile((prev: any) => ({ ...prev, active_sports: newSports }));
      showToast(`${sportName} has been ${isActive ? 'enabled' : 'disabled'}.`, 'success');
      setIframeKey(prev => prev + 1);
    } catch (e) { showToast('Failed to update sport status.', 'error'); }
  };

  const handleToggleSportDropdown = async (sportName: string) => {
    if (!athleteProfile?.id) return;
    try {
      const currentStats = sportStats[sportName];
      
      if (currentStats) {
        const newIsActive = !currentStats.isActive;
        await setSportActiveState(sportName, newIsActive);
      } else {
        const blankStats = { position: '', level: '', metrics: [], metaContext: {}, calculatedRating: 0, isActive: true };
        
        const currentSports = athleteProfile.active_sports || [];
        const newSports = [...currentSports];
        if (!newSports.includes(sportName)) newSports.push(sportName);
        setAthleteProfile({ ...athleteProfile, active_sports: newSports });
        await supabase.from('athletes').update({ active_sports: newSports }).eq('id', athleteProfile.id);

        await syncSportToSupabase(sportName, blankStats, true);
        showToast(`${sportName} added to your profile.`, 'success');
      }
    } catch (err: any) {
      showToast("Failed to update sports alignment", "error");
    }
  };

  const confirmDeleteSport = async () => {
    if (!athleteProfile?.id || !sportToDelete) return;
    try {
      await supabase.from('athlete_sports').delete().eq('athlete_id', athleteProfile.id).eq('sport_name', sportToDelete);
      const newSports = (athleteProfile.active_sports || []).filter((s: string) => s !== sportToDelete);
      await supabase.from('athletes').update({ active_sports: newSports }).eq('id', athleteProfile.id);
      setSportStats(prev => { const updated = { ...prev }; delete updated[sportToDelete]; return updated; });
      setAthleteProfile((prev: any) => ({ ...prev, active_sports: newSports }));
      showToast(`${sportToDelete} data has been completely removed.`, 'success');
      setSportToDelete(null); setIframeKey(prev => prev + 1);
    } catch (e) { showToast('Failed to delete sport stats.', 'error'); setSportToDelete(null); }
  };

  const handleRemoveCollegeDashboard = async (savedId: string) => {
    try { await supabase.from('saved_colleges').delete().eq('id', savedId); setSavedColleges(prev => prev.filter(c => c.id !== savedId)); showToast("College removed.", "success"); } catch (err: any) {}
  };

  const autoSavePortfolio = async (overrides?: Partial<{ gpa: string, intendedMajor: string, accolades: string[], schoolPrefs: string }>) => {
    if (!athleteProfile?.id) return;
    try {
      const currentResume = typeof athleteProfile.saved_resume === 'string' ? JSON.parse(athleteProfile.saved_resume) : (athleteProfile.saved_resume || {});
      const { sportStats: legacyStats, ...cleanResume } = currentResume;
      const payload = { ...cleanResume, gpa: overrides?.gpa ?? gpa, intendedMajor: overrides?.intendedMajor ?? intendedMajor, accolades: overrides?.accolades ?? accolades.filter(a => a.category === 'General').map(a => a.text), schoolPrefs: overrides?.schoolPrefs ?? schoolPrefs };
      await supabase.from('athletes').update({ saved_resume: payload }).eq('id', athleteProfile.id);
      setAthleteProfile((prev: any) => ({ ...prev, saved_resume: payload }));
      setIframeKey(prev => prev + 1);
    } catch (err: any) {}
  };

  const addAccolade = () => {
    if (!newAccolade.trim() || accolades.some(a => a.text === newAccolade.trim())) return;
    const newObj = { text: newAccolade.trim(), category: 'General' };
    const newAccs = [...accolades, newObj];
    setAccolades(newAccs); setNewAccolade('');
    if (selectedAccolades.length < 3) setSelectedAccolades([...selectedAccolades, newObj.text]);
    autoSavePortfolio({ accolades: newAccs.filter(a => a.category === 'General').map(a => a.text) });
    showToast('Saved to Academic Profile', "success");
  };

  const removeAccolade = (accObj: AccoladeObj) => {
    const newAccs = accolades.filter(a => a.text !== accObj.text);
    setAccolades(newAccs); setSelectedAccolades(prev => prev.filter(a => a !== accObj.text));
    if (accObj.category === 'General') { autoSavePortfolio({ accolades: newAccs.filter(a => a.category === 'General').map(a => a.text) }); } 
    else {
      const sportAccs = newAccs.filter(a => a.category === accObj.category).map(a => a.text);
      const currentStats = sportStats[accObj.category] || { metaContext: {} };
      const updatedStats = { ...currentStats, metaContext: { ...currentStats.metaContext, accolades: sportAccs }};
      setSportStats(prev => ({ ...prev, [accObj.category]: updatedStats }));
      syncSportToSupabase(accObj.category, updatedStats);
    }
    showToast("Honor removed from record.", "success");
  };

  const handleDownloadSocialCard = async () => {
    setIsExportingCard(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('social-card-export');
      if (!element) throw new Error("Card not found.");
      const canvas = await html2canvas(element, { backgroundColor: null, scale: 3, useCORS: true });
      const link = document.createElement('a'); link.download = `${athleteProfile?.last_name}_RecruitingProfile.png`; link.href = canvas.toDataURL('image/png'); link.click();
      showToast("Graphic exported successfully!", "success");
    } catch (err: any) { showToast("Failed to export graphic.", "error"); } finally { setIsExportingCard(false); }
  };

  const userSports = Object.keys(sportStats).filter(s => sportStats[s].isActive !== false);
  const disabledSportsList = Object.keys(sportStats).filter(s => sportStats[s].isActive === false);
  const primarySportQuery = userSports.length > 0 ? userSports[0] : 'general';
  const genderKey = athleteProfile?.gender === 'Girls' || athleteProfile?.gender === 'Women' ? 'Girls' : 'Boys';

  const theme = useMemo(() => getThemeConfig(athleteProfile?.equipped_card), [athleteProfile?.equipped_card]);

  const allAvailableMetrics = useMemo(() => {
    const list: any[] = [];
    userSports.forEach(sport => {
      const stats = sportStats[sport];
      if (stats?.metrics && stats.metrics.length > 0) {
        stats.metrics.forEach((m: any, metricIdx: number) => {
          if (sport === 'Track & Field') {
            const score = m.score || evaluateMetric(genderKey, 'Track & Field', m.name, m.value, 'Varsity')?.score || stats.calculatedRating || 0; 
            list.push({ id: `track-${m.name}-${metricIdx}`, label: m.name, value: m.value, source: 'Track', score, ...getTierStyles(score) });
          } else if (sport === 'Swimming & Diving') {
            const score = m.score || evaluateMetric(genderKey, sport, m.name, m.value, 'Varsity')?.score || stats.calculatedRating || 0; 
            list.push({ id: `swim-${m.name}-${metricIdx}`, label: m.name, value: m.value, source: 'Swim', score, ...getTierStyles(score) });
          } else {
            const score = m.score || evaluateMetric(genderKey, sport, m.name, m.value, stats.level || 'Varsity')?.score || stats.calculatedRating || 0;
            list.push({ id: `${sport}-${m.name}-${metricIdx}`, label: m.name, value: m.value, source: sport, score, ...getTierStyles(score) });
          }
        });
      }
    });
    return list.sort((a, b) => b.score - a.score); 
  }, [sportStats, userSports, genderKey]);

  const readiness = useMemo(() => {
    let score = 0; let nextQuest = "Profile complete! You are fully optimized for the Matchmaker.";
    if (athleteProfile?.first_name && athleteProfile?.last_name) score += 10;
    if (athleteProfile?.trust_level === 1) score += 10; else if (score >= 10) nextQuest = "Verify your account identity to earn your Verified Badge.";
    if (athleteProfile?.high_school && athleteProfile?.state) score += 10; else if (score >= 20) nextQuest = "Search and join your High School team roster.";
    if (gpa) score += 15; else if (score >= 30) nextQuest = "Add your Unweighted GPA below to boost your Matchmaker visibility.";
    if (intendedMajor) score += 15; else if (score >= 45) nextQuest = "Define an Intended Major below to unlock academic matching.";
    if (accolades.length > 0) score += 15; else if (score >= 60) nextQuest = "Log your first Season Accolade to prove your leadership.";
    if (allAvailableMetrics.length > 0) score += 25; else if (score >= 75) nextQuest = "Sync a sport metric to activate the Recruit Engine.";
    return { score: Math.min(100, score), nextQuest };
  }, [athleteProfile, gpa, intendedMajor, accolades, allAvailableMetrics]);

  useEffect(() => { if (selectedMetrics.length === 0 && allAvailableMetrics.length > 0) setSelectedMetrics(allAvailableMetrics.slice(0, 4).map(m => m.label)); }, [allAvailableMetrics, selectedMetrics.length]);

  const handleToggleMetric = (label: string) => {
    if (selectedMetrics.includes(label)) setSelectedMetrics(selectedMetrics.filter(e => e !== label));
    else { if (selectedMetrics.length >= 4) return showToast("Max 4 metrics on the graphic.", "error"); setSelectedMetrics([...selectedMetrics, label]); }
  };

  const handleToggleAccolade = (acc: string) => {
    if (selectedAccolades.includes(acc)) setSelectedAccolades(selectedAccolades.filter(a => a !== acc));
    else { if (selectedAccolades.length >= 3) return showToast("Max 3 Accolades on the graphic.", "error"); setSelectedAccolades([...selectedAccolades, acc]); }
  };

  const getDisplayRating = (sport: string) => {
    const stats = sportStats[sport] || { calculatedRating: 0 };
    let displayRating = stats.calculatedRating || 0;
    if (sport === 'Track & Field' || sport === 'Swimming & Diving') {
      const dynamicMetrics = allAvailableMetrics.filter(m => m.source === (sport === 'Track & Field' ? 'Track' : 'Swim') || m.source === sport);
      if (dynamicMetrics.length > 0) displayRating = Math.max(...dynamicMetrics.map(m => m.score), displayRating);
    }
    return displayRating;
  };

  // Sort Saved Colleges in JS for 1-Tap Comparison
  const sortedSavedColleges = useMemo(() => {
    const enriched = savedColleges
      .filter((saved: any) => Boolean(saved?.universities))
      .map((saved: any) => {
        const college = saved.universities;
        const stats = getRealStats(college);
        return {
          savedId: saved.id,
          college,
          stats,
          numericMatch: Number(stats.matchScore || 0),
          numericTuition: parseNumericStat(stats.tuitionStr, 999999),
          numericSalary: parseNumericStat(stats.salaryStr, 0),
        };
      });

    return enriched.sort((a, b) => {
      if (collegeSortBy === 'tuition') return a.numericTuition - b.numericTuition;
      if (collegeSortBy === 'salary') return b.numericSalary - a.numericSalary;
      return b.numericMatch - a.numericMatch;
    });
  }, [savedColleges, collegeSortBy]);

  const sharedPerformanceState = { athleteProfile, sportStats, userSports, disabledSportsList, collapsedSports, allAvailableMetrics, selectedMetrics, selectedAccolades, newAccolade, accolades, schoolPrefs, gpa, intendedMajor, showMajorDropdown, socialSubTab, isExportingCard, dailyViews, monthlyViews, allRecentViewers, recentViewers, showAllViewersModal, showImpressionTooltip, gatingMode, iframeKey, primarySportQuery, genderKey, sportMenuOpen };
  const sharedPerformanceActions = { setSocialSubTab, toggleSportCollapse, getDisplayRating, setSportMenuOpen, setSportActiveState, setSportToDelete, syncSportToSupabase, showToast, setGpa, setIntendedMajor, setShowMajorDropdown, autoSavePortfolio, setNewAccolade, addAccolade, removeAccolade, setSchoolPrefs, setIframeKey, handleToggleMetric, handleToggleAccolade, handleDownloadSocialCard, setShowImpressionTooltip, setShowAllViewersModal, handleContactCoach, handleToggleSportDropdown };

  const unclaimedReferralsCount = Math.max(0, (athleteProfile?.verified_referrals || 0) - (athleteProfile?.claimed_referrals || 0));
  const unclaimedRewardsCount = (canClaimDaily ? 1 : 0) + unclaimedReferralsCount;

  const RenderHomeTab = useMemo(() => (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative z-10">
      
      {/* 🚀 UPGRADED ACTION GRID NAVIGATOR 🚀 */}
      <div className={`${theme.sectionBg} rounded-[2rem] p-5 sm:p-7 ${theme.sectionShadow} border ${theme.sectionBorder} flex flex-col items-center justify-center transition-all duration-500 max-w-xl mx-auto w-full relative z-20`}>
        
        <Link href="/feed" className="w-full mb-3 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-base sm:text-lg text-white transition-all shadow-lg bg-gradient-to-r from-blue-500 to-cyan-400 hover:scale-[1.01] active:scale-95">
          <TrendingUp className="w-5 h-5 shrink-0" /> Get Recruited
        </Link>
        
        <div className="grid grid-cols-2 gap-3 mb-3 w-full">
          <Link href="/dashboard/email-builder" className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm text-white transition-all shadow-md bg-gradient-to-r from-blue-600 to-blue-500 hover:scale-[1.01] active:scale-95">
            <Mail className="w-4 h-4 shrink-0" /> Email Studio
          </Link>
          <Link href={`/athlete/${athleteProfile?.custom_slug || athleteProfile?.id}`} target="_blank" className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm text-white transition-all shadow-md bg-gradient-to-r from-blue-500 to-cyan-500 hover:scale-[1.01] active:scale-95">
            <Globe className="w-4 h-4 shrink-0" /> Public Profile
          </Link>
        </div>

        {/* Team HQ + Rewards Row */}
        <div className="grid grid-cols-2 gap-3 mb-6 w-full">
          <button
            type="button"
            onClick={() => { if (!athleteProfile?.high_school) setIsTeamJoinModalOpen(true); else router.push('/dashboard/team'); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm text-white transition-all shadow-md bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <Users className="w-4 h-4 shrink-0" /> Team HQ
          </button>

          <button
            type="button"
            onClick={() => goToTab('rewards')}
            className="relative w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm text-white transition-all shadow-md bg-gradient-to-r from-emerald-600 to-teal-500 hover:scale-[1.01] active:scale-95 cursor-pointer"
          >
            <Gift className="w-4 h-4 shrink-0" />
            <span>Rewards</span>
            {unclaimedRewardsCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center shadow-[0_0_12px_rgba(225,29,72,0.9)] border-2 border-[#0B1221] animate-bounce">
                {unclaimedRewardsCount}
              </span>
            )}
          </button>
        </div>
        
        {/* Quick Stats Bar */}
        <div className={`w-full border-t ${theme.isDark ? 'border-white/10' : 'border-slate-300'} pt-5 flex flex-row items-center justify-around gap-4`}>
          <div className="flex flex-col items-center text-center">
            <span className={`text-2xl sm:text-3xl font-bold tabular-nums leading-none ${theme.textHeader}`}>
              {athleteProfile?.profile_views || 0}
            </span>
            <span className={`text-xs font-medium ${theme.textMuted} mt-1.5`}>
              Profile Clicks
            </span>
          </div>

          <div className="flex flex-col items-center text-center">
            {isProUnlocked ? (
              <span className={`text-2xl sm:text-3xl font-bold tabular-nums leading-none ${theme.textHeader}`}>
                {athleteProfile?.search_appearances || 0}
              </span>
            ) : (
              <Link
                href="/pro"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-semibold hover:scale-105 transition-transform"
              >
                <Lock className="w-3 h-3" /> PRO
              </Link>
            )}
            <span className={`text-xs font-medium ${theme.textMuted} mt-1.5`}>
              Feed Impressions
            </span>
          </div>

          <button
            onClick={() => { goToTab('social'); setSocialSubTab('analytics'); }}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 shadow-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shrink-0 border border-white/20 cursor-pointer"
            title="Open Full Analytics"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 📊 INTEGRATED SCOUTING & COACH ANALYTICS HUB 📊 */}
      <div className={`${theme.sectionBg} rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 ${theme.sectionShadow} border ${theme.sectionBorder} transition-all duration-500 relative overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.35)] shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${theme.textHeader}`}>
                  Scouting & Coach Analytics
                </h2>
                {isProUnlocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 text-cyan-300">
                    <Crown className="w-3 h-3 text-cyan-400" /> PRO Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-slate-400">
                    <Lock className="w-3 h-3" /> PRO Feature
                  </span>
                )}
              </div>
              <p className={`text-xs font-normal ${theme.textMuted} mt-0.5 leading-snug`}>
                Real-time recruiting visibility and college coach profile views
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { goToTab('social'); setSocialSubTab('analytics'); }}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            Full Breakdown <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mb-5">
          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-300">
                Profile Clicks
              </span>
              <Eye className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-white leading-none">
                {athleteProfile?.profile_views || 0}
              </span>
              <span className="text-xs font-normal text-blue-200/70">
                All-time
              </span>
            </div>
          </div>

          <div className="md:col-span-3 relative rounded-2xl overflow-hidden border border-white/10 bg-[#020617]/50 p-4">
            {!isProUnlocked && (
              <div className="absolute inset-0 z-20 bg-[#020617]/85 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0 hidden sm:flex">
                    <Lock className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      Feed Impressions & Coach Viewers Locked
                    </p>
                    <p className="text-xs font-normal text-slate-400 mt-0.5 leading-snug">
                      Upgrade to PRO to unlock Feed Impressions, daily/monthly views, and see which coaches viewed you.
                    </p>
                  </div>
                </div>
                <Link
                  href="/pro"
                  className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105 transition-transform shrink-0 whitespace-nowrap"
                >
                  Unlock PRO
                </Link>
              </div>
            )}

            <div className={`grid grid-cols-3 gap-3 ${!isProUnlocked ? 'opacity-20 blur-[4px] select-none pointer-events-none' : ''}`}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-400">Impressions</span>
                  <Search className="w-3.5 h-3.5 text-emerald-400 hidden sm:block" />
                </div>
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-white leading-none">
                  {isProUnlocked ? (athleteProfile?.search_appearances || 0) : '—'}
                </span>
              </div>

              <div className="border-l border-white/10 pl-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-400">Today</span>
                  <Activity className="w-3.5 h-3.5 text-blue-400 hidden sm:block" />
                </div>
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-white leading-none">
                  {isProUnlocked ? (dailyViews || 0) : '—'}
                </span>
              </div>

              <div className="border-l border-white/10 pl-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-400">This Month</span>
                  <Calendar className="w-3.5 h-3.5 text-indigo-400 hidden sm:block" />
                </div>
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-white leading-none">
                  {isProUnlocked ? (monthlyViews || 0) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isProUnlocked && (
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <UserCircle2 className="w-4 h-4 text-cyan-400" /> Recent College Coach Viewers
              </span>
              {allRecentViewers.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllViewersModal(true)}
                  className="text-xs font-semibold text-cyan-400 hover:text-white bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-lg transition-colors"
                >
                  View All ({allRecentViewers.length})
                </button>
              )}
            </div>

            {recentViewers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentViewers.map((coach: any, idx: number) => (
                  <div key={`home-coach-${idx}`} className="flex items-center justify-between p-3 rounded-xl bg-[#020617]/60 border border-white/10 hover:border-cyan-500/30 transition-all gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarWithBorder avatarUrl={coach.avatar_url} borderId="none" sizeClasses="w-9 h-9 shrink-0" userRole="coach" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">Coach {coach.last_name}</p>
                        <p className="text-[11px] font-normal text-slate-400 truncate">{coach.school_name}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleContactCoach(coach.email)}
                      className="w-8 h-8 rounded-lg bg-blue-500/15 hover:bg-blue-500 text-cyan-300 hover:text-white flex items-center justify-center shrink-0 transition-colors border border-blue-500/20"
                      title={`Email Coach ${coach.last_name}`}
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-normal text-slate-400 italic bg-[#020617]/40 border border-dashed border-white/10 rounded-xl p-3.5 text-center">
                No verified college coach views recorded yet. Boost your profile on the Featured Feed to get discovered!
              </p>
            )}
          </div>
        )}
      </div>

      {!athleteProfile?.referred_by && !isOfferExpired && isTimerLoaded && (
        <div className="rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 border border-blue-500/50 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6 transition-all duration-500 relative overflow-hidden group shadow-[0_0_40px_rgba(59,130,246,0.2)] bg-gradient-to-br from-slate-900 via-[#0B1221] to-cyan-950/40">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 blur-[50px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 flex-1 w-full text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-400 p-2 rounded-xl shadow-lg shadow-blue-500/30">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                New Athlete Starter Pack
              </h3>
            </div>
            
            <p className="text-sm font-normal text-blue-100/80 max-w-md mx-auto lg:mx-0 leading-relaxed">
              Invited by a teammate? Enter their custom code to link accounts, boost their squad, and instantly claim <span className="text-amber-400 font-semibold">{500 * proPointMultiplier} Points</span> & <span className="text-cyan-400 font-semibold">1x Standard Box</span>!
            </p>

            {timeLeft && (
              <div className="mt-4 flex items-center justify-center lg:justify-start gap-3">
                <span className="text-xs font-semibold text-cyan-400 animate-pulse">Expires in:</span>
                <div className="flex gap-1.5 font-mono text-base font-bold tabular-nums text-white">
                  <div className="bg-[#020617]/80 px-2 py-1 rounded-lg border border-cyan-500/30 min-w-[2.5rem] text-center">{String(timeLeft.h).padStart(2, '0')}</div>
                  <span className="text-cyan-400">:</span>
                  <div className="bg-[#020617]/80 px-2 py-1 rounded-lg border border-cyan-500/30 min-w-[2.5rem] text-center">{String(timeLeft.m).padStart(2, '0')}</div>
                  <span className="text-cyan-400">:</span>
                  <div className="bg-[#020617]/80 px-2 py-1 rounded-lg border border-cyan-500/30 min-w-[2.5rem] text-center">{String(timeLeft.s).padStart(2, '0')}</div>
                </div>
              </div>
            )}
          </div>

          <div className="relative z-10 flex flex-col w-full lg:w-auto gap-3 shrink-0">
            <input
              type="text"
              value={homeReferralCode}
              onChange={(e) => setHomeReferralCode(e.target.value)}
              placeholder="Enter invite code..."
              className="w-full lg:w-64 bg-[#020617]/80 border border-blue-500/30 text-white focus:border-cyan-400 focus:ring-cyan-500 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 transition-all placeholder:font-normal placeholder:text-blue-200/50 shadow-inner"
            />
            <button
              onClick={async () => {
                setIsSubmittingHomeRef(true);
                const res = await handleReferralSubmit(homeReferralCode);
                setIsSubmittingHomeRef(false);
                if (res.success) setHomeReferralCode('');
              }}
              disabled={isSubmittingHomeRef || !homeReferralCode.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 border border-cyan-400/50"
            >
              {isSubmittingHomeRef ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>Claim Starter Pack <Sparkles className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      )}

      {/* 🚀 INLINE WEEKLY STREAK WIDGET 🚀 */}
      <div className={`${theme.sectionBg} rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 ${theme.sectionShadow} border ${theme.sectionBorder} transition-all duration-500 relative overflow-hidden group`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10">
          <div>
            <h3 className={`text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 ${theme.textHeader}`}>
              <Flame className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" /> Current Login Streak
            </h3>
            <p className={`text-xs sm:text-sm font-normal ${theme.textMuted} mt-0.5`}>
              Cycle {Math.floor(Math.max(0, streak) / 28) + 1} • {((1 + (Math.floor(Math.max(0, streak) / 28) * 0.5)) * proPointMultiplier).toFixed(1)}x Multiplier {athleteProfile?.is_premium && '(3x PRO)'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {canClaimDaily && (
              <button
                type="button"
                onClick={() => goToTab('rewards')}
                className="relative bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
              >
                <Gift className="w-4 h-4" />
                <span>Claim Today's Loot</span>
                <span className="ml-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow">
                  1
                </span>
              </button>
            )}

            <div className="bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-2 rounded-xl flex items-center justify-center sm:justify-start gap-2 shrink-0">
              <span className="text-xs font-medium text-cyan-400/80">Day</span>
              <span className="text-lg font-bold tabular-nums text-cyan-400 leading-none">{streak}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2 relative z-10 overscroll-x-contain scroll-pl-4">
          {[...Array(7)].map((_, i) => {
            const targetProgress = canClaimDaily ? streak + 1 : Math.max(1, streak);
            const dayNumInCycle = (Math.max(0, targetProgress - 1) % 28) + 1;
            const currentWeek = Math.floor((dayNumInCycle - 1) / 7);
            const weekStartDay = currentWeek * 7 + 1;
            const dayNum = weekStartDay + i;

            const isPast = canClaimDaily ? dayNum < dayNumInCycle : dayNum <= dayNumInCycle;
            const isToday = dayNum === dayNumInCycle;

            const rewardData = getRewardForDay(dayNum);
            const cycleMultiplier = 1 + (Math.floor(Math.max(0, targetProgress - 1) / 28) * 0.5);
            const totalReward = Math.round(rewardData.baseCoins * cycleMultiplier * proPointMultiplier);

            return (
              <div
                key={dayNum}
                onClick={() => { if (isToday && canClaimDaily) goToTab('rewards'); }}
                className={`relative snap-start scroll-ml-4 p-3 rounded-2xl border-2 flex flex-col items-center justify-between gap-2 text-center transition-all min-w-[78px] flex-1 ${
                  isPast
                    ? 'bg-[#020617]/50 border-blue-900/30 opacity-60'
                    : isToday && canClaimDaily
                      ? 'bg-emerald-900/30 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-[1.02] z-10 cursor-pointer'
                      : isToday
                        ? 'bg-cyan-900/20 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-[1.02] z-10'
                        : theme.isDark
                          ? 'bg-blue-950/20 border-blue-500/10'
                          : 'bg-white border-blue-100'
                }`}
              >
                {isPast && <div className="absolute top-1.5 right-1.5"><CheckCircle2 className="w-3 h-3 text-cyan-500"/></div>}
                {isToday && canClaimDaily && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center shadow">
                    1
                  </span>
                )}
                <span className={`text-[11px] font-semibold shrink-0 ${isToday ? 'text-cyan-400' : theme.textMuted}`}>Day {dayNum}</span>

                <div className={`w-8 h-8 rounded-full ${theme.isDark ? 'bg-[#020617]/80 border-blue-900/50' : 'bg-blue-50 border-blue-100'} flex items-center justify-center shrink-0 border ${rewardData.glow && !isPast ? rewardData.glow : ''}`}>
                  {rewardData.tier && !isPast ? (
                    <LootBoxVisual tier={rewardData.tier} size="sm" />
                  ) : (
                    <div className={`w-4 h-4 shrink-0 ${isPast ? 'text-blue-500/50' : rewardData.iconColor}`}>
                      <rewardData.Icon className="w-full h-full" />
                    </div>
                  )}
                </div>

                <span className={`font-bold tabular-nums mt-auto text-xs ${isToday ? 'text-cyan-400' : theme.isDark ? 'text-blue-300' : 'text-blue-500'}`}>+{totalReward}</span>
              </div>
            );
          })}
        </div>
      </div>

      {unclaimedRewardsCount > 0 && (
        <div className="bg-gradient-to-r from-emerald-600/20 via-teal-500/15 to-cyan-500/10 border border-emerald-500/50 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.2)] gap-4 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-4">
            <div className="relative bg-emerald-500/20 p-3 rounded-full shadow-inner shrink-0">
              <Gift className="w-6 h-6 text-emerald-400" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow">
                {unclaimedRewardsCount}
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">
                You Have {unclaimedRewardsCount} Unclaimed {unclaimedRewardsCount === 1 ? 'Reward' : 'Rewards'}!
              </h4>
              <p className="text-xs sm:text-sm font-normal text-emerald-200/80 leading-snug mt-0.5">
                Head to your Rewards Hub to claim your {canClaimDaily ? 'daily login points' : 'referral milestone loot'}{athleteProfile?.is_premium ? ' with your 3x PRO Multiplier' : ''}.
              </p>
            </div>
          </div>
          <button onClick={() => goToTab('rewards')} className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#020617] text-sm font-bold px-6 py-3 rounded-xl transition-transform active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.4)] shrink-0 flex items-center justify-center gap-2 cursor-pointer">
            Claim Rewards <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 🎓 CLEAN, UNCRAMPED TARGET COLLEGES BOARD (ZERO TEXT TRUNCATION) 🎓 */}
      <div className={`${theme.sectionBg} rounded-2xl sm:rounded-[2rem] ${theme.sectionShadow} border ${theme.sectionBorder} overflow-hidden transition-all duration-300`}>
        <button
          type="button"
          onClick={() => setIsCollegesOpen(!isCollegesOpen)}
          className={`w-full flex items-center justify-between p-5 md:p-7 bg-transparent hover:${theme.subCardBg} transition-colors gap-3.5 cursor-pointer`}
        >
          <div className="flex items-center gap-3.5 text-left min-w-0 flex-1">
            <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl border flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)] ${theme.isDark ? 'bg-blue-600/20 border-blue-500/40' : 'bg-blue-100 border-blue-300'}`}>
              <Bookmark className={`w-5 h-5 ${theme.isDark ? 'text-blue-400 fill-blue-400/30' : 'text-blue-600 fill-blue-600/30'}`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${theme.textHeader}`}>
                  Target Colleges Board
                </h2>
                <span className="bg-blue-500/20 border border-blue-500/30 text-cyan-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {savedColleges.length}
                </span>
              </div>
              <p className={`text-xs font-normal mt-0.5 leading-snug ${theme.textMuted}`}>
                Compare athletic fit, net cost, and 10-year salary side-by-side
              </p>
            </div>
          </div>

          <div className="shrink-0 p-2 rounded-full bg-white/5 border border-white/10">
            {isCollegesOpen ? (
              <ChevronUp className={`w-5 h-5 ${theme.textMuted}`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${theme.textMuted}`} />
            )}
          </div>
        </button>

        {isCollegesOpen && (
          <div className={`p-4 sm:p-6 md:p-7 border-t ${theme.isDark ? 'border-blue-500/20 bg-[#020617]/50' : 'border-blue-200 bg-blue-50/50'} animate-in fade-in slide-in-from-top-4 duration-300`}>
            
            {/* Top Controls: Single-Line Segmented Sort Pills + Find More Colleges CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              {sortedSavedColleges.length > 1 ? (
                <div className="grid grid-cols-3 gap-1 bg-[#0B1221] p-1 rounded-xl border border-white/10 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setCollegeSortBy('match')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      collegeSortBy === 'match'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Best Match
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollegeSortBy('tuition')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      collegeSortBy === 'tuition'
                        ? 'bg-cyan-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lowest Cost
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollegeSortBy('salary')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      collegeSortBy === 'salary'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Highest ROI
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Scale className={`w-4 h-4 ${theme.iconColor}`} />
                  <span className={`text-xs font-semibold ${theme.textMuted}`}>
                    Saved Programs
                  </span>
                </div>
              )}

              <Link
                href="/search"
                className="text-xs sm:text-sm font-semibold w-full sm:w-auto px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 justify-center bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shrink-0"
              >
                <span>Find More Colleges</span>
                <Search className="w-4 h-4" />
              </Link>
            </div>

            {sortedSavedColleges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {sortedSavedColleges.map(({ savedId, college, stats }) => {
                  const hasMatch = stats.matchScore > 0;
                  return (
                    <div
                      key={savedId}
                      className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 flex flex-col justify-between gap-4 relative group ${
                        theme.isDark
                          ? 'bg-[#0B1221]/90 border-blue-500/20 hover:border-cyan-400/40 shadow-lg'
                          : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                      }`}
                    >
                      {/* Top Header: School Logo + Full Name + Match Pill + Delete Button */}
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/college/${college.slug}?sport=${primarySportQuery}`}
                          className="flex items-start gap-3 min-w-0 flex-1 group/title"
                        >
                          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden mt-0.5 ${
                            theme.isDark ? 'border-blue-500/30 bg-[#020617]' : 'border-blue-200 bg-blue-50'
                          }`}>
                            {college.logo_url ? (
                              <img src={college.logo_url} className="w-7 h-7 object-contain" alt={college.name} />
                            ) : (
                              <School className={`w-5 h-5 ${theme.textMuted}`} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className={`font-bold text-base sm:text-lg leading-snug group-hover/title:text-cyan-400 transition-colors break-words ${theme.textHeader}`}>
                              {college.name}
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              <span className={`text-xs font-medium ${theme.textMuted}`}>
                                {college.division} • {college.state}
                              </span>
                              {hasMatch && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                  Match {stats.matchScore}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveCollegeDashboard(savedId);
                          }}
                          title="Remove from board"
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-colors shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Unified 3-Column Metrics Strip (Full Width Per Column = Zero Number Truncation) */}
                      <div className={`grid grid-cols-3 divide-x rounded-xl py-3 px-1 border text-center ${
                        theme.isDark
                          ? 'bg-[#020617]/70 border-white/10 divide-white/10'
                          : 'bg-slate-50 border-slate-200 divide-slate-200'
                      }`}>
                        <div className="px-1.5 flex flex-col justify-center">
                          <span className="text-[11px] font-medium text-slate-400 mb-1 whitespace-nowrap">
                            Net Tuition
                          </span>
                          <span className={`text-sm sm:text-base font-bold tabular-nums leading-tight whitespace-nowrap ${theme.isDark ? 'text-white' : 'text-slate-900'}`}>
                            {stats.tuitionStr}
                          </span>
                        </div>

                        <div className="px-1.5 flex flex-col justify-center">
                          <span className="text-[11px] font-medium text-slate-400 mb-1 whitespace-nowrap">
                            10-Yr Salary
                          </span>
                          <span className={`text-sm sm:text-base font-bold tabular-nums leading-tight whitespace-nowrap ${theme.isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {stats.salaryStr}
                          </span>
                        </div>

                        <div className="px-1.5 flex flex-col justify-center">
                          <span className="text-[11px] font-medium text-slate-400 mb-1 whitespace-nowrap">
                            Acceptance
                          </span>
                          <span className={`text-sm sm:text-base font-bold tabular-nums leading-tight whitespace-nowrap ${theme.textSub}`}>
                            {stats.gradRateStr}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/college/${college.slug}?sport=${primarySportQuery}`}
                          className="flex-1 bg-blue-600/15 hover:bg-blue-600 text-cyan-300 hover:text-white border border-blue-500/30 font-semibold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>View Program</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href="/dashboard/email-builder"
                          className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-semibold py-2.5 px-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                          title="Draft Email to Coaches"
                        >
                          <Mail className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Email</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-10 sm:py-12 rounded-2xl border border-dashed flex flex-col items-center justify-center ${theme.isDark ? 'bg-[#020617]/50 border-blue-500/30' : 'bg-slate-50 border-slate-300'}`}>
                <School className={`w-12 h-12 mb-3 ${theme.textMuted}`} />
                <h4 className={`text-lg font-bold mb-1 ${theme.textHeader}`}>Your College Board is Empty</h4>
                <p className={`text-xs sm:text-sm font-normal max-w-sm mb-5 px-4 leading-relaxed ${theme.textMuted}`}>
                  Use the College Finder to match your PRs and academics against D1, D2, D3, and NAIA programs.
                </p>
                <Link href="/search" className="font-semibold text-xs py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white">
                  Open College Finder
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  ), [athleteProfile, streak, canClaimDaily, unclaimedRewardsCount, proPointMultiplier, isProUnlocked, savedColleges, sortedSavedColleges, collegeSortBy, isCollegesOpen, primarySportQuery, dailyViews, monthlyViews, recentViewers, allRecentViewers, router, theme, homeReferralCode, isSubmittingHomeRef, timeLeft, isOfferExpired, isTimerLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 blue-grid-bg opacity-30"></div>
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.5)]"></div>
        <p className="text-cyan-400 font-bold mt-4 animate-pulse text-xs">Loading Homebase...</p>
      </div>
    );
  }

  let backgroundEffects = <div className={`absolute top-0 right-0 w-[500px] h-[500px] ${theme.isDark ? 'bg-cyan-400/10' : 'bg-blue-500/10'} blur-[100px] rounded-full pointer-events-none z-0 mix-blend-screen`}></div>;

  if (theme.isDark) {
    backgroundEffects = (
      <>
        {['hype', 'premium', 'mythic-flare'].includes(athleteProfile?.equipped_card || '') && <div className="holo-glare rounded-[2.5rem]"></div>}
        {['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber', 'mythic-flare'].includes(athleteProfile?.equipped_card || '') && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay pointer-events-none rounded-[2.5rem]"></div>}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/10 blur-[100px] rounded-full pointer-events-none z-0 mix-blend-screen"></div>
      </>
    );
  }

  return (
    <main className={`min-h-screen ${theme.pageBg} font-sans pb-24 md:pb-12 text-slate-200 relative overflow-x-hidden transition-colors duration-500`}>
      
      {/* 🚀 UPGRADED GRID & HEAVY GLASSMORPHISM BASE 🚀 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020617]">
        <div className={`absolute inset-0 blue-grid-bg ${theme.pagePattern} opacity-40`}></div>
        <div className={`absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] ${theme.isDark ? 'bg-blue-600/15' : 'bg-blue-400/15'} blur-[140px] rounded-full transition-colors duration-500 mix-blend-screen`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] ${theme.isDark ? 'bg-cyan-500/10' : 'bg-cyan-400/10'} blur-[120px] rounded-full transition-colors duration-500 mix-blend-screen`}></div>
      </div>

      {!loading && athleteProfile && athleteProfile.trust_level !== 1 && (
        <div className="relative z-40 w-full bg-[#0B1221] border-b border-blue-500/30 text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-4 shadow-[0_4px_30px_rgba(59,130,246,0.15)]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            <p className="text-sm font-normal text-blue-200"><strong className="text-white font-bold">Action Required:</strong> Your profile identity is unverified.</p>
          </div>
          <button onClick={() => setIsEmailVerificationModalOpen(true)} className="bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all active:scale-[0.98] flex items-center gap-1.5">Verify Now <ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ALL RECENT COACH VIEWERS MODAL */}
      {showAllViewersModal && isProUnlocked && (
        <div className="fixed inset-0 z-[500] bg-[#020617]/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B1221] border border-blue-500/30 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(59,130,246,0.25)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserCircle2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  All College Coach Viewers ({allRecentViewers.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllViewersModal(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-3">
              {allRecentViewers.map((coach: any, idx: number) => (
                <div key={`modal-coach-${idx}`} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <AvatarWithBorder avatarUrl={coach.avatar_url} borderId="none" sizeClasses="w-11 h-11 shrink-0" userRole="coach" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-sm sm:text-base truncate">Coach {coach.last_name}</p>
                      <p className="text-xs font-normal text-slate-400 truncate">{coach.school_name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleContactCoach(coach.email)}
                    className="w-10 h-10 rounded-xl bg-indigo-500/15 hover:bg-indigo-500 text-indigo-300 hover:text-white flex items-center justify-center shrink-0 transition-all border border-indigo-500/30"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {sportToDelete && (
        <div className="fixed inset-0 z-[500] bg-[#020617]/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B1221] border border-blue-900/50 rounded-2xl sm:rounded-[2rem] w-full max-w-md shadow-[0_0_50px_rgba(59,130,246,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 sm:p-8 text-center flex flex-col items-center relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[40px] rounded-full pointer-events-none"></div>
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]"><ShieldAlert className="w-8 h-8 text-red-400" /></div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Delete {sportToDelete}?</h3>
              <p className="text-blue-200/80 font-normal text-sm mb-8 leading-relaxed">Are you sure you want to permanently delete all your {sportToDelete} data? This action cannot be undone.</p>
              <div className="flex gap-3 sm:gap-4 w-full relative z-10 flex-col sm:flex-row">
                <button onClick={() => setSportToDelete(null)} className="flex-1 bg-blue-950 hover:bg-blue-900 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm border border-blue-800">Cancel</button>
                <button onClick={confirmDeleteSport} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-[0.98]">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm sm:w-auto animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-full px-5 sm:px-6 py-3 shadow-2xl flex items-center gap-3 font-semibold text-xs sm:text-sm border ${toast.type === 'error' ? 'bg-red-950 text-white border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-[#0B1221] text-white border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.3)]'}`}>
            {toast.type === 'error' ? <X className="w-4 h-4 text-red-400 shrink-0" /> : <Check className="w-4 h-4 text-cyan-400 shrink-0" />} 
            <span className="truncate">{toast.message}</span>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(59, 130, 246, 0.4); border-radius: 10px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .blue-grid-bg {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(59, 130, 246, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.15) 1px, transparent 1px);
          mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 100%);
        }

        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerGlare { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes cyberScan { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(1000%); opacity: 0; } }
        @keyframes voidPulse { 0%, 100% { background-size: 100% 100%; filter: brightness(1); } 50% { background-size: 120% 120%; filter: brightness(1.2); } }
        
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(34,211,238,0.4)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 25px rgba(34,211,238,0.8)); transform: scale(1.05) translateY(-3px); }
        }
        .animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
        
        .holo-card-base { background: transparent; }
        .holo-card-obsidian { background: linear-gradient(135deg, #020617 0%, #1e3a8a 25%, #000000 50%, #020617 75%, #0f172a 100%); background-size: 300% 300%; }
        .holo-card-crimson { background: linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #450a0a 100%); background-size: 300% 300%; }
        .holo-card-sapphire { background: linear-gradient(135deg, #172554 0%, #0ea5e9 50%, #172554 100%); background-size: 300% 300%; }
        
        .holo-card-hype { 
          background: 
            linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent 100%),
            linear-gradient(135deg, #4f46e5 0%, #9333ea 25%, #ec4899 50%, #3b82f6 75%, #4f46e5 100%); 
          background-size: 40px 40px, 300% 300%; 
        }

        .holo-card-premium { 
          background: 
            repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px),
            linear-gradient(135deg, #b45309 0%, #f59e0b 25%, #fef08a 50%, #d97706 75%, #78350f 100%); 
          background-size: 100% 100%, 300% 300%; 
        }

        .holo-card-amethyst { 
          background: radial-gradient(circle at 50% 50%, #c026d3 0%, #7e22ce 30%, #3b0764 80%, #000000 100%); 
          animation: voidPulse 6s ease-in-out infinite;
        }
        .holo-card-amethyst::before {
          content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.1;
          background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 2px, #fff 3px, #fff 4px);
        }

        .holo-card-cyber { 
          background: 
            linear-gradient(rgba(6, 182, 212, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.15) 1px, transparent 1px),
            linear-gradient(135deg, #022c22 0%, #0891b2 50%, #083344 100%);
          background-size: 20px 20px, 20px 20px, 100% 100%;
          box-shadow: inset 0 0 40px rgba(34, 211, 238, 0.3);
        }
        .holo-card-cyber::after {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 8px;
          background: rgba(34, 211, 238, 0.8); filter: blur(3px); box-shadow: 0 0 20px #22d3ee;
          animation: cyberScan 3s linear infinite;
        }
        
        .holo-card-mythic-flare {
          background: radial-gradient(circle at 50% 50%, #f43f5e 0%, #881337 40%, #000000 100%);
          animation: voidPulse 8s ease-in-out infinite;
        }
        
        .animate-foil { animation: foilShift 15s ease-in-out infinite; }
        .holo-glare { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%); background-size: 200% auto; animation: shimmerGlare 8s infinite linear; pointer-events: none; z-index: 10; mix-blend-mode: overlay;}
      `}} />

      {/* 🚨 DYNAMIC PAGE HEADER THEME CONFIG 🚨 */}
      <div className={`pb-12 md:pb-20 px-4 md:px-6 relative transition-all duration-500 z-20 pt-6 md:pt-10 border-b border-blue-500/20 shadow-[0_10px_30px_rgba(59,130,246,0.1)] ${theme.heroCard} ${getEquippedGlow(athleteProfile?.equipped_border)}`}>
        {backgroundEffects}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-5 md:gap-8 relative z-20">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 w-full">
            <div className="relative w-24 h-24 md:w-36 md:h-36 shrink-0 flex items-center justify-center group cursor-pointer" onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}>
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r={66} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-blue-500/20" />
                <circle cx="72" cy="72" r={66} stroke="currentColor" strokeWidth="6" fill="transparent" className={readiness.score === 100 ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "text-blue-500"} strokeDasharray={2 * Math.PI * 66} strokeDashoffset={(2 * Math.PI * 66) - (readiness.score / 100) * (2 * Math.PI * 66)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
              </svg>
              <div className="relative z-10 flex items-center justify-center w-20 h-20 md:w-32 md:h-32">
                <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId={athleteProfile?.equipped_border} sizeClasses="w-full h-full absolute inset-0 shadow-xl" />
                <div className={`absolute inset-1 rounded-full bg-[#020617]/70 flex flex-col items-center justify-center text-white transition-all backdrop-blur-[2px] ${isUploadingAvatar ? 'opacity-100 z-20' : 'opacity-0 group-hover:opacity-100 z-20'}`}>
                  {isUploadingAvatar ? <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-cyan-400" /> : <div className="flex flex-col items-center gap-1"><Camera className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" /><span className="text-[10px] font-semibold text-cyan-400">Upload</span></div>}
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleAvatarUpload} />
            </div>

            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-2 sm:gap-3 mb-2">
                <h1 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight flex items-center justify-center md:justify-start gap-3 ${theme.heroName}`}>
                  {athleteProfile?.first_name ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'Welcome, Athlete'}
                </h1>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button onClick={() => router.push('/dashboard/profile')} className="bg-blue-500/10 hover:bg-blue-500/20 p-2 rounded-lg transition-colors border border-blue-400/30 shrink-0 shadow-sm" title="Update Profile Details"><Edit3 className="w-4 h-4 text-cyan-400" /></button>
                  <div className="bg-[#0B1221]/80 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                    <Points className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold tabular-nums text-cyan-400">{coins.toLocaleString()} pts</span>
                  </div>
                  {athleteProfile?.is_premium && (
                    <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-1">
                      <Crown className="w-3 h-3" /> PRO 3x
                    </span>
                  )}
                  {athleteProfile?.is_founder && <span className="bg-gradient-to-br from-blue-400 via-cyan-500 to-sky-400 text-[#020617] text-[11px] font-bold px-3 py-1 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.5)] flex items-center gap-1.5 border border-cyan-300 animate-pulse"><Crown className="w-3 h-3" /> Early Access</span>}
                </div>
              </div>

              <p className={`text-sm sm:text-base md:text-lg font-medium flex flex-wrap items-center justify-center md:justify-start gap-1 sm:gap-2 mb-4 ${theme.heroMeta}`}>
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" /> {athleteProfile?.high_school || 'General Athlete Profile'} {athleteProfile?.grad_year && ` • Class of ${athleteProfile.grad_year}`}
              </p>
              
              {readiness.score < 100 && (
                <div className="bg-[#0B1221]/80 backdrop-blur-md border border-blue-500/30 rounded-xl sm:rounded-2xl p-3 inline-flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 max-w-lg w-full text-center sm:text-left shadow-[0_0_20px_rgba(59,130,246,0.15)] relative overflow-hidden group mb-4 sm:mb-5 animate-in fade-in zoom-in-95 duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-[20px] rounded-full pointer-events-none"></div>
                  <div className="w-10 h-10 rounded-full border-2 border-cyan-500/50 flex items-center justify-center shrink-0 relative bg-[#020617] shadow-[0_0_10px_rgba(34,211,238,0.3)]"><span className="text-[11px] font-bold tabular-nums text-cyan-400">{readiness.score}%</span></div>
                  <div><p className="text-[11px] font-semibold text-blue-300/80 mb-0.5">Recruit Quest</p><p className="text-xs font-medium text-blue-100 leading-snug pr-0 sm:pr-2">{readiness.nextQuest}</p></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 FLOATING TAB NAVIGATOR (z-30 & top-24) 🚀 */}
      <div className="sticky top-24 z-30 w-full flex justify-center px-4 mt-4 sm:mt-6 animate-in slide-in-from-bottom-4 duration-500 pointer-events-none">
        <div className="bg-[#E2E8F0] p-1.5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.2)] inline-flex gap-2 pointer-events-auto border border-white">
          <button onClick={() => goToTab('home')} className={`px-6 py-3 rounded-full transition-all flex items-center justify-center min-w-[4rem] cursor-pointer ${activeTab === 'home' ? 'bg-[#3B82F6] text-white shadow-lg scale-105' : 'text-[#94A3B8] hover:text-[#3B82F6]'}`}>
            <LayoutDashboard className="w-5 h-5 shrink-0" strokeWidth={2.5} />
          </button>
          <button onClick={() => goToTab('social')} className={`px-6 py-3 rounded-full transition-all flex items-center justify-center min-w-[4rem] cursor-pointer ${activeTab === 'social' ? 'bg-[#3B82F6] text-white shadow-lg scale-105' : 'text-[#94A3B8] hover:text-[#3B82F6]'}`}>
            <ImageIcon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
          </button>
          <button onClick={() => goToTab('rewards')} className={`relative px-6 py-3 rounded-full transition-all flex items-center justify-center min-w-[4rem] cursor-pointer ${activeTab === 'rewards' ? 'bg-[#3B82F6] text-white shadow-lg scale-105' : 'text-[#94A3B8] hover:text-[#3B82F6]'}`}>
            <Gift className="w-5 h-5 shrink-0" strokeWidth={2.5} />
            {unclaimedRewardsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(225,29,72,0.9)] border-2 border-white">
                {unclaimedRewardsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-4 sm:mt-6 relative z-10 space-y-4 sm:space-y-6">
        {activeTab === 'home' && RenderHomeTab}
        {activeTab === 'social' && <PerformanceStats state={sharedPerformanceState} actions={sharedPerformanceActions} />}
        {activeTab === 'rewards' && (
          <Rewards 
            athleteProfile={athleteProfile} 
            streak={streak} 
            coins={coins} 
            awardedToday={awardedToday} 
            awardedBoxToday={awardedBoxToday}
            canClaimDaily={canClaimDaily}
            isClaimingDaily={isClaimingDaily}
            onClaimDaily={handleClaimDailyReward}
            handleShareCode={async (c: string) => { await navigator.clipboard.writeText(`Join me on ChasedSports! Use my invite code: ${c}`); showToast("Copied to clipboard!", "success"); }} 
            claimedReferrals={athleteProfile?.claimed_referrals || 0}
            onClaimReferral={handleClaimReferral}
            onSubmitReferralCode={handleReferralSubmit}
          />
        )}
      </div>

      {isEmailVerificationModalOpen && (
        <div className="fixed inset-0 z-[300] bg-[#020617]/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-md relative animate-in zoom-in-95 duration-300">
            <button onClick={() => { setIsEmailVerificationModalOpen(false); window.location.reload(); }} className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center bg-blue-500/20 hover:bg-blue-500/40 rounded-full transition-colors z-50 text-cyan-400 font-bold border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.3)]"><X className="w-5 h-5" /></button>
            <EmailVerification />
          </div>
        </div>
      )}

      {isTeamJoinModalOpen && (
        <div className="fixed inset-0 z-[300] bg-[#020617]/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0B1221] border border-blue-500/30 rounded-2xl sm:rounded-[2rem] w-full max-w-2xl shadow-[0_0_50px_rgba(59,130,246,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-blue-700 to-cyan-600 p-5 sm:p-8 text-white relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[50px] rounded-full"></div>
              <button onClick={() => setIsTeamJoinModalOpen(false)} className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 flex items-center justify-center bg-[#020617]/20 hover:bg-[#020617]/40 rounded-full transition-colors z-10"><X className="w-5 h-5 text-white" /></button>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3 relative z-10"><Users className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-300" /> Join Your Team</h2>
              <p className="text-blue-100 font-normal text-sm sm:text-base relative z-10">Search the database to link your profile to your High School roster.</p>
            </div>
            <div className="p-5 sm:p-8 space-y-5 sm:space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {!showAddTeamForm ? (
                <>
                  <div className="relative" ref={teamDropdownRef}>
                    <label className="text-xs font-semibold text-blue-300/80 mb-1.5 block">High School Alignment <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Search className="w-5 h-5 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input type="text" value={teamSearchQuery} onFocus={() => setShowTeamDropdown(true)} onChange={(e) => { setTeamSearchQuery(e.target.value); setShowTeamDropdown(true); if (teamForm.high_school && e.target.value !== teamForm.high_school) { setTeamForm({...teamForm, high_school: '', city: '', state: ''}); } }} className={`w-full bg-[#020617] text-white border pl-11 pr-4 py-3 text-sm font-semibold outline-none transition-all ${teamForm.high_school ? 'border-cyan-500 focus:ring-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'border-blue-900 focus:ring-2 focus:ring-blue-500'} rounded-xl`} placeholder="Search for your high school..." />
                      {teamForm.high_school && <div className="absolute right-4 top-1/2 -translate-y-1/2"><CheckCircle2 className="w-5 h-5 text-cyan-400" /></div>}
                    </div>
                    {showTeamDropdown && teamSearchQuery.length > 1 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#0B1221] border border-blue-800 rounded-xl shadow-[0_10px_40px_rgba(59,130,246,0.3)] z-50 overflow-hidden flex flex-col">
                        <div className="max-h-52 overflow-y-auto custom-scrollbar p-2">
                          {isSearchingTeams ? (
                            <div className="p-4 text-center text-sm font-semibold text-blue-400 flex justify-center items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Querying Database...</div>
                          ) : teamSearchResults.length > 0 ? (
                            teamSearchResults.map((team: any) => (
                              <button key={team.id} onClick={() => selectExistingTeam(team)} className="w-full text-left px-4 py-3 hover:bg-blue-900/40 rounded-lg transition-colors flex items-center justify-between group">
                                <div><p className="text-sm font-bold text-white group-hover:text-cyan-400">{team.high_school_name}</p><p className="text-xs font-medium text-blue-300/80">{team.city}, {team.state} {team.division && `• ${team.division}`}</p></div>
                                <ArrowRight className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))
                          ) : <div className="p-4 text-center"><p className="text-sm font-semibold text-blue-400 mb-2">No matching schools found.</p></div>}
                        </div>
                        <div className="border-t border-blue-900 bg-[#020617] p-3"><button onClick={() => { setNewTeamName(teamSearchQuery); setShowAddTeamForm(true); }} className="w-full bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-cyan-400 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"><Plus className="w-4 h-4" /> Don't see your school? Add it here</button></div>
                      </div>
                    )}
                    {teamForm.city && teamForm.state && <p className="text-xs font-semibold text-cyan-400 mt-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Verified Location: {teamForm.city}, {teamForm.state}</p>}
                  </div>
                  <button onClick={handleSaveTeamJoin} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 sm:py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2 mt-4 border border-cyan-300/50"><Save className="w-5 h-5"/> Join Team Roster</button>
                </>
              ) : (
                <div className="animate-in slide-in-from-right-8 duration-300">
                  <button onClick={() => setShowAddTeamForm(false)} className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mb-5 sm:mb-6"><ChevronDown className="w-4 h-4 rotate-90" /> Back to Team Search</button>
                  <Map className="w-4 h-4 hidden" />
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 sm:p-4 mb-5 sm:mb-6"><h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2 mb-1">Global Database Addition</h4><p className="text-xs font-normal text-blue-200/80">You are adding a new High School to the global database. Name formatting is auto-enforced.</p></div>
                  <div className="space-y-4 sm:space-y-5">
                    <div><label className="text-xs font-semibold text-blue-300/80 mb-1.5 block">High School Name <span className="text-red-500">*</span></label><input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} onBlur={() => setNewTeamName(normalizeHSName(newTeamName))} className="w-full bg-[#020617] text-white border border-blue-900 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-inner" placeholder="e.g. South Albany High School"/></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div><label className="text-xs font-semibold text-blue-300/80 mb-1.5 block">Team Mascot <span className="text-red-500">*</span></label><input type="text" value={newTeamMascot} onChange={(e) => setNewTeamNameMascot(e.target.value)} className="w-full bg-[#020617] text-white border border-blue-900 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-inner" placeholder="e.g. RedHawks"/></div>
                      <div><label className="text-xs font-semibold text-blue-300/80 mb-1.5 block">State Division <span className="text-red-500">*</span></label><input type="text" value={newTeamDivision} onChange={(e) => setNewTeamDivision(e.target.value)} className="w-full bg-[#020617] text-white border border-blue-900 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-inner" placeholder="e.g. 5A, Division 1"/></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div><label className="text-xs font-semibold text-blue-300/80 mb-1.5 block">City <span className="text-red-500">*</span></label><input type="text" value={newTeamCity} onChange={(e) => setNewTeamCity(e.target.value)} className="w-full bg-[#020617] text-white border border-blue-900 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-inner" placeholder="e.g. Albany"/></div>
                      <div>
                        <label className="text-xs font-semibold text-blue-300/80 mb-1.5 block">State <span className="text-red-500">*</span></label>
                        <select value={newTeamState} onChange={(e) => setNewTeamState(e.target.value)} className="w-full bg-[#020617] text-white border border-blue-900 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none appearance-none transition-all shadow-inner">
                          <option value="">Select State...</option>{US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={handleCreateNewTeam} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 sm:py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2 mt-2 border border-cyan-300/50"><Save className="w-5 h-5"/> Create & Select Team</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function DashboardHomebase() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 blue-grid-bg opacity-30"></div>
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.5)]"></div>
        <p className="text-cyan-400 font-bold mt-4 animate-pulse text-xs">Loading Homebase...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}