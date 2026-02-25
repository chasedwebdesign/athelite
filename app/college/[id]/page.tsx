'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Trophy, BookOpen, Activity, TrendingUp, Landmark, Users, Globe, Zap, Award, Gem, Shield } from 'lucide-react';

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

// UPGRADED: Gamification Logic with reliable Tailwind Gradients
function getBudgetTier(expense: number | null, sportName: string) {
  if (!expense || expense === 0) return null;
  
  // Default Thresholds
  let t5 = 2500000, t4 = 1000000, t3 = 400000, t2 = 150000;

  // Adjust thresholds based on the reality of the sport
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
      bgClass: "bg-gradient-to-br from-amber-900 via-yellow-900 to-black border-yellow-500/30",
      textAccent: "text-yellow-400", barColor: "bg-yellow-400", glow: "shadow-yellow-900/50", Icon: Award 
    };
  }
  if (expense >= t4) {
    return { 
      level: 4, label: "Tier 4: Elite", 
      desc: "Premium financial backing. Extensive scholarships and state-of-the-art gear.",
      bgClass: "bg-gradient-to-br from-purple-900 via-indigo-950 to-black border-purple-500/30",
      textAccent: "text-purple-400", barColor: "bg-purple-400", glow: "shadow-purple-900/50", Icon: Gem 
    };
  }
  if (expense >= t3) {
    return { 
      level: 3, label: "Tier 3: Competitive", 
      desc: "Solid program budget. Healthy mix of athletic aid and quality equipment.",
      bgClass: "bg-gradient-to-br from-blue-900 via-cyan-950 to-slate-950 border-cyan-500/30",
      textAccent: "text-cyan-400", barColor: "bg-cyan-400", glow: "shadow-cyan-900/50", Icon: Zap 
    };
  }
  if (expense >= t2) {
    return { 
      level: 2, label: "Tier 2: Developmental", 
      desc: "Building program. Limited athletic aid, standard gear allocations.",
      bgClass: "bg-gradient-to-br from-emerald-900 via-green-950 to-slate-950 border-green-500/30",
      textAccent: "text-green-400", barColor: "bg-green-400", glow: "shadow-green-900/50", Icon: TrendingUp 
    };
  }
  
  return { 
    level: 1, label: "Tier 1: Foundational", 
    desc: "Primarily walk-on driven. Minimal athletic financial aid or extensive travel budget.",
    bgClass: "bg-gradient-to-br from-slate-800 to-slate-950 border-slate-700",
    textAccent: "text-slate-300", barColor: "bg-slate-400", glow: "shadow-slate-900/50", Icon: Shield 
  };
}

