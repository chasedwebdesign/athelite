'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Mail, Clock, MapPin, Trophy, BookOpen, User, Activity, TrendingUp, Calculator, Landmark, Users, Globe } from 'lucide-react';

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatCurrency(num: number | null | undefined) {
  if (!num) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

// NEW: A clean helper function to format seconds into MM:SS
function formatTimeSeconds(totalSeconds: number | null) {
  if (!totalSeconds) return 'N/A';
  const m = Math.floor(totalSeconds / 60);
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
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

      const { data: uni, error: uniError } = await supabase
        .from('universities')
        .select('*')
        .eq('id', id)
        .single();

      let progQuery = supabase
        .from('programs')
        .select(`
          *,
          coaches (*),
          recruiting_standards (*)
        `)
        .eq('university_id', id);

      if (targetSport) progQuery = progQuery.eq('sport', targetSport);
      if (targetGender) progQuery = progQuery.eq('gender', targetGender);

      const { data: programs, error: progError } = await progQuery;

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

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-24">
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-950 pt-16 pb-32 px-8 overflow-hidden rounded-b-[2.5rem] shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          
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

          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-8 leading-tight">
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
            <div className="flex items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-md">
              <BookOpen className="w-4 h-4 mr-2 text-emerald-400" />
              {collegeData.majors_offered?.length || 0} Majors
            </div>
            
            <div className="flex items-center bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-md">
              <Users className="w-4 h-4 mr-2 text-purple-400" />
              {collegeData.student_population ? `${parseInt(collegeData.student_population).toLocaleString()} Students` : 'N/A'}
            </div>

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

      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-20 space-y-10">
        
        {/* UNIVERSITY OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-center">
            <div className="flex items-center space-x-4 mb-3">
              <div className="bg-blue-100 p-3 rounded-2xl">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">University Cost</h3>
            </div>
            <div className="space-y-2 pl-1 w-full mt-2">
              <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                <span className="text-sm font-medium text-slate-400">In-State Tuition:</span>
                <span className="text-lg font-bold text-slate-700">{formatCurrency(collegeData.tuition_in_state)}</span>
              </div>
              <div className="flex justify-between items-end pt-1">
                <span className="text-sm font-medium text-slate-400">Out-of-State:</span>
                <span className="text-lg font-bold text-slate-700">{formatCurrency(collegeData.tuition_out_of_state)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-center">
            <div className="flex items-center space-x-4 mb-3">
              <div className="bg-indigo-100 p-3 rounded-2xl">
                <Landmark className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admissions Profile</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2 pl-1">
              <div>
                <span className="block text-xs font-bold text-slate-400 mb-1">Average GPA</span>
                <span className="text-2xl font-black text-slate-900">{collegeData.average_gpa || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 mb-1">Acceptance Rate</span>
                <span className="text-2xl font-black text-slate-700">{collegeData.acceptance_rate || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ATHLETIC PROGRAMS SECTION */}
        <div className="pt-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8 px-2">
            Athletic Programs
          </h2>

          {collegeData.programs.length === 0 && (
            <div className="bg-white p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
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

          <div className="space-y-12">
            {collegeData.programs.map((program: any) => (
              <div key={program.id} className="space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {program.gender} {program.sport}
                    </h2>
                  </div>

                  {program.conference_finish && program.conference_teams && program.conference_name && (
                    <div className="mt-4 md:mt-0 flex items-center bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                      <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                      <div>
                        <span className="font-bold text-slate-900">{getOrdinal(program.conference_finish)} of {program.conference_teams}</span>
                        <span className="text-sm font-medium text-emerald-700 ml-1">in the {program.conference_name}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* UPGRADED: Target Standards Box */}
                  <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full">
                    <div className="mb-6 pb-5 border-b border-slate-100">
                      <h3 className="text-xl font-bold text-slate-900 flex items-center">
                        <Clock className="w-5 h-5 mr-3 text-blue-500"/>
                        Target Standards
                      </h3>
                      <p className="text-[13px] text-slate-500 mt-2 font-medium leading-relaxed pr-4">
                        *These times represent estimated divisional averages. Coaches often have leniency based on academic profile, progression, and team needs.
                      </p>
                    </div>

                    {program.recruiting_standards.length > 0 ? (
                      <ul className="space-y-4 flex-grow">
                        {program.recruiting_standards.map((standard: any) => (
                          <li key={standard.id} className="group flex flex-col p-5 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 rounded-2xl transition-all duration-300">
                            <span className="font-black text-lg text-slate-800 tracking-wide mb-3">{standard.event}</span>
                            
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Recruit Target</span>
                              <span className="font-black text-xl text-blue-600 group-hover:scale-105 transition-transform">
                                {formatTimeSeconds(standard.target_time_seconds)}
                              </span>
                            </div>

                            {standard.walk_on_time_seconds && (
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/60">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Walk-On Target</span>
                                <span className="font-black text-lg text-slate-700 group-hover:scale-105 transition-transform">
                                  {formatTimeSeconds(standard.walk_on_time_seconds)}
                                </span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex-grow flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8">
                        <p className="text-slate-500 font-medium text-center">No recruiting standards posted yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Coaches Box */}
                  <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-full">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center pb-4 border-b border-slate-100">
                      <User className="w-5 h-5 mr-3 text-blue-500"/>
                      Coaching Staff
                    </h3>
                    {program.coaches.length > 0 ? (
                      <div className="space-y-4 flex-grow">
                        {program.coaches.map((coach: any) => (
                          <div key={coach.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <h4 className="font-bold text-xl text-slate-900 mb-1">{coach.name}</h4>
                            <p className="text-sm font-bold text-slate-500 mb-5 uppercase tracking-wider">{coach.title}</p>
                            <a 
                              href={`mailto:${coach.email}`} 
                              className="group inline-flex items-center justify-center w-full py-3 px-4 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
                            >
                              <Mail className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                              Email Coach
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-grow flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8">
                        <p className="text-slate-500 font-medium text-center">Coaching staff directory unavailable.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}