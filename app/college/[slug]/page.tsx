// app/college/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  MapPin,
  Trophy,
  Users,
  Globe,
  Zap,
  Award,
  Gem,
  Shield,
  BarChart3,
  TrendingUp,
  Landmark,
  Sparkles,
  Activity,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Mail,
  Filter,
  ArrowUpRight,
  Send,
  Target,
  DollarSign,
  GraduationCap,
  Timer,
  Map,
  Waves,
  Flag,
  Swords,
  Flame,
  ShieldCheck,
  Dumbbell,
} from 'lucide-react';
import GuestRecruitingCTA from './GuestRecruitingCTA';

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface CollegeSafetyNetData {
  id: string | number;
  state: string;
  median_earnings: number | null;
  tuition_in_state: number | null;
  acceptance_rate: string | number | null;
}

// ==========================================
// ROUTE CONFIGURATION
// ==========================================
export const revalidate = 86400; // Cache for 24 hours on the Edge
export const dynamicParams = true;

const BASE_SITE_URL = 'https://chasedsports.com';
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const CORE_RECRUITING_SPORTS = [
  'Football',
  'Basketball',
  'Baseball',
  'Soccer',
  'Track & Field',
  'Cross Country',
  'Volleyball',
  'Softball',
  'Swimming & Diving',
  'Golf',
  'Wrestling',
  'Lacrosse',
  'Tennis',
  'Ice Hockey',
  'Gymnastics',
  'Water Polo',
  'Field Hockey',
  'Fencing',
  'Bowling',
];

// ==========================================
// DYNAMIC 19-SPORT PHOTO & THEME MAPPINGS (Synced with LandingClient.tsx)
// ==========================================
const SPORT_THEMES: Record<
  string,
  { image: string; colorClass: string; ringClass: string; bgClass: string }
> = {
  'Track & Field': {
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop',
    colorClass: 'text-blue-400',
    ringClass: 'ring-blue-500',
    bgClass: 'bg-blue-500/20',
  },
  'Cross Country': {
    image: 'https://images.unsplash.com/photo-1502224562085-639556652f33?q=80&w=800&auto=format&fit=crop',
    colorClass: 'text-green-400',
    ringClass: 'ring-green-500',
    bgClass: 'bg-green-500/20',
  },
  'Swimming & Diving': {
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop',
    colorClass: 'text-cyan-400',
    ringClass: 'ring-cyan-500',
    bgClass: 'bg-cyan-500/20',
  },
  Golf: {
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800&auto=format&fit=crop',
    colorClass: 'text-lime-400',
    ringClass: 'ring-lime-500',
    bgClass: 'bg-lime-500/20',
  },
  Basketball: {
    image: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=800&auto=format&fit=crop',
    colorClass: 'text-orange-400',
    ringClass: 'ring-orange-500',
    bgClass: 'bg-orange-500/20',
  },
  Soccer: {
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800&auto=format&fit=crop',
    colorClass: 'text-blue-400',
    ringClass: 'ring-blue-500',
    bgClass: 'bg-blue-500/20',
  },
  Football: {
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?q=80&w=800&auto=format&fit=crop',
    colorClass: 'text-rose-400',
    ringClass: 'ring-rose-500',
    bgClass: 'bg-rose-500/20',
  },
  Lacrosse: {
    image: 'https://images.unsplash.com/photo-1735847493430-244a0a9610d1?q=80&w=800&auto=format&fit=crop',
    colorClass: 'text-fuchsia-400',
    ringClass: 'ring-fuchsia-500',
    bgClass: 'bg-fuchsia-500/20',
  },
  Baseball: {
    image: 'https://images.unsplash.com/photo-1529768167801-9173d94c2a42?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YmFzZWJhbGx8ZW58MHx8MHx8fDA%3D',
    colorClass: 'text-red-400',
    ringClass: 'ring-red-500',
    bgClass: 'bg-red-500/20',
  },
  Softball: {
    image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=800&auto=format&fit=crop',
    colorClass: 'text-yellow-400',
    ringClass: 'ring-yellow-400',
    bgClass: 'bg-yellow-400/20',
  },
  'Ice Hockey': {
    image: 'https://images.unsplash.com/photo-1547054731-f9974ff86ece?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGljZSUyMGhvY2tleXxlbnwwfHwwfHx8MA%3D%3D',
    colorClass: 'text-sky-400',
    ringClass: 'ring-sky-500',
    bgClass: 'bg-sky-500/20',
  },
  'Water Polo': {
    image: 'https://images.unsplash.com/photo-1675064276064-a6c5f50c4cb7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8d2F0ZXJwb2xvfGVufDB8fDB8fHww',
    colorClass: 'text-cyan-400',
    ringClass: 'ring-cyan-500',
    bgClass: 'bg-cyan-500/20',
  },
  Tennis: {
    image: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8dGVubmlzfGVufDB8fDB8fHww',
    colorClass: 'text-lime-400',
    ringClass: 'ring-lime-500',
    bgClass: 'bg-lime-500/20',
  },
  Volleyball: {
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=800&auto=format&fit=crop',
    colorClass: 'text-orange-400',
    ringClass: 'ring-orange-400',
    bgClass: 'bg-orange-500/20',
  },
  Wrestling: {
    image: 'https://images.unsplash.com/photo-1541337082051-5959dbb57d5d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d3Jlc3RsaW5nfGVufDB8fDB8fHww',
    colorClass: 'text-red-400',
    ringClass: 'ring-red-600',
    bgClass: 'bg-red-500/20',
  },
  Gymnastics: {
    image: 'https://images.unsplash.com/photo-1665214057529-81877a586dda?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fGd5bW5hc3RpY3N8ZW58MHx8MHx8fDA%3D',
    colorClass: 'text-purple-400',
    ringClass: 'ring-purple-500',
    bgClass: 'bg-purple-500/20',
  },
  Bowling: {
    image: 'https://images.unsplash.com/photo-1614713568397-b31b779d0498?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Ym93bGluZ3xlbnwwfHwwfHx8MA%3D%3D',
    colorClass: 'text-indigo-400',
    ringClass: 'ring-indigo-500',
    bgClass: 'bg-indigo-500/20',
  },
  Fencing: {
    image: 'https://images.unsplash.com/photo-1631529819887-5b4340090570?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmVuY2luZ3xlbnwwfHwwfHx8MA%3D%3D',
    colorClass: 'text-slate-300',
    ringClass: 'ring-slate-400',
    bgClass: 'bg-slate-400/20',
  },
  'Field Hockey': {
    image: 'https://images.unsplash.com/photo-1734158661120-a0605f0cee48?q=80&w=800&auto=format&fit=crop',
    colorClass: 'text-emerald-400',
    ringClass: 'ring-emerald-500',
    bgClass: 'bg-emerald-500/20',
  },
};

