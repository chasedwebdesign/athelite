'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Activity, ShieldCheck, Link as LinkIcon, Trophy, LogOut, Medal, Timer, TrendingUp, CheckCircle2, Search, AlertCircle, Zap, Calendar, MapPin, Camera, Mail, RefreshCw, School, Lock, AlertTriangle, ExternalLink, ChevronRight, Check, Clock, Edit2, MousePointer2, Flame, Bookmark, Share2, Instagram, X, Users, Gift, Paintbrush, ArrowDown, HelpCircle, Globe, UserCircle2, Eye, BarChart3, Rocket, FileText, Save, Crown, Target, Swords, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

import { AvatarWithBorder } from '@/components/AnimatedBorders'; 

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

const RECRUITING_STANDARDS: Record<string, Record<string, { t1: number, t2: number, t3: number, t4: number, t5: number, isField?: boolean }>> = {
  'Boys': {
    '100 Meters': { t1: 10.5, t2: 10.8, t3: 11.0, t4: 11.3, t5: 11.6 },
    '200 Meters': { t1: 21.2, t2: 21.8, t3: 22.2, t4: 22.8, t5: 23.5 },
    '400 Meters': { t1: 47.5, t2: 49.0, t3: 50.0, t4: 51.5, t5: 53.0 },
    '800 Meters': { t1: 112, t2: 115, t3: 117, t4: 120, t5: 125 }, 
    '1500 Meters': { t1: 231, t2: 239, t3: 244, t4: 250, t5: 264 },
    '1600 Meters': { t1: 250, t2: 258, t3: 264, t4: 270, t5: 285 }, 
    '3000 Meters': { t1: 500, t2: 518, t3: 532, t4: 546, t5: 574 },
    '3200 Meters': { t1: 540, t2: 560, t3: 575, t4: 590, t5: 620 }, 
    'Long Jump': { t1: 288, t2: 270, t3: 260, t4: 252, t5: 240, isField: true }, 
    'Shot Put': { t1: 720, t2: 660, t3: 600, t4: 540, t5: 480, isField: true }, 
    'High Jump': { t1: 82, t2: 78, t3: 76, t4: 74, t5: 70, isField: true }, 
  },
  'Girls': {
    '100 Meters': { t1: 11.7, t2: 12.1, t3: 12.4, t4: 12.8, t5: 13.2 },
    '200 Meters': { t1: 24.2, t2: 24.8, t3: 25.5, t4: 26.2, t5: 27.0 },
    '400 Meters': { t1: 54.5, t2: 57.0, t3: 58.5, t4: 60.5, t5: 63.0 },
    '800 Meters': { t1: 130, t2: 135, t3: 140, t4: 145, t5: 152 }, 
    '1500 Meters': { t1: 268, t2: 282, t3: 291, t4: 300, t5: 314 },
    '1600 Meters': { t1: 290, t2: 305, t3: 315, t4: 325, t5: 340 }, 
    '3000 Meters': { t1: 583, t2: 611, t3: 638, t4: 666, t5: 694 },
    '3200 Meters': { t1: 630, t2: 660, t3: 690, t4: 720, t5: 750 }, 
    'Long Jump': { t1: 234, t2: 222, t3: 210, t4: 198, t5: 186, isField: true }, 
    'Shot Put': { t1: 540, t2: 480, t3: 432, t4: 396, t5: 360, isField: true }, 
    'High Jump': { t1: 68, t2: 64, t3: 62, t4: 60, t5: 58, isField: true }, 
  }
};

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null);
  const [userRole, setUserRole] = useState<'athlete' | 'coach' | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [syncUrl, setSyncUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false); 
  const [unreadCount, setUnreadCount] = useState(0);
  const [highestPercentile, setHighestPercentile] = useState<number>(1.0);
  
  const [equippedTitle, setEquippedTitle] = useState<string>('prospect');
  const [equippedBorder, setEquippedBorder] = useState<string>('none');
  const [isEquipping, setIsEquipping] = useState(false);
  
  const [canSync, setCanSync] = useState(true);
  const [syncTimeLeft, setSyncTimeLeft] = useState('');
  
  const [streak, setStreak] = useState(0);
  const [savedColleges, setSavedColleges] = useState<any[]>([]);
  const [activeRivals, setActiveRivals] = useState<any[]>([]); 

  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [daysSinceJoin, setDaysSinceJoin] = useState(0);

  const [resumeText, setResumeText] = useState('');
  const [isSavingResume, setIsSavingResume] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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

  useEffect(() => {
    const lastSyncStr = localStorage.getItem('last_sync_time');
    if (lastSyncStr) {
      const lastSyncTime = parseInt(lastSyncStr, 10);
      const timePassed = new Date().getTime() - lastSyncTime;
      const oneDay = 24 * 60 * 60 * 1000;
      if (timePassed < oneDay) {
        setCanSync(false);
        setSyncTimeLeft(`${Math.ceil((oneDay - timePassed) / (1000 * 60 * 60))}h`);
      }
    }

    async function loadDashboardData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

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

      const { data: aData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();
      
      if (aData) {
        setUserRole('athlete');
        setEquippedTitle(aData.equipped_title || 'prospect');
        setEquippedBorder(aData.equipped_border || 'none');
        setResumeText(aData.saved_resume || '');
        
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

  const giveDailyReward = async (userId: string, currentCoins: number) => {
    try {
      const newBalance = currentCoins + 10;
      await supabase.from('athletes').update({ coins: newBalance }).eq('id', userId);
      showToast("You earned 10 Coins for your daily login streak!", "success");
    } catch (e) {}
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

  const handleInitialScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    const validationError = validateAthleticUrl(syncUrl);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSyncing(true);
    
    try {
      const { data: existingUser } = await supabase.from('athletes').select('id').eq('athletic_net_url', syncUrl).neq('id', athleteProfile?.id).maybeSingle();

      if (existingUser) {
        setErrorMessage("Someone has already claimed this profile. If this is you, contact support@chasedsports.com to dispute it.");
        setIsSyncing(false);
        return;
      }

      const response = await fetch('/api/sync', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ url: syncUrl }) 
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
    setIsVerifying(true);
    setErrorMessage('');
    
    try {
      const verifyRes = await fetch('/api/verify', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ url: athleteProfile.athletic_net_url, code: verificationCode }) 
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) throw new Error(verifyData.error || "Code not found on profile. Did you save it to your username?");

      if (athleteProfile.referred_by && athleteProfile.trust_level === 0) {
        const { data: referrer } = await supabase
          .from('athletes')
          .select('boosts_available, verified_referrals, unlocked_borders')
          .eq('id', athleteProfile.referred_by)
          .maybeSingle();

        if (referrer) {
          // Reward Referrer
          const newReferralCount = (referrer.verified_referrals || 0) + 1; 
          let newUnlocked = referrer.unlocked_borders || ['none'];
          let newBoosts = referrer.boosts_available || 0;

          if (newReferralCount >= 5 && !newUnlocked.includes('plasma-surge')) {
            newUnlocked = [...newUnlocked, 'plasma-surge'];
          }
          if (newReferralCount % 12 === 0) newBoosts += 4;
          else if (newReferralCount % 3 === 0) newBoosts += 1;

          await supabase.from('athletes').update({
            boosts_available: newBoosts,
            verified_referrals: newReferralCount,
            unlocked_borders: newUnlocked
          }).eq('id', athleteProfile.referred_by);

          // 🚨 Reward Current User (Jumpstart Bonus) 🚨
          const myNewCount = (athleteProfile.verified_referrals || 0) + 1;
          let myUnlocked = athleteProfile.unlocked_borders || ['none'];
          let myBoosts = athleteProfile.boosts_available || 0;

          if (myNewCount >= 5 && !myUnlocked.includes('plasma-surge')) myUnlocked = [...myUnlocked, 'plasma-surge'];
          if (myNewCount % 12 === 0) myBoosts += 4;
          else if (myNewCount % 3 === 0) myBoosts += 1;

          await supabase.from('athletes').update({ 
            trust_level: 1,
            verified_referrals: myNewCount,
            boosts_available: myBoosts,
            unlocked_borders: myUnlocked
          }).eq('id', athleteProfile.id);

        } else {
          await supabase.from('athletes').update({ trust_level: 1 }).eq('id', athleteProfile.id);
        }
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

  const handleReSync = async () => {
    if (!athleteProfile?.athletic_net_url) return;
    setIsSyncing(true);
    setErrorMessage('');
    
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
      
      localStorage.setItem('last_sync_time', new Date().getTime().toString());
      window.location.reload(); 
    } catch (err: any) { 
      setErrorMessage(err.message); 
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

  // 🚨 FORGIVING INVITE SCANNER + JUMPSTART BONUS LOGIC 🚨
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
            // 1. Reward the Referrer
            const referrerNewCount = (referrer.verified_referrals || 0) + 1; 
            let referrerUnlocked = referrer.unlocked_borders || ['none'];
            let referrerBoosts = referrer.boosts_available || 0;

            if (referrerNewCount >= 5 && !referrerUnlocked.includes('plasma-surge')) referrerUnlocked = [...referrerUnlocked, 'plasma-surge'];
            if (referrerNewCount % 12 === 0) referrerBoosts += 4;
            else if (referrerNewCount % 3 === 0) referrerBoosts += 1;

            await supabase.from('athletes').update({ boosts_available: referrerBoosts, verified_referrals: referrerNewCount, unlocked_borders: referrerUnlocked }).eq('id', referrer.id);

            // 2. Reward Current User (Jumpstart Bonus)
            const myNewCount = (athleteProfile.verified_referrals || 0) + 1;
            let myUnlocked = athleteProfile.unlocked_borders || ['none'];
            let myBoosts = athleteProfile.boosts_available || 0;

            if (myNewCount >= 5 && !myUnlocked.includes('plasma-surge')) myUnlocked = [...myUnlocked, 'plasma-surge'];
            if (myNewCount % 12 === 0) myBoosts += 4;
            else if (myNewCount % 3 === 0) myBoosts += 1;

            await supabase.from('athletes').update({ 
              referred_by: referrer.id,
              verified_referrals: myNewCount,
              boosts_available: myBoosts,
              unlocked_borders: myUnlocked
            }).eq('id', athleteProfile.id);

            // Update local state instantly so the progress bar moves
            setAthleteProfile({ 
              ...athleteProfile, 
              referred_by: referrer.id,
              verified_referrals: myNewCount,
              boosts_available: myBoosts,
              unlocked_borders: myUnlocked
            });
        } else {
            // If they haven't verified yet, just lock in the referred_by. 
            // They will get the jumpstart bonus during confirmVerification()
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

  // 🚨 100% FIXED SCOUTING ENGINE 🚨
  const generateScoutingReport = () => {
    if (!athleteProfile || !athleteProfile.prs || athleteProfile.prs.length === 0) {
      return { overallScore: 0, overallLabel: '', overallDesc: '', color: '', bg: '', border: '', eventBreakdowns: [] };
    }

    const gender = athleteProfile.gender || 'Boys';
    const standards = RECRUITING_STANDARDS[gender];
    
    let allBreakdowns: any[] = [];

    athleteProfile.prs.forEach((pr) => {
      const eventStds = standards[pr.event];
      if (eventStds) {
        const val = convertMarkToNumber(pr.mark, !!eventStds.isField);
        let score = 40;
        let currentTier = 'Developmental';
        let nextTier = 'D3 / NAIA';
        let targetMarkNum = eventStds.t5;
        let delta = 0;

        if (eventStds.isField) {
          if (val >= eventStds.t1) { score = 95 + Math.min(4, ((val - eventStds.t1) / (eventStds.t1 * 0.05)) * 4); currentTier = 'Power 4 D1'; nextTier = 'Elite'; targetMarkNum = eventStds.t1 * 1.05; }
          else if (val >= eventStds.t2) { score = 85 + ((val - eventStds.t2) / (eventStds.t1 - eventStds.t2)) * 10; currentTier = 'Mid-Major D1'; nextTier = 'Power 4 D1'; targetMarkNum = eventStds.t1; }
          else if (val >= eventStds.t3) { score = 75 + ((val - eventStds.t3) / (eventStds.t2 - eventStds.t3)) * 10; currentTier = 'Top D2 / Walk-on'; nextTier = 'Mid-Major D1'; targetMarkNum = eventStds.t2; }
          else if (val >= eventStds.t4) { score = 65 + ((val - eventStds.t4) / (eventStds.t3 - eventStds.t4)) * 10; currentTier = 'Solid D2 / High D3'; nextTier = 'Top D2'; targetMarkNum = eventStds.t3; }
          else if (val >= eventStds.t5) { score = 55 + ((val - eventStds.t5) / (eventStds.t4 - eventStds.t5)) * 10; currentTier = 'D3 / NAIA'; nextTier = 'Solid D2'; targetMarkNum = eventStds.t4; }
          else { const t6 = eventStds.t5 - (eventStds.t4 - eventStds.t5); if (val >= t6) score = 40 + ((val - t6) / (eventStds.t5 - t6)) * 15; currentTier = 'Developmental'; nextTier = 'D3 / NAIA'; targetMarkNum = eventStds.t5; }
          delta = targetMarkNum - val;
        } else {
          if (val <= eventStds.t1) { score = 95 + Math.min(4, ((eventStds.t1 - val) / (eventStds.t1 * 0.05)) * 4); currentTier = 'Power 4 D1'; nextTier = 'Elite'; targetMarkNum = eventStds.t1 * 0.95; }
          else if (val <= eventStds.t2) { score = 85 + ((eventStds.t2 - val) / (eventStds.t2 - eventStds.t1)) * 10; currentTier = 'Mid-Major D1'; nextTier = 'Power 4 D1'; targetMarkNum = eventStds.t1; }
          else if (val <= eventStds.t3) { score = 75 + ((eventStds.t3 - val) / (eventStds.t3 - eventStds.t2)) * 10; currentTier = 'Top D2 / Walk-on'; nextTier = 'Mid-Major D1'; targetMarkNum = eventStds.t2; }
          else if (val <= eventStds.t4) { score = 65 + ((eventStds.t4 - val) / (eventStds.t4 - eventStds.t3)) * 10; currentTier = 'Solid D2 / High D3'; nextTier = 'Top D2'; targetMarkNum = eventStds.t3; }
          else if (val <= eventStds.t5) { score = 55 + ((eventStds.t5 - val) / (eventStds.t5 - eventStds.t4)) * 10; currentTier = 'D3 / NAIA'; nextTier = 'Solid D2'; targetMarkNum = eventStds.t4; }
          else { const t6 = eventStds.t5 + (eventStds.t5 - eventStds.t4); if (val <= t6) score = 40 + ((t6 - val) / (t6 - eventStds.t5)) * 15; currentTier = 'Developmental'; nextTier = 'D3 / NAIA'; targetMarkNum = eventStds.t5; }
          delta = val - targetMarkNum; 
        }

        score = Math.min(99, Math.max(40, Math.round(score)));

        allBreakdowns.push({
          event: pr.event,
          mark: pr.mark,
          score,
          currentTier,
          nextTier,
          targetMarkFormatted: formatMarkFromNumber(targetMarkNum, !!eventStds.isField),
          deltaFormatted: !!eventStds.isField ? `+${formatMarkFromNumber(delta, true)}` : `-${delta.toFixed(2)}s`,
          isField: !!eventStds.isField
        });
      }
    });

    if (allBreakdowns.length === 0) {
      return { overallScore: 0, overallLabel: '', overallDesc: '', color: '', bg: '', border: '', eventBreakdowns: [] };
    }

    allBreakdowns.sort((a, b) => b.score - a.score);
    const best = allBreakdowns[0];

    let label = ''; let desc = ''; let color = ''; let bg = ''; let border = '';
    
    if (best.score >= 95) { label = 'Power 4 D1 Recruit'; desc = 'You are a priority target for top-tier Division 1 programs. Coaches will find you.'; color = 'text-fuchsia-600'; bg = 'bg-fuchsia-50'; border = 'border-fuchsia-200'; }
    else if (best.score >= 85) { label = 'Mid-Major D1 / Elite D2'; desc = 'You hold marks that command athletic scholarship money. Start taking official visits.'; color = 'text-purple-600'; bg = 'bg-purple-50'; border = 'border-purple-200'; }
    else if (best.score >= 75) { label = 'D1 Walk-On / Top D2'; desc = 'D1 programs will let you walk on, and D2 programs will heavily recruit you. Great spot to be in.'; color = 'text-blue-600'; bg = 'bg-blue-50'; border = 'border-blue-200'; }
    else if (best.score >= 65) { label = 'Solid D2 / High-End D3'; desc = 'Great priority recruit for D2 or D3 programs. You can absolutely compete at the next level.'; color = 'text-emerald-600'; bg = 'bg-emerald-50'; border = 'border-emerald-200'; }
    else if (best.score >= 55) { label = 'D3 / NAIA Prospect'; desc = 'Solid prospect for Division 3 or NAIA. Focus on reaching out to programs that fit your academics.'; color = 'text-amber-600'; bg = 'bg-amber-50'; border = 'border-amber-200'; }
    else { label = 'Developmental Prospect'; desc = 'Keep grinding! Focus on hitting standard walk-on marks or exploring Junior College (JUCO) routes.'; color = 'text-slate-600'; bg = 'bg-slate-100'; border = 'border-slate-300'; }

    return { 
      overallScore: best.score, 
      overallLabel: label, 
      overallDesc: desc, 
      color, bg, border, 
      eventBreakdowns: allBreakdowns.slice(0, 3) 
    };
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

  const projection = generateScoutingReport();
  // 🚨 BULLETPROOF REFERRAL GENERATOR 🚨
  const myReferralCode = athleteProfile?.athletic_net_url?.match(/\d{5,}/)?.[0] || null;
  
  const showCodeEntry = daysSinceJoin <= 7 && !athleteProfile?.referred_by;
  const isUnverified = athleteProfile?.trust_level === 0 && !!athleteProfile?.athletic_net_url;
  const noProfileLinked = !athleteProfile?.athletic_net_url;
  const streakTheme = getStreakStyle();
  const badge = getTrustBadge(athleteProfile?.trust_level || 0);
  const hasPRs = athleteProfile?.prs && athleteProfile.prs.length > 0;
  const activeTitle = EARNED_TITLES.find(t => t.id === equippedTitle) || EARNED_TITLES[6];

  function getTrustBadge(level: number) {
    switch(level) {
      case 1: return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 border-green-200', text: 'Results Verified' };
      case 2: return { icon: Trophy, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', text: 'Community Verified' };
      case 3: return { icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200', text: 'Coach Verified' };
      default: return { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', text: 'Pending Verification' };
    }
  }

  // 🚨 MILESTONE BAR CALCS 🚨
  const currentRefs = athleteProfile?.verified_referrals || 0;
  const cycle = Math.floor(currentRefs / 12);
  const base = cycle * 12;
  const progressInCycle = currentRefs - base;
  const progressPct = Math.min(100, (progressInCycle / 12) * 100);

  const milestones = [
    { count: base + 3, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    ...(cycle === 0 ? [{ count: 5, label: 'Plasma', icon: Crown, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500', isMajor: false }] : []),
    { count: base + 6, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 9, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 12, label: '+4 Boosts!', icon: Flame, color: 'text-amber-400', bg: 'bg-amber-500', isMajor: true },
  ];

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

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes liquidPan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        
        .legend-badge { background: linear-gradient(90deg, #6b21a8 0%, #d946ef 20%, #6b21a8 40%, #d946ef 60%, #6b21a8 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #e879f9; box-shadow: 0 0 15px rgba(217, 70, 239, 0.5); font-weight: 900; }
        .champion-badge { background: linear-gradient(90deg, #991b1b 0%, #ef4444 20%, #991b1b 40%, #ef4444 60%, #991b1b 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #f87171; box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); font-weight: 900; }
        .elite-badge { background: linear-gradient(90deg, #0f172a 0%, #475569 20%, #0f172a 40%, #475569 60%, #0f172a 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #94a3b8; box-shadow: 0 0 15px rgba(148, 163, 184, 0.3); font-weight: 900; }
      `}} />

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
            {!isUnverified && (
              <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] text-white font-bold uppercase tracking-wider text-center px-2">Update</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
              </label>
            )}
          </div>

          <div className="text-center md:text-left flex-1 w-full">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-3 border ${athleteProfile?.is_premium ? 'bg-amber-500/20 border-amber-400/30 text-amber-400' : 'bg-blue-500/20 border-blue-400/30 text-blue-300'}`}>
              {athleteProfile?.is_premium ? <><Crown className="w-3.5 h-3.5 mr-1.5" /> ChasedPro Athlete</> : 'Athlete Command Center'}
            </div>
            
            <div className="group relative w-fit mx-auto md:mx-0">
              <h1 className="text-4xl font-black mb-2 flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2">
                {athleteProfile?.first_name} {athleteProfile?.last_name}
                {athleteProfile?.trust_level! > 0 && (
                  <span title="Verified Athlete" className="flex items-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </span>
                )}
              </h1>
              <p className="text-lg text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
                <MapPin className="w-4 h-4 opacity-70" /> {athleteProfile?.high_school}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
        
        {/* 🚨 PRO ANALYTICS HUB */}
        {athleteProfile && !noProfileLinked && !isUnverified && (
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 mb-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center">
                  <BarChart3 className="w-6 h-6 mr-3 text-indigo-500" /> Scouting Analytics
                </h2>
                <p className="text-slate-500 font-medium mt-1">See how much traction your profile is getting with college coaches.</p>
              </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 relative ${!athleteProfile?.is_premium ? 'min-h-[280px]' : ''}`}>
              
              {!athleteProfile?.is_premium && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center border border-white/50 shadow-sm p-6 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-inner">
                    <Lock className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Analytics are Locked</h3>
                  <p className="text-slate-500 font-medium mb-6 text-center max-w-md">Upgrade to Pro to see exactly how many college coaches are viewing your profile and searches.</p>
                  <Link href="/pro" className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                    <Crown className="w-5 h-5" /> Unlock Pro Analytics
                  </Link>
                </div>
              )}

              <div className={`bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between ${!athleteProfile?.is_premium ? 'opacity-30 select-none' : ''}`}>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Profile Views</p>
                  <h3 className="text-4xl font-black text-slate-900">{athleteProfile?.is_premium ? athleteProfile.profile_views || 0 : '14'}</h3>
                  <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1"><Activity className="w-3 h-3" /> Coach impressions</p>
                </div>
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Eye className="w-7 h-7 text-indigo-600" />
                </div>
              </div>

              <div className={`bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between ${!athleteProfile?.is_premium ? 'opacity-30 select-none' : ''}`}>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Search Appearances</p>
                  <h3 className="text-4xl font-black text-slate-900">{athleteProfile?.is_premium ? athleteProfile.search_appearances || 0 : '89'}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-2">Times you appeared in Coach searches</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <Search className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETUP GUIDE */}
        {noProfileLinked && (
          <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-blue-800 shadow-2xl relative overflow-hidden mb-10 max-w-5xl mx-auto">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-12">
                <div className="w-16 h-16 bg-blue-500/20 border border-blue-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-blue-300" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">Claim Your Profile</h2>
                <p className="text-blue-200/80 font-medium text-lg max-w-2xl mx-auto">
                  Import your stats directly from Athletic.net. No login required for this step.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 text-white font-black rounded-full flex items-center justify-center border-4 border-slate-900">1</div>
                  <Globe className="w-6 h-6 text-blue-400 mb-3" />
                  <h4 className="text-white font-bold text-lg mb-1">Search Your Name</h4>
                  <p className="text-blue-200/70 text-sm">Open a new tab and search for your name on Athletic.net.</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 text-white font-black rounded-full flex items-center justify-center border-4 border-slate-900">2</div>
                  <UserCircle2 className="w-6 h-6 text-blue-400 mb-3" />
                  <h4 className="text-white font-bold text-lg mb-1">Click Track & Field Bio</h4>
                  <p className="text-blue-200/70 text-sm">Ensure you click on your Track bio, not your cross country or team page.</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 text-white font-black rounded-full flex items-center justify-center border-4 border-slate-900">3</div>
                  <LinkIcon className="w-6 h-6 text-blue-400 mb-3" />
                  <h4 className="text-white font-bold text-lg mb-1">Copy The URL</h4>
                  <p className="text-blue-200/70 text-sm">Copy the link at the top of your browser and paste it below!</p>
                  
                  <div className="mt-4 bg-black/50 border border-white/10 rounded overflow-hidden flex items-center text-[10px] text-slate-400 p-1.5 shadow-inner">
                    <Lock className="w-3 h-3 mr-1 text-green-400" />
                    <span className="truncate">athletic.net/athlete/</span>
                    <span className="text-blue-400 font-bold bg-blue-500/20 px-1 rounded animate-pulse">1234567</span>
                    <span className="truncate">/track-and-field</span>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 text-sm font-bold flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4 max-w-2xl mx-auto">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleInitialScrape} className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto bg-white/5 p-2 rounded-[1.5rem] border border-white/10 shadow-xl">
                <input 
                  type="url" 
                  required 
                  placeholder="Paste your link here..." 
                  value={syncUrl} 
                  onChange={(e) => setSyncUrl(e.target.value)} 
                  className="w-full flex-grow bg-transparent text-white rounded-xl pl-6 pr-4 py-4 focus:outline-none focus:bg-white/5 font-semibold placeholder:text-blue-300/30 text-lg transition-colors" 
                />
                <button type="submit" disabled={isSyncing} className="bg-blue-500 hover:bg-blue-400 text-white px-10 py-4 rounded-xl font-black disabled:opacity-50 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center text-lg shrink-0">
                  {isSyncing ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Finding...</> : 'Fetch Stats'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VERIFICATION WARNING */}
        {isUnverified && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-[2rem] p-8 md:p-10 border border-orange-400 shadow-2xl relative overflow-hidden mb-8 text-white">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              
              {!showVerificationStep ? (
                <>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center">
                      <AlertTriangle className="w-8 h-8 mr-3 text-orange-200" /> Verify Ownership
                    </h2>
                    <p className="text-orange-100 font-medium text-lg mb-2">We found your profile! To protect athlete data, you must prove you own this profile before you can appear on leaderboards or message coaches.</p>
                  </div>
                  <button onClick={beginVerification} className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-black transition-transform hover:scale-105 shadow-xl shrink-0 text-lg flex items-center justify-center">
                    Verify Profile <ArrowDown className="w-5 h-5 ml-2 animate-bounce" />
                  </button>
                </>
              ) : (
                <div className="w-full">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-black flex items-center">
                        <ShieldCheck className="w-6 h-6 mr-2" /> Paste Your Secret Code
                      </h3>
                      <p className="text-orange-100 font-medium text-sm mt-1 flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-lg inline-block">
                        <Lock className="w-3.5 h-3.5 inline" /> You must be logged into Athletic.net on a web browser.
                      </p>
                    </div>
                    <button onClick={() => { setShowVerificationStep(false); setErrorMessage(''); }} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                  </div>
                  
                  {errorMessage && (
                    <div className="bg-red-900/50 border border-red-400/50 text-white p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3 animate-pulse shadow-inner">
                      <AlertCircle className="w-5 h-5 shrink-0 text-red-400" /> {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
                    <div className="lg:col-span-3 space-y-4 text-orange-50 font-medium bg-black/20 p-6 rounded-2xl border border-white/10 shadow-inner">
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-black text-sm shrink-0">1</span>
                        <p>Sign into Athletic.net on your computer or phone browser.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-black text-sm shrink-0">2</span>
                        <p>Go to your profile and click the <strong className="text-white">Pencil Icon</strong> next to your name.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-black text-sm shrink-0">3</span>
                        <p>Paste the code below exactly into your <strong className="text-white underline decoration-wavy">Username</strong> or First Name field and click Save.</p>
                      </div>
                      
                      <div className="bg-slate-900/90 py-5 rounded-xl mt-6 border border-white/20 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                        <span className="text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-1 relative z-10">Your Code</span>
                        <span className="text-5xl font-mono font-black tracking-widest text-emerald-400 relative z-10">{verificationCode}</span>
                      </div>
                    </div>

                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xl border border-slate-200 text-slate-800 relative transform rotate-1 hover:rotate-0 transition-transform flex flex-col justify-center">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 border-b pb-2 flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> What to look for</div>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xl shadow-inner border border-blue-200 shrink-0">LS</div>
                        <div>
                          <h4 className="text-xl font-bold text-slate-900 tracking-tight">Luke Skywalker</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-500 font-medium text-xs border-r pr-2">South Albany HS</span>
                            <div className="relative">
                              <div className="p-1.5 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 flex items-center justify-center relative z-10 shadow-sm cursor-pointer">
                                <Edit2 className="w-3 h-3 text-slate-600" />
                              </div>
                              <span className="absolute inset-0 rounded bg-orange-400 animate-ping opacity-75"></span>
                              <div className="absolute -right-8 -top-8 animate-bounce text-orange-500 flex flex-col items-center pointer-events-none">
                                <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-md mb-1 whitespace-nowrap">Click This!</span>
                                <MousePointer2 className="w-4 h-4 fill-current" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100 border-dashed">
                         <div className="bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono text-slate-400 flex items-center">
                            <span className="w-16">Username:</span>
                            <span className="text-emerald-600 font-bold ml-2 bg-emerald-50 px-1 rounded">{verificationCode}</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-center">
                    <button onClick={confirmVerification} disabled={isVerifying} className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-xl font-black disabled:opacity-50 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex justify-center items-center text-lg mx-auto">
                      {isVerifying ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin text-emerald-400" /> Checking Athletic.net...</> : 'I Saved It - Check My Profile!'}
                    </button>
                    <p className="text-xs text-orange-200 font-medium mt-3 opacity-80">You can safely delete the code from your Athletic.net profile right after we verify you.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {athleteProfile && (
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isUnverified ? 'opacity-80 grayscale-[20%]' : ''}`}>
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative flex flex-col mb-6">
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
                  <h1 className="text-2xl font-black text-slate-900">{athleteProfile.first_name} {athleteProfile.last_name}</h1>
                  {streak > 0 && (
                    <div className={`flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-black tracking-widest uppercase ${streakTheme.bg}`}>
                      <Flame className={`w-3.5 h-3.5 mr-1 ${streakTheme.icon}`} />
                      <span className={streakTheme.text}>{streak} Day Login Streak</span>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase text-white ${activeTitle.badgeClass}`}>
                    {activeTitle.name} Rank
                  </span>
                </div>
                
                <p className="text-slate-500 font-medium leading-relaxed mb-6">
                  {athleteProfile.high_school} 
                  {athleteProfile.grad_year && ` • Class of ${athleteProfile.grad_year}`}
                  {athleteProfile.state && ` • ${athleteProfile.state}`}
                  {athleteProfile.school_size && ` • ${athleteProfile.school_size}`}
                  {athleteProfile.conference && ` • ${athleteProfile.conference}`}
                </p>
                
                <div className="border-t border-slate-100 pt-6 mt-auto">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Trust Level</span>
                  <div className={`flex items-center px-4 py-3 rounded-xl border ${badge.bg}`}>
                    <badge.icon className={`w-5 h-5 mr-3 ${badge.color}`} />
                    <span className={`text-sm font-bold ${badge.color}`}>{badge.text}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6 mt-6">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Division</span>
                  <div className="flex items-center px-4 py-3 rounded-xl border bg-slate-50 border-slate-200">
                    <CheckCircle2 className="w-4 h-4 mr-3 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{athleteProfile.gender || 'Boys'}</span>
                  </div>
                </div>
              </div>

              {/* ACTIVE RIVALS DASHBOARD WIDGET */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 relative overflow-hidden flex flex-col mb-6">
                {isUnverified && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 rounded-[2rem] flex items-center justify-center flex-col text-center px-6">
                    <Lock className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-600">Verify to view your Rivals</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-slate-100 pb-6 gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
                      <Swords className="w-6 h-6 mr-3 text-red-500" /> Active Rivals
                    </h3>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Athletes you are currently hunting in the Arena.</p>
                  </div>
                  <div className="bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg text-xs shrink-0">
                    {activeRivals.length} / 5 Tracked
                  </div>
                </div>

                {activeRivals.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {activeRivals.map((rival) => (
                      <div key={rival.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:border-red-300 hover:bg-red-50 transition-colors group relative">
                        <Link href={`/athlete/${rival.id}`} className="absolute inset-0 z-10" aria-label={`View ${rival.first_name}`}></Link>
                        <AvatarWithBorder avatarUrl={rival.avatar_url ?? null} borderId={rival.equipped_border ?? null} sizeClasses="w-12 h-12 shrink-0" />
                        <div className="flex-1 truncate relative z-0">
                          <h4 className="font-bold text-slate-900 truncate group-hover:text-red-600 transition-colors">{rival.first_name} {rival.last_name}</h4>
                          <p className="text-xs font-medium text-slate-500 flex items-center mt-0.5">
                            <MapPin className="w-3 h-3 mr-1 shrink-0" /> <span className="truncate">{rival.high_school}</span>
                          </p>
                        </div>
                        <button onClick={() => handleRemoveRival(rival.id)} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow-md shrink-0 z-20 relative">
                          Drop Target <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed mb-6">
                    <Swords className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-lg font-bold text-slate-900 mb-1">No rivals acquired</h4>
                    <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">Head to the Arena to declare rivals and earn bounties.</p>
                  </div>
                )}
                
                <Link href="/compete" className="w-full bg-slate-900 hover:bg-black text-white font-black py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-auto z-10 relative">
                  Enter The Arena <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-slate-900 rounded-[2rem] p-8 shadow-lg border border-slate-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/30">
                    <Rocket className="w-6 h-6 text-amber-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Boost Wallet</p>
                  <div className="flex items-end gap-2 mb-6">
                    <h3 className="text-5xl font-black text-white leading-none">{athleteProfile?.boosts_available || 0}</h3>
                    <span className="text-slate-400 font-medium mb-1">Available</span>
                  </div>
                  {athleteProfile?.is_premium ? (
                    <Link href="/feed" className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black py-3 rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-amber-500/20">
                      Use Boost on Feed
                    </Link>
                  ) : (
                    <Link href="/pro" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-3 rounded-xl flex items-center justify-center transition-colors border border-slate-700">
                      <Lock className="w-4 h-4 mr-2" /> Upgrade to Get Boosts
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative">
                {isUnverified && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 rounded-[2rem] flex items-center justify-center flex-col text-center px-6">
                    <Lock className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-600">Verify to unlock Title Management</p>
                  </div>
                )}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Rank Titles</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Equip your highest earned rank.</p>
                  </div>
                  <Trophy className="w-6 h-6 text-slate-300" />
                </div>

                <div className="space-y-3 mb-6">
                  {EARNED_TITLES.map((title) => {
                    const isUnlocked = highestPercentile <= title.reqPercentile;
                    const isEquipped = equippedTitle === title.id;

                    return (
                      <button 
                        key={title.id}
                        disabled={!isUnlocked || isEquipping || isUnverified}
                        onClick={() => handleEquipTitle(title.id)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                          isEquipped 
                            ? 'bg-blue-50 border-blue-300 shadow-sm' 
                            : isUnlocked 
                              ? 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100 hover:-translate-y-0.5' 
                              : 'bg-slate-50/50 border-slate-100 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase text-white ${isUnlocked ? title.badgeClass : 'bg-slate-200 text-slate-400 border border-slate-300'}`}>
                            {title.name}
                          </div>
                          <div>
                            {!isUnlocked && <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider"><Lock className="w-3 h-3 inline mr-1 -mt-0.5" />{title.unlockText}</span>}
                            {isUnlocked && !isEquipped && <span className="block text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Unlocked</span>}
                          </div>
                        </div>
                        {isEquipped && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                      </button>
                    )
                  })}
                </div>

                <Link href="/dashboard/customize" className={`w-full flex items-center justify-center py-4 rounded-xl font-black transition-all ${isUnverified ? 'bg-slate-100 text-slate-400 pointer-events-none' : 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 shadow-md'}`}>
                  <Paintbrush className="w-5 h-5 mr-2" /> Customize Profile
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-[2rem] p-8 border border-purple-700 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
                {isUnverified && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-20 flex items-center justify-center flex-col text-center px-6">
                    <Lock className="w-8 h-8 text-white/50 mb-2" />
                    <p className="text-sm font-bold text-white/80">Verify profile to access Inbox</p>
                  </div>
                )}
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

              {/* 🚨 IN-DEPTH COLLEGE PROJECTION SCORER 🚨 */}
              <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-200 relative overflow-hidden flex flex-col mb-6">
                {isUnverified && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 rounded-[2rem] flex items-center justify-center flex-col text-center px-6">
                    <Lock className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-600">Verify to see your Recruiting Scouting Report</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-8 border-b border-slate-100 gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
                      <Target className="w-6 h-6 mr-3 text-blue-500" /> Recruiting Scouting Report
                    </h3>
                    <p className="text-slate-500 font-medium mt-1 text-sm">An in-depth breakdown of where you stand against national college recruiting standards.</p>
                  </div>
                  <div className="bg-slate-900 text-white flex flex-col items-center justify-center px-6 py-4 rounded-2xl shadow-lg border border-slate-700 shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Score</span>
                    <span className="font-black text-3xl leading-none">{hasPRs && projection.overallScore > 0 ? projection.overallScore : '-'}</span>
                  </div>
                </div>

                {hasPRs && projection.overallScore > 0 ? (
                  <div className="space-y-6">
                    
                    <div className={`p-6 rounded-2xl border ${projection.bg} ${projection.border} relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><BarChart3 className={`w-24 h-24 ${projection.color}`} /></div>
                      <div className="relative z-10">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Projected Tier</p>
                        <h4 className={`text-2xl font-black mb-3 ${projection.color}`}>{projection.overallLabel}</h4>
                        <p className="text-slate-700 font-medium text-sm leading-relaxed max-w-lg">{projection.overallDesc}</p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" /> Event-by-Event Breakdown
                      </h4>
                      
                      <div className="space-y-4">
                        {projection.eventBreakdowns.map((ev, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative">
                            
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="font-black text-lg text-slate-900">{ev.event}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-bold text-slate-500">Current: {ev.mark}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                    ev.score >= 85 ? 'bg-fuchsia-100 text-fuchsia-700' :
                                    ev.score >= 75 ? 'bg-blue-100 text-blue-700' :
                                    ev.score >= 65 ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-slate-200 text-slate-600'
                                  }`}>
                                    {ev.currentTier}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-black text-slate-800">{ev.score}</span>
                                <span className="text-[10px] font-bold text-slate-400 ml-1">/99</span>
                              </div>
                            </div>

                            <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
                              <div 
                                className="bg-blue-500 h-full rounded-full transition-all" 
                                style={{ width: `${Math.max(5, ev.score)}%` }}
                              ></div>
                            </div>

                            {ev.nextTier !== 'Elite' && (
                              <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ev.isField ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {ev.isField ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 transform rotate-180" />}
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Target</p>
                                    <p className="text-sm font-black text-slate-700">{ev.targetMarkFormatted} <span className="font-medium text-slate-500">({ev.nextTier})</span></p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`text-sm font-black ${ev.isField ? 'text-emerald-600' : 'text-blue-600'}`}>{ev.deltaFormatted}</span>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Needed</p>
                                </div>
                              </div>
                            )}
                            {ev.nextTier === 'Elite' && (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-center shadow-sm">
                                <Crown className="w-4 h-4 text-amber-500 mr-2" />
                                <span className="text-sm font-black text-amber-700">Elite Status Achieved - Maintain Dominance</span>
                              </div>
                            )}
                          </div>
                        ))}
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

              <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-200 h-auto flex flex-col relative overflow-hidden">
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

              <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-slate-200 shadow-sm relative overflow-hidden">
                {isUnverified && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 rounded-[2rem] flex items-center justify-center flex-col text-center px-6">
                    <Lock className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-600">Verify to view saved colleges</p>
                  </div>
                )}
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
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all relative z-0" />
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

              <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Verified PRs</h3>
                    <p className="text-slate-500 font-medium">Your official meet results & national rank.</p>
                  </div>
                  
                  <button onClick={handleReSync} disabled={isSyncing || !canSync || isUnverified} className="flex items-center justify-center bg-slate-900 hover:bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-slate-900">
                    {isSyncing ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Finding...</>
                    ) : canSync ? (
                      <><RefreshCw className="w-4 h-4 mr-2" /> Sync Latest PRs</>
                    ) : (
                      <><Clock className="w-4 h-4 mr-2" /> Available in {syncTimeLeft}</>
                    )}
                  </button>
                </div>

                {hasPRs ? (
                  <div className="grid grid-cols-1 gap-4 relative">
                    {isUnverified && (
                      <div className="absolute -inset-4 bg-white/40 backdrop-blur-[1px] z-10 pointer-events-none rounded-xl"></div>
                    )}
                    {athleteProfile!.prs!.map((pr, index) => {
                      const queryParams = new URLSearchParams({ event: pr.event, gender: athleteProfile.gender || 'Boys' });
                      const leaderboardLink = `/leaderboard?${queryParams.toString()}#${athleteProfile.id}`;

                      return (
                        <div key={index} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-200 bg-slate-50 gap-4 group ${!isUnverified ? 'hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer relative overflow-hidden' : ''}`}>
                          {!isUnverified && (
                            <Link href={leaderboardLink} className="absolute inset-0 z-10" aria-label={`View ${pr.event} Leaderboard`}></Link>
                          )}
                          <div className="flex-1 relative z-0">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Event</span>
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
                                  <span className="text-sm font-black text-slate-400 group-hover:text-blue-500 transition-colors">#{pr.globalRank}</span>
                                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase text-white ${pr.tier.classes}`}>
                                    {pr.tier.name}
                                  </span>
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
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h4 className="text-lg font-black text-slate-900">No times found</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">Sync your profile to populate this board.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* REFERRAL PROGRAM WITH MILESTONES */}
            <div className="lg:col-span-3 mt-4">
              <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row items-start justify-between gap-12 relative z-10">
                  <div className="flex-1 w-full">
                    <h3 className="text-3xl font-black text-white tracking-tight mb-3 flex items-center gap-3">
                      <Users className="w-8 h-8 text-emerald-400" /> Invite & Earn
                    </h3>
                    <p className="text-slate-300 font-medium text-lg mb-6 leading-relaxed max-w-xl">
                      Get <strong className="text-amber-400">1 Free Boost</strong> for every 3 teammates that use your unique code. Reach the next Mega Bonus milestone to claim <strong className="text-amber-400">4 Boosts</strong>!
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
                        <p className="text-xs text-slate-400 mb-4">Enter your teammate's code below to give them credit for inviting you!</p>
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

                {/* 🚨 NEW MILESTONE TRACK UI 🚨 */}
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
                      <span className="text-lg font-black text-amber-400">{base + 12} Invites</span>
                    </div>
                  </div>

                  {/* Visual Track */}
                  <div className="relative w-full h-4 bg-slate-950 rounded-full border border-slate-800 shadow-inner mb-10 mx-auto max-w-[95%]">
                    
                    {/* Fill */}
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 rounded-full transition-all duration-1000" 
                      style={{ width: `${progressPct}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                    </div>

                    {/* Nodes */}
                    {milestones.map((m, i) => {
                      const posPct = ((m.count - base) / 12) * 100;
                      const isAchieved = currentRefs >= m.count;
                      const Icon = m.icon;
                      
                      return (
                        <div key={i} className="absolute top-1/2 flex flex-col items-center" style={{ left: `${posPct}%`, transform: 'translate(-50%, -50%)' }}>
                          
                          {/* The Node Dot */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-slate-900 z-10 transition-colors duration-500 ${isAchieved ? m.bg : 'bg-slate-800'} ${m.isMajor ? 'w-10 h-10 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : ''}`}>
                            {isAchieved ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Icon className={`w-4 h-4 ${m.isMajor ? 'text-amber-400' : 'text-slate-500'}`} />}
                          </div>

                          {/* The Node Label */}
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

          </div>
        )}
      </div>
    </main>
  );
}