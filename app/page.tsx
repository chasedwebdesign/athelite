'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck, Database, LineChart, ArrowRight, Activity, CheckCircle2, Trophy, Target, MapPin, DollarSign, Timer, GraduationCap, LockOpen } from 'lucide-react';

// 🚨 EXTENDED MOCK DATA FOR AUTO-SCROLLING CAROUSEL 🚨
const FEATURED_COLLEGES = [
  {
    id: 1,
    name: "University of Miami",
    location: "Coral Gables, FL",
    division: "NCAA D1",
    budget: "$127.9M",
    salary: "$134,500",
    color: "from-orange-500 to-emerald-600",
    backStats: { recruitScore: 92, gradRate: "83%" }
  },
  {
    id: 2,
    name: "University of Notre Dame",
    location: "Notre Dame, IN",
    division: "NCAA D1",
    budget: "$139.3M",
    salary: "$152,000",
    color: "from-blue-800 to-amber-500",
    backStats: { recruitScore: 88, gradRate: "97%" }
  },
  {
    id: 3,
    name: "Stanford University",
    location: "Stanford, CA",
    division: "NCAA D1",
    budget: "$142.5M",
    salary: "$175,000",
    color: "from-red-800 to-red-600",
    backStats: { recruitScore: 96, gradRate: "95%" }
  },
  {
    id: 4,
    name: "University of Oregon",
    location: "Eugene, OR",
    division: "NCAA D1",
    budget: "$135.2M",
    salary: "$128,000",
    color: "from-green-600 to-yellow-400",
    backStats: { recruitScore: 94, gradRate: "74%" }
  },
  {
    id: 5,
    name: "Harvey Mudd College",
    location: "Claremont, CA",
    division: "NCAA D3",
    budget: "$3.1M",
    salary: "$168,000",
    color: "from-slate-800 to-amber-500",
    backStats: { recruitScore: 74, gradRate: "93%" }
  }
];

// 🚨 ALL ATHLETES ARE #1 LEGENDS NOW 🚨
const FALLBACK_ATHLETES = [
  { id: 1, rank: 1, firstName: "Chase", lastName: "Fulleton", highSchool: "South Albany HS", event: "3000 Meters", mark: "8:24.50", initials: "CF", tier: "Legend Rank", tierClass: "legend-badge", color: "from-blue-600 to-indigo-600" },
  { id: 2, rank: 1, firstName: "Luke", lastName: "Skywalker", highSchool: "Tatooine Prep", event: "Long Jump", mark: "25' 4\"", initials: "LS", tier: "Legend Rank", tierClass: "legend-badge", color: "from-emerald-500 to-teal-600" },
  { id: 3, rank: 1, firstName: "Mia", lastName: "Hamm", highSchool: "North Carolina HS", event: "400 Meters", mark: "52.88s", initials: "MH", tier: "Legend Rank", tierClass: "legend-badge", color: "from-rose-500 to-pink-600" }
];

const ATHLETE_GRADIENTS = [
  "from-blue-600 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-purple-600 to-fuchsia-600"
];

// ============================================================================
// 🚨 ALGORITHM & STANDARDS
// ============================================================================
const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

