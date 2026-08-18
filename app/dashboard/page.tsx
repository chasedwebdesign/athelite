'use client';

import React, { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, Search, ChevronRight, Users, ChevronDown, ChevronUp, 
  Bookmark, RefreshCw, UserCircle2, School, ShieldCheck, Check, Trash2, 
  FileText, Save, ArrowRight, Plus, X, Globe, CheckCircle2, Flame,
  Rocket, Crown, Gift, Paintbrush, AlertCircle, Lock, Link as LinkIcon, ImageIcon, 
  Download, CheckSquare, Square, Mail, Sparkles, Edit3, Scale, Activity,
  Zap, TrendingUp, Info, Copy, BarChart3, Eye, Calendar, HelpCircle, Trophy,
  Map, ShieldAlert, Camera, MoreHorizontal, LayoutDashboard, Package, LayoutTemplate, Diamond,
  Timer
} from 'lucide-react';
import { AvatarWithBorder } from '@/components/AnimatedBorders';
import { Points } from '@/components/Points';
import EmailVerification from '@/components/EmailVerification';
import { SPORT_CONFIGS_META, ALL_SPORTS, SUGGESTED_MAJORS, US_STATES, evaluateMetric, getOverallTier, getRealStats } from '@/utils/constants/RecruitingStandards';
import { LootBoxVisual } from '@/components/LootBoxVisual';

import PerformanceStats from './performance-stats/page';
import Rewards from './rewards/page';

