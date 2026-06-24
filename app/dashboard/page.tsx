'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, Search, ChevronRight, Users, ChevronDown, ChevronUp, 
  Bookmark, RefreshCw, UserCircle2, School, ShieldCheck, Check, Trash2, 
  FileText, Save, ArrowRight, Plus, X, Globe, CheckCircle2, Flame,
  Rocket, Crown, Gift, Paintbrush, Share2, AlertCircle, Lock, Link as LinkIcon, ImageIcon, 
  Download, CheckSquare, Square, Mail, Sparkles, Smartphone, Edit3, Scale, Activity,
  Zap, TrendingUp, Info, Copy, Coins, BarChart3, Eye, Calendar, HelpCircle, Trophy,
  Map, ShieldAlert, Camera
} from 'lucide-react';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

// Import our centralized Registry & Constants
import SportEditorRegistry from '@/components/dashboard/sports/SportEditorRegistry';
import { 
  SPORT_CONFIGS_META, ALL_SPORTS, SUGGESTED_MAJORS, US_STATES, 
  evaluateMetric, getOverallTier, getRealStats 
} from '@/utils/constants/RecruitingStandards';

// 🚨 IMPORT COMPONENTS
import ProGate from '@/components/ProGate';
import EmailVerification from '@/components/EmailVerification';

// Centralized Launch Date for Founder Status Threshold
const PRO_LAUNCH_DATE = new Date('2026-08-08T00:00:00Z');

// 🚨 3D TILT CARD PHYSICS ENGINE 🚨
const TiltCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ transition: 'transform 0.5s ease-out' });
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12; 
    const rotateY = ((x - centerX) / centerX) * 12;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out',
    });

    setGlareStyle({
      opacity: 0.15,
      background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 80%)`,
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.5s ease-out',
    });
    setGlareStyle({ opacity: 0 });
  };

  return (
    <div 
      ref={cardRef} 
      onMouseMove={handleMouseMove} 
      onMouseLeave={handleMouseLeave} 
      style={style} 
      className={`relative overflow-hidden group cursor-pointer ${className}`}
    >
      <div className="absolute inset-0 z-50 pointer-events-none transition-opacity duration-300" style={glareStyle}></div>
      {children}
    </div>
  );
};

// --- CORE RECRUITING DATA STRUCTURES FOR LOCAL CALCULATIONS ---
const RECRUITING_STANDARDS_DASHBOARD: Record<string, Record<string, { t1: number, t2: number, t3: number, t4: number, t5: number, t6: number, t7: number, isField?: boolean }>> = {
  'Boys': {
    '60 Meters': { t1: 6.75, t2: 6.90, t3: 7.05, t4: 7.20, t5: 7.40, t6: 7.60, t7: 8.00 },
    '100 Meters': { t1: 10.5, t2: 10.8, t3: 11.0, t4: 11.3, t5: 11.6, t6: 11.9, t7: 12.6 },
    '200 Meters': { t1: 21.2, t2: 21.8, t3: 22.2, t4: 22.8, t5: 23.5, t6: 24.5, t7: 26.0 },
    '400 Meters': { t1: 47.5, t2: 49.0, t3: 50.0, t4: 51.5, t5: 53.0, t6: 55.0, t7: 58.0 },
    '800 Meters': { t1: 112, t2: 115, t3: 117, t4: 120, t5: 125, t6: 130, t7: 140 }, 
    '1500 Meters': { t1: 231, t2: 239, t3: 244, t4: 250, t5: 264, t6: 275, t7: 300 },
    '1600 Meters': { t1: 250, t2: 258, t3: 264, t4: 270, t5: 285, t6: 295, t7: 320 }, 
    '110m Hurdles': { t1: 13.8, t2: 14.2, t3: 14.6, t4: 15.0, t5: 15.5, t6: 16.5, t7: 18.5 },
    '300m Hurdles': { t1: 37.0, t2: 38.5, t3: 39.5, t4: 41.0, t5: 42.5, t6: 44.5, t7: 48.0 },
    'Long Jump': { t1: 288, t2: 270, t3: 260, t4: 252, t5: 240, t6: 228, t7: 204, isField: true }, 
    'High Jump': { t1: 82, t2: 78, t3: 76, t4: 74, t5: 70, t6: 66, t7: 60, isField: true }, 
    'Pole Vault': { t1: 198, t2: 186, t3: 174, t4: 162, t5: 150, h6: 132, t7: 108, isField: true },
    'Shot Put': { t1: 720, t2: 660, t3: 600, t4: 540, t5: 480, t6: 444, t7: 360, isField: true }, 
    'Discus': { t1: 2220, t2: 2040, t3: 1860, t4: 1740, t5: 1620, t6: 1440, t7: 1080, isField: true },
  },
  'Girls': {
    '60 Meters': { t1: 7.45, t2: 7.65, t3: 7.85, t4: 8.05, t5: 8.30, t6: 8.60, t7: 9.20 },
    '100 Meters': { t1: 11.7, t2: 12.1, t3: 12.4, t4: 12.8, t5: 13.2, t6: 13.6, t7: 14.5 },
    '200 Meters': { t1: 24.2, t2: 24.8, t3: 25.5, t4: 26.2, t5: 27.0, t6: 28.5, t7: 31.0 },
    '400 Meters': { t1: 54.5, t2: 57.0, t3: 58.5, t4: 60.5, t5: 63.0, t6: 66.0, t7: 72.0 },
    '800 Meters': { t1: 130, t2: 135, t3: 140, t4: 145, t5: 152, t6: 160, t7: 175 }, 
    '1500 Meters': { t1: 268, t2: 282, t3: 291, t4: 300, t5: 314, t6: 330, t7: 375 },
    '1600 Meters': { t1: 290, t2: 305, t3: 315, t4: 325, t5: 340, t6: 360, t7: 400 }, 
    '100m Hurdles': { t1: 13.8, t2: 14.3, t3: 14.8, t4: 15.5, t5: 16.5, t6: 17.8, t7: 20.0 },
    '300m Hurdles': { t1: 42.5, t2: 44.5, t3: 46.5, t4: 48.5, t5: 51.0, t6: 54.0, t7: 59.0 },
    'Long Jump': { t1: 234, t2: 222, t3: 210, t4: 198, t5: 186, t6: 174, t7: 150, isField: true }, 
    'High Jump': { t1: 68, t2: 64, t3: 62, t4: 60, t5: 58, t6: 54, t7: 50, isField: true }, 
    'Pole Vault': { t1: 156, t2: 144, t3: 132, t4: 120, t5: 108, t6: 90, t7: 72, isField: true },
    'Shot Put': { t1: 540, t2: 480, t3: 432, t4: 396, t5: 360, t6: 324, t7: 264, isField: true }, 
    'Discus': { t1: 1800, t2: 1620, t3: 1500, t4: 1380, t5: 1260, t6: 1080, t7: 840, isField: true },
  }
};

const parseMarkToNumber = (mark: string): number => {
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

const formatSecondsToTime = (totalSeconds: number): string => {
  if (totalSeconds < 60) return `${totalSeconds.toFixed(2)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
};

const formatInchesToFeet = (totalInches: number): string => {
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}' ${inches}"`;
};

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
  if (score >= 40) return { tier: 'Strong Varsity', nextTier: 'NAIA Prospect', scoreRequired: 55, colorClass: 'text-slate-500', bgClass: 'bg-slate-500/20', barClass: 'bg-slate-400', borderClass: 'border-slate-400/50', glowClass: '' };
  if (score >= 20) return { tier: 'Varsity Contributor', nextTier: 'Strong Varsity', scoreRequired: 40, colorClass: 'text-slate-400', bgClass: 'bg-slate-500/10', barClass: 'bg-slate-500', borderClass: 'border-slate-500/30', glowClass: '' };
  return { tier: 'Developmental', nextTier: 'Varsity Contributor', scoreRequired: 20, colorClass: 'text-slate-400', bgClass: 'bg-slate-500/5', barClass: 'bg-slate-600', borderClass: 'border-slate-600/30', glowClass: '' };
};

type AccoladeObj = { text: string; category: string };