function getSportTheme(sport: string) {
  const cleaned = cleanSportLabel(sport || '');
  if (SPORT_THEMES[cleaned]) return SPORT_THEMES[cleaned];

  const lower = cleaned.toLowerCase();
  if (lower.includes('track')) return SPORT_THEMES['Track & Field'];
  if (lower.includes('cross country')) return SPORT_THEMES['Cross Country'];
  if (lower.includes('swim') || lower.includes('diving')) return SPORT_THEMES['Swimming & Diving'];
  if (lower.includes('golf')) return SPORT_THEMES['Golf'];
  if (lower.includes('basketball')) return SPORT_THEMES['Basketball'];
  if (lower.includes('soccer')) return SPORT_THEMES['Soccer'];
  if (lower.includes('football')) return SPORT_THEMES['Football'];
  if (lower.includes('lacrosse')) return SPORT_THEMES['Lacrosse'];
  if (lower.includes('baseball')) return SPORT_THEMES['Baseball'];
  if (lower.includes('softball')) return SPORT_THEMES['Softball'];
  if (lower.includes('ice hockey')) return SPORT_THEMES['Ice Hockey'];
  if (lower.includes('water polo')) return SPORT_THEMES['Water Polo'];
  if (lower.includes('tennis')) return SPORT_THEMES['Tennis'];
  if (lower.includes('volleyball')) return SPORT_THEMES['Volleyball'];
  if (lower.includes('wrestling')) return SPORT_THEMES['Wrestling'];
  if (lower.includes('gymnastics')) return SPORT_THEMES['Gymnastics'];
  if (lower.includes('bowling')) return SPORT_THEMES['Bowling'];
  if (lower.includes('fencing')) return SPORT_THEMES['Fencing'];
  if (lower.includes('field hockey')) return SPORT_THEMES['Field Hockey'];

  return SPORT_THEMES['Track & Field'];
}

function getSportIcon(sport: string, className: string) {
  const s = (sport || '').toLowerCase();
  if (s.includes('track')) return <Timer className={className} />;
  if (s.includes('cross country')) return <Map className={className} />;
  if (s.includes('swim') || s.includes('water')) return <Waves className={className} />;
  if (s.includes('golf')) return <Flag className={className} />;
  if (s.includes('fencing') || s.includes('lacrosse')) return <Swords className={className} />;
  if (s.includes('wrestling')) return <Flame className={className} />;
  if (s.includes('football') || s.includes('soccer')) return <ShieldCheck className={className} />;
  if (s.includes('gymnastics')) return <Dumbbell className={className} />;
  return <Trophy className={className} />;
}

