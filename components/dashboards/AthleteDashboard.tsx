'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Activity, ShieldCheck, Link as LinkIcon, Trophy, LogOut, Medal, Timer, TrendingUp, CheckCircle2, Search, AlertCircle, Zap, Calendar, MapPin, Camera, Mail, RefreshCw, School, Lock, AlertTriangle, ExternalLink, ChevronRight, Check, Clock, Edit2, MousePointer2, Flame, Bookmark, Share2, Instagram, X, Users, Gift, Paintbrush, ArrowDown, HelpCircle, Globe, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

// 🚨 IMPORTED REUSABLE BORDER COMPONENT
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
}

interface CoachProfile { id: string; first_name: string | null; last_name: string | null; school_name: string | null; coach_type: string; avatar_url: string | null; }

const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

// --- EARNED TITLES INVENTORY ---
const EARNED_TITLES = [
  { id: 'legend', name: 'Legend', reqPercentile: 0.01, badgeClass: 'legend-badge', unlockText: 'Reach Top 1%' },
  { id: 'champion', name: 'Champion', reqPercentile: 0.05, badgeClass: 'champion-badge', unlockText: 'Reach Top 5%' },
  { id: 'elite', name: 'Elite', reqPercentile: 0.15, badgeClass: 'elite-badge', unlockText: 'Reach Top 15%' },
  { id: 'master', name: 'Master', reqPercentile: 0.30, badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300', unlockText: 'Reach Top 30%' },
  { id: 'contender', name: 'Contender', reqPercentile: 0.50, badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300', unlockText: 'Reach Top 50%' },
  { id: 'challenger', name: 'Challenger', reqPercentile: 0.75, badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300', unlockText: 'Reach Top 75%' },
  { id: 'prospect', name: 'Prospect', reqPercentile: 1.0, badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300', unlockText: 'Standard Rank' },
];

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [userRole, setUserRole] = useState<'athlete' | 'coach' | null>(null);
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null);
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // VERIFICATION & SYNC STATES
  const [syncUrl, setSyncUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false); 
  const [unreadCount, setUnreadCount] = useState(0);
  const [highestPercentile, setHighestPercentile] = useState<number>(1.0);
  
  // EQUIP STATES
  const [equippedTitle, setEquippedTitle] = useState<string>('prospect');
  const [equippedBorder, setEquippedBorder] = useState<string>('none');
  const [isEquipping, setIsEquipping] = useState(false);
  
  const [canSync, setCanSync] = useState(true);
  const [syncTimeLeft, setSyncTimeLeft] = useState('');
  
  // 🔥 DAILY STREAK STATE
  const [streak, setStreak] = useState(0);

  // 🎯 SAVED COLLEGES STATE
  const [savedColleges, setSavedColleges] = useState<any[]>([]);

  // 📱 REFERRAL STATES
  const [isCopied, setIsCopied] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [daysSinceJoin, setDaysSinceJoin] = useState(0);

  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const parseMarkForSorting = (mark: string, event: string): number => {
    const cleanMark = mark.replace(/[a-zA-Z]/g, '').trim();
    const isField = FIELD_EVENTS.includes(event);
    if (cleanMark.includes("'")) {
      const parts = cleanMark.split("'");
      const feet = parseFloat(parts[0]) || 0;
      const inches = parseFloat(parts[1]?.replace('"', '')) || 0;
      return isField ? -((feet * 12) + inches) : ((feet * 12) + inches); 
    }
    if (cleanMark.includes(":")) {
      const parts = cleanMark.split(":");
      const minutes = parseFloat(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return (minutes * 60) + seconds; 
    }
    const val = parseFloat(cleanMark) || 99999;
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
        const { data: savedCollegesData, error: scError } = await supabase
          .from('saved_colleges')
          .select(`
            id,
            college_id,
            universities (*)
          `)
          .eq('athlete_id', session.user.id);
          
        if (scError) {
          console.error("Dashboard Fetch Error:", scError.message);
        } else if (savedCollegesData) {
          setSavedColleges(savedCollegesData);
        }
      } catch (e) {
        console.log("Saved colleges table error:", e);
      }

      const { data: aData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();
      
      if (aData) {
        setUserRole('athlete');
        setEquippedTitle(aData.equipped_title || 'prospect');
        setEquippedBorder(aData.equipped_border || 'none');
        
        if (aData.created_at) {
          const joinDate = new Date(aData.created_at);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - joinDate.getTime());
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
            const lastDate = new Date(lastLoginStr);
            const currentDate = new Date(todayStr);
            const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              newStreak = currentStreak + 1;
            }
          }

          setStreak(newStreak);
          await supabase.from('athletes').update({ 
            current_login_streak: newStreak, 
            last_login_date: todayStr 
          }).eq('id', aData.id);
          
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
            if (aData.trust_level === 0) {
              athletesPool.push(aData);
            }

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
        setLoading(false);
        return;
      }

      const { data: cData } = await supabase.from('coaches').select('*').eq('id', session.user.id).maybeSingle();
      if (cData) { setUserRole('coach'); setCoachProfile(cData); }
      setLoading(false);
    }
    loadDashboardData();
  }, [supabase, router]);

  const giveDailyReward = async (userId: string, currentCoins: number) => {
    try {
      const newBalance = currentCoins + 10;
      await supabase.from('athletes').update({ coins: newBalance }).eq('id', userId);
      showToast("You earned 10 Coins for your daily login streak!", "success");
    } catch (e) {
      console.log("Reward error", e);
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
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to sync profile. Please try again.");
      }
      
      const { error: updateError } = await supabase.from('athletes').update({ 
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

      if (updateError) throw updateError;
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
      
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || "Code not found on profile. Did you save it to your username?");
      }

      if (athleteProfile.referred_by && athleteProfile.trust_level === 0) {
        const { data: referrer } = await supabase
          .from('athletes')
          .select('coins, verified_referrals, unlocked_borders')
          .eq('id', athleteProfile.referred_by)
          .maybeSingle();

        if (referrer) {
          const newCoins = (referrer.coins || 0) + 300; 
          const newReferralCount = (referrer.verified_referrals || 0) + 1; 
          let newUnlocked = referrer.unlocked_borders || ['none'];

          if (newReferralCount >= 5 && !newUnlocked.includes('plasma-surge')) {
            newUnlocked = [...newUnlocked, 'plasma-surge'];
          }

          await supabase.from('athletes').update({
            coins: newCoins,
            verified_referrals: newReferralCount,
            unlocked_borders: newUnlocked
          }).eq('id', athleteProfile.referred_by);
        }
      }

      await supabase.from('athletes').update({ trust_level: 1 }).eq('id', athleteProfile.id);
      localStorage.setItem('last_sync_time', new Date().getTime().toString());
      window.location.reload();

    } catch (err: any) { 
      setErrorMessage(err.message); 
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteProfile || !inviteCodeInput.trim()) return;
    
    setIsSubmittingCode(true);
    try {
        const { data: referrer } = await supabase
            .from('athletes')
            .select('id, coins, verified_referrals, unlocked_borders')
            .ilike('athletic_net_url', `%athlete/${inviteCodeInput.trim()}/%`)
            .maybeSingle();

        if (!referrer || referrer.id === athleteProfile.id) {
            throw new Error("Invalid invite code. Make sure you typed it correctly.");
        }

        await supabase.from('athletes').update({ referred_by: referrer.id }).eq('id', athleteProfile.id);

        if (athleteProfile.trust_level > 0) {
            const newCoins = (referrer.coins || 0) + 300; 
            const newReferralCount = (referrer.verified_referrals || 0) + 1; 
            let newUnlocked = referrer.unlocked_borders || ['none'];

            if (newReferralCount >= 5 && !newUnlocked.includes('plasma-surge')) {
                newUnlocked = [...newUnlocked, 'plasma-surge'];
            }

            await supabase.from('athletes').update({
                coins: newCoins,
                verified_referrals: newReferralCount,
                unlocked_borders: newUnlocked
            }).eq('id', referrer.id);
        }

        setAthleteProfile({ ...athleteProfile, referred_by: referrer.id });
        showToast("Invite code applied successfully!", "success");
        setInviteCodeInput('');

    } catch (err: any) {
        showToast(err.message, "error");
    } finally {
        setIsSubmittingCode(false);
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
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to sync profile. Please try again.");
      }
      
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
      const userId = athleteProfile?.id || coachProfile?.id;
      if (!e.target.files || e.target.files.length === 0 || !userId) return;
      const compressedFile = await imageCompression(e.target.files[0], { maxSizeMB: 0.2, maxWidthOrHeight: 500, useWebWorker: true });
      const fileName = `${userId}-avatar.jpg`; 
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, compressedFile, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const urlWithTime = `${publicUrl}?t=${new Date().getTime()}`;

      if (userRole === 'athlete') {
        await supabase.from('athletes').update({ avatar_url: urlWithTime }).eq('id', userId);
        setAthleteProfile((prev) => prev ? { ...prev, avatar_url: urlWithTime } : null);
      } else {
        await supabase.from('coaches').update({ avatar_url: urlWithTime }).eq('id', userId);
        setCoachProfile((prev) => prev ? { ...prev, avatar_url: urlWithTime } : null);
      }
    } catch (error: any) { 
      showToast(`Error uploading image: ${error.message}`); 
    } finally { 
      setIsUploadingAvatar(false); 
    }
  };

  const handleEquipTitle = async (titleId: string) => {
    if (!athleteProfile) return;
    setIsEquipping(true);
    try {
      const { error } = await supabase.from('athletes').update({ equipped_title: titleId }).eq('id', athleteProfile.id);
      if (error) throw error;
      setEquippedTitle(titleId);
      showToast(`Successfully equipped ${titleId} title!`, 'success');
    } catch (err: any) {
      showToast(`Failed to equip title: ${err.message}`);
    } finally {
      setIsEquipping(false);
    }
  };

  const handleShareProfile = async () => {
    if (!athleteProfile) return;
    
    const profileUrl = `https://www.chasedsports.com/athlete/${athleteProfile.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${athleteProfile.first_name} ${athleteProfile.last_name} | ChasedSports`,
          text: `Check out my verified Track & Field stats and national rank on ChasedSports! 🏃💨`,
          url: profileUrl,
        });
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(profileUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      } catch (err) {
        showToast("Failed to copy link. Please manually copy the URL.");
      }
    }
  };

  const handleShareCode = async (code: string) => {
    const shareText = `Join me on ChasedSports! Use my invite code: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ChasedSports Invite',
          text: shareText,
        });
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(shareText);
      showToast("Invite code copied to clipboard!", "success");
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
    return (
      <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
        <div className="max-w-5xl mx-auto px-6 pt-16">
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm text-center flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-slate-900"></div>
            <div className="relative w-32 h-32 mb-6 group mt-8">
              <div className={`w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center ${isUploadingAvatar ? 'animate-pulse' : ''}`}>
                {coachProfile?.avatar_url ? <img src={coachProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <School className="w-12 h-12 text-slate-400" />}
              </div>
              <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
              </label>
            </div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold tracking-widest uppercase mb-4">
              <ShieldCheck className="w-4 h-4 mr-2" /> Verified Coach
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">
              {coachProfile?.first_name ? `Coach ${coachProfile.last_name}` : 'Welcome, Coach'}
            </h1>
            <p className="text-lg text-slate-500 font-medium mb-12">
              {coachProfile?.school_name || 'Update your program settings.'} • {coachProfile?.coach_type === 'college' ? 'NCAA Recruiting' : 'High School Program'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
              <Link href="/feed" className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-3xl p-8 transition-all group cursor-pointer block">
                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform"><Search className="w-6 h-6 text-blue-600" /></div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Find Recruits</h3>
                <p className="text-slate-500 font-medium text-sm">Access the Live Feed to find verified high school athletes.</p>
              </Link>
              <Link href="/dashboard/messages" className="bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-3xl p-8 transition-all group cursor-pointer block">
                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform"><Mail className="w-6 h-6 text-purple-600" /></div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Check Inbox</h3>
                <p className="text-slate-500 font-medium text-sm">Read and reply to direct pitches from athletes and other programs.</p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isUnverified = athleteProfile?.trust_level === 0 && !!athleteProfile?.athletic_net_url;
  const noProfileLinked = !athleteProfile?.athletic_net_url;
  const streakTheme = getStreakStyle();
  
  // 🚨 EXTRACT REFERRAL CODE
  const myReferralCode = athleteProfile?.athletic_net_url?.match(/athlete\/(\d+)/i)?.[1] || null;
  const showCodeEntry = daysSinceJoin <= 7 && !athleteProfile?.referred_by;

  const getTrustBadge = (level: number) => {
    switch(level) {
      case 1: return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 border-green-200', text: 'Results Verified' };
      case 2: return { icon: Trophy, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', text: 'Community Verified' };
      case 3: return { icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200', text: 'Coach Verified' };
      default: return { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', text: 'Pending Verification' };
    }
  };

  const badge = getTrustBadge(athleteProfile?.trust_level || 0);
  const hasPRs = athleteProfile?.prs && athleteProfile.prs.length > 0;

  const activeTitle = EARNED_TITLES.find(t => t.id === equippedTitle) || EARNED_TITLES[6];

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      
      {/* 🚨 TOAST NOTIFICATIONS 🚨 */}
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

      <div className="max-w-7xl mx-auto px-6 pt-10">
        
        {/* 🚨 REDESIGNED SETUP GUIDE 🚨 */}
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

              {/* Visual 3-Step Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                
                {/* Step 1 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 text-white font-black rounded-full flex items-center justify-center border-4 border-slate-900">1</div>
                  <Globe className="w-6 h-6 text-blue-400 mb-3" />
                  <h4 className="text-white font-bold text-lg mb-1">Search Your Name</h4>
                  <p className="text-blue-200/70 text-sm">Open a new tab and search for your name on Athletic.net.</p>
                </div>

                {/* Step 2 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 text-white font-black rounded-full flex items-center justify-center border-4 border-slate-900">2</div>
                  <UserCircle2 className="w-6 h-6 text-blue-400 mb-3" />
                  <h4 className="text-white font-bold text-lg mb-1">Click Track & Field Bio</h4>
                  <p className="text-blue-200/70 text-sm">Ensure you click on your Track bio, not your cross country or team page.</p>
                </div>

                {/* Step 3 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 text-white font-black rounded-full flex items-center justify-center border-4 border-slate-900">3</div>
                  <LinkIcon className="w-6 h-6 text-blue-400 mb-3" />
                  <h4 className="text-white font-bold text-lg mb-1">Copy The URL</h4>
                  <p className="text-blue-200/70 text-sm">Copy the link at the top of your browser and paste it below!</p>
                  
                  {/* Visual animation of copying URL */}
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
                  {isSyncing ? (
                    <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Finding...</>
                  ) : (
                    'Fetch Stats'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 🚨 REDESIGNED VERIFICATION WARNING 🚨 */}
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
                    
                    {/* Instructions */}
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

                    {/* Visual Helper */}
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
            
            {/* LEFT COLUMN: PROFILE CARD */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative">
                
                <div className="relative w-28 h-28 mb-6 group mx-auto md:mx-0">
                  <AvatarWithBorder 
                      avatarUrl={athleteProfile.avatar_url} 
                      borderId={equippedBorder} 
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
                
                <div className="border-t border-slate-100 pt-6">
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
              
              {/* 🚨 TITLE EQUIP AREA */}
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

                {/* 🚨 CUSTOMIZE PROFILE BUTTON */}
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

              {/* 🎯 TARGET SCHOOLS CARD */}
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
            
            {/* 🚀 REFERRAL PROGRAM (ANCHORED TO FULL BOTTOM ROW) */}
            <div className="lg:col-span-3 mt-4">
              <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row items-start justify-between gap-12 relative z-10">
                  <div className="flex-1 w-full">
                    <h3 className="text-3xl font-black text-white tracking-tight mb-3 flex items-center gap-3">
                      <Users className="w-8 h-8 text-emerald-400" /> Invite & Earn
                    </h3>
                    <p className="text-slate-300 font-medium text-lg mb-6 leading-relaxed max-w-xl">
                      Get <strong className="text-emerald-400">300 ChasedCash</strong> for every teammate that uses your unique code. If you invite 5 verified athletes, you unlock an exclusive border!
                    </p>
                    
                    {/* The Code Display */}
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

                    {/* REDEEM ENTRY (Only visible for first 7 days if they haven't used one yet) */}
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
                  
                  {/* Progress to Plasma Surge Border */}
                  <div className="w-full md:w-72 bg-slate-950/80 p-6 rounded-[2rem] border border-slate-800 text-center shrink-0 shadow-2xl">
                    <div className="w-24 h-24 mx-auto mb-4 relative group">
                      <AvatarWithBorder avatarUrl={null} borderId="plasma-surge" sizeClasses="w-24 h-24" />
                      {athleteProfile?.verified_referrals! >= 5 && (
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-emerald-950 p-1.5 rounded-full border-2 border-slate-900 shadow-lg">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm font-black text-white mb-1">Plasma Surge</h4>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">Exclusive Border</p>
                    
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner mb-3 border border-slate-700">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((athleteProfile?.verified_referrals || 0) / 5) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm font-bold text-slate-400">
                      <span className="text-white">{athleteProfile?.verified_referrals || 0}</span> / 5 Verified Invites
                    </p>
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