export default function DashboardHomebase() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athleteProfile, setAthleteProfile] = useState<any>(null);
  const [streak, setStreak] = useState(0); 
  const [coins, setCoins] = useState(0);
  const [awardedToday, setAwardedToday] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  
  // 🚨 UI MODAL GATES 🚨
  const [isBasicProfileModalOpen, setIsBasicProfileModalOpen] = useState(false);
  const [isEmailVerificationModalOpen, setIsEmailVerificationModalOpen] = useState(false);
  const [isTeamJoinModalOpen, setIsTeamJoinModalOpen] = useState(false);

  // 🚨 PROFILE UPLOAD STATES 🚨
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form (Basics + Email + Gender + Grad Year)
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '', gender: '', grad_year: '' });

  // Team Form States (Used in the TeamJoinModal)
  const [teamForm, setTeamForm] = useState({ high_school: '', city: '', state: '' });
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamSearchResults, setTeamSearchResults] = useState<any[]>([]);
  const [isSearchingTeams, setIsSearchingTeams] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCity, setNewTeamCity] = useState('');
  const [newTeamState, setNewTeamState] = useState('');
  const [newTeamMascot, setNewTeamMascot] = useState('');
  const [newTeamDivision, setNewTeamDivision] = useState(''); 

  const teamDropdownRef = useRef<HTMLDivElement>(null);
  const sportsMenuRef = useRef<HTMLDivElement>(null);
  const majorDropdownRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [savedColleges, setSavedColleges] = useState<any[]>([]);
  
  const [isSportsMenuOpen, setIsSportsMenuOpen] = useState(false);
  const [isCollegesOpen, setIsCollegesOpen] = useState(false);

  const [gpa, setGpa] = useState('');
  const [intendedMajor, setIntendedMajor] = useState('');
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [accolades, setAccolades] = useState<AccoladeObj[]>([]);
  const [newAccolade, setNewAccolade] = useState('');
  const [newAccoladeCategory, setNewAccoladeCategory] = useState('General');
  const [schoolPrefs, setSchoolPrefs] = useState('');

  const [sportStats, setSportStats] = useState<Record<string, any>>({});
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedAccolades, setSelectedAccolades] = useState<string[]>([]);
  const [includeGPA, setIncludeGPA] = useState(true);
  const [includeMajor, setIncludeMajor] = useState(true);
  const [isExportingCard, setIsExportingCard] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'social' | 'rewards'>('home');
  const [socialSubTab, setSocialSubTab] = useState<'portfolio' | 'social_card' | 'analytics'>('portfolio');

  const [dailyViews, setDailyViews] = useState(0);
  const [monthlyViews, setMonthlyViews] = useState(0);
  const [allRecentViewers, setAllRecentViewers] = useState<any[]>([]);
  const [recentViewers, setRecentViewers] = useState<any[]>([]);
  const [showAllViewersModal, setShowAllViewersModal] = useState(false);
  const [showImpressionTooltip, setShowImpressionTooltip] = useState(false);
  const [collapsedSports, setCollapsedSports] = useState<Record<string, boolean>>({});

  // 🚨 NEW: DYNAMIC TIME-GATE ACCESS EVALUATION 🚨
  const gatingMode = useMemo(() => {
    const isPreLaunch = new Date() < PRO_LAUNCH_DATE;
    
    let hasAccess = false;
    if (isPreLaunch) {
      hasAccess = athleteProfile?.is_founder === true;
    } else {
      hasAccess = athleteProfile?.is_premium === true;
    }

    return {
      isPreLaunch,
      hasAccess,
      label: isPreLaunch ? "Early access" : "Premium feature"
    };
  }, [athleteProfile]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const goToTab = (tab: 'home' | 'social' | 'rewards') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactCoach = (coachEmail: string | null) => {
    if (!coachEmail) {
      showToast("This coach has not made their contact information public.", "error");
      return;
    }
    window.location.href = `mailto:${coachEmail}?subject=Recruiting Inquiry from ChasedSports Profile`;
  };

  const toggleSportCollapse = (sport: string) => {
    setCollapsedSports(prev => ({ ...prev, [sport]: !prev[sport] }));
  };

  // 🚨 DYNAMIC AVATAR UPLOAD HANDLER 🚨
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const userId = athleteProfile?.id;
    
    if (!file || !userId) return;

    setIsUploadingAvatar(true);

    try {
      const imageCompression = (await import('browser-image-compression')).default;
      
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      });

      const fileName = `${userId}-avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const urlWithTime = `${data.publicUrl}?t=${new Date().getTime()}`;

      const { error: dbError } = await supabase
        .from('athletes')
        .update({ avatar_url: urlWithTime })
        .eq('id', userId);

      if (dbError) throw dbError;

      setAthleteProfile((prev: any) => ({ ...prev, avatar_url: urlWithTime }));
      showToast("Profile picture updated successfully!", "success");
      setIframeKey(prev => prev + 1);

    } catch (error: any) {
      console.error("Avatar upload error:", error);
      showToast("Failed to upload profile picture.", "error");
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (majorDropdownRef.current && !majorDropdownRef.current.contains(event.target as Node)) setShowMajorDropdown(false);
      if (sportsMenuRef.current && !sportsMenuRef.current.contains(event.target as Node)) setIsSportsMenuOpen(false);
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) setShowTeamDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🚨 DYNAMIC TEAM AUTOCOMPLETE ENGINE (Optimized) 🚨
  useEffect(() => {
    const searchTeams = async () => {
      if (teamSearchQuery.trim().length < 2 || teamSearchQuery === teamForm.high_school) {
        setTeamSearchResults([]);
        setIsSearchingTeams(false);
        return;
      }
      setIsSearchingTeams(true);
      const normalizedQuery = normalizeHSName(teamSearchQuery.trim());
      
      const { data, error } = await supabase
        .from('teams')
        .select('id, high_school_name, city, state, division')
        .ilike('high_school_name', `%${normalizedQuery}%`)
        .limit(6);
        
      if (!error && data) {
        setTeamSearchResults(data);
      }
      setIsSearchingTeams(false);
    };

    const timeoutId = setTimeout(searchTeams, 350);
    return () => clearTimeout(timeoutId);
  }, [teamSearchQuery, teamForm.high_school, supabase]);

  const selectExistingTeam = (team: any) => {
    setTeamForm(prev => ({
      ...prev,
      high_school: team.high_school_name,
      city: team.city,
      state: team.state
    }));
    setTeamSearchQuery(team.high_school_name);
    setShowTeamDropdown(false);
  };

  const handleCreateNewTeam = async () => {
    if (!newTeamName || !newTeamCity || !newTeamState || !newTeamMascot || !newTeamDivision) {
      showToast("All fields, including Division, are required.", "error");
      return;
    }
    const normalizedNewName = normalizeHSName(newTeamName);
    const formattedCity = newTeamCity.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    const formattedMascot = newTeamMascot.trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

    try {
      const { data, error } = await supabase.from('teams').insert({
        high_school_name: normalizedNewName,
        city: formattedCity,
        state: newTeamState,
        mascol: formattedMascot,
        division: newTeamDivision
      }).select().single();

      if (error) throw error;

      setTeamForm(prev => ({
        ...prev,
        high_school: normalizedNewName,
        city: formattedCity,
        state: newTeamState
      }));
      setTeamSearchQuery(normalizedNewName);
      setShowAddTeamForm(false);
      setShowTeamDropdown(false);
      showToast(`${normalizedNewName} added to the global database.`, "success");

    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('unique')) {
         showToast("This exact High School and Location already exists in the system.", "error");
      } else {
         console.error("SUPABASE INSERT ERROR:", err); 
         showToast("Failed to create team. Ensure database schema is aligned.", "error");
      }
    }
  };

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    async function loadHomebase() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: coachData } = await supabase.from('coaches').select('id').eq('id', session.user.id).maybeSingle();
      if (coachData) { router.push('/dashboard/coach'); return; }

      const { data: athleteData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();
      if (athleteData) {
        
        if (!athleteData.is_founder && new Date() < PRO_LAUNCH_DATE) {
           await supabase.from('athletes').update({ is_founder: true }).eq('id', athleteData.id);
           athleteData.is_founder = true; 
        }

        let parsedResume: any = {};
        let masterAccolades: AccoladeObj[] = [];

        const sanitizeAccoladeText = (val: any, categoryStr: string): string => {
          const suffixCat = categoryStr && categoryStr !== 'General' ? ` (${categoryStr})` : '';

          if (!val) return '';
          if (typeof val === 'string') return `${val}${suffixCat}`.trim();
          
          if (typeof val === 'object') {
            if (val.placement && val.type) {
                let placeStr = String(val.placement).trim();
                const n = parseInt(placeStr);
                if (!isNaN(n) && !placeStr.match(/[a-z]/i)) {
                    const s = ["th", "st", "nd", "rd"];
                    const v = n % 100;
                    placeStr = n + (s[(v - 20) % 10] || s[v] || s[0]);
                }
                return `${placeStr} - ${val.type}${suffixCat}`.trim();
            }
            if (val.text) return `${val.text}${suffixCat}`.trim();
            if (val.title) return `${val.title}${suffixCat}`.trim();
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
              parsedResume.accolades.forEach((a: any) => {
                 const cleanText = sanitizeAccoladeText(a, 'General');
                 if (cleanText) masterAccolades.push({ text: cleanText, category: 'General' });
              });
            }
          } catch (e) {
            setSchoolPrefs(athleteData.saved_resume as string);
          }
        }

        setProfileForm({
          first_name: athleteData.first_name || '',
          last_name: athleteData.last_name || '',
          email: athleteData.email || session.user.email || '',
          gender: athleteData.gender || '',
          grad_year: athleteData.grad_year?.toString() || ''
        });

        if (athleteData.high_school) {
           setTeamForm({
             high_school: athleteData.high_school,
             city: athleteData.city || '',
             state: athleteData.state || ''
           });
           setTeamSearchQuery(athleteData.high_school);
        }

        if (!athleteData.first_name || !athleteData.last_name || !athleteData.email || !athleteData.gender || !athleteData.grad_year) {
          setIsBasicProfileModalOpen(true);
        }

        let { data: relationalSports, error: fetchErr } = await supabase
          .from('athlete_sports')
          .select('*')
          .eq('athlete_id', athleteData.id)
          .eq('is_active', true);

        if (fetchErr && (fetchErr.code === '42703' || fetchErr.message?.includes('is_active'))) {
           const fallback = await supabase.from('athlete_sports').select('*').eq('athlete_id', athleteData.id);
           relationalSports = fallback.data;
           fetchErr = fallback.error;
        }

        const mappedSportStats: any = {};

        if (!fetchErr && relationalSports) {
          const activeSportsFromDB: string[] = [];

          relationalSports.forEach(row => {
            activeSportsFromDB.push(row.sport_name);
            let parsedMetrics = [];
            let parsedMetaContext: any = {};
            try { parsedMetrics = Array.isArray(row.metrics) ? row.metrics : JSON.parse(row.metrics); } catch (e) {}
            try { parsedMetaContext = row.meta_context ? (typeof row.meta_context === 'string' ? JSON.parse(row.meta_context) : row.meta_context) : {}; } catch (e) {}
            
            if (parsedMetaContext.accolades && Array.isArray(parsedMetaContext.accolades)) {
               parsedMetaContext.accolades.forEach((a: any) => {
                 const cleanText = sanitizeAccoladeText(a, row.sport_name);
                 if (cleanText) masterAccolades.push({ text: cleanText, category: row.sport_name });
               });
            }

            mappedSportStats[row.sport_name] = {
              position: row.position || '',
              level: row.level_of_play || '',
              metrics: parsedMetrics || [],
              calculatedRating: row.custom_fit_score || 0,
              metaContext: parsedMetaContext
            };
          });
          
          if (activeSportsFromDB.length > 0) {
            athleteData.sports = activeSportsFromDB;
          }
        }

        const finalSportsList = athleteData.sports || [];
        finalSportsList.forEach((sport: string) => {
          if (!mappedSportStats[sport]) {
            mappedSportStats[sport] = { position: '', level: '', metrics: [], calculatedRating: 0, metaContext: {} };
          }
        });

        setSportStats(mappedSportStats);
        setAccolades(masterAccolades);
        if (masterAccolades.length > 0) {
          setSelectedAccolades(masterAccolades.slice(0, 3).map(a => a.text));
        }

        const todayStr = new Date().toLocaleDateString('en-CA');
        let currentStreak = athleteData.current_login_streak || 0;
        let currentCoins = athleteData.coins || 0;
        const lastLoginStr = athleteData.last_login_date;
        let earnedCoinsToday = 0;

        if (lastLoginStr !== todayStr) {
          let newStreak = 1; 
          if (lastLoginStr) {
            const todayDate = new Date(todayStr);
            const lastDate = new Date(lastLoginStr);
            const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) newStreak = currentStreak + 1;
            else newStreak = 1;
          }

          const baseDailyReward = 100;
          earnedCoinsToday = Math.round(baseDailyReward * Math.pow(1.02, newStreak - 1));

          if (newStreak > 0 && newStreak % 7 === 0) {
            earnedCoinsToday += 1000;
          }

          currentCoins += earnedCoinsToday;

          setStreak(newStreak);
          setCoins(currentCoins);
          setAwardedToday(earnedCoinsToday);
          
          await supabase.from('athletes').update({ 
            current_login_streak: newStreak, 
            last_login_date: todayStr,
            coins: currentCoins
          }).eq('id', athleteData.id);
          
          athleteData.coins = currentCoins;
        } else {
          setStreak(currentStreak);
          setCoins(currentCoins);
        }

        setAthleteProfile(athleteData);

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
        } catch (e) {}
      }

      const { data: savedCollegesData } = await supabase.from('saved_colleges').select(`id, college_id, universities (*)`).eq('athlete_id', session.user.id);
      if (savedCollegesData) {
        setSavedColleges(savedCollegesData);
        if (savedCollegesData.length > 0) setIsCollegesOpen(true); 
      }

      setLoading(false);
    }
    loadHomebase();
  }, [supabase, router]);

  const handleSaveBasicProfile = async () => {
    if (!profileForm.first_name || !profileForm.last_name || !profileForm.email || !profileForm.gender || !profileForm.grad_year) {
      showToast("All fields are required to secure your identity.", "error");
      return;
    }
    try {
      await supabase.from('athletes').update({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        email: profileForm.email,
        gender: profileForm.gender,
        grad_year: parseInt(profileForm.grad_year, 10)
      }).eq('id', athleteProfile.id);

      setAthleteProfile({ 
        ...athleteProfile, 
        first_name: profileForm.first_name, 
        last_name: profileForm.last_name,
        email: profileForm.email,
        gender: profileForm.gender,
        grad_year: parseInt(profileForm.grad_year, 10)
      });
      setIsBasicProfileModalOpen(false);
      showToast("Basic identity secured.", "success");
      setIframeKey(prev => prev + 1);
    } catch (err) {
      showToast("Failed to save profile.", "error");
    }
  };

  const handleSaveTeamJoin = async () => {
    if (!teamForm.high_school || !teamForm.state) {
      showToast("Please verify your school to join the roster.", "error");
      return;
    }
    try {
      await supabase.from('athletes').update({
        high_school: teamForm.high_school,
        city: teamForm.city,
        state: teamForm.state
      }).eq('id', athleteProfile.id);

      setAthleteProfile({ 
        ...athleteProfile, 
        high_school: teamForm.high_school,
        city: teamForm.city,
        state: teamForm.state
      });
      setIsTeamJoinModalOpen(false);
      showToast(`Welcome to the ${teamForm.high_school} roster!`, "success");
    } catch (err) {
      showToast("Failed to join team.", "error");
    }
  };

  const syncSportToSupabase = async (sport: string, updatedData: any) => {
    if (!athleteProfile?.id) return;
    
    const genderKey = athleteProfile?.gender === 'Girls' || athleteProfile?.gender === 'Women' ? 'Girls' : 'Boys';
    const spec = SPORT_CONFIGS_META[sport];
    let rating = 0;
    
    if (!['Cross Country', 'Swimming & Diving', 'Football', 'Soccer', 'Lacrosse', 'Field Hockey', 'Basketball', 'Volleyball', 'Wrestling', 'Baseball', 'Softball', 'Golf', 'Tennis', 'Ice Hockey', 'Water Polo', 'Gymnastics', 'Bowling', 'Fencing'].includes(sport) && spec) {
        let baseRankScore = 45;
        if (spec.requiresLevel) {
          if (updatedData.level === 'JV / Dev Squad') baseRankScore = 40;
          else if (updatedData.level === 'Varsity Contributor') baseRankScore = 60;
          else if (updatedData.level === 'Varsity Starter') baseRankScore = 70;
          else if (updatedData.level === 'All-Conference Tier') baseRankScore = 80;
          else if (updatedData.level === 'All-State / National') baseRankScore = 90;
          else if (updatedData.level === 'Elite Club (ECNL / AAU / Next)') baseRankScore = 85;
          else baseRankScore = 50;
        } else {
          baseRankScore = 60;
        }

        let highestMetricScore = 0;
        let totalMetricScore = 0;
        let validMetricCount = 0;

        if (updatedData.metrics && updatedData.metrics.length > 0) {
          updatedData.metrics.forEach((m: {name: string, value: string}) => {
             const evalResult = evaluateMetric(genderKey, sport, m.name, m.value, updatedData.level);
             if (evalResult) {
               validMetricCount++;
               totalMetricScore += evalResult.score;
               if (evalResult.score > highestMetricScore) highestMetricScore = evalResult.score;
             }
          });
        }

        if (spec.requiresLevel) {
           if (validMetricCount > 0) {
              const avgMetricScore = totalMetricScore / validMetricCount;
              const statPower = (avgMetricScore * 0.4) + (highestMetricScore * 0.6);
              rating = Math.round((baseRankScore * 0.4) + (statPower * 0.6));
           } else {
              rating = Math.max(15, baseRankScore - 35);
           }
        } else {
           rating = validMetricCount > 0 ? highestMetricScore : 0;
        }
        updatedData.calculatedRating = Math.min(99, Math.max(15, rating));
    }
    
    setSportStats(prev => ({ ...prev, [sport]: updatedData }));

    let payload: any = {
      athlete_id: athleteProfile.id,
      sport_name: sport,
      position: updatedData.position || null,
      level_of_play: updatedData.level || null,
      athleticism_tier: null,
      metrics: updatedData.metrics || [],
      custom_fit_score: updatedData.calculatedRating,
      meta_context: updatedData.metaContext || {},
      is_active: true
    };

    let { error } = await supabase.from('athlete_sports').upsert(payload, { onConflict: 'athlete_id, sport_name' });

    if (error && error.message.includes('is_active')) {
      delete payload.is_active;
      const fallback = await supabase.from('athlete_sports').upsert(payload, { onConflict: 'athlete_id, sport_name' });
      error = fallback.error;
    }

    if (error) console.error("Supabase Sync Error: ", error.message);
    else setIframeKey(prev => prev + 1);
  };

  const handleToggleSport = async (sportName: string) => {
    if (!athleteProfile?.id) return;
    try {
      const currentSports = athleteProfile.sports || [];
      let newSports;
      
      if (currentSports.includes(sportName)) {
        newSports = currentSports.filter((s: string) => s !== sportName);
        let payload: any = { athlete_id: athleteProfile.id, sport_name: sportName, is_active: false };
        let { error } = await supabase.from('athlete_sports').upsert(payload, { onConflict: 'athlete_id, sport_name' });
        
        if (error && error.message.includes('is_active')) {
          delete payload.is_active; 
          await supabase.from('athlete_sports').delete().eq('athlete_id', athleteProfile.id).eq('sport_name', sportName);
        }
      } else {
        newSports = [...currentSports, sportName];
        const blankStats = { position: '', level: '', metrics: [], metaContext: {} };
        if (!sportStats[sportName]) setSportStats(prev => ({ ...prev, [sportName]: blankStats }));
        await syncSportToSupabase(sportName, blankStats);
      }

      setAthleteProfile({ ...athleteProfile, sports: newSports });
      supabase.from('athletes').update({ sports: newSports }).eq('id', athleteProfile.id).then(() => setIframeKey(prev => prev + 1));
      showToast(`${sportName} array alignment updated.`, 'success');
    } catch (err) {
      showToast("Failed to update sports alignment", "error");
    }
  };

  const handleRemoveCollegeDashboard = async (savedId: string) => {
    try {
      await supabase.from('saved_colleges').delete().eq('id', savedId);
      setSavedColleges(prev => prev.filter(c => c.id !== savedId));
      showToast("College removed.", "success");
    } catch (err) { console.error(err); }
  };

  const autoSavePortfolio = async (overrides?: Partial<{ gpa: string, intendedMajor: string, accolades: string[], schoolPrefs: string }>) => {
    if (!athleteProfile?.id) return;
    try {
      let currentResume = typeof athleteProfile.saved_resume === 'string' ? JSON.parse(athleteProfile.saved_resume) : (athleteProfile.saved_resume || {});
      const { sportStats: legacyStats, ...cleanResume } = currentResume;
      
      const payload = {
        ...cleanResume,
        gpa: overrides?.gpa ?? gpa, 
        intendedMajor: overrides?.intendedMajor ?? intendedMajor, 
        accolades: overrides?.accolades ?? accolades.filter(a => a.category === 'General').map(a => a.text), 
        schoolPrefs: overrides?.schoolPrefs ?? schoolPrefs
      };

      await supabase.from('athletes').update({ saved_resume: payload }).eq('id', athleteProfile.id);
      setAthleteProfile((prev: any) => ({ ...prev, saved_resume: payload }));
      setIframeKey(prev => prev + 1);
    } catch (err) { 
      console.error(err); 
    }
  };

  const addAccolade = () => {
    if (!newAccolade.trim() || accolades.some(a => a.text === newAccolade.trim())) return;
    
    const newObj = { text: newAccolade.trim(), category: newAccoladeCategory };
    const newAccs = [...accolades, newObj];
    setAccolades(newAccs);
    setNewAccolade('');

    if (selectedAccolades.length < 3) setSelectedAccolades([...selectedAccolades, newObj.text]);

    if (newObj.category === 'General') {
       const generalAccs = newAccs.filter(a => a.category === 'General').map(a => a.text);
       autoSavePortfolio({ accolades: generalAccs });
    } else {
       const sportAccs = newAccs.filter(a => a.category === newObj.category).map(a => a.text);
       const currentStats = sportStats[newObj.category] || { metaContext: {} };
       const updatedStats = { ...currentStats, metaContext: { ...currentStats.metaContext, accolades: sportAccs }};
       setSportStats(prev => ({ ...prev, [newObj.category]: updatedStats }));
       syncSportToSupabase(newObj.category, updatedStats);
    }
    
    showToast(`Saved to ${newObj.category === 'General' ? 'Academic Profile' : newObj.category}`, "success");
  };

  const removeAccolade = (accObj: AccoladeObj) => {
    const newAccs = accolades.filter(a => a.text !== accObj.text);
    setAccolades(newAccs);
    setSelectedAccolades(prev => prev.filter(a => a !== accObj.text));

    if (accObj.category === 'General') {
       const generalAccs = newAccs.filter(a => a.category === 'General').map(a => a.text);
       autoSavePortfolio({ accolades: generalAccs });
    } else {
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
      if (!element) throw new Error("Card element not found.");
      
      const canvas = await html2canvas(element, { backgroundColor: null, scale: 3, useCORS: true });
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `${athleteProfile?.last_name}_RecruitingProfile.png`;
      link.href = dataUrl;
      link.click();
      showToast("Graphic exported successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export graphic.", "error");
    } finally {
      setIsExportingCard(false);
    }
  };

  const userSports = athleteProfile?.sports || [];
  const primarySportQuery = userSports.length > 0 ? userSports[0] : 'general';
  const genderKey = athleteProfile?.gender === 'Girls' || athleteProfile?.gender === 'Women' ? 'Girls' : 'Boys';

  const allAvailableMetrics = useMemo(() => {
    const list: {
      id: string, label: string, value: string, source: string, score: number, tier: string, nextTier: string, scoreRequired: number,
      colorClass: string, bgClass: string, barClass: string, borderClass: string, glowClass: string, levelUpMessage: string
    }[] = [];
    
    Object.keys(sportStats).forEach(sport => {
      const stats = sportStats[sport];
      if (stats?.metrics && stats.metrics.length > 0) {
        stats.metrics.forEach((m: any) => {
          
          if (sport === 'Track & Field') {
            const evalResult = evaluateMetric(genderKey, 'Track & Field', m.name, m.value, 'Varsity');
            const score = m.score || evalResult?.score || stats.calculatedRating || 50; 
            const styles = getTierStyles(score);

            let levelUpMessage = "Keep training to unlock the next performance tier!";
            const genderStandards = RECRUITING_STANDARDS_DASHBOARD[genderKey];
            const eventStandards = genderStandards?.[m.name];

            if (eventStandards) {
              const currentVal = parseMarkToNumber(m.value);
              let targetKey: keyof typeof eventStandards = 't6';
              
              if (score >= 85) targetKey = 't1';
              else if (score >= 75) targetKey = 't2';
              else if (score >= 65) targetKey = 't3';
              else if (score >= 55) targetKey = 't4';
              else if (score >= 40) targetKey = 't5';
              else if (score >= 20) targetKey = 't6';
              
              const targetVal = eventStandards[targetKey] as number;

              if (currentVal && targetVal) {
                if (eventStandards.isField) {
                  const diff = targetVal - currentVal;
                  if (diff > 0) levelUpMessage = `Add +${formatInchesToFeet(diff)} to your mark to reach the ${styles.nextTier} bracket.`;
                } else {
                  const diff = currentVal - targetVal;
                  if (diff > 0) levelUpMessage = `Run ${diff.toFixed(2)}s faster to scale up to the ${styles.nextTier} bracket.`;
                }
              }
            }
            if (score >= 95) levelUpMessage = "👑 MAX TIER REACHED. You possess elite standard metrics for this event.";
            list.push({ id: `track-${m.name}`, label: m.name, value: m.value, source: 'Track', score, ...styles, levelUpMessage });
            
          } else {
            const evalResult = evaluateMetric(genderKey, sport, m.name, m.value, stats.level || 'Varsity');
            const score = m.score || evalResult?.score || stats.calculatedRating || 40;
            const styles = getTierStyles(score);
            const ptsNeeded = styles.scoreRequired - score;
            
            const levelUpMessage = score >= 95 
              ? "👑 MAX TIER UNLOCKED. Your metrics sit at the pinnacle of this position category."
              : `Earn +${ptsNeeded} Recruit Rating points to reach the ${styles.nextTier} bracket. Update your metrics or Level of Play to recalculate.`;

            list.push({ id: `${sport}-${m.name}`, label: m.name, value: m.value, source: sport, score, ...styles, levelUpMessage });
          }
        });
      }
    });

    return list.sort((a, b) => b.score - a.score); 
  }, [sportStats, genderKey]);

  const maxScore = useMemo(() => {
    return allAvailableMetrics.length > 0 ? Math.max(...allAvailableMetrics.map(m => m.score)) : 15;
  }, [allAvailableMetrics]);

  const bleedColors = useMemo(() => {
    if (maxScore >= 95) return { orb1: 'bg-fuchsia-500/15', orb2: 'bg-purple-500/15' };
    if (maxScore >= 85) return { orb1: 'bg-purple-500/15', orb2: 'bg-indigo-500/15' };
    if (maxScore >= 75) return { orb1: 'bg-blue-500/15', orb2: 'bg-cyan-500/15' };
    if (maxScore >= 65) return { orb1: 'bg-emerald-500/15', orb2: 'bg-teal-500/15' };
    if (maxScore >= 55) return { orb1: 'bg-amber-500/15', orb2: 'bg-orange-500/15' };
    return { orb1: 'bg-slate-400/10', orb2: 'bg-slate-300/10' };
  }, [maxScore]);

  const readiness = useMemo(() => {
    let score = 0;
    let nextQuest = "Profile complete! You are fully optimized for the Matchmaker.";
    
    if (athleteProfile?.first_name && athleteProfile?.last_name) score += 10;
    
    if (athleteProfile?.trust_level === 1) score += 10; else if (score >= 10) nextQuest = "Verify your account identity to unlock the Team HQ.";
    
    if (athleteProfile?.high_school && athleteProfile?.state) score += 10; else if (score >= 20) nextQuest = "Search and join your High School team roster.";
    
    if (gpa) score += 15; else if (score >= 30) nextQuest = "Add your Unweighted GPA below to boost your Matchmaker visibility.";
    if (intendedMajor) score += 15; else if (score >= 45) nextQuest = "Define an Intended Major below to unlock academic matching.";
    if (accolades.length > 0) score += 15; else if (score >= 60) nextQuest = "Log your first Season Accolade to prove your leadership.";
    if (allAvailableMetrics.length > 0) score += 25; else if (score >= 75) nextQuest = "Sync a sport metric to activate the Recruit Engine.";

    return { score: Math.min(100, score), nextQuest };
  }, [athleteProfile, gpa, intendedMajor, accolades, allAvailableMetrics]);

  useEffect(() => {
     if (selectedMetrics.length === 0 && allAvailableMetrics.length > 0) {
        setSelectedMetrics(allAvailableMetrics.slice(0, 4).map(m => m.label));
     }
  }, [allAvailableMetrics, selectedMetrics.length]);

  const handleToggleMetric = (label: string) => {
    if (selectedMetrics.includes(label)) setSelectedMetrics(selectedMetrics.filter(e => e !== label));
    else {
      if (selectedMetrics.length >= 4) return showToast("Max 4 metrics on the graphic.", "error");
      setSelectedMetrics([...selectedMetrics, label]);
    }
  };

  const handleToggleAccolade = (acc: string) => {
    if (selectedAccolades.includes(acc)) setSelectedAccolades(selectedAccolades.filter(a => a !== acc));
    else {
      if (selectedAccolades.length >= 3) return showToast("Max 3 Accolades on the graphic.", "error");
      setSelectedAccolades([...selectedAccolades, acc]);
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

  const handleTeamHQClick = () => {
    if (athleteProfile?.trust_level !== 1) {
      setIsEmailVerificationModalOpen(true);
    } else if (!athleteProfile?.high_school) {
      setIsTeamJoinModalOpen(true);
    } else {
      router.push('/dashboard/team');
    }
  };

  const renderSportBlock = (sport: string) => {
    const isCollapsed = collapsedSports[sport] || false;
    const stats = sportStats[sport] || { calculatedRating: 0 };
    
    let displayRating = stats.calculatedRating || 0;

    if (sport === 'Track & Field') {
      const trackMetrics = allAvailableMetrics.filter(m => m.source === 'Track' || m.source === 'Track & Field');
      if (trackMetrics.length > 0) {
        displayRating = Math.max(...trackMetrics.map(m => m.score));
      } else {
        displayRating = 15; 
      }
    } else {
      displayRating = Math.max(15, displayRating);
    }

    const tierStyles = getTierStyles(displayRating);
    const displayLevelText = sport === 'Track & Field' ? 'Deterministic Evaluation' : (stats.level || tierStyles.tier);
    const config = SPORT_CONFIGS_META[sport];
    
    if (!config) return null;

    return (
      <div key={sport} className="bg-slate-950 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden flex-1">
        <button 
          onClick={() => toggleSportCollapse(sport)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-900/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <TrendingUp className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-black text-white">{sport}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                {displayLevelText}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
             <div className={`px-4 py-2 rounded-xl border ${tierStyles.borderClass} ${tierStyles.bgClass} flex items-center gap-2`}>
                <span className={`text-xl sm:text-2xl font-black ${tierStyles.colorClass}`}>{displayRating}</span>
                <span className="text-[10px] font-black text-slate-500 uppercase">/99</span>
             </div>
             <div className="hidden sm:block">
               {isCollapsed ? <ChevronDown className="text-slate-500" /> : <ChevronUp className="text-slate-500" />}
             </div>
          </div>
        </button>
        
        {!isCollapsed && (
          <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/30 animate-in fade-in slide-in-from-top-2 duration-300">
             <SportEditorRegistry 
               sport={sport}
               sportStats={sportStats[sport] || { metrics: [], metaContext: {} }}
               genderKey={genderKey}
               athleteProfile={athleteProfile}
               config={config}
               onSync={(updatedData) => syncSportToSupabase(sport, updatedData)}
               showToast={showToast}
             />
          </div>
        )}
      </div>
    );
  };

  const RenderHomeTab = useMemo(() => {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* TOP MULTI-COLUMN LAYOUT: Shortcuts + Analytics Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
              
              {/* 🚨 TIMED ADAPTIVE ACCESS WRAPPER: EMAIL STUDIO 🚨 */}
              {gatingMode.hasAccess ? (
                <ProGate athleteProfile={athleteProfile} featureName="Email Studio">
                  <TiltCard className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-[2rem] p-6 sm:p-8 shadow-md border border-blue-800 h-full relative">
                    <div className="absolute top-4 right-4 bg-amber-500/20 text-amber-300 font-bold tracking-widest text-[9px] uppercase border border-amber-500/30 px-2 py-0.5 rounded-md">
                      {gatingMode.label}
                    </div>
                    <Link href="/dashboard/email-builder" className="block w-full h-full">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[40px] rounded-full pointer-events-none"></div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                          <Mail className="w-6 h-6 text-blue-400" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h3 className="text-xl font-black text-white mb-1">Email Studio</h3>
                      <p className="text-blue-100/70 text-sm font-medium">Auto-generate customized templates using sport-specific metrics.</p>
                    </Link>
                  </TiltCard>
                </ProGate>
              ) : (
                <div className="bg-slate-900/40 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 border border-slate-800/80 h-full flex flex-col justify-center items-center text-center relative group overflow-hidden shadow-inner">
                  <div className="absolute top-4 right-4 bg-slate-800 text-slate-500 font-bold tracking-widest text-[9px] uppercase px-2 py-0.5 rounded-md">
                    Locked
                  </div>
                  <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 mb-3 shadow-md">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-black text-slate-200 mb-1">Email Studio</h3>
                  <p className="text-slate-500 text-xs px-2 mb-4 leading-relaxed">
                    {gatingMode.isPreLaunch 
                      ? "Exclusive early access feature locked. Complete verification or wait for the global public release."
                      : "Premium recruitment studio locked. Upgrade your tier matrix status to activate automatic messaging engines."}
                  </p>
                  {!gatingMode.isPreLaunch && (
                    <Link href="/pro" className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black px-4 py-1.5 rounded-xl shadow-md text-xs hover:scale-105 transition-transform flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" /> Unlock Pro
                    </Link>
                  )}
                </div>
              )}

              <TiltCard className="bg-gradient-to-br from-emerald-900 to-teal-950 rounded-[2rem] p-6 sm:p-8 shadow-md border border-emerald-800 h-full">
                <div onClick={() => { goToTab('social'); setSocialSubTab('portfolio'); }} className="block w-full h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[40px] rounded-full pointer-events-none"></div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                      <ImageIcon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-1">Portfolio & Fine-Tuning</h3>
                  <p className="text-emerald-100/70 text-sm font-medium">Manage your public website and build custom social graphics.</p>
                </div>
              </TiltCard>
            </div>

            {userSports.includes('Track & Field') && (
              <div className="bg-gradient-to-br from-indigo-900 to-blue-950 rounded-[2rem] p-6 md:p-8 shadow-xl border border-indigo-800 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                 <h2 className="text-2xl font-black mb-2 flex items-center gap-3 relative z-10">
                    <Sparkles className="w-6 h-6 text-blue-400"/> Track & Field Extensions Unlocked
                 </h2>
                 <p className="text-indigo-200 mb-6 font-medium text-sm relative z-10">Deterministic tracking tools active for your verified race marks.</p>
                 
                 <div className="grid grid-cols-1 gap-4 relative z-10 max-w-md">
                    <Link href="/dashboard/track" className="bg-white/10 hover:bg-white/20 border border-white/10 p-6 rounded-2xl transition-all shadow-sm flex flex-col">
                       <h3 className="text-lg font-bold text-white mb-1">Track Portal</h3>
                       <p className="text-sm text-indigo-200">Synchronize official Athletic.net entries to claim profile verification status.</p>
                    </Link>
                 </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
             <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 h-full flex flex-col">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" /> Analytics
                  </h2>
                  <button 
                    onClick={() => { goToTab('social'); setSocialSubTab('analytics'); }} 
                    className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-widest"
                  >
                    Full Report
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-black text-slate-900">{athleteProfile?.is_premium ? athleteProfile.search_appearances || 0 : '241'}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Impressions</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-black text-slate-900">{athleteProfile?.profile_views || 0}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Views</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-black text-slate-900">{athleteProfile?.is_premium ? monthlyViews : '89'}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">This Month</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <UserCircle2 className="w-4 h-4 text-slate-400"/> Recent Coach Views
                  </h3>
                  
                  <div className="flex-1 relative">
                    <ProGate athleteProfile={athleteProfile} featureName="Coach View Logs">
                      <div className="space-y-2">
                        {recentViewers.length > 0 ? (
                          recentViewers.map((coach, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <div className="flex items-center gap-3 min-w-0">
                                 <AvatarWithBorder avatarUrl={coach.avatar_url} borderId="none" sizeClasses="w-8 h-8 shrink-0" userRole="coach" />
                                 <div className="min-w-0">
                                   <p className="font-black text-slate-900 text-xs truncate">Coach {coach.last_name}</p>
                                   <p className="text-[9px] font-bold text-slate-500 truncate">{coach.school_name}</p>
                                 </div>
                              </div>
                              <button 
                                onClick={() => handleContactCoach(coach.email)} 
                                className="w-7 h-7 rounded-full bg-white text-slate-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all border border-slate-200 shadow-sm shrink-0 ml-2"
                              >
                                 <Mail className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 flex flex-col items-center justify-center text-center bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                            <Eye className="w-6 h-6 text-slate-300 mb-2" />
                            <p className="text-xs font-medium text-slate-400 italic">No recent views.</p>
                          </div>
                        )}
                      </div>
                    </ProGate>
                  </div>
                </div>

                {/* --- SQUAD COMMAND CENTER (Updated) --- */}
                <div 
                  className="mt-6 bg-gradient-to-br from-fuchsia-900 to-purple-950 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group cursor-pointer border border-fuchsia-500/50 hover:border-fuchsia-400 transition-colors" 
                  onClick={handleTeamHQClick}
                >
                   {/* Slick Background Ambient Glows */}
                   <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-500/20 blur-[50px] rounded-full pointer-events-none group-hover:bg-fuchsia-400/30 transition-all duration-500"></div>
                   <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 blur-[40px] rounded-full pointer-events-none"></div>

                   <div className="flex justify-between items-center mb-4 relative z-10">
                      <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-fuchsia-500/20 text-fuchsia-200 px-2.5 py-1 rounded-lg border border-fuchsia-500/30">
                        {athleteProfile?.trust_level !== 1 ? <ShieldAlert className="w-4 h-4 text-amber-400" /> : <Users className="w-4 h-4" />} 
                        Team HQ
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all">
                        <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 group-hover:opacity-100 transition-all" />
                      </div>
                   </div>

                   <div className="relative z-10">
                     <h3 className="text-xl font-black leading-tight mb-2 text-white group-hover:text-fuchsia-100 transition-colors">
                        {athleteProfile?.trust_level !== 1 
                          ? "Verify identity to unlock the roster." 
                          : "Enter the Squad Command Center"}
                     </h3>
                     <p className="text-sm font-medium text-fuchsia-200/70 leading-relaxed mb-4">
                        {athleteProfile?.trust_level !== 1 
                          ? "Secure your account to join your high school teammates." 
                          : "Pool your ChasedCash to unlock team-wide UI upgrades, dynamic banners, and level up your roster."}
                     </p>
                   </div>

                   {/* Slick visual replacement for the fake progress bar */}
                   {athleteProfile?.trust_level === 1 && (
                     <div className="relative z-10 flex items-center gap-3 pt-4 border-t border-fuchsia-500/30 mt-auto">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-fuchsia-900 flex items-center justify-center shadow-sm relative z-30"><Users className="w-3.5 h-3.5 text-fuchsia-400" /></div>
                          <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-fuchsia-900 flex items-center justify-center shadow-sm relative z-20"><Flame className="w-3.5 h-3.5 text-amber-500" /></div>
                          <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-fuchsia-900 flex items-center justify-center shadow-sm relative z-10"><Zap className="w-3.5 h-3.5 text-blue-400" /></div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300">Access Hub</span>
                     </div>
                   )}
                </div>

             </div>
          </div>
        </div>

        {/* DYNAMIC SPORT REGISTRY EDITOR LOOP */}
        {userSports.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-black text-slate-900 mb-6 px-1 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" /> Performance Hub
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {userSports.map((sport: string) => renderSportBlock(sport))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
           <button 
             onClick={() => setIsCollegesOpen(!isCollegesOpen)} 
             className="w-full flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 bg-white hover:bg-slate-50 transition-colors gap-4"
           >
              <div className="flex items-center gap-4 text-left">
                 <div className="w-14 h-14 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                    <Bookmark className="w-6 h-6 text-blue-600 fill-blue-600" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Target Colleges Board</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">{savedColleges.length} programs loaded in tracked database metrics</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 self-end md:self-auto">
                {isCollegesOpen ? <ChevronUp className="w-6 h-6 text-slate-400 shrink-0" /> : <ChevronDown className="w-6 h-6 text-slate-400 shrink-0" />}
              </div>
           </button>

           {isCollegesOpen && (
              <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 animate-in fade-in slide-in-from-top-4 duration-300">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                      <Scale className="w-5 h-5 text-blue-500" /> College Comparison Board
                    </h3>
                    <Link href="/search" className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 justify-center">
                       Find More Colleges <Search className="w-4 h-4" />
                    </Link>
                 </div>

                 {savedColleges.length > 0 ? (
                   <div className="overflow-x-auto custom-scrollbar pb-4">
                     <table className="w-full text-left min-w-[900px]">
                       <thead>
                         <tr className="border-b-2 border-slate-200">
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Program</th>
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Athletic Match</th>
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Net Tuition / Yr</th>
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">10-Yr Salary</th>
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Acceptance</th>
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Size</th>
                           <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500 text-center">Action</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {savedColleges.map((saved: any) => {
                            const college = saved.universities; 
                            if (!college) return null;
                            const stats = getRealStats(college);

                            return (
                              <tr key={saved.id} className="bg-white hover:bg-blue-50/50 transition-colors group">
                                <td className="p-4 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden">
                                    {college.logo_url ? <img src={college.logo_url} className="w-6 h-6 object-contain" /> : <School className="w-5 h-5 text-slate-400" />}
                                  </div>
                                  <div className="truncate max-w-[200px]">
                                    <Link href={`/college/${college.id}?sport=${primarySportQuery}`} className="font-black text-slate-900 hover:text-blue-600 transition-colors block truncate">{college.name}</Link>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{college.division} • {college.state}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">{stats.matchScore > 0 ? stats.matchScore : '-'}</span>
                                </td>
                                <td className="p-4 font-black text-slate-700">{stats.tuitionStr}</td>
                                <td className="p-4 font-black text-emerald-600">{stats.salaryStr}</td>
                                <td className="p-4 font-bold text-slate-600">{stats.gradRateStr}</td>
                                <td className="p-4 font-bold text-slate-600">{stats.popStr}</td>
                                <td className="p-4 text-center">
                                  <button 
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveCollegeDashboard(saved.id); }} 
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors inline-block"
                                    title="Remove from board"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            )
                         })}
                       </tbody>
                     </table>
                   </div>
                 ) : (
                   <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center">
                      <School className="w-12 h-12 text-slate-300 mb-4" />
                      <h4 className="text-lg font-black text-slate-900 mb-1">Your board is empty</h4>
                      <p className="text-sm text-slate-500 font-medium max-w-sm leading-relaxed mb-6">Head over to the Matchmaker to search the database and add colleges to compare.</p>
                      <Link href="/search" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-md">
                         Open College Finder
                      </Link>
                   </div>
                 )}
              </div>
           )}
        </div>
      </div>
    )
  }, [userSports, sportStats, savedColleges, isCollegesOpen, athleteProfile, genderKey, allAvailableMetrics, dailyViews, monthlyViews, recentViewers, collapsedSports, router, gatingMode]);

  const RenderSocialTab = useMemo(() => {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Core Settings / Theme Bar (Always Visible) */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden z-20 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="flex items-center gap-4 mb-5 relative z-10">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl border border-blue-500/30 flex items-center justify-center shrink-0">
              {athleteProfile?.trust_level === 1 ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Lock className="w-6 h-6 text-amber-500" />}
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">{athleteProfile?.trust_level === 1 ? "Portfolio Live" : "Portfolio Unverified"}</h3>
              <p className="text-xs font-medium text-slate-400">{athleteProfile?.trust_level === 1 ? "Coaches can search and view your profile." : "Sync a sport to verify and go public."}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 relative z-10">
            <Link 
               href="/customize" 
               className="bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
               <Paintbrush className="w-4 h-4" /> Edit Theme & Design
            </Link>
            {athleteProfile?.trust_level === 1 && (
              <button 
                 onClick={() => {
                   navigator.clipboard.writeText(`${window.location.origin}/athlete/${athleteProfile?.id}`);
                   showToast("Portfolio link copied to clipboard!", "success");
                 }}
                 className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                 <LinkIcon className="w-4 h-4" /> Copy Link
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Navigation Sub-Tabs */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-full sm:w-fit border border-slate-200 shadow-inner overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setSocialSubTab('portfolio')} 
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap ${socialSubTab === 'portfolio' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Globe className="w-4 h-4" /> Web Portfolio
          </button>
          <button 
            onClick={() => setSocialSubTab('social_card')} 
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap ${socialSubTab === 'social_card' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <ImageIcon className="w-4 h-4" /> Social Graphics
          </button>
          <button 
            onClick={() => setSocialSubTab('analytics')} 
            className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap ${socialSubTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <BarChart3 className="w-4 h-4" /> Analytics
          </button>
        </div>

        {/* VIEW 1: WEB PORTFOLIO CONFIG */}
        {socialSubTab === 'portfolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
             <div className="lg:col-span-7">
                <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-6 border-b border-slate-100 gap-4">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center">
                          <FileText className="w-6 h-6 mr-3 text-blue-500" /> Public Resume Details
                        </h2>
                        <p className="text-slate-500 font-medium text-sm mt-1">Fine-tune academics and honors for your public profile.</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Unweighted GPA Scale</label>
                            <input 
                              type="number" step="0.01" min="0" max="5" 
                              value={gpa} 
                              onChange={(e) => setGpa(e.target.value)} 
                              onBlur={() => autoSavePortfolio()}
                              placeholder="e.g. 3.95" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                         </div>
                         <div className="relative" ref={majorDropdownRef}>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Intended Major Category</label>
                            <input 
                              type="text" 
                              value={intendedMajor} 
                              onFocus={() => setShowMajorDropdown(true)} 
                              onChange={(e) => { 
                                setIntendedMajor(e.target.value); 
                                setShowMajorDropdown(true); 
                              }} 
                              onBlur={() => autoSavePortfolio()}
                              placeholder="Search categories..." 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {showMajorDropdown && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                {SUGGESTED_MAJORS.filter(m => m.toLowerCase().includes(intendedMajor.toLowerCase())).map((m: string, idx: number) => (
                                  <button 
                                    key={idx} type="button" 
                                    onClick={() => { 
                                      setIntendedMajor(m); 
                                      setShowMajorDropdown(false);
                                      autoSavePortfolio(); 
                                    }} 
                                    className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 hover:bg-blue-50 rounded-lg transition-colors"
                                  >
                                    {m}
                                  </button>
                                ))}
                              </div>
                            )}
                         </div>
                      </div>

                      <div>
                         <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Platform Honors / Accolades</label>
                         
                         <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 mb-4 flex items-start gap-2.5 shadow-sm">
                           <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                           <p className="text-[10px] font-bold text-blue-700/80 leading-relaxed uppercase tracking-wide">
                             Select the scope of your accolade to ensure it attaches to the proper profile segment. Academic honors will display globally.
                           </p>
                         </div>

                         {accolades.length > 0 ? (
                           <div className="space-y-2 mb-3">
                              {accolades.map((acc, i) => (
                                <div key={i} className="flex items-center justify-between bg-white border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm">
                                  <div className="flex items-center gap-3 truncate pr-4">
                                     <span className="text-[9px] font-black uppercase tracking-widest text-white bg-slate-800 px-2 py-1 rounded shrink-0 shadow-sm">
                                       {acc.category === 'General' ? 'Academic' : acc.category}
                                     </span>
                                     <span className="truncate">{acc.text}</span>
                                  </div>
                                  <button onClick={() => removeAccolade(acc)} className="text-slate-400 hover:text-red-500 shrink-0"><X className="w-4 h-4"/></button>
                                </div>
                              ))}
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center p-6 mb-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center group transition-colors hover:border-blue-300 hover:bg-blue-50/50">
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-3 group-hover:scale-110 transition-transform">
                                 <Trophy className="w-6 h-6 text-yellow-500" />
                              </div>
                              <h4 className="text-sm font-black text-slate-800 mb-1">No Honors Logged Yet</h4>
                              <p className="text-xs font-medium text-slate-500 max-w-xs">College coaches look for leadership and achievements. Add your first academic or athletic accolade below!</p>
                           </div>
                         )}
                         
                         <div className={`flex flex-col sm:flex-row gap-2 transition-all duration-500 ${accolades.length === 0 ? 'ring-2 ring-blue-500/20 rounded-xl p-1' : ''}`}>
                           <select 
                             value={newAccoladeCategory}
                             onChange={(e) => setNewAccoladeCategory(e.target.value)}
                             className="sm:w-1/3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                           >
                             <option value="General">General / Academic</option>
                             {userSports.map((s: string) => <option key={s} value={s}>{s}</option>)}
                           </select>
                           <input 
                             type="text" 
                             value={newAccolade} 
                             onChange={(e) => setNewAccolade(e.target.value)} 
                             onKeyDown={(e) => { if (e.key === 'Enter') addAccolade(); }} 
                             placeholder="Accolade detail (e.g. Regional Champion)" 
                             className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                           />
                           <button onClick={() => addAccolade()} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 sm:py-0 rounded-xl font-bold transition-colors shrink-0 flex items-center justify-center shadow-md">
                             <Plus className="w-5 h-5"/>
                           </button>
                         </div>
                      </div>

                      <div>
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">School Culture Preferences</label>
                        <textarea 
                          value={schoolPrefs} 
                          onChange={(e) => setSchoolPrefs(e.target.value)} 
                          onBlur={() => autoSavePortfolio()}
                          placeholder="Define target program cultures or regional limits for coach searches..." 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                        />
                      </div>
                   </div>
                </div>
             </div>

             <div className="lg:col-span-5 relative">
                <div className="sticky top-32 w-full max-w-[380px] mx-auto h-[80vh] min-h-[600px] border-[8px] border-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white group">
                   {athleteProfile?.id ? (
                     <iframe 
                       key={iframeKey}
                       src={`/athlete/${athleteProfile.id}`}
                       className="w-full h-full border-0"
                       title="Live Portfolio Preview"
                     />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                       <RefreshCw className="w-8 h-8 animate-spin mb-4 text-slate-300" />
                       <p className="text-sm font-bold">Loading Preview...</p>
                     </div>
                   )}
                   
                   <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <button 
                       onClick={() => setIframeKey(prev => prev + 1)}
                       className="bg-slate-900/90 backdrop-blur-md p-2.5 rounded-full shadow-lg border border-slate-700 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                       title="Refresh Live Preview"
                     >
                       <RefreshCw className="w-4 h-4" />
                     </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* VIEW 2: SOCIAL GRAPHICS EXPORT */}
        {socialSubTab === 'social_card' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
             <div className="lg:col-span-5">
                <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200">
                   <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-2">
                      <ImageIcon className="w-5 h-5 text-emerald-500" /> Export Parameter Matrix
                   </h3>
                   <p className="text-slate-500 font-medium text-xs mb-6">Allocate elements to display inside the compiled high-res layout output.</p>

                   <div className="space-y-8">
                      <div>
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Display Metrics (Max 4)</h4>
                         <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                           {allAvailableMetrics.length > 0 ? (
                             allAvailableMetrics.map((metric, i) => (
                               <button key={i} onClick={() => handleToggleMetric(metric.label)} className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selectedMetrics.includes(metric.label) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}>
                                  <div>
                                     <span className="text-xs font-bold text-slate-800 block mb-0.5">{metric.label} <span className="text-slate-400 font-medium ml-1">({metric.value})</span></span>
                                     <span className={`text-[10px] font-black uppercase tracking-widest ${metric.colorClass}`}>{metric.tier} • {metric.score}/99</span>
                                  </div>
                                  {selectedMetrics.includes(metric.label) ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-slate-300" />}
                               </button>
                             ))
                           ) : (
                             <div className="text-xs text-slate-400 font-medium p-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 space-y-2">
                               <p>No metrics found.</p>
                               <button onClick={() => goToTab('home')} className="text-blue-500 hover:text-blue-600 font-bold underline">Go to Homebase to log sport stats</button>
                             </div>
                           )}
                         </div>
                      </div>

                      <div>
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Display Honors (Max 3)</h4>
                         
                         {accolades.length > 0 ? (
                           <div className="flex flex-col gap-1.5 mb-3">
                             {accolades.map((acc, i) => (
                               <div key={i} className={`flex items-center justify-between pr-2 rounded-xl border transition-all ${selectedAccolades.includes(acc.text) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}>
                                  <button onClick={() => handleToggleAccolade(acc.text)} className="flex-1 flex items-center justify-between p-3 text-left">
                                     <div className="flex items-center gap-2 truncate pr-2">
                                       <span className={`text-[9px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded shadow-sm shrink-0 ${acc.category === 'General' ? 'bg-slate-800' : 'bg-blue-600'}`}>{acc.category === 'General' ? 'Academic' : acc.category}</span>
                                       <span className="text-xs font-bold text-slate-800 truncate">{acc.text}</span>
                                     </div>
                                     {selectedAccolades.includes(acc.text) ? <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
                                  </button>
                                  <div className="w-px h-6 bg-slate-200 mx-1 shrink-0"></div>
                                  <button onClick={() => removeAccolade(acc)} className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center mb-3">
                              <Trophy className="w-5 h-5 text-slate-300 mb-2" />
                              <p className="text-[11px] text-slate-500 font-medium max-w-[200px]">No honors mapped yet. Add one in the Web Portfolio tab to display it here.</p>
                           </div>
                         )}
                      </div>

                      <button onClick={handleDownloadSocialCard} disabled={isExportingCard} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2">
                         {isExportingCard ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4"/> Compile High-Res Canvas</>}
                      </button>
                   </div>
                </div>
             </div>

             <div className="lg:col-span-7 flex justify-center items-start lg:sticky lg:top-36 pb-6 px-2 relative">
                <div id="social-card-export" className="relative w-full max-w-[420px] h-auto aspect-[4/5] bg-slate-900 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between overflow-hidden border border-slate-700/50 shadow-2xl shrink-0">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

                   <div className="flex items-center gap-4 z-10 shrink-0">
                      <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId="none" sizeClasses="w-16 h-16 shadow-lg border border-slate-800 shrink-0" />
                      <div className="min-w-0">
                         <h2 className="text-xl sm:text-2xl font-black uppercase text-white leading-none mb-1 truncate">{athleteProfile?.first_name} <br/>{athleteProfile?.last_name}</h2>
                         <p className="text-xs font-bold text-slate-400 truncate">{athleteProfile?.high_school} {athleteProfile?.grad_year && `• CO ${athleteProfile.grad_year}`}</p>
                      </div>
                   </div>

                   <div className="z-10 mt-6 space-y-2.5 shrink-0">
                      {allAvailableMetrics.filter(m => selectedMetrics.includes(m.label)).map((metric, idx) => (
                        <div key={idx} className="flex justify-between items-end border-b border-slate-800/60 pb-1.5 relative">
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{metric.tier} Tier</span>
                              <span className={`text-sm font-black truncate pr-2 ${metric.colorClass}`}>{metric.label}</span>
                           </div>
                           <span className="text-xl font-black text-white shrink-0">{metric.value}</span>
                        </div>
                      ))}
                      {allAvailableMetrics.length === 0 || selectedMetrics.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 rounded-xl bg-slate-800/50 text-center">
                           <p className="text-[11px] text-slate-400 font-medium">Select metrics in the Social Graphics tab to preview them here.</p>
                        </div>
                      ) : null}
                   </div>

                   <div className="z-10 mt-auto flex justify-between items-end pt-6 border-t border-slate-800 shrink-0">
                      <div className="flex-1 border-l-2 border-emerald-500 pl-3 overflow-hidden pr-2">
                         {selectedAccolades.map((accText: string, idx: number) => <p key={idx} className="text-xs font-bold italic text-slate-400 mb-0.5 truncate">"{accText}"</p>)}
                         {includeGPA && gpa && <p className="text-xs font-black text-emerald-400 mt-1 truncate">GPA: {gpa}</p>}
                         {includeMajor && intendedMajor && <p className="text-xs font-black text-blue-400 truncate">Major: {intendedMajor}</p>}
                      </div>
                      <div className="text-right shrink-0">
                         <p className="text-[18px] font-black tracking-tighter text-white">Chased<span className="text-blue-500">Sports</span></p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* VIEW 3: PRO SCOUTING ANALYTICS (TRACKER) */}
        {socialSubTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-3 text-indigo-500" /> Scouting Analytics
                  </h2>
                  <p className="text-slate-500 font-medium mt-1">See how much traction your profile is getting with college coaches.</p>
                </div>
              </div>

              <div className={`relative ${!athleteProfile?.is_premium ? 'min-h-[280px]' : ''}`}>
                
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
                        
                        <ProGate athleteProfile={athleteProfile} featureName="Advanced View Logs">
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
                        </ProGate>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    )
  }, [athleteProfile, gpa, intendedMajor, accolades, schoolPrefs, newAccolade, newAccoladeCategory, selectedMetrics, selectedAccolades, isExportingCard, showMajorDropdown, socialSubTab, allAvailableMetrics, userSports, dailyViews, monthlyViews, recentViewers, allRecentViewers, showImpressionTooltip, router, iframeKey, collapsedSports, gatingMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Homebase...</p>
      </div>
    );
  }

  const myReferralCode = athleteProfile?.athletic_net_url?.match(new RegExp('\\d{5,}'))?.[0] || null;
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
    <main className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-12 text-slate-900 relative overflow-x-hidden">
      
      <div className={`fixed top-[-10%] left-[-10%] w-[600px] h-[600px] ${bleedColors.orb1} blur-[120px] rounded-full pointer-events-none transition-colors duration-1000`}></div>
      <div className={`fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] ${bleedColors.orb2} blur-[120px] rounded-full pointer-events-none transition-colors duration-1000`}></div>
      <div className={`fixed top-[40%] left-[60%] w-[300px] h-[300px] ${bleedColors.orb1} blur-[100px] rounded-full pointer-events-none transition-colors duration-1000`} style={{ animationDelay: '2s' }}></div>

      {!loading && athleteProfile && athleteProfile.trust_level !== 1 && (
        <div className="relative z-40 w-full bg-slate-900 border-b border-white/10 text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <p className="text-sm font-medium text-slate-300">
              <strong className="text-white font-black">Action Required:</strong> Your profile identity is unverified.
            </p>
          </div>
          <button
            onClick={() => setIsEmailVerificationModalOpen(true)}
            className="bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all active:scale-[0.98] flex items-center gap-2"
          >
            Verify Now <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

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
      `}} />

      {/* 🌟 HERO RECRUIT HEADER (WHITE BG) 🌟 */}
      <div className={`bg-white/80 backdrop-blur-xl text-slate-900 pb-16 md:pb-20 px-5 md:px-6 relative transition-all duration-300 z-30 pt-10 shadow-sm border-b border-slate-200`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8 relative z-30">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
            
            <div 
              className="relative w-28 h-28 md:w-36 md:h-36 shrink-0 flex items-center justify-center group cursor-pointer"
              onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
            >
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r={66} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200" />
                <circle 
                  cx="72" cy="72" r={66} stroke="currentColor" strokeWidth="6" fill="transparent" 
                  className={readiness.score === 100 ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-blue-500"}
                  strokeDasharray={2 * Math.PI * 66}
                  strokeDashoffset={(2 * Math.PI * 66) - (readiness.score / 100) * (2 * Math.PI * 66)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>

              <div className="relative z-10 flex items-center justify-center w-24 h-24 md:w-32 md:h-32">
                <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId={athleteProfile?.equipped_border} sizeClasses="w-full h-full absolute inset-0" />
                
                <div className={`absolute inset-1 rounded-full bg-slate-900/60 flex flex-col items-center justify-center text-white transition-all backdrop-blur-[2px] ${isUploadingAvatar ? 'opacity-100 z-20' : 'opacity-0 group-hover:opacity-100 z-20'}`}>
                  {isUploadingAvatar ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-white" />
                  ) : (
                     <div className="flex flex-col items-center gap-1">
                       <Camera className="w-6 h-6 text-white" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-white">Upload</span>
                     </div>
                  )}
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg, image/png, image/webp" 
                onChange={handleAvatarUpload} 
              />
            </div>

            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                  {athleteProfile?.first_name ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'Welcome, Athlete'}
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <button 
                    onClick={() => setIsBasicProfileModalOpen(true)}
                    className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors border border-slate-200 shrink-0"
                    title="Update Profile Details"
                  >
                    <Edit3 className="w-4 h-4 text-slate-600" />
                  </button>
                  {/* Glowing, high-fidelity Founder Badge UI asset */}
                  {athleteProfile?.is_founder && (
                    <span className="bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-1.5 border border-amber-300 animate-pulse">
                      <Crown className="w-3 h-3" /> Founder Member
                    </span>
                  )}
                </div>
              </div>

              <p className="text-base md:text-lg text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mb-4">
                <MapPin className="w-4 h-4 opacity-70" /> 
                {athleteProfile?.high_school || 'General Athlete Profile'} 
                {athleteProfile?.grad_year && ` • Class of ${athleteProfile.grad_year}`}
              </p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 inline-flex items-center gap-4 max-w-lg w-full text-left shadow-sm relative overflow-hidden group mb-5">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[20px] rounded-full pointer-events-none"></div>
                 <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center shrink-0 relative bg-white">
                   {readiness.score === 100 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <span className="text-[10px] font-black text-slate-700">{readiness.score}%</span>}
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Recruit Readiness Quest</p>
                    <p className="text-xs font-bold text-slate-700 leading-tight pr-2">{readiness.nextQuest}</p>
                 </div>
              </div>

              <div className="relative inline-block text-left w-full sm:w-auto" ref={sportsMenuRef}>
                 <button 
                   onClick={() => setIsSportsMenuOpen(!isSportsMenuOpen)}
                   className="inline-flex items-center justify-center w-full sm:w-auto gap-2 font-black px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-cyan-500 hover:bg-cyan-400 text-white border border-cyan-400"
                 >
                    Add / Update Sports <ChevronDown className={`w-4 h-4 transition-transform ${isSportsMenuOpen ? 'rotate-180' : ''}`} />
                 </button>
                 
                 {isSportsMenuOpen && (
                   <div className="absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-3 w-[280px] sm:w-[480px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border-2 border-cyan-100 p-3 sm:p-4 z-[100] max-h-[70vh] overflow-y-auto custom-scrollbar text-slate-900 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2 border-b border-slate-100 mb-2">Sport Specifications</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ALL_SPORTS.map((sport: string) => {
                          const isActive = userSports.includes(sport);
                          return (
                            <div 
                              key={sport} 
                              onMouseDown={(e) => { e.preventDefault(); handleToggleSport(sport); }}
                              className="flex items-center gap-3 w-full text-left p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                            >
                               <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${isActive ? 'bg-cyan-500 border-cyan-500' : 'bg-white border-slate-300 group-hover:border-cyan-300'}`}>
                                  {isActive && <Check className="w-3 h-3 text-white" />}
                               </div>
                               <span className={`text-sm font-bold truncate select-none ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{sport}</span>
                            </div>
                          )
                        })}
                      </div>
                   </div>
                 )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 🌟 SYSTEM NAVIGATION STICKY OVERLAY 🌟 */}
      <div className="sticky top-20 md:top-24 z-20 w-full flex justify-center px-4 mt-6 animate-in slide-in-from-bottom-4 duration-500 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-full shadow-lg border border-slate-200/50 inline-flex gap-1 pointer-events-auto">
          <button 
            onClick={() => goToTab('home')} 
            className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <UserCircle2 className="w-4 h-4" /> <span className="hidden sm:inline">Homebase</span>
          </button>
          <button 
            onClick={() => goToTab('social')} 
            className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'social' ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <ImageIcon className="w-4 h-4" /> <span className="hidden sm:inline">Portfolio & Performance</span>
          </button>
          <button 
            onClick={() => goToTab('rewards')} 
            className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'rewards' ? 'bg-fuchsia-500 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <Gift className="w-4 h-4" /> <span className="hidden sm:inline">Rewards</span>
          </button>
        </div>
      </div>

      {/* 🌟 TAB CONTENT RENDER 🌟 */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 relative z-10 space-y-6">
        
        {activeTab === 'home' && RenderHomeTab}
        {activeTab === 'social' && RenderSocialTab}
        
        {activeTab === 'rewards' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-black text-white flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                      <span className="flex items-center gap-3"><Gift className="w-8 h-8 text-emerald-400" /> Daily Check-In Rewards</span>
                    </h2>
                    <p className="text-slate-400 font-medium text-sm">
                      Your daily ChasedCash reward compounds by 2% every consecutive day you log in. Hit the 7-day mark for a massive 1k bonus!
                    </p>
                  </div>

                  {awardedToday > 0 && (
                     <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg animate-in zoom-in duration-300">
                        <CheckCircle2 className="w-5 h-5 shrink-0"/> You claimed +{awardedToday} ChasedCash today!
                     </div>
                  )}

                  <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                        <span className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">Login Streak: <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{streak} Days</span></span>
                        <span className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">Balance: <span className="text-amber-400 flex items-center gap-1.5"><Coins className="w-4 h-4"/> {coins}</span></span>
                     </div>

                     <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                        {[...Array(7)].map((_, i) => {
                          const dayNumInCycle = i + 1;
                          const cycleStartStreak = Math.floor(Math.max(0, streak - 1) / 7) * 7;
                          const targetStreak = cycleStartStreak + dayNumInCycle;
                          const isToday = targetStreak === streak;
                          const isPast = targetStreak < streak;
                          const baseReward = 100;
                          const rewardVal = Math.round(baseReward * Math.pow(1.02, targetStreak - 1));
                          const isBonusDay = dayNumInCycle === 7;
                          const totalRewardForDay = isBonusDay ? rewardVal + 1000 : rewardVal;

                          return (
                             <div key={i} className={`relative p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 text-center transition-all ${isPast ? 'bg-slate-900 border-slate-800 opacity-60' : isToday ? 'bg-emerald-900/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.02] z-10' : 'bg-slate-900 border-slate-700'}`}>
                                {isPast && <div className="absolute top-1.5 right-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/></div>}
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-emerald-400' : 'text-slate-500'}`}>Day {targetStreak}</span>
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-700">
                                   {isBonusDay ? <Gift className={`w-5 h-5 ${isPast ? 'text-slate-500' : 'text-fuchsia-400'}`} /> : <Coins className={`w-5 h-5 ${isPast ? 'text-slate-500' : 'text-amber-400'}`} />}
                                </div>
                                <span className={`text-xs font-black ${isToday ? 'text-white' : 'text-slate-300'}`}>+{totalRewardForDay}</span>
                             </div>
                          );
                        })}
                     </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
                      <Users className="w-8 h-8 text-fuchsia-500" /> Referral Squad
                    </h2>
                    <p className="text-slate-400 font-medium text-sm">
                      Invite teammates. Every 5 verified recruits grants premium rewards and team boosts. Total Recruits: <span className="text-white font-black">{currentRefs}</span>
                    </p>
                  </div>
                  
                  <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-inner">
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Cycle Progress</span>
                        <span className="text-xl font-black text-fuchsia-400">{progressInCycle} <span className="text-slate-600 text-sm">/ 5</span></span>
                      </div>
                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden shadow-inner">
                         <div className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full transition-all duration-700 relative" style={{ width: `${progressPct}%` }}>
                           <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                         </div>
                      </div>
                    </div>

                    {myReferralCode ? (
                      <div className="bg-slate-900 border border-fuchsia-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Your Invite Code</p>
                          <p className="text-2xl font-mono font-black text-white tracking-widest selection:bg-fuchsia-500/30">
                            {myReferralCode}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleShareCode(myReferralCode)} 
                          className="w-full sm:w-auto bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black py-3 px-6 rounded-xl transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 shrink-0"
                        >
                          <Copy className="w-5 h-5" /> Copy Code
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 p-4 rounded-xl text-center flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> Sync an Athletic.net profile to generate your referral code.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-10 border-t border-slate-800/80 relative z-10">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8 text-center sm:text-left">Upcoming Milestones</h3>
                <div className="flex flex-col sm:flex-row justify-between relative gap-6 sm:gap-0">
                  <div className="absolute top-1/2 -translate-y-1/2 left-8 right-8 h-1 bg-slate-800 hidden sm:block z-0"></div>
                  {milestones.map((ms, idx) => {
                    const isAchieved = currentRefs >= ms.count;
                    const Icon = ms.icon;
                    return (
                      <div key={idx} className="relative z-10 flex flex-row sm:flex-col items-center gap-4 sm:gap-0">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full flex items-center justify-center border-4 border-slate-900 transition-all duration-500 ${isAchieved ? `${ms.bg} text-white shadow-[0_0_30px_rgba(217,70,239,0.4)] scale-110` : 'bg-slate-800 text-slate-600'}`}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="sm:mt-4 text-left sm:text-center flex-1">
                          <div className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${isAchieved ? ms.color : 'text-slate-500'}`}>
                            {ms.count} Recruits
                          </div>
                          <div className={`text-sm sm:text-sm font-bold mt-0.5 sm:mt-1 ${isAchieved ? 'text-white' : 'text-slate-400'}`}>
                            {ms.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* 🚨 MODAL 1: BASIC PROFILE SETUP 🚨 */}
      {isBasicProfileModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full"></div>
               <h2 className="text-2xl font-black mb-1 flex items-center gap-3">
                 Welcome to ChasedSports
               </h2>
               <p className="text-blue-100 text-sm font-medium">Let's set up your athlete identity.</p>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">First Name <span className="text-red-500">*</span></label>
                  <input type="text" value={profileForm.first_name} onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="First Name"/>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" value={profileForm.last_name} onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Last Name"/>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Contact Email <span className="text-red-500">*</span></label>
                  <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="athlete@example.com"/>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Grad Year <span className="text-red-500">*</span></label>
                  <input type="number" min="2020" max="2040" value={profileForm.grad_year} onChange={(e) => setProfileForm({...profileForm, grad_year: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 2026"/>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Athletic Gender Division <span className="text-red-500">*</span></label>
                <div className="flex gap-3">
                  <button onClick={() => setProfileForm({...profileForm, gender: 'Boys'})} className={`flex-1 py-3.5 rounded-xl font-black text-sm transition-all shadow-sm border-2 ${profileForm.gender === 'Boys' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300'}`}>Boys Roster</button>
                  <button onClick={() => setProfileForm({...profileForm, gender: 'Girls'})} className={`flex-1 py-3.5 rounded-xl font-black text-sm transition-all shadow-sm border-2 ${profileForm.gender === 'Girls' ? 'bg-fuchsia-50 border-fuchsia-500 text-fuchsia-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-fuchsia-300'}`}>Girls Roster</button>
                </div>
              </div>

              <button onClick={handleSaveBasicProfile} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2 mt-2">
                 Enter Homebase <ArrowRight className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 MODAL 2: EMAIL VERIFICATION (OTP) 🚨 */}
      {isEmailVerificationModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md relative animate-in zoom-in-95 duration-300">
             <button 
               onClick={() => {
                 setIsEmailVerificationModalOpen(false);
                 window.location.reload();
               }} 
               className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 text-white font-black"
             >
               <X className="w-5 h-5" />
             </button>
             <EmailVerification />
          </div>
        </div>
      )}

      {/* 🚨 MODAL 3: TEAM SEARCH / CREATE 🚨 */}
      {isTeamJoinModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white relative">
               <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[50px] rounded-full"></div>
               <button onClick={() => setIsTeamJoinModalOpen(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
                 <X className="w-5 h-5 text-white" />
               </button>
               <h2 className="text-3xl font-black mb-2 flex items-center gap-3 relative z-10">
                 <Users className="w-8 h-8 text-amber-300" /> Join Your Team
               </h2>
               <p className="text-blue-100 font-medium relative z-10">Search the database to link your profile to your High School roster.</p>
            </div>

            <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {!showAddTeamForm ? (
                <>
                  <div className="relative" ref={teamDropdownRef}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                      High School Alignment <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        value={teamSearchQuery} 
                        onFocus={() => setShowTeamDropdown(true)}
                        onChange={(e) => {
                          setTeamSearchQuery(e.target.value);
                          setShowTeamDropdown(true);
                          if (teamForm.high_school && e.target.value !== teamForm.high_school) {
                             setTeamForm({...teamForm, high_school: '', city: '', state: ''});
                          }
                        }} 
                        className={`w-full bg-slate-50 border pl-11 pr-4 py-3 text-sm font-bold outline-none transition-all ${teamForm.high_school ? 'border-emerald-400 focus:ring-emerald-500' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'} rounded-xl`} 
                        placeholder="Search for your high school..."
                      />
                      {teamForm.high_school && (
                         <div className="absolute right-4 top-1/2 -translate-y-1/2">
                           <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                         </div>
                      )}
                    </div>

                    {showTeamDropdown && teamSearchQuery.length > 1 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                        <div className="max-h-52 overflow-y-auto custom-scrollbar p-2">
                          {isSearchingTeams ? (
                            <div className="p-4 text-center text-sm font-bold text-slate-400 flex justify-center items-center gap-2">
                               <RefreshCw className="w-4 h-4 animate-spin" /> Querying Database...
                            </div>
                          ) : teamSearchResults.length > 0 ? (
                            teamSearchResults.map(team => (
                              <button 
                                key={team.id}
                                onClick={() => selectExistingTeam(team)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-between group"
                              >
                                <div>
                                  <p className="text-sm font-black text-slate-800 group-hover:text-blue-700">{team.high_school_name}</p>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{team.city}, {team.state} {team.division && `• ${team.division}`}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center">
                              <p className="text-sm font-bold text-slate-500 mb-2">No matching schools found.</p>
                            </div>
                          )}
                        </div>
                        <div className="border-t border-slate-100 bg-slate-50 p-3">
                           <button 
                             onClick={() => {
                               setNewTeamName(teamSearchQuery);
                               setShowAddTeamForm(true);
                             }}
                             className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                           >
                              <Plus className="w-4 h-4" /> Don't see your school? Add it here
                           </button>
                        </div>
                      </div>
                    )}
                    {teamForm.city && teamForm.state && (
                       <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> Verified Location: {teamForm.city}, {teamForm.state}
                       </p>
                    )}
                  </div>

                  <button onClick={handleSaveTeamJoin} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2 mt-4">
                     <Save className="w-5 h-5"/> Join Team Roster
                  </button>
                </>
              ) : (
                <div className="animate-in slide-in-from-right-8 duration-300">
                   <button 
                     onClick={() => setShowAddTeamForm(false)} 
                     className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-6"
                   >
                     <ChevronDown className="w-4 h-4 rotate-90" /> Back to Team Search
                   </button>
                   
                   <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                      <h4 className="text-sm font-black text-blue-900 flex items-center gap-2 mb-1">
                        <Map className="w-4 h-4" /> Global Database Addition
                      </h4>
                      <p className="text-xs font-medium text-blue-700">You are adding a new High School to the global database. Name formatting is auto-enforced.</p>
                   </div>

                   <div className="space-y-5">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">High School Name <span className="text-red-500">*</span></label>
                        <input 
                           type="text" 
                           value={newTeamName} 
                           onChange={(e) => setNewTeamName(e.target.value)} 
                           onBlur={() => setNewTeamName(normalizeHSName(newTeamName))}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                           placeholder="e.g. South Albany High School"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Team Mascot <span className="text-red-500">*</span></label>
                          <input 
                             type="text" 
                             value={newTeamMascot} 
                             onChange={(e) => setNewTeamMascot(e.target.value)} 
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                             placeholder="e.g. RedHawks"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">State Division <span className="text-red-500">*</span></label>
                          <input 
                             type="text" 
                             value={newTeamDivision} 
                             onChange={(e) => setNewTeamDivision(e.target.value)} 
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                             placeholder="e.g. 5A, Division 1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">City <span className="text-red-500">*</span></label>
                           <input 
                             type="text" 
                             value={newTeamCity} 
                             onChange={(e) => setNewTeamCity(e.target.value)} 
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                             placeholder="e.g. Albany"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">State <span className="text-red-500">*</span></label>
                           <select 
                             value={newTeamState} 
                             onChange={(e) => setNewTeamState(e.target.value)} 
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                           >
                             <option value="">Select State...</option>
                             {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                      </div>

                      <button 
                         onClick={handleCreateNewTeam} 
                         className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2 mt-2"
                      >
                         <Save className="w-5 h-5"/> Create & Select Team
                      </button>
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