'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, Search, ChevronRight, Users, ChevronDown, ChevronUp, 
  Bookmark, RefreshCw, UserCircle2, School, ShieldCheck, Check, Trash2, 
  FileText, Save, ArrowRight, Plus, X, Globe, CheckCircle2, Flame,
  Rocket, Crown, Gift, Paintbrush, AlertCircle, Lock, Link as LinkIcon, ImageIcon, 
  Download, CheckSquare, Square, Mail, Sparkles, Edit3, Scale, Activity,
  Zap, TrendingUp, Info, Copy, Coins, BarChart3, Eye, Calendar, HelpCircle, Trophy,
  Map, ShieldAlert, Camera, MoreHorizontal, LayoutDashboard
} from 'lucide-react';
import { AvatarWithBorder } from '@/components/AnimatedBorders';
import { Points } from '@/components/Points';
import EmailVerification from '@/components/EmailVerification';
import { SPORT_CONFIGS_META, ALL_SPORTS, SUGGESTED_MAJORS, US_STATES, evaluateMetric, getOverallTier, getRealStats } from '@/utils/constants/RecruitingStandards';

import PerformanceStats from './performance-stats/page';
import Rewards from './rewards/page';

const PRO_LAUNCH_DATE = new Date('2026-08-08T00:00:00Z');

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
  if (score > 0) return { tier: 'Developmental', nextTier: 'Varsity Contributor', scoreRequired: 20, colorClass: 'text-slate-400', bgClass: 'bg-slate-500/5', barClass: 'bg-slate-600', borderClass: 'border-slate-600/30', glowClass: '' };
  return { tier: 'Unranked', nextTier: 'Developmental', scoreRequired: 10, colorClass: 'text-slate-400', bgClass: 'bg-slate-500/5', barClass: 'bg-slate-600', borderClass: 'border-slate-600/30', glowClass: '' };
};

type AccoladeObj = { text: string; category: string };

