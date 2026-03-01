import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core'; 

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

const TRACK_EVENTS = [
  '60 Meters', '100 Meters', '200 Meters', '400 Meters', '800 Meters', '1500 Meters', '1600 Meters', 
  '1 Mile', '3000 Meters', '3200 Meters', '5000 Meters', '10,000 Meters', '100m Hurdles', '110m Hurdles', '300m Hurdles', 
  '400m Hurdles', 'Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 
  'Triple Jump', 'Heptathlon', 'Decathlon', '5K', '3 Mile', '4x100 Relay', '4x400 Relay', '40 Yard Dash'
];

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    // 🔑 BROWSERLESS API KEY:
    const BROWSERLESS_API_KEY = "2U3iemcPMpEdfpy11274cfe779a7ad36dfc431b5f1324b3c2";

    if (!url || !url.includes('athletic.net')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    console.log("☁️ Connecting securely to Browserless.io...");
    const browser = await puppeteerCore.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}&stealth=true`
    });
    
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['image', 'media', 'font'].includes(request.resourceType())) request.abort();
      else request.continue();
    });

    // ==========================================
    // STEP 1: SCRAPE THE ATHLETE PAGE
    // ==========================================
    console.log(`🚀 Step 1: Loading Athlete Page -> ${url}`);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('PB') || text.includes('PR') || text.includes('SR');
    }, { timeout: 15000 }).catch(() => console.log("Timeout waiting for PR tags. Proceeding anyway."));

    let extractedData = await page.evaluate((eventsList) => {
      
      // 🚨 CRITICAL FIX: Delete ghost data (Feeds, Logs, Blurred elements)
      const trashSelectors = ['.feed', '.news-feed', '.training-log', '[class*="training"]', '.blurred', '[style*="filter: blur"]', '[style*="filter:blur"]'];
      document.querySelectorAll(trashSelectors.join(', ')).forEach(el => el.remove());

      const h1 = document.querySelector('h1') as HTMLElement;
      let fullName = h1?.innerText || document.title.split('-')[0].trim();
      const firstName = fullName.split(' ')[0] || 'Unknown';
      const lastName = fullName.split(' ').slice(1).join(' ') || '';

      // ==========================================
      // 🕵️ TEAM HUNTER: PRIORITIZE HIGH SCHOOLS
      // ==========================================
      let teamUrl = null;
      let schoolName = 'Unattached / High School';
      let isClub = false;
      
      const teamLinks = Array.from(document.querySelectorAll('h2 a, .profile-heading a, .team-name a, a[href*="/School.aspx"], a[href*="/team/"]'));
      
      let targetLink = teamLinks.find(a => {
          const text = (a as HTMLElement).innerText.toLowerCase();
          return (text.includes('hs') || text.includes('high school')) && !text.includes('middle');
      });

      if (!targetLink) {
          targetLink = teamLinks.find(a => !((a as HTMLElement).innerText.toLowerCase().includes('middle')) && !((a as HTMLElement).innerText.toLowerCase().endsWith(' ms')));
      }

      if (targetLink) {
          schoolName = (targetLink as HTMLElement).innerText.trim();
          teamUrl = (targetLink as HTMLAnchorElement).href;
          if(schoolName.toLowerCase().includes('club') || schoolName.toLowerCase().includes('usatf') || schoolName.toLowerCase().includes('aau') || schoolName.toLowerCase().includes('athletics')) {
              isClub = true;
          }
      }

      // ==========================================
      // 🎓 GRAD YEAR MATH
      // ==========================================
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
                          if (year > latestSourceYear) {
                              gradYear = calc;
                              latestSourceYear = year;
                          }
                      }
                  }
              }
          }
      }

      // ==========================================
      // 🏆 TREEWALKER PR PARSER (With Wind Fix!)
      // ==========================================
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      const allNodes: string[] = [];
      let node;
      while ((node = walker.nextNode())) {
        const text = node.nodeValue?.trim();
        if (text) allNodes.push(text);
      }

      const prs: { event: string; mark: string; date: string; meet: string }[] = [];
      let currentEvent: string | null = null;
      let isHighSchool: boolean = true; 

      for (let i = 0; i < allNodes.length; i++) {
        const text = allNodes[i];
        const lowerText = text.toLowerCase();

        if (lowerText.includes('7th grade') || lowerText.includes('8th grade') || lowerText.includes('middle school') || lowerText.endsWith(' ms')) isHighSchool = false;
        else if (lowerText.includes('9th grade') || lowerText.includes('10th grade') || lowerText.includes('11th grade') || lowerText.includes('12th grade') || lowerText.includes('varsity') || lowerText.includes('high school') || lowerText.endsWith(' hs') || lowerText.includes('club')) isHighSchool = true;

        let matchedEvent = eventsList.find(e => text === e || text.startsWith(e) || text.replace(/meters?/i, 'meter').toLowerCase() === e.toLowerCase().replace(/meters?/i, 'meter'));
        if (matchedEvent && text.length < 35) { currentEvent = matchedEvent; continue; }

        if (isHighSchool && currentEvent && (text === 'PB' || text === 'PR' || text === 'SR')) {
          
          let possibleWind = allNodes[i - 1];
          let possibleMark = allNodes[i - 2];
          let mark = possibleWind;

          // 🌬️ WIND DETECTOR: Checks if the node right before the PB looks like a wind reading (e.g. (2.2), -1.4, NWI)
          let cleanWind = possibleWind.replace(/[()c*]/g, '').trim();
          const isWind = /^[+-]?\d{1,2}\.\d$/.test(cleanWind) || cleanWind === 'NWI';
          
          if (isWind && possibleMark && /\d/.test(possibleMark)) {
              mark = possibleMark;
          }

          let date = allNodes[i + 1] || 'Unknown Date';
          let meet = allNodes[i + 2] || 'Unknown Meet';

          if (mark && /\d/.test(mark) && !mark.includes('mi.') && mark.length < 15) {
            if (!prs.find(pr => pr.event === currentEvent)) prs.push({ event: currentEvent, mark, date, meet });
          }
        }
      }

      // ==========================================
      // 🎨 THE GENIUS AVATAR COLOR GENDER DETECTOR
      // ==========================================
      let gender = 'Boys'; 

      // 1. Unbeatable Event Check
      const eventsText = prs.map(p => p.event.toLowerCase()).join(' ');
      if (eventsText.includes('100m hurdles') || eventsText.includes('heptathlon')) {
          gender = 'Girls';
      } else if (eventsText.includes('110m hurdles') || eventsText.includes('decathlon')) {
          gender = 'Boys';
      } else {
          // 2. The Visual Avatar Scanner
          if (h1) {
              // Grab the container that holds the H1 (where the avatar sits)
              const headerBlock = h1.parentElement?.parentElement?.parentElement || document.body;
              const elements = Array.from(headerBlock.querySelectorAll('*'));
              
              for (let el of elements) {
                  const style = window.getComputedStyle(el);
                  const bg = style.backgroundColor; // e.g. "rgb(255, 182, 193)"
                  
                  const rgbMatch = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                  if (rgbMatch) {
                      const r = parseInt(rgbMatch[1]);
                      const g = parseInt(rgbMatch[2]);
                      const b = parseInt(rgbMatch[3]);
                      
                      // Identify Pink/Red (Girls Default Avatar)
                      // Red is extremely high (> 200), and noticeably higher than Blue and Green.
                      if (r > 200 && r > b + 20 && r > g + 20) {
                          gender = 'Girls';
                          break;
                      }
                      // Identify Blue (Boys Default Avatar)
                      if (b > 200 && b > r + 20 && b > g + 20) {
                          gender = 'Boys';
                          break;
                      }
                  }
                  
                  // Failsafe: Check inline style strings just in case
                  const inline = el.getAttribute('style') || '';
                  if (inline.toLowerCase().includes('pink') || inline.toLowerCase().includes('#ff')) {
                      gender = 'Girls';
                      break;
                  }
              }
          }
          
          // 3. The Hidden Script JSON Payload Check
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
    }, TRACK_EVENTS);

    // ==========================================
    // STEP 2: SCRAPE THE TEAM PAGE (STATE/SIZE/CONF)
    // ==========================================
    let state = null;
    let schoolSize = null;
    let conference = null;

    if (extractedData.teamUrl) {
      try {
        console.log(`🎯 Step 2: Navigating to Current Team -> ${extractedData.teamUrl}`);
        
        let targetUrl = extractedData.teamUrl;
        if (targetUrl.startsWith('/')) targetUrl = 'https://www.athletic.net' + targetUrl;

        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        const teamDetails = await page.evaluate((isClub) => {
          let st = null;
          let sz = null;
          let conf = null;

          const statesArray = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];
          
          const allLinks = Array.from(document.querySelectorAll('a'));
          const usLinkIndex = allLinks.findIndex(a => {
            const t = a.textContent?.trim().toLowerCase();
            return t === 'united states' || t === 'us';
          });

          if (usLinkIndex !== -1) {
            let offset = 1;
            
            const nextLevel = allLinks[usLinkIndex + offset]?.textContent?.trim().toLowerCase();
            if (nextLevel === 'high school' || nextLevel === 'middle school' || nextLevel === 'college' || nextLevel === 'clubs' || nextLevel === 'club') {
                offset++; 
            }

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
                    if (next2 && !next2.toLowerCase().includes('high school') && !next2.toLowerCase().endsWith(' hs')) {
                        conf = next2;
                    }
                } else if (next1 && !next1.toLowerCase().includes('high school') && !next1.toLowerCase().endsWith(' hs')) {
                    conf = next1;
                }
            }
          }

          return { state: st, schoolSize: sz, conference: conf };
        }, extractedData.isClub);

        console.log(`✅ Result: State [${teamDetails.state}], Size [${teamDetails.schoolSize}], Conf [${teamDetails.conference}]`);
        
        state = teamDetails.state;
        schoolSize = teamDetails.schoolSize;
        conference = teamDetails.conference;

      } catch (teamPageErr) {
        console.log("⚠️ Could not load the team page to get location details.");
      }
    }

    await browser.close();

    console.log(`📦 Final Payload PR Count: ${extractedData.prs.length}`);

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
    console.error("Scraping Error:", error);
    return NextResponse.json({ error: `Scraper Error: ${error.message}` }, { status: 500 });
  }
}