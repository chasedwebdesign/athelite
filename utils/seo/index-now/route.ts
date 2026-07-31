import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { slugOrId } = await request.json();
    if (!slugOrId) {
      return NextResponse.json({ error: 'Missing slugOrId' }, { status: 400 });
    }

    const host = 'chasedsports.com';
    const profileUrl = `https://${host}/athlete/${slugOrId}`;
    
    // IndexNow Protocol (Pings Bing, Yandex, Yahoo, Seznam instantly)
    const indexNowApiKey = process.env.INDEXNOW_API_KEY;
    if (indexNowApiKey) {
      await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          key: indexNowApiKey,
          keyLocation: `https://${host}/${indexNowApiKey}.txt`,
          urlList: [profileUrl],
        }),
      }).catch((err) => console.error('IndexNow submission failed:', err));
    }

    return NextResponse.json({ success: true, url: profileUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}