const normalizeHSName = (name: string) => {
  let clean = name.replace(/\b(High School|H\.S\.|High)\b/gi, 'HS').trim();
  clean = clean.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  clean = clean.replace(/\bHs\b/g, 'HS');
  return clean;
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
  if (!border || border === 'none') return 'border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-slate-900/60';
  
  const b = border.toLowerCase();
  if (b.includes('legend')) return 'border-amber-500/30 shadow-[0_8px_32px_rgba(245,158,11,0.15)] bg-amber-900/20';
  if (b.includes('champion')) return 'border-red-500/30 shadow-[0_8px_32px_rgba(239,68,68,0.15)] bg-red-900/20';
  if (b.includes('elite')) return 'border-purple-500/30 shadow-[0_8px_32px_rgba(168,85,247,0.15)] bg-purple-900/20';
  if (b.includes('diamond')) return 'border-sky-500/30 shadow-[0_8px_32px_rgba(56,189,248,0.15)] bg-sky-900/20';
  if (b.includes('pro')) return 'border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.15)] bg-emerald-900/20';
  if (b.includes('mythic')) return 'border-fuchsia-500/30 shadow-[0_8px_32px_rgba(217,70,239,0.15)] bg-fuchsia-900/20';
  
  return 'border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-slate-900/60';
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
      heroMeta: 'text-slate-600 font-bold',
      heroDivider: 'text-slate-300',
      btnPrimary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 border-transparent',
      btnSecondary: 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm',
      sectionBg: 'bg-white/80 backdrop-blur-xl',
      sectionBorder: 'border-slate-200',
      sectionShadow: 'shadow-xl',
      subCardBg: 'bg-slate-50',
      subCardBorder: 'border-slate-100',
      textHeader: 'text-slate-900',
      textSub: 'text-slate-500',
      textMuted: 'text-slate-400',
      iconColor: 'text-blue-500',
    };
  }

  const map: Record<string, any> = {
    obsidian: { glow: 'shadow-[0_0_30px_rgba(71,85,105,0.2)]', border: 'border-slate-600/50', accent: 'text-slate-400', borderHover: 'hover:border-slate-400', ring: 'focus:ring-slate-500' },
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
    heroCard: `holo-card-${safeCardType} border-white/20 shadow-2xl text-white ${animationClass}`,
    heroName: 'text-white drop-shadow-md',
    heroMeta: 'text-white/90 font-medium',
    heroDivider: 'text-white/40',
    btnPrimary: `bg-white/10 hover:bg-white/20 text-white shadow-lg border border-white/20 backdrop-blur-md ${t.glow}`,
    btnSecondary: 'bg-black/20 hover:bg-black/30 border border-white/20 text-white shadow-sm backdrop-blur-md',
    sectionBg: 'bg-slate-900/60 backdrop-blur-xl',
    sectionBorder: t.border,
    sectionShadow: t.glow,
    subCardBg: 'bg-black/30',
    subCardBorder: 'border-white/10',
    textHeader: 'text-white drop-shadow-md',
    textSub: 'text-white/80',
    textMuted: 'text-white/50',
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
  const [iframeKey, setIframeKey] = useState(0);
  
  const [isEmailVerificationModalOpen, setIsEmailVerificationModalOpen] = useState(false);
  const [isTeamJoinModalOpen, setIsTeamJoinModalOpen] = useState(false);
  const [sportToDelete, setSportToDelete] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDailyRewardModal, setShowDailyRewardModal] = useState(false);
  const [dailyRewardData, setDailyRewardData] = useState<{ points: number, box: string | null, tier: 'standard' | 'premium' | 'ultra' | null, streak: number, dayNumInCycle: number, cycleMultiplier: number } | null>(null);
  const [claimStage, setClaimStage] = useState<'idle' | 'claimed'>('idle');

  // Referral Reward States
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showStarterPackModal, setShowStarterPackModal] = useState(false);
  const [referralRewardData, setReferralRewardData] = useState<{ count: number, pts: number, hasBox: boolean, box: string | null } | null>(null);

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

  // 🚨 INTERCEPT URL PARAMS ON MOUNT (AND CLEAN THEM SO THEY DON'T GET STUCK) 🚨
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
      // Remove the parameters from the URL gracefully so the user isn't locked to this tab
      router.replace('/dashboard', { scroll: false });
    }

    setHasInitializedParams(true);
  }, [searchParams, hasInitializedParams, router]);

  const gatingMode = useMemo(() => {
    return {
      isPreLaunch: false,
      hasAccess: athleteProfile?.is_premium === true || athleteProfile?.is_founder === true,
      label: "Premium feature"
    };
  }, [athleteProfile]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };
  const goToTab = (tab: 'home' | 'social' | 'rewards') => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleContactCoach = (coachEmail: string | null) => {
    if (!coachEmail) return showToast("This coach has not made their contact information public.", "error");
    window.location.href = `mailto:${coachEmail}?subject=Recruiting Inquiry from ChasedSports Profile`;
  };

  const handleClaimDailyReward = () => {
    triggerVibration([50, 100, 150]);
    setClaimStage('claimed');
  };

  const handleClaimReferral = async (count: number, pts: number, hasBox: boolean) => {
    if (!athleteProfile?.id) return;
    try {
      const newCoins = (athleteProfile.coins || 0) + pts;
      let updatePayload: any = { claimed_referrals: count, coins: newCoins };
      let boxLabel: string | null = null;

      if (hasBox) {
         updatePayload.ultra_card_boxes = (athleteProfile.ultra_card_boxes || 0) + 1;
         boxLabel = "Ultra Card Box";
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

      setReferralRewardData({ count, pts, hasBox, box: boxLabel });
      setShowReferralModal(true);
      triggerVibration([50, 100, 150]);
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

      const newCoins = (athleteProfile.coins || 0) + 500;
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
      setShowStarterPackModal(true);
      triggerVibration([50, 100, 150]);
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
      const { data, error } = await supabase.from('teams').insert({
        high_school_name: normalizeHSName(newTeamName), city: newTeamCity.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()), state: newTeamState,
        mascol: newTeamMascot.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()), division: newTeamDivision
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
        if (!athleteData.first_name || !athleteData.last_name || !athleteData.email || !athleteData.gender || !athleteData.grad_year) {
            if (isMounted) router.push('/dashboard/profile');
            return;
        }

        let parsedResume: any = {};
        let masterAccolades: AccoladeObj[] = [];

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

        let { data: relationalSports } = await supabase.from('athlete_sports').select('*').eq('athlete_id', athleteData.id);
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

        const todayStr = new Date().toLocaleDateString('en-CA');
        let currentDayProgress = athleteData.login_day_progress || (athleteData.current_login_streak || 0); 
        let currentCoins = athleteData.coins || 0;
        const lastLoginStr = athleteData.last_login_date;
        
        let earnedCoinsToday = 0;
        let awardedBoxLabel: string | null = null;
        let awardedBoxTier: 'standard' | 'premium' | 'ultra' | null = null;

        if (lastLoginStr !== todayStr) {
          currentDayProgress += 1;
          
          const cycle = Math.floor((currentDayProgress - 1) / 28);
          const cycleMultiplier = 1 + (cycle * 0.5);
          const dayNumInCycle = ((currentDayProgress - 1) % 28) + 1;
          const dayOfWeek = ((dayNumInCycle - 1) % 7) + 1;
          const weekOfCycle = Math.floor((dayNumInCycle - 1) / 7) + 1;

          let baseCoins = 20;
          if (dayNumInCycle === 28) baseCoins = 500;
          else if (dayNumInCycle === 14) baseCoins = 250;
          else if (dayOfWeek === 7) baseCoins = 100;

          earnedCoinsToday = Math.round(baseCoins * cycleMultiplier);
          currentCoins += earnedCoinsToday;

          let updatePayload: any = {
            login_day_progress: currentDayProgress,
            last_login_date: todayStr,
            coins: currentCoins,
          };

          if (dayOfWeek === 1) {
            updatePayload.standard_card_boxes = (athleteData.standard_card_boxes || 0) + 1;
            athleteData.standard_card_boxes = updatePayload.standard_card_boxes;
            awardedBoxLabel = "Standard Card Box";
            awardedBoxTier = "standard";
          } else if (dayOfWeek === 5) {
            updatePayload.standard_border_boxes = (athleteData.standard_border_boxes || 0) + 1;
            athleteData.standard_border_boxes = updatePayload.standard_border_boxes;
            awardedBoxLabel = "Standard Border Box";
            awardedBoxTier = "standard";
          } else if (dayOfWeek === 3) {
            if (weekOfCycle % 2 !== 0) {
               updatePayload.premium_card_boxes = (athleteData.premium_card_boxes || 0) + 1;
               athleteData.premium_card_boxes = updatePayload.premium_card_boxes;
               awardedBoxLabel = "Premium Card Box";
               awardedBoxTier = "premium";
            } else {
               updatePayload.premium_border_boxes = (athleteData.premium_border_boxes || 0) + 1;
               athleteData.premium_border_boxes = updatePayload.premium_border_boxes;
               awardedBoxLabel = "Premium Border Box";
               awardedBoxTier = "premium";
            }
          } else if (dayOfWeek === 7) {
            if (weekOfCycle % 2 !== 0) {
               updatePayload.ultra_card_boxes = (athleteData.ultra_card_boxes || 0) + 1;
               athleteData.ultra_card_boxes = updatePayload.ultra_card_boxes;
               awardedBoxLabel = "Ultra Card Box";
               awardedBoxTier = "ultra";
            } else {
               updatePayload.ultra_border_boxes = (athleteData.ultra_border_boxes || 0) + 1;
               athleteData.ultra_border_boxes = updatePayload.ultra_border_boxes;
               awardedBoxLabel = "Ultra Border Box";
               awardedBoxTier = "ultra";
            }
          }

          setStreak(currentDayProgress); 
          setCoins(currentCoins); 
          setAwardedToday(earnedCoinsToday);
          if (awardedBoxLabel) setAwardedBoxToday(awardedBoxLabel);

          setDailyRewardData({ points: earnedCoinsToday, box: awardedBoxLabel, tier: awardedBoxTier, streak: currentDayProgress, dayNumInCycle, cycleMultiplier });
          setShowDailyRewardModal(true);

          await supabase.from('athletes').update(updatePayload).eq('id', athleteData.id);
          athleteData.coins = currentCoins;
        } else {
          setStreak(currentDayProgress); 
          setCoins(currentCoins);
        }

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

      const { data: savedCollegesData } = await supabase.from('saved_colleges').select(`id, college_id, universities (*)`).eq('athlete_id', session.user.id);
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

    let payload: any = { athlete_id: athleteProfile.id, sport_name: sport, position: updatedData.position || null, level_of_play: updatedData.level || null, athleticism_tier: null, metrics: updatedData.metrics || [], custom_fit_score: updatedData.calculatedRating, meta_context: updatedData.metaContext || {}, is_active: updatedData.isActive !== false };
    let { error } = await supabase.from('athlete_sports').upsert(payload, { onConflict: 'athlete_id, sport_name' });
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
        let newSports = [...currentSports];
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
      let currentResume = typeof athleteProfile.saved_resume === 'string' ? JSON.parse(athleteProfile.saved_resume) : (athleteProfile.saved_resume || {});
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
    showToast(`Saved to Academic Profile`, "success");
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

  const maxScore = useMemo(() => allAvailableMetrics.length > 0 ? Math.max(...allAvailableMetrics.map(m => m.score)) : 0, [allAvailableMetrics]);
  const bleedColors = useMemo(() => {
    if (maxScore >= 95) return { orb1: 'bg-fuchsia-500/15', orb2: 'bg-purple-500/15' };
    if (maxScore >= 85) return { orb1: 'bg-purple-500/15', orb2: 'bg-indigo-500/15' };
    if (maxScore >= 75) return { orb1: 'bg-blue-500/15', orb2: 'bg-cyan-500/15' };
    if (maxScore >= 65) return { orb1: 'bg-emerald-500/15', orb2: 'bg-teal-500/15' };
    if (maxScore >= 55) return { orb1: 'bg-amber-500/15', orb2: 'bg-orange-500/15' };
    return { orb1: 'bg-slate-400/10', orb2: 'bg-slate-300/10' };
  }, [maxScore]);

  const readiness = useMemo(() => {
    let score = 0; let nextQuest = "Profile complete! You are fully optimized for the Matchmaker.";
    if (athleteProfile?.first_name && athleteProfile?.last_name) score += 10;
    if (athleteProfile?.trust_level === 1) score += 10; else if (score >= 10) nextQuest = "Verify your account identity to unlock the Team HQ.";
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

  const sharedPerformanceState = { athleteProfile, sportStats, userSports, disabledSportsList, collapsedSports, allAvailableMetrics, selectedMetrics, selectedAccolades, newAccolade, accolades, schoolPrefs, gpa, intendedMajor, showMajorDropdown, socialSubTab, isExportingCard, dailyViews, monthlyViews, allRecentViewers, recentViewers, showAllViewersModal, showImpressionTooltip, gatingMode, iframeKey, primarySportQuery, genderKey, sportMenuOpen };
  const sharedPerformanceActions = { setSocialSubTab, toggleSportCollapse, getDisplayRating, setSportMenuOpen, setSportActiveState, setSportToDelete, syncSportToSupabase, showToast, setGpa, setIntendedMajor, setShowMajorDropdown, autoSavePortfolio, setNewAccolade, addAccolade, removeAccolade, setSchoolPrefs, setIframeKey, handleToggleMetric, handleToggleAccolade, handleDownloadSocialCard, setShowImpressionTooltip, setShowAllViewersModal, handleContactCoach, handleToggleSportDropdown };

  const hasUnclaimedReferrals = (athleteProfile?.verified_referrals || 0) > (athleteProfile?.claimed_referrals || 0);

  const RenderHomeTab = useMemo(() => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative z-10">
      
      {!athleteProfile?.referred_by && !isOfferExpired && isTimerLoaded && (
        <div className={`rounded-[2rem] p-6 sm:p-8 border border-fuchsia-500/50 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all duration-500 relative overflow-hidden group shadow-[0_0_40px_rgba(217,70,239,0.15)] bg-gradient-to-br from-slate-900 via-slate-900 to-fuchsia-950/40`}>
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-fuchsia-500/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 flex-1 w-full">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-gradient-to-br from-fuchsia-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-fuchsia-500/30">
                        <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <h3 className={`text-xl sm:text-2xl font-black tracking-tight text-white`}>
                        New Athlete Starter Pack
                    </h3>
                </div>
                
                <p className={`text-sm font-medium text-slate-300 max-w-md`}>
                    Invited by a teammate? Enter their custom code to link accounts, boost their squad, and instantly claim <span className="text-amber-400 font-bold">500 Points</span> & <span className="text-blue-400 font-bold">1x Standard Box</span>!
                </p>

                {timeLeft && (
                    <div className="mt-4 flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400 animate-pulse">Offer Expires In:</span>
                        <div className="flex gap-1.5 font-mono text-lg font-black text-white drop-shadow-md">
                            <div className="bg-slate-950/80 px-2 py-1 rounded-lg border border-fuchsia-500/30 min-w-[2.5rem] text-center">{String(timeLeft.h).padStart(2, '0')}</div>
                            <span className="text-fuchsia-500">:</span>
                            <div className="bg-slate-950/80 px-2 py-1 rounded-lg border border-fuchsia-500/30 min-w-[2.5rem] text-center">{String(timeLeft.m).padStart(2, '0')}</div>
                            <span className="text-fuchsia-500">:</span>
                            <div className="bg-slate-950/80 px-2 py-1 rounded-lg border border-fuchsia-500/30 min-w-[2.5rem] text-center">{String(timeLeft.s).padStart(2, '0')}</div>
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
                    className={`w-full lg:w-64 bg-slate-950/80 border border-fuchsia-500/30 text-white focus:border-fuchsia-400 focus:ring-fuchsia-500 rounded-xl px-5 py-3.5 text-sm font-black uppercase tracking-widest outline-none focus:ring-2 transition-all placeholder:normal-case placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-500 shadow-inner`}
                />
                <button
                    onClick={async () => {
                        setIsSubmittingHomeRef(true);
                        const res = await handleReferralSubmit(homeReferralCode);
                        setIsSubmittingHomeRef(false);
                        if (res.success) setHomeReferralCode('');
                    }}
                    disabled={isSubmittingHomeRef || !homeReferralCode.trim()}
                    className={`w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-6 py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-[0_0_20px_rgba(217,70,239,0.4)] flex items-center justify-center gap-2 border border-fuchsia-400/50`}
                >
                    {isSubmittingHomeRef ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>Claim Starter Pack <Sparkles className="w-4 h-4" /></>}
                </button>
            </div>
        </div>
      )}

      <div className={`${theme.sectionBg} rounded-[2rem] p-4 sm:p-5 ${theme.sectionShadow} border ${theme.sectionBorder} mb-8 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500 mt-6`}>
         <div className="flex flex-wrap sm:flex-nowrap w-full md:w-auto items-center gap-2 md:gap-3 flex-1">
            <Link href="/dashboard/email-builder" className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors ${theme.btnPrimary}`}>
              <Mail className="w-4 h-4 shrink-0" /> <span className="truncate">Email Studio</span>
            </Link>
            <Link href={`/athlete/${athleteProfile?.custom_slug || athleteProfile?.id}`} target="_blank" className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors ${theme.btnPrimary}`}>
              <Globe className="w-4 h-4 shrink-0" /> <span className="truncate">Public Profile</span>
            </Link>
            <button onClick={() => { if (athleteProfile?.trust_level !== 1) setIsEmailVerificationModalOpen(true); else if (!athleteProfile?.high_school) setIsTeamJoinModalOpen(true); else router.push('/dashboard/team'); }} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors ${theme.btnPrimary}`}>
              <Users className="w-4 h-4 shrink-0" /> <span className="truncate">Team HQ</span>
            </button>
         </div>
         <div className={`w-px h-10 ${theme.isDark ? 'bg-white/10' : 'bg-slate-200'} hidden md:block`}></div>
         <div className="flex items-center justify-center gap-6 sm:gap-8 w-full md:w-auto px-4">
            <div className="flex flex-col items-center text-center"><span className={`text-xl font-black leading-none ${theme.textHeader}`}>{athleteProfile?.search_appearances || 0}</span><span className={`text-[9px] font-bold ${theme.textMuted} uppercase tracking-widest mt-1`}>Impressions</span></div>
            <div className="flex flex-col items-center text-center"><span className={`text-xl font-black leading-none ${theme.textHeader}`}>{athleteProfile?.profile_views || 0}</span><span className={`text-[9px] font-bold ${theme.textMuted} uppercase tracking-widest mt-1`}>Views</span></div>
            <button onClick={() => { goToTab('social'); setSocialSubTab('analytics'); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${theme.btnSecondary}`}><BarChart3 className={`w-5 h-5 ${theme.iconColor}`} /></button>
         </div>
      </div>

      {hasUnclaimedReferrals && (
         <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/50 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between mb-8 shadow-[0_0_20px_rgba(245,158,11,0.2)] gap-4 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4">
               <div className="bg-amber-500/20 p-3 rounded-full shadow-inner"><Gift className="w-6 h-6 text-amber-400" /></div>
               <div>
                  <h4 className="text-base font-black text-white tracking-tight">Unclaimed Referral Loot!</h4>
                  <p className="text-sm font-medium text-amber-200/80">You've successfully recruited friends to the platform. Claim your points and loot boxes now.</p>
               </div>
            </div>
            <button onClick={() => goToTab('rewards')} className="bg-amber-500 hover:bg-amber-400 text-amber-950 text-sm font-black px-6 py-3 rounded-xl transition-transform active:scale-[0.98] shadow-[0_0_15px_rgba(245,158,11,0.4)] shrink-0 flex items-center justify-center gap-2">
               Go to Rewards <ChevronRight className="w-4 h-4" />
            </button>
         </div>
      )}

      <div className={`${theme.sectionBg} rounded-[2rem] ${theme.sectionShadow} border ${theme.sectionBorder} overflow-hidden transition-all duration-300 mt-6`}>
         <button onClick={() => setIsCollegesOpen(!isCollegesOpen)} className={`w-full flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 bg-transparent hover:${theme.subCardBg} transition-colors gap-4`}>
            <div className="flex items-center gap-4 text-left">
               <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner ${theme.isDark ? 'bg-blue-500/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}><Bookmark className={`w-6 h-6 ${theme.isDark ? 'text-blue-400 fill-blue-400/30' : 'text-blue-600 fill-blue-600/30'}`} /></div>
               <div><h2 className={`text-2xl font-black tracking-tight ${theme.textHeader}`}>Target Colleges Board</h2><p className={`text-sm font-medium mt-1 ${theme.textMuted}`}>{savedColleges.length} programs loaded in tracked database metrics</p></div>
            </div>
            <div className="flex items-center gap-4 self-end md:self-auto">{isCollegesOpen ? <ChevronUp className={`w-6 h-6 ${theme.textMuted} shrink-0`} /> : <ChevronDown className={`w-6 h-6 ${theme.textMuted} shrink-0`} />}</div>
         </button>

         {isCollegesOpen && (
            <div className={`p-6 md:p-8 border-t ${theme.isDark ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-slate-50/50'} animate-in fade-in slide-in-from-top-4 duration-300`}>
               <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <h3 className={`font-black text-lg flex items-center gap-2 ${theme.textHeader}`}><Scale className={`w-5 h-5 ${theme.iconColor}`} /> College Comparison Board</h3>
                  <Link href="/search" className={`text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 justify-center ${theme.isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>Find More Colleges <Search className="w-4 h-4" /></Link>
               </div>
               {savedColleges.length > 0 ? (
                 <div className="overflow-x-auto custom-scrollbar pb-4">
                   <table className="w-full text-left min-w-[900px]">
                     <thead>
                       <tr className={`border-b ${theme.isDark ? 'border-white/10' : 'border-slate-200'}`}>
                         <th className={`p-4 text-xs font-black uppercase tracking-widest ${theme.textMuted}`}>Program</th>
                         <th className={`p-4 text-xs font-black uppercase tracking-widest ${theme.textMuted}`}>Athletic Match</th>
                         <th className={`p-4 text-xs font-black uppercase tracking-widest ${theme.textMuted}`}>Net Tuition / Yr</th>
                         <th className={`p-4 text-xs font-black uppercase tracking-widest ${theme.textMuted}`}>10-Yr Salary</th>
                         <th className={`p-4 text-xs font-black uppercase tracking-widest ${theme.textMuted}`}>Acceptance</th>
                         <th className={`p-4 text-xs font-black uppercase tracking-widest text-center ${theme.textMuted}`}>Action</th>
                       </tr>
                     </thead>
                     <tbody className={`divide-y ${theme.isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}>
                       {savedColleges.map((saved: any) => {
                         const college = saved.universities; if (!college) return null; const stats = getRealStats(college);
                         return (
                           <tr key={saved.id} className={`${theme.isDark ? 'bg-slate-900/40 hover:bg-slate-800/80' : 'bg-white hover:bg-slate-50'} transition-colors group`}>
                             <td className="p-4 flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 overflow-hidden ${theme.isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100'}`}>
                                 {college.logo_url ? <img src={college.logo_url} className="w-6 h-6 object-contain" alt={college.name} /> : <School className={`w-5 h-5 ${theme.textMuted}`} />}
                               </div>
                               <div className="truncate max-w-[200px]">
                                 <Link href={`/college/${college.slug}?sport=${primarySportQuery}`} className={`font-black hover:text-blue-400 transition-colors block truncate ${theme.textHeader}`}>{college.name}</Link>
                                 <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.textMuted}`}>{college.division} • {college.state}</span>
                               </div>
                             </td>
                             <td className="p-4"><span className={`font-black px-2.5 py-1 rounded-md ${theme.isDark ? 'text-blue-400 bg-blue-500/10' : 'text-blue-700 bg-blue-100'}`}>{stats.matchScore > 0 ? stats.matchScore : '-'}</span></td>
                             <td className={`p-4 font-black ${theme.isDark ? 'text-slate-300' : 'text-slate-700'}`}>{stats.tuitionStr}</td>
                             <td className={`p-4 font-black ${theme.isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{stats.salaryStr}</td>
                             <td className={`p-4 font-bold ${theme.textSub}`}>{stats.gradRateStr}</td>
                             <td className="p-4 text-center">
                               <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveCollegeDashboard(saved.id); }} className={`hover:text-red-400 p-2 rounded-lg transition-colors inline-block ${theme.isDark ? 'text-slate-400 hover:bg-red-500/10' : 'text-slate-500 hover:bg-red-50'}`}><Trash2 className="w-4 h-4" /></button>
                             </td>
                           </tr>
                         )
                       })}
                     </tbody>
                   </table>
                 </div>
               ) : (
                 <div className={`text-center py-12 rounded-2xl border border-dashed flex flex-col items-center justify-center ${theme.isDark ? 'bg-slate-900/50 border-white/10' : 'bg-slate-50 border-slate-300'}`}>
                    <School className={`w-12 h-12 mb-4 ${theme.textMuted}`} />
                    <h4 className={`text-lg font-black mb-1 ${theme.textHeader}`}>Your board is empty</h4>
                    <Link href="/search" className={`font-bold py-2.5 px-6 rounded-xl transition-colors shadow-md mt-4 ${theme.isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>Open College Finder</Link>
                 </div>
               )}
            </div>
         )}
      </div>
    </div>
  ), [athleteProfile, gatingMode, savedColleges, isCollegesOpen, primarySportQuery, dailyViews, monthlyViews, router, theme, homeReferralCode, isSubmittingHomeRef, timeLeft, isOfferExpired, isTimerLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse uppercase tracking-widest text-xs">Loading Homebase...</p>
      </div>
    );
  }

  let backgroundEffects = <div className={`absolute top-0 right-0 w-[500px] h-[500px] ${theme.isDark ? 'bg-white/5' : 'bg-blue-500/10'} blur-[100px] rounded-full pointer-events-none z-0`}></div>;

  if (theme.isDark) {
    backgroundEffects = (
      <>
        {['hype', 'premium', 'mythic-flare'].includes(athleteProfile?.equipped_card || '') && <div className="holo-glare rounded-[2.5rem]"></div>}
        {['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber', 'mythic-flare'].includes(athleteProfile?.equipped_card || '') && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay pointer-events-none rounded-[2.5rem]"></div>}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[100px] rounded-full pointer-events-none z-0"></div>
      </>
    );
  }

  return (
    <main className={`min-h-screen ${theme.pageBg} font-sans pb-24 md:pb-12 text-slate-200 relative overflow-x-hidden transition-colors duration-500`}>
      
      {/* Heavy Glassmorphism Background Base */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] ${theme.pagePattern}`}></div>
         <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] ${theme.isDark ? 'bg-blue-900/10' : 'bg-blue-400/10'} blur-[120px] rounded-full transition-colors duration-500`}></div>
         <div className={`absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] ${theme.isDark ? 'bg-indigo-900/10' : 'bg-indigo-400/10'} blur-[120px] rounded-full transition-colors duration-500`}></div>
      </div>

      {!loading && athleteProfile && athleteProfile.trust_level !== 1 && (
        <div className="relative z-40 w-full bg-slate-900 border-b border-white/10 text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <p className="text-sm font-medium text-slate-300"><strong className="text-white font-black">Action Required:</strong> Your profile identity is unverified.</p>
          </div>
          <button onClick={() => setIsEmailVerificationModalOpen(true)} className="bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all active:scale-[0.98] flex items-center gap-2">Verify Now <ChevronRight className="w-3 h-3" /></button>
        </div>
      )}

      {sportToDelete && (
        <div className="fixed inset-0 z-[500] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-[2rem] w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center flex flex-col items-center relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[40px] rounded-full pointer-events-none"></div>
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(239,68,68,0.2)]"><ShieldAlert className="w-8 h-8 text-red-500" /></div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Delete {sportToDelete}?</h3>
              <p className="text-slate-400 font-medium text-sm mb-8 leading-relaxed">Are you absolutely sure you want to permanently delete all your {sportToDelete} data? This action cannot be undone.</p>
              <div className="flex gap-4 w-full relative z-10">
                <button onClick={() => setSportToDelete(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm">Cancel</button>
                <button onClick={confirmDeleteSport} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-[0.98]">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 font-bold text-sm border ${toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-slate-900 text-white border-slate-700'}`}>
            {toast.type === 'error' ? <X className="w-4 h-4 text-red-400" /> : <Check className="w-4 h-4 text-emerald-400" />} {toast.message}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerGlare { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes cyberScan { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(1000%); opacity: 0; } }
        @keyframes voidPulse { 0%, 100% { background-size: 100% 100%; filter: brightness(1); } 50% { background-size: 120% 120%; filter: brightness(1.2); } }
        
        /* Modal & Chest FX */
        @keyframes spin-rays { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
        .god-rays {
           position: absolute; top: 50%; left: 50%; width: 250vw; height: 250vw;
           background: conic-gradient(from 0deg, transparent 0deg, var(--tease-color) 20deg, transparent 40deg, var(--tease-color) 60deg, transparent 80deg, var(--tease-color) 100deg, transparent 120deg, var(--tease-color) 140deg, transparent 160deg, var(--tease-color) 180deg, transparent 200deg, var(--tease-color) 220deg, transparent 240deg, var(--tease-color) 260deg, transparent 280deg, var(--tease-color) 300deg, transparent 320deg, var(--tease-color) 340deg, transparent 360deg);
           opacity: 0.15; animation: spin-rays 20s linear infinite; pointer-events: none; mix-blend-mode: screen; z-index: 0;
        }
        @keyframes ethereal-reveal {
          0% { transform: scale(0.8) translateY(20px); opacity: 0; filter: drop-shadow(0 0 100px var(--tease-color)) brightness(2); }
          50% { transform: scale(1.1) translateY(-10px); opacity: 1; filter: brightness(1.5); }
          100% { transform: scale(1) translateY(0); opacity: 1; filter: drop-shadow(0 0 20px var(--tease-color)) brightness(1); }
        }
        .animate-reveal { animation: ethereal-reveal 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        
        @keyframes pulse-glow {
            0%, 100% { filter: drop-shadow(0 0 15px rgba(245,158,11,0.4)); transform: scale(1); }
            50% { filter: drop-shadow(0 0 25px rgba(245,158,11,0.8)); transform: scale(1.05) translateY(-5px); }
        }
        .animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
        
        .holo-card-base { background: transparent; }
        .holo-card-obsidian { background: linear-gradient(135deg, #0f172a 0%, #334155 25%, #000000 50%, #0f172a 75%, #1e293b 100%); background-size: 300% 300%; }
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
            linear-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.15) 1px, transparent 1px),
            linear-gradient(135deg, #022c22 0%, #064e3b 50%, #083344 100%);
          background-size: 20px 20px, 20px 20px, 100% 100%;
          box-shadow: inset 0 0 40px rgba(6, 182, 212, 0.3);
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
      <div className={`pb-16 md:pb-20 px-5 md:px-6 relative transition-all duration-500 z-30 pt-10 border-b border-b-[rgba(255,255,255,0.1)] ${theme.heroCard} ${getEquippedGlow(athleteProfile?.equipped_border)}`}>
        {backgroundEffects}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8 relative z-30">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
            <div className="relative w-28 h-28 md:w-36 md:h-36 shrink-0 flex items-center justify-center group cursor-pointer" onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}>
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r={66} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
                <circle cx="72" cy="72" r={66} stroke="currentColor" strokeWidth="6" fill="transparent" className={readiness.score === 100 ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-blue-500"} strokeDasharray={2 * Math.PI * 66} strokeDashoffset={(2 * Math.PI * 66) - (readiness.score / 100) * (2 * Math.PI * 66)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
              </svg>
              <div className="relative z-10 flex items-center justify-center w-24 h-24 md:w-32 md:h-32">
                <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId={athleteProfile?.equipped_border} sizeClasses="w-full h-full absolute inset-0 shadow-xl" />
                <div className={`absolute inset-1 rounded-full bg-slate-900/60 flex flex-col items-center justify-center text-white transition-all backdrop-blur-[2px] ${isUploadingAvatar ? 'opacity-100 z-20' : 'opacity-0 group-hover:opacity-100 z-20'}`}>
                  {isUploadingAvatar ? <RefreshCw className="w-6 h-6 animate-spin text-white" /> : <div className="flex flex-col items-center gap-1"><Camera className="w-6 h-6 text-white" /><span className="text-[9px] font-black uppercase tracking-widest text-white">Upload</span></div>}
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleAvatarUpload} />
            </div>

            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className={`text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3 ${theme.heroName}`}>
                  {athleteProfile?.first_name ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'Welcome, Athlete'}
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => router.push('/dashboard/profile')} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors border border-white/20 shrink-0 shadow-sm" title="Update Profile Details"><Edit3 className="w-4 h-4 text-white/80" /></button>
                  <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                    <Points className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-black text-amber-400">{athleteProfile?.coins?.toLocaleString() || 0} pts</span>
                  </div>
                  {athleteProfile?.is_founder && <span className="bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-1.5 border border-amber-300 animate-pulse"><Crown className="w-3 h-3" /> Early Access</span>}
                </div>
              </div>

              <p className={`text-base md:text-lg font-medium flex items-center justify-center md:justify-start gap-2 mb-4 ${theme.heroMeta}`}>
                <MapPin className="w-4 h-4 opacity-70" /> {athleteProfile?.high_school || 'General Athlete Profile'} {athleteProfile?.grad_year && ` • Class of ${athleteProfile.grad_year}`}
              </p>
              
              {readiness.score < 100 && (
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3 inline-flex items-center gap-4 max-w-lg w-full text-left shadow-lg relative overflow-hidden group mb-5 animate-in fade-in zoom-in-95 duration-300">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[20px] rounded-full pointer-events-none"></div>
                   <div className="w-10 h-10 rounded-full border-2 border-slate-700 flex items-center justify-center shrink-0 relative bg-slate-950"><span className="text-[10px] font-black text-white">{readiness.score}%</span></div>
                   <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Recruit Readiness Quest</p><p className="text-xs font-bold text-slate-200 leading-tight pr-2">{readiness.nextQuest}</p></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-20 md:top-24 z-20 w-full flex justify-center px-4 mt-6 animate-in slide-in-from-bottom-4 duration-500 pointer-events-none">
        <div className={`${theme.isDark ? 'bg-slate-900/80' : 'bg-white/90'} backdrop-blur-xl p-1.5 rounded-full shadow-lg border ${theme.isDark ? 'border-white/10' : 'border-slate-200'} inline-flex gap-1 pointer-events-auto`}>
          <button onClick={() => goToTab('home')} className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-md scale-[1.02]' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-500/10'}`}>
            <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Homebase</span>
          </button>
          <button onClick={() => goToTab('social')} className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'social' ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10'}`}>
            <ImageIcon className="w-4 h-4" /> <span className="hidden sm:inline">Portfolio & Performance</span>
          </button>
          <button onClick={() => goToTab('rewards')} className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'rewards' ? 'bg-fuchsia-500 text-white shadow-md scale-[1.02]' : 'text-slate-400 hover:text-fuchsia-500 hover:bg-fuchsia-500/10'}`}>
            <Gift className="w-4 h-4" /> <span className="hidden sm:inline">Rewards</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 relative z-10 space-y-6">
        {activeTab === 'home' && RenderHomeTab}
        {activeTab === 'social' && <PerformanceStats state={sharedPerformanceState} actions={sharedPerformanceActions} />}
        {activeTab === 'rewards' && (
          <Rewards 
            athleteProfile={athleteProfile} 
            streak={streak} 
            coins={coins} 
            awardedToday={awardedToday} 
            awardedBoxToday={awardedBoxToday} 
            handleShareCode={async (c: string) => { await navigator.clipboard.writeText(`Join me on ChasedSports! Use my invite code: ${c}`); showToast("Copied to clipboard!", "success"); }} 
            claimedReferrals={athleteProfile?.claimed_referrals || 0}
            onClaimReferral={handleClaimReferral}
            onSubmitReferralCode={handleReferralSubmit}
          />
        )}
      </div>

      {/* Starter Pack Unlocked Modal */}
      {showStarterPackModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"></div>

           <div className="god-rays animate-in fade-in zoom-in duration-1000" style={{ '--tease-color': 'rgba(217,70,239,1)' } as React.CSSProperties}></div>

           <div className="bg-slate-900 border border-fuchsia-500/50 shadow-[0_0_50px_rgba(217,70,239,0.3)] rounded-[2rem] w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-300 transition-all">
              <div className="p-6 sm:p-8 text-center relative overflow-hidden rounded-[2rem]">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-fuchsia-500/10 blur-[40px] rounded-full pointer-events-none"></div>
                 
                 <div className="relative z-10 animate-reveal">
                    <Rocket className="w-12 h-12 text-fuchsia-400 mx-auto mb-3 drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]" />
                    <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Starter Pack Unlocked!</h3>
                    <p className="text-slate-400 font-medium text-sm mb-6 px-4">Your accounts are linked. You just scored your new athlete bonus loot!</p>
                    
                    <div className="flex justify-center items-stretch gap-3 sm:gap-4 mb-8 mt-2">
                       <div className="bg-slate-950 border border-amber-500/50 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative w-36 sm:w-40 aspect-square hover:scale-105 transition-transform duration-300">
                          <div className="flex-1 flex items-center justify-center mb-2">
                             <Points className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                          </div>
                          <span className="text-3xl font-black text-white leading-none mb-1">+500</span>
                          <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest text-center">Points</span>
                       </div>
                       
                       <div className="bg-slate-950 border border-blue-500/50 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative w-36 sm:w-40 aspect-square hover:scale-105 transition-transform duration-300">
                          <div className="flex-1 flex items-center justify-center mb-2 w-full max-h-[50%]">
                             <LootBoxVisual tier="standard" size="md" />
                          </div>
                          <span className="text-2xl font-black text-white leading-none mb-1">+1</span>
                          <span className="text-[10px] font-bold text-blue-500/80 uppercase tracking-widest text-center leading-tight">Standard Box</span>
                       </div>
                    </div>

                    <button
                       onClick={() => setShowStarterPackModal(false)}
                       className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl border border-slate-700 transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                    >
                       Awesome! <CheckCircle2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showDailyRewardModal && dailyRewardData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"></div>

           {claimStage === 'claimed' && (
               <div 
                 className="god-rays animate-in fade-in zoom-in duration-1000" 
                 style={{ '--tease-color': dailyRewardData.tier ? (dailyRewardData.tier === 'ultra' ? 'rgba(217,70,239,1)' : dailyRewardData.tier === 'premium' ? 'rgba(168,85,247,1)' : 'rgba(96,165,250,1)') : 'rgba(251,191,36,1)' } as React.CSSProperties}
               ></div>
           )}

           <div className={`bg-slate-900 border ${dailyRewardData.tier === 'ultra' && claimStage === 'claimed' ? 'border-fuchsia-500/50 shadow-[0_0_50px_rgba(217,70,239,0.3)]' : 'border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)]'} rounded-[2rem] w-full ${claimStage === 'idle' ? 'max-w-3xl' : 'max-w-sm'} max-h-[85vh] overflow-y-auto custom-scrollbar relative z-10 animate-in zoom-in-95 duration-300 transition-all`}>
              <div className="p-6 sm:p-8 text-center relative overflow-hidden rounded-[2rem]">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none"></div>
                 {dailyRewardData.tier && claimStage === 'claimed' && (
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-fuchsia-500/10 blur-[40px] rounded-full pointer-events-none transition-opacity duration-500"></div>
                 )}

                 {claimStage === 'idle' ? (
                    <div className="relative z-10 animate-in fade-in zoom-in duration-300">
                       <Gift className="w-12 h-12 text-amber-400 mx-auto mb-3 animate-pulse-glow" />
                       <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Daily Login Reward</h3>
                       <p className="text-slate-400 font-medium text-sm mb-6 px-4">You've reached Day {dailyRewardData.dayNumInCycle} of your {dailyRewardData.cycleMultiplier.toFixed(1)}x cycle!</p>
                       
                       <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3 mb-6 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
                         {[...Array(28)].map((_, i) => {
                           const dayNum = i + 1;
                           const isPast = dayNum <= dailyRewardData.dayNumInCycle;
                           const isUpcomingDay = dayNum === dailyRewardData.dayNumInCycle + 1;
                           
                           const rewardData = getRewardForDay(dayNum);
                           const totalReward = Math.round(rewardData.baseCoins * dailyRewardData.cycleMultiplier);

                           return (
                               <div key={i} className={`relative p-2 sm:p-3 rounded-2xl border-2 flex flex-col items-center justify-between gap-1 text-center transition-all aspect-[3/4] sm:aspect-[4/5] ${isPast ? 'bg-slate-900 border-slate-800 opacity-50' : isUpcomingDay ? 'bg-emerald-900/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.05] z-10' : 'bg-slate-900 border-slate-700'}`}>
                                   {isPast && <div className="absolute top-1 right-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/></div>}
                                   <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 ${isUpcomingDay ? 'text-emerald-400' : 'text-slate-500'}`}>Day {dayNum}</span>

                                   <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-700 ${rewardData.glow && !isPast ? rewardData.glow : ''}`}>
                                       {rewardData.tier && !isPast ? (
                                           <LootBoxVisual tier={rewardData.tier} size="sm" />
                                       ) : (
                                          <div className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isPast ? 'text-slate-600' : rewardData.iconColor}`}>
                                              <rewardData.Icon className="w-full h-full" />
                                          </div>
                                       )}
                                   </div>
                                   
                                   <span className={`font-black mt-auto ${isUpcomingDay ? 'text-amber-400 text-sm sm:text-base drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-[10px] sm:text-xs text-slate-400'}`}>+{totalReward}</span>
                               </div>
                           )
                         })}
                       </div>

                       <div className="mb-4 text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 py-2.5 px-4 rounded-xl inline-flex items-center gap-2">
                           <Points className="w-4 h-4" /> Today's Reward: +{dailyRewardData.points} Points {dailyRewardData.box && ` & 1x ${dailyRewardData.box}`}
                       </div>

                       <button
                         onClick={handleClaimDailyReward}
                         className="w-full sm:w-2/3 mx-auto bg-amber-500 hover:bg-amber-400 text-amber-950 font-black py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-transform active:scale-[0.98] text-lg flex items-center justify-center gap-2"
                       >
                          Claim Today's Loot <ArrowRight className="w-5 h-5" />
                       </button>
                    </div>
                 ) : (
                    <div className="relative z-10 animate-reveal">
                       <div className="flex justify-center items-stretch gap-3 sm:gap-4 mb-8 mt-2">
                          <div className="bg-slate-950 border border-amber-500/50 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative w-36 sm:w-40 aspect-square hover:scale-105 transition-transform duration-300">
                             <div className="flex-1 flex items-center justify-center mb-2">
                                <Points className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                             </div>
                             <span className="text-3xl font-black text-white leading-none mb-1">+{dailyRewardData.points}</span>
                             <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest text-center">Points</span>
                          </div>
                          {dailyRewardData.box && dailyRewardData.tier && (
                             <div className="bg-slate-950 border border-fuchsia-500/50 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative w-36 sm:w-40 aspect-square hover:scale-105 transition-transform duration-300">
                                <div className="flex-1 flex items-center justify-center mb-2 w-full max-h-[50%]">
                                   <LootBoxVisual tier={dailyRewardData.tier} size="md" />
                                </div>
                                <span className="text-2xl font-black text-white leading-none mb-1">+1</span>
                                <span className="text-[10px] font-bold text-fuchsia-500/80 uppercase tracking-widest text-center leading-tight">{dailyRewardData.box}</span>
                             </div>
                          )}
                       </div>
                       <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Loot Secured!</h3>
                       <p className="text-amber-200/80 font-medium text-sm mb-6">Come back tomorrow to keep your multiplier growing.</p>
                       <button
                         onClick={() => { setShowDailyRewardModal(false); setClaimStage('idle'); }}
                         className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl border border-slate-700 transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                       >
                         Continue to Homebase <CheckCircle2 className="w-4 h-4" />
                       </button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* REFERRAL REWARD MODAL */}
      {showReferralModal && referralRewardData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"></div>

           <div className="god-rays animate-in fade-in zoom-in duration-1000" style={{ '--tease-color': 'rgba(217,70,239,1)' } as React.CSSProperties}></div>

           <div className="bg-slate-900 border border-fuchsia-500/50 shadow-[0_0_50px_rgba(217,70,239,0.3)] rounded-[2rem] w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-300">
              <div className="p-6 sm:p-8 text-center relative overflow-hidden rounded-[2rem]">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-fuchsia-500/10 blur-[40px] rounded-full pointer-events-none"></div>
                 
                 <div className="relative z-10 animate-reveal">
                    <div className="flex justify-center items-stretch gap-3 sm:gap-4 mb-8 mt-2">
                       <div className="bg-slate-950 border border-amber-500/50 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative w-36 sm:w-40 aspect-square hover:scale-105 transition-transform duration-300">
                          <div className="flex-1 flex items-center justify-center mb-2">
                             <Points className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                          </div>
                          <span className="text-3xl font-black text-white leading-none mb-1">+{referralRewardData.pts}</span>
                          <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest text-center">Points</span>
                       </div>
                       
                       {referralRewardData.hasBox && (
                          <div className="bg-slate-950 border border-fuchsia-500/50 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner relative w-36 sm:w-40 aspect-square hover:scale-105 transition-transform duration-300">
                             <div className="flex-1 flex items-center justify-center mb-2 w-full max-h-[50%]">
                                <LootBoxVisual tier="ultra" size="md" />
                             </div>
                             <span className="text-2xl font-black text-white leading-none mb-1">+1</span>
                             <span className="text-[10px] font-bold text-fuchsia-500/80 uppercase tracking-widest text-center leading-tight">{referralRewardData.box}</span>
                          </div>
                       )}
                    </div>

                    <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Recruit Secured!</h3>
                    <p className="text-fuchsia-200/80 font-medium text-sm mb-6">You claimed your bounty for reaching {referralRewardData.count} verified recruits.</p>
                    
                    <button
                       onClick={() => setShowReferralModal(false)}
                       className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl border border-slate-700 transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                    >
                       Continue to Homebase <CheckCircle2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isEmailVerificationModalOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md relative animate-in zoom-in-95 duration-300">
             <button onClick={() => { setIsEmailVerificationModalOpen(false); window.location.reload(); }} className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 text-white font-black"><X className="w-5 h-5" /></button>
             <EmailVerification />
          </div>
        </div>
      )}

      {isTeamJoinModalOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white relative">
               <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[50px] rounded-full"></div>
               <button onClick={() => setIsTeamJoinModalOpen(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"><X className="w-5 h-5 text-white" /></button>
               <h2 className="text-3xl font-black mb-2 flex items-center gap-3 relative z-10"><Users className="w-8 h-8 text-amber-300" /> Join Your Team</h2>
               <p className="text-blue-100 font-medium relative z-10">Search the database to link your profile to your High School roster.</p>
            </div>
            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {!showAddTeamForm ? (
                <>
                  <div className="relative" ref={teamDropdownRef}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">High School Alignment <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input type="text" value={teamSearchQuery} onFocus={() => setShowTeamDropdown(true)} onChange={(e) => { setTeamSearchQuery(e.target.value); setShowTeamDropdown(true); if (teamForm.high_school && e.target.value !== teamForm.high_school) { setTeamForm({...teamForm, high_school: '', city: '', state: ''}); } }} className={`w-full bg-slate-950 text-white border pl-11 pr-4 py-3 text-sm font-bold outline-none transition-all ${teamForm.high_school ? 'border-emerald-500 focus:ring-emerald-500' : 'border-slate-700 focus:ring-2 focus:ring-blue-500'} rounded-xl`} placeholder="Search for your high school..." />
                      {teamForm.high_school && <div className="absolute right-4 top-1/2 -translate-y-1/2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>}
                    </div>
                    {showTeamDropdown && teamSearchQuery.length > 1 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                        <div className="max-h-52 overflow-y-auto custom-scrollbar p-2">
                          {isSearchingTeams ? (
                            <div className="p-4 text-center text-sm font-bold text-slate-400 flex justify-center items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Querying Database...</div>
                          ) : teamSearchResults.length > 0 ? (
                            teamSearchResults.map((team: any) => (
                              <button key={team.id} onClick={() => selectExistingTeam(team)} className="w-full text-left px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-between group">
                                <div><p className="text-sm font-black text-white group-hover:text-blue-400">{team.high_school_name}</p><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{team.city}, {team.state} {team.division && `• ${team.division}`}</p></div>
                                <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))
                          ) : <div className="p-4 text-center"><p className="text-sm font-bold text-slate-500 mb-2">No matching schools found.</p></div>}
                        </div>
                        <div className="border-t border-slate-800 bg-slate-950 p-3"><button onClick={() => { setNewTeamName(teamSearchQuery); setShowAddTeamForm(true); }} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"><Plus className="w-4 h-4" /> Don't see your school? Add it here</button></div>
                      </div>
                    )}
                    {teamForm.city && teamForm.state && <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Verified Location: {teamForm.city}, {teamForm.state}</p>}
                  </div>
                  <button onClick={handleSaveTeamJoin} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2 mt-4"><Save className="w-5 h-5"/> Join Team Roster</button>
                </>
              ) : (
                <div className="animate-in slide-in-from-right-8 duration-300">
                   <button onClick={() => setShowAddTeamForm(false)} className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-6"><ChevronDown className="w-4 h-4 rotate-90" /> Back to Team Search</button>
                   <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6"><h4 className="text-sm font-black text-blue-400 flex items-center gap-2 mb-1"><Map className="w-4 h-4" /> Global Database Addition</h4><p className="text-xs font-medium text-blue-300">You are adding a new High School to the global database. Name formatting is auto-enforced.</p></div>
                   <div className="space-y-5">
                      <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">High School Name <span className="text-red-500">*</span></label><input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} onBlur={() => setNewTeamName(normalizeHSName(newTeamName))} className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. South Albany High School"/></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Team Mascot <span className="text-red-500">*</span></label><input type="text" value={newTeamMascot} onChange={(e) => setNewTeamNameMascot(e.target.value)} className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. RedHawks"/></div>
                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">State Division <span className="text-red-500">*</span></label><input type="text" value={newTeamDivision} onChange={(e) => setNewTeamDivision(e.target.value)} className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 5A, Division 1"/></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">City <span className="text-red-500">*</span></label><input type="text" value={newTeamCity} onChange={(e) => setNewTeamCity(e.target.value)} className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Albany"/></div>
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">State <span className="text-red-500">*</span></label>
                           <select value={newTeamState} onChange={(e) => setNewTeamState(e.target.value)} className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                             <option value="">Select State...</option>{US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                      </div>
                      <button onClick={handleCreateNewTeam} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2 mt-2"><Save className="w-5 h-5"/> Create & Select Team</button>
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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse uppercase tracking-widest text-xs">Loading Homebase...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}