import { NextResponse } from 'next/server';
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

    if (!url.includes('athletic.net')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    console.log(`\n🚀 [DEBUG] Launching visible browser to scrape: ${url}`);
    
    // We are keeping headless: false so you can watch it load!
    const browser = await puppeteer.launch({ 
      headless: false, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    console.log(`✅ [DEBUG] Page fully loaded. Executing TreeWalker...`);

    const extractedData = await page.evaluate((eventsList) => {
      // 1. Identity (TypeScript safe)
      const h1 = document.querySelector('h1') as HTMLElement;
      let fullName = h1?.innerText || document.title.split('-')[0].trim();
      const firstName = fullName.split(' ')[0] || 'Unknown';
      const lastName = fullName.split(' ').slice(1).join(' ') || '';

      const h2 = document.querySelector('h2 a') as HTMLElement;
      const teamName = document.querySelector('.team-name') as HTMLElement;
      let schoolName = h2?.innerText || teamName?.innerText || 'Unattached / High School';

      // 2. THE TREEWALKER
      // This strips away all HTML and just creates an array of the raw text blocks.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      const allNodes: string[] = [];
      let node;
      while ((node = walker.nextNode())) {
        const text = node.nodeValue?.trim();
        if (text) allNodes.push(text);
      }

      // 3. THE HUNTER ALGORITHM (Grade-Aware & Context-Aware)
      const prs: { event: string; mark: string; date: string; meet: string }[] = [];
      let currentEvent: string | null = null;
      let isHighSchool: boolean = true; // Default to assuming High School

      for (let i = 0; i < allNodes.length; i++) {
        const text = allNodes[i];
        const lowerText = text.toLowerCase();

        // A. Grade Awareness Check
        if (lowerText.includes('7th grade') || lowerText.includes('8th grade') || lowerText.includes('6th grade') || lowerText.includes('middle school') || lowerText.endsWith(' ms')) {
          isHighSchool = false;
        } else if (lowerText.includes('9th grade') || lowerText.includes('10th grade') || lowerText.includes('11th grade') || lowerText.includes('12th grade') || lowerText.includes('freshman') || lowerText.includes('sophomore') || lowerText.includes('junior') || lowerText.includes('senior') || lowerText.includes('varsity') || lowerText.includes('high school') || lowerText.endsWith(' hs')) {
          isHighSchool = true;
        }

        // B. Event Check
        const matchedEvent = eventsList.find(e => text === e || text.startsWith(e));
        if (matchedEvent && text.length < 35) {
          currentEvent = matchedEvent;
          continue;
        }

        // C. Data Extraction Check
        if (isHighSchool && currentEvent && (text === 'PB' || text === 'PR' || text === 'SR')) {
          // Because of how Athletic.net tables are structured, if this node says "PB",
          // The Time is the node right before it.
          // The Date is the node right after it.
          // The Meet is the node after the date.
          let mark = allNodes[i - 1];
          let date = allNodes[i + 1] || 'Unknown Date';
          let meet = allNodes[i + 2] || 'Unknown Meet';

          // Ensure the mark is actually a number, and that we haven't already saved this event
          if (mark && /\d/.test(mark)) {
            if (!prs.find(pr => pr.event === currentEvent)) {
              prs.push({ event: currentEvent, mark, date, meet });
            }
          }
        }
      }

      // Create a snippet for the wiretap just in case it fails
      const startIndex = Math.max(0, allNodes.findIndex(t => t.includes('800 Meters')) - 5);
      const wiretapSnippet = allNodes.slice(startIndex, startIndex + 50);

      return { firstName, lastName, schoolName, prs, wiretap: wiretapSnippet };
    }, TRACK_EVENTS);

    await browser.close();
    console.log(`🔒 [DEBUG] Browser closed.`);

    // PRINT THE WIRETAP TO THE TERMINAL
    console.log("\n================ THE WIRETAP ================\n");
    if (extractedData.prs.length > 0) {
      console.log(`🎉 SUCCESS! Found PRs:`, extractedData.prs);
    } else {
      console.log(`🚨 FAILED TO FIND PRs. Here is the raw text the robot saw near '800 Meters':\n`);
      console.log(extractedData.wiretap);
    }
    console.log("\n=============================================\n");

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}