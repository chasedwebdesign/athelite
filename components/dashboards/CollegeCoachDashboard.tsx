'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation'; // 🚨 FIXED: Added useRouter import
import { Search, Sparkles, AlertCircle, Mail, School, Camera, Star, ChevronRight, Activity, MapPin, Medal, Trash2, ExternalLink, ShieldAlert, CheckCircle2, Flame, Trophy, Pencil, Save, X, Download, MessageSquareText, TrendingUp, Crown, Users, AlertTriangle, Share2, RefreshCw, Lock } from 'lucide-react'; // 🚨 FIXED: Added Lock import
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

interface CoachProfile { 
  id: string; 
  first_name: string | null; 
  last_name: string | null; 
  school_name: string | null; 
  coach_type: string; 
  avatar_url: string | null; 
  email: string | null; 
  is_verified: boolean;
  is_founder: boolean; 
  is_premium?: boolean;
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

// 🚨 EXTRACTED MATH HELPER FUNCTIONS 🚨
const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

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

const getEventScore = (markStr: string, event: string, gender: string): number => {
  const standards = RECRUITING_STANDARDS[gender] || RECRUITING_STANDARDS['Boys'];
  const normalizedEvent = event
    .replace(/Meter\b/i, 'Meters')
    .replace('100 Meter Hurdles', '100m Hurdles')
    .replace('110 Meter Hurdles', '110m Hurdles')
    .replace('200 Meter Hurdles', '200m Hurdles')
    .replace('300 Meter Hurdles', '300m Hurdles')
    .replace('400 Meter Hurdles', '400m Hurdles');

  const eventStds = standards[normalizedEvent] || standards[event];
  if (!eventStds) return 5;

  const val = convertMarkToNumber(markStr, !!eventStds.isField);
  let score = 5;

  if (eventStds.isField) {
    if (val >= eventStds.t1) score = 95 + Math.min(4, ((val - eventStds.t1) / (eventStds.t1 * 0.05)) * 4);
    else if (val >= eventStds.t2) score = 85 + ((val - eventStds.t2) / (eventStds.t1 - eventStds.t2)) * 10;
    else if (val >= eventStds.t3) score = 75 + ((val - eventStds.t3) / (eventStds.t2 - eventStds.t3)) * 10;
    else if (val >= eventStds.t4) score = 65 + ((val - eventStds.t4) / (eventStds.t3 - eventStds.t4)) * 10;
    else if (val >= eventStds.t5) score = 55 + ((val - eventStds.t5) / (eventStds.t4 - eventStds.t5)) * 10;
    else if (val >= eventStds.t6) score = 40 + ((val - eventStds.t6) / (eventStds.t5 - eventStds.t6)) * 14;
    else if (val >= eventStds.t7) score = 20 + ((val - eventStds.t7) / (eventStds.t6 - eventStds.t7)) * 19;
    else { const t8 = eventStds.t7 * 0.85; if (val >= t8) { score = 5 + ((val - t8) / (eventStds.t7 - t8)) * 14; } }
  } else {
    if (val <= eventStds.t1) score = 95 + Math.min(4, ((eventStds.t1 - val) / (eventStds.t1 * 0.05)) * 4);
    else if (val <= eventStds.t2) score = 85 + ((eventStds.t2 - val) / (eventStds.t2 - eventStds.t1)) * 10;
    else if (val <= eventStds.t3) score = 75 + ((eventStds.t3 - val) / (eventStds.t3 - eventStds.t2)) * 10;
    else if (val <= eventStds.t4) score = 65 + ((eventStds.t4 - val) / (eventStds.t4 - eventStds.t3)) * 10;
    else if (val <= eventStds.t5) score = 55 + ((eventStds.t5 - val) / (eventStds.t5 - eventStds.t4)) * 10;
    else if (val <= eventStds.t6) score = 40 + ((eventStds.t6 - val) / (eventStds.t6 - eventStds.t5)) * 14;
    else if (val <= eventStds.t7) score = 20 + ((eventStds.t7 - val) / (eventStds.t7 - eventStds.t6)) * 19;
    else { const t8 = eventStds.t7 * 1.15; if (val <= t8) { score = 5 + ((t8 - val) / (t8 - eventStds.t7)) * 14; } }
  }
  return Math.min(99, Math.max(5, Math.round(score)));
};

const getAthleteProjection = (prs: any[], gender: string) => {
  if (!prs || !Array.isArray(prs) || prs.length === 0) return { overallScore: 0, overallLabel: 'Unranked', overallDesc: '', color: 'text-slate-500', bg: '', border: '', bestEvent: 'N/A', eventBreakdowns: [] };

  let bestScore = 0;
  let bestTier = 'Developmental';

  prs.forEach((pr) => {
    if (!pr.event || !pr.mark) return;
    const score = getEventScore(pr.mark, pr.event, gender);
    if (score > bestScore) bestScore = score;
  });

  bestScore = Math.min(99, Math.max(5, Math.round(bestScore)));
  let color = '';
  
  if (bestScore >= 95) { bestTier = 'Power 4 D1'; color = 'text-fuchsia-600'; }
  else if (bestScore >= 85) { bestTier = 'Mid-Major D1'; color = 'text-purple-600'; }
  else if (bestScore >= 75) { bestTier = 'D1 Walk-On'; color = 'text-blue-600'; }
  else if (bestScore >= 65) { bestTier = 'Top D2/D3'; color = 'text-emerald-600'; }
  else if (bestScore >= 55) { bestTier = 'NAIA Prospect'; color = 'text-amber-600'; }
  else if (bestScore >= 40) { bestTier = 'Strong Varsity'; color = 'text-slate-600'; }
  else if (bestScore >= 20) { bestTier = 'Varsity Standard'; color = 'text-slate-500'; }
  else { bestTier = 'JV Standard'; color = 'text-slate-400'; }

  return { overallScore: bestScore, overallLabel: bestTier, bestEvent: prs[0]?.event || 'N/A' };
};

export default function CollegeCoachDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [hotLeadsCount, setHotLeadsCount] = useState(0);

