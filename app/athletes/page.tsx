'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search as SearchIcon, Medal, CheckCircle2, MapPin, Activity, Filter, ArrowUpDown } from 'lucide-react';
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
  avatar_url?: string | null; // NEW: Added avatar URL
}

// Master list of events for the dropdown
const FILTER_EVENTS = [
  'All Events', '60 Meters', '100 Meters', '200 Meters', '400 Meters', '800 Meters', '1500 Meters', '1600 Meters', 
  '1 Mile', '3000 Meters', '3200 Meters', '5000 Meters', '100m Hurdles', '110m Hurdles', '300m Hurdles', 
  '400m Hurdles', 'Shot Put', 'Discus', 'Javelin', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'
];

// List of Field Events (where a HIGHER number is better)
const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

export default function DiscoveryEngine() {
  const supabase = createClient();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('All Events');

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

  // --- THE TRACK & FIELD PARSING ALGORITHM ---
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

  // --- FILTER & SORT LOGIC ---
  let processedAthletes = athletes.filter(athlete => {
    const searchString = `${athlete.first_name} ${athlete.last_name} ${athlete.high_school}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesEvent = selectedEvent === 'All Events' || athlete.prs?.some(pr => pr.event === selectedEvent);
    return matchesSearch && matchesEvent;
  });

  if (selectedEvent !== 'All Events') {
    processedAthletes.sort((a, b) => {
      const prA = a.prs.find(pr => pr.event === selectedEvent)?.mark || '9999';
      const prB = b.prs.find(pr => pr.event === selectedEvent)?.mark || '9999';
      
      const valA = parseMarkForSorting(prA, selectedEvent);
      const valB = parseMarkForSorting(prB, selectedEvent);
      
      return valA - valB;
    });
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-md group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">
              Chased<span className="text-blue-600">Sports</span>
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
              Athlete Login
            </Link>
            <Link href="/dashboard" className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all shadow-sm">
              My Dashboard
            </Link>
          </div>
        </div>
      </nav>

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
                <div key={athlete.id} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group cursor-pointer flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      
                      {/* DYNAMIC AVATAR UI */}
                      <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        {athlete.avatar_url ? (
                          <img src={athlete.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <Medal className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                          {athlete.first_name} {athlete.last_name}
                        </h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Class of {athlete.grad_year || '202X'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-green-50 p-1.5 rounded-full border border-green-200" title="Results Verified">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  </div>

                  <div className="flex items-center text-sm font-medium text-slate-500 mb-6">
                    <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                    {athlete.high_school} {athlete.state ? `, ${athlete.state}` : ''}
                  </div>

                  <div className="mt-auto space-y-2 border-t border-slate-100 pt-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                      {selectedEvent !== 'All Events' ? 'Target Event' : 'Top Verified Marks'}
                    </span>
                    
                    {displayPRs.map((pr, idx) => (
                      <div key={idx} className={`flex items-center justify-between rounded-lg px-3 py-2 border ${selectedEvent !== 'All Events' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                        <span className={`text-xs font-bold ${selectedEvent !== 'All Events' ? 'text-blue-800' : 'text-slate-600'}`}>{pr.event}</span>
                        <span className={`text-sm font-black ${selectedEvent !== 'All Events' ? 'text-blue-700 text-lg' : 'text-blue-600'}`}>{pr.mark}</span>
                      </div>
                    ))}

                    {selectedEvent === 'All Events' && athlete.prs && athlete.prs.length > 3 && (
                      <p className="text-xs text-center text-slate-400 font-bold mt-2 pt-1">
                        + {athlete.prs.length - 3} more events
                      </p>
                    )}
                  </div>
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
    </main>
  );
}