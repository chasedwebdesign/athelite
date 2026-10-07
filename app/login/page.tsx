'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, 
  ShieldCheck, Target, Activity, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) throw signInError;
      
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid login credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] flex flex-col md:flex-row font-sans selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* ========================================================= */}
      {/* LEFT SIDE - THE GAMIFIED SHOWCASE                         */}
      {/* ========================================================= */}
      <div className="hidden md:flex md:w-[45%] lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 lg:p-24 border-r border-slate-800/60 z-10 shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
        
        <div className="relative z-10 flex justify-between items-center w-full">
          <Link href="/" className="inline-flex items-center text-slate-400 text-sm font-bold hover:text-white transition-colors bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800 shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Systems Online</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center mt-12">
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white leading-[1.1] mb-4 drop-shadow-lg">
              Welcome back to the arena.
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-md">
              Log in to track your performance metrics, level up your profile, and connect with the top programs in the country.
            </p>
          </div>

          <div className="relative w-full max-w-md h-64 select-none animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300" style={{ animationFillMode: 'backwards' }}>
            <div className="absolute top-0 left-4 bg-[#0a0f1e]/90 backdrop-blur-xl border border-slate-700/60 p-5 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-500 w-64 z-20 group">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl pointer-events-none"></div>
               <div className="flex items-center justify-between mb-3 relative z-10">
                 <div className="flex items-center gap-1.5 text-blue-400">
                   <ShieldCheck className="w-4 h-4 group-hover:text-blue-300 transition-colors" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Verified PR</span>
                 </div>
                 <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest shadow-[0_0_10px_rgba(217,70,239,0.2)]">
                   Elite Tier
                 </div>
               </div>
               <div className="flex items-end gap-2 relative z-10">
                 <span className="text-4xl font-black text-white leading-none">10.42</span>
                 <span className="text-sm font-bold text-slate-500 mb-1">100m Dash</span>
               </div>
            </div>

            <div className="absolute top-24 right-0 bg-[#0a0f1e]/90 backdrop-blur-xl border border-slate-700/60 p-6 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-500 w-72 z-10">
               <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl pointer-events-none"></div>
               <div className="flex items-center gap-4 mb-4 relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-inner border border-blue-400/30">
                   <Target className="w-6 h-6 text-white" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Matchmaker</p>
                   <p className="text-sm font-bold text-white">Base Recruiting Score</p>
                 </div>
               </div>
               <div className="w-full bg-slate-950 rounded-full h-3 mb-2 overflow-hidden border border-slate-800 shadow-inner relative z-10">
                 <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 h-full w-[92%] rounded-full relative">
                    <div className="absolute top-0 right-0 bottom-0 w-6 bg-white/30 blur-[3px] animate-pulse"></div>
                 </div>
               </div>
               <div className="flex justify-between text-[10px] font-bold text-slate-500 relative z-10 uppercase tracking-widest">
                 <span>D2 Prospect</span>
                 <span className="text-fuchsia-400 font-black drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">Power 4 D1</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT SIDE - THE FORM (Mobile First)                      */}
      {/* ========================================================= */}
      <div className="w-full md:w-[55%] lg:w-1/2 flex flex-col relative overflow-y-auto custom-scrollbar bg-[#020617] z-20">
        
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none md:hidden"></div>

        <div className="md:hidden px-6 pt-10 pb-6 relative z-20">
           <Link href="/" className="inline-flex items-center text-slate-400 text-xs font-bold hover:text-white transition-colors mb-6 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800">
             <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
           </Link>
           <h2 className="text-3xl font-black text-white flex items-center gap-2">
             <Activity className="w-8 h-8 text-blue-500" />
             Chased<span className="text-blue-400">Sports</span>
           </h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 relative z-10">
          <div className="w-full max-w-[420px] space-y-8 bg-[#0a0f1e]/80 md:bg-transparent backdrop-blur-2xl md:backdrop-blur-none border border-slate-800/80 md:border-none p-8 md:p-0 rounded-[2.5rem] shadow-2xl md:shadow-none transition-all">
            
            <div className="text-center md:text-left space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-slate-400 font-medium">
                Enter your details to access your dashboard.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 backdrop-blur-sm text-red-400 border border-red-500/20 p-4 rounded-2xl text-sm font-bold flex items-start gap-3 animate-in fade-in duration-300 shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="grid grid-cols-1 gap-5">
                
                {/* Email Input - Staggered entrance */}
                <div 
                  className="space-y-1.5 group animate-in fade-in slide-in-from-bottom-6 duration-500" 
                  style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
                >
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 group-focus-within:text-blue-500 transition-colors">Email Address</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="athlete@example.com"
                      className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 font-bold shadow-sm placeholder:font-medium placeholder:text-slate-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password Input - Staggered entrance */}
                <div 
                  className="space-y-1.5 group animate-in fade-in slide-in-from-bottom-6 duration-500"
                  style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
                >
                  <div className="flex justify-between items-center pl-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-blue-500 transition-colors">Password</label>
                    <Link href="/reset-password" className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors mr-2">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 font-bold shadow-sm placeholder:font-medium placeholder:text-slate-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-500 hover:text-white transition-colors focus:outline-none flex items-center justify-center p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Primary Action Button - Staggered entrance */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full group text-white px-8 py-4 rounded-2xl font-black text-lg transition-all flex justify-center items-center mt-6 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] active:scale-[0.98] animate-in fade-in slide-in-from-bottom-6 duration-500"
                style={{ animationDelay: '450ms', animationFillMode: 'backwards' }}
              >
                {loading ? <Activity className="w-6 h-6 animate-spin" /> : 'Secure Login'}
                {!loading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div 
              className="text-center pt-8 border-t border-slate-800/80 mt-8 animate-in fade-in duration-500"
              style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}
            >
              <p className="text-sm font-bold text-slate-500 inline-block px-4 relative z-10">
                Ready to get chased?{' '}
                <Link 
                  href="/signup"
                  className="text-white font-black hover:text-blue-400 transition-colors ml-1 border-b-2 border-white/30 hover:border-blue-400 pb-0.5"
                >
                  Sign Up Free
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 10px; }
      `}} />
    </main>
  );
}