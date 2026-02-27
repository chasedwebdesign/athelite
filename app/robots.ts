import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.chasedsports.com'; // Replace with your actual domain

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Tell Google NOT to index private user routes
      disallow: ['/dashboard/', '/api/'], 
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}