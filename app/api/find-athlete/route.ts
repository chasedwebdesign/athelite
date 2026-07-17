import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DAILY_GLOBAL_LIMIT = 500; 

export async function POST(req: Request) {
  const { firstName, lastName, state } = await req.json();
  const SCRAPINGANT_API_KEY = process.env.SCRAPINGANT_API_KEY;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'First and last name are required.' }, { status: 400 });
  }

  if (!SCRAPINGANT_API_KEY) {
    return NextResponse.json({ error: 'ScrapingAnt API key is missing.' }, { status: 500 });
  }

  // ==========================================
  // 🚨 1. CHECK THE KILL SWITCH
  // ==========================================
  try {
    const { data: isAllowed, error } = await supabaseAdmin.rpc('check_and_increment_usage', {
      limit_amount: DAILY_GLOBAL_LIMIT
    });

    if (error || !isAllowed) {
      return NextResponse.json({ error: "Global daily limit reached to protect platform stability." }, { status: 429 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Failed to verify usage limits." }, { status: 500 });
  }

  // ==========================================
  // 🚀 2. ULTRA-FAST RAW HTML SEARCH (NO BROWSER)
  // ==========================================
  const dorkQuery = `site:athletic.net/athlete/ intitle:"${firstName} ${lastName}" ${state ? `"${state}"` : ''}`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(dorkQuery)}`;
  
  const MAX_RETRIES = 2;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;

    try {
      console.log(`\n⚡ Fast Scraper: "${dorkQuery}" (Attempt ${attempt}/${MAX_RETRIES})`);
      
      const queryParams = new URLSearchParams({
        url: searchUrl,
        proxy_type: 'residential' 
        // 🚨 browser: 'true' is REMOVED. This makes the request 10x faster!
      });

      const res = await fetch(`https://api.scrapingant.com/v2/general?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'x-api-key': SCRAPINGANT_API_KEY },
        cache: 'no-store'
      });

      if (!res.ok) {
        if (res.status === 423 || res.status === 429) throw new Error("Retryable Block");
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();
      
      // 🚨 3. BLAZING FAST REGEX EXTRACTION (No DOM Parsing)
      // Matches: https://www.athletic.net/track-and-field/athlete/12345
      const urlRegex = /https:\/\/(?:www\.)?athletic\.net\/[a-zA-Z0-9-]+\/athlete\/[0-9]+/gi;
      const matches = html.match(urlRegex);

      if (!matches || matches.length === 0) {
        return NextResponse.json({ success: true, data: [], message: 'No athletes found matching that criteria.' });
      }

      // Deduplicate and format URLs
      const uniqueUrls = [...new Set(matches)];
      
      const domResults = uniqueUrls.map(url => {
        let clean = url.toLowerCase();
        
        // Force the Track & Field layout
        if (!clean.includes('track-and-field')) {
            clean = clean.replace(/athletic\.net\/[^\/]+\/athlete/, 'athletic.net/track-and-field/athlete');
        }
        if (!clean.endsWith('/')) clean += '/';

        return {
          name: `${firstName} ${lastName}`,
          school: 'Verify on profile', // Keep UI fast and clean
          url: clean
        };
      }).slice(0, 5);

      console.log(`✅ Fast Extracted ${domResults.length} athletes via Google.`);
      return NextResponse.json({ success: true, data: domResults });

    } catch (error: any) {
      const msg = error.message || "";
      if (msg.includes('Retryable') || msg.includes('CAPTCHA')) {
        if (attempt >= MAX_RETRIES) {
          return NextResponse.json({ error: 'Search engine limits temporarily blocking us. Please try again later.' }, { status: 503 });
        }
        await new Promise(res => setTimeout(res, 1500));
        continue; 
      }
      return NextResponse.json({ error: `Search temporarily unavailable: ${msg}` }, { status: 500 });
    }
  }
}