const RECRUITING_STANDARDS: Record<string, Record<string, { t1: number, t2: number, t3: number, t4: number, t5: number, t6: number, t7: number, isField?: boolean }>> = {
  'Boys': {
    '60 Meters': { t1: 6.75, t2: 6.90, t3: 7.05, t4: 7.20, t5: 7.40, t6: 7.60, t7: 8.00 },
    '100 Meters': { t1: 10.5, t2: 10.8, t3: 11.0, t4: 11.3, t5: 11.6, t6: 11.9, t7: 12.6 },
    '200 Meters': { t1: 21.2, t2: 21.8, t3: 22.2, t4: 22.8, t5: 23.5, t6: 24.5, t7: 26.0 },
    '400 Meters': { t1: 47.5, t2: 49.0, t3: 50.0, t4: 51.5, t5: 53.0, t6: 55.0, t7: 58.0 },
    '800 Meters': { t1: 112, t2: 115, t3: 117, t4: 120, t5: 125, t6: 130, t7: 140 }, 
    '1500 Meters': { t1: 231, t2: 239, t3: 244, t4: 250, t5: 264, t6: 275, t7: 300 },
    '3000 Meters': { t1: 500, t2: 518, t3: 532, t4: 546, t5: 574, t6: 600, t7: 660 },
    '110m Hurdles': { t1: 13.8, t2: 14.2, t3: 14.6, t4: 15.0, t5: 15.5, t6: 16.5, t7: 18.5 },
    'Long Jump': { t1: 288, t2: 270, t3: 260, t4: 252, t5: 240, t6: 228, t7: 204, isField: true }, 
    'High Jump': { t1: 82, t2: 78, t3: 76, t4: 74, t5: 70, t6: 66, t7: 60, isField: true }, 
    'Shot Put': { t1: 720, t2: 660, t3: 600, t4: 540, t5: 480, t6: 444, t7: 360, isField: true }, 
  },
  'Girls': {
    '100 Meters': { t1: 11.7, t2: 12.1, t3: 12.4, t4: 12.8, t5: 13.2, t6: 13.6, t7: 14.5 },
    '400 Meters': { t1: 54.5, t2: 57.0, t3: 58.5, t4: 60.5, t5: 63.0, t6: 66.0, t7: 72.0 },
    '1500 Meters': { t1: 268, t2: 282, t3: 291, t4: 300, t5: 314, t6: 330, t7: 375 },
    'High Jump': { t1: 68, t2: 64, t3: 62, t4: 60, t5: 58, t6: 54, t7: 50, isField: true }, 
  }
};

const convertMarkToNumber = (markStr: string, isField: boolean): number => {
  if (isField) {
    const clean = markStr.replace(/[^0-9.]/g, ' ').trim().split(/\s+/);
    const feet = parseFloat(clean[0]) || 0;
    const inches = parseFloat(clean[1]) || 0;
    return (feet * 12) + inches;
  } else {
    if (markStr.includes(':')) {
      const parts = markStr.split(':');
      return (parseFloat(parts[0]) * 60) + parseFloat(parts[1]);
    }
    return parseFloat(markStr.replace(/[a-zA-Z]/g, '').trim()) || 99999;
  }
};

const getAthleteProjection = (prs: any[], gender: string) => {
  if (!prs || !Array.isArray(prs) || prs.length === 0) return null;

  const standards = RECRUITING_STANDARDS[gender] || RECRUITING_STANDARDS['Boys'];
  let allBreakdowns: any[] = [];

  prs.forEach((pr) => {
    if (!pr.event || !pr.mark) return;
    const normalizedEvent = pr.event.replace(/Meter\b/i, 'Meters').replace('100 Meter Hurdles', '100m Hurdles').replace('110 Meter Hurdles', '110m Hurdles');
    const eventStds = standards[normalizedEvent] || standards[pr.event];

    if (eventStds) {
      const val = convertMarkToNumber(pr.mark, !!eventStds.isField);
      let score = 5;

      if (eventStds.isField) {
        if (val >= eventStds.t1) score = 95 + Math.min(4, ((val - eventStds.t1) / (eventStds.t1 * 0.05)) * 4);
        else if (val >= eventStds.t2) score = 85 + ((val - eventStds.t2) / (eventStds.t1 - eventStds.t2)) * 10;
        else if (val >= eventStds.t3) score = 75 + ((val - eventStds.t3) / (eventStds.t2 - eventStds.t3)) * 10;
        else if (val >= eventStds.t4) score = 65 + ((val - eventStds.t4) / (eventStds.t3 - eventStds.t4)) * 10;
        else if (val >= eventStds.t5) score = 55 + ((val - eventStds.t5) / (eventStds.t4 - eventStds.t5)) * 10;
        else if (val >= eventStds.t6) score = 40 + ((val - eventStds.t6) / (eventStds.t5 - eventStds.t6)) * 14;
        else if (val >= eventStds.t7) score = 20 + ((val - eventStds.t7) / (eventStds.t6 - eventStds.t7)) * 19;
      } else {
        if (val <= eventStds.t1) score = 95 + Math.min(4, ((eventStds.t1 - val) / (eventStds.t1 * 0.05)) * 4);
        else if (val <= eventStds.t2) score = 85 + ((eventStds.t2 - val) / (eventStds.t2 - eventStds.t1)) * 10;
        else if (val <= eventStds.t3) score = 75 + ((eventStds.t3 - val) / (eventStds.t3 - eventStds.t2)) * 10;
        else if (val <= eventStds.t4) score = 65 + ((eventStds.t4 - val) / (eventStds.t4 - eventStds.t3)) * 10;
        else if (val <= eventStds.t5) score = 55 + ((eventStds.t5 - val) / (eventStds.t5 - eventStds.t4)) * 10;
        else if (val <= eventStds.t6) score = 40 + ((eventStds.t6 - val) / (eventStds.t6 - eventStds.t5)) * 14;
        else if (val <= eventStds.t7) score = 20 + ((eventStds.t7 - val) / (eventStds.t7 - eventStds.t6)) * 19;
      }
      score = Math.min(99, Math.max(5, Math.round(score)));
      allBreakdowns.push({ event: normalizedEvent, mark: pr.mark, score });
    }
  });

  if (allBreakdowns.length === 0) return null;
  allBreakdowns.sort((a, b) => b.score - a.score);
  
  const best = allBreakdowns[0];
  let label = 'Prospect'; 
  
  if (best.score >= 95) label = 'Legend Rank';
  else if (best.score >= 85) label = 'Champion Rank';
  else if (best.score >= 75) label = 'Elite Rank';
  else if (best.score >= 55) label = 'Master Rank';
  else if (best.score >= 40) label = 'Contender Rank';
  else if (best.score >= 20) label = 'Challenger Rank';

  return { overallScore: best.score, overallLabel: label, bestEvent: best.event, bestMark: best.mark };
};

