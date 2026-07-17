import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function Config
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

// 🚨 ADMIN SUPABASE CLIENT (Bypasses RLS strictly for the kill-switch counter) 🚨
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DAILY_GLOBAL_LIMIT = 300; 

const TRACK_EVENTS = [
  '50 Meters', '50 Meter', '55 Meters', '55 Meter', '60 Meters', '60 Meter', 
  '100 Meters', '150 Meters', '150 Meter', '200 Meters', '300 Meters', '300 Meter', 
  '400 Meters', '500 Meters', '500 Meter', '600 Meters', '600 Meter', '800 Meters', 
  '1000 Meters', '1000 Meter', '1500 Meters', '1600 Meters', '1 Mile', '2000 Meters', 
  '2000 Meter', '3000 Meters', '3200 Meters', '2 Mile', '2 Miles', '5000 Meters', 
  '10,000 Meters', '100m Hurdles', '110m Hurdles', '200m Hurdles', '300m Hurdles', 
  '400m Hurdles', 'Shot Put', 'Discus', 'Javelin', 'Hammer', 'Weight Throw', 
  'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump', 'Pentathlon', 
  'Heptathlon', 'Decathlon', '5K', '3 Mile', '4x100 Relay', '4x400 Relay', '40 Yard Dash'
];

const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

// ==========================================
// 💡 CLOUD EXECUTION LOGIC
// We wrap your exact logic in standard functions. Next.js will convert these 
// to strings and ScrapingAnt will inject them directly into their cloud browser!
// ==========================================

