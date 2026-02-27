'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Activity, ShieldCheck, Link as LinkIcon, Trophy, LogOut, Medal, Timer, TrendingUp, CheckCircle2, Search, AlertCircle, Zap, Calendar, MapPin, Camera, Mail, RefreshCw, School } from 'lucide-react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

interface AthleteProfile { id: string; first_name: string | null; last_name: string | null; grad_year: number | null; high_school: string | null; state: string | null; primary_sport: string; athletic_net_url: string | null; trust_level: number; prs: { event: string; mark: string; date?: string; meet?: string; tier?: { name: string; classes: string } }[] | null; avatar_url: string | null; }
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
        
        // --- CALCULATE REGAL TIERS FOR DASHBOARD ---
        if (aData.prs && aData.prs.length > 0) {
          // Fetch all PRs from DB to calculate percentile
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

              let tier;
              if (percentile <= 0.01 || rankIndex === 0) tier = { name: 'LEGEND', classes: 'legend-badge' };
              else if (percentile <= 0.05) tier = { name: 'GRANDMASTER', classes: 'bg-slate-900 text-slate-100 border border-slate-700' };
              else if (percentile <= 0.15) tier = { name: 'MASTER', classes: 'bg-purple-100 text-purple-800 border border-purple-300' };
              else if (percentile <= 0.30) tier = { name: 'ELITE', classes: 'bg-blue-100 text-blue-800 border border-blue-300' };
              else if (percentile <= 0.50) tier = { name: 'CONTENDER', classes: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
              else if (percentile <= 0.75) tier = { name: 'CHALLENGER', classes: 'bg-orange-100 text-orange-800 border border-orange-300' };
              else tier = { name: 'PROSPECT', classes: 'bg-slate-100 text-slate-600 border border-slate-300' };

              return { ...myPr, tier };
            });
          }
        }

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

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncUrl.includes('athletic.net')) return alert("Please enter a valid Athletic.net profile URL.");
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: syncUrl }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await supabase.from('athletes').update({ first_name: result.data.firstName, last_name: result.data.lastName, high_school: result.data.schoolName, athletic_net_url: result.data.url, prs: result.data.prs, trust_level: 1 }).eq('id', athleteProfile?.id);
      window.location.reload();
    } catch (err: any) { alert(err.message); setIsSyncing(false); }
  };

  const handleReSync = async () => {
    if (!athleteProfile?.athletic_net_url) return alert("No Athletic.net URL found.");
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: athleteProfile.athletic_net_url }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await supabase.from('athletes').update({ prs: result.data.prs }).eq('id', athleteProfile.id);
      window.location.reload(); // Reload to re-calculate percentiles easily
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
              <Link href="/athletes" className="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-3xl p-8 transition-all group cursor-pointer block">
                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform"><Search className="w-6 h-6 text-blue-600" /></div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Find Recruits</h3>
                <p className="text-slate-500 font-medium text-sm">Access the Discovery Engine to find verified high school athletes.</p>
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

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .legend-badge { background: linear-gradient(90deg, #FFDF00 0%, #FFF8B0 20%, #FFDF00 40%, #FFF8B0 60%, #FFDF00 80%); background-size: 200% auto; animation: shimmer 3s linear infinite; color: #714200; border: 1px solid #FDE047; box-shadow: 0 0 10px rgba(253, 224, 71, 0.4); font-weight: 900; }
      `}} />

      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
              <div className="relative w-24 h-24 mb-6 group">
                <div className={`w-full h-full rounded-full border border-slate-300 shadow-inner overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ${isUploadingAvatar ? 'animate-pulse' : ''}`}>
                  {athleteProfile?.avatar_url ? <img src={athleteProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <Medal className="w-10 h-10 text-slate-400" />}
                </div>
                <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                </label>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{athleteProfile?.first_name ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'New Athlete'}</h1>
              <p className="text-slate-500 font-medium mb-6">{athleteProfile?.high_school ? `${athleteProfile.high_school} ${athleteProfile.grad_year ? `• Class of ${athleteProfile.grad_year}` : ''}` : 'Profile awaiting sync...'}</p>
              <div className="border-t border-slate-100 pt-6">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Trust Level</span>
                <div className={`flex items-center px-4 py-3 rounded-xl border ${badge.bg}`}>
                  <badge.icon className={`w-5 h-5 mr-3 ${badge.color}`} />
                  <span className={`text-sm font-bold ${badge.color}`}>{badge.text}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {athleteProfile?.trust_level === 0 && (
              <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-blue-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">Auto-Build Your Profile</h2>
                  <p className="text-blue-200/80 font-medium mb-8">Paste your Athletic.net profile link below. We will extract your PRs and verify your identity.</p>
                  <form onSubmit={handleSync} className="flex flex-col sm:flex-row gap-3">
                    <input type="url" required placeholder="https://www.athletic.net/..." value={syncUrl} onChange={(e) => setSyncUrl(e.target.value)} className="w-full flex-grow bg-white/10 border border-white/20 text-white rounded-xl pl-4 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
                    <button type="submit" disabled={isSyncing} className="bg-blue-500 hover:bg-blue-400 text-white px-8 py-4 rounded-xl font-black disabled:opacity-50">
                      {isSyncing ? 'Scraping...' : 'Sync'}
                    </button>
                  </form>
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
                  {athleteProfile!.prs!.map((pr, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-200 bg-slate-50 gap-4 group hover:bg-white hover:border-blue-300 transition-colors">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">Event</span>
                        <span className="font-black text-xl text-slate-800">{pr.event}</span>
                        {(pr.date || pr.meet) && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-2">
                            <span className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-slate-400" /> {pr.date}</span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span className="flex items-center truncate pr-2"><MapPin className="w-3 h-3 mr-1 text-slate-400" /> {pr.meet}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-5 sm:border-l sm:border-slate-200 sm:pl-5">
                        <div className="flex flex-col items-start sm:items-end">
                          <span className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Status</span>
                          {pr.tier ? (
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${pr.tier.classes}`}>
                              {pr.tier.name}
                            </span>
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
                  ))}
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