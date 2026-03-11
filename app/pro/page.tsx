'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Crown, CheckCircle2, Zap, Eye, Mail, Shield, Sparkles, ArrowRight, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PremiumPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Fake scarcity counter for marketing (you can hardcode this to look like it's running out)
  const spotsLeft = 14; 

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      // Check if it's a coach (redirect them, this is for athletes right now)
      const { data: cData } = await supabase.from('coaches').select('id').eq('id', session.user.id).maybeSingle();
      if (cData) {
        router.push('/dashboard');
        return;
      }

      const { data: aData } = await supabase
        .from('athletes')
        .select('id, is_premium')
        .eq('id', session.user.id)
        .maybeSingle();

      if (aData) {
        setAthleteId(aData.id);
        setIsPremium(aData.is_premium || false);
      }
      
      setLoading(false);
    }
    
    loadUser();
  }, [supabase, router]);

  const handleClaimPremium = async () => {
    if (!athleteId) {
      router.push('/login'); // Not logged in
      return;
    }

    setIsClaiming(true);

    try {
      // 🚨 Make sure you added the 'is_premium' boolean column to your 'athletes' table!
      const { error } = await supabase
        .from('athletes')
        .update({ is_premium: true })
        .eq('id', athleteId);

      if (error) throw error;

      setIsPremium(true);
      setShowSuccess(true);

    } catch (err: any) {
      alert("Failed to claim: " + err.message);
    } finally {
      setIsClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white font-sans pb-32 relative overflow-hidden selection:bg-amber-500/30">
      
      {/* 🚨 KEYFRAME INJECTIONS FOR DOPAMINE 🚨 */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes crown-float { 0%, 100% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-10px) rotate(5deg); } }
        @keyframes shine { 0% { left: -100%; } 20%, 100% { left: 200%; } }
      `}} />

      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-6 pt-20 relative z-10">
        
        {/* HEADER */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 border border-amber-500/30 rounded-full mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <Crown className="w-12 h-12 text-amber-400 animate-[crown-float_4s_ease-in-out_infinite]" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
            Unlock <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-transparent bg-clip-text">ChasedPro</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            The ultimate toolkit to dominate the leaderboards, get recruited, and flex on the competition.
          </p>
        </div>

        {/* PRICING CARD & SCARCITY */}
        <div className="max-w-lg mx-auto">
          
          {/* THE OFFER BADGE */}
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-t-3xl p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 skew-x-[45deg] animate-[shine_3s_ease-in-out_infinite]"></div>
            <h3 className="text-amber-950 font-black text-lg uppercase tracking-widest relative z-10 flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 fill-current" /> Lifetime Founder's Pass
            </h3>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-b-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            
            {/* PRICING */}
            <div className="text-center mb-8 pb-8 border-b border-slate-800">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-3xl text-slate-500 font-bold line-through decoration-red-500/50 decoration-4">$7.99/mo</span>
                <span className="text-6xl font-black text-white">FREE</span>
              </div>
              <p className="text-emerald-400 font-bold text-sm bg-emerald-500/10 inline-block px-3 py-1 rounded-lg border border-emerald-500/20">
                You pay $0.00 forever.
              </p>
            </div>

            {/* SCARCITY BAR */}
            <div className="mb-8 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Spots Claimed</span>
                <span className="text-sm font-black text-amber-400">{100 - spotsLeft} / 100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-amber-600 to-yellow-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${((100 - spotsLeft) / 100) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-center text-slate-500 mt-3 font-medium">
                Only <strong className="text-white">{spotsLeft} spots left</strong> to claim lifetime access.
              </p>
            </div>

            {/* FEATURES */}
            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Pro Verification Badge</h4>
                  <p className="text-sm text-slate-400 font-medium">Gold checkmark next to your name globally.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Unlimited Coach Pitches</h4>
                  <p className="text-sm text-slate-400 font-medium">Bypass the 10-message daily limit.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Read Receipts <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded ml-1 border border-blue-500/30">Soon</span></h4>
                  <p className="text-sm text-slate-400 font-medium">See exactly when a coach opens your pitch.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Premium Cosmetics <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded ml-1 border border-blue-500/30">Soon</span></h4>
                  <p className="text-sm text-slate-400 font-medium">Access to VIP-only borders in the Vault.</p>
                </div>
              </div>
            </div>

            {/* CTA BUTTON */}
            {isPremium ? (
              <button disabled className="w-full bg-slate-800 text-slate-400 font-black py-4 sm:py-5 rounded-2xl flex items-center justify-center gap-2 border border-slate-700 cursor-not-allowed">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" /> You are a ChasedPro Member
              </button>
            ) : (
              <button 
                onClick={handleClaimPremium}
                disabled={isClaiming}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-amber-950 font-black text-lg py-4 sm:py-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2"
              >
                {isClaiming ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Claim Free Lifetime Access <ArrowRight className="w-6 h-6" /></>}
              </button>
            )}

          </div>
        </div>

      </div>

      {/* SUCCESS MODAL (DOPAMINE HIT) */}
      {showSuccess && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-900 border border-slate-700 p-8 md:p-12 rounded-[2.5rem] shadow-[0_0_100px_rgba(245,158,11,0.3)] text-center max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 to-yellow-500"></div>
            
            <div className="w-24 h-24 bg-amber-500/20 border border-amber-500/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
              <Crown className="w-12 h-12 text-amber-400 drop-shadow-lg" />
            </div>
            
            <h2 className="text-3xl font-black text-white mb-2">Welcome to Pro.</h2>
            <p className="text-slate-400 font-medium mb-8 text-lg">
              You've officially secured your Lifetime Founder's Pass. Your account has been upgraded.
            </p>

            <Link href="/dashboard" className="w-full inline-block bg-white text-slate-900 font-black py-4 rounded-xl hover:bg-slate-200 transition-colors">
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
      
    </main>
  );
}