const mainPageLogicFn = function(eventsList: string[], fieldEventsList: string[]) {
  const trashSelectors = ['.feed', '.news-feed', '.training-log', '.side-nav', '.nav', '.sidebar', '.menu', '[class*="training"]', '.blurred', '[style*="filter: blur"]'];
  document.querySelectorAll(trashSelectors.join(', ')).forEach(el => el.remove());

  const h1 = document.querySelector('h1') as HTMLElement;
  let fullName = h1?.innerText || document.title.split('-')[0].trim();
  
  if (fullName.toLowerCase().includes('athletic.net') || fullName.toLowerCase().includes('just a moment')) {
      throw new Error("Cloudflare Block Active");
  }

  const firstName = fullName.split(' ')[0] || 'Unknown';
  const lastName = fullName.split(' ').slice(1).join(' ') || '';

  let teamUrl: string | null = null;
  let schoolName = 'Unattached / High School';
  let isClub = false;
  
  const teamLinks = Array.from(document.querySelectorAll('h2 a, .profile-heading a, .team-name a, a[href*="/School.aspx"], a[href*="/team/"]'));
  let targetLink = teamLinks.find(a => {
      const text = (a as HTMLElement).innerText.toLowerCase();
      return (text.includes('hs') || text.includes('high school')) && !text.includes('middle');
  });

  if (!targetLink) targetLink = teamLinks.find(a => !((a as HTMLElement).innerText.toLowerCase().includes('middle')) && !((a as HTMLElement).innerText.toLowerCase().endsWith(' ms')));

  if (targetLink) {
      schoolName = (targetLink as HTMLElement).innerText.trim();
      teamUrl = (targetLink as HTMLAnchorElement).href;
      if(schoolName.toLowerCase().includes('club') || schoolName.toLowerCase().includes('usatf') || schoolName.toLowerCase().includes('aau') || schoolName.toLowerCase().includes('athletics')) isClub = true;
  }

  let gradYear: number | null = null;
  let latestSourceYear = 0;

  const classMatch = document.body.innerText.match(/(?:Class of|Graduates|Grad Year|YOG)[\s:]*([2][0-9]{3})/i);
  if (classMatch) {
      gradYear = parseInt(classMatch[1], 10);
  } else {
      const allDivs = Array.from(document.querySelectorAll('div, section, aside, .card, .panel'));
      let srDiv = allDivs.find(d => d.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.includes('Season Records'));
      if (srDiv) {
          const lines = (srDiv as HTMLElement).innerText.split('\n').map(l => l.trim()).filter(Boolean);
          for (let line of lines) {
              const match = line.match(/^(\d{4})\s+(?:Outdoor|Indoor|XC|Cross Country|Club)?\s*(1[0-2]|[7-9])/i);
              if (match) {
                  const year = parseInt(match[1], 10);
                  const grade = parseInt(match[2], 10);
                  if (grade >= 9 && grade <= 12) {
                      const calc = year + (12 - grade);
                      if (year > latestSourceYear) { gradYear = calc; latestSourceYear = year; }
                  }
              }
          }
      }
  }

  const mainContent = document.querySelector('.col-md-9') || document.querySelector('.profile-main') || document.body;
  const walker = document.createTreeWalker(mainContent, NodeFilter.SHOW_TEXT, null);
  const allNodes: string[] = [];
  let node;
  
  const noiseRegex = /^(\*|\*Improvement|c|-?\s*\d+(\.\d+)?\s*(kg|lb)s?)$/i;
  
  while ((node = walker.nextNode())) {
    const text = node.nodeValue?.trim();
    if (text && !noiseRegex.test(text)) allNodes.push(text);
  }

  const prs: { event: string; mark: string; date: string; meet: string }[] = [];
  let currentEvent: string | null = null;
  let isHighSchool: boolean = true; 

  const parseMark = (markStr: string, eventName: string) => {
      const isField = fieldEventsList.includes(eventName);
      let val = 0;
      if (isField) {
          const clean = markStr.replace(/[^0-9.]/g, ' ').trim().split(/\s+/);
          const feet = parseFloat(clean[0]) || 0;
          const inches = parseFloat(clean[1]) || 0;
          val = (feet * 12) + inches;
      } else {
          if (markStr.includes(':')) {
              const parts = markStr.split(':');
              val = (parseFloat(parts[0]) * 60) + parseFloat(parts[1]);
          } else val = parseFloat(markStr.replace(/[a-zA-Z]/g, '').trim()) || 99999;
      }
      return { val, isField };
  };

  for (let i = 0; i < allNodes.length; i++) {
    const text = allNodes[i];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('7th grade') || lowerText.includes('8th grade') || lowerText.includes('middle school') || lowerText.endsWith(' ms')) isHighSchool = false;
    else if (lowerText.includes('9th grade') || lowerText.includes('10th grade') || lowerText.includes('11th grade') || lowerText.includes('12th grade') || lowerText.includes('varsity') || lowerText.includes('high school') || lowerText.endsWith(' hs') || lowerText.includes('club')) isHighSchool = true;

    let matchedEvent = eventsList.find(e => text === e || text.startsWith(e) || text.replace(/meters?/i, 'meter').toLowerCase() === e.toLowerCase().replace(/meters?/i, 'meter'));
    
    if (matchedEvent && text.length < 35) { 
        currentEvent = matchedEvent; 
        continue; 
    } else if (/(meter|m\b|yard|hurdle|jump|vault|put|discus|javelin|hammer|relay|dash|throw|athlon|xc|cross country)/i.test(text) && text.length < 35) {
        currentEvent = null;
        continue;
    }

    if (isHighSchool && currentEvent && (text === 'PB' || text === 'PR' || text === 'SR')) {
      let possibleWind = allNodes[i - 1];
      let possibleMark = allNodes[i - 2];
      let mark = possibleWind;

      if (possibleWind && !/\d/.test(possibleWind)) {
          possibleWind = allNodes[i - 2];
          possibleMark = allNodes[i - 3];
          mark = possibleWind;
      }

      let cleanWind = possibleWind.replace(/[()c*]/g, '').trim();
      const isWind = /^[+-]?\d{1,2}\.\d$/.test(cleanWind) || cleanWind === 'NWI';
      
      if (isWind && possibleMark && /\d/.test(possibleMark)) mark = possibleMark;

      let date = allNodes[i + 1] || 'Unknown Date';
      let meet = allNodes[i + 2] || 'Unknown Meet';

      const isEvent = (s: string) => eventsList.some(e => s.toLowerCase() === e.toLowerCase() || s.toLowerCase().startsWith(e.toLowerCase()));
      const isSeasonHeader = (s: string) => /^\d{4}\s+(Outdoor|Indoor|XC|Cross Country)$/i.test(s);
      const isMark = (s: string) => /\d/.test(s) && (s.includes("'") || s.includes('"') || s.includes(':') || /^\d{1,2}\.\d{2}$/.test(s));

      if (isEvent(date) || isSeasonHeader(date) || isMark(date)) {
          date = 'Unknown Date';
          meet = 'Unknown Meet';
      } else if (isEvent(meet) || isSeasonHeader(meet) || isMark(meet)) {
          meet = 'Unknown Meet';
      }

      if (mark && /\d/.test(mark) && !mark.includes('mi.') && mark.length < 15) {
        const existingPRIndex = prs.findIndex(pr => pr.event === currentEvent);
        
        if (existingPRIndex === -1) {
            prs.push({ event: currentEvent, mark, date, meet });
        } else {
            const oldMarkData = parseMark(prs[existingPRIndex].mark, currentEvent);
            const newMarkData = parseMark(mark, currentEvent);

            let isBetter = false;
            if (oldMarkData.isField) {
                if (newMarkData.val > oldMarkData.val) isBetter = true;
            } else {
                if (newMarkData.val > 0 && newMarkData.val < oldMarkData.val) isBetter = true;
            }

            if (isBetter) prs[existingPRIndex] = { event: currentEvent, mark, date, meet };
            else if (prs[existingPRIndex].date === 'Unknown Date' && date !== 'Unknown Date' && newMarkData.val === oldMarkData.val) {
                prs[existingPRIndex].date = date;
                prs[existingPRIndex].meet = meet;
            }
        }
      }
    }
  }

  let gender = 'Boys'; 

  const eventsText = prs.map(p => p.event.toLowerCase()).join(' ');
  if (eventsText.includes('100m hurdles') || eventsText.includes('100 meter hurdles') || eventsText.includes('heptathlon')) {
      gender = 'Girls';
  } else if (eventsText.includes('110m hurdles') || eventsText.includes('110 meter hurdles') || eventsText.includes('decathlon')) {
      gender = 'Boys';
  } else {
      if (h1) {
          const headerBlock = h1.parentElement?.parentElement?.parentElement || document.body;
          const elements = Array.from(headerBlock.querySelectorAll('*'));
          
          for (let el of elements) {
              const style = window.getComputedStyle(el);
              const bg = style.backgroundColor || '';
              const fill = el.getAttribute('fill') || '';
              const inline = el.getAttribute('style') || '';
              
              const combinedStr = (bg + ' ' + fill + ' ' + inline).toLowerCase();
              
              const rgbMatch = combinedStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
              if (rgbMatch) {
                  const r = parseInt(rgbMatch[1]);
                  const g = parseInt(rgbMatch[2]);
                  const b = parseInt(rgbMatch[3]);
                  
                  if (r > 200 && r > b + 20 && r > g + 20) { gender = 'Girls'; break; }
                  if (b > 200 && b > r + 20 && b > g + 20) { gender = 'Boys'; break; }
              }
              
              if (combinedStr.includes('pink') || combinedStr.includes('#ffa3ac') || combinedStr.includes('#ff8a80')) { gender = 'Girls'; break; }
              if (combinedStr.includes('blue') || combinedStr.includes('#3d8ee8') || combinedStr.includes('#82b1ff')) { gender = 'Boys'; break; }
          }
      }
      
      if (gender === 'Boys') {
          const scripts = Array.from(document.querySelectorAll('script')).map(s => s.innerText.toLowerCase());
          for (let script of scripts) {
              if (script.includes('"gender":"f"') || script.includes('"gender":"female"') || script.includes("'gender':'f'")) {
                  gender = 'Girls';
                  break;
              }
          }
      }
  }

  return { firstName, lastName, schoolName, prs, gender, teamUrl, gradYear, isClub };
};

