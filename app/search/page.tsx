'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MapPin, Trophy, Search, Activity, ChevronRight, BookOpen, Users, SearchIcon, TrendingUp, Landmark, SlidersHorizontal, ChevronDown, ChevronUp, DollarSign, Percent, Award, RotateCcw, Bookmark, RefreshCw, Target, Lock, Zap, School, AlertCircle, Map, X, Crown, Eye, EyeOff, Flame, Briefcase, Wallet } from 'lucide-react';
import Link from 'next/link';

// --- IMPORT THE REUSABLE PRO GATE ---
import ProGate from '@/components/ProGate';

// --- ALIGN WITH PRO GATE LAUNCH TIMELINE ---
const PRO_LAUNCH_DATE = new Date('2026-08-08T00:00:00Z'); 
const FOUNDER_FREE_MONTHS = 6;

// --- UMBRELLA MAJOR MAPPING ---
const UMBRELLA_MAP: Record<string, string> = {
  'accounting': 'Business & Marketing',
  'finance': 'Business & Marketing',
  'marketing': 'Business & Marketing',
  'business': 'Business & Marketing',
  'sports management': 'Business & Marketing',
  'nursing': 'Health Professions & Nursing',
  'pre-med': 'Biological & Biomedical Sciences',
  'pre med': 'Biological & Biomedical Sciences',
  'medicine': 'Health Professions & Nursing',
  'physical therapy': 'Health Professions & Nursing',
  'kinesiology': 'Kinesiology & Parks/Recreation',
  'exercise science': 'Kinesiology & Parks/Recreation',
  'graphic design': 'Visual & Performing Arts',
  'animation': 'Visual & Performing Arts',
  'film': 'Visual & Performing Arts',
  'art': 'Visual & Performing Arts',
  'theater': 'Visual & Performing Arts',
  'criminal justice': 'Homeland Security & Law Enforcement',
  'law': 'Legal Professions & Studies',
  'pre-law': 'Legal Professions & Studies',
  'software': 'Computer & Information Sciences',
  'computer science': 'Computer & Information Sciences',
  'it': 'Computer & Information Sciences',
  'cybersecurity': 'Computer & Information Sciences',
  'mechanical engineering': 'Engineering',
  'civil engineering': 'Engineering',
  'electrical engineering': 'Engineering',
  'aerospace': 'Engineering',
  'journalism': 'Communications & Journalism',
  'public relations': 'Communications & Journalism',
  'teaching': 'Education',
  'biology': 'Biological & Biomedical Sciences',
  'psychology': 'Psychology',
  'history': 'History',
  'english': 'English Language & Literature',
  'veterinary': 'Agriculture',
  'architecture': 'Architecture'
};

function getUmbrellaMajor(searchTerm: string): string {
  if (!searchTerm) return '';
  const term = searchTerm.toLowerCase().trim();
  if (UMBRELLA_MAP[term]) return UMBRELLA_MAP[term];
  for (const [key, umbrella] of Object.entries(UMBRELLA_MAP)) {
    if (term.includes(key)) return umbrella;
  }
  const allUmbrellas = Array.from(new Set(Object.values(UMBRELLA_MAP)));
  const directUmbrellaMatch = allUmbrellas.find(u => u.toLowerCase() === term);
  if (directUmbrellaMatch) return directUmbrellaMatch;
  return searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
}

// --- TRACK & FIELD DASHBOARD CALCULATOR ---
const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

