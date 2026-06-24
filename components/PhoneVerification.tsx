'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Phone, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function PhoneVerification() {
  const supabase = createClient();
  
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gamified flair: Show a trust level boost preview
  const [trustBoostActive, setTrustBoostActive] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic E.164 format check (e.g., +1234567890)
    const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
    
    if (formattedPhone.length < 11) {
      setError('Please enter a valid phone number with area code.');
      return;
    }

    setLoading(true);

    try {
      // Supabase native OTP sending
      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (signInError) throw signInError;

      setPhone(formattedPhone); // Store the formatted version for the next step
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Check formatting.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (verifyError) throw verifyError;

      // Update the athlete's trust level in our database now that they are verified
      if (data.user) {
        const { error: dbError } = await supabase
          .from('athletes')
          .update({ trust_level: 'Verified' }) // Or whatever your enum/level logic is
          .eq('id', data.user.id);

        if (dbError) console.error('Failed to update trust level:', dbError);
      }

      setStep('success');
      setTimeout(() => setTrustBoostActive(true), 300); // Trigger gamified animation
      
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Glassmorphic Container */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] p-8">
        
        {/* Animated Background Gradients */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          
          {/* Header Icon */}
          <div className={`p-4 rounded-2xl mb-6 transition-all duration-500 ${
            step === 'success' 
              ? 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-[0_0_30px_rgba(52,211,153,0.4)]' 
              : 'bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5'
          }`}>
            {step === 'success' ? (
              <ShieldCheck className="w-8 h-8 text-white" />
            ) : (
              <Phone className="w-8 h-8 text-blue-400" />
            )}
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2 text-center">
            {step === 'phone' && 'Verify Your Identity'}
            {step === 'otp' && 'Enter Verification Code'}
            {step === 'success' && 'Athlete Verified!'}
          </h2>
          
          <p className="text-slate-400 text-sm text-center mb-8">
            {step === 'phone' && 'Secure your account and boost your Trust Level to stand out to college recruiters.'}
            {step === 'otp' && `We sent a secure code to ${phone}. It might take a moment.`}
            {step === 'success' && 'Your profile is now verified. Coaches prioritize verified athletes.'}
          </p>

          {/* Error State Banner */}
          {error && (
            <div className="w-full mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* STEP 1: Enter Phone Number */}
          {step === 'phone' && (
            <form onSubmit={handleSendCode} className="w-full flex flex-col gap-4">
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white placeholder-slate-500 text-lg rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg rounded-2xl px-5 py-4 transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyCode} className="w-full flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full bg-slate-950/50 border border-slate-800 text-white text-center tracking-[0.5em] text-2xl font-mono rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg rounded-2xl px-5 py-4 transition-all shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Account'}
              </button>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-sm text-slate-400 hover:text-white transition-colors py-2"
              >
                Wrong number? Go back
              </button>
            </form>
          )}

          {/* STEP 3: Success State */}
          {step === 'success' && (
            <div className="w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
              <div className={`transition-all duration-700 transform ${trustBoostActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 font-bold tracking-wide uppercase text-sm">
                    Trust Level Upgraded
                  </span>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/dashboard/customize'} // Redirect to let them equip new badges
                className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl px-5 py-4 border border-white/10 transition-all active:scale-[0.98]"
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}