export default function DashboardHomebase() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athleteProfile, setAthleteProfile] = useState<any>(null);
  const [streak, setStreak] = useState(0); 
  const [coins, setCoins] = useState(0);
  const [awardedToday, setAwardedToday] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  
  const [isBasicProfileModalOpen, setIsBasicProfileModalOpen] = useState(false);
  const [isEmailVerificationModalOpen, setIsEmailVerificationModalOpen] = useState(false);
  const [isTeamJoinModalOpen, setIsTeamJoinModalOpen] = useState(false);
  const [sportToDelete, setSportToDelete] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '', gender: '', grad_year: '' });
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

  const [savedColleges, setSavedColleges] = useState<any[]>([]);
  const [isSportsMenuOpen, setIsSportsMenuOpen] = useState(false);
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

  const gatingMode = useMemo(() => {
    const isPreLaunch = new Date() < PRO_LAUNCH_DATE;
    return {
      isPreLaunch,
      hasAccess: isPreLaunch ? athleteProfile?.is_founder === true : athleteProfile?.is_premium === true,
      label: isPreLaunch ? "Early Access" : "Premium feature"
    };
  }, [athleteProfile]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };
  const goToTab = (tab: 'home' | 'social' | 'rewards') => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleContactCoach = (coachEmail: string | null) => {
    if (!coachEmail) return showToast("This coach has not made their contact information public.", "error");
    window.location.href = `mailto:${coachEmail}?subject=Recruiting Inquiry from ChasedSports Profile`;
  };

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
      if (sportsMenuRef.current && !sportsMenuRef.current.contains(event.target as Node)) setIsSportsMenuOpen(false);
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

        setProfileForm({ first_name: athleteData.first_name || '', last_name: athleteData.last_name || '', email: athleteData.email || session.user.email || '', gender: athleteData.gender || '', grad_year: athleteData.grad_year?.toString() || '' });
        if (athleteData.high_school) {
           setTeamForm({ high_school: athleteData.high_school, city: athleteData.city || '', state: athleteData.state || '' });
           setTeamSearchQuery(athleteData.high_school);
        }
        if (!athleteData.first_name || !athleteData.last_name || !athleteData.email || !athleteData.gender || !athleteData.grad_year) setIsBasicProfileModalOpen(true);

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
        let currentStreak = athleteData.current_login_streak || 0;
        let currentCoins = athleteData.coins || 0;
        const lastLoginStr = athleteData.last_login_date;
        let earnedCoinsToday = 0;

        if (lastLoginStr !== todayStr) {
          let newStreak = 1; 
          if (lastLoginStr) {
            const diffDays = Math.ceil(Math.abs(new Date(todayStr).getTime() - new Date(lastLoginStr).getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) newStreak = currentStreak + 1;
            else newStreak = 1;
          }
          earnedCoinsToday = Math.round(100 * Math.pow(1.02, newStreak - 1));
          if (newStreak > 0 && newStreak % 7 === 0) earnedCoinsToday += 1000;
          currentCoins += earnedCoinsToday;

          setStreak(newStreak); setCoins(currentCoins); setAwardedToday(earnedCoinsToday);
          await supabase.from('athletes').update({ current_login_streak: newStreak, last_login_date: todayStr, coins: currentCoins }).eq('id', athleteData.id);
          athleteData.coins = currentCoins;
        } else {
          setStreak(currentStreak); setCoins(currentCoins);
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

  const handleSaveBasicProfile = async () => {
    if (!profileForm.first_name || !profileForm.last_name || !profileForm.email || !profileForm.gender || !profileForm.grad_year) return showToast("All fields are required.", "error");
    try {
      const parsedYear = parseInt(profileForm.grad_year, 10);
      await supabase.from('athletes').update({ first_name: profileForm.first_name, last_name: profileForm.last_name, email: profileForm.email, gender: profileForm.gender, grad_year: isNaN(parsedYear) ? null : parsedYear }).eq('id', athleteProfile.id);
      setAthleteProfile({ ...athleteProfile, ...profileForm, grad_year: isNaN(parsedYear) ? null : parsedYear });
      setIsBasicProfileModalOpen(false); showToast("Basic identity secured.", "success");
      setIframeKey(prev => prev + 1);
    } catch (err: any) { showToast("Failed to save profile.", "error"); }
  };

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

  // 🚨 RESTORED MISSING FUNCTION FROM image_45aa60.png 🚨
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
  const sharedPerformanceActions = { setSocialSubTab, toggleSportCollapse, getDisplayRating, setSportMenuOpen, setSportActiveState, setSportToDelete, syncSportToSupabase, showToast, setGpa, setIntendedMajor, setShowMajorDropdown, autoSavePortfolio, setNewAccolade, addAccolade, removeAccolade, setSchoolPrefs, setIframeKey, handleToggleMetric, handleToggleAccolade, handleDownloadSocialCard, setShowImpressionTooltip, setShowAllViewersModal, handleContactCoach };

  const RenderHomeTab = useMemo(() => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-[2rem] p-4 sm:p-5 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex flex-wrap sm:flex-nowrap w-full md:w-auto items-center gap-2 md:gap-3 flex-1">
            {gatingMode.hasAccess ? (
               <Link href="/dashboard/email-builder" className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors">
                 <Mail className="w-4 h-4 shrink-0" /> <span className="truncate">Email Studio</span>
               </Link>
            ) : (
               <Link href="/pro" className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-400 border border-slate-200 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors group">
                 <Lock className="w-3.5 h-3.5 group-hover:text-amber-500 transition-colors shrink-0" /> <span className="truncate">Email Studio</span>
               </Link>
            )}
            <Link href={`/athlete/${athleteProfile?.custom_slug || athleteProfile?.id}`} target="_blank" className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors">
              <Globe className="w-4 h-4 shrink-0" /> <span className="truncate">Public Profile</span>
            </Link>
            <button onClick={() => { if (athleteProfile?.trust_level !== 1) setIsEmailVerificationModalOpen(true); else if (!athleteProfile?.high_school) setIsTeamJoinModalOpen(true); else router.push('/dashboard/team'); }} className="flex-1 flex items-center justify-center gap-2 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-600 border border-fuchsia-200 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors">
              <Users className="w-4 h-4 shrink-0" /> <span className="truncate">Team HQ</span>
            </button>
         </div>
         <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
         <div className="flex items-center justify-center gap-6 sm:gap-8 w-full md:w-auto px-4">
           <div className="flex flex-col items-center text-center"><span className="text-xl font-black leading-none text-slate-900">{athleteProfile?.search_appearances || 0}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Impressions</span></div>
           <div className="flex flex-col items-center text-center"><span className="text-xl font-black leading-none text-slate-900">{athleteProfile?.profile_views || 0}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Views</span></div>
           <button onClick={() => { goToTab('social'); setSocialSubTab('analytics'); }} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors shrink-0"><BarChart3 className="w-5 h-5" /></button>
         </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 mt-6">
         <button onClick={() => setIsCollegesOpen(!isCollegesOpen)} className="w-full flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 bg-white hover:bg-slate-50 transition-colors gap-4">
            <div className="flex items-center gap-4 text-left">
               <div className="w-14 h-14 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center shrink-0 shadow-sm"><Bookmark className="w-6 h-6 text-blue-600 fill-blue-600" /></div>
               <div><h2 className="text-2xl font-black text-slate-900 tracking-tight">Target Colleges Board</h2><p className="text-sm font-medium text-slate-500 mt-1">{savedColleges.length} programs loaded in tracked database metrics</p></div>
            </div>
            <div className="flex items-center gap-4 self-end md:self-auto">{isCollegesOpen ? <ChevronUp className="w-6 h-6 text-slate-400 shrink-0" /> : <ChevronDown className="w-6 h-6 text-slate-400 shrink-0" />}</div>
         </button>

         {isCollegesOpen && (
            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 animate-in fade-in slide-in-from-top-4 duration-300">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Scale className="w-5 h-5 text-blue-500" /> College Comparison Board</h3>
                  <Link href="/search" className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 justify-center">Find More Colleges <Search className="w-4 h-4" /></Link>
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
                         <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500 text-center">Action</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {savedColleges.map((saved: any) => {
                          const college = saved.universities; if (!college) return null; const stats = getRealStats(college);
                          return (
                            <tr key={saved.id} className="bg-white hover:bg-blue-50/50 transition-colors group">
                              <td className="p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden">
                                  {college.logo_url ? <img src={college.logo_url} className="w-6 h-6 object-contain" alt={college.name} /> : <School className="w-5 h-5 text-slate-400" />}
                                </div>
                                <div className="truncate max-w-[200px]">
                                  <Link href={`/college/${college.id}?sport=${primarySportQuery}`} className="font-black text-slate-900 hover:text-blue-600 transition-colors block truncate">{college.name}</Link>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{college.division} • {college.state}</span>
                                </div>
                              </td>
                              <td className="p-4"><span className="font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">{stats.matchScore > 0 ? stats.matchScore : '-'}</span></td>
                              <td className="p-4 font-black text-slate-700">{stats.tuitionStr}</td>
                              <td className="p-4 font-black text-emerald-600">{stats.salaryStr}</td>
                              <td className="p-4 font-bold text-slate-600">{stats.gradRateStr}</td>
                              <td className="p-4 text-center">
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveCollegeDashboard(saved.id); }} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors inline-block"><Trash2 className="w-4 h-4" /></button>
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
                    <Link href="/search" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-md mt-4">Open College Finder</Link>
                 </div>
               )}
            </div>
         )}
      </div>
    </div>
  ), [athleteProfile, gatingMode, savedColleges, isCollegesOpen, primarySportQuery, dailyViews, monthlyViews, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Homebase...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-12 text-slate-900 relative overflow-x-hidden">
      <div className={`fixed top-[-10%] left-[-10%] w-[600px] h-[600px] ${bleedColors.orb1} blur-[120px] rounded-full pointer-events-none transition-colors duration-1000`}></div>
      <div className={`fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] ${bleedColors.orb2} blur-[120px] rounded-full pointer-events-none transition-colors duration-1000`}></div>
      <div className={`fixed top-[40%] left-[60%] w-[300px] h-[300px] ${bleedColors.orb1} blur-[100px] rounded-full pointer-events-none transition-colors duration-1000`} style={{ animationDelay: '2s' }}></div>

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
      `}} />

      <div className={`bg-white/80 backdrop-blur-xl text-slate-900 pb-16 md:pb-20 px-5 md:px-6 relative transition-all duration-300 z-30 pt-10 shadow-sm border-b border-slate-200`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8 relative z-30">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
            <div className="relative w-28 h-28 md:w-36 md:h-36 shrink-0 flex items-center justify-center group cursor-pointer" onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}>
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r={66} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200" />
                <circle cx="72" cy="72" r={66} stroke="currentColor" strokeWidth="6" fill="transparent" className={readiness.score === 100 ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-blue-500"} strokeDasharray={2 * Math.PI * 66} strokeDashoffset={(2 * Math.PI * 66) - (readiness.score / 100) * (2 * Math.PI * 66)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
              </svg>
              <div className="relative z-10 flex items-center justify-center w-24 h-24 md:w-32 md:h-32">
                <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId={athleteProfile?.equipped_border} sizeClasses="w-full h-full absolute inset-0" />
                <div className={`absolute inset-1 rounded-full bg-slate-900/60 flex flex-col items-center justify-center text-white transition-all backdrop-blur-[2px] ${isUploadingAvatar ? 'opacity-100 z-20' : 'opacity-0 group-hover:opacity-100 z-20'}`}>
                  {isUploadingAvatar ? <RefreshCw className="w-6 h-6 animate-spin text-white" /> : <div className="flex flex-col items-center gap-1"><Camera className="w-6 h-6 text-white" /><span className="text-[9px] font-black uppercase tracking-widest text-white">Upload</span></div>}
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleAvatarUpload} />
            </div>

            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                  {athleteProfile?.first_name ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'Welcome, Athlete'}
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => setIsBasicProfileModalOpen(true)} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors border border-slate-200 shrink-0" title="Update Profile Details"><Edit3 className="w-4 h-4 text-slate-600" /></button>
                  {athleteProfile?.is_founder && <span className="bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-1.5 border border-amber-300 animate-pulse"><Crown className="w-3 h-3" /> Early Access</span>}
                </div>
              </div>

              <p className="text-base md:text-lg text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mb-4">
                <MapPin className="w-4 h-4 opacity-70" /> {athleteProfile?.high_school || 'General Athlete Profile'} {athleteProfile?.grad_year && ` • Class of ${athleteProfile.grad_year}`}
              </p>
              
              {readiness.score < 100 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 inline-flex items-center gap-4 max-w-lg w-full text-left shadow-sm relative overflow-hidden group mb-5 animate-in fade-in zoom-in-95 duration-300">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[20px] rounded-full pointer-events-none"></div>
                   <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center shrink-0 relative bg-white"><span className="text-[10px] font-black text-slate-700">{readiness.score}%</span></div>
                   <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Recruit Readiness Quest</p><p className="text-xs font-bold text-slate-700 leading-tight pr-2">{readiness.nextQuest}</p></div>
                </div>
              )}

              <div className="relative inline-block text-left w-full sm:w-auto" ref={sportsMenuRef}>
                 <button onClick={() => setIsSportsMenuOpen(!isSportsMenuOpen)} className="inline-flex items-center justify-center w-full sm:w-auto gap-2 font-black px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-cyan-500 hover:bg-cyan-400 text-white border border-cyan-400">
                   Add / Update Sports <ChevronDown className={`w-4 h-4 transition-transform ${isSportsMenuOpen ? 'rotate-180' : ''}`} />
                 </button>
                 
                 {isSportsMenuOpen && (
                   <div className="absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-3 w-[280px] sm:w-[480px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border-2 border-cyan-100 p-3 sm:p-4 z-[100] max-h-[70vh] overflow-y-auto custom-scrollbar text-slate-900 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2 border-b border-slate-100 mb-2">Sport Specifications</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ALL_SPORTS.map((sport: string) => {
                          const isActive = sportStats[sport]?.isActive === true;
                          return (
                            <div key={sport} onMouseDown={(e) => { e.preventDefault(); handleToggleSportDropdown(sport); }} className="flex items-center gap-3 w-full text-left p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
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

      <div className="sticky top-20 md:top-24 z-20 w-full flex justify-center px-4 mt-6 animate-in slide-in-from-bottom-4 duration-500 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-full shadow-lg border border-slate-200/50 inline-flex gap-1 pointer-events-auto">
          <button onClick={() => goToTab('home')} className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
            <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Homebase</span>
          </button>
          <button onClick={() => goToTab('social')} className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'social' ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
            <ImageIcon className="w-4 h-4" /> <span className="hidden sm:inline">Portfolio & Performance</span>
          </button>
          <button onClick={() => goToTab('rewards')} className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'rewards' ? 'bg-fuchsia-500 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}>
            <Gift className="w-4 h-4" /> <span className="hidden sm:inline">Rewards</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 relative z-10 space-y-6">
        {activeTab === 'home' && RenderHomeTab}
        {activeTab === 'social' && <PerformanceStats state={sharedPerformanceState} actions={sharedPerformanceActions} />}
        {activeTab === 'rewards' && <Rewards athleteProfile={athleteProfile} streak={streak} coins={coins} awardedToday={awardedToday} handleShareCode={async (c: string) => { await navigator.clipboard.writeText(`Join me on ChasedSports! Use my invite code: ${c}`); showToast("Copied to clipboard!", "success"); }} />}
      </div>

      {isBasicProfileModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full"></div>
               <h2 className="text-2xl font-black mb-1 flex items-center gap-3">Welcome to ChasedSports</h2>
               <p className="text-blue-100 text-sm font-medium">Let's set up your athlete identity.</p>
            </div>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">First Name <span className="text-red-500">*</span></label><input type="text" value={profileForm.first_name} onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="First Name"/></div>
                <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Last Name <span className="text-red-500">*</span></label><input type="text" value={profileForm.last_name} onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Last Name"/></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Contact Email <span className="text-red-500">*</span></label><input type="email" value={profileForm.email} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="athlete@example.com"/></div>
                <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Grad Year <span className="text-red-500">*</span></label><input type="number" min="2020" max="2040" value={profileForm.grad_year} onChange={(e) => setProfileForm({...profileForm, grad_year: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 2026"/></div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Athletic Gender Division <span className="text-red-500">*</span></label>
                <div className="flex gap-3">
                  <button onClick={() => setProfileForm({...profileForm, gender: 'Boys'})} className={`flex-1 py-3.5 rounded-xl font-black text-sm transition-all shadow-sm border-2 ${profileForm.gender === 'Boys' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300'}`}>Boys Roster</button>
                  <button onClick={() => setProfileForm({...profileForm, gender: 'Girls'})} className={`flex-1 py-3.5 rounded-xl font-black text-sm transition-all shadow-sm border-2 ${profileForm.gender === 'Girls' ? 'bg-fuchsia-50 border-fuchsia-500 text-fuchsia-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-fuchsia-300'}`}>Girls Roster</button>
                </div>
              </div>
              <button onClick={handleSaveBasicProfile} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2 mt-2">Enter Homebase <ArrowRight className="w-4 h-4"/></button>
            </div>
          </div>
        </div>
      )}

      {isEmailVerificationModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md relative animate-in zoom-in-95 duration-300">
             <button onClick={() => { setIsEmailVerificationModalOpen(false); window.location.reload(); }} className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 text-white font-black"><X className="w-5 h-5" /></button>
             <EmailVerification />
          </div>
        </div>
      )}

      {isTeamJoinModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
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
                      <input type="text" value={teamSearchQuery} onFocus={() => setShowTeamDropdown(true)} onChange={(e) => { setTeamSearchQuery(e.target.value); setShowTeamDropdown(true); if (teamForm.high_school && e.target.value !== teamForm.high_school) { setTeamForm({...teamForm, high_school: '', city: '', state: ''}); } }} className={`w-full bg-slate-50 border pl-11 pr-4 py-3 text-sm font-bold outline-none transition-all ${teamForm.high_school ? 'border-emerald-400 focus:ring-emerald-500' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'} rounded-xl`} placeholder="Search for your high school..." />
                      {teamForm.high_school && <div className="absolute right-4 top-1/2 -translate-y-1/2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>}
                    </div>
                    {showTeamDropdown && teamSearchQuery.length > 1 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                        <div className="max-h-52 overflow-y-auto custom-scrollbar p-2">
                          {isSearchingTeams ? (
                            <div className="p-4 text-center text-sm font-bold text-slate-400 flex justify-center items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Querying Database...</div>
                          ) : teamSearchResults.length > 0 ? (
                            teamSearchResults.map((team: any) => (
                              <button key={team.id} onClick={() => selectExistingTeam(team)} className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-between group">
                                <div><p className="text-sm font-black text-slate-800 group-hover:text-blue-700">{team.high_school_name}</p><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{team.city}, {team.state} {team.division && `• ${team.division}`}</p></div>
                                <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))
                          ) : <div className="p-4 text-center"><p className="text-sm font-bold text-slate-500 mb-2">No matching schools found.</p></div>}
                        </div>
                        <div className="border-t border-slate-100 bg-slate-50 p-3"><button onClick={() => { setNewTeamName(teamSearchQuery); setShowAddTeamForm(true); }} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"><Plus className="w-4 h-4" /> Don't see your school? Add it here</button></div>
                      </div>
                    )}
                    {teamForm.city && teamForm.state && <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Verified Location: {teamForm.city}, {teamForm.state}</p>}
                  </div>
                  <button onClick={handleSaveTeamJoin} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2 mt-4"><Save className="w-5 h-5"/> Join Team Roster</button>
                </>
              ) : (
                <div className="animate-in slide-in-from-right-8 duration-300">
                   <button onClick={() => setShowAddTeamForm(false)} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-6"><ChevronDown className="w-4 h-4 rotate-90" /> Back to Team Search</button>
                   <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6"><h4 className="text-sm font-black text-blue-900 flex items-center gap-2 mb-1"><Map className="w-4 h-4" /> Global Database Addition</h4><p className="text-xs font-medium text-blue-700">You are adding a new High School to the global database. Name formatting is auto-enforced.</p></div>
                   <div className="space-y-5">
                      <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">High School Name <span className="text-red-500">*</span></label><input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} onBlur={() => setNewTeamName(normalizeHSName(newTeamName))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. South Albany High School"/></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Team Mascot <span className="text-red-500">*</span></label><input type="text" value={newTeamMascot} onChange={(e) => setNewTeamMascot(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. RedHawks"/></div>
                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">State Division <span className="text-red-500">*</span></label><input type="text" value={newTeamDivision} onChange={(e) => setNewTeamDivision(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 5A, Division 1"/></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">City <span className="text-red-500">*</span></label><input type="text" value={newTeamCity} onChange={(e) => setNewTeamCity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Albany"/></div>
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">State <span className="text-red-500">*</span></label>
                           <select value={newTeamState} onChange={(e) => setNewTeamState(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
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