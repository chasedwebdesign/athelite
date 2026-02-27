'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search as SearchIcon, Medal, CheckCircle2, MapPin, Activity, Filter, ArrowUpDown, Mail, X, Send } from 'lucide-react';
import Link from 'next/link';

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  high_school: string;
  state: string;
  grad_year: number;
  trust_level: number;
  prs: { event: string; mark: string; date?: string; meet?: string }[];
  avatar_url?: string | null;
  tier?: { name: string; classes: string }; // NEW: Tier object for the Regal Badge
}

const FILTER_EVENTS = [
  'All Events', '60 Meters', '100 Meters', '200 Meters', '400 Meters', '800 Meters', '1500 Meters', '1600 Meters', 
  '1 Mile', '3000 Meters', '3200 Meters', '5000 Meters', '100m Hurdles', '110m Hurdles', '300m Hurdles', 
  '400m Hurdles', 'Shot Put', 'Discus', 'Javelin', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'
];

const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

export default function DiscoveryEngine() {
  const supabase = createClient();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('All Events');

  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [senderName, setSenderName] = useState('');
  const [senderSchool, setSenderSchool] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    async function fetchAthletes() {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .gt('trust_level', 0) 
        .order('created_at', { ascending: false });

      if (data) setAthletes(data as Athlete[]);
      setLoading(false);
    }
    fetchAthletes();
  }, [supabase]);

  const parseMarkForSorting = (mark: string, event: string): number => {
    const cleanMark = mark.replace(/[a-zA-Z]/g, '').trim();
    const isField = FIELD_EVENTS.includes(event);

    if (cleanMark.includes("'")) {
      const parts = cleanMark.split("'");
      const feet = parseFloat(parts[0]) || 0;
      const inches = parseFloat(parts[1]?.replace('"', '')) || 0;
      const totalInches = (feet * 12) + inches;
      return isField ? -totalInches : totalInches; 
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

  // --- FILTER & TIER CALCULATION ---
  let processedAthletes = athletes.filter(athlete => {
    const searchString = `${athlete.first_name} ${athlete.last_name} ${athlete.high_school}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesEvent = selectedEvent === 'All Events' || athlete.prs?.some(pr => pr.event === selectedEvent);
    return matchesSearch && matchesEvent;
  });

  if (selectedEvent !== 'All Events') {
    // 1. Sort athletes by this specific event
    processedAthletes.sort((a, b) => {
      const prA = a.prs.find(pr => pr.event === selectedEvent)?.mark || '9999';
      const prB = b.prs.find(pr => pr.event === selectedEvent)?.mark || '9999';
      return parseMarkForSorting(prA, selectedEvent) - parseMarkForSorting(prB, selectedEvent);
    });

    // 2. Assign Regal Tiers based on their rank in this view
    const total = processedAthletes.length;
    processedAthletes.forEach((athlete, index) => {
      const percentile = index / total;
      
      if (percentile <= 0.01 || index === 0) {
        athlete.tier = { name: 'LEGEND', classes: 'legend-badge' };
      } else if (percentile <= 0.05) {
        athlete.tier = { name: 'GRANDMASTER', classes: 'bg-slate-900 text-slate-100 border border-slate-700 shadow-md' };
      } else if (percentile <= 0.15) {
        athlete.tier = { name: 'MASTER', classes: 'bg-purple-100 text-purple-800 border border-purple-300' };
      } else if (percentile <= 0.30) {
        athlete.tier = { name: 'ELITE', classes: 'bg-blue-100 text-blue-800 border border-blue-300' };
      } else if (percentile <= 0.50) {
        athlete.tier = { name: 'CONTENDER', classes: 'bg-emerald-100 text-emerald-800 border border-emerald-300' };
      } else if (percentile <= 0.75) {
        athlete.tier = { name: 'CHALLENGER', classes: 'bg-orange-100 text-orange-800 border border-orange-300' };
      } else {
        athlete.tier = { name: 'PROSPECT', classes: 'bg-slate-100 text-slate-600 border border-slate-300' };
      }
    });
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete) return;
    
    setIsSending(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          athlete_id: selectedAthlete.id,
          sender_name: senderName,
          sender_school: senderSchool,
          sender_email: senderEmail,
          content: messageContent
        });

      if (error) throw error;

      setSendSuccess(true);
      
      setTimeout(() => {
        setSelectedAthlete(null);
        setSendSuccess(false);
        setSenderName('');
        setSenderSchool('');
        setSenderEmail('');
        setMessageContent('');
      }, 2000);

    } catch (error: any) {
      alert(`Failed to send message: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      
      {/* CUSTOM CSS FOR THE LEGEND SHIMMER */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .legend-badge {
          background: linear-gradient(90deg, #FFDF00 0%, #FFF8B0 20%, #FFDF00 40%, #FFF8B0 60%, #FFDF00 80%);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          color: #714200;
          border: 1px solid #FDE047;
          box-shadow: 0 0 10px rgba(253, 224, 71, 0.4);
          font-weight: 900;
        }
      `}} />

      <div className="max-w-7xl mx-auto px-6 pt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Discovery Engine</h1>
            <p className="text-slate-500 font-medium text-lg">Find and recruit verified high school track & field athletes.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full sm:w-48 appearance-none bg-white border border-slate-200 text-slate-900 rounded-2xl pl-10 pr-10 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold shadow-sm cursor-pointer"
              >
                {FILTER_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <ArrowUpDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="relative flex-grow sm:w-72">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search name or school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold animate-pulse">Scanning database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedAthletes.map((athlete) => {
              const targetPR = selectedEvent !== 'All Events' ? athlete.prs.find(pr => pr.event === selectedEvent) : null;
              const displayPRs = targetPR ? [targetPR] : (athlete.prs || []).slice(0, 3);

              return (
                <div key={athlete.id} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col h-full relative overflow-hidden group">
                  
                  {/* --- REGAL TIER BADGE --- */}
                  {athlete.tier && selectedEvent !== 'All Events' && (
                    <div className={`absolute top-5 right-5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase ${athlete.tier.classes}`}>
                      {athlete.tier.name}
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        {athlete.avatar_url ? (
                          <img src={athlete.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <Medal className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        {/* Added pr-20 to avoid text overlapping with the absolute positioned badge */}
                        <h3 className="font-black text-lg text-slate-900 pr-20 group-hover:text-blue-600 transition-colors">
                          {athlete.first_name} {athlete.last_name}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Class of {athlete.grad_year || '202X'}
                        </p>
                      </div>
                    </div>
                    {/* Hide the little green verified check if the big Regal Badge is showing, keeps UI clean */}
                    {(!athlete.tier || selectedEvent === 'All Events') && (
                      <div className="bg-green-50 p-1.5 rounded-full border border-green-200" title="Results Verified">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center text-sm font-medium text-slate-500 mb-6">
                    <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                    {athlete.high_school} {athlete.state ? `, ${athlete.state}` : ''}
                  </div>

                  <div className="mt-auto space-y-2 border-t border-slate-100 pt-4 mb-5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                      {selectedEvent !== 'All Events' ? 'Target Event' : 'Top Verified Marks'}
                    </span>
                    
                    {displayPRs.map((pr, idx) => (
                      <div key={idx} className={`flex items-center justify-between rounded-lg px-3 py-2 border ${selectedEvent !== 'All Events' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                        <span className={`text-xs font-bold ${selectedEvent !== 'All Events' ? 'text-blue-800' : 'text-slate-600'}`}>{pr.event}</span>
                        <span className={`text-sm font-black ${selectedEvent !== 'All Events' ? 'text-blue-700 text-lg' : 'text-blue-600'}`}>{pr.mark}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setSelectedAthlete(athlete)}
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Mail className="w-4 h-4" /> Message Athlete
                  </button>

                </div>
              );
            })}

            {processedAthletes.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-slate-200 border-dashed">
                <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-900 mb-2">No athletes found</h3>
                <p className="text-slate-500 font-medium">Try adjusting your event or search terms.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- MESSAGING MODAL OVERLAY --- */}
      {selectedAthlete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-slate-900">Message {selectedAthlete.first_name}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Direct Pitch</p>
              </div>
              <button 
                onClick={() => setSelectedAthlete(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {sendSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-2">Pitch Sent!</h4>
                <p className="text-slate-500 font-medium">Your message has been securely delivered to their dashboard.</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Your Name</label>
                    <input required type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium text-slate-900" placeholder="Coach Smith" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">University / Program</label>
                    <input required type="text" value={senderSchool} onChange={(e) => setSenderSchool(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium text-slate-900" placeholder="Oregon State" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Coach Email</label>
                  <input required type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium text-slate-900" placeholder="coach@university.edu" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">The Pitch</label>
                  <textarea required value={messageContent} onChange={(e) => setMessageContent(e.target.value)} rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium text-slate-900 resize-none" placeholder={`Hi ${selectedAthlete.first_name}, I saw your recent PR and we'd love to get you on a visit...`}></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSending}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
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