// ============================================================================
// 🚨 COMPACT 3D CARD COMPONENT
// ============================================================================
function FlippingCard({ college }: { college: typeof FEATURED_COLLEGES[0] }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="perspective-1000 w-[180px] sm:w-[280px] shrink-0 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-[280px] sm:h-[400px] transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* === CARD FRONT === */}
        <div className="absolute inset-0 backface-hidden bg-slate-900/90 backdrop-blur-sm rounded-[1.5rem] sm:rounded-[2rem] border border-slate-700 shadow-[0_0_20px_rgba(0,0,0,0.5)] p-4 sm:p-6 flex flex-col overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-br ${college.color} opacity-30 blur-2xl`}></div>
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="bg-slate-800/80 border border-slate-700 w-fit px-2 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg mb-3 sm:mb-4 flex items-center gap-1 sm:gap-1.5 backdrop-blur-md">
              <Activity className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-blue-400" />
              <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-slate-300">Athletic Dept</span>
            </div>
            
            <h3 className="text-lg sm:text-3xl font-black text-white tracking-tight leading-tight mb-2 sm:mb-3 line-clamp-2">
              {college.name}
            </h3>
            
            <div className="space-y-1 sm:space-y-2 mb-auto">
              <p className="flex items-center text-[9px] sm:text-sm font-bold text-slate-400 truncate">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 opacity-70 shrink-0" /> <span className="truncate">{college.location}</span>
              </p>
              <p className="flex items-center text-[9px] sm:text-sm font-bold text-slate-400">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 opacity-70 shrink-0" /> {college.division}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 mt-3 sm:mt-6 shadow-inner">
              <span className="block text-[7px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5 sm:mb-1">Total Budget</span>
              <span className="text-lg sm:text-3xl font-black text-white tracking-tight">{college.budget}</span>
            </div>
            
            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2 text-[8px] sm:text-[10px] font-bold text-blue-400 uppercase tracking-widest group-hover:text-blue-300 transition-colors">
              Tap for Match Stats <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </div>
        </div>

        {/* === CARD BACK === */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-800/90 backdrop-blur-sm rounded-[1.5rem] sm:rounded-[2rem] border border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.25)] p-4 sm:p-6 flex flex-col overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
          <div className="relative z-10 h-full flex flex-col">
            <h4 className="text-[11px] sm:text-lg font-black text-white border-b border-slate-700 pb-2 sm:pb-4 mb-3 sm:mb-4 flex items-center justify-between">
              College Data <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-400" />
            </h4>
            
            <div className="mb-3 sm:mb-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-lg sm:rounded-xl p-3 sm:p-5 flex items-center justify-between shadow-inner">
                <div>
                  <Target className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400 mb-1 sm:mb-2" />
                  <span className="block text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Recruit Score</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl sm:text-4xl font-black text-white">{college.backStats.recruitScore}</span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500">/99</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-auto">
              <div className="bg-slate-900/80 border border-slate-700 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center shadow-inner">
                <DollarSign className="w-3 h-3 sm:w-5 sm:h-5 text-emerald-400 mx-auto mb-1 sm:mb-2" />
                <span className="block text-[7px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">10-Yr Salary</span>
                <span className="text-[11px] sm:text-lg font-black text-white">{college.salary}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-700 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center shadow-inner">
                <GraduationCap className="w-3 h-3 sm:w-5 sm:h-5 text-purple-400 mx-auto mb-1 sm:mb-2" />
                <span className="block text-[7px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Grad Rate</span>
                <span className="text-[11px] sm:text-lg font-black text-white">{college.backStats.gradRate}</span>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg sm:rounded-xl p-2.5 sm:p-4 flex items-center justify-center gap-2">
              <LockOpen className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              <span className="text-[9px] sm:text-xs font-black text-blue-300 uppercase tracking-widest">Verified Access</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// 🚨 MAIN LANDING PAGE COMPONENT
