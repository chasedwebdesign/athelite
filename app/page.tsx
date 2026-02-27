'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck, Database, LineChart, ArrowRight, Activity, Zap, CheckCircle2 } from 'lucide-react';

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
  // so the marketing page doesn't flash on the screen before redirecting
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* CUSTOM CSS FOR CLOUDFLARE-STYLE ANIMATIONS */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes float-delayed {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay: 2s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .bg-grid-slate-200 { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='%23e2e8f0'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E"); }
      `}} />

      {/* HERO SECTION */}
      <div className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 px-6 border-b border-slate-200 mt-[-4rem]">
        
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(to_bottom,white,transparent)] -z-10 pointer-events-none"></div>

        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob pointer-events-none -z-10"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000 pointer-events-none -z-10"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-4000 pointer-events-none -z-10"></div>

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-slate-200 text-blue-600 text-xs font-bold tracking-widest uppercase mb-4 shadow-sm">
            <ShieldCheck className="w-4 h-4 mr-2" />
            The New Standard in Recruiting
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-slate-900 leading-[1.1]">
            Stop guessing. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500">
              Start knowing.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
            The operating system for high school athletes. Reverse-engineer college standards, track your true market value, and dominate the recruiting process.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link 
              href="/search"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-lg transition-all shadow-[0_10px_40px_-10px_rgba(37,99,235,0.7)] flex items-center justify-center group hover:-translate-y-1"
            >
              <Search className="w-5 h-5 mr-2" />
              Explore Colleges
            </Link>
            
            <Link 
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 rounded-full font-bold text-lg transition-all border border-slate-200 shadow-sm flex items-center justify-center group hover:-translate-y-1"
            >
              Join the Network
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-slate-900" />
            </Link>
          </div>
        </div>
      </div>

      {/* TOOL 1: THE DISCOVERY ENGINE */}
      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="group relative bg-white rounded-[3rem] p-8 md:p-16 lg:p-20 border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50 hover:shadow-blue-900/5 transition-all duration-700">
          
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl w-fit shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                The Discovery Engine
              </h2>
              <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-lg">
                Filter 1,500+ collegiate programs by hidden metrics. Instantly discover athletic budgets, gamified roster standards, and the true 10-year alumni ROI.
              </p>
              <ul className="space-y-3 pt-2 pb-6">
                {['Sort by highest operating budget', 'Find exact walk-on target times', 'Filter out expensive tuition costs'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-700 font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3" /> {item}
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

            <div className="hidden lg:block flex-1 w-full relative h-[400px]">
              <div className="absolute top-10 right-10 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl p-6 animate-float z-20">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <Zap className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="h-4 w-24 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="h-6 w-16 bg-green-100 rounded-md"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                  <div className="h-2 w-4/5 bg-slate-100 rounded-full"></div>
                </div>
              </div>

              <div className="absolute bottom-10 left-0 w-72 bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 animate-float-delayed z-30">
                <div className="h-3 w-32 bg-slate-200 rounded-full mb-4"></div>
                <div className="flex items-end space-x-2 h-24">
                  <div className="w-1/4 bg-blue-100 rounded-t-md h-1/2"></div>
                  <div className="w-1/4 bg-blue-300 rounded-t-md h-3/4"></div>
                  <div className="w-1/4 bg-blue-500 rounded-t-md h-full"></div>
                  <div className="w-1/4 bg-blue-600 rounded-t-md h-4/5 shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
                </div>
              </div>

              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-50 -z-10"></div>
            </div>
          </div>
        </div>
      </div>

      {/* TOOL 2: ATHLETE ID & LEADERBOARDS */}
      <div className="max-w-7xl mx-auto px-6 pb-32 relative z-10">
        <div className="group relative bg-white rounded-[3rem] p-8 md:p-16 lg:p-20 border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50 hover:shadow-purple-900/5 transition-all duration-700">
          
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl w-fit shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <LineChart className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Athlete ID & Leaderboards
              </h2>
              <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-lg">
                Instantly sync your Athletic.net PRs. Get your proprietary Recruit Score, climb the uncommitted state leaderboards, and earn Trust Badges to prove your identity.
              </p>
              <ul className="space-y-3 pt-2 pb-6">
                {['One-click Athletic.net Sync', 'State & National PR Rankings', 'Coach Verification Badges'].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-700 font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 mr-3" /> {item}
                  </li>
                ))}
              </ul>
              
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 bg-slate-900 hover:bg-purple-600 text-white rounded-full font-bold text-lg transition-all shadow-md hover:shadow-xl group/btn"
              >
                Join the Network <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </div>

            <div className="hidden lg:block flex-1 w-full relative h-[400px]">
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white border border-slate-200 shadow-2xl rounded-[2rem] p-8 animate-float z-30 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-6 shadow-lg shadow-purple-500/30 flex items-center justify-center border-4 border-white">
                  <ShieldCheck className="w-10 h-10 text-white" />
                </div>
                <div className="h-4 w-32 bg-slate-800 rounded-full mx-auto mb-3"></div>
                <div className="h-3 w-20 bg-purple-100 rounded-full mx-auto"></div>
              </div>

              <div className="absolute top-12 left-0 w-48 bg-white border border-slate-100 shadow-lg rounded-2xl p-4 animate-float-delayed z-20">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">State Rank</span>
                <span className="text-3xl font-black text-slate-900">#12</span>
                <span className="text-sm font-bold text-green-500 ml-2">↑ 4</span>
              </div>

               <div className="absolute bottom-16 right-0 w-56 bg-white border border-slate-100 shadow-lg rounded-2xl p-5 animate-float z-20" style={{ animationDelay: '1s'}}>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recruit Score</span>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div className="bg-purple-500 h-2.5 rounded-full w-[85%]"></div>
                </div>
              </div>

              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-50 -z-10"></div>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}