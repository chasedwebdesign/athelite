// app/search/layout.tsx
import type React from 'react';
import type { Metadata } from 'next';

const BASE_SITE_URL = 'https://chasedsports.com';

export const metadata: Metadata = {
  title: 'College Athletic Recruiting Finder, Scholarships & ROI Calculator | ChasedSports',
  description:
    'Search and compare 2,800+ NCAA D1, D2, D3, NAIA, and JUCO college athletic programs across 19 sports. Filter by recruiting standards, average athletic scholarship aid, net tuition cost, acceptance rate, and 10-year graduate salary ROI.',
  keywords: [
    'college recruiting finder',
    'college athletic scholarships',
    'NCAA recruiting standards',
    'how to get recruited for college sports',
    'college sports ROI calculator',
    'NCAA D1 D2 D3 school finder',
    'NAIA and JUCO athletic scholarships',
    'athletic scholarship calculator',
    'college team operating budgets',
    'college football recruiting',
    'college basketball recruiting',
    'college baseball recruiting',
    'college soccer recruiting',
    'track and field recruiting standards',
    'cross country recruiting standards',
    'college volleyball recruiting',
    'college swimming recruiting',
    'college golf recruiting',
    'college wrestling recruiting',
    'college lacrosse recruiting',
    'college softball recruiting',
    'ChasedSports',
  ],
  alternates: {
    canonical: `${BASE_SITE_URL}/search`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'College Athletic Program Finder & Recruiting Matchmaker | ChasedSports',
    description:
      'Compare NCAA D1, D2, D3, NAIA, and JUCO sports programs side-by-side by athletic caliber, average scholarship aid, net tuition cost, and 10-year salary ROI.',
    url: `${BASE_SITE_URL}/search`,
    siteName: 'ChasedSports',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Athletic Program Finder & ROI Calculator | ChasedSports',
    description:
      'Discover which college programs match your athletic stats, tuition budget, and 10-year salary ROI.',
  },
};

// Server-Rendered JSON-LD so AI Crawlers (GPTBot, PerplexityBot, Google-Extended)
// immediately parse the application schema and recruiting FAQs without waiting for client JS.
const searchLayoutJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'ChasedSports',
          item: BASE_SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'College Athletic Finder & Matchmaker',
          item: `${BASE_SITE_URL}/search`,
        },
      ],
    },
    {
      '@type': 'WebApplication',
      '@id': `${BASE_SITE_URL}/search#app`,
      name: 'ChasedSports College Athletic Finder & ROI Matchmaker',
      url: `${BASE_SITE_URL}/search`,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      description:
        'Interactive college athletic recruiting search engine and ROI calculator for high school athletes. Compare NCAA Division 1, Division 2, Division 3, NAIA, and JUCO programs across all sports by recruiting standards, scholarship aid, tuition cost, and 10-year median alumni salary.',
      featureList: [
        'Personalized Athletic Readiness Meters synced with high school stats and PRs',
        'NCAA D1, D2, D3, NAIA, and JUCO program filtering across 19 sports',
        'Side-by-Side 3-school comparison matrix',
        '10-Year Alumni Salary to Net Tuition ROI Multiplier',
        'Program Operating Expense and Average Athletic Scholarship Aid estimates',
      ],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE_SITE_URL}/search#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does the ChasedSports College Matchmaker calculate athletic fit?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'For stat-based sports like Track & Field, Cross Country, Swimming & Diving, and Golf, ChasedSports converts an athlete’s verified personal records (PRs) into a standardized Recruiting Score (15–99) and compares it directly against each university’s Team Performance Rating to classify schools as Great Fit, Good Fit, Possible Walk-On, or Stretch. For team sports like Football, Basketball, Soccer, Baseball, and Volleyball, it benchmarks program ratings, operating budgets, and average scholarship allocations.',
          },
        },
        {
          '@type': 'Question',
          name: 'How is College Athletic ROI calculated on ChasedSports?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ChasedSports calculates Return on Investment (ROI) by taking the official 10-year post-enrollment median alumni salary and dividing it by the estimated net annual cost (in-state or out-of-state tuition minus average athletic scholarship aid).',
          },
        },
        {
          '@type': 'Question',
          name: 'Which college athletic divisions and sports can I compare?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can filter and compare over 2,800 institutions across NCAA Division 1 (D1), NCAA Division 2 (D2), NCAA Division 3 (D3), NAIA, and Community College (NJCAA / JUCO) across 19 men’s and women’s sports including Football, Basketball, Baseball, Soccer, Track & Field, Cross Country, Volleyball, Swimming & Diving, Softball, Wrestling, Lacrosse, Golf, Tennis, Ice Hockey, Gymnastics, Water Polo, Field Hockey, Fencing, and Bowling.',
          },
        },
      ],
    },
  ],
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(searchLayoutJsonLd) }}
      />
      {children}
    </>
  );
}