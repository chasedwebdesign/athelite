import { NextResponse } from 'next/server';

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

    // 🚨 INVISIBLE BACKEND QUEUE: Retries up to 2 times if Cloudflare puts up a fight
    const MAX_RETRIES = 2;
    let attempt = 0;
    let isVerified = false;
    let lastError = "";

    while (attempt < MAX_RETRIES) {
        attempt++;
        try {
            console.log(`🔍 Verifying Code [${code}] -> ${url} (Attempt ${attempt}/${MAX_RETRIES})`);

            // 🚨 THE REST API PIVOT: We let ZenRows do ALL the work on their servers.
            // We ask for JS Rendering, Premium Proxies, and a 6-second wait for the Vue.js app to load the username.
            const targetUrl = encodeURIComponent(url);
            const zenrowsUrl = `https://api.zenrows.com/v1/?apikey=${ZENROWS_API_KEY}&url=${targetUrl}&js_render=true&premium_proxy=true&wait=6000`;

            const response = await fetch(zenrowsUrl);

            if (!response.ok) {
                throw new Error(`ZenRows API failed with status: ${response.status}`);
            }

            const html = await response.text();
            const htmlLower = html.toLowerCase();

            // Safety check: Did Cloudflare somehow catch ZenRows?
            if (htmlLower.includes('just a moment') || htmlLower.includes('attention required') || htmlLower.includes('cf-browser-verification')) {
                throw new Error("Cloudflare Block Active");
            }

            // 🕵️ GLOBAL HTML SEARCH: If the code is anywhere on the screen, they pass!
            isVerified = htmlLower.includes(code.toLowerCase());
            
            // We successfully read the page! Break out of the retry loop.
            break; 

        } catch (err: any) {
            lastError = err.message;
            console.error(`❌ Verification attempt ${attempt} failed: ${lastError}`);
            if (attempt >= MAX_RETRIES) break;
            
            // Pause for 2 seconds before retrying
            await new Promise(res => setTimeout(res, 2000));
        }
    }

    // If the loop finished and we still have a network error (like a CF block)
    if (lastError && !isVerified && attempt >= MAX_RETRIES) {
         return NextResponse.json({ error: 'Athletic.net security check is temporarily blocking us. Please try again.' }, { status: 503 });
    }

    // If the loop succeeded, check the result!
    if (isVerified) {
      return NextResponse.json({ success: true, message: 'Profile verified successfully!' });
    } else {
      return NextResponse.json({ success: false, error: 'Verification code not found. Make sure you saved it to your Athletic.net profile handle or bio!' }, { status: 403 });
    }

  } catch (globalError: any) {
    console.error("Global Verification Error:", globalError);
    return NextResponse.json({ error: `Verification Error: ${globalError.message}` }, { status: 500 });
  }
}