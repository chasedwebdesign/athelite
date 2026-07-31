/**
 * Pings major search engines to let them know the sitemap has been updated.
 * Call this immediately after a new athlete finishes onboarding or claims a URL.
 */
export async function pingSearchEngines() {
  const sitemapUrl = encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`);
  
  const endpoints = [
    `https://www.google.com/ping?sitemap=${sitemapUrl}`,
    `https://www.bing.com/ping?sitemap=${sitemapUrl}`
  ];

  try {
    // We use Promise.allSettled so if Bing fails, Google still goes through
    await Promise.allSettled(
      endpoints.map(endpoint => fetch(endpoint, { method: 'GET' }))
    );
    console.log('✅ Search engines pinged successfully. Sitemap re-crawl requested.');
  } catch (error) {
    console.error('❌ Failed to ping search engines:', error);
  }
}