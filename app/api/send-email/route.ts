import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  console.log("🚨 [API] /api/send-email was triggered!");
  
  try {
    const body = await req.json();
    const { email, code, name } = body;

    console.log(`🚨 [API] Payload received -> Email: ${email} | Code: ${code}`);

    if (!email || !code) {
      console.log("🚨 [API] Error: Missing email or code.");
      return NextResponse.json({ error: 'Missing email or code' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    
    // 1. IF RESEND API KEY EXISTS, TRY TO SEND REAL EMAIL
    if (apiKey && apiKey.startsWith('re_')) {
      console.log("🚨 [API] Resend API Key found! Attempting to send real email...");
      const resend = new Resend(apiKey);
      
      const { data, error } = await resend.emails.send({
        from: 'ChasedSports <verify@chasedsports.com>',
        to: email, 
        subject: 'Verify your ChasedSports Coach Account',
        html: `
          <div style="font-family: sans-serif; padding: 32px; background-color: #f8fafc; border-radius: 16px;">
            <h2>Hi ${name || 'Coach'},</h2>
            <p>Your ChasedSports verification code is:</p>
            <h1 style="color: #4f46e5; letter-spacing: 8px; font-size: 42px;">${code}</h1>
          </div>
        `
      });

      // If Resend fails (usually due to Sandbox rules), catch it and fallback!
      if (error) {
        console.log("⚠️ [API] Resend blocked the email. Reason:", error.message);
        console.log(`\n=== 🛠️ FALLBACK SIMULATOR ===\nEmail: ${email}\nCode: ${code}\n=============================\n`);
        return NextResponse.json({ success: true, message: "Fell back to simulator" });
      }

      console.log("✅ [API] Real email sent successfully via Resend!");
      return NextResponse.json({ success: true, data });
    } 
    
    // 2. IF NO API KEY IS FOUND, USE SIMULATOR
    console.log("⚠️ [API] No Resend key found in .env.local. Using Simulator.");
    console.log(`\n=== 🛠️ EMAIL SIMULATOR ===\nTo: ${email}\nCode: ${code}\n==========================\n`);
    
    return NextResponse.json({ success: true, message: 'Simulated email sent' });

  } catch (err: any) {
    console.log("❌ [API] CRITICAL CRASH:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}