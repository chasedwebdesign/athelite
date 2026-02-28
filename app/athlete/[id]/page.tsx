'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Medal, CheckCircle2, MapPin, Mail, X, Send, MessageSquare, Lock, Trophy, Calendar, Share2, ArrowLeft, Activity, Globe } from 'lucide-react';
import Link from 'next/link';

interface AthleteProfile {
  id: string;
  first_name: string;
  last_name: string;
  high_school: string;
  state: string;
  grad_year: number;
  trust_level: number;
  gender: string;
  prs: { event: string; mark: string; date?: string; meet?: string }[];
  avatar_url?: string;
}

interface AthletePost {
  id: string;
  content: string;
  created_at: string;
  linked_pr_event?: string | null;
  linked_pr_mark?: string | null;
}

export default function PublicAthleteProfile() {
  const params = useParams();
  const router = useRouter();
  const athleteId = params.id as string;
  const supabase = createClient();
  
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [posts, setPosts] = useState<AthletePost[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'accolades' | 'activity'>('accolades');

  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');
  const [isVerifiedCoach, setIsVerifiedCoach] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'pitch' | 'chat'>('pitch');
  const [senderName, setSenderName] = useState('');
  const [senderSchool, setSenderSchool] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function fetchProfileAndUser() {
      const { data: athleteData } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', athleteId)
        .single();

      if (athleteData) {
        setAthlete(athleteData as AthleteProfile);
      }

      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: false });

      if (postData) {
        setPosts(postData as AthletePost[]);
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        if (session.user.id === athleteId) {
          setIsSelf(true);
        }

        const { data: cData } = await supabase.from('coaches').select('trust_level').eq('id', session.user.id).maybeSingle();
        if (cData) {
          setViewerRole('coach');
          setIsVerifiedCoach(cData.trust_level > 0);
        } else {
          const { data: aData } = await supabase.from('athletes').select('id').eq('id', session.user.id).maybeSingle();
          if (aData) {
            setViewerRole('athlete');
          }
        }
      }
      setLoading(false);
    }

    if (athleteId) {
      fetchProfileAndUser();
    }
  }, [athleteId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athlete) return;
    setIsSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        athlete_id: athlete.id,
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

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-center p-6">
        <Activity className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-3xl font-black text-slate-900 mb-2">Athlete Not Found</h1>
        <p className="text-slate-500 mb-6">This profile may have been removed or does not exist.</p>
        <button onClick={() => router.push('/')} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl">Return Home</button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      <div className="max-w-4xl mx-auto px-6 pt-10">
        
        {/* DYNAMIC BACK BUTTON */}
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>

        {/* ========================================================= */}
        {/* ==================== HERO SECTION ======================= */}
        {/* ========================================================= */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-200 shadow-xl relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-100 border-4 border-white shadow-lg rounded-full flex items-center justify-center overflow-hidden shrink-0">
              {athlete.avatar_url ? (
                <img src={athlete.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Medal className="w-16 h-16 text-slate-300" />
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                  {athlete.first_name} {athlete.last_name}
                </h1>
                {athlete.trust_level > 0 && (
                  <div className="inline-flex items-center bg-green-50 border border-green-200 px-3 py-1 rounded-full w-max mx-auto md:mx-0">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-1.5" />
                    <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Verified</span>
                  </div>
                )}
              </div>
              
              <p className="text-lg font-bold text-slate-500 mb-6 flex flex-col md:flex-row items-center gap-2 md:gap-4 justify-center md:justify-start">
                <span className="flex items-center"><MapPin className="w-5 h-5 mr-1" /> {athlete.high_school} {athlete.state ? `, ${athlete.state}` : ''}</span>
                <span className="hidden md:inline text-slate-300">•</span>
                <span>Class of {athlete.grad_year || '202X'}</span>
                <span className="hidden md:inline text-slate-300">•</span>
                <span>{athlete.gender || 'Boys'} Division</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                {!isSelf && (
                  <>
                    {viewerRole === 'coach' && isVerifiedCoach ? (
                      <button onClick={() => { setModalMode('pitch'); setIsMessageModalOpen(true); }} className="w-full sm:w-auto bg-slate-900 hover:bg-blue-600 text-white font-black py-3.5 px-8 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg">
                        <Mail className="w-5 h-5" /> Direct Pitch
                      </button>
                    ) : viewerRole === 'athlete' ? (
                      <button onClick={() => { setModalMode('chat'); setIsMessageModalOpen(true); }} className="w-full sm:w-auto bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold py-3.5 px-8 rounded-xl transition-colors flex items-center justify-center gap-2">
                        <MessageSquare className="w-5 h-5" /> Request to Chat
                      </button>
                    ) : viewerRole === 'coach' && !isVerifiedCoach ? (
                      <div className="w-full sm:w-auto bg-slate-100 text-slate-400 font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 border border-slate-200">
                        <Lock className="w-5 h-5" /> Verify to Message
                      </div>
                    ) : (
                      <Link href="/login" className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 px-8 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200">
                        <Lock className="w-5 h-5" /> Log in to Connect
                      </Link>
                    )}
                  </>
                )}
                
                <button onClick={handleCopyLink} className="w-full sm:w-auto bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                  {copySuccess ? <><CheckCircle2 className="w-5 h-5 text-green-500" /> Copied!</> : <><Share2 className="w-5 h-5" /> Share Profile</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ==================== TAB NAVIGATION ===================== */}
        {/* ========================================================= */}
        <div className="flex border-b border-slate-200 mb-8">
          <button 
            onClick={() => setActiveTab('accolades')}
            className={`px-6 py-4 font-bold text-sm sm:text-base flex items-center gap-2 border-b-4 transition-colors ${activeTab === 'accolades' ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Trophy className="w-5 h-5" /> Accolades
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-4 font-bold text-sm sm:text-base flex items-center gap-2 border-b-4 transition-colors ${activeTab === 'activity' ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Globe className="w-5 h-5" /> Activity
          </button>
        </div>

        {/* ========================================================= */}
        {/* ==================== ACCOLADES TAB ====================== */}
        {/* ========================================================= */}
        {activeTab === 'accolades' && (
          <div className="animate-in fade-in duration-300">
            {athlete.prs && athlete.prs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {athlete.prs.map((pr, index) => (
                  <div key={index} className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-colors">
                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Event</span>
                      <span className="font-black text-xl text-slate-900">{pr.event}</span>
                      {(pr.date || pr.meet) && (
                        <div className="flex items-center text-xs text-slate-500 font-medium mt-2">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> {pr.date} 
                          <span className="mx-2 text-slate-300">•</span> 
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> <span className="truncate max-w-[120px]">{pr.meet}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right pl-4 border-l border-slate-100">
                      <span className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Mark</span>
                      <span className="font-black text-3xl text-blue-600">{pr.mark}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-200 border-dashed text-center">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900 mb-1">No times recorded yet</h3>
                <p className="text-slate-500 font-medium">This athlete has not synced any official results.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ===================== ACTIVITY TAB ====================== */}
        {/* ========================================================= */}
        {activeTab === 'activity' && (
          <div className="animate-in fade-in duration-300 space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                        {athlete.avatar_url ? <img src={athlete.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <Medal className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 leading-tight">{athlete.first_name} {athlete.last_name}</h4>
                        <span className="text-xs font-bold text-slate-400">{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-slate-700 font-medium text-[15px] mb-4 whitespace-pre-wrap">{post.content}</p>
                  
                  {post.linked_pr_event && (
                    <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 px-3 py-1.5 rounded-xl shadow-sm mt-2">
                      <Trophy className="w-3.5 h-3.5 text-blue-500 mr-2" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mr-2">{post.linked_pr_event}</span>
                      <span className="text-xs font-black text-blue-600">{post.linked_pr_mark}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-slate-50 p-10 rounded-[2rem] border border-slate-200 border-dashed text-center">
                <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-black text-slate-900 mb-1">No Activity Yet</h3>
                <p className="text-slate-500 font-medium">This athlete hasn't posted any updates to the global feed.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- MESSAGING MODAL --- */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-slate-900">{modalMode === 'pitch' ? `Message ${athlete.first_name}` : `Connect with ${athlete.first_name}`}</h3>
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
                  <textarea required value={messageContent} onChange={(e) => setMessageContent(e.target.value)} rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium resize-none" placeholder={modalMode === 'pitch' ? `Hi ${athlete.first_name}...` : `Hey ${athlete.first_name}...`}></textarea>
                </div>
                <button type="submit" disabled={isSending} className={`w-full text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${modalMode === 'pitch' ? 'bg-slate-900 hover:bg-blue-600 shadow-blue-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'}`}>
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