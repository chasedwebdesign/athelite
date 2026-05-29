import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// 🚨 Cache the sitemap for 24 hours on Vercel's Edge Network to save database reads
export const revalidate = 86400; 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.chasedsports.com';

  // We use the standard supabase-js client here since sitemap.ts runs entirely 
  // on the server and just needs public read access.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Static Routes (Merged)
  const staticPaths = [
    { route: '', priority: 1.0, freq: 'daily' as const },
    { route: '/search', priority: 0.9, freq: 'weekly' as const },
    { route: '/feed', priority: 0.9, freq: 'always' as const },
    { route: '/leaderboard', priority: 0.9, freq: 'daily' as const }, 
    { route: '/shop', priority: 0.8, freq: 'weekly' as const },
    { route: '/compete', priority: 0.8, freq: 'weekly' as const },
    { route: '/login', priority: 0.5, freq: 'monthly' as const },
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map(({ route, priority, freq }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority: priority,
  }));

  try {
    // 2. Fetch Universities for the College Finder SEO
    const { data: universities, error: uniError } = await supabase
      .from('universities')
      .select('id');

    if (uniError) throw uniError;

    const collegeRoutes: MetadataRoute.Sitemap = (universities || []).map((uni) => ({
      url: `${baseUrl}/college/${uni.id}`,
      lastModified: new Date(), // Replace with uni.updated_at if added to schema later
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    // 3. Fetch ALL Verified Athletes (trust_level > 0)
    // We intentionally exclude unverified athletes so we don't index unclaimed pages
    const { data: athletes, error: athleteError } = await supabase
      .from('athletes')
      .select('id, last_login_date, created_at')
      .gt('trust_level', 0);

    if (athleteError) throw athleteError;

    const athleteRoutes: MetadataRoute.Sitemap = (athletes || []).map((athlete) => {
      // 🚨 SEO HACK: Use their real last login to tell Google this is a highly active portfolio
      const modifiedDate = athlete.last_login_date 
        ? new Date(athlete.last_login_date) 
        : (athlete.created_at ? new Date(athlete.created_at) : new Date());

      return {
        url: `${baseUrl}/athlete/${athlete.id}`,
        lastModified: modifiedDate, 
        changeFrequency: 'daily', // High frequency because feed posts/PRs update often
        priority: 0.8, // High priority so Google ranks their portfolios quickly
      };
    });

    // Combine and return all routes for Google to crawl
    return [...staticRoutes, ...collegeRoutes, ...athleteRoutes];

  } catch (error) {
    console.error("Error generating dynamic sitemap:", error);
    
    // Fallback: If Supabase fails for any reason, return the static routes 
    // so the build doesn't crash and Google still gets a valid XML file.
    return staticRoutes;
  }
}