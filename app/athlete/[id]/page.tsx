// app/athlete/[id]/page.tsx
import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import AthleteClient from './AthleteClient';

const BASE_SITE_URL = 'https://chasedsports.com';
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const getAbsoluteUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

interface ServerAthleteSport {
  sport_name: string;
  position: string | null;
  level_of_play: string | null;
  athleticism_tier: string | null;
  metrics: { name: string; value: string }[] | null;
}

interface ServerAthleteSeoData {
  id: string;
  first_name: string;
  last_name: string;
  high_school: string;
  state: string;
  grad_year: number;
  gender: string | null;
  trust_level: number;
  avatar_url: string | null;
  custom_slug: string | null;
  sports: string[] | null;
  saved_resume: string | null;
  active_sports: ServerAthleteSport[];
}

async function getAthleteSeoData(idParam: string): Promise<ServerAthleteSeoData | null> {
  const id = decodeURIComponent(idParam).trim();
  const isUUID = UUID_REGEX.test(id);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const column = isUUID ? 'id' : 'custom_slug';
  const athleteUrl = `${supabaseUrl}/rest/v1/athletes?${column}=eq.${encodeURIComponent(id)}&select=id,first_name,last_name,high_school,state,grad_year,gender,trust_level,avatar_url,custom_slug,sports,saved_resume`;

  try {
    const res = await fetch(athleteUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const athlete = data?.[0];
    if (!athlete) return null;

    // Fetch active sports & PR metrics on the server so Googlebot sees full stats in raw HTML
    const sportsUrl = `${supabaseUrl}/rest/v1/athlete_sports?athlete_id=eq.${encodeURIComponent(athlete.id)}&is_active=eq.true&select=sport_name,position,level_of_play,athleticism_tier,metrics`;
    const sportsRes = await fetch(sportsUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 1800 },
    });

    const activeSports: ServerAthleteSport[] = sportsRes.ok ? await sportsRes.json() : [];

    return {
      ...athlete,
      active_sports: activeSports || [],
    };
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const athlete = await getAthleteSeoData(id);

  if (!athlete) {
    return {
      title: 'Athlete Portfolio Not Found | ChasedSports',
      description: 'This athletic portfolio could not be found or has been removed.',
      robots: { index: false, follow: false },
    };
  }

  // 🚨 STRICT INDEXING RULE: Only index verified athletes (trust_level === 1)
  const isVerified = Number(athlete.trust_level) === 1;

  const fullName = `${athlete.first_name} ${athlete.last_name}`.trim();
  const topMetricsSummary = athlete.active_sports
    ?.flatMap((s) => s.metrics || [])
    .slice(0, 4)
    .map((m) => `${m.name}: ${m.value}`)
    .join(', ');

  const title = `${fullName} | ${athlete.high_school} (${athlete.state}) Track & Field Recruiting Profile | ChasedSports`;
  const description = `${fullName} (Class of ${athlete.grad_year || '202X'}) official verified athletic recruiting portfolio from ${athlete.high_school} in ${athlete.state}.${
    topMetricsSummary ? ` Verified PRs & Stats: ${topMetricsSummary}.` : ''
  } View national rankings, recruiting standards, and highlight film on ChasedSports.`;

  const canonicalSlug = athlete.custom_slug ? String(athlete.custom_slug).trim() : athlete.id;
  const canonicalUrl = `${BASE_SITE_URL}/athlete/${encodeURIComponent(canonicalSlug)}`;
  const absoluteAvatarUrl = getAbsoluteUrl(athlete.avatar_url);

  return {
    title,
    description,
    keywords: [
      fullName,
      `${fullName} Track and Field`,
      `${fullName} ${athlete.high_school}`,
      `${fullName} Recruiting Profile`,
      `${fullName} PRs`,
      `${athlete.high_school} Track and Field`,
      `ChasedSports ${fullName}`,
    ],
    robots: {
      index: isVerified,
      follow: isVerified,
      nocache: !isVerified,
      googleBot: {
        index: isVerified,
        follow: isVerified,
        'max-snippet': isVerified ? -1 : 0,
        'max-image-preview': isVerified ? 'large' : 'none',
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'ChasedSports',
      images: absoluteAvatarUrl ? [{ url: absoluteAvatarUrl, width: 800, height: 800, alt: fullName }] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: absoluteAvatarUrl ? [absoluteAvatarUrl] : [],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function AthletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id).trim();
  const isUUID = UUID_REGEX.test(decodedId);

  const athlete = await getAthleteSeoData(decodedId);

  // 🚨 Return a real HTTP 404 when athlete doesn't exist to prevent Google Soft 404 penalties
  if (!athlete) {
    notFound();
  }

  // 🚨 Consolidate duplicate URLs: If accessed via UUID and athlete has a custom_slug, 308 redirect to custom_slug
  if (isUUID && athlete.custom_slug && String(athlete.custom_slug).trim() !== '') {
    permanentRedirect(`/athlete/${encodeURIComponent(String(athlete.custom_slug).trim())}`);
  }

  const fullName = `${athlete.first_name} ${athlete.last_name}`.trim();
  const canonicalSlug = athlete.custom_slug ? String(athlete.custom_slug).trim() : athlete.id;
  const profileUrl = `${BASE_SITE_URL}/athlete/${encodeURIComponent(canonicalSlug)}`;
  const absoluteAvatarUrl = getAbsoluteUrl(athlete.avatar_url) || `${BASE_SITE_URL}/icon.png`;

  const allMetrics = athlete.active_sports?.flatMap((s) => s.metrics || []) || [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: profileUrl,
    mainEntity: {
      '@type': 'Person',
      '@id': `${profileUrl}#athlete`,
      name: fullName,
      givenName: athlete.first_name,
      familyName: athlete.last_name,
      url: profileUrl,
      image: absoluteAvatarUrl,
      jobTitle: 'High School Student-Athlete',
      description: `${fullName} is a Class of ${athlete.grad_year} student-athlete at ${athlete.high_school} in ${athlete.state}.`,
      alumniOf: {
        '@type': 'HighSchool',
        name: athlete.high_school,
        address: {
          '@type': 'PostalAddress',
          addressRegion: athlete.state,
          addressCountry: 'US',
        },
      },
      knowsAbout:
        athlete.active_sports?.length > 0
          ? athlete.active_sports.map((s) => s.sport_name)
          : athlete.sports || ['Track & Field', 'Cross Country', 'Athletics'],
      ...(allMetrics.length > 0 && {
        additionalProperty: allMetrics.map((m) => ({
          '@type': 'PropertyValue',
          name: m.name,
          value: m.value,
        })),
      }),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ===================================================================== */}
      {/* SERVER-RENDERED SEO SNAPSHOT FOR GOOGLEBOT (sr-only so UI is untouched) */}
      {/* Ensures Googlebot indexes full PRs & bio before client JS hydration   */}
      {/* ===================================================================== */}
      <article className="sr-only" aria-label={`${fullName} Recruiting Portfolio Summary`}>
        <h1>
          {fullName} — {athlete.high_school} ({athlete.state}) Class of {athlete.grad_year} Athletic Recruiting Portfolio
        </h1>
        <p>
          Official ChasedSports verified athletic recruiting profile for {fullName}, a Class of {athlete.grad_year}{' '}
          {athlete.gender || ''} student-athlete attending {athlete.high_school} in {athlete.state}.
        </p>
        {athlete.active_sports?.map((sport, idx) => (
          <section key={idx}>
            <h2>
              {fullName} {sport.sport_name} Stats & Personal Records (PRs)
            </h2>
            <p>
              Position / Event Group: {sport.position || 'Athlete'} | Level: {sport.level_of_play || 'Varsity'}
              {sport.athleticism_tier ? ` | Recruiting Tier: ${sport.athleticism_tier}` : ''}
            </p>
            {sport.metrics && sport.metrics.length > 0 && (
              <ul>
                {sport.metrics.map((m, mIdx) => (
                  <li key={mIdx}>
                    {m.name}: {m.value}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>

      {/* Hand off the interactive UI & custom theme rendering to the client component */}
      <AthleteClient />
    </>
  );
}