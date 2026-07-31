import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, Trophy, Users, Globe, Zap, Award, Gem, Shield,
  BarChart3, Crown, TrendingUp, Landmark, Sparkles, Activity
} from 'lucide-react';

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface CollegeSafetyNetData {
  id: string | number;
  state: string;
  median_earnings: number | null;
  tuition_in_state: number | null;
  acceptance_rate: string | number | null;
}

// ==========================================
// ROUTE CONFIGURATION
// ==========================================
export const revalidate = 86400; // Cache for 24 hours on the Edge
export const dynamicParams = true; 

// ==========================================
// UTILITY FUNCTIONS (Server-Side Safe)
// ==========================================
function formatCurrency(num: number | null | undefined) {
  if (!num) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

function formatTimeSeconds(totalSeconds: number | null) {
  if (!totalSeconds) return 'N/A';
  const m = Math.floor(totalSeconds / 60);
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getBudgetTier(expense: number | null, sportName: string) {
  if (!expense || expense === 0) return null;
  
  let t5 = 2500000, t4 = 1000000, t3 = 400000, t2 = 150000;

  if (sportName.includes('Football')) {
    t5 = 15000000; t4 = 5000000; t3 = 2000000; t2 = 500000;
  } else if (sportName.includes('Basketball')) {
    t5 = 5000000; t4 = 2000000; t3 = 750000; t2 = 250000;
  } else if (sportName.includes('Track') || sportName.includes('Cross Country')) {
    t5 = 1500000; t4 = 800000; t3 = 300000; t2 = 100000;
  }

  if (expense >= t5) {
    return { 
      level: 5, label: "Tier 5: Legendary", 
      desc: "Blank-check facilities, maxed out scholarships, and elite travel.",
      bgClass: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200",
      textAccent: "text-amber-700", barColor: "bg-amber-500", glow: "shadow-[0_0_40px_rgba(251,191,36,0.15)]", Icon: Award 
    };
  }
  if (expense >= t4) {
    return { 
      level: 4, label: "Tier 4: Elite", 
      desc: "Premium financial backing. Extensive scholarships and state-of-the-art gear.",
      bgClass: "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200",
      textAccent: "text-purple-700", barColor: "bg-purple-500", glow: "shadow-[0_0_40px_rgba(168,85,247,0.15)]", Icon: Gem 
    };
  }
  if (expense >= t3) {
    return { 
      level: 3, label: "Tier 3: Competitive", 
      desc: "Solid program budget. Healthy mix of athletic aid and quality equipment.",
      bgClass: "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200",
      textAccent: "text-blue-700", barColor: "bg-blue-500", glow: "shadow-[0_0_40px_rgba(59,130,246,0.15)]", Icon: Zap 
    };
  }
  if (expense >= t2) {
    return { 
      level: 2, label: "Tier 2: Developmental", 
      desc: "Building program. Limited athletic aid, standard gear allocations.",
      bgClass: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200",
      textAccent: "text-emerald-700", barColor: "bg-emerald-500", glow: "shadow-[0_0_40px_rgba(16,185,129,0.15)]", Icon: TrendingUp 
    };
  }
  
  return { 
    level: 1, label: "Tier 1: Foundational", 
    desc: "Primarily walk-on driven. Minimal athletic financial aid or extensive travel budget.",
    bgClass: "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200",
    textAccent: "text-slate-700", barColor: "bg-slate-400", glow: "shadow-[0_0_40px_rgba(148,163,184,0.15)]", Icon: Shield 
  };
}

// ==========================================
// SSG & SEO GENERATION
// ==========================================
export async function generateStaticParams() {
  const supabase = createClient();

  const { data: universities } = await supabase.from('universities').select('id');
  
  // Explicitly typing uni resolves the map error
  return (universities || []).map((uni: { id: string | number }) => ({ 
    id: uni.id.toString() 
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = createClient();

  const { data: university } = await supabase
    .from('universities')
    .select('name, city, state, division, tuition_in_state')
    .eq('id', resolvedParams.id)
    .single();

  if (!university) {
    return { title: 'College Directory | ChasedSports' };
  }

  const inStateCost = university.tuition_in_state ? formatCurrency(university.tuition_in_state) : 'Contact Admissions';

  return {
    title: `How Much Is ${university.name} Tuition? (2026 Rankings & Recruiting)`,
    description: `In-state tuition at ${university.name} is ${inStateCost}. See national & state rankings, athletic recruiting standards, average scholarships, acceptance rates, and alumni ROI.`,
    alternates: { canonical: `https://www.chasedsports.com/college/${resolvedParams.id}` },
    openGraph: {
      title: `${university.name} Athletics & State/National Rankings`,
      description: `Target recruiting standards, national rankings, state benchmarks, and ROI stats for ${university.name}.`,
      siteName: 'ChasedSports',
      type: 'website',
    }
  };
}

// ==========================================
// MAIN SERVER COMPONENT
// ==========================================
export default async function CollegePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ sport?: string; gender?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const supabase = createClient();

  // 1. Fetch Target University
  const { data: collegeData, error: uniError } = await supabase
    .from('universities')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (uniError || !collegeData) {
    notFound();
  }

  // 2. Fetch Full National Dataset (Bypassing PostgREST 1000-Row Limit via Parallel Range Queries)
  const [c1, c2, c3, c4, stateRes] = await Promise.all([
    supabase.from('universities').select('id, state, median_earnings, tuition_in_state, acceptance_rate').range(0, 999),
    supabase.from('universities').select('id, state, median_earnings, tuition_in_state, acceptance_rate').range(1000, 1999),
    supabase.from('universities').select('id, state, median_earnings, tuition_in_state, acceptance_rate').range(2000, 2999),
    supabase.from('universities').select('id, state, median_earnings, tuition_in_state, acceptance_rate').range(3000, 3999),
    supabase.from('universities').select('id, state, median_earnings, tuition_in_state, acceptance_rate').ilike('state', collegeData.state)
  ]);

  // Typing these arrays natively fixes the parameter 'u' implicitly has 'any' type in the safety net block
  const universitiesList: CollegeSafetyNetData[] = [
    ...(c1.data || []),
    ...(c2.data || []),
    ...(c3.data || []),
    ...(c4.data || [])
  ];

  const stateUniversitiesList: CollegeSafetyNetData[] = stateRes.data || [];

  // Safety net: Inject target college into lists if missing
  if (!universitiesList.some(u => String(u.id).trim().toLowerCase() === String(collegeData.id).trim().toLowerCase())) {
    universitiesList.push({
      id: collegeData.id, state: collegeData.state, median_earnings: collegeData.median_earnings,
      tuition_in_state: collegeData.tuition_in_state, acceptance_rate: collegeData.acceptance_rate
    });
  }
  if (!stateUniversitiesList.some(u => String(u.id).trim().toLowerCase() === String(collegeData.id).trim().toLowerCase())) {
    stateUniversitiesList.push({
      id: collegeData.id, state: collegeData.state, median_earnings: collegeData.median_earnings,
      tuition_in_state: collegeData.tuition_in_state, acceptance_rate: collegeData.acceptance_rate
    });
  }

  // --- PARSING HELPERS ---
  const matchStr = (a: string | number | null | undefined, b: string | number | null | undefined) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  
  const cleanNum = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === '') return null;
    const num = Number(String(val).replace(/[^0-9.-]+/g,""));
    return isNaN(num) ? null : num;
  };

  const parseRate = (r: string | number | null) => {
    if (!r) return 100;
    const num = parseFloat(String(r).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 100 : num;
  };

  const getRank = (sortedArray: CollegeSafetyNetData[], targetId: string) => {
    const index = sortedArray.findIndex(u => matchStr(u.id, targetId));
    return index !== -1 ? index + 1 : null;
  };

  // A. Alumni Salary Ranking
  const sortedSalaryNational = [...universitiesList]
    .filter(u => cleanNum(u.median_earnings) !== null && cleanNum(u.median_earnings)! > 0)
    .sort((a, b) => cleanNum(b.median_earnings)! - cleanNum(a.median_earnings)!);
    
  const sortedSalaryState = [...stateUniversitiesList]
    .filter(u => cleanNum(u.median_earnings) !== null && cleanNum(u.median_earnings)! > 0)
    .sort((a, b) => cleanNum(b.median_earnings)! - cleanNum(a.median_earnings)!);
    
  let salaryRankNational = getRank(sortedSalaryNational, collegeData.id);
  const salaryRankState = getRank(sortedSalaryState, collegeData.id);

  // B. Tuition Cost Ranking
  const sortedTuitionNational = [...universitiesList]
    .filter(u => cleanNum(u.tuition_in_state) !== null && cleanNum(u.tuition_in_state)! > 0)
    .sort((a, b) => cleanNum(a.tuition_in_state)! - cleanNum(b.tuition_in_state)!);
    
  const sortedTuitionState = [...stateUniversitiesList]
    .filter(u => cleanNum(u.tuition_in_state) !== null && cleanNum(u.tuition_in_state)! > 0)
    .sort((a, b) => cleanNum(a.tuition_in_state)! - cleanNum(b.tuition_in_state)!);
    
  let tuitionRankNational = getRank(sortedTuitionNational, collegeData.id);
  const tuitionRankState = getRank(sortedTuitionState, collegeData.id);

  // C. Acceptance Rate Ranking
  const sortedSelectivityNational = [...universitiesList]
    .filter(u => u.acceptance_rate != null && u.acceptance_rate !== '')
    .sort((a, b) => parseRate(a.acceptance_rate) - parseRate(b.acceptance_rate));
    
  const sortedSelectivityState = [...stateUniversitiesList]
    .filter(u => u.acceptance_rate != null && u.acceptance_rate !== '')
    .sort((a, b) => parseRate(a.acceptance_rate) - parseRate(b.acceptance_rate));
    
  let selectivityRankNational = getRank(sortedSelectivityNational, collegeData.id);
  const selectivityRankState = getRank(sortedSelectivityState, collegeData.id);

  // Clean bounds check for hardcoded totals
  if (salaryRankNational && salaryRankNational > 2819) salaryRankNational = 2819;
  if (tuitionRankNational && tuitionRankNational > 2819) tuitionRankNational = 2819;
  if (selectivityRankNational && selectivityRankNational > 2819) selectivityRankNational = 2819;

  // UI Render Helpers for Clean Rankings (XX / XX format)
  const renderRankRow = (label: string, rank: number | null, total: number) => (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className="text-[13px] font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 shadow-sm tracking-wide">
        {rank !== null && total > 0 ? `#${rank.toLocaleString()} / ${total.toLocaleString()}` : 'N/A'}
      </span>
    </div>
  );

  const renderPercentileBar = (rank: number | null, total: number, colorClass: string, shadowClass: string) => {
    if (rank === null || total === 0) return null;
    const percentile = Math.max(1, Math.round((rank / total) * 100));
    const fillWidth = Math.max(5, 100 - percentile); 
    
    return (
      <div className="pt-4 border-t border-slate-100 mt-5">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Percentile Range</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${colorClass}`}>
            Top {percentile}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60 shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass.replace('text-', 'bg-')} ${shadowClass}`} 
            style={{ width: `${fillWidth}%` }}
          />
        </div>
      </div>
    );
  };

  // 3. Fetch & Filter Programs Server-Side
  let progQuery = supabase
    .from('programs')
    .select(`*, recruiting_standards (*)`)
    .eq('university_id', resolvedParams.id);

  if (resolvedSearchParams.sport) progQuery = progQuery.eq('sport', resolvedSearchParams.sport);
  if (resolvedSearchParams.gender) progQuery = progQuery.eq('gender', resolvedSearchParams.gender);

  const { data: programs } = await progQuery;
  const isFiltered = !!(resolvedSearchParams.sport || resolvedSearchParams.gender);
  const hasTuition = collegeData.tuition_in_state || collegeData.tuition_out_of_state;
  const baseTuition = collegeData.tuition_in_state || collegeData.tuition_out_of_state || 0;

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-32 selection:bg-blue-500 selection:text-white">
      {/* ========================================================= */}
      {/* HERO SECTION                                              */}
      {/* ========================================================= */}
      <div className="relative bg-white pt-16 pb-32 px-8 overflow-hidden rounded-b-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border-b border-slate-200">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-400/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <Link 
              href="/search" 
              className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-5 py-2.5 rounded-full border border-blue-100 hover:bg-blue-100 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Link>

            {isFiltered && (
              <Link 
                href={`/college/${resolvedParams.id}`}
                className="inline-flex items-center text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors bg-slate-100 px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-200 shadow-sm"
              >
                View All {collegeData.majors_offered?.length || 'Athletic'} Programs
              </Link>
            )}
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-8 leading-tight">
            {collegeData.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-slate-600 font-semibold text-sm md:text-base">
            <div className="flex items-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
              {collegeData.city ? `${collegeData.city}, ${collegeData.state}` : collegeData.state}
            </div>
            <div className="flex items-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
              <Trophy className="w-4 h-4 mr-2 text-amber-500" />
              {collegeData.division}
            </div>
            
            {collegeData.student_population && (
              <div className="flex items-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                <Users className="w-4 h-4 mr-2 text-purple-500" />
                {parseInt(collegeData.student_population).toLocaleString()} Students
              </div>
            )}

            {collegeData.website && (
              <a 
                href={collegeData.website.startsWith('http') ? collegeData.website : `https://${collegeData.website}`}
                target="_blank"
                rel="noopener noreferrer" 
                className="flex items-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
              >
                <Globe className="w-4 h-4 mr-2 text-cyan-500" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-20 space-y-10">
        
        {/* ========================================================= */}
        {/* 1. INSTITUTIONAL OVERVIEW (Academics, Cost, ROI)          */}
        {/* ========================================================= */}
        <div className="space-y-8">
          {/* Basic Academics & Cost */}
          {(hasTuition || collegeData.acceptance_rate) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hasTuition && (
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="bg-blue-100 p-3 rounded-2xl shadow-inner">
                      <Landmark className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Financial Profile</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-5 tracking-tight">How much is tuition at {collegeData.name}?</h2>
                  <div className="space-y-4">
                    {collegeData.tuition_in_state && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <span className="text-slate-500 font-bold">In-State Tuition</span>
                        <span className="text-2xl font-black text-slate-900">{formatCurrency(collegeData.tuition_in_state)}</span>
                      </div>
                    )}
                    {collegeData.tuition_out_of_state && (
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-500 font-bold">Out-of-State Tuition</span>
                        <span className="text-2xl font-black text-slate-900">{formatCurrency(collegeData.tuition_out_of_state)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {collegeData.acceptance_rate && (
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-center text-center">
                  <h2 className="text-xl font-black text-slate-900 mb-6">What is the acceptance rate at {collegeData.name}?</h2>
                  <div className="bg-slate-50 w-full rounded-3xl p-8 border border-slate-100 shadow-inner">
                    <span className="block text-sm font-black text-slate-400 mb-3 uppercase tracking-widest">Acceptance Rate</span>
                    <span className="text-6xl font-black text-slate-900 tracking-tighter">{collegeData.acceptance_rate}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 10-Yr Salary ROI Card */}
          {collegeData.median_earnings && (
            <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-green-100 p-3.5 rounded-2xl shadow-inner">
                    <TrendingUp className="w-7 h-7 text-green-600" />
                  </div>
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Return on Investment</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">What are the post-graduate earnings for {collegeData.name} alumni?</h2>
                <p className="text-slate-500 font-medium leading-relaxed max-w-lg">
                  The median salary of alumni 10 years after enrolling is <strong>{formatCurrency(collegeData.median_earnings)}</strong>. This metric serves as a powerful indicator of the networking opportunities, degree strength, and long-term financial security provided by this institution.
                </p>
              </div>
              <div className="bg-green-50 border border-green-100 p-8 rounded-3xl text-center shrink-0 w-full md:w-auto shadow-sm">
                <span className="block text-sm font-bold text-green-600 mb-2 uppercase tracking-wider">10-Year Median Salary</span>
                <span className="text-5xl font-black text-green-700 tracking-tighter">{formatCurrency(collegeData.median_earnings)}</span>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 2. ATHLETIC PROGRAMS (Recruiting Standards & Budget)      */}
        {/* ========================================================= */}
        <div>
          {(!programs || programs.length === 0) && (
            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No programs match this filter</h3>
              <p className="text-slate-500 font-medium mb-6">This school does not offer this specific sport or gender combination.</p>
              <Link 
                href={`/college/${resolvedParams.id}`}
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/30"
              >
                View All Programs
              </Link>
            </div>
          )}

          <div className="space-y-16">
            {programs?.map((program: any) => {
              const budget = program.operating_expense || program.budget;
              const tier = getBudgetTier(budget, program.sport);
              
              let estimatedRides = null;
              if (budget && baseTuition > 0) {
                estimatedRides = Math.floor(budget / baseTuition);
              }

              return (
                <div key={program.id} className="space-y-8">
                  
                  {/* TOP: RECRUITING STANDARDS */}
                  {program.recruiting_standards?.length > 0 && (
                    <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                      <div className="mb-10 pb-8 border-b border-slate-100 text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                          What are the athletic recruiting standards for {collegeData.name}?
                        </h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                          These represent estimated divisional averages. Coaches often flex these times based on your academic profile, progression trajectory, and current roster needs.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {program.recruiting_standards.map((standard: any) => (
                          <div key={standard.id} className="group p-8 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 rounded-[2rem] transition-all duration-300 shadow-sm hover:shadow-md">
                            <span className="block font-black text-2xl text-slate-800 tracking-tight mb-6 text-center">{standard.event}</span>
                            
                            <div className="space-y-4">
                              <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Recruit Target</span>
                                <span className="font-black text-3xl text-blue-600 group-hover:scale-105 transition-transform drop-shadow-sm">
                                  {formatTimeSeconds(standard.target_time_seconds)}
                                </span>
                              </div>

                              {standard.walk_on_time_seconds && (
                                <div className="flex justify-between items-center px-5 py-2">
                                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Walk-On Target</span>
                                  <span className="font-black text-xl text-slate-600">
                                    {formatTimeSeconds(standard.walk_on_time_seconds)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BOTTOM: BUDGET TIER CARD */}
                  {tier && (
                    <div className={`relative overflow-hidden rounded-[2.5rem] border p-10 md:p-14 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all ${tier.bgClass} ${tier.glow}`}>
                      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/40 rounded-full blur-3xl pointer-events-none"></div>
                      
                      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-6">
                          <div className="inline-flex items-center space-x-3 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white shadow-sm">
                            <tier.Icon className={`w-5 h-5 ${tier.textAccent}`} />
                            <span className={`text-sm font-black tracking-widest uppercase ${tier.textAccent}`}>
                              {tier.label}
                            </span>
                          </div>
                          
                          <div>
                            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">
                              {program.gender} {program.sport}
                            </h3>
                            <p className="text-slate-600 font-medium max-w-md text-lg leading-relaxed">
                              {tier.desc}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-md border border-white rounded-3xl p-8 shrink-0 w-full md:w-auto text-center shadow-md">
                          <span className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Operating Budget</span>
                          <span className={`block text-5xl font-black tracking-tighter mb-6 ${tier.textAccent}`}>
                            {formatCurrency(budget)}
                          </span>
                          
                          {estimatedRides !== null && estimatedRides > 0 && (
                            <div className="bg-white/80 rounded-xl p-4 border border-white shadow-sm">
                              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Budget Power</span>
                              <span className="text-slate-700 font-bold">~{estimatedRides} In-State Full Rides</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative z-10 mt-10 flex gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div 
                            key={i} 
                            className={`h-3 md:h-4 flex-1 rounded-full transition-all duration-700 ${
                              i <= tier.level ? `${tier.barColor} shadow-md` : 'bg-white/40 border border-black/5'
                            }`} 
                          />
                        ))}
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. RANKINGS MATRIX (Benchmarks & Percentiles - Bottom)    */}
        {/* ========================================================= */}
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-100 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black uppercase tracking-widest mb-2 shadow-sm">
                <BarChart3 className="w-3.5 h-3.5" /> Benchmarks & Percentiles
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Institutional Rankings</h2>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                Overall placement across the country
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl shrink-0 flex items-center gap-3 shadow-inner">
              <Crown className="w-6 h-6 text-amber-500 drop-shadow-sm" />
              <div>
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Home Region</span>
                <span className="text-sm font-black text-slate-800">{collegeData.state} Conference Tier</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            
            {/* 1. SALARY / ROI RANK CARD */}
            <div className="bg-white border border-slate-200 hover:border-emerald-300 transition-all rounded-3xl p-6 flex flex-col justify-between group shadow-lg shadow-slate-200/50">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl shadow-inner">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shadow-sm">
                    Alumni ROI
                  </span>
                </div>
                
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-1">Post-Grad Salary</h3>
                <p className="text-2xl font-black text-slate-900 mb-6 tracking-tight">
                  {collegeData.median_earnings ? formatCurrency(collegeData.median_earnings) : 'N/A'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {renderRankRow('National Salary Rank', salaryRankNational, 2819)}
                {renderRankRow(`State Salary Rank`, salaryRankState, sortedSalaryState.length)}
                {renderPercentileBar(salaryRankNational, 2819, 'text-emerald-500', 'shadow-[0_0_10px_rgba(16,185,129,0.3)]')}
              </div>
            </div>

            {/* 2. TUITION COST VALUE RANK CARD */}
            <div className="bg-white border border-slate-200 hover:border-blue-300 transition-all rounded-3xl p-6 flex flex-col justify-between group shadow-lg shadow-slate-200/50">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl shadow-inner">
                    <Landmark className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 shadow-sm">
                    Tuition Cost
                  </span>
                </div>
                
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-1">In-State Cost</h3>
                <p className="text-2xl font-black text-slate-900 mb-6 tracking-tight">
                  {collegeData.tuition_in_state ? formatCurrency(collegeData.tuition_in_state) : 'N/A'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {renderRankRow('National Cost Rank', tuitionRankNational, 2819)}
                {renderRankRow(`State Cost Rank`, tuitionRankState, sortedTuitionState.length)}
                {renderPercentileBar(tuitionRankNational, 2819, 'text-blue-500', 'shadow-[0_0_10px_rgba(59,130,246,0.3)]')}
              </div>
            </div>

            {/* 3. SELECTIVITY / ACCEPTANCE RANK CARD */}
            <div className="bg-white border border-slate-200 hover:border-purple-300 transition-all rounded-3xl p-6 flex flex-col justify-between group shadow-lg shadow-slate-200/50">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-xl shadow-inner">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 shadow-sm">
                    Selectivity
                  </span>
                </div>
                
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-1">Acceptance Rate</h3>
                <p className="text-2xl font-black text-slate-900 mb-6 tracking-tight">
                  {collegeData.acceptance_rate || 'N/A'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {renderRankRow('National Acceptance Rank', selectivityRankNational, 2819)}
                {renderRankRow(`State Acceptance Rank`, selectivityRankState, sortedSelectivityState.length)}
                {renderPercentileBar(selectivityRankNational, 2819, 'text-purple-500', 'shadow-[0_0_10px_rgba(168,85,247,0.3)]')}
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}