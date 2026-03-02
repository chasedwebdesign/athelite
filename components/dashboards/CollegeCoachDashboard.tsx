'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Mail, School, Camera, Star, ChevronRight, Activity, MapPin } from 'lucide-react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

interface CoachProfile { id: string; first_name: string | null; last_name: string | null; school_name: string | null; coach_type: string; avatar_url: string | null; }

export default function CollegeCoachDashboard() {
  const supabase = createClient();
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Future feature: We will hook this up to a "saved_recruits" table next!
  const [watchlist, setWatchlist] = useState<any[]>([]);

  useEffect(() => {
    async function loadCoachData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cData } = await supabase.from('coaches').select('*').eq('id', session.user.id).maybeSingle();
      if (cData) setCoachProfile(cData);

      const { data: messageData } = await supabase
        .from('messages')
        .select('id, chat_history')
        .eq('sender_email', session.user.email) // Need to adjust based on how you track coach inbox
        .eq('is_read', false);
      
      if (messageData) setUnreadCount(messageData.length);

      setLoading(false);
    }
    loadCoachData();
  }, [supabase]);

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
    } catch (error: any) { 
      alert(`Error uploading image: ${error.message}`); 
    } finally { 
      setIsUploadingAvatar(false); 
    }
  };

  if (loading) return null; // Traffic cop handles the main loading spinner

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      {/* HEADER HERO SECTION */}
      <div className="bg-slate-900 text-white pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
          
          {/* AVATAR UPLOAD */}
          <div className="relative w-32 h-32 group shrink-0">
            <div className={`w-full h-full rounded-full border-4 border-slate-800 shadow-xl overflow-hidden bg-slate-800 flex items-center justify-center ${isUploadingAvatar ? 'animate-pulse' : ''}`}>
              {coachProfile?.avatar_url ? (
                <img src={coachProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <School className="w-12 h-12 text-slate-400" />
              )}
            </div>
            <label className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white mb-1" />
              <span className="text-[10px] text-white font-bold uppercase tracking-wider">Update Logo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
            </label>
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-widest uppercase mb-3">
              NCAA Recruiting Command Center
            </div>
            <h1 className="text-4xl font-black mb-2">
              {coachProfile?.first_name ? `Coach ${coachProfile.last_name}` : 'Welcome, Coach'}
            </h1>
            <p className="text-xl text-slate-300 font-medium flex items-center justify-center md:justify-start">
              <MapPin className="w-5 h-5 mr-2 opacity-70" />
              {coachProfile?.school_name || 'Set up your University Profile'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: QUICK ACTIONS */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/feed" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group block">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500 transition-all">
                <Search className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Discovery Engine</h3>
              <p className="text-slate-500 font-medium mb-4">Filter the national leaderboard by state, grad year, and event to find your next signee.</p>
              <span className="text-blue-600 font-bold text-sm flex items-center">
                Search Athletes <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link href="/dashboard/messages" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all group block relative overflow-hidden">
              {unreadCount > 0 && (
                <div className="absolute top-6 right-6 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full animate-pulse">
                  {unreadCount} New
                </div>
              )}
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-500 transition-all">
                <Mail className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Recruiting Inbox</h3>
              <p className="text-slate-500 font-medium mb-4">Manage direct pitches from verified high school athletes and their coaches.</p>
              <span className="text-purple-600 font-bold text-sm flex items-center">
                Open Inbox <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>

          {/* RIGHT COLUMN: THE WATCHLIST */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-200 h-full">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center">
                    <Star className="w-6 h-6 mr-3 text-yellow-400 fill-yellow-400" /> My Watchlist
                  </h2>
                  <p className="text-slate-500 font-medium mt-1">Athletes you are actively tracking.</p>
                </div>
                <div className="bg-slate-100 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm">
                  {watchlist.length} Saved
                </div>
              </div>

              {watchlist.length === 0 ? (
                <div className="text-center py-16 px-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Your board is empty!</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
                    When you find an athlete you like in the Discovery Engine, click the "Save to Watchlist" button to pin them here for easy access.
                  </p>
                  <Link href="/feed" className="bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-black transition-colors shadow-md">
                    Start Scouting
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* We will map over saved athletes here in the next step! */}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}