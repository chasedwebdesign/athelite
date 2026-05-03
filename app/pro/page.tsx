'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Crown, Rocket, FileText, BarChart3, ShieldCheck, Trophy, Mail, Zap, ArrowRight, Loader2, Search, CheckCircle2, ChevronLeft, Tag, Settings } from 'lucide-react';
import Link from 'next/link';

export default function PremiumPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

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
        setUserEmail(session.user.email || null);
        setIsPremium(aData.is_premium || false);
      }
      
      setLoading(false);
    }
    
    loadUser();
  }, [supabase, router]);

  const handleCheckout = async () => {
    if (!athleteId) {
      router.push('/login'); 
      return;
    }
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: athleteId, email: userEmail }),
      });
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err: any) {
      alert("Failed to connect to billing provider: " + err.message);
      setIsRedirecting(false);
    }
  };

  // 🚨 NEW PORTAL REDIRECT LOGIC 🚨
  const handleManageBilling = async () => {
    setIsManaging(true);
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err: any) {
      alert("Could not load billing portal: " + err.message);
      setIsManaging(false);
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
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes crown-float { 0%, 100% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-10px) rotate(5deg); } }
        @keyframes shine { 0% { left: -100%; } 20%, 100% { left: 200%; } }
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
      `}} />

      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] z-0 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 pt-12 relative z-10">
        
        <Link href="/dashboard/track" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-white transition-colors mb-12 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800 backdrop-blur-md">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

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

        {isPremium ? (
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 text-center max-w-2xl mx-auto shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden">
             <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
             <CheckCircle2 className="w-16 h-16 text-amber-500 mx-auto mb-4" />
             <h2 className="text-3xl font-black text-white mb-2">You are a Pro Member</h2>
             <p className="text-slate-400 font-medium mb-8">Your profile is currently boosted with Pro features. Go make some noise in the Recruiting feed!</p>
             
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <Link href="/dashboard/track" className="w-full sm:w-auto inline-flex justify-center bg-white text-slate-900 font-black px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-colors">
                 Go to Dashboard
               </Link>
               {/* 🚨 NEW MANAGE SUBSCRIPTION BUTTON 🚨 */}
               <button 
                 onClick={handleManageBilling}
                 disabled={isManaging}
                 className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-70"
               >
                 {isManaging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Settings className="w-5 h-5" />}
                 Manage Subscription
               </button>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-4">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Custom Pitches</h3>
                  <p className="text-slate-400 text-sm font-medium">Break free from automated text. Write custom, highly-targeted recruiting letters directly to college coaches.</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-4">
                    <FileText className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Athletic Resume</h3>
                  <p className="text-slate-400 text-sm font-medium">Save your GPA, test scores, and key achievements. Attach them to any pitch with a single click.</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 mb-4">
                    <Trophy className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Multi-PR Displays</h3>
                  <p className="text-slate-400 text-sm font-medium">Why highlight just one event? Attach up to 10 verified marks to your pitches to show off your true range.</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 mb-4">
                    <BarChart3 className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">Coach Analytics</h3>
                  <p className="text-slate-400 text-sm font-medium">Stop guessing. See exactly how many D1, D2, and D3 coaches have viewed your profile and read your pitches.</p>
                </div>
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

            <div className="lg:col-span-5 relative">
              <div className="sticky top-8">
                
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  
                  <div className="text-center mb-8 pb-8 border-b border-slate-800">
                    <h3 className="text-xl font-black text-white mb-4">ChasedSports Pro</h3>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <span className="text-6xl font-black text-white tracking-tighter">$7.99<span className="text-3xl text-slate-400">/mo</span></span>
                    </div>
                    <p className="text-amber-400 font-bold text-sm bg-amber-500/10 inline-block px-3 py-1 rounded-lg border border-amber-500/20 mt-2 mb-5">
                      Billed monthly. Cancel anytime.
                    </p>
                    
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-xs sm:text-sm font-medium bg-slate-950 py-2.5 px-4 rounded-xl border border-slate-800 w-fit mx-auto">
                      <Tag className="w-4 h-4 text-emerald-400 shrink-0" /> Have a promo code? Enter it at checkout.
                    </div>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    disabled={isRedirecting}
                    className="w-full font-black text-lg py-4 sm:py-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isRedirecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <>
                       Upgrade to Pro <ArrowRight className="w-6 h-6" />
                    </>}
                  </button>
                  
                  <p className="text-center text-xs font-bold text-slate-500 mt-4 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Secure checkout powered by Stripe.
                  </p>

                </div>
                
                <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 to-purple-600/20 blur-2xl -z-20 rounded-[3rem] pointer-events-none"></div>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}