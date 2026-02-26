'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, ArrowLeft, Zap, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // NEW: Track password visibility
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // The SQL trigger automatically created their profile!
        router.push('/dashboard'); // We will build this next
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      
      {/* Left Side - The Pitch */}
      <div className="md:w-1/2 bg-gradient-to-br from-slate-900 via-[#0f172a] to-blue-950 p-12 lg:p-24 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none"></div>
        
        <Link href="/" className="inline-flex items-center text-blue-400 font-bold mb-12 relative z-10 hover:text-white transition-colors w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search
        </Link>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-sm font-bold tracking-wide">
            <Zap className="w-4 h-4 mr-2" />
            Athlete Portal
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-tight">
            Stop guessing about your recruiting.
          </h1>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            Sync your Athletic.net times, track your progress against college standards, and see exactly where you stand on the state leaderboards. 
          </p>
        </div>
      </div>

      {/* Right Side - The Form */}
      <div className="md:w-1/2 flex items-center justify-center p-8 lg:p-24 relative">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {isSignUp ? 'Create your profile' : 'Welcome back'}
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              {isSignUp ? 'Join the leaderboard in seconds.' : 'Enter your details to access your dashboard.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl text-sm font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
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
                  placeholder="athlete@example.com"
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
              className="w-full group bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-black transition-all shadow-lg flex justify-center items-center mt-2 disabled:opacity-50"
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
                className="text-blue-600 font-black hover:underline focus:outline-none"
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