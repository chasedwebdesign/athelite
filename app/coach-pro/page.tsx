'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Crown, Timer, Search, EyeOff, Save, CheckCircle2, ChevronLeft, ShieldCheck, Zap, ArrowRight, Loader2, Tag, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CoachPremiumPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  
  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  
  const [isClaiming, setIsClaiming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        router.push('/login');
        return;
      }

      // Check if it's an athlete (redirect them to athlete pro page)
      const { data: aData } = await supabase.from('athletes').select('id').eq('id', session.user.id).maybeSingle();
      if (aData) {
        router.push('/pro');
        return;
      }

      const { data: cData } = await supabase
        .from('coaches')
        .select('id, is_premium')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cData) {
        setCoachId(cData.id);
        setIsPremium(cData.is_premium || false);
      }
      
      setLoading(false);
    }
    
    loadUser();
  }, [supabase, router]);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    
    // HARDCODED PROMO CODE LOGIC (You can move this to a database table later!)
    if (promoCode.toUpperCase() === 'FOUNDER100') {
      setIsPromoApplied(true);
    } else {
      setPromoError('Invalid or expired promo code.');
      setIsPromoApplied(false);
    }
  };

  const handleClaimPremium = async () => {
    if (!coachId) {
      router.push('/login'); 
      return;
    }

    // If they haven't applied the 100% off code, block them (until Stripe is added)
    if (!isPromoApplied) {
      setPromoError('Stripe billing is not active yet. Please use a Founder code.');
      return;
    }

    setIsClaiming(true);

    try {
      const { error: updateError } = await supabase
        .from('coaches')
        .update({ is_premium: true })
        .eq('id', coachId);

      if (updateError) throw updateError;

      setIsPremium(true);
      setShowSuccess(true);

    } catch (err: any) {
      alert("Failed to upgrade: " + err.message);
    } finally {
      setIsClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-900 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans pb-32 relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* 🚨 KEYFRAME INJECTIONS FOR DOPAMINE 🚨 */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes crown-float { 0%, 100% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-10px) rotate(5deg); } }
        @keyframes shine { 0% { left: -100%; } 20%, 100% { left: 200%; } }
      `}} />

      {/* BACKGROUND EFFECTS (Tailored to Coach Indigo/Blue Theme) */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 pt-12 relative z-10">
        
        {/* NAV */}
        <Link href="/dashboard/coach" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-white transition-colors mb-12 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800 backdrop-blur-md">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        {/* HEADER */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-full mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <Crown className="w-12 h-12 text-indigo-400 animate-[crown-float_4s_ease-in-out_infinite]" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
            Scout Smarter. <span className="bg-gradient-to-r from-indigo-300 via-blue-400 to-indigo-500 text-transparent bg-clip-text">Not Harder.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Unlock the Coach Pro Engine. Bypass the noise, set strict time requirements, and find exactly the athletes your program needs.
          </p>
        </div>

        {/* MAIN CONTENT GRID */}
        {isPremium ? (
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 text-center max-w-2xl mx-auto shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden">
             <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 to-blue-600"></div>
             <CheckCircle2 className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
             <h2 className="text-3xl font-black text-white mb-2">You are a Pro Coach</h2>
             <p className="text-slate-400 font-medium mb-6">Your dashboard is fully unlocked. You have unlimited access to the URL Scouter and Advanced Filters.</p>
             <Link href="/feed" className="inline-block bg-white text-slate-900 font-black px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-colors">
               Go to the Recruiting Feed
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* LEFT COLUMN: THE FEATURES */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Feature 1 */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-4">
                    <Timer className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Strict Mark Minimums</h3>
                  <p className="text-slate-400 text-sm font-medium">Filter the entire database by exact times or marks (e.g., Sub 10.8 in the 100m, or 22'+ in the Long Jump).</p>
                </div>

                {/* Feature 2 */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 mb-4">
                    <EyeOff className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Boost Bypass</h3>
                  <p className="text-slate-400 text-sm font-medium">Free coaches are forced to scroll past sponsored (Boosted) athletes. Pro coaches bypass the noise completely.</p>
                </div>

                {/* Feature 3 */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-4">
                    <Search className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">URL Scouter Access</h3>
                  <p className="text-slate-400 text-sm font-medium">Paste any Athletic.net URL into the dashboard to instantly generate a ChasedSports recruiting grade and tier projection.</p>
                </div>

                {/* Feature 4 */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 mb-4">
                    <Save className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Saved Presets</h3>
                  <p className="text-slate-400 text-sm font-medium">Save your complex search queries. Check back every week to instantly see new recruits who crossed your program's barriers.</p>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN: PRICING CARD */}
            <div className="lg:col-span-5 relative">
              <div className="sticky top-8">
                
                {/* THE OFFER BADGE */}
                <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-t-[2.5rem] p-4 text-center relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-white/20 skew-x-[45deg] animate-[shine_3s_ease-in-out_infinite]"></div>
                  <h3 className="text-white font-black text-lg uppercase tracking-widest relative z-10 flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5 fill-current" /> Early Adopter Program
                  </h3>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-b-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col">
                  
                  {/* PRICING */}
                  <div className="text-center mb-8 pb-8 border-b border-slate-800">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      {isPromoApplied ? (
                        <>
                          <span className="text-3xl text-slate-500 font-bold line-through decoration-red-500/50 decoration-4">$49.99/mo</span>
                          <span className="text-6xl font-black text-emerald-400 tracking-tighter">FREE</span>
                        </>
                      ) : (
                        <span className="text-6xl font-black text-white tracking-tighter">$49<span className="text-3xl text-slate-400">/mo</span></span>
                      )}
                    </div>
                    {isPromoApplied ? (
                       <p className="text-emerald-400 font-bold text-sm bg-emerald-500/10 inline-block px-3 py-1 rounded-lg border border-emerald-500/20 mt-2">
                         Lifetime access unlocked!
                       </p>
                    ) : (
                       <p className="text-indigo-400 font-bold text-sm bg-indigo-500/10 inline-block px-3 py-1 rounded-lg border border-indigo-500/20 mt-2">
                         Billed monthly. Cancel anytime.
                       </p>
                    )}
                  </div>

                  {/* PROMO CODE SYSTEM */}
                  <div className="mb-8 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Have a Promo Code?</p>
                     <form onSubmit={handleApplyPromo} className="flex gap-2">
                       <input 
                         type="text" 
                         value={promoCode}
                         onChange={(e) => setPromoCode(e.target.value)}
                         disabled={isPromoApplied}
                         placeholder="Enter code..." 
                         className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm font-mono uppercase disabled:opacity-50"
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

                  {/* CTA BUTTON */}
                  <button 
                    onClick={handleClaimPremium}
                    disabled={isClaiming || (!isPromoApplied && process.env.NODE_ENV !== 'development')} // Fake block unless promo is applied
                    className={`w-full font-black text-lg py-4 sm:py-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${isPromoApplied ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-900 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]' : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:shadow-[0_0_40px_rgba(99,102,241,0.4)]'}`}
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
                <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/20 to-blue-600/20 blur-2xl -z-20 rounded-[3rem] pointer-events-none"></div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* SUCCESS MODAL (DOPAMINE HIT) */}
      {showSuccess && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-900 border border-slate-700 p-8 md:p-12 rounded-[2.5rem] shadow-[0_0_100px_rgba(99,102,241,0.3)] text-center max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-400 to-blue-500"></div>
            
            <div className="w-24 h-24 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
              <Crown className="w-12 h-12 text-indigo-400 drop-shadow-lg" />
            </div>
            
            <h2 className="text-3xl font-black text-white mb-2">Welcome to Pro.</h2>
            <p className="text-slate-400 font-medium mb-8 text-lg">
              You've officially secured the Coach Pro Engine. The recruiting feed is now fully unlocked.
            </p>

            <Link href="/feed" className="w-full inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-black py-4 rounded-xl hover:bg-slate-200 transition-colors">
              Go to the Feed <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}
      
    </main>
  );
}