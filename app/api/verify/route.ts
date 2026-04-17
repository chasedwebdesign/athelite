import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { url, code } = await req.json();
    
    // 🔑 ZENROWS API KEY
    const ZENROWS_API_KEY = process.env.ZENROWS_API_KEY;

    if (!url || !code || !url.includes('athletic.net')) {
      return NextResponse.json({ error: 'Invalid URL or missing verification code.' }, { status: 400 });
    }

    if (!ZENROWS_API_KEY) {
      return NextResponse.json({ error: 'ZenRows API key is missing from environment variables.' }, { status: 500 });
    }

    // 🚨 INVISIBLE BACKEND QUEUE: Retries up to 2 times
    const MAX_RETRIES = 2;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      // 🚨 TS FIX: Explicitly declared browser as 'any'
      let browser: any = null; 
      attempt++;

      try {
        console.log(`🔍 Verifying Code [${code}] on Profile -> ${url} (Attempt ${attempt}/${MAX_RETRIES})`);

        // 🚨 ZENROWS MAGIC: Connecting through their scraping browser
        browser = await puppeteerCore.connect({
          browserWSEndpoint: `wss://browser.zenrows.com?apikey=${ZENROWS_API_KEY}`
        });
        
        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1'
        });

        // 🚨 REMOVED REQUEST INTERCEPTION! We must let fonts and images load so Cloudflare passes us.

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 🚨 ADVANCED CLOUDFLARE BYPASS 🚨
        let pageTitle = await page.title();
        if (pageTitle.includes('Just a moment') || pageTitle.includes('Attention Required') || pageTitle.toLowerCase().includes('athletic.net')) {
            console.log("🛡️ Cloudflare check detected! Waiting for clearance...");
            try {
                // Wait until the title NO LONGER says "Just a moment"
                await page.waitForFunction(() => {
                    const title = document.title.toLowerCase();
                    return !title.includes('just a moment') && !title.includes('attention') && title !== 'www.athletic.net' && title !== 'athletic.net';
                }, { timeout: 12000 });
                console.log("✅ Cloudflare cleared! Proceeding with verification.");
            } catch (e) {
                throw new Error("Cloudflare Block Active"); // Trigger immediate retry
            }
        }

        // 🕵️ SMART POLLING: Check the page repeatedly for up to 8 seconds.
        // The moment the JS hydrates the @handle, this will spot it and resolve instantly!
        const isVerified = await page.waitForFunction((verificationCode: string) => {
          const codeStr = verificationCode.toLowerCase();
          const bodyText = document.body.innerText.toLowerCase();
          const htmlText = document.documentElement.innerHTML.toLowerCase();
          
          return bodyText.includes(codeStr) || htmlText.includes(codeStr);
        }, { timeout: 8000 }, code)
        .then(() => true)
        .catch(() => false); // If it times out after 8s, the code simply isn't there.

        // 🚨 AGGRESSIVE CLEANUP BEFORE RESPONDING
        if (browser) {
          try { await browser.close(); } catch (e) {}
          try { browser.disconnect(); } catch (e) {}
        }

        if (isVerified) {
          return NextResponse.json({ success: true, message: 'Profile verified successfully!' });
        } else {
          return NextResponse.json({ success: false, error: 'Verification code not found. Make sure you saved it to your Athletic.net profile handle or bio!' }, { status: 403 });
        }

      } catch (error: any) {
        console.error(`❌ Verification Error Captured (Attempt ${attempt}):`, error.message);
        
        const msg = error.message || "";
        
        // Check for rate limits, timeouts, or CF blocks to trigger a retry
        if (msg.includes('Cloudflare') || msg.includes('security') || msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('Timeout') || msg.includes('Execution context was destroyed')) {
          if (attempt >= MAX_RETRIES) {
            return NextResponse.json({ error: 'Athletic.net security check is temporarily blocking us. Please wait a minute and try again.' }, { status: 503 });
          }
          await new Promise(res => setTimeout(res, 1000));
          continue; 
        }
        return NextResponse.json({ error: `Verification Error: ${msg}` }, { status: 500 });
      } finally {
        // 🚨 AGGRESSIVE CLEANUP FAILSAFE
        if (browser) {
          try { await browser.close(); } catch (e) {}
          try { browser.disconnect(); } catch (e) {}
        }
      }
    }

  } catch (globalError: any) {
    console.error("Global Verification Error:", globalError);
    return NextResponse.json({ error: `Verification Error: ${globalError.message}` }, { status: 500 });
  }
}