'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Mail, ShieldCheck, ArrowRight, AlertCircle, Loader2, Sparkles, Lock } from 'lucide-react';

export default function EmailVerification() {
  const supabase = createClient();
  
  const [step, setStep] = useState<'loading' | 'email' | 'otp' | 'success'>('loading');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [trustAnimate, setTrustAnimate] = useState(false);

  // 🚨 AUTO-WELCOMER HELPER FUNCTION 🚨
  const triggerAutoWelcome = async (uid: string, firstName: string) => {
    try {
      const welcomeMsg = `A new athlete has verified! 🛡️ Welcome ${firstName || 'to the network'} to the trusted network.`;
      
      // Check if it already exists to prevent duplicate spam
      const { data: existingWelcome } = await supabase
        .from('posts')
        .select('id')
        .eq('athlete_id', uid)
        .eq('content', welcomeMsg)
        .maybeSingle();

      if (!existingWelcome) {
        await supabase.from('posts').insert({
          athlete_id: uid,
          content: welcomeMsg
        });
      }
    } catch (err) {
      console.error("Auto-welcome error:", err);
    }
  };

  // Auto-Fetch user email and check if they are already verified
  useEffect(() => {
    const fetchUserAndStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        setEmail(user.email || ''); // Pre-fill their actual account email

        // Check their current trust_level in the database
        const { data: athlete } = await supabase
          .from('athletes')
          .select('trust_level, first_name')
          .eq('id', user.id)
          .single();

        // If they are already trusted (trust_level 1 or higher), skip to success
        if (athlete && athlete.trust_level >= 1) {
          setStep('success');
          setTimeout(() => setTrustAnimate(true), 200);
          
          // Failsafe: Run auto-welcomer here in case an admin manually verified them in the Supabase UI
          await triggerAutoWelcome(user.id, athlete.first_name);
        } else {
          setStep('email'); // Not verified yet, show the locked email form
        }
      } else {
        setStep('email');
      }
    };
    
    fetchUserAndStatus();
  }, [supabase]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!userId) {
      setError('You must be logged in to verify your account.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'send', userId }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed sending pin.');

      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otp, action: 'verify', userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid verification code.');

      // 🚨 Fetch name for the auto-welcomer immediately after successful verification 🚨
      const { data: athleteData } = await supabase
        .from('athletes')
        .select('first_name')
        .eq('id', userId)
        .single();

      if (athleteData && userId) {
        await triggerAutoWelcome(userId, athleteData.first_name);
      }

      setStep('success');
      setTimeout(() => setTrustAnimate(true), 200);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="w-full max-w-md mx-auto relative overflow-hidden rounded-3xl bg-slate-950/40 backdrop-blur-xl border border-white/10 shadow-2xl p-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold text-sm animate-pulse">Checking security clearance...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Gamified Glassmorphic Shell */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950/40 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)] p-8">
        
        {/* Decorative Neon Blurs */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          
          {/* Branded Dynamic Wrapper Status Badge */}
          <div className={`p-4 rounded-2xl mb-6 transition-all duration-700 ${
            step === 'success' 
              ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-[0_0_30px_rgba(168,85,247,0.4)] scale-110' 
              : 'bg-slate-900 border border-white/5'
          }`}>
            {step === 'success' ? (
              <ShieldCheck className="w-8 h-8 text-white animate-pulse" />
            ) : (
              <Mail className="w-8 h-8 text-purple-400" />
            )}
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2 text-center">
            {step === 'email' && 'Verify Account Identity'}
            {step === 'otp' && 'Check Your Email'}
            {step === 'success' && 'Account Shield Active!'}
          </h2>
          
          <p className="text-slate-400 text-sm text-center mb-8 px-2 font-medium">
            {step === 'email' && 'Verify the exact email address registered to this account to prove your identity.'}
            {step === 'otp' && `We dropped a secure 6-digit confirmation pin straight over to ${email}.`}
            {step === 'success' && 'Your profile data is officially verified. Recruiters filter heavily by verified accounts.'}
          </p>

          {/* Inline Custom Error State Display banner (NO ALERTS) */}
          {error && (
            <div className="w-full mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-bold">{error}</p>
            </div>
          )}

          {/* STEP 1: Capture Verification Email (LOCKED) */}
          {step === 'email' && (
            <form onSubmit={handleSendEmail} className="w-full flex flex-col gap-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  readOnly // 🚨 THIS LOCKS THE INPUT
                  className="w-full bg-slate-900/80 border border-slate-700/50 text-slate-300 text-base font-bold rounded-2xl pl-12 pr-5 py-4 outline-none cursor-not-allowed shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base rounded-2xl px-5 py-4 transition-all shadow-[0_4px_20px_rgba(147,51,234,0.3)] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code to Account Email'}
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          )}

          {/* STEP 2: Input Generated Pin Code */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="w-full flex flex-col gap-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-slate-950/60 border border-slate-800 text-white text-center tracking-[0.4em] text-3xl font-black font-mono rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-base rounded-2xl px-5 py-4 transition-all shadow-[0_4px_20px_rgba(79,70,229,0.3)] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Activation'}
              </button>
            </form>
          )}

          {/* STEP 3: Complete & Gamified Dynamic Tier Upgrade Progress View */}
          {step === 'success' && (
            <div className="w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
              
              <div className="w-full bg-slate-950/80 rounded-2xl border border-slate-800 p-5 relative overflow-hidden shadow-inner">
                <div className="flex justify-between text-xs font-black mb-3">
                  <span className="text-slate-500 uppercase tracking-widest">Trust Level</span>
                  <span className="text-purple-400 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
                    <Sparkles className="w-3.5 h-3.5" /> LEVEL 1 (VERIFIED)
                  </span>
                </div>
                
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out ${
                      trustAnimate ? 'w-full shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'w-1/4'
                    }`}
                  />
                </div>
                
                <div className="flex justify-between text-[10px] font-black text-slate-600 mt-3 tracking-wider">
                  <span>LEVEL 0</span>
                  <span className={trustAnimate ? 'text-pink-400 transition-colors duration-700' : ''}>ELITE STATUS UNLOCKED</span>
                </div>
              </div>

              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-wider text-sm rounded-2xl px-5 py-4 border border-white/10 transition-all hover:border-white/20 active:scale-[0.99]"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}