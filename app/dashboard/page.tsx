'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Activity, ShieldCheck, Link as LinkIcon, Trophy, LogOut, Medal, Timer, TrendingUp, CheckCircle2, Search, AlertCircle, Zap, Calendar, MapPin, Camera, Mail, RefreshCw, School, Lock, AlertTriangle, ExternalLink, ChevronRight, Check } from 'lucide-react';
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
  const [syncUrl, setSyncUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false); 
  const [unreadCount, setUnreadCount] = useState(0);
  const [claimConflict, setClaimConflict] = useState(false);

  const [highestPercentile, setHighestPercentile] = useState<number>(1.0);
  const [equippedBorder, setEquippedBorder] = useState<string>('none');
  const [isEquipping, setIsEquipping] = useState(false);

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
    async function loadDashboardData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: aData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();
      
      if (aData) {
        setUserRole('athlete');
        setEquippedBorder(aData.equipped_border || 'none');
        
        let bestPercentileFound = 1.0;

        if (aData.prs && aData.prs.length > 0) {
          const { data: allAthletes } = await supabase.from('athletes').select('prs');
          
          if (allAthletes) {
            aData.prs = aData.prs.map((myPr: any) => {
              const event = myPr.event;
              const allMarks = allAthletes
                .map(a => a.prs?.find((p: any) => p.event === event)?.mark)
                .filter(Boolean);
              
              allMarks.sort((a, b) => parseMarkForSorting(a, event) - parseMarkForSorting(b, event));
              
              const myVal = parseMarkForSorting(myPr.mark, event);
              const rankIndex = allMarks.findIndex(m => parseMarkForSorting(m, event) === myVal);
              const percentile = Math.max(0, rankIndex / allMarks.length);
              
              // FIXED: Re-added the global rank calculator!
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

              // FIXED: Passing globalRank to the UI
              return { ...myPr, tier, globalRank };
            });
          }
        }

        setHighestPercentile(bestPercentileFound);
        setAthleteProfile(aData);
        
        const { data: messageData } = await supabase.from('messages').select('id').eq('athlete_id', session.user.id).eq('is_read', false);
        if (messageData) setUnreadCount(messageData.length);
        setLoading(false);
        return;
      }

      const { data: cData } = await supabase.from('coaches').select('*').eq('id', session.user.id).maybeSingle();
      if (cData) { setUserRole('coach'); setCoachProfile(cData); }
      setLoading(false);
    }
    loadDashboardData();
  }, [supabase, router]);

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

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncUrl.includes('athletic.net')) return alert("Please enter a valid Athletic.net profile URL.");
    setClaimConflict(false);
    setIsSyncing(true);

    try {
      const { data: existingUser } = await supabase
        .from('athletes')
        .select('id')
        .eq('athletic_net_url', syncUrl)
        .neq('id', athleteProfile?.id)
        .maybeSingle();

      if (existingUser) {
        setClaimConflict(true);
        setIsSyncing(false);
        return;
      }

      const response = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: syncUrl }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
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
        trust_level: 1 
      }).eq('id', athleteProfile?.id);

      if (updateError) throw updateError;
      window.location.reload();
    } catch (err: any) { 
      alert(err.message); 
      setIsSyncing(false); 
    }
  };

  const handleReSync = async () => {
    if (!athleteProfile?.athletic_net_url) return alert("No Athletic.net URL found.");
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: athleteProfile.athletic_net_url }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      await supabase.from('athletes').update({ 
        prs: result.data.prs,
        gender: result.data.gender,
        state: result.data.state,                
        school_size: result.data.schoolSize,     
        conference: result.data.conference,
        grad_year: result.data.gradYear       
      }).eq('id', athleteProfile.id);
      
      window.location.reload(); 
    } catch (err: any) { alert(`Failed to sync: ${err.message}`); } finally { setIsSyncing(false); }
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
  const getTrustBadge = (level: number) => {
    switch(level) {
      case 1: return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 border-green-200', text: 'Results Verified' };
      case 2: return { icon: Trophy, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', text: 'Community Verified' };
      case 3: return { icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200', text: 'Coach Verified' };
      default: return { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200', text: 'Unverified Profile' };
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
              <div className="relative w-28 h-28 mb-6 group mx-auto md:mx-0">
                <div className={`${equippedBorder !== 'none' ? equippedBorder : 'border-4 border-slate-200'} w-full h-full rounded-full transition-all duration-300`}>
                  <div className={`w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner ${isUploadingAvatar ? 'animate-pulse' : ''}`}>
                    {athleteProfile?.avatar_url ? <img src={athleteProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <Medal className="w-10 h-10 text-slate-400" />}
                  </div>
                </div>
                <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                </label>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{athleteProfile?.first_name ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'New Athlete'}</h1>
              
              <p className="text-slate-500 font-medium leading-relaxed mb-6">
                {athleteProfile?.high_school ? (
                  <>
                    {athleteProfile.high_school} 
                    {athleteProfile.grad_year && ` • Class of ${athleteProfile.grad_year}`}
                    {athleteProfile.state && ` • ${athleteProfile.state}`}
                    {athleteProfile.school_size && ` • ${athleteProfile.school_size}`}
                    {athleteProfile.conference && ` • ${athleteProfile.conference}`}
                  </>
                ) : 'Profile awaiting sync...'}
              </p>
              
              <div className="border-t border-slate-100 pt-6">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Trust Level</span>
                <div className={`flex items-center px-4 py-3 rounded-xl border ${badge.bg}`}>
                  <badge.icon className={`w-5 h-5 mr-3 ${badge.color}`} />
                  <span className={`text-sm font-bold ${badge.color}`}>{badge.text}</span>
                </div>
              </div>

              {athleteProfile?.trust_level! > 0 && (
                <div className="border-t border-slate-100 pt-6 mt-6">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Verified Division</span>
                  <div className="flex items-center px-4 py-3 rounded-xl border bg-slate-50 border-slate-200">
                    <CheckCircle2 className="w-4 h-4 mr-3 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{athleteProfile?.gender || 'Boys'} Division</span>
                  </div>
                </div>
              )}
            </div>
            
            {athleteProfile?.trust_level! > 0 && (
              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
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
                        disabled={!isUnlocked || isEquipping}
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
            )}

          </div>

          <div className="lg:col-span-2 space-y-6">
            {athleteProfile?.trust_level === 0 && (
              <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-blue-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">Auto-Build Your Profile</h2>
                  
                  {claimConflict ? (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 mb-6">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">Profile Already Claimed</h3>
                          <p className="text-red-200/80 text-sm mb-4">
                            Another user has already connected this Athletic.net link to their account. If you are the real athlete, click below to verify your identity and we will transfer the profile to you immediately.
                          </p>
                          <div className="flex gap-3">
                            <a 
                              href={`mailto:support@chasedsports.com?subject=Profile Dispute: ${syncUrl}&body=Hi, I am the real athlete for this profile link and someone else claimed it. My Instagram handle is [Insert IG Handle] so you can verify my identity.`}
                              className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
                            >
                              Report & Claim Profile
                            </a>
                            <button onClick={() => setClaimConflict(false)} className="bg-transparent border border-slate-600 hover:border-slate-400 text-slate-300 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
                              Try Another Link
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-blue-200/80 font-medium mb-8 space-y-2">
                        <p>Paste the exact link to your Athletic.net Track & Field or Cross Country profile.</p>
                        <p className="text-sm opacity-80 flex items-center bg-black/20 w-fit px-3 py-1.5 rounded-lg border border-blue-800/50">
                          <span className="font-bold mr-2 text-white">Example:</span> 
                          <span className="font-mono text-blue-300">https://www.athletic.net/athlete/12345/track-and-field</span>
                        </p>
                      </div>

                      <form onSubmit={handleSync} className="flex flex-col sm:flex-row gap-3">
                        <input type="url" required placeholder="https://www.athletic.net/athlete/..." value={syncUrl} onChange={(e) => setSyncUrl(e.target.value)} className="w-full flex-grow bg-white/10 border border-white/20 text-white rounded-xl pl-4 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold placeholder:text-blue-300/30" />
                        <button type="submit" disabled={isSyncing} className="bg-blue-500 hover:bg-blue-400 text-white px-8 py-4 rounded-xl font-black disabled:opacity-50 transition-colors">
                          {isSyncing ? 'Scraping...' : 'Sync'}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}

            {athleteProfile?.trust_level! > 0 && (
              <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-[2rem] p-8 border border-purple-700 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
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
            )}

            <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Verified PRs</h3>
                  <p className="text-slate-500 font-medium">Your official meet results & national rank.</p>
                </div>
                {athleteProfile?.trust_level! > 0 && (
                  <button onClick={handleReSync} disabled={isSyncing} className="flex items-center justify-center bg-slate-900 hover:bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Latest PRs'}
                  </button>
                )}
              </div>

              {hasPRs ? (
                <div className="grid grid-cols-1 gap-4">
                  {athleteProfile!.prs!.map((pr, index) => {
                    const queryParams = new URLSearchParams({
                      event: pr.event,
                      gender: athleteProfile.gender || 'Boys'
                    });
                    const leaderboardLink = `/leaderboard?${queryParams.toString()}#${athleteProfile.id}`;

                    return (
                      <Link href={leaderboardLink} key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-200 bg-slate-50 gap-4 group hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer relative overflow-hidden">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
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
                        <div className="flex items-center gap-5 sm:border-l sm:border-slate-200 sm:pl-5 pr-4">
                          <div className="flex flex-col items-start sm:items-end">
                            <span className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Global Status</span>
                            {pr.tier ? (
                              <div className="flex items-center gap-2 mt-0.5">
                                {/* FIXED: Re-added the numeric rank display here! */}
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
                      </Link>
                    )
                  })}
                  
                  {athleteProfile?.state && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Explore Local Leaderboards</h4>
                      <div className="flex flex-wrap gap-3">
                        <Link href={`/leaderboard?state=${athleteProfile.state}&gender=${athleteProfile.gender || 'Boys'}`} className="flex items-center text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl transition-colors group">
                          📍 {athleteProfile.state} Rankings
                          <ChevronRight className="w-4 h-4 ml-1 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                        </Link>
                        {athleteProfile.school_size && (
                          <Link href={`/leaderboard?state=${athleteProfile.state}&size=${athleteProfile.school_size}&gender=${athleteProfile.gender || 'Boys'}`} className="flex items-center text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl transition-colors group">
                            👥 {athleteProfile.school_size} Division
                            <ChevronRight className="w-4 h-4 ml-1 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                          </Link>
                        )}
                        {athleteProfile.conference && (
                          <Link href={`/leaderboard?state=${athleteProfile.state}&size=${athleteProfile.school_size || 'All'}&conference=${athleteProfile.conference}&gender=${athleteProfile.gender || 'Boys'}`} className="flex items-center text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl transition-colors group">
                            🏆 {athleteProfile.conference} Conf.
                            <ChevronRight className="w-4 h-4 ml-1 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
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
      </div>
    </main>
  );
}