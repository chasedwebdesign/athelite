// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/client';

// Cache the sitemap for 24 hours on Vercel's Edge Network
export const revalidate = 86400;

// Built from an array so chat clipboards and env vars can never inject [url](url)
const baseUrl = ['https:', '', 'chasedsports.com'].join('/');

const SPORTS_SLUGS = [
  'baseball',
  'basketball',
  'bowling',
  'cross-country',
  'fencing',
  'field-hockey',
  'football',
  'golf',
  'gymnastics',
  'ice-hockey',
  'lacrosse',
  'soccer',
  'softball',
  'swimming-and-diving',
  'tennis',
  'track-and-field',
  'volleyball',
  'water-polo',
  'wrestling',
];

const DIVISION_SLUGS = ['ncaa-d1', 'ncaa-d2', 'ncaa-d3', 'naia', 'juco'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const now = new Date();

  // 1. Public Static Routes (High-value crawlable landing pages)
  const staticPaths = [
    { route: '', priority: 1.0, freq: 'daily' as const },
    { route: '/search', priority: 0.95, freq: 'daily' as const },
    { route: '/leaderboard', priority: 0.9, freq: 'daily' as const },
    { route: '/division-checker', priority: 0.85, freq: 'weekly' as const },
    { route: '/compete', priority: 0.8, freq: 'daily' as const },
    { route: '/feed', priority: 0.8, freq: 'daily' as const },
    { route: '/feed/discussions', priority: 0.75, freq: 'daily' as const },
    { route: '/feed/network', priority: 0.75, freq: 'daily' as const },
    { route: '/shop', priority: 0.7, freq: 'weekly' as const },
    { route: '/pro', priority: 0.7, freq: 'monthly' as const },
    { route: '/coach-pro', priority: 0.7, freq: 'monthly' as const },
    { route: '/login', priority: 0.5, freq: 'monthly' as const },
    { route: '/signup', priority: 0.6, freq: 'monthly' as const },
    { route: '/privacy', priority: 0.3, freq: 'yearly' as const },
    { route: '/terms', priority: 0.3, freq: 'yearly' as const },
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map(({ route, priority, freq }) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
  }));

  // 2. Programmatic Rankings Routes (/rankings/[sport]/[division])
  const rankingRoutes: MetadataRoute.Sitemap = SPORTS_SLUGS.flatMap((sport) =>
    DIVISION_SLUGS.map((division) => ({
      url: `${baseUrl}/rankings/${sport}/${division}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))
  );

  try {
    // 3. Fetch ALL Universities (Bypassing PostgREST 1,000-row limit)
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
    ];

    const uniqueSlugs = Array.from(
      new Set(
        allUniversities
          .map((uni: { slug: string | null }) => (uni.slug ? String(uni.slug).trim() : ''))
          .filter(Boolean)
      )
    );

    const collegeRoutes: MetadataRoute.Sitemap = uniqueSlugs.map((slug) => ({
      url: `${baseUrl}/college/${encodeURIComponent(slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // 4. Fetch ONLY Verified Athletes (trust_level === 1)
    const { data: athletes, error: athleteError } = await supabase
      .from('athletes')
      .select('id, custom_slug, last_login_date, created_at')
      .eq('trust_level', 1);

    if (athleteError) throw athleteError;

    const athleteRoutes: MetadataRoute.Sitemap = (athletes || []).map((athlete: any) => {
      const modifiedDate = athlete.last_login_date
        ? new Date(athlete.last_login_date)
        : athlete.created_at
          ? new Date(athlete.created_at)
          : now;

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

    return [...staticRoutes, ...rankingRoutes, ...collegeRoutes, ...athleteRoutes];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return [...staticRoutes, ...rankingRoutes];
  }
}