import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// 🚨 ADMIN SUPABASE CLIENT (Bypasses RLS) 🚨
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Set your global limit (e.g., 300 scrapes per day)
const DAILY_GLOBAL_LIMIT = 500; 

export async function POST(req: Request) {
  const { firstName, lastName, state, city } = await req.json();
  
  // 🚨 REMOVE BEFORE PRODUCTION 🚨
  const ZENROWS_API_KEY = process.env.ZENROWS_API_KEY;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'First and last name are required.' }, { status: 400 });
  }

  if (!ZENROWS_API_KEY) {
    return NextResponse.json({ error: 'ZenRows API key is missing.' }, { status: 500 });
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
  // 🚀 2. PROCEED WITH ZENROWS SCRAPING
  // ==========================================
  let browser: any = null;

  try {
    const searchTerms = `${firstName} ${lastName}`;
    console.log(`\n☁️ Booting Scraper for: "${searchTerms}"`);
    
    browser = await puppeteerCore.connect({
      browserWSEndpoint: `wss://browser.zenrows.com?apikey=${ZENROWS_API_KEY}`
    });
    
    const page = await browser.newPage();
    const searchUrl = `https://www.athletic.net/Search.aspx?q=${encodeURIComponent(searchTerms)}`;
    
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const pageTitle = await page.title();
    if (pageTitle.includes('Just a moment') || pageTitle.includes('Attention')) {
        console.log(`🛡️ Cloudflare detected. Waiting for ZenRows...`);
        await new Promise(r => setTimeout(r, 8000));
    }

    console.log(`⏳ Waiting for Athletic.net to render results...`);
    try {
        await page.waitForFunction((lName: string) => {
            return document.body.innerText.toLowerCase().includes(lName.toLowerCase());
        }, { timeout: 15000 }, lastName);
        console.log(`✅ Results rendered on screen!`);
    } catch (e) {
        console.log(`⚠️ Timed out waiting for name on screen. Proceeding anyway...`);
    }

    await new Promise(r => setTimeout(r, 2000));

    console.log(`🔍 Executing Deep DOM Extraction...`);
    
    const domResults = await page.evaluate((fName: string, lName: string, filterState: string, filterCity: string) => {
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
            // This regex specifically looks for 2 uppercase letters followed immediately by an uppercase and lowercase letter.
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
    }, firstName, lastName, state || '', city || '');

    console.log(`✅ Extracted ${domResults.length} athletes.`);
    console.log("🔗 URLs Returned to Frontend:", JSON.stringify(domResults, null, 2));

    return NextResponse.json({ success: true, data: domResults });

  } catch (error: any) {
    console.error(`❌ Search Error:`, error.message);
    return NextResponse.json({ error: 'Search temporarily unavailable.' }, { status: 500 });
  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) {}
      try { browser.disconnect(); } catch (e) {}
    }
  }
}