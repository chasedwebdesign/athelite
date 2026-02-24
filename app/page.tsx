'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MapPin, Trophy, Search, Activity, ChevronRight, BookOpen, Timer, Users, SearchIcon, TrendingUp, Landmark } from 'lucide-react';
import Link from 'next/link';

interface University {
  id: string;
  name: string;
  city: string;
  state: string;
  division: string;
  student_population: string;
  majors_offered: string[];
  programs: any[];
  acceptance_rate?: string;
  median_earnings?: number;
}

function parseTimeToSeconds(timeStr: string): number | null {
  if (!timeStr || !timeStr.includes(':')) return null;
  const [minutes, seconds] = timeStr.split(':').map(Number);
  if (isNaN(minutes) || isNaN(seconds)) return null;
  return (minutes * 60) + seconds;
}

function formatCurrency(num: number | null | undefined) {
  if (!num) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

const UMBRELLA_MAP: Record<string, string> = {
  'accounting': 'Business & Marketing',
  'finance': 'Business & Marketing',
  'marketing': 'Business & Marketing',
  'business': 'Business & Marketing',
  'sports management': 'Business & Marketing',
  'nursing': 'Health Professions & Nursing',
  'pre-med': 'Biological & Biomedical Sciences',
  'pre med': 'Biological & Biomedical Sciences',
  'medicine': 'Health Professions & Nursing',
  'physical therapy': 'Health Professions & Nursing',
  'kinesiology': 'Kinesiology & Parks/Recreation',
  'exercise science': 'Kinesiology & Parks/Recreation',
  'graphic design': 'Visual & Performing Arts',
  'animation': 'Visual & Performing Arts',
  'film': 'Visual & Performing Arts',
  'art': 'Visual & Performing Arts',
  'theater': 'Visual & Performing Arts',
  'criminal justice': 'Homeland Security & Law Enforcement',
  'law': 'Legal Professions & Studies',
  'pre-law': 'Legal Professions & Studies',
  'software': 'Computer & Information Sciences',
  'computer science': 'Computer & Information Sciences',
  'it': 'Computer & Information Sciences',
  'cybersecurity': 'Computer & Information Sciences',
  'mechanical engineering': 'Engineering',
  'civil engineering': 'Engineering',
  'electrical engineering': 'Engineering',
  'aerospace': 'Engineering',
  'journalism': 'Communications & Journalism',
  'public relations': 'Communications & Journalism',
  'teaching': 'Education',
  'biology': 'Biological & Biomedical Sciences',
  'psychology': 'Psychology',
  'history': 'History',
  'english': 'English Language & Literature',
  'veterinary': 'Agriculture',
  'architecture': 'Architecture'
};

function getUmbrellaMajor(searchTerm: string): string {
  if (!searchTerm) return '';
  const term = searchTerm.toLowerCase().trim();
  if (UMBRELLA_MAP[term]) return UMBRELLA_MAP[term];
  for (const [key, umbrella] of Object.entries(UMBRELLA_MAP)) {
    if (term.includes(key)) return umbrella;
  }
  const allUmbrellas = Array.from(new Set(Object.values(UMBRELLA_MAP)));
  const directUmbrellaMatch = allUmbrellas.find(u => u.toLowerCase() === term);
  if (directUmbrellaMatch) return directUmbrellaMatch;
  return searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
}

export default function Home() {
  const supabase = createClient();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter States
  const [schoolName, setSchoolName] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  
  const [selectedEvent, setSelectedEvent] = useState('');
  const [prTime, setPrTime] = useState('');

  const isRunningSport = selectedSport === 'Cross Country' || selectedSport === 'Track & Field';

  async function handleSearch() {
    if (!selectedSport && !schoolName) {
      alert("Please enter a school name or select a sport to begin.");
      return;
    }

    let userSeconds: number | null = null;
    if (prTime && isRunningSport) {
      if (!selectedEvent) {
        alert("Please select an Event to match against your PR time.");
        return;
      }
      userSeconds = parseTimeToSeconds(prTime);
      if (!userSeconds) {
        alert("Please enter a valid PR time in MM:SS format (e.g., 15:30)");
        return;
      }
    }

    setLoading(true);
    setHasSearched(true);

    let selectString = selectedSport || selectedGender 
      ? `*, programs!inner(sport, gender)` 
      : `*, programs(sport, gender)`;

    if (userSeconds && selectedEvent) {
      selectString = `*, programs!inner(sport, gender, recruiting_standards!inner(event, target_time_seconds))`;
    }

    let query = supabase.from('universities').select(selectString);

    if (schoolName) query = query.ilike('name', `%${schoolName}%`);
    if (selectedSport) query = query.eq('programs.sport', selectedSport);
    if (selectedGender) query = query.eq('programs.gender', selectedGender);
    if (selectedDivision) query = query.eq('division', selectedDivision);
    if (selectedState) query = query.ilike('state', selectedState); 
    
    if (selectedMajor) {
      const searchMajor = getUmbrellaMajor(selectedMajor);
      query = query.contains('majors_offered', [searchMajor]); 
    }

    if (userSeconds && selectedEvent) {
      query = query.eq('programs.recruiting_standards.event', selectedEvent);
      query = query.gte('programs.recruiting_standards.target_time_seconds', userSeconds);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('Database Error:', error.message);
      setUniversities([]);
    } else {
      setUniversities(data as unknown as University[]);
    }
    
    setLoading(false);
  }

  useEffect(() => {
    async function fetchInitial() {
      setLoading(true);
      const { data } = await supabase.from('universities').select('*').limit(12);
      setUniversities(data || []);
      setLoading(false);
    }
    fetchInitial();
  }, [supabase]);

  const mappedMajor = getUmbrellaMajor(selectedMajor);
  const showMajorHint = selectedMajor.length > 2 && mappedMajor.toLowerCase() !== selectedMajor.toLowerCase();
  const isExpanded = selectedSport || schoolName;

  const renderedCollegeCards = useMemo(() => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-200 h-64 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      );
    }

    if (hasSearched && universities.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed shadow-sm">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900">No programs match your exact criteria</h3>
          <p className="text-slate-500 mt-2 font-medium">Try adjusting your PR time, division, or checking your spelling.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {universities.map((uni) => (
          <div key={uni.id} className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col h-full hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex-grow">
              <h3 className="text-xl font-black text-slate-900 leading-tight mb-5 group-hover:text-blue-600 transition-colors">
                {uni.name}
              </h3>
              
              <div className="space-y-3 text-sm font-semibold text-slate-600 mb-6">
                <div className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  {uni.city ? `${uni.city}, ${uni.state}` : uni.state}
                </div>
                <div className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-yellow-50 flex items-center justify-center mr-3">
                    <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                  </div>
                  {uni.division}
                </div>
                <div className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center mr-3">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  {uni.student_population ? `${parseInt(uni.student_population).toLocaleString()} Undergrads` : 'Population N/A'}
                </div>
              </div>

              {/* NEW: Data-Rich Dashboard Previews */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <Landmark className="w-3 h-3 mr-1" /> Acceptance
                  </div>
                  <div className="font-black text-slate-800">{uni.acceptance_rate || 'N/A'}</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                  <div className="flex items-center text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">
                    <TrendingUp className="w-3 h-3 mr-1" /> 10-Yr Salary
                  </div>
                  <div className="font-black text-green-700">{uni.median_earnings ? formatCurrency(uni.median_earnings) : 'N/A'}</div>
                </div>
              </div>

            </div>
            <div className="mt-5 pt-5 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                {uni.majors_offered ? uni.majors_offered.length : 0} Majors
              </div>
              
              <Link 
                href={`/college/${uni.id}?${new URLSearchParams({
                  ...(selectedSport && { sport: selectedSport }),
                  ...(selectedGender && { gender: selectedGender })
                }).toString()}`}
                className="text-sm font-black text-blue-600 flex items-center px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View Profile 
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  }, [universities, loading, hasSearched, selectedSport, selectedGender]); 

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans">
      <div className="relative bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-950 pt-24 pb-32 px-8 overflow-hidden rounded-b-[2.5rem] shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-sm font-bold tracking-wide mb-4">
            <Activity className="w-4 h-4 mr-2" />
            The Data-Driven Recruiting Engine
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white">
            Chased<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Sports</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Stop guessing. Instantly discover which college programs match your athletic standards and financial goals.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-24">
        {/* The Control Panel */}
        <div className="relative -mt-16 bg-white/90 backdrop-blur-2xl p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-white mb-16 transition-all duration-500">
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="space-y-2 lg:col-span-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">College Name</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="e.g. Stanford"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Sport *</label>
                <select 
                  value={selectedSport}
                  onChange={(e) => {
                    setSelectedSport(e.target.value);
                    setSelectedEvent('');
                    setPrTime('');
                  }}
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm appearance-none cursor-pointer transition-all"
                >
                  <option value="">Any Sport...</option>
                  <option value="Baseball">Baseball</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Bowling">Bowling</option>
                  <option value="Cross Country">Cross Country</option>
                  <option value="Fencing">Fencing</option>
                  <option value="Field Hockey">Field Hockey</option>
                  <option value="Football">Football</option>
                  <option value="Golf">Golf</option>
                  <option value="Gymnastics">Gymnastics</option>
                  <option value="Ice Hockey">Ice Hockey</option>
                  <option value="Lacrosse">Lacrosse</option>
                  <option value="Soccer">Soccer</option>
                  <option value="Softball">Softball</option>
                  <option value="Swimming and Diving (combined)">Swimming & Diving</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Track & Field">Track & Field</option>
                  <option value="Volleyball">Volleyball</option>
                  <option value="Water Polo">Water Polo</option>
                  <option value="Wrestling">Wrestling</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Gender</label>
                <select 
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm appearance-none cursor-pointer transition-all"
                >
                  <option value="">Any</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Division</label>
                <select 
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm appearance-none cursor-pointer transition-all"
                >
                  <option value="">Any Division</option>
                  <option value="NCAA D1">NCAA D1</option>
                  <option value="NCAA D2">NCAA D2</option>
                  <option value="NCAA D3">NCAA D3</option>
                  <option value="NAIA">NAIA</option>
                  <option value="Community College (JUCO)">Community College (JUCO)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">State</label>
                <input 
                  type="text" 
                  placeholder="e.g. OR, CA, TX"
                  maxLength={2}
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            {/* Advanced Filters Dashboard Section */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 mt-6 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Field of Study</label>
                  <input 
                    type="text"
                    list="major-options"
                    placeholder="e.g. Nursing, Finance, Art..."
                    value={selectedMajor}
                    onChange={(e) => setSelectedMajor(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                  />
                  <div className="h-4 pl-1">
                    {showMajorHint && (
                      <p className="text-[11px] font-bold text-blue-500 animate-pulse">
                        Searching category: {mappedMajor}
                      </p>
                    )}
                  </div>
                  <datalist id="major-options">
                    <option value="Agriculture" />
                    <option value="Architecture" />
                    <option value="Biological & Biomedical Sciences" />
                    <option value="Business & Marketing" />
                    <option value="Communications & Journalism" />
                    <option value="Computer & Information Sciences" />
                    <option value="Education" />
                    <option value="Engineering" />
                    <option value="English Language & Literature" />
                    <option value="Health Professions & Nursing" />
                    <option value="Homeland Security & Law Enforcement" />
                    <option value="Kinesiology & Parks/Recreation" />
                    <option value="Legal Professions & Studies" />
                    <option value="Mathematics & Statistics" />
                    <option value="Physical Sciences" />
                    <option value="Psychology" />
                    <option value="Social Sciences" />
                    <option value="Visual & Performing Arts" />
                  </datalist>
                </div>

                <div className={`space-y-2 transition-opacity duration-300 ${isRunningSport ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Event</label>
                  <select 
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    disabled={!isRunningSport}
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm appearance-none cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <option value="">Select Event...</option>
                    {selectedSport === 'Cross Country' ? (
                      <option value="5K">5K (XC)</option>
                    ) : (
                      <>
                        <option value="1600m">1600m (Track)</option>
                        <option value="3200m">3200m (Track)</option>
                        <option value="800m">800m (Track)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className={`space-y-2 transition-opacity duration-300 ${isRunningSport ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Your PR Time</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 pointer-events-none">
                      <Timer className="h-5 w-5 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="e.g. 15:30"
                      disabled={!isRunningSport}
                      value={prTime}
                      onChange={(e) => setPrTime(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm placeholder:font-normal placeholder:text-slate-400 disabled:opacity-50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-6 flex justify-end pt-6 border-t border-slate-100">
            <button 
              onClick={handleSearch}
              disabled={(!selectedSport && !schoolName) || loading}
              className="group bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white px-10 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center"
            >
              {loading ? 'Scanning Database...' : (
                <>
                  <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Search Programs
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {hasSearched ? 'Search Results' : 'Featured Programs'}
          </h2>
          {hasSearched && !loading && (
             <span className="bg-blue-50 text-blue-700 border border-blue-200 py-1.5 px-4 rounded-full text-sm font-bold shadow-sm">
               {universities.length} Programs Found
             </span>
          )}
        </div>

        {renderedCollegeCards}

      </div>
    </main>
  );
}