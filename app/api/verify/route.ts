import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// 🚨 ADMIN SUPABASE CLIENT (Bypasses RLS) 🚨
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Resend (Safe check in case env var isn't loaded yet)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Set your global limit for ZenRows (e.g., 300 scrapes per day)
const DAILY_GLOBAL_LIMIT = 300; 

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url, code, action, email, userId } = body;

    // ====================================================================
    // 📧 PIPELINE 1: RESEND EMAIL OTP VERIFICATION
    // Triggered if the frontend sends an 'action' (send or verify)
    // ====================================================================
    if (action === 'send' || action === 'verify') {
      
      if (!resend) {
        return NextResponse.json({ error: 'Email service is not configured.' }, { status: 500 });
      }

      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized profile request.' }, { status: 401 });
      }

      // --- ACTION: GENERATE & SEND OTP ---
      if (action === 'send') {
        if (!email || !email.includes('@')) {
          return NextResponse.json({ error: 'Valid email address required.' }, { status: 400 });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15-minute expiration window

        const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            verification_email: email,
            verification_otp: otpCode,
            verification_expires: expiresAt,
          },
        });

        if (metadataError) throw metadataError;

        const { error: mailError } = await resend.emails.send({
          from: 'ChasedSports <verify@chasedsports.com>', // Update to your verified domain
          to: email,
          subject: `🏆 Your ChasedSports Verification Code: ${otpCode}`,
          html: `
            <div style="background-color: #020617; color: #ffffff; font-family: sans-serif; padding: 40px; text-align: center; border-radius: 24px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
              <h1 style="background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; color: transparent; font-size: 28px; font-weight: 900; margin-bottom: 8px;">CHASEDSPORTS</h1>
              <p style="color: #94a3b8; font-size: 14px; margin-bottom: 32px;">Level up your recruitment profile identity.</p>
              <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">One-Time Verification Pin</p>
                <h2 style="font-size: 36px; font-family: monospace; letter-spacing: 6px; color: #3b82f6; margin: 0;">${otpCode}</h2>
                <p style="color: #64748b; font-size: 11px; margin: 12px 0 0 0;">Expires in 15 minutes. If you didn't request this code, safely ignore this email.</p>
              </div>
              <p style="color: #475569; font-size: 12px;">Coaches look for verified badges. Get ready to stand out.</p>
            </div>
          `,
        });

        if (mailError) throw mailError;
        return NextResponse.json({ success: true });
      }

      // --- ACTION: VALIDATE OTP & UPGRADE TRUST LEVEL ---
      if (action === 'verify') {
        if (!code) {
          return NextResponse.json({ error: 'Verification pin required.' }, { status: 400 });
        }

        // FIX: Correctly destructure data from the Supabase admin call
        const { data, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        // FIX: Ensure data.user exists before attempting to read metadata
        if (getUserError || !data?.user) throw new Error('User account profile context missing.');

        const meta = data.user.user_metadata || {};

        if (!meta.verification_otp || meta.verification_otp !== code) {
          return NextResponse.json({ error: 'Invalid verification pin.' }, { status: 400 });
        }

        if (Date.now() > meta.verification_expires) {
          return NextResponse.json({ error: 'Verification pin expired. Request a new one.' }, { status: 400 });
        }

        const { error: dbError } = await supabaseAdmin
          .from('athletes')
          .update({ trust_level: 1 }) // 🚨 FIX: Using Integer 1 instead of string 'Verified'
          .eq('id', userId);

        if (dbError) throw dbError;

        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...meta,
            verification_otp: null,
            verification_expires: null,
          },
        });

        return NextResponse.json({ success: true });
      }
    }

    // ====================================================================
    // 🏃‍♂️ PIPELINE 2: ATHLETIC.NET ZENROWS SCRAPING
    // Triggered if the frontend sends a 'url' payload
    // ====================================================================
    if (url && url.includes('athletic.net')) {
      const ZENROWS_API_KEY = process.env.ZENROWS_API_KEY;

      if (!code) {
        return NextResponse.json({ error: 'Missing verification code.' }, { status: 400 });
      }

      if (!ZENROWS_API_KEY) {
        return NextResponse.json({ error: 'ZenRows API key is missing from environment variables.' }, { status: 500 });
      }

      // 🚨 1. CHECK THE KILL SWITCH (THE TRAP DOOR)
      try {
        const { data: isAllowed, error } = await supabaseAdmin.rpc('check_and_increment_usage', {
          limit_amount: DAILY_GLOBAL_LIMIT
        });

        if (error) {
          console.error("Supabase RPC Error:", error);
          return NextResponse.json({ error: "Internal Server Error verifying limits." }, { status: 500 });
        }

        if (!isAllowed) {
          console.warn("🛑 TRAP DOOR ACTIVATED: Global daily scrape limit reached.");
          return NextResponse.json({ 
            error: "Global daily limit reached to protect platform stability. Please try again tomorrow." 
          }, { status: 429 });
        }
      } catch (err) {
        console.error("Kill switch error:", err);
        return NextResponse.json({ error: "Failed to verify usage limits." }, { status: 500 });
      }

      // 🚀 2. PROCEED WITH ZENROWS SCRAPING
      const MAX_RETRIES = 2;
      let attempt = 0;
      let isVerified = false;
      let lastError = "";

      while (attempt < MAX_RETRIES) {
          attempt++;
          try {
              console.log(`🔍 Verifying Code [${code}] -> ${url} (Attempt ${attempt}/${MAX_RETRIES})`);

              const targetUrl = encodeURIComponent(url);
              const zenrowsUrl = `https://api.zenrows.com/v1/?apikey=${ZENROWS_API_KEY}&url=${targetUrl}&js_render=true&premium_proxy=true&wait=6000`;

              const response = await fetch(zenrowsUrl);

              if (!response.ok) {
                  throw new Error(`ZenRows API failed with status: ${response.status}`);
              }

              const html = await response.text();
              const htmlLower = html.toLowerCase();

              // Safety check for Cloudflare
              if (htmlLower.includes('just a moment') || htmlLower.includes('attention required') || htmlLower.includes('cf-browser-verification')) {
                  throw new Error("Cloudflare Block Active");
              }

              // 🕵️ GLOBAL HTML SEARCH
              isVerified = htmlLower.includes(code.toLowerCase());
              break; 

          } catch (err: any) {
              lastError = err.message;
              console.error(`❌ Verification attempt ${attempt} failed: ${lastError}`);
              if (attempt >= MAX_RETRIES) break;
              
              await new Promise(res => setTimeout(res, 2000));
          }
      }

      if (lastError && !isVerified && attempt >= MAX_RETRIES) {
            return NextResponse.json({ error: 'Athletic.net security check is temporarily blocking us. Please try again.' }, { status: 503 });
      }

      if (isVerified) {
        return NextResponse.json({ success: true, message: 'Profile verified successfully!' });
      } else {
        return NextResponse.json({ success: false, error: 'Verification code not found. Make sure you saved it to your Athletic.net profile handle or bio!' }, { status: 403 });
      }
    }

    // Fallback if neither payload signature matches
    return NextResponse.json({ error: 'Invalid payload structure. Route unable to determine verification method.' }, { status: 400 });

  } catch (globalError: any) {
    console.error("Global Verification Error:", globalError);
    return NextResponse.json({ error: `Verification Error: ${globalError.message}` }, { status: 500 });
  }
}