// ============================================================================
export default function LandingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Leaderboard State
  const [topAthletes, setTopAthletes] = useState<any[]>(FALLBACK_ATHLETES);
  const [activeAthleteIdx, setActiveAthleteIdx] = useState(0);

  // Check Auth & Fetch Real Top Athletes
  useEffect(() => {
    async function initializePage() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
        return;
      }

      try {
        const { data: athletesData } = await supabase
          .from('athletes')
          .select('id, first_name, last_name, high_school, prs, gender')
          .gt('trust_level', 0)
          .not('prs', 'is', null)
          .limit(50); 

        if (athletesData && athletesData.length > 0) {
          const processedAthletes = athletesData.map(a => {
            const proj = getAthleteProjection(a.prs, a.gender || 'Boys');
            return {
              ...a,
              projScore: proj?.overallScore || 0,
              bestEvent: proj?.bestEvent || 'Unknown',
              bestMark: proj?.bestMark || '-'
            };
          })
          .filter(a => a.projScore > 0)
          .sort((a, b) => b.projScore - a.projScore) 
          .slice(0, 5); 

          if (processedAthletes.length > 0) {
            const formattedTop = processedAthletes.map((a, idx) => {
              return {
                id: a.id,
                rank: 1, // 🚨 ALL TOP ATHLETES ARE #1 LEGENDS
                firstName: a.first_name || 'Unknown',
                lastName: a.last_name || 'Athlete',
                highSchool: a.high_school || 'Unattached',
                event: a.bestEvent,
                mark: a.bestMark,
                initials: `${(a.first_name || 'U')[0]}${(a.last_name || 'A')[0]}`,
                tier: 'Legend Rank', 
                tierClass: 'legend-badge', 
                color: ATHLETE_GRADIENTS[idx % ATHLETE_GRADIENTS.length]
              };
            });
            setTopAthletes(formattedTop);
          }
        }
      } catch (err) {
        console.error("Failed to load live athletes, using fallback data.");
      }

      setLoading(false);
    }
    initializePage();
  }, [supabase, router]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // DYNAMIC LEADERBOARD CYCLER EFFECT
  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveAthleteIdx((prev) => (prev + 1) % topAthletes.length);
    }, 4000);
    return () => clearInterval(intervalId);
  }, [topAthletes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#020617] font-sans selection:bg-blue-500/30 overflow-x-hidden relative pb-24 sm:pb-32 text-slate-200"
    >
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 hidden md:block opacity-50"
        style={{ background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(56, 189, 248, 0.06), transparent 40%)` }}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
        @keyframes float-delayed { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
        @keyframes grid-pan { 0% { transform: translateY(0); } 100% { transform: translateY(32px); } }
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        
        /* 🚨 INFINITE MARQUEE CSS (SMOOTH AND UNINTERRUPTED) 🚨 */
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 0.375rem)); } /* -0.375rem adjusts for exactly half of gap-3 (12px -> 6px) */
        }
        .animate-scroll { animation: scroll 25s linear infinite; }
        
        /* TECHY BACKGROUND ANIMATIONS */
        @keyframes blob-spin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .animate-blob-spin { animation: blob-spin 20s infinite linear; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay: 3s; }
        .bg-grid-pattern { background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 32px 32px; }
        
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .legend-badge { background: linear-gradient(90deg, #6b21a8 0%, #d946ef 20%, #6b21a8 40%, #d946ef 60%, #6b21a8 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #e879f9; }
      `}} />

      {/* ========================================================= */}
      {/* 🚀 HERO SECTION 🚀                                        */}
      {/* ========================================================= */}
      <div className="relative pt-24 sm:pt-32 pb-20 lg:pt-48 lg:pb-40 px-5 sm:px-6 mt-[-4rem] overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,black_20%,transparent_80%)] -z-20">
           <div className="absolute inset-0 bg-grid-pattern animate-[grid-pan_3s_linear_infinite]"></div>
        </div>
        
        {/* TECHY BACKGROUND ORBS */}
        <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[800px] h-[300px] sm:h-[800px] bg-cyan-600 rounded-full mix-blend-screen filter blur-[120px] sm:blur-[160px] opacity-15 animate-blob-spin pointer-events-none -z-10"></div>
        <div className="absolute top-0 right-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-blue-700 rounded-full mix-blend-screen filter blur-[100px] sm:blur-[140px] opacity-20 animate-blob-spin pointer-events-none -z-10" style={{ animationDirection: 'reverse', animationDuration: '25s' }}></div>
        <div className="absolute top-1/3 left-1/2 w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] bg-purple-700 rounded-full mix-blend-screen filter blur-[120px] sm:blur-[150px] opacity-15 animate-blob-spin pointer-events-none -z-10" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-1000 mt-12">
          <div className="inline-flex items-center px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 text-blue-400 text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> The New Standard in Recruiting
          </div>
          
          <h1 className="text-[4rem] leading-[1.05] sm:text-6xl md:text-8xl lg:text-[8rem] font-black tracking-tighter text-white drop-shadow-2xl">
            Find <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 filter drop-shadow-[0_0_30px_rgba(56,189,248,0.4)]">YOUR</span> college.
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed px-2">
            The operating system for high school athletes. Track your true market value and dominate the recruiting process.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-6 sm:pt-10 w-full sm:w-auto px-4 sm:px-0 relative z-20">
            <Link href="/search" className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl sm:rounded-full font-black text-base sm:text-lg transition-all shadow-[0_0_40px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_rgba(37,99,235,0.7)] flex items-center justify-center group hover:-translate-y-1">
              <Search className="w-5 h-5 mr-2 sm:mr-3" /> Explore Colleges
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-slate-900/50 hover:bg-slate-800 backdrop-blur-md text-white rounded-2xl sm:rounded-full font-bold text-base sm:text-lg transition-all border border-slate-700 shadow-sm flex items-center justify-center group hover:-translate-y-1">
              Join the Network <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3 group-hover:translate-x-1.5 transition-transform text-slate-500 group-hover:text-white" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🔍 TOOL 1: THE COLLEGE FINDER (INFINITE MARQUEE)        */}
      {/* ========================================================= */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <div className="group relative bg-[#0a0f1e]/80 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] border border-slate-800/80 overflow-hidden shadow-2xl transition-all duration-700">
          <div 
            className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block z-0"
            style={{ background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(56, 189, 248, 0.08), transparent 40%)` }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 p-6 sm:p-10 lg:p-16 xl:p-24">
            <div className="flex-1 space-y-6 sm:space-y-8 w-full max-w-xl">
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 sm:p-4 rounded-2xl sm:rounded-3xl w-fit shadow-sm">
                <Database className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">The College Finder</h2>
              <p className="text-slate-400 text-base sm:text-xl font-medium leading-relaxed">
                Filter 1,500+ collegiate programs by hidden metrics. Instantly discover athletic budgets, gamified roster standards, and the true 10-year alumni ROI.
              </p>
              <ul className="space-y-3 sm:space-y-4 pt-2 sm:pt-4 pb-4 sm:pb-8">
                {['Sort by highest operating budget', 'Find exact walk-on target times', 'Filter out expensive tuition costs'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300 font-bold text-sm sm:text-lg">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3 sm:mr-4 shrink-0 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/search" className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-white hover:bg-blue-50 text-slate-900 rounded-xl sm:rounded-full font-bold text-sm sm:text-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] group/btn relative z-20">
                Launch Search Tool <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </div>

            {/* 🚨 TIGHTER INFINITE MARQUEE CAROUSEL 🚨 */}
            <div className="flex-1 w-full lg:w-[600px] xl:w-[700px] overflow-hidden -mx-4 sm:mx-0 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="flex w-max gap-3 sm:gap-4 animate-scroll py-8 items-center justify-start">
                {[...FEATURED_COLLEGES, ...FEATURED_COLLEGES].map((college, i) => (
                  <FlippingCard key={i} college={college} />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📈 TOOL 2: ATHLETE ID & DYNAMIC LEADERBOARD CYCLER        */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        <div className="group relative bg-[#0a0f1e]/80 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 lg:p-24 border border-slate-800/80 overflow-hidden shadow-2xl transition-all duration-700">
          
          <div 
            className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block"
            style={{ background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(168, 85, 247, 0.1), transparent 40%)` }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-24">
            
            <div className="flex-1 space-y-6 sm:space-y-8 w-full">
              <div className="bg-purple-500/10 border border-purple-500/20 p-3 sm:p-4 rounded-2xl sm:rounded-3xl w-fit shadow-sm group-hover:scale-110 transition-transform duration-500">
                <LineChart className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">Athlete ID & Leaderboards</h2>
              <p className="text-slate-400 text-base sm:text-xl font-medium leading-relaxed max-w-lg">
                Instantly sync your Athletic.net PRs. Get your proprietary Recruit Score, climb the uncommitted state leaderboards, and earn Trust Badges to prove your identity.
              </p>
              
              <ul className="space-y-3 sm:space-y-4 pt-2 sm:pt-4 pb-4 sm:pb-8">
                {['One-click Athletic.net Sync', 'State & National PR Rankings', 'Coach Verification Badges'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300 font-bold text-sm sm:text-lg">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500/20 flex items-center justify-center mr-3 sm:mr-4 shrink-0 border border-purple-500/30">
                      <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-xl sm:rounded-full font-bold text-sm sm:text-lg transition-all shadow-[0_0_20px_rgba(168,85,247,0.1)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] group/btn relative z-20">
                Create Your Profile <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </div>

            {/* DYNAMIC AUTO-CYCLING LEADERBOARD CARDS */}
            <div className="flex-1 w-full relative h-[380px] sm:h-[450px] flex items-center justify-center mt-6 lg:mt-0">
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[280px] sm:max-w-[340px] h-full flex items-center justify-center z-30">
                {topAthletes.map((athlete, idx) => (
                  idx === activeAthleteIdx && (
                    <div 
                      key={athlete.id} 
                      className="absolute w-full bg-[#0a1128] border border-slate-700 shadow-2xl rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 fill-mode-forwards"
                    >
                      <div className="absolute -top-4 sm:-top-5 -right-4 sm:-right-5 w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 text-yellow-900 rounded-full border-4 border-[#0a1128] flex items-center justify-center font-black text-lg sm:text-xl shadow-lg z-40 transform rotate-12">
                        #{athlete.rank}
                      </div>

                      <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br ${athlete.color} rounded-full mx-auto mb-4 sm:mb-6 shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center justify-center border-4 border-slate-800 text-white font-black text-2xl sm:text-3xl`}>
                        {athlete.initials}
                      </div>
                      
                      <h3 className="text-xl sm:text-2xl font-black text-white leading-tight truncate mb-1">
                        {athlete.firstName} {athlete.lastName}
                      </h3>
                      <p className="text-xs sm:text-sm font-bold text-slate-400 mb-5 sm:mb-6">
                        <MapPin className="w-3 h-3 inline mr-1 -mt-0.5" />{athlete.highSchool}
                      </p>

                      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl mb-5 sm:mb-6">
                        <span className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{athlete.event}</span>
                        <span className="text-2xl sm:text-3xl font-black text-white">{athlete.mark}</span>
                      </div>

                      <div className={`inline-block px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-sm ${athlete.tierClass}`}>
                        {athlete.tier}
                      </div>
                    </div>
                  )
                ))}
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] rounded-full border border-slate-700/50 -z-10 animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 -z-20"></div>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}