import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16' as any,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🚨 2-WEEK PROMO CUTOFF: Ends November 9, 2026 at 11:59:59 PM UTC 🚨
const TWO_WEEK_PROMO_END = new Date('2026-11-09T23:59:59Z');
const PROMO_FREE_MONTHS = 3;
const DURING_PROMO_TRIAL_DAYS = 7;
const POST_PROMO_TRIAL_DAYS = 14;
const WINBACK_COUPON_ID = 'WINBACK_1_DOLLAR_ONCE';

// Type-safe helper across Stripe SDK v14–v18+ definitions
function getSubscriptionPeriodEnd(sub: Stripe.Subscription): number | null {
  const topLevel = (sub as unknown as { current_period_end?: number }).current_period_end;
  if (typeof topLevel === 'number') return topLevel;

  const itemLevel = (
    sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined
  )?.current_period_end;
  if (typeof itemLevel === 'number') return itemLevel;

  return null;
}

// Helper: Ensure a 1-month $1.00 coupon exists in Stripe (duration: 'once')
async function getOrCreateOneDollarWinbackCoupon(priceId: string): Promise<string> {
  try {
    const existing = await stripe.coupons.retrieve(WINBACK_COUPON_ID);
    if (existing && !existing.deleted) {
      return existing.id;
    }
  } catch {
    // Coupon does not exist yet; create it below
  }

  // Retrieve the recurring price so the discount always leaves $1.00 (100 cents)
  const price = await stripe.prices.retrieve(priceId);
  const unitAmount = price.unit_amount ?? 799; // Fallback to $7.99 (799 cents)
  const amountOffCents = Math.max(unitAmount - 100, 100);

  const created = await stripe.coupons.create({
    id: WINBACK_COUPON_ID,
    name: '$1.00 Next Month Comeback Deal',
    duration: 'once', // Applies ONLY to the next single billing cycle, then goes back to full price
    amount_off: amountOffCents,
    currency: price.currency || 'usd',
  });

  return created.id;
}

// Helper: Find Stripe customer and subscriptions by email
async function findStripeSubscriptionsByEmail(email?: string) {
  if (!email || !stripeSecret) {
    return { customerId: null, subscriptions: [] as Stripe.Subscription[] };
  }

  const customers = await stripe.customers.list({ email, limit: 5 });
  const allSubs: Stripe.Subscription[] = [];
  let primaryCustomerId: string | null = null;

  for (const cust of customers.data) {
    if (!primaryCustomerId) primaryCustomerId = cust.id;
    const subs = await stripe.subscriptions.list({
      customer: cust.id,
      status: 'all',
      limit: 10,
    });
    allSubs.push(...subs.data);
  }

  return { customerId: primaryCustomerId, subscriptions: allSubs };
}

