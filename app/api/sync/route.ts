import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core'; 

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

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

export async function POST(req: Request) {
  const { url } = await req.json();
  const ZENROWS_API_KEY = process.env.ZENROWS_API_KEY; // 🚨 New ZenRows Key

  if (!url || !url.includes('athletic.net')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!ZENROWS_API_KEY) {
    return NextResponse.json({ error: 'ZenRows API key is missing from environment variables.' }, { status: 500 });
  }

  const MAX_RETRIES = 2;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    let browser: any = null; 
    attempt++;

    try {
      console.log(`☁️ Connecting securely to ZenRows... (Attempt ${attempt}/${MAX_RETRIES})`);
      
      // 🚨 ZENROWS MAGIC: We point Puppeteer to ZenRows, and they handle Cloudflare, residential proxies, and fingerprinting!
      browser = await puppeteerCore.connect({
        browserWSEndpoint: `wss://browser.zenrows.com?apikey=${ZENROWS_API_KEY}`
      });
      
      const page = await browser.newPage();
      
      // ZenRows already handles stealth and user agents internally.
      
      console.log(`🚀 Step 1: Loading Athlete Page -> ${url}`);
      
      // We give it 30s because ZenRows is doing heavy CAPTCHA solving behind the scenes before the page loads.
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Failsafe: if ZenRows somehow passes back a Cloudflare check page, wait a few seconds.
      const pageTitle = await page.title();
      if (pageTitle.includes('Just a moment') || pageTitle.includes('Attention Required') || pageTitle.toLowerCase() === 'www.athletic.net') {
          console.log("🛡️ Cloudflare check detected! ZenRows is solving it...");
          await new Promise(r => setTimeout(r, 5000));
      }

      await page.waitForSelector('h1', { timeout: 5000 }).catch(() => console.log("H1 not found, might be a malformed page."));
      
      await page.waitForFunction(() => {
        const text = document.body.innerText;
        return text.includes('PB') || text.includes('PR') || text.includes('SR');
      }, { timeout: 8000 }).catch(() => console.log("Timeout waiting for PR tags. Proceeding anyway."));

      console.log("⏳ Waiting for Avatar CSS to paint...");
      
      await page.waitForFunction(() => {
        const h1 = document.querySelector('h1');
        if (!h1) return false;
        
        const headerBlock = h1.parentElement?.parentElement?.parentElement || document.body;
        const elements = Array.from(headerBlock.querySelectorAll('*'));
        
        for (let el of elements) {
            const style = window.getComputedStyle(el);
            const bg = style.backgroundColor || '';
            const inline = el.getAttribute('style') || '';
            const fill = el.getAttribute('fill') || '';
            
            const combined = (bg + ' ' + inline + ' ' + fill).toLowerCase();
            
            if (combined.includes('rgb(255, 163, 172)') || combined.includes('#ffa3ac') || combined.includes('pink')) return true; 
            if (combined.includes('rgb(61, 142, 232)') || combined.includes('#3d8ee8') || combined.includes('blue')) return true; 
            
            const rgbMatch = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
                const r = parseInt(rgbMatch[1]);
                const g = parseInt(rgbMatch[2]);
                const b = parseInt(rgbMatch[3]);
                if ((r > 200 && r > b + 20 && r > g + 20) || (b > 200 && b > r + 20 && b > g + 20)) {
                    return true;
                }
            }
        }
        return false;
      }, { timeout: 2000 }).catch(() => console.log("⚠️ Avatar color wait timed out, relying on script fallbacks."));

      await new Promise(r => setTimeout(r, 200));

      let extractedData = await page.evaluate((eventsList: string[], fieldEventsList: string[]) => {
        
        const trashSelectors = ['.feed', '.news-feed', '.training-log', '.side-nav', '.nav', '.sidebar', '.menu', '[class*="training"]', '.blurred', '[style*="filter: blur"]'];
        document.querySelectorAll(trashSelectors.join(', ')).forEach(el => el.remove());

        const h1 = document.querySelector('h1') as HTMLElement;
        let fullName = h1?.innerText || document.title.split('-')[0].trim();
        
        if (fullName.toLowerCase().includes('athletic.net') || fullName.toLowerCase().includes('just a moment')) {
            throw new Error("Cloudflare Block Active");
        }

        const firstName = fullName.split(' ')[0] || 'Unknown';
        const lastName = fullName.split(' ').slice(1).join(' ') || '';

        let teamUrl = null;
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

        let gradYear = null;
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
      }, TRACK_EVENTS, FIELD_EVENTS);

      let state = null;
      let schoolSize = null;
      let conference = null;

      if (extractedData.teamUrl) {
        try {
          console.log(`🎯 Step 2: Navigating to Current Team -> ${extractedData.teamUrl}`);
          
          let targetUrl = extractedData.teamUrl;
          if (targetUrl.startsWith('/')) targetUrl = 'https://www.athletic.net' + targetUrl;

          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
          
          const teamDetails = await page.evaluate((isClub: boolean) => {
            let st = null;
            let sz = null;
            let conf = null;
            
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
          }, extractedData.isClub);

          state = teamDetails.state;
          schoolSize = teamDetails.schoolSize;
          conference = teamDetails.conference;

        } catch (teamPageErr) {
          console.log("⚠️ Could not load the team page to get location details.");
        }
      }

      if (browser) {
        try { await browser.close(); } catch (e) {}
        try { browser.disconnect(); } catch (e) {} 
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
      
      if (msg.includes('Cloudflare') || msg.includes('security') || msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('Timeout') || msg.includes('Execution context was destroyed')) {
        if (attempt >= MAX_RETRIES) {
          return NextResponse.json({ error: 'Athletic.net security check is temporarily blocking us. Please wait a minute and try again.' }, { status: 503 });
        }
        await new Promise(res => setTimeout(res, 1000));
        continue; 
      }
      return NextResponse.json({ error: `Scraper Error: ${msg}` }, { status: 500 });
    } finally {
      if (browser) {
        try { await browser.close(); } catch (e) {}
        try { browser.disconnect(); } catch (e) {}
      }
    }
  }
}