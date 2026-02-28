import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';
import puppeteer from 'puppeteer';

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
    
    // 🔑 MAKE SURE YOUR BROWSERLESS API KEY IS PASTED HERE:
    const BROWSERLESS_API_KEY = "YOUR_API_KEY_HERE";

    if (!url || !url.includes('athletic.net')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    let browser;

    if (process.env.NODE_ENV === 'development') {
      console.log("🖥️ Running Locally");
      browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
    } else {
      console.log("☁️ Connecting to Browserless.io...");
      browser = await puppeteerCore.connect({
        browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}&stealth=true`
      });
    }
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['image', 'media', 'font'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return document.querySelector('.team-name') !== null || text.includes('PB') || text.includes('PR');
    }, { timeout: 15000 }).catch(() => console.log("Timeout waiting for PRs. Proceeding to evaluate."));

    const extractedData = await page.evaluate((eventsList) => {
      const h1 = document.querySelector('h1') as HTMLElement;
      let fullName = h1?.innerText || document.title.split('-')[0].trim();
      const firstName = fullName.split(' ')[0] || 'Unknown';
      const lastName = fullName.split(' ').slice(1).join(' ') || '';

      const h2 = document.querySelector('h2 a') as HTMLElement;
      const teamName = document.querySelector('.team-name') as HTMLElement;
      let schoolName = h2?.innerText || teamName?.innerText || 'Unattached / High School';

      // ==========================================
      // 🧬 GENDER DETECTION ALGORITHM
      // ==========================================
      let gender = 'Boys'; // Default fallback
      const allLinks = Array.from(document.querySelectorAll('a'));
      for (const link of allLinks) {
        const linkText = link.innerText.toLowerCase();
        if (linkText === 'womens' || linkText === 'girls' || linkText.includes('womens track') || linkText.includes('girls track')) {
          gender = 'Girls';
          break;
        }
        if (linkText === 'mens' || linkText === 'boys' || linkText.includes('mens track') || linkText.includes('boys track')) {
          gender = 'Boys';
          break;
        }
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

        if (lowerText.includes('7th grade') || lowerText.includes('8th grade') || lowerText.includes('6th grade') || lowerText.includes('middle school') || lowerText.endsWith(' ms')) {
          isHighSchool = false;
        } else if (lowerText.includes('9th grade') || lowerText.includes('10th grade') || lowerText.includes('11th grade') || lowerText.includes('12th grade') || lowerText.includes('freshman') || lowerText.includes('sophomore') || lowerText.includes('junior') || lowerText.includes('senior') || lowerText.includes('varsity') || lowerText.includes('high school') || lowerText.endsWith(' hs')) {
          isHighSchool = true;
        }

        const matchedEvent = eventsList.find(e => text === e || text.startsWith(e));
        if (matchedEvent && text.length < 35) {
          currentEvent = matchedEvent;
          continue;
        }

        if (isHighSchool && currentEvent && (text === 'PB' || text === 'PR' || text === 'SR')) {
          let mark = allNodes[i - 1];
          let date = allNodes[i + 1] || 'Unknown Date';
          let meet = allNodes[i + 2] || 'Unknown Meet';

          if (mark && /\d/.test(mark)) {
            if (!prs.find(pr => pr.event === currentEvent)) {
              prs.push({ event: currentEvent, mark, date, meet });
            }
          }
        }
      }

      // Pass gender back to the dashboard!
      return { firstName, lastName, schoolName, prs, gender };
    }, TRACK_EVENTS);

    await browser.close();

    return NextResponse.json({ 
      success: true, 
      data: {
        firstName: extractedData.firstName,
        lastName: extractedData.lastName,
        schoolName: extractedData.schoolName,
        prs: extractedData.prs,
        gender: extractedData.gender,
        url
      } 
    });

  } catch (error: any) {
    console.error("Scraping Error:", error);
    return NextResponse.json({ error: `Scraper Error: ${error.message}` }, { status: 500 });
  }
}