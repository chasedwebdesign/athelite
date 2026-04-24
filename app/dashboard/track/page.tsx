'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Activity, ShieldCheck, Link as LinkIcon, Trophy, BookOpen, LogOut, Medal, Timer, TrendingUp, CheckCircle2, Search, AlertCircle, Zap, Calendar, MapPin, Camera, Mail, RefreshCw, School, Lock, AlertTriangle, ExternalLink, ChevronRight, Check, Clock, Edit2, MousePointer2, Flame, Bookmark, BookmarkPlus, Share2, Instagram, X, Users, Gift, Paintbrush, ArrowDown, HelpCircle, Globe, UserCircle2, Eye, BarChart3, Rocket, FileText, Save, Crown, Target, Swords, ArrowRight, Trash2, Download, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

import { AvatarWithBorder } from '@/components/AnimatedBorders'; 

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "Washington DC"
];

interface AthleteProfile { 
  id: string; 
  first_name: string | null; 
  last_name: string | null; 
  grad_year: number | null; 
  high_school: string | null; 
  state: string | null; 
  school_size: string | null; 
  conference: string | null; 
  primary_sport: string; 
  athletic_net_url: string | null; 
  trust_level: number; 
  gender: string | null; 
  prs: { event: string; mark: string; date?: string; meet?: string; tier?: { name: string; classes: string }; globalRank?: number }[] | null; 
  avatar_url: string | null; 
  equipped_border: string | null; 
  equipped_title: string | null; 
  current_login_streak: number; 
  last_login_date: string | null; 
  meet_history: string[] | null; 
  current_pr_streak: number; 
  highest_pr_streak: number; 
  base_prs: any[] | null; 
  referred_by: string | null; 
  verified_referrals: number; 
  created_at: string | null; 
  unlocked_borders: string[] | null;
  is_premium: boolean;
  boosts_available: number;
  saved_resume: string | null;
  profile_views: number;
  search_appearances: number;
  rival_ids: string[] | null;
  coins?: number;
}

interface ScoutedAthlete {
  id: string;
  first_name: string;
  last_name: string;
  high_school: string;
  athletic_net_url: string;
  gender: string;
  prs: any[];
  calculated_score: number;
  calculated_tier: string;
  created_at: string;
}

interface ProjectionResult {
  overallScore: number;
  overallLabel: string;
  overallDesc: string;
  color: string;
  bg: string;
  border: string;
  bestEvent: string;
  eventBreakdowns: {
    event: string;
    mark: string;
    score: number;
    currentTier: string;
    nextTier: string;
    targetMarkFormatted: string;
    deltaFormatted: string;
    isField: boolean;
  }[];
}

const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

