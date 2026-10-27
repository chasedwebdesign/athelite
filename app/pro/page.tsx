'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Crown,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Settings,
  Sparkles,
  XCircle,
  Video,
  Coins,
  Clock,
  Zap,
  Check,
  Minus,
  ChevronDown,
  Eye,
  Lock,
  HelpCircle,
  CheckCircle2,
  Gift,
  Calendar,
  Flame,
  X
} from 'lucide-react';
import Link from 'next/link';

// 🚨 SYNCHRONIZED LAUNCH & PROMO TIMELINE 🚨
const PRO_LAUNCH_DATE = new Date('2026-08-08T00:00:00Z');
const FOUNDER_FREE_MONTHS = 6;

// 2-Week Promo Window: Ends November 9, 2026 at 11:59:59 PM UTC
const TWO_WEEK_PROMO_END = new Date('2026-11-09T23:59:59Z');
const PROMO_FREE_MONTHS = 3;
const DURING_PROMO_STRIPE_TRIAL_DAYS = 7;
const POST_PROMO_STRIPE_TRIAL_DAYS = 14;

interface RecentUpgrade {
  firstName: string;
  lastNameInitial: string;
  state: string;
}

export default function PremiumPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [isFounder, setIsFounder] = useState(false);

  // $1 Win-Back & Retention Offer State
  const [isWinbackEligible, setIsWinbackEligible] = useState(false);
  const [hasUsedWinback, setHasUsedWinback] = useState(false);
  const [isClaimingWinback, setIsClaimingWinback] = useState(false);
  const [showRetentionModal, setShowRetentionModal] = useState(false);

  // Personalized Athlete Preview State
  const [athleteName, setAthleteName] = useState<string>('Your Profile');
  const [athleteSchool, setAthleteSchool] = useState<string>('Varsity Track & XC');
  const [athleteState, setAthleteState] = useState<string>('OR');
  const [athletePoints, setAthletePoints] = useState<number>(250);
  const [previewMode, setPreviewMode] = useState<'pro' | 'free'>('pro');

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isClaimingFreePlan, setIsClaimingFreePlan] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [clientDate, setClientDate] = useState<Date | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [claimSuccessBanner, setClaimSuccessBanner] = useState<string | null>(null);

  // Collapsed by default so mobile users scroll less
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Live Realtime State
  const [proCount, setProCount] = useState<number>(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [recentUpgrade, setRecentUpgrade] = useState<RecentUpgrade | null>(null);

  useEffect(() => {
    const now = new Date();
    setClientDate(now);

    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const { data: cData } = await supabase
        .from('coaches')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (cData) {
        router.push('/dashboard/coach');
        return;
      }

      const { data: aData } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, high_school, state, coins, is_premium, premium_expires_at, is_founder, unlocked_features')
        .eq('id', session.user.id)
        .maybeSingle();

      if (aData) {
        setAthleteId(aData.id);
        const email = session.user.email || null;
        setUserEmail(email);
        setIsFounder(aData.is_founder || false);
        setPremiumExpiresAt(aData.premium_expires_at || null);

        const expiresAtDate = aData.premium_expires_at ? new Date(aData.premium_expires_at) : null;
        const isExpired = expiresAtDate ? expiresAtDate < now : false;

        if (aData.is_premium && isExpired) {
          setIsPremium(false);
        } else {
          setIsPremium(aData.is_premium || false);
        }

        const features: string[] = Array.isArray(aData.unlocked_features)
          ? aData.unlocked_features
          : [];
        const usedDeal = features.includes('winback_1_dollar_used');
        const canceledOnceFlag = features.includes('pro_canceled_once');

        setHasUsedWinback(usedDeal);

        // Local check: if they previously canceled or had a PRO expiry that lapsed, and never used the $1 deal
        if (!usedDeal && (canceledOnceFlag || isExpired)) {
          setIsWinbackEligible(true);
        }

        const fullName = [aData.first_name, aData.last_name].filter(Boolean).join(' ');
        if (fullName) setAthleteName(fullName);
        if (aData.high_school) setAthleteSchool(aData.high_school);
        if (aData.state) setAthleteState(aData.state);
        if (typeof aData.coins === 'number' && aData.coins > 0) setAthletePoints(aData.coins);

        // Verify with Stripe backend if they have a canceled subscription on record
        if (!usedDeal) {
          try {
            const res = await fetch('/api/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                athleteId: aData.id,
                email,
                action: 'check_winback_eligibility',
              }),
            });
            if (res.ok) {
              const statusData = await res.json();
              if (statusData.hasUsedWinback) {
                setHasUsedWinback(true);
                setIsWinbackEligible(false);
              } else if (statusData.eligibleForWinback) {
                setIsWinbackEligible(true);
              }
            }
          } catch {
            // Silent fallback to local unlocked_features state
          }
        }
      }

      setLoading(false);
    }

    loadUser();
  }, [supabase, router]);

  // LIVE REALTIME UPGRADE LISTENER & PRO COUNT
  useEffect(() => {
    const fetchProCount = async () => {
      const { count } = await supabase
        .from('athletes')
        .select('id', { count: 'exact', head: true })
        .eq('is_premium', true);

      if (count !== null) setProCount(count);
    };

    fetchProCount();

    const channel = supabase
      .channel('live-pro-upgrades')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'athletes',
        },
        (payload: any) => {
          const newRecord = payload.new as Record<string, any>;
          const oldRecord = payload.old as Record<string, any>;

          if (newRecord.is_premium === true) {
            if (oldRecord && oldRecord.is_premium === true) return;

            fetchProCount();
            setRecentUpgrade({
              firstName: newRecord.first_name || 'An athlete',
              lastNameInitial: newRecord.last_name ? newRecord.last_name.charAt(0) + '.' : '',
              state: newRecord.state || 'US',
            });

            setToastVisible(true);
            setTimeout(() => setToastVisible(false), 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Check if we are currently inside the 2-week promo window
  const isTwoWeekPromoActive = useMemo(() => {
    if (!clientDate) return false;
    return clientDate <= TWO_WEEK_PROMO_END;
  }, [clientDate]);

  // 7-day trial during the 2-week promo window; auto-switches to 14-day trial once 2 weeks end
  const activeStripeTrialDays = isTwoWeekPromoActive
    ? DURING_PROMO_STRIPE_TRIAL_DAYS
    : POST_PROMO_STRIPE_TRIAL_DAYS;

  const faqItems = useMemo(
    () => [
      {
        q: 'Will I be charged today?',
        a: isWinbackEligible
          ? 'With the $1 Comeback Deal, you pay just $1.00 today for a full 30 days of PRO, then $7.99/mo afterward unless you cancel.'
          : isTwoWeekPromoActive
          ? `No. During our 2-week launch event, you can unlock ${PROMO_FREE_MONTHS} months of PRO 100% free without going to Stripe at all, or start a ${DURING_PROMO_STRIPE_TRIAL_DAYS}-day auto-billing trial for $0.00 today.`
          : `No. You pay $0.00 today and get full access to PRO for ${activeStripeTrialDays} days. Cancel anytime before your trial ends and you will never be charged.`,
      },
      {
        q: 'How does PRO help college coaches find me?',
        a: 'Your highlight video is pinned directly to your profile, your Recruiting Feed boosts last 72 hours instead of 24, and you can see which college programs viewed your profile.',
      },
      {
        q: 'How do I cancel if I change my mind?',
        a: 'The 3-month free launch plan never touches Stripe and never auto-bills. For Stripe subscriptions, you can cancel in one tap right from this page or your settings.',
      },
    ],
    [isTwoWeekPromoActive, activeStripeTrialDays, isWinbackEligible]
  );

  // 1-TAP NO-STRIPE 3-MONTH FREE CLAIM (Server-Validated via /api/checkout)
  const handleClaimThreeMonthsFree = async () => {
    if (!athleteId) {
      router.push('/signup');
      return;
    }
    if (isClaimingFreePlan) return;

    setIsClaimingFreePlan(true);
    setBillingError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId,
          email: userEmail,
          action: 'claim_3_month_free',
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Could not activate 3-month free plan.');
      }

      setIsPremium(true);
      if (data.premiumExpiresAt) {
        setPremiumExpiresAt(data.premiumExpiresAt);
      }
      setClaimSuccessBanner(
        `Unlocked! Your ${PROMO_FREE_MONTHS}-Month Free PRO Plan (+5 Boosts) is now active—no credit card required.`
      );
    } catch (err: any) {
      setBillingError(err.message || 'Could not activate your 3-month free pass.');
    } finally {
      setIsClaimingFreePlan(false);
    }
  };

  // STRIPE AUTO-BILLING TRIAL CHECKOUT (7-Day during 2 weeks, 14-Day after)
  const handleCheckout = async (requestedTrialDays?: number) => {
    if (!athleteId) {
      router.push('/login');
      return;
    }
    setIsRedirecting(true);
    setBillingError(null);
    try {
      const trialDaysToUse = requestedTrialDays ?? activeStripeTrialDays;
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId,
          email: userEmail,
          action: 'stripe_trial',
          trialDays: trialDaysToUse,
        }),
      });
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err: any) {
      setBillingError('Failed to connect to billing provider: ' + err.message);
      setIsRedirecting(false);
    }
  };

  // $1 NEXT-MONTH WIN-BACK / RETENTION CHECKOUT
  const handleClaimOneDollarWinback = async () => {
    if (!athleteId) {
      router.push('/login');
      return;
    }
    if (isClaimingWinback) return;

    setIsClaimingWinback(true);
    setBillingError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId,
          email: userEmail,
          action: 'stripe_winback_1_dollar',
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Could not apply $1.00 comeback deal.');
      }

      // If applied directly to an existing subscription on Stripe
      if (data.appliedToExistingSubscription) {
        setHasUsedWinback(true);
        setIsWinbackEligible(false);
        setShowRetentionModal(false);
        setIsPremium(true);
        if (data.premiumExpiresAt) {
          setPremiumExpiresAt(data.premiumExpiresAt);
        }
        setClaimSuccessBanner(
          'Deal Applied! Your next month of PRO is locked in at just $1.00 (then $7.99/mo after).'
        );
        setIsClaimingWinback(false);
        return;
      }

      // Otherwise redirect to Stripe Checkout for the $1.00 first month
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setIsClaimingWinback(false);
    } catch (err: any) {
      setBillingError(err.message || 'Could not activate the $1.00 deal.');
      setIsClaimingWinback(false);
      setShowRetentionModal(false);
    }
  };

  const proceedToBillingPortal = async () => {
    setShowRetentionModal(false);
    setIsManaging(true);
    setBillingError(null);
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
      setBillingError('Could not load billing portal: ' + err.message);
      setIsManaging(false);
    }
  };

  const handleManageBillingClick = () => {
    // If they haven't used their one-time $1 retention offer yet, show the retention modal first
    if (!hasUsedWinback) {
      setShowRetentionModal(true);
      return;
    }
    proceedToBillingPortal();
  };

  const isPreLaunch = clientDate ? clientDate < PRO_LAUNCH_DATE : false;

  const founderExpirationDate = new Date(PRO_LAUNCH_DATE);
  founderExpirationDate.setMonth(founderExpirationDate.getMonth() + FOUNDER_FREE_MONTHS);

  const isFounderActive = clientDate ? isFounder && clientDate < founderExpirationDate : false;

  const formattedLaunchDate = PRO_LAUNCH_DATE.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedExpirationDate = founderExpirationDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedPromoWindowEnd = TWO_WEEK_PROMO_END.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const formattedUserPromoExpiry = useMemo(() => {
    if (!premiumExpiresAt) return null;
    const d = new Date(premiumExpiresAt);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [premiumExpiresAt]);

  if (loading || !clientDate) {
    return (
      <div className="min-h-[100dvh] bg-[#0B0F19] flex items-center justify-center">
        <div className="w-16 h-16 relative flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-[#232D42] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
          <Crown className="w-6 h-6 text-cyan-400 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#0B0F19] text-white font-sans pb-16 relative overflow-x-hidden selection:bg-purple-500/30 scroll-smooth">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes crown-float { 0%, 100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-8px) rotate(4deg); filter: drop-shadow(0 10px 20px rgba(168,85,247,0.5)); } }
        @keyframes shine { 100% { left: 125%; } }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 15px rgba(34,211,238,0.4)); } 50% { opacity: 1; filter: drop-shadow(0 0 25px rgba(168,85,247,0.7)); } }
      `,
        }}
      />

      {/* Global Dark Background FX */}
      <div className="fixed top-[-10%] left-[10%] w-[500px] h-[500px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed top-[40%] right-[-10%] w-[450px] h-[450px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none z-0"></div>

      {/* $1 NEXT-MONTH RETENTION MODAL (Before Canceling / Billing Portal) */}
      {showRetentionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="bg-[#151C2C] border-2 border-amber-400/50 rounded-3xl p-6 w-full max-w-md relative shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500"></div>

            <button
              type="button"
              onClick={() => setShowRetentionModal(false)}
              className="absolute top-3.5 right-3.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-[#1E273C] transition-colors active:scale-[0.98]"
              aria-label="Close offer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>One-Time Member Retention Deal</span>
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight mb-2">
              Stay PRO for Just <span className="text-amber-400 italic">$1.00</span> Next Month
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed mb-5">
              Thinking about canceling? Keep your pinned highlight video, coach view alerts, and 3x Points active for your next billing cycle for only <strong className="text-white">$1.00</strong> (then back to $7.99/mo after).
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleClaimOneDollarWinback}
                disabled={isClaimingWinback}
                className="w-full min-h-[48px] font-black text-sm sm:text-base py-3.5 px-4 rounded-2xl transition-all shadow-[0_0_25px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-[#0B0F19] border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 active:scale-[0.98] disabled:opacity-70"
              >
                {isClaimingWinback ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#0B0F19]" />
                ) : (
                  <>
                    <span>Claim $1.00 Next Month Deal</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={proceedToBillingPortal}
                disabled={isManaging}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#1E273C] text-slate-300 hover:text-white font-bold px-4 py-3 rounded-2xl hover:bg-[#28344E] transition-all active:scale-[0.98] text-xs"
              >
                {isManaging ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <span>No thanks, continue to Billing Portal</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE SOCIAL PROOF TOAST */}
      {!isPremium && recentUpgrade && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 z-40 transition-all duration-500 pointer-events-none w-[90%] max-w-[340px] ${
            toastVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
          }`}
        >
          <div className="bg-[#151C2C]/95 backdrop-blur-md border border-[#2A354E] rounded-2xl p-3.5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] flex items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-purple-500"></div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white font-bold truncate">
                {recentUpgrade.firstName} {recentUpgrade.lastNameInitial}{' '}
                <span className="text-slate-400 font-medium">went</span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-black italic">
                  PRO
                </span>
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {recentUpgrade.state} Athlete • Just now
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md md:max-w-xl mx-auto px-4 pt-8 md:pt-12 relative z-10 flex flex-col items-center">
        {/* COMPACT HERO SECTION */}
        <div className="text-center mb-6 w-full flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 bg-[#151C2C]/90 border border-emerald-500/30 rounded-full px-3.5 py-1 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.12)]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-200 font-extrabold text-[11px] tracking-wide whitespace-nowrap">
              {isWinbackEligible && !isPremium ? (
                <>
                  Welcome Back Offer • <span className="text-amber-400 font-black">Next Month Just $1.00</span>
                </>
              ) : isTwoWeekPromoActive ? (
                <>
                  2-Week Launch Event • <span className="text-emerald-400 font-black">3 Months Free (No Card)</span>
                </>
              ) : (
                <>
                  Scholarships Save <span className="text-emerald-400 font-black">$100,000+</span>
                </>
              )}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.1] mb-2.5">
            Get Recruited{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 text-transparent bg-clip-text italic animate-[pulse-glow_3s_ease-in-out_infinite] inline-block pr-1">
              3x Faster
            </span>
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-sm mx-auto leading-relaxed">
            Pin your highlight film, see which college coaches view you, and earn 3x Points on every challenge ({athletePoints.toLocaleString()} current pts).
          </p>
        </div>

        {isPremium ? (
          <div className="bg-[#151C2C] border-2 border-purple-500/30 rounded-3xl p-6 sm:p-8 text-center w-full shadow-[0_0_60px_-15px_rgba(168,85,247,0.2)] relative overflow-hidden mb-8">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>

            <div className="relative inline-block mb-5">
              <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full"></div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 p-0.5 mx-auto shadow-2xl">
                <div className="w-full h-full bg-[#151C2C] rounded-[14px] flex items-center justify-center">
                  <Crown className="w-8 h-8 text-purple-400 animate-[crown-float_4s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
              You are{' '}
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
                PRO
              </span>
            </h2>
            <p className="text-slate-400 font-medium text-xs sm:text-sm mb-4 max-w-xs mx-auto leading-relaxed">
              Your profile is boosted with 3x Points, pinned video highlights, and 72-hour feed locks.
            </p>

            {claimSuccessBanner && (
              <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl flex items-start gap-2.5 text-left">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-emerald-300 leading-relaxed">{claimSuccessBanner}</p>
              </div>
            )}

            {formattedUserPromoExpiry && (
              <div className="inline-flex items-center gap-1.5 bg-[#0B0F19] border border-cyan-500/30 rounded-xl px-3.5 py-2 mb-5 text-xs font-bold text-cyan-300">
                <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>PRO Active Until: {formattedUserPromoExpiry}</span>
              </div>
            )}

            {billingError && (
              <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/50 rounded-2xl flex items-start gap-2.5 text-left">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-rose-300">{billingError}</p>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <Link
                href="/dashboard"
                className="w-full min-h-[44px] inline-flex justify-center items-center gap-2 bg-white text-[#0B0F19] font-black px-5 py-3.5 rounded-2xl hover:bg-slate-200 transition-all border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 active:scale-[0.98] text-sm"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={handleManageBillingClick}
                disabled={isManaging}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#1E273C] text-white font-bold px-5 py-3.5 rounded-2xl hover:bg-[#28344E] transition-all border-b-4 border-[#151C2C] active:border-b-0 active:translate-y-1 active:scale-[0.98] disabled:opacity-70 text-sm"
              >
                {isManaging ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <Settings className="w-4 h-4 text-slate-400" />
                )}
                Manage Billing
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {/* 1. MOBILE-OPTIMIZED COACH FEED SIMULATOR */}
            <div className="w-full bg-[#151C2C]/90 backdrop-blur-md border border-[#232D42] rounded-3xl p-4 shadow-xl">
              {/* Toggle Header */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                  Coach View Preview
                </span>

                <div className="inline-flex bg-[#0B0F19] p-1 rounded-xl border border-[#232D42]">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('free')}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all active:scale-[0.98] whitespace-nowrap ${
                      previewMode === 'free'
                        ? 'bg-[#1E273C] text-slate-200'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Free
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('pro')}
                    className={`min-h-[36px] px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all active:scale-[0.98] flex items-center gap-1 whitespace-nowrap ${
                      previewMode === 'pro'
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Crown className="w-3 h-3 shrink-0" /> PRO
                  </button>
                </div>
              </div>

              {/* Simulated Profile Card */}
              <div
                className={`rounded-2xl p-3.5 transition-all duration-300 relative overflow-hidden ${
                  previewMode === 'pro'
                    ? 'bg-gradient-to-br from-[#192236] via-[#151C2C] to-[#1E1B38] border-2 border-purple-500/60 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]'
                    : 'bg-[#0F1422] border border-[#1E2638] opacity-80'
                }`}
              >
                {previewMode === 'pro' && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>
                )}

                {/* Top Identity Row */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0 ${
                        previewMode === 'pro'
                          ? 'bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                          : 'bg-[#1A2234] text-slate-400 border border-[#26314A]'
                      }`}
                    >
                      {athleteName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-white text-sm truncate">{athleteName}</p>
                      <p className="text-[11px] text-slate-400 font-semibold truncate">
                        {athleteSchool} • {athleteState}
                      </p>
                    </div>
                  </div>

                  {/* Single Clean Status Pill */}
                  {previewMode === 'pro' ? (
                    <span className="inline-flex items-center gap-1 bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap shrink-0">
                      <Crown className="w-3 h-3 text-cyan-400 shrink-0" /> PRO Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-[#151C2C] border border-[#232D42] px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                      Standard
                    </span>
                  )}
                </div>

                {/* 3-Column Compact Metrics */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#232D42]/80 text-center">
                  <div
                    className={`rounded-xl py-2 px-1.5 border ${
                      previewMode === 'pro'
                        ? 'bg-[#111726] border-cyan-500/30'
                        : 'bg-[#0B0F19]/60 border-[#1A2234]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 mb-0.5 whitespace-nowrap">
                      <Video
                        className={`w-3 h-3 shrink-0 ${
                          previewMode === 'pro' ? 'text-cyan-400' : 'text-slate-600'
                        }`}
                      />
                      <span>Highlight</span>
                    </div>
                    <p
                      className={`text-xs font-black whitespace-nowrap ${
                        previewMode === 'pro' ? 'text-cyan-300' : 'text-slate-600'
                      }`}
                    >
                      {previewMode === 'pro' ? 'Pinned' : 'Locked'}
                    </p>
                  </div>

                  <div
                    className={`rounded-xl py-2 px-1.5 border ${
                      previewMode === 'pro'
                        ? 'bg-[#111726] border-amber-500/30'
                        : 'bg-[#0B0F19]/60 border-[#1A2234]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 mb-0.5 whitespace-nowrap">
                      <Coins
                        className={`w-3 h-3 shrink-0 ${
                          previewMode === 'pro' ? 'text-amber-400' : 'text-slate-600'
                        }`}
                      />
                      <span>Points</span>
                    </div>
                    <p
                      className={`text-xs font-black whitespace-nowrap ${
                        previewMode === 'pro' ? 'text-amber-300' : 'text-slate-500'
                      }`}
                    >
                      {previewMode === 'pro' ? '3x Boost' : '1x Base'}
                    </p>
                  </div>

                  <div
                    className={`rounded-xl py-2 px-1.5 border ${
                      previewMode === 'pro'
                        ? 'bg-[#111726] border-purple-500/30'
                        : 'bg-[#0B0F19]/60 border-[#1A2234]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 mb-0.5 whitespace-nowrap">
                      <Clock
                        className={`w-3 h-3 shrink-0 ${
                          previewMode === 'pro' ? 'text-purple-400' : 'text-slate-600'
                        }`}
                      />
                      <span>Feed Pin</span>
                    </div>
                    <p
                      className={`text-xs font-black whitespace-nowrap ${
                        previewMode === 'pro' ? 'text-purple-300' : 'text-slate-500'
                      }`}
                    >
                      {previewMode === 'pro' ? '72 Hours' : '24 Hours'}
                    </p>
                  </div>
                </div>

                {/* Coach View Notification Bar */}
                <div
                  className={`mt-2.5 rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] font-bold ${
                    previewMode === 'pro'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-[#151C2C]/60 border border-[#232D42] text-slate-500'
                  }`}
                >
                  {previewMode === 'pro' ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Oregon State & UO coaches watched your film</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">3 college coaches viewed you (Upgrade to reveal)</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 2. STREAMLINED ALL-IN-ONE COMPARISON CARD */}
            <div className="w-full bg-[#151C2C]/85 backdrop-blur-md border border-[#232D42] rounded-3xl pt-4 pb-3 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[84px] h-full bg-gradient-to-b from-purple-500/15 to-cyan-500/15 border-l border-purple-500/20 pointer-events-none"></div>

              <div className="grid grid-cols-[1fr_64px_84px] items-center px-3">
                <div className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider pl-1 pb-2">
                  What You Unlock
                </div>
                <div className="text-center font-bold text-slate-500 uppercase text-[10px] pb-2">
                  Free
                </div>
                <div className="text-center font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 text-xs pb-2">
                  PRO
                </div>

                <div className="col-span-3 h-px bg-[#232D42]/80"></div>

                {/* Row 1 */}
                <div className="py-2.5 pl-1 pr-2">
                  <p className="text-white font-bold text-xs leading-tight">Pinned Highlight Video</p>
                  <p className="text-[10px] text-slate-400 font-medium">Coaches watch your film in 1 tap</p>
                </div>
                <div className="flex justify-center">
                  <Minus className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex justify-center">
                  <Check className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="col-span-3 h-px bg-[#232D42]/40"></div>

                {/* Row 2 */}
                <div className="py-2.5 pl-1 pr-2">
                  <p className="text-white font-bold text-xs leading-tight">Coach View Analytics</p>
                  <p className="text-[10px] text-slate-400 font-medium">See which colleges viewed your profile</p>
                </div>
                <div className="flex justify-center">
                  <Minus className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex justify-center">
                  <Check className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="col-span-3 h-px bg-[#232D42]/40"></div>

                {/* Row 3 */}
                <div className="py-2.5 pl-1 pr-2">
                  <p className="text-white font-bold text-xs leading-tight">Recruiting Feed Lock</p>
                  <p className="text-[10px] text-slate-400 font-medium">Stay featured 3x longer per boost</p>
                </div>
                <div className="text-center text-[11px] font-bold text-slate-500 whitespace-nowrap">24h</div>
                <div className="text-center text-[11px] font-black text-cyan-400 whitespace-nowrap">72h (3x)</div>
                <div className="col-span-3 h-px bg-[#232D42]/40"></div>

                {/* Row 4 */}
                <div className="py-2.5 pl-1 pr-2">
                  <p className="text-white font-bold text-xs leading-tight">Points Multiplier</p>
                  <p className="text-[10px] text-slate-400 font-medium">3x on challenges & 2x on bundles</p>
                </div>
                <div className="text-center text-[11px] font-bold text-slate-500 whitespace-nowrap">1x</div>
                <div className="text-center text-[11px] font-black text-amber-400 whitespace-nowrap">3x Boost</div>
                <div className="col-span-3 h-px bg-[#232D42]/40"></div>

                {/* Row 5 */}
                <div className="py-2.5 pl-1 pr-2">
                  <p className="text-white font-bold text-xs leading-tight">Verified PRs & Matchmaker</p>
                  <p className="text-[10px] text-slate-400 font-medium">Auto-synced recruiting standards</p>
                </div>
                <div className="flex justify-center">
                  <Check className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex justify-center">
                  <Check className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
            </div>

            {/* ERROR STATE FOR CHECKOUT */}
            {billingError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/50 rounded-2xl flex items-start gap-2.5 text-left">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-rose-300 leading-relaxed">{billingError}</p>
              </div>
            )}

            {/* 3. ULTRA-CLEAN MOBILE CHECKOUT & PROMO CARD */}
            <div className="relative space-y-3.5">
              <div className="absolute -inset-3 bg-gradient-to-br from-cyan-400/20 via-purple-500/20 to-pink-500/20 blur-2xl rounded-3xl pointer-events-none -z-10"></div>

              {/* 🚨 DYNAMIC GATING 🚨 */}
              {isPreLaunch && isFounder ? (
                <div className="bg-[#151C2C] border-2 border-purple-500/30 rounded-3xl p-6 text-center relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>
                  <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <h3 className="text-xs font-black text-slate-400 mb-1 uppercase tracking-widest">
                    Founder Member
                  </h3>
                  <span className="text-3xl font-black text-white tracking-tight block mb-2">
                    Early Access
                  </span>
                  <p className="text-slate-400 font-medium text-xs mb-5 px-2">
                    Because you joined before {formattedLaunchDate}, all Pro features are{' '}
                    <strong className="text-white">100% unlocked</strong> plus 6 Months Free Post-Launch.
                  </p>
                  <Link
                    href="/dashboard"
                    className="w-full min-h-[44px] font-black text-base py-3.5 rounded-xl flex items-center justify-center gap-2 bg-white text-[#0B0F19] hover:bg-slate-200 border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 active:scale-[0.98] transition-all"
                  >
                    Return to Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : !isPreLaunch && isFounderActive ? (
                <div className="bg-[#151C2C] border-2 border-purple-500/30 rounded-3xl p-6 text-center relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>
                  <h3 className="text-xs font-black text-slate-400 mb-1 uppercase tracking-widest">
                    Founder Trial Active
                  </h3>
                  <span className="text-3xl font-black text-white tracking-tight block mb-2">
                    100% Free
                  </span>
                  <p className="text-slate-400 font-medium text-xs mb-3">
                    Your 6-month free Founder Pro trial is currently active.
                  </p>
                  <p className="text-rose-400 font-bold text-[11px] mb-5 flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Expires: {formattedExpirationDate}
                  </p>
                  <Link
                    href="/dashboard"
                    className="w-full min-h-[44px] font-black text-base py-3.5 rounded-xl flex items-center justify-center gap-2 bg-white text-[#0B0F19] hover:bg-slate-200 border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 active:scale-[0.98] transition-all"
                  >
                    Return to Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <>
                  {/* 🔥 $1.00 NEXT-MONTH COMEBACK DEAL (Shown only after canceling once & never claimed before) */}
                  {isWinbackEligible && !hasUsedWinback && (
                    <div className="bg-gradient-to-br from-[#241C14] via-[#151C2C] to-[#231528] border-2 border-amber-400/60 rounded-3xl p-5 sm:p-6 text-center relative overflow-hidden shadow-[0_0_45px_-10px_rgba(245,158,11,0.3)]">
                      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500"></div>

                      <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Welcome Back Exclusive • One-Time Deal</span>
                      </div>

                      <div className="flex items-center justify-between bg-[#0B0F19]/90 border border-amber-500/30 rounded-2xl px-4 py-3 mb-4">
                        <div className="text-left">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                            PRO Comeback Pass
                          </span>
                          <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                            Full PRO + 5 Instant Boosts
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span className="text-xs text-slate-500 line-through font-bold">$7.99</span>
                            <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight leading-none">
                              $1.00
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-300 font-extrabold block mt-0.5">
                            first month • then $7.99/mo
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClaimOneDollarWinback}
                        disabled={isClaimingWinback}
                        className="w-full min-h-[48px] font-black text-base sm:text-lg py-3.5 px-4 rounded-2xl transition-all shadow-[0_0_25px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-[#0B0F19] disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 active:scale-[0.98] cursor-pointer whitespace-nowrap"
                      >
                        {isClaimingWinback ? (
                          <Loader2 className="w-5 h-5 animate-spin text-[#0B0F19]" />
                        ) : (
                          <>
                            <span>Rejoin PRO for $1.00 Today</span>
                            <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>

                      <p className="mt-2.5 text-[11px] font-bold text-amber-300/90">
                        $1.00 for 30 days • Automatically returns to $7.99/mo after • Cancel anytime
                      </p>
                    </div>
                  )}

                  {/* 🎁 2-WEEK LAUNCH EVENT: 3-MONTH NO-STRIPE FREE PASS */}
                  {isTwoWeekPromoActive && !isWinbackEligible && (
                    <div className="bg-gradient-to-br from-[#132328] via-[#151C2C] to-[#1A1832] border-2 border-emerald-400/50 rounded-3xl p-5 sm:p-6 text-center relative overflow-hidden shadow-[0_0_40px_-10px_rgba(16,185,129,0.25)]">
                      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500"></div>

                      <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                        <Gift className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Ends {formattedPromoWindowEnd} • No Stripe / No Card</span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
                        Claim {PROMO_FREE_MONTHS} Months of PRO{' '}
                        <span className="text-emerald-400 italic">Free</span>
                      </h3>
                      <p className="text-xs text-slate-300 font-medium mb-4 max-w-sm mx-auto leading-relaxed">
                        Sign up in the next 2 weeks and unlock full ChasedSports PRO + 5 Boosts for 90 days instantly—without going to Stripe at all.
                      </p>

                      <button
                        type="button"
                        onClick={handleClaimThreeMonthsFree}
                        disabled={isClaimingFreePlan}
                        className="w-full min-h-[48px] font-black text-base sm:text-lg py-3.5 px-4 rounded-2xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-[#0B0F19] disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group border-b-4 border-teal-700 active:border-b-0 active:translate-y-1 active:scale-[0.98] cursor-pointer whitespace-nowrap"
                      >
                        {isClaimingFreePlan ? (
                          <Loader2 className="w-5 h-5 animate-spin text-[#0B0F19]" />
                        ) : (
                          <>
                            <span>
                              {athleteId ? 'Unlock 3 Months Free Now' : 'Sign Up for 3 Months Free'}
                            </span>
                            <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>

                      <p className="mt-2.5 text-[11px] font-bold text-emerald-300/90">
                        1-Tap Instant Activation • Never Auto-Charges
                      </p>
                    </div>
                  )}

                  {/* 💳 STANDARD STRIPE AUTO-BILLING TRIAL CARD */}
                  {!isWinbackEligible && (
                    <div className="bg-[#151C2C] border-2 border-purple-500/40 rounded-3xl p-5 sm:p-6 text-center z-10 w-full relative overflow-hidden shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]">
                      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>

                      {/* Clean Single-Row Price & Trial Header */}
                      <div className="flex items-center justify-between bg-[#0B0F19]/90 border border-[#232D42] rounded-2xl px-4 py-3 mb-4">
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                              ChasedSports PRO
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                            {proCount > 50
                              ? `Joined by ${proCount.toLocaleString()}+ athletes`
                              : 'Built for D1, D2, D3 & NAIA'}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            $7.99<span className="text-xs text-slate-400 font-bold">/mo</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-extrabold block mt-0.5">
                            after {activeStripeTrialDays}-day free trial
                          </span>
                        </div>
                      </div>

                      {/* Single-Line Zero Due Callout */}
                      <div className="inline-flex items-center justify-center gap-1.5 mb-3.5 text-emerald-400 font-black text-[11px] uppercase tracking-wider whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>$0.00 Due Today • Auto-Bills After {activeStripeTrialDays} Days</span>
                      </div>

                      {/* Single-Line Punchy CTA Button */}
                      <button
                        type="button"
                        onClick={() => handleCheckout(activeStripeTrialDays)}
                        disabled={isRedirecting}
                        className="w-full min-h-[48px] font-black text-base sm:text-lg py-3.5 px-4 rounded-2xl transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group border-b-4 border-purple-700 active:border-b-0 active:translate-y-1 active:scale-[0.98] hover:shadow-[0_0_35px_rgba(168,85,247,0.55)] cursor-pointer whitespace-nowrap"
                      >
                        <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[30deg] group-hover:animate-[shine_1.5s_ease-in-out_infinite]"></div>

                        {isRedirecting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <span>Start {activeStripeTrialDays}-Day Free Trial</span>
                            <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>

                      {/* Compact Trust Footer */}
                      <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 whitespace-nowrap">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Cancel in 1 click anytime • Stripe Secure</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 4. COMPACT FAQ ACCORDION */}
            <div className="w-full pt-2">
              <div className="flex items-center justify-center gap-1.5 mb-2.5">
                <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Quick Questions
                </h3>
              </div>

              <div className="space-y-2">
                {faqItems.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-[#151C2C]/60 border border-[#232D42] rounded-2xl overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full min-h-[44px] flex items-center justify-between px-4 py-3 text-left font-bold text-xs text-slate-200 hover:bg-[#1A2235] transition-colors"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-300 ${
                            isOpen ? 'rotate-180 text-cyan-400' : ''
                          }`}
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isOpen ? 'max-h-36 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <p className="px-4 pb-3 text-[11px] text-slate-400 font-medium leading-relaxed border-t border-[#232D42]/50 pt-2.5">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}