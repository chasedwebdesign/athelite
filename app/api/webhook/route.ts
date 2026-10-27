import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Safely extracts the subscription's current period end (or trial end) Unix timestamp (in seconds)
 * across both legacy ('2023-10-16') and modern (2025+) Stripe TypeScript SDK definitions.
 */
function getSubscriptionPeriodEndUnix(
  subscription: Stripe.Subscription
): number | null {
  const legacySub = subscription as Stripe.Subscription & {
    current_period_end?: number;
  };

  if (typeof legacySub.current_period_end === 'number') {
    return legacySub.current_period_end;
  }

  const itemPeriodEnd = (
    subscription.items?.data?.[0] as
      | (Stripe.SubscriptionItem & { current_period_end?: number })
      | undefined
  )?.current_period_end;

  if (typeof itemPeriodEnd === 'number') {
    return itemPeriodEnd;
  }

  if (typeof subscription.trial_end === 'number') {
    return subscription.trial_end;
  }

  return null;
}

/**
 * Safely extracts the Subscription ID string from a Stripe.Invoice object
 * across both legacy ('2023-10-16') and modern (2025+) Stripe TypeScript SDK definitions.
 */
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const legacyInvoice = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    parent?: {
      subscription_details?: {
        subscription?: string | Stripe.Subscription | null;
      } | null;
    } | null;
  };

  const rawSub =
    legacyInvoice.subscription ??
    legacyInvoice.parent?.subscription_details?.subscription ??
    null;

  if (!rawSub) return null;
  return typeof rawSub === 'string' ? rawSub : rawSub.id;
}

/**
 * Resolves the Supabase athlete UUID from a Stripe Subscription's metadata
 * or falls back to matching the Stripe Customer's email in Supabase.
 */
