'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  AlertCircle,
  Mail,
  School,
  Camera,
  Star,
  ChevronRight,
  Activity,
  MapPin,
  Medal,
  Trash2,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Trophy,
  Pencil,
  Save,
  X,
  Download,
  MessageSquareText,
  TrendingUp,
  Crown,
  Users,
  AlertTriangle,
  RefreshCw,
  Briefcase,
  Settings,
  Eye,
  Plus,
  Check,
  Radio,
  Bell,
  SlidersHorizontal
} from 'lucide-react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

interface CoachProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  school_name: string | null;
  sport: string | null;
  coach_title: string | null;
  division: string | null;
  coach_type: string;
  avatar_url: string | null;
  email: string | null;
  is_verified: boolean;
  is_founder: boolean;
  is_premium?: boolean;
}

interface NormalizedMetric {
  id: string;
  event: string;
  mark: string;
  date?: string;
  sport?: string;
}

interface SpottedAthlete {
  id: string;
  first_name: string;
  last_name: string;
  high_school: string | null;
  state: string | null;
  grad_year: number | string | null;
  gender: string | null;
  avatar_url: string | null;
  trust_level: number;
  sports: string[];
  metrics: NormalizedMetric[];
  created_at: string;
  updated_at?: string;
  last_login_date?: string | null;
}

interface AthleteWatchPrefs {
  pinnedEvents: string[];
  watchAllUpdates: boolean;
}

// 🚨 PREDEFINED OPTIONS FOR DROPDOWNS 🚨
const SPORT_OPTIONS = [
  'Track & Field',
  'Cross Country',
  'Football',
  'Basketball',
  'Soccer',
  'Baseball',
  'Volleyball',
  'Softball',
  'Wrestling',
  'Swimming & Diving',
  'Lacrosse',
  'Tennis',
  'Golf',
  'Ice Hockey',
  'Gymnastics',
  'Water Polo',
  'Field Hockey',
  'Fencing',
  'Bowling'
];

const COACH_TITLES = [
  'Head Coach',
  'Associate Head Coach',
  'Assistant Coach',
  'Director of Operations',
  'Recruiting Coordinator',
  'Sprints & Hurdles Coach',
  'Distance',
  'Jumps Coach',
  'Throws Coach',
  'Pole Vault Coach',
  'Multi-Events Coach',
  'Graduate Assistant',
  'Volunteer Assistant'
];

// Helper to format a Date object as YYYY-MM-DD in local time
const formatDateYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to normalize metrics across different sport editor schemas
const extractNormalizedMetrics = (athleteObj: any): NormalizedMetric[] => {
  if (!athleteObj) return [];
  const results: NormalizedMetric[] = [];

  const pushMetric = (raw: any, sportName?: string, fallbackIdx?: number) => {
    if (!raw) return;

    if (typeof raw === 'string') {
      const parts = raw.split(':');
      results.push({
        id: `${sportName || 'stat'}-${fallbackIdx}-${raw}`,
        event: parts[0]?.trim() || 'Stat',
        mark: parts.slice(1).join(':').trim() || raw,
        sport: sportName
      });
      return;
    }

    if (typeof raw === 'object') {
      const eventName =
        raw.event ||
        raw.name ||
        raw.label ||
        raw.stat ||
        raw.statName ||
        raw.title ||
        raw.event_name ||
        raw.category ||
        '';
      const markVal =
        raw.mark ??
        raw.value ??
        raw.result ??
        raw.time ??
        raw.score ??
        raw.pr ??
        raw.statValue ??
        raw.displayValue ??
        '';

      if (eventName || markVal !== '') {
        results.push({
          id: `${sportName || 'stat'}-${eventName || fallbackIdx}`,
          event: String(eventName || `Metric ${(fallbackIdx ?? 0) + 1}`),
          mark: String(markVal !== '' ? markVal : '—'),
          date: raw.date || raw.updated_at || raw.created_at,
          sport: sportName || raw.sport
        });
        return;
      }

      // Handle key-value pair objects if nested
      Object.entries(raw).forEach(([k, v], idx) => {
        if (k === 'id' || k === 'date' || k === 'updated_at' || v === null || v === undefined) return;
        if (typeof v === 'string' || typeof v === 'number') {
          results.push({
            id: `${sportName || 'stat'}-${k}-${idx}`,
            event: k.replace(/_/g, ' '),
            mark: String(v),
            sport: sportName
          });
        }
      });
    }
  };

  // 1. Check athlete_sports relation
  if (athleteObj.athlete_sports) {
    const sportsArr = Array.isArray(athleteObj.athlete_sports)
      ? athleteObj.athlete_sports
      : [athleteObj.athlete_sports];

    sportsArr.forEach((sp: any) => {
      const sportLabel = sp?.sport || '';
      const m = sp?.metrics;
      if (Array.isArray(m)) {
        m.forEach((item: any, idx: number) => pushMetric(item, sportLabel, idx));
      } else if (m && typeof m === 'object') {
        Object.entries(m).forEach(([k, v], idx) => {
          if (Array.isArray(v)) {
            v.forEach((subItem, subIdx) => pushMetric(subItem, sportLabel, subIdx));
          } else if (v && typeof v === 'object') {
            pushMetric({ event: k, ...(v as object) }, sportLabel, idx);
          } else if (v !== null && v !== undefined && v !== '') {
            results.push({
              id: `${sportLabel}-${k}-${idx}`,
              event: k.replace(/_/g, ' '),
              mark: String(v),
              date: sp?.updated_at,
              sport: sportLabel
            });
          }
        });
      }
    });
  }

  // 2. Fallback to prs array if present on athlete object
  if (results.length === 0 && Array.isArray(athleteObj.prs)) {
    athleteObj.prs.forEach((pr: any, idx: number) => pushMetric(pr, undefined, idx));
  }

  return results;
};

