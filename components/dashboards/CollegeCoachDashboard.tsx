'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, Mail, School, Camera, Star, ChevronRight, Activity, MapPin, Medal, Trash2, ExternalLink, ShieldAlert, CheckCircle2, Flame, Trophy, Pencil, Save, X } from 'lucide-react';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

interface CoachProfile { id: string; first_name: string | null; last_name: string | null; school_name: string | null; coach_type: string; avatar_url: string | null; email: string | null; is_verified: boolean; }

export default function CollegeCoachDashboard() {
  const supabase = createClient();
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [watchlist, setWatchlist] = useState<any[]>([]);

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

      if (savedData) setWatchlist(savedData);

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
      alert(`Failed to save profile: ${err.message}`);
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

  // --- AVATAR & WATCHLIST FUNCTIONS ---
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
    } catch (error: any) { alert(`Error uploading image: ${error.message}`); } finally { setIsUploadingAvatar(false); }
  };

  const handleRemoveFromWatchlist = async (savedRecruitId: string) => {
    try {
      setWatchlist((prev) => prev.filter((item) => item.id !== savedRecruitId));
      await supabase.from('saved_recruits').delete().eq('id', savedRecruitId);
    } catch (err: any) { alert(`Failed to remove: ${err.message}`); }
  };

  const isRecentPR = (dateString: string) => {
    if (!dateString || dateString === 'Unknown Date') return false;
    const prDate = new Date(dateString);
    if (isNaN(prDate.getTime())) return false;
    const diffTime = Math.abs(new Date().getTime() - prDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 14; 
  };

  if (loading) return null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      {/* HEADER HERO SECTION */}
      <div className="bg-slate-900 text-white pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
          
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

          <div className="text-center md:text-left flex-1 w-full">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-widest uppercase mb-3">
              NCAA Recruiting Command Center
            </div>
            
            {isEditingProfile ? (
              <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 max-w-lg mx-auto md:mx-0 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                    <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} placeholder="John" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                    <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} placeholder="Doe" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">University Name</label>
                  <input type="text" value={editSchoolName} onChange={e => setEditSchoolName(e.target.value)} placeholder="State University" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1" />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleSaveProfile} disabled={isSavingProfile} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center transition-colors shadow-lg disabled:opacity-50">
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
                  {coachProfile?.is_verified && (
                    <span title="Verified Coach" className="flex items-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-blue-400" />
                    </span>
                  )}
                </h1>

                <p className="text-lg text-slate-300 font-medium flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mt-2">
                  <span className="flex items-center"><School className="w-4 h-4 mr-1.5 opacity-70" /> {coachProfile?.school_name || 'Set up your University Profile'}</span>
                  <span className="text-slate-600 hidden md:inline">|</span>
                  <span className="flex items-center"><Mail className="w-4 h-4 mr-1.5 opacity-70" /> {coachProfile?.email}</span>
                </p>

                {/* EDIT BUTTON */}
                <button 
                  onClick={handleEditToggle} 
                  className="absolute -right-12 top-2 p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md"
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
                  <Link href="/feed" className="bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-black transition-colors shadow-md inline-block">
                    Start Scouting
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {watchlist.map((item) => {
                    const athlete = item.athletes;
                    if (!athlete) return null;

                    // PR Math & Grid Slicing
                    const hasRecentPR = athlete.prs?.some((pr: any) => isRecentPR(pr.date));
                    const displayPrs = athlete.prs?.slice(0, 4) || [];
                    const extraPrsCount = (athlete.prs?.length || 0) - 4;

                    return (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-[1.5rem] p-6 hover:border-blue-300 hover:shadow-lg transition-all group relative flex flex-col">
                        
                        {/* RECENT PR FIRE BADGE */}
                        {hasRecentPR && (
                          <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 animate-bounce z-10">
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
                              <h4 className="font-black text-lg text-slate-900 truncate group-hover:text-blue-600 transition-colors">
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

                        {/* 🏆 STAT GRID */}
                        <div className="mb-5 flex-1">
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
                                    <span className={`block font-black text-sm ${isRecent ? 'text-orange-600' : 'text-blue-600'}`}>{pr.mark}</span>
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

                        <div className="mt-auto pt-4 border-t border-slate-100">
                          <Link href={`/athlete/${athlete.id}`} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center text-sm hover:bg-blue-600 transition-colors shadow-sm">
                            View Full Profile <ExternalLink className="w-4 h-4 ml-1.5 opacity-70" />
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
    </main>
  );
}