export async function POST(req: Request) {
  console.log('🟢 Hit /api/checkout endpoint!');

  try {
    const body = await req.json();
    console.log('📦 Request Body Received:', body);

    const { athleteId, email, action, trialDays } = body as {
      athleteId?: string;
      email?: string;
      action?:
        | 'claim_3_month_free'
        | 'stripe_trial'
        | 'check_winback_eligibility'
        | 'stripe_winback_1_dollar';
      trialDays?: number;
    };

    if (!athleteId) {
      console.error('🔴 Missing athlete ID in request');
      return NextResponse.json({ error: 'Missing athlete ID' }, { status: 400 });
    }

    const now = new Date();
    const isTwoWeekPromoActive = now <= TWO_WEEK_PROMO_END;
    const PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || 'price_1TSnmOFfcof3pJk6zXVYe1CA';

    // Fetch current athlete state
    const { data: currentAthlete, error: fetchError } = await supabaseAdmin
      .from('athletes')
      .select('is_premium, premium_expires_at, boosts_available, unlocked_features, email')
      .eq('id', athleteId)
      .maybeSingle();

    if (fetchError || !currentAthlete) {
      console.error('🔴 Could not find athlete:', fetchError);
      return NextResponse.json({ error: 'Athlete profile not found.' }, { status: 404 });
    }

    const effectiveEmail = email || currentAthlete.email || undefined;
    const unlockedFeatures: string[] = Array.isArray(currentAthlete.unlocked_features)
      ? currentAthlete.unlocked_features
      : [];

    const hasUsedWinback = unlockedFeatures.includes('winback_1_dollar_used');
    const hasCanceledFlag = unlockedFeatures.includes('pro_canceled_once');

    // =========================================================================
    // PATH 0: CHECK WIN-BACK ELIGIBILITY (Database Flags + Live Stripe History)
    // =========================================================================
    if (action === 'check_winback_eligibility') {
      if (hasUsedWinback) {
        return NextResponse.json({
          eligibleForWinback: false,
          hasUsedWinback: true,
        });
      }

      let hasCanceledInStripe = hasCanceledFlag;

      if (!hasCanceledInStripe && effectiveEmail && stripeSecret) {
        const { subscriptions } = await findStripeSubscriptionsByEmail(effectiveEmail);
        hasCanceledInStripe = subscriptions.some(
          (sub) =>
            sub.status === 'canceled' ||
            sub.cancel_at_period_end === true ||
            Boolean(sub.canceled_at)
        );

        // Persist the 'pro_canceled_once' flag in unlocked_features if discovered in Stripe
        if (hasCanceledInStripe && !unlockedFeatures.includes('pro_canceled_once')) {
          await supabaseAdmin
            .from('athletes')
            .update({
              unlocked_features: [...unlockedFeatures, 'pro_canceled_once'],
            })
            .eq('id', athleteId);
        }
      }

      return NextResponse.json({
        eligibleForWinback: hasCanceledInStripe,
        hasUsedWinback: false,
      });
    }

    // =========================================================================
    // PATH A: 3-MONTH FREE PLAN WITHOUT GOING TO STRIPE (2-WEEK WINDOW ONLY)
    // =========================================================================
    if (action === 'claim_3_month_free') {
      if (!isTwoWeekPromoActive) {
        return NextResponse.json(
          {
            error:
              'The 2-week 3-Month Free Launch Promo has ended. You can still start a 14-day free trial!',
          },
          { status: 400 }
        );
      }

      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + PROMO_FREE_MONTHS);

      const currentBoosts = currentAthlete.boosts_available || 0;
      const updatedBoosts = currentAthlete.is_premium ? currentBoosts : currentBoosts + 5;

      const { error: updateError } = await supabaseAdmin
        .from('athletes')
        .update({
          is_premium: true,
          premium_expires_at: expiryDate.toISOString(),
          boosts_available: updatedBoosts,
        })
        .eq('id', athleteId);

      if (updateError) {
        console.error('🔴 Failed to activate 3-month free plan:', updateError);
        return NextResponse.json(
          { error: 'Failed to activate 3-month free plan in database.' },
          { status: 500 }
        );
      }

      console.log(
        `✅ Activated 3-Month No-Stripe PRO for athlete ${athleteId} until ${expiryDate.toISOString()}`
      );
      return NextResponse.json({
        claimedFreePlan: true,
        premiumExpiresAt: expiryDate.toISOString(),
      });
    }

    if (!stripeSecret) {
      console.error('🔴 STRIPE_SECRET_KEY is missing from environment variables.');
      return NextResponse.json(
        { error: 'Server Configuration Error: Missing Stripe Key' },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // =========================================================================
    // PATH B: $1.00 NEXT-MONTH COMEBACK / RETENTION DEAL (ONE-TIME ONLY)
    // =========================================================================
    if (action === 'stripe_winback_1_dollar') {
      if (hasUsedWinback) {
        return NextResponse.json(
          { error: 'You have already claimed the one-time $1.00 PRO deal.' },
          { status: 400 }
        );
      }

      const couponId = await getOrCreateOneDollarWinbackCoupon(PRICE_ID);
      const { subscriptions } = await findStripeSubscriptionsByEmail(effectiveEmail);

      // 1. If the user currently has an active/trialing subscription on Stripe, apply the $1 coupon directly to their next month
      const activeSub = subscriptions.find(
        (s) => s.status === 'active' || s.status === 'trialing'
      );

      if (activeSub) {
        const updatedSub = await stripe.subscriptions.update(activeSub.id, {
          cancel_at_period_end: false,
          discounts: [{ coupon: couponId }],
          metadata: {
            ...activeSub.metadata,
            athlete_id: athleteId,
            winback_1_dollar_used: 'true',
          },
        });

        const nextFeatures = Array.from(
          new Set([...unlockedFeatures, 'pro_canceled_once', 'winback_1_dollar_used'])
        );

        const periodEndUnix = getSubscriptionPeriodEnd(updatedSub);
        const renewedExpiry = periodEndUnix
          ? new Date((periodEndUnix + 48 * 3600) * 1000).toISOString()
          : currentAthlete.premium_expires_at;

        await supabaseAdmin
          .from('athletes')
          .update({
            is_premium: true,
            premium_expires_at: renewedExpiry,
            unlocked_features: nextFeatures,
          })
          .eq('id', athleteId);

        console.log(`✅ Applied $1.00 next-month retention coupon to existing sub ${activeSub.id}`);
        return NextResponse.json({
          appliedToExistingSubscription: true,
          premiumExpiresAt: renewedExpiry,
        });
      }

      // 2. Otherwise, create a new Stripe Checkout Session for $1.00 today (Month 1), then $7.99/mo thereafter
      const winbackSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        payment_method_collection: 'always',
        line_items: [
          {
            price: PRICE_ID,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        customer_email: effectiveEmail,
        discounts: [
          {
            coupon: couponId,
          },
        ],
        subscription_data: {
          metadata: {
            athlete_id: athleteId,
            is_winback_1_dollar: 'true',
          },
        },
        success_url: `${siteUrl}/dashboard/track?upgrade=winback_success`,
        cancel_url: `${siteUrl}/pro`,
        client_reference_id: athleteId,
        metadata: {
          athlete_id: athleteId,
          is_winback_1_dollar: 'true',
        },
      });

      console.log(`✅ Created $1.00 Comeback Checkout Session! URL:`, winbackSession.url);
      return NextResponse.json({ url: winbackSession.url });
    }

    // =========================================================================
    // PATH C: STANDARD STRIPE AUTO-BILLING FREE TRIAL (7 DAYS -> 14 DAYS)
    // =========================================================================
    const defaultTrialDays = isTwoWeekPromoActive
      ? DURING_PROMO_TRIAL_DAYS
      : POST_PROMO_TRIAL_DAYS;
    const effectiveTrialDays =
      typeof trialDays === 'number' && (trialDays === 7 || trialDays === 14)
        ? trialDays
        : defaultTrialDays;

    console.log(
      `🔗 Building Stripe session (${effectiveTrialDays}-day trial) redirect to: ${siteUrl}`
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      payment_method_collection: 'always',
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: effectiveEmail,
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: effectiveTrialDays,
        metadata: {
          athlete_id: athleteId,
          trial_days: String(effectiveTrialDays),
        },
      },
      success_url: `${siteUrl}/dashboard/track?upgrade=success`,
      cancel_url: `${siteUrl}/pro`,
      client_reference_id: athleteId,
      metadata: {
        athlete_id: athleteId,
        trial_days: String(effectiveTrialDays),
      },
    });

    console.log(`✅ Stripe Session Created (${effectiveTrialDays}-day trial)! URL:`, session.url);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('🔴 Stripe Checkout Backend Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown backend error occurred' },
      { status: 500 }
    );
  }
}