// FIX: Added 'text?: string' to the Type definition to resolve the compiler error in the Girls section
const RECRUITING_STANDARDS: Record<string, Record<string, { t1: number, t2: number, t3: number, t4: number, t5: number, t6: number, t7: number, isField?: boolean, text?: string }>> = {
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
    '800 Meters': { t1: 130, t2: 135, t3: 140, t4: 145, t5: 152, text: '160', t6: 160, t7: 175 }, 
    '1500 Meters': { t1: 268, t2: 282, t3: 291, t4: 300, t5: 314, t6: 330, t7: 375 },
    '1600 Meters': { t1: 290, t2: 305, t3: 315, t4: 325, t5: 340, t6: 360, t7: 400 }, 
    '3000 Meters': { t1: 583, t2: 611, t3: 638, t4: 666, t5: 694, t6: 730, t7: 840 },
    '3200 Meters': { t1: 630, t2: 660, t3: 690, t4: 720, t5: 750, t6: 800, t7: 900 }, 
    '100m Hurdles': { t1: 13.8, t2: 14.3, t3: 14.8, t4: 15.5, t5: 16.5, t6: 17.8, t7: 20.0 },
    '200m Hurdles': { t1: 28.0, t2: 29.0, t3: 30.5, t4: 32.0, t5: 34.0, t6: 36.0, t7: 40.0 },
    '300m Hurdles': { t1: 42.5, t2: 44.5, t3: 46.5, t4: 48.5, t5: 51.0, t6: 54.0, t7: 59.0 },
    '400m Hurdles': { t1: 60.0, t2: 63.0, t3: 66.0, t4: 69.0, t5: 72.0, t6: 76.0, t7: 85.0 },
    'Long Jump': { t1: 234, t2: 222, t3: 210, t4: 198, t5: 186, text: '174', t6: 174, t7: 150, isField: true }, 
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
  if (!markStr) return 0;
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

const getAthleteProjection = (prs: any[], gender: string) => {
  if (!prs || !Array.isArray(prs) || prs.length === 0) {
    return { overallScore: 0 };
  }

  const standards = RECRUITING_STANDARDS[gender] || RECRUITING_STANDARDS['Boys'];
  let allBreakdowns: any[] = [];

  prs.forEach((pr) => {
    if (!pr.event || !pr.mark) return;
    const normalizedEvent = pr.event
      .replace(/Meter\b/i, 'Meters')
      .replace('100 Meter Hurdles', '100m Hurdles')
      .replace('110 Meter Hurdles', '110m Hurdles')
      .replace('200 Meter Hurdles', '200m Hurdles')
      .replace('300 Meter Hurdles', '300m Hurdles')
      .replace('400 Meter Hurdles', '400m Hurdles');

    const eventStds = standards[normalizedEvent] || standards[pr.event];

    if (eventStds) {
      const val = convertMarkToNumber(pr.mark, !!eventStds.isField);
      if (isNaN(val) || val === 0) return; 
      
      let score = 15;

      if (eventStds.isField) {
        if (val >= eventStds.t1) score = 95 + Math.min(4, ((val - eventStds.t1) / (eventStds.t1 * 0.05)) * 4);
        else if (val >= eventStds.t2) score = 85 + ((val - eventStds.t2) / (eventStds.t1 - eventStds.t2)) * 10;
        else if (val >= eventStds.t3) score = 75 + ((val - eventStds.t3) / (eventStds.t2 - eventStds.t3)) * 10;
        else if (val >= eventStds.t4) score = 65 + ((val - eventStds.t4) / (eventStds.t3 - eventStds.t4)) * 10;
        else if (val >= eventStds.t5) score = 55 + ((val - eventStds.t5) / (eventStds.t4 - eventStds.t5)) * 10;
        else if (val >= eventStds.t6) score = 40 + ((val - eventStds.t6) / (eventStds.t5 - eventStds.t6)) * 14;
        else if (val >= eventStds.t7) score = 20 + ((val - eventStds.t7) / (eventStds.t6 - eventStds.t7)) * 19;
        else { 
            const t8 = eventStds.t7 * 0.85; 
            if (val >= t8) { score = 15 + ((val - t8) / (eventStds.t7 - t8)) * 4; } else { score = 15; } 
        }
      } else {
        if (val <= eventStds.t1) score = 95 + Math.min(4, ((eventStds.t1 - val) / (eventStds.t1 * 0.05)) * 4);
        else if (val <= eventStds.t2) score = 85 + ((eventStds.t2 - val) / (eventStds.t2 - eventStds.t1)) * 10;
        else if (val <= eventStds.t3) score = 75 + ((eventStds.t3 - val) / (eventStds.t3 - eventStds.t2)) * 10;
        else if (val <= eventStds.t4) score = 65 + ((eventStds.t4 - val) / (eventStds.t4 - eventStds.t3)) * 10;
        else if (val <= eventStds.t5) score = 55 + ((eventStds.t5 - val) / (eventStds.t5 - eventStds.t4)) * 10;
        else if (val <= eventStds.t6) score = 40 + ((eventStds.t6 - val) / (eventStds.t6 - eventStds.t5)) * 14;
        else if (val <= eventStds.t7) score = 20 + ((eventStds.t7 - val) / (eventStds.t7 - eventStds.t6)) * 19;
        else { 
            const t8 = eventStds.t7 * 1.15; 
            if (val <= t8) { score = 15 + ((t8 - val) / (t8 - eventStds.t7)) * 4; } else { score = 15; } 
        }
      }
      allBreakdowns.push({ score: Math.min(99, Math.max(15, Math.round(score))) });
    }
  });

  if (allBreakdowns.length === 0) return { overallScore: 0 };
  allBreakdowns.sort((a, b) => b.score - a.score);
  return { overallScore: allBreakdowns[0].score };
};

// --- DYNAMIC RATING GENERATOR ---
const getCalculatedRating = (college: any, program: any) => {
    let rating = program?.team_performance_rating || 0;
    
    // Critical Fallback for programs missing rating in DB
    if (rating === 0 && college) {
        const div = college.division || '';
        const acc = parseFloat(college.acceptance_rate || '100');
        if (div.includes('D1')) {
            if (acc <= 20) rating = 95;
            else if (acc <= 50) rating = 85;
            else rating = 80;
        } else if (div.includes('D2')) {
            rating = 70;
        } else if (div.includes('D3')) {
            rating = 60;
        } else if (div.includes('NAIA')) {
            rating = 55;
        } else {
            rating = 40;
        }
    }
    return rating;
};

// --- DYNAMIC BADGE CALCULATOR ---
const getBadgeDetails = (college: any, selectedSport: string, useScoreMatch: boolean, athleteScore: number) => {
    let badgeColor = "bg-slate-900 border-slate-800 text-slate-500";
    let badgeText = "UR";
    let badgeSub = "RATING";
    
    if (!college.hasSport && selectedSport) {
        badgeColor = "bg-slate-800 border-slate-700 text-slate-300";
        badgeText = "ACADEMIC";
        badgeSub = "NO PROGRAM";
    } else {
        let rating = getCalculatedRating(college, college.targetProgram);
        badgeText = rating.toString();

        if (useScoreMatch && rating > 0) {
            const diff = rating - athleteScore;
            if (diff <= 0) {
                badgeColor = "bg-emerald-950/60 border-emerald-500/40 text-emerald-400";
                badgeText = "Target";
                badgeSub = "MATCH";
            } else if (diff <= 5) {
                badgeColor = "bg-blue-950/60 border-blue-500/40 text-blue-400";
                badgeText = "Walk-On";
                badgeSub = "MATCH";
            } else if (diff <= 15) {
                badgeColor = "bg-amber-950/60 border-amber-500/40 text-amber-400";
                badgeText = "Poss Walk-On";
                badgeSub = "MATCH";
            } else {
                badgeColor = "bg-red-950/60 border-red-500/40 text-red-400";
                badgeText = "Stretch";
                badgeSub = "MATCH";
            }
        } else if (rating > 0) {
            badgeColor = "bg-purple-950/60 border-purple-500/40 text-purple-400";
            badgeSub = "RATING";
        }
    }
    
    return { badgeColor, badgeText, badgeSub };
};

interface University {
  id: string;
  name: string;
  city: string;
  state: string;
  division: string;
  student_population: string;
  majors_offered: string[];
  programs: any[]; 
  hasSport?: boolean;
  targetProgram?: any;
  acceptance_rate?: string;
  median_earnings?: number;
  tuition_in_state?: number;
  tuition_out_of_state?: number;
  tuition?: number;
  athleteMatchScore?: number; 
}

const US_TILE_MAP = [
  { id: 'AK', row: 1, col: 1 }, { id: 'ME', row: 1, col: 12 },
  { id: 'VT', row: 2, col: 11 }, { id: 'NH', row: 2, col: 12 },
  { id: 'WA', row: 3, col: 2 }, { id: 'ID', row: 3, col: 3 }, { id: 'MT', row: 3, col: 4 }, { id: 'ND', row: 3, col: 5 }, { id: 'MN', row: 3, col: 6 }, { id: 'WI', row: 3, col: 7 }, { id: 'MI', row: 3, col: 8 }, { id: 'NY', row: 3, col: 10 }, { id: 'MA', row: 3, col: 11 }, { id: 'RI', row: 3, col: 12 },
  { id: 'OR', row: 4, col: 2 }, { id: 'NV', row: 4, col: 3 }, { id: 'WY', row: 4, col: 4 }, { id: 'SD', row: 4, col: 5 }, { id: 'IA', row: 4, col: 6 }, { id: 'IL', row: 4, col: 7 }, { id: 'IN', row: 4, col: 8 }, { id: 'OH', row: 4, col: 9 }, { id: 'PA', row: 4, col: 10 }, { id: 'NJ', row: 4, col: 11 }, { id: 'CT', row: 4, col: 12 },
  { id: 'CA', row: 5, col: 2 }, { id: 'UT', row: 5, col: 3 }, { id: 'CO', row: 5, col: 4 }, { id: 'NE', row: 5, col: 5 }, { id: 'MO', row: 5, col: 6 }, { id: 'KY', row: 5, col: 7 }, { id: 'WV', row: 5, col: 8 }, { id: 'VA', row: 5, col: 9 }, { id: 'MD', row: 5, col: 10 }, { id: 'DE', row: 5, col: 11 },
  { id: 'AZ', row: 6, col: 3 }, { id: 'NM', row: 6, col: 4 }, { id: 'KS', row: 6, col: 5 }, { id: 'AR', row: 6, col: 6 }, { id: 'TN', row: 6, col: 7 }, { id: 'NC', row: 6, col: 8 }, { id: 'SC', row: 6, col: 9 },
  { id: 'OK', row: 7, col: 5 }, { id: 'LA', row: 7, col: 6 }, { id: 'MS', row: 7, col: 7 }, { id: 'AL', row: 7, col: 8 }, { id: 'GA', row: 7, col: 9 },
  { id: 'HI', row: 8, col: 1 }, { id: 'TX', row: 8, col: 5 }, { id: 'FL', row: 8, col: 10 }
];

function formatCurrency(num: number | null | undefined) {
  if (!num) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

type MatchmakerCategory = 'fit' | 'cost' | 'salary' | 'funding' | 'roi';

// --- EXTRACTOR HELPER FOR THE NEW 'athlete_sports' TABLE ---
const extractTrackPrs = (sports: any) => {
  if (!Array.isArray(sports)) return [];
  const track = sports?.find((s: any) => s.sport_name === 'Track & Field');
  if (!track || !track.metrics) return [];
  
  let parsed = track.metrics;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch (e) { parsed = []; }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((m: any) => ({ event: m.name, mark: m.value }));
};

export default function Home() {
  const supabase = createClient();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- UI Tabs ---
  const [activeTab, setActiveTab] = useState<'personalized' | 'all'>('personalized');
  const [matchmakerView, setMatchmakerView] = useState<MatchmakerCategory>('fit');

  // --- Filtration Toggle for Academic Matches ---
  const [hideAcademicOnly, setHideAcademicOnly] = useState(false);

  // --- Auth & Target Schools States ---
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [athleteProfile, setAthleteProfile] = useState<any>(null); 
  const [isAthlete, setIsAthlete] = useState<boolean>(false);
  const [athleteFirstName, setAthleteFirstName] = useState<string>('');
  
  // Best score globally in Hero banner.
  const [athleteScore, setAthleteScore] = useState<number>(0); 
  
  const [athleteGender, setAthleteGender] = useState<string>('');
  const [athleteState, setAthleteState] = useState<string>('');
  
  const [savedCollegeIds, setSavedCollegeIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  // --- Basic Filters ---
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState('');
  
  // --- Bonus Settings (Advanced) ---
  const [schoolName, setSchoolName] = useState('');
  const [maxAcceptance, setMaxAcceptance] = useState('');
  const [tuitionType, setTuitionType] = useState('in_state');
  const [maxTuition, setMaxTuition] = useState('');
  const [sortBy, setSortBy] = useState('');

  // --- SNEAKY PAYWALL EVALUATOR (SYNCED TO PRO GATE LAUNCH TIMELINE) ---
  const isPreLaunch = useMemo(() => new Date() < PRO_LAUNCH_DATE, []);
  
  const isLockedProfile = useMemo(() => {
      // If they have no profile, they do not have access
      if (!athleteProfile) return true;

      const isPremium = athleteProfile.is_premium === true;
      const isFounder = athleteProfile.is_founder === true;

      const now = new Date();
      const founderExpirationDate = new Date(PRO_LAUNCH_DATE);
      founderExpirationDate.setMonth(founderExpirationDate.getMonth() + FOUNDER_FREE_MONTHS);
      const isFounderActive = isFounder && now < founderExpirationDate;

      if (isPreLaunch) {
          // PRE-LAUNCH: Feature locked to everyone except Founders (and Premium)
          return !(isFounder || isPremium);
      } else {
          // POST-LAUNCH: Feature locked to everyone except Premium users and Active Founders
          return !(isPremium || isFounderActive);
      }
  }, [athleteProfile, isPreLaunch]);

  // --- 1. Load User, Score & Check Role ---
  useEffect(() => {
    async function fetchUserAndSaves() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
        
        const { data: athleteData } = await supabase
          .from('athletes')
          .select('id, first_name, gender, state, is_premium, is_founder, primary_sport')
          .eq('id', session.user.id)
          .maybeSingle();

        if (athleteData) {
          setIsAthlete(true);
          setAthleteFirstName(athleteData.first_name);
          setAthleteGender(athleteData.gender || 'Boys');
          if (athleteData.state) setAthleteState(athleteData.state);
          
          const { data: sportsData } = await supabase
            .from('athlete_sports')
            .select('sport_name, metrics, custom_fit_score')
            .eq('athlete_id', session.user.id);

          setAthleteProfile({ ...athleteData, athlete_sports: sportsData || [] });
          
          let bestScore = 0;
          if (sportsData && sportsData.length > 0) {
             sportsData.forEach((s: any) => {
                 if (s.sport_name === 'Track & Field') {
                     const prs = extractTrackPrs(sportsData);
                     const trackScore = getAthleteProjection(prs, athleteData.gender || 'Boys').overallScore;
                     if (trackScore > bestScore) bestScore = trackScore;
                 } else {
                     if (s.custom_fit_score && s.custom_fit_score > bestScore) bestScore = s.custom_fit_score;
                 }
             });
          }
          setAthleteScore(bestScore);

          const { data } = await supabase
            .from('saved_colleges')
            .select('college_id')
            .eq('athlete_id', session.user.id);
          
          if (data) {
            setSavedCollegeIds(new Set(data.map(d => d.college_id)));
          }
        }
      }
    }
    fetchUserAndSaves();
  }, [supabase]);

  // --- DYNAMIC HERO SCORE LOGIC ---
  const activeAthleteScore = useMemo(() => {
    if (!isAthlete || !athleteProfile) return { score: 0, label: 'Base' };

    const targetSport = selectedSport || athleteProfile.primary_sport || 'Track & Field';
    let score = 0;
    const sportsList = athleteProfile.athlete_sports || [];
    
    if (targetSport === 'Track & Field') {
        const prs = extractTrackPrs(sportsList);
        score = getAthleteProjection(prs, athleteGender).overallScore;
    } else {
        const sportRow = sportsList.find((s: any) => s.sport_name === targetSport);
        score = sportRow?.custom_fit_score || 0;
    }

    return { score, label: targetSport };
  }, [selectedSport, athleteProfile, isAthlete, athleteGender]);

  // --- 2. Load Initial State (Filters & Results) ---
  useEffect(() => {
    async function loadInitialState() {
      const savedFilters = sessionStorage.getItem('chasedSportsFilters');
      const savedResults = sessionStorage.getItem('chasedSportsResults');
      const savedTab = sessionStorage.getItem('chasedSportsTab');

      if (savedFilters) {
        const f = JSON.parse(savedFilters);
        setSchoolName(f.schoolName || '');
        setSelectedSport(f.selectedSport || '');
        setSelectedGender(f.selectedGender || '');
        setSelectedDivision(f.selectedDivision || '');
        setSelectedStates(f.selectedStates || []);
        setSelectedMajor(f.selectedMajor || '');
        setMaxAcceptance(f.maxAcceptance || '');
        setTuitionType(f.tuitionType || 'in_state');
        setMaxTuition(f.maxTuition || '');
        setSortBy(f.sortBy || '');
        setHasSearched(f.hasSearched || false);
        setShowAdvanced(f.showAdvanced || false);
        setHideAcademicOnly(f.hideAcademicOnly || false);
      }

      if (savedResults) setUniversities(JSON.parse(savedResults));
      if (savedTab) setActiveTab(savedTab as 'personalized' | 'all');

      setIsInitialized(true);
    }
    
    loadInitialState();
  }, [supabase]);

  // --- Auto-Save States ---
  useEffect(() => {
    if (!isInitialized) return; 
    const filters = {
      schoolName, selectedSport, selectedGender, selectedDivision, selectedStates,
      selectedMajor, maxAcceptance, tuitionType, maxTuition, sortBy, hasSearched, showAdvanced, hideAcademicOnly
    };
    sessionStorage.setItem('chasedSportsFilters', JSON.stringify(filters));
    sessionStorage.setItem('chasedSportsTab', activeTab);
  }, [isInitialized, schoolName, selectedSport, selectedGender, selectedDivision, selectedStates, selectedMajor, maxAcceptance, tuitionType, maxTuition, sortBy, hasSearched, showAdvanced, activeTab, hideAcademicOnly]);

  useEffect(() => {
    if (!isInitialized) return;
    sessionStorage.setItem('chasedSportsResults', JSON.stringify(universities));
  }, [isInitialized, universities]);

  const toggleState = (stateCode: string) => {
    if (selectedStates.includes(stateCode)) {
      setSelectedStates(selectedStates.filter(s => s !== stateCode));
    } else {
      setSelectedStates([...selectedStates, stateCode]);
    }
  };

  // --- ACTION: SAVE COLLEGE ---
  const toggleSaveCollege = async (e: React.MouseEvent, collegeId: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (!currentUserId) {
      setErrorMsg("Create a free athlete account to start saving target schools to your dashboard.");
      setTimeout(() => setErrorMsg(null), 5000);
      return;
    }

    setSavingIds(prev => new Set(prev).add(collegeId));
    const isCurrentlySaved = savedCollegeIds.has(collegeId);

    try {
      if (isCurrentlySaved) {
        await supabase
          .from('saved_colleges')
          .delete()
          .eq('athlete_id', currentUserId)
          .eq('college_id', collegeId);
        
        setSavedCollegeIds(prev => {
          const next = new Set(prev);
          next.delete(collegeId);
          return next;
        });
      } else {
        await supabase
          .from('saved_colleges')
          .insert({ athlete_id: currentUserId, college_id: collegeId });
        
        setSavedCollegeIds(prev => {
          const next = new Set(prev);
          next.add(collegeId);
          return next;
        });
      }
    } catch (err: any) {
      console.error("Save Error:", err.message);
      setErrorMsg("Failed to update saved schools. Please try again.");
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(collegeId);
        return next;
      });
    }
  };

  const handleReset = () => {
    setSchoolName('');
    setSelectedSport('');
    setSelectedGender('');
    setSelectedDivision('');
    setSelectedStates([]);
    setSelectedMajor('');
    setMaxAcceptance('');
    setTuitionType('in_state');
    setMaxTuition('');
    setSortBy('');
    setHasSearched(false);
    setHideAcademicOnly(false);
    setActiveTab('personalized');
    setMatchmakerView('fit');
    setUniversities([]);
    setErrorMsg(null);
    sessionStorage.removeItem('chasedSportsFilters');
    sessionStorage.removeItem('chasedSportsResults');
    sessionStorage.removeItem('chasedSportsTab');
  };

  async function handleSearch() {
    setErrorMsg(null);
    if (!selectedSport && !schoolName && !selectedGender && !selectedDivision && selectedStates.length === 0 && !selectedMajor) {
      setErrorMsg("Please select at least one filter or enter a school name to begin.");
      setTimeout(() => setErrorMsg(null), 5000);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setActiveTab('personalized'); 

    let selectString = `*, programs(sport, gender, operating_expense, team_performance_rating, average_scholarship)`;
    let query = supabase.from('universities').select(selectString);

    if (schoolName) query = query.ilike('name', `%${schoolName}%`);
    if (selectedDivision) query = query.eq('division', selectedDivision);
    if (selectedStates.length > 0) query = query.in('state', selectedStates);
    if (selectedMajor) {
      const searchMajor = getUmbrellaMajor(selectedMajor);
      query = query.contains('majors_offered', [searchMajor]); 
    }

    const { data, error } = await query.limit(800);

    if (error) {
      console.error('Database Error:', error.message);
      setErrorMsg("An error occurred while scanning the database. Please try again.");
      setUniversities([]);
    } else {
      setUniversities(data as unknown as University[]);
    }
    
    setLoading(false);
  }

  const mappedMajor = getUmbrellaMajor(selectedMajor);
  const showMajorHint = selectedMajor.length > 2 && mappedMajor.toLowerCase() !== selectedMajor.toLowerCase();
  
  const isCoach = currentUserId && !isAthlete;

  // --- HELPER: GET CALCULATED TUITION ---
  const getCalculatedTuition = (uni: University) => {
    if (!uni) return { amount: 0, isInState: false };
    const isHomeState = Boolean(athleteState && uni.state === athleteState);
    let amount = uni.tuition_out_of_state || uni.tuition || 0;
    
    if (isHomeState && uni.tuition_in_state) {
        amount = uni.tuition_in_state;
    } else if (isHomeState && uni.tuition) {
        amount = uni.tuition;
    }
    return { amount, isInState: isHomeState };
  };

  // --- FILTER & SORT LOGIC ---
  const validUniversities = useMemo(() => {
    let processed = universities.map(uni => {
        let targetProgram = null;
        let hasSport = true;
        let athleteMatchScore = 0;
        
        const normalizeSport = (s: string) => s.toLowerCase().replace(/ and /g, ' & ').replace(/[^a-z0-9]/g, '');

        if (selectedSport) {
            const searchGenderStr = selectedGender ? selectedGender.toLowerCase() : (isAthlete && athleteGender ? athleteGender.toLowerCase() : '');
            let targetGender = '';
            if (searchGenderStr === 'men' || searchGenderStr === 'boys') targetGender = 'men';
            if (searchGenderStr === 'women' || searchGenderStr === 'girls') targetGender = 'women';

            targetProgram = uni.programs?.find(p => {
                const normSearch = normalizeSport(selectedSport);
                const normDb = normalizeSport(p.sport || '');
                if (normSearch && !normDb.includes(normSearch) && !normSearch.includes(normDb)) return false;
                
                if (targetGender) {
                    const pG = (p.gender || '').toLowerCase();
                    const isDbMen = pG === 'men' || pG === 'boys' || pG === "men's" || pG === "boys'" || pG === 'male';
                    const isDbWomen = pG === 'women' || pG === 'girls' || pG === "women's" || pG === "girls'" || pG === 'female';
                    
                    if (targetGender === 'men' && !isDbMen) return false;
                    if (targetGender === 'women' && !isDbWomen) return false;
                }
                return true;
            });
            if (!targetProgram) hasSport = false;
        } else {
            targetProgram = uni.programs?.[0];
            if (!targetProgram) hasSport = false;
        }

        if (isAthlete && athleteProfile && hasSport && targetProgram) {
            const sportsList = athleteProfile.athlete_sports || [];
            const progSport = targetProgram.sport;
            
            if (progSport === 'Track & Field') {
                const prs = extractTrackPrs(sportsList);
                athleteMatchScore = getAthleteProjection(prs, athleteGender).overallScore;
            } else {
                const sportRow = sportsList.find((s: any) => s.sport_name === progSport);
                athleteMatchScore = sportRow?.custom_fit_score || 0;
            }
        }
        return { ...uni, targetProgram, hasSport, athleteMatchScore };
    });

    if (hideAcademicOnly && (selectedSport || athleteProfile?.primary_sport)) {
        processed = processed.filter(uni => uni.hasSport);
    }

    let filtered = processed.filter((uni) => {
      const hasAcceptanceData = uni.acceptance_rate != null && uni.acceptance_rate !== '';
      const hasEarnings = uni.median_earnings != null && uni.median_earnings > 0;
      
      if (!hasAcceptanceData && !hasEarnings) return false;

      if (maxAcceptance) {
        const rateNum = parseFloat(uni.acceptance_rate?.replace('%', '') || '100');
        if (rateNum > parseFloat(maxAcceptance)) return false;
      }

      if (maxTuition) {
        const maxT = parseFloat(maxTuition);
        const schoolTuition = tuitionType === 'in_state' 
          ? (uni.tuition_in_state || uni.tuition || 0)
          : (uni.tuition_out_of_state || uni.tuition || 0);
        
        if (schoolTuition === 0 || schoolTuition > maxT) return false;
      }
      return true;
    });

    if (sortBy) {
      filtered.sort((a, b) => {
        if (sortBy.startsWith('budget')) {
          const valA = a.targetProgram?.operating_expense || 0;
          const valB = b.targetProgram?.operating_expense || 0;
          if (sortBy === 'budget_low') {
            if (valA === 0 && valB !== 0) return 1; 
            if (valB === 0 && valA !== 0) return -1;
            return valA - valB;
          }
          return valB - valA;
        }
        
        if (sortBy.startsWith('salary')) {
          const valA = a.median_earnings || 0;
          const valB = b.median_earnings || 0;
          if (sortBy === 'salary_low') {
            if (valA === 0 && valB !== 0) return 1;
            if (valB === 0 && valA !== 0) return -1;
            return valA - valB;
          }
          return valB - valA;
        }

        if (sortBy.startsWith('tuition')) {
          const valA = tuitionType === 'in_state' ? (a.tuition_in_state || a.tuition || 0) : (a.tuition_out_of_state || a.tuition || 0);
          const valB = tuitionType === 'in_state' ? (b.tuition_in_state || b.tuition || 0) : (b.tuition_out_of_state || b.tuition || 0);
          if (sortBy === 'tuition_low') {
            if (valA === 0 && valB !== 0) return 1;
            if (valB === 0 && valA !== 0) return -1;
            return valA - valB;
          }
          return valB - valA;
        }

        if (sortBy.startsWith('acceptance')) {
          const valA = parseFloat(a.acceptance_rate?.replace('%', '') || '0');
          const valB = parseFloat(b.acceptance_rate?.replace('%', '') || '0');
          if (sortBy === 'acceptance_low') {
            if (valA === 0 && valB !== 0) return 1;
            if (valB === 0 && valA !== 0) return -1;
            return valA - valB;
          }
          return valB - valA;
        }
        return 0;
      });
    } else {
        filtered.sort((a, b) => {
             const ratingA = a.hasSport ? getCalculatedRating(a, a.targetProgram) : 0;
             const ratingB = b.hasSport ? getCalculatedRating(b, b.targetProgram) : 0;
             if (ratingA !== ratingB) return ratingB - ratingA;

             const accA = parseFloat(a.acceptance_rate?.replace('%', '') || '100');
             const accB = parseFloat(b.acceptance_rate?.replace('%', '') || '100');
             return accA - accB;
        });
    }
    return filtered;
  }, [universities, maxAcceptance, maxTuition, tuitionType, sortBy, selectedSport, selectedGender, isAthlete, athleteGender, athleteProfile, hideAcademicOnly]);

  // --- COMPREHENSIVE MATCHMAKER LISTS ---
  const matchmakerLists = useMemo(() => {
    if (!validUniversities.length || !hasSearched) return null;

    const listLimit = 55; // Pull a solid payload window for slicing
    const isPersonalizedFit = isAthlete && validUniversities.some(u => u.athleteMatchScore && u.athleteMatchScore > 0);

    let topAthleticFits = [...validUniversities].sort((a, b) => {
        const ratingA = a.hasSport ? getCalculatedRating(a, a.targetProgram) : 0;
        const ratingB = b.hasSport ? getCalculatedRating(b, b.targetProgram) : 0;
        let scoreA = 0;
        let scoreB = 0;

        if (a.hasSport && ratingA > 0 && a.athleteMatchScore && a.athleteMatchScore > 0) {
            const diffA = Math.abs(ratingA - a.athleteMatchScore);
            scoreA += 100 - (diffA * 5); 
        } else if (a.hasSport) {
            scoreA += ratingA;
        }

        if (b.hasSport && ratingB > 0 && b.athleteMatchScore && b.athleteMatchScore > 0) {
            const diffB = Math.abs(ratingB - b.athleteMatchScore);
            scoreB += 100 - (diffB * 5);
        } else if (b.hasSport) {
            scoreB += ratingB;
        }

        scoreA += Math.min((a.median_earnings || 0) / 2000, 50); 
        scoreB += Math.min((b.median_earnings || 0) / 2000, 50);
        const accA = parseFloat(a.acceptance_rate || '100');
        const accB = parseFloat(b.acceptance_rate || '100');
        scoreA += ((100 - accA) / 4); 
        scoreB += ((100 - accB) / 4);
        scoreA += Math.min((a.targetProgram?.operating_expense || 0) / 100000, 10);
        scoreB += Math.min((b.targetProgram?.operating_expense || 0) / 100000, 10);
        
        return scoreB - scoreA;
    }).slice(0, listLimit);

    const lowestCostMatches = [...validUniversities]
      .filter(u => u.tuition_in_state || u.tuition_out_of_state || u.tuition)
      .sort((a, b) => {
        const costA = getCalculatedTuition(a).amount || 999999;
        const scholA = a.hasSport ? (a.targetProgram?.average_scholarship || 0) : 0;
        const costB = getCalculatedTuition(b).amount || 999999;
        const scholB = b.hasSport ? (b.targetProgram?.average_scholarship || 0) : 0;
        return Math.max(0, costA - scholA) - Math.max(0, costB - scholB);
      }).slice(0, listLimit);

    const highestSalaryMatches = [...validUniversities]
      .filter(u => u.median_earnings && u.median_earnings > 0)
      .sort((a, b) => (b.median_earnings || 0) - (a.median_earnings || 0))
      .slice(0, listLimit);

    const sportMatches = validUniversities.filter(u => u.hasSport);
    const topFundedMatches = [...sportMatches]
      .filter(u => u.targetProgram?.operating_expense && u.targetProgram.operating_expense > 0)
      .sort((a, b) => (b.targetProgram?.operating_expense || 0) - (a.targetProgram?.operating_expense || 0))
      .slice(0, listLimit);

    const topRoiMatches = [...validUniversities]
      .filter(u => u.median_earnings && (u.tuition_in_state || u.tuition_out_of_state || u.tuition))
      .sort((a, b) => {
        const costA = getCalculatedTuition(a).amount || 1;
        const scholA = a.hasSport ? (a.targetProgram?.average_scholarship || 0) : 0;
        const netA = Math.max(1, costA - scholA);
        const costB = getCalculatedTuition(b).amount || 1;
        const scholB = b.hasSport ? (b.targetProgram?.average_scholarship || 0) : 0;
        const netB = Math.max(1, costB - scholB);
        return ((b.median_earnings || 0) / netB) - ((a.median_earnings || 0) / netA);
      }).slice(0, listLimit);

    return { 
        isPersonalizedFit, 
        fit: topAthleticFits, 
        cost: lowestCostMatches, 
        salary: highestSalaryMatches, 
        funding: topFundedMatches, 
        roi: topRoiMatches 
    };
  }, [validUniversities, hasSearched, isAthlete]);

  const renderReadinessMeter = (uni: University) => {
    if (!uni.hasSport) return null;

    const useScoreMatch = isAthlete && uni.athleteMatchScore && uni.athleteMatchScore > 0;
    let teamRating = getCalculatedRating(uni, uni.targetProgram);
    if (!teamRating) return null;

    if (useScoreMatch) {
      const diff = teamRating - uni.athleteMatchScore!;
      let percent = 100;
      let colorClass = 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
      let textClass = 'text-emerald-600';
      let label = 'Great Fit';

      if (diff > 0) {
        percent = Math.max(10, 100 - (diff * 5)); 
        if (percent >= 80) {
          colorClass = 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'; textClass = 'text-emerald-600'; label = 'Good Fit';
        } else if (percent >= 50) {
          colorClass = 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'; textClass = 'text-amber-600'; label = 'Possible Walk-On';
        } else {
          colorClass = 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'; textClass = 'text-red-600'; label = 'Stretch';
        }
      }

      return (
        <div className="mt-5 p-4 bg-slate-50/80 backdrop-blur-md rounded-2xl border border-slate-100/50">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Target className="w-3 h-3" /> Athletic Match
            </span>
            <span className={`text-xs font-black ${textClass}`}>{label}</span>
          </div>
          <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`} style={{ width: `${percent}%` }}></div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-5 p-4 bg-slate-50/80 backdrop-blur-md rounded-2xl border border-slate-100/50">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
            <Activity className="w-3 h-3" /> Program Standard
          </span>
          <span className="text-xs font-black text-blue-600">{teamRating} Rtg</span>
        </div>
        <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, teamRating)}%` }}></div>
        </div>
      </div>
    );
  };

  const renderMatchmakerList = () => {
    if (!matchmakerLists) return null;
    const currentList = matchmakerLists[matchmakerView];

    if (!currentList || currentList.length === 0) {
        return (
            <div className="block bg-white/60 backdrop-blur-md border border-slate-200 border-dashed p-10 rounded-[2rem] flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">No data available for this category based on your current filters.</p>
            </div>
        );
    }

    const currentSportConfigLabel = selectedSport || athleteProfile?.primary_sport || 'General Metrics';

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
                <div className="flex items-center gap-3 self-start sm:self-auto">
                    {matchmakerView === 'fit' && <Target className="w-6 h-6 text-purple-500" />}
                    {matchmakerView === 'cost' && <Wallet className="w-6 h-6 text-emerald-500" />}
                    {matchmakerView === 'salary' && <Briefcase className="w-6 h-6 text-blue-500" />}
                    {matchmakerView === 'funding' && <Award className="w-6 h-6 text-yellow-500" />}
                    {matchmakerView === 'roi' && <TrendingUp className="w-6 h-6 text-amber-500" />}
                    
                    <div>
                        <h3 className="font-black text-lg text-white">
                            {matchmakerView === 'fit' && (matchmakerLists.isPersonalizedFit ? "Colleges That Fit You" : "Highest Rated Programs")}
                            {matchmakerView === 'cost' && "Cheapest Tuition (Net Cost)"}
                            {matchmakerView === 'salary' && "Highest Median Salary"}
                            {matchmakerView === 'funding' && "Best Funded Programs"}
                            {matchmakerView === 'roi' && "Top ROI Ranking"}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                            {matchmakerView === 'fit' && (matchmakerLists.isPersonalizedFit ? "Ranked by Athletic Fit & Median Salary" : "Ranked by Athletic Caliber & Median Salary")}
                            {matchmakerView === 'cost' && "Ranked by Tuition minus Avg Scholarship"}
                            {matchmakerView === 'salary' && "Ranked by 10-Yr Median Earnings (Regardless of Sport)"}
                            {matchmakerView === 'funding' && "Ranked by Program Operating Expense"}
                            {matchmakerView === 'roi' && "Median Salary vs Net Cost"}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800/80 backdrop-blur-md p-2.5 rounded-xl text-left sm:text-right w-full sm:w-auto shrink-0 shadow-inner mt-4 sm:mt-0">
                   <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Target Sport Matrix</span>
                   <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 uppercase tracking-tight">{currentSportConfigLabel}</span>
                </div>
            </div>
            
            <div className="divide-y divide-slate-800/50 max-h-[800px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full relative">
                {currentList.map((college, idx) => {
                    const tuitionInfo = getCalculatedTuition(college);
                    const netCost = Math.max(0, tuitionInfo.amount - (college.hasSport ? (college.targetProgram?.average_scholarship || 0) : 0));
                    
                    const useScoreMatch = isAthlete && college.athleteMatchScore && college.athleteMatchScore > 0;
                    const { badgeColor, badgeText, badgeSub } = getBadgeDetails(college, selectedSport, !!useScoreMatch, college.athleteMatchScore || 0);

                    const isSaved = savedCollegeIds.has(college.id);
                    const isProcessing = savingIds.has(college.id);
                    
                    // 🚨 REQ CHECK: IF SNEAKY PAYWALL IS ENGAGED AND OVER INDEX 2, DEEP BLUR THE CARDS
                    const isBlurredRow = isLockedProfile && idx > 2;

                    return (
                    <div key={`${matchmakerView}-${college.id}`} className="relative">
                        
                        {/* THE BLUR WRAPPER COMPONENT */}
                        <div className={`flex flex-col xl:flex-row xl:items-center gap-4 p-5 hover:bg-slate-800/60 transition-all group ${isBlurredRow ? 'blur-md opacity-20 pointer-events-none select-none z-0' : ''}`}>
                            
                            <Link 
                                href={`/college/${college.id}?${new URLSearchParams({ ...(selectedSport && { sport: selectedSport }), ...(selectedGender && { gender: selectedGender }) }).toString()}`} 
                                className="flex items-center gap-4 flex-1 min-w-0 group/link"
                            >
                                <span className="w-6 text-slate-600 font-black text-sm italic group-hover/link:text-white transition-colors">#{idx+1}</span>
                                <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center shrink-0">
                                    <School className="w-5 h-5 text-slate-400 group-hover/link:text-white transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-base truncate text-slate-200 group-hover/link:text-white transition-colors flex items-center">
                                        {college.name}
                                        {!college.hasSport && (selectedSport || athleteProfile?.primary_sport) && (
                                            <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-black tracking-widest uppercase ml-2 shrink-0 border border-slate-700">Academic Match Only</span>
                                        )}
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                        {college.city}, {college.state} 
                                        <span className="text-slate-700">•</span>
                                        {college.division}
                                    </p>
                                </div>
                            </Link>

                            <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-4 sm:gap-6 pl-14 xl:pl-0 w-full xl:w-auto mt-2 xl:mt-0">
                                <div className="hidden sm:flex flex-col items-end text-right">
                                    <span className="font-black text-slate-300">{college.acceptance_rate || 'N/A'}</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Acceptance</span>
                                </div>
                                <div className="hidden sm:flex flex-col items-end text-right">
                                    <span className="font-black text-blue-400">{college.median_earnings ? `$${college.median_earnings.toLocaleString()}` : 'N/A'}</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">10-Yr Salary</span>
                                </div>
                                <div className="flex flex-col items-end text-right">
                                    <span className="font-black text-slate-300 flex items-center gap-1">
                                        ${tuitionInfo.amount.toLocaleString()}
                                        {tuitionInfo.isInState && <span className="text-[8px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded uppercase font-black" title="In-State Applied">IN</span>}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Tuition /yr</span>
                                </div>
                                <div className="flex flex-col items-end text-right">
                                    <span className="font-black text-emerald-400">${netCost.toLocaleString()}</span>
                                    <span className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest mt-0.5">Net Cost /yr</span>
                                </div>

                                <div className={`flex flex-col items-center justify-center min-w-[90px] h-[42px] px-2 rounded-xl border shadow-sm shrink-0 ${badgeColor}`}>
                                    <span className={`font-black tracking-widest leading-none text-center ${!college.hasSport ? 'text-[10px]' : (badgeText.length > 5 ? 'text-xs' : 'text-sm')}`}>{badgeText}</span>
                                    <span className="text-[8px] font-bold opacity-70 mt-1 uppercase tracking-widest">{badgeSub}</span>
                                </div>

                                {!isCoach && (
                                    <button
                                        onClick={(e) => toggleSaveCollege(e, college.id)}
                                        disabled={isProcessing}
                                        className={`p-2.5 rounded-xl border transition-all shadow-sm shrink-0 ${
                                            isSaved 
                                                ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                                                : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:text-blue-400 hover:border-blue-500/30 hover:bg-slate-800'
                                        }`}
                                    >
                                        {isProcessing ? (
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 🚨 REQ CHECK: INJECT GORGEOUS INTERACTIVE CONVERSION LOCK BOX DIRECTLY BENEATH ROW #3 */}
                        {idx === 2 && isLockedProfile && (
                           <div className="absolute inset-x-0 bottom-[-280px] h-[280px] bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent flex flex-col items-center justify-end pb-8 z-50 text-center px-4 border-b border-slate-800/60 pointer-events-auto">
                              <Crown className="w-8 h-8 text-amber-400 mb-2 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-bounce" />
                              <h4 className="font-black text-white text-lg sm:text-xl tracking-tight">
                                {isPreLaunch ? "Unlock Early Access Matchmaking" : "Unlock 50+ Top Targeted Programs"}
                              </h4>
                              <p className="text-slate-400 text-xs max-w-sm mt-1 mb-5 font-semibold">
                                {isPreLaunch 
                                    ? "You are viewing the preview tier. Become a Founder to unlock your complete targeted recruitment match matrix list before global launch."
                                    : "You are viewing the preview tier. Upgrade to a ChasedSports Pro account to unlock your complete targeted recruitment match matrix list."
                                }
                              </p>
                              <Link href="/pro" className="bg-gradient-to-r from-amber-500 via-orange-500 to-fuchsia-500 hover:from-amber-400 hover:to-fuchsia-400 text-slate-950 font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all">
                                 {isPreLaunch ? "Claim Founder Access" : "Upgrade to Pro Profile"}
                              </Link>
                           </div>
                        )}
                    </div>
                    );
                })}
            </div>
        </div>
    );
  };

  const renderedCollegeCards = useMemo(() => {
    if (loading || !isInitialized) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-slate-200 h-64 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      );
    }

    if (hasSearched && validUniversities.length === 0) {
      return (
        <div className="text-center py-16 bg-white/60 backdrop-blur-3xl rounded-3xl border border-slate-200 border-dashed shadow-sm">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900">No programs match your exact criteria</h3>
          <p className="text-slate-500 mt-2 font-medium">Try loosening your filters or adjusting your sorting preferences.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {validUniversities.map((uni) => {
          const { amount: tuitionToUse, isInState } = getCalculatedTuition(uni);
          
          let roiMultiplier = null;
          if (uni.median_earnings && tuitionToUse && tuitionToUse > 0) {
            roiMultiplier = (uni.median_earnings / tuitionToUse).toFixed(1);
          }

          const isSaved = savedCollegeIds.has(uni.id);
          const isProcessing = savingIds.has(uni.id);

          return (
            <div key={uni.id} className="bg-white/80 backdrop-blur-2xl rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100/50 flex flex-col h-full hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 group">
              <div className="flex-grow">
                <h3 className="text-xl font-black text-slate-900 leading-tight mb-3 group-hover:text-blue-600 transition-colors flex flex-col items-start gap-2">
                  {uni.name}
                  {!uni.hasSport && (selectedSport || athleteProfile?.primary_sport) && (
                      <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-black tracking-widest uppercase">Academic Match Only</span>
                  )}
                </h3>
                
                <div className="space-y-3 text-sm font-semibold text-slate-600 mb-6">
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center mr-3 shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <span className="truncate">{uni.city ? `${uni.city}, ${uni.state}` : uni.state}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-yellow-50 flex items-center justify-center mr-3 shrink-0">
                      <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                    </div>
                    {uni.division}
                  </div>
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center mr-3 shrink-0">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="flex items-center gap-2">
                        {formatCurrency(tuitionToUse)} <span className="text-xs text-slate-400 font-bold">/yr</span>
                        {isInState && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">In-State</span>}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <Landmark className="w-3 h-3 mr-1" /> Acceptance
                    </div>
                    <div className="font-black text-slate-800">{uni.acceptance_rate || 'N/A'}</div>
                  </div>
                  
                  <div className="bg-green-50/50 rounded-xl p-3 border border-green-100 relative">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center text-[10px] font-bold text-green-600 uppercase tracking-wider">
                        <TrendingUp className="w-3 h-3 mr-1" /> 10-Yr Salary
                      </div>
                      {roiMultiplier && (
                        <span className="text-[10px] font-black bg-green-200 text-green-800 px-1.5 py-0.5 rounded-md shadow-sm" title="Salary compared to Net Cost">
                          {roiMultiplier}x ROI
                        </span>
                      )}
                    </div>
                    <div className="font-black text-green-700">{uni.median_earnings ? formatCurrency(uni.median_earnings) : 'N/A'}</div>
                  </div>
                </div>

                {renderReadinessMeter(uni)}

              </div>
              <div className="mt-5 pt-5 border-t border-slate-100 flex justify-between items-center gap-3">
                <div className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 shrink-0">
                  <BookOpen className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  {uni.majors_offered ? uni.majors_offered.length : 0} Majors
                </div>
                
                <div className="flex items-center gap-2">
                  {(!isCoach) && (
                    <button 
                      onClick={(e) => toggleSaveCollege(e, uni.id)}
                      disabled={isProcessing}
                      className={`p-2 rounded-lg border transition-all shadow-sm ${
                        isSaved 
                          ? 'bg-blue-50 border-blue-200 text-blue-600' 
                          : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-md'
                      }`}
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      )}
                    </button>
                  )}
                  <Link 
                    href={`/college/${uni.id}?${new URLSearchParams({
                      ...(selectedSport && { sport: selectedSport }),
                      ...(selectedGender && { gender: selectedGender })
                    }).toString()}`}
                    className="text-sm font-black text-blue-600 flex items-center px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View Profile 
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [validUniversities, loading, isInitialized, hasSearched, selectedSport, selectedGender, savedCollegeIds, savingIds, isCoach, isAthlete, athleteScore, athleteState, athleteProfile]); 

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-500/30">
      
      {/* 🚨 INLINE ERROR BANNER 🚨 */}
      {errorMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-xl text-red-600 border border-red-200 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm">{errorMsg}</p>
        </div>
      )}

      {/* 🚨 INTERACTIVE REGION SELECTOR MODAL 🚨 */}
      {isMapOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMapOpen(false)}></div>
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/50 rounded-3xl p-6 md:p-8 relative z-10 w-full max-w-4xl shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Target Regions</h3>
                <p className="text-slate-500 text-sm font-medium">Select unlimited states to focus your search ({selectedStates.length})</p>
              </div>
              <button onClick={() => setIsMapOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <div className="w-full overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="grid grid-cols-12 grid-rows-8 gap-1 sm:gap-2 min-w-[600px] mx-auto p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                {US_TILE_MAP.map(state => {
                  const isSelected = selectedStates.includes(state.id);
                  return (
                    <button
                      key={state.id}
                      onClick={() => toggleState(state.id)}
                      style={{ gridColumn: state.col, gridRow: state.row }}
                      className={`aspect-square rounded-md sm:rounded-lg font-black text-[10px] sm:text-xs md:text-sm transition-all border flex items-center justify-center ${
                        isSelected 
                          ? 'bg-gradient-to-br from-blue-600 to-blue-500 border-blue-500 text-white scale-105 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600'
                      }`}
                    >
                      {state.id}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={() => setIsMapOpen(false)} className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-600/30">
              Confirm Regions
            </button>
          </div>
        </div>
      )}

      {/* 🚨 DYNAMIC HERO SECTION 🚨 */}
      <div className="relative bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-950 pt-24 pb-40 md:pb-32 px-4 md:px-8 overflow-hidden rounded-b-[2.5rem] md:rounded-b-[3rem] shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6">
          
          {isAthlete && activeAthleteScore.score > 0 ? (
            <>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-sm font-bold tracking-wide mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <Target className="w-4 h-4 mr-2" />
                {activeAthleteScore.label} Score: {activeAthleteScore.score}
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">{athleteFirstName}</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
                We've activated your personalized Match Meters. Search programs below to instantly calculate your Best Athletic Fit and Lowest Net Cost.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-sm font-bold tracking-wide mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <Flame className="w-4 h-4 mr-2" />
                The Matchmaker is unlocked
              </div>
              <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white">
                Chased<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Sports</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
                Stop guessing. Instantly discover which college programs match your exact criteria for Athletic Caliber, Tuition Budget, and ROI.
              </p>
            </>
          )}

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-24">
        {/* The Control Panel */}
        <div className="relative -mt-10 md:-mt-16 bg-white/70 backdrop-blur-3xl p-5 md:p-8 rounded-3xl md:rounded-[2rem] shadow-xl shadow-blue-900/10 border border-white mb-16 transition-all duration-500 z-20">
          
          {/* --- BASIC SETTINGS (Always Visible) --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Sport</label>
              <select 
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm appearance-none cursor-pointer transition-all"
              >
                <option value="">Any Sport...</option>
                <option value="Baseball">Baseball</option>
                <option value="Basketball">Basketball</option>
                <option value="Bowling">Bowling</option>
                <option value="Cross Country">Cross Country</option>
                <option value="Fencing">Fencing</option>
                <option value="Field Hockey">Field Hockey</option>
                <option value="Football">Football</option>
                <option value="Golf">Golf</option>
                <option value="Gymnastics">Gymnastics</option>
                <option value="Ice Hockey">Ice Hockey</option>
                <option value="Lacrosse">Lacrosse</option>
                <option value="Soccer">Soccer</option>
                <option value="Softball">Softball</option>
                <option value="Swimming and Diving (combined)">Swimming & Diving</option>
                <option value="Tennis">Tennis</option>
                <option value="Track & Field">Track & Field</option>
                <option value="Volleyball">Volleyball</option>
                <option value="Water Polo">Water Polo</option>
                <option value="Wrestling">Wrestling</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Gender</label>
              <select 
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm appearance-none cursor-pointer transition-all"
              >
                <option value="">Any</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Division</label>
              <select 
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm appearance-none cursor-pointer transition-all"
              >
                <option value="">Any Division</option>
                <option value="NCAA D1">NCAA D1</option>
                <option value="NCAA D2">NCAA D2</option>
                <option value="NCAA D3">NCAA D3</option>
                <option value="NAIA">NAIA</option>
                <option value="Community College (JUCO)">Community College (JUCO)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 flex justify-between items-center">
                <span>Regions</span>
                {selectedStates.length > 0 && <span className="text-blue-500">{selectedStates.length}</span>}
              </label>
              <button 
                onClick={() => setIsMapOpen(true)}
                className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm transition-all flex justify-between items-center group"
              >
                <span className="truncate">{selectedStates.length > 0 ? selectedStates.join(', ') : 'Nationwide'}</span>
                <Map className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Field of Study</label>
              <input 
                type="text"
                list="major-options"
                placeholder="e.g. Nursing, Finance..."
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
              />
              <div className="h-4 pl-1">
                {showMajorHint && (
                  <p className="text-[11px] font-bold text-blue-500 animate-pulse">
                    Searching category: {mappedMajor}
                  </p>
                )}
              </div>
              <datalist id="major-options">
                <option value="Agriculture" />
                <option value="Architecture" />
                <option value="Biological & Biomedical Sciences" />
                <option value="Business & Marketing" />
                <option value="Communications & Journalism" />
                <option value="Computer & Information Sciences" />
                <option value="Education" />
                <option value="Engineering" />
                <option value="English Language & Literature" />
                <option value="Health Professions & Nursing" />
                <option value="Homeland Security & Law Enforcement" />
                <option value="Kinesiology & Parks/Recreation" />
                <option value="Legal Professions & Studies" />
                <option value="Mathematics & Statistics" />
                <option value="Physical Sciences" />
                <option value="Psychology" />
                <option value="Social Sciences" />
                <option value="Visual & Performing Arts" />
              </datalist>
            </div>
          </div>

          {/* Toggle for Bonus Settings */}
          <div className="mt-2 flex justify-center lg:justify-start">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors py-2"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
              {showAdvanced ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>
          </div>

          {/* --- BONUS SETTINGS (Advanced) --- */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showAdvanced ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="pt-4 pr-6 pb-2"> 
              <ProGate athleteProfile={athleteProfile} featureName="Advanced Matchmaker Filters">
                
                {/* 🚨 EXPLICIT UI DISCLAIMER FOR FILTER SCOPE 🚨 */}
                <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 rounded-xl p-4 mt-2 mb-4 flex items-start gap-3 shadow-sm animate-in fade-in duration-300">
                   <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                   <div>
                      <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Filter Scope Notice</h4>
                      <p className="text-xs text-amber-600 font-semibold mt-1 leading-relaxed">
                         Advanced thresholds and custom sorting rules apply exclusively to the <span className="font-black text-amber-800">All Programs Directory</span> tab. The Gamified Matchmaker Dashboard utilizes a strict algorithmic override to rank your results.
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-4 border-t border-slate-100/50">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Specific School</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="e.g. Oregon State or Stanford"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl pl-9 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Max Acceptance %</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 pointer-events-none">
                        <Percent className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="number" 
                        placeholder="e.g. 50"
                        value={maxAcceptance}
                        onChange={(e) => setMaxAcceptance(e.target.value)}
                        className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl pl-9 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Max Tuition Cost</label>
                    <div className="flex gap-2">
                      <select 
                        value={tuitionType}
                        onChange={(e) => setTuitionType(e.target.value)}
                        className="w-1/3 bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-2 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-semibold shadow-sm appearance-none cursor-pointer"
                      >
                        <option value="in_state">In-State</option>
                        <option value="out_of_state">Out-State</option>
                      </select>
                      <div className="relative flex items-center w-2/3">
                        <div className="absolute left-3 pointer-events-none">
                          <DollarSign className="h-4 w-4 text-slate-400" />
                        </div>
                        <input 
                          type="number" 
                          placeholder="e.g. 30000"
                          value={maxTuition}
                          onChange={(e) => setMaxTuition(e.target.value)}
                          className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl pl-8 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Sort Results By</label>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm appearance-none cursor-pointer transition-all"
                    >
                      <option value="">Don't Sort</option>
                      
                      <optgroup label="Tuition Cost">
                        <option value="tuition_low">Lowest to Highest</option>
                        <option value="tuition_high">Highest to Lowest</option>
                      </optgroup>

                      <optgroup label="Acceptance Rate">
                        <option value="acceptance_high">Highest to Lowest</option>
                        <option value="acceptance_low">Lowest to Highest</option>
                      </optgroup>

                      <optgroup label="10-Year Salary">
                        <option value="salary_high">Highest to Lowest</option>
                        <option value="salary_low">Lowest to Highest</option>
                      </optgroup>

                      <optgroup label="Sport Budget">
                        <option value="budget_high">Highest to Lowest</option>
                        <option value="budget_low">Lowest to Highest</option>
                      </optgroup>
                    </select>
                  </div>

                </div>
              </ProGate>
            </div>
          </div>

          <div className="mt-6 flex flex-col md:flex-row justify-end gap-4 pt-6 border-t border-slate-100/50">
            {/* RESET BUTTON */}
            <button 
              onClick={handleReset}
              className="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold transition-all text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center border border-transparent hover:border-slate-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </button>
            
            {/* SEARCH BUTTON */}
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="w-full md:w-auto group bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white px-10 py-3.5 rounded-xl font-black transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              {loading ? 'Scanning Database...' : (
                <>
                  <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Search Programs
                </>
              )}
            </button>
          </div>
        </div>

        {/* --- DYNAMIC CONTENT BLOCKS --- */}
        {!hasSearched ? (
          
          <div className="bg-white/60 backdrop-blur-3xl border border-slate-200/50 rounded-[2.5rem] p-8 md:p-16 text-center shadow-sm relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none"></div>
            <Crown className="w-16 h-16 text-blue-500 mx-auto mb-6 relative z-10" />
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 relative z-10 tracking-tight">The Matchmaker Engine</h3>
            <p className="text-slate-500 max-w-xl mx-auto font-medium text-lg relative z-10 mb-8">
              Set your parameters above and hit search to instantly filter hundreds of schools and discover the <span className="text-slate-900 font-bold">Top Tier Programs</span>, <span className="text-slate-900 font-bold">Lowest Net Cost</span>, and <span className="text-slate-900 font-bold">Highest ROI</span> matches.
            </p>
          </div>

        ) : (
          <div>
            
            {/* 🚨 REQ: RE-ENGINEERED HIGH-CONTRAST MAIN NAVIGATION TAB OVERLAY BAR 🚨 */}
            {hasSearched && !errorMsg && (
                <div className="mb-10 flex justify-center animate-in fade-in duration-500">
                    <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-2 inline-flex shadow-2xl items-center gap-3">
                        <button
                            onClick={() => setActiveTab('personalized')}
                            className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center ${activeTab === 'personalized' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xl shadow-blue-500/10' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Zap className={`w-4 h-4 mr-2 ${activeTab === 'personalized' ? 'text-amber-300' : 'text-amber-500'}`} />
                            Matchmaker Dashboard
                        </button>
                        
                        {/* THE PROMINENT DIRECTORY INTERCEPT BUTTON WRAPPER */}
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-7 py-3 rounded-xl text-sm font-black transition-all flex items-center relative overflow-hidden border ${
                              activeTab === 'all' 
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white shadow-xl shadow-emerald-500/20 scale-[1.03]' 
                                : 'bg-gradient-to-r from-blue-950 to-indigo-950/60 border-blue-500/40 hover:border-blue-400 text-blue-400 hover:text-blue-300 hover:scale-[1.02] shadow-lg'
                            }`}
                        >
                            <School className="w-4 h-4 mr-2" />
                            All 800+ Programs Directory
                            
                            {/* Pulsing Alert Indicator Ring to eliminate button overlook */}
                            <span className="absolute top-2 right-2 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: MATCHMAKER */}
            {activeTab === 'personalized' && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 mb-16 space-y-6">
                    
                    {/* SUB-NAVIGATION CATEGORIES W/ TOGGLE INTERCEPTOR BAR */}
                    <div className="bg-white/40 backdrop-blur-md p-3 rounded-2xl border border-slate-200/60 flex flex-col lg:flex-row justify-between items-center gap-4">
                        <div className="flex flex-wrap gap-2">
                            <button 
                                onClick={() => setMatchmakerView('fit')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center border ${matchmakerView === 'fit' ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-purple-200 hover:text-purple-600'}`}
                            >
                                <Target className="w-4 h-4 mr-2" />
                                Best Fit
                            </button>
                            <button 
                                onClick={() => setMatchmakerView('cost')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center border ${matchmakerView === 'cost' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-200 hover:text-emerald-600'}`}
                            >
                                <Wallet className="w-4 h-4 mr-2" />
                                Lowest Cost
                            </button>
                            <button 
                                onClick={() => setMatchmakerView('salary')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center border ${matchmakerView === 'salary' ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-600'}`}
                            >
                                <Briefcase className="w-4 h-4 mr-2" />
                                Top Salary
                            </button>
                            <button 
                                onClick={() => setMatchmakerView('funding')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center border ${matchmakerView === 'funding' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-yellow-200 hover:text-yellow-600'}`}
                            >
                                <Award className="w-4 h-4 mr-2" />
                                Best Funded
                            </button>
                            <button 
                                onClick={() => setMatchmakerView('roi')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center border ${matchmakerView === 'roi' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-200 hover:text-amber-600'}`}
                            >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Best ROI
                            </button>
                        </div>

                        {/* GLOWING TOGGLE SWITCH TO FILTER OUT ACADEMIC ONLY MATCHES */}
                        <div className="shrink-0">
                           <button 
                             onClick={() => setHideAcademicOnly(!hideAcademicOnly)}
                             className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border-2 ${
                               hideAcademicOnly 
                                 ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]' 
                                 : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700'
                             }`}
                           >
                             {hideAcademicOnly ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                             {hideAcademicOnly ? 'Hiding Academic Only' : 'Show All Programs'}
                           </button>
                        </div>
                    </div>

                    {/* DYNAMIC LIST RENDERER */}
                    {renderMatchmakerList()}

                </div>
            )}

            {/* TAB CONTENT: ALL PROGRAMS (STANDARD RESULTS GRID) */}
            {activeTab === 'all' && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                    {renderedCollegeCards}
                </div>
            )}

          </div>
        )}

      </div>
    </main>
  );
}