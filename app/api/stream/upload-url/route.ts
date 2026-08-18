import { NextResponse } from 'next/server';

export async function POST() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDurationSeconds: 61, // 60s + 1s grace period
          requireSignedURLs: false,
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.errors[0]?.message || 'Failed to generate upload URL');
    }

    // Returns { uploadURL: "...", uid: "..." }
    return NextResponse.json(data.result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}