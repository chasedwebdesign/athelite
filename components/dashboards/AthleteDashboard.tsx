'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Activity, ShieldCheck, Link as LinkIcon, Trophy, LogOut, Medal, Timer, TrendingUp, CheckCircle2, Search, AlertCircle, Zap, Calendar, MapPin, Camera, Mail, RefreshCw, School, Lock, AlertTriangle, ExternalLink, ChevronRight, Check, Clock, Edit2, MousePointer2 } from 'lucide-react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

interface AthleteProfile { id: string; first_name: string | null; last_name: string | null; grad_year: number | null; high_school: string | null; state: string | null; school_size: string | null; conference: string | null; primary_sport: string; athletic_net_url: string | null; trust_level: number; gender: string | null; prs: { event: string; mark: string; date?: string; meet?: string; tier?: { name: string; classes: string }; globalRank?: number }[] | null; avatar_url: string | null; equipped_border: string | null; }
interface CoachProfile { id: string; first_name: string | null; last_name: string | null; school_name: string | null; coach_type: string; avatar_url: string | null; }

const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [userRole, setUserRole] = useState<'athlete' | 'coach' | null>(null);
  const [athleteProfile, setAthleteProfile] = useState<AthleteProfile | null>(null);
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // VERIFICATION, SYNC, & QUEUE STATES
  const [syncUrl, setSyncUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isQueued, setIsQueued] = useState(false); 
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [claimConflict, setClaimConflict] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false); 
  const [unreadCount, setUnreadCount] = useState(0);
  const [highestPercentile, setHighestPercentile] = useState<number>(1.0);
  const [equippedBorder, setEquippedBorder] = useState<string>('none');
  const [isEquipping, setIsEquipping] = useState(false);
  const [canSync, setCanSync] = useState(true);
  const [syncTimeLeft, setSyncTimeLeft] = useState('');

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

      const { data: aData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();
      
      if (aData) {
        setUserRole('athlete');
        setEquippedBorder(aData.equipped_border || 'none');
        
        let bestPercentileFound = 1.0;

        if (aData.prs && aData.prs.length > 0) {
          
          // 🚨 BUG FIX: Only pull VERIFIED athletes to establish the true global baseline!
          const { data: verifiedAthletes } = await supabase
            .from('athletes')
            .select('prs')
            .eq('gender', aData.gender || 'Boys')
            .gt('trust_level', 0); 
          
          if (verifiedAthletes) {
            let athletesPool = [...verifiedAthletes];

            // 🚨 BUG FIX: If the current athlete is unverified, inject them into their OWN local pool 
            // so they can see their hypothetical rank against the verified group without polluting the DB!
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

  // 🚦 SMART RETRY QUEUE: Automatically handles 429 Browserless limits!
  const fetchWithQueue = async (url: string) => {
    let attempts = 0;
    while (attempts < 12) { // Try for up to 60 seconds
      const response = await fetch('/api/sync', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ url }) 
      });
      
      if (response.status === 429) {
        setIsQueued(true);
        await new Promise(res => setTimeout(res, 5000)); 
        attempts++;
        continue; 
      }
      
      const result = await response.json();
      if (!response.ok) {
         if (result.error && result.error.includes('SCRAPER_BUSY')) {
           setIsQueued(true);
           await new Promise(res => setTimeout(res, 5000));
           attempts++;
           continue;
         }
         throw new Error(result.error);
      }
      
      setIsQueued(false); // Success! Break the queue.
      return result;
    }
    throw new Error("The servers are currently at maximum capacity. Please try again in a few minutes.");
  };

  const validateAthleticUrl = (url: string) => {
    if (!url) return "Please enter a URL.";
    if (!url.includes('athletic.net')) return "Must be a valid Athletic.net link.";
    
    // Cross Country Blocker
    if (url.toLowerCase().includes('cross-country') || url.toLowerCase().includes('crosscountry')) {
      return "Please provide your Track & Field link. We currently only support Track & Field profiles, not Cross Country.";
    }

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
    setIsQueued(false);
    
    try {
      const { data: existingUser } = await supabase
        .from('athletes')
        .select('id')
        .eq('athletic_net_url', syncUrl)
        .neq('id', athleteProfile?.id)
        .maybeSingle();

      if (existingUser) {
        setErrorMessage("Someone has already claimed this profile. If this is you, contact support@chasedsports.com to dispute it.");
        setIsSyncing(false);
        return;
      }

      const result = await fetchWithQueue(syncUrl);
      
      const { error: updateError } = await supabase.from('athletes').update({ 
        first_name: result.data.firstName, 
        last_name: result.data.lastName, 
        high_school: result.data.schoolName, 
        athletic_net_url: result.data.url, 
        prs: result.data.prs, 
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
      setIsSyncing(false); 
      setIsQueued(false);
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

      await supabase.from('athletes').update({ trust_level: 1 }).eq('id', athleteProfile.id);
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
    setIsQueued(false);
    try {
      const result = await fetchWithQueue(athleteProfile.athletic_net_url);
      
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
      setIsQueued(false);
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
    } catch (error: any) { alert(`Error uploading image: ${error.message}`); } finally { setIsUploadingAvatar(false); }
  };

  const handleEquipBorder = async (borderId: string) => {
    if (!athleteProfile) return;
    setIsEquipping(true);
    try {
      const { error } = await supabase.from('athletes').update({ equipped_border: borderId }).eq('id', athleteProfile.id);
      if (error) throw error;
      setEquippedBorder(borderId);
    } catch (err: any) {
      alert(`Failed to equip border: ${err.message}`);
    } finally {
      setIsEquipping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading secure dashboard...</p>
      </div>
    );
  }

  // --- COACH DASHBOARD ---
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

  // --- ATHLETE DASHBOARD ---
  const isUnverified = athleteProfile?.trust_level === 0 && !!athleteProfile?.athletic_net_url;
  const noProfileLinked = !athleteProfile?.athletic_net_url;

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

  const CUSTOM_BORDERS = [
    { id: 'none', name: 'Standard Profile', reqPercentile: 1.0, badgeClass: 'bg-slate-200 border-2 border-slate-300' },
    { id: 'border-elite', name: 'Elite Card', reqPercentile: 0.15, badgeClass: 'elite-badge', unlockText: 'Reach Top 15%' },
    { id: 'border-champion', name: 'Champion Card', reqPercentile: 0.05, badgeClass: 'champion-badge', unlockText: 'Reach Top 5%' },
    { id: 'border-legend', name: 'Legend Card', reqPercentile: 0.01, badgeClass: 'legend-badge', unlockText: 'Reach Top 1%' },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes liquidPan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .legend-badge { background: linear-gradient(90deg, #6b21a8 0%, #d946ef 20%, #6b21a8 40%, #d946ef 60%, #6b21a8 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #e879f9; box-shadow: 0 0 15px rgba(217, 70, 239, 0.5); font-weight: 900; }
        .border-legend { background: linear-gradient(135deg, #7e22ce, #d946ef, #a21caf, #7e22ce); background-size: 300% 300%; animation: liquidPan 8s ease-in-out infinite; padding: 4px; border-radius: 50%; box-shadow: 0 0 20px rgba(217, 70, 239, 0.5); }
        .champion-badge { background: linear-gradient(90deg, #991b1b 0%, #ef4444 20%, #991b1b 40%, #ef4444 60%, #991b1b 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #f87171; box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); font-weight: 900; }
        .border-champion { background: linear-gradient(135deg, #b91c1c, #ef4444, #dc2626, #b91c1c); background-size: 300% 300%; animation: liquidPan 8s ease-in-out infinite; padding: 4px; border-radius: 50%; box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
        .elite-badge { background: linear-gradient(90deg, #0f172a 0%, #475569 20%, #0f172a 40%, #475569 60%, #0f172a 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #94a3b8; box-shadow: 0 0 15px rgba(148, 163, 184, 0.3); font-weight: 900; }
        .border-elite { background: linear-gradient(135deg, #1e293b, #64748b, #475569, #1e293b); background-size: 300% 300%; animation: liquidPan 8s ease-in-out infinite; padding: 4px; border-radius: 50%; box-shadow: 0 0 20px rgba(148, 163, 184, 0.4); }
      `}} />

      <div className="max-w-7xl mx-auto px-6 pt-10">
        
        {/* NO PROFILE STATE (STAGE 1) */}
        {noProfileLinked && (
          <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 md:p-16 border border-blue-800 shadow-2xl relative overflow-hidden mb-10 max-w-4xl mx-auto">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-blue-500/20 border border-blue-400/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-blue-300" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">Find Your Profile</h2>
              <p className="text-blue-200/80 font-medium text-lg mb-10 max-w-xl mx-auto">
                Paste the link to your Athletic.net Track & Field profile to import your PRs. 
                <span className="block mt-2 text-sm opacity-80 text-yellow-300">You don't have to be logged in to Athletic.net. Just go to Athletic.net in your browser, look up your name, go to your Track & Field Bio, then copy that link and you're set!</span>
              </p>

              {/* QUEUE & ERROR MESSAGES */}
              {isQueued && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 p-4 rounded-xl mb-8 text-sm font-bold flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4 max-w-2xl mx-auto">
                  <Timer className="w-5 h-5 shrink-0 text-yellow-400 animate-pulse" />
                  <p>High traffic detected! You are in the queue. Please keep this page open...</p>
                </div>
              )}
              {errorMessage && !isQueued && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-8 text-sm font-bold flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4 max-w-2xl mx-auto">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleInitialScrape} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                <input 
                  type="url" 
                  required 
                  placeholder="https://www.athletic.net/athlete/..." 
                  value={syncUrl} 
                  onChange={(e) => setSyncUrl(e.target.value)} 
                  className="w-full flex-grow bg-white/10 border border-white/20 text-white rounded-2xl pl-6 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold placeholder:text-blue-300/30 text-lg shadow-inner" 
                />
                {/* DYNAMIC SUBMIT BUTTON */}
                <button type="submit" disabled={isSyncing || isQueued} className="bg-blue-500 hover:bg-blue-400 text-white px-10 py-4 rounded-2xl font-black disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center text-lg">
                  {isQueued ? (
                    <><Timer className="w-5 h-5 mr-2 animate-pulse text-yellow-200" /> Queued...</>
                  ) : isSyncing ? (
                    <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Finding...</>
                  ) : (
                    'Fetch Stats'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VERIFICATION BANNER (STAGE 2) */}
        {isUnverified && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-[2rem] p-8 md:p-10 border border-orange-400 shadow-2xl relative overflow-hidden mb-8 text-white">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              
              {!showVerificationStep ? (
                <>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center">
                      <AlertTriangle className="w-8 h-8 mr-3 text-orange-200" /> Action Required: Verify Ownership
                    </h2>
                    <p className="text-orange-100 font-medium text-lg mb-2">We found your profile! However, your times will not appear on the Leaderboard and you cannot access the Feed until you verify you own this account.</p>
                    <p className="text-sm opacity-90 text-orange-200 font-bold bg-black/10 px-3 py-1.5 rounded-lg inline-block">You must have an active Athletic.net account to complete this step.</p>
                  </div>
                  <button onClick={beginVerification} className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-black transition-transform hover:scale-105 shadow-xl shrink-0 text-lg">
                    Verify Profile Now
                  </button>
                </>
              ) : (
                <div className="w-full">
                  <h3 className="text-2xl font-black mb-4 flex items-center">
                    <ShieldCheck className="w-6 h-6 mr-2" /> Add Your Secret Code
                  </h3>
                  
                  {errorMessage && (
                    <div className="bg-red-900/50 border border-red-400/50 text-white p-3 rounded-lg mb-4 text-sm font-bold flex items-center gap-2 animate-pulse">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4 text-orange-50 font-medium">
                      <p>1. Log into your Athletic.net account.</p>
                      <p>2. Click the <strong className="text-white bg-black/20 px-2 py-1 rounded">Pencil Icon</strong> underneath your name to edit your profile.</p>
                      <p>3. Paste this exact code into your <strong className="text-white underline decoration-wavy">Username</strong> (you can delete it right after verification!).</p>
                      
                      <div className="bg-slate-900/80 py-4 rounded-xl mt-4 border border-white/20 flex flex-col items-center justify-center shadow-inner">
                        <span className="text-[10px] text-orange-400 uppercase tracking-widest font-bold mb-1">Your Code</span>
                        <span className="text-4xl font-mono font-black tracking-widest text-emerald-400">{verificationCode}</span>
                      </div>
                    </div>

                    {/* ANIMATED DIAGRAM */}
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 text-slate-800 relative hidden sm:block transform rotate-1 hover:rotate-0 transition-transform">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 border-b pb-2">Example Athletic.net Header</div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-2xl shadow-inner border border-blue-200">
                          LS
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Luke Skywalker</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-500 font-medium text-sm border-r pr-2">South Albany HS</span>
                            <div className="relative">
                              <div className="p-1.5 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 flex items-center justify-center relative z-10 shadow-sm">
                                <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                              </div>
                              <span className="absolute inset-0 rounded bg-orange-400 animate-ping opacity-75"></span>
                              <div className="absolute -right-10 -top-8 animate-bounce text-orange-500 flex flex-col items-center">
                                <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-md mb-1 whitespace-nowrap">Click This!</span>
                                <MousePointer2 className="w-5 h-5 fill-current" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-8 border-t border-white/20 pt-6">
                    <button onClick={() => { setShowVerificationStep(false); setErrorMessage(''); }} className="px-6 py-3 rounded-xl font-bold border border-white/30 hover:bg-white/10 transition-colors">
                      Cancel
                    </button>
                    <button onClick={confirmVerification} disabled={isVerifying} className="flex-1 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-black disabled:opacity-50 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex justify-center items-center text-lg">
                      {isVerifying ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin text-emerald-400" /> Checking Athletic.net...</> : 'I Added It - Check My Profile!'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DASHBOARD RENDER (Shows if Profile Exists, regardless of verification status) */}
        {athleteProfile && (
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isUnverified ? 'opacity-80 grayscale-[20%]' : ''}`}>
            
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                <div className="relative w-28 h-28 mb-6 group mx-auto md:mx-0">
                  <div className={`${equippedBorder !== 'none' ? equippedBorder : 'border-4 border-slate-200'} w-full h-full rounded-full transition-all duration-300`}>
                    <div className={`w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner ${isUploadingAvatar ? 'animate-pulse' : ''}`}>
                      {athleteProfile.avatar_url ? <img src={athleteProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <Medal className="w-10 h-10 text-slate-400" />}
                    </div>
                  </div>
                  {/* Disable avatar upload if unverified */}
                  {!isUnverified && (
                    <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                    </label>
                  )}
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-1">{athleteProfile.first_name} {athleteProfile.last_name}</h1>
                
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
              
              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative">
                {isUnverified && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 rounded-[2rem] flex items-center justify-center flex-col text-center px-6">
                    <Lock className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-600">Verify to unlock Locker Room</p>
                  </div>
                )}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Locker Room</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Equip your unlocked badges.</p>
                  </div>
                  <Trophy className="w-6 h-6 text-slate-300" />
                </div>

                <div className="space-y-3">
                  {CUSTOM_BORDERS.map((border) => {
                    const isUnlocked = highestPercentile <= border.reqPercentile;
                    const isEquipped = equippedBorder === border.id;

                    return (
                      <button 
                        key={border.id}
                        disabled={!isUnlocked || isEquipping || isUnverified}
                        onClick={() => handleEquipBorder(border.id)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                          isEquipped 
                            ? 'bg-blue-50 border-blue-300 shadow-sm' 
                            : isUnlocked 
                              ? 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100 hover:-translate-y-0.5' 
                              : 'bg-slate-50/50 border-slate-100 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-12 rounded-t-md rounded-b-xl flex items-center justify-center shrink-0 overflow-hidden relative shadow-md ${isUnlocked && border.id !== 'none' ? border.badgeClass : 'bg-slate-200 border-2 border-slate-300'}`}>
                            {isUnlocked && border.id !== 'none' && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/30 mix-blend-overlay"></div>
                            )}
                            {border.id === 'border-legend' && isUnlocked && <Trophy className="w-4 h-4 text-white drop-shadow-md relative z-10" />}
                            {border.id === 'border-champion' && isUnlocked && <Medal className="w-4 h-4 text-white drop-shadow-md relative z-10" />}
                            {border.id === 'border-elite' && isUnlocked && <Activity className="w-4 h-4 text-white drop-shadow-md relative z-10" />}
                          </div>

                          <div>
                            <span className={`block font-bold ${isEquipped ? 'text-blue-900' : 'text-slate-700'}`}>{border.name}</span>
                            {!isUnlocked && <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5"><Lock className="w-3 h-3 inline mr-1 -mt-0.5" />{border.unlockText}</span>}
                            {isUnlocked && !isEquipped && <span className="block text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">Unlocked</span>}
                          </div>
                        </div>
                        {isEquipped && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

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
                  <button disabled={isUnverified} className="block w-full text-center bg-white text-purple-900 hover:bg-purple-50 font-black px-8 py-4 rounded-xl shadow-lg transition-colors disabled:opacity-50">
                    View Messages {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">{unreadCount}</span>}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Verified PRs</h3>
                    <p className="text-slate-500 font-medium">Your official meet results & national rank.</p>
                  </div>
                  
                  {/* RE-SYNC QUEUE BUTTON */}
                  <button onClick={handleReSync} disabled={isSyncing || isQueued || !canSync || isUnverified} className="flex items-center justify-center bg-slate-900 hover:bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-slate-900">
                    {isQueued ? (
                      <><Timer className="w-4 h-4 mr-2 animate-pulse text-yellow-300" /> Queued...</>
                    ) : isSyncing ? (
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
                                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${pr.tier.classes}`}>
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
          </div>
        )}
      </div>
    </main>
  );
}