async function resolveAthleteIdFromSubscription(
  subscription: Stripe.Subscription
): Promise<string | null> {
  const metaId =
    subscription.metadata?.athlete_id || subscription.metadata?.athleteId;
  if (metaId) return metaId;

  if (subscription.customer) {
    try {
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

      const customer = await stripe.customers.retrieve(customerId);

      if (
        !('deleted' in customer && customer.deleted) &&
        'email' in customer &&
        customer.email
      ) {
        // 1. Fast lookup on public.athletes by email
        const { data: athleteRow } = await supabaseAdmin
          .from('athletes')
          .select('id')
          .ilike('email', customer.email)
          .maybeSingle();

        if (athleteRow?.id) return athleteRow.id;

        // 2. Fallback lookup on auth.users
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const matchedUser = usersData?.users?.find(
          (u: { id: string; email?: string }) =>
            u.email?.toLowerCase() === customer.email?.toLowerCase()
        );
        if (matchedUser?.id) return matchedUser.id;
      }
    } catch (e) {
      console.error('🔴 Error resolving customer email in webhook:', e);
    }
  }

  return null;
}

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('🔴 Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  // 1. Upgrade Athlete to PRO on Checkout Completion (7-Day / 14-Day Trial Start or Sub)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const athleteId =
      session.metadata?.athlete_id ||
      session.metadata?.athleteId ||
      session.client_reference_id;

    if (athleteId) {
      // Default expiry to 30 days if non-subscription, or sync with exact Stripe trial/period end
      let expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      if (session.subscription) {
        try {
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          const periodEndUnix = getSubscriptionPeriodEndUnix(subscription);

          if (periodEndUnix) {
            // Add a 48-hour grace buffer past current_period_end so auto-billing invoices process cleanly
            expiryDate = new Date((periodEndUnix + 48 * 3600) * 1000);
          }
        } catch (subErr) {
          console.error('🔴 Failed to retrieve subscription on checkout:', subErr);
        }
      }

      const { data: currentData } = await supabaseAdmin
        .from('athletes')
        .select('boosts_available, premium_expires_at')
        .eq('id', athleteId)
        .maybeSingle();

      const currentBoosts = currentData?.boosts_available || 0;

      // Never shorten an existing longer promo expiry (e.g., if they already had a 3-month pass)
      const existingExpiry = currentData?.premium_expires_at
        ? new Date(currentData.premium_expires_at)
        : null;
      const finalExpiry =
        existingExpiry && existingExpiry > expiryDate ? existingExpiry : expiryDate;

      const { error } = await supabaseAdmin
        .from('athletes')
        .update({
          is_premium: true,
          premium_expires_at: finalExpiry.toISOString(),
          boosts_available: currentBoosts + 5,
        })
        .eq('id', athleteId);

      if (error) {
        console.error('🔴 Error upgrading athlete in Supabase:', error);
      } else {
        console.log(
          `✅ Upgraded athlete ${athleteId} to PRO until ${finalExpiry.toISOString()}`
        );
      }
    }
  }

  // 2. Auto-Bill Renewal After 7-Day / 14-Day Trial Ends (or Monthly Renewal)
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    const subId = getSubscriptionIdFromInvoice(invoice);

    if (subId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subId);
        const athleteId = await resolveAthleteIdFromSubscription(subscription);
        const periodEndUnix = getSubscriptionPeriodEndUnix(subscription);

        if (athleteId && periodEndUnix) {
          const renewedExpiry = new Date((periodEndUnix + 48 * 3600) * 1000);

          const { data: currentData } = await supabaseAdmin
            .from('athletes')
            .select('boosts_available')
            .eq('id', athleteId)
            .maybeSingle();

          const currentBoosts = currentData?.boosts_available || 0;
          // Grant +5 boosts when transitioning from free trial to paid or renewing monthly
          const isRecurringCharge =
            invoice.billing_reason === 'subscription_cycle' ||
            (typeof invoice.amount_paid === 'number' && invoice.amount_paid > 0);

          await supabaseAdmin
            .from('athletes')
            .update({
              is_premium: true,
              premium_expires_at: renewedExpiry.toISOString(),
              boosts_available: isRecurringCharge
                ? currentBoosts + 5
                : currentBoosts,
            })
            .eq('id', athleteId);

          console.log(
            `✅ Renewed PRO subscription for athlete ${athleteId} until ${renewedExpiry.toISOString()}`
          );
        }
      } catch (err) {
        console.error('🔴 Error handling invoice.payment_succeeded:', err);
      }
    }
  }

  // 3. Keep Status Synced on Subscription Updates (e.g., Trial -> Active or Unpaid)
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    const athleteId = await resolveAthleteIdFromSubscription(subscription);

    if (athleteId) {
      const isActiveOrTrialing =
        subscription.status === 'active' || subscription.status === 'trialing';
      const periodEndUnix = getSubscriptionPeriodEndUnix(subscription);

      if (isActiveOrTrialing && periodEndUnix) {
        const updatedExpiry = new Date((periodEndUnix + 48 * 3600) * 1000);
        await supabaseAdmin
          .from('athletes')
          .update({
            is_premium: true,
            premium_expires_at: updatedExpiry.toISOString(),
          })
          .eq('id', athleteId);
      } else if (
        subscription.status === 'canceled' ||
        subscription.status === 'unpaid'
      ) {
        await supabaseAdmin
          .from('athletes')
          .update({
            is_premium: false,
            premium_expires_at: new Date().toISOString(),
          })
          .eq('id', athleteId);
      }
    }
  }

  // 4. Downgrade Athlete when Subscription Ends/Cancels (So Cron Cleans Up PRO Video)
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const athleteId = await resolveAthleteIdFromSubscription(subscription);

    if (athleteId) {
      await supabaseAdmin
        .from('athletes')
        .update({
          is_premium: false,
          premium_expires_at: new Date().toISOString(),
        })
        .eq('id', athleteId);

      console.log(
        `🔻 Downgraded athlete ${athleteId} after subscription deletion.`
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}