'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Activity, ShieldCheck, Link as LinkIcon, Trophy, LogOut, Medal, Timer, TrendingUp, CheckCircle2, Search, AlertCircle, Zap, Calendar, MapPin, Camera } from 'lucide-react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

interface AthleteProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  grad_year: number | null;
  high_school: string | null;
  state: string | null;
  primary_sport: string;
  athletic_net_url: string | null;
  trust_level: number;
  prs: { event: string; mark: string; date?: string; meet?: string }[] | null; 
  avatar_url: string | null; 
}

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncUrl, setSyncUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false); 

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // --- FINAL VERSION: COMPRESSION + OVERWRITE + CACHE BUSTING ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploadingAvatar(true);
      if (!e.target.files || e.target.files.length === 0 || !profile?.id) return;
      
      // 1. Compress the image
      const originalFile = e.target.files[0];
      const options = {
        maxSizeMB: 0.2, // Max size of 200KB!
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(originalFile, options);
      
      // 2. Create a CONSISTENT filename based on user ID (no random numbers!)
      const fileName = `${profile.id}-avatar.jpg`; 

      // 3. Upload with UPSERT (Overwrite) enabled
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: true // <-- THIS IS THE MAGIC KEY. It overwrites old images.
        });

      if (uploadError) throw uploadError;

      // 4. Get public URL and add a timestamp to force the browser to refresh it
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
        
      const publicUrlWithTimestamp = `${publicUrl}?t=${new Date().getTime()}`;

      // 5. Update the athlete's database row
      const { error: updateError } = await supabase
        .from('athletes')
        .update({ avatar_url: publicUrlWithTimestamp })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // 6. Instantly update the UI
      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrlWithTimestamp } : null);
      
    } catch (error: any) {
      alert(`Error uploading image: ${error.message}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncUrl.includes('athletic.net')) {
      alert("Please enter a valid Athletic.net profile URL.");
      return;
    }
    
    setIsSyncing(true);
    
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: syncUrl })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync');
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { error: dbError } = await supabase
          .from('athletes')
          .update({
            first_name: result.data.firstName,
            last_name: result.data.lastName,
            high_school: result.data.schoolName,
            athletic_net_url: result.data.url,
            prs: result.data.prs, 
            trust_level: 1 
          })
          .eq('id', session.user.id);

        if (dbError) throw dbError;

        window.location.reload();
      }

    } catch (err: any) {
      alert(err.message);
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading secure dashboard...</p>
      </div>
    );
  }

  const getTrustBadge = (level: number) => {
    switch(level) {
      case 1: return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 border-green-200', text: 'Results Verified' };
      case 2: return { icon: Trophy, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', text: 'Community Verified' };
      case 3: return { icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-200', text: 'Coach Verified' };
      default: return { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200', text: 'Unverified Profile' };
    }
  };

  const badge = getTrustBadge(profile?.trust_level || 0);
  const hasPRs = profile?.prs && profile.prs.length > 0;

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/athletes" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-md group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">
              Chased<span className="text-blue-600">Sports</span>
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/athletes" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center">
              <Search className="w-4 h-4 mr-1" /> Discovery Engine
            </Link>
            <button 
              onClick={handleSignOut}
              className="text-sm font-bold text-slate-500 hover:text-red-600 transition-colors flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Log Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
              
              {/* INTERACTIVE AVATAR COMPONENT */}
              <div className="relative w-24 h-24 mb-6 group">
                <div className={`w-full h-full rounded-full border border-slate-300 shadow-inner overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ${isUploadingAvatar ? 'animate-pulse' : ''}`}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Medal className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                
                {/* Hidden File Input & Hover Overlay */}
                <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </label>
              </div>
              
              <h1 className="text-2xl font-black text-slate-900 mb-1">
                {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : 'New Athlete'}
              </h1>
              <p className="text-slate-500 font-medium mb-6">
                {profile?.high_school ? `${profile.high_school} ${profile.grad_year ? `• Class of ${profile.grad_year}` : ''}` : 'Profile awaiting sync...'}
              </p>

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
            
            {profile?.trust_level === 0 && (
              <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-blue-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 mb-6">
                    <Activity className="w-4 h-4 text-blue-400 mr-2" />
                    <span className="text-[11px] font-black text-blue-300 uppercase tracking-widest">Data Importer</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
                    Auto-Build Your Profile
                  </h2>
                  <p className="text-blue-200/80 font-medium max-w-lg leading-relaxed mb-8">
                    Paste your Athletic.net profile link below. We will instantly extract your official PRs, verify your identity, and calculate your Recruit Score.
                  </p>
                  <form onSubmit={handleSync} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <LinkIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="url"
                        required
                        placeholder="https://www.athletic.net/athlete/18994778/track-and-field/"
                        value={syncUrl}
                        onChange={(e) => setSyncUrl(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold backdrop-blur-sm transition-all"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSyncing}
                      className="whitespace-nowrap bg-blue-500 hover:bg-blue-400 text-white px-8 py-4 rounded-xl font-black transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isSyncing ? 'Scraping Data...' : 'Sync Profile'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Verified PRs</h3>
                  <p className="text-slate-500 font-medium">Your official meet results.</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl">
                  <Timer className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              {hasPRs ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.prs!.map((pr, index) => (
                    <div key={index} className="flex flex-col p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Event</span>
                          <span className="font-black text-lg text-slate-800">{pr.event}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Mark</span>
                          <span className="font-black text-2xl text-blue-600">{pr.mark}</span>
                        </div>
                      </div>
                      
                      {(pr.date || pr.meet) && (
                        <div className="border-t border-slate-200 pt-3 mt-1 flex flex-col gap-1.5 text-xs text-slate-500 font-medium">
                          <span className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" /> 
                            {pr.date}
                          </span>
                          <span className="flex items-center truncate pr-2">
                            <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 min-w-[14px]" /> 
                            {pr.meet}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-lg font-black text-slate-900 mb-1">No times found</h4>
                  <p className="text-sm text-slate-500 font-medium">Sync your profile to populate this board.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}