export default function CollegeCoachDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [watchlist, setWatchlist] = useState<any[]>([]);

  // 24H ACTIVE & NEW ATHLETE SPOTTER STATE
  const [active24hCount, setActive24hCount] = useState(0);
  const [active24hInSportCount, setActive24hInSportCount] = useState(0);
  const [spottedAthletes, setSpottedAthletes] = useState<SpottedAthlete[]>([]);
  const [isRefreshingSpotter, setIsRefreshingSpotter] = useState(false);
  const [addingAthleteId, setAddingAthleteId] = useState<string | null>(null);

  // TRACKED ATHLETE SETTINGS / WATCHED STATS MODAL STATE
  const [watchPrefs, setWatchPrefs] = useState<Record<string, AthleteWatchPrefs>>({});
  const [configuringAthlete, setConfiguringAthlete] = useState<any | null>(null);

  // VERIFICATION STATE
  const [verificationStep, setVerificationStep] = useState<'idle' | 'sending' | 'input' | 'verifying'>('idle');
  const [enteredCode, setEnteredCode] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // EDIT PROFILE STATE
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editDivision, setEditDivision] = useState('');
  const [editSport, setEditSport] = useState('');
  const [editCoachTitle, setEditCoachTitle] = useState('');
  const [schoolOptions, setSchoolOptions] = useState<{ id: string; name: string; division: string }[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);
  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const isRecentUpdate = (dateString?: string) => {
    if (!dateString || dateString === 'Unknown Date') return false;
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) return false;
    const diffHours = Math.abs(Date.now() - parsed.getTime()) / (1000 * 60 * 60);
    return diffHours <= 72; // Highlight stats updated within the last 72h
  };

  // Load saved stat watch preferences from localStorage
  useEffect(() => {
    if (!coachProfile?.id) return;
    try {
      const saved = localStorage.getItem(`chased_watch_prefs_${coachProfile.id}`);
      if (saved) {
        setWatchPrefs(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse watch preferences:', e);
    }
  }, [coachProfile?.id]);

  const saveWatchPrefsForAthlete = (athleteId: string, prefs: AthleteWatchPrefs) => {
    if (!coachProfile?.id) return;
    const updated = { ...watchPrefs, [athleteId]: prefs };
    setWatchPrefs(updated);
    try {
      localStorage.setItem(`chased_watch_prefs_${coachProfile.id}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save watch preferences:', e);
    }
  };

  const fetchSpotterAndActivity = async (currentCoach: CoachProfile | null) => {
    setIsRefreshingSpotter(true);
    try {
      const { data: allAthletes } = await supabase
        .from('athletes')
        .select('*, athlete_sports (*)')
        .order('created_at', { ascending: false });

      if (!allAthletes) return;

      // Current date and the date from the day before (both local and UTC strings for safety)
      const nowObj = new Date();
      const yesterdayObj = new Date(nowObj);
      yesterdayObj.setDate(nowObj.getDate() - 1);

      const todayLocalStr = formatDateYYYYMMDD(nowObj);
      const yesterdayLocalStr = formatDateYYYYMMDD(yesterdayObj);

      const todayUtcStr = nowObj.toISOString().slice(0, 10);
      const yesterdayUtcStr = yesterdayObj.toISOString().slice(0, 10);

      const validLoginDates = new Set([
        todayLocalStr,
        yesterdayLocalStr,
        todayUtcStr,
        yesterdayUtcStr
      ]);

      const coachSportNorm = (currentCoach?.sport || '').trim().toLowerCase();

      let combinedTwoDayTotal = 0;
      let combinedTwoDaySportMatch = 0;
      const verifiedMatches: SpottedAthlete[] = [];

      allAthletes.forEach((rawAthlete: any) => {
        const normalizedMetrics = extractNormalizedMetrics(rawAthlete);

        // Determine all sports associated with this athlete
        const athleteSportsList: string[] = [];
        if (Array.isArray(rawAthlete.sports)) {
          rawAthlete.sports.forEach((s: string) => {
            if (s) athleteSportsList.push(s);
          });
        }
        if (rawAthlete.athlete_sports) {
          const spRel = Array.isArray(rawAthlete.athlete_sports)
            ? rawAthlete.athlete_sports
            : [rawAthlete.athlete_sports];
          spRel.forEach((sp: any) => {
            if (sp?.sport && !athleteSportsList.includes(sp.sport)) {
              athleteSportsList.push(sp.sport);
            }
          });
        }

        // Check sport match against coach's sport
        const matchesCoachSport =
          !coachSportNorm ||
          athleteSportsList.some((s) => {
            const sNorm = s.toLowerCase();
            if (sNorm === coachSportNorm) return true;
            if (
              (coachSportNorm.includes('track') || coachSportNorm.includes('cross country')) &&
              (sNorm.includes('track') || sNorm.includes('cross country') || sNorm.includes('xc'))
            ) {
              return true;
            }
            return sNorm.includes(coachSportNorm) || coachSportNorm.includes(sNorm);
          });

        // Check if athlete's last_login_date is today or yesterday
        const loginDateStr = rawAthlete.last_login_date
          ? String(rawAthlete.last_login_date).slice(0, 10)
          : '';

        if (loginDateStr && validLoginDates.has(loginDateStr)) {
          combinedTwoDayTotal++;
          if (matchesCoachSport) {
            combinedTwoDaySportMatch++;
          }
        }

        // Check if athlete is verified for the New Athlete Spotter
        const isVerifiedAthlete =
          (typeof rawAthlete.trust_level === 'number' && rawAthlete.trust_level > 0) ||
          rawAthlete.is_verified === true;

        if (isVerifiedAthlete && matchesCoachSport) {
          verifiedMatches.push({
            id: rawAthlete.id,
            first_name: rawAthlete.first_name || 'Athlete',
            last_name: rawAthlete.last_name || '',
            high_school: rawAthlete.high_school || null,
            state: rawAthlete.state || null,
            grad_year: rawAthlete.grad_year || null,
            gender: rawAthlete.gender || null,
            avatar_url: rawAthlete.avatar_url || null,
            trust_level: rawAthlete.trust_level || 1,
            sports: athleteSportsList,
            metrics: normalizedMetrics,
            created_at: rawAthlete.created_at,
            updated_at: rawAthlete.updated_at,
            last_login_date: rawAthlete.last_login_date || null
          });
        }
      });

      // Combine current date + yesterday and divide by 2 (rounding up if odd)
      const averaged24hCount = Math.ceil(combinedTwoDayTotal / 2);
      const averaged24hInSportCount = Math.ceil(combinedTwoDaySportMatch / 2);

      setActive24hCount(averaged24hCount);
      setActive24hInSportCount(averaged24hInSportCount);
      setSpottedAthletes(verifiedMatches.slice(0, 15));
    } catch (err) {
      console.error('Error loading spotter data:', err);
    } finally {
      setIsRefreshingSpotter(false);
    }
  };

  useEffect(() => {
    async function loadCoachData() {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cData } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cData) {
        if (!cData.email && session.user.email) {
          await supabase.from('coaches').update({ email: session.user.email }).eq('id', session.user.id);
          cData.email = session.user.email;
        }
        setCoachProfile(cData);
      }

      const { data: messageData } = await supabase
        .from('messages')
        .select('id')
        .eq('sender_email', session.user.email)
        .eq('is_read', false);
      if (messageData) setUnreadCount(messageData.length);

      const { data: savedData } = await supabase
        .from('saved_recruits')
        .select(`id, athlete_id, created_at, athletes (*, athlete_sports (*))`)
        .eq('coach_id', session.user.id)
        .order('created_at', { ascending: false });

      if (savedData) {
        const formattedData = savedData.map((item: any) => {
          const athleteObj = Array.isArray(item.athletes) ? item.athletes[0] : item.athletes;
          const combinedMetrics = extractNormalizedMetrics(athleteObj);

          return {
            ...item,
            athletes: athleteObj
              ? {
                  ...athleteObj,
                  metrics: combinedMetrics
                }
              : null
          };
        });

        setWatchlist(formattedData);
      }

      await fetchSpotterAndActivity(cData || null);
      setLoading(false);
    }
    loadCoachData();
  }, [supabase]);

  // 🚨 AUTOCOMPLETE FOR UNIVERSITIES 🚨
  useEffect(() => {
    const searchUniversities = async () => {
      if (!editSchoolName || editSchoolName.length < 2) {
        setSchoolOptions([]);
        return;
      }
      setIsSearchingSchool(true);

      const { data } = await supabase
        .from('universities')
        .select('id, name, division')
        .ilike('name', `%${editSchoolName}%`)
        .order('name')
        .limit(10);

      if (data) setSchoolOptions(data);
      setIsSearchingSchool(false);
    };

    const timeoutId = setTimeout(() => {
      searchUniversities();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [editSchoolName, supabase]);

  // --- PROFILE EDIT FUNCTIONS ---
  const handleEditToggle = () => {
    if (!coachProfile) return;
    setEditFirstName(coachProfile.first_name || '');
    setEditLastName(coachProfile.last_name || '');
    setEditSchoolName(coachProfile.school_name || '');
    setEditDivision(coachProfile.division || '');
    setEditSport(coachProfile.sport || '');
    setEditCoachTitle(coachProfile.coach_title || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!coachProfile?.id) return;
    setIsSavingProfile(true);
    try {
      const updatedFields = {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        school_name: editSchoolName.trim(),
        division: editDivision.trim() || null,
        sport: editSport.trim(),
        coach_title: editCoachTitle.trim()
      };

      const { error } = await supabase.from('coaches').update(updatedFields).eq('id', coachProfile.id);

      if (error) throw error;

      const updatedProfile = coachProfile ? { ...coachProfile, ...updatedFields } : null;
      setCoachProfile(updatedProfile);
      setIsEditingProfile(false);
      showToast('Profile saved! Updating athlete spotter for your sport...', 'success');
      await fetchSpotterAndActivity(updatedProfile);
    } catch (err: any) {
      showToast(`Failed to save profile: ${err.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- VERIFICATION FUNCTIONS ---
  const handleSendCode = async () => {
    if (!coachProfile?.email) return;
    setVerificationStep('sending');
    setVerificationError('');

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const { error: dbError } = await supabase
        .from('coaches')
        .update({ verification_code: code })
        .eq('id', coachProfile.id);
      if (dbError) throw dbError;

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: coachProfile.email, code, name: coachProfile.first_name })
      });

      if (!res.ok) throw new Error('Failed to send email. Try again later.');
      setVerificationStep('input');
    } catch (err: any) {
      setVerificationError(err.message);
      setVerificationStep('idle');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationStep('verifying');
    setVerificationError('');

    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('verification_code')
        .eq('id', coachProfile!.id)
        .single();

      if (error) throw error;
      if (data.verification_code !== enteredCode) throw new Error('Incorrect verification code.');

      await supabase
        .from('coaches')
        .update({ is_verified: true, verification_code: null })
        .eq('id', coachProfile!.id);

      setCoachProfile((prev) => (prev ? { ...prev, is_verified: true } : null));
      setVerificationStep('idle');
    } catch (err: any) {
      setVerificationError(err.message);
      setVerificationStep('input');
    }
  };

  // --- AVATAR & WATCHLIST FUNCTIONS ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploadingAvatar(true);
      if (!e.target.files || e.target.files.length === 0 || !coachProfile?.id) return;
      const compressedFile = await imageCompression(e.target.files[0], {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 500,
        useWebWorker: true
      });
      const fileName = `${coachProfile.id}-avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl }
      } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const urlWithTime = `${publicUrl}?t=${new Date().getTime()}`;

      await supabase.from('coaches').update({ avatar_url: urlWithTime }).eq('id', coachProfile.id);
      setCoachProfile((prev) => (prev ? { ...prev, avatar_url: urlWithTime } : null));
    } catch (error: any) {
      showToast(`Error uploading image: ${error.message}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveFromWatchlist = async (savedRecruitId: string) => {
    try {
      setWatchlist((prev) => prev.filter((item) => item.id !== savedRecruitId));
      await supabase.from('saved_recruits').delete().eq('id', savedRecruitId);
      showToast('Athlete removed from watchlist.', 'success');
    } catch (err: any) {
      showToast(`Failed to remove: ${err.message}`);
    }
  };

  const handleAddSpottedToWatchlist = async (athlete: SpottedAthlete) => {
    if (!coachProfile?.id) return;
    const alreadyTracked = watchlist.some((w) => w.athlete_id === athlete.id || w.athletes?.id === athlete.id);
    if (alreadyTracked) {
      showToast(`${athlete.first_name} is already on your watchlist!`, 'success');
      return;
    }

    setAddingAthleteId(athlete.id);
    try {
      const { data: inserted, error } = await supabase
        .from('saved_recruits')
        .insert({
          coach_id: coachProfile.id,
          athlete_id: athlete.id
        })
        .select('id, athlete_id, created_at')
        .single();

      if (error) throw error;

      const newWatchItem = {
        id: inserted.id,
        athlete_id: athlete.id,
        created_at: inserted.created_at,
        athletes: {
          ...athlete,
          metrics: athlete.metrics
        }
      };

      setWatchlist((prev) => [newWatchItem, ...prev]);
      showToast(`Added ${athlete.first_name} ${athlete.last_name} to your Watchlist!`, 'success');
    } catch (err: any) {
      showToast(`Could not add athlete: ${err.message}`, 'error');
    } finally {
      setAddingAthleteId(null);
    }
  };

  const handleToggleWatchedEvent = (athleteId: string, eventName: string, allMetrics: NormalizedMetric[]) => {
    const currentPrefs: AthleteWatchPrefs = watchPrefs[athleteId] || {
      pinnedEvents: allMetrics.slice(0, 4).map((m) => m.event),
      watchAllUpdates: true
    };

    const exists = currentPrefs.pinnedEvents.includes(eventName);
    let nextPinned: string[];

    if (exists) {
      nextPinned = currentPrefs.pinnedEvents.filter((e) => e !== eventName);
    } else {
      if (currentPrefs.pinnedEvents.length >= 4) {
        showToast('You can pin up to 4 primary stats to the card preview.', 'error');
        return;
      }
      nextPinned = [...currentPrefs.pinnedEvents, eventName];
    }

    saveWatchPrefsForAthlete(athleteId, {
      ...currentPrefs,
      pinnedEvents: nextPinned
    });
  };

  const handleToggleWatchAllUpdates = (athleteId: string, allMetrics: NormalizedMetric[]) => {
    const currentPrefs: AthleteWatchPrefs = watchPrefs[athleteId] || {
      pinnedEvents: allMetrics.slice(0, 4).map((m) => m.event),
      watchAllUpdates: true
    };

    saveWatchPrefsForAthlete(athleteId, {
      ...currentPrefs,
      watchAllUpdates: !currentPrefs.watchAllUpdates
    });
  };

  const handleExportCSV = () => {
    if (watchlist.length === 0) return;

    const headers = ['First Name', 'Last Name', 'High School', 'State', 'Grad Year', 'Top Event', 'Top Mark'];
    const csvData = watchlist.map((item: any) => {
      const a = item.athletes;
      if (!a) return '';
      const topPr = a.metrics && a.metrics.length > 0 ? a.metrics[0] : { event: 'N/A', mark: 'N/A' };
      return `"${a.first_name}","${a.last_name}","${a.high_school}","${a.state || 'N/A'}","${a.grad_year || 'N/A'}","${topPr.event}","${topPr.mark}"`;
    });

    const csvString = [headers.join(','), ...csvData.filter(Boolean)].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${coachProfile?.school_name?.replace(/\s+/g, '_') || 'My'}_Recruiting_Board.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const trackedAthleteIds = useMemo(() => {
    return new Set(watchlist.map((item) => item.athlete_id || item.athletes?.id).filter(Boolean));
  }, [watchlist]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );

  // 🚨 CHECK FOR MISSING PROFILE INFO 🚨
  const profileIncomplete =
    coachProfile &&
    (!coachProfile.first_name ||
      !coachProfile.last_name ||
      !coachProfile.school_name ||
      !coachProfile.sport ||
      !coachProfile.coach_title);
  const isPremium = coachProfile?.is_premium;

  // Filter sport suggestions
  const filteredSports = SPORT_OPTIONS.filter(
    (s) => s.toLowerCase().includes(editSport.toLowerCase()) && s.toLowerCase() !== editSport.toLowerCase()
  );

  // Filter title suggestions
  const filteredTitles = COACH_TITLES.filter(
    (t) => t.toLowerCase().includes(editCoachTitle.toLowerCase()) && t.toLowerCase() !== editCoachTitle.toLowerCase()
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div
            className={`rounded-2xl p-4 shadow-2xl border backdrop-blur-md flex items-start gap-3 ${
              toast.type === 'error'
                ? 'bg-red-50/95 border-red-200 text-red-800'
                : 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
            )}
            <p className="text-sm font-bold leading-tight">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* HEADER HERO SECTION */}
      <div className="relative pt-16 pb-28 px-6">
        {/* Background Layer */}
        <div className="absolute inset-0 bg-slate-900 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full"></div>
        </div>

        {/* Content Layer */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-30 text-white">
          <div className="relative w-32 h-32 group shrink-0">
            <div
              className={`w-full h-full rounded-full border-4 transition-transform duration-300 group-hover:scale-105 ${
                isPremium
                  ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
                  : 'border-slate-800 shadow-xl'
              } overflow-hidden bg-slate-800 flex items-center justify-center ${
                isUploadingAvatar ? 'animate-pulse' : ''
              }`}
            >
              {coachProfile?.avatar_url ? (
                <img src={coachProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <School className="w-12 h-12 text-slate-400" />
              )}
            </div>
            <label className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
              <Camera className="w-6 h-6 text-white mb-1 transform group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-white font-bold uppercase tracking-wider text-center px-2">
                Update Logo
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
              />
            </label>
          </div>

          <div className="text-center md:text-left flex-1 w-full">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-3">
              <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-widest uppercase">
                NCAA Recruiting Command Center
              </div>
              {isPremium && (
                <div className="inline-flex items-center px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase border bg-amber-500/20 border-amber-400/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Coach Pro Hub
                </div>
              )}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                {active24hCount} {active24hCount === 1 ? 'athlete' : 'athletes'} active in the last 24h
              </div>
            </div>

            {/* 🚨 PROFILE INCOMPLETE BANNER 🚨 */}
            {profileIncomplete && !isEditingProfile && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-red-400 font-black text-sm">Profile Incomplete</h3>
                    <p className="text-red-300/80 text-xs font-medium mt-0.5">
                      Athletes need to know who you are. Please add your name, sport, and title.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleEditToggle}
                  className="w-full sm:w-auto px-5 py-2.5 bg-red-500 hover:bg-red-400 hover:-translate-y-0.5 active:translate-y-0 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-red-500/25 shrink-0"
                >
                  Complete Profile
                </button>
              </div>
            )}

            {isEditingProfile ? (
              <div className="bg-slate-800/70 backdrop-blur-md p-5 rounded-2xl border border-slate-700 max-w-lg mx-auto md:mx-0 animate-in fade-in slide-in-from-top-2 duration-200 relative">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                    />
                  </div>
                </div>

                <div className="mb-3 relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    University Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editSchoolName}
                      onChange={(e) => {
                        setEditSchoolName(e.target.value);
                        setEditDivision('');
                        setShowSchoolDropdown(true);
                      }}
                      onFocus={() => {
                        if (editSchoolName.length >= 2) setShowSchoolDropdown(true);
                      }}
                      onBlur={() => setShowSchoolDropdown(false)}
                      placeholder="Search for your university..."
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1 pr-10"
                    />
                    {isSearchingSchool && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                        <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
                      </div>
                    )}
                  </div>
                  {showSchoolDropdown && schoolOptions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                      {schoolOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setEditSchoolName(option.name);
                            setEditDivision(option.division || '');
                            setShowSchoolDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex justify-between items-center border-b border-slate-700/50 last:border-0"
                        >
                          <span className="truncate pr-2">{option.name}</span>
                          {option.division && (
                            <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                              {option.division}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Sport
                    </label>
                    <input
                      type="text"
                      value={editSport}
                      onChange={(e) => {
                        setEditSport(e.target.value);
                        setShowSportDropdown(true);
                      }}
                      onFocus={() => setShowSportDropdown(true)}
                      onBlur={() => setShowSportDropdown(false)}
                      placeholder="e.g. Track & Field"
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                    />
                    {showSportDropdown && filteredSports.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredSports.map((sport) => (
                          <button
                            key={sport}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setEditSport(sport);
                              setShowSportDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            {sport}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <label
                      className={`text-[10px] font-bold uppercase tracking-widest ml-1 transition-colors ${
                        !editSport.trim() ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      value={editCoachTitle}
                      onChange={(e) => {
                        setEditCoachTitle(e.target.value);
                        setShowTitleDropdown(true);
                      }}
                      onFocus={() => setShowTitleDropdown(true)}
                      onBlur={() => setShowTitleDropdown(false)}
                      disabled={!editSport.trim()}
                      placeholder={editSport.trim() ? 'e.g. Head Coach' : 'Select a sport first'}
                      className={`w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1 transition-all ${
                        !editSport.trim() ? 'opacity-50 cursor-not-allowed bg-slate-800' : ''
                      }`}
                    />
                    {showTitleDropdown && editSport.trim() && filteredTitles.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredTitles.map((title) => (
                          <button
                            key={title}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setEditCoachTitle(title);
                              setShowTitleDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            {title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={
                      isSavingProfile ||
                      !editFirstName.trim() ||
                      !editLastName.trim() ||
                      !editSchoolName.trim() ||
                      !editSport.trim() ||
                      !editCoachTitle.trim()
                    }
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 hover:-translate-y-0.5 active:translate-y-0 text-white font-bold py-2.5 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" /> {isSavingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="group relative w-fit mx-auto md:mx-0">
                <h1 className="text-4xl font-black mb-2 flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2">
                  {coachProfile?.first_name ? `Coach ${coachProfile.last_name}` : 'Welcome, Coach'}

                  <div className="flex items-center gap-2 justify-center md:justify-start mt-2 md:mt-0">
                    {coachProfile?.is_verified && (
                      <span title="Verified Coach" className="flex items-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-indigo-400" />
                      </span>
                    )}

                    {coachProfile?.is_founder && (
                      <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-amber-950 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest flex items-center shadow-sm">
                        <Crown className="w-3.5 h-3.5 mr-1" /> Founder
                      </span>
                    )}
                  </div>
                </h1>

                <p className="text-lg text-slate-300 font-medium flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mt-2">
                  {coachProfile?.coach_title && (
                    <span className="flex items-center text-white">
                      <Briefcase className="w-4 h-4 mr-1.5 opacity-70" /> {coachProfile.coach_title}
                    </span>
                  )}
                  {coachProfile?.sport && (
                    <span className="flex items-center text-white">
                      <Activity className="w-4 h-4 mr-1.5 opacity-70" /> {coachProfile.sport}
                    </span>
                  )}
                  {(coachProfile?.coach_title || coachProfile?.sport) && (
                    <span className="text-slate-600 hidden md:inline">|</span>
                  )}
                  <span className="flex items-center">
                    <School className="w-4 h-4 mr-1.5 opacity-70" />{' '}
                    {coachProfile?.school_name || 'Set up your University Profile'}
                    {coachProfile?.division && (
                      <span className="ml-2 text-[10px] bg-white/10 border border-white/20 px-2 py-0.5 rounded text-white font-bold tracking-widest uppercase">
                        {coachProfile.division}
                      </span>
                    )}
                  </span>
                  <span className="text-slate-600 hidden md:inline">|</span>
                  <span className="flex items-center">
                    <Mail className="w-4 h-4 mr-1.5 opacity-70" /> {coachProfile?.email}
                  </span>
                </p>

                {/* EDIT BUTTON */}
                <button
                  onClick={handleEditToggle}
                  className="absolute -right-12 top-2 p-2.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-indigo-600 hover:scale-110 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                  title="Edit Profile"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-14 relative z-20">
        {/* EMAIL VERIFICATION BANNER */}
        {!coachProfile?.is_verified && (
          <div className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-3xl p-8 shadow-xl border border-yellow-400 mb-8 text-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black flex items-center mb-2">
                <ShieldAlert className="w-6 h-6 mr-2" /> Verify your .edu Email
              </h2>
              <p className="font-medium text-yellow-900">
                To protect athletes, you must verify your university email address before you can send direct messages or
                appear as a Verified Coach.
              </p>
              {verificationError && (
                <p className="text-red-900 bg-red-100 px-3 py-1 rounded mt-2 text-sm font-bold w-fit">
                  {verificationError}
                </p>
              )}
            </div>

            <div className="w-full md:w-auto shrink-0 bg-white/20 p-4 rounded-2xl border border-white/30 backdrop-blur-sm">
              {verificationStep === 'idle' && (
                <button
                  onClick={handleSendCode}
                  className="w-full bg-slate-900 hover:bg-black hover:-translate-y-0.5 active:translate-y-0 text-white font-black px-8 py-3.5 rounded-xl transition-all shadow-md"
                >
                  Send Verification Code
                </button>
              )}
              {verificationStep === 'sending' && (
                <div className="text-center font-bold text-yellow-900 w-full px-8 py-3.5">Sending Email...</div>
              )}
              {(verificationStep === 'input' || verificationStep === 'verifying') && (
                <form onSubmit={handleVerifyCode} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    required
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                    className="w-32 bg-white text-center text-xl font-black tracking-widest rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={verificationStep === 'verifying'}
                    className="bg-slate-900 hover:bg-black text-white font-black px-6 py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
                  >
                    {verificationStep === 'verifying' ? '...' : 'Verify'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* COMMAND CENTER STAT CARDS (Hot Leads Replaced with 24h Live Activity) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between hover:shadow-md hover:border-slate-300 transition-all duration-300">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Athletes Tracked</p>
              <h3 className="text-3xl font-black text-slate-900">{watchlist.length}</h3>
              <p className="text-[11px] font-bold text-slate-400 mt-1">Pinned to your recruiting board</p>
            </div>
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-3xl p-6 shadow-lg shadow-emerald-600/15 border border-emerald-400/40 flex items-center justify-between text-white relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10 pr-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                <p className="text-[11px] font-black text-emerald-100 uppercase tracking-widest">Live Platform Pulse</p>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {active24hCount} {active24hCount === 1 ? 'Athlete' : 'Athletes'}
              </h3>
              <p className="text-xs font-bold text-emerald-100 mt-1">
                Active in the last 24 hours
                {coachProfile?.sport ? ` (${active24hInSportCount} in ${coachProfile.sport})` : ''}
              </p>
            </div>
            <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/25 shrink-0 relative z-10 group-hover:rotate-12 transition-transform duration-300">
              <Activity className="w-7 h-7 text-white" />
            </div>
          </div>

          <Link
            href="/dashboard/messages"
            className="bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-800 flex items-center justify-between hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Unread Messages</p>
              <h3 className="text-3xl font-black text-white">{unreadCount}</h3>
              <p className="text-[11px] font-bold text-indigo-400 mt-1 flex items-center gap-1">
                View direct athlete pitches <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all duration-300">
              <Mail className="w-6 h-6 text-indigo-400" />
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: QUICK ACTIONS & NEW ATHLETE SPOTTER */}
          <div className="lg:col-span-1 space-y-6">
            <Link
              href="/feed"
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:border-indigo-400 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group block"
            >
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:shadow-lg group-hover:shadow-indigo-600/30 transition-all duration-300">
                <Search className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                Recruiting Engine
              </h3>
              <p className="text-slate-500 font-medium mb-4 text-sm leading-relaxed">
                Filter the chronological feed by state, grad year, and target tier to find your next signee.
              </p>
              <span className="text-indigo-600 font-bold text-sm inline-flex items-center">
                Search Athletes <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform" />
              </span>
            </Link>

            <Link
              href="/dashboard/messages"
              className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:border-blue-400 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group block relative overflow-hidden"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:shadow-lg group-hover:shadow-blue-600/30 transition-all duration-300">
                <MessageSquareText className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                Recruiting Inbox
              </h3>
              <p className="text-slate-500 font-medium mb-4 text-sm leading-relaxed">
                Manage direct pitches from verified high school athletes and their coaches.
              </p>
              <span className="text-blue-600 font-bold text-sm inline-flex items-center">
                Open Inbox <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform" />
              </span>
            </Link>

            {/* 📡 NEW ATHLETE SPOTTER (Replaces URL Scouter) */}
            <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-200 relative overflow-hidden flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                    <Radio className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">New Athlete Spotter</h3>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      Newly verified prospects in{' '}
                      <span className="font-bold text-indigo-600">{coachProfile?.sport || 'all sports'}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => fetchSpotterAndActivity(coachProfile)}
                  disabled={isRefreshingSpotter}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all hover:rotate-180 duration-500 disabled:opacity-50"
                  title="Refresh Verified Spotter"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingSpotter ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {!coachProfile?.sport && (
                <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-amber-800">
                    Set your coaching sport in your profile to auto-filter verified recruits.
                  </p>
                  <button
                    onClick={handleEditToggle}
                    className="text-[10px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg shrink-0 transition-colors"
                  >
                    Set Sport
                  </button>
                </div>
              )}

              {spottedAthletes.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-black text-slate-700 mb-1">No newly verified matches yet</p>
                  <p className="text-xs font-medium text-slate-400">
                    As soon as an athlete in {coachProfile?.sport || 'your sport'} gets verified, they will appear right
                    here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                  {spottedAthletes.map((athlete) => {
                    const isAlreadyTracked = trackedAthleteIds.has(athlete.id);
                    const topMetric = athlete.metrics[0];

                    return (
                      <div
                        key={athlete.id}
                        className="bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl p-4 transition-all duration-200 hover:shadow-md group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Link href={`/athlete/${athlete.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-full bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
                              {athlete.avatar_url ? (
                                <img
                                  src={athlete.avatar_url}
                                  alt={athlete.first_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Medal className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-black text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                  {athlete.first_name} {athlete.last_name}
                                </h4>
                                <span title="Verified Athlete" className="flex items-center shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-400 truncate">
                                {athlete.high_school || 'High School'}
                                {athlete.state ? ` • ${athlete.state}` : ''}
                                {athlete.grad_year ? ` • '${String(athlete.grad_year).slice(-2)}` : ''}
                              </p>
                            </div>
                          </Link>

                          <button
                            onClick={() => handleAddSpottedToWatchlist(athlete)}
                            disabled={isAlreadyTracked || addingAthleteId === athlete.id}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shrink-0 transition-all duration-200 ${
                              isAlreadyTracked
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                                : 'bg-slate-900 hover:bg-indigo-600 text-white hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow-indigo-500/25'
                            }`}
                          >
                            {isAlreadyTracked ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Tracked
                              </>
                            ) : addingAthleteId === athlete.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" /> Track
                              </>
                            )}
                          </button>
                        </div>

                        {topMetric && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] truncate max-w-[60%]">
                              {topMetric.event}
                            </span>
                            <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {topMetric.mark}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: THE WATCHLIST */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200 h-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center">
                    <Star className="w-6 h-6 mr-3 text-yellow-400 fill-yellow-400" /> My Watchlist
                  </h2>
                  <p className="text-slate-500 font-medium mt-1 text-sm">
                    Athletes you are actively tracking. Click the gear icon on any recruit to customize which stats you
                    watch.
                  </p>
                </div>

                {watchlist.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-all duration-200 border border-slate-200 hover:border-slate-900 hover:-translate-y-0.5 active:translate-y-0 shadow-sm shrink-0"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                )}
              </div>

              {watchlist.length === 0 ? (
                <div className="text-center py-16 px-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Your board is empty!</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
                    When you find an athlete you like in the Discovery Engine or the New Athlete Spotter, click Track to
                    pin them here and monitor their stat updates.
                  </p>
                  <Link
                    href="/feed"
                    className="bg-slate-900 hover:bg-indigo-600 hover:-translate-y-0.5 active:translate-y-0 text-white px-8 py-3.5 rounded-xl font-black transition-all shadow-md inline-block"
                  >
                    Start Scouting
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {watchlist.map((item: any) => {
                    const athlete = item.athletes;
                    if (!athlete) return null;

                    const allMetrics: NormalizedMetric[] = athlete.metrics || [];
                    const prefs = watchPrefs[athlete.id];

                    // Filter metrics based on what the coach chose to watch/pin
                    const displayPrs: NormalizedMetric[] =
                      prefs && prefs.pinnedEvents.length > 0
                        ? allMetrics
                            .filter((m) => prefs.pinnedEvents.includes(m.event))
                            .slice(0, 4)
                        : allMetrics.slice(0, 4);

                    const extraPrsCount = Math.max(0, allMetrics.length - displayPrs.length);
                    const isWatchingUpdates = prefs ? prefs.watchAllUpdates : true;
                    const hasRecentStatUpdate =
                      isWatchingUpdates && allMetrics.some((metric) => isRecentUpdate(metric.date));

                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-slate-200 rounded-[1.5rem] p-6 hover:border-indigo-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_-15px_rgba(79,70,229,0.16)] transition-all duration-300 group relative flex flex-col"
                      >
                        {hasRecentStatUpdate && (
                          <div className="absolute -top-3 left-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 z-10 border border-indigo-400/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping"></span>
                            STAT UPDATED
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-5 gap-2">
                          <Link href={`/athlete/${athlete.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-14 h-14 bg-slate-100 rounded-full border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 group-hover:ring-4 group-hover:ring-indigo-50 transition-all">
                              {athlete.avatar_url ? (
                                <img src={athlete.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <Medal className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div className="truncate pr-1">
                              <h4 className="font-black text-lg text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                {athlete.first_name} {athlete.last_name}
                              </h4>
                              <p className="text-xs font-bold text-slate-400 mt-0.5">
                                Class of {athlete.grad_year || '202X'}
                              </p>
                            </div>
                          </Link>

                          {/* SETTINGS & DELETE ICON ACTIONS */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setConfiguringAthlete(athlete)}
                              className="group/gear p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                              title="Configure Watched Stats"
                            >
                              <Settings className="w-4 h-4 transition-transform duration-300 group-hover/gear:rotate-90" />
                            </button>
                            <button
                              onClick={() => handleRemoveFromWatchlist(item.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                              title="Remove from Watchlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">
                            {athlete.high_school} {athlete.state ? `• ${athlete.state}` : ''}
                          </span>
                        </div>

                        <div className="mb-6 flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                              <Trophy className="w-3 h-3 mr-1 text-indigo-500" />
                              {prefs && prefs.pinnedEvents.length > 0 ? 'Watched Stats' : 'Top Marks'}
                            </h5>
                            <button
                              onClick={() => setConfiguringAthlete(athlete)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                            >
                              <SlidersHorizontal className="w-2.5 h-2.5" /> Customize
                            </button>
                          </div>

                          {displayPrs.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {displayPrs.map((metric: NormalizedMetric, i: number) => {
                                const isRecent = isRecentUpdate(metric.date);
                                return (
                                  <div
                                    key={metric.id || i}
                                    className={`p-2.5 rounded-xl border transition-colors ${
                                      isRecent
                                        ? 'bg-indigo-50/70 border-indigo-200 shadow-sm'
                                        : 'bg-slate-50/60 hover:bg-white border-slate-100'
                                    }`}
                                  >
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mb-0.5">
                                      {metric.event}
                                    </span>
                                    <span className="block font-black text-sm text-indigo-600 truncate">
                                      {metric.mark}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs font-medium text-slate-400 italic py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              No stats synced yet.
                            </div>
                          )}

                          {extraPrsCount > 0 && (
                            <div className="text-center mt-2.5">
                              <button
                                onClick={() => setConfiguringAthlete(athlete)}
                                className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors"
                              >
                                +{extraPrsCount} MORE {extraPrsCount === 1 ? 'EVENT' : 'EVENTS'} (CLICK TO WATCH)
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2.5">
                          <Link
                            href={`/athlete/${athlete.id}?action=message`}
                            className="group/msg flex-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 font-bold py-2.5 rounded-xl flex items-center justify-center text-sm transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <Mail className="w-4 h-4 mr-1.5 transition-transform group-hover/msg:scale-110" /> Message
                          </Link>
                          <Link
                            href={`/athlete/${athlete.id}`}
                            className="group/prof flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl flex items-center justify-center text-sm transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                          >
                            Profile{' '}
                            <ExternalLink className="w-4 h-4 ml-1.5 opacity-70 transition-transform group-hover/prof:translate-x-0.5 group-hover/prof:-translate-y-0.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ⚙️ TRACKED ATHLETE STAT WATCHER MODAL */}
      {configuringAthlete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Watch {configuringAthlete.first_name}&apos;s Stats
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Select up to 4 events/metrics to pin to their card and monitor updates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfiguringAthlete(null)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Watch Updates Toggle */}
            <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Highlight New Stat Updates</p>
                  <p className="text-xs font-medium text-slate-500">
                    Show a live badge whenever {configuringAthlete.first_name} logs a new mark or PR.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleToggleWatchAllUpdates(configuringAthlete.id, configuringAthlete.metrics || [])
                }
                className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center shrink-0 ${
                  (watchPrefs[configuringAthlete.id]?.watchAllUpdates ?? true)
                    ? 'bg-indigo-600 justify-end'
                    : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-sm block" />
              </button>
            </div>

            {/* All Athlete Stats List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Available Athlete Stats ({(configuringAthlete.metrics || []).length})
                </span>
                <span className="text-xs font-bold text-indigo-600">
                  {(
                    watchPrefs[configuringAthlete.id]?.pinnedEvents ||
                    (configuringAthlete.metrics || []).slice(0, 4).map((m: NormalizedMetric) => m.event)
                  ).length}{' '}
                  / 4 Pinned
                </span>
              </div>

              {(configuringAthlete.metrics || []).length === 0 ? (
                <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-bold text-slate-500">
                    This athlete hasn&apos;t posted any stats yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {(configuringAthlete.metrics || []).map((metric: NormalizedMetric, idx: number) => {
                    const currentPinned: string[] =
                      watchPrefs[configuringAthlete.id]?.pinnedEvents ||
                      (configuringAthlete.metrics || []).slice(0, 4).map((m: NormalizedMetric) => m.event);
                    const isPinned = currentPinned.includes(metric.event);

                    return (
                      <button
                        key={metric.id || idx}
                        type="button"
                        onClick={() =>
                          handleToggleWatchedEvent(
                            configuringAthlete.id,
                            metric.event,
                            configuringAthlete.metrics || []
                          )
                        }
                        className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-2 ${
                          isPinned
                            ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-500/15 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                            {metric.event}
                          </span>
                          <span className="block text-base font-black text-slate-900 truncate mt-0.5">
                            {metric.mark}
                          </span>
                          {metric.sport && (
                            <span className="inline-block text-[9px] font-bold text-indigo-600 bg-indigo-100/80 px-1.5 py-0.5 rounded mt-1">
                              {metric.sport}
                            </span>
                          )}
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isPinned ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
              <Link
                href={`/athlete/${configuringAthlete.id}`}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                View Full Athlete Profile <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setConfiguringAthlete(null);
                  showToast('Stat watch preferences updated!', 'success');
                }}
                className="bg-slate-900 hover:bg-indigo-600 hover:-translate-y-0.5 active:translate-y-0 text-white font-black text-sm px-6 py-2.5 rounded-xl transition-all shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}