  // SCOUTING STATE
  const [scoutUrl, setScoutUrl] = useState('');
  const [isScouting, setIsScouting] = useState(false);
  const [scoutedAthletes, setScoutedAthletes] = useState<ScoutedAthlete[]>([]);
  const [activeCardAthlete, setActiveCardAthlete] = useState<ScoutedAthlete | null>(null);
  const [isExportingCard, setIsExportingCard] = useState(false);

  // VERIFICATION STATE
  const [verificationStep, setVerificationStep] = useState<'idle' | 'sending' | 'input' | 'verifying'>('idle');
  const [enteredCode, setEnteredCode] = useState('');
  const [verificationError, setVerificationError] = useState('');

  // EDIT PROFILE STATE
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editSchoolName, setEditSchoolName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    async function loadCoachData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cData } = await supabase.from('coaches').select('*').eq('id', session.user.id).maybeSingle();
      
      if (cData) {
        if (!cData.email && session.user.email) {
          await supabase.from('coaches').update({ email: session.user.email }).eq('id', session.user.id);
          cData.email = session.user.email;
        }
        setCoachProfile(cData);
      }

      const { data: messageData } = await supabase.from('messages').select('id').eq('sender_email', session.user.email).eq('is_read', false);
      if (messageData) setUnreadCount(messageData.length);

      const { data: savedData } = await supabase
        .from('saved_recruits')
        .select(`id, athlete_id, athletes (id, first_name, last_name, high_school, state, grad_year, gender, avatar_url, prs)`)
        .eq('coach_id', session.user.id)
        .order('created_at', { ascending: false });

      if (savedData) {
        const formattedData = savedData.map((item: any) => ({
          ...item,
          athletes: Array.isArray(item.athletes) ? item.athletes[0] : item.athletes
        }));

        setWatchlist(formattedData);
        
        const hotLeads = formattedData.filter(item => {
          return item.athletes?.prs?.some((pr: any) => isRecentPR(pr.date));
        });
        setHotLeadsCount(hotLeads.length);
      }

      // LOAD SCOUTED ATHLETES
      const { data: scoutedData } = await supabase
        .from('scouted_athletes')
        .select('*')
        .eq('scouted_by', session.user.id)
        .order('created_at', { ascending: false });
        
      if (scoutedData) {
        setScoutedAthletes(scoutedData);
      }

      setLoading(false);
    }
    loadCoachData();
  }, [supabase]);

  // --- PROFILE EDIT FUNCTIONS ---
  const handleEditToggle = () => {
    if (!coachProfile) return;
    setEditFirstName(coachProfile.first_name || '');
    setEditLastName(coachProfile.last_name || '');
    setEditSchoolName(coachProfile.school_name || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!coachProfile?.id) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase.from('coaches').update({
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        school_name: editSchoolName.trim()
      }).eq('id', coachProfile.id);

      if (error) throw error;

      setCoachProfile(prev => prev ? { 
        ...prev, 
        first_name: editFirstName.trim(), 
        last_name: editLastName.trim(), 
        school_name: editSchoolName.trim() 
      } : null);
      
      setIsEditingProfile(false);
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
      const { error: dbError } = await supabase.from('coaches').update({ verification_code: code }).eq('id', coachProfile.id);
      if (dbError) throw dbError;

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: coachProfile.email, code, name: coachProfile.first_name })
      });

      if (!res.ok) throw new Error("Failed to send email. Try again later.");
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
      const { data, error } = await supabase.from('coaches').select('verification_code').eq('id', coachProfile!.id).single();
      
      if (error) throw error;
      if (data.verification_code !== enteredCode) throw new Error("Incorrect verification code.");

      await supabase.from('coaches').update({ is_verified: true, verification_code: null }).eq('id', coachProfile!.id);
      
      setCoachProfile(prev => prev ? { ...prev, is_verified: true } : null);
      setVerificationStep('idle');
    } catch (err: any) {
      setVerificationError(err.message);
      setVerificationStep('input');
    }
  };

  // --- AVATAR, SCOUT, & WATCHLIST FUNCTIONS ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploadingAvatar(true);
      if (!e.target.files || e.target.files.length === 0 || !coachProfile?.id) return;
      const compressedFile = await imageCompression(e.target.files[0], { maxSizeMB: 0.2, maxWidthOrHeight: 500, useWebWorker: true });
      const fileName = `${coachProfile.id}-avatar.jpg`; 
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, compressedFile, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const urlWithTime = `${publicUrl}?t=${new Date().getTime()}`;

      await supabase.from('coaches').update({ avatar_url: urlWithTime }).eq('id', coachProfile.id);
      setCoachProfile((prev) => prev ? { ...prev, avatar_url: urlWithTime } : null);
    } catch (error: any) { showToast(`Error uploading image: ${error.message}`); } finally { setIsUploadingAvatar(false); }
  };

  const handleRemoveFromWatchlist = async (savedRecruitId: string) => {
    try {
      setWatchlist((prev) => prev.filter((item) => item.id !== savedRecruitId));
      await supabase.from('saved_recruits').delete().eq('id', savedRecruitId);
    } catch (err: any) { showToast(`Failed to remove: ${err.message}`); }
  };

  const handleScoutCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachProfile?.is_premium) {
      return showToast("URL Scouter is a premium feature.", "error");
    }
    
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

      if (coachProfile.id) {
        const { data: newScout, error: insertError } = await supabase.from('scouted_athletes').insert({
          scouted_by: coachProfile.id,
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
      showToast("Failed to export card. Ensure you ran: npm install html2canvas", "error");
    } finally {
      setIsExportingCard(false);
    }
  };

  const isRecentPR = (dateString: string) => {
    if (!dateString || dateString === 'Unknown Date') return false;
    const prDate = new Date(dateString);
    if (isNaN(prDate.getTime())) return false;
    const diffTime = Math.abs(new Date().getTime() - prDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 14; 
  };

  const handleExportCSV = () => {
    if (watchlist.length === 0) return;

    const headers = ['First Name', 'Last Name', 'High School', 'State', 'Grad Year', 'Top Event', 'Top Mark'];
    const csvData = watchlist.map(item => {
      const a = item.athletes;
      if (!a) return '';
      const topPr = a.prs && a.prs.length > 0 ? a.prs[0] : { event: 'N/A', mark: 'N/A' };
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

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  // 🚨 CHECK FOR MISSING PROFILE INFO 🚨
  const profileIncomplete = coachProfile && (!coachProfile.first_name || !coachProfile.last_name || !coachProfile.school_name);
  const isPremium = coachProfile?.is_premium;

  const cardProjection = activeCardAthlete ? getAthleteProjection(activeCardAthlete.prs || [], activeCardAthlete.gender) : null;
  let cardAccentColor = 'from-slate-700 to-slate-900 border-slate-500';
  let cardGlowColor = 'bg-slate-500/30';
  if (cardProjection) {
    if (cardProjection.overallScore >= 95) { cardAccentColor = 'from-fuchsia-600 to-purple-900 border-fuchsia-400'; cardGlowColor = 'bg-fuchsia-500/40'; }
    else if (cardProjection.overallScore >= 85) { cardAccentColor = 'from-purple-600 to-indigo-900 border-purple-400'; cardGlowColor = 'bg-purple-500/40'; }
    else if (cardProjection.overallScore >= 75) { cardAccentColor = 'from-blue-500 to-indigo-900 border-blue-400'; cardGlowColor = 'bg-blue-500/40'; }
    else if (cardProjection.overallScore >= 65) { cardAccentColor = 'from-emerald-500 to-teal-900 border-emerald-400'; cardGlowColor = 'bg-emerald-500/40'; }
    else if (cardProjection.overallScore >= 55) { cardAccentColor = 'from-amber-500 to-orange-900 border-amber-400'; cardGlowColor = 'bg-amber-500/40'; }
  }

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

      {/* HEADER HERO SECTION */}
      <div className="bg-slate-900 text-white pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
          
          <div className="relative w-32 h-32 group shrink-0">
            <div className={`w-full h-full rounded-full border-4 ${isPremium ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'border-slate-800 shadow-xl'} overflow-hidden bg-slate-800 flex items-center justify-center ${isUploadingAvatar ? 'animate-pulse' : ''}`}>
              {coachProfile?.avatar_url ? (
                <img src={coachProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <School className="w-12 h-12 text-slate-400" />
              )}
            </div>
            <label className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white mb-1" />
              <span className="text-[10px] text-white font-bold uppercase tracking-wider text-center px-2">Update Logo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
            </label>
          </div>

          <div className="text-center md:text-left flex-1 w-full">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-widest uppercase">
                NCAA Recruiting Command Center
              </div>
              {isPremium && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase border bg-amber-500/20 border-amber-400/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]`}>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Coach Pro Hub
                </div>
              )}
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
                    <p className="text-red-300/80 text-xs font-medium mt-0.5">Athletes need to know who you are. Please add your name and university.</p>
                  </div>
                </div>
                <button 
                  onClick={handleEditToggle} 
                  className="w-full sm:w-auto px-5 py-2 bg-red-500 hover:bg-red-400 text-white text-sm font-black rounded-xl transition-colors shadow-lg shadow-red-500/20 shrink-0"
                >
                  Complete Profile
                </button>
              </div>
            )}
            
            {isEditingProfile ? (
              <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 max-w-lg mx-auto md:mx-0 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                    <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} placeholder="John" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                    <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} placeholder="Doe" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">University Name</label>
                  <input type="text" value={editSchoolName} onChange={e => setEditSchoolName(e.target.value)} placeholder="State University" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1" />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleSaveProfile} disabled={isSavingProfile || !editFirstName.trim() || !editLastName.trim() || !editSchoolName.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center transition-colors shadow-lg disabled:opacity-50">
                    <Save className="w-4 h-4 mr-2" /> {isSavingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button onClick={() => setIsEditingProfile(false)} className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center transition-colors">
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
                  <span className="flex items-center"><School className="w-4 h-4 mr-1.5 opacity-70" /> {coachProfile?.school_name || 'Set up your University Profile'}</span>
                  <span className="text-slate-600 hidden md:inline">|</span>
                  <span className="flex items-center"><Mail className="w-4 h-4 mr-1.5 opacity-70" /> {coachProfile?.email}</span>
                </p>

                {/* EDIT BUTTON */}
                <button 
                  onClick={handleEditToggle} 
                  className="absolute -right-12 top-2 p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"
                  title="Edit Profile"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
        
        {/* EMAIL VERIFICATION BANNER */}
        {!coachProfile?.is_verified && (
          <div className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-3xl p-8 shadow-xl border border-yellow-400 mb-8 text-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black flex items-center mb-2">
                <ShieldAlert className="w-6 h-6 mr-2" /> Verify your .edu Email
              </h2>
              <p className="font-medium text-yellow-900">
                To protect athletes, you must verify your university email address before you can send direct messages or appear as a Verified Coach.
              </p>
              {verificationError && <p className="text-red-900 bg-red-100 px-3 py-1 rounded mt-2 text-sm font-bold w-fit">{verificationError}</p>}
            </div>

            <div className="w-full md:w-auto shrink-0 bg-white/20 p-4 rounded-2xl border border-white/30 backdrop-blur-sm">
              {verificationStep === 'idle' && (
                <button onClick={handleSendCode} className="w-full bg-slate-900 hover:bg-black text-white font-black px-8 py-3.5 rounded-xl transition-all shadow-md">
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
                  <button type="submit" disabled={verificationStep === 'verifying'} className="bg-slate-900 hover:bg-black text-white font-black px-6 py-3 rounded-xl transition-all shadow-md disabled:opacity-50">
                    {verificationStep === 'verifying' ? '...' : 'Verify'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* COMMAND CENTER STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Athletes Tracked</p>
              <h3 className="text-3xl font-black text-slate-900">{watchlist.length}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Hot Leads (New PRs)</p>
              <h3 className="text-3xl font-black text-slate-900">{hotLeadsCount}</h3>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
          </div>

          <Link href="/dashboard/messages" className="bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-800 flex items-center justify-between hover:bg-slate-800 transition-colors group">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Unread Messages</p>
              <h3 className="text-3xl font-black text-white">{unreadCount}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6 text-indigo-400" />
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: QUICK ACTIONS & URL SCOUTER */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/feed" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group block">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500 transition-all">
                <Search className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Recruiting Engine</h3>
              <p className="text-slate-500 font-medium mb-4">Filter the chronological feed by state, grad year, and target tier to find your next signee.</p>
              <span className="text-indigo-600 font-bold text-sm flex items-center">
                Search Athletes <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link href="/dashboard/messages" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group block relative overflow-hidden">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500 transition-all">
                <MessageSquareText className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Recruiting Inbox</h3>
              <p className="text-slate-500 font-medium mb-4">Manage direct pitches from verified high school athletes and their coaches.</p>
              <span className="text-blue-600 font-bold text-sm flex items-center">
                Open Inbox <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* 🕵️ URL SCOUTER (Locks Entirely for non-pro) */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 relative overflow-hidden flex flex-col h-auto">
              {!isPremium && (
                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 border border-white/50 rounded-[2rem]">
                  <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-3 border border-indigo-100 shadow-inner"><Lock className="w-6 h-6 text-indigo-500" /></div>
                  <h3 className="text-xl font-black text-slate-900 mb-1">URL Scouter Locked</h3>
                  <p className="text-slate-500 text-sm font-medium mb-4 max-w-sm">Upgrade to Coach Pro to generate an instant recruiting score for any athlete.</p>
                  <Link href="/coach-pro" className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-black px-6 py-2.5 rounded-xl shadow-md hover:scale-105 transition-transform flex items-center gap-2 text-sm">
                    <Crown className="w-4 h-4 text-amber-400" /> Unlock Pro Engine
                  </Link>
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><Search className="w-5 h-5 text-indigo-600"/></div>
                 <div>
                   <h3 className="text-lg font-black text-slate-900">URL Scouter</h3>
                   <p className="text-xs font-medium text-slate-500">Paste an Athletic.net link.</p>
                 </div>
              </div>
              
              <form onSubmit={handleScoutCompetitor} className={`flex gap-2 mb-6 ${!isPremium ? 'opacity-30' : ''}`}>
                 <input 
                   type="url" 
                   required 
                   value={scoutUrl} 
                   onChange={(e) => setScoutUrl(e.target.value)} 
                   disabled={!isPremium || isScouting} 
                   placeholder="Paste link..." 
                   className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                 />
                 <button type="submit" disabled={!isPremium || isScouting} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50">
                    {isScouting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                 </button>
              </form>

              {/* Scouted Athletes List */}
              {scoutedAthletes.length > 0 && (
                 <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {scoutedAthletes.map(scout => (
                       <div key={scout.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 relative group">
                          <button onClick={() => handleRemoveScouted(scout.id)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5"/></button>
                          <h4 className="font-bold text-slate-900 text-sm truncate pr-6">{scout.first_name} {scout.last_name}</h4>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">{scout.high_school}</p>
                          <div className="flex items-center justify-between">
                             <span className="text-2xl font-black text-indigo-600">{scout.calculated_score}</span>
                             <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{scout.calculated_tier}</span>
                          </div>
                          <button onClick={() => setActiveCardAthlete(scout)} className="w-full mt-3 bg-white border border-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"><Share2 className="w-3.5 h-3.5"/> Export Card</button>
                       </div>
                    ))}
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
                  <p className="text-slate-500 font-medium mt-1">Athletes you are actively tracking.</p>
                </div>
                
                {watchlist.length > 0 && (
                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors border border-slate-200"
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
                    When you find an athlete you like in the Discovery Engine, click the "Save to Watchlist" button to pin them here for easy access.
                  </p>
                  <Link href="/feed" className="bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-black transition-colors shadow-md inline-block">
                    Start Scouting
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {watchlist.map((item) => {
                    const athlete = item.athletes;
                    if (!athlete) return null;

                    const hasRecentPR = athlete.prs?.some((pr: any) => isRecentPR(pr.date));
                    const displayPrs = athlete.prs?.slice(0, 4) || [];
                    const extraPrsCount = (athlete.prs?.length || 0) - 4;

                    return (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-[1.5rem] p-6 hover:border-indigo-300 hover:shadow-lg transition-all group relative flex flex-col">
                        
                        {hasRecentPR && (
                          <div className="absolute -top-3 -left-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 animate-bounce z-10 border border-orange-300">
                            <Flame className="w-3 h-3 fill-white" /> NEW PR
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-5">
                          <Link href={`/athlete/${athlete.id}`} className="flex items-center gap-3 flex-1">
                            <div className="w-14 h-14 bg-slate-100 rounded-full border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {athlete.avatar_url ? (
                                <img src={athlete.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <Medal className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div className="truncate pr-2">
                              <h4 className="font-black text-lg text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                {athlete.first_name} {athlete.last_name}
                              </h4>
                              <p className="text-xs font-bold text-slate-400 mt-0.5">Class of {athlete.grad_year || '202X'}</p>
                            </div>
                          </Link>
                          
                          <button 
                            onClick={() => handleRemoveFromWatchlist(item.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                            title="Remove from Watchlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{athlete.high_school} {athlete.state ? `• ${athlete.state}` : ''}</span>
                        </div>

                        <div className="mb-6 flex-1">
                          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                            <Trophy className="w-3 h-3 mr-1" /> Top Marks
                          </h5>
                          {displayPrs.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {displayPrs.map((pr: any, i: number) => {
                                const isRecent = isRecentPR(pr.date);
                                return (
                                  <div key={i} className={`p-2.5 rounded-xl border ${isRecent ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-slate-100'}`}>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mb-0.5">{pr.event}</span>
                                    <span className={`block font-black text-sm ${isRecent ? 'text-orange-600' : 'text-indigo-600'}`}>{pr.mark}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs font-medium text-slate-400 italic">No times synced yet.</div>
                          )}
                          {extraPrsCount > 0 && (
                            <div className="text-center mt-2">
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">+{extraPrsCount} MORE EVENTS</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
                          <Link href={`/athlete/${athlete.id}?action=message`} className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold py-2.5 rounded-xl flex items-center justify-center text-sm transition-colors shadow-sm">
                            <Mail className="w-4 h-4 mr-1.5" /> Message
                          </Link>
                          <Link href={`/athlete/${athlete.id}`} className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-xl flex items-center justify-center text-sm hover:bg-slate-800 transition-colors shadow-sm">
                            Profile <ExternalLink className="w-4 h-4 ml-1.5 opacity-70" />
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
                     <span className="text-5xl font-black text-white leading-none tracking-tighter">{cardProjection.overallScore}</span>
                     <span className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-1">OVR</span>
                  </div>
                  <ShieldAlert className="w-10 h-10 text-white/50" />
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
                  {activeCardAthlete.prs.slice(0,3).map((ev: any, idx: number) => (
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