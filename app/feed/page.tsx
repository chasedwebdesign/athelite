'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MessageSquare, Send, Clock, ShieldCheck, Medal, CheckCircle2, MapPin, Mail, Lock, X, Trophy, ExternalLink, GraduationCap, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface AthleteData {
  first_name: string;
  last_name: string;
  high_school: string;
  avatar_url: string | null;
  trust_level: number;
  prs: { event: string; mark: string }[] | null;
  equipped_border?: string | null;
  majors?: string | null;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  athlete_id: string;
  linked_pr_event?: string | null;
  linked_pr_mark?: string | null;
  athletes: AthleteData;
}

export default function FeedPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User State
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<AthleteData | null>(null);
  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');
  const [isVerifiedAthlete, setIsVerifiedAthlete] = useState(false);
  const [isVerifiedCoach, setIsVerifiedCoach] = useState(false);
  const [myPRs, setMyPRs] = useState<{event: string, mark: string}[]>([]);
  
  // Post Creator State
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPRIndex, setSelectedPRIndex] = useState<string>('');
  const [myMajors, setMyMajors] = useState('');
  
  const [isPosting, setIsPosting] = useState(false);
  const [timeUntilNextPost, setTimeUntilNextPost] = useState<string | null>(null);

  // Messaging State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'pitch' | 'chat'>('pitch');
  const [selectedPostForMessage, setSelectedPostForMessage] = useState<Post | null>(null);
  const [senderName, setSenderName] = useState('');
  const [senderSchool, setSenderSchool] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    fetchFeedAndUser();
  }, [supabase]);

  async function fetchFeedAndUser() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setCurrentUserId(session.user.id);
      
      const { data: cData } = await supabase.from('coaches').select('trust_level').eq('id', session.user.id).maybeSingle();
      if (cData) {
        setViewerRole('coach');
        setIsVerifiedCoach(cData.trust_level > 0);
      } else {
        const { data: aData } = await supabase
          .from('athletes')
          .select('first_name, last_name, high_school, avatar_url, trust_level, prs, equipped_border, majors')
          .eq('id', session.user.id)
          .maybeSingle();

        if (aData) {
          setViewerRole('athlete');
          setIsVerifiedAthlete(aData.trust_level > 0);
          setCurrentUserProfile(aData as AthleteData);
          setMyMajors(aData.majors || '');
          
          if (aData.prs) setMyPRs(aData.prs);
          
          if (aData.trust_level > 0) {
            const { data: lastPost } = await supabase
              .from('posts')
              .select('created_at')
              .eq('athlete_id', session.user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lastPost) {
              const lastPostTime = new Date(lastPost.created_at).getTime();
              const currentTime = new Date().getTime();
              const hoursSinceLastPost = (currentTime - lastPostTime) / (1000 * 60 * 60);

              if (hoursSinceLastPost < 24) {
                const hoursLeft = Math.ceil(24 - hoursSinceLastPost);
                setTimeUntilNextPost(`${hoursLeft}h remaining`);
              }
            }
          }
        }
      }
    }

    const { data: feedData } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, athlete_id, linked_pr_event, linked_pr_mark,
        athletes (first_name, last_name, high_school, avatar_url, trust_level, prs, equipped_border, majors)
      `)
      .order('created_at', { ascending: false });

    if (feedData) setPosts(feedData as unknown as Post[]);
    setLoading(false);
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !currentUserId || timeUntilNextPost) return;
    
    setIsPosting(true);
    try {
      await supabase.from('athletes').update({
        majors: myMajors
      }).eq('id', currentUserId);

      const prToLink = selectedPRIndex !== '' ? myPRs[Number(selectedPRIndex)] : null;
      const { error } = await supabase.from('posts').insert({
        athlete_id: currentUserId,
        content: newPostContent,
        linked_pr_event: prToLink?.event || null,
        linked_pr_mark: prToLink?.mark || null
      });

      if (error) throw error;
      
      setNewPostContent('');
      setSelectedPRIndex('');
      setTimeUntilNextPost('24h remaining');
      fetchFeedAndUser(); 
    } catch (err: any) { 
      alert(`Error posting: ${err.message}`); 
    } finally { 
      setIsPosting(false); 
    }
  };

  const handleContactClick = (post: Post) => {
    if (viewerRole === 'guest' || !currentUserId) {
      alert("Please create an account or log in to contact athletes.");
      return;
    }
    if (viewerRole === 'coach' && !isVerifiedCoach) {
      alert("Please verify your coaching profile on the dashboard to send direct pitches.");
      return;
    }
    if (viewerRole === 'athlete' && !isVerifiedAthlete) {
      alert("Please sync your Athletic.net profile to message other athletes.");
      return;
    }
    openMessageModal(post, viewerRole === 'coach' ? 'pitch' : 'chat');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostForMessage) return;
    setIsSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        athlete_id: selectedPostForMessage.athlete_id,
        sender_name: senderName,
        sender_school: senderSchool,
        sender_email: senderEmail,
        content: messageContent
      });
      if (error) throw error;
      setSendSuccess(true);
      setTimeout(() => {
        setIsMessageModalOpen(false);
        setSendSuccess(false);
        setSenderName(''); setSenderSchool(''); setSenderEmail(''); setMessageContent('');
      }, 2000);
    } catch (error: any) { alert(`Failed to send message: ${error.message}`); } 
    finally { setIsSending(false); }
  };

  const openMessageModal = (post: Post, mode: 'pitch' | 'chat') => {
    setSelectedPostForMessage(post);
    setModalMode(mode);
    setSendSuccess(false);
    setIsMessageModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // NEW: Helper function to apply the glowing card class!
  const getCardGlowClass = (border?: string | null) => {
    if (border === 'border-legend') return 'card-legend';
    if (border === 'border-champion') return 'card-champion';
    if (border === 'border-elite') return 'card-elite';
    return 'border-slate-200 shadow-sm hover:shadow-md'; // Default styling
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Global Feed...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      
      {/* SYNCHRONIZED CUSTOM BORDERS & CARD GLOWS CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes liquidPan { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        
        .border-legend { background: linear-gradient(135deg, #7e22ce, #d946ef, #a21caf, #7e22ce); background-size: 300% 300%; animation: liquidPan 8s ease-in-out infinite; padding: 4px; border-radius: 50%; box-shadow: 0 0 15px rgba(217, 70, 239, 0.4); }
        @keyframes pulse-legend { 0%, 100% { box-shadow: 0 0 25px rgba(217, 70, 239, 0.2); border-color: rgba(217, 70, 239, 0.4); } 50% { box-shadow: 0 0 45px rgba(217, 70, 239, 0.4); border-color: rgba(217, 70, 239, 0.7); } }
        .card-legend { animation: pulse-legend 4s ease-in-out infinite; }

        .border-champion { background: linear-gradient(135deg, #b91c1c, #ef4444, #dc2626, #b91c1c); background-size: 300% 300%; animation: liquidPan 8s ease-in-out infinite; padding: 4px; border-radius: 50%; box-shadow: 0 0 15px rgba(239, 68, 68, 0.4); }
        @keyframes pulse-champion { 0%, 100% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); } 50% { box-shadow: 0 0 45px rgba(239, 68, 68, 0.4); border-color: rgba(239, 68, 68, 0.7); } }
        .card-champion { animation: pulse-champion 4s ease-in-out infinite; }

        .border-elite { background: linear-gradient(135deg, #1e293b, #64748b, #475569, #1e293b); background-size: 300% 300%; animation: liquidPan 8s ease-in-out infinite; padding: 4px; border-radius: 50%; box-shadow: 0 0 15px rgba(148, 163, 184, 0.3); }
        @keyframes pulse-elite { 0%, 100% { box-shadow: 0 0 25px rgba(148, 163, 184, 0.2); border-color: rgba(148, 163, 184, 0.4); } 50% { box-shadow: 0 0 45px rgba(148, 163, 184, 0.4); border-color: rgba(148, 163, 184, 0.7); } }
        .card-elite { animation: pulse-elite 4s ease-in-out infinite; }
      `}} />

      <div className="max-w-4xl mx-auto px-6 pt-12">
        
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">The Feed</h1>
          <p className="text-slate-500 font-medium text-lg">Live recruiting updates from verified athletes.</p>
        </div>

        {/* --- POST CREATOR & LIVE PREVIEW --- */}
        {viewerRole === 'athlete' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 mb-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none"></div>
            
            {isVerifiedAthlete ? (
              timeUntilNextPost ? (
                <div className="flex flex-col items-center justify-center text-center p-12">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Post Submitted!</h3>
                  <p className="text-slate-500 font-medium max-w-sm">
                    To keep the feed high-quality for coaches, athletes can only post once every 24 hours. Check back in <span className="font-black text-blue-600">{timeUntilNextPost}</span>.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                  
                  {/* EDIT PANEL */}
                  <form onSubmit={handleCreatePost} className="p-6 md:p-8 flex-1 bg-white">
                    <div className="flex items-center gap-2 mb-6">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-slate-800 text-lg">Customize Your Card</span>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="relative">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={myMajors} onChange={(e) => setMyMajors(e.target.value)} placeholder="Target Major (e.g. Business)" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                      </div>

                      <div className="relative">
                        <select value={selectedPRIndex} onChange={(e) => setSelectedPRIndex(e.target.value)} className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl pl-10 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                          <option value="">Attach a PR to this post (Optional)</option>
                          {myPRs.map((pr, index) => <option key={index} value={index}>{pr.event} - {pr.mark}</option>)}
                        </select>
                        <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>

                      <textarea required maxLength={280} value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Just hit a new PR at the state meet! Looking forward to upcoming visits..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none h-28" />
                    </div>

                    <button type="submit" disabled={isPosting || !newPostContent.trim()} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                      {isPosting ? 'Posting...' : <><Send className="w-4 h-4" /> Send to Feed</>}
                    </button>
                  </form>

                  {/* LIVE PREVIEW PANEL */}
                  <div className="p-6 md:p-8 flex-1 bg-slate-50/50 flex flex-col items-center justify-center relative">
                    <span className="absolute top-4 right-6 text-[10px] font-black tracking-widest uppercase text-slate-400">Live Preview</span>
                    
                    {/* APPLYING THE DYNAMIC GLOW CLASS TO THE PREVIEW CONTAINER */}
                    <div className={`bg-white rounded-[2rem] p-6 border w-full pointer-events-none mt-6 transition-all duration-300 ${getCardGlowClass(currentUserProfile?.equipped_border)}`}>
                      <div className="flex items-start gap-4 mb-4">
                        
                        <div className={`${currentUserProfile?.equipped_border && currentUserProfile?.equipped_border !== 'none' ? currentUserProfile.equipped_border : 'border-4 border-slate-100'} rounded-full shrink-0`}>
                          <div className="w-12 h-12 overflow-hidden rounded-full bg-slate-900 flex items-center justify-center">
                            {currentUserProfile?.avatar_url ? <img src={currentUserProfile.avatar_url} className="w-full h-full object-cover" /> : <Medal className="w-6 h-6 text-slate-400" />}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="font-black text-lg text-slate-900 flex items-center gap-1.5 leading-tight">
                            {currentUserProfile?.first_name} {currentUserProfile?.last_name}
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </h3>
                          <p className="text-xs font-bold text-slate-500 flex items-center mt-0.5">
                            <MapPin className="w-3 h-3 mr-1 text-slate-400" /> {currentUserProfile?.high_school}
                          </p>
                          
                          {myMajors && (
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="flex items-center bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider"><GraduationCap className="w-3 h-3 mr-1 text-purple-500"/> {myMajors}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-700 font-medium text-sm leading-relaxed mb-4 break-words">
                        {newPostContent || <span className="text-slate-300 italic">Your update will appear here...</span>}
                      </p>

                      {selectedPRIndex !== '' && myPRs[Number(selectedPRIndex)] && (
                        <div className="inline-flex items-center bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                          <Trophy className="w-3.5 h-3.5 text-blue-600 mr-2 shrink-0" />
                          <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest mr-2">{myPRs[Number(selectedPRIndex)].event}</span>
                          <span className="text-sm font-black text-blue-600">{myPRs[Number(selectedPRIndex)].mark}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-12">
                <ShieldCheck className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-xl font-black text-slate-900 mb-2">Unverified Profile</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm">You must sync your Athletic.net profile to post to the global feed.</p>
                <Link href="/dashboard" className="bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-md">
                  Verify Profile
                </Link>
              </div>
            )}
          </div>
        )}

        {/* --- THE FEED LIST --- */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-200 border-dashed shadow-sm">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-900 mb-2">The feed is quiet...</h3>
              <p className="text-slate-500 font-medium">Be the first athlete to post an update today!</p>
            </div>
          ) : (
            posts.map((post) => {
              const isSelf = currentUserId === post.athlete_id;

              return (
                // APPLYING THE DYNAMIC GLOW CLASS TO THE REAL CARDS IN THE FEED
                <div key={post.id} className={`bg-white rounded-[2rem] p-6 sm:p-8 border transition-all duration-300 group relative ${getCardGlowClass(post.athletes.equipped_border)}`}>
                  
                  {/* POST HEADER */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-start gap-4">
                      
                      <Link href={`/athlete/${post.athlete_id}`} className={`${post.athletes.equipped_border && post.athletes.equipped_border !== 'none' ? post.athletes.equipped_border : 'border-4 border-slate-100'} rounded-full flex shrink-0 group-hover:scale-105 transition-transform`}>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900 rounded-full flex items-center justify-center overflow-hidden shadow-inner">
                          {post.athletes.avatar_url ? (
                            <img src={post.athletes.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <Medal className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                      </Link>

                      <div>
                        <Link href={`/athlete/${post.athlete_id}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                          <h3 className="font-black text-lg sm:text-xl text-slate-900 tracking-tight leading-tight">{post.athletes.first_name} {post.athletes.last_name}</h3>
                          {post.athletes.trust_level > 0 && (
                            <span title="Verified" className="flex items-center">
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            </span>
                          )}
                        </Link>
                        
                        <p className="text-xs sm:text-sm font-bold text-slate-500 flex items-center mt-1">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {post.athletes.high_school}
                        </p>

                        {post.athletes.majors && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="flex items-center bg-slate-50 border border-slate-200 text-slate-600 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                              <GraduationCap className="w-3 h-3 mr-1 text-purple-500"/> {post.athletes.majors}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 shrink-0 mt-1">{formatDate(post.created_at)}</span>
                  </div>

                  {/* POST CONTENT */}
                  <p className="text-slate-700 font-medium text-[15px] sm:text-base leading-relaxed mb-6 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* POST FOOTER (BADGE & ACTIONS) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-5 mt-4">
                    
                    {post.linked_pr_event ? (
                      <div className="inline-flex items-center bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl shadow-sm">
                        <Trophy className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                        <span className="text-[10px] sm:text-xs font-black text-blue-800 uppercase tracking-widest mr-3">{post.linked_pr_event}</span>
                        <span className="text-sm sm:text-base font-black text-blue-600">{post.linked_pr_mark}</span>
                      </div>
                    ) : (
                      <div className="hidden sm:block"></div>
                    )}

                    <div className="flex items-center justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                      <Link 
                        href={`/athlete/${post.athlete_id}`}
                        className="flex-1 sm:flex-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" /> Profile
                      </Link>

                      {!isSelf && (
                        <button 
                          onClick={() => handleContactClick(post)} 
                          className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Mail className="w-4 h-4" /> Contact
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- MESSAGING MODAL --- */}
      {isMessageModalOpen && selectedPostForMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-slate-900">{modalMode === 'pitch' ? `Message ${selectedPostForMessage.athletes.first_name}` : `Connect with ${selectedPostForMessage.athletes.first_name}`}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{modalMode === 'pitch' ? 'Direct Pitch' : 'Athlete Chat Request'}</p>
              </div>
              <button onClick={() => setIsMessageModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            
            {sendSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
                <h4 className="text-2xl font-black text-slate-900 mb-2">Sent!</h4>
                <p className="text-slate-500 font-medium">Your message has been securely delivered to their dashboard.</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Your Name</label>
                    <input required type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{modalMode === 'pitch' ? 'University' : 'Your High School'}</label>
                    <input required type="text" value={senderSchool} onChange={(e) => setSenderSchool(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium" placeholder={modalMode === 'pitch' ? "Oregon State" : "South Albany HS"} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Your Email</label>
                  <input required type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium" placeholder="name@example.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Message</label>
                  <textarea required value={messageContent} onChange={(e) => setMessageContent(e.target.value)} rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium resize-none" placeholder={modalMode === 'pitch' ? `Hi ${selectedPostForMessage.athletes.first_name}...` : `Hey ${selectedPostForMessage.athletes.first_name}...`}></textarea>
                </div>
                <button type="submit" disabled={isSending} className={`w-full text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${modalMode === 'pitch' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-500'}`}>
                  {isSending ? 'Sending...' : <><Send className="w-5 h-5" /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}