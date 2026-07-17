import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// 🚨 ADMIN SUPABASE CLIENT (Bypasses RLS strictly for the kill-switch counter) 🚨
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Set your global limit (e.g., 500 scrapes per day)
const DAILY_GLOBAL_LIMIT = 500; 

// ==========================================
// 💡 THE "DON'T REWRITE LOGIC" TRICK
// We wrap your exact DOM extraction logic in a standard function.
// Next.js will convert this to a string and ScrapingAnt will inject it directly!
// ==========================================
const searchPageLogicFn = function(fName: string, lName: string, filterState: string, filterCity: string) {
  const athletes: any[] = [];
  
  // 1. ONLY look for anchor tags that are actual links
  const allLinks = Array.from(document.querySelectorAll('a')).filter(a => {
      const href = a.href.toLowerCase();
      return href.includes('/athlete/') || href.includes('athlete.aspx');
  });

  // 2. Filter for name match
  const nameLinks = allLinks.filter(a => {
      const t = a.textContent || '';
      const tLower = t.toLowerCase();
      return tLower.includes(fName.toLowerCase()) && tLower.includes(lName.toLowerCase());
  });

  nameLinks.forEach(link => {
      let rawUrl = link.href;
      const cleanName = (link.textContent || '').replace(/(TF|XC|Indoor|Outdoor)/gi, '').replace(/\s+/g, ' ').trim();
      
      let container = link.closest('li, tr, .search-result, .list-group-item, .card');
      
      if (!container || !/(HS|High School|MS|Middle School)/i.test(container.textContent || '')) {
          container = link as Element;
          for (let i = 0; i < 5; i++) {
              if (container.parentElement) container = container.parentElement;
              if (/(HS|High School|MS|Middle School)/i.test(container.textContent || '')) break;
          }
      }

      if (!container) return;

      const fullText = container.textContent || '';
      let schoolName = 'Unknown High School';
      const lines = fullText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
      const schoolLine = lines.find(l => /(HS|High School|MS|Middle School)/i.test(l) && !l.toLowerCase().includes(fName.toLowerCase()));
      
      if (schoolLine) {
          schoolName = schoolLine.replace(/^((?:TF|XC)\s+)?/i, '').replace(/\([0-9-]+\)/g, '').replace(/Show PRs\.\.\./gi, '').trim();
      } else {
          const rawMatch = fullText.match(/(?:TF|XC)?\s*([A-Z][A-Za-z0-9\s.'-]+\s(?:HS|High School|MS|Middle School))/i);
          if (rawMatch && !rawMatch[1].toLowerCase().includes(fName.toLowerCase())) {
              schoolName = rawMatch[1].trim();
          }
      }

      // 🚨 THE FIX: Remove jammed state abbreviations (e.g., "ORSouth" -> "South")
      schoolName = schoolName.replace(/^([A-Z]{2})(?=[A-Z][a-z])/g, '').trim();

      // Force URL format
      let finalUrl = rawUrl;
      if (finalUrl.includes('/athlete/') && !finalUrl.includes('/track-and-field') && !finalUrl.includes('/cross-country')) {
          if (!finalUrl.endsWith('/')) finalUrl += '/';
          finalUrl += 'track-and-field';
      } else if (finalUrl.toLowerCase().includes('athlete.aspx')) {
          const urlObj = new URL(finalUrl);
          const aid = urlObj.searchParams.get('AID');
          if (aid) finalUrl = `https://www.athletic.net/athlete/${aid}/track-and-field`;
      }

      if (cleanName.length > 2 && finalUrl) {
          const textLower = fullText.toLowerCase();
          const stateMap: Record<string, string> = { 'oregon': ' or', 'washington': ' wa', 'california': ' ca', 'texas': ' tx', 'florida': ' fl', 'new york': ' ny', 'ohio': ' oh' };
          const mappedState = stateMap[filterState.toLowerCase()] || filterState.toLowerCase();
          
          const stateMatch = !filterState || textLower.includes(filterState.toLowerCase()) || textLower.includes(mappedState);
          const cityMatch = !filterCity || textLower.includes(filterCity.toLowerCase());

          if (stateMatch && cityMatch && !athletes.some(a => a.url === finalUrl)) {
              athletes.push({ name: cleanName, school: schoolName, url: finalUrl });
          }
      }
  });
  
  return athletes.slice(0, 5);
};

// Converts logic functions into a format ScrapingAnt will execute cleanly.
const buildScrapingAntSnippet = (fn: Function, args: any[]) => {
  let script = `
    try {
      const execLogic = ${fn.toString()};
      const result = execLogic(${args.map(a => JSON.stringify(a)).join(', ')});
      const ta = document.createElement('textarea');
      ta.id = '__chased_data__';
      ta.textContent = JSON.stringify(result);
      document.body.appendChild(ta);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.id = '__chased_error__';
      ta.textContent = e.message || String(e);
      document.body.appendChild(ta);
    }
  `;
  
  // Minify the script string to ensure we stay well under URL length limits
  script = script.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ');
  return Buffer.from(script).toString('base64');
};

const extractDataFromHtml = (html: string) => {
  const dataMatch = html.match(/<textarea id="__chased_data__">([\s\S]*?)<\/textarea>/);
  if (dataMatch && dataMatch[1]) return JSON.parse(dataMatch[1]);
  
  const errMatch = html.match(/<textarea id="__chased_error__">([\s\S]*?)<\/textarea>/);
  if (errMatch && errMatch[1]) throw new Error("Injected JS Error: " + errMatch[1]);
  
  throw new Error("ScrapingAnt loaded the page, but no scraped data was returned. Potential bot block.");
};

export async function POST(req: Request) {
  const { firstName, lastName, state, city } = await req.json();
  const SCRAPINGANT_API_KEY = process.env.SCRAPINGANT_API_KEY;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'First and last name are required.' }, { status: 400 });
  }

  if (!SCRAPINGANT_API_KEY) {
    return NextResponse.json({ error: 'ScrapingAnt API key is missing from environment variables.' }, { status: 500 });
  }

  // ==========================================
  // 🚨 1. CHECK THE KILL SWITCH (THE TRAP DOOR)
  // ==========================================
  try {
    const { data: isAllowed, error } = await supabaseAdmin.rpc('check_and_increment_usage', {
      limit_amount: DAILY_GLOBAL_LIMIT
    });

    if (error) {
      console.error("Supabase RPC Error:", error);
      return NextResponse.json({ error: "Internal Server Error verifying limits." }, { status: 500 });
    }

    if (!isAllowed) {
      console.warn("🛑 TRAP DOOR ACTIVATED: Global daily search limit reached.");
      return NextResponse.json({ 
        error: "Global daily limit reached to protect platform stability. Please try again tomorrow." 
      }, { status: 429 });
    }
  } catch (err) {
    console.error("Kill switch error:", err);
    return NextResponse.json({ error: "Failed to verify usage limits." }, { status: 500 });
  }

  // ==========================================
  // 🚀 2. EXECUTE SCRAPINGANT REQUEST
  // ==========================================
  const searchTerms = `${firstName} ${lastName}`;
  const searchUrl = `https://www.athletic.net/Search.aspx?q=${encodeURIComponent(searchTerms)}`;
  
  const MAX_RETRIES = 2;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;

    try {
      console.log(`\n☁️ Booting Scraper for: "${searchTerms}" (Attempt ${attempt}/${MAX_RETRIES})`);
      
      const snippet = buildScrapingAntSnippet(searchPageLogicFn, [firstName, lastName, state || '', city || '']);
      
      // 🚨 ScrapingAnt v2 requires parameters in the URL query string for GET requests.
      const queryParams = new URLSearchParams({
        url: searchUrl,
        browser: 'true',
        proxy_type: 'residential', // 🚨 THE FIX: Use real home ISP IPs to bypass Cloudflare instantly
        proxy_country: 'US',       // 🚨 Keep it stateside so Athletic.net doesn't flag a foreign request
        js_snippet: snippet
      });

      const res = await fetch(`https://api.scrapingant.com/v2/general?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'x-api-key': SCRAPINGANT_API_KEY
        }
      });

      if (!res.ok) {
        if (res.status === 422) {
            const errText = await res.text();
            throw new Error(`422 Validation Error from ScrapingAnt: ${errText}`);
        }
        if (res.status === 429 || res.status >= 500) throw new Error("Retryable ScrapingAnt Error");
        throw new Error(`ScrapingAnt Failed: HTTP ${res.status}`);
      }

      const html = await res.text();
      const domResults = extractDataFromHtml(html);

      console.log(`✅ Extracted ${domResults.length} athletes.`);
      console.log("🔗 URLs Returned to Frontend:", JSON.stringify(domResults, null, 2));

      return NextResponse.json({ success: true, data: domResults });

    } catch (error: any) {
      console.error(`❌ Search Error Captured (Attempt ${attempt}):`, error.message);
      
      const msg = error.message || "";
      
      // Auto-retry transient network errors, timeouts, or 429 blocks
      if (msg.includes('Retryable') || msg.includes('Cloudflare') || msg.includes('bot block') || msg.includes('429')) {
        if (attempt >= MAX_RETRIES) {
          return NextResponse.json({ error: 'Athletic.net security check is temporarily blocking us. Please wait a minute and try again.' }, { status: 503 });
        }
        await new Promise(res => setTimeout(res, 1500));
        continue; 
      }
      return NextResponse.json({ error: `Search temporarily unavailable: ${msg}` }, { status: 500 });
    }
  }
}