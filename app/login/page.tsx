'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, ArrowLeft, Zap, Eye, EyeOff, User, School, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // NEW: Dual-sided marketplace state
  const [userType, setUserType] = useState<'athlete' | 'coach'>('athlete');
  const [coachType, setCoachType] = useState<'high_school' | 'college'>('college');

  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // SIGN UP FLOW
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (authError) throw authError;

        // Route to the correct database table based on their selection
        if (authData.user) {
          if (userType === 'athlete') {
            await supabase.from('athletes').insert({ id: authData.user.id });
          } else {
            await supabase.from('coaches').insert({ 
              id: authData.user.id,
              coach_type: coachType
            });
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
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans selection:bg-blue-500/30">
      
      {/* Left Side - The Dynamic Pitch */}
      <div className="md:w-1/2 bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-950 p-12 lg:p-24 flex flex-col justify-center relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none"></div>
        
        <Link href="/" className="inline-flex items-center text-blue-400 font-bold mb-12 relative z-10 hover:text-white transition-colors w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-bold tracking-wide transition-colors ${userType === 'athlete' ? 'bg-blue-500/10 border-blue-400/20 text-blue-400' : 'bg-purple-500/10 border-purple-400/20 text-purple-400'}`}>
            {userType === 'athlete' ? (
              <><Zap className="w-4 h-4 mr-2" /> Athlete Portal</>
            ) : (
              <><ShieldCheck className="w-4 h-4 mr-2" /> Coach Portal</>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-tight">
            {userType === 'athlete' ? 'Stop guessing about your recruiting.' : 'Find verified talent in seconds.'}
          </h1>
          
          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            {userType === 'athlete' 
              ? 'Sync your Athletic.net times, track your progress against college standards, and see exactly where you stand on the state leaderboards.'
              : 'Access the Discovery Engine, securely message verified athletes, and build your championship roster faster than ever before.'}
          </p>
        </div>
      </div>

      {/* Right Side - The Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 lg:p-24 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-8 my-auto">
          
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {isSignUp ? 'Create your profile' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              {isSignUp ? 'Join the network in seconds.' : 'Enter your details to access your dashboard.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl text-sm font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            
            {/* --- DUAL SIGN-UP TOGGLE --- */}
            {isSignUp && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-4">
                  <button 
                    type="button"
                    onClick={() => setUserType('athlete')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${userType === 'athlete' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <User className="w-4 h-4 mr-2" /> Athlete
                  </button>
                  <button 
                    type="button"
                    onClick={() => setUserType('coach')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${userType === 'coach' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <School className="w-4 h-4 mr-2" /> Coach
                  </button>
                </div>

                {/* --- COACH TYPE RADIO BUTTONS --- */}
                {userType === 'coach' && (
                  <div className="grid grid-cols-2 gap-3 mb-6 animate-in zoom-in-95 duration-200">
                    <button 
                      type="button"
                      onClick={() => setCoachType('high_school')}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all text-center ${coachType === 'high_school' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      High School
                    </button>
                    <button 
                      type="button"
                      onClick={() => setCoachType('college')}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all text-center ${coachType === 'college' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      College
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={userType === 'coach' ? "coach@university.edu" : "athlete@example.com"}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-10 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold shadow-sm placeholder:font-normal placeholder:text-slate-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none flex items-center justify-center p-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full group text-white px-8 py-4 rounded-xl font-black transition-all shadow-lg flex justify-center items-center mt-2 disabled:opacity-50 ${userType === 'coach' && isSignUp ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20' : 'bg-slate-900 hover:bg-blue-600'}`}
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
              {!loading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-sm font-semibold text-slate-500">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 font-black hover:underline focus:outline-none ml-1"
              >
                {isSignUp ? 'Sign In' : 'Sign Up Free'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}