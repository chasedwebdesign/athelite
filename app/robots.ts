// app/robots.ts
import type { MetadataRoute } from 'next';

const baseUrl = ['https:', '', 'chasedsports.com'].join('/');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/college/',
          '/rankings/',
          '/athlete/',
          '/coach/',
          '/search',
          '/leaderboard',
          '/feed',
          '/compete',
          '/division-checker',
        ],
        disallow: ['/api/', '/dashboard/', '/onboarding/', '/notifications'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}