const EARNED_TITLES = [
  { id: 'legend', name: 'Legend', reqPercentile: 0.01, badgeClass: 'legend-badge', unlockText: 'Reach Top 1%' },
  { id: 'champion', name: 'Champion', reqPercentile: 0.05, badgeClass: 'champion-badge', unlockText: 'Reach Top 5%' },
  { id: 'elite', name: 'Elite', reqPercentile: 0.15, badgeClass: 'elite-badge', unlockText: 'Reach Top 15%' },
  { id: 'master', name: 'Master', reqPercentile: 0.30, badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300', unlockText: 'Reach Top 30%' },
  { id: 'contender', name: 'Contender', reqPercentile: 0.50, badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300', unlockText: 'Reach Top 50%' },
  { id: 'challenger', name: 'Challenger', reqPercentile: 0.75, badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300', unlockText: 'Reach Top 75%' },
  { id: 'prospect', name: 'Prospect', reqPercentile: 1.0, badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300', unlockText: 'Standard Rank' },
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

const convertMarkToNumber = (markStr: string, isField: boolean): number => {
  if (isField) {
    const clean = markStr.replace(/[^0-9.]/g, ' ').trim().split(/\s+/);
    const feet = parseFloat(clean[0]) || 0;
    const inches = parseFloat(clean[1]) || 0;
    return (feet * 12) + inches;
  } else {
    if (markStr.includes(':')) {
      const parts = markStr.split(':');
      return (parseFloat(parts[0]) * 60) + parseFloat(parts[1]);
    }
    return parseFloat(markStr.replace(/[a-zA-Z]/g, '').trim()) || 99999;
  }
};

const formatMarkFromNumber = (val: number, isField: boolean): string => {
  if (isField) {
    const feet = Math.floor(val / 12);
    const inches = val % 12;
    if (feet > 0) return `${feet}' ${inches.toFixed(1).replace(/\.0$/, '')}"`;
    return `${inches.toFixed(1).replace(/\.0$/, '')}"`;
  } else {
    if (val >= 60) {
      const minutes = Math.floor(val / 60);
      const seconds = (val % 60).toFixed(2).padStart(5, '0');
      return `${minutes}:${seconds}`;
    }
    return val.toFixed(2);
  }
};

const parseMarkForSorting = (mark: string, event: string): number => {
  const isField = FIELD_EVENTS.includes(event);
  const val = convertMarkToNumber(mark, isField);
  return isField ? -val : val;
};

const getAthleteProjection = (prs: any[], gender: string): ProjectionResult | null => {
  if (!prs || !Array.isArray(prs) || prs.length === 0) return null;

  const standards = RECRUITING_STANDARDS[gender] || RECRUITING_STANDARDS['Boys'];
  let allBreakdowns: any[] = [];

  prs.forEach((pr) => {
    if (!pr.event || !pr.mark) return;
    const normalizedEvent = pr.event.replace(/Meter\b/i, 'Meters').replace('100 Meter Hurdles', '100m Hurdles').replace('110 Meter Hurdles', '110m Hurdles').replace('300 Meter Hurdles', '300m Hurdles');
    const eventStds = standards[normalizedEvent] || standards[pr.event];
    
    if (eventStds) {
      const val = convertMarkToNumber(pr.mark, !!eventStds.isField);
      let score = 5;
      let currentTier = 'JV Standard';
      let nextTier = 'Varsity';
      let targetMarkNum = eventStds.t7;
      let delta = 0;

      if (eventStds.isField) {
        if (val >= eventStds.t1) { score = 95 + Math.min(4, ((val - eventStds.t1) / (eventStds.t1 * 0.05)) * 4); currentTier = 'Power 4 D1'; nextTier = 'Elite'; targetMarkNum = eventStds.t1 * 1.05; }
        else if (val >= eventStds.t2) { score = 85 + ((val - eventStds.t2) / (eventStds.t1 - eventStds.t2)) * 10; currentTier = 'Mid-Major D1'; nextTier = 'Power 4 D1'; targetMarkNum = eventStds.t1; }
        else if (val >= eventStds.t3) { score = 75 + ((val - eventStds.t3) / (eventStds.t2 - eventStds.t3)) * 10; currentTier = 'Top D2 / Walk-on'; nextTier = 'Mid-Major D1'; targetMarkNum = eventStds.t2; }
        else if (val >= eventStds.t4) { score = 65 + ((val - eventStds.t4) / (eventStds.t3 - eventStds.t4)) * 10; currentTier = 'Solid D2 / High D3'; nextTier = 'Top D2'; targetMarkNum = eventStds.t3; }
        else if (val >= eventStds.t5) { score = 55 + ((val - eventStds.t5) / (eventStds.t4 - eventStds.t5)) * 10; currentTier = 'D3 / NAIA'; nextTier = 'Solid D2'; targetMarkNum = eventStds.t4; }
        else if (val >= eventStds.t6) { score = 40 + ((val - eventStds.t6) / (eventStds.t5 - eventStds.t6)) * 14; currentTier = 'Strong Varsity'; nextTier = 'D3 / NAIA'; targetMarkNum = eventStds.t5; }
        else if (val >= eventStds.t7) { score = 20 + ((val - eventStds.t7) / (eventStds.t6 - eventStds.t7)) * 19; currentTier = 'Varsity Standard'; nextTier = 'Strong Varsity'; targetMarkNum = eventStds.t6; }
        else { const t8 = eventStds.t7 * 0.85; if (val >= t8) { score = 5 + ((val - t8) / (eventStds.t7 - t8)) * 14; } else { score = 5; }; currentTier = 'JV Standard'; nextTier = 'Varsity Standard'; targetMarkNum = eventStds.t7; }
        delta = targetMarkNum - val;
      } else {
        if (val <= eventStds.t1) { score = 95 + Math.min(4, ((eventStds.t1 - val) / (eventStds.t1 * 0.05)) * 4); currentTier = 'Power 4 D1'; nextTier = 'Elite'; targetMarkNum = eventStds.t1 * 0.95; }
        else if (val <= eventStds.t2) { score = 85 + ((eventStds.t2 - val) / (eventStds.t2 - eventStds.t1)) * 10; currentTier = 'Mid-Major D1'; nextTier = 'Power 4 D1'; targetMarkNum = eventStds.t1; }
        else if (val <= eventStds.t3) { score = 75 + ((eventStds.t3 - val) / (eventStds.t3 - eventStds.t2)) * 10; currentTier = 'Top D2 / Walk-on'; nextTier = 'Mid-Major D1'; targetMarkNum = eventStds.t2; }
        else if (val <= eventStds.t4) { score = 65 + ((eventStds.t4 - val) / (eventStds.t4 - eventStds.t3)) * 10; currentTier = 'Solid D2 / High D3'; nextTier = 'Top D2'; targetMarkNum = eventStds.t3; }
        else if (val <= eventStds.t5) { score = 55 + ((eventStds.t5 - val) / (eventStds.t5 - eventStds.t4)) * 10; currentTier = 'D3 / NAIA'; nextTier = 'Solid D2'; targetMarkNum = eventStds.t4; }
        else if (val <= eventStds.t6) { score = 40 + ((eventStds.t6 - val) / (eventStds.t6 - eventStds.t5)) * 14; currentTier = 'Strong Varsity'; nextTier = 'D3 / NAIA'; targetMarkNum = eventStds.t5; }
        else if (val <= eventStds.t7) { score = 20 + ((eventStds.t7 - val) / (eventStds.t7 - eventStds.t6)) * 19; currentTier = 'Varsity Standard'; nextTier = 'Strong Varsity'; targetMarkNum = eventStds.t6; }
        else { const t8 = eventStds.t7 * 1.15; if (val <= t8) { score = 5 + ((t8 - val) / (t8 - eventStds.t7)) * 14; } else { score = 5; }; currentTier = 'JV Standard'; nextTier = 'Varsity Standard'; targetMarkNum = eventStds.t7; }
        delta = val - targetMarkNum; 
      }
      
      score = Math.min(99, Math.max(5, Math.round(score)));

      allBreakdowns.push({ event: normalizedEvent, mark: pr.mark, score, currentTier, nextTier, targetMarkFormatted: formatMarkFromNumber(targetMarkNum, !!eventStds.isField), deltaFormatted: !!eventStds.isField ? `+${formatMarkFromNumber(delta, true)}` : `-${delta.toFixed(2)}s`, isField: !!eventStds.isField });
    }
  });

  if (allBreakdowns.length === 0) return null;
  allBreakdowns.sort((a, b) => b.score - a.score);
  const best = allBreakdowns[0];

  let label = 'JV Standard'; let desc = 'Keep working hard in practice!'; let color = 'text-slate-400'; let bg = 'bg-slate-50'; let border = 'border-slate-100';
  if (best.score >= 95) { label = 'Power 4 D1 Recruit'; desc = 'Priority target for D1 programs.'; color = 'text-fuchsia-600'; bg = 'bg-fuchsia-50'; border = 'border-fuchsia-200'; }
  else if (best.score >= 85) { label = 'Mid-Major D1 Recruit'; desc = 'Scholarship marks for D1/Elite D2.'; color = 'text-purple-600'; bg = 'bg-purple-50'; border = 'border-purple-200'; }
  else if (best.score >= 75) { label = 'D1 Walk-On / Top D2'; desc = 'Strong competitive profile.'; color = 'text-blue-600'; bg = 'bg-blue-50'; border = 'border-blue-200'; }
  else if (best.score >= 65) { label = 'Solid D2 / High D3'; desc = 'Priority recruit for D2 programs.'; color = 'text-emerald-600'; bg = 'bg-emerald-50'; border = 'border-emerald-200'; }
  else if (best.score >= 55) { label = 'D3 / NAIA Prospect'; desc = 'Solid next-level potential.'; color = 'text-amber-600'; bg = 'bg-amber-50'; border = 'border-amber-200'; }
  else if (best.score >= 40) { label = 'Strong Varsity'; desc = 'Great high school competitor.'; color = 'text-slate-600'; bg = 'bg-slate-100'; border = 'border-slate-300'; }

  return { overallScore: best.score, overallLabel: label, overallDesc: desc, color, bg, border, bestEvent: best.event, eventBreakdowns: allBreakdowns };
};

// ============================================================================
// 🚨 MAIN DASHBOARD COMPONENT
// ============================================================================
export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'athlete' | 'coach' | null>(null);
  
  // Onboarding Tabs
  const [onboardTab, setOnboardTab] = useState<'search' | 'link'>('search');
  const [searchFirstName, setSearchFirstName] = useState('');
  const [searchLastName, setSearchLastName] = useState('');
  const [searchCity, setSearchCity] = useState(''); // Added City filter
  const [searchState, setSearchState] = useState('');
  const [isSearchingName, setIsSearchingName] = useState(false);
  const [athleteSearchResults, setAthleteSearchResults] = useState<any[]>([]);
  
  // State Search Combobox Logic
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filteredStates = US_STATES.filter(s => s.toLowerCase().includes(searchState.toLowerCase()));

  // Dashboard States
  const [activeTab, setActiveTab] = useState<'stats' | 'recruiting' | 'scout' | 'rewards'>('stats');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncUrl, setSyncUrl] = useState('');
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const [canSync, setCanSync] = useState(true);
  const [syncCooldownText, setSyncCooldownText] = useState('');
  const [verifyAttempts, setVerifyAttempts] = useState(0);
  const [verifyLockout, setVerifyLockout] = useState<number | null>(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [highestPercentile, setHighestPercentile] = useState<number>(1.0);
  const [equippedTitle, setEquippedTitle] = useState<string>('prospect');
  const [equippedBorder, setEquippedBorder] = useState<string>('none');
  const [isEquipping, setIsEquipping] = useState(false);
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [savedColleges, setSavedColleges] = useState<any[]>([]);
  const [activeRivals, setActiveRivals] = useState<any[]>([]); 
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [daysSinceJoin, setDaysSinceJoin] = useState(0);
  const [scoutUrl, setScoutUrl] = useState('');
  const [isScouting, setIsScouting] = useState(false);
  const [scoutsRemaining, setScoutsRemaining] = useState(10);
  const [scoutedAthletes, setScoutedAthletes] = useState<ScoutedAthlete[]>([]);
  const [activeCardAthlete, setActiveCardAthlete] = useState<ScoutedAthlete | null>(null);
  const [isExportingCard, setIsExportingCard] = useState(false);
  const [dailyViews, setDailyViews] = useState(0);
  const [monthlyViews, setMonthlyViews] = useState(0);
  const [allRecentViewers, setAllRecentViewers] = useState<any[]>([]);
  const [recentViewers, setRecentViewers] = useState<any[]>([]);
  const [showAllViewersModal, setShowAllViewersModal] = useState(false);
  const [showImpressionTooltip, setShowImpressionTooltip] = useState(false);
  const [expandedEventIndex, setExpandedEventIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);

  // 🚨 RESTORED MISSING STATES 🚨
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const giveDailyReward = async (userId: string, currentCoins: number) => {
    try {
      const newBalance = currentCoins + 10;
      await supabase.from('athletes').update({ coins: newBalance }).eq('id', userId);
      showToast("You earned 10 Coins for your daily login streak!", "success");
    } catch (e) {}
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsStateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🚨 CHECK LOCALSTORAGE FOR COOLDOWNS ON MOUNT 🚨
  useEffect(() => {
    const lastSync = localStorage.getItem('last_sync_time');
    if (lastSync) {
      const timeSince = Date.now() - parseInt(lastSync);
      const hours24 = 24 * 60 * 60 * 1000;
      if (timeSince < hours24) {
        const remaining = hours24 - timeSince;
        const hoursLeft = Math.ceil(remaining / (1000 * 60 * 60));
        setCanSync(false);
        setSyncCooldownText(`Sync available in ${hoursLeft}h`);
      }
    }

    const lockedUntil = localStorage.getItem('verify_lockout_until');
    if (lockedUntil && Date.now() < parseInt(lockedUntil)) {
      setVerifyLockout(parseInt(lockedUntil));
    } else {
      localStorage.removeItem('verify_lockout_until');
      localStorage.removeItem('verify_attempts');
    }
    
    const attempts = localStorage.getItem('verify_attempts');
    if (attempts) setVerifyAttempts(parseInt(attempts));
  }, []);

  const handleContactCoach = (coachEmail: string | null) => {
    if (!coachEmail) {
      showToast("This coach has not made their contact information public.", "error");
      return;
    }
    window.location.href = `mailto:${coachEmail}?subject=Recruiting Inquiry from ChasedSports Profile`;
  };

  const handleRemoveCollege = async (savedId: string) => {
    try {
      const { error } = await supabase.from('saved_colleges').delete().eq('id', savedId);
      if (error) throw error;
      setSavedColleges(prev => prev.filter(c => c.id !== savedId));
      showToast("School removed from target list.", "success");
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 🚨 COLLEGE FINDER: LIVE SEARCH EFFECT 🚨
  useEffect(() => {
    const searchColleges = async () => {
      if (searchQuery.trim().length < 3) {
        setSearchResults([]);
        return;
      }
      setIsSearchingColleges(true);
      const { data, error } = await supabase
        .from('universities')
        .select('id, name, state, division, logo_url')
        .ilike('name', `%${searchQuery.trim()}%`)
        .limit(6);
      
      if (data) setSearchResults(data);
      setIsSearchingColleges(false);
    };
    
    const timeoutId = setTimeout(searchColleges, 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, supabase]);

  // 🚨 COLLEGE FINDER: SAVE SCHOOL 🚨
  const handleSaveCollege = async (collegeId: string) => {
    if (!currentUserId) return;
    try {
      const exists = savedColleges.some(c => c.college_id === collegeId);
      if (exists) {
        showToast("College is already on your board!", "error");
        return;
      }

      const { error } = await supabase.from('saved_colleges').insert({
        athlete_id: currentUserId,
        college_id: collegeId
      });
      if (error) throw error;
      
      const { data: savedCollegesData } = await supabase
        .from('saved_colleges')
        .select(`id, college_id, universities (*)`)
        .eq('athlete_id', currentUserId);
        
      if (savedCollegesData) setSavedColleges(savedCollegesData);
      
      setSearchQuery('');
      showToast("College added to your board!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const toggleEventExpansion = (index: number) => {
    setExpandedEventIndex(prev => prev === index ? null : index);
  };

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setCurrentUserId(session.user.id);

      const { data: cData } = await supabase.from('coaches').select('id').eq('id', session.user.id).maybeSingle();
      if (cData) { router.push('/dashboard/coach'); return; }

      const { data: messageData } = await supabase
        .from('messages')
        .select('id, athlete_id, chat_history')
        .or(`athlete_id.eq.${session.user.id},sender_email.eq.${session.user.email}`)
        .eq('is_read', false);

      if (messageData) {
        const realUnreadCount = messageData.filter((msg: any) => {
          const history = msg.chat_history || [];
          if (history.length > 0) return history[history.length - 1].sender_id !== session.user.id;
          return msg.athlete_id === session.user.id;
        }).length;
        setUnreadCount(realUnreadCount);
      }

      try {
        const { data: savedCollegesData } = await supabase
          .from('saved_colleges')
          .select(`id, college_id, universities (*)`)
          .eq('athlete_id', session.user.id);
          
        if (savedCollegesData) setSavedColleges(savedCollegesData);
      } catch (e) {}

      const { data: scoutedData } = await supabase
        .from('scouted_athletes')
        .select('*')
        .eq('scouted_by', session.user.id)
        .order('created_at', { ascending: false });
        
      if (scoutedData) {
        setScoutedAthletes(scoutedData);
        const todayStr = new Date().toLocaleDateString('en-US');
        const scoutsToday = scoutedData.filter((s: any) => new Date(s.created_at).toLocaleDateString('en-US') === todayStr).length;
        setScoutsRemaining(Math.max(0, 10 - scoutsToday));
      }

      const { data: aData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();
      
      if (aData) {
        setUserRole('athlete');
        setEquippedTitle(aData.equipped_title || 'prospect');
        setEquippedBorder(aData.equipped_border || 'none');
        setResumeText(aData.saved_resume || '');
        
        try {
           const today = new Date();
           today.setHours(0, 0, 0, 0);
           const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

           const { data: viewLogs } = await supabase
             .from('profile_view_logs')
             .select('created_at, coaches(first_name, last_name, school_name, avatar_url, email)')
             .eq('athlete_id', session.user.id)
             .order('created_at', { ascending: false });

           if (viewLogs) {
              const daily = viewLogs.filter(log => new Date(log.created_at) >= today).length;
              const monthly = viewLogs.filter(log => new Date(log.created_at) >= firstOfMonth).length;

              const uniqueCoaches: any[] = [];
              const seenIds = new Set();
              
              for (const log of viewLogs) {
                 const coachData = Array.isArray((log as any).coaches) ? (log as any).coaches[0] : (log as any).coaches;
                 const cId = coachData ? (coachData as any).school_name : null; 
                 
                 if (cId && !seenIds.has(cId) && coachData) {
                     seenIds.add(cId);
                     uniqueCoaches.push(coachData);
                 }
              }

              setDailyViews(daily);
              setMonthlyViews(monthly);
              setAllRecentViewers(uniqueCoaches);
              setRecentViewers(uniqueCoaches.slice(0, 3)); 
           }
        } catch (e) {
           console.log("Could not load advanced view logs. Using basic stats.");
        }

        if (aData.rival_ids && aData.rival_ids.length > 0) {
          const { data: rData } = await supabase
            .from('athletes')
            .select('id, first_name, last_name, high_school, avatar_url, equipped_border')
            .in('id', aData.rival_ids);
          if (rData) setActiveRivals(rData);
        }
        
        if (aData.created_at) {
          const diffTime = Math.abs(new Date().getTime() - new Date(aData.created_at).getTime());
          setDaysSinceJoin(Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        }
        
        const todayStr = new Date().toLocaleDateString('en-CA');
        let currentStreak = aData.current_login_streak || 0;
        const lastLoginStr = aData.last_login_date;

        if (lastLoginStr === todayStr) {
          setStreak(currentStreak);
        } else {
          let newStreak = 1; 
          if (lastLoginStr) {
            const diffDays = Math.ceil(Math.abs(new Date(todayStr).getTime() - new Date(lastLoginStr).getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) newStreak = currentStreak + 1;
          }
          setStreak(newStreak);
          await supabase.from('athletes').update({ current_login_streak: newStreak, last_login_date: todayStr }).eq('id', aData.id);
          giveDailyReward(aData.id, aData.coins || 0);
        }

        let bestPercentileFound = 1.0;

        if (aData.prs && aData.prs.length > 0) {
          const { data: verifiedAthletes } = await supabase
            .from('athletes')
            .select('prs')
            .eq('gender', aData.gender || 'Boys')
            .gt('trust_level', 0); 
          
          if (verifiedAthletes) {
            let athletesPool = [...verifiedAthletes];
            if (aData.trust_level === 0) athletesPool.push(aData);

            aData.prs = aData.prs.map((myPr: any) => {
              const event = myPr.event;
              const allMarks = athletesPool.map(a => a.prs?.find((p: any) => p.event === event)?.mark).filter(Boolean);
              allMarks.sort((a, b) => parseMarkForSorting(a, event) - parseMarkForSorting(b, event));
              
              const myVal = parseMarkForSorting(myPr.mark, event);
              const rankIndex = allMarks.findIndex(m => parseMarkForSorting(m, event) === myVal);
              const percentile = Math.max(0, rankIndex / allMarks.length);
              const globalRank = rankIndex !== -1 ? rankIndex + 1 : 1;

              if (percentile < bestPercentileFound) bestPercentileFound = percentile;
              if (rankIndex === 0) bestPercentileFound = 0; 

              let tier;
              if (percentile <= 0.01 || rankIndex === 0) tier = { name: 'LEGEND', classes: 'legend-badge' };
              else if (percentile <= 0.05) tier = { name: 'CHAMPION', classes: 'champion-badge' };
              else if (percentile <= 0.15) tier = { name: 'ELITE', classes: 'elite-badge' };
              else if (percentile <= 0.30) tier = { name: 'MASTER', classes: 'bg-blue-100 text-blue-800 border border-blue-300' };
              else if (percentile <= 0.50) tier = { name: 'CONTENDER', classes: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
              else if (percentile <= 0.75) tier = { name: 'CHALLENGER', classes: 'bg-orange-100 text-orange-800 border border-orange-300' };
              else tier = { name: 'PROSPECT', classes: 'bg-slate-100 text-slate-600 border border-slate-300' };

              return { ...myPr, tier, globalRank };
            });
          }
        }

        setHighestPercentile(bestPercentileFound);
        setAthleteProfile(aData);
      }
      setLoading(false);
    }
    loadDashboardData();
  }, [supabase, router]);

  // 🚨 NEW: HANDLE SNIPER SEARCH API 🚨
  const handleNameSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSearchingName(true);
    setAthleteSearchResults([]);

    try {
      const response = await fetch('/api/find-athlete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firstName: searchFirstName.trim(), 
          lastName: searchLastName.trim(), 
          state: searchState,
          city: searchCity.trim() // Passes city filter to backend
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to search.");
      
      if (result.data && result.data.length > 0) {
        setAthleteSearchResults(result.data);
      } else {
        setErrorMessage(`No athletes found for "${searchFirstName} ${searchLastName}". Try the Paste Link method.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSearchingName(false);
    }
  };

  const validateAthleticUrl = (url: string) => {
    if (!url) return "Please enter a URL.";
    if (!url.includes('athletic.net')) return "Must be a valid Athletic.net link.";
    if (url.toLowerCase().includes('cross-country') || url.toLowerCase().includes('crosscountry')) return "Please provide your Track & Field link. We currently only support Track & Field profiles, not Cross Country.";
    if (url.includes('/team/')) return "This is a team link. Please click on your specific name first to get your athlete link.";
    if (url.includes('/meet/')) return "This is a meet results link. Go to your personal athlete profile page.";
    if (!url.includes('/athlete/') && !url.toLowerCase().includes('athlete.aspx')) return "Make sure the link points directly to your athlete profile (it usually has /athlete/ in the URL).";
    return null;
  };

  const handleInitialScrape = async (urlToScrape: string) => {
    setErrorMessage('');
    
    if (!canSync) {
      setErrorMessage(`You have reached the API limit. ${syncCooldownText}`);
      return;
    }

    const validationError = validateAthleticUrl(urlToScrape);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSyncing(true);
    
    try {
      const { data: existingUser } = await supabase.from('athletes').select('id').eq('athletic_net_url', urlToScrape).neq('id', athleteProfile?.id).maybeSingle();

      if (existingUser) {
        setErrorMessage("Someone has already claimed this profile. If this is you, contact support@chasedsports.com to dispute it.");
        setIsSyncing(false);
        return;
      }

      const response = await fetch('/api/sync', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ url: urlToScrape }) 
      });
      
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error || "Failed to sync profile. Please try again.");
      
      await supabase.from('athletes').update({ 
        first_name: result.data.firstName, 
        last_name: result.data.lastName, 
        high_school: result.data.schoolName, 
        athletic_net_url: result.data.url, 
        prs: result.data.prs, 
        base_prs: result.data.prs, 
        gender: result.data.gender, 
        state: result.data.state,                
        school_size: result.data.schoolSize,     
        conference: result.data.conference, 
        grad_year: result.data.gradYear,      
        trust_level: 0 
      }).eq('id', athleteProfile?.id);

      localStorage.setItem('last_sync_time', Date.now().toString());
      window.location.reload();
    } catch (err: any) { 
      setErrorMessage(err.message); 
    } finally {
      setIsSyncing(false); 
    }
  };

  const beginVerification = () => {
    const randomCode = 'CS' + Math.random().toString(36).substring(2, 6).toUpperCase();
    setVerificationCode(randomCode);
    setShowVerificationStep(true);
  };

  const confirmVerification = async () => {
    if (!athleteProfile?.athletic_net_url) return;
    
    if (verifyLockout && Date.now() < verifyLockout) {
      setErrorMessage("Too many failed attempts. You are locked out for 3 hours to prevent API spam.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    
    try {
      const verifyRes = await fetch('/api/verify', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ url: athleteProfile.athletic_net_url, code: verificationCode }) 
      });
      
      const verifyData = await verifyRes.json();
      
      if (!verifyRes.ok || !verifyData.success) {
        const newAttempts = verifyAttempts + 1;
        setVerifyAttempts(newAttempts);
        localStorage.setItem('verify_attempts', newAttempts.toString());

        if (newAttempts >= 3) {
          const lockoutTime = Date.now() + 3 * 60 * 60 * 1000; // 3 Hours
          setVerifyLockout(lockoutTime);
          localStorage.setItem('verify_lockout_until', lockoutTime.toString());
          throw new Error("Too many failed attempts. Try again in 3 hours.");
        } else {
          const remaining = 3 - newAttempts;
          throw new Error(`${verifyData.error || "Code not found."} (${remaining} attempts remaining)`);
        }
      }

      localStorage.removeItem('verify_attempts');
      localStorage.removeItem('verify_lockout_until');

      if (athleteProfile.referred_by && athleteProfile.trust_level === 0) {
        const { error: rpcError } = await supabase.rpc('reward_referrer', { referrer_id: athleteProfile.referred_by });
        if (rpcError) console.error("RPC Error:", rpcError);

        let myBoosts = (athleteProfile.boosts_available || 0) + 1; 

        await supabase.from('athletes').update({
          trust_level: 1,
          boosts_available: myBoosts
        }).eq('id', athleteProfile.id);
      } else {
        await supabase.from('athletes').update({ trust_level: 1 }).eq('id', athleteProfile.id);
      }

      localStorage.setItem('last_sync_time', new Date().getTime().toString());
      window.location.reload();

    } catch (err: any) { 
      setErrorMessage(err.message); 
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSyncing(true);
    try {
      const { error } = await supabase.from('athletes').update({
        first_name: editFirstName,
        last_name: editLastName,
        athletic_net_url: 'skipped', 
        trust_level: 0 
      }).eq('id', athleteProfile?.id);

      if (error) throw error;
      window.location.reload();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReSync = async () => {
    if (!athleteProfile?.athletic_net_url || athleteProfile.athletic_net_url === 'skipped') return;
    
    if (!canSync) {
      showToast(syncCooldownText, "error");
      return;
    }

    setIsSyncing(true);
    
    try {
      const response = await fetch('/api/sync', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ url: athleteProfile.athletic_net_url }) 
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to sync profile.");
      
      await supabase.from('athletes').update({ 
        prs: result.data.prs,
        gender: result.data.gender,
        state: result.data.state,                
        school_size: result.data.schoolSize,     
        conference: result.data.conference,
        grad_year: result.data.gradYear        
      }).eq('id', athleteProfile.id);
      
      localStorage.setItem('last_sync_time', Date.now().toString());
      window.location.reload(); 
    } catch (err: any) { 
      showToast(err.message, "error");
    } finally { 
      setIsSyncing(false); 
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploadingAvatar(true);
      const userId = athleteProfile?.id;
      if (!e.target.files || e.target.files.length === 0 || !userId) return;
      const compressedFile = await imageCompression(e.target.files[0], { maxSizeMB: 0.2, maxWidthOrHeight: 500, useWebWorker: true });
      const fileName = `${userId}-avatar.jpg`; 
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, compressedFile, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const urlWithTime = `${publicUrl}?t=${new Date().getTime()}`;

      await supabase.from('athletes').update({ avatar_url: urlWithTime }).eq('id', userId);
      setAthleteProfile((prev) => prev ? { ...prev, avatar_url: urlWithTime } : null);
      
    } catch (error: any) { showToast(`Error uploading image: ${error.message}`); } finally { setIsUploadingAvatar(false); }
  };

  const handleEquipTitle = async (titleId: string) => {
    if (!athleteProfile) return;
    setIsEquipping(true);
    try {
      await supabase.from('athletes').update({ equipped_title: titleId }).eq('id', athleteProfile.id);
      setEquippedTitle(titleId);
      setIsTitleDropdownOpen(false); 
      showToast(`Successfully equipped ${titleId} title!`, 'success');
    } catch (err: any) { showToast(`Failed to equip title: ${err.message}`); } finally { setIsEquipping(false); }
  };

  const handleSaveResume = async () => {
    if (!athleteProfile) return;
    setIsSavingResume(true);
    try {
      await supabase.from('athletes').update({ saved_resume: resumeText }).eq('id', athleteProfile.id);
      setAthleteProfile({ ...athleteProfile, saved_resume: resumeText });
      showToast("Athletic Resume saved successfully!", "success");
    } catch (err: any) { showToast(`Failed to save: ${err.message}`); } finally { setIsSavingResume(false); }
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
    if (!athleteProfile || !inviteCodeInput.trim()) return;
    setIsSubmittingCode(true);
    try {
        const cleanCode = inviteCodeInput.trim().replace(/\D/g, ''); 
        if (!cleanCode) throw new Error("Invalid invite code format.");

        const { data: referrers, error: searchError } = await supabase
          .from('athletes')
          .select('id, boosts_available, verified_referrals, unlocked_borders')
          .ilike('athletic_net_url', `%${cleanCode}%`)
          .limit(1);
          
        if (searchError) throw searchError;
        if (!referrers || referrers.length === 0) throw new Error("Code not found. Make sure your teammate has synced their profile.");
        
        const referrer = referrers[0];
        if (referrer.id === athleteProfile.id) throw new Error("You cannot use your own invite code.");
        
        if (athleteProfile.trust_level > 0) {
            const { error: rpcError } = await supabase.rpc('reward_referrer', { referrer_id: referrer.id });
            if (rpcError) throw new Error("Failed to process referrer reward.");

            let myBoosts = (athleteProfile.boosts_available || 0) + 1; 

            await supabase.from('athletes').update({ 
              referred_by: referrer.id,
              boosts_available: myBoosts
            }).eq('id', athleteProfile.id);

            setAthleteProfile({ 
              ...athleteProfile, 
              referred_by: referrer.id,
              boosts_available: myBoosts
            });
        } else {
            await supabase.from('athletes').update({ referred_by: referrer.id }).eq('id', athleteProfile.id);
            setAthleteProfile({ ...athleteProfile, referred_by: referrer.id });
        }
        
        showToast("Invite code applied successfully!", "success");
        setInviteCodeInput('');
    } catch (err: any) { 
      showToast(err.message, "error"); 
    } finally { 
      setIsSubmittingCode(false); 
    }
  };

  const handleRemoveRival = async (rivalId: string) => {
    if (!athleteProfile) return;
    try {
      const updatedRivalIds = (athleteProfile.rival_ids || []).filter(id => id !== rivalId);
      
      const { data: currentData } = await supabase.from('athletes').select('bounty_targets').eq('id', athleteProfile.id).single();
      const currentBounties = currentData?.bounty_targets || [];
      const updatedBounties = currentBounties.filter((bt: any) => !(bt.type === 'rival_hunt' && bt.rivalId === rivalId));

      await supabase.from('athletes').update({ 
        rival_ids: updatedRivalIds,
        bounty_targets: updatedBounties
      }).eq('id', athleteProfile.id);

      setActiveRivals(activeRivals.filter(r => r.id !== rivalId));
      setAthleteProfile({ ...athleteProfile, rival_ids: updatedRivalIds });
      showToast("Rival dropped.", "success");
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleScoutCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteProfile?.is_premium) {
      return showToast("Pro Scout is a premium feature.", "error");
    }
    if (scoutsRemaining <= 0) {
      return showToast("Daily scout limit reached (10/10). Try again tomorrow.", "error");
    }
    
    const validationError = validateAthleticUrl(scoutUrl);
    if (validationError) return showToast(validationError, "error");

    setIsScouting(true);
    try {
      const response = await fetch('/api/sync', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ url: scoutUrl }) 
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to fetch athlete data.");

      const scoutedGender = result.data.gender || 'Boys';
      const scoutedProj = getAthleteProjection(result.data.prs || [], scoutedGender);

      if (currentUserId && scoutedProj) {
        const { data: newScout, error: insertError } = await supabase.from('scouted_athletes').insert({
          scouted_by: currentUserId,
          first_name: result.data.firstName,
          last_name: result.data.lastName,
          high_school: result.data.schoolName,
          athletic_net_url: result.data.url,
          prs: result.data.prs,
          gender: scoutedGender,
          calculated_score: scoutedProj.overallScore,
          calculated_tier: scoutedProj.overallLabel
        }).select().single();

        if (newScout && !insertError) {
          setScoutedAthletes(prev => [newScout, ...prev]);
        }
      }

      setScoutsRemaining(prev => prev - 1);
      setScoutUrl('');
      showToast("Scouting report generated successfully!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsScouting(false);
    }
  };

  const handleRemoveScouted = async (id: string) => {
    try {
      await supabase.from('scouted_athletes').delete().eq('id', id);
      setScoutedAthletes(prev => prev.filter(a => a.id !== id));
      showToast("Scout report removed.", "success");
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDownloadCard = async () => {
    if (!activeCardAthlete) return;
    setIsExportingCard(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('scout-card-export');
      if (!element) throw new Error("Card element not found.");
      
      const canvas = await html2canvas(element, { 
        backgroundColor: null, 
        scale: 2, 
        useCORS: true 
      });
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `${activeCardAthlete.first_name}_ScoutCard.png`;
      link.href = dataUrl;
      link.click();
      showToast("Scout Card exported successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export card.", "error");
    } finally {
      setIsExportingCard(false);
    }
  };

  const getStreakStyle = () => {
    if (streak >= 30) return { bg: 'bg-slate-900 border-slate-700 shadow-[0_0_15px_rgba(217,70,239,0.5)]', text: 'bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-fuchsia-400 text-transparent bg-clip-text animate-pulse', icon: 'text-cyan-400 fill-fuchsia-500 animate-bounce' }; 
    if (streak >= 14) return { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: 'text-purple-500 fill-purple-400 animate-pulse' }; 
    if (streak >= 7) return { bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-800', icon: 'text-cyan-500 fill-cyan-400' }; 
    if (streak >= 3) return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: 'text-red-500 fill-red-500 animate-pulse' }; 
    return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: 'text-orange-500 fill-orange-400' }; 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading secure dashboard...</p>
      </div>
    );
  }

  if (userRole === 'coach') {
    return <div className="text-center p-20 font-black text-2xl">Redirecting to Coach Dashboard...</div>;
  }

  const isSkipped = athleteProfile?.athletic_net_url === 'skipped';
  const noProfileLinked = !athleteProfile?.athletic_net_url;
  const isUnverified = athleteProfile?.trust_level === 0 && !!athleteProfile?.athletic_net_url && !isSkipped;

  const projection = getAthleteProjection(athleteProfile?.prs || [], athleteProfile?.gender || 'Boys');
  const myReferralCode = athleteProfile?.athletic_net_url?.match(/\d{5,}/)?.[0] || null;
  const showCodeEntry = daysSinceJoin <= 7 && !athleteProfile?.referred_by && !isSkipped;
  const streakTheme = getStreakStyle();
  const hasPRs = athleteProfile?.prs && athleteProfile.prs.length > 0;
  const activeTitle = EARNED_TITLES.find(t => t.id === equippedTitle) || EARNED_TITLES[6];

  function getTrustBadge(level: number, skipped: boolean) {
    if (skipped && level === 0) return { icon: UserCircle2, color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200', text: 'Unverified Profile' };
    switch(level) {
      case 1: return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 border-green-200', text: 'Results Verified' };
      case 2: return { icon: Trophy, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', text: 'Community Verified' };
      case 3: return { icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200', text: 'Coach Verified' };
      default: return { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', text: 'Pending Verification' };
    }
  }

  const badge = getTrustBadge(athleteProfile?.trust_level || 0, isSkipped);

  const cardProjection = activeCardAthlete ? getAthleteProjection(activeCardAthlete.prs, activeCardAthlete.gender) : null;
  let cardAccentColor = 'from-slate-700 to-slate-900 border-slate-500';
  let cardGlowColor = 'bg-slate-500/30';
  if (cardProjection) {
    if (cardProjection.overallScore >= 95) { cardAccentColor = 'from-fuchsia-600 to-purple-900 border-fuchsia-400'; cardGlowColor = 'bg-fuchsia-500/40'; }
    else if (cardProjection.overallScore >= 85) { cardAccentColor = 'from-purple-600 to-indigo-900 border-purple-400'; cardGlowColor = 'bg-purple-500/40'; }
    else if (cardProjection.overallScore >= 75) { cardAccentColor = 'from-blue-500 to-indigo-900 border-blue-400'; cardGlowColor = 'bg-blue-500/40'; }
    else if (cardProjection.overallScore >= 65) { cardAccentColor = 'from-emerald-500 to-teal-900 border-emerald-400'; cardGlowColor = 'bg-emerald-500/40'; }
    else if (cardProjection.overallScore >= 55) { cardAccentColor = 'from-amber-500 to-orange-900 border-amber-400'; cardGlowColor = 'bg-amber-500/40'; }
  }

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

  const TABS = [
    { id: 'stats', label: 'My Stats', icon: Activity },
    { id: 'recruiting', label: 'Recruiting', icon: Target },
    { id: 'scout', label: 'Pro Scout', icon: Search },
    { id: 'rewards', label: 'Rewards', icon: Gift },
  ] as const;

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />}
            <p className="text-sm font-bold leading-tight">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* 🚨 MODAL: SYNC ATHLETIC.NET LATER 🚨 */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowLinkModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 border border-blue-100">
              <LinkIcon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Link Profile</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Paste your Athletic.net link below to verify your stats and unlock full platform features (Messaging, Feed).</p>
            
            {errorMessage && <p className="text-xs font-bold text-red-500 mb-4 bg-red-50 p-2 rounded-lg border border-red-100">{errorMessage}</p>}

            <form onSubmit={(e) => { e.preventDefault(); handleInitialScrape(syncUrl); }} className="flex flex-col gap-3">
              <input 
                type="url" 
                required 
                placeholder="https://www.athletic.net/athlete/..." 
                value={syncUrl} 
                onChange={e=>setSyncUrl(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" 
              />
              <button type="submit" disabled={isSyncing || !canSync} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isSyncing ? <><RefreshCw className="w-4 h-4 animate-spin"/> Fetching...</> : canSync ? 'Fetch Stats' : syncCooldownText}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ALL COACHES MODAL */}
      {showAllViewersModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900">Coach Views</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Last 30 Days</p>
              </div>
              <button onClick={() => setShowAllViewersModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
              {allRecentViewers.map((coach, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <AvatarWithBorder avatarUrl={coach.avatar_url} borderId="none" sizeClasses="w-12 h-12" userRole="coach" />
                    <div>
                      <p className="font-black text-slate-900">Coach {coach.last_name}</p>
                      <p className="text-xs font-bold text-slate-500">{coach.school_name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setShowAllViewersModal(false); handleContactCoach(coach.email); }} 
                    className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    title="Message Coach"
                  >
                    <Mail className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes liquidPan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        
        .legend-badge { background: linear-gradient(90deg, #6b21a8 0%, #d946ef 20%, #6b21a8 40%, #d946ef 60%, #6b21a8 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #e879f9; box-shadow: 0 0 15px rgba(217, 70, 239, 0.5); font-weight: 900; }
        .champion-badge { background: linear-gradient(90deg, #991b1b 0%, #ef4444 20%, #991b1b 40%, #ef4444 60%, #991b1b 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #f87171; box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); font-weight: 900; }
        .elite-badge { background: linear-gradient(90deg, #0f172a 0%, #475569 20%, #0f172a 40%, #475569 60%, #0f172a 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #94a3b8; box-shadow: 0 0 15px rgba(148, 163, 184, 0.3); font-weight: 900; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}} />

      {/* HERO SECTION */}
      <div className="bg-slate-900 text-white pt-16 pb-24 px-6 relative overflow-hidden">
        {athleteProfile?.is_premium && (
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        )}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
          
          <div className="relative w-32 h-32 group shrink-0">
            <div className={`w-full h-full rounded-full border-4 ${athleteProfile?.is_premium ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'border-slate-800 shadow-xl'} overflow-hidden bg-slate-800 flex items-center justify-center ${isUploadingAvatar ? 'animate-pulse' : ''}`}>
              {athleteProfile?.avatar_url ? (
                <img src={athleteProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 className="w-12 h-12 text-slate-400" />
              )}
            </div>
            {!isUnverified && !noProfileLinked && (
              <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-30">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] text-white font-bold uppercase tracking-wider text-center px-2">Update</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
              </label>
            )}
          </div>

          <div className="text-center md:text-left flex-1 w-full">
            
            {/* 🚨 VISIBLE TOP-LEVEL RANK DISPLAY */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              {isSkipped ? (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase border shadow-sm bg-slate-800 border-slate-700 text-slate-300`}>
                  <Globe className="w-3.5 h-3.5 mr-1.5" /> General Profile
                </div>
              ) : (
                !noProfileLinked && !isUnverified && (
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase border shadow-sm ${activeTitle.badgeClass}`}>
                    <Trophy className="w-3.5 h-3.5 mr-1.5" /> {activeTitle.name} Rank
                  </div>
                )
              )}
              
              {athleteProfile?.is_premium && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase border bg-amber-500/20 border-amber-400/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]`}>
                  <Crown className="w-3.5 h-3.5 mr-1.5" /> Pro Member
                </div>
              )}
            </div>
            
            <div className="group relative w-fit mx-auto md:mx-0">
              <h1 className="text-4xl font-black mb-2 flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2">
                {athleteProfile?.first_name ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'Welcome, Athlete'}
                {!isUnverified && !noProfileLinked && (
                  <span title="Verified Athlete" className="flex items-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </span>
                )}
              </h1>
              <p className="text-lg text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
                <MapPin className="w-4 h-4 opacity-70" /> 
                {isSkipped 
                  ? (athleteProfile?.high_school ? `${athleteProfile.high_school} • Class of ${athleteProfile.grad_year}` : 'College Recruiting Hub')
                  : (athleteProfile?.high_school || 'Set up your profile')
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
        
        {/* 🚨 STATE 1: ONBOARDING (SNIPER SEARCH vs LINK) 🚨 */}
        {noProfileLinked && (
          <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-blue-800 shadow-2xl relative overflow-hidden mb-10 mx-auto">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-12">
                <div className="w-16 h-16 bg-blue-500/20 border border-blue-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-blue-300" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">Claim Your Profile</h2>
                <p className="text-blue-200/80 font-medium text-lg max-w-2xl mx-auto">
                  Find your profile in the national database to unlock your scouting analytics.
                </p>
              </div>

              {/* TABS */}
              <div className="flex justify-center mb-10">
                <div className="bg-white/10 p-1.5 rounded-2xl flex gap-1 border border-white/10">
                  <button onClick={() => setOnboardTab('search')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${onboardTab === 'search' ? 'bg-white text-slate-900 shadow-xl' : 'text-white hover:bg-white/10'}`}>Athlete Search</button>
                  <button onClick={() => setOnboardTab('link')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${onboardTab === 'link' ? 'bg-white text-slate-900 shadow-xl' : 'text-white hover:bg-white/10'}`}>Paste Link</button>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 text-sm font-bold flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4 max-w-2xl mx-auto">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {/* TAB 1: SNIPER SEARCH */}
              {onboardTab === 'search' && (
                <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                  <form onSubmit={handleNameSearch} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <input type="text" required placeholder="First Name" value={searchFirstName} onChange={(e) => setSearchFirstName(e.target.value)} className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 font-semibold placeholder:text-blue-200/50" />
                    <input type="text" required placeholder="Last Name" value={searchLastName} onChange={(e) => setSearchLastName(e.target.value)} className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 font-semibold placeholder:text-blue-200/50" />
                    
                    <input type="text" placeholder="City (Optional)" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 font-semibold placeholder:text-blue-200/50" />
                    
                    {/* STATE COMBOBOX */}
                    <div className="relative" ref={dropdownRef}>
                      <div className="flex items-center bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus-within:border-blue-400 transition-colors h-full">
                        <input 
                          type="text" 
                          placeholder="Select State (Optional)" 
                          value={searchState} 
                          onFocus={() => setIsStateDropdownOpen(true)}
                          onChange={e => setSearchState(e.target.value)} 
                          className="bg-transparent w-full text-white font-semibold focus:outline-none placeholder:text-blue-200/50" 
                        />
                        <ChevronDown className="w-5 h-5 text-white/40" />
                      </div>
                      
                      {isStateDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[100] max-h-72 overflow-y-auto custom-scrollbar p-1 animate-in fade-in slide-in-from-top-2">
                          {filteredStates.length > 0 ? filteredStates.map(st => (
                            <button key={st} type="button" onClick={() => { setSearchState(st); setIsStateDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 rounded-lg text-white font-bold hover:bg-blue-600 transition-colors text-sm">
                              {st}
                            </button>
                          )) : (
                            <div className="px-4 py-2.5 text-slate-500 text-sm italic">No states found</div>
                          )}
                        </div>
                      )}
                    </div>

                    <button type="submit" disabled={isSearchingName} className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-4 rounded-xl font-black disabled:opacity-50 transition-all shadow-lg flex items-center justify-center sm:col-span-2 text-lg">
                      {isSearchingName ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Searching Database...</> : 'Find Me'}
                    </button>
                  </form>

                  {/* SEARCH RESULTS */}
                  {athleteSearchResults.length > 0 && (
                    <div className="bg-white rounded-2xl p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center py-2 border-b border-slate-100 mb-2">Select your profile</p>
                      <div className="space-y-2">
                        {athleteSearchResults.map((result, idx) => (
                          <button 
                            key={idx} 
                            onClick={(e) => { 
                              e.preventDefault(); 
                              setSyncUrl(result.url); // Use syncUrl to track which button is loading
                              handleInitialScrape(result.url); 
                            }}
                            disabled={isSyncing}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-xl transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div>
                              <p className="font-black text-slate-900 text-lg group-hover:text-blue-700">{result.name}</p>
                              <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> {result.school}</p>
                            </div>
                            <div className="bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-lg text-sm shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center">
                              {isSyncing && syncUrl === result.url ? (
                                <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Claiming...</>
                              ) : (
                                "That's Me"
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MANUAL PASTE */}
              {onboardTab === 'link' && (
                <form onSubmit={(e) => { e.preventDefault(); handleInitialScrape(syncUrl); }} className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto bg-white/5 p-2 rounded-[1.5rem] border border-white/10 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                  <input 
                    type="url" 
                    required 
                    placeholder="Paste your link here..." 
                    value={syncUrl} 
                    onChange={(e) => setSyncUrl(e.target.value)} 
                    className="w-full flex-grow bg-transparent text-white rounded-xl pl-6 pr-4 py-4 focus:outline-none focus:bg-white/5 font-semibold placeholder:text-blue-300/30 text-lg transition-colors" 
                  />
                  <button type="submit" disabled={isSyncing || !canSync} className="bg-blue-500 hover:bg-blue-400 text-white px-10 py-4 rounded-xl font-black disabled:opacity-50 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center text-lg shrink-0">
                    {isSyncing ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Fetching...</> : canSync ? 'Fetch Stats' : syncCooldownText}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* 🚨 STATE 2: THE DASHBOARD (Personal Data View) 🚨 */}
        {!noProfileLinked && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* 🚨 PERSISTENT VERIFICATION BANNER 🚨 */}
            {isUnverified && (
              <div className="lg:col-span-3 bg-amber-500 rounded-2xl p-6 shadow-lg border border-amber-600 text-amber-950 flex flex-col md:flex-row items-center justify-between gap-6 mb-2">
                <div className="flex items-center gap-4 text-center md:text-left">
                  <ShieldCheck className="w-10 h-10 shrink-0" />
                  <div>
                    <h3 className="text-xl font-black">Verify Ownership Required</h3>
                    <p className="font-medium text-sm">You can view your recruiting score, but you must verify to unlock the community feed, leaderboards, and discovery searches.</p>
                  </div>
                </div>
                <button onClick={beginVerification} className="w-full md:w-auto bg-slate-900 hover:bg-black text-white font-black px-8 py-3 rounded-xl shadow-md shrink-0 transition-colors">Start Verification</button>
              </div>
            )}

            {/* LEFT COLUMN: PROFILE SUMMARY */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative flex flex-col">
                <div className="relative w-28 h-28 mb-6 group mx-auto md:mx-0">
                  <AvatarWithBorder 
                      avatarUrl={athleteProfile?.avatar_url ?? null} 
                      borderId={equippedBorder ?? null} 
                      sizeClasses="w-28 h-28"
                  />
                  {!isUnverified && (
                    <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-30">
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                    </label>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-slate-900">{athleteProfile?.first_name} {athleteProfile?.last_name}</h1>
                  {streak > 0 && (
                    <div className={`flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-widest uppercase ${streakTheme.bg}`}>
                      <Flame className={`w-3.5 h-3.5 mr-1 ${streakTheme.icon}`} />
                      <span className={streakTheme.text}>{streak} Day Login Streak</span>
                    </div>
                  )}
                </div>
                
                <p className="text-slate-500 font-medium leading-relaxed mt-2 mb-6">
                  {athleteProfile?.high_school} 
                  {athleteProfile?.grad_year && ` • Class of ${athleteProfile.grad_year}`}
                  {athleteProfile?.state && ` • ${athleteProfile.state}`}
                  {athleteProfile?.school_size && ` • ${athleteProfile.school_size}`}
                  {athleteProfile?.conference && ` • ${athleteProfile.conference}`}
                </p>
                
                <div className="border-t border-slate-100 pt-6 mt-auto grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Trust Level</span>
                    <div className="flex items-center gap-1.5">
                      <badge.icon className={`w-4 h-4 ${badge.color}`} />
                      <span className={`text-xs font-bold ${badge.color}`}>{badge.text}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Division</span>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">{athleteProfile?.gender || 'Boys'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIVE RIVALS DASHBOARD WIDGET */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 relative overflow-hidden flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-slate-100 pb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                      <Swords className="w-5 h-5 mr-2 text-red-500" /> Active Rivals
                    </h3>
                  </div>
                  <div className="bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg text-xs shrink-0">
                    {activeRivals.length} / 5
                  </div>
                </div>

                {activeRivals.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 mb-6">
                    {activeRivals.map((rival) => (
                      <div key={rival.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-red-300 hover:bg-red-50 transition-colors group relative">
                        <Link href={`/athlete/${rival.id}`} className="absolute inset-0 z-10" aria-label={`View ${rival.first_name}`}></Link>
                        <AvatarWithBorder avatarUrl={rival.avatar_url ?? null} borderId={rival.equipped_border ?? null} sizeClasses="w-10 h-10 shrink-0" />
                        <div className="flex-1 truncate relative z-0">
                          <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-red-600 transition-colors">{rival.first_name} {rival.last_name}</h4>
                        </div>
                        <button onClick={() => handleRemoveRival(rival.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors z-20 relative">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed mb-6">
                    <Swords className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Head to the Arena to declare rivals.</p>
                  </div>
                )}
                
                <Link href="/compete" className="w-full bg-slate-900 hover:bg-black text-white font-black py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-auto text-sm">
                  Enter The Arena <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="bg-slate-900 rounded-[2rem] p-8 shadow-lg border border-slate-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Boost Wallet</p>
                    <h3 className="text-4xl font-black text-white leading-none">{athleteProfile?.boosts_available || 0}</h3>
                  </div>
                  <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
                    <Rocket className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
              </div>

            </div>

            {/* ================= RIGHT COLUMN: TABBED INTERFACE ================= */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Sleek Tab Navigation */}
              <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex overflow-x-auto custom-scrollbar sticky top-4 z-40">
                {TABS.map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200/50' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-500' : 'text-slate-400'}`} /> {tab.label}
                  </button>
                ))}
              </div>

              {/* 📊 TAB 1: MY STATS (WITH ADVANCED ANALYTICS) */}
              {activeTab === 'stats' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* 🚨 PRO ANALYTICS HUB 🚨 */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center">
                          <BarChart3 className="w-6 h-6 mr-3 text-indigo-500" /> Scouting Analytics
                        </h2>
                        <p className="text-slate-500 font-medium mt-1">See how much traction your profile is getting with college coaches.</p>
                      </div>
                    </div>

                    <div className={`relative ${!athleteProfile?.is_premium ? 'min-h-[280px]' : ''}`}>
                      
                      {/* 🔓 UNLOCKED ROW: Proves to the athlete that the app is working! */}
                      <div className="mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                          <div>
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                              <Eye className="w-4 h-4" /> All-Time Profile Clicks
                            </p>
                            <h3 className="text-4xl md:text-5xl font-black text-blue-700 tracking-tight">
                              {athleteProfile?.profile_views || 0}
                            </h3>
                          </div>
                          <div className="text-center sm:text-right max-w-[200px]">
                            <p className="text-sm font-medium text-slate-500">Coaches have actively clicked to view your full profile.</p>
                          </div>
                        </div>
                      </div>

                      {/* 🔒 LOCKED PRO ROW: Impressions, Daily, Monthly, and Who Viewed */}
                      <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6 overflow-hidden">
                        {!athleteProfile?.is_premium && (
                          <div className="absolute inset-0 z-20 bg-slate-50/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 border border-slate-200 shadow-sm">
                              <Lock className="w-6 h-6 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-1">Advanced Analytics Locked</h3>
                            <p className="text-slate-500 text-sm font-medium mb-4 max-w-xs">Upgrade to Pro to track your feed impressions and see exactly who is viewing your profile.</p>
                            <Link href="/pro" className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black px-6 py-2.5 rounded-xl shadow-md hover:scale-105 transition-transform flex items-center gap-2 text-sm">
                              <Crown className="w-4 h-4" /> Unlock Pro
                            </Link>
                          </div>
                        )}

                        <div className={`${!athleteProfile?.is_premium ? 'opacity-20 select-none blur-[2px]' : ''}`}>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            {/* 🚨 FEED IMPRESSIONS WITH TOOLTIP 🚨 */}
                            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm relative">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                  Feed Impressions
                                  <button 
                                    onClick={() => setShowImpressionTooltip(!showImpressionTooltip)} 
                                    className="text-slate-300 hover:text-emerald-500 transition-colors focus:outline-none"
                                  >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                  </button>
                                </p>
                                <Search className="w-4 h-4 text-emerald-400" />
                              </div>
                              <h3 className="text-3xl font-black text-slate-900">{athleteProfile?.is_premium ? athleteProfile.search_appearances || 0 : '241'}</h3>
                              
                              {/* TOOLTIP POPOVER */}
                              {showImpressionTooltip && athleteProfile?.is_premium && (
                                <div className="absolute top-12 left-0 w-[200px] bg-slate-900 text-white text-xs p-4 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 border border-slate-700">
                                  <p className="mb-3 leading-relaxed">This is the number of times your posts or profile appeared on a coach's screen while they were scrolling the feed or searching the database.</p>
                                  <button onClick={() => setShowImpressionTooltip(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg transition-colors">Got it</button>
                                </div>
                              )}
                            </div>
                            
                            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Views Today</p>
                                <Activity className="w-4 h-4 text-blue-400" />
                              </div>
                              <h3 className="text-3xl font-black text-slate-900">{athleteProfile?.is_premium ? dailyViews : '14'}</h3>
                            </div>
                            
                            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Views This Month</p>
                                <Calendar className="w-4 h-4 text-indigo-400" />
                              </div>
                              <h3 className="text-3xl font-black text-slate-900">{athleteProfile?.is_premium ? monthlyViews : '89'}</h3>
                            </div>
                          </div>

                          <div className="border-t border-slate-200 pt-6">
                             <div className="flex items-center justify-between mb-4">
                               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <UserCircle2 className="w-4 h-4 text-indigo-400" /> Recent Coach Views
                               </p>
                               {allRecentViewers.length > 3 && (
                                 <button onClick={() => setShowAllViewersModal(true)} className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100 shadow-sm hover:shadow-md">
                                   View All ({allRecentViewers.length})
                                 </button>
                               )}
                             </div>
                             
                             {recentViewers.length > 0 ? (
                               <div className="space-y-3">
                                 {recentViewers.map((coach, idx) => (
                                   <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                                     <div className="flex items-center gap-4">
                                       <AvatarWithBorder avatarUrl={coach.avatar_url} borderId="none" sizeClasses="w-10 h-10" userRole="coach" />
                                       <div>
                                         <p className="font-black text-slate-900 text-sm">Coach {coach.last_name}</p>
                                         <p className="text-xs font-bold text-slate-500 truncate max-w-[200px]">{coach.school_name}</p>
                                       </div>
                                     </div>
                                     <button 
                                       onClick={() => handleContactCoach(coach.email)} 
                                       className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all border border-slate-200"
                                       title="Email Coach"
                                     >
                                       <Mail className="w-4 h-4" />
                                     </button>
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <p className="text-sm font-medium text-slate-400 italic py-4 bg-white p-4 rounded-xl border border-slate-100 text-center">No recent views from verified coaches.</p>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 🚨 DOPAMINE IN-DEPTH COLLEGE PROJECTION SCORER 🚨 */}
                  <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-200 relative overflow-hidden flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-8 border-b border-slate-100 gap-4">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
                          <Target className="w-6 h-6 mr-3 text-blue-500" /> Recruiting Scouting Report
                        </h3>
                        <p className="text-slate-500 font-medium mt-1 text-sm">Where you stand against national college standards.</p>
                      </div>
                      <div className="bg-slate-900 text-white flex flex-col items-center justify-center px-6 py-4 rounded-2xl shadow-lg border border-slate-700 shrink-0 relative overflow-hidden min-w-[140px]">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Score</span>
                        <span className="font-black text-4xl leading-none mb-1">{hasPRs && projection && projection.overallScore > 0 ? Math.round(projection.overallScore) : '-'}</span>
                        <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest bg-blue-500/20 px-2 py-0.5 rounded-full">Via {projection?.bestEvent || 'N/A'}</span>
                      </div>
                    </div>

                    {hasPRs && projection && projection.overallScore > 0 ? (
                      <div className="space-y-8">
                        <div className={`p-6 rounded-2xl border ${projection.bg} ${projection.border} relative overflow-hidden shadow-sm`}>
                          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><BarChart3 className={`w-24 h-24 ${projection.color}`} /></div>
                          <div className="relative z-10">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Projected Tier</p>
                            <h4 className={`text-2xl font-black mb-3 ${projection.color}`}>{projection.overallLabel}</h4>
                            <p className="text-slate-700 font-medium text-sm leading-relaxed max-w-lg">{projection.overallDesc}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" /> Event-by-Event Breakdown
                          </h4>
                          
                          <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                            {projection.eventBreakdowns.map((ev: any, i: number) => {
                              const isExpanded = expandedEventIndex === i;

                              return (
                                <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                                  <button 
                                    onClick={() => toggleEventExpansion(i)} 
                                    className="w-full flex justify-between items-center p-6 sm:px-8 text-left hover:bg-slate-50 transition-colors"
                                  >
                                    <div>
                                      <span className="font-black text-2xl text-slate-900 tracking-tight">{ev.event}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-end gap-1">
                                        <span className="text-3xl font-black text-blue-600 leading-none">{Math.round(ev.score)}</span>
                                        <span className="text-xs font-bold text-slate-400 pb-0.5">/99</span>
                                      </div>
                                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                    </div>
                                  </button>

                                  {isExpanded && (
                                    <div className="px-6 sm:px-8 pb-8 space-y-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">

                                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-6">
                                        <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-xl flex-1 flex flex-col justify-center">
                                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Mark</span>
                                          <span className="font-black text-2xl text-slate-800">{ev.mark}</span>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 px-5 py-3 rounded-xl flex-1 flex flex-col justify-center">
                                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Tier</span>
                                          <span className={`font-black text-lg tracking-tight ${
                                            ev.score >= 85 ? 'text-fuchsia-600' :
                                            ev.score >= 75 ? 'text-blue-600' :
                                            ev.score >= 65 ? 'text-emerald-600' :
                                            'text-slate-700'
                                          }`}>{ev.currentTier}</span>
                                        </div>
                                      </div>

                                      {ev.nextTier !== 'Elite' && ev.nextTier !== 'Varsity Standard' && (
                                        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 flex items-center justify-between shadow-inner">
                                          <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner shrink-0 ${ev.isField ? 'bg-emerald-50 border border-emerald-100' : 'bg-cyan-50 border border-cyan-100'}`}>
                                              {ev.isField ? <TrendingUp className="w-6 h-6 text-emerald-500" /> : <TrendingUp className="w-6 h-6 text-cyan-500 transform rotate-180" />}
                                            </div>
                                            <div>
                                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Next Goal: {ev.nextTier}</p>
                                              <p className="text-xl font-black text-slate-900 tracking-tight">{ev.targetMarkFormatted}</p>
                                            </div>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <span className={`text-xl font-black block ${ev.isField ? 'text-emerald-600' : 'text-cyan-600'}`}>{ev.deltaFormatted}</span>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Needed</p>
                                          </div>
                                        </div>
                                      )}

                                      {ev.nextTier === 'Varsity Standard' && (
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex items-center justify-center">
                                          <Activity className="w-5 h-5 text-slate-400 mr-2" />
                                          <span className="text-base font-black text-slate-700 tracking-tight">Goal: Hit Varsity Standard ({ev.targetMarkFormatted})</span>
                                        </div>
                                      )}
                                      {ev.nextTier === 'Elite' && (
                                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-center justify-center">
                                          <Crown className="w-5 h-5 text-amber-500 mr-2" />
                                          <span className="text-base font-black text-amber-600 tracking-tight">Elite Status Achieved - Maintain Dominance</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
                           <Activity className="w-4 h-4 text-blue-400" />
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                             Powered by ChasedSports Scoring Algorithm v2.0
                           </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                         <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                         <h4 className="text-lg font-black text-slate-900 mb-1">No data available</h4>
                         <p className="text-sm text-slate-500 font-medium">Sync your Athletic.net profile to generate your scouting report.</p>
                      </div>
                    )}
                  </div>

                  {/* VERIFIED PRS */}
                  <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Verified PRs</h3>
                        <p className="text-slate-500 font-medium">Your official meet results & national rank.</p>
                      </div>
                      
                      <button onClick={handleReSync} disabled={isSyncing} className="flex items-center justify-center bg-slate-900 hover:bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-slate-900">
                        {isSyncing ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Finding...</>
                        ) : (
                          <><RefreshCw className="w-4 h-4 mr-2" /> Sync Latest PRs</>
                        )}
                      </button>
                    </div>

                    {hasPRs ? (
                      <div className="grid grid-cols-1 gap-4">
                        {athleteProfile!.prs!.map((pr, index) => {
                          const queryParams = new URLSearchParams({ event: pr.event, gender: athleteProfile?.gender || 'Boys' });
                          const leaderboardLink = `/leaderboard?${queryParams.toString()}#${athleteProfile?.id}`;

                          return (
                            <div key={index} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-200 bg-slate-50 gap-4 group ${!isUnverified ? 'hover:bg-blue-50 hover:border-blue-300 cursor-pointer' : ''} relative overflow-hidden transition-colors`}>
                              {!isUnverified && <Link href={leaderboardLink} className="absolute inset-0 z-10" aria-label={`View ${pr.event} Leaderboard`}></Link>}
                              
                              <div className="flex-1 relative z-0">
                                <span className={`text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest transition-colors ${!isUnverified ? 'group-hover:text-blue-500' : ''}`}>Event</span>
                                <span className="font-black text-xl text-slate-800">{pr.event}</span>
                                {(pr.date || pr.meet) && (
                                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-2">
                                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-slate-400" /> {pr.date}</span>
                                    <span className="hidden sm:inline text-slate-300">•</span>
                                    <span className="flex items-center truncate pr-2"><MapPin className="w-3 h-3 mr-1 text-slate-400" /> {pr.meet}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-5 sm:border-l sm:border-slate-200 sm:pl-5 pr-4 relative z-0">
                                <div className="flex flex-col items-start sm:items-end">
                                  <span className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Global Status</span>
                                  {pr.tier ? (
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {/* HIDE GLOBAL RANK AND TIER BADGE UNTIL VERIFIED */}
                                      {!isUnverified ? (
                                        <>
                                          <span className="text-sm font-black text-slate-400 group-hover:text-blue-500 transition-colors">#{pr.globalRank}</span>
                                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase text-white ${pr.tier.classes}`}>
                                            {pr.tier.name}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest"><Lock className="w-3 h-3 inline mr-1 -mt-0.5" /> Hidden</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-slate-100 text-slate-400 border border-slate-200">UNRANKED</span>
                                  )}
                                </div>
                                <div className="text-right ml-auto sm:ml-0">
                                  <span className="block text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-widest">Mark</span>
                                  <span className="font-black text-3xl text-blue-600">{pr.mark}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-center">
                        <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h4 className="text-lg font-black text-slate-900 mb-1">No times found</h4>
                        <p className="text-sm text-slate-500 font-medium mt-1">Sync your profile to populate this board.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 🎯 TAB 2: RECRUITING */}
              {activeTab === 'recruiting' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* NCAA RECRUITING RULES GUIDE */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">NCAA Recruiting Guide</h2>
                        <p className="text-slate-500 font-medium text-sm">Understand when and how coaches can contact you.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                        <h3 className="font-black text-lg text-slate-900 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-500" /> The "June 15th" Rule (D1 & D2)
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                          NCAA Division 1 and Division 2 coaches <strong>cannot</strong> send you recruiting materials, direct messages, or return your phone calls until <strong className="text-slate-900">June 15th after your Sophomore year.</strong> Before this date, they can only send you camp brochures or generic questionnaires.
                        </p>
                      </div>

                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
                        <h3 className="font-black text-lg text-slate-900 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-blue-500" /> The "One-Way" Loophole
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Even if you are a Freshman or Sophomore, <strong>you can still contact coaches!</strong> You are allowed to call, email, or DM them to express interest. 
                          <br/><br/>
                          <span className="font-bold text-slate-800">The Catch:</span> If you call and they pick up, you can talk. But if you leave a voicemail or send a DM, <strong>they are legally not allowed to reply to you</strong> until June 15th of your Sophomore year. Do not get discouraged if they don't answer—they are likely just following NCAA rules!
                        </p>
                      </div>

                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6">
                        <h3 className="font-black text-lg text-slate-900 mb-2 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-emerald-500" /> D3 & NAIA Programs
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Division 3 and NAIA programs have much fewer restrictions. Coaches from these divisions can contact you, reply to your emails, and send you recruiting materials at almost any point during your high school career.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* INBOX BANNER */}
                  <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-[2rem] p-8 border border-purple-700 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                    <div className="relative z-10 flex items-center gap-6 text-center sm:text-left">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shrink-0 mx-auto sm:mx-0">
                        <Mail className="w-8 h-8 text-purple-200" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white tracking-tight mb-1">Recruiting Inbox</h3>
                        <p className="text-purple-200/80 font-medium text-sm">
                          {unreadCount > 0 
                            ? `You have ${unreadCount} unread pitches from college coaches!` 
                            : "Coaches use the Discovery Engine to send you direct pitches."}
                        </p>
                      </div>
                    </div>
                    <div className="relative z-10 w-full sm:w-auto shrink-0">
                      <Link href="/dashboard/messages" className="block w-full text-center bg-white text-purple-900 hover:bg-purple-50 font-black px-8 py-4 rounded-xl shadow-lg transition-colors">
                        View Messages {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">{unreadCount}</span>}
                      </Link>
                    </div>
                  </div>

                  {/* MASTER RESUME */}
                  <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-slate-200 shadow-sm h-auto flex flex-col relative overflow-hidden">
                    {!athleteProfile?.is_premium && (
                      <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-inner">
                          <Lock className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Resume Builder is Locked</h3>
                        <p className="text-slate-500 font-medium mb-6 max-w-sm">Upgrade to Pro to create a master athletic resume that you can attach to any recruiting pitch with one click.</p>
                        <Link href="/pro" className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                          <Crown className="w-4 h-4" /> Unlock Pro Features
                        </Link>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-6 border-b border-slate-100 gap-4">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center">
                          <FileText className="w-6 h-6 mr-3 text-emerald-500" /> Master Resume
                        </h2>
                        <p className="text-slate-500 font-medium mt-1 text-sm">Save your academics and achievements. Attach this to any feed pitch instantly.</p>
                      </div>
                      
                      {athleteProfile?.is_premium && (
                        <button 
                          onClick={handleSaveResume}
                          disabled={isSavingResume}
                          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black px-5 py-2.5 rounded-xl text-sm transition-colors shadow-md disabled:opacity-50 shrink-0"
                        >
                          <Save className="w-4 h-4" /> {isSavingResume ? 'Saving...' : 'Save Resume'}
                        </button>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col">
                      <textarea 
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        disabled={!athleteProfile?.is_premium}
                        placeholder="Example:&#10;&#10;Academics:&#10;GPA: 3.9 (Unweighted)&#10;SAT: 1450&#10;Intended Major: Business Administration&#10;&#10;Athletic Highlights:&#10;• 2024 State Finalist (400m)&#10;• 3x Varsity Letterman&#10;• Team Captain (Junior & Senior Year)"
                        className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none min-h-[250px]"
                      />
                      <p className="text-xs font-bold text-slate-400 text-right mt-3">
                        Markdown and line breaks are supported.
                      </p>
                    </div>
                  </div>

                  {/* TARGET SCHOOLS */}
                  <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-6">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                          <School className="w-6 h-6 mr-2 text-blue-600" /> Target Schools
                        </h3>
                        <p className="text-slate-500 font-medium text-sm mt-1">Colleges you are actively interested in.</p>
                      </div>
                      <div className="bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg text-xs">
                        {savedColleges?.length || 0} Saved
                      </div>
                    </div>
                    
                    {savedColleges && savedColleges.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {savedColleges.map((saved) => {
                          const college = saved.universities; 
                          if (!college) return null;
                          return (
                            <div key={saved.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50 transition-colors group cursor-pointer relative">
                              <Link href={`/college/${college.id}`} className="absolute inset-0 z-10" aria-label={`View ${college.name}`}></Link>
                              <div className="w-12 h-12 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative z-0">
                                {college.logo_url ? (
                                  <img src={college.logo_url} alt={college.name} className="w-8 h-8 object-contain" />
                                ) : (
                                  <School className="w-6 h-6 text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1 truncate relative z-0">
                                <h4 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{college.name}</h4>
                                <p className="text-xs font-medium text-slate-500 flex items-center mt-0.5">
                                  {college.division || 'NCAA'} • {college.state || 'USA'}
                                </p>
                              </div>
                              <button 
                                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveCollege(saved.id); }} 
                                 className="relative z-20 p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                                 title="Remove school"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                        <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-lg font-bold text-slate-900 mb-1">No schools saved yet</h4>
                        <p className="text-sm text-slate-500 font-medium mb-4 max-w-sm mx-auto">Build your recruiting board by saving colleges that match your athletic and academic goals.</p>
                        <Link href="/search" className="inline-flex items-center justify-center bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm">
                          Open College Finder
                        </Link>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* 🕵️ TAB 3: PRO Scout */}
              {activeTab === 'scout' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-200 h-auto flex flex-col relative overflow-hidden">
                    {!athleteProfile?.is_premium && (
                      <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-inner">
                          <Lock className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Pro Scout is Locked</h3>
                        <p className="text-slate-500 font-medium mb-6 max-w-sm">Upgrade to Pro to instantly generate a recruiting score and tier projection for any competitor in the country.</p>
                        <Link href="/pro" className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                          <Crown className="w-4 h-4" /> Unlock Pro Features
                        </Link>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-6 border-b border-slate-100 gap-4">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center">
                          <Search className="w-6 h-6 mr-3 text-indigo-500" /> Pro Scout
                        </h2>
                        <p className="text-slate-500 font-medium mt-1 text-sm">Paste any athlete's Athletic.net link to see their recruiting score.</p>
                      </div>
                      <div className="bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg text-xs shrink-0">
                        {scoutsRemaining} / 10 Daily Uses
                      </div>
                    </div>

                    <form onSubmit={handleScoutCompetitor} className="flex gap-2 mb-6">
                      <input 
                        type="url" 
                        required 
                        placeholder="Paste Athletic.net link..." 
                        value={scoutUrl} 
                        onChange={(e) => setScoutUrl(e.target.value)} 
                        disabled={!athleteProfile?.is_premium || scoutsRemaining <= 0}
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm transition-colors" 
                      />
                      <button 
                        type="submit" 
                        disabled={isScouting || !athleteProfile?.is_premium || scoutsRemaining <= 0} 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-colors shadow-sm shrink-0 flex items-center"
                      >
                        {isScouting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Scout'}
                      </button>
                    </form>

                    {scoutedAthletes.length > 0 && (
                      <div className="mt-8 space-y-4">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Saved Scout Reports</h4>
                        {scoutedAthletes.map(scout => {
                          const proj = getAthleteProjection(scout.prs, scout.gender);
                          return (
                            <div key={scout.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative group transition-all hover:border-indigo-300">
                              <button
                                onClick={() => handleRemoveScouted(scout.id)}
                                className="absolute top-4 right-4 p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-20"
                                title="Remove report"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-200 pr-8">
                                <div>
                                  <h4 className="text-lg font-black text-slate-900">{scout.first_name} {scout.last_name}</h4>
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{scout.high_school}</p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Score</span>
                                  <div className="flex items-end gap-1">
                                    <span className="font-black text-2xl text-indigo-600 leading-none">{scout.calculated_score ? Math.round(scout.calculated_score) : '-'}</span>
                                    <span className="text-[10px] font-bold text-slate-400 pb-0.5">/99</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1 bg-indigo-50 px-1.5 py-0.5 rounded">Via {proj?.bestEvent || 'N/A'}</span>
                                </div>
                              </div>

                              <div className={`px-4 py-2 rounded-xl border mb-4 inline-block ${proj?.bg || 'bg-slate-100'} ${proj?.border || 'border-slate-200'}`}>
                                <span className={`text-sm font-black ${proj?.color || 'text-slate-600'}`}>{scout.calculated_tier || 'N/A'}</span>
                              </div>

                              {proj && proj.eventBreakdowns && proj.eventBreakdowns.length > 0 && (
                                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All Events</p>
                                  {proj.eventBreakdowns.map((ev: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-slate-700">{ev.event}</span>
                                        <span className="text-[10px] font-medium text-slate-500">{ev.mark}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400">{ev.currentTier}</span>
                                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{Math.round(ev.score)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <button 
                                onClick={() => setActiveCardAthlete(scout)}
                                className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                              >
                                <Share2 className="w-4 h-4" /> Export Scout Card
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 🎁 TAB 4: REWARDS */}
              {activeTab === 'rewards' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* TITLE MANAGER */}
                  <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Rank Titles</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Equip your highest earned rank.</p>
                      </div>
                      <Trophy className="w-6 h-6 text-slate-300" />
                    </div>

                    {/* 🚨 NEW SLEEK TITLE DROPDOWN MENU 🚨 */}
                    <div className="relative mb-6">
                      <button 
                        onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left bg-blue-50 border-blue-300 shadow-sm`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase text-white ${activeTitle.badgeClass}`}>
                            {activeTitle.name}
                          </div>
                          <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-wider">Currently Equipped</span>
                        </div>
                        {isTitleDropdownOpen ? <ChevronUp className="w-5 h-5 text-blue-500" /> : <ChevronDown className="w-5 h-5 text-blue-500" />}
                      </button>

                      {isTitleDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                          <div className="max-h-64 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {EARNED_TITLES.map((title) => {
                              const isUnlocked = highestPercentile <= title.reqPercentile;
                              const isEquipped = equippedTitle === title.id;

                              return (
                                <button 
                                  key={title.id}
                                  disabled={!isUnlocked || isEquipping}
                                  onClick={() => handleEquipTitle(title.id)}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                                    isEquipped 
                                      ? 'bg-blue-50/50' 
                                      : isUnlocked 
                                        ? 'hover:bg-slate-50' 
                                        : 'opacity-40 cursor-not-allowed'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase text-white ${isUnlocked ? title.badgeClass : 'bg-slate-300 text-slate-500 border border-slate-400'}`}>
                                      {title.name}
                                    </div>
                                    {!isUnlocked && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center"><Lock className="w-2.5 h-2.5 inline mr-1 -mt-0.5" />{title.unlockText}</span>}
                                  </div>
                                  {isEquipped && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <Link href="/dashboard/customize" className={`w-full flex items-center justify-center py-4 rounded-xl font-black transition-all bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 shadow-md`}>
                      <Paintbrush className="w-5 h-5 mr-2" /> Customize Profile
                    </Link>
                  </div>

                  {/* REFERRAL PROGRAM WITH MILESTONES */}
                  <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 border border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row items-start justify-between gap-12 relative z-10">
                      <div className="flex-1 w-full">
                        <h3 className="text-3xl font-black text-white tracking-tight mb-3 flex items-center gap-3">
                          <Users className="w-8 h-8 text-emerald-400" /> Invite & Earn
                        </h3>
                        <p className="text-slate-300 font-medium text-lg mb-6 leading-relaxed max-w-xl">
                          Get <strong className="text-amber-400">1 Free Boost</strong> for every single teammate that uses your unique code. Reach 5 invites to unlock the exclusive Plasma Border!
                        </p>
                        
                        {!myReferralCode ? (
                          <div className="bg-slate-800 border border-slate-700 text-slate-400 p-4 rounded-xl text-sm font-bold inline-block">
                            Sync your Athletic.net profile above to generate your unique invite code!
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="bg-slate-950 px-6 py-3 rounded-xl border border-emerald-500/30 flex items-center gap-4 shadow-inner">
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Your Code:</span>
                              <span className="text-2xl font-mono font-black tracking-widest text-emerald-400">{myReferralCode}</span>
                            </div>
                            <button 
                              onClick={() => handleShareCode(myReferralCode)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3.5 rounded-xl font-black transition-colors flex items-center gap-2"
                            >
                              <Share2 className="w-5 h-5" /> Share Code
                            </button>
                          </div>
                        )}

                        {showCodeEntry && (
                          <div className="mt-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 max-w-md">
                            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                              <Gift className="w-5 h-5 text-fuchsia-400" /> Were you invited?
                            </h4>
                            <p className="text-xs text-slate-400 mb-4">Enter your teammate's code below to get a free Boost!</p>
                            <form onSubmit={handleSubmitInviteCode} className="flex gap-2">
                              <input 
                                type="text" 
                                required
                                placeholder="Enter Code (e.g. 123456)" 
                                value={inviteCodeInput}
                                onChange={(e) => setInviteCodeInput(e.target.value)}
                                className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-fuchsia-500 font-mono text-sm"
                              />
                              <button 
                                type="submit" 
                                disabled={isSubmittingCode}
                                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
                              >
                                {isSubmittingCode ? '...' : 'Submit'}
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-800 relative z-10">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 sm:mb-8 gap-4">
                        <div>
                          <h4 className="text-xl font-black text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-400"/> Reward Track
                          </h4>
                          <p className="text-sm text-slate-400 font-medium mt-1">
                            You have <strong className="text-white">{currentRefs}</strong> verified invites.
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Next Mega Bonus</span>
                          <span className="text-lg font-black text-amber-400">{base + 5} Invites</span>
                        </div>
                      </div>

                      {/* Visual Track */}
                      <div className="relative w-full h-4 bg-slate-950 rounded-full border border-slate-800 shadow-inner mb-10 mx-auto max-w-[95%]">
                        
                        <div 
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 rounded-full transition-all duration-1000" 
                          style={{ width: `${progressPct}%` }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                        </div>

                        {milestones.map((m, i) => {
                          const posPct = ((m.count - base) / 5) * 100;
                          const isAchieved = currentRefs >= m.count;
                          const Icon = m.icon;
                          
                          return (
                            <div key={i} className="absolute top-1/2 flex flex-col items-center" style={{ left: `${posPct}%`, transform: 'translate(-50%, -50%)' }}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-slate-900 z-10 transition-colors duration-500 ${isAchieved ? m.bg : 'bg-slate-800'} ${m.isMajor ? 'w-10 h-10 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : ''}`}>
                                {isAchieved ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Icon className={`w-4 h-4 ${m.isMajor ? 'text-amber-400' : 'text-slate-500'}`} />}
                              </div>

                              <div className="absolute top-12 text-center w-24">
                                <span className={`block text-[11px] font-black mb-0.5 ${isAchieved ? m.color : 'text-slate-500'}`}>{m.label}</span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{m.count} Invites</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* SCOUT CARD MODAL */}
      {activeCardAthlete && cardProjection && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col items-center max-w-md w-full">
            
            <div className="flex justify-between items-center w-full mb-4">
              <h3 className="text-white font-black text-xl">Scout Card</h3>
              <button onClick={() => setActiveCardAthlete(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div id="scout-card-export" className={`relative w-[340px] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-b ${cardAccentColor} border-4 flex flex-col p-6`}>
               <div className={`absolute -top-10 -right-10 w-48 h-48 rounded-full blur-[60px] ${cardGlowColor}`}></div>
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

               <div className="flex justify-between items-start z-10">
                  <div className="flex flex-col items-center bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
                     <span className="text-5xl font-black text-white leading-none tracking-tighter">{Math.round(cardProjection.overallScore)}</span>
                     <span className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-1">OVR</span>
                  </div>
                  <ShieldCheck className="w-10 h-10 text-white/50" />
               </div>

               <div className="text-center mt-auto z-10">
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tight drop-shadow-md">
                    {activeCardAthlete.first_name} {activeCardAthlete.last_name}
                  </h2>
                  <p className="text-sm text-white/80 font-bold tracking-widest uppercase mt-1">{activeCardAthlete.high_school}</p>
                  <div className="inline-block px-3 py-1 rounded-md bg-black/30 border border-white/10 mt-3">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">{cardProjection.overallLabel}</p>
                  </div>
               </div>

               <div className="w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent my-6 z-10"></div>

               <div className="flex justify-around z-10 text-white mb-2">
                  {cardProjection.eventBreakdowns.slice(0,3).map((ev: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center">
                       <span className="text-xl font-black">{ev.mark}</span>
                       <span className="text-[9px] font-bold uppercase text-white/60 tracking-widest mt-1 text-center max-w-[80px] truncate">{ev.event}</span>
                    </div>
                  ))}
               </div>

               <div className="absolute bottom-3 left-0 right-0 text-center z-10">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">Verified by ChasedSports</span>
               </div>
            </div>

            <button 
              onClick={handleDownloadCard} 
              disabled={isExportingCard}
              className="mt-8 w-full max-w-[340px] bg-white text-slate-900 font-black py-4 rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isExportingCard ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" /> Download Scout Card</>}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}