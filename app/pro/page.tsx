'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Crown, Rocket, FileText, BarChart3, Sparkles, CheckCircle2, ChevronLeft, ShieldCheck, Trophy, Mail, Zap, ArrowRight, Loader2, Tag, AlertCircle, Search } from 'lucide-react';
import Link from 'next/link';

export default function PremiumPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  
  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  
  const [isClaiming, setIsClaiming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Fake scarcity counter for marketing
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
        router.push('/dashboard/coach');
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

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    
    // HARDCODED PROMO CODE LOGIC
    if (promoCode.toUpperCase() === 'FOUNDER100') {
      setIsPromoApplied(true);
    } else {
      setPromoError('Invalid or expired promo code.');
      setIsPromoApplied(false);
    }
  };

  const handleClaimPremium = async () => {
    if (!athleteId) {
      router.push('/login'); 
      return;
    }

    // Block unless promo is applied (until Stripe is ready)
    if (!isPromoApplied && process.env.NODE_ENV !== 'development') {
      setPromoError('Stripe billing is not active yet. Please use a Founder code.');
      return;
    }

    setIsClaiming(true);

    try {
      // 1. Fetch current boosts to prevent overwriting existing balance
      const { data: currentData, error: fetchError } = await supabase
        .from('athletes')
        .select('boosts_available')
        .eq('id', athleteId)
        .single();

      if (fetchError) throw fetchError;

      const currentBoosts = currentData?.boosts_available || 0;

      // 2. Safely add 5 boosts, set premium, and flag as a lifetime founder
      const { error: updateError } = await supabase
        .from('athletes')
        .update({ 
          is_premium: true,
          is_founder: true, // Permanent lifetime marker! (Make sure to add this column to the athletes table)
          boosts_available: currentBoosts + 5 
        })
        .eq('id', athleteId);

      if (updateError) throw updateError;

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-900 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans pb-32 relative overflow-hidden selection:bg-amber-500/30">
      
      {/* 🚨 KEYFRAME INJECTIONS FOR DOPAMINE 🚨 */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes crown-float { 0%, 100% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-10px) rotate(5deg); } }
        @keyframes shine { 0% { left: -100%; } 20%, 100% { left: 200%; } }
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
      `}} />

      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 pt-12 relative z-10">
        
        {/* NAV */}
        <Link href="/feed" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-white transition-colors mb-12 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800 backdrop-blur-md">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Network
        </Link>

        {/* HEADER */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 border border-amber-500/30 rounded-full mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <Crown className="w-12 h-12 text-amber-400 animate-[crown-float_4s_ease-in-out_infinite]" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
            Get Recruited <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-transparent bg-clip-text">Faster.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Unlock the ultimate scouting toolkit. Stand out in the Recruiting Zone, track which coaches are watching you, and take control of your athletic future.
          </p>
        </div>

        {/* MAIN CONTENT GRID */}
        {isPremium ? (
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 text-center max-w-2xl mx-auto shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden">
             <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
             <CheckCircle2 className="w-16 h-16 text-amber-500 mx-auto mb-4" />
             <h2 className="text-3xl font-black text-white mb-2">You are a Pro Member</h2>
             <p className="text-slate-400 font-medium mb-6">Your profile is currently boosted with Pro features. Go make some noise in the Recruiting feed!</p>
             <Link href="/dashboard" className="inline-block bg-white text-slate-900 font-black px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-colors">
               Go to Dashboard
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* LEFT COLUMN: THE FEATURES */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Feature 1 */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-4">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Custom Pitches</h3>
                  <p className="text-slate-400 text-sm font-medium">Break free from automated text. Write custom, highly-targeted recruiting letters directly to college coaches.</p>
                </div>

                {/* Feature 2 */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-4">
                    <FileText className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Athletic Resume</h3>
                  <p className="text-slate-400 text-sm font-medium">Save your GPA, test scores, and key achievements. Attach them to any pitch with a single click.</p>
                </div>

                {/* Feature 3 */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 mb-4">
                    <Trophy className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Multi-PR Displays</h3>
                  <p className="text-slate-400 text-sm font-medium">Why highlight just one event? Attach up to 10 verified marks to your pitches to show off your true range.</p>
                </div>

                {/* Feature 4 */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 mb-4">
                    <BarChart3 className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Coach Analytics</h3>
                  <p className="text-slate-400 text-sm font-medium">Stop guessing. See exactly how many D1, D2, and D3 coaches have viewed your profile and read your pitches.</p>
                </div>

                {/* Feature 5 */}
                <div className="sm:col-span-2 bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm hover:bg-slate-900 transition-colors flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shrink-0">
                    <Search className="w-7 h-7 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white mb-2">URL Scouter Access</h3>
                    <p className="text-slate-400 text-sm font-medium">Paste any athlete's Athletic.net link into your dashboard to instantly generate a recruiting score and see how you stack up against the competition.</p>
                  </div>
                </div>

              </div>

              {/* The "Boost" Showcase */}
              <div className="p-1 rounded-[2.1rem] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 animate-[shimmerSlow_4s_linear_infinite] bg-[length:200%_auto] shadow-lg shadow-amber-500/20">
                <div className="bg-slate-900 rounded-[2rem] p-8 relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/30 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <Rocket className="w-8 h-8 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white mb-2">Includes 5 Monthly Feed Boosts</h3>
                    <p className="text-slate-400 font-medium">
                      Every month, you get 5 free Boosts. Use them to instantly pin your pitch to the very top of the Recruiting Feed with a glowing golden border. Guarantee that every coach who logs in sees your name.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PRICING CARD & SCARCITY */}
            <div className="lg:col-span-5 relative">
              <div className="sticky top-8">
                
                {/* THE OFFER BADGE */}
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-t-[2.5rem] p-4 text-center relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-white/20 skew-x-[45deg] animate-[shine_3s_ease-in-out_infinite]"></div>
                  <h3 className="text-amber-950 font-black text-lg uppercase tracking-widest relative z-10 flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5 fill-current" /> Early Adopter Program
                  </h3>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-b-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  
                  {/* PRICING */}
                  <div className="text-center mb-8 pb-8 border-b border-slate-800">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      {isPromoApplied ? (
                        <>
                          <span className="text-3xl text-slate-500 font-bold line-through decoration-red-500/50 decoration-4">$7.99/mo</span>
                          <span className="text-6xl font-black text-emerald-400 tracking-tighter">FREE</span>
                        </>
                      ) : (
                        <span className="text-6xl font-black text-white tracking-tighter">$7.99<span className="text-3xl text-slate-400">/mo</span></span>
                      )}
                    </div>
                    {isPromoApplied ? (
                       <p className="text-emerald-400 font-bold text-sm bg-emerald-500/10 inline-block px-3 py-1 rounded-lg border border-emerald-500/20 mt-2">
                         Lifetime access unlocked!
                       </p>
                    ) : (
                       <p className="text-amber-400 font-bold text-sm bg-amber-500/10 inline-block px-3 py-1 rounded-lg border border-amber-500/20 mt-2">
                         Billed monthly. Cancel anytime.
                       </p>
                    )}
                  </div>

                  {/* PROMO CODE SYSTEM */}
                  <div className="mb-6 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Have a Promo Code?</p>
                     <form onSubmit={handleApplyPromo} className="flex gap-2">
                       <input 
                         type="text" 
                         value={promoCode}
                         onChange={(e) => setPromoCode(e.target.value)}
                         disabled={isPromoApplied}
                         placeholder="Enter code..." 
                         className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500 text-sm font-mono uppercase disabled:opacity-50"
                       />
                       <button 
                         type="submit" 
                         disabled={isPromoApplied || !promoCode.trim()}
                         className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${isPromoApplied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                       >
                         {isPromoApplied ? 'Applied!' : 'Apply'}
                       </button>
                     </form>
                     {promoError && <p className="text-xs text-red-400 font-bold mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {promoError}</p>}
                     <p className="text-[10px] text-slate-500 mt-2 italic">Hint: Try typing 'FOUNDER100'</p>
                  </div>

                  {/* SCARCITY BAR */}
                  <div className="mb-8">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Founder Spots Left</span>
                      <span className="text-sm font-black text-amber-400">{spotsLeft} / 100</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-amber-600 to-yellow-400 h-full rounded-full"
                        style={{ width: `${((100 - spotsLeft) / 100) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* CTA BUTTON */}
                  <button 
                    onClick={handleClaimPremium}
                    disabled={isClaiming || (!isPromoApplied && process.env.NODE_ENV !== 'development')} // Fake block unless promo is applied
                    className={`w-full font-black text-lg py-4 sm:py-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${isPromoApplied ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-900 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]' : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]'}`}
                  >
                    {isClaiming ? <Loader2 className="w-6 h-6 animate-spin" /> : <>
                       {isPromoApplied ? 'Claim Free Access' : 'Upgrade to Pro'} <ArrowRight className="w-6 h-6" />
                    </>}
                  </button>
                  <p className="text-center text-xs font-bold text-slate-500 mt-4 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Account upgraded instantly.
                  </p>

                </div>
                
                {/* Decorative background blur behind card */}
                <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 to-purple-600/20 blur-2xl -z-20 rounded-[3rem] pointer-events-none"></div>
              </div>
            </div>

          </div>
        )}
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
              You've officially secured your Lifetime Founder's Pass. 5 Free Boosts have been deposited into your account!
            </p>

            <Link href="/dashboard" className="w-full inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-black py-4 rounded-xl hover:bg-slate-200 transition-colors">
              Go to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}
      
    </main>
  );
}