export default function CollegePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const [collegeData, setCollegeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    async function fetchCollegeDetails() {
      const urlParams = new URLSearchParams(window.location.search);
      const targetSport = urlParams.get('sport');
      const targetGender = urlParams.get('gender');
      
      if (targetSport || targetGender) setIsFiltered(true);

      const { data: uni } = await supabase.from('universities').select('*').eq('id', id).single();

      let progQuery = supabase
        .from('programs')
        .select(`*, recruiting_standards (*)`)
        .eq('university_id', id);

      if (targetSport) progQuery = progQuery.eq('sport', targetSport);
      if (targetGender) progQuery = progQuery.eq('gender', targetGender);

      const { data: programs } = await progQuery;

      if (uni && programs) {
        setCollegeData({ ...uni, programs });
      }
      setLoading(false);
    }

    fetchCollegeDetails();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">Loading university profile...</p>
      </div>
    );
  }

  if (!collegeData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-black text-slate-900">College not found</h2>
        <Link href="/" className="text-blue-600 font-bold hover:underline">Return to Search</Link>
      </div>
    );
  }

  const hasTuition = collegeData.tuition_in_state || collegeData.tuition_out_of_state;
  const baseTuition = collegeData.tuition_in_state || collegeData.tuition_out_of_state || 0;

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-950 pt-16 pb-32 px-8 overflow-hidden rounded-b-[2.5rem] shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm font-bold text-blue-400 hover:text-white transition-colors bg-blue-500/10 px-5 py-2.5 rounded-full border border-blue-400/20 backdrop-blur-md hover:bg-blue-500/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Link>

            {isFiltered && (
              <button 
                onClick={() => {
                  window.history.replaceState({}, '', `/college/${id}`);
                  window.location.reload();
                }}
                className="inline-flex items-center text-sm font-bold text-slate-300 hover:text-white transition-colors bg-white/5 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-md hover:bg-white/10"
              >
                View All {collegeData.majors_offered?.length || 'Athletic'} Programs
              </button>
            )}
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-8 leading-tight">
            {collegeData.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-slate-200 font-semibold text-sm md:text-base">
            <div className="flex items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-md">
              <MapPin className="w-4 h-4 mr-2 text-blue-400" />
              {collegeData.city ? `${collegeData.city}, ${collegeData.state}` : collegeData.state}
            </div>
            <div className="flex items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-md">
              <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
              {collegeData.division}
            </div>
            
            {collegeData.student_population && (
              <div className="flex items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                <Users className="w-4 h-4 mr-2 text-purple-400" />
                {parseInt(collegeData.student_population).toLocaleString()} Students
              </div>
            )}

            {collegeData.website && (
              <a 
                href={collegeData.website.startsWith('http') ? collegeData.website : `https://${collegeData.website}`}
                target="_blank"
                rel="noopener noreferrer" 
                className="flex items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Globe className="w-4 h-4 mr-2 text-cyan-400" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-20 space-y-10">
        
        {/* DEEP DIVE: 10-Yr Salary ROI Card */}
        {collegeData.median_earnings && (
          <div className="bg-white p-10 md:p-12 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-green-100 p-3.5 rounded-2xl">
                  <TrendingUp className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Return on Investment</h3>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-3">Post-Graduate Earnings</h2>
              <p className="text-slate-500 font-medium leading-relaxed max-w-lg">
                This is the median salary of alumni 10 years after enrolling at {collegeData.name}. It is a powerful indicator of the networking opportunities, degree strength, and long-term financial security provided by this institution.
              </p>
            </div>
            <div className="bg-green-50 border border-green-100 p-8 rounded-3xl text-center shrink-0 w-full md:w-auto">
              <span className="block text-sm font-bold text-green-600 mb-2 uppercase tracking-wider">10-Year Median Salary</span>
              <span className="text-5xl font-black text-green-700 tracking-tighter">{formatCurrency(collegeData.median_earnings)}</span>
            </div>
          </div>
        )}

        {/* BASIC ACADEMICS & COST (Only show if data exists) */}
        {(hasTuition || collegeData.acceptance_rate) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {hasTuition && (
              <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="bg-blue-100 p-3 rounded-2xl">
                    <Landmark className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tuition Costs</h3>
                </div>
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
              <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-center items-center text-center">
                <div className="bg-slate-50 w-full rounded-2xl p-8 border border-slate-100">
                  <span className="block text-sm font-black text-slate-400 mb-3 uppercase tracking-widest">Acceptance Rate</span>
                  <span className="text-6xl font-black text-slate-900 tracking-tighter">{collegeData.acceptance_rate}</span>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ATHLETIC PROGRAMS SECTION */}
        <div className="pt-10">
          
          {collegeData.programs.length === 0 && (
            <div className="bg-white p-12 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-900 mb-2">No programs match this filter</h3>
              <p className="text-slate-500 font-medium mb-6">This school does not offer this specific sport or gender combination.</p>
              <button 
                onClick={() => {
                  window.history.replaceState({}, '', `/college/${id}`);
                  window.location.reload();
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
              >
                View All Programs
              </button>
            </div>
          )}

          <div className="space-y-16">
            {collegeData.programs.map((program: any) => {
              const budget = program.operating_expense || program.budget;
              const tier = getBudgetTier(budget, program.sport);
              
              // Gamified Full Rides Calculation
              let estimatedRides = null;
              if (budget && baseTuition > 0) {
                estimatedRides = Math.floor(budget / baseTuition);
              }

              return (
                <div key={program.id} className="space-y-8">
                  
                  {/* GAMIFIED FUNDING HERO CARD */}
                  {tier && (
                    <div className={`relative overflow-hidden rounded-[2.5rem] border p-10 md:p-14 shadow-2xl transition-all ${tier.bgClass} ${tier.glow}`}>
                      
                      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                        
                        <div className="space-y-6">
                          <div className="inline-flex items-center space-x-3 bg-black/20 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10">
                            <tier.Icon className={`w-5 h-5 ${tier.textAccent}`} />
                            <span className={`text-sm font-black tracking-widest uppercase ${tier.textAccent}`}>
                              {tier.label}
                            </span>
                          </div>
                          
                          <div>
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
                              {program.gender} {program.sport}
                            </h2>
                            <p className="text-white/70 font-medium max-w-md text-lg leading-relaxed">
                              {tier.desc}
                            </p>
                          </div>
                        </div>

                        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl p-8 shrink-0 w-full md:w-auto text-center">
                          <span className="block text-sm font-black text-white/50 uppercase tracking-widest mb-2">Operating Budget</span>
                          <span className={`block text-5xl font-black tracking-tighter mb-6 ${tier.textAccent}`}>
                            {formatCurrency(budget)}
                          </span>
                          
                          {estimatedRides !== null && estimatedRides > 0 && (
                            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                              <span className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Budget Power</span>
                              <span className="text-white font-bold">~{estimatedRides} In-State Full Rides</span>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Giant Tier Progress Meter at the bottom */}
                      <div className="relative z-10 mt-10 flex gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div 
                            key={i} 
                            className={`h-3 md:h-4 flex-1 rounded-full transition-all duration-700 ${
                              i <= tier.level ? `${tier.barColor} shadow-[0_0_15px_rgba(255,255,255,0.3)]` : 'bg-white/10'
                            }`} 
                          />
                        ))}
                      </div>

                    </div>
                  )}

                  {/* RECRUITING STANDARDS (Only shows if they exist!) */}
                  {program.recruiting_standards?.length > 0 && (
                    <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                      <div className="mb-10 pb-8 border-b border-slate-100 text-center max-w-2xl mx-auto">
                        <h3 className="text-3xl font-black text-slate-900 mb-4">
                          Target Standards
                        </h3>
                        <p className="text-slate-500 font-medium leading-relaxed">
                          These represent estimated divisional averages. Coaches often flex these times based on your academic profile, progression trajectory, and current roster needs.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {program.recruiting_standards.map((standard: any) => (
                          <div key={standard.id} className="group p-8 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 rounded-[2rem] transition-all duration-300">
                            <span className="block font-black text-2xl text-slate-800 tracking-tight mb-6 text-center">{standard.event}</span>
                            
                            <div className="space-y-4">
                              <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Recruit Target</span>
                                <span className="font-black text-3xl text-blue-600 group-hover:scale-105 transition-transform">
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

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </main>
  );
}