import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { url, code } = await req.json();
    
    // 🔑 BROWSERLESS API KEY
    const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

    if (!url || !code || !url.includes('athletic.net')) {
      return NextResponse.json({ error: 'Invalid URL or missing verification code.' }, { status: 400 });
    }

    console.log(`🔍 Verifying Code [${code}] on Profile -> ${url}`);

    const browser = await puppeteerCore.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}&stealth=true`
    });
    
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Block heavy resources so it loads instantly
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['image', 'media', 'font', 'stylesheet'].includes(request.resourceType())) request.abort();
      else request.continue();
    });

    // ⚡ FIX: Back to 'domcontentloaded' so we don't get stuck waiting on ad scripts
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 🕵️ SMART POLLING: Check the page repeatedly for up to 8 seconds.
    // The moment the JS hydrates the @handle, this will spot it and resolve instantly!
    const isVerified = await page.waitForFunction((verificationCode) => {
      const code = verificationCode.toLowerCase();
      const bodyText = document.body.innerText.toLowerCase();
      const htmlText = document.documentElement.innerHTML.toLowerCase();
      
      return bodyText.includes(code) || htmlText.includes(code);
    }, { timeout: 8000 }, code)
    .then(() => true)
    .catch(() => false); // If it times out after 8s, the code simply isn't there.

    await browser.close();

    if (isVerified) {
      return NextResponse.json({ success: true, message: 'Profile verified successfully!' });
    } else {
      return NextResponse.json({ success: false, error: 'Verification code not found. Make sure you saved it to your Athletic.net profile handle or bio!' }, { status: 403 });
    }

  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: `Verification Error: ${error.message}` }, { status: 500 });
  }
}