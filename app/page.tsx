import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import LandingClient, { FeaturedCollegeItem, FeaturedAthleteItem } from './LandingClient';

// Revalidate server-rendered SEO directory & featured cards every hour
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'ChasedSports | #1 High School Recruiting OS, College Matchmaker & Athletic Portfolios',
  description:
    'The operating system for high school athletes across 19 sports. Calculate your 0-99 Base Recruiting Score, build your official Athletic Portfolio, unlock ChasedSports Pro, and match with 1,500+ NCAA D1, D2, D3, & NAIA colleges.',
  keywords: [
    'high school recruiting calculator',
    'high school athletic portfolio',
    'college track and field recruiting standards',
    'NCAA D1 recruiting standards',
    'college athletic scholarship finder',
    'ChasedSports Pro',
    'ChasedSports',
    'college roster readiness meter',
    'recruiting score calculator',
    'cross country recruiting standards',
    'college sports ROI calculator',
  ],
  alternates: {
    canonical: 'https://chasedsports.com',
  },
  openGraph: {
    title: 'ChasedSports | Find YOUR College & Build Your Official Athletic Portfolio',
    description:
      'Instantly calculate your college recruiting tier (Power 4 D1, Mid-Major, D2, D3, NAIA) across 19 sports, customize your verified Athletic Portfolio, and filter 1,500+ college athletic programs by budget and 10-year ROI.',
    url: 'https://chasedsports.com',
    siteName: 'ChasedSports',
    images: [
      {
        url: 'https://chasedsports.com/icon.png',
        width: 1200,
        height: 630,
        alt: 'ChasedSports - The New Standard in High School Athletic Recruiting',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChasedSports | High School Athlete Recruiting OS & Portfolios',
    description:
      'Calculate your 0-99 Recruit Score across 19 sports, compare against 1,500+ college rosters, and build your official athletic portfolio for free.',
    images: ['https://chasedsports.com/icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const COLLEGE_GRADIENTS = [
  'from-orange-500 to-emerald-600',
  'from-blue-800 to-amber-500',
  'from-red-800 to-red-600',
  'from-green-600 to-yellow-400',
  'from-indigo-600 to-cyan-500',
  'from-purple-700 to-pink-500',
  'from-slate-800 to-amber-500',
  'from-blue-600 to-teal-400',
];

const ATHLETE_GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-purple-600 to-fuchsia-600',
];

const FALLBACK_COLLEGES: FeaturedCollegeItem[] = [
  {
    id: '1',
    name: 'University of Miami',
    location: 'Coral Gables, FL',
    division: 'NCAA D1',
    budget: '$127.9M',
    salary: '$134,500',
    color: 'from-orange-500 to-emerald-600',
    backStats: { recruitScore: 92, acceptanceRate: '19%', gradRate: '83%' },
  },
  {
    id: '2',
    name: 'University of Notre Dame',
    location: 'Notre Dame, IN',
    division: 'NCAA D1',
    budget: '$139.3M',
    salary: '$152,000',
    color: 'from-blue-800 to-amber-500',
    backStats: { recruitScore: 88, acceptanceRate: '13%', gradRate: '97%' },
  },
  {
    id: '3',
    name: 'Stanford University',
    location: 'Stanford, CA',
    division: 'NCAA D1',
    budget: '$142.5M',
    salary: '$175,000',
    color: 'from-red-800 to-red-600',
    backStats: { recruitScore: 96, acceptanceRate: '4%', gradRate: '95%' },
  },
  {
    id: '4',
    name: 'University of Oregon',
    location: 'Eugene, OR',
    division: 'NCAA D1',
    budget: '$135.2M',
    salary: '$128,000',
    color: 'from-green-600 to-yellow-400',
    backStats: { recruitScore: 94, acceptanceRate: '83%', gradRate: '74%' },
  },
  {
    id: '5',
    name: 'Harvey Mudd College',
    location: 'Claremont, CA',
    division: 'NCAA D3',
    budget: '$3.1M',
    salary: '$168,000',
    color: 'from-slate-800 to-amber-500',
    backStats: { recruitScore: 74, acceptanceRate: '13%', gradRate: '93%' },
  },
];

const FALLBACK_ATHLETES: FeaturedAthleteItem[] = [
  {
    id: '1',
    firstName: 'Chase',
    lastName: 'Fulleton',
    highSchool: 'South Albany HS',
    state: 'OR',
    gradYear: 2027,
    gender: 'Boys',
    initials: 'CF',
    color: 'from-blue-600 to-indigo-600',
    equippedCard: 'hype',
    equippedBorder: 'gold',
    isVerified: true,
    isPro: true,
    sportName: 'Cross Country',
    levelOfPlay: 'Varsity',
    fitScore: 88,
    gpa: '4.0',
    metrics: [{ name: '5,000 Meters', value: '16:36' }],
  },
];

function formatCurrencyCompact(val: number | null | undefined, fallback: string): string {
  if (!val || isNaN(Number(val)) || Number(val) <= 0) return fallback;
  const num = Number(val);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${Math.round(num / 1_000)}K`;
  return `$${num.toLocaleString()}`;
}

// Interleave athletes by equipped_card so consecutive cards have visual variety
function diversifyByCardTheme(athletes: FeaturedAthleteItem[]): FeaturedAthleteItem[] {
  const buckets: Record<string, FeaturedAthleteItem[]> = {};
  for (const ath of athletes) {
    const key = ath.equippedCard || 'obsidian';
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(ath);
  }

  const themeKeys = Object.keys(buckets);
  const result: FeaturedAthleteItem[] = [];
  let added = true;

  while (added) {
    added = false;
    for (const key of themeKeys) {
      if (buckets[key].length > 0) {
        result.push(buckets[key].shift()!);
        added = true;
      }
    }
  }
  return result;
}

export default async function HomePage() {
  let initialColleges: FeaturedCollegeItem[] = FALLBACK_COLLEGES;
  let initialAthletes: FeaturedAthleteItem[] = FALLBACK_ATHLETES;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // 1. Pre-fetch real universities & program ratings for SSR crawlability (/college/[id])
      const { data: uniData } = await supabase
        .from('universities')
        .select('id, name, city, state, division, median_earnings, acceptance_rate, programs(operating_expense, team_performance_rating)')
        .not('name', 'is', null)
        .limit(30);

      if (uniData && uniData.length > 0) {
        const mappedColleges: FeaturedCollegeItem[] = uniData
          .map((u: any, idx: number) => {
            const progs = Array.isArray(u.programs) ? u.programs : [];
            const maxExpense = progs.reduce((max: number, p: any) => Math.max(max, Number(p?.operating_expense || 0)), 0);
            const maxRating = progs.reduce((max: number, p: any) => Math.max(max, Number(p?.team_performance_rating || 0)), 0);

            const earningsNum = Number(u.median_earnings || 0);
            const salaryFormatted = earningsNum > 0 ? `$${earningsNum.toLocaleString()}` : '$88,500';

            const accNum = Number(u.acceptance_rate || 0);
            const accFormatted =
              accNum > 0
                ? accNum <= 1
                  ? `${Math.round(accNum * 100)}%`
                  : `${Math.round(accNum)}%`
                : '64%';

            return {
              id: String(u.id),
              name: u.name || 'University Program',
              location: [u.city, u.state].filter(Boolean).join(', ') || 'United States',
              division: u.division || 'NCAA',
              budget: formatCurrencyCompact(maxExpense, '$24.5M'),
              salary: salaryFormatted,
              color: COLLEGE_GRADIENTS[idx % COLLEGE_GRADIENTS.length],
              backStats: {
                recruitScore: maxRating > 0 ? Math.min(99, Math.round(maxRating)) : 84,
                acceptanceRate: accFormatted,
              },
            };
          })
          .slice(0, 12);

        if (mappedColleges.length > 0) {
          initialColleges = mappedColleges;
        }
      }

      // 2. Pre-fetch athletes using .select('*') so missing column names never cause a fallback
      const { data: athData } = await supabase
        .from('athletes')
        .select('*')
        .not('first_name', 'is', null)
        .limit(50);

      if (athData && athData.length > 0) {
        // Only keep athletes who have equipped a background card (or equipped border)
        const equippedAthletes = athData.filter((a: any) => {
          const card = String(a.equipped_card || '').trim().toLowerCase();
          return card !== '' && card !== 'base' && card !== 'default' && card !== 'none';
        });

        if (equippedAthletes.length > 0) {
          const athleteIds = equippedAthletes.map((a: any) => a.id);

          // Strictly fetch ONLY active sports (is_active = true)
          const { data: sportsData } = await supabase
            .from('athlete_sports')
            .select('*')
            .in('athlete_id', athleteIds)
            .eq('is_active', true);

          const activeSportsByAthlete: Record<string, any[]> = {};
          if (sportsData && Array.isArray(sportsData)) {
            for (const s of sportsData) {
              if (s.is_active !== true) continue;
              if (!activeSportsByAthlete[s.athlete_id]) {
                activeSportsByAthlete[s.athlete_id] = [];
              }
              activeSportsByAthlete[s.athlete_id].push(s);
            }
          }

          const mappedAthletes: FeaturedAthleteItem[] = equippedAthletes
            .map((a: any, idx: number) => {
              const fName = a.first_name || 'Verified';
              const lName = a.last_name || 'Athlete';

              // Filter out any sport that was disabled in the athlete's `sports` array
              const enabledSportNames: string[] | null =
                Array.isArray(a.sports) && a.sports.length > 0 ? a.sports : null;

              const validSports = (activeSportsByAthlete[a.id] || []).filter((sp: any) => {
                if (sp.is_active !== true) return false;
                if (enabledSportNames && !enabledSportNames.includes(sp.sport_name)) return false;
                return Array.isArray(sp.metrics) && sp.metrics.length > 0;
              });

              // Pick the active sport with the highest custom_fit_score
              validSports.sort((x: any, y: any) => Number(y.custom_fit_score || 0) - Number(x.custom_fit_score || 0));
              const activeSport = validSports[0] || null;

              let parsedGpa: string | null = null;
              if (a.saved_resume) {
                try {
                  const parsed = JSON.parse(a.saved_resume);
                  if (parsed?.gpa) parsedGpa = String(parsed.gpa);
                } catch (e) {}
              }

              const rawMetrics =
                activeSport && Array.isArray(activeSport.metrics)
                  ? activeSport.metrics
                      .filter((m: any) => (m.name || m.event) && (m.value || m.mark))
                      .map((m: any) => ({
                        name: String(m.name || m.event),
                        value: String(m.value || m.mark),
                      }))
                  : [];

              const rawGradYear = Number(a.grad_year);
              const validGradYear = !isNaN(rawGradYear) && rawGradYear >= 2020 && rawGradYear <= 2035 ? rawGradYear : null;

              return {
                id: String(a.id),
                customSlug: a.custom_slug || null,
                firstName: fName,
                lastName: lName,
                highSchool: a.high_school || 'Varsity Athletics',
                state: a.state || 'US',
                gradYear: validGradYear,
                gender: a.gender || 'Boys',
                initials: `${fName[0] || 'C'}${lName[0] || 'S'}`.toUpperCase(),
                color: ATHLETE_GRADIENTS[idx % ATHLETE_GRADIENTS.length],
                avatarUrl: a.avatar_url || null,
                equippedCard: String(a.equipped_card).trim().toLowerCase(),
                equippedBorder: a.equipped_border || null,
                isVerified: Number(a.trust_level) > 0,
                isPro: Boolean(a.is_premium),
                sportName: activeSport?.sport_name || (enabledSportNames && enabledSportNames[0]) || 'Track & Field',
                levelOfPlay: activeSport?.level_of_play || 'Varsity',
                fitScore: Number(activeSport?.custom_fit_score) || 0,
                gpa: parsedGpa,
                metrics: rawMetrics,
              };
            })
            .filter((ath) => ath.metrics && ath.metrics.length > 0);

          if (mappedAthletes.length > 0) {
            initialAthletes = diversifyByCardTheme(mappedAthletes).slice(0, 12);
          }
        }
      }
    } catch (e) {
      // Fail gracefully to fallback arrays if SSR fetch encounters RLS or network issue
    }
  }

  // 🚨 GEO & SEO JSON-LD STRUCTURED DATA GRAPH
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://chasedsports.com/#website',
        url: 'https://chasedsports.com',
        name: 'ChasedSports',
        description:
          'Gamified high school athletic recruiting platform, college matchmaker search engine, and official athlete portfolios across 19 sports.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://chasedsports.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://chasedsports.com/#app',
        name: 'ChasedSports Recruiting & College Matchmaker',
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Web',
        offers: [
          {
            '@type': 'Offer',
            name: 'ChasedSports Free Athletic Portfolio',
            price: '0',
            priceCurrency: 'USD',
            url: 'https://chasedsports.com/login',
          },
          {
            '@type': 'Offer',
            name: 'ChasedSports Pro Membership',
            url: 'https://chasedsports.com/pro',
            description:
              'Unlock permanent HD highlight video portfolio hosting, advanced college matchmaking Readiness Meters, coach outreach email templates, and premium holographic profile themes.',
          },
        ],
        featureList: [
          'Instant 0-99 Base Recruiting Score Calculator across 19 high school sports',
          'Official Public Athletic Portfolios (/athlete/[id]) with customizable holographic themes, borders, and academic resumes',
          'PRO HD Highlight Video hosting pinned directly to athlete recruiting portfolios',
          'College Matchmaker filtering 1,500+ NCAA D1, D2, D3, and NAIA programs by operating budget, tuition, average scholarship, and 10-year median earnings',
          'Team Headquarters with pooled ChasedCash and Boosts',
        ],
      },
      {
        '@type': 'ItemList',
        '@id': 'https://chasedsports.com/#featured-colleges',
        name: 'Featured College Athletic Programs on ChasedSports',
        itemListElement: initialColleges.slice(0, 10).map((col, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: `${col.name} (${col.division})`,
          url: `https://chasedsports.com/college/${col.id}`,
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://chasedsports.com/#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What Track & Field times do I need to get recruited to a Division 1 (D1) college?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'For Power 4 NCAA D1 Track & Field programs (Recruit Score 95+), Boys typically need marks around 10.50s in the 100m, 47.5s in the 400m, 1:52.00 in the 800m, or 3:51.00 in the 1500m (4:10 in the 1600m). Mid-Major D1 programs (Recruit Score 85+) typically recruit Boys around 10.80s (100m), 49.0s (400m), 1:55.00 (800m), and 3:59.00 (1500m). For Girls, Power 4 D1 standards are roughly 11.70s (100m), 54.5s (400m), 2:10.00 (800m), and 4:28.00 (1500m).',
            },
          },
          {
            '@type': 'Question',
            name: 'How does ChasedSports calculate my 0-99 Base Recruiting Score across 19 sports?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'ChasedSports evaluates your personal records (PRs) and position-specific metrics across 19 sports against NCAA D1 (Power 4 & Mid-Major), D2, D3, and NAIA roster standards. A score of 95–99 represents Power 4 D1 priority recruits, 85–94 represents Mid-Major D1 scholarship/roster targets, 75–84 represents Top D2 or D1 Walk-On standards, 65–74 represents NCAA D2/D3 prospects, and 55–64 represents NAIA prospects.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is included in an Official ChasedSports Athletic Portfolio?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Your ChasedSports Athletic Portfolio (/athlete/[id]) is your all-in-one digital recruiting resume. It showcases your sport-specific metrics across any of our 19 supported sports, season accolades, unweighted GPA, custom holographic card themes, animated borders, and pinned PRO HD highlight videos for college coaches.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingClient
        initialColleges={initialColleges}
        initialAthletes={initialAthletes}
      />
    </>
  );
}