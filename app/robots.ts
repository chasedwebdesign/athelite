// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://chasedsports.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/college/', '/athlete/', '/search', '/leaderboard', '/feed', '/compete', '/division-checker'],
        disallow: ['/api/', '/dashboard/', '/onboarding/', '/notifications'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}