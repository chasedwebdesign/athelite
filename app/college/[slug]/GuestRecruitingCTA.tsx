// app/college/[slug]/GuestRecruitingCTA.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import {
  Mail,
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowRight,
  Target,
  CheckCircle2,
  Flame,
} from 'lucide-react';

interface GuestRecruitingCTAProps {
  collegeName: string;
  collegeSlug: string;
  division?: string | null;
  activeSport?: string | null;
}

export default function GuestRecruitingCTA({
  collegeName,
  collegeSlug,
  division,
  activeSport,
}: GuestRecruitingCTAProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function checkUserSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
      }
    }

    checkUserSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: unknown } | null) => {
        setIsAuthenticated(Boolean(session?.user));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Hide completely for logged-in athletes
  if (isAuthenticated) {
    return null;
  }

  const sportText = activeSport ? `${activeSport} ` : '';
  const divisionBadgeText = division ? `${division} Recruiting Open` : 'Recruiting Window Open';

  const signupParams = new URLSearchParams({
    college: collegeName,
    slug: collegeSlug,
    ...(activeSport && { sport: activeSport }),
  }).toString();

  return (
    <section
      aria-label={`Get Recruited by ${collegeName}`}
      className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 sm:p-10 md:p-14 text-white shadow-[0_25px_70px_-15px_rgba(37,99,235,0.45)] border border-blue-400/30 text-center"
    >
      {/* Ambient Glowing Backdrops */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/25 blur-[110px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 right-0 w-[350px] h-[350px] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
        {/* Top Live Urgency Pill */}
        <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 backdrop-blur-md border border-blue-400/30 text-blue-300 text-[11px] sm:text-xs font-black uppercase tracking-widest mb-6 shadow-inner">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span>{divisionBadgeText} • Direct Coach Access</span>
        </div>

        {/* High-Conversion Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-[1.08] mb-4">
          Make a Profile to Get in Contact With{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
            {collegeName}
          </span>{' '}
          Coaches{' '}
          <span className="underline decoration-amber-400/80 decoration-wavy underline-offset-4 text-amber-300">
            RIGHT NOW
          </span>
        </h2>

        {/* Persuasive Subheadline */}
        <p className="text-sm sm:text-base md:text-lg text-slate-300 font-medium leading-relaxed max-w-2xl mb-8">
          Don&apos;t wait for coaches to stumble across your name. Build your free verified athlete profile in 60 seconds to see if your marks hit{' '}
          <strong className="text-white font-bold">{collegeName}&apos;s {sportText}standards</strong> and send a direct pitch straight to the coaching staff.
        </p>

        {/* 3 Value Pillars Grid (Centered & Sharp on Mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full mb-8">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 mb-2.5 shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide mb-1">
              1-Click Coach Emails
            </h3>
            <p className="text-xs text-slate-300 font-medium leading-snug">
              Unlock verified {collegeName} coach contacts & proven recruiting templates.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-2.5 shadow-inner">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide mb-1">
              Instant Roster Match
            </h3>
            <p className="text-xs text-slate-300 font-medium leading-snug">
              Sync your PRs & stats to calculate your exact walk-on & scholarship readiness.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-2.5 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide mb-1">
              Verified Recruit Badge
            </h3>
            <p className="text-xs text-slate-300 font-medium leading-snug">
              Stand out in {collegeName} coach inboxes with an official verified link.
            </p>
          </div>
        </div>

        {/* Primary & Secondary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
          <Link
            href={`/signup?${signupParams}`}
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-sm sm:text-base px-8 py-4 rounded-2xl shadow-[0_0_35px_rgba(59,130,246,0.5)] hover:shadow-[0_0_50px_rgba(59,130,246,0.75)] border border-blue-300/40 transition-all duration-300 active:scale-[0.98]"
          >
            <Flame className="w-5 h-5 text-amber-300 shrink-0 animate-pulse" />
            <span>Create Free Profile & Contact Coaches</span>
            <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-md text-slate-200 hover:text-white font-bold text-sm px-6 py-4 rounded-2xl border border-white/15 transition-all"
          >
            <span>Already have a profile? Log In</span>
          </Link>
        </div>

        {/* Friction-Reducing Trust Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] sm:text-xs font-bold text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            100% Free Athlete Account
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            60-Second Setup
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Instant {collegeName} Match Score
          </span>
        </div>
      </div>
    </section>
  );
}