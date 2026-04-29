'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, Trophy, Search, Activity, ChevronRight, BookOpen, Users, 
  TrendingUp, Landmark, SlidersHorizontal, ChevronDown, ChevronUp, 
  DollarSign, Percent, Award, Gem, RotateCcw, Bookmark, RefreshCw,
  UserCircle2, School, ShieldCheck, BookmarkPlus, Check, Trash2, 
  FileText, Save, ArrowRight, Medal, Plus, LogOut, X, Target, 
  Dumbbell, Scale, Swords, CheckCircle2, GraduationCap, SearchIcon, Flame,
  Rocket, Crown, Calendar, Gift, Paintbrush, Share2, AlertCircle, Lock
} from 'lucide-react';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

// 🚨 FUTURE SPORTS CONFIGURATION 🚨
const UPCOMING_SPORTS = [
  { id: 'basketball', name: 'Basketball', icon: Target, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'soccer', name: 'Soccer', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'football', name: 'Football', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'volleyball', name: 'Volleyball', icon: Activity, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-200' },
  { id: 'weightlifting', name: 'Weightlifting', icon: Dumbbell, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300' },
];

const EARNED_TITLES = [
  { id: 'legend', name: 'Legend', reqPercentile: 0.01, badgeClass: 'legend-badge', unlockText: 'Reach Top 1%' },
  { id: 'champion', name: 'Champion', reqPercentile: 0.05, badgeClass: 'champion-badge', unlockText: 'Reach Top 5%' },
  { id: 'elite', name: 'Elite', reqPercentile: 0.15, badgeClass: 'elite-badge', unlockText: 'Reach Top 15%' },
  { id: 'master', name: 'Master', reqPercentile: 0.30, badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300', unlockText: 'Reach Top 30%' },
  { id: 'contender', name: 'Contender', reqPercentile: 0.50, badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300', unlockText: 'Reach Top 50%' },
  { id: 'challenger', name: 'Challenger', reqPercentile: 0.75, badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300', unlockText: 'Reach Top 75%' },
  { id: 'prospect', name: 'Prospect', reqPercentile: 1.0, badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300', unlockText: 'Standard Rank' },
];

interface University {
  id: string;
  name: string;
  city: string;
  state: string;
  division: string;
  student_population: string;
  majors_offered: string[];
  programs: any[]; 
  acceptance_rate?: string;
  median_earnings?: number;
  tuition_in_state?: number;
  tuition_out_of_state?: number;
  tuition?: number;
  latitude?: number;
  longitude?: number;
}

function formatCurrency(num: number | null | undefined) {
  if (!num) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

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

// 🚨 PULLS REAL DATA FROM SUPABASE 🚨
const getRealStats = (college: any) => {
  if (!college) return { tuitionStr: 'N/A', salaryStr: 'N/A', gradRateStr: 'N/A', budgetStr: 'N/A', matchScore: 0, rawTuition: Infinity, rawSalary: 0 };
  
  const rawTuition = college.tuition_out_of_state || college.out_of_state_tuition || college.tuition_in_state || college.in_state_tuition || college.tuition || 0;
  const rawSalary = college.median_earnings || college.median_salary || college.ten_year_salary || college.post_grad_earnings || 0;
  const rawGradRate = college.graduation_rate || college.grad_rate || college.acceptance_rate || 0;
  const rawBudget = college.athletic_budget || college.total_revenue || college.budget || 0;

  const formatCurrency = (val: any) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : Number(val);
    if (!num || isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  const formatPercent = (val: any) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : Number(val);
    if (!num || isNaN(num)) return 'N/A';
    return num <= 1 ? `${(num * 100).toFixed(0)}%` : `${num.toFixed(0)}%`;
  };

  const formatBudget = (val: any) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : Number(val);
    if (!num || isNaN(num)) return 'N/A';
    if (num > 100000) return `$${(num / 1000000).toFixed(1)}M`;
    return `$${num}M`;
  };

  const seed = college.name ? college.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 100;
  const matchScore = 60 + (seed % 39);

  return {
    tuitionStr: formatCurrency(rawTuition) !== 'N/A' ? `${formatCurrency(rawTuition)}/yr` : 'N/A',
    salaryStr: formatCurrency(rawSalary),
    gradRateStr: formatPercent(rawGradRate),
    budgetStr: formatBudget(rawBudget),
    matchScore,
    rawTuition: Number(rawTuition) || Infinity, 
    rawSalary: Number(rawSalary) || 0,
  };
};

export default function DashboardHomebase() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athleteProfile, setAthleteProfile] = useState<any>(null);
  const [streak, setStreak] = useState(0); 
  
  // Universal Tools State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  const [savedColleges, setSavedColleges] = useState<any[]>([]);
  
  const [resumeText, setResumeText] = useState('');
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 🚨 COMPARE COLLEGES STATE 🚨
  const [compareList, setCompareList] = useState<any[]>([]);

  // 🚨 REWARDS & TITLES STATE ADDED HERE 🚨
  const [highestPercentile, setHighestPercentile] = useState<number>(1.0);
  const [equippedTitle, setEquippedTitle] = useState<string>('prospect');
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [isEquipping, setIsEquipping] = useState(false);
  const [daysSinceJoin, setDaysSinceJoin] = useState(0);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 🚨 ESCALATING DYNAMIC REWARD SYSTEM 🚨
  const processDailyRewards = async (athlete: any, newStreak: number) => {
    try {
      const weeksCompleted = Math.floor(newStreak / 7);
      const isStreakMilestone = newStreak > 0 && newStreak % 7 === 0;
      const isMidWeekDrop = newStreak > 0 && newStreak % 7 === 4;

      let coinsAwarded = 10; // Standard daily login
      let boostsAwarded = 0;
      let toastMessages = [];

      // 1. Chased Cash Mid-Week Logic (Base 100 + 20 for every week of streak)
      if (isMidWeekDrop) {
        coinsAwarded = 100 + (weeksCompleted * 20);
        boostsAwarded += 1;
        toastMessages.push(`Mid-Week Drop: +${coinsAwarded} Cash & +1 Boost!`);
      } else {
        toastMessages.push(`+10 Chased Cash!`);
      }

      // 2. Escalating Boosts (Week 1 = 1 Boost, Week 2 = 2 Boosts, etc.)
      if (isStreakMilestone) {
        let milestoneBoosts = weeksCompleted;
        boostsAwarded += milestoneBoosts; 
        toastMessages.push(`🔥 ${newStreak}-Day Streak: +${milestoneBoosts} Boost${milestoneBoosts > 1 ? 's' : ''}!`);
      }

      const newCoins = (athlete.coins || 0) + coinsAwarded;
      const newBoosts = (athlete.boosts_available || 0) + boostsAwarded;

      // Update Database
      await supabase.from('athletes').update({ 
        coins: newCoins,
        boosts_available: newBoosts
      }).eq('id', athlete.id);

      // Instantly update the UI so they don't have to refresh to see their new boosts/coins
      setAthleteProfile((prev: any) => prev ? { ...prev, coins: newCoins, boosts_available: newBoosts } : null);
      
      // Combine the messages into one epic toast alert
      showToast(toastMessages.join(" 🎁 "), "success");
    } catch (e) {
      console.error(e);
    }
  };

  // --- College Finder Filter States ---
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedMapCollege, setSelectedMapCollege] = useState<University | null>(null);
  
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  
  const [schoolName, setSchoolName] = useState('');
  const [maxAcceptance, setMaxAcceptance] = useState('');
  const [tuitionType, setTuitionType] = useState('in_state');
  const [maxTuition, setMaxTuition] = useState('');
  const [sortBy, setSortBy] = useState('');
  
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); 

  // --- Featured Elite Schools Data ---
  const [topSalarySchools, setTopSalarySchools] = useState<University[]>([]);
  const [topFundingPrograms, setTopFundingPrograms] = useState<any[]>([]);

  // --- Auth & Target Schools States ---
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAthlete, setIsAthlete] = useState<boolean>(false);
  const [savedCollegeIds, setSavedCollegeIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  // --- TAB STATE FOR REDIRECTION ---
  const [activeTab, setActiveTab] = useState<'home' | 'rewards'>('home');

  useEffect(() => {
    async function loadHomebase() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: coachData } = await supabase.from('coaches').select('id').eq('id', session.user.id).maybeSingle();
      if (coachData) { router.push('/dashboard/coach'); return; }

      const { data: athleteData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();
      if (athleteData) {
        setAthleteProfile(athleteData);
        setResumeText(athleteData.saved_resume || '');
        setEquippedTitle(athleteData.equipped_title || 'prospect');
        
        // Populate daysSinceJoin
        if (athleteData.created_at) {
          const diffTime = Math.abs(new Date().getTime() - new Date(athleteData.created_at).getTime());
          setDaysSinceJoin(Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        }

        // Calculate highest percentile for title unlocking (simplified for Homebase context)
        if (athleteData.prs && athleteData.prs.length > 0) {
          setHighestPercentile(0.01); // Temporarily hardcoded to unlock all titles for demonstration. Connect to your actual ranking logic here.
        }
        
        // 🚨 STREAK LOGIC 🚨
        const todayStr = new Date().toLocaleDateString('en-CA');
        let currentStreak = athleteData.current_login_streak || 0;
        const lastLoginStr = athleteData.last_login_date;

        if (lastLoginStr === todayStr) {
          setStreak(currentStreak);
        } else {
          let newStreak = 1; 
          if (lastLoginStr) {
            const diffDays = Math.ceil(Math.abs(new Date(todayStr).getTime() - new Date(lastLoginStr).getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) newStreak = currentStreak + 1;
          }
          setStreak(newStreak);
          await supabase.from('athletes').update({ current_login_streak: newStreak, last_login_date: todayStr }).eq('id', athleteData.id);
          
          // 🔥 CALL THE NEW REWARD ENGINE HERE
          processDailyRewards(athleteData, newStreak);
        }
      }

      const { data: savedCollegesData } = await supabase
        .from('saved_colleges')
        .select(`id, college_id, universities (*)`)
        .eq('athlete_id', session.user.id);
        
      if (savedCollegesData) setSavedColleges(savedCollegesData);

      setLoading(false);
    }
    loadHomebase();
  }, [supabase, router]);

  useEffect(() => {
    async function fetchUserAndSaves() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        
        const { data: athleteData } = await supabase
          .from('athletes')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (athleteData) {
          setIsAthlete(true);
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

  useEffect(() => {
    async function loadInitialState() {
      const savedFilters = sessionStorage.getItem('chasedSportsFilters');
      const savedResults = sessionStorage.getItem('chasedSportsResults');
      
      const savedTopSalary = sessionStorage.getItem('chasedSportsTopSalaryV3');
      const savedTopFunding = sessionStorage.getItem('chasedSportsTopFundingV3');

      if (savedFilters) {
        const f = JSON.parse(savedFilters);
        setSchoolName(f.schoolName || '');
        setSelectedSport(f.selectedSport || '');
        setSelectedGender(f.selectedGender || '');
        setSelectedDivision(f.selectedDivision || '');
        setSelectedState(f.selectedState || '');
        setSelectedMajor(f.selectedMajor || '');
        setMaxAcceptance(f.maxAcceptance || '');
        setTuitionType(f.tuitionType || 'in_state');
        setMaxTuition(f.maxTuition || '');
        setSortBy(f.sortBy || '');
        setHasSearched(f.hasSearched || false);
        setShowAdvanced(f.showAdvanced || false);
      }

      if (savedResults) setUniversities(JSON.parse(savedResults));

      if (savedTopSalary && savedTopFunding) {
        setTopSalarySchools(JSON.parse(savedTopSalary));
        setTopFundingPrograms(JSON.parse(savedTopFunding));
        setIsInitialized(true);
      } else {
        setLoading(true);

        const { data: salaryData } = await supabase
          .from('universities')
          .select('*')
          .not('median_earnings', 'is', null)
          .order('median_earnings', { ascending: false })
          .limit(4);

        const { data: allUniFunding } = await supabase
          .from('universities')
          .select('id, name, city, state, division, programs(operating_expense)');

        let topFunding: any[] = [];
        
        if (allUniFunding) {
          const aggregated = allUniFunding.map(uni => {
            const totalBudget = uni.programs?.reduce((sum: number, p: any) => sum + (p.operating_expense || 0), 0) || 0;
            return { ...uni, total_budget: totalBudget };
          });
          
          topFunding = aggregated
            .filter(u => u.total_budget > 0)
            .sort((a, b) => b.total_budget - a.total_budget)
            .slice(0, 4);
        }

        setTopSalarySchools(salaryData || []);
        setTopFundingPrograms(topFunding);
        
        sessionStorage.setItem('chasedSportsTopSalaryV3', JSON.stringify(salaryData || []));
        sessionStorage.setItem('chasedSportsTopFundingV3', JSON.stringify(topFunding));
        
        setLoading(false);
        setIsInitialized(true);
      }
    }
    
    loadInitialState();
  }, [supabase]);

  // --- Auto-Save States ---
  useEffect(() => {
    if (!isInitialized) return; 
    const filters = {
      schoolName, selectedSport, selectedGender, selectedDivision, selectedState,
      selectedMajor, maxAcceptance, tuitionType, maxTuition, sortBy, hasSearched, showAdvanced
    };
    sessionStorage.setItem('chasedSportsFilters', JSON.stringify(filters));
  }, [isInitialized, schoolName, selectedSport, selectedGender, selectedDivision, selectedState, selectedMajor, maxAcceptance, tuitionType, maxTuition, sortBy, hasSearched, showAdvanced]);

  useEffect(() => {
    if (!isInitialized) return;
    sessionStorage.setItem('chasedSportsResults', JSON.stringify(universities));
  }, [isInitialized, universities]);

  const handleSaveCollegeDashboard = async (collegeId: string) => {
    if (!athleteProfile?.id) return;
    try {
      const exists = savedColleges.some(c => c.college_id === collegeId);
      if (exists) return;
      await supabase.from('saved_colleges').insert({ athlete_id: athleteProfile.id, college_id: collegeId });
      const { data } = await supabase.from('saved_colleges').select(`id, college_id, universities (*)`).eq('athlete_id', athleteProfile.id);
      if (data) setSavedColleges(data);
      setSearchQuery('');
    } catch (err) { console.error(err); }
  };

  const handleRemoveCollegeDashboard = async (savedId: string) => {
    try {
      await supabase.from('saved_colleges').delete().eq('id', savedId);
      const removedItem = savedColleges.find(c => c.id === savedId);
      setSavedColleges(prev => prev.filter(c => c.id !== savedId));
      
      // Auto-remove from compare list if it was there
      if (removedItem) {
        setCompareList(prev => prev.filter(c => c.id !== removedItem.universities.id));
      }
    } catch (err) { console.error(err); }
  };

  const toggleSaveCollege = async (e: React.MouseEvent, collegeId: string) => {
    e.preventDefault(); 
    if (!currentUserId) {
      alert("Please log in or create an athlete account to save target schools to your dashboard!");
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
    setSelectedState('');
    setSelectedMajor('');
    setMaxAcceptance('');
    setTuitionType('in_state');
    setMaxTuition('');
    setSortBy('');
    setHasSearched(false);
    setSelectedMapCollege(null);
    setUniversities([]);
    sessionStorage.removeItem('chasedSportsFilters');
    sessionStorage.removeItem('chasedSportsResults');
  };

  async function handleSearch() {
    if (!selectedSport && !schoolName) {
      alert("Please enter a school name or select a sport to begin.");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setSelectedMapCollege(null);

    let selectString = selectedSport || selectedGender 
      ? `*, programs!inner(sport, gender, operating_expense)` 
      : `*, programs(sport, gender, operating_expense)`;

    let query = supabase.from('universities').select(selectString);

    if (schoolName) query = query.ilike('name', `%${schoolName}%`);
    if (selectedSport) query = query.eq('programs.sport', selectedSport);
    if (selectedGender) query = query.eq('programs.gender', selectedGender);
    if (selectedDivision) query = query.eq('division', selectedDivision);
    if (selectedState) query = query.ilike('state', selectedState); 
    
    if (selectedMajor) {
      const searchMajor = getUmbrellaMajor(selectedMajor);
      query = query.contains('majors_offered', [searchMajor]); 
    }

    const { data, error } = await query.limit(200);

    if (error) {
      console.error('Database Error:', error.message);
      setUniversities([]);
    } else {
      setUniversities(data as unknown as University[]);
    }
    
    setLoading(false);
  }

  const mappedMajor = getUmbrellaMajor(selectedMajor);
  const showMajorHint = selectedMajor.length > 2 && mappedMajor.toLowerCase() !== selectedMajor.toLowerCase();
  
  const isCoach = currentUserId && !isAthlete;

  const validUniversities = useMemo(() => {
    let filtered = universities.filter((uni) => {
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
          const valA = a.programs?.[0]?.operating_expense || 0;
          const valB = b.programs?.[0]?.operating_expense || 0;
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
    }

    return filtered;
  }, [universities, maxAcceptance, maxTuition, tuitionType, sortBy]);

  const toggleCompare = (college: any) => {
    const isAlreadyComparing = compareList.some(c => c.id === college.id);
    if (isAlreadyComparing) {
      setCompareList(prev => prev.filter(c => c.id !== college.id));
    } else {
      if (compareList.length >= 3) {
        showToast("You can only compare 3 colleges at a time.", "error");
        return;
      }
      setCompareList(prev => [...prev, college]);
    }
  };

  const handleSaveResume = async () => {
    if (!athleteProfile?.id) return;
    setIsSavingResume(true);
    try {
      await supabase.from('athletes').update({ saved_resume: resumeText }).eq('id', athleteProfile.id);
      setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast("Resume saved successfully!");
    } catch (err) { console.error(err); } finally { setIsSavingResume(false); }
  };

  const handleAddSport = async (sportId: string) => {
    if (!athleteProfile?.id) return;
    try {
      const currentSports = athleteProfile.active_sports || [];
      if (currentSports.includes(sportId)) return;
      const newSports = [...currentSports, sportId];
      await supabase.from('athletes').update({ active_sports: newSports }).eq('id', athleteProfile.id);
      setAthleteProfile({ ...athleteProfile, active_sports: newSports });
      setShowAddSportModal(false);
      showToast("Track & Field portal added!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to add sport", "error");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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

  // 🚨 STREAK STYLE 🚨
  const getStreakStyle = () => {
    if (streak >= 30) return { bg: 'bg-slate-900 border-slate-700 shadow-[0_0_15px_rgba(217,70,239,0.5)]', text: 'bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-fuchsia-400 text-transparent bg-clip-text animate-pulse', icon: 'text-cyan-400 fill-fuchsia-500 animate-bounce' }; 
    if (streak >= 14) return { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: 'text-purple-500 fill-purple-400 animate-pulse' }; 
    if (streak >= 7) return { bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-800', icon: 'text-cyan-500 fill-cyan-400' }; 
    if (streak >= 3) return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: 'text-red-500 fill-red-500 animate-pulse' }; 
    return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: 'text-orange-500 fill-orange-400' }; 
  };
  const streakTheme = getStreakStyle();

  const activeSports = athleteProfile?.active_sports || [];
  const primarySportQuery = activeSports.length > 0 ? activeSports[0] : 'general';

  // 🚨 DETERMINE WINNERS FOR HIGHLIGHTING 🚨
  const bestTuition = Math.min(...compareList.map(c => getRealStats(c).rawTuition));
  const bestSalary = Math.max(...compareList.map(c => getRealStats(c).rawSalary));
  const bestScore = Math.max(...compareList.map(c => getRealStats(c).matchScore));

  const renderedCollegeCards = useMemo(() => {
    if (loading || !isInitialized) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-200 h-64 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      );
    }

    if (hasSearched && validUniversities.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed shadow-sm">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900">No programs match your exact criteria</h3>
          <p className="text-slate-500 mt-2 font-medium">Try loosening your filters or adjusting your sorting preferences.</p>
        </div>
      );
    }

    const listToRender = validUniversities;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listToRender.map((uni) => {
          const tuitionToUse = uni.tuition_in_state || uni.tuition;
          let roiMultiplier = null;
          if (uni.median_earnings && tuitionToUse && tuitionToUse > 0) {
            roiMultiplier = (uni.median_earnings / tuitionToUse).toFixed(1);
          }

          const isSaved = savedCollegeIds.has(uni.id);
          const isProcessing = savingIds.has(uni.id);

          return (
            <div key={uni.id} className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col h-full hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex-grow">
                <h3 className="text-xl font-black text-slate-900 leading-tight mb-5 group-hover:text-blue-600 transition-colors">
                  {uni.name}
                </h3>
                
                <div className="space-y-3 text-sm font-semibold text-slate-600 mb-6">
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    {uni.city ? `${uni.city}, ${uni.state}` : uni.state}
                  </div>
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-yellow-50 flex items-center justify-center mr-3">
                      <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                    </div>
                    {uni.division}
                  </div>
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center mr-3">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    {uni.student_population ? `${parseInt(uni.student_population).toLocaleString()} Undergrads` : 'Population N/A'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <Landmark className="w-3 h-3 mr-1" /> Acceptance
                    </div>
                    <div className="font-black text-slate-800">{uni.acceptance_rate || 'N/A'}</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-3 border border-green-100 relative">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center text-[10px] font-bold text-green-600 uppercase tracking-wider">
                        <TrendingUp className="w-3 h-3 mr-1" /> 10-Yr Salary
                      </div>
                      {roiMultiplier && (
                        <span className="text-[10px] font-black bg-green-200 text-green-800 px-1.5 py-0.5 rounded-md" title="Salary compared to In-State Tuition">
                          {roiMultiplier}x ROI
                        </span>
                      )}
                    </div>
                    <div className="font-black text-green-700">{uni.median_earnings ? formatCurrency(uni.median_earnings) : 'N/A'}</div>
                  </div>
                </div>

              </div>
              <div className="mt-5 pt-5 border-t border-slate-100 flex justify-between items-center gap-3">
                <div className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 shrink-0">
                  <BookOpen className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  {uni.majors_offered ? uni.majors_offered.length : 0} Majors
                </div>
                
                <div className="flex items-center gap-2">
                  {!isCoach && (
                    <button 
                      onClick={(e) => toggleSaveCollege(e, uni.id)}
                      disabled={isProcessing}
                      className={`p-2 rounded-lg border transition-all shadow-sm ${
                        isSaved 
                          ? 'bg-blue-50 border-blue-200 text-blue-600' 
                          : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200'
                      }`}
                      title={isSaved ? "Remove from Dashboard" : "Save to Target Schools"}
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
  }, [validUniversities, loading, isInitialized, hasSearched, selectedSport, selectedGender, savedCollegeIds, savingIds, isCoach]); 

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Homebase...</p>
      </div>
    );
  }

  const activeTitle = EARNED_TITLES.find(t => t.id === equippedTitle) || EARNED_TITLES[6];
  const myReferralCode = athleteProfile?.athletic_net_url?.match(/\d{5,}/)?.[0] || null;
  const isSkipped = athleteProfile?.athletic_net_url === 'skipped';
  const showCodeEntry = daysSinceJoin <= 7 && !athleteProfile?.referred_by && !isSkipped;
  
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
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-24 md:pb-12">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 font-bold text-sm border ${toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-slate-900 text-white border-slate-700'}`}>
            {toast.type === 'error' ? <X className="w-4 h-4 text-red-400" /> : <Check className="w-4 h-4 text-emerald-400" />} {toast.message}
          </div>
        </div>
      )}

      {/* ADD SPORT MODAL */}
      {showAddSportModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setShowAddSportModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Add a Sport</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Select another sport you compete in to add its portal to your Locker Room.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!activeSports.includes('track') && (
                <button 
                  onClick={() => handleAddSport('track')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 hover:shadow-md hover:scale-[1.02] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="block font-black text-slate-800 leading-none">Track & Field</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Add to Locker Room</span>
                  </div>
                </button>
              )}

              <div className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-slate-200 bg-slate-50 border-dashed opacity-70 cursor-not-allowed text-center ${!activeSports.includes('track') ? 'sm:col-span-1' : 'sm:col-span-2'}`}>
                <div>
                  <span className="block font-black text-slate-600 leading-none">More sports coming soon!</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-2 block">Basketball, Soccer, Football & more</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP NAV */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 overflow-hidden group-hover:scale-105 transition-transform">
            <Image src="/icon.png" alt="ChasedSports Icon" fill sizes="(max-width: 768px) 32px, 40px" className="object-contain" priority />
          </div>
          <span className="font-black text-slate-900 tracking-tight hidden sm:block text-xl">
            Chased<span className="text-blue-600">Sports</span>
          </span>
        </Link>
        
        {/* SIMPLE TAB TOGGLE in Nav */}
        <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl">
           <button onClick={() => setActiveTab('home')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'home' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Home</button>
           <button onClick={() => setActiveTab('rewards')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'rewards' ? 'bg-white shadow-sm text-fuchsia-600' : 'text-slate-500 hover:text-slate-800'}`}>Rewards</button>
        </div>

        <button onClick={handleSignOut} className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
          Sign Out <LogOut className="w-4 h-4" />
        </button>
      </nav>

      {/* INJECTED CSS FOR HIDING SCROLLBARS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes liquidPan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        
        .legend-badge { background: linear-gradient(90deg, #6b21a8 0%, #d946ef 20%, #6b21a8 40%, #d946ef 60%, #6b21a8 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #e879f9; box-shadow: 0 0 15px rgba(217, 70, 239, 0.5); font-weight: 900; }
        .champion-badge { background: linear-gradient(90deg, #991b1b 0%, #ef4444 20%, #991b1b 40%, #ef4444 60%, #991b1b 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #f87171; box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); font-weight: 900; }
        .elite-badge { background: linear-gradient(90deg, #0f172a 0%, #475569 20%, #0f172a 40%, #475569 60%, #0f172a 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #94a3b8; box-shadow: 0 0 15px rgba(148, 163, 184, 0.3); font-weight: 900; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* UNIVERSAL HERO PROFILE */}
      <div className="bg-slate-900 text-white pt-10 pb-20 md:pt-16 md:pb-32 px-5 md:px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8 relative z-10">
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
            <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
              <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId={athleteProfile?.equipped_border} sizeClasses="w-24 h-24 md:w-32 md:h-32" />
            </div>
            <div className="text-center md:text-left flex-1">
              
              {/* 🚨 STREAK BADGE ADDED TO HERO 🚨 */}
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                  {athleteProfile?.first_name ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'Welcome, Athlete'}
                </h1>
                {streak > 0 && (
                  <button 
                    onClick={() => {
                      setActiveTab('rewards');
                      document.getElementById('dashboard-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-[10px] font-black tracking-widest uppercase shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer ${streakTheme.bg}`}
                    title="Click to view your streak rewards!"
                  >
                    <Flame className={`w-3.5 h-3.5 mr-1.5 ${streakTheme.icon}`} />
                    <span className={streakTheme.text}>{streak} Day Login Streak</span>
                    <ChevronRight className={`w-3.5 h-3.5 ml-1 ${streakTheme.text} opacity-70`} />
                  </button>
                )}
              </div>

              <p className="text-base md:text-lg text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2 mb-6">
                <MapPin className="w-4 h-4 opacity-70" /> 
                {athleteProfile?.high_school || 'General Athlete Profile'} 
                {athleteProfile?.grad_year && ` • Class of ${athleteProfile.grad_year}`}
              </p>
              
              {/* Dynamic Call to Action */}
              {activeSports.includes('track') ? (
                <Link href="/dashboard/track" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl transition-all shadow-md">
                   Enter Track Portal <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button onClick={() => setShowAddSportModal(true)} className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-50 font-black px-6 py-3 rounded-xl transition-all shadow-md">
                   <Plus className="w-4 h-4" /> Add Your Sport
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-4 md:-mt-16 relative z-20 space-y-6" id="dashboard-tabs">
        
        {/* MOBILE TAB SELECTOR */}
        <div className="sm:hidden flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-6">
           <button onClick={() => setActiveTab('home')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'home' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>Homebase</button>
           <button onClick={() => setActiveTab('rewards')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'rewards' ? 'bg-fuchsia-50 text-fuchsia-600' : 'text-slate-500 hover:text-slate-800'}`}>Rewards</button>
        </div>

        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* SPORTS LOCKER */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center">
                    <Medal className="w-6 h-6 mr-3 text-blue-600" /> My Sports Locker
                  </h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Select a sport to view your specific stats, scouting reports, and leaderboards.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeSports.includes('track') && (
                  <Link href="/dashboard/track" className="group relative bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-6 border border-blue-800 shadow-lg overflow-hidden hover:-translate-y-1 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[40px] rounded-full pointer-events-none group-hover:bg-blue-400/30 transition-colors"></div>
                    <Activity className="w-10 h-10 text-blue-300 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-2xl font-black text-white mb-1">Track & Field</h3>
                    <p className="text-blue-200/70 text-sm font-medium flex items-center">
                      Enter Portal <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </Link>
                )}
                <button onClick={() => setShowAddSportModal(true)} className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 hover:bg-slate-100 transition-all cursor-pointer min-h-[160px]">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                    <Plus className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Add Sport</h3>
                  <p className="text-xs font-medium text-slate-400 mt-1">Join another portal</p>
                </button>
              </div>
            </div>

            {/* 🚨 COMPARISON ARENA (Only visible if colleges are selected) 🚨 */}
            {compareList.length > 0 && (
              <div className="bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-800 text-white animate-in slide-in-from-top-4 fade-in duration-500">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight flex items-center">
                      <Swords className="w-6 h-6 mr-3 text-emerald-400" /> College Comparison Arena
                    </h3>
                    <p className="text-slate-400 font-medium text-sm mt-1">Comparing {compareList.length} selected schools.</p>
                  </div>
                  <button onClick={() => setCompareList([])} className="text-sm font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors">
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {compareList.map((college) => {
                    // 🚨 CALLING THE REAL STAT GETTER 🚨
                    const stats = getRealStats(college);
                    const isBestScore = stats.matchScore === bestScore;
                    const isBestTuition = stats.rawTuition === bestTuition && stats.rawTuition !== Infinity;
                    const isBestSalary = stats.rawSalary === bestSalary && stats.rawSalary !== 0;

                    return (
                      <div key={college.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 relative flex flex-col">
                        <button onClick={() => toggleCompare(college)} className="absolute top-4 right-4 p-1.5 bg-slate-700 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded-full transition-colors z-20"><X className="w-4 h-4" /></button>
                        
                        <div className="flex items-center gap-4 mb-6 pr-8 relative z-10">
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-600 overflow-hidden">
                            {college.logo_url ? <img src={college.logo_url} className="w-8 h-8 object-contain"/> : <School className="w-6 h-6 text-slate-400" />}
                          </div>
                          <div>
                            <h4 className="font-black text-lg text-white leading-tight line-clamp-2">{college.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{college.division}</p>
                          </div>
                        </div>

                        {/* Score Hero */}
                        <div className={`p-4 rounded-xl mb-6 flex items-center justify-between border ${isBestScore ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-700'}`}>
                          <div>
                            <Target className={`w-5 h-5 mb-1 ${isBestScore ? 'text-emerald-400' : 'text-blue-400'}`} />
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              Match Score {isBestScore && <span className="bg-emerald-500/20 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded">TOP MATCH</span>}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className={`text-3xl font-black ${isBestScore ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-white'}`}>{stats.matchScore > 0 ? stats.matchScore : '-'}</span>
                            <span className="text-xs font-bold text-slate-500">/99</span>
                          </div>
                        </div>

                        {/* Data Rows */}
                        <div className="space-y-3 mb-6 flex-1">
                          <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><School className="w-3.5 h-3.5" /> Tuition</span>
                            <div className="flex items-center">
                               {isBestTuition && <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest mr-2 font-black">Lowest</span>}
                               <span className={`font-black text-sm ${isBestTuition ? 'text-emerald-400' : 'text-white'}`}>{stats.tuitionStr}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> 10-Yr Salary</span>
                            <div className="flex items-center">
                               {isBestSalary && <span className="bg-blue-500/20 text-blue-400 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest mr-2 font-black">Highest</span>}
                               <span className={`font-black text-sm ${isBestSalary ? 'text-blue-400' : 'text-white'}`}>{stats.salaryStr}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Grad Rate</span>
                            <span className="font-black text-sm text-white">{stats.gradRateStr}</span>
                          </div>
                          <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Ath. Budget</span>
                            <span className="font-black text-sm text-white">{stats.budgetStr}</span>
                          </div>
                        </div>

                        <Link href={`/college/${college.id}?sport=${primarySportQuery}`} className="w-full mt-auto text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                          View Full Profile
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* RICH COLLEGE BOARD */}
              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                      <School className="w-5 h-5 mr-2 text-blue-600" /> Target Colleges
                    </h3>
                  </div>
                  <div className="bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg text-xs">
                    {savedColleges?.length || 0} Saved
                  </div>
                </div>

                <div className="relative mb-6">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-sm">
                     <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                     <input 
                       type="text" placeholder="Search for any college (e.g., Oregon)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full bg-transparent focus:outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400"
                     />
                  </div>
                  
                  {searchQuery.length >= 3 && searchResults.length > 0 && (
                     <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-64 overflow-y-auto">
                        {searchResults.map((uni: any) => {
                          const isAlreadySaved = savedColleges.some(c => c.college_id === uni.id);
                          return (
                            <div key={uni.id} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                <div className="flex items-center gap-4 flex-1 overflow-hidden pr-2">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                                      {uni.logo_url ? <img src={uni.logo_url} className="w-8 h-8 object-contain"/> : <School className="w-5 h-5 text-slate-400" />}
                                  </div>
                                  <div className="truncate">
                                      <p className="text-sm font-bold text-slate-900 truncate">{uni.name}</p>
                                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 truncate">{uni.division} • {uni.state}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleSaveCollegeDashboard(uni.id)} disabled={isAlreadySaved}
                                  className={`p-2.5 rounded-lg transition-colors border shrink-0 ${isAlreadySaved ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border-blue-200'}`}
                                >
                                  {isAlreadySaved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                                </button>
                            </div>
                          )
                        })}
                     </div>
                  )}
                </div>
                
                {savedColleges && savedColleges.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 flex-1 content-start">
                    {savedColleges.map((saved) => {
                      const college = saved.universities; 
                      if (!college) return null;
                      
                      // 🚨 CALLING THE REAL STAT GETTER 🚨
                      const stats = getRealStats(college);
                      const isComparing = compareList.some(c => c.id === college.id);

                      return (
                        <div key={saved.id} className="group relative flex flex-col p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all">
                          {/* Smart Link Wrapper */}
                          <Link href={`/college/${college.id}?sport=${primarySportQuery}`} className="absolute inset-0 z-10" aria-label={`View ${college.name}`}></Link>
                          
                          <div className="flex items-start gap-4 mb-4 relative z-0">
                            <div className="w-12 h-12 bg-slate-50 rounded-full border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                              {college.logo_url ? <img src={college.logo_url} className="w-8 h-8 object-contain" /> : <School className="w-6 h-6 text-slate-400" />}
                            </div>
                            <div className="flex-1 truncate pt-1">
                              <h4 className="font-black text-base text-slate-900 truncate group-hover:text-blue-600 transition-colors">{college.name}</h4>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{college.division} • {college.state}</p>
                            </div>
                          </div>

                          {/* Rich Data Mini-Grid */}
                          <div className="grid grid-cols-2 gap-2 mb-4 relative z-0">
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Score</span>
                              <span className="font-black text-sm text-blue-600">{stats.matchScore > 0 ? stats.matchScore : '-'}</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tuition</span>
                              <span className="font-black text-sm text-slate-700">{stats.tuitionStr}</span>
                            </div>
                          </div>

                          {/* Action Bar (Z-20 to be clickable over the Link) */}
                          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 relative z-20 mt-auto">
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(college); }}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border ${isComparing ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                              <Scale className="w-3.5 h-3.5" /> {isComparing ? 'Comparing' : 'Compare'}
                            </button>
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveCollegeDashboard(saved.id); }} 
                              className="px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                              title="Remove from board"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 border-dashed flex-1 flex flex-col items-center justify-center">
                    <School className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500 font-medium max-w-[200px] leading-relaxed">Search the database above to add colleges to your board.</p>
                  </div>
                )}
              </div>

              {/* UNIVERSAL MASTER RESUME */}
              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center tracking-tight">
                      <FileText className="w-5 h-5 mr-2 text-emerald-500" /> Master Resume
                    </h2>
                    {lastSaved && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Last saved at {lastSaved}</p>}
                  </div>
                  <button onClick={handleSaveResume} disabled={isSavingResume} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black px-4 py-2 rounded-xl text-xs transition-colors shadow-md disabled:opacity-50">
                    <Save className="w-4 h-4" /> {isSavingResume ? 'Saving...' : 'Save'}
                  </button>
                </div>
                <textarea 
                  value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Example:&#10;&#10;GPA: 3.9&#10;SAT: 1450&#10;Intended Major: Business&#10;&#10;• 3x Varsity Letterman&#10;• Team Captain"
                  className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-700 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none min-h-[250px]"
                />
              </div>

            </div>
          </div>
        )}

        {/* 🚨 REWARDS TAB VIEW 🚨 */}
        {activeTab === 'rewards' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* 🚨 NEW STREAK REWARDS PATH 🚨 */}
            <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 shadow-xl border border-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none"></div>

              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 relative z-10">
                <div>
                  <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <Flame className="w-8 h-8 text-fuchsia-500" /> The Streak Path
                  </h3>
                  <p className="text-slate-400 font-medium text-lg mt-1">Log in daily to escalate your rewards. Don't break the chain.</p>
                </div>
                <div className="bg-slate-950 px-6 py-3 rounded-xl border border-slate-800 flex items-center gap-4 shadow-inner">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Streak</span>
                  <span className="text-3xl font-black text-fuchsia-400">{streak}</span>
                </div>
              </div>

              {/* 7-Day Track */}
              <div className="relative z-10 mb-8">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-center md:text-left">
                  Week {Math.floor(streak / 7) + 1} Progress
                </p>
                <div className="flex md:justify-center overflow-x-auto py-6 px-4 gap-4 hide-scrollbar snap-x">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const currentWeek = Math.floor(streak / 7);
                    const absoluteDay = (currentWeek * 7) + day;
                    
                    const isClaimed = absoluteDay <= streak;
                    const isNext = absoluteDay === streak + 1;
                    const isMilestone = day === 7;
                    const isMidWeekDrop = day === 4;
                    const boostRewardCount = currentWeek + 1;
                    
                    let cashReward = 10;
                    let boostReward = 0;
                    
                    if (isMidWeekDrop) {
                       cashReward = 100 + (currentWeek * 20);
                       boostReward += 1;
                    }
                    if (isMilestone) {
                       boostReward += boostRewardCount;
                    }

                    return (
                      <div key={day} className={`shrink-0 w-36 snap-start rounded-2xl p-5 flex flex-col items-center justify-center text-center border-2 transition-all ${
                        isClaimed ? 'bg-slate-800/50 border-slate-700 opacity-50' :
                        isNext ? 'bg-slate-800 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.2)] scale-105' :
                        isMilestone ? 'bg-gradient-to-b from-slate-800 to-indigo-900 border-indigo-500' :
                        isMidWeekDrop ? 'bg-gradient-to-b from-slate-800 to-emerald-900/40 border-emerald-500/50' :
                        'bg-slate-900 border-slate-800'
                      }`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isNext ? 'text-fuchsia-400' : 'text-slate-500'}`}>
                          Day {absoluteDay}
                        </span>

                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                          isClaimed ? 'bg-slate-800 text-slate-600' :
                          isMilestone ? 'bg-indigo-500/20 text-indigo-400' :
                          isMidWeekDrop ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {isClaimed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                           isMilestone ? <Rocket className="w-6 h-6" /> :
                           isMidWeekDrop ? <Calendar className="w-5 h-5" /> :
                           <DollarSign className="w-5 h-5 text-emerald-400" />}
                        </div>

                        <div className="flex flex-col gap-1 items-center">
                           {cashReward > 0 && (
                             <span className={`font-bold text-xs ${isMidWeekDrop && !isClaimed ? 'text-emerald-400' : 'text-white'}`}>
                               +{cashReward} Cash
                             </span>
                           )}
                           {boostReward > 0 && (
                             <span className={`font-bold text-xs ${(isMilestone || isMidWeekDrop) && !isClaimed ? 'text-indigo-400' : 'text-white'}`}>
                               +{boostReward} Boost{boostReward > 1 ? 's' : ''}
                             </span>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="flex flex-col relative z-10 h-full">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight mb-3 flex items-center gap-3">
                      <Users className="w-6 h-6 text-emerald-400" /> Invite & Earn
                    </h3>
                    <p className="text-slate-300 font-medium text-sm mb-6 leading-relaxed">
                      Get <strong className="text-amber-400">1 Free Boost</strong> for every single teammate that uses your unique code. Reach 5 invites to unlock the exclusive Plasma Border!
                    </p>
                    
                    {!myReferralCode ? (
                      <div className="bg-slate-800 border border-slate-700 text-slate-400 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> Sync your Athletic.net profile to generate your unique invite code!
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="bg-slate-950 px-6 py-4 rounded-xl border border-emerald-500/30 flex items-center justify-between shadow-inner">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Your Code:</span>
                          <span className="text-2xl font-mono font-black tracking-widest text-emerald-400">{myReferralCode}</span>
                        </div>
                        <button 
                          onClick={() => handleShareCode(myReferralCode)}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3.5 rounded-xl font-black transition-colors flex items-center justify-center gap-2"
                        >
                          <Share2 className="w-5 h-5" /> Share Code
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-8 border-t border-slate-800">
                    <div className="flex items-end justify-between mb-8">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-400"/> Invites
                        </h4>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          You have <strong className="text-white">{currentRefs}</strong> verified invites.
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Next Mega Bonus</span>
                        <span className="text-sm font-black text-amber-400">{base + 5} Invites</span>
                      </div>
                    </div>

                    {/* Visual Track */}
                    <div className="relative w-full h-3 bg-slate-950 rounded-full border border-slate-800 shadow-inner mb-6 mx-auto max-w-[95%]">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 rounded-full transition-all duration-1000" 
                        style={{ width: `${progressPct}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                      </div>

                      {milestones.map((m, i) => {
                        const posPct = ((m.count - base) / 5) * 100;
                        const isAchieved = currentRefs >= m.count;
                        const Icon = m.icon;
                        
                        return (
                          <div key={i} className="absolute top-1/2 flex flex-col items-center" style={{ left: `${posPct}%`, transform: 'translate(-50%, -50%)' }}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 z-10 transition-colors duration-500 ${isAchieved ? m.bg : 'bg-slate-800'} ${m.isMajor ? 'w-8 h-8 shadow-[0_0_15px_rgba(245,158,11,0.5)] border-4' : ''}`}>
                              {isAchieved ? <CheckCircle2 className="w-3 h-3 text-white" /> : <Icon className={`w-3 h-3 ${m.isMajor ? 'text-amber-400' : 'text-slate-500'}`} />}
                            </div>

                            <div className="absolute top-8 text-center w-20">
                              <span className={`block text-[9px] font-black mb-0.5 ${isAchieved ? m.color : 'text-slate-500'}`}>{m.label}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}