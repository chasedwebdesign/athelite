import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.chasedsports.com';

  const staticRoutes = [
    '',
    '/search',
    '/feed',
    '/leaderboard',
    '/login'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(), // Static routes updating today is fine
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Pull a real timestamp (assuming you have created_at or updated_at)
  const { data: universities } = await supabase
    .from('universities')
    .select('id'); // Add an updated_at column to your select if you have one!

  const universityRoutes = (universities || []).map((uni) => ({
    url: `${baseUrl}/college/${uni.id}`,
    lastModified: new Date(), // Replace with uni.updated_at when available
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Grab the last_login_date so Google knows exactly who is active
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, last_login_date, created_at')
    .gt('trust_level', 0);

  const athleteRoutes = (athletes || []).map((athlete) => ({
    url: `${baseUrl}/athlete/${athlete.id}`,
    // Use their real last login or creation date, fallback to today if missing
    lastModified: athlete.last_login_date ? new Date(athlete.last_login_date) : (athlete.created_at ? new Date(athlete.created_at) : new Date()),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...universityRoutes, ...athleteRoutes];
}