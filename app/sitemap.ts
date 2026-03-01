import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// We use the standard Supabase JS client here because sitemap.ts runs securely on the server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Anonymous key is fine for public data
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.chasedsports.com'; // Replace with your actual domain later!

  // 1. Define your static core pages
  const staticRoutes = [
    '',
    '/search',
    '/feed', // Make sure to include the feed!
    '/leaderboard',
    '/login'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8, // Homepage gets highest priority
  }));

  // 2. Fetch all public universities to dynamically add them to the sitemap
  const { data: universities } = await supabase
    .from('universities')
    .select('id');

  const universityRoutes = (universities || []).map((uni) => ({
    url: `${baseUrl}/college/${uni.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // 3. NEW: Fetch all VERIFIED athletes to dynamically add their profiles to the sitemap
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id')
    .gt('trust_level', 0); // Only index real, verified profiles for better SEO!

  const athleteRoutes = (athletes || []).map((athlete) => ({
    url: `${baseUrl}/athlete/${athlete.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const, // Set to daily since their PRs and Feed posts can update often
    priority: 0.7,
  }));

  // 4. Return them all merged together
  return [...staticRoutes, ...universityRoutes, ...athleteRoutes];
}