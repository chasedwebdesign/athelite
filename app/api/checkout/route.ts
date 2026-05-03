import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Add a fallback so the server doesn't instantly crash if the ENV is missing
const stripeSecret = process.env.STRIPE_SECRET_KEY || '';

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16' as any, 
});

export async function POST(req: Request) {
  console.log("🟢 Hit /api/checkout endpoint!");

  try {
    if (!stripeSecret) {
      console.error("🔴 STRIPE_SECRET_KEY is missing from environment variables.");
      return NextResponse.json({ error: "Server Configuration Error: Missing Stripe Key" }, { status: 500 });
    }

    const body = await req.json();
    console.log("📦 Request Body Received:", body);

    const { athleteId, email } = body;

    if (!athleteId) {
      console.error("🔴 Missing athlete ID in request");
      return NextResponse.json({ error: 'Missing athlete ID' }, { status: 400 });
    }

    // 🚨 REPLACE THIS WITH YOUR STRIPE PRICE ID 🚨
    const PRICE_ID = 'price_1TSnmOFfcof3pJk6zXVYe1CA';

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    console.log(`🔗 Building session redirect to: ${siteUrl}`);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription', 
      customer_email: email || undefined,
      
      // 🚨 THIS IS THE MAGIC LINE FOR PROMO CODES 🚨
      allow_promotion_codes: true,

      success_url: `${siteUrl}/dashboard/track?upgrade=success`,
      cancel_url: `${siteUrl}/pro`,
      client_reference_id: athleteId,
      metadata: {
        athlete_id: athleteId,
      },
    });

    console.log("✅ Stripe Session Created! URL:", session.url);
    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('🔴 Stripe Checkout Backend Error:', error);
    // Explicitly return JSON so the frontend doesn't crash on HTML
    return NextResponse.json({ error: error.message || "An unknown backend error occurred" }, { status: 500 });
  }
}