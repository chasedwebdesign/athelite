import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    // Lookup the Stripe customer ID by their email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No active billing record found.' }, { status: 404 });
    }

    const customerId = customers.data[0].id;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Generate the secure portal link
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/pro`, // Where they go when they click "Return to site"
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Stripe Portal Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}