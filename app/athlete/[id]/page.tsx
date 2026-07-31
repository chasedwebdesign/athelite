import { Metadata } from 'next';
import AthleteClient from './AthleteClient';

// Helper to ensure social images don't break if Supabase returns a relative path
const getAbsoluteUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `https://chasedsports.com${path.startsWith('/') ? path : `/${path}`}`;
};

async function getAthleteSeoData(idParam: string) {
  const id = decodeURIComponent(idParam);
  const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) return null;

  const column = isUUID ? 'id' : 'custom_slug';
  const url = `${supabaseUrl}/rest/v1/athletes?${column}=eq.${id}&select=id,first_name,last_name,high_school,state,grad_year,avatar_url,custom_slug,sports`;

  try {
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      // 30-minute cache: Keeps the site lightning fast but updates PRs/Slugs reasonably quickly
      next: { revalidate: 1800 } 
    });
    const data = await res.json();
    return data?.[0] || null;
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
      robots: { index: false, follow: false }
    };
  }

  const fullName = `${athlete.first_name} ${athlete.last_name}`;
  const title = `${fullName} Athletics | Track & Field Recruiting Profile`;
  const description = `${fullName} Official Athletic Portfolio. High School Track & Field stats, verified PRs, state/national rank, and academic highlights from ${athlete.high_school} in ${athlete.state}. Class of ${athlete.grad_year}.`;
  
  const canonicalSlug = athlete.custom_slug || athlete.id;
  const ogUrl = `https://chasedsports.com/athlete/${canonicalSlug}`;
  const absoluteAvatarUrl = getAbsoluteUrl(athlete.avatar_url);

  return {
    title,
    description,
    keywords: [
      fullName,
      `${fullName} Athletics`,
      `${fullName} Track and Field`,
      `${fullName} Recruiting`,
      `${athlete.high_school} Track`,
      `ChasedSports ${fullName}`,
    ],
    // Explicitly tell Google to index and follow links on this page
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
      },
    },
    openGraph: {
      title,
      description,
      url: ogUrl,
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
      canonical: ogUrl,
    }
  };
}

export default async function AthletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const athlete = await getAthleteSeoData(id);

  const canonicalSlug = athlete?.custom_slug || id;
  const profileUrl = `https://chasedsports.com/athlete/${canonicalSlug}`;
  const absoluteAvatarUrl = getAbsoluteUrl(athlete?.avatar_url) || 'https://chasedsports.com/icon.png';

  const jsonLd = athlete ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': `${athlete.first_name} ${athlete.last_name}`,
    'url': profileUrl,
    'image': absoluteAvatarUrl,
    'jobTitle': 'Student Athlete',
    'description': `${athlete.first_name} ${athlete.last_name}'s official athletic recruitment portfolio on ChasedSports.`,
    'alumniOf': {
      '@type': 'EducationalOrganization',
      'name': athlete.high_school,
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': athlete.state,
      }
    },
    'knowsAbout': athlete.sports || ['Track & Field', 'Athletics'],
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* Hand off the heavy UI rendering to the client component */}
      <AthleteClient />
    </>
  );
}