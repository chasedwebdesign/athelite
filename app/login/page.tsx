'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, ArrowLeft, Zap, Eye, EyeOff, User, School, ShieldCheck, Check, Trophy, Target, Activity, Star } from 'lucide-react';
import Link from 'next/link';

// Centralized Launch Date for Founder Status
const PRO_LAUNCH_DATE = new Date('2026-08-08T00:00:00Z');

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Dual-sided marketplace state
  const [userType, setUserType] = useState<'athlete' | 'coach'>('athlete');
  const [coachType, setCoachType] = useState<'high_school' | 'college'>('college');

  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 🚨 REQUIREMENT: TERMS OF SERVICE VALIDATION
    if (isSignUp && !acceptedTerms) {
      setError("You must accept the Terms of Service and Privacy Policy to create an account.");
      setLoading(false);
      return;
    }

    // 🚨 STRICT .EDU EMAIL VERIFICATION FOR COLLEGE COACHES
    if (isSignUp && userType === 'coach' && coachType === 'college') {
      if (!email.toLowerCase().endsWith('.edu')) {
        setError("NCAA/College coaches must register with a valid .edu university email address to verify their identity.");
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        // SIGN UP FLOW
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (authError) throw authError;

        // Check if the user is signing up before the launch timer expires
        const isFounderEligible = new Date() < PRO_LAUNCH_DATE;

        // Route to the correct database table based on their selection
        if (authData.user) {
          if (userType === 'athlete') {
            const { error: athleteErr } = await supabase.from('athletes').insert({ 
              id: authData.user.id,
              is_founder: isFounderEligible 
            });
            if (athleteErr && !athleteErr.message.includes('duplicate')) {
                throw new Error(`Failed to build athlete profile: ${athleteErr.message}`);
            }
          } else {
            // SAFETY SWEEP: If a Supabase trigger automatically created an athlete row, delete it!
            await supabase.from('athletes').delete().eq('id', authData.user.id);
            
            const { error: coachErr } = await supabase.from('coaches').insert({ 
              id: authData.user.id,
              coach_type: coachType,
              is_founder: isFounderEligible
            });
            
            if (coachErr) throw new Error(`Failed to build coach profile: ${coachErr.message}`);
          }
        }
        
        router.push('/dashboard');
        router.refresh();

      } else {
        // LOG IN FLOW
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-blue-500/30">
      
      {/* ========================================================= */}
      {/* LEFT SIDE - THE GAMIFIED SHOWCASE (Hidden on Mobile)      */}
      {/* ========================================================= */}
      <div className="hidden md:flex md:w-[45%] lg:w-1/2 bg-slate-950 relative overflow-hidden flex-col justify-between p-12 lg:p-24 border-r border-slate-800 shadow-2xl">
        {/* Glowing Background Orbs */}
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Header / Nav */}
        <div className="relative z-10 flex justify-between items-center w-full">
          <Link href="/" className="inline-flex items-center text-slate-400 text-sm font-bold hover:text-white transition-colors bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Systems Online</span>
          </div>
        </div>

        {/* Dynamic Pitch & Floating UI Elements */}
        <div className="relative z-10 flex-1 flex flex-col justify-center mt-12">
          
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white leading-[1.1] mb-4">
              {userType === 'athlete' ? 'Stop guessing about your recruitment.' : 'Find verified talent in seconds.'}
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-md">
              {userType === 'athlete' 
                ? 'Sync your times, track your progress against college standards, and dominate the state leaderboards.'
                : 'Access the Discovery Engine, message verified athletes securely, and build your championship roster.'}
            </p>
          </div>

          {/* Floating Gamified Mockup Cards */}
          <div className="relative w-full max-w-md h-64 select-none">
            
            {/* Card 1: Verified PR Badge */}
            <div className="absolute top-0 left-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-4 rounded-3xl shadow-2xl transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-300 w-64 z-20">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-1.5 text-blue-400">
                   <ShieldCheck className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Verified PR</span>
                 </div>
                 <div className="bg-fuchsia-500/10 border border-fuchsia-500/50 text-fuchsia-400 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                   Elite Tier
                 </div>
               </div>
               <div className="flex items-end gap-2">
                 <span className="text-3xl font-black text-white">10.42</span>
                 <span className="text-sm font-bold text-slate-500 mb-1.5">100m Dash</span>
               </div>
            </div>

            {/* Card 2: Matchmaker / Recruiting Score */}
            <div className="absolute top-24 right-0 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300 w-72 z-10">
               <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner">
                   <Target className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Matchmaker</p>
                   <p className="text-sm font-bold text-white">Base Recruiting Score</p>
                 </div>
               </div>
               <div className="w-full bg-slate-950 rounded-full h-3 mb-1 overflow-hidden border border-slate-800/50">
                 <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full w-[92%] rounded-full relative">
                    <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/20 blur-[2px] animate-pulse"></div>
                 </div>
               </div>
               <div className="flex justify-between text-[10px] font-bold text-slate-500">
                 <span>D2 Prospect</span>
                 <span className="text-purple-400">Power 4 D1</span>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT SIDE - THE FORM (Mobile First)                        */}
      {/* ========================================================= */}
      <div className="w-full md:w-[55%] lg:w-1/2 flex flex-col relative overflow-y-auto">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden bg-slate-950 px-6 py-8 rounded-b-[2.5rem] relative overflow-hidden shadow-2xl z-20">
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/30 via-transparent to-transparent pointer-events-none"></div>
           <Link href="/" className="inline-flex items-center text-slate-400 text-xs font-bold hover:text-white transition-colors mb-6 relative z-10">
             <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
           </Link>
           <h2 className="text-3xl font-black text-white relative z-10 flex items-center gap-2">
             <Activity className="w-8 h-8 text-blue-500" />
             ChasedSports
           </h2>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 relative z-10">
          <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header */}
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                {isSignUp ? 'Create account' : 'Welcome back'}
              </h2>
              <p className="text-slate-500 font-medium">
                {isSignUp ? 'Join the gamified recruiting network.' : 'Enter your details to access your dashboard.'}
              </p>
            </div>

            {/* Error Toast */}
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm text-red-600 border border-red-200 p-4 rounded-2xl text-sm font-bold flex items-start gap-3 animate-in fade-in duration-300">
                <div className="bg-red-100 p-1 rounded-full shrink-0 mt-0.5">
                  <Lock className="w-4 h-4 text-red-500" />
                </div>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              
              {/* --- DUAL SIGN-UP TOGGLE --- */}
              {isSignUp && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex bg-slate-200/50 p-1.5 rounded-3xl mb-4 border border-slate-200 shadow-inner">
                    <button 
                      type="button"
                      onClick={() => setUserType('athlete')}
                      className={`flex-1 py-3 rounded-[1.25rem] text-sm font-bold transition-all flex items-center justify-center ${userType === 'athlete' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Zap className={`w-4 h-4 mr-2 ${userType === 'athlete' ? 'text-blue-500' : 'text-slate-400'}`} /> 
                      Athlete
                    </button>
                    <button 
                      type="button"
                      onClick={() => setUserType('coach')}
                      className={`flex-1 py-3 rounded-[1.25rem] text-sm font-bold transition-all flex items-center justify-center ${userType === 'coach' ? 'bg-white text-purple-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Trophy className={`w-4 h-4 mr-2 ${userType === 'coach' ? 'text-purple-500' : 'text-slate-400'}`} /> 
                      Coach
                    </button>
                  </div>

                  {/* --- COACH TYPE RADIO BUTTONS --- */}
                  {userType === 'coach' && (
                    <div className="grid grid-cols-2 gap-3 mb-6 animate-in zoom-in-95 duration-200">
                      <button 
                        type="button"
                        onClick={() => setCoachType('high_school')}
                        className={`px-4 py-3.5 rounded-2xl border-2 text-sm font-bold transition-all text-center flex flex-col items-center gap-1 ${coachType === 'high_school' ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'}`}
                      >
                        High School
                      </button>
                      <button 
                        type="button"
                        onClick={() => setCoachType('college')}
                        className={`px-4 py-3.5 rounded-2xl border-2 text-sm font-bold transition-all text-center flex flex-col items-center gap-1 ${coachType === 'college' ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'}`}
                      >
                        College
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 group-focus-within:text-blue-500 transition-colors">Email Address</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={userType === 'coach' && coachType === 'college' ? "coach@university.edu" : userType === 'coach' ? "coach@school.org" : "athlete@example.com"}
                    className="w-full bg-white border-2 border-slate-200 text-slate-900 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold shadow-sm placeholder:font-medium placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 group-focus-within:text-blue-500 transition-colors">Password</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border-2 border-slate-200 text-slate-900 rounded-2xl pl-12 pr-12 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold shadow-sm placeholder:font-medium placeholder:text-slate-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none flex items-center justify-center p-1 bg-white rounded-md"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* --- TERMS OF SERVICE CHECKBOX --- */}
              {isSignUp && (
                <label className="flex items-start gap-3 p-2 cursor-pointer group mt-4 bg-slate-100/50 rounded-2xl border border-slate-200/50 hover:bg-slate-100 transition-colors animate-in fade-in duration-300">
                  <div className="relative flex items-center justify-center mt-0.5 shrink-0 ml-1">
                    <input
                      type="checkbox"
                      required
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded-lg border-2 border-slate-300 bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all shadow-sm group-hover:border-blue-400 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]" />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 leading-relaxed pr-2">
                    I agree to the{' '}
                    <Link href="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 underline underline-offset-2">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-700 underline underline-offset-2">Privacy Policy</Link>, 
                    and confirm I am at least 13 years old.
                  </span>
                </label>
              )}

              {/* Primary Action Button */}
              <button 
                type="submit"
                disabled={loading || (isSignUp && !acceptedTerms)}
                className={`w-full group text-white px-8 py-4 rounded-2xl font-black text-lg transition-all flex justify-center items-center mt-6 disabled:opacity-50 disabled:cursor-not-allowed
                  ${userType === 'coach' && isSignUp 
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)]' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]'
                  }`}
              >
                {loading ? 'Processing...' : (isSignUp ? 'Create Profile' : 'Secure Login')}
                {!loading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            {/* Toggle Sign Up / Login */}
            <div className="text-center pt-6">
              <p className="text-sm font-bold text-slate-500 bg-white inline-block px-4 relative z-10">
                {isSignUp ? 'Already a member?' : "Ready to get chased?"}{' '}
                <button 
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                  className="text-slate-900 font-black hover:text-blue-600 transition-colors focus:outline-none ml-1 border-b-2 border-slate-900 hover:border-blue-600 pb-0.5"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up Free'}
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}