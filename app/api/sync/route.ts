import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core'; 

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

const TRACK_EVENTS = [
  '60 Meters', '100 Meters', '200 Meters', '400 Meters', '800 Meters', '1500 Meters', '1600 Meters', 
  '1 Mile', '3000 Meters', '3200 Meters', '5000 Meters', '10,000 Meters', '100m Hurdles', '110m Hurdles', '300m Hurdles', 
  '400m Hurdles', 'Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 
  'Triple Jump', 'Heptathlon', 'Decathlon', '5K', '3 Mile', '4x100 Relay', '4x400 Relay'
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
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('PB') || text.includes('PR') || text.includes('SR');
    }, { timeout: 15000 }).catch(() => console.log("Timeout waiting for PR tags. Proceeding anyway."));

    let extractedData = await page.evaluate((eventsList) => {
      const h1 = document.querySelector('h1') as HTMLElement;
      let fullName = h1?.innerText || document.title.split('-')[0].trim();
      const firstName = fullName.split(' ')[0] || 'Unknown';
      const lastName = fullName.split(' ').slice(1).join(' ') || '';

      // ==========================================
      // 🎓 BULLETPROOF GRAD YEAR CALCULATOR
      // ==========================================
      let gradYear = null;
      // Get the visually rendered text of the whole page and split it by line breaks
      const allLines = document.body.innerText.split('\n');
      
      for (let line of allLines) {
          line = line.trim().toLowerCase();
          
          // Look for years like 2024, 2025, 2026
          const yearMatch = line.match(/(202\d|203\d)/);
          
          if (yearMatch) {
              let grade = null;
              if (line.includes('12th') || line.includes('senior')) grade = 12;
              else if (line.includes('11th') || line.includes('junior')) grade = 11;
              else if (line.includes('10th') || line.includes('sophomore')) grade = 10;
              else if (line.includes('9th') || line.includes('freshman')) grade = 9;
              else if (line.includes('8th')) grade = 8;
              else if (line.includes('7th')) grade = 7;

              // If the line has BOTH a year and a grade, calculate and break!
              // (Checking length < 150 just to make sure we didn't grab a massive paragraph)
              if (grade !== null && line.length < 150) {
                  const seasonYear = parseInt(yearMatch[0], 10);
                  gradYear = seasonYear + (12 - grade);
                  break; 
              }
          }
      }

      // ==========================================
      // 🕵️ CURRENT SCHOOL HUNTER 
      // ==========================================
      let teamUrl = null;
      let schoolName = 'Unattached / High School';
      
      const headerLink = document.querySelector('h2 a') || document.querySelector('.profile-heading a') || document.querySelector('.team-name a');
      
      if (headerLink && (headerLink as HTMLAnchorElement).href) {
         teamUrl = (headerLink as HTMLAnchorElement).href;
         schoolName = (headerLink as HTMLElement).innerText.trim();
      } else {
         const allLinksOnPage = Array.from(document.querySelectorAll('a'));
         for (const link of allLinksOnPage) {
           const href = link.href || '';
           const text = link.innerText.trim().toLowerCase();
           if (href.includes('/School.aspx') || href.toLowerCase().includes('/team/')) {
             if (text.includes('middle') || text.endsWith(' ms') || text.includes('junior high') || text.endsWith(' jh')) continue; 
             teamUrl = href;
             schoolName = link.innerText.trim();
             break;
           }
         }
      }

      let gender = 'Boys'; 
      const allLinksForGender = Array.from(document.querySelectorAll('a'));
      for (const link of allLinksForGender) {
        const linkText = link.innerText.toLowerCase();
        if (linkText === 'womens' || linkText === 'girls' || linkText.includes('womens track')) { gender = 'Girls'; break; }
        if (linkText === 'mens' || linkText === 'boys' || linkText.includes('mens track')) { gender = 'Boys'; break; }
      }

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
        else if (lowerText.includes('9th grade') || lowerText.includes('10th grade') || lowerText.includes('11th grade') || lowerText.includes('12th grade') || lowerText.includes('varsity') || lowerText.includes('high school') || lowerText.endsWith(' hs')) isHighSchool = true;

        const matchedEvent = eventsList.find(e => text === e || text.startsWith(e));
        if (matchedEvent && text.length < 35) { currentEvent = matchedEvent; continue; }

        if (isHighSchool && currentEvent && (text === 'PB' || text === 'PR' || text === 'SR')) {
          let mark = allNodes[i - 1];
          let date = allNodes[i + 1] || 'Unknown Date';
          let meet = allNodes[i + 2] || 'Unknown Meet';

          if (mark && /\d/.test(mark)) {
            if (!prs.find(pr => pr.event === currentEvent)) prs.push({ event: currentEvent, mark, date, meet });
          }
        }
      }

      return { firstName, lastName, schoolName, prs, gender, teamUrl, gradYear, state: null as string | null, schoolSize: null as string | null, conference: null as string | null };
    }, TRACK_EVENTS);

    // ==========================================
    // STEP 2: SCRAPE THE TEAM PAGE
    // ==========================================
    if (extractedData.teamUrl) {
      try {
        console.log(`🎯 Step 2: Navigating to Current Team -> ${extractedData.teamUrl}`);
        
        let targetUrl = extractedData.teamUrl;
        if (targetUrl.startsWith('/')) targetUrl = 'https://www.athletic.net' + targetUrl;

        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 15000 });
        
        const teamDetails = await page.evaluate(() => {
          let state = null;
          let schoolSize = null;
          let conference = null;

          const allLinks = Array.from(document.querySelectorAll('a'));
          const usLinkIndex = allLinks.findIndex(a => {
            const t = a.textContent?.trim().toLowerCase();
            return t === 'united states' || t === 'us';
          });

          if (usLinkIndex !== -1) {
            let offset = 1;
            
            const nextLevel = allLinks[usLinkIndex + offset]?.textContent?.trim().toLowerCase();
            if (nextLevel === 'high school' || nextLevel === 'middle school' || nextLevel === 'college') {
                offset++; 
            }

            state = allLinks[usLinkIndex + offset]?.textContent?.trim() || null; 
            
            let next1 = allLinks[usLinkIndex + offset + 1]?.textContent?.trim() || null; 
            let next2 = allLinks[usLinkIndex + offset + 2]?.textContent?.trim() || null; 
            
            const sizeRegex = /^[1-8]A$|Class |Division |Div |Group |Region |Section /i;

            if (next1 && sizeRegex.test(next1)) {
                schoolSize = next1;
                if (next2 && !next2.toLowerCase().includes('high school') && !next2.toLowerCase().endsWith(' hs')) {
                    conference = next2;
                }
            } else if (next1 && !next1.toLowerCase().includes('high school') && !next1.toLowerCase().endsWith(' hs')) {
                conference = next1;
            }
          }

          return { state, schoolSize, conference };
        });

        console.log(`✅ Result: State [${teamDetails.state}], Size [${teamDetails.schoolSize}], Conf [${teamDetails.conference}]`);
        
        extractedData.state = teamDetails.state;
        extractedData.schoolSize = teamDetails.schoolSize;
        extractedData.conference = teamDetails.conference;

      } catch (teamPageErr) {
        console.log("⚠️ Could not load the team page to get location details.");
      }
    } else {
      console.log("⚠️ No team link found on the athlete page.");
    }

    await browser.close();

    console.log(`📦 Final Payload PR Count: ${extractedData.prs.length}, Grad Year: ${extractedData.gradYear}`);

    return NextResponse.json({ 
      success: true, 
      data: {
        firstName: extractedData.firstName,
        lastName: extractedData.lastName,
        schoolName: extractedData.schoolName,
        prs: extractedData.prs,
        gender: extractedData.gender,
        state: extractedData.state,
        schoolSize: extractedData.schoolSize,
        conference: extractedData.conference,
        gradYear: extractedData.gradYear,
        url
      } 
    });

  } catch (error: any) {
    console.error("Scraping Error:", error);
    return NextResponse.json({ error: `Scraper Error: ${error.message}` }, { status: 500 });
  }
}