// ==========================================
// UTILITY FUNCTIONS (Server-Side Safe)
// ==========================================
function formatCurrency(num: number | null | undefined) {
  if (!num) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

function formatTimeSeconds(totalSeconds: number | null) {
  if (!totalSeconds) return 'N/A';
  const m = Math.floor(totalSeconds / 60);
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function cleanSportLabel(sport: string) {
  return sport
    .replace('Swimming and Diving (combined)', 'Swimming & Diving')
    .replace('Track and Field (Indoor)', 'Track & Field (Indoor)')
    .replace('Track and Field (Outdoor)', 'Track & Field (Outdoor)')
    .replace('Track and Field', 'Track & Field');
}

function getBudgetTier(expense: number | null, sportName: string) {
  if (!expense || expense === 0) return null;

  let t5 = 2500000,
    t4 = 1000000,
    t3 = 400000,
    t2 = 150000;

  if (sportName.includes('Football')) {
    t5 = 15000000;
    t4 = 5000000;
    t3 = 2000000;
    t2 = 500000;
  } else if (sportName.includes('Basketball')) {
    t5 = 5000000;
    t4 = 2000000;
    t3 = 750000;
    t2 = 250000;
  } else if (sportName.includes('Track') || sportName.includes('Cross Country')) {
    t5 = 1500000;
    t4 = 800000;
    t3 = 300000;
    t2 = 100000;
  }

  if (expense >= t5) {
    return {
      level: 5,
      label: 'Tier 5 • Legendary',
      desc: 'Max scholarships & elite facilities',
      bgClass: 'bg-gradient-to-br from-amber-50/90 to-orange-50/90 border-amber-200/80',
      textAccent: 'text-amber-700',
      barColor: 'bg-amber-500',
      glow: 'shadow-[0_10px_30px_rgba(251,191,36,0.12)]',
      Icon: Award,
    };
  }
  if (expense >= t4) {
    return {
      level: 4,
      label: 'Tier 4 • Elite',
      desc: 'Extensive scholarships & top gear',
      bgClass: 'bg-gradient-to-br from-purple-50/90 to-indigo-50/90 border-purple-200/80',
      textAccent: 'text-purple-700',
      barColor: 'bg-purple-500',
      glow: 'shadow-[0_10px_30px_rgba(168,85,247,0.12)]',
      Icon: Gem,
    };
  }
  if (expense >= t3) {
    return {
      level: 3,
      label: 'Tier 3 • Competitive',
      desc: 'Solid athletic aid & travel support',
      bgClass: 'bg-gradient-to-br from-blue-50/90 to-cyan-50/90 border-blue-200/80',
      textAccent: 'text-blue-700',
      barColor: 'bg-blue-500',
      glow: 'shadow-[0_10px_30px_rgba(59,130,246,0.12)]',
      Icon: Zap,
    };
  }
  if (expense >= t2) {
    return {
      level: 2,
      label: 'Tier 2 • Developmental',
      desc: 'Partial athletic aid & standard gear',
      bgClass: 'bg-gradient-to-br from-emerald-50/90 to-green-50/90 border-emerald-200/80',
      textAccent: 'text-emerald-700',
      barColor: 'bg-emerald-500',
      glow: 'shadow-[0_10px_30px_rgba(16,185,129,0.12)]',
      Icon: TrendingUp,
    };
  }

  return {
    level: 1,
    label: 'Tier 1 • Foundational',
    desc: 'Walk-on focused program',
    bgClass: 'bg-gradient-to-br from-slate-50 to-slate-100/90 border-slate-200/80',
    textAccent: 'text-slate-700',
    barColor: 'bg-slate-400',
    glow: 'shadow-xs',
    Icon: Shield,
  };
}

// ==========================================
// SSG & MULTI-SPORT SEO / GEO METADATA GENERATION
// ==========================================
export async function generateStaticParams() {
  const supabase = createClient();
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

  return allUniversities
    .filter((uni: { slug: string | null }) => Boolean(uni.slug && String(uni.slug).trim() !== ''))
    .map((uni: { slug: string }) => ({
      slug: String(uni.slug).trim(),
    }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sport?: string; gender?: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const decodedSlug = decodeURIComponent(resolvedParams.slug).trim();
  const isUUID = UUID_REGEX.test(decodedSlug);
  const supabase = createClient();

  const query = supabase
    .from('universities')
    .select(
      'id, slug, name, city, state, division, tuition_in_state, tuition_out_of_state, acceptance_rate, median_earnings, programs(sport, gender)'
    );

  const { data: university } = await (isUUID
    ? query.eq('id', decodedSlug).maybeSingle()
    : query.eq('slug', decodedSlug).maybeSingle());

  if (!university) {
    return {
      title: 'College Not Found | ChasedSports',
      robots: { index: false, follow: false },
    };
  }

  const canonicalSlug = university.slug || university.id;
  const canonicalUrl = `${BASE_SITE_URL}/college/${canonicalSlug}`;
  const inStateCost = university.tuition_in_state
    ? formatCurrency(university.tuition_in_state)
    : 'Contact Admissions';
  const earningsText = university.median_earnings
    ? formatCurrency(university.median_earnings)
    : 'competitive';
  const accText = university.acceptance_rate || 'selective';
  const locationText = university.city
    ? `${university.city}, ${university.state}`
    : university.state;
  const divisionText = university.division || 'College';

  const offeredSports = Array.from(
    new Set<string>(
      Array.isArray((university as any).programs)
        ? (university as any).programs
            .map((p: any) => (p?.sport ? cleanSportLabel(String(p.sport).trim()) : ''))
            .filter(Boolean)
        : []
    )
  );

  const sportsForKeywords = offeredSports.length > 0 ? offeredSports : CORE_RECRUITING_SPORTS;
  const topSportsPreview = sportsForKeywords.slice(0, 5).join(', ');
  const activeSportFilter = resolvedSearchParams?.sport
    ? cleanSportLabel(resolvedSearchParams.sport)
    : null;

  const title = activeSportFilter
    ? `${university.name} ${activeSportFilter} Recruiting Standards, Scholarships & Tuition (${divisionText}) | ChasedSports`
    : `${university.name} Athletic Recruiting Standards, Scholarships, Sports & Tuition (${divisionText}) | ChasedSports`;

  const description = `Official ${university.name} (${locationText}) ${divisionText} athletic recruiting standards, scholarships, walk-on requirements, and team budgets across ${topSportsPreview}. Compare ${inStateCost} in-state tuition, ${accText} acceptance rate, and ${earningsText} 10-year alumni salary ROI on ChasedSports.`;

  const keywords = Array.from(
    new Set([
      `${university.name}`,
      `${university.name} athletics`,
      `${university.name} recruiting`,
      `${university.name} recruiting standards`,
      `${university.name} athletic scholarships`,
      `${university.name} sports scholarships`,
      `how to get recruited to ${university.name}`,
      `${university.name} walk on requirements`,
      `${university.name} walk on times`,
      `what division is ${university.name}`,
      `${university.name} ${divisionText} athletics`,
      `${university.name} sports programs`,
      `${university.name} athletic budget`,
      `${university.name} coach contact`,
      `${university.name} tuition`,
      `${university.name} in-state tuition`,
      `${university.name} out-of-state tuition`,
      `${university.name} acceptance rate`,
      `${university.name} admissions`,
      `${university.name} alumni salary`,
      `${university.name} ROI`,
      ...sportsForKeywords.flatMap((sport) => [
        `${university.name} ${sport.toLowerCase()}`,
        `${university.name} ${sport.toLowerCase()} recruiting`,
        `${university.name} ${sport.toLowerCase()} scholarships`,
        `${university.name} ${sport.toLowerCase()} recruiting standards`,
      ]),
      'ChasedSports',
    ])
  );

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
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
      title: `${university.name} Athletic Recruiting Standards, Scholarships & ROI | ChasedSports`,
      description,
      url: canonicalUrl,
      siteName: 'ChasedSports',
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${university.name} Recruiting, Scholarships & ROI Profile | ChasedSports`,
      description,
    },
  };
}

// ==========================================
// MAIN SERVER COMPONENT
// ==========================================
export default async function CollegePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sport?: string; gender?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const decodedSlug = decodeURIComponent(resolvedParams.slug).trim();
  const isUUID = UUID_REGEX.test(decodedSlug);

  const supabase = createClient();

  // 1. Fetch Target University
  let collegeData: any = null;

  if (isUUID) {
    const { data: byId } = await supabase
      .from('universities')
      .select('*')
      .eq('id', decodedSlug)
      .maybeSingle();

    if (!byId) {
      notFound();
    }

    if (byId.slug && String(byId.slug).trim() !== '' && String(byId.slug).trim() !== decodedSlug) {
      const queryStr = new URLSearchParams();
      if (resolvedSearchParams.sport) queryStr.set('sport', resolvedSearchParams.sport);
      if (resolvedSearchParams.gender) queryStr.set('gender', resolvedSearchParams.gender);
      const qs = queryStr.toString();
      permanentRedirect(
        `/college/${encodeURIComponent(String(byId.slug).trim())}${qs ? `?${qs}` : ''}`
      );
    }

    collegeData = byId;
  } else {
    const { data: bySlug, error: uniError } = await supabase
      .from('universities')
      .select('*')
      .eq('slug', decodedSlug)
      .maybeSingle();

    if (uniError || !bySlug) {
      notFound();
    }
    collegeData = bySlug;
  }

  const canonicalSlug = collegeData.slug || collegeData.id;
  const canonicalUrl = `${BASE_SITE_URL}/college/${canonicalSlug}`;

  // 2. Fetch Full National Dataset + All University Programs in Parallel
  const [c1, c2, c3, c4, stateRes, allProgramsRes] = await Promise.all([
    supabase
      .from('universities')
      .select('id, state, median_earnings, tuition_in_state, acceptance_rate')
      .range(0, 999),
    supabase
      .from('universities')
      .select('id, state, median_earnings, tuition_in_state, acceptance_rate')
      .range(1000, 1999),
    supabase
      .from('universities')
      .select('id, state, median_earnings, tuition_in_state, acceptance_rate')
      .range(2000, 2999),
    supabase
      .from('universities')
      .select('id, state, median_earnings, tuition_in_state, acceptance_rate')
      .range(3000, 3999),
    supabase
      .from('universities')
      .select('id, state, median_earnings, tuition_in_state, acceptance_rate')
      .ilike('state', collegeData.state),
    supabase
      .from('programs')
      .select(`*, recruiting_standards (*)`)
      .eq('university_id', collegeData.id),
  ]);

  const universitiesList: CollegeSafetyNetData[] = [
    ...(c1.data || []),
    ...(c2.data || []),
    ...(c3.data || []),
    ...(c4.data || []),
  ];

  const stateUniversitiesList: CollegeSafetyNetData[] = stateRes.data || [];
  const allUniversityPrograms: any[] = allProgramsRes.data || [];

  // Safety net: Inject target college into lists if missing
  if (
    !universitiesList.some(
      (u) => String(u.id).trim().toLowerCase() === String(collegeData.id).trim().toLowerCase()
    )
  ) {
    universitiesList.push({
      id: collegeData.id,
      state: collegeData.state,
      median_earnings: collegeData.median_earnings,
      tuition_in_state: collegeData.tuition_in_state,
      acceptance_rate: collegeData.acceptance_rate,
    });
  }
  if (
    !stateUniversitiesList.some(
      (u) => String(u.id).trim().toLowerCase() === String(collegeData.id).trim().toLowerCase()
    )
  ) {
    stateUniversitiesList.push({
      id: collegeData.id,
      state: collegeData.state,
      median_earnings: collegeData.median_earnings,
      tuition_in_state: collegeData.tuition_in_state,
      acceptance_rate: collegeData.acceptance_rate,
    });
  }

  // --- PARSING HELPERS ---
  const matchStr = (
    a: string | number | null | undefined,
    b: string | number | null | undefined
  ) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

  const cleanNum = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === '') return null;
    const num = Number(String(val).replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? null : num;
  };

  const parseRate = (r: string | number | null) => {
    if (!r) return 100;
    const num = parseFloat(String(r).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 100 : num;
  };

  const getRank = (sortedArray: CollegeSafetyNetData[], targetId: string) => {
    const index = sortedArray.findIndex((u) => matchStr(u.id, targetId));
    return index !== -1 ? index + 1 : null;
  };

  // A. Alumni Salary Ranking
  const sortedSalaryNational = [...universitiesList]
    .filter((u) => cleanNum(u.median_earnings) !== null && cleanNum(u.median_earnings)! > 0)
    .sort((a, b) => cleanNum(b.median_earnings)! - cleanNum(a.median_earnings)!);

  const sortedSalaryState = [...stateUniversitiesList]
    .filter((u) => cleanNum(u.median_earnings) !== null && cleanNum(u.median_earnings)! > 0)
    .sort((a, b) => cleanNum(b.median_earnings)! - cleanNum(a.median_earnings)!);

  let salaryRankNational = getRank(sortedSalaryNational, collegeData.id);
  const salaryRankState = getRank(sortedSalaryState, collegeData.id);

  // B. Tuition Cost Ranking
  const sortedTuitionNational = [...universitiesList]
    .filter((u) => cleanNum(u.tuition_in_state) !== null && cleanNum(u.tuition_in_state)! > 0)
    .sort((a, b) => cleanNum(a.tuition_in_state)! - cleanNum(b.tuition_in_state)!);

  const sortedTuitionState = [...stateUniversitiesList]
    .filter((u) => cleanNum(u.tuition_in_state) !== null && cleanNum(u.tuition_in_state)! > 0)
    .sort((a, b) => cleanNum(a.tuition_in_state)! - cleanNum(b.tuition_in_state)!);

  let tuitionRankNational = getRank(sortedTuitionNational, collegeData.id);
  const tuitionRankState = getRank(sortedTuitionState, collegeData.id);

  // C. Acceptance Rate Ranking
  const sortedSelectivityNational = [...universitiesList]
    .filter((u) => u.acceptance_rate != null && u.acceptance_rate !== '')
    .sort((a, b) => parseRate(a.acceptance_rate) - parseRate(b.acceptance_rate));

  const sortedSelectivityState = [...stateUniversitiesList]
    .filter((u) => u.acceptance_rate != null && u.acceptance_rate !== '')
    .sort((a, b) => parseRate(a.acceptance_rate) - parseRate(b.acceptance_rate));

  let selectivityRankNational = getRank(sortedSelectivityNational, collegeData.id);
  const selectivityRankState = getRank(sortedSelectivityState, collegeData.id);

  if (salaryRankNational && salaryRankNational > 2819) salaryRankNational = 2819;
  if (tuitionRankNational && tuitionRankNational > 2819) tuitionRankNational = 2819;
  if (selectivityRankNational && selectivityRankNational > 2819) selectivityRankNational = 2819;

  const renderRankRow = (label: string, rank: number | null, total: number) => (
    <div className="flex justify-between items-center py-2.5 px-3.5 rounded-2xl bg-slate-50 border border-slate-100 gap-2">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className="text-xs font-black text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs shrink-0">
        {rank !== null && total > 0 ? `#${rank.toLocaleString()} / ${total.toLocaleString()}` : 'N/A'}
      </span>
    </div>
  );

  const renderPercentileBar = (
    rank: number | null,
    total: number,
    colorClass: string,
    shadowClass: string
  ) => {
    if (rank === null || total === 0) return null;
    const percentile = Math.max(1, Math.round((rank / total) * 100));
    const fillWidth = Math.max(5, 100 - percentile);

    return (
      <div className="pt-3.5 border-t border-slate-100 mt-4">
        <div className="flex justify-between items-center mb-2 px-0.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Standing
          </span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${colorClass}`}>
            Top {percentile}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass.replace(
              'text-',
              'bg-'
            )} ${shadowClass}`}
            style={{ width: `${fillWidth}%` }}
          />
        </div>
      </div>
    );
  };

  // 3. Filter Programs in JS based on optional URL query params
  const uniqueSportsOffered = Array.from(
    new Set<string>(
      allUniversityPrograms
        .map((p: any) => (p?.sport ? String(p.sport).trim() : ''))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const topThreeQuickSports = uniqueSportsOffered.slice(0, 3);

  const programs = allUniversityPrograms.filter((p: any) => {
    if (
      resolvedSearchParams.sport &&
      String(p.sport || '').toLowerCase() !== resolvedSearchParams.sport.toLowerCase()
    ) {
      return false;
    }
    if (
      resolvedSearchParams.gender &&
      String(p.gender || '').toLowerCase() !== resolvedSearchParams.gender.toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  const isFiltered = !!(resolvedSearchParams.sport || resolvedSearchParams.gender);
  const activeSportLabel = resolvedSearchParams.sport
    ? cleanSportLabel(resolvedSearchParams.sport)
    : null;
  const baseTuition = collegeData.tuition_in_state || collegeData.tuition_out_of_state || 0;
  const locationDisplay = collegeData.city
    ? `${collegeData.city}, ${collegeData.state}`
    : collegeData.state;

  const totalProgramsCount = allUniversityPrograms.length;
  const highestBudgetProgram = allUniversityPrograms.reduce((max: any, p: any) => {
    const b = p.operating_expense || p.budget || 0;
    return b > (max?.operating_expense || max?.budget || 0) ? p : max;
  }, null);

  const roiMultiplier =
    collegeData.median_earnings && baseTuition > 0
      ? (collegeData.median_earnings / baseTuition).toFixed(1)
      : null;

  const sportsSummaryList =
    uniqueSportsOffered.length > 0
      ? uniqueSportsOffered.map(cleanSportLabel).join(', ')
      : 'collegiate varsity sports';

  // Helper to build /dashboard/email-builder URL
  const buildEmailBuilderHref = (opts?: { sport?: string; gender?: string }) => {
    const params = new URLSearchParams();
    params.set('college', collegeData.name);
    params.set('slug', String(canonicalSlug));
    if (collegeData.division) params.set('division', collegeData.division);
    const targetSport = opts?.sport || resolvedSearchParams.sport;
    const targetGender = opts?.gender || resolvedSearchParams.gender;
    if (targetSport) params.set('sport', cleanSportLabel(targetSport));
    if (targetGender) params.set('gender', targetGender);
    return `/dashboard/email-builder?${params.toString()}`;
  };

  const faqItems = [
    {
      question: `What sports does ${collegeData.name} offer?`,
      answer: `${collegeData.name} (${
        collegeData.division || 'Varsity'
      }) sponsors ${totalProgramsCount} programs: ${sportsSummaryList}.${
        highestBudgetProgram
          ? ` Top-funded team: ${highestBudgetProgram.gender} ${cleanSportLabel(
              highestBudgetProgram.sport
            )} (${formatCurrency(
              highestBudgetProgram.operating_expense || highestBudgetProgram.budget
            )}).`
          : ''
      }`,
    },
    {
      question: `How do I get recruited at ${collegeData.name}?`,
      answer: `Compare your marks against ${collegeData.name}'s standards on ChasedSports and use the Email Builder to send your PRs, GPA, and film directly to the coaching staff.`,
    },
    {
      question: `How much is tuition at ${collegeData.name}?`,
      answer: `In-state tuition is ${formatCurrency(collegeData.tuition_in_state)}${
        collegeData.tuition_out_of_state
          ? ` and out-of-state tuition is ${formatCurrency(collegeData.tuition_out_of_state)}`
          : ''
      }.`,
    },
    {
      question: `What is the acceptance rate and alumni salary at ${collegeData.name}?`,
      answer: `Acceptance rate is ${
        collegeData.acceptance_rate || 'N/A'
      }, and 10-year median alumni earnings are ${formatCurrency(collegeData.median_earnings)}.`,
    },
  ];

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'ChasedSports Home',
            item: BASE_SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'College Finder',
            item: `${BASE_SITE_URL}/search`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: collegeData.name,
            item: canonicalUrl,
          },
        ],
      },
      {
        '@type': 'CollegeOrUniversity',
        '@id': `${canonicalUrl}#university`,
        name: collegeData.name,
        url: canonicalUrl,
        description: `${collegeData.name} (${locationDisplay}) ${
          collegeData.division || 'collegiate'
        } athletic recruiting standards, scholarships, team budgets, tuition costs, acceptance rate, and 10-year alumni salary ROI across ${sportsSummaryList}.`,
        ...(collegeData.website && {
          sameAs: [
            collegeData.website.startsWith('http')
              ? collegeData.website
              : `https://${collegeData.website}`,
          ],
        }),
        address: {
          '@type': 'PostalAddress',
          ...(collegeData.city && { addressLocality: collegeData.city }),
          addressRegion: collegeData.state,
          addressCountry: 'US',
        },
        ...(collegeData.student_population && {
          numberOfStudents: parseInt(String(collegeData.student_population), 10) || undefined,
        }),
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonicalUrl}#faq`,
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-32 selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      {/* ========================================================= */}
      {/* HERO SECTION (100% Centered Badges & Action Bar)          */}
      {/* ========================================================= */}
      <header className="relative bg-white pt-8 sm:pt-12 pb-24 sm:pb-28 px-4 sm:px-8 overflow-hidden rounded-b-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border-b border-slate-200">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[350px] sm:h-[400px] bg-blue-400/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-5 w-full">
            <ol className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[11px] sm:text-xs font-bold text-slate-400">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  ChasedSports
                </Link>
              </li>
              <li>
                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              </li>
              <li>
                <Link href="/search" className="hover:text-blue-600 transition-colors">
                  Colleges
                </Link>
              </li>
              {collegeData.state && (
                <>
                  <li>
                    <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                  </li>
                  <li>
                    <Link
                      href={`/search?state=${encodeURIComponent(collegeData.state)}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {collegeData.state}
                    </Link>
                  </li>
                </>
              )}
              <li>
                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              </li>
              <li className="text-slate-700 font-extrabold break-words" aria-current="page">
                {collegeData.name}
              </li>
            </ol>
          </nav>

          {/* Centered Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
            <Link
              href="/search"
              className="inline-flex items-center justify-center text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 transition-all bg-slate-100 hover:bg-blue-50 px-4 py-2.5 rounded-2xl border border-slate-200/80"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>Colleges</span>
            </Link>

            <Link
              href={buildEmailBuilderHref()}
              className="inline-flex items-center justify-center text-xs sm:text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-600/25 hover:-translate-y-0.5"
            >
              <Send className="w-3.5 h-3.5 mr-2 shrink-0" />
              <span>Contact Coach</span>
            </Link>

            {isFiltered && (
              <Link
                href={`/college/${canonicalSlug}`}
                className="inline-flex items-center justify-center text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-all bg-white px-4 py-2.5 rounded-2xl border border-slate-200"
              >
                All {totalProgramsCount} Teams
              </Link>
            )}
          </div>

          {/* Centered Title */}
          <h1 className="flex flex-col items-center justify-center mb-6 max-w-3xl mx-auto">
            <span className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-slate-900 leading-[1.08] break-words">
              {collegeData.name}
            </span>
            <span className="mt-3.5 inline-flex items-center justify-center px-4 py-1.5 rounded-2xl text-[11px] sm:text-xs font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200/80">
              {activeSportLabel ? `${activeSportLabel} Recruiting & ROI` : 'Recruiting, Scholarships & ROI'}
            </span>
          </h1>

          {/* Centered Metadata Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-slate-600 font-semibold text-xs sm:text-sm max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-blue-500 shrink-0" />
              <span>{locationDisplay}</span>
            </div>

            <div className="inline-flex items-center justify-center bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
              <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-500 shrink-0" />
              <span>{collegeData.division || 'Collegiate'}</span>
            </div>

            {collegeData.student_population && (
              <div className="inline-flex items-center justify-center bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
                <Users className="w-3.5 h-3.5 mr-1.5 text-purple-500 shrink-0" />
                <span>{parseInt(collegeData.student_population).toLocaleString()} Students</span>
              </div>
            )}

            {collegeData.website && (
              <a
                href={
                  collegeData.website.startsWith('http')
                    ? collegeData.website
                    : `https://${collegeData.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-2xs"
              >
                <Globe className="w-3.5 h-3.5 mr-1.5 text-cyan-500 shrink-0" />
                <span>Official Website</span>
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-14 relative z-20 space-y-8 sm:space-y-10">
        {/* ========================================================= */}
        {/* 1. SNAPSHOT STATS & SPORT FILTER (Never Cutoff, Centered) */}
        {/* ========================================================= */}
        <section
          aria-label={`${collegeData.name} Quick Stats & Sport Filter`}
          className="bg-white/95 backdrop-blur-xl p-4 sm:p-6 rounded-3xl sm:rounded-[2.25rem] shadow-xl shadow-slate-200/60 border border-slate-200/80"
        >
          {/* 4 Centered, Non-Truncated Stat Boxes */}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/60 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-xl bg-amber-100/80 border border-amber-200 text-amber-600 flex items-center justify-center mb-1.5">
                <Trophy className="w-4 h-4" />
              </div>
              <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Division
              </dt>
              <dd className="text-sm sm:text-base font-black text-slate-900 mt-0.5 break-words">
                {collegeData.division || 'Varsity'}
              </dd>
            </div>

            <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/60 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-xl bg-blue-100/80 border border-blue-200 text-blue-600 flex items-center justify-center mb-1.5">
                <Landmark className="w-4 h-4" />
              </div>
              <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                In-State
              </dt>
              <dd className="text-sm sm:text-base font-black text-slate-900 mt-0.5 break-words">
                {formatCurrency(collegeData.tuition_in_state)}
              </dd>
            </div>

            <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/60 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-xl bg-purple-100/80 border border-purple-200 text-purple-600 flex items-center justify-center mb-1.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Acceptance
              </dt>
              <dd className="text-sm sm:text-base font-black text-slate-900 mt-0.5 break-words">
                {collegeData.acceptance_rate || 'N/A'}
              </dd>
            </div>

            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/70 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-1.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <dt className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                10-Yr Salary
              </dt>
              <dd className="text-sm sm:text-base font-black text-emerald-800 mt-0.5 break-words">
                {formatCurrency(collegeData.median_earnings)}
              </dd>
            </div>
          </dl>

          {/* Sport Filter Dropdown */}
          {uniqueSportsOffered.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <details className="group">
                <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none flex items-center justify-between gap-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/90 group-open:border-blue-300 px-4 py-3 rounded-2xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Filter className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-blue-600">
                        Sport Filter
                      </span>
                      <span className="block text-xs sm:text-sm font-black text-slate-900">
                        {activeSportLabel
                          ? `${activeSportLabel} (${programs.length})`
                          : `All Sports (${totalProgramsCount} Teams)`}
                      </span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 bg-white group-open:bg-blue-600 text-blue-600 group-open:text-white px-3.5 py-2 rounded-xl border border-blue-200 group-open:border-blue-600 text-xs font-black shrink-0 transition-all">
                    <span className="group-open:hidden">Sport</span>
                    <span className="hidden group-open:inline">Close</span>
                    <ChevronDown className="w-4 h-4 transition-transform duration-300 group-open:rotate-180" />
                  </div>
                </summary>

                <nav
                  aria-label={`${collegeData.name} Sports Filter`}
                  className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2"
                >
                  <Link
                    href={`/college/${canonicalSlug}`}
                    className={`flex items-center justify-center text-center text-xs font-black px-3 py-2.5 rounded-xl border transition-all ${
                      !resolvedSearchParams.sport
                        ? 'bg-blue-600 text-white border-blue-600 col-span-2 sm:col-span-1'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-blue-300 col-span-2 sm:col-span-1'
                    }`}
                  >
                    All Sports ({totalProgramsCount})
                  </Link>
                  {uniqueSportsOffered.map((sport) => {
                    const isActive =
                      resolvedSearchParams.sport &&
                      resolvedSearchParams.sport.toLowerCase() === sport.toLowerCase();
                    const sTheme = getSportTheme(sport);
                    return (
                      <Link
                        key={sport}
                        href={`/college/${canonicalSlug}?sport=${encodeURIComponent(sport)}`}
                        className={`flex items-center justify-center gap-1.5 text-center text-xs font-bold px-3 py-2.5 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {getSportIcon(
                          sport,
                          `w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : sTheme.colorClass}`
                        )}
                        <span>{cleanSportLabel(sport)}</span>
                      </Link>
                    );
                  })}
                </nav>
              </details>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 2. ATHLETIC PROGRAMS (With Dynamic Sport Photo Banners!)  */}
        {/* ========================================================= */}
        <section aria-label={`${collegeData.name} Athletic Programs`} className="space-y-6">
          {(!programs || programs.length === 0) && (
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 text-center">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-xl font-black text-slate-900 mb-4">
                No programs match this filter
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={`/college/${canonicalSlug}`}
                  className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors"
                >
                  All {totalProgramsCount} Programs
                </Link>
                <Link
                  href={buildEmailBuilderHref()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Draft Email
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {programs?.map((program: any) => {
              const budget = program.operating_expense || program.budget;
              const tier = getBudgetTier(budget, program.sport || '');
              const sportDisplay = cleanSportLabel(program.sport || '');
              const sportTheme = getSportTheme(program.sport || '');
              const hasStandards =
                Array.isArray(program.recruiting_standards) &&
                program.recruiting_standards.length > 0;

              let estimatedRides = null;
              if (budget && baseTuition > 0) {
                estimatedRides = Math.floor(budget / baseTuition);
              }

              return (
                <article
                  key={program.id}
                  className="group/prog bg-white rounded-[2.25rem] shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden"
                >
                  {/* PROGRAM HEADER WITH DYNAMIC SPORT PHOTO BACKGROUND */}
                  <div className="relative p-6 sm:p-8 text-white overflow-hidden">
                    <Image
                      src={sportTheme.image}
                      alt={`${collegeData.name} ${program.gender} ${sportDisplay}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 896px"
                      className="object-cover object-center absolute inset-0 z-0 transition-transform duration-700 group-hover/prog:scale-105"
                    />
                    {/* Multi-layer Scrim for High-Contrast Readability */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950/90 via-slate-900/75 to-slate-900/55 backdrop-blur-[1px]" />

                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                      <div className="space-y-2 flex flex-col items-center sm:items-start">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-[10px] font-black uppercase tracking-widest ${sportTheme.colorClass}`}
                          >
                            {getSportIcon(program.sport || '', 'w-3.5 h-3.5')}
                            <span>{collegeData.division || 'Varsity'}</span>
                          </span>

                          {program.team_performance_rating && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                              <Target className="w-3 h-3" /> {program.team_performance_rating}
                            </span>
                          )}

                          {program.average_scholarship > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                              <DollarSign className="w-3 h-3" />{' '}
                              {formatCurrency(program.average_scholarship)}
                            </span>
                          )}
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                          {program.gender} {sportDisplay}
                        </h2>
                      </div>

                      <Link
                        href={buildEmailBuilderHref({
                          sport: program.sport,
                          gender: program.gender,
                        })}
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-2xl border border-blue-400/40 shadow-[0_0_25px_rgba(37,99,235,0.45)] transition-all hover:-translate-y-0.5 shrink-0"
                      >
                        <Mail className="w-4 h-4 shrink-0" />
                        <span>Draft Email</span>
                        <ArrowUpRight className="w-4 h-4 shrink-0" />
                      </Link>
                    </div>
                  </div>

                  {/* PROGRAM BODY (Only rendered if budget tier or standards exist) */}
                  {(tier || hasStandards) && (
                    <div className="p-5 sm:p-6 space-y-5">
                      {/* BUDGET TIER BAR */}
                      {tier && (
                        <div
                          className={`rounded-3xl border p-4 sm:p-5 ${tier.bgClass} ${tier.glow}`}
                        >
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                            <div className="space-y-1 flex flex-col items-center sm:items-start">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-widest bg-white/80">
                                <tier.Icon className={`w-3.5 h-3.5 ${tier.textAccent}`} />
                                <span className={tier.textAccent}>{tier.label}</span>
                              </div>
                              <p className="text-xs text-slate-600 font-semibold">{tier.desc}</p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
                              <div className="bg-white/90 border border-white rounded-2xl px-4 py-2.5 text-center shadow-2xs">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  Budget
                                </span>
                                <span
                                  className={`text-lg sm:text-xl font-black tracking-tight ${tier.textAccent}`}
                                >
                                  {formatCurrency(budget)}
                                </span>
                              </div>

                              {estimatedRides !== null && estimatedRides > 0 && (
                                <div className="bg-white/90 border border-white rounded-2xl px-4 py-2.5 text-center shadow-2xs">
                                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Full Rides
                                  </span>
                                  <span className="text-base sm:text-lg font-black text-slate-800">
                                    ~{estimatedRides}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-3.5 flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={`h-2 flex-1 rounded-full ${
                                  i <= tier.level
                                    ? tier.barColor
                                    : 'bg-white/60 border border-black/5'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* RECRUITING STANDARDS GRID */}
                      {hasStandards && (
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3.5">
                            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
                              Recruiting Standards
                            </h3>
                            <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                              {program.recruiting_standards.length} Events
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {program.recruiting_standards.map((standard: any) => (
                              <div
                                key={standard.id}
                                className="p-4 bg-slate-50/90 border border-slate-200/70 rounded-2xl flex flex-col items-center text-center"
                              >
                                <h4 className="font-black text-base text-slate-900 mb-3">
                                  {standard.event}
                                </h4>

                                <div className="grid grid-cols-2 gap-2 w-full">
                                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 flex flex-col items-center justify-center">
                                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">
                                      Recruit
                                    </span>
                                    <span className="font-black text-base text-slate-900">
                                      {formatTimeSeconds(standard.target_time_seconds)}
                                    </span>
                                  </div>

                                  <div className="bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/50 flex flex-col items-center justify-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                      Walk-On
                                    </span>
                                    <span className="font-bold text-base text-slate-600">
                                      {standard.walk_on_time_seconds
                                        ? formatTimeSeconds(standard.walk_on_time_seconds)
                                        : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Collapsible Raw Standards Table */}
                          <details className="mt-4 pt-3 border-t border-slate-100 group">
                            <summary className="list-none [&::-webkit-details-marker]:hidden text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 cursor-pointer flex items-center justify-center gap-1 select-none">
                              <span>Raw Standards Table</span>
                              <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-open:rotate-180" />
                            </summary>
                            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
                              <table className="w-full text-center border-collapse text-xs sm:text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                                  <tr>
                                    <th scope="col" className="py-2.5 px-3">
                                      Event
                                    </th>
                                    <th scope="col" className="py-2.5 px-3">
                                      Recruit
                                    </th>
                                    <th scope="col" className="py-2.5 px-3">
                                      Walk-On
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-700">
                                  {program.recruiting_standards.map((standard: any) => (
                                    <tr key={`table-${standard.id}`}>
                                      <td className="py-2 px-3 font-bold text-slate-900">
                                        {standard.event}
                                      </td>
                                      <td className="py-2 px-3 text-blue-600 font-black">
                                        {formatTimeSeconds(standard.target_time_seconds)}
                                      </td>
                                      <td className="py-2 px-3">
                                        {standard.walk_on_time_seconds
                                          ? formatTimeSeconds(standard.walk_on_time_seconds)
                                          : 'N/A'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. GUEST RECRUITING CTA                                   */}
        {/* ========================================================= */}
        <GuestRecruitingCTA
          collegeName={collegeData.name}
          collegeSlug={String(canonicalSlug)}
          division={collegeData.division}
          activeSport={activeSportLabel}
        />

        {/* ========================================================= */}
        {/* 4. CONCISE FAQS & QUICK LINKS                             */}
        {/* ========================================================= */}
        <section
          aria-label={`FAQs for ${collegeData.name}`}
          className="bg-white p-6 sm:p-8 rounded-[2.25rem] shadow-xl shadow-slate-200/50 border border-slate-200/80"
        >
          <div className="flex flex-col items-center text-center mb-5">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 mb-2">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Quick FAQs
            </h2>
          </div>

          <div className="space-y-2.5">
            {faqItems.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-2xl bg-slate-50 open:bg-white border border-slate-200/80 open:border-indigo-200 transition-all overflow-hidden"
              >
                <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none p-4 flex items-center justify-between gap-3 text-left">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 group-open:text-indigo-600">
                    {faq.question}
                  </h3>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-left">
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>

          {/* 3 Quick-Search Sport Cards with Photo Backgrounds */}
          {topThreeQuickSports.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topThreeQuickSports.map((sport) => {
                  const sTheme = getSportTheme(sport);
                  return (
                    <Link
                      key={`seo-sport-${sport}`}
                      href={`/college/${canonicalSlug}?sport=${encodeURIComponent(sport)}`}
                      className="group relative overflow-hidden flex items-center justify-between gap-2 rounded-2xl p-4 border border-slate-700/80 hover:border-blue-400 transition-all shadow-sm"
                    >
                      <Image
                        src={sTheme.image}
                        alt={cleanSportLabel(sport)}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 z-0 bg-slate-950/70 group-hover:bg-slate-950/55 transition-colors" />
                      <div className="relative z-10 flex items-center gap-2">
                        {getSportIcon(sport, `w-4 h-4 shrink-0 ${sTheme.colorClass}`)}
                        <span className="text-xs sm:text-sm font-black text-white">
                          {cleanSportLabel(sport)}
                        </span>
                      </div>
                      <ArrowUpRight className="relative z-10 w-4 h-4 text-white/80 group-hover:text-white shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 5. ALL RANKINGS AT THE BOTTOM (100% Centered & Aligned)   */}
        {/* ========================================================= */}
        <section
          aria-label={`${collegeData.name} National and State Rankings`}
          className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-[2.25rem] p-5 sm:p-8 shadow-xl shadow-slate-200/50"
        >
          <div className="flex flex-col items-center text-center pb-6 mb-6 border-b border-slate-100">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-black uppercase tracking-widest mb-2">
              <BarChart3 className="w-3.5 h-3.5" /> Rankings & Benchmarks
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {collegeData.name} National & {collegeData.state} Rankings
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. ANNUAL TUITION RANKING CARD (Centered) */}
            <article className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 flex flex-col justify-between text-center shadow-xs">
              <div>
                <div className="flex flex-col items-center justify-center mb-4">
                  <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-2xl mb-2">
                    <Landmark className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200/80">
                    Annual Tuition
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      In-State
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {formatCurrency(collegeData.tuition_in_state)}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Out-of-State
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {formatCurrency(collegeData.tuition_out_of_state)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {renderRankRow('National Rank', tuitionRankNational, 2819)}
                {renderRankRow(
                  `${collegeData.state} Rank`,
                  tuitionRankState,
                  sortedTuitionState.length
                )}
                {renderPercentileBar(
                  tuitionRankNational,
                  2819,
                  'text-blue-500',
                  'shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                )}
              </div>
            </article>

            {/* 2. ADMISSIONS SELECTIVITY RANKING CARD (Centered) */}
            <article className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 flex flex-col justify-between text-center shadow-xs">
              <div>
                <div className="flex flex-col items-center justify-center mb-4">
                  <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-2xl mb-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200/80">
                    Admissions
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Acceptance
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {collegeData.acceptance_rate || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Students
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {collegeData.student_population
                        ? parseInt(collegeData.student_population).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {renderRankRow('National Rank', selectivityRankNational, 2819)}
                {renderRankRow(
                  `${collegeData.state} Rank`,
                  selectivityRankState,
                  sortedSelectivityState.length
                )}
                {renderPercentileBar(
                  selectivityRankNational,
                  2819,
                  'text-purple-500',
                  'shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                )}
              </div>
            </article>

            {/* 3. ALUMNI ROI RANKING CARD (Centered) */}
            <article className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 flex flex-col justify-between text-center shadow-xs">
              <div>
                <div className="flex flex-col items-center justify-center mb-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-2xl mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200/80">
                    Alumni ROI
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-100 flex flex-col items-center justify-center text-center">
                    <span className="block text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">
                      10-Yr Salary
                    </span>
                    <span className="text-base sm:text-lg font-black text-emerald-800">
                      {formatCurrency(collegeData.median_earnings)}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Multiplier
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {roiMultiplier ? `${roiMultiplier}x` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {renderRankRow('National Rank', salaryRankNational, 2819)}
                {renderRankRow(
                  `${collegeData.state} Rank`,
                  salaryRankState,
                  sortedSalaryState.length
                )}
                {renderPercentileBar(
                  salaryRankNational,
                  2819,
                  'text-emerald-500',
                  'shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                )}
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}