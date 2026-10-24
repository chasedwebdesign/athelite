// app/sitemap.ts
import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Cache the sitemap for 24 hours on Vercel's Edge Network
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Bulletproof sanitization: strips markdown brackets, quotes, and trailing slashes
  const rawEnvUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chasedsports.com';
  const baseUrl = rawEnvUrl
    .replace(/[\[\]()]/g, '')
    .replace(/['"]/g, '')
    .replace('://www.', '://')
    .replace(/\/$/, '');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Public Static Routes (High-value crawlable landing pages)
  const staticPaths = [
    { route: '', priority: 1.0, freq: 'daily' as const },
    { route: '/search', priority: 0.9, freq: 'daily' as const },
    { route: '/leaderboard', priority: 0.9, freq: 'daily' as const },
    { route: '/feed', priority: 0.8, freq: 'daily' as const },
    { route: '/division-checker', priority: 0.8, freq: 'weekly' as const },
    { route: '/compete', priority: 0.8, freq: 'weekly' as const },
    { route: '/shop', priority: 0.7, freq: 'weekly' as const },
    { route: '/pro', priority: 0.7, freq: 'weekly' as const },
    { route: '/coach-pro', priority: 0.7, freq: 'weekly' as const },
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map(({ route, priority, freq }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }));

  try {
    // 2. Fetch ALL Universities (Bypassing PostgREST 1,000-row limit)
    const [u1, u2, u3, u4] = await Promise.all([
      supabase.from('universities').select('slug').not('slug', 'is', null).range(0, 999),
      supabase.from('universities').select('slug').not('slug', 'is', null).range(1000, 1999),
      supabase.from('universities').select('slug').not('slug', 'is', null).range(2000, 2999),
      supabase.from('universities').select('slug').not('slug', 'is', null).range(3000, 3999),
    ]);

    const allUniversities = [
      ...(u1.data || []),
      ...(u2.data || []),
      ...(u3.data || []),
      ...(u4.data || []),
    ].filter((uni) => Boolean(uni.slug && String(uni.slug).trim() !== ''));

    const collegeRoutes: MetadataRoute.Sitemap = allUniversities.map((uni) => ({
      url: `${baseUrl}/college/${encodeURIComponent(String(uni.slug).trim())}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // 3. Fetch ONLY Verified Athletes (trust_level === 1)
    const { data: athletes, error: athleteError } = await supabase
      .from('athletes')
      .select('id, custom_slug, last_login_date, created_at')
      .eq('trust_level', 1);

    if (athleteError) throw athleteError;

    const athleteRoutes: MetadataRoute.Sitemap = (athletes || []).map((athlete) => {
      const modifiedDate = athlete.last_login_date
        ? new Date(athlete.last_login_date)
        : athlete.created_at
          ? new Date(athlete.created_at)
          : new Date();

      const canonicalIdentifier = athlete.custom_slug
        ? String(athlete.custom_slug).trim()
        : String(athlete.id).trim();

      return {
        url: `${baseUrl}/athlete/${encodeURIComponent(canonicalIdentifier)}`,
        lastModified: modifiedDate,
        changeFrequency: 'daily',
        priority: 0.8,
      };
    });

    return [...staticRoutes, ...collegeRoutes, ...athleteRoutes];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return staticRoutes;
  }
}