import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer';

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

    // --- HYBRID BROWSER LAUNCHER ---
    if (process.env.NODE_ENV === 'development') {
      // Local testing: You can change headless to true if you want it to be invisible on your laptop too!
      browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
    } else {
      // Live Production Server: Always invisible (headless: true)
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: null, 
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    }
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Block heavy resources (images, fonts, css) to make the scrape lightning fast
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Wait for the HTML structure to arrive
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Give Athletic.net React framework 2.5 seconds to paint the data onto the tables
    await new Promise(resolve => setTimeout(resolve, 2500)); 

    const extractedData = await page.evaluate((eventsList) => {
      // 1. Extract Identity
      const h1 = document.querySelector('h1') as HTMLElement;
      let fullName = h1?.innerText || document.title.split('-')[0].trim();
      const firstName = fullName.split(' ')[0] || 'Unknown';
      const lastName = fullName.split(' ').slice(1).join(' ') || '';

      const h2 = document.querySelector('h2 a') as HTMLElement;
      const teamName = document.querySelector('.team-name') as HTMLElement;
      let schoolName = h2?.innerText || teamName?.innerText || 'Unattached / High School';

      // 2. The TreeWalker Algorithm
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      const allNodes: string[] = [];
      let node;
      while ((node = walker.nextNode())) {
        const text = node.nodeValue?.trim();
        if (text) allNodes.push(text);
      }

      // 3. The Hunter Parser
      const prs: { event: string; mark: string; date: string; meet: string }[] = [];
      let currentEvent: string | null = null;
      let isHighSchool: boolean = true; 

      for (let i = 0; i < allNodes.length; i++) {
        const text = allNodes[i];
        const lowerText = text.toLowerCase();

        // Grade level logic
        if (lowerText.includes('7th grade') || lowerText.includes('8th grade') || lowerText.includes('6th grade') || lowerText.includes('middle school') || lowerText.endsWith(' ms')) {
          isHighSchool = false;
        } else if (lowerText.includes('9th grade') || lowerText.includes('10th grade') || lowerText.includes('11th grade') || lowerText.includes('12th grade') || lowerText.includes('freshman') || lowerText.includes('sophomore') || lowerText.includes('junior') || lowerText.includes('senior') || lowerText.includes('varsity') || lowerText.includes('high school') || lowerText.endsWith(' hs')) {
          isHighSchool = true;
        }

        // Event match
        const matchedEvent = eventsList.find(e => text === e || text.startsWith(e));
        if (matchedEvent && text.length < 35) {
          currentEvent = matchedEvent;
          continue;
        }

        // Data capture
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
    return NextResponse.json({ error: "Failed to connect to Athletic.net. Please try again." }, { status: 500 });
  }
}