const teamPageLogicFn = function(isClub: boolean) {
  let st: string | null = null;
  let sz: string | null = null;
  let conf: string | null = null;
  
  const allLinks = Array.from(document.querySelectorAll('a'));
  const usLinkIndex = allLinks.findIndex(a => {
    const t = a.textContent?.trim().toLowerCase();
    return t === 'united states' || t === 'us';
  });

  if (usLinkIndex !== -1) {
    let offset = 1;
    const nextLevel = allLinks[usLinkIndex + offset]?.textContent?.trim().toLowerCase();
    if (nextLevel === 'high school' || nextLevel === 'middle school' || nextLevel === 'college' || nextLevel === 'clubs' || nextLevel === 'club') offset++; 

    st = allLinks[usLinkIndex + offset]?.textContent?.trim() || null; 
    let next1 = allLinks[usLinkIndex + offset + 1]?.textContent?.trim() || null; 
    let next2 = allLinks[usLinkIndex + offset + 2]?.textContent?.trim() || null; 
    
    const sizeRegex = /^[1-8]A$|Class |Division |Div |Group |Region |Section /i;

    if (isClub) {
        sz = 'Club';
        conf = next1 && !next1.toLowerCase().includes('high school') ? next1 : 'USATF / AAU';
    } else {
        if (next1 && sizeRegex.test(next1)) {
            sz = next1;
            if (next2 && !next2.toLowerCase().includes('high school') && !next2.toLowerCase().endsWith(' hs')) conf = next2;
        } else if (next1 && !next1.toLowerCase().includes('high school') && !next1.toLowerCase().endsWith(' hs')) conf = next1;
    }
  }
  return { state: st, schoolSize: sz, conference: conf };
};

// Converts your logic functions into a format ScrapingAnt will execute cleanly.
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
  const { url } = await req.json();
  const SCRAPINGANT_API_KEY = process.env.SCRAPINGANT_API_KEY; 

  if (!url || !url.includes('athletic.net')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
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

    if (error) throw error;

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

  // ==========================================
  // 🚀 2. EXECUTE SCRAPINGANT REQUESTS
  // ==========================================
  const MAX_RETRIES = 2;
  let attempt = 0;

  const fetchScrapingAnt = async (targetUrl: string, jsSnippet: string) => {
    // 🚨 ScrapingAnt v2 strictly requires parameters in the URL query string for GET requests.
    // URLSearchParams automatically handles the secondary URL-encoding required for Base64 strings.
    const queryParams = new URLSearchParams({
      url: targetUrl,
      browser: 'true',
      js_snippet: jsSnippet
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
    return await res.text();
  };

  while (attempt < MAX_RETRIES) {
    attempt++;

    try {
      console.log(`☁️ Hitting ScrapingAnt Cloud Browser... (Attempt ${attempt}/${MAX_RETRIES})`);
      console.log(`🚀 Step 1: Evaluating Athlete Logic -> ${url}`);
      
      const mainSnippet = buildScrapingAntSnippet(mainPageLogicFn, [TRACK_EVENTS, FIELD_EVENTS]);
      const mainHtml = await fetchScrapingAnt(url, mainSnippet);
      const extractedData = extractDataFromHtml(mainHtml);

      let state = null;
      let schoolSize = null;
      let conference = null;

      if (extractedData.teamUrl) {
        try {
          console.log(`🎯 Step 2: Evaluating Team Metrics -> ${extractedData.teamUrl}`);
          let targetUrl = extractedData.teamUrl;
          if (targetUrl.startsWith('/')) targetUrl = 'https://www.athletic.net' + targetUrl;

          const teamSnippet = buildScrapingAntSnippet(teamPageLogicFn, [extractedData.isClub]);
          const teamHtml = await fetchScrapingAnt(targetUrl, teamSnippet);
          const teamDetails = extractDataFromHtml(teamHtml);

          state = teamDetails.state;
          schoolSize = teamDetails.schoolSize;
          conference = teamDetails.conference;
        } catch (teamPageErr) {
          console.log("⚠️ Could not load the team page to get location details.");
        }
      }

      return NextResponse.json({ 
        success: true, 
        data: {
          firstName: extractedData.firstName,
          lastName: extractedData.lastName,
          schoolName: extractedData.schoolName,
          prs: extractedData.prs,
          gender: extractedData.gender,
          state: state,
          schoolSize: schoolSize,
          conference: conference,
          gradYear: extractedData.gradYear,
          url
        } 
      });

    } catch (error: any) {
      console.error(`❌ Scraping Error Captured (Attempt ${attempt}):`, error.message);
      
      const msg = error.message || "";
      
      // Auto-retry transient network errors or timeouts
      if (msg.includes('Retryable') || msg.includes('Cloudflare') || msg.includes('bot block') || msg.includes('429')) {
        if (attempt >= MAX_RETRIES) {
          return NextResponse.json({ error: 'Athletic.net security check is temporarily blocking us. Please wait a minute and try again.' }, { status: 503 });
        }
        await new Promise(res => setTimeout(res, 1500));
        continue; 
      }
      return NextResponse.json({ error: `Scraper Error: ${msg}` }, { status: 500 });
    }
  }
}