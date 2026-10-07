'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AlertTriangle, Loader2, Lock, ArrowRight, Sparkles, CheckCircle2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmailVerificationProps {
  onClose?: () => void;
}

export default function EmailVerification({ onClose }: EmailVerificationProps = {}) {
  const supabase = createClient();
  const router = useRouter();
  
  const [isVisible, setIsVisible] = useState(true);
  const [step, setStep] = useState<'loading' | 'email' | 'otp' | 'success'>('loading');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [trustAnimate, setTrustAnimate] = useState(false);

  // Gamified Auto-Welcomer: Posts to the feed when they hit Level 1
  const triggerAutoWelcome = async (uid: string, fName: string) => {
    try {
      const welcomeMsg = `A new athlete has verified! 🛡️ Welcome ${fName || 'to the network'} to the trusted network.`;
      
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

  // Initial Auth & Status Check
  useEffect(() => {
    const fetchUserAndStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (user) {
        setUserId(user.id);
        setEmail(user.email || '');

        const { data: athlete } = await supabase
          .from('athletes')
          .select('trust_level, first_name, last_name')
          .eq('id', user.id)
          .single();

        if (athlete) {
          setFirstName(athlete.first_name || '');
          setLastName(athlete.last_name || '');

          if (athlete.trust_level >= 1) {
            setStep('success');
            setTimeout(() => setTrustAnimate(true), 100);
            await triggerAutoWelcome(user.id, athlete.first_name || '');
          } else {
            setStep('email');
          }
        } else {
          setStep('email');
        }
      } else {
        setError('No active session found. Please log in.');
      }
    };
    
    fetchUserAndStatus();
  }, [supabase]);

  // Master Close Function: Unmounts the component and refreshes the server state
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
    // Silently refreshes the current route so the parent page recognizes trust_level = 1
    router.refresh(); 
  };

  // Action 1: Send the Native Supabase Pin
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!userId || !firstName) {
      setError('Identity Lock: Please update your First and Last Name in settings before verifying.');
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false, 
        },
      });

      if (authError) throw authError;

      setStep('otp');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dispatch security pin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Action 2: Verify the Native Supabase Pin
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: 'email',
      });

      if (verifyError) throw verifyError;

      // Upgrade the athlete's trust level in the database since Auth succeeded
      if (userId) {
        const { error: dbError } = await supabase
          .from('athletes')
          .update({ trust_level: 1 })
          .eq('id', userId);

        if (dbError) {
          console.error('Trust level upgrade failed:', dbError);
        } else {
          await triggerAutoWelcome(userId, firstName);
        }
      }

      setStep('success');
      setTimeout(() => setTrustAnimate(true), 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired passcode.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  // Loading State
  if (step === 'loading') {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center p-12 bg-slate-950/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl relative">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white bg-slate-900/50 hover:bg-slate-800 rounded-full transition-all"
        >
          <X className="w-4 h-4" />
        </button>
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold text-sm tracking-widest uppercase animate-pulse">
          Authenticating...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto relative">
      <div className="relative bg-[#0f172a]/90 backdrop-blur-2xl border border-slate-800 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden">
        
        {/* Top Right X Button */}
        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 z-50 p-2 text-slate-500 hover:text-white bg-slate-900/50 hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-full transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ambient Glowing Orbs */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center w-full">
          
          {/* Branded Security Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center justify-center bg-purple-500/10 border border-purple-500/30 text-[#c084fc] text-[11px] font-bold px-5 py-2 rounded-full tracking-[0.15em] uppercase shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              {step === 'success' ? 'Network Shield Active' : 'Network Security'}
            </span>
          </div>

          {/* Dynamic Header */}
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3 text-center">
            {step === 'email' && `Verify Your Identity, ${firstName || 'Athlete'}`}
            {step === 'otp' && 'Enter Verification Pin'}
            {step === 'success' && 'Verification Complete'}
          </h2>
          
          <p className="text-slate-400 text-sm leading-relaxed text-center mb-8 max-w-[340px]">
            {step === 'email' && 'Lock in your recruiting profile and upgrade your account to unlock verified leaderboards and recruiter matchmaking.'}
            {step === 'otp' && `We dispatched a secure 6-digit passcode to your registered account email.`}
            {step === 'success' && 'Your profile is officially verified. You now have full access to the ChasedSports ecosystem.'}
          </p>

          {/* Custom Inline Error State */}
          {error && (
            <div className="w-full mb-8 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-medium leading-snug">{error}</p>
            </div>
          )}

          {/* ======================= */}
          {/* STEP 1: EMAIL CONFIRM   */}
          {/* ======================= */}
          {step === 'email' && (
            <form onSubmit={handleSendEmail} className="w-full flex flex-col gap-4">
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full bg-[#020617] border border-slate-800 text-slate-300 text-sm font-semibold rounded-2xl pl-14 pr-5 py-5 outline-none cursor-not-allowed shadow-inner"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !email}
                className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base rounded-2xl px-5 py-5 transition-all shadow-[0_0_30px_rgba(147,51,234,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Dispatch Secure Pin'}
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          )}

          {/* ======================= */}
          {/* STEP 2: 6-DIGIT OTP     */}
          {/* ======================= */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="w-full flex flex-col items-center">
              <div className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden group focus-within:border-purple-500/50 transition-colors duration-300">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 text-center">
                  Your 6-Digit Passcode
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  className="w-full bg-transparent text-center text-4xl sm:text-5xl font-black tracking-[0.25em] sm:tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 outline-none placeholder:text-slate-800"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full flex items-center justify-center gap-2 bg-white text-slate-950 hover:bg-slate-200 font-extrabold text-base rounded-2xl px-5 py-5 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mb-6"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-900" /> : 'Confirm Identity'}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Need a new code? Go back
              </button>
            </form>
          )}

          {/* ======================= */}
          {/* STEP 3: SUCCESS TIER    */}
          {/* ======================= */}
          {step === 'success' && (
            <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
              
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                <div className="relative w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
              </div>

              {/* Gamified Tier Meter */}
              <div className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Trust Level</span>
                  <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> 
                    LEVEL 1
                  </span>
                </div>
                
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(236,72,153,0.5)] ${
                      trustAnimate ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              </div>

              {/* Final Success Button (Identical function to the top-right X) */}
              <button
                onClick={handleClose}
                className="w-full flex items-center justify-center bg-slate-800/50 hover:bg-slate-800 text-white font-bold text-sm uppercase tracking-widest rounded-2xl px-5 py-5 border border-slate-700 transition-all active:scale-[0.98]"
              >
                Full platform unlocked
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}