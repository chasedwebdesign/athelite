'use client';

import React, { useEffect, useState, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShieldCheck,
  Database,
  ArrowRight,
  Activity,
  CheckCircle2,
  Trophy,
  Target,
  MapPin,
  DollarSign,
  GraduationCap,
  LockOpen,
  ChevronDown,
  AlertCircle,
  RefreshCcw,
  Check,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Timer,
  Map,
  Waves,
  Flag,
  Swords,
  Flame,
  Dumbbell,
  HelpCircle,
  Award,
  BookOpen,
  Crown,
  Eye,
} from 'lucide-react';

// Registry, Borders & Constants
import SportEditorRegistry from '@/components/dashboard/sports/SportEditorRegistry';
import { AvatarWithBorder } from '@/components/AnimatedBorders';
import { ALL_SPORTS, SPORT_CONFIGS_META, evaluateMetric } from '@/utils/constants/RecruitingStandards';

// ============================================================================
// 🚨 EXPORTED TYPES & INTERFACES (Shared with app/page.tsx)
// ============================================================================
export interface FeaturedCollegeItem {
  id: string | number;
  name: string;
  location: string;
  division: string;
  budget: string;
  salary: string;
  color: string;
  backStats: {
    recruitScore: number;
    acceptanceRate?: string;
    gradRate?: string;
  };
}

export interface FeaturedAthleteItem {
  id: string | number;
  customSlug?: string | null;
  firstName: string;
  lastName: string;
  highSchool: string;
  state?: string;
  gradYear?: number | null;
  gender?: string;
  initials: string;
  color: string;
  avatarUrl?: string | null;
  equippedCard?: string | null;
  equippedBorder?: string | null;
  isVerified?: boolean;
  isPro?: boolean;
  sportName?: string;
  levelOfPlay?: string;
  fitScore?: number;
  gpa?: string | null;
  metrics?: { name: string; value: string; score?: number }[];
}

export interface LandingClientProps {
  initialColleges?: FeaturedCollegeItem[];
  initialAthletes?: FeaturedAthleteItem[];
}

interface CalculationResult {
  score: number;
  currentTier: string;
  nextTier: string;
  targetMarkFormatted?: string;
  deltaFormatted?: string;
  label: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
  isField?: boolean;
}

// ==========================================
// 🚨 LOCAL ERROR BOUNDARY TO PREVENT CRASHES
// ==========================================
interface EBProps {
  children: ReactNode;
  onReset: () => void;
}
interface EBState {
  hasError: boolean;
}

class EditorErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error): EBState {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sport Editor Crash Intercepted:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-500/10 rounded-[2rem] border border-rose-500/20 shadow-inner animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 border border-rose-500/30">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <h3 className="text-lg font-black text-rose-400 mb-2">Invalid Format Detected</h3>
          <p className="text-sm font-medium text-rose-300/80 mb-6 max-w-sm">
            The input contains unrecognized characters (like semicolons). Please use standard times (e.g. 16:45) or distances.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset();
            }}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-black px-6 py-3 rounded-xl transition-all shadow-md active:scale-95"
          >
            <RefreshCcw className="w-4 h-4" /> Reset Editor
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// 🚨 DYNAMIC SPORT MAPPINGS (Reliable Images, Colors, Icons)
// ============================================================================
const SPORT_THEMES: Record<string, { image: string; colorClass: string; ringClass: string; bgClass: string }> = {
  'Cross Country': { image: 'https://images.unsplash.com/photo-1502224562085-639556652f33?q=80&w=800&auto=format&fit=crop', colorClass: 'text-green-400', ringClass: 'ring-green-500', bgClass: 'bg-green-500/20' },
  'Swimming & Diving': { image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop', colorClass: 'text-cyan-400', ringClass: 'ring-cyan-500', bgClass: 'bg-cyan-500/20' },
  Golf: { image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800&auto=format&fit=crop', colorClass: 'text-lime-400', ringClass: 'ring-lime-500', bgClass: 'bg-lime-500/20' },
  Basketball: { image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=800&auto=format&fit=crop', colorClass: 'text-orange-500', ringClass: 'ring-orange-500', bgClass: 'bg-orange-500/20' },
  Soccer: { image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800&auto=format&fit=crop', colorClass: 'text-blue-500', ringClass: 'ring-blue-500', bgClass: 'bg-blue-500/20' },
  Football: { image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=800&auto=format&fit=crop', colorClass: 'text-rose-500', ringClass: 'ring-rose-500', bgClass: 'bg-rose-500/20' },
  Lacrosse: { image: 'https://images.unsplash.com/photo-1735847493430-244a0a9610d1?q=80&w=800&auto=format&fit=crop', colorClass: 'text-fuchsia-500', ringClass: 'ring-fuchsia-500', bgClass: 'bg-fuchsia-500/20' },
  Baseball: { image: 'https://images.unsplash.com/photo-1529768167801-9173d94c2a42?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YmFzZWJhbGx8ZW58MHx8MHx8fDA%3D', colorClass: 'text-red-500', ringClass: 'ring-red-500', bgClass: 'bg-red-500/20' },
  Softball: { image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=800&auto=format&fit=crop', colorClass: 'text-yellow-400', ringClass: 'ring-yellow-400', bgClass: 'bg-yellow-400/20' },
  'Ice Hockey': { image: 'https://images.unsplash.com/photo-1547054731-f9974ff86ece?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGljZSUyMGhvY2tleXxlbnwwfHwwfHx8MA%3D%3D', colorClass: 'text-sky-400', ringClass: 'ring-sky-500', bgClass: 'bg-sky-500/20' },
  'Water Polo': { image: 'https://images.unsplash.com/photo-1675064276064-a6c5f50c4cb7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8d2F0ZXJwb2xvfGVufDB8fDB8fHww', colorClass: 'text-cyan-500', ringClass: 'ring-cyan-500', bgClass: 'bg-cyan-500/20' },
  Tennis: { image: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8dGVubmlzfGVufDB8fDB8fHww', colorClass: 'text-lime-400', ringClass: 'ring-lime-500', bgClass: 'bg-lime-500/20' },
  Volleyball: { image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=800&auto=format&fit=crop', colorClass: 'text-orange-400', ringClass: 'ring-orange-400', bgClass: 'bg-orange-500/20' },
  Wrestling: { image: 'https://images.unsplash.com/photo-1541337082051-5959dbb57d5d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d3Jlc3RsaW5nfGVufDB8fDB8fHww', colorClass: 'text-red-600', ringClass: 'ring-red-600', bgClass: 'bg-red-500/20' },
  Gymnastics: { image: 'https://images.unsplash.com/photo-1665214057529-81877a586dda?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fGd5bW5hc3RpY3N8ZW58MHx8MHx8fDA%3D', colorClass: 'text-purple-400', ringClass: 'ring-purple-500', bgClass: 'bg-purple-500/20' },
  Bowling: { image: 'https://images.unsplash.com/photo-1614713568397-b31b779d0498?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Ym93bGluZ3xlbnwwfHwwfHx8MA%3D%3D', colorClass: 'text-indigo-400', ringClass: 'ring-indigo-500', bgClass: 'bg-indigo-500/20' },
  Fencing: { image: 'https://images.unsplash.com/photo-1631529819887-5b4340090570?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmVuY2luZ3xlbnwwfHwwfHx8MA%3D%3D', colorClass: 'text-slate-300', ringClass: 'ring-slate-400', bgClass: 'bg-slate-400/20' },
  'Field Hockey': { image: 'https://images.unsplash.com/photo-1734158661120-a0605f0cee48?q=80&w=800&auto=format&fit=crop', colorClass: 'text-emerald-500', ringClass: 'ring-emerald-500', bgClass: 'bg-emerald-500/20' },
};

const getSportIcon = (sport: string, className: string) => {
  const s = sport.toLowerCase();
  if (s.includes('track')) return <Timer className={className} />;
  if (s.includes('cross country')) return <Map className={className} />;
  if (s.includes('swim') || s.includes('water')) return <Waves className={className} />;
  if (s.includes('golf')) return <Flag className={className} />;
  if (s.includes('fencing') || s.includes('lacrosse')) return <Swords className={className} />;
  if (s.includes('wrestling')) return <Flame className={className} />;
  if (s.includes('football') || s.includes('soccer')) return <ShieldCheck className={className} />;
  if (s.includes('gymnastics')) return <Dumbbell className={className} />;
  return <Trophy className={className} />;
};

const getSportTheme = (sport: string) => {
  return (
    SPORT_THEMES[sport] || {
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop',
      colorClass: 'text-blue-500',
      ringClass: 'ring-blue-500',
      bgClass: 'bg-blue-500/20',
    }
  );
};

// ============================================================================
// 🚨 GAMIFIED TIER ENGINE & UNIVERSAL RECRUITING STANDARDS (TRACK & FIELD)
// ============================================================================
const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

const RECRUITING_STANDARDS: Record<string, Record<string, { t1: number; t2: number; t3: number; t4: number; t5: number; t6: number; t7: number; isField?: boolean }>> = {
  Boys: {
    '60 Meters': { t1: 6.75, t2: 6.9, t3: 7.05, t4: 7.2, t5: 7.4, t6: 7.6, t7: 8.0 },
    '100 Meters': { t1: 10.5, t2: 10.8, t3: 11.0, t4: 11.3, t5: 11.6, t6: 11.9, t7: 12.6 },
    '200 Meters': { t1: 21.2, t2: 21.8, t3: 22.2, t4: 22.8, t5: 23.5, t6: 24.5, t7: 26.0 },
    '400 Meters': { t1: 47.5, t2: 49.0, t3: 50.0, t4: 51.5, t5: 53.0, t6: 55.0, t7: 58.0 },
    '800 Meters': { t1: 112, t2: 115, t3: 117, t4: 120, t5: 125, t6: 130, t7: 140 },
    '1500 Meters': { t1: 231, t2: 239, t3: 244, t4: 250, t5: 264, t6: 275, t7: 300 },
    '1600 Meters': { t1: 250, t2: 258, t3: 264, t4: 270, t5: 285, t6: 295, t7: 320 },
    '3000 Meters': { t1: 500, t2: 518, t3: 532, t4: 546, t5: 574, t6: 600, t7: 660 },
    '3200 Meters': { t1: 540, t2: 560, t3: 575, t4: 590, t5: 620, t6: 650, t7: 720 },
    '110m Hurdles': { t1: 13.8, t2: 14.2, t3: 14.6, t4: 15.0, t5: 15.5, t6: 16.5, t7: 18.5 },
    '300m Hurdles': { t1: 37.0, t2: 38.5, t3: 39.5, t4: 41.0, t5: 42.5, t6: 44.5, t7: 48.0 },
    'Long Jump': { t1: 288, t2: 270, t3: 260, t4: 252, t5: 240, t6: 228, t7: 204, isField: true },
    'Triple Jump': { t1: 588, t2: 564, t3: 540, t4: 516, t5: 492, t6: 468, t7: 420, isField: true },
    'High Jump': { t1: 82, t2: 78, t3: 76, t4: 74, t5: 70, t6: 66, t7: 60, isField: true },
    'Pole Vault': { t1: 198, t2: 186, t3: 174, t4: 162, t5: 150, t6: 132, t7: 108, isField: true },
    'Shot Put': { t1: 720, t2: 660, t3: 600, t4: 540, t5: 480, t6: 444, t7: 360, isField: true },
    Discus: { t1: 2220, t2: 2040, t3: 1860, t4: 1740, t5: 1620, t6: 1440, t7: 1080, isField: true },
    Javelin: { t1: 2340, t2: 2160, t3: 2040, t4: 1920, t5: 1800, t6: 1620, t7: 1200, isField: true },
  },
  Girls: {
    '60 Meters': { t1: 7.45, t2: 7.65, t3: 7.85, t4: 8.05, t5: 8.3, t6: 8.6, t7: 9.2 },
    '100 Meters': { t1: 11.7, t2: 12.1, t3: 12.4, t4: 12.8, t5: 13.2, t6: 13.6, t7: 14.5 },
    '200 Meters': { t1: 24.2, t2: 24.8, t3: 25.5, t4: 26.2, t5: 27.0, t6: 28.5, t7: 31.0 },
    '400 Meters': { t1: 54.5, t2: 57.0, t3: 58.5, t4: 60.5, t5: 63.0, t6: 66.0, t7: 72.0 },
    '800 Meters': { t1: 130, t2: 135, t3: 140, t4: 145, t5: 152, t6: 160, t7: 175 },
    '1500 Meters': { t1: 268, t2: 282, t3: 291, t4: 300, t5: 314, t6: 330, t7: 375 },
    '1600 Meters': { t1: 290, t2: 305, t3: 315, t4: 325, t5: 340, t6: 360, t7: 400 },
    '3000 Meters': { t1: 583, t2: 611, t3: 638, t4: 666, t5: 694, t6: 730, t7: 840 },
    '3200 Meters': { t1: 630, t2: 660, t3: 690, t4: 720, t5: 750, t6: 800, t7: 900 },
    '100m Hurdles': { t1: 13.8, t2: 14.3, t3: 14.8, t4: 15.5, t5: 16.5, t6: 17.8, t7: 20.0 },
    '300m Hurdles': { t1: 42.5, t2: 44.5, t3: 46.5, t4: 48.5, t5: 51.0, t6: 54.0, t7: 59.0 },
    'Long Jump': { t1: 234, t2: 222, t3: 210, t4: 198, t5: 186, t6: 174, t7: 150, isField: true },
    'Triple Jump': { t1: 480, t2: 456, t3: 432, t4: 408, t5: 384, t6: 360, t7: 312, isField: true },
    'High Jump': { t1: 68, t2: 64, t3: 62, t4: 60, t5: 58, t6: 54, t7: 50, isField: true },
    'Pole Vault': { t1: 156, t2: 144, t3: 132, t4: 120, t5: 108, t6: 90, t7: 72, isField: true },
    'Shot Put': { t1: 540, t2: 480, t3: 432, t4: 396, t5: 360, t6: 324, t7: 264, isField: true },
    Discus: { t1: 1800, t2: 1620, t3: 1500, t4: 1380, t5: 1260, t6: 1080, t7: 840, isField: true },
    Javelin: { t1: 1740, t2: 1560, t3: 1440, t4: 1320, t5: 1200, t6: 1020, t7: 780, isField: true },
  },
};

const ALL_EVENTS = Object.keys(RECRUITING_STANDARDS['Boys']);

// Key events surfaced in the public GEO Reference Table for Search & AI Engines
const GEO_BENCHMARK_EVENTS = [
  '100 Meters',
  '200 Meters',
  '400 Meters',
  '800 Meters',
  '1500 Meters',
  '1600 Meters',
  '3000 Meters',
  '3200 Meters',
  'Long Jump',
  'Shot Put',
];

const LANDING_FAQS = [
  {
    q: 'How does ChasedSports calculate my 0–99 Base Recruiting Score across 19 sports?',
    a: 'Our 19 sport-specific recruiting engines benchmark your personal records (PRs), combine numbers, and season stats against verified NCAA Division 1 (Power 4 & Mid-Major), Division 2, Division 3, and NAIA roster standards. A score of 95–99 places you in the Power 4 D1 tier, 85–94 in Mid-Major D1, 75–84 in Top D2 / D1 Walk-On, and 55–74 in D2, D3, and NAIA scholarship & roster tiers.',
  },
  {
    q: 'What is included in an Official ChasedSports Athletic Portfolio?',
    a: 'Every athlete gets a customizable public portfolio (/athlete/[id]) built to impress college coaches. Your portfolio showcases your core metrics across any of our 19 supported sports, season accolades, unweighted GPA, unlockable holographic card themes and animated borders from the Shop, and permanent 60-second HD highlight film hosting with ChasedSports PRO.',
  },
  {
    q: 'What Track & Field times do I need to run in college?',
    a: 'Standards vary by division and conference. For example, in the Boys 1500m / 1600m, Power 4 D1 recruits typically run 3:51 (4:10 for 1600m), Mid-Major D1 targets 3:59 (4:18), D2/Walk-On targets 4:04–4:10 (4:24–4:30), and D3/NAIA programs recruit strongly around 4:24 (4:45). Check our interactive Recruiting Standards Matrix above to view exact marks for every event.',
  },
  {
    q: 'How does the College Matchmaker calculate Athletic Fit and 10-Year ROI?',
    a: "When you search our database of 1,500+ universities, ChasedSports compares your Base Recruiting Score directly against each program's team_performance_rating to generate a custom Readiness Meter. We also combine in-state/out-of-state tuition, program operating expenses, average athletic scholarships, and 10-year median alumni earnings to recommend your Best Athletic Fit, Lowest Net Cost, and Top ROI schools.",
  },
];

const convertMarkToNumber = (markStr: string, isField: boolean): number => {
  if (isField) {
    const clean = markStr.replace(/[^0-9.]/g, ' ').trim().split(/\s+/);
    const feet = parseFloat(clean[0]) || 0;
    const inches = parseFloat(clean[1]) || 0;
    return feet * 12 + inches;
  } else {
    const sanitizedMark = markStr.replace(/;/g, ':');
    if (sanitizedMark.includes(':')) {
      const parts = sanitizedMark.split(':');
      return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(sanitizedMark.replace(/[a-zA-Z]/g, '').trim()) || 99999;
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

export const getTierStyles = (score: number) => {
  if (score >= 95)
    return {
      tier: 'Power 4 D1',
      nextTier: 'MAX RANK',
      scoreRequired: 99,
      colorClass: 'text-fuchsia-400',
      bgClass: 'bg-fuchsia-500/10',
      barClass: 'bg-fuchsia-500',
      borderClass: 'border-fuchsia-500/50',
      glowClass: 'shadow-[0_0_30px_rgba(217,70,239,0.4)]',
    };
  if (score >= 85)
    return {
      tier: 'Mid-Major D1',
      nextTier: 'Power 4 D1',
      scoreRequired: 95,
      colorClass: 'text-purple-400',
      bgClass: 'bg-purple-500/10',
      barClass: 'bg-purple-500',
      borderClass: 'border-purple-500/50',
      glowClass: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
    };
  if (score >= 75)
    return {
      tier: 'Top D2 / Walk-On',
      nextTier: 'Mid-Major D1',
      scoreRequired: 85,
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-500/10',
      barClass: 'bg-blue-500',
      borderClass: 'border-blue-500/50',
      glowClass: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    };
  if (score >= 65)
    return {
      tier: 'D2 / D3 Prospect',
      nextTier: 'Top D2 / Walk-On',
      scoreRequired: 75,
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      barClass: 'bg-emerald-500',
      borderClass: 'border-emerald-500/50',
      glowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    };
  if (score >= 55)
    return {
      tier: 'NAIA Prospect',
      nextTier: 'D2 / D3 Prospect',
      scoreRequired: 65,
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10',
      barClass: 'bg-amber-500',
      borderClass: 'border-amber-500/50',
      glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    };
  if (score >= 40)
    return {
      tier: 'Strong Varsity',
      nextTier: 'NAIA Prospect',
      scoreRequired: 55,
      colorClass: 'text-slate-300',
      bgClass: 'bg-slate-500/20',
      barClass: 'bg-slate-400',
      borderClass: 'border-slate-400/50',
      glowClass: 'shadow-[0_0_15px_rgba(148,163,184,0.2)]',
    };
  if (score >= 20)
    return {
      tier: 'Varsity Contributor',
      nextTier: 'Strong Varsity',
      scoreRequired: 40,
      colorClass: 'text-slate-400',
      bgClass: 'bg-slate-500/10',
      barClass: 'bg-slate-500',
      borderClass: 'border-slate-500/30',
      glowClass: '',
    };
  if (score > 0)
    return {
      tier: 'Developmental',
      nextTier: 'Varsity Contributor',
      scoreRequired: 20,
      colorClass: 'text-slate-400',
      bgClass: 'bg-slate-500/5',
      barClass: 'bg-slate-600',
      borderClass: 'border-slate-600/30',
      glowClass: '',
    };

  return {
    tier: 'Unranked',
    nextTier: 'Developmental',
    scoreRequired: 10,
    colorClass: 'text-slate-500',
    bgClass: 'bg-slate-500/5',
    barClass: 'bg-slate-600',
    borderClass: 'border-slate-600/30',
    glowClass: '',
  };
};

// ============================================================================
// 🚨 SPORTS REGISTRY BEST-STAT EVALUATOR (Finds the #1 Best Metric)
// ============================================================================
const scoreSingleMetric = (
  gender: string,
  sportName: string,
  metricName: string,
  metricValue: string,
  levelOfPlay: string
): number => {
  if (!metricName || !metricValue) return 0;

  // 1. Try universal 19-sport RecruitingStandards evaluator first
  try {
    const evalRes = evaluateMetric(gender || 'Boys', sportName || 'Track & Field', metricName, metricValue, levelOfPlay || 'Varsity');
    if (evalRes && typeof evalRes.score === 'number' && evalRes.score > 0) {
      return evalRes.score;
    }
  } catch (e) {}

  // 2. Fallback to Track & Field / XC event standards
  const standards = RECRUITING_STANDARDS[gender] || RECRUITING_STANDARDS['Boys'];
  const normalizedEvent = metricName
    .replace(/Meter\b/i, 'Meters')
    .replace(/^5000m|5,000m|5k|5000 Meters$/i, '3200 Meters')
    .replace(/^1500m$/i, '1500 Meters')
    .replace(/^1600m$/i, '1600 Meters')
    .replace(/^3000m$/i, '3000 Meters')
    .replace(/^3200m$/i, '3200 Meters')
    .replace(/^800m$/i, '800 Meters')
    .replace(/^400m$/i, '400 Meters')
    .replace(/^200m$/i, '200 Meters')
    .replace(/^100m$/i, '100 Meters')
    .replace('100 Meter Hurdles', '100m Hurdles')
    .replace('110 Meter Hurdles', '110m Hurdles');

  const eventStds = standards[normalizedEvent] || standards[metricName];
  if (eventStds) {
    const val = convertMarkToNumber(metricValue, !!eventStds.isField);
    let score = 5;
    if (eventStds.isField) {
      if (val >= eventStds.t1) score = 95 + Math.min(4, ((val - eventStds.t1) / (eventStds.t1 * 0.05)) * 4);
      else if (val >= eventStds.t2) score = 85 + ((val - eventStds.t2) / (eventStds.t1 - eventStds.t2)) * 10;
      else if (val >= eventStds.t3) score = 75 + ((val - eventStds.t3) / (eventStds.t2 - eventStds.t3)) * 10;
      else if (val >= eventStds.t4) score = 65 + ((val - eventStds.t4) / (eventStds.t3 - eventStds.t4)) * 10;
      else if (val >= eventStds.t5) score = 55 + ((val - eventStds.t5) / (eventStds.t4 - eventStds.t5)) * 10;
      else if (val >= eventStds.t6) score = 40 + ((val - eventStds.t6) / (eventStds.t5 - eventStds.t6)) * 14;
      else if (val >= eventStds.t7) score = 20 + ((val - eventStds.t7) / (eventStds.t6 - eventStds.t7)) * 19;
    } else {
      if (val <= eventStds.t1) score = 95 + Math.min(4, ((eventStds.t1 - val) / (eventStds.t1 * 0.05)) * 4);
      else if (val <= eventStds.t2) score = 85 + ((eventStds.t2 - val) / (eventStds.t2 - eventStds.t1)) * 10;
      else if (val <= eventStds.t3) score = 75 + ((eventStds.t3 - val) / (eventStds.t3 - eventStds.t2)) * 10;
      else if (val <= eventStds.t4) score = 65 + ((eventStds.t4 - val) / (eventStds.t4 - eventStds.t3)) * 10;
      else if (val <= eventStds.t5) score = 55 + ((eventStds.t5 - val) / (eventStds.t5 - eventStds.t4)) * 10;
      else if (val <= eventStds.t6) score = 40 + ((eventStds.t6 - val) / (eventStds.t6 - eventStds.t5)) * 14;
      else if (val <= eventStds.t7) score = 20 + ((eventStds.t7 - val) / (eventStds.t7 - eventStds.t6)) * 19;
    }
    return Math.min(99, Math.max(5, Math.round(score)));
  }

  return 50;
};

const getSortedBestMetrics = (
  rawMetrics: any[],
  gender: string,
  sportName: string,
  levelOfPlay: string
): { name: string; value: string; score: number }[] => {
  if (!Array.isArray(rawMetrics) || rawMetrics.length === 0) return [];

  const scored = rawMetrics
    .map((m: any) => {
      const name = String(m.name || m.event || '').trim();
      const value = String(m.value || m.mark || '').trim();
      if (!name || !value) return null;
      const score = scoreSingleMetric(gender, sportName, name, value, levelOfPlay);
      return { name, value, score };
    })
    .filter(Boolean) as { name: string; value: string; score: number }[];

  return scored.sort((a, b) => b.score - a.score);
};

// Interleave athletes by equippedCard theme so the showcase cycles through varied card designs
const diversifyAthletesByTheme = (athletes: FeaturedAthleteItem[]): FeaturedAthleteItem[] => {
  const buckets: Record<string, FeaturedAthleteItem[]> = {};
  for (const ath of athletes) {
    const key = ath.equippedCard || 'obsidian';
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(ath);
  }

  const keys = Object.keys(buckets);
  const result: FeaturedAthleteItem[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const k of keys) {
      if (buckets[k].length > 0) {
        result.push(buckets[k].shift()!);
        added = true;
      }
    }
  }
  return result;
};

// 🚨 EXTENDED MOCK DATA FOR AUTO-SCROLLING CAROUSEL 🚨
const FEATURED_COLLEGES: FeaturedCollegeItem[] = [
  { id: 1, name: 'University of Miami', location: 'Coral Gables, FL', division: 'NCAA D1', budget: '$127.9M', salary: '$134,500', color: 'from-orange-500 to-emerald-600', backStats: { recruitScore: 92, acceptanceRate: '19%', gradRate: '83%' } },
  { id: 2, name: 'University of Notre Dame', location: 'Notre Dame, IN', division: 'NCAA D1', budget: '$139.3M', salary: '$152,000', color: 'from-blue-800 to-amber-500', backStats: { recruitScore: 88, acceptanceRate: '13%', gradRate: '97%' } },
  { id: 3, name: 'Stanford University', location: 'Stanford, CA', division: 'NCAA D1', budget: '$142.5M', salary: '$175,000', color: 'from-red-800 to-red-600', backStats: { recruitScore: 96, acceptanceRate: '4%', gradRate: '95%' } },
  { id: 4, name: 'University of Oregon', location: 'Eugene, OR', division: 'NCAA D1', budget: '$135.2M', salary: '$128,000', color: 'from-green-600 to-yellow-400', backStats: { recruitScore: 94, acceptanceRate: '83%', gradRate: '74%' } },
  { id: 5, name: 'Harvey Mudd College', location: 'Claremont, CA', division: 'NCAA D3', budget: '$3.1M', salary: '$168,000', color: 'from-slate-800 to-amber-500', backStats: { recruitScore: 74, acceptanceRate: '13%', gradRate: '93%' } },
];

const FALLBACK_ATHLETES: FeaturedAthleteItem[] = [
  {
    id: '1',
    firstName: 'Chase',
    lastName: 'Fulleton',
    highSchool: 'South Albany HS',
    state: 'OR',
    gradYear: 2027,
    gender: 'Boys',
    initials: 'CF',
    color: 'from-blue-600 to-indigo-600',
    equippedCard: 'hype',
    equippedBorder: 'gold',
    isVerified: true,
    isPro: true,
    sportName: 'Cross Country',
    levelOfPlay: 'Varsity',
    fitScore: 88,
    gpa: '4.0',
    metrics: [{ name: '5,000 Meters', value: '16:36', score: 88 }],
  },
];

const ATHLETE_GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-purple-600 to-fuchsia-600',
];

const PORTFOLIO_CARD_STYLES: Record<string, string> = {
  obsidian: 'holo-card-obsidian border-slate-500/50 shadow-[0_0_40px_rgba(71,85,105,0.25)]',
  crimson: 'holo-card-crimson border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.25)]',
  sapphire: 'holo-card-sapphire border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.25)]',
  hype: 'holo-card-hype border-indigo-400/50 shadow-[0_0_40px_rgba(99,102,241,0.3)]',
  premium: 'holo-card-premium border-amber-400/50 shadow-[0_0_40px_rgba(245,158,11,0.3)]',
  amethyst: 'holo-card-amethyst border-fuchsia-500/50 shadow-[0_0_40px_rgba(217,70,239,0.3)]',
  cyber: 'holo-card-cyber border-cyan-400/50 shadow-[0_0_40px_rgba(6,182,212,0.3)]',
  'mythic-flare': 'holo-card-mythic-flare border-rose-500/50 shadow-[0_0_45px_rgba(244,63,94,0.35)]',
};

// ============================================================================
// 🚨 COMPACT 3D CARD COMPONENT
// ============================================================================
function FlippingCard({ college }: { college: FeaturedCollegeItem }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const secondaryStatValue = college.backStats.gradRate || college.backStats.acceptanceRate || '85%';
  const secondaryStatLabel = college.backStats.gradRate ? 'Grad Rate' : 'Accept Rate';

  return (
    <div
      className="perspective-1000 w-[180px] sm:w-[280px] shrink-0 cursor-pointer group/card"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`relative w-full h-[280px] sm:h-[400px] transition-transform duration-700 transform-style-3d group-hover/card:scale-[1.02] ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* === CARD FRONT === */}
        <div className="absolute inset-0 backface-hidden bg-slate-900/90 backdrop-blur-sm rounded-[1.5rem] sm:rounded-[2rem] border border-slate-700 shadow-[0_0_20px_rgba(0,0,0,0.5)] p-4 sm:p-6 flex flex-col overflow-hidden transition-all duration-300 group-hover/card:border-blue-500/50">
          <div className={`absolute top-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-br ${college.color} opacity-30 blur-2xl`}></div>
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="bg-slate-800/80 border border-slate-700 w-fit px-2 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg mb-3 sm:mb-4 flex items-center gap-1 sm:gap-1.5 backdrop-blur-md">
              <Activity className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-blue-400" />
              <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-slate-300">Athletic Dept</span>
            </div>

            <h3 className="text-lg sm:text-3xl font-black text-white tracking-tight leading-tight mb-2 sm:mb-3 line-clamp-2">
              {college.name}
            </h3>

            <div className="space-y-1 sm:space-y-2 mb-auto">
              <p className="flex items-center text-[9px] sm:text-sm font-bold text-slate-400 truncate">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 opacity-70 shrink-0" /> <span className="truncate">{college.location}</span>
              </p>
              <p className="flex items-center text-[9px] sm:text-sm font-bold text-slate-400">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 opacity-70 shrink-0" /> {college.division}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 mt-3 sm:mt-6 shadow-inner">
              <span className="block text-[7px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5 sm:mb-1">Total Budget</span>
              <span className="text-lg sm:text-3xl font-black text-white tracking-tight">{college.budget}</span>
            </div>

            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2 text-[8px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-widest group-hover/card:text-blue-300 transition-colors">
              Tap for Match Stats <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </div>
        </div>

        {/* === CARD BACK === */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-800/90 backdrop-blur-sm rounded-[1.5rem] sm:rounded-[2rem] border border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.25)] p-4 sm:p-6 flex flex-col overflow-hidden transition-all duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
          <div className="relative z-10 h-full flex flex-col">
            <h4 className="text-[11px] sm:text-lg font-black text-white border-b border-slate-700 pb-2 sm:pb-4 mb-3 sm:mb-4 flex items-center justify-between">
              College Data <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-400" />
            </h4>

            <div className="mb-3 sm:mb-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-lg sm:rounded-xl p-3 sm:p-5 flex items-center justify-between shadow-inner">
                <div>
                  <Target className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400 mb-1 sm:mb-2" />
                  <span className="block text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Recruit Score</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl sm:text-4xl font-black text-white">{college.backStats.recruitScore}</span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500">/99</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-auto">
              <div className="bg-slate-900/80 border border-slate-700 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center shadow-inner">
                <DollarSign className="w-3 h-3 sm:w-5 sm:h-5 text-emerald-400 mx-auto mb-1 sm:mb-2" />
                <span className="block text-[7px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">10-Yr Salary</span>
                <span className="text-[11px] sm:text-lg font-black text-white">{college.salary}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-700 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center shadow-inner">
                <GraduationCap className="w-3 h-3 sm:w-5 sm:h-5 text-purple-400 mx-auto mb-1 sm:mb-2" />
                <span className="block text-[7px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{secondaryStatLabel}</span>
                <span className="text-[11px] sm:text-lg font-black text-white">{secondaryStatValue}</span>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg sm:rounded-xl p-2.5 sm:p-4 flex items-center justify-center gap-2">
              <LockOpen className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              <span className="text-[9px] sm:text-xs font-black text-blue-300 uppercase tracking-widest">Verified Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 🚨 MAIN LANDING PAGE CLIENT COMPONENT
// ============================================================================
export default function LandingClient({
  initialColleges = FEATURED_COLLEGES,
  initialAthletes = FALLBACK_ATHLETES,
}: LandingClientProps) {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [isRedirectingAuth, setIsRedirectingAuth] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Portfolio & College State (Hydrated with SSR props or fallbacks)
  const collegesToDisplay = initialColleges && initialColleges.length > 0 ? initialColleges : FEATURED_COLLEGES;
  const [topAthletes, setTopAthletes] = useState<FeaturedAthleteItem[]>(
    initialAthletes && initialAthletes.length > 0 ? initialAthletes : FALLBACK_ATHLETES
  );
  const [activeAthleteIdx, setActiveAthleteIdx] = useState(0);
  const [isPortfolioPaused, setIsPortfolioPaused] = useState(false);

  // GEO Standards Matrix State
  const [matrixGender, setMatrixGender] = useState<'Boys' | 'Girls'>('Boys');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // ==========================================================================
  // 🚨 MULTI-STEP REVEAL PROCESS STATE
  // ==========================================================================
  type HookStep = 'carousel' | 'grid' | 'editor' | 'results';
  const [hookStep, setHookStep] = useState<HookStep>('carousel');

  // Sport Grid State
  const [gridSportSearch, setGridSportSearch] = useState('');

  // Editor Inputs
  const [gender, setGender] = useState<'Boys' | 'Girls'>('Boys');
  const [selectedSport, setSelectedSport] = useState<string>('');

  // Track & Field specific inputs
  const [eventSearch, setEventSearch] = useState<string>('100 Meters');
  const [selectedEvent, setSelectedEvent] = useState<string>('100 Meters');
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const eventDropdownRef = useRef<HTMLDivElement>(null);
  const [mark, setMark] = useState<string>('');

  // Registry sport data store
  const [localSportStats, setLocalSportStats] = useState<any>({ metrics: [], metaContext: {}, level: '', position: '' });

  // Calculation Results
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFieldEvent = FIELD_EVENTS.includes(selectedEvent);
  const placeholderText = isFieldEvent
    ? 'e.g. 45\' 2"'
    : selectedEvent.includes('1500') || selectedEvent.includes('1600') || selectedEvent.includes('800') || selectedEvent.includes('3200')
    ? 'e.g. 4:15.50'
    : 'e.g. 10.84';

  const filteredEvents = ALL_EVENTS.filter((e) => e.toLowerCase().includes(eventSearch.toLowerCase()));
  const filteredGridSports = ALL_SPORTS.filter((s) => s.toLowerCase().includes(gridSportSearch.toLowerCase()));

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Universal Click-Outside Handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(e.target as Node)) {
        setIsEventDropdownOpen(false);
        if (!ALL_EVENTS.includes(eventSearch)) setEventSearch(selectedEvent);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [eventSearch, selectedEvent]);

  // UI CLEANUP: Mask Internal Registry Artifacts inside the Division Checker block
  useEffect(() => {
    if (hookStep !== 'editor' && hookStep !== 'results') return;

    const hideSpoilers = () => {
      const wrapper = document.querySelector('.public-registry-wrapper');
      if (!wrapper) return;

      const buttons = Array.from(wrapper.querySelectorAll('button'));
      buttons.forEach((btn) => {
        const text = (btn.innerText || btn.textContent || '').toUpperCase();
        if (text.includes('SAVE') || text.includes('ACCOLADE')) {
          btn.style.display = 'none';
        }
      });

      const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT, null);
      let node;
      while ((node = walker.nextNode())) {
        const txt = (node.nodeValue || '').trim().toUpperCase();
        if (
          txt === 'SEASON ACCOLADES & IMPACT' ||
          txt.includes('NORMALIZATION LOG TRACE') ||
          txt.includes('RECRUITMENT RATING')
        ) {
          let parent = node.parentElement;
          while (parent && parent !== wrapper) {
            const cls = parent.className || '';
            if (typeof cls === 'string' && (cls.includes('bg-slate-950') || cls.includes('bg-slate-900') || cls.includes('bg-slate-800'))) {
              parent.style.display = 'none';
              break;
            }
            parent = parent.parentElement;
          }
        }
      }
    };

    hideSpoilers();
    const observer = new MutationObserver(hideSpoilers);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [selectedSport, hookStep]);

  // Client-side fallback auth check & Equipped-Card Athletes Hydration using .select('*')
  useEffect(() => {
    async function initializePage() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsRedirectingAuth(true);
        router.replace('/dashboard');
        return;
      }

      try {
        // 1. Fetch athletes using .select('*') so missing columns never throw a 400 error
        const { data: athData } = await supabase
          .from('athletes')
          .select('*')
          .not('first_name', 'is', null)
          .limit(60);

        if (!athData || athData.length === 0) return;

        // Filter in JS to only keep athletes who have equipped a background card
        const equippedAthletes = athData.filter((a: any) => {
          const card = String(a.equipped_card || '').trim().toLowerCase();
          return card !== '' && card !== 'base' && card !== 'default' && card !== 'none';
        });

        if (equippedAthletes.length === 0) return;

        const athleteIds = equippedAthletes.map((a: any) => a.id);

        // 2. Strictly fetch ONLY active sports (is_active = true)
        const { data: sportsData } = await supabase
          .from('athlete_sports')
          .select('*')
          .in('athlete_id', athleteIds)
          .eq('is_active', true);

        const sportsByAthleteId: Record<string, any[]> = {};
        if (sportsData && Array.isArray(sportsData)) {
          for (const s of sportsData) {
            if (s.is_active !== true) continue;
            if (!sportsByAthleteId[s.athlete_id]) {
              sportsByAthleteId[s.athlete_id] = [];
            }
            sportsByAthleteId[s.athlete_id].push(s);
          }
        }

        const formattedEquipped: FeaturedAthleteItem[] = [];

        equippedAthletes.forEach((a: any, idx: number) => {
          const athleteGender = a.gender || 'Boys';

          // Strictly respect the athlete's enabled `sports` array so disabled sports are never used
          const enabledSportNames: string[] | null =
            Array.isArray(a.sports) && a.sports.length > 0 ? a.sports : null;

          const candidateSports = (sportsByAthleteId[a.id] || []).filter((sp: any) => {
            if (sp.is_active !== true) return false;
            if (enabledSportNames && !enabledSportNames.includes(sp.sport_name)) return false;
            return true;
          });

          let chosenSportName = (enabledSportNames && enabledSportNames[0]) || 'Track & Field';
          let chosenLevel = 'Varsity';
          let chosenFitScore = 0;
          let bestMetrics: { name: string; value: string; score: number }[] = [];

          // Evaluate all active, enabled sports in the registry and pick the sport with their best stat
          if (candidateSports.length > 0) {
            for (const sp of candidateSports) {
              const sName = sp.sport_name || 'Track & Field';
              const sLevel = sp.level_of_play || 'Varsity';
              const evaluated = getSortedBestMetrics(sp.metrics || [], athleteGender, sName, sLevel);
              const topScore = evaluated[0]?.score || Number(sp.custom_fit_score) || 0;

              if (evaluated.length > 0 && (bestMetrics.length === 0 || topScore > chosenFitScore)) {
                chosenSportName = sName;
                chosenLevel = sLevel;
                chosenFitScore = topScore;
                bestMetrics = evaluated;
              }
            }
          }

          // Only feature athletes on the front page who have at least 1 active stat
          if (bestMetrics.length === 0) return;

          let parsedGpa: string | null = null;
          if (a.saved_resume) {
            try {
              const parsed = JSON.parse(a.saved_resume);
              if (parsed?.gpa) parsedGpa = String(parsed.gpa);
            } catch (e) {}
          }

          const rawGradYear = Number(a.grad_year);
          const validGradYear = !isNaN(rawGradYear) && rawGradYear >= 2020 && rawGradYear <= 2035 ? rawGradYear : null;

          formattedEquipped.push({
            id: a.id,
            customSlug: a.custom_slug || null,
            firstName: a.first_name || 'Verified',
            lastName: a.last_name || 'Athlete',
            highSchool: a.high_school || 'Varsity Athletics',
            state: a.state || 'US',
            gradYear: validGradYear,
            gender: athleteGender,
            initials: `${(a.first_name || 'V')[0]}${(a.last_name || 'A')[0]}`.toUpperCase(),
            color: ATHLETE_GRADIENTS[idx % ATHLETE_GRADIENTS.length],
            avatarUrl: a.avatar_url || null,
            equippedCard: String(a.equipped_card).trim().toLowerCase(),
            equippedBorder: a.equipped_border || null,
            isVerified: Number(a.trust_level) > 0,
            isPro: Boolean(a.is_premium),
            sportName: chosenSportName,
            levelOfPlay: chosenLevel,
            fitScore: chosenFitScore,
            gpa: parsedGpa,
            metrics: bestMetrics.slice(0, 1), // Strictly keep #1 Best Stat
          });
        });

        if (formattedEquipped.length > 0) {
          const sortedByScore = formattedEquipped.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
          const variedList = diversifyAthletesByTheme(sortedByScore);
          setTopAthletes(variedList);
          setActiveAthleteIdx(0);
        }
      } catch (err) {
        console.error('Failed to load live equipped-card athletes, using SSR/fallback data.');
      }
    }
    initializePage();
  }, [router, supabase]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // DYNAMIC PORTFOLIO CYCLER (Pauses when user hovers to inspect)
  useEffect(() => {
    if (!topAthletes || topAthletes.length <= 1 || isPortfolioPaused) return;
    const intervalId = setInterval(() => {
      setActiveAthleteIdx((prev) => (prev + 1) % topAthletes.length);
    }, 4500);
    return () => clearInterval(intervalId);
  }, [topAthletes, isPortfolioPaused]);

  // ==========================================================================
  // 🚨 CALCULATOR ENGINE ROUTING (Migrated from DivisionChecker)
  // ==========================================================================

  const handleSelectEvent = (ev: string) => {
    setEventSearch(ev);
    setSelectedEvent(ev);
    setIsEventDropdownOpen(false);
    setMark('');
    setResult(null);
  };

  const finalizeCalculation = (rating: number, extraData: Partial<CalculationResult>) => {
    rating = Math.min(99, Math.max(15, Math.round(rating)));
    const tierStyles = getTierStyles(rating);

    let label = 'JV Standard';
    let desc = 'Keep working hard in practice to hit the Varsity standard!';
    if (rating >= 95) {
      label = 'Power 4 D1 Recruit';
      desc = 'You are hitting priority marks for top-tier D1 programs.';
    } else if (rating >= 85) {
      label = 'Mid-Major D1 Recruit';
      desc = 'You are hitting scholarship-level marks for D1 and elite D2 programs.';
    } else if (rating >= 75) {
      label = 'D1 Walk-On / Top D2';
      desc = 'You have a highly competitive profile for D2 scholarships or D1 walk-on spots.';
    } else if (rating >= 65) {
      label = 'Solid D2 / High D3';
      desc = 'You are a priority recruit for strong D2 and D3 programs.';
    } else if (rating >= 55) {
      label = 'D3 / NAIA Prospect';
      desc = 'You have solid next-level potential for D3 or NAIA programs.';
    } else if (rating >= 40) {
      label = 'Strong Varsity';
      desc = 'You are a great high school competitor. A bit more work and you are college bound.';
    }

    setResult({
      ...extraData,
      score: rating,
      label,
      desc,
      color: tierStyles.colorClass,
      bg: tierStyles.bgClass,
      border: tierStyles.borderClass,
    } as CalculationResult);

    setIsCalculating(false);
    setHookStep('results');
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedSport === 'Track & Field') {
      if (!ALL_EVENTS.includes(selectedEvent)) return setError('Please select a valid event.');
      if (!mark.trim()) return setError('Please enter a valid personal record.');
    }

    setIsCalculating(true);
    setResult(null);

    if (selectedSport === 'Track & Field') {
      setTimeout(() => {
        const std = RECRUITING_STANDARDS[gender][selectedEvent];
        if (!std) {
          setError('Event standards not found.');
          setIsCalculating(false);
          return;
        }

        const val = convertMarkToNumber(mark, !!std.isField);
        let currentTier = 'JV Standard';
        let nextTier = 'Varsity';
        let targetMarkNum = std.t7;
        let delta = 0;
        let rating = 50;

        if (std.isField) {
          if (val >= std.t1) {
            rating = 95 + Math.min(4, ((val - std.t1) / (std.t1 * 0.05)) * 4);
            currentTier = 'Power 4 D1';
            nextTier = 'Elite';
            targetMarkNum = std.t1 * 1.05;
          } else if (val >= std.t2) {
            rating = 85 + ((val - std.t2) / (std.t1 - std.t2)) * 10;
            currentTier = 'Mid-Major D1';
            nextTier = 'Power 4 D1';
            targetMarkNum = std.t1;
          } else if (val >= std.t3) {
            rating = 75 + ((val - std.t3) / (std.t2 - std.t3)) * 10;
            currentTier = 'Top D2 / Walk-on';
            nextTier = 'Mid-Major D1';
            targetMarkNum = std.t2;
          } else if (val >= std.t4) {
            rating = 65 + ((val - std.t4) / (std.t3 - std.t4)) * 10;
            currentTier = 'Solid D2 / High D3';
            nextTier = 'Top D2';
            targetMarkNum = std.t3;
          } else if (val >= std.t5) {
            rating = 55 + ((val - std.t5) / (std.t4 - std.t5)) * 10;
            currentTier = 'D3 / NAIA';
            nextTier = 'Solid D2';
            targetMarkNum = std.t4;
          } else if (val >= std.t6) {
            rating = 40 + ((val - std.t6) / (std.t5 - std.t6)) * 14;
            currentTier = 'Strong Varsity';
            nextTier = 'D3 / NAIA';
            targetMarkNum = std.t5;
          } else if (val >= std.t7) {
            rating = 20 + ((val - std.t7) / (std.t6 - std.t7)) * 19;
            currentTier = 'Varsity Standard';
            nextTier = 'Strong Varsity';
            targetMarkNum = std.t6;
          } else {
            const t8 = std.t7 * 0.85;
            if (val >= t8) {
              rating = 5 + ((val - t8) / (std.t7 - t8)) * 14;
            } else {
              rating = 5;
            }
            currentTier = 'JV Standard';
            nextTier = 'Varsity Standard';
            targetMarkNum = std.t7;
          }
          delta = targetMarkNum - val;
        } else {
          if (val <= std.t1) {
            rating = 95 + Math.min(4, ((std.t1 - val) / (std.t1 * 0.05)) * 4);
            currentTier = 'Power 4 D1';
            nextTier = 'Elite';
            targetMarkNum = std.t1 * 0.95;
          } else if (val <= std.t2) {
            rating = 85 + ((std.t2 - val) / (std.t2 - std.t1)) * 10;
            currentTier = 'Mid-Major D1';
            nextTier = 'Power 4 D1';
            targetMarkNum = std.t1;
          } else if (val <= std.t3) {
            rating = 75 + ((std.t3 - val) / (std.t3 - std.t2)) * 10;
            currentTier = 'Top D2 / Walk-on';
            nextTier = 'Mid-Major D1';
            targetMarkNum = std.t2;
          } else if (val <= std.t4) {
            rating = 65 + ((std.t4 - val) / (std.t4 - std.t3)) * 10;
            currentTier = 'Solid D2 / High D3';
            nextTier = 'Top D2';
            targetMarkNum = std.t3;
          } else if (val <= std.t5) {
            rating = 55 + ((std.t5 - val) / (std.t5 - std.t4)) * 10;
            currentTier = 'D3 / NAIA';
            nextTier = 'Solid D2';
            targetMarkNum = std.t4;
          } else if (val <= std.t6) {
            rating = 40 + ((std.t6 - val) / (std.t6 - std.t5)) * 14;
            currentTier = 'Strong Varsity';
            nextTier = 'D3 / NAIA';
            targetMarkNum = std.t5;
          } else if (val <= std.t7) {
            rating = 20 + ((std.t7 - val) / (std.t7 - std.t6)) * 19;
            currentTier = 'Varsity Standard';
            nextTier = 'Strong Varsity';
            targetMarkNum = std.t6;
          } else {
            const t8 = std.t7 * 1.15;
            if (val <= t8) {
              rating = 5 + ((t8 - val) / (t8 - std.t7)) * 14;
            } else {
              rating = 5;
            }
            currentTier = 'JV Standard';
            nextTier = 'Varsity Standard';
            targetMarkNum = std.t7;
          }
          delta = val - targetMarkNum;
        }

        finalizeCalculation(rating, {
          currentTier,
          nextTier,
          targetMarkFormatted: formatMarkFromNumber(targetMarkNum, !!std.isField),
          deltaFormatted: !!std.isField ? `+${formatMarkFromNumber(delta, true)}` : `-${delta.toFixed(2)}s`,
          isField: !!std.isField,
        });
      }, 800);
    } else {
      const wrapper = document.querySelector('.public-registry-wrapper');
      if (wrapper) {
        const buttons = Array.from(wrapper.querySelectorAll('button'));
        const saveBtn = buttons.find((b) => (b.innerText || '').includes('Save'));
        if (saveBtn) saveBtn.click();
      }

      setTimeout(() => {
        let finalScore = 0;
        if (wrapper) {
          const text = wrapper.textContent || '';
          const scoreMatch = text.match(/SCORE:\s*(\d{1,2})\s*\/\s*99/i);
          const ratingMatch = text.match(/RECRUITMENT\s*RATING[\s\S]*?\b(\d{2})\b/i);

          if (scoreMatch && scoreMatch[1]) finalScore = parseInt(scoreMatch[1], 10);
          else if (ratingMatch && ratingMatch[1]) finalScore = parseInt(ratingMatch[1], 10);
        }

        if (finalScore === 0 && localSportStats.metrics && localSportStats.metrics.length > 0) {
          localSportStats.metrics.forEach((m: any) => {
            try {
              const evalResult = evaluateMetric(gender, selectedSport, m.name, m.value, localSportStats.level || 'Varsity');
              if (evalResult && evalResult.score > finalScore) finalScore = evalResult.score;
            } catch (e) {}
          });
        }

        if (finalScore === 0) finalScore = localSportStats.calculatedRating || 50;

        finalizeCalculation(finalScore, {
          currentTier: 'Dynamic Evaluator',
          nextTier: 'Next Level of Play',
        });
      }, 800);
    }
  };

  const handleContinueToSignup = () => {
    const onboardingData = {
      sport: selectedSport,
      gender: gender,
      metrics: selectedSport === 'Track & Field' ? [{ event: selectedEvent, mark: mark }] : localSportStats?.metrics || [],
      preCalculatedScore: result?.score,
    };

    localStorage.setItem('chasedSports_onboarding', JSON.stringify(onboardingData));
    router.push('/onboarding/stats');
  };

  // Multiply ALL_SPORTS to create a seamless infinite marquee effect
  const marqueeSports = [...ALL_SPORTS, ...ALL_SPORTS, ...ALL_SPORTS, ...ALL_SPORTS];

  const activeAthlete = topAthletes[activeAthleteIdx] || topAthletes[0] || FALLBACK_ATHLETES[0];

  // Pick the single #1 Best Stat via the Sports Registry
  const topBestMetric = React.useMemo(() => {
    const raw = activeAthlete?.metrics || [];
    const sorted = getSortedBestMetrics(
      raw,
      activeAthlete?.gender || 'Boys',
      activeAthlete?.sportName || 'Track & Field',
      activeAthlete?.levelOfPlay || 'Varsity'
    );
    return sorted[0] || raw[0] || null;
  }, [activeAthlete]);

  if (isRedirectingAuth) {
    return <div className="min-h-screen bg-[#020617]" />;
  }

  return (
    <main
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#020617] font-sans selection:bg-blue-500/30 overflow-x-hidden relative pb-16 sm:pb-24 text-slate-200 animate-fade-in-up"
    >
      {/* 🚨 PARALLAX SPORTS TRACK LINES BACKGROUND 🚨 */}
      <div
        className="fixed inset-0 pointer-events-none opacity-10 z-0 flex justify-center overflow-hidden transition-transform ease-out duration-75"
        style={{ transform: `translateY(${scrollY * -0.15}px)` }}
      >
        <div className="w-[2px] h-[300vh] bg-gradient-to-b from-blue-500/0 via-blue-500 to-blue-500/0 transform rotate-[15deg] -ml-[20vw]"></div>
        <div className="w-[4px] h-[300vh] bg-gradient-to-b from-cyan-500/0 via-cyan-400 to-cyan-500/0 transform rotate-[15deg] ml-[5vw] blur-[1px]"></div>
        <div className="w-[1px] h-[300vh] bg-gradient-to-b from-purple-500/0 via-purple-500 to-purple-500/0 transform rotate-[15deg] ml-[20vw]"></div>
      </div>

      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 hidden md:block opacity-50"
        style={{ background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(56, 189, 248, 0.06), transparent 40%)` }}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes text-pulse { 
          0%, 100% { filter: drop-shadow(0 0 15px rgba(56,189,248,0.3)); transform: scale(1); } 
          50% { filter: drop-shadow(0 0 35px rgba(56,189,248,0.7)); transform: scale(1.02); } 
        }
        .animate-text-pulse { animation: text-pulse 3s ease-in-out infinite; display: inline-block; }

        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
        @keyframes grid-pan { 0% { transform: translateY(0); } 100% { transform: translateY(32px); } }
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerGlare { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes cyberScan { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(1000%); opacity: 0; } }
        @keyframes voidPulse { 0%, 100% { background-size: 100% 100%; filter: brightness(1); } 50% { background-size: 120% 120%; filter: brightness(1.2); } }
        
        /* 🚨 INFINITE MARQUEE CSS 🚨 */
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 0.375rem)); } 
        }
        .animate-scroll { animation: scroll 25s linear infinite; }
        
        @keyframes sport-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } 
        }
        .animate-sport-scroll { animation: sport-scroll 40s linear infinite; }

        /* TECHY BACKGROUND ANIMATIONS */
        @keyframes blob-spin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .animate-blob-spin { animation: blob-spin 20s infinite linear; }
        .bg-grid-pattern { background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 32px 32px; }
        
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }

        /* HOLO PORTFOLIO CARD SHADERS (MATCHING ATHLETECLIENT.TSX) */
        .holo-card-obsidian { background: linear-gradient(135deg, #0f172a 0%, #334155 25%, #000000 50%, #0f172a 75%, #1e293b 100%); background-size: 300% 300%; animation: foilShift 15s ease-in-out infinite; }
        .holo-card-crimson { background: linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #450a0a 100%); background-size: 300% 300%; animation: foilShift 15s ease-in-out infinite; }
        .holo-card-sapphire { background: linear-gradient(135deg, #172554 0%, #0ea5e9 50%, #172554 100%); background-size: 300% 300%; animation: foilShift 15s ease-in-out infinite; }
        .holo-card-hype {
          background:
            linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent 100%),
            linear-gradient(135deg, #4f46e5 0%, #9333ea 25%, #ec4899 50%, #3b82f6 75%, #4f46e5 100%);
          background-size: 40px 40px, 300% 300%;
          animation: foilShift 15s ease-in-out infinite;
        }
        .holo-card-premium {
          background:
            repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px),
            linear-gradient(135deg, #b45309 0%, #f59e0b 25%, #fef08a 50%, #d97706 75%, #78350f 100%);
          background-size: 100% 100%, 300% 300%;
          animation: foilShift 15s ease-in-out infinite;
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
        .holo-glare { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.35) 25%, transparent 30%); background-size: 200% auto; animation: shimmerGlare 8s infinite linear; pointer-events: none; z-index: 10; mix-blend-mode: overlay; }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 10px; }
      `,
        }}
      />

      {/* ========================================================= */}
      {/* 🚀 HERO SECTION WITH MULTI-STEP REVEAL DIVISION TRACKER   */}
      {/* ========================================================= */}
      <section aria-label="High School Recruiting Score Calculator" className="relative pt-12 sm:pt-20 pb-16 lg:pt-24 lg:pb-24 px-5 sm:px-6 overflow-hidden min-h-[820px] flex flex-col justify-start">
        <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,black_20%,transparent_80%)] -z-20">
          <div className="absolute inset-0 bg-grid-pattern animate-[grid-pan_3s_linear_infinite]"></div>
        </div>

        {/* TECHY BACKGROUND ORBS */}
        <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[800px] h-[300px] sm:h-[800px] bg-cyan-600 rounded-full mix-blend-screen filter blur-[120px] sm:blur-[160px] opacity-15 animate-blob-spin pointer-events-none -z-10"></div>
        <div className="absolute top-0 right-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-blue-700 rounded-full mix-blend-screen filter blur-[100px] sm:blur-[140px] opacity-20 animate-blob-spin pointer-events-none -z-10" style={{ animationDirection: 'reverse', animationDuration: '25s' }}></div>
        <div className="absolute top-1/3 left-1/2 w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] bg-purple-700 rounded-full mix-blend-screen filter blur-[120px] sm:blur-[150px] opacity-15 animate-blob-spin pointer-events-none -z-10" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6 sm:space-y-8 mt-4 mb-10">
          <div className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 text-blue-400 text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-300 cursor-default">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> The New Standard in High School Athletic Recruiting • 19 Sports
          </div>

          <h1 className="text-[3.5rem] leading-[1.05] sm:text-6xl md:text-8xl lg:text-[7.5rem] font-black tracking-tighter text-white drop-shadow-2xl">
            Find <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 animate-text-pulse">YOUR</span> college.
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed px-2 transition-opacity">
            The operating system for high school athletes across <strong className="text-slate-200 font-bold">19 sports</strong>. Calculate your <strong className="text-slate-200 font-bold">0–99 Recruit Score</strong>, build your official <strong className="text-slate-200 font-bold">Athletic Portfolio</strong>, and match with <strong className="text-slate-200 font-bold">1,500+ NCAA D1, D2, D3, &amp; NAIA</strong> programs.
          </p>
        </div>

        {/* 🚨 DYNAMIC ONBOARDING HOOK REVEAL STEPS 🚨 */}
        <div className="w-full relative z-20 flex-1 flex flex-col justify-start">
          {/* ============================================== */}
          {/* STEP 1: CTA + 19-SPORT CAROUSEL HOOK           */}
          {/* ============================================== */}
          {hookStep === 'carousel' && (
            <div className="w-full relative animate-in fade-in zoom-in-95 duration-500 py-8 flex flex-col items-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pointer-events-auto mb-12 relative z-10">
                <button
                  type="button"
                  onClick={() => setHookStep('grid')}
                  className="px-10 py-5 bg-blue-600 rounded-full text-white font-black text-lg tracking-wide shadow-[0_0_40px_rgba(37,99,235,0.6)] hover:shadow-[0_0_60px_rgba(37,99,235,0.8)] hover:scale-105 active:scale-95 border border-blue-400/30 transition-all duration-300 group flex items-center gap-3 cursor-pointer"
                >
                  Select Your Sport <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <Link
                  href="/search"
                  className="px-8 py-5 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-xl rounded-full text-slate-200 font-black text-base tracking-wide border border-slate-700/80 hover:border-slate-500 transition-all duration-300 flex items-center gap-2"
                >
                  Browse 1,500+ Colleges
                </Link>
              </div>

              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4">
                Tap any of the 19 supported sports below to test your stats
              </p>

              <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                <div className="flex w-max gap-4 animate-sport-scroll hover:[animation-play-state:paused]">
                  {marqueeSports.map((sport, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedSport(sport);
                        setHookStep('editor');
                      }}
                      className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/40 text-slate-300 hover:text-white font-bold whitespace-nowrap backdrop-blur-md shadow-sm transition-all cursor-pointer flex items-center gap-2.5"
                    >
                      {getSportIcon(sport, `w-4 h-4 ${getSportTheme(sport).colorClass}`)}
                      {sport}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================== */}
          {/* STEP 2: 1-CLICK SPORT SELECTION GRID           */}
          {/* ============================================== */}
          {hookStep === 'grid' && (
            <div className="w-full max-w-3xl mx-auto bg-[#0a0f1e]/90 backdrop-blur-2xl border border-slate-700/60 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.6)] animate-in slide-in-from-top-12 fade-in duration-500 ease-out flex flex-col relative overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setHookStep('carousel');
                  setSelectedSport('');
                }}
                className="absolute top-8 left-8 text-slate-400 hover:text-white transition-colors z-30 flex items-center gap-1 text-xs font-black uppercase tracking-wider cursor-pointer"
                aria-label="Back to carousel"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-2 relative z-20">Select Your Sport</h2>
              <p className="text-xs sm:text-sm font-bold text-slate-400 text-center mb-6 relative z-20">
                Choose from 19 custom recruiting engines to calculate your 0–99 score
              </p>

              {/* Dynamic Grid Search Filter */}
              <div className="relative z-20 mb-6 w-full max-w-md mx-auto">
                <input
                  type="search"
                  placeholder="Search 19 sports..."
                  value={gridSportSearch}
                  onChange={(e) => setGridSportSearch(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 focus:border-blue-500 rounded-2xl pl-10 pr-4 py-3 text-slate-200 text-sm font-bold placeholder:text-slate-500 transition-all outline-none"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>

              {/* 1-Click Direct-to-Editor Sport Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-h-[420px] overflow-y-auto custom-scrollbar pr-2 relative z-20">
                {filteredGridSports.map((sport, idx) => {
                  const theme = getSportTheme(sport);
                  return (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => {
                        setSelectedSport(sport);
                        setResult(null);
                        setError(null);
                        setHookStep('editor');
                      }}
                      className="group relative overflow-hidden h-24 sm:h-28 rounded-[1.25rem] font-black text-sm sm:text-base transition-all border border-slate-700/80 hover:border-blue-400 hover:scale-[1.02] text-white text-center flex flex-col items-center justify-center gap-1.5 animate-in slide-in-from-bottom-4 fade-in duration-300 cursor-pointer shadow-md"
                      style={{ animationDelay: `${idx * 25}ms`, animationFillMode: 'both' }}
                    >
                      <Image
                        src={theme.image}
                        alt={`${sport} College Recruiting Standards`}
                        fill
                        className="object-cover absolute inset-0 z-0 grayscale-[40%] opacity-40 transition-all duration-300 group-hover:opacity-65 group-hover:grayscale-0 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 z-0 transition-all duration-300 bg-[#0f172a]/70 group-hover:bg-[#0f172a]/40"></div>
                      <div className="relative z-10 w-8 h-8 rounded-full bg-black/50 border border-white/15 flex items-center justify-center backdrop-blur-md">
                        {getSportIcon(sport, `w-4 h-4 ${theme.colorClass}`)}
                      </div>
                      <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-2 leading-tight">{sport}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================== */}
          {/* STEP 3: THE PERFORMANCE EDITOR                 */}
          {/* ============================================== */}
          {hookStep === 'editor' && (
            <div className="w-full max-w-3xl mx-auto bg-slate-900/70 backdrop-blur-2xl border border-slate-700/60 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.6)] p-6 sm:p-10 transition-all animate-in fade-in slide-in-from-bottom-8 duration-500 relative">
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setHookStep('grid');
                    setResult(null);
                    setIsCalculating(false);
                  }}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs sm:text-sm font-black uppercase tracking-wider cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" /> All 19 Sports
                </button>

                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Step 2 of 2 • Instant Evaluation
                </span>
              </div>

              <div className="text-center mb-6 flex flex-col items-center">
                <div
                  className={`inline-flex items-center gap-2 ${getSportTheme(selectedSport).bgClass} border border-white/10 ${
                    getSportTheme(selectedSport).colorClass
                  } px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-3 shadow-sm`}
                >
                  {getSportIcon(selectedSport, 'w-3.5 h-3.5')} {selectedSport}
                </div>
                <h2 className="text-3xl font-black text-white">Enter Your Stats</h2>
              </div>

              {/* Quick Sport Switcher Bar */}
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-3 mb-6">
                {ALL_SPORTS.map((sp) => {
                  const active = sp === selectedSport;
                  return (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => {
                        setSelectedSport(sp);
                        setResult(null);
                        setError(null);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all shrink-0 cursor-pointer border ${
                        active
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                          : 'bg-slate-800/70 text-slate-400 hover:text-white border-slate-700'
                      }`}
                    >
                      {sp}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleCalculate} className="space-y-6 sm:space-y-8">
                {/* Gender Toggle */}
                <div className="w-full">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 mb-2 block">Athletic Division</label>
                  <div className="bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl flex relative w-full shadow-inner border border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => {
                        setGender('Boys');
                        setResult(null);
                      }}
                      className={`flex-1 py-3.5 text-sm font-black rounded-xl transition-all duration-300 z-10 cursor-pointer ${
                        gender === 'Boys' ? 'bg-slate-700 shadow-md text-blue-400 border border-blue-500/30' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Boys
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGender('Girls');
                        setResult(null);
                      }}
                      className={`flex-1 py-3.5 text-sm font-black rounded-xl transition-all duration-300 z-10 cursor-pointer ${
                        gender === 'Girls' ? 'bg-slate-700 shadow-md text-fuchsia-400 border border-fuchsia-500/30' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Girls
                    </button>
                  </div>
                </div>

                {/* Dynamic Editor Registry Wrapper */}
                <div className="bg-slate-950/40 rounded-[2rem] p-4 sm:p-6 shadow-inner border border-slate-700/50 transition-all public-registry-wrapper relative">
                  {selectedSport === 'Track & Field' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 animate-in fade-in duration-300">
                      <div className="space-y-2 relative" ref={eventDropdownRef}>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Select Event</label>
                        <div className="relative group">
                          <input
                            type="text"
                            value={eventSearch}
                            onChange={(e) => {
                              setEventSearch(e.target.value);
                              setIsEventDropdownOpen(true);
                              setResult(null);
                            }}
                            onFocus={() => {
                              setEventSearch('');
                              setIsEventDropdownOpen(true);
                            }}
                            placeholder="Search event..."
                            className="w-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-2xl pl-12 pr-5 py-4 text-white font-bold text-base focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-sm transition-all placeholder:text-slate-500"
                          />
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                          <ChevronDown
                            className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-transform duration-300 ${
                              isEventDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>

                        {isEventDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                            {filteredEvents.length > 0 ? (
                              filteredEvents.map((ev) => (
                                <button
                                  key={ev}
                                  type="button"
                                  onClick={() => handleSelectEvent(ev)}
                                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors flex items-center justify-between ${
                                    selectedEvent === ev ? 'bg-blue-500/10 text-blue-400 font-black' : 'text-slate-300 font-bold hover:bg-slate-700'
                                  }`}
                                >
                                  {ev}
                                  {selectedEvent === ev && <Check className="w-4 h-4 text-blue-400" />}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-4 text-slate-500 text-sm italic text-center font-medium">No events found.</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Your Personal Record</label>
                        <div className="relative group">
                          <input
                            type="text"
                            value={mark}
                            onChange={(e) => {
                              setMark(e.target.value);
                              setResult(null);
                            }}
                            placeholder={placeholderText}
                            className="w-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-2xl pl-12 pr-5 py-4 text-white font-black text-base focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-sm transition-all placeholder:text-slate-500 tracking-wide"
                          />
                          <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in duration-300 text-slate-200">
                      {SPORT_CONFIGS_META[selectedSport] || selectedSport === 'Cross Country' ? (
                        <EditorErrorBoundary onReset={() => setLocalSportStats({ metrics: [], metaContext: {}, level: '', position: '' })}>
                          <SportEditorRegistry
                            sport={selectedSport}
                            sportStats={localSportStats}
                            genderKey={gender}
                            athleteProfile={null}
                            config={SPORT_CONFIGS_META[selectedSport]}
                            onSync={async (data) => {
                              setLocalSportStats(data);
                              setResult(null);
                              setError(null);
                            }}
                            showToast={(msg, type) => setError(type === 'error' ? msg : null)}
                          />
                        </EditorErrorBoundary>
                      ) : (
                        <div className="text-center py-6 text-slate-500 font-bold flex flex-col items-center justify-center gap-2">
                          <Activity className="w-6 h-6 text-slate-600" />
                          Please select a supported sport.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center justify-center gap-2 text-rose-400 text-sm font-bold animate-in fade-in bg-rose-500/10 py-3 px-4 rounded-xl border border-rose-500/20 shadow-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCalculating || (selectedSport !== 'Track & Field' && selectedSport !== 'Cross Country' && !SPORT_CONFIGS_META[selectedSport])}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xl sm:text-2xl rounded-2xl py-4 sm:py-5 shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:shadow-[0_0_50px_rgba(37,99,235,0.8)] border border-blue-400/30 transition-all hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100 flex items-center justify-center gap-3 mt-4 group cursor-pointer"
                >
                  {isCalculating ? (
                    <Activity className="w-6 h-6 animate-pulse" />
                  ) : (
                    <>
                      CALCULATE MY SCORE <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ============================================== */}
          {/* STEP 4: CALCULATED RESULTS                     */}
          {/* ============================================== */}
          {hookStep === 'results' && result && !isCalculating && (
            <div className="w-full max-w-5xl mx-auto animate-in slide-in-from-bottom-8 fade-in duration-500 ease-out mb-12">
              <div
                className={`w-full rounded-[2.5rem] border-2 ${result.bg} ${result.border} backdrop-blur-xl relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] flex flex-col md:flex-row group transition-all duration-500 hover:shadow-2xl bg-slate-900/60`}
              >
                {/* LEFT SIDE: SCORING & TIER */}
                <div className="p-8 sm:p-10 md:w-[55%] flex flex-col justify-center relative z-10">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none scale-150 transform translate-x-4 -translate-y-4 group-hover:scale-[1.6] group-hover:-rotate-12 transition-transform duration-700">
                    <Target className={`w-48 h-48 ${result.color}`} />
                  </div>

                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Projected Division • {selectedSport}
                  </p>
                  <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4 ${result.color} drop-shadow-sm`}>{result.label}</h2>
                  <p className="text-slate-300 font-medium text-sm sm:text-base leading-relaxed max-w-md mb-8">{result.desc}</p>

                  <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                    {/* Recruit Score Badge */}
                    <div className="bg-slate-800/80 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-slate-700/60 shadow-sm flex items-center justify-center gap-4 hover:bg-slate-800 transition-colors">
                      <div className="text-center">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Recruit Score</span>
                        <div className="flex items-end justify-center gap-0.5">
                          <span className={`text-4xl font-black leading-none ${result.color}`}>{Math.round(result.score)}</span>
                          <span className="text-xs font-bold text-slate-500 pb-1">/99</span>
                        </div>
                      </div>
                    </div>

                    {/* Next Tier Delta */}
                    {result.targetMarkFormatted && (
                      <div className="bg-slate-800/50 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-slate-700/60 shadow-sm flex flex-col justify-center">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Next Tier Goal</span>
                        <span className="text-xl font-black text-white block leading-none mb-1">{result.targetMarkFormatted}</span>
                        <span className={`text-[10px] font-bold ${result.isField ? 'text-emerald-400' : 'text-blue-400'}`}>{result.deltaFormatted} Needed</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT SIDE: FOMO ACQUISITION CTA */}
                <div className="bg-slate-950 md:w-[45%] p-8 sm:p-10 text-white relative z-10 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-800">
                  <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
                  <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="relative w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 shrink-0 shadow-inner">
                        <Database className="w-6 h-6 text-blue-400 z-10" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 mb-0.5">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div> Portfolio Ready
                        </div>
                        <p className="text-xs font-bold text-slate-400">1,500+ College Programs</p>
                      </div>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 text-white leading-tight">Save Your Score to Your Portfolio.</h3>
                    <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed text-balance">
                      Claim your free Athletic Portfolio to save these metrics, unlock the College Matchmaker, and build your shareable recruiting resume.
                    </p>

                    <button
                      type="button"
                      onClick={handleContinueToSignup}
                      className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black px-6 py-4 rounded-[1.25rem] shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-1 active:scale-[0.98] group/btn cursor-pointer"
                    >
                      Claim My Free Portfolio <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>

                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center mt-5 flex items-center justify-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> 100% Free for High School Athletes
                    </p>

                    <button
                      type="button"
                      onClick={() => setHookStep('editor')}
                      className="text-[10px] mt-4 font-bold text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors flex items-center justify-center w-full gap-1.5 cursor-pointer"
                    >
                      <RefreshCcw className="w-3 h-3" /> Edit Metrics &amp; Recalculate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 🔍 TOOL 1: THE COLLEGE FINDER (INFINITE MARQUEE)          */}
      {/* ========================================================= */}
      <section aria-label="College Finder and Athletic Scholarship Search" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <div className="group relative bg-[#0a0f1e]/80 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] border border-slate-800/80 overflow-hidden shadow-2xl transition-all duration-700 hover:shadow-[0_0_50px_rgba(56,189,248,0.1)]">
          <div
            className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block z-0"
            style={{ background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(56, 189, 248, 0.08), transparent 40%)` }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 p-6 sm:p-10 lg:p-16 xl:p-24">
            <div className="flex-1 space-y-6 sm:space-y-8 w-full max-w-xl">
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 sm:p-4 rounded-2xl sm:rounded-3xl w-fit shadow-sm">
                <Database className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">The College Finder</h2>
              <p className="text-slate-400 text-base sm:text-xl font-medium leading-relaxed">
                Filter <strong className="text-slate-200 font-bold">1,500+ collegiate programs</strong> across NCAA D1, D2, D3, and NAIA by hidden recruiting metrics. Instantly discover program operating budgets, dynamic roster Readiness Meters, and true 10-year alumni ROI.
              </p>
              <ul className="space-y-3 sm:space-y-4 pt-2 sm:pt-4 pb-4 sm:pb-8">
                {[
                  'Sort by highest athletic operating budget & average scholarship',
                  'Compare your stats with dynamic Roster Readiness Meters',
                  'Filter by Best Athletic Fit, Lowest Net Cost, and Top 10-Yr ROI',
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300 font-bold text-sm sm:text-lg">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 sm:mr-4 shrink-0 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/search"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-white hover:bg-blue-50 text-slate-900 rounded-xl sm:rounded-full font-bold text-sm sm:text-lg transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 group/btn relative z-20"
              >
                Launch College Search Tool <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </div>

            {/* 🚨 TIGHTER INFINITE MARQUEE CAROUSEL 🚨 */}
            <div className="flex-1 w-full lg:w-[600px] xl:w-[700px] overflow-hidden -mx-4 sm:mx-0 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="flex w-max gap-3 sm:gap-4 animate-scroll py-8 items-center justify-start hover:[animation-play-state:paused]">
                {[...collegesToDisplay, ...collegesToDisplay].map((college, i) => (
                  <FlippingCard key={`${college.id}-${i}`} college={college} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 🛡️ TOOL 2: OFFICIAL ATHLETIC PORTFOLIOS SHOWCASE          */}
      {/* ========================================================= */}
      <section
        id="athletic-portfolios"
        aria-label="Official High School Athletic Portfolios"
        className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10"
      >
        <div className="group relative bg-[#0a0f1e]/80 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 lg:p-16 xl:p-24 border border-slate-800/80 overflow-hidden shadow-2xl transition-all duration-700 hover:shadow-[0_0_50px_rgba(168,85,247,0.12)]">
          <div
            className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block"
            style={{ background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(168, 85, 247, 0.1), transparent 40%)` }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row-reverse items-center gap-10 lg:gap-16">
            {/* RIGHT COLUMN: COPY & FEATURES */}
            <div className="flex-1 space-y-6 sm:space-y-8 w-full">
              <div className="bg-purple-500/10 border border-purple-500/20 p-3 sm:p-4 rounded-2xl sm:rounded-3xl w-fit shadow-sm group-hover:scale-110 transition-transform duration-500">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              </div>

              <div className="space-y-3">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-purple-400 block">
                  Your All-In-One Recruiting Vault • /athlete/you
                </span>
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                  Official Athletic Portfolios
                </h2>
              </div>

              <p className="text-slate-400 text-base sm:text-xl font-medium leading-relaxed max-w-xl">
                Replace scattered spreadsheets and dead links with one verified <strong className="text-slate-200 font-bold">Athletic Portfolio</strong>. Showcase your best stats across any of our <strong className="text-slate-200 font-bold">19 sports</strong>, display academic honors, and equip custom holographic card themes and animated borders from the Shop.
              </p>

              <ul className="space-y-3 sm:space-y-4 pt-2 sm:pt-4 pb-4 sm:pb-6">
                {[
                  '19-Sport Core Metrics powered by our Recruiting Engine',
                  'Custom Equipped Background Cards & Animated Avatar Borders',
                  'Academic GPA, Season Accolades & PRO Highlight Video Hosting',
                  'Direct Coach Pitch Inbox & custom shareable portfolio URLs',
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300 font-bold text-sm sm:text-lg">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 sm:mr-4 shrink-0 border border-purple-500/30">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-4 relative z-20">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl sm:rounded-full font-black text-sm sm:text-lg transition-all duration-300 shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] hover:scale-105 group/btn"
                >
                  Build Your Portfolio <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover/btn:translate-x-2 transition-transform" />
                </Link>
              </div>
            </div>

            {/* LEFT COLUMN: EQUIPPED BACKGROUND CARD + EQUIPPED BORDER PORTFOLIO SHOWCASE */}
            <div
              className="flex-1 w-full max-w-md mx-auto relative z-20 flex flex-col items-center"
              onMouseEnter={() => setIsPortfolioPaused(true)}
              onMouseLeave={() => setIsPortfolioPaused(false)}
            >
              <div
                key={activeAthlete.id}
                className={`w-full rounded-[2.5rem] p-6 sm:p-8 border relative overflow-hidden transition-all duration-500 animate-in fade-in zoom-in-95 ${
                  PORTFOLIO_CARD_STYLES[activeAthlete.equippedCard || 'hype'] || PORTFOLIO_CARD_STYLES.hype
                }`}
              >
                {['hype', 'premium', 'mythic-flare'].includes(activeAthlete.equippedCard || '') && (
                  <div className="holo-glare rounded-[2.5rem]" />
                )}

                <div className="relative z-20">
                  {/* Top Header Bar: Portfolio Label + Verified / PRO Badges */}
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/85 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-cyan-300" /> Athletic Portfolio
                    </span>
                    <div className="flex items-center gap-1.5">
                      {activeAthlete.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/40 border border-white/20 text-emerald-300 backdrop-blur-md">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                      {activeAthlete.isPro && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-sm">
                          <Crown className="w-3 h-3" /> PRO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Athlete Identity Row: Real Profile Picture + Equipped Animated Border */}
                  <div className="flex items-center gap-4 sm:gap-5 mb-6">
                    <div className="shrink-0">
                      <AvatarWithBorder
                        avatarUrl={activeAthlete.avatarUrl || null}
                        borderId={activeAthlete.equippedBorder || null}
                        sizeClasses="w-20 h-20 sm:w-24 sm:h-24 shadow-2xl"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight break-words drop-shadow-md">
                        {activeAthlete.firstName} {activeAthlete.lastName}
                      </h3>

                      <p className="text-xs sm:text-sm font-bold text-white/90 flex items-center gap-1.5 mt-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 opacity-80" />
                        <span className="truncate">
                          {activeAthlete.highSchool}
                          {activeAthlete.state ? `, ${activeAthlete.state}` : ''}
                        </span>
                      </p>

                      {activeAthlete.gradYear && (
                        <p className="text-xs font-extrabold text-white/75 mt-0.5">
                          Class of {activeAthlete.gradYear}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Clean Sport & GPA Pills */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="bg-black/45 border border-white/20 text-white px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider">
                      {activeAthlete.sportName || 'Track & Field'}
                    </span>
                    {activeAthlete.gpa && (
                      <span className="bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-black">
                        {activeAthlete.gpa} GPA
                      </span>
                    )}
                  </div>

                  {/* Single Highlighted Best Stat Box */}
                  {topBestMetric && (
                    <div className="bg-black/45 border border-white/15 rounded-2xl p-5 mb-5 backdrop-blur-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" /> Highlighted Best Stat
                        </span>
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                          {activeAthlete.levelOfPlay || 'Varsity'}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-4 pt-1">
                        <span className="text-sm sm:text-base font-extrabold text-white/90 uppercase tracking-wide">
                          {topBestMetric.name}
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
                          {topBestMetric.value}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Clean View Profile Action Button */}
                  <Link
                    href={`/athlete/${activeAthlete.customSlug || activeAthlete.id}`}
                    className="w-full py-3.5 px-6 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-black text-xs sm:text-sm uppercase tracking-wider backdrop-blur-md shadow-lg transition-all flex items-center justify-center gap-2 group/profile"
                  >
                    <Eye className="w-4 h-4 text-cyan-300" />
                    <span>View Profile</span>
                    <ChevronRight className="w-4 h-4 group-hover/profile:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 📊 GEO ENGINE: CRAWLABLE RECRUITING STANDARDS MATRIX       */}
      {/* ========================================================= */}
      <section id="recruiting-standards" aria-label="College Track and Field Recruiting Standards Matrix" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10">
        <div className="bg-[#0a0f1e]/90 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 lg:p-16 border border-slate-800/80 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 text-[10px] font-black uppercase tracking-widest mb-4">
                <Award className="w-3.5 h-3.5" /> Official Recruiting Benchmarks
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">NCAA &amp; NAIA Recruiting Standards Matrix</h2>
              <p className="text-slate-400 text-sm sm:text-lg font-medium mt-2 max-w-2xl">
                Compare high school Track &amp; Field personal records against ChasedSports Recruit Score tiers. Click any row to test your mark in the live calculator.
              </p>
            </div>

            {/* Boys / Girls Matrix Toggle */}
            <div className="bg-slate-900 p-1.5 rounded-2xl flex border border-slate-700/70 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setMatrixGender('Boys')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  matrixGender === 'Boys' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Boys Standards
              </button>
              <button
                type="button"
                onClick={() => setMatrixGender('Girls')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  matrixGender === 'Girls' ? 'bg-fuchsia-600 text-white shadow-[0_0_20px_rgba(192,38,211,0.4)]' : 'text-slate-400 hover:text-white'
                }`}
              >
                Girls Standards
              </button>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] sm:text-xs font-black uppercase tracking-widest bg-slate-900/90">
                  <th className="py-4 px-5 text-slate-300">Event ({matrixGender})</th>
                  <th className="py-4 px-4 text-fuchsia-400">
                    Power 4 D1 <span className="block text-[9px] text-slate-500 font-bold">95+ Score</span>
                  </th>
                  <th className="py-4 px-4 text-purple-400">
                    Mid-Major D1 <span className="block text-[9px] text-slate-500 font-bold">85+ Score</span>
                  </th>
                  <th className="py-4 px-4 text-blue-400">
                    Top D2 / Walk-On <span className="block text-[9px] text-slate-500 font-bold">75+ Score</span>
                  </th>
                  <th className="py-4 px-4 text-emerald-400">
                    NCAA D2 / D3 <span className="block text-[9px] text-slate-500 font-bold">65+ Score</span>
                  </th>
                  <th className="py-4 px-4 text-amber-400">
                    NAIA / D3 <span className="block text-[9px] text-slate-500 font-bold">55+ Score</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm font-bold">
                {GEO_BENCHMARK_EVENTS.map((ev) => {
                  const std = RECRUITING_STANDARDS[matrixGender][ev];
                  if (!std) return null;
                  const isField = !!std.isField;
                  return (
                    <tr
                      key={ev}
                      onClick={() => {
                        setSelectedSport('Track & Field');
                        setGender(matrixGender);
                        setSelectedEvent(ev);
                        setEventSearch(ev);
                        setHookStep('editor');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:bg-blue-500/10 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5 text-white font-black flex items-center gap-2">
                        <Timer className="w-4 h-4 text-blue-400 opacity-70 group-hover:opacity-100" />
                        {ev}
                      </td>
                      <td className="py-3.5 px-4 text-fuchsia-300 font-black">{formatMarkFromNumber(std.t1, isField)}</td>
                      <td className="py-3.5 px-4 text-purple-300">{formatMarkFromNumber(std.t2, isField)}</td>
                      <td className="py-3.5 px-4 text-blue-300">{formatMarkFromNumber(std.t3, isField)}</td>
                      <td className="py-3.5 px-4 text-emerald-300">{formatMarkFromNumber(std.t4, isField)}</td>
                      <td className="py-3.5 px-4 text-amber-300">{formatMarkFromNumber(std.t5, isField)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-bold">
            <p>* Standards reflect ChasedSports Base Recruiting Score thresholds for {matrixGender} high school athletes across 18 Track &amp; Field events.</p>
            <Link href="/division-checker" className="text-blue-400 hover:text-blue-300 font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              Open Full Division Calculator <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* ❓ GEO ENGINE: FREQUENTLY ASKED QUESTIONS (FAQ)            */}
      {/* ========================================================= */}
      <section aria-label="Frequently Asked Questions about College Recruiting" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10">
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4">
            <HelpCircle className="w-3.5 h-3.5" /> Recruiting Intelligence
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {LANDING_FAQS.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={idx}
                className="bg-[#0a0f1e]/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 rounded-2xl sm:rounded-3xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full p-6 sm:p-8 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <h3 className="text-base sm:text-xl font-black text-white leading-snug">{faq.q}</h3>
                  <ChevronDown className={`w-5 h-5 text-blue-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`px-6 sm:px-8 overflow-hidden transition-all duration-300 ${isOpen ? 'pb-6 sm:pb-8 max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed border-t border-slate-800/80 pt-4">{faq.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 🌐 SEO INTERNAL LINKING FOOTER                            */}
      {/* ========================================================= */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8 border-t border-slate-800/80 mt-12 relative z-10 text-slate-400">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image src="/icon.png" alt="ChasedSports Logo" fill sizes="32px" className="object-contain" />
              </div>
              <span className="text-lg font-black text-white">
                Chased<span className="text-blue-400">Sports</span>
              </span>
            </Link>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              The gamified college recruiting platform, official athletic portfolio network, and scholarship matchmaker built for high school athletes across 19 sports.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Recruiting Tools</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-bold">
              <li>
                <Link href="/search" className="hover:text-blue-400 transition-colors">
                  College Matchmaker
                </Link>
              </li>
              <li>
                <Link href="/division-checker" className="hover:text-blue-400 transition-colors">
                  Division Calculator
                </Link>
              </li>
              <li>
                <a href="#athletic-portfolios" className="hover:text-blue-400 transition-colors">
                  Athletic Portfolios
                </a>
              </li>
              <li>
                <Link href="/feed" className="hover:text-blue-400 transition-colors">
                  Recruiting Feed
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">19 Supported Sports</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-bold">
              <li>
                <a href="#recruiting-standards" className="hover:text-blue-400 transition-colors">
                  Track &amp; Field Standards
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSport('Cross Country');
                    setHookStep('editor');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Cross Country Recruiting
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSport('Football');
                    setHookStep('editor');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Football Recruiting
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSport('Basketball');
                    setHookStep('editor');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Basketball &amp; Soccer
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Platform &amp; Legal</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-bold">
              <li>
                <Link href="/login" className="hover:text-blue-400 transition-colors">
                  Athlete Login / Sign Up
                </Link>
              </li>
              <li>
                <Link href="/coach-pro" className="hover:text-blue-400 transition-colors">
                  For College Coaches
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-600">
          <p>© {new Date().getFullYear()} ChasedSports. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Built for High School Athletes &amp; Collegiate Recruiters.</p>
        </div>
      </footer>
    </main>
  );
}