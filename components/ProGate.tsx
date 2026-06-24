'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Crown, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// 🚨 CONFIGURE YOUR LAUNCH TIMELINE HERE
// 50 days from June 19, 2026 is August 8, 2026.
const PRO_LAUNCH_DATE = new Date('2026-08-08T00:00:00Z'); 
const FOUNDER_FREE_MONTHS = 6;

interface ProGateProps {
  athleteProfile: any;
  featureName: string;
  children: React.ReactNode;
  // Optional: If true, it renders the locked state inline without a massive card (good for small buttons)
  compact?: boolean; 
}

export default function ProGate({ athleteProfile, featureName, children, compact = false }: ProGateProps) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [isPreLaunch, setIsPreLaunch] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const calculateTime = () => {
      const now = new Date().getTime();
      const launchTime = PRO_LAUNCH_DATE.getTime();
      const difference = launchTime - now;

      if (difference > 0) {
        setIsPreLaunch(true);
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
        });
      } else {
        setIsPreLaunch(false);
        setTimeLeft(null);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Prevent hydration mismatch between server HTML and client timer rendering
  if (!isMounted) return null; 

  // --- ACCESS LOGIC ---
  const isPremium = athleteProfile?.is_premium;
  const isFounder = athleteProfile?.is_founder;
  
  // Calculate if the 6-month founder trial is still active POST-launch
  const founderExpirationDate = new Date(PRO_LAUNCH_DATE);
  founderExpirationDate.setMonth(founderExpirationDate.getMonth() + FOUNDER_FREE_MONTHS);
  const isFounderActive = isFounder && new Date() < founderExpirationDate;

  // 🚨 DYNAMIC GATING SWITCH 🚨
  let hasAccess = false;
  
  if (isPreLaunch) {
    // PRE-LAUNCH: Feature is locked to everyone except Founders
    hasAccess = isFounder === true || isPremium === true; 
  } else {
    // POST-LAUNCH: Feature is locked to everyone except Premium users and Active Founders
    hasAccess = isPremium === true || isFounderActive === true;
  }

  // --- UI RENDER: UNLOCKED (EARLY ACCESS PHASE) ---
  if (hasAccess && isPreLaunch) {
    return (
      <div className="relative group">
        {/* Subtle Early Access Floating Badge */}
        <div className="absolute -top-3 -right-2 md:-right-4 z-50 animate-in fade-in zoom-in duration-500 pointer-events-none">
          <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(192,38,211,0.5)] flex items-center gap-1.5 border border-fuchsia-400/50">
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Founder Access • </span>
            {timeLeft ? `${timeLeft.d}d ${timeLeft.h}h left` : 'Calculating...'}
          </div>
        </div>
        {children}
      </div>
    );
  }

  // --- UI RENDER: UNLOCKED (POST-LAUNCH: PRO OR ACTIVE FOUNDER PHASE) ---
  if (hasAccess && !isPreLaunch) {
    return (
      <div className="relative group">
        {/* Subtle Pro or Founder Badge */}
        <div className="absolute -top-3 -right-2 md:-right-4 z-50 pointer-events-none">
          <div className="bg-slate-900 text-amber-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1 border border-slate-700">
            <Crown className="w-3 h-3" /> {isPremium ? 'PRO' : 'FOUNDER PRO'}
          </div>
        </div>
        {children}
      </div>
    );
  }

  // --- UI RENDER: LOCKED STATE ---
  if (compact) {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center justify-between opacity-70 grayscale-[50%]">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-slate-400" />
          <span className="font-bold text-slate-600">{featureName}</span>
        </div>
        <Link href="/pro" className="text-xs font-black text-amber-600 uppercase tracking-widest hover:text-amber-700 transition-colors">
          {isPreLaunch ? 'View Launch Details' : 'Unlock Pro'}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center min-h-[300px] group">
      {/* Background Aesthetics */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-fuchsia-500"></div>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none transition-transform group-hover:scale-150 duration-700"></div>
      
      <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative z-10">
        <Lock className="w-8 h-8 text-amber-500" />
      </div>
      
      <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3 relative z-10">
        {isPreLaunch ? `${featureName} is Early Access` : `${featureName} is a Pro Feature`}
      </h3>
      
      <p className="text-slate-400 font-medium max-w-md mx-auto mb-8 relative z-10">
        {isPreLaunch 
          ? "This feature is currently locked. It is available exclusively to early-access Founder members, and will open globally to Premium accounts upon our official launch."
          : "Upgrade to ChasedSports Pro to unlock advanced analytics, custom email builders, premium social graphics, and VIP matchmaking priority."}
      </p>
      
      {!isPreLaunch && (
        <Link 
          href="/pro" 
          className="relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:-translate-y-1 flex items-center gap-2 z-10"
        >
          <Crown className="w-5 h-5" /> Unlock Pro Now <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      )}
    </div>
  );
}