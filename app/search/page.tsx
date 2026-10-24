// app/search/page.tsx
'use client';

import React, { useEffect, useState, useMemo, Suspense, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import * as RecruitingStandardsModule from '@/utils/constants/RecruitingStandards';
import { 
  MapPin, Trophy, Search, Activity, ChevronRight, BookOpen, 
  TrendingUp, Landmark, SlidersHorizontal, ChevronDown, 
  ChevronUp, DollarSign, Percent, Award, RotateCcw, Bookmark, 
  RefreshCw, Target, Zap, AlertCircle, Map, X, Crown, 
  Eye, EyeOff, Flame, Briefcase, Wallet, FolderHeart, Plus, Trash2, Sparkles, Scale, Check, Mail, HelpCircle
} from 'lucide-react';
import Link from 'next/link';

// --- STAT-BASED VS NON-STAT-BASED (TEAM) SPORTS ---
const ALL_SPORTS = [
  { value: 'Baseball', label: 'Baseball' },
  { value: 'Basketball', label: 'Basketball' },
  { value: 'Bowling', label: 'Bowling' },
  { value: 'Cross Country', label: 'Cross Country' },
  { value: 'Fencing', label: 'Fencing' },
  { value: 'Field Hockey', label: 'Field Hockey' },
  { value: 'Football', label: 'Football' },
  { value: 'Golf', label: 'Golf' },
  { value: 'Gymnastics', label: 'Gymnastics' },
  { value: 'Ice Hockey', label: 'Ice Hockey' },
  { value: 'Lacrosse', label: 'Lacrosse' },
  { value: 'Soccer', label: 'Soccer' },
  { value: 'Softball', label: 'Softball' },
  { value: 'Swimming and Diving (combined)', label: 'Swimming & Diving' },
  { value: 'Tennis', label: 'Tennis' },
  { value: 'Track & Field', label: 'Track & Field' },
  { value: 'Volleyball', label: 'Volleyball' },
  { value: 'Water Polo', label: 'Water Polo' },
  { value: 'Wrestling', label: 'Wrestling' },
];

const ALL_DIVISIONS = [
  { value: 'NCAA D1', label: 'NCAA Division 1 (D1)' },
  { value: 'NCAA D2', label: 'NCAA Division 2 (D2)' },
  { value: 'NCAA D3', label: 'NCAA Division 3 (D3)' },
  { value: 'NAIA', label: 'NAIA' },
  { value: 'Community College (JUCO)', label: 'NJCAA / JUCO' },
];

const STAT_BASED_SPORTS = new Set([
  'track & field',
  'trackandfield',
  'cross country',
  'crosscountry',
  'swimming and diving (combined)',
  'swimming & diving',
  'swimminganddivingcombined',
  'swimminganddiving',
  'golf',
  'bowling',
  'gymnastics',
]);

const normalizeSport = (s: string) => s.toLowerCase().replace(/ and /g, ' & ').replace(/[^a-z0-9]/g, '');

const isStatBasedSport = (sportName?: string | null): boolean => {
  if (!sportName) return false;
  const trimmed = sportName.toLowerCase().trim();
  const normalized = normalizeSport(sportName);
  return STAT_BASED_SPORTS.has(trimmed) || STAT_BASED_SPORTS.has(normalized);
};

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

// --- TRACK & FIELD STANDARDS IMPORT & CALCULATOR ---
type StandardTier = {
  t1: number;
  t2: number;
  t3: number;
  t4: number;
  t5: number;
  t6: number;
  t7: number;
  isField?: boolean;
  text?: string;
};

const RECRUITING_STANDARDS: Record<string, Record<string, StandardTier>> =
  (RecruitingStandardsModule as any).RECRUITING_STANDARDS ||
  (RecruitingStandardsModule as any).default ||
  {};

const convertMarkToNumber = (markStr: string, isField: boolean): number => {
  if (typeof (RecruitingStandardsModule as any).convertMarkToNumber === 'function') {
    return (RecruitingStandardsModule as any).convertMarkToNumber(markStr, isField);
  }
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

const getAthleteProjection = (prs: any[], gender: string): { overallScore: number } => {
  if (typeof (RecruitingStandardsModule as any).getAthleteProjection === 'function') {
    return (RecruitingStandardsModule as any).getAthleteProjection(prs, gender);
  }
  if (!prs || !Array.isArray(prs) || prs.length === 0) {
    return { overallScore: 0 };
  }

  const standards = RECRUITING_STANDARDS[gender] || RECRUITING_STANDARDS['Boys'] || {};
  const allBreakdowns: { score: number }[] = [];

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

// --- COMPOSITE ACADEMIC & 10-YEAR SALARY SCORE ---
const getAcademicAndSalaryScore = (uni: University): number => {
  const salary = uni.median_earnings || 0;
  const rawAcc = parseFloat(uni.acceptance_rate?.replace('%', '') || '100');
  const clampedAcc = isNaN(rawAcc) ? 100 : Math.min(100, Math.max(1, rawAcc));
  const selectivityBonus = (100 - clampedAcc) * 350;
  return salary > 0 ? salary + selectivityBonus : selectivityBonus * 0.25;
};

interface University {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  division: string;
  student_population?: string;
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

type MatchmakerCategory = 'fit' | 'cost' | 'salary' | 'funding' | 'roi';

interface SavedSearchPreset {
  id: string;
  name: string;
  schoolName: string;
  selectedSport: string;
  selectedGender: string;
  selectedDivision: string;
  selectedStates: string[];
  selectedMajor: string;
  maxAcceptance: string;
  tuitionType: string;
  maxTuition: string;
  sortBy: string;
  activeBonusFilter: MatchmakerCategory | null;
  hideAcademicOnly: boolean;
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

const PAGE_SIZE = 24;
const BASE_SITE_URL = 'https://chasedsports.com';

function formatCurrency(num: number | null | undefined) {
  if (!num) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

const extractTrackPrs = (sports: any) => {
  if (!Array.isArray(sports)) return [];
  const track = sports?.find((s: any) => s.sport_name === 'Track & Field');
  if (!track || !track.metrics) return [];

  let parsed = track.metrics;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { parsed = []; }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((m: any) => ({ event: m.name, mark: m.value }));
};

function SearchContent() {
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // --- Infinite Scroll Pagination State ---
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // --- Matchmaker Filters ---
  const [activeBonusFilter, setActiveBonusFilter] = useState<MatchmakerCategory | null>(null);
  const [hideAcademicOnly, setHideAcademicOnly] = useState(false);

  // --- Side by Side Comparison State ---
  const [sideBySideList, setSideBySideList] = useState<University[]>([]);
  const [isSideBySideOpen, setIsSideBySideOpen] = useState(false);

  // --- Auth & Target Schools States ---
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [athleteProfile, setAthleteProfile] = useState<any>(null);
  const [isAthlete, setIsAthlete] = useState<boolean>(false);
  const [athleteFirstName, setAthleteFirstName] = useState<string>('');
  const [athleteGender, setAthleteGender] = useState<string>('');
  const [athleteState, setAthleteState] = useState<string>('');

  const [savedCollegeIds, setSavedCollegeIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  // --- Saved Search Presets State ---
  const [savedSearches, setSavedSearches] = useState<SavedSearchPreset[]>([]);
  const [isSavingSearch, setIsSavingSearch] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');

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

  // --- STABILITY FIX: Keep latest filter values in a ref so executeSearch is 100% stable ---
  const latestFiltersRef = useRef({
    selectedSport,
    schoolName,
    selectedGender,
    selectedDivision,
    selectedStates,
    selectedMajor,
  });

  useEffect(() => {
    latestFiltersRef.current = {
      selectedSport,
      schoolName,
      selectedGender,
      selectedDivision,
      selectedStates,
      selectedMajor,
    };
  }, [selectedSport, schoolName, selectedGender, selectedDivision, selectedStates, selectedMajor]);

  const showNotification = useCallback((msg: string, isError = true) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4500);
    } else {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(null), 3500);
    }
  }, []);

  // 1. Load User, Athlete Sports & Saved Searches
  const hasFetchedProfile = useRef(false);

  useEffect(() => {
    async function fetchUserAndSaves() {
      if (hasFetchedProfile.current) return;
      hasFetchedProfile.current = true;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const uid = session.user.id;
        setCurrentUserId(uid);

        try {
          const rawSavedSearches = localStorage.getItem(`chasedSports_savedSearches_${uid}`);
          if (rawSavedSearches) {
            setSavedSearches(JSON.parse(rawSavedSearches));
          }
        } catch {
          // Ignore localStorage read errors
        }

        const { data: athleteData } = await supabase
          .from('athletes')
          .select('id, first_name, gender, state, is_premium, is_founder, primary_sport')
          .eq('id', uid)
          .maybeSingle();

        if (athleteData) {
          setIsAthlete(true);
          setAthleteFirstName(athleteData.first_name);
          setAthleteGender(athleteData.gender || 'Boys');
          if (athleteData.state) setAthleteState(athleteData.state);

          const { data: sportsData } = await supabase
            .from('athlete_sports')
            .select('sport_name, metrics, custom_fit_score')
            .eq('athlete_id', uid);

          setAthleteProfile({ ...athleteData, athlete_sports: sportsData || [] });

          const { data, error } = await supabase
            .from('saved_colleges')
            .select('college_id')
            .eq('athlete_id', uid);

          if (!error && data) {
            setSavedCollegeIds(new Set(data.map((d: { college_id: string }) => d.college_id)));
          }
        }
      }
    }
    fetchUserAndSaves();
  }, [supabase]);

  // --- EXTRACT ATHLETE'S SELECTED SPORTS FROM athlete_sports TABLE ---
  const athleteSelectedSports = useMemo<string[]>(() => {
    if (!isAthlete || !athleteProfile) return [];
    const sportsSet = new Set<string>();

    if (Array.isArray(athleteProfile.athlete_sports)) {
      athleteProfile.athlete_sports.forEach((row: any) => {
        if (row?.sport_name && typeof row.sport_name === 'string') {
          sportsSet.add(row.sport_name.trim());
        }
      });
    }

    if (athleteProfile.primary_sport && typeof athleteProfile.primary_sport === 'string') {
      sportsSet.add(athleteProfile.primary_sport.trim());
    }

    return Array.from(sportsSet);
  }, [isAthlete, athleteProfile]);

  // --- O(1) PRE-COMPUTED ATHLETE SCORES BY SPORT (STAT-BASED SPORTS ONLY) ---
  const athleteScoresBySport = useMemo(() => {
    const map: Record<string, number> = {};
    if (!isAthlete || !athleteProfile) return map;

    const sportsList = athleteProfile.athlete_sports || [];
    const prs = extractTrackPrs(sportsList);
    const trackScore = getAthleteProjection(prs, athleteGender || 'Boys').overallScore;

    if (trackScore > 0) {
      map['Track & Field'] = trackScore;
      map[normalizeSport('Track & Field')] = trackScore;
    }

    sportsList.forEach((s: any) => {
      if (
        s.sport_name &&
        s.sport_name !== 'Track & Field' &&
        isStatBasedSport(s.sport_name) &&
        s.custom_fit_score
      ) {
        map[s.sport_name] = s.custom_fit_score;
        map[normalizeSport(s.sport_name)] = s.custom_fit_score;
      }
    });

    return map;
  }, [isAthlete, athleteProfile, athleteGender]);

  // --- DETERMINE CURRENT EFFECTIVE SPORT & WHETHER IT IS STAT-BASED ---
  const effectiveSport = useMemo(() => {
    if (selectedSport) return selectedSport;
    if (athleteSelectedSports.length > 0) return athleteSelectedSports[0];
    return '';
  }, [selectedSport, athleteSelectedSports]);

  const isCurrentSportStatBased = useMemo(() => {
    if (!effectiveSport) return false;
    return isStatBasedSport(effectiveSport);
  }, [effectiveSport]);

  // Automatically clear 'fit' bonus filter if user switches to a non-stat-based team sport
  useEffect(() => {
    if (!isCurrentSportStatBased && activeBonusFilter === 'fit') {
      setActiveBonusFilter(null);
    }
  }, [isCurrentSportStatBased, activeBonusFilter]);

  // --- DYNAMIC HERO SCORE LOGIC ---
  const activeAthleteScore = useMemo(() => {
    if (!isAthlete || !athleteProfile || !effectiveSport) {
      return { score: 0, label: '', isStatBased: false };
    }
    const statBased = isStatBasedSport(effectiveSport);
    if (!statBased) {
      return { score: 0, label: effectiveSport, isStatBased: false };
    }
    const score =
      athleteScoresBySport[effectiveSport] ||
      athleteScoresBySport[normalizeSport(effectiveSport)] ||
      0;
    return { score, label: effectiveSport, isStatBased: true };
  }, [effectiveSport, athleteProfile, isAthlete, athleteScoresBySport]);

  // --- CHECK IF ANY USER FILTER IS ACTIVE ---
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      selectedSport ||
      schoolName ||
      selectedGender ||
      selectedDivision ||
      selectedStates.length > 0 ||
      selectedMajor ||
      maxAcceptance ||
      maxTuition ||
      sortBy ||
      activeBonusFilter
    );
  }, [
    selectedSport,
    schoolName,
    selectedGender,
    selectedDivision,
    selectedStates.length,
    selectedMajor,
    maxAcceptance,
    maxTuition,
    sortBy,
    activeBonusFilter
  ]);

  // --- CORE SEARCH EXECUTION (Zero-Friction: Supports Default Unfiltered Load) ---
  const executeSearch = useCallback(async (overrides?: Partial<SavedSearchPreset>) => {
    setErrorMsg(null);
    const current = latestFiltersRef.current;

    const sSchool = overrides?.schoolName !== undefined ? overrides.schoolName : current.schoolName;
    const sDivision = overrides?.selectedDivision !== undefined ? overrides.selectedDivision : current.selectedDivision;
    const sStates = overrides?.selectedStates !== undefined ? overrides.selectedStates : current.selectedStates;
    const sMajor = overrides?.selectedMajor !== undefined ? overrides.selectedMajor : current.selectedMajor;

    setLoading(true);
    setHasSearched(true);
    setVisibleCount(PAGE_SIZE);

    const selectString = `*, programs(sport, gender, operating_expense, team_performance_rating, average_scholarship)`;
    let query = supabase.from('universities').select(selectString);

    if (sSchool) query = query.ilike('name', `%${sSchool}%`);
    if (sDivision) query = query.eq('division', sDivision);
    if (sStates.length > 0) query = query.in('state', sStates);
    if (sMajor) {
      const searchMajor = getUmbrellaMajor(sMajor);
      query = query.contains('majors_offered', [searchMajor]);
    }

    // Order by 10-year median salary descending at DB level so top academic/earning universities are always included
    const { data, error } = await query
      .order('median_earnings', { ascending: false, nullsFirst: false })
      .limit(800);

    if (error) {
      console.error('Database Error:', error.message);
      showNotification("An error occurred while scanning the database. Please try again.");
      setUniversities([]);
    } else {
      setUniversities(data as unknown as University[]);
    }

    setLoading(false);
  }, [supabase, showNotification]);

  // --- 2. Load Initial State & Listen to URL Query Param Changes (SEO Deep-Linking + Zero-Friction Default) ---
  const hasHydratedState = useRef(false);

  useEffect(() => {
    const urlSport = searchParams?.get('sport') || '';
    const urlDivision = searchParams?.get('division') || '';
    const urlState = searchParams?.get('state') || '';
    const urlMajor = searchParams?.get('major') || '';
    const urlSchool = searchParams?.get('school') || '';

    if (urlSport || urlDivision || urlState || urlMajor || urlSchool) {
      const statesArr = urlState ? urlState.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [];
      setSelectedSport(urlSport);
      setSelectedDivision(urlDivision);
      setSelectedStates(statesArr);
      setSelectedMajor(urlMajor);
      setSchoolName(urlSchool);
      if (urlSport) setHideAcademicOnly(true);
      executeSearch({
        selectedSport: urlSport,
        selectedDivision: urlDivision,
        selectedStates: statesArr,
        selectedMajor: urlMajor,
        schoolName: urlSchool,
      });
      hasHydratedState.current = true;
      setIsInitialized(true);
      return;
    }

    if (hasHydratedState.current) return;
    hasHydratedState.current = true;

    let restoredResultsCount = 0;

    try {
      const savedFilters = sessionStorage.getItem('chasedSportsFilters');
      const savedResults = sessionStorage.getItem('chasedSportsResults');

      if (savedFilters) {
        const f = JSON.parse(savedFilters);
        setSchoolName(f.schoolName || '');
        setSelectedSport(f.selectedSport || '');
        setSelectedGender(f.selectedGender || '');
        setSelectedDivision(f.selectedDivision || '');
        setSelectedStates(Array.isArray(f.selectedStates) ? f.selectedStates : []);
        setSelectedMajor(f.selectedMajor || '');
        setMaxAcceptance(f.maxAcceptance || '');
        setTuitionType(f.tuitionType || 'in_state');
        setMaxTuition(f.maxTuition || '');
        setSortBy(f.sortBy || '');
        setHasSearched(Boolean(f.hasSearched));
        setShowAdvanced(Boolean(f.showAdvanced));
        setHideAcademicOnly(Boolean(f.hideAcademicOnly));
        setActiveBonusFilter(f.activeBonusFilter || null);
      }

      if (savedResults) {
        const parsed = JSON.parse(savedResults);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUniversities(parsed);
          setHasSearched(true);
          restoredResultsCount = parsed.length;
        }
      }

      const savedSideBySide = sessionStorage.getItem('chasedSportsSideBySide');
      if (savedSideBySide) {
        setSideBySideList(JSON.parse(savedSideBySide));
      }
    } catch {
      // Ignore corrupted storage
    } finally {
      setIsInitialized(true);
      if (restoredResultsCount === 0) {
        executeSearch({
          selectedSport: '',
          schoolName: '',
          selectedGender: '',
          selectedDivision: '',
          selectedStates: [],
          selectedMajor: '',
        });
      }
    }
  }, [searchParams, executeSearch]);

  // --- SEO DYNAMIC DOCUMENT TITLE ---
  useEffect(() => {
    if (!isInitialized) return;
    const parts: string[] = [];
    if (selectedDivision) parts.push(selectedDivision);
    if (selectedSport) parts.push(selectedSport);
    else parts.push('Top Academic & Highest 10-Year Salary College Athletic');
    parts.push('Programs & Scholarships');
    if (selectedStates.length > 0) parts.push(`in ${selectedStates.slice(0, 3).join(', ')}`);
    if (selectedMajor) parts.push(`for ${selectedMajor}`);
    document.title = `${parts.join(' ')} | ChasedSports College Finder`;
  }, [isInitialized, selectedDivision, selectedSport, selectedStates, selectedMajor]);

  // --- SAFE SESSION STORAGE CACHING ---
  useEffect(() => {
    if (!isInitialized) return;
    try {
      const filters = {
        schoolName, selectedSport, selectedGender, selectedDivision, selectedStates,
        selectedMajor, maxAcceptance, tuitionType, maxTuition, sortBy, hasSearched, showAdvanced, hideAcademicOnly, activeBonusFilter
      };
      sessionStorage.setItem('chasedSportsFilters', JSON.stringify(filters));
    } catch {
      // Ignore quota exceeded errors
    }
  }, [isInitialized, schoolName, selectedSport, selectedGender, selectedDivision, selectedStates, selectedMajor, maxAcceptance, tuitionType, maxTuition, sortBy, hasSearched, showAdvanced, activeBonusFilter, hideAcademicOnly]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      const compactUniversities = universities.map(u => ({
        id: u.id,
        slug: u.slug,
        name: u.name,
        city: u.city,
        state: u.state,
        division: u.division,
        majors_offered: u.majors_offered,
        acceptance_rate: u.acceptance_rate,
        median_earnings: u.median_earnings,
        tuition_in_state: u.tuition_in_state,
        tuition_out_of_state: u.tuition_out_of_state,
        tuition: u.tuition,
        programs: u.programs
      }));
      sessionStorage.setItem('chasedSportsResults', JSON.stringify(compactUniversities));
    } catch {
      // Fallback if 800 schools exceed sessionStorage quota
    }
  }, [isInitialized, universities]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      sessionStorage.setItem('chasedSportsSideBySide', JSON.stringify(sideBySideList));
    } catch {
      // Ignore quota errors
    }
  }, [isInitialized, sideBySideList]);

  // Reset pagination whenever filters or sort change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [universities, maxAcceptance, maxTuition, tuitionType, sortBy, activeBonusFilter, selectedSport, selectedGender, hideAcademicOnly]);

  const toggleState = (stateCode: string) => {
    setSelectedStates(prev =>
      prev.includes(stateCode) ? prev.filter(s => s !== stateCode) : [...prev, stateCode]
    );
  };

  const toggleBonusFilter = (filter: MatchmakerCategory) => {
    setActiveBonusFilter(prev => (prev === filter ? null : filter));
  };

  // --- ACTION: TOGGLE SIDE BY SIDE ---
  const toggleSideBySide = useCallback((e: React.MouseEvent, uni: University) => {
    e.preventDefault();
    e.stopPropagation();

    setSideBySideList(prev => {
      const exists = prev.some(item => item.id === uni.id);
      if (exists) {
        const next = prev.filter(item => item.id !== uni.id);
        if (next.length === 0) setIsSideBySideOpen(false);
        return next;
      }
      if (prev.length >= 3) {
        showNotification("You can compare up to 3 programs at a time in Side by Side.");
        return prev;
      }
      return [...prev, uni];
    });
  }, [showNotification]);

  // --- ACTION: SAVE COLLEGE ---
  const toggleSaveCollege = async (e: React.MouseEvent, collegeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      showNotification("Create a free athlete account to start saving target schools to your dashboard.");
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
      showNotification("Failed to update saved schools. Please try again.");
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(collegeId);
        return next;
      });
    }
  };

  // --- SAVED SEARCHES MANAGEMENT ---
  const handleSaveCurrentSearch = () => {
    if (!currentUserId) {
      showNotification("Log in to save custom filter presets to your account.");
      return;
    }
    if (!selectedSport && !schoolName && !selectedGender && !selectedDivision && selectedStates.length === 0 && !selectedMajor) {
      showNotification("Select at least one filter before saving a preset.");
      return;
    }
    const trimmed = newSearchName.trim();
    if (!trimmed) {
      showNotification("Please enter a name for your saved search.");
      return;
    }

    const newPreset: SavedSearchPreset = {
      id: Date.now().toString(),
      name: trimmed,
      schoolName,
      selectedSport,
      selectedGender,
      selectedDivision,
      selectedStates,
      selectedMajor,
      maxAcceptance,
      tuitionType,
      maxTuition,
      sortBy,
      activeBonusFilter,
      hideAcademicOnly
    };

    const updated = [newPreset, ...savedSearches].slice(0, 10);
    setSavedSearches(updated);
    setNewSearchName('');
    setIsSavingSearch(false);

    try {
      localStorage.setItem(`chasedSports_savedSearches_${currentUserId}`, JSON.stringify(updated));
      showNotification(`Saved "${trimmed}" preset!`, false);
    } catch {
      // Ignore storage error
    }
  };

  const applySavedSearch = (preset: SavedSearchPreset) => {
    const safeBonus =
      preset.activeBonusFilter === 'fit' && !isStatBasedSport(preset.selectedSport || effectiveSport)
        ? null
        : preset.activeBonusFilter;

    setSchoolName(preset.schoolName);
    setSelectedSport(preset.selectedSport);
    setSelectedGender(preset.selectedGender);
    setSelectedDivision(preset.selectedDivision);
    setSelectedStates(preset.selectedStates);
    setSelectedMajor(preset.selectedMajor);
    setMaxAcceptance(preset.maxAcceptance);
    setTuitionType(preset.tuitionType);
    setMaxTuition(preset.maxTuition);
    setSortBy(preset.sortBy);
    setActiveBonusFilter(safeBonus);
    setHideAcademicOnly(preset.hideAcademicOnly);

    executeSearch(preset);
  };

  const deleteSavedSearch = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    if (currentUserId) {
      try {
        localStorage.setItem(`chasedSports_savedSearches_${currentUserId}`, JSON.stringify(updated));
      } catch {
        // Ignore storage error
      }
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
    setHideAcademicOnly(false);
    setActiveBonusFilter(null);
    setErrorMsg(null);
    setVisibleCount(PAGE_SIZE);
    try {
      sessionStorage.removeItem('chasedSportsFilters');
      sessionStorage.removeItem('chasedSportsResults');
    } catch {
      // Ignore storage error
    }
    executeSearch({
      selectedSport: '',
      schoolName: '',
      selectedGender: '',
      selectedDivision: '',
      selectedStates: [],
      selectedMajor: '',
    });
  };

  const mappedMajor = getUmbrellaMajor(selectedMajor);
  const showMajorHint = selectedMajor.length > 2 && mappedMajor.toLowerCase() !== selectedMajor.toLowerCase();
  const isCoach = Boolean(currentUserId && !isAthlete);

  // --- HELPER: GET CALCULATED TUITION ---
  const getCalculatedTuition = useCallback((uni: University) => {
    if (!uni) return { amount: 0, isInState: false };
    const isHomeState = Boolean(athleteState && uni.state === athleteState);
    let amount = uni.tuition_out_of_state || uni.tuition || 0;

    if (isHomeState && uni.tuition_in_state) {
      amount = uni.tuition_in_state;
    } else if (isHomeState && uni.tuition) {
      amount = uni.tuition;
    }
    return { amount, isInState: isHomeState };
  }, [athleteState]);

  // --- HELPER: BUILD EMAIL BUILDER DEEP LINK ---
  const getEmailBuilderHref = useCallback((uni: University) => {
    const sportParam = uni.targetProgram?.sport || effectiveSport || '';
    const params = new URLSearchParams({
      college: uni.name,
      slug: uni.slug,
      ...(sportParam && { sport: sportParam }),
      ...(uni.division && { division: uni.division }),
    });
    return `/dashboard/email-builder?${params.toString()}`;
  }, [effectiveSport]);

  // --- SHARED UNIVERSITY ENRICHMENT HELPER ---
  const enrichUniversity = useCallback((uni: University): University => {
    const normSearchSport = effectiveSport ? normalizeSport(effectiveSport) : '';

    const searchGenderStr = selectedGender ? selectedGender.toLowerCase() : (isAthlete && athleteGender ? athleteGender.toLowerCase() : '');
    let targetGender = '';
    if (searchGenderStr === 'men' || searchGenderStr === 'boys') targetGender = 'men';
    if (searchGenderStr === 'women' || searchGenderStr === 'girls') targetGender = 'women';

    let targetProgram = null;
    let hasSport = true;
    let athleteMatchScore = 0;

    if (normSearchSport) {
      targetProgram = uni.programs?.find(p => {
        const normDb = normalizeSport(p.sport || '');
        if (!normDb.includes(normSearchSport) && !normSearchSport.includes(normDb)) return false;

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

    if (isAthlete && hasSport && targetProgram?.sport && isStatBasedSport(targetProgram.sport)) {
      const progSport = targetProgram.sport;
      athleteMatchScore =
        athleteScoresBySport[progSport] ||
        athleteScoresBySport[normalizeSport(progSport)] ||
        0;
    }

    return { ...uni, targetProgram, hasSport, athleteMatchScore };
  }, [effectiveSport, selectedGender, isAthlete, athleteGender, athleteScoresBySport]);

  // --- OPTIMIZED FILTER & SORT LOGIC ---
  const sortedAndFilteredUniversities = useMemo(() => {
    let processed = universities.map(enrichUniversity);

    if (hideAcademicOnly && effectiveSport) {
      processed = processed.filter(uni => uni.hasSport);
    }

    const filtered = processed.filter((uni) => {
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

    if (activeBonusFilter) {
      filtered.sort((a, b) => {
        if (activeBonusFilter === 'fit' && isCurrentSportStatBased) {
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
        }
        if (activeBonusFilter === 'cost') {
          const costA = getCalculatedTuition(a).amount || Number.MAX_SAFE_INTEGER;
          const scholA = a.hasSport ? (a.targetProgram?.average_scholarship || 0) : 0;
          const costB = getCalculatedTuition(b).amount || Number.MAX_SAFE_INTEGER;
          const scholB = b.hasSport ? (b.targetProgram?.average_scholarship || 0) : 0;
          return Math.max(0, costA - scholA) - Math.max(0, costB - scholB);
        }
        if (activeBonusFilter === 'salary') {
          return (b.median_earnings || 0) - (a.median_earnings || 0);
        }
        if (activeBonusFilter === 'funding') {
          return (b.targetProgram?.operating_expense || 0) - (a.targetProgram?.operating_expense || 0);
        }
        if (activeBonusFilter === 'roi') {
          const costA = getCalculatedTuition(a).amount || 1;
          const scholA = a.hasSport ? (a.targetProgram?.average_scholarship || 0) : 0;
          const netA = Math.max(1, costA - scholA);
          const costB = getCalculatedTuition(b).amount || 1;
          const scholB = b.hasSport ? (b.targetProgram?.average_scholarship || 0) : 0;
          const netB = Math.max(1, costB - scholB);
          return ((b.median_earnings || 0) / netB) - ((a.median_earnings || 0) / netA);
        }
        return 0;
      });
    } else if (sortBy) {
      filtered.sort((a, b) => {
        if (sortBy === 'rating_high') {
          const ratingA = a.hasSport ? getCalculatedRating(a, a.targetProgram) : 0;
          const ratingB = b.hasSport ? getCalculatedRating(b, b.targetProgram) : 0;
          if (ratingA !== ratingB) return ratingB - ratingA;
          return (b.median_earnings || 0) - (a.median_earnings || 0);
        }
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
      // DEFAULT RANKING: Best Colleges for Academics & Highest 10-Year Median Salary
      filtered.sort((a, b) => {
        if (selectedSport) {
          if (a.hasSport && !b.hasSport) return -1;
          if (!a.hasSport && b.hasSport) return 1;
        }

        const scoreA = getAcademicAndSalaryScore(a);
        const scoreB = getAcademicAndSalaryScore(b);
        if (scoreB !== scoreA) return scoreB - scoreA;

        const salaryDiff = (b.median_earnings || 0) - (a.median_earnings || 0);
        if (salaryDiff !== 0) return salaryDiff;

        const accA = parseFloat(a.acceptance_rate?.replace('%', '') || '100');
        const accB = parseFloat(b.acceptance_rate?.replace('%', '') || '100');
        return accA - accB;
      });
    }
    return filtered;
  }, [
    universities,
    enrichUniversity,
    effectiveSport,
    selectedSport,
    isCurrentSportStatBased,
    maxAcceptance,
    maxTuition,
    tuitionType,
    sortBy,
    activeBonusFilter,
    hideAcademicOnly,
    getCalculatedTuition
  ]);

  // --- ENRICHED SIDE BY SIDE DATA & WINNER CALCULATIONS ---
  const enrichedSideBySide = useMemo(() => {
    return sideBySideList.map(uni => {
      const enriched = enrichUniversity(uni);
      const { amount: tuition, isInState } = getCalculatedTuition(enriched);
      const scholarship = enriched.hasSport ? (enriched.targetProgram?.average_scholarship || 0) : 0;
      const netCost = tuition > 0 ? Math.max(0, tuition - scholarship) : 0;
      const netCostForRoi = tuition > 0 ? Math.max(1, tuition - scholarship) : 0;
      const salary = enriched.median_earnings || 0;
      const roi = salary > 0 && netCostForRoi > 0 ? Number((salary / netCostForRoi).toFixed(1)) : 0;
      const budget = enriched.hasSport ? (enriched.targetProgram?.operating_expense || 0) : 0;
      const teamRating = enriched.hasSport ? getCalculatedRating(enriched, enriched.targetProgram) : 0;
      const acceptance = parseFloat(enriched.acceptance_rate?.replace('%', '') || '0');
      const sportIsStatBased = isStatBasedSport(enriched.targetProgram?.sport || effectiveSport);

      let fitPercent = 0;
      let fitLabel = 'No Program';
      if (enriched.hasSport && teamRating > 0) {
        if (sportIsStatBased && isAthlete && enriched.athleteMatchScore && enriched.athleteMatchScore > 0) {
          const diff = teamRating - enriched.athleteMatchScore;
          fitPercent = diff <= 0 ? 100 : Math.max(10, 100 - (diff * 5));
          if (diff <= 0) fitLabel = 'Great Fit';
          else if (fitPercent >= 80) fitLabel = 'Good Fit';
          else if (fitPercent >= 50) fitLabel = 'Possible Walk-On';
          else fitLabel = 'Stretch';
        } else {
          fitPercent = teamRating;
          fitLabel = `${teamRating} Rtg`;
        }
      }

      return {
        ...enriched,
        tuition,
        isInState,
        scholarship,
        netCost,
        salary,
        roi,
        budget,
        teamRating,
        acceptance,
        fitPercent,
        fitLabel,
        sportIsStatBased
      };
    });
  }, [sideBySideList, enrichUniversity, getCalculatedTuition, isAthlete, effectiveSport]);

  const sideBySideWinners = useMemo(() => {
    if (enrichedSideBySide.length < 2) return null;

    const validNetCosts = enrichedSideBySide.filter(u => u.tuition > 0).map(u => u.netCost);
    const minNetCost = validNetCosts.length > 0 ? Math.min(...validNetCosts) : null;

    const maxSalary = Math.max(...enrichedSideBySide.map(u => u.salary));
    const maxRoi = Math.max(...enrichedSideBySide.map(u => u.roi));
    const maxBudget = Math.max(...enrichedSideBySide.map(u => u.budget));
    const maxFit = Math.max(...enrichedSideBySide.map(u => u.fitPercent));

    const validAcc = enrichedSideBySide.filter(u => u.acceptance > 0).map(u => u.acceptance);
    const minAcc = validAcc.length > 0 ? Math.min(...validAcc) : null;

    return {
      minNetCost,
      maxSalary: maxSalary > 0 ? maxSalary : null,
      maxRoi: maxRoi > 0 ? maxRoi : null,
      maxBudget: maxBudget > 0 ? maxBudget : null,
      maxFit: maxFit > 0 ? maxFit : null,
      minAcc
    };
  }, [enrichedSideBySide]);

  // --- INTERSECTION OBSERVER FOR INFINITE SCROLL ---
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) =>
            prev < sortedAndFilteredUniversities.length
              ? Math.min(prev + PAGE_SIZE, sortedAndFilteredUniversities.length)
              : prev
          );
        }
      },
      { rootMargin: '350px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sortedAndFilteredUniversities.length, hasSearched, loading]);

  // --- READINESS METER (HIDES WALK-ON / FIT FOR NON-STAT TEAM SPORTS) ---
  const renderReadinessMeter = (uni: University) => {
    if (!uni.hasSport) return null;

    const programSport = uni.targetProgram?.sport || effectiveSport;
    const sportIsStatBased = isStatBasedSport(programSport);
    const useScoreMatch =
      sportIsStatBased && isAthlete && uni.athleteMatchScore && uni.athleteMatchScore > 0;

    const teamRating = getCalculatedRating(uni, uni.targetProgram);
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
          colorClass = 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
          textClass = 'text-emerald-600';
          label = 'Good Fit';
        } else if (percent >= 50) {
          colorClass = 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]';
          textClass = 'text-amber-600';
          label = 'Possible Walk-On';
        } else {
          colorClass = 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
          textClass = 'text-red-600';
          label = 'Stretch';
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
            <div className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`} style={{ width: `${percent}%` }}></div>
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
          <div className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(100, teamRating)}%` }}></div>
        </div>
      </div>
    );
  };

  const getRankBadgeProps = (index: number, filter: MatchmakerCategory | null, states: string[], currentSortBy: string) => {
    if (index >= 5) return null;
    if (filter === 'fit' && !isCurrentSportStatBased) return null;
    if (!filter && currentSortBy) return null;

    let region = "US";
    if (states.length === 1) region = states[0];
    else if (states.length > 1) region = "Search";

    let category = "Academics & Salary";
    if (filter === 'fit') category = "Athletic Fit";
    if (filter === 'cost') category = "Lowest Cost";
    if (filter === 'salary') category = "Salary Rank";
    if (filter === 'funding') category = "Program Fund";
    if (filter === 'roi') category = "Top ROI";

    let styling = "";
    if (index === 0) styling = "bg-gradient-to-br from-yellow-400 to-amber-600 shadow-[0_0_30px_rgba(251,191,36,0.6)] border border-yellow-200 text-yellow-950";
    else if (index === 1) styling = "bg-gradient-to-br from-slate-300 to-slate-500 shadow-[0_0_30px_rgba(203,213,225,0.6)] border border-slate-100 text-slate-900";
    else if (index === 2) styling = "bg-gradient-to-br from-orange-400 to-orange-700 shadow-[0_0_30px_rgba(249,115,22,0.6)] border border-orange-300 text-orange-950";
    else styling = "bg-gradient-to-br from-blue-400 to-indigo-600 shadow-[0_0_30px_rgba(99,102,241,0.6)] border border-blue-300 text-white";

    return {
      text: `#${index + 1} ${category} in ${region}`,
      styling
    };
  };

  // --- DYNAMIC RECOMMENDED PRESETS BASED ON athlete_sports ---
  const recommendedPresets = useMemo(() => {
    const sportsToFeature =
      athleteSelectedSports.length > 0
        ? athleteSelectedSports
        : ['Track & Field', 'Cross Country', 'Soccer', 'Basketball'];

    const presets: Array<{
      id: string;
      label: string;
      isPrimaryFit?: boolean;
      sport: string;
      division?: string;
      states?: string[];
      bonusFilter?: MatchmakerCategory | null;
    }> = [];

    sportsToFeature.forEach((sport) => {
      const statBased = isStatBasedSport(sport);

      if (statBased) {
        presets.push({
          id: `${sport}-fit`,
          label: `My Best ${sport} Fits`,
          isPrimaryFit: true,
          sport,
          bonusFilter: 'fit',
        });
      }

      if (athleteState) {
        presets.push({
          id: `${sport}-state`,
          label: `${sport} in ${athleteState}`,
          sport,
          states: [athleteState],
          bonusFilter: null,
        });
      } else {
        presets.push({
          id: `${sport}-west`,
          label: `West Coast ${sport}`,
          sport,
          states: ['OR', 'WA', 'CA', 'ID', 'AZ'],
          bonusFilter: null,
        });
      }

      presets.push({
        id: `${sport}-d1`,
        label: `NCAA D1 ${sport}`,
        sport,
        division: 'NCAA D1',
        bonusFilter: null,
      });

      presets.push({
        id: `${sport}-cost`,
        label: `Lowest Cost ${sport}`,
        sport,
        bonusFilter: 'cost',
      });

      presets.push({
        id: `${sport}-roi`,
        label: `Highest ROI ${sport}`,
        sport,
        bonusFilter: 'roi',
      });
    });

    return presets.slice(0, 8);
  }, [athleteSelectedSports, athleteState]);

  const visibleUniversities = useMemo(() => {
    return sortedAndFilteredUniversities.slice(0, visibleCount);
  }, [sortedAndFilteredUniversities, visibleCount]);

  const sideBySideIds = useMemo(() => new Set(sideBySideList.map(u => u.id)), [sideBySideList]);

  // --- DYNAMIC ITEMLIST JSON-LD WHEN RESULTS ARE LOADED (Unified on non-www BASE_SITE_URL) ---
  const dynamicItemListJsonLd = useMemo(() => {
    if (visibleUniversities.length === 0) return null;
    const listTitle =
      selectedDivision || selectedSport
        ? `${selectedDivision || 'College'} ${selectedSport || 'Athletic'} Programs`
        : 'Top Colleges Ranked by Academics & 10-Year Median Salary';

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: listTitle,
      description: 'Compare NCAA, NAIA, and JUCO universities by 10-year median alumni salary, admission acceptance rate, net tuition cost, and athletic recruiting standards.',
      numberOfItems: sortedAndFilteredUniversities.length,
      itemListElement: visibleUniversities.slice(0, 15).map((u, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'CollegeOrUniversity',
          name: u.name,
          url: `${BASE_SITE_URL}/college/${u.slug}`,
          address: {
            '@type': 'PostalAddress',
            ...(u.city && { addressLocality: u.city }),
            addressRegion: u.state,
            addressCountry: 'US',
          },
        },
      })),
    };
  }, [visibleUniversities, sortedAndFilteredUniversities.length, selectedDivision, selectedSport]);

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

    if (hasSearched && sortedAndFilteredUniversities.length === 0) {
      return (
        <div className="text-center py-16 bg-white/60 backdrop-blur-3xl rounded-3xl border border-slate-200 border-dashed shadow-sm">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">No programs match your exact criteria</h2>
          <p className="text-slate-500 mt-2 font-medium">Try loosening your filters or adjusting your sorting preferences.</p>
        </div>
      );
    }

    return (
      <>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Showing {visibleUniversities.length} of {sortedAndFilteredUniversities.length} Programs
            </p>
            {!activeBonusFilter && !sortBy && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <TrendingUp className="w-3 h-3" /> Ranked by Best Academics & 10-Yr Median Salary
              </span>
            )}
          </div>
          {sideBySideList.length > 0 && (
            <button
              type="button"
              onClick={() => setIsSideBySideOpen(true)}
              className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200/60 transition-all self-start sm:self-auto"
            >
              <Scale className="w-3.5 h-3.5" />
              Open Side by Side ({sideBySideList.length}/3)
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleUniversities.map((uni, index) => {
            const { amount: tuitionToUse, isInState } = getCalculatedTuition(uni);
            const avgScholarship = uni.hasSport ? (uni.targetProgram?.average_scholarship || 0) : 0;
            const netCost = tuitionToUse > 0 ? Math.max(1, tuitionToUse - avgScholarship) : 0;

            let roiMultiplier: string | null = null;
            if (uni.median_earnings && netCost > 0) {
              roiMultiplier = (uni.median_earnings / netCost).toFixed(1);
            }

            const isSaved = savedCollegeIds.has(uni.id);
            const isProcessing = savingIds.has(uni.id);
            const isInSideBySide = sideBySideIds.has(uni.id);
            const rankBadge = getRankBadgeProps(index, activeBonusFilter, selectedStates, sortBy);

            return (
              <article
                key={uni.id}
                className={`relative bg-white/80 backdrop-blur-2xl rounded-3xl p-6 shadow-xl shadow-slate-200/40 border flex flex-col h-full transition-all duration-300 group ${
                  isInSideBySide
                    ? 'ring-2 ring-blue-500 border-blue-400'
                    : rankBadge
                    ? 'border-blue-300/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2'
                    : 'border-slate-100/50 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2'
                }`}
              >
                {rankBadge && (
                  <div className={`absolute -top-4 -left-4 z-20 px-5 py-2 rounded-full font-black text-sm tracking-tight ${rankBadge.styling}`}>
                    {rankBadge.text}
                  </div>
                )}

                <div className="flex-grow pt-2">
                  <h2 className="text-xl font-black text-slate-900 leading-tight mb-3 group-hover:text-blue-600 transition-colors flex flex-col items-start gap-2">
                    <Link
                      href={`/college/${uni.slug}${
                        selectedSport || selectedGender
                          ? `?${new URLSearchParams({
                              ...(selectedSport && { sport: selectedSport }),
                              ...(selectedGender && { gender: selectedGender }),
                            }).toString()}`
                          : ''
                      }`}
                      className="hover:underline"
                    >
                      {uni.name}
                    </Link>
                    {!uni.hasSport && effectiveSport && (
                      <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded font-black tracking-widest uppercase">
                        Academic Match Only
                      </span>
                    )}
                  </h2>

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
                      <span className="flex items-center flex-wrap gap-1.5">
                        {formatCurrency(tuitionToUse)} <span className="text-xs text-slate-400 font-bold">/yr</span>
                        {isInState && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">In-State</span>}
                        {avgScholarship > 0 && (
                          <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-200/60 px-1.5 py-0.5 rounded font-black tracking-wider uppercase" title="Estimated Average Athletic Aid">
                            ~{formatCurrency(avgScholarship)} Aid
                          </span>
                        )}
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
                          <span className="text-[10px] font-black bg-green-200 text-green-800 px-1.5 py-0.5 rounded-md shadow-sm" title="10-Year Median Salary compared to Net Annual Cost">
                            {roiMultiplier}x ROI
                          </span>
                        )}
                      </div>
                      <div className="font-black text-green-700">{uni.median_earnings ? formatCurrency(uni.median_earnings) : 'N/A'}</div>
                    </div>
                  </div>

                  {renderReadinessMeter(uni)}
                </div>

                <div className="mt-5 pt-5 border-t border-slate-100 flex justify-between items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => toggleSideBySide(e, uni)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 border shrink-0 ${
                      isInSideBySide
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50'
                    }`}
                    title="Compare in Side by Side"
                  >
                    {isInSideBySide ? <Check className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
                    <span>Side by Side</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {!isCoach && (
                      <>
                        <Link
                          href={getEmailBuilderHref(uni)}
                          className="p-2 rounded-lg border bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/60 hover:shadow-md transition-all shadow-sm"
                          title={`Draft Coach Email to ${uni.name}`}
                        >
                          <Mail className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => toggleSaveCollege(e, uni.id)}
                          disabled={isProcessing}
                          className={`p-2 rounded-lg border transition-all shadow-sm ${
                            isSaved
                              ? 'bg-blue-50 border-blue-200 text-blue-600'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-md'
                          }`}
                          title="Save School"
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                          )}
                        </button>
                      </>
                    )}
                    <Link
                      href={`/college/${uni.slug}${
                        selectedSport || selectedGender
                          ? `?${new URLSearchParams({
                              ...(selectedSport && { sport: selectedSport }),
                              ...(selectedGender && { gender: selectedGender }),
                            }).toString()}`
                          : ''
                      }`}
                      className={`text-xs sm:text-sm font-black flex items-center px-3 py-2 rounded-lg transition-colors ${rankBadge ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-500 hover:to-indigo-500' : 'text-blue-600 hover:bg-blue-50'}`}
                    >
                      View More
                      <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* INFINITE SCROLL SENTINEL */}
        {visibleCount < sortedAndFilteredUniversities.length && (
          <div ref={loadMoreRef} className="py-12 flex justify-center items-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm text-sm font-bold text-slate-600">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              Loading more programs...
            </div>
          </div>
        )}
      </>
    );
  }, [
    visibleUniversities,
    sortedAndFilteredUniversities.length,
    visibleCount,
    loading,
    isInitialized,
    hasSearched,
    selectedSport,
    selectedGender,
    effectiveSport,
    isCurrentSportStatBased,
    savedCollegeIds,
    savingIds,
    sideBySideIds,
    sideBySideList.length,
    toggleSideBySide,
    isCoach,
    isAthlete,
    activeBonusFilter,
    sortBy,
    selectedStates,
    getCalculatedTuition,
    getEmailBuilderHref
  ]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-500/30 pb-28">
      {/* DYNAMIC RESULTS ITEMLIST JSON-LD */}
      {dynamicItemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dynamicItemListJsonLd) }}
        />
      )}

      {/* INLINE ERROR BANNER */}
      {errorMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-xl text-red-600 border border-red-200 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300 w-[90%] max-w-md" role="alert">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm">{errorMsg}</p>
        </div>
      )}

      {/* INLINE SUCCESS TOAST */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-xl text-emerald-400 border border-emerald-500/30 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300" role="status">
          <Sparkles className="w-4 h-4 shrink-0" />
          <p className="font-bold text-sm text-white">{toastMsg}</p>
        </div>
      )}

      {/* FLOATING SIDE BY SIDE DOCK */}
      {sideBySideList.length > 0 && !isSideBySideOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-3xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl p-3 sm:p-4 shadow-[0_20px_50px_rgba(15,23,42,0.5)] flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-slate-700">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-blue-400 shrink-0 mr-1">
              <Scale className="w-4 h-4" />
              <span>Side by Side ({sideBySideList.length}/3)</span>
            </div>
            {sideBySideList.map((school) => (
              <div
                key={school.id}
                className="inline-flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shrink-0"
              >
                <span className="truncate max-w-[120px]">{school.name}</span>
                <button
                  type="button"
                  onClick={(e) => toggleSideBySide(e, school)}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={() => setSideBySideList([])}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsSideBySideOpen(true)}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-black px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all"
            >
              <Scale className="w-4 h-4" />
              Side by Side
            </button>
          </div>
        </div>
      )}

      {/* SIDE BY SIDE MODAL */}
      {isSideBySideOpen && enrichedSideBySide.length > 0 && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={() => setIsSideBySideOpen(false)}
          ></div>

          <div className="bg-white/95 backdrop-blur-3xl border border-slate-200 rounded-3xl md:rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] flex flex-col relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 sm:px-8 sm:py-6 bg-gradient-to-r from-slate-900 via-[#0f172a] to-blue-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">Side by Side</h2>
                  <p className="text-xs text-slate-300 font-medium">
                    Comparing {enrichedSideBySide.length} {enrichedSideBySide.length === 1 ? 'program' : 'programs'} • Sport: {effectiveSport || 'General'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSideBySideList([]);
                    setIsSideBySideOpen(false);
                  }}
                  className="text-xs font-bold text-slate-300 hover:text-red-400 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setIsSideBySideOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Comparison Table */}
            <div className="overflow-auto flex-1 p-4 sm:p-6 md:p-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div
                className="grid gap-4 min-w-[600px]"
                style={{
                  gridTemplateColumns: `160px repeat(${enrichedSideBySide.length}, minmax(200px, 1fr))`
                }}
              >
                {/* Row 0: School Headers */}
                <div className="flex flex-col justify-end pb-4 border-b border-slate-200">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Program Overview
                  </span>
                </div>
                {enrichedSideBySide.map((uni) => (
                  <div key={uni.id} className="pb-4 border-b border-slate-200 flex flex-col justify-between bg-slate-50/70 p-4 rounded-2xl border border-slate-100 relative">
                    <button
                      type="button"
                      onClick={(e) => toggleSideBySide(e, uni)}
                      className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove from Side by Side"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div>
                      <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 mb-2">
                        {uni.division}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 leading-snug pr-6">{uni.name}</h3>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        {uni.city ? `${uni.city}, ${uni.state}` : uni.state}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Row 1: Athletic Match (Stat-Based) OR Program Standard (Team Sports) */}
                <div className="flex items-center py-4 border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-500">
                  {isCurrentSportStatBased ? (
                    <>
                      <Target className="w-4 h-4 mr-2 text-purple-500 shrink-0" />
                      Athletic Fit
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 mr-2 text-blue-500 shrink-0" />
                      Program Standard
                    </>
                  )}
                </div>
                {enrichedSideBySide.map((uni) => {
                  const isWinner = sideBySideWinners?.maxFit != null && uni.fitPercent === sideBySideWinners.maxFit;
                  return (
                    <div
                      key={uni.id}
                      className={`p-4 rounded-2xl border my-1 flex flex-col justify-center ${
                        isWinner ? 'bg-emerald-50/70 border-emerald-300 shadow-sm' : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-black text-slate-900">
                          {isCurrentSportStatBased ? uni.fitLabel : (uni.teamRating > 0 ? `${uni.teamRating} Rtg` : 'N/A')}
                        </span>
                        {isWinner && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-white flex items-center gap-1">
                            <Crown className="w-3 h-3" /> {isCurrentSportStatBased ? 'Best Fit' : 'Top Rated'}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isWinner ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(100, uni.fitPercent)}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 mt-1.5">
                        Program Rating: {uni.teamRating > 0 ? uni.teamRating : 'N/A'}
                      </span>
                    </div>
                  );
                })}

                {/* Row 2: Estimated Net Cost */}
                <div className="flex items-center py-4 border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-500">
                  <Wallet className="w-4 h-4 mr-2 text-emerald-500 shrink-0" />
                  Est. Net Cost
                </div>
                {enrichedSideBySide.map((uni) => {
                  const isWinner = sideBySideWinners?.minNetCost != null && uni.tuition > 0 && uni.netCost === sideBySideWinners.minNetCost;
                  return (
                    <div
                      key={uni.id}
                      className={`p-4 rounded-2xl border my-1 flex flex-col justify-center ${
                        isWinner ? 'bg-emerald-50/70 border-emerald-300 shadow-sm' : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-slate-900">
                          {uni.tuition > 0 ? formatCurrency(uni.netCost) : 'N/A'}
                          <span className="text-xs font-bold text-slate-400">/yr</span>
                        </span>
                        {isWinner && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                            Lowest Cost
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 mt-1">
                        Tuition: {formatCurrency(uni.tuition)} {uni.isInState ? '(In-State)' : ''}
                      </span>
                      <span className="text-[11px] font-bold text-blue-600">
                        Avg Athletic Aid: {uni.scholarship > 0 ? formatCurrency(uni.scholarship) : 'N/A'}
                      </span>
                    </div>
                  );
                })}

                {/* Row 3: 10-Year Median Salary & ROI */}
                <div className="flex items-center py-4 border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-500">
                  <TrendingUp className="w-4 h-4 mr-2 text-blue-500 shrink-0" />
                  10-Yr Salary & ROI
                </div>
                {enrichedSideBySide.map((uni) => {
                  const isSalaryWinner = sideBySideWinners?.maxSalary != null && uni.salary === sideBySideWinners.maxSalary;
                  const isRoiWinner = sideBySideWinners?.maxRoi != null && uni.roi === sideBySideWinners.maxRoi;
                  return (
                    <div
                      key={uni.id}
                      className={`p-4 rounded-2xl border my-1 flex flex-col justify-center ${
                        isSalaryWinner || isRoiWinner ? 'bg-emerald-50/70 border-emerald-300 shadow-sm' : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-emerald-700">
                          {uni.salary > 0 ? formatCurrency(uni.salary) : 'N/A'}
                        </span>
                        {isSalaryWinner && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                            Top Salary
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-slate-700">
                          ROI: {uni.roi > 0 ? `${uni.roi}x` : 'N/A'}
                        </span>
                        {isRoiWinner && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500 text-white">
                            Best ROI
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Row 4: Sport Operating Budget */}
                <div className="flex items-center py-4 border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-500">
                  <Award className="w-4 h-4 mr-2 text-amber-500 shrink-0" />
                  Sport Budget
                </div>
                {enrichedSideBySide.map((uni) => {
                  const isWinner = sideBySideWinners?.maxBudget != null && uni.budget === sideBySideWinners.maxBudget;
                  return (
                    <div
                      key={uni.id}
                      className={`p-4 rounded-2xl border my-1 flex flex-col justify-center ${
                        isWinner ? 'bg-emerald-50/70 border-emerald-300 shadow-sm' : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-slate-900">
                          {uni.budget > 0 ? formatCurrency(uni.budget) : 'N/A'}
                        </span>
                        {isWinner && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                            Most Funded
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
                        Annual Operating Expense
                      </span>
                    </div>
                  );
                })}

                {/* Row 5: Acceptance Rate & Majors */}
                <div className="flex items-center py-4 border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-500">
                  <Landmark className="w-4 h-4 mr-2 text-slate-500 shrink-0" />
                  Academics
                </div>
                {enrichedSideBySide.map((uni) => {
                  const isSelectiveWinner = sideBySideWinners?.minAcc != null && uni.acceptance === sideBySideWinners.minAcc;
                  return (
                    <div
                      key={uni.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-white my-1 flex flex-col justify-center"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-slate-900">
                          {uni.acceptance_rate || 'N/A'} Acceptance
                        </span>
                        {isSelectiveWinner && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                            Most Selective
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        {uni.majors_offered ? uni.majors_offered.length : 0} Umbrella Majors
                      </span>
                    </div>
                  );
                })}

                {/* Row 6: Action Buttons */}
                <div className="flex items-center pt-4 text-xs font-black uppercase tracking-wider text-slate-400">
                  Actions
                </div>
                {enrichedSideBySide.map((uni) => {
                  const isSaved = savedCollegeIds.has(uni.id);
                  const isProcessing = savingIds.has(uni.id);
                  return (
                    <div key={uni.id} className="pt-4 flex items-center gap-2">
                      {!isCoach && (
                        <>
                          <Link
                            href={getEmailBuilderHref(uni)}
                            className="p-2.5 rounded-xl border bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/60 transition-all"
                            title={`Draft Coach Email to ${uni.name}`}
                          >
                            <Mail className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => toggleSaveCollege(e, uni.id)}
                            disabled={isProcessing}
                            className={`p-2.5 rounded-xl border transition-all ${
                              isSaved
                                ? 'bg-blue-50 border-blue-200 text-blue-600'
                                : 'bg-white border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200'
                            }`}
                            title="Save School"
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                            )}
                          </button>
                        </>
                      )}
                      <Link
                        href={`/college/${uni.slug}${
                          selectedSport || selectedGender
                            ? `?${new URLSearchParams({
                                ...(selectedSport && { sport: selectedSport }),
                                ...(selectedGender && { gender: selectedGender }),
                              }).toString()}`
                            : ''
                        }`}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-1 shadow-md transition-all"
                      >
                        View Program
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE REGION SELECTOR MODAL */}
      {isMapOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMapOpen(false)}></div>
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/50 rounded-3xl p-6 md:p-8 relative z-10 w-full max-w-4xl shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Target Regions</h2>
                <p className="text-slate-500 text-sm font-medium">Select unlimited states to focus your search ({selectedStates.length})</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedStates.length > 0 && (
                  <button
                    onClick={() => setSelectedStates([])}
                    className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button onClick={() => setIsMapOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
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
              Confirm Regions ({selectedStates.length > 0 ? selectedStates.join(', ') : 'Nationwide'})
            </button>
          </div>
        </div>
      )}

      {/* MOBILE-FIRST COMPACT HERO HEADER */}
      <header className="relative bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-950 pt-20 pb-14 md:pt-24 md:pb-28 px-4 md:px-8 overflow-hidden rounded-b-[2rem] md:rounded-b-[3rem] shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-2 md:space-y-5">
          {isAthlete && activeAthleteScore.isStatBased && activeAthleteScore.score > 0 ? (
            <>
              <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-xs md:text-sm font-bold tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <Target className="w-3.5 h-3.5 mr-1.5" />
                {activeAthleteScore.label} Score: {activeAthleteScore.score}
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white">
                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">{athleteFirstName}</span>
              </h1>
              <p className="text-xs sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
                Your personalized Match Meters are active. Explore top universities ranked by academics and 10-year salary below, or filter by sport.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs md:text-sm font-bold tracking-wide shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <Flame className="w-3.5 h-3.5 mr-1.5" />
                The Matchmaker Engine
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white">
                College Athletic <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Finder & ROI Matchmaker</span>
              </h1>
              <p className="text-xs sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
                Compare 2,800+ NCAA D1, D2, D3, NAIA, and JUCO college athletic programs ranked by academic selectivity, 10-year median salary ROI, scholarship aid, and recruiting standards.
              </p>
            </>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* THE CONTROL PANEL */}
        <section aria-label="Search Filters" className="relative -mt-8 md:-mt-14 bg-white/80 backdrop-blur-3xl p-4 sm:p-6 md:p-8 rounded-3xl md:rounded-[2rem] shadow-xl shadow-blue-900/10 border border-white mb-6 md:mb-8 transition-all duration-500 z-20">
          
          {/* SAVED SEARCHES BAR */}
          {(savedSearches.length > 0 || currentUserId) && (
            <div className="mb-4 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                  <FolderHeart className="w-3.5 h-3.5 text-blue-500" /> Saved:
                </span>
                {savedSearches.length === 0 ? (
                  <span className="text-xs font-medium text-slate-400 italic">No saved presets yet</span>
                ) : (
                  savedSearches.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => applySavedSearch(preset)}
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-300 text-xs font-bold text-slate-700 hover:text-blue-600 cursor-pointer transition-all shrink-0"
                    >
                      <span>{preset.name}</span>
                      <button
                        type="button"
                        onClick={(e) => deleteSavedSearch(e, preset.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                        title="Remove saved search"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {!isSavingSearch ? (
                <button
                  type="button"
                  onClick={() => setIsSavingSearch(true)}
                  className="text-xs font-black text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Current Filter
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in duration-200">
                  <input
                    type="text"
                    placeholder="Preset name (e.g. West Coast D1)"
                    value={newSearchName}
                    onChange={(e) => setNewSearchName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveCurrentSearch()}
                    className="flex-1 sm:w-48 bg-white border border-blue-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveCurrentSearch}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-3 py-1.5 rounded-xl transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsSavingSearch(false); setNewSearchName(''); }}
                    className="p-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- BASIC SETTINGS (Always Visible) --- */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label htmlFor="sport-select" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Sport</label>
              <select
                id="sport-select"
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold text-sm shadow-sm appearance-none cursor-pointer transition-all"
              >
                <option value="">Any Sport...</option>
                {athleteSelectedSports.length > 0 && (
                  <optgroup label="Your Selected Sports">
                    {athleteSelectedSports.map((sp) => (
                      <option key={`athlete-${sp}`} value={sp}>
                        ★ {sp}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="All College Sports">
                  {ALL_SPORTS.map((sp) => (
                    <option key={sp.value} value={sp.value}>
                      {sp.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="gender-select" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Gender</label>
              <select
                id="gender-select"
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold text-sm shadow-sm appearance-none cursor-pointer transition-all"
              >
                <option value="">Any</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="division-select" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Division</label>
              <select
                id="division-select"
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold text-sm shadow-sm appearance-none cursor-pointer transition-all"
              >
                <option value="">Any Division</option>
                <option value="NCAA D1">NCAA D1</option>
                <option value="NCAA D2">NCAA D2</option>
                <option value="NCAA D3">NCAA D3</option>
                <option value="NAIA">NAIA</option>
                <option value="Community College (JUCO)">Community College (JUCO)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1 flex justify-between items-center">
                <span>Regions</span>
                {selectedStates.length > 0 && <span className="text-blue-500">{selectedStates.length}</span>}
              </label>
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold text-sm shadow-sm transition-all flex justify-between items-center group"
              >
                <span className="truncate">{selectedStates.length > 0 ? selectedStates.join(', ') : 'Nationwide'}</span>
                <Map className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0 ml-1" />
              </button>
            </div>

            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label htmlFor="major-input" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Field of Study</label>
              <input
                id="major-input"
                type="text"
                list="major-options"
                placeholder="e.g. Nursing, Finance..."
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold text-sm shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
              />
              {showMajorHint && (
                <p className="text-[10px] font-bold text-blue-500 pl-1 animate-pulse">
                  Category: {mappedMajor}
                </p>
              )}
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
          <div className="mt-3 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-xs sm:text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors py-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
              {showAdvanced ? 'Hide School Name, Cost & Sort Filters' : 'School Name, Cost & Sort Filters'}
              {showAdvanced ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>
          </div>

          {/* --- BONUS SETTINGS (Advanced) --- */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showAdvanced ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="pt-3 pb-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pt-3 border-t border-slate-100/50">
                <div className="space-y-1.5">
                  <label htmlFor="school-name-input" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Specific School</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="school-name-input"
                      type="text"
                      placeholder="e.g. Oregon State or Stanford"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                      className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold text-sm shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="max-acceptance-input" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Max Acceptance %</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 pointer-events-none">
                      <Percent className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="max-acceptance-input"
                      type="number"
                      placeholder="e.g. 50"
                      value={maxAcceptance}
                      onChange={(e) => setMaxAcceptance(e.target.value)}
                      className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold text-sm shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="max-tuition-input" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Max Tuition Cost</label>
                  <div className="flex gap-2">
                    <select
                      aria-label="Tuition Type"
                      value={tuitionType}
                      onChange={(e) => setTuitionType(e.target.value)}
                      className="w-1/3 bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-2 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs font-semibold shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="in_state">In-State</option>
                      <option value="out_of_state">Out-State</option>
                    </select>
                    <div className="relative flex items-center w-2/3">
                      <div className="absolute left-3 pointer-events-none">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        id="max-tuition-input"
                        type="number"
                        placeholder="e.g. 30000"
                        value={maxTuition}
                        onChange={(e) => setMaxTuition(e.target.value)}
                        className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold text-sm shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sort-by-select" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Sort Results By</label>
                  <select
                    id="sort-by-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    disabled={activeBonusFilter !== null}
                    className="w-full bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold text-sm shadow-sm appearance-none cursor-pointer transition-all disabled:opacity-50 disabled:bg-slate-100"
                  >
                    <option value="">Default (Best Academics & 10-Yr Salary)</option>
                    <optgroup label="Athletic Rating">
                      <option value="rating_high">Program Rating (Highest to Lowest)</option>
                    </optgroup>
                    <optgroup label="Tuition Cost">
                      <option value="tuition_low">Lowest to Highest</option>
                      <option value="tuition_high">Highest to Lowest</option>
                    </optgroup>
                    <optgroup label="Acceptance Rate">
                      <option value="acceptance_low">Most Selective (Lowest %)</option>
                      <option value="acceptance_high">Least Selective (Highest %)</option>
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
            </div>
          </div>

          <div className="mt-4 flex flex-row justify-end gap-3 pt-4 border-t border-slate-100/50">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 sm:px-6 py-3 rounded-xl font-bold text-sm transition-all text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center border border-transparent hover:border-slate-200"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset
            </button>

            <button
              type="button"
              onClick={() => executeSearch()}
              disabled={loading}
              className="flex-1 sm:flex-initial group bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white px-6 sm:px-10 py-3 rounded-xl font-black text-sm sm:text-base transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              {loading ? 'Scanning...' : (
                <>
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Search Programs
                </>
              )}
            </button>
          </div>
        </section>

        {/* --- QUICK-LAUNCH PRESET PILLS (Shown when no specific sport/school filter is active) --- */}
        {!hasActiveFilters && (
          <section aria-label="Recommended Filters" className="mb-6 animate-in fade-in duration-500">
            <div className="bg-white/70 backdrop-blur-2xl border border-slate-200/60 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col items-center text-center">
              <div className="text-[11px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1.5 mb-2.5">
                <Crown className="w-3.5 h-3.5" />
                {athleteSelectedSports.length > 0
                  ? `Quick-Launch for Your ${athleteSelectedSports.length > 1 ? 'Sports' : 'Sport'} (${athleteSelectedSports.join(' & ')})`
                  : 'Quick-Launch Recruiting Presets'}
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
                {recommendedPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedSport(preset.sport);
                      setSelectedDivision(preset.division || '');
                      setSelectedStates(preset.states || []);
                      setActiveBonusFilter(preset.bonusFilter || null);
                      setHideAcademicOnly(true);
                      executeSearch({
                        selectedSport: preset.sport,
                        selectedDivision: preset.division || '',
                        selectedStates: preset.states || [],
                      });
                    }}
                    className={
                      preset.isPrimaryFit
                        ? 'px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-md hover:scale-105 transition-transform flex items-center gap-1.5'
                        : 'px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-700 font-bold text-xs shadow-sm hover:text-blue-600 transition-all'
                    }
                  >
                    {preset.isPrimaryFit && <Target className="w-3.5 h-3.5" />}
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* --- MATCHMAKER BONUS FILTERS (Hides "Best Fit" for Non-Stat Team Sports) --- */}
        {hasSearched && !errorMsg && (
          <section aria-label="Matchmaker Instant Sort" className="mb-8 flex flex-col items-center animate-in fade-in duration-500">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Matchmaker Instant Sort
            </div>
            <div className="bg-white/60 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border border-slate-200 flex flex-wrap justify-center gap-1.5 sm:gap-2 shadow-sm">
              {isCurrentSportStatBased && (
                <button
                  type="button"
                  onClick={() => toggleBonusFilter('fit')}
                  className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center border ${
                    activeBonusFilter === 'fit'
                      ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-purple-200 hover:text-purple-600'
                  }`}
                >
                  <Target className="w-3.5 h-3.5 mr-1.5" /> Best Fit
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleBonusFilter('cost')}
                className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center border ${
                  activeBonusFilter === 'cost'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200 hover:text-emerald-600'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 mr-1.5" /> Lowest Cost
              </button>
              <button
                type="button"
                onClick={() => toggleBonusFilter('salary')}
                className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center border ${
                  activeBonusFilter === 'salary'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-600'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Top Salary
              </button>
              <button
                type="button"
                onClick={() => toggleBonusFilter('funding')}
                className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center border ${
                  activeBonusFilter === 'funding'
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.4)]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-yellow-200 hover:text-yellow-600'
                }`}
              >
                <Award className="w-3.5 h-3.5 mr-1.5" /> Best Funded
              </button>
              <button
                type="button"
                onClick={() => toggleBonusFilter('roi')}
                className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center border ${
                  activeBonusFilter === 'roi'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-200 hover:text-amber-600'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Best ROI
              </button>

              <button
                type="button"
                onClick={() => setHideAcademicOnly(!hideAcademicOnly)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                  hideAcademicOnly
                    ? 'bg-red-500/10 border-red-500 text-red-600 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700'
                }`}
              >
                {hideAcademicOnly ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {hideAcademicOnly ? 'Sports Only' : 'Show All'}
              </button>
            </div>
          </section>
        )}

        {/* --- COLLEGE DIRECTORY RESULTS --- */}
        <section aria-label="Search Results" className="animate-in fade-in slide-in-from-bottom-8 duration-500 mb-12">
          {renderedCollegeCards}
        </section>

        {/* ========================================================= */}
        {/* CRAWLABLE SEO & GEO DIRECTORY + METHODOLOGY GUIDE         */}
        {/* (Always rendered in DOM so Search & AI Bots index links)  */}
        {/* ========================================================= */}
        <aside
          aria-label="College Recruiting Directory & Methodology"
          className="mt-10 space-y-6 bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 sm:p-8 text-left shadow-sm"
        >
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-2">
              Explore College Athletic Programs by Sport & Division
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
              ChasedSports indexes over 2,800 NCAA Division 1 (D1), Division 2 (D2), Division 3 (D3), NAIA, and NJCAA (JUCO) universities nationwide. Compare official program operating budgets, average athletic scholarship aid, in-state and out-of-state tuition costs, admission acceptance rates, and 10-year median alumni earnings.
            </p>

            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2.5">
              Browse by College Sport
            </h3>
            <nav aria-label="Popular Sport Searches" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6">
              {ALL_SPORTS.map((sp) => (
                <Link
                  key={sp.value}
                  href={`/search?sport=${encodeURIComponent(sp.value)}`}
                  className="text-xs font-bold text-slate-600 hover:text-blue-600 bg-white/90 hover:bg-blue-50/70 border border-slate-200/70 rounded-xl px-3 py-2 transition-colors truncate"
                >
                  College {sp.label} Programs
                </Link>
              ))}
            </nav>

            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2.5">
              Browse by Athletic Division
            </h3>
            <nav aria-label="Athletic Division Searches" className="flex flex-wrap gap-2">
              {ALL_DIVISIONS.map((div) => (
                <Link
                  key={div.value}
                  href={`/search?division=${encodeURIComponent(div.value)}`}
                  className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100/80 hover:bg-blue-50 border border-slate-200 rounded-xl px-3.5 py-2 transition-colors"
                >
                  {div.label} Schools
                </Link>
              ))}
            </nav>
          </div>

          {/* GEO FAQ Block on /search for AI Answer Engines */}
          <div className="pt-6 border-t border-slate-200/60">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                How ChasedSports Recruiting & ROI Ratings Work
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/80 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 mb-1">
                  1. Athletic Readiness Score
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  For stat-based sports (Track & Field, Cross Country, Swimming, Golf), ChasedSports benchmarks your personal records (PRs) into a 15–99 Recruiting Score and compares it against each college&apos;s Team Performance Rating.
                </p>
              </div>
              <div className="bg-white/80 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-1">
                  2. Net Cost & Scholarship Aid
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  We combine in-state and out-of-state tuition data with program-specific operating budgets and average athletic scholarship allocations to project your true annual net cost.
                </p>
              </div>
              <div className="bg-white/80 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
                  3. 10-Year Alumni ROI Multiplier
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Our ROI Multiplier divides a university&apos;s 10-year post-enrollment median graduate earnings by its estimated annual net tuition cost so families can compare long-term career value.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}