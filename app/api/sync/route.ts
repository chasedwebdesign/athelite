import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer';

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

    if (!url || !url.includes('athletic.net')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    let browser;

    if (process.env.NODE_ENV === 'development') {
      browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
    } else {
      const chromiumPack = 'https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar';
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: null, 
        executablePath: await chromium.executablePath(chromiumPack),
        headless: true,
      });
    }
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Block heavy resources so the slow Vercel server can focus purely on the text
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // 1. Go to the URL
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
    
    // =================================================================
    // ⚡ THE SMART WAIT: Wait specifically for the React Data to paint!
    // =================================================================
    await page.waitForFunction(() => {
      // Look for the school name link OR the letters "PR" to exist on screen
      return document.querySelector('h2 a') !== null || document.body.innerText.includes('PR');
    }, { timeout: 4500 }).catch(() => console.log("Smart wait timed out. Proceeding with what we have."));

    // 3. Extract the Data
    const extractedData = await page.evaluate((eventsList) => {
      const h1 = document.querySelector('h1') as HTMLElement;
      let fullName = h1?.innerText || document.title.split('-')[0].trim();
      const firstName = fullName.split(' ')[0] || 'Unknown';
      const lastName = fullName.split(' ').slice(1).join(' ') || '';

      const h2 = document.querySelector('h2 a') as HTMLElement;
      const teamName = document.querySelector('.team-name') as HTMLElement;
      let schoolName = h2?.innerText || teamName?.innerText || 'Unattached / High School';

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

      return { firstName, lastName, schoolName, prs };
    }, TRACK_EVENTS);

    await browser.close();

    return NextResponse.json({ 
      success: true, 
      data: {
        firstName: extractedData.firstName,
        lastName: extractedData.lastName,
        schoolName: extractedData.schoolName,
        prs: extractedData.prs,
        url
      } 
    });

  } catch (error: any) {
    console.error("Scraping Error:", error);
    return NextResponse.json({ error: `System Error: ${error.message}` }, { status: 500 });
  }
}