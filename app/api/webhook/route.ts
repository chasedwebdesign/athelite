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

  // 1. Upgrade Athlete to PRO on Checkout Completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const athleteId = session.metadata?.athlete_id;

    if (athleteId) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const { data: currentData } = await supabaseAdmin
        .from('athletes')
        .select('boosts_available')
        .eq('id', athleteId)
        .single();
        
      const currentBoosts = currentData?.boosts_available || 0;

      const { error } = await supabaseAdmin
        .from('athletes')
        .update({
          is_premium: true,
          premium_expires_at: expiryDate.toISOString(),
          boosts_available: currentBoosts + 5,
        })
        .eq('id', athleteId);

      if (error) {
        console.error('🔴 Error upgrading athlete in Supabase:', error);
      }
    }
  }

  // 2. Downgrade Athlete when Subscription Ends/Cancels (So Cron Cleans Up PRO Video)
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const athleteId = subscription.metadata?.athlete_id;

    if (athleteId) {
      await supabaseAdmin
        .from('athletes')
        .update({
          is_premium: false,
          premium_expires_at: new Date().toISOString(),
        })
        .eq('id', athleteId);
    } else if (subscription.customer) {
      // Fallback: look up customer email from Stripe if metadata wasn't on subscription object
      try {
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (!customer.deleted && customer.email) {
          const { data: users } = await supabaseAdmin.auth.admin.listUsers();
          const matchedUser = users?.users?.find(
            (u) => u.email?.toLowerCase() === customer.email?.toLowerCase()
          );
          if (matchedUser) {
            await supabaseAdmin
              .from('athletes')
              .update({
                is_premium: false,
                premium_expires_at: new Date().toISOString(),
              })
              .eq('id', matchedUser.id);
          }
        }
      } catch (e) {
        console.error('🔴 Error resolving customer on subscription delete:', e);
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}