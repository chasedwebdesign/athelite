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
          '/athlete/',
          '/search',
          '/division-checker',
          '/compete',
          '/feed',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/onboarding/',
          '/notifications',
          '/leaderboard',
          '/rankings/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}