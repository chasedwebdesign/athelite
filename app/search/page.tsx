'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MapPin, Trophy, Search, Activity, ChevronRight, BookOpen, Users, SearchIcon, TrendingUp, Landmark, SlidersHorizontal, ChevronDown, ChevronUp, DollarSign, Percent, Award, Gem } from 'lucide-react';
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
  tuition_in_state?: number;
  tuition_out_of_state?: number;
  tuition?: number; 
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); 

  // --- Featured Elite Schools Data ---
  const [topSalarySchools, setTopSalarySchools] = useState<University[]>([]);
  const [topFundingPrograms, setTopFundingPrograms] = useState<any[]>([]);

  // --- Basic Filters ---
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  
  // --- Bonus Settings (Advanced) ---
  const [schoolName, setSchoolName] = useState('');
  const [maxAcceptance, setMaxAcceptance] = useState('');
  const [tuitionType, setTuitionType] = useState('in_state');
  const [maxTuition, setMaxTuition] = useState('');
  const [sortBy, setSortBy] = useState('');

  // --- Load Initial State & Featured Elite Schools ---
  useEffect(() => {
    async function loadInitialState() {
      const savedFilters = sessionStorage.getItem('chasedSportsFilters');
      const savedResults = sessionStorage.getItem('chasedSportsResults');
      
      // FIXED: Using V3 cache keys to force the browser to dump the old broken data
      const savedTopSalary = sessionStorage.getItem('chasedSportsTopSalaryV3');
      const savedTopFunding = sessionStorage.getItem('chasedSportsTopFundingV3');

      if (savedFilters) {
        const f = JSON.parse(savedFilters);
        setSchoolName(f.schoolName || '');
        setSelectedSport(f.selectedSport || '');
        setSelectedGender(f.selectedGender || '');
        setSelectedDivision(f.selectedDivision || '');
        setSelectedState(f.selectedState || '');
        setSelectedMajor(f.selectedMajor || '');
        setMaxAcceptance(f.maxAcceptance || '');
        setTuitionType(f.tuitionType || 'in_state');
        setMaxTuition(f.maxTuition || '');
        setSortBy(f.sortBy || '');
        setHasSearched(f.hasSearched || false);
        setShowAdvanced(f.showAdvanced || false);
      }

      if (savedResults) setUniversities(JSON.parse(savedResults));

      if (savedTopSalary && savedTopFunding) {
        setTopSalarySchools(JSON.parse(savedTopSalary));
        setTopFundingPrograms(JSON.parse(savedTopFunding));
        setIsInitialized(true);
      } else {
        setLoading(true);

        // 1. Fetch Top 4 by Salary
        const { data: salaryData } = await supabase
          .from('universities')
          .select('*')
          .not('median_earnings', 'is', null)
          .order('median_earnings', { ascending: false })
          .limit(4);

        // 2. Calculate Cumulative Funding per University
        const { data: allUniFunding } = await supabase
          .from('universities')
          .select('id, name, city, state, division, programs(operating_expense)');

        let topFunding: any[] = [];
        
        if (allUniFunding) {
          const aggregated = allUniFunding.map(uni => {
            const totalBudget = uni.programs?.reduce((sum: number, p: any) => sum + (p.operating_expense || 0), 0) || 0;
            return { ...uni, total_budget: totalBudget };
          });
          
          topFunding = aggregated
            .filter(u => u.total_budget > 0)
            .sort((a, b) => b.total_budget - a.total_budget)
            .slice(0, 4);
        }

        setTopSalarySchools(salaryData || []);
        setTopFundingPrograms(topFunding);
        
        // Save to the NEW cache keys so this bug never happens again
        sessionStorage.setItem('chasedSportsTopSalaryV3', JSON.stringify(salaryData || []));
        sessionStorage.setItem('chasedSportsTopFundingV3', JSON.stringify(topFunding));
        
        setLoading(false);
        setIsInitialized(true);
      }
    }
    
    loadInitialState();
  }, [supabase]);

  // --- Auto-Save States ---
  useEffect(() => {
    if (!isInitialized) return; 
    const filters = {
      schoolName, selectedSport, selectedGender, selectedDivision, selectedState,
      selectedMajor, maxAcceptance, tuitionType, maxTuition, sortBy, hasSearched, showAdvanced
    };
    sessionStorage.setItem('chasedSportsFilters', JSON.stringify(filters));
  }, [isInitialized, schoolName, selectedSport, selectedGender, selectedDivision, selectedState, selectedMajor, maxAcceptance, tuitionType, maxTuition, sortBy, hasSearched, showAdvanced]);

  useEffect(() => {
    if (!isInitialized) return;
    sessionStorage.setItem('chasedSportsResults', JSON.stringify(universities));
  }, [isInitialized, universities]);

  async function handleSearch() {
    if (!selectedSport && !schoolName) {
      alert("Please enter a school name or select a sport to begin.");
      return;
    }

    setLoading(true);
    setHasSearched(true);

    let selectString = selectedSport || selectedGender 
      ? `*, programs!inner(sport, gender, operating_expense)` 
      : `*, programs(sport, gender, operating_expense)`;

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

    const { data, error } = await query.limit(200);

    if (error) {
      console.error('Database Error:', error.message);
      setUniversities([]);
    } else {
      setUniversities(data as unknown as University[]);
    }
    
    setLoading(false);
  }

  const mappedMajor = getUmbrellaMajor(selectedMajor);
  const showMajorHint = selectedMajor.length > 2 && mappedMajor.toLowerCase() !== selectedMajor.toLowerCase();

  // UPGRADED: Ghost School Filter Logic
  const validUniversities = useMemo(() => {
    let filtered = universities.filter((uni) => {
      const hasAcceptanceData = uni.acceptance_rate != null && uni.acceptance_rate !== '';
      const hasEarnings = uni.median_earnings != null && uni.median_earnings > 0;
      
      if (!hasAcceptanceData && !hasEarnings) return false;

      if (maxAcceptance) {
        const rateNum = parseFloat(uni.acceptance_rate?.replace('%', '') || '100');
        if (rateNum > parseFloat(maxAcceptance)) return false;
      }

      if (maxTuition) {
        const maxT = parseFloat(maxTuition);
        const schoolTuition = tuitionType === 'in_state' 
          ? (uni.tuition_in_state || uni.tuition || 0)
          : (uni.tuition_out_of_state || uni.tuition || 0);
        
        if (schoolTuition === 0 || schoolTuition > maxT) return false;
      }

      return true;
    });

    if (sortBy) {
      filtered.sort((a, b) => {
        if (sortBy.startsWith('budget')) {
          const valA = a.programs?.[0]?.operating_expense || 0;
          const valB = b.programs?.[0]?.operating_expense || 0;
          if (sortBy === 'budget_low') {
            if (valA === 0 && valB !== 0) return 1; 
            if (valB === 0 && valA !== 0) return -1;
            return valA - valB;
          }
          return valB - valA;
        }
        
        if (sortBy.startsWith('salary')) {
          const valA = a.median_earnings || 0;
          const valB = b.median_earnings || 0;
          if (sortBy === 'salary_low') {
            if (valA === 0 && valB !== 0) return 1;
            if (valB === 0 && valA !== 0) return -1;
            return valA - valB;
          }
          return valB - valA;
        }

        if (sortBy.startsWith('tuition')) {
          const valA = tuitionType === 'in_state' ? (a.tuition_in_state || a.tuition || 0) : (a.tuition_out_of_state || a.tuition || 0);
          const valB = tuitionType === 'in_state' ? (b.tuition_in_state || b.tuition || 0) : (b.tuition_out_of_state || b.tuition || 0);
          if (sortBy === 'tuition_low') {
            if (valA === 0 && valB !== 0) return 1;
            if (valB === 0 && valA !== 0) return -1;
            return valA - valB;
          }
          return valB - valA;
        }

        if (sortBy.startsWith('acceptance')) {
          const valA = parseFloat(a.acceptance_rate?.replace('%', '') || '0');
          const valB = parseFloat(b.acceptance_rate?.replace('%', '') || '0');
          if (sortBy === 'acceptance_low') {
            if (valA === 0 && valB !== 0) return 1;
            if (valB === 0 && valA !== 0) return -1;
            return valA - valB;
          }
          return valB - valA;
        }

        return 0;
      });
    }

    return filtered;
  }, [universities, maxAcceptance, maxTuition, tuitionType, sortBy]);

  const renderedCollegeCards = useMemo(() => {
    if (loading || !isInitialized) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-200 h-64 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      );
    }

    if (hasSearched && validUniversities.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed shadow-sm">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900">No programs match your exact criteria</h3>
          <p className="text-slate-500 mt-2 font-medium">Try loosening your filters or adjusting your sorting preferences.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {validUniversities.map((uni) => {
          const tuitionToUse = uni.tuition_in_state || uni.tuition;
          let roiMultiplier = null;
          if (uni.median_earnings && tuitionToUse && tuitionToUse > 0) {
            roiMultiplier = (uni.median_earnings / tuitionToUse).toFixed(1);
          }

          return (
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

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <Landmark className="w-3 h-3 mr-1" /> Acceptance
                    </div>
                    <div className="font-black text-slate-800">{uni.acceptance_rate || 'N/A'}</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-3 border border-green-100 relative">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center text-[10px] font-bold text-green-600 uppercase tracking-wider">
                        <TrendingUp className="w-3 h-3 mr-1" /> 10-Yr Salary
                      </div>
                      {roiMultiplier && (
                        <span className="text-[10px] font-black bg-green-200 text-green-800 px-1.5 py-0.5 rounded-md" title="Salary compared to In-State Tuition">
                          {roiMultiplier}x ROI
                        </span>
                      )}
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
          );
        })}
      </div>
    );
  }, [validUniversities, loading, isInitialized, hasSearched, selectedSport, selectedGender]); 

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
          
          {/* --- BASIC SETTINGS (Always Visible) --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Sport *</label>
              <select 
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
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

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Field of Study</label>
              <input 
                type="text"
                list="major-options"
                placeholder="e.g. Nursing, Finance..."
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
          </div>

          {/* Toggle for Bonus Settings */}
          <div className="mt-4 flex justify-center lg:justify-start">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors py-2"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {showAdvanced ? 'Hide Bonus Settings' : 'Show Bonus Settings'}
              {showAdvanced ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>
          </div>

          {/* --- BONUS SETTINGS (Advanced) --- */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showAdvanced ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 mt-2 border-t border-slate-100">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Specific School</label>
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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Max Acceptance %</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 pointer-events-none">
                    <Percent className="h-4 w-4 text-slate-400" />
                  </div>
                  <input 
                    type="number" 
                    placeholder="e.g. 50"
                    value={maxAcceptance}
                    onChange={(e) => setMaxAcceptance(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Max Tuition Cost</label>
                <div className="flex gap-2">
                  <select 
                    value={tuitionType}
                    onChange={(e) => setTuitionType(e.target.value)}
                    className="w-1/3 bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl px-2 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm font-semibold shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="in_state">In-State</option>
                    <option value="out_of_state">Out-State</option>
                  </select>
                  <div className="relative flex items-center w-2/3">
                    <div className="absolute left-3 pointer-events-none">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="number" 
                      placeholder="e.g. 30000"
                      value={maxTuition}
                      onChange={(e) => setMaxTuition(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl pl-8 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Sort Results By</label>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold shadow-sm appearance-none cursor-pointer transition-all"
                >
                  <option value="">Don't Sort</option>
                  
                  <optgroup label="Tuition Cost">
                    <option value="tuition_low">Lowest to Highest</option>
                    <option value="tuition_high">Highest to Lowest</option>
                  </optgroup>

                  <optgroup label="Acceptance Rate">
                    <option value="acceptance_high">Highest to Lowest</option>
                    <option value="acceptance_low">Lowest to Highest</option>
                  </optgroup>

                  <optgroup label="10-Year Salary">
                    <option value="salary_high">Highest to Lowest</option>
                    <option value="salary_low">Lowest to Highest</option>
                  </optgroup>

                  <optgroup label="Sport Budget">
                    <option value="budget_high">Highest to Lowest</option>
                    <option value="budget_low">Lowest to Highest</option>
                  </optgroup>
                </select>
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

        {/* --- DYNAMIC HOMEPAGE CONTENT --- */}
        {!hasSearched ? (
          <div className="space-y-16 animate-in fade-in duration-700">
            
            {/* ELITE FEATURE 1: Highest Salary */}
            {topSalarySchools.length > 0 && (
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center tracking-tight">
                  <Gem className="w-6 h-6 mr-3 text-emerald-500" />
                  Highest 10-Year Median Salary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {topSalarySchools.map((uni) => (
                    <div key={`salary-${uni.id}`} className="bg-gradient-to-br from-emerald-900 via-green-950 to-slate-950 border border-green-500/30 rounded-[2rem] p-6 shadow-xl shadow-green-900/20 flex flex-col h-full hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-900/40 transition-all duration-300 group">
                      <div className="flex-grow">
                        <h3 className="text-xl font-black text-white leading-tight mb-4 group-hover:text-green-300 transition-colors">
                          {uni.name}
                        </h3>
                        <div className="space-y-2 text-sm font-semibold text-slate-300 mb-6">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-green-500 mr-2" />
                            {uni.city ? `${uni.city}, ${uni.state}` : uni.state}
                          </div>
                          <div className="flex items-center">
                            <Trophy className="w-4 h-4 text-yellow-500 mr-2" />
                            {uni.division}
                          </div>
                        </div>
                        
                        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/10 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/20 blur-2xl rounded-full pointer-events-none"></div>
                          <span className="block text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1 relative z-10">10-Yr Median Salary</span>
                          <span className="text-3xl font-black text-white tracking-tighter relative z-10">{formatCurrency(uni.median_earnings)}</span>
                        </div>
                      </div>
                      
                      <Link 
                        href={`/college/${uni.id}`}
                        className="mt-6 w-full text-center text-sm font-black text-slate-900 bg-white hover:bg-green-400 px-4 py-3 rounded-xl transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ELITE FEATURE 2: Highest Total Athletic Budget */}
            {topFundingPrograms.length > 0 && (
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center tracking-tight">
                  <Award className="w-6 h-6 mr-3 text-amber-500" />
                  Largest Total Athletic Budget
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {topFundingPrograms.map((uni) => (
                    <div key={`funding-${uni.id}`} className="bg-gradient-to-br from-amber-900 via-yellow-950 to-slate-950 border border-yellow-500/30 rounded-[2rem] p-6 shadow-xl shadow-yellow-900/20 flex flex-col h-full hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-900/40 transition-all duration-300 group">
                      <div className="flex-grow">
                        <div className="inline-flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 mb-4">
                          <Activity className="w-3.5 h-3.5 text-yellow-500" />
                          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Entire Athletic Dept</span>
                        </div>
                        
                        <h3 className="text-xl font-black text-white leading-tight mb-4 group-hover:text-yellow-300 transition-colors">
                          {uni.name}
                        </h3>
                        <div className="space-y-2 text-sm font-semibold text-slate-300 mb-6">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-yellow-500 mr-2" />
                            {uni.city ? `${uni.city}, ${uni.state}` : uni.state}
                          </div>
                          <div className="flex items-center">
                            <Trophy className="w-4 h-4 text-yellow-500 mr-2" />
                            {uni.division}
                          </div>
                        </div>
                        
                        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/10 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/20 blur-2xl rounded-full pointer-events-none"></div>
                          <span className="block text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-1 relative z-10">Total Operating Budget</span>
                          <span className="text-3xl font-black text-white tracking-tighter relative z-10">{formatCurrency(uni.total_budget)}</span>
                        </div>
                      </div>
                      
                      <Link 
                        href={`/college/${uni.id}`}
                        className="mt-6 w-full text-center text-sm font-black text-slate-900 bg-white hover:bg-yellow-400 px-4 py-3 rounded-xl transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Search Results
              </h2>
              {!loading && (
                 <span className="bg-blue-50 text-blue-700 border border-blue-200 py-1.5 px-4 rounded-full text-sm font-bold shadow-sm">
                   {validUniversities.length} Programs Found
                 </span>
              )}
            </div>
            {renderedCollegeCards}
          </div>
        )}

      </div>
    </main>
  );
}