// app/college/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, Trophy, Users, Globe, Zap, Award, Gem, Shield,
  BarChart3, Crown, TrendingUp, Landmark, Sparkles, Activity,
  HelpCircle, CheckCircle2, ChevronRight, Mail
} from 'lucide-react';

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
// UTILITY FUNCTIONS (Server-Side Safe)
// ==========================================
function formatCurrency(num: number | null | undefined) {
  if (!num) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

function formatTimeSeconds(totalSeconds: number | null) {
  if (!totalSeconds) return 'N/A';
  const m = Math.floor(totalSeconds / 60);
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function cleanSportLabel(sport: string) {
  return sport.replace('Swimming and Diving (combined)', 'Swimming & Diving');
}

function getBudgetTier(expense: number | null, sportName: string) {
  if (!expense || expense === 0) return null;
  
  let t5 = 2500000, t4 = 1000000, t3 = 400000, t2 = 150000;

  if (sportName.includes('Football')) {
    t5 = 15000000; t4 = 5000000; t3 = 2000000; t2 = 500000;
  } else if (sportName.includes('Basketball')) {
    t5 = 5000000; t4 = 2000000; t3 = 750000; t2 = 250000;
  } else if (sportName.includes('Track') || sportName.includes('Cross Country')) {
    t5 = 1500000; t4 = 800000; t3 = 300000; t2 = 100000;
  }

  if (expense >= t5) {
    return { 
      level: 5, label: "Tier 5: Legendary", 
      desc: "Blank-check facilities, maxed out scholarships, and elite travel.",
      bgClass: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200",
      textAccent: "text-amber-700", barColor: "bg-amber-500", glow: "shadow-[0_0_40px_rgba(251,191,36,0.15)]", Icon: Award 
    };
  }
  if (expense >= t4) {
    return { 
      level: 4, label: "Tier 4: Elite", 
      desc: "Premium financial backing. Extensive scholarships and state-of-the-art gear.",
      bgClass: "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200",
      textAccent: "text-purple-700", barColor: "bg-purple-500", glow: "shadow-[0_0_40px_rgba(168,85,247,0.15)]", Icon: Gem 
    };
  }
  if (expense >= t3) {
    return { 
      level: 3, label: "Tier 3: Competitive", 
      desc: "Solid program budget. Healthy mix of athletic aid and quality equipment.",
      bgClass: "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200",
      textAccent: "text-blue-700", barColor: "bg-blue-500", glow: "shadow-[0_0_40px_rgba(59,130,246,0.15)]", Icon: Zap 
    };
  }
  if (expense >= t2) {
    return { 
      level: 2, label: "Tier 2: Developmental", 
      desc: "Building program. Limited athletic aid, standard gear allocations.",
      bgClass: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200",
      textAccent: "text-emerald-700", barColor: "bg-emerald-500", glow: "shadow-[0_0_40px_rgba(16,185,129,0.15)]", Icon: TrendingUp 
    };
  }
  
  return { 
    level: 1, label: "Tier 1: Foundational", 
    desc: "Primarily walk-on driven. Minimal athletic financial aid or extensive travel budget.",
    bgClass: "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200",
    textAccent: "text-slate-700", barColor: "bg-slate-400", glow: "shadow-[0_0_40px_rgba(148,163,184,0.15)]", Icon: Shield 
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
  // Always keep canonical URL clean on non-www without query parameters
  const canonicalUrl = `${BASE_SITE_URL}/college/${canonicalSlug}`;
  const inStateCost = university.tuition_in_state ? formatCurrency(university.tuition_in_state) : 'Contact Admissions';
  const earningsText = university.median_earnings ? formatCurrency(university.median_earnings) : 'competitive';
  const accText = university.acceptance_rate || 'selective';
  const locationText = university.city ? `${university.city}, ${university.state}` : university.state;
  const divisionText = university.division || 'College';

  // Extract unique sports actually offered by this university, fallback to core sports
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
  const activeSportFilter = resolvedSearchParams?.sport ? cleanSportLabel(resolvedSearchParams.sport) : null;

  const title = activeSportFilter
    ? `${university.name} ${activeSportFilter} Recruiting Standards, Scholarships & Tuition (${divisionText}) | ChasedSports`
    : `${university.name} Athletic Recruiting Standards, Scholarships, Sports & Tuition (${divisionText}) | ChasedSports`;

  const description = `Official ${university.name} (${locationText}) ${divisionText} athletic recruiting standards, scholarships, walk-on requirements, and team budgets across ${topSportsPreview}. Compare ${inStateCost} in-state tuition, ${accText} acceptance rate, and ${earningsText} 10-year alumni salary ROI on ChasedSports.`;

  // High-volume search keyword matrix covering general college lookups + every sport offered
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
  searchParams 
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ sport?: string; gender?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const decodedSlug = decodeURIComponent(resolvedParams.slug).trim();
  const isUUID = UUID_REGEX.test(decodedSlug);
  
  const supabase = createClient();

  // 1. Fetch Target University (Supports both slug and legacy UUID)
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

    // 308 Permanent Redirect legacy /college/[uuid] URLs to /college/[slug]
    if (byId.slug && String(byId.slug).trim() !== '' && String(byId.slug).trim() !== decodedSlug) {
      const queryStr = new URLSearchParams();
      if (resolvedSearchParams.sport) queryStr.set('sport', resolvedSearchParams.sport);
      if (resolvedSearchParams.gender) queryStr.set('gender', resolvedSearchParams.gender);
      const qs = queryStr.toString();
      permanentRedirect(`/college/${encodeURIComponent(String(byId.slug).trim())}${qs ? `?${qs}` : ''}`);
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
    supabase.from('universities').select('id, state, median_earnings, tuition_in_state, acceptance_rate').range(0, 999),
    supabase.from('universities').select('id, state, median_earnings, tuition_in_state, acceptance_rate').range(1000, 1999),
    supabase.from('universities').select('id, state, median_earnings, tuition_in_state, acceptance_rate').range(2000, 2999),
    supabase.from('universities').select('id, state, median_earnings, tuition_in_state, acceptance_rate').range(3000, 3999),
    supabase.from('universities').select('id, state, median_earnings, tuition_in_state, acceptance_rate').ilike('state', collegeData.state),
    supabase.from('programs').select(`*, recruiting_standards (*)`).eq('university_id', collegeData.id),
  ]);

  const universitiesList: CollegeSafetyNetData[] = [
    ...(c1.data || []),
    ...(c2.data || []),
    ...(c3.data || []),
    ...(c4.data || [])
  ];

  const stateUniversitiesList: CollegeSafetyNetData[] = stateRes.data || [];
  const allUniversityPrograms: any[] = allProgramsRes.data || [];

  // Safety net: Inject target college into lists if missing
  if (!universitiesList.some(u => String(u.id).trim().toLowerCase() === String(collegeData.id).trim().toLowerCase())) {
    universitiesList.push({
      id: collegeData.id, state: collegeData.state, median_earnings: collegeData.median_earnings,
      tuition_in_state: collegeData.tuition_in_state, acceptance_rate: collegeData.acceptance_rate
    });
  }
  if (!stateUniversitiesList.some(u => String(u.id).trim().toLowerCase() === String(collegeData.id).trim().toLowerCase())) {
    stateUniversitiesList.push({
      id: collegeData.id, state: collegeData.state, median_earnings: collegeData.median_earnings,
      tuition_in_state: collegeData.tuition_in_state, acceptance_rate: collegeData.acceptance_rate
    });
  }

  // --- PARSING HELPERS ---
  const matchStr = (a: string | number | null | undefined, b: string | number | null | undefined) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  
  const cleanNum = (val: string | number | null | undefined) => {
    if (val === null || val === undefined || val === '') return null;
    const num = Number(String(val).replace(/[^0-9.-]+/g,""));
    return isNaN(num) ? null : num;
  };

  const parseRate = (r: string | number | null) => {
    if (!r) return 100;
    const num = parseFloat(String(r).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 100 : num;
  };

  const getRank = (sortedArray: CollegeSafetyNetData[], targetId: string) => {
    const index = sortedArray.findIndex(u => matchStr(u.id, targetId));
    return index !== -1 ? index + 1 : null;
  };

  // A. Alumni Salary Ranking
  const sortedSalaryNational = [...universitiesList]
    .filter(u => cleanNum(u.median_earnings) !== null && cleanNum(u.median_earnings)! > 0)
    .sort((a, b) => cleanNum(b.median_earnings)! - cleanNum(a.median_earnings)!);
    
  const sortedSalaryState = [...stateUniversitiesList]
    .filter(u => cleanNum(u.median_earnings) !== null && cleanNum(u.median_earnings)! > 0)
    .sort((a, b) => cleanNum(b.median_earnings)! - cleanNum(a.median_earnings)!);
    
  let salaryRankNational = getRank(sortedSalaryNational, collegeData.id);
  const salaryRankState = getRank(sortedSalaryState, collegeData.id);

  // B. Tuition Cost Ranking
  const sortedTuitionNational = [...universitiesList]
    .filter(u => cleanNum(u.tuition_in_state) !== null && cleanNum(u.tuition_in_state)! > 0)
    .sort((a, b) => cleanNum(a.tuition_in_state)! - cleanNum(b.tuition_in_state)!);
    
  const sortedTuitionState = [...stateUniversitiesList]
    .filter(u => cleanNum(u.tuition_in_state) !== null && cleanNum(u.tuition_in_state)! > 0)
    .sort((a, b) => cleanNum(a.tuition_in_state)! - cleanNum(b.tuition_in_state)!);
    
  let tuitionRankNational = getRank(sortedTuitionNational, collegeData.id);
  const tuitionRankState = getRank(sortedTuitionState, collegeData.id);

  // C. Acceptance Rate Ranking
  const sortedSelectivityNational = [...universitiesList]
    .filter(u => u.acceptance_rate != null && u.acceptance_rate !== '')
    .sort((a, b) => parseRate(a.acceptance_rate) - parseRate(b.acceptance_rate));
    
  const sortedSelectivityState = [...stateUniversitiesList]
    .filter(u => u.acceptance_rate != null && u.acceptance_rate !== '')
    .sort((a, b) => parseRate(a.acceptance_rate) - parseRate(b.acceptance_rate));
    
  let selectivityRankNational = getRank(sortedSelectivityNational, collegeData.id);
  const selectivityRankState = getRank(sortedSelectivityState, collegeData.id);

  // Clean bounds check for hardcoded totals
  if (salaryRankNational && salaryRankNational > 2819) salaryRankNational = 2819;
  if (tuitionRankNational && tuitionRankNational > 2819) tuitionRankNational = 2819;
  if (selectivityRankNational && selectivityRankNational > 2819) selectivityRankNational = 2819;

  // UI Render Helpers for Clean Rankings (XX / XX format)
  const renderRankRow = (label: string, rank: number | null, total: number) => (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      <span className="text-[13px] font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 shadow-sm tracking-wide">
        {rank !== null && total > 0 ? `#${rank.toLocaleString()} / ${total.toLocaleString()}` : 'N/A'}
      </span>
    </div>
  );

  const renderPercentileBar = (rank: number | null, total: number, colorClass: string, shadowClass: string) => {
    if (rank === null || total === 0) return null;
    const percentile = Math.max(1, Math.round((rank / total) * 100));
    const fillWidth = Math.max(5, 100 - percentile); 
    
    return (
      <div className="pt-4 border-t border-slate-100 mt-5">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Percentile Range</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${colorClass}`}>
            Top {percentile}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60 shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass.replace('text-', 'bg-')} ${shadowClass}`} 
            style={{ width: `${fillWidth}%` }}
          />
        </div>
      </div>
    );
  };

  // 3. Filter Programs in JS based on optional URL query params while preserving full sport list for SEO
  const uniqueSportsOffered = Array.from(
    new Set<string>(
      allUniversityPrograms
        .map((p: any) => (p?.sport ? String(p.sport).trim() : ''))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const programs = allUniversityPrograms.filter((p: any) => {
    if (resolvedSearchParams.sport && String(p.sport || '').toLowerCase() !== resolvedSearchParams.sport.toLowerCase()) {
      return false;
    }
    if (resolvedSearchParams.gender && String(p.gender || '').toLowerCase() !== resolvedSearchParams.gender.toLowerCase()) {
      return false;
    }
    return true;
  });

  const isFiltered = !!(resolvedSearchParams.sport || resolvedSearchParams.gender);
  const hasTuition = Boolean(collegeData.tuition_in_state || collegeData.tuition_out_of_state);
  const baseTuition = collegeData.tuition_in_state || collegeData.tuition_out_of_state || 0;
  const locationDisplay = collegeData.city ? `${collegeData.city}, ${collegeData.state}` : collegeData.state;

  // Compute summary metrics for GEO & Structured Data
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
      : 'NCAA, NAIA, and collegiate varsity sports';

  // Build Dynamic Multi-Sport FAQ Entities for both JSON-LD and On-Page GEO Accordion
  const faqItems = [
    {
      question: `What sports and athletic scholarships does ${collegeData.name} offer?`,
      answer: `${collegeData.name} competes in ${collegeData.division || 'intercollegiate athletics'} and sponsors ${
        totalProgramsCount > 0 ? `${totalProgramsCount} varsity athletic programs` : 'varsity sports'
      } including ${sportsSummaryList}.${
        highestBudgetProgram
          ? ` Its highest-funded program is ${highestBudgetProgram.gender} ${cleanSportLabel(
              highestBudgetProgram.sport
            )} with an annual operating budget of ${formatCurrency(
              highestBudgetProgram.operating_expense || highestBudgetProgram.budget
            )}.`
          : ''
      }`,
    },
    {
      question: `How do I get recruited or walk on at ${collegeData.name}?`,
      answer: `To get recruited or walk on at ${collegeData.name} (${collegeData.division || 'Athletics'}), high school student-athletes should compare their verified stats or personal records (PRs) against ${collegeData.name}'s program ratings and recruiting standards on ChasedSports, maintain academic eligibility for its ${
        collegeData.acceptance_rate || 'selective'
      } admission rate, and contact the coaching staff directly with film and verified marks.`,
    },
    {
      question: `How much is tuition at ${collegeData.name}?`,
      answer: `${collegeData.name} charges ${
        collegeData.tuition_in_state ? formatCurrency(collegeData.tuition_in_state) : 'variable rates'
      } per year for in-state undergraduate tuition${
        collegeData.tuition_out_of_state
          ? ` and ${formatCurrency(collegeData.tuition_out_of_state)} per year for out-of-state students`
          : ''
      }.${
        tuitionRankNational
          ? ` Nationally, ${collegeData.name} ranks #${tuitionRankNational.toLocaleString()} out of 2,819 institutions for tuition affordability (#${tuitionRankState} in ${collegeData.state}).`
          : ''
      }`,
    },
    {
      question: `What is the acceptance rate at ${collegeData.name}?`,
      answer: `The admissions acceptance rate at ${collegeData.name} is ${
        collegeData.acceptance_rate || 'not publicly reported'
      }.${
        selectivityRankNational
          ? ` This places ${collegeData.name} at #${selectivityRankNational.toLocaleString()} nationally for admissions selectivity and #${selectivityRankState} in ${collegeData.state}.`
          : ''
      }`,
    },
    {
      question: `What are the 10-year post-graduate median earnings for ${collegeData.name} alumni?`,
      answer: `Graduates and alumni from ${collegeData.name} earn a median salary of ${
        collegeData.median_earnings ? formatCurrency(collegeData.median_earnings) : 'N/A'
      } 10 years after enrollment${
        roiMultiplier ? `, representing a ${roiMultiplier}x annual return on base tuition` : ''
      }.${
        salaryRankNational
          ? ` Nationally, ${collegeData.name} ranks #${salaryRankNational.toLocaleString()} in alumni earnings (#${salaryRankState} in ${collegeData.state}).`
          : ''
      }`,
    },
  ];

  // Rich @graph JSON-LD for Google Search & AI Engines (Unified on non-www BASE_SITE_URL)
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
        description: `${collegeData.name} (${locationDisplay}) ${collegeData.division || 'collegiate'} athletic recruiting standards, scholarships, team budgets, tuition costs, acceptance rate, and 10-year alumni salary ROI across ${sportsSummaryList}.`,
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
        additionalProperty: [
          {
            '@type': 'PropertyValue',
            name: 'Athletic Division',
            value: collegeData.division || 'N/A',
          },
          {
            '@type': 'PropertyValue',
            name: 'Varsity Sports Offered',
            value: sportsSummaryList,
          },
          ...(collegeData.tuition_in_state
            ? [
                {
                  '@type': 'PropertyValue',
                  name: 'In-State Tuition',
                  value: collegeData.tuition_in_state,
                  unitCode: 'USD',
                },
              ]
            : []),
          ...(collegeData.tuition_out_of_state
            ? [
                {
                  '@type': 'PropertyValue',
                  name: 'Out-of-State Tuition',
                  value: collegeData.tuition_out_of_state,
                  unitCode: 'USD',
                },
              ]
            : []),
          ...(collegeData.acceptance_rate
            ? [
                {
                  '@type': 'PropertyValue',
                  name: 'Acceptance Rate',
                  value: String(collegeData.acceptance_rate),
                },
              ]
            : []),
          ...(collegeData.median_earnings
            ? [
                {
                  '@type': 'PropertyValue',
                  name: '10-Year Median Alumni Earnings',
                  value: collegeData.median_earnings,
                  unitCode: 'USD',
                },
              ]
            : []),
        ],
        ...(allUniversityPrograms.length > 0 && {
          department: allUniversityPrograms.map((prog: any) => ({
            '@type': 'SportsTeam',
            name: `${collegeData.name} ${prog.gender} ${cleanSportLabel(prog.sport)}`,
            sport: cleanSportLabel(prog.sport),
            gender: prog.gender,
            url: `${canonicalUrl}?sport=${encodeURIComponent(prog.sport)}&gender=${encodeURIComponent(prog.gender)}`,
            ...(prog.operating_expense && {
              funder: {
                '@type': 'MonetaryAmount',
                currency: 'USD',
                value: prog.operating_expense,
              },
            }),
          })),
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
    <main className="min-h-screen bg-slate-50 font-sans pb-32 selection:bg-blue-500 selection:text-white">
      {/* ========================================================= */}
      {/* STRUCTURED DATA JSON-LD (SEO & GEO AI CRAWLER GRAPH)      */}
      {/* ========================================================= */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />

      {/* ========================================================= */}
      {/* HERO SECTION                                              */}
      {/* ========================================================= */}
      <header className="relative bg-white pt-12 pb-32 px-6 sm:px-8 overflow-hidden rounded-b-[2.5rem] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border-b border-slate-200">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-400/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Semantic Breadcrumb Navigation for SEO */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  ChasedSports
                </Link>
              </li>
              <li>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </li>
              <li>
                <Link href="/search" className="hover:text-blue-600 transition-colors">
                  College Finder
                </Link>
              </li>
              {collegeData.state && (
                <>
                  <li>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </li>
                  <li>
                    <Link
                      href={`/search?state=${encodeURIComponent(collegeData.state)}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {collegeData.state} Colleges
                    </Link>
                  </li>
                </>
              )}
              <li>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </li>
              <li className="text-slate-700 truncate max-w-[220px]" aria-current="page">
                {collegeData.name}
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <Link 
              href="/search" 
              className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-5 py-2.5 rounded-full border border-blue-100 hover:bg-blue-100 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Link>

            {isFiltered && (
              <Link 
                href={`/college/${canonicalSlug}`}
                className="inline-flex items-center text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors bg-slate-100 px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-200 shadow-sm"
              >
                View All {collegeData.name} Athletic Programs ({totalProgramsCount})
              </Link>
            )}

            <Link
              href={`/dashboard/email-builder?${new URLSearchParams({
                college: collegeData.name,
                slug: String(canonicalSlug),
                ...(resolvedSearchParams.sport && { sport: resolvedSearchParams.sport }),
                ...(collegeData.division && { division: collegeData.division }),
              }).toString()}`}
              className="inline-flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-5 py-2.5 rounded-full border border-indigo-100 hover:bg-indigo-100 shadow-sm"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email {collegeData.name} Coaches
            </Link>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-4 leading-tight">
            {collegeData.name}{' '}
            {resolvedSearchParams.sport
              ? `${cleanSportLabel(resolvedSearchParams.sport)} Recruiting, Scholarships & ROI`
              : 'Athletic Recruiting, Scholarships, Tuition & ROI'}
          </h1>
          <p className="text-base sm:text-lg font-semibold text-slate-500 mb-8 max-w-3xl leading-relaxed">
            Official {collegeData.division || 'Collegiate'} athletic recruiting standards, scholarship projections, walk-on requirements, team operating budgets, and 10-year graduate salary ROI for {collegeData.name} in {locationDisplay} across {sportsSummaryList}.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-slate-600 font-semibold text-sm md:text-base">
            <div className="flex items-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
              {locationDisplay}
            </div>
            <div className="flex items-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
              <Trophy className="w-4 h-4 mr-2 text-amber-500" />
              {collegeData.division}
            </div>
            
            {collegeData.student_population && (
              <div className="flex items-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                <Users className="w-4 h-4 mr-2 text-purple-500" />
                {parseInt(collegeData.student_population).toLocaleString()} Students
              </div>
            )}

            {collegeData.website && (
              <a 
                href={collegeData.website.startsWith('http') ? collegeData.website : `https://${collegeData.website}`}
                target="_blank"
                rel="noopener noreferrer" 
                className="flex items-center bg-white px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
              >
                <Globe className="w-4 h-4 mr-2 text-cyan-500" />
                Official Website
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 relative z-20 space-y-10">
        
        {/* ========================================================= */}
        {/* 0. GEO AI SNAPSHOT & MULTI-SPORT FILTER BAR               */}
        {/* ========================================================= */}
        <section
          aria-label={`${collegeData.name} Recruiting & Financial Snapshot`}
          className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-200/80"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-600">
              At a Glance: {collegeData.name} Recruiting, Sports & ROI Summary
            </h2>
          </div>

          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed mb-6">
            <strong>{collegeData.name}</strong> is a <strong>{collegeData.division || 'collegiate'}</strong> institution located in <strong>{locationDisplay}</strong> sponsoring <strong>{totalProgramsCount > 0 ? `${totalProgramsCount} varsity teams` : 'intercollegiate athletics'}</strong> ({sportsSummaryList}).
            {collegeData.tuition_in_state
              ? ` Annual in-state tuition is ${formatCurrency(collegeData.tuition_in_state)}`
              : ''}
            {collegeData.tuition_out_of_state
              ? ` (${formatCurrency(collegeData.tuition_out_of_state)} out-of-state)`
              : ''}
            {collegeData.acceptance_rate
              ? `, with an undergraduate acceptance rate of ${collegeData.acceptance_rate}.`
              : '.'}{' '}
            {collegeData.median_earnings
              ? `Alumni earn a median salary of ${formatCurrency(collegeData.median_earnings)} 10 years after enrollment${
                  salaryRankNational ? ` (ranked #${salaryRankNational.toLocaleString()} nationally)` : ''
                }.`
              : ''}
          </p>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Division</dt>
              <dd className="text-sm sm:text-base font-black text-slate-900 mt-0.5">{collegeData.division || 'N/A'}</dd>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">In-State Tuition</dt>
              <dd className="text-sm sm:text-base font-black text-slate-900 mt-0.5">{formatCurrency(collegeData.tuition_in_state)}</dd>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Acceptance Rate</dt>
              <dd className="text-sm sm:text-base font-black text-slate-900 mt-0.5">{collegeData.acceptance_rate || 'N/A'}</dd>
            </div>
            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
              <dt className="text-[10px] font-black uppercase tracking-widest text-emerald-600">10-Yr Median Salary</dt>
              <dd className="text-sm sm:text-base font-black text-emerald-700 mt-0.5">{formatCurrency(collegeData.median_earnings)}</dd>
            </div>
          </dl>

          {/* CRAWLABLE MULTI-SPORT PILL NAVIGATOR */}
          {uniqueSportsOffered.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">
                Filter {collegeData.name} Recruiting & Budgets by Sport:
              </span>
              <nav aria-label={`${collegeData.name} Sports Filter`} className="flex flex-wrap gap-2">
                <Link
                  href={`/college/${canonicalSlug}`}
                  className={`text-xs font-black px-3.5 py-1.5 rounded-xl border transition-all ${
                    !resolvedSearchParams.sport
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  All Sports ({totalProgramsCount})
                </Link>
                {uniqueSportsOffered.map((sport) => {
                  const isActive =
                    resolvedSearchParams.sport &&
                    resolvedSearchParams.sport.toLowerCase() === sport.toLowerCase();
                  return (
                    <Link
                      key={sport}
                      href={`/college/${canonicalSlug}?sport=${encodeURIComponent(sport)}`}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {cleanSportLabel(sport)}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 1. INSTITUTIONAL OVERVIEW (Academics, Cost, ROI)          */}
        {/* ========================================================= */}
        <section aria-label="Tuition, Admissions, and Alumni Earnings" className="space-y-8">
          {(hasTuition || collegeData.acceptance_rate) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hasTuition && (
                <article className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="bg-blue-100 p-3 rounded-2xl shadow-inner">
                      <Landmark className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Financial Profile</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-5 tracking-tight">How much is tuition at {collegeData.name}?</h2>
                  <div className="space-y-4">
                    {collegeData.tuition_in_state && (
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <span className="text-slate-500 font-bold">In-State Tuition</span>
                        <span className="text-2xl font-black text-slate-900">{formatCurrency(collegeData.tuition_in_state)}</span>
                      </div>
                    )}
                    {collegeData.tuition_out_of_state && (
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-500 font-bold">Out-of-State Tuition</span>
                        <span className="text-2xl font-black text-slate-900">{formatCurrency(collegeData.tuition_out_of_state)}</span>
                      </div>
                    )}
                  </div>
                </article>
              )}

              {collegeData.acceptance_rate && (
                <article className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-center text-center">
                  <h2 className="text-xl font-black text-slate-900 mb-6">What is the acceptance rate at {collegeData.name}?</h2>
                  <div className="bg-slate-50 w-full rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-inner">
                    <span className="block text-sm font-black text-slate-400 mb-3 uppercase tracking-widest">Acceptance Rate</span>
                    <span className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter">{collegeData.acceptance_rate}</span>
                  </div>
                </article>
              )}
            </div>
          )}

          {collegeData.median_earnings && (
            <article className="bg-white p-6 sm:p-10 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-green-100 p-3.5 rounded-2xl shadow-inner">
                    <TrendingUp className="w-7 h-7 text-green-600" />
                  </div>
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Return on Investment</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">What are the post-graduate earnings for {collegeData.name} alumni?</h2>
                <p className="text-slate-500 font-medium leading-relaxed max-w-lg">
                  The median salary of alumni 10 years after enrolling is <strong>{formatCurrency(collegeData.median_earnings)}</strong>. This metric serves as a powerful indicator of the networking opportunities, degree strength, and long-term financial security provided by this institution.
                </p>
              </div>
              <div className="bg-green-50 border border-green-100 p-6 sm:p-8 rounded-3xl text-center shrink-0 w-full md:w-auto shadow-sm">
                <span className="block text-sm font-bold text-green-600 mb-2 uppercase tracking-wider">10-Year Median Salary</span>
                <span className="text-4xl sm:text-5xl font-black text-green-700 tracking-tighter">{formatCurrency(collegeData.median_earnings)}</span>
              </div>
            </article>
          )}
        </section>

        {/* ========================================================= */}
        {/* 2. ATHLETIC PROGRAMS (Recruiting Standards & Budget)      */}
        {/* ========================================================= */}
        <section aria-label={`${collegeData.name} Athletic Programs and Recruiting Standards`}>
          {(!programs || programs.length === 0) && (
            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No programs match this filter</h3>
              <p className="text-slate-500 font-medium mb-6">This school does not offer this specific sport or gender combination.</p>
              <Link 
                href={`/college/${canonicalSlug}`}
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/30"
              >
                View All Programs
              </Link>
            </div>
          )}

          <div className="space-y-16">
            {programs?.map((program: any) => {
              const budget = program.operating_expense || program.budget;
              const tier = getBudgetTier(budget, program.sport);
              const sportDisplay = cleanSportLabel(program.sport || '');
              
              let estimatedRides = null;
              if (budget && baseTuition > 0) {
                estimatedRides = Math.floor(budget / baseTuition);
              }

              return (
                <article key={program.id} className="space-y-8">
                  
                  {/* TOP: RECRUITING STANDARDS */}
                  {program.recruiting_standards?.length > 0 && (
                    <div className="bg-white p-6 sm:p-10 md:p-14 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                      <div className="mb-10 pb-8 border-b border-slate-100 text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                          What are the {program.gender} {sportDisplay} recruiting standards for {collegeData.name}?
                        </h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                          These represent estimated {collegeData.division} divisional recruiting benchmarks and walk-on target times for {collegeData.name}. Coaches often flex these marks based on your academic profile, progression trajectory, and current roster needs.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {program.recruiting_standards.map((standard: any) => (
                          <div key={standard.id} className="group p-6 sm:p-8 bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200 rounded-[2rem] transition-all duration-300 shadow-sm hover:shadow-md">
                            <h3 className="block font-black text-2xl text-slate-800 tracking-tight mb-6 text-center">{standard.event}</h3>
                            
                            <div className="space-y-4">
                              <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100">
                                <span className="text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest">Recruit Target</span>
                                <span className="font-black text-2xl sm:text-3xl text-blue-600 group-hover:scale-105 transition-transform drop-shadow-sm">
                                  {formatTimeSeconds(standard.target_time_seconds)}
                                </span>
                              </div>

                              {standard.walk_on_time_seconds && (
                                <div className="flex justify-between items-center px-4 sm:px-5 py-2">
                                  <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Walk-On Target</span>
                                  <span className="font-black text-lg sm:text-xl text-slate-600">
                                    {formatTimeSeconds(standard.walk_on_time_seconds)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* GEO TABLE EXTRACTION LAYER: Semantic HTML table for AI Scrapers & Accessibility */}
                      <details className="mt-8 pt-6 border-t border-slate-100 group">
                        <summary className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 cursor-pointer flex items-center justify-center gap-1.5 select-none">
                          <span>View Raw {program.gender} {sportDisplay} Recruiting Standards Table</span>
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                        </summary>
                        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <caption className="sr-only">
                              {collegeData.name} {program.gender} {sportDisplay} Recruiting & Walk-On Standards
                            </caption>
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[11px]">
                              <tr>
                                <th scope="col" className="py-3 px-4">Event</th>
                                <th scope="col" className="py-3 px-4">Scholarship / Recruit Target</th>
                                <th scope="col" className="py-3 px-4">Walk-On Target</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white font-semibold text-slate-700">
                              {program.recruiting_standards.map((standard: any) => (
                                <tr key={`table-${standard.id}`}>
                                  <td className="py-2.5 px-4 font-bold text-slate-900">{standard.event}</td>
                                  <td className="py-2.5 px-4 text-blue-600 font-black">{formatTimeSeconds(standard.target_time_seconds)}</td>
                                  <td className="py-2.5 px-4">{standard.walk_on_time_seconds ? formatTimeSeconds(standard.walk_on_time_seconds) : 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    </div>
                  )}

                  {/* BOTTOM: BUDGET TIER CARD */}
                  {tier && (
                    <div className={`relative overflow-hidden rounded-[2.5rem] border p-6 sm:p-10 md:p-14 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all ${tier.bgClass} ${tier.glow}`}>
                      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/40 rounded-full blur-3xl pointer-events-none"></div>
                      
                      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-6">
                          <div className="inline-flex items-center space-x-3 bg-white/60 backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white shadow-sm">
                            <tier.Icon className={`w-5 h-5 ${tier.textAccent}`} />
                            <span className={`text-xs sm:text-sm font-black tracking-widest uppercase ${tier.textAccent}`}>
                              {tier.label}
                            </span>
                          </div>
                          
                          <div>
                            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2">
                              {program.gender} {sportDisplay}
                            </h3>
                            <p className="text-slate-600 font-medium max-w-md text-base sm:text-lg leading-relaxed">
                              {tier.desc}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/60 backdrop-blur-md border border-white rounded-3xl p-6 sm:p-8 shrink-0 w-full md:w-auto text-center shadow-md">
                          <span className="block text-xs sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Operating Budget</span>
                          <span className={`block text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-6 break-words ${tier.textAccent}`}>
                            {formatCurrency(budget)}
                          </span>
                          
                          {estimatedRides !== null && estimatedRides > 0 && (
                            <div className="bg-white/80 rounded-xl p-4 border border-white shadow-sm">
                              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Budget Power</span>
                              <span className="text-slate-700 font-bold">~{estimatedRides} In-State Full Rides</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative z-10 mt-10 flex gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div 
                            key={i} 
                            className={`h-3 md:h-4 flex-1 rounded-full transition-all duration-700 ${
                              i <= tier.level ? `${tier.barColor} shadow-md` : 'bg-white/40 border border-black/5'
                            }`} 
                          />
                        ))}
                      </div>

                    </div>
                  )}

                </article>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. RANKINGS MATRIX (Benchmarks & Percentiles - Bottom)    */}
        {/* ========================================================= */}
        <section aria-label={`${collegeData.name} National and State Rankings`} className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-100 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black uppercase tracking-widest mb-2 shadow-sm">
                <BarChart3 className="w-3.5 h-3.5" /> Benchmarks & Percentiles
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {collegeData.name} National & {collegeData.state} Rankings
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                Overall placement across 2,819 U.S. institutions
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl shrink-0 flex items-center gap-3 shadow-inner">
              <Crown className="w-6 h-6 text-amber-500 drop-shadow-sm" />
              <div>
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Home Region</span>
                <span className="text-sm font-black text-slate-800">{collegeData.state} Conference Tier</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            
            {/* 1. SALARY / ROI RANK CARD */}
            <div className="bg-white border border-slate-200 hover:border-emerald-300 transition-all rounded-3xl p-5 sm:p-6 flex flex-col justify-between group shadow-lg shadow-slate-200/50">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl shadow-inner">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shadow-sm">
                    Alumni ROI
                  </span>
                </div>
                
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-1">Post-Grad Salary</h3>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mb-6 tracking-tight">
                  {collegeData.median_earnings ? formatCurrency(collegeData.median_earnings) : 'N/A'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {renderRankRow('National Salary Rank', salaryRankNational, 2819)}
                {renderRankRow(`State Salary Rank`, salaryRankState, sortedSalaryState.length)}
                {renderPercentileBar(salaryRankNational, 2819, 'text-emerald-500', 'shadow-[0_0_10px_rgba(16,185,129,0.3)]')}
              </div>
            </div>

            {/* 2. TUITION COST VALUE RANK CARD */}
            <div className="bg-white border border-slate-200 hover:border-blue-300 transition-all rounded-3xl p-5 sm:p-6 flex flex-col justify-between group shadow-lg shadow-slate-200/50">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl shadow-inner">
                    <Landmark className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 shadow-sm">
                    Tuition Cost
                  </span>
                </div>
                
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-1">In-State Cost</h3>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mb-6 tracking-tight">
                  {collegeData.tuition_in_state ? formatCurrency(collegeData.tuition_in_state) : 'N/A'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {renderRankRow('National Cost Rank', tuitionRankNational, 2819)}
                {renderRankRow(`State Cost Rank`, tuitionRankState, sortedTuitionState.length)}
                {renderPercentileBar(tuitionRankNational, 2819, 'text-blue-500', 'shadow-[0_0_10px_rgba(59,130,246,0.3)]')}
              </div>
            </div>

            {/* 3. SELECTIVITY / ACCEPTANCE RANK CARD */}
            <div className="bg-white border border-slate-200 hover:border-purple-300 transition-all rounded-3xl p-5 sm:p-6 flex flex-col justify-between group shadow-lg shadow-slate-200/50">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-xl shadow-inner">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 shadow-sm">
                    Selectivity
                  </span>
                </div>
                
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-1">Acceptance Rate</h3>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mb-6 tracking-tight">
                  {collegeData.acceptance_rate || 'N/A'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {renderRankRow('National Acceptance Rank', selectivityRankNational, 2819)}
                {renderRankRow(`State Acceptance Rank`, selectivityRankState, sortedSelectivityState.length)}
                {renderPercentileBar(selectivityRankNational, 2819, 'text-purple-500', 'shadow-[0_0_10px_rgba(168,85,247,0.3)]')}
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. GEO FAQ SECTION & ALL-SPORT KEYWORD HUB                */}
        {/* ========================================================= */}
        <section
          aria-label={`Frequently Asked Questions about ${collegeData.name}`}
          className="bg-white p-6 sm:p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {collegeData.name} Recruiting, Scholarships & Admissions FAQs
              </h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Verified institutional & multi-sport athletic data
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {faqItems.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-3xl bg-slate-50/80 border border-slate-100"
              >
                <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          {/* All-Sport Keyword Directory for Search Crawlers */}
          {uniqueSportsOffered.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                {collegeData.name} Athletic Recruiting Guides by Sport
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {uniqueSportsOffered.map((sport) => (
                  <Link
                    key={`seo-sport-${sport}`}
                    href={`/college/${canonicalSlug}?sport=${encodeURIComponent(sport)}`}
                    className="text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/70 rounded-xl px-3 py-2 transition-colors truncate"
                  >
                    {collegeData.name} {cleanSportLabel(sport)} Recruiting
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Contextual Internal Links for Crawlers */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Explore Similar Programs:
            </span>
            <div className="flex flex-wrap gap-2">
              {collegeData.state && (
                <Link
                  href={`/search?state=${encodeURIComponent(collegeData.state)}`}
                  className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-colors"
                >
                  More Colleges in {collegeData.state}
                </Link>
              )}
              {collegeData.division && (
                <Link
                  href={`/search?division=${encodeURIComponent(collegeData.division)}`}
                  className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors"
                >
                  All {collegeData.division} Schools
                </Link>
              )}
              <Link
                href="/search"
                className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors"
              >
                Compare in Matchmaker
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}