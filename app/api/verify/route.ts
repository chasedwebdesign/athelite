import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Supabase Admin
// We use the Service Role Key here to bypass Row Level Security (RLS) so the server 
// can securely write to the verifications table and forcefully upgrade the trust_level.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, userId, firstName, lastName, code } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter.' }, { status: 400 });
    }

    // ==========================================
    // ACTION 1: SEND SECURE PIN
    // ==========================================
    if (action === 'send') {
      if (!email || !userId || !firstName) {
        return NextResponse.json({ error: 'Identity verification failed. Missing user data.' }, { status: 400 });
      }

      // 1. Generate a secure 6-digit OTP & Expiration
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

      // 2. Store the OTP in the database
      const { error: dbError } = await supabaseAdmin
        .from('email_verifications')
        .insert({
          athlete_id: userId,
          email: email.trim().toLowerCase(),
          code: otp,
          expires_at: expiresAt
        });

      if (dbError) {
         console.error('Supabase Insert Error:', dbError);
         return NextResponse.json({ error: 'Failed to generate secure token. Database error.' }, { status: 500 });
      }

      // 3. Dispatch the Gamified HTML Email via Resend
      // 🚨 FIX: Hardcoded to the verified domain to bypass Next.js local sandbox restrictions
      const senderEmail = 'verify@chasedsports.com';

      const { error: resendError } = await resend.emails.send({
        from: `ChasedSports Auth <${senderEmail}>`,
        to: [email.trim().toLowerCase()],
        subject: `${otp} is your ChasedSports Verification Code`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your ChasedSports Account</title>
          </head>
          <body style="margin: 0; padding: 40px 20px; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
            <div style="max-width: 520px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
              
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); color: #c084fc; font-size: 13px; font-weight: 700; padding: 8px 16px; border-radius: 9999px; letter-spacing: 1.5px; text-transform: uppercase;">
                  Network Security
                </span>
              </div>

              <h2 style="color: #ffffff; text-align: center; font-size: 24px; font-weight: 800; margin-top: 0; margin-bottom: 12px; letter-spacing: -0.5px;">
                Verify Your Identity, ${firstName}
              </h2>
              
              <p style="color: #94a3b8; font-size: 15px; line-height: 24px; text-align: center; margin-bottom: 32px;">
                Lock in your recruiting profile and upgrade your account to unlock verified leaderboards, PR tracking, and recruiter matchmaking.
              </p>

              <div style="background-color: #020617; border: 1px solid #1e293b; padding: 32px 24px; border-radius: 16px; text-align: center; margin-bottom: 32px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 12px;">Your 6-Digit Passcode</div>
                <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #c084fc; font-family: monospace; text-shadow: 0 0 20px rgba(168, 85, 247, 0.4);">
                  ${otp}
                </div>
              </div>

              <p style="color: #475569; font-size: 13px; text-align: center; margin: 0;">
                Valid for 15 minutes. If you did not request this, safely ignore this email.
              </p>
            </div>
          </body>
          </html>
        `
      });

      if (resendError) {
         console.error('Resend Error Details:', resendError);
         return NextResponse.json({ error: `Mail Error: ${resendError.message}` }, { status: 502 });
      }

      return NextResponse.json({ success: true, message: 'Pin dispatched successfully.' });
    }

    // ==========================================
    // ACTION 2: VERIFY PIN & UPGRADE ACCOUNT
    // ==========================================
    if (action === 'verify') {
      if (!userId || !code) {
         return NextResponse.json({ error: 'Missing account identity or pin code.' }, { status: 400 });
      }

      const normalizedCode = code.toString().trim();

      // 1. Find the latest unverified code for this athlete
      const { data: verifications, error: lookupError } = await supabaseAdmin
        .from('email_verifications')
        .select('id, expires_at')
        .eq('athlete_id', userId)
        .eq('code', normalizedCode)
        .is('verified_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lookupError || !verifications || verifications.length === 0) {
         return NextResponse.json({ error: 'Invalid verification pin. Please check your email and try again.' }, { status: 400 });
      }

      const record = verifications[0];

      // 2. Check Expiration
      if (new Date(record.expires_at).getTime() < Date.now()) {
         return NextResponse.json({ error: 'This verification pin has expired. Please request a new one.' }, { status: 410 });
      }

      // 3. Mark the pin as utilized
      await supabaseAdmin
        .from('email_verifications')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', record.id);

      // 4. Upgrade the athlete's trust level to 1 (Verified)
      const { error: updateError } = await supabaseAdmin
        .from('athletes')
        .update({ trust_level: 1 })
        .eq('id', userId);

      if (updateError) {
         console.error('Athlete Trust Upgrade Error:', updateError);
         return NextResponse.json({ error: 'Pin matched successfully, but failed to upgrade account trust level in the database.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Account successfully verified.' });
    }

    return NextResponse.json({ error: 'Invalid API operation requested.' }, { status: 400 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}