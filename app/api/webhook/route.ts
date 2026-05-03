import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

// We must use the SERVICE_ROLE_KEY here to bypass Row Level Security.
// Webhooks aren't "logged in" as the user, they are logged in as the system.
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

  // Handle the specific event when a checkout is successfully completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Remember when we attached this in the checkout API? Here is where we read it back.
    const athleteId = session.metadata?.athlete_id;

    if (athleteId) {
      console.log(`✅ Payment successful for Athlete ID: ${athleteId}. Upgrading to Pro...`);

      // Calculate 30 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Fetch their current boosts so we can add 5
      const { data: currentData } = await supabaseAdmin
        .from('athletes')
        .select('boosts_available')
        .eq('id', athleteId)
        .single();
        
      const currentBoosts = currentData?.boosts_available || 0;

      // Force the database update as an Admin
      const { error } = await supabaseAdmin
        .from('athletes')
        .update({
          is_premium: true,
          premium_expires_at: expiryDate.toISOString(),
          boosts_available: currentBoosts + 5,
        })
        .eq('id', athleteId);

      if (error) {
        console.error('🔴 Error updating athlete in Supabase:', error);
      } else {
        console.log('🎉 Athlete successfully upgraded in Supabase!');
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}