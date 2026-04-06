'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck, Database, LineChart, ArrowRight, Activity, Zap, CheckCircle2, Trophy, Crosshair, MapPin, Target, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Check if the user is already logged in when they hit the homepage
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // IF LOGGED IN: Instantly redirect them to their dashboard!
        router.push('/dashboard');
      } else {
        // IF LOGGED OUT: Show them the landing page
        setLoading(false);
      }
    }
    checkAuth();
  }, [supabase, router]);

  // Show a quick loading spinner while we check their auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-500/30 overflow-hidden relative pb-32">
      
      {/* CUSTOM CSS FOR ADVANCED ANIMATIONS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @keyframes float-delayed {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay: 3s; }
        .animate-pulse-ring { animation: pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .bg-grid-slate-200 { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='%23e2e8f0'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E"); }
      `}} />

      {/* ========================================================= */}
      {/* 🚀 HERO SECTION 🚀                                        */}
      {/* ========================================================= */}
      <div className="relative pt-32 pb-24 lg:pt-48 lg:pb-40 px-6 mt-[-4rem]">
        
        {/* Dynamic Background Grid & Blurs */}
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(to_bottom,white,transparent)] -z-10 pointer-events-none"></div>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-blob pointer-events-none -z-10"></div>
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-blob animation-delay-2000 pointer-events-none -z-10"></div>
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-purple-400 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-blob animation-delay-4000 pointer-events-none -z-10"></div>

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          
          <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/50 text-blue-600 text-xs font-black tracking-widest uppercase shadow-sm hover:shadow-md transition-all cursor-default">
            <ShieldCheck className="w-4 h-4 mr-2" /> The New Standard in Recruiting
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-[7.5rem] font-black tracking-tighter text-slate-900 leading-[1.05]">
            Stop guessing. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500">
              Start knowing.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
            The operating system for high school athletes. Reverse-engineer college standards, track your true market value, and dominate the recruiting process.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
            <Link 
              href="/search"
              className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-lg transition-all shadow-[0_10px_40px_-10px_rgba(37,99,235,0.7)] flex items-center justify-center group hover:-translate-y-1 animate-pulse-ring"
            >
              <Search className="w-5 h-5 mr-3" /> Explore Colleges
            </Link>
            
            <Link 
              href="/login"
              className="w-full sm:w-auto px-10 py-5 bg-white hover:bg-slate-50 text-slate-900 rounded-full font-bold text-lg transition-all border border-slate-200 shadow-sm flex items-center justify-center group hover:-translate-y-1"
            >
              Join the Network <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1.5 transition-transform text-slate-400 group-hover:text-slate-900" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🔍 TOOL 1: THE DISCOVERY ENGINE 🔍                          */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="group relative bg-white rounded-[3rem] p-8 md:p-16 lg:p-24 border border-slate-200/60 overflow-hidden shadow-2xl shadow-slate-200/50 hover:shadow-blue-900/5 transition-all duration-700">
          
          {/* Decorative Gradient Background inside card */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            
            {/* Text Content */}
            <div className="flex-1 space-y-8">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-3xl w-fit shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                The Discovery Engine
              </h2>
              <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-lg">
                Filter 1,500+ collegiate programs by hidden metrics. Instantly discover athletic budgets, gamified roster standards, and the true 10-year alumni ROI.
              </p>
              
              <ul className="space-y-4 pt-4 pb-8">
                {['Sort by highest operating budget', 'Find exact walk-on target times', 'Filter out expensive tuition costs'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-700 font-bold text-lg">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mr-4 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <Link
                href="/search"
                className="inline-flex items-center px-8 py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-full font-bold text-lg transition-all shadow-md hover:shadow-xl group/btn"
              >
                Launch Search Tool <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </div>

            {/* Mock UI Graphic */}
            <div className="hidden lg:flex flex-1 w-full relative h-[450px] items-center justify-center">
              
              {/* Main App Mockup Card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-[2rem] p-8 animate-float z-20">
                
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mr-4 border border-blue-100">
                      <Search className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="h-4 w-32 bg-slate-800 rounded-full mb-2"></div>
                      <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-8 w-20 bg-emerald-100 border border-emerald-200 rounded-lg"></div>
                </div>

                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
                       <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                       <div className="flex-1 space-y-2">
                         <div className="h-3 w-3/4 bg-slate-300 rounded-full"></div>
                         <div className="h-2 w-1/2 bg-slate-200 rounded-full"></div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Element 1 */}
              <div className="absolute -top-6 -right-6 w-48 bg-white border border-slate-100 shadow-xl rounded-2xl p-5 animate-float-delayed z-30">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Filter Active</span>
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold border border-blue-100">
                  <Activity className="w-3.5 h-3.5" /> D1 Target Times
                </div>
              </div>

              {/* Floating Element 2 */}
              <div className="absolute -bottom-8 -left-8 w-64 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-5 animate-float z-30">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Athletic Budget ROI</span>
                <div className="flex items-end gap-2 h-16 w-full">
                  <div className="w-1/4 bg-blue-900 rounded-t-sm h-1/3"></div>
                  <div className="w-1/4 bg-blue-700 rounded-t-sm h-1/2"></div>
                  <div className="w-1/4 bg-blue-500 rounded-t-sm h-3/4"></div>
                  <div className="w-1/4 bg-blue-400 rounded-t-sm h-full shadow-[0_0_15px_rgba(96,165,250,0.4)]"></div>
                </div>
              </div>

              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-50 -z-10"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📈 TOOL 2: ATHLETE ID & LEADERBOARDS 📈                    */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="group relative bg-slate-900 rounded-[3rem] p-8 md:p-16 lg:p-24 border border-slate-800 overflow-hidden shadow-2xl shadow-slate-900/50 hover:shadow-purple-900/20 transition-all duration-700">
          
          {/* Decorative Gradient Background inside card */}
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24">
            
            {/* Text Content */}
            <div className="flex-1 space-y-8">
              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-3xl w-fit shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <LineChart className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Athlete ID & Leaderboards
              </h2>
              <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-lg">
                Instantly sync your Athletic.net PRs. Get your proprietary Recruit Score, climb the uncommitted state leaderboards, and earn Trust Badges to prove your identity.
              </p>
              
              <ul className="space-y-4 pt-4 pb-8">
                {['One-click Athletic.net Sync', 'State & National PR Rankings', 'Coach Verification Badges'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300 font-bold text-lg">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center mr-4 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 bg-white hover:bg-purple-50 text-slate-900 rounded-full font-bold text-lg transition-all shadow-md hover:shadow-xl group/btn"
              >
                Create Your Profile <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </div>

            {/* Mock UI Graphic */}
            <div className="hidden lg:flex flex-1 w-full relative h-[450px] items-center justify-center">
              
              {/* Main ID Card Mockup */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-slate-950 border border-slate-700 shadow-2xl rounded-[2.5rem] p-8 animate-float z-30 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-6 shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center justify-center border-4 border-slate-800">
                  <ShieldCheck className="w-10 h-10 text-white" />
                </div>
                <div className="h-4 w-40 bg-white rounded-full mx-auto mb-4"></div>
                <div className="h-3 w-24 bg-slate-700 rounded-full mx-auto mb-8"></div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                     <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">State Rank</span>
                     <span className="text-3xl font-black text-white">#12</span>
                   </div>
                   <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                     <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Recruit Tier</span>
                     <span className="text-xl font-black text-purple-400">D1 Top</span>
                   </div>
                </div>
              </div>

              {/* Floating Element 1 */}
              <div className="absolute top-4 left-0 w-56 bg-white border border-slate-100 shadow-xl rounded-2xl p-5 animate-float-delayed z-40">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                     <Trophy className="w-5 h-5 text-emerald-600" />
                   </div>
                   <div>
                     <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">New Milestone</span>
                     <span className="text-sm font-bold text-slate-900">Varsity Standard Hit</span>
                   </div>
                </div>
              </div>

              {/* Floating Element 2 */}
              <div className="absolute bottom-10 right-4 w-64 bg-slate-800 border border-slate-700 shadow-2xl rounded-2xl p-6 animate-float z-40" style={{ animationDelay: '1.5s'}}>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Target className="w-3.5 h-3.5"/> Target PR Progression</span>
                <div className="w-full bg-slate-950 rounded-full h-3 shadow-inner">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-400 h-3 rounded-full w-[85%] relative shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md scale-125 border border-purple-200"></div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30 -z-10"></div>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}