import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { 
  Trophy, Medal, MapPin, Users, Award, 
  ChevronRight, ShieldCheck, Activity, TrendingUp, Wallet, Flame, Target, Search, RefreshCw
} from 'lucide-react';

// ==========================================
// ROUTE CONFIGURATION (ISR)
// ==========================================
export const revalidate = 604800; // Cache for 7 days
export const dynamicParams = true;

// ==========================================
// NICHE DEFINITIONS & METRIC ENGINE
// ==========================================
export type NicheKey = 
  | 'most-affordable' 
  | 'highest-roi' 
  | 'biggest-budget' 
  | 'highest-acceptance';

interface NicheConfig {
  slug: NicheKey;
  label: string;
  badge: string;
  heroSuffix: string;
  seoDescription: string;
  iconName: string;
  sortFn: (a: RankedCollege, b: RankedCollege) => number;
  highlightValueLabel: string;
  getHighlightValue: (college: RankedCollege) => string;
}

// Universal Sport Unslugifier
function unslugifySport(slug: string): string {
  const customMap: Record<string, string> = {
    'track-and-field': 'Track & Field',
    'cross-country': 'Cross Country',
    'ice-hockey': 'Ice Hockey',
    'field-hockey': 'Field Hockey',
    'water-polo': 'Water Polo',
    'swimming-and-diving': 'Swimming & Diving',
    'beach-volleyball': 'Beach Volleyball',
  };
  if (customMap[slug]) return customMap[slug];
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Multi-variant string matchers
function getStateVariants(slug: string): string[] {
  const map: Record<string, string[]> = {
    'alabama': ['Alabama', 'AL'], 'alaska': ['Alaska', 'AK'], 'arizona': ['Arizona', 'AZ'], 'arkansas': ['Arkansas', 'AR'],
    'california': ['California', 'CA'], 'colorado': ['Colorado', 'CO'], 'connecticut': ['Connecticut', 'CT'], 'delaware': ['Delaware', 'DE'],
    'florida': ['Florida', 'FL'], 'georgia': ['Georgia', 'GA'], 'hawaii': ['Hawaii', 'HI'], 'idaho': ['Idaho', 'ID'],
    'illinois': ['Illinois', 'IL'], 'indiana': ['Indiana', 'IN'], 'iowa': ['Iowa', 'IA'], 'kansas': ['Kansas', 'KS'],
    'kentucky': ['Kentucky', 'KY'], 'louisiana': ['Louisiana', 'LA'], 'maine': ['Maine', 'ME'], 'maryland': ['Maryland', 'MD'],
    'massachusetts': ['Massachusetts', 'MA'], 'michigan': ['Michigan', 'MI'], 'minnesota': ['Minnesota', 'MN'], 'mississippi': ['Mississippi', 'MS'],
    'missouri': ['Missouri', 'MO'], 'montana': ['Montana', 'MT'], 'nebraska': ['Nebraska', 'NE'], 'nevada': ['Nevada', 'NV'],
    'new-hampshire': ['New Hampshire', 'NH'], 'new-jersey': ['New Jersey', 'NJ'], 'new-mexico': ['New Mexico', 'NM'], 'new-york': ['New York', 'NY'],
    'north-carolina': ['North Carolina', 'NC'], 'north-dakota': ['North Dakota', 'ND'], 'ohio': ['Ohio', 'OH'], 'oklahoma': ['Oklahoma', 'OK'],
    'oregon': ['Oregon', 'OR'], 'pennsylvania': ['Pennsylvania', 'PA'], 'rhode-island': ['Rhode Island', 'RI'], 'south-carolina': ['South Carolina', 'SC'],
    'south-dakota': ['South Dakota', 'SD'], 'tennessee': ['Tennessee', 'TN'], 'texas': ['Texas', 'TX'], 'utah': ['Utah', 'UT'],
    'vermont': ['Vermont', 'VT'], 'virginia': ['Virginia', 'VA'], 'washington': ['Washington', 'WA'], 'west-virginia': ['West Virginia', 'WV'],
    'wisconsin': ['Wisconsin', 'WI'], 'wyoming': ['Wyoming', 'WY']
  };
  const titleCase = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return map[slug.toLowerCase()] || [titleCase, slug.toUpperCase()];
}

function getDivisionVariants(slug: string): string[] {
  const map: Record<string, string[]> = {
    'ncaa-d1': ['NCAA D1', 'D1', 'Division 1', 'Division I', 'NCAA Division I', 'NCAA Division 1'],
    'ncaa-d2': ['NCAA D2', 'D2', 'Division 2', 'Division II', 'NCAA Division II', 'NCAA Division 2'],
    'ncaa-d3': ['NCAA D3', 'D3', 'Division 3', 'Division III', 'NCAA Division III', 'NCAA Division 3'],
    'naia': ['NAIA'],
    'njcaa': ['NJCAA', 'JUCO', 'Junior College']
  };
  return map[slug.toLowerCase()] || [slug.toUpperCase()];
}

function parsePercentage(rateStr: string | null | undefined): number {
  if (!rateStr) return 0;
  const cleaned = rateStr.replace('%', '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatCurrency(num: number | null | undefined): string {
  if (!num || num <= 0) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

// Map of micro-niches (Overall and Athletic Performance removed for public SEO)
const NICHES: Record<NicheKey, NicheConfig> = {
  'most-affordable': {
    slug: 'most-affordable',
    label: 'Most Affordable',
    badge: 'Lowest Tuition Niche',
    heroSuffix: ' (Most Affordable)',
    seoDescription: 'lowest in-state tuition costs and maximum value',
    iconName: 'Wallet',
    sortFn: (a, b) => (a.tuition_in_state || 999999) - (b.tuition_in_state || 999999),
    highlightValueLabel: 'In-State Tuition',
    getHighlightValue: (c) => formatCurrency(c.tuition_in_state)
  },
  'highest-roi': {
    slug: 'highest-roi',
    label: 'Highest Career ROI',
    badge: 'Career Post-Grad Earnings',
    heroSuffix: ' (Highest Career Earnings)',
    seoDescription: 'highest median post-graduate earnings and career outcomes',
    iconName: 'TrendingUp',
    sortFn: (a, b) => (b.median_earnings || 0) - (a.median_earnings || 0),
    highlightValueLabel: 'Median Grad Salary',
    getHighlightValue: (c) => formatCurrency(c.median_earnings)
  },
  'biggest-budget': {
    slug: 'biggest-budget',
    label: 'Top Program Budget',
    badge: 'Facility & Operating Funding',
    heroSuffix: ' (Top Budget & Facilities)',
    seoDescription: 'highest operating expense investments and facility funding',
    iconName: 'Flame',
    sortFn: (a, b) => b.maxOperatingExpense - a.maxOperatingExpense,
    highlightValueLabel: 'Program Operating Budget',
    getHighlightValue: (c) => formatCurrency(c.maxOperatingExpense)
  },
  'highest-acceptance': {
    slug: 'highest-acceptance',
    label: 'Highest Acceptance',
    badge: 'Accessible Admissions',
    heroSuffix: ' (High Acceptance Rate)',
    seoDescription: 'accessible college admission rates and recruiting pathways',
    iconName: 'Users',
    sortFn: (a, b) => parsePercentage(b.acceptance_rate) - parsePercentage(a.acceptance_rate),
    highlightValueLabel: 'Acceptance Rate',
    getHighlightValue: (c) => c.acceptance_rate || 'N/A'
  }
};

// ==========================================
// TYPES
// ==========================================
type RankedCollege = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  division: string;
  tuition_in_state: number;
  tuition_out_of_state: number;
  acceptance_rate: string;
  median_earnings: number;
  student_population: number;
  maxOperatingExpense: number;
  programs: any[];
};

// ==========================================
// METADATA GENERATION (pSEO Backbone)
// ==========================================
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ sport: string; division: string; state: string; niche?: string[] }> 
}): Promise<Metadata> {
  const resolvedParams = await params;
  const sport = unslugifySport(resolvedParams.sport);
  const divisionVariants = getDivisionVariants(resolvedParams.division);
  const stateVariants = getStateVariants(resolvedParams.state);

  const rawNiche = resolvedParams.niche?.[0] as NicheKey | undefined;
  // Defaulting to most-affordable if no niche is provided in the URL
  const activeNiche = rawNiche && NICHES[rawNiche] ? NICHES[rawNiche] : NICHES['most-affordable'];

  const title = `Top ${divisionVariants[0]} ${sport} Colleges in ${stateVariants[0]}${activeNiche.heroSuffix} (2026 Rankings)`;
  const description = `Discover the best ${divisionVariants[0]} ${sport} programs in ${stateVariants[0]}. Compare ${activeNiche.seoDescription} to find your perfect fit.`;
  const nichePath = activeNiche.slug !== 'most-affordable' ? `/${activeNiche.slug}` : '';

  return {
    title,
    description,
    alternates: { 
      canonical: `https://www.chasedsports.com/rankings/${resolvedParams.sport}/${resolvedParams.division}/${resolvedParams.state}${nichePath}` 
    },
    openGraph: {
      title,
      description,
      siteName: 'ChasedSports',
      type: 'website',
    }
  };
}

export async function generateStaticParams() {
  return [];
}

// ==========================================
// MAIN SERVER COMPONENT
// ==========================================
export default async function RankingsPage({ 
  params 
}: { 
  params: Promise<{ sport: string; division: string; state: string; niche?: string[] }> 
}) {
  const resolvedParams = await params;
  const sportName = unslugifySport(resolvedParams.sport);
  const stateVariants = getStateVariants(resolvedParams.state);
  const divisionVariants = getDivisionVariants(resolvedParams.division);

  const rawNiche = resolvedParams.niche?.[0] as NicheKey | undefined;
  const activeNiche = rawNiche && NICHES[rawNiche] ? NICHES[rawNiche] : NICHES['most-affordable'];
  const canonicalUrl = `https://www.chasedsports.com/rankings/${resolvedParams.sport}/${resolvedParams.division}/${resolvedParams.state}${activeNiche.slug !== 'most-affordable' ? `/${activeNiche.slug}` : ''}`;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Fetch Universities using flexible multi-variant matching (.in)
  const { data: universities } = await supabase
    .from('universities')
    .select('id, slug, name, city, state, division, tuition_in_state, tuition_out_of_state, acceptance_rate, median_earnings, student_population')
    .in('state', stateVariants)
    .in('division', divisionVariants);

  let rankedColleges: RankedCollege[] = [];

  if (universities && universities.length > 0) {
    const uniIds = universities.map(u => u.id);

    // 2. Fetch Programs for these Universities (Performance rating removed)
    const { data: programs } = await supabase
      .from('programs')
      .select('id, university_id, gender, operating_expense, average_scholarship')
      .ilike('sport', sportName)
      .in('university_id', uniIds);

    if (programs && programs.length > 0) {
      // 3. Data Merge & Compute Base Metrics
      const rawColleges = universities
        .reduce<RankedCollege[]>((acc, uni) => {
          const uniPrograms = programs.filter(p => p.university_id === uni.id);
          if (uniPrograms.length === 0) return acc;
          
          const maxExpense = Math.max(...uniPrograms.map(p => p.operating_expense || 0), 0);

          acc.push({
            ...uni,
            programs: uniPrograms,
            maxOperatingExpense: maxExpense
          });
          return acc;
        }, []);

      // 4. Sort by Active Niche Criteria
      rankedColleges = rawColleges.sort(activeNiche.sortFn);
    }
  }

  // Enhanced JSON-LD for maximum SEO indexing
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "name": `Top ${divisionVariants[0]} ${sportName} Colleges in ${stateVariants[0]}`,
        "url": canonicalUrl,
        "itemListElement": rankedColleges.map((college, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "CollegeOrUniversity",
            "name": college.name,
            "url": `https://www.chasedsports.com/college/${college.slug}`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": college.city,
              "addressRegion": college.state
            }
          }
        }))
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Rankings", "item": "https://www.chasedsports.com/rankings" },
          { "@type": "ListItem", "position": 2, "name": sportName, "item": `https://www.chasedsports.com/rankings/${resolvedParams.sport}` },
          { "@type": "ListItem", "position": 3, "name": divisionVariants[0], "item": `https://www.chasedsports.com/rankings/${resolvedParams.sport}/${resolvedParams.division}` },
          { "@type": "ListItem", "position": 4, "name": stateVariants[0], "item": canonicalUrl }
        ]
      }
    ]
  };

  const top3 = rankedColleges.slice(0, 3);
  const theRest = rankedColleges.slice(3);

  return (
    <main className="min-h-screen bg-slate-950 font-sans pb-32 selection:bg-blue-500 selection:text-white custom-scrollbar overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* HERO SECTION */}
      <div className="relative bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-slate-950 pt-20 pb-40 px-6 md:px-8 overflow-hidden rounded-b-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b border-slate-800/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-slate-800/50 px-5 py-2.5 rounded-full border border-slate-700/50 backdrop-blur-md mb-8 shadow-xl">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
              {activeNiche.badge}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white mb-6 leading-tight drop-shadow-2xl">
            Best <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{divisionVariants[0]}</span> {sportName} Colleges in {stateVariants[0]}
            {activeNiche.slug !== 'most-affordable' && (
              <span className="block text-2xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 font-extrabold mt-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                — {activeNiche.label} Edition —
              </span>
            )}
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
            Comparing programs in {stateVariants[0]} based on {activeNiche.seoDescription}. Select a micro-niche below to re-rank the field and find your ultimate fit.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        
        {/* MICRO-NICHE SWITCHER BAR */}
        <div className="bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl p-2.5 rounded-3xl shadow-2xl mb-16 flex flex-wrap items-center justify-center gap-2">
          {Object.values(NICHES).map((niche) => {
            const isActive = niche.slug === activeNiche.slug;
            const nicheHref = niche.slug === 'most-affordable' 
              ? `/rankings/${resolvedParams.sport}/${resolvedParams.division}/${resolvedParams.state}`
              : `/rankings/${resolvedParams.sport}/${resolvedParams.division}/${resolvedParams.state}/${niche.slug}`;

            return (
              <Link
                key={niche.slug}
                href={nicheHref}
                className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105' 
                    : 'bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 border border-transparent'
                }`}
              >
                {niche.label}
              </Link>
            );
          })}
        </div>

        {/* GAMIFIED EMPTY STATE IF NO DATA FOUND IN SUPABASE */}
        {rankedColleges.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-md rounded-[2.5rem] p-12 text-center shadow-2xl my-8 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent pointer-events-none"></div>
            <div className="w-24 h-24 bg-slate-800/80 border border-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner relative z-10">
              <Search className="w-12 h-12 text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight mb-4 relative z-10">No Matching Programs Found</h3>
            <p className="text-slate-400 font-semibold max-w-lg mx-auto mb-10 text-sm relative z-10 leading-relaxed">
              We couldn't find any verified {divisionVariants[0]} {sportName} programs registered in {stateVariants[0]} matching this criteria yet. Try adjusting your filters or expanding your search!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
              <Link href="/search" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center gap-2">
                <Search className="w-4 h-4" /> Open College Finder
              </Link>
              <Link href="/rankings/track-and-field/ncaa-d1/california" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-black uppercase tracking-widest px-8 py-4 rounded-2xl transition-all flex items-center gap-2 shadow-lg">
                <RefreshCw className="w-4 h-4" /> Try NCAA D1 California
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* TOP 3 PODIUM */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 items-end">
              {top3.map((college, index) => {
                const tierConfigs = [
                  { label: "Legend Tier", bg: "bg-gradient-to-b from-amber-500/10 via-slate-900/80 to-slate-900", border: "border-amber-500/50", text: "text-amber-400", shadow: "shadow-[0_0_40px_rgba(245,158,11,0.2)]", hoverGlow: "group-hover:shadow-[0_0_60px_rgba(245,158,11,0.4)] group-hover:border-amber-400", height: "min-h-[24rem] md:h-[30rem]", icon: Award },
                  { label: "Elite Tier", bg: "bg-gradient-to-b from-slate-400/10 via-slate-900/80 to-slate-900", border: "border-slate-500/50", text: "text-slate-300", shadow: "shadow-[0_0_30px_rgba(148,163,184,0.1)]", hoverGlow: "group-hover:shadow-[0_0_40px_rgba(148,163,184,0.3)] group-hover:border-slate-400", height: "min-h-[22rem] md:h-[27rem]", icon: ShieldCheck },
                  { label: "Champion Tier", bg: "bg-gradient-to-b from-orange-600/10 via-slate-900/80 to-slate-900", border: "border-orange-500/40", text: "text-orange-400", shadow: "shadow-[0_0_30px_rgba(234,88,12,0.15)]", hoverGlow: "group-hover:shadow-[0_0_40px_rgba(234,88,12,0.3)] group-hover:border-orange-500", height: "min-h-[22rem] md:h-[25rem]", icon: Medal }
                ];
                
                const tier = tierConfigs[index];
                const PodiumIcon = tier.icon;
                const flexOrderClass = index === 0 ? 'order-1 md:order-2' : index === 1 ? 'order-2 md:order-1' : 'order-3 md:order-3';

                return (
                  <Link href={`/college/${college.slug}?sport=${resolvedParams.sport}`} key={college.id} className={`group ${flexOrderClass} flex flex-col justify-end transition-all duration-500 hover:-translate-y-3`}>
                    <div className={`relative w-full rounded-[2.5rem] p-8 backdrop-blur-2xl border ${tier.bg} ${tier.border} ${tier.shadow} ${tier.hoverGlow} transition-all duration-500 ${tier.height} flex flex-col justify-between overflow-hidden`}>
                      
                      {/* Giant Background Number */}
                      <div className="absolute -top-10 -right-8 text-[180px] font-black opacity-[0.03] text-white leading-none select-none pointer-events-none">
                        #{index + 1}
                      </div>

                      <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-white/10 shadow-inner">
                            <PodiumIcon className={`w-6 h-6 ${tier.text} drop-shadow-md`} />
                          </div>
                          <span className={`text-[11px] font-black uppercase tracking-widest ${tier.text} drop-shadow-sm`}>
                            {tier.label}
                          </span>
                        </div>

                        <h2 className="text-3xl font-black text-white tracking-tight mb-3 drop-shadow-lg group-hover:text-blue-400 transition-colors line-clamp-2">
                          {college.name}
                        </h2>
                        
                        <div className="flex items-center text-slate-400 text-sm font-semibold mb-6">
                          <MapPin className="w-4 h-4 mr-1.5 opacity-70 shrink-0" />
                          <span className="truncate">{college.city}, {college.state}</span>
                        </div>
                      </div>

                      <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-white/5 backdrop-blur-md relative z-10">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{activeNiche.highlightValueLabel}</span>
                          <span className={`text-2xl font-black ${tier.text} drop-shadow-md`}>{activeNiche.getHighlightValue(college)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-400 pt-1">
                          <span>Post-Grad Salary:</span>
                          <span className="text-white font-black">{formatCurrency(college.median_earnings)}</span>
                        </div>
                      </div>

                    </div>
                  </Link>
                );
              })}
            </div>

            {/* THE REST OF THE FIELD */}
            {theRest.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                  <h3 className="text-2xl font-black text-white flex items-center">
                    <Activity className="w-6 h-6 text-blue-500 mr-3 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                    Complete {divisionVariants[0]} Field 
                    <span className="text-slate-500 ml-3 text-lg">({activeNiche.label})</span>
                  </h3>
                </div>

                {theRest.map((college, index) => (
                  <Link 
                    href={`/college/${college.slug}?sport=${resolvedParams.sport}`} 
                    key={college.id}
                    className="group block bg-slate-900/50 backdrop-blur-lg p-6 rounded-3xl border border-slate-800 shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-500/50 hover:bg-slate-800/80 transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 shrink-0 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shadow-inner text-2xl font-black text-slate-500 group-hover:border-blue-500/30 group-hover:text-blue-400 transition-colors">
                          #{index + 4}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tight line-clamp-1">
                            {college.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-4 mt-2">
                            <span className="flex items-center text-xs font-semibold text-slate-400">
                              <MapPin className="w-3.5 h-3.5 mr-1" /> {college.city}
                            </span>
                            {college.acceptance_rate && (
                              <span className="flex items-center text-xs font-semibold text-slate-400">
                                <Users className="w-3.5 h-3.5 mr-1" /> {college.acceptance_rate} Admit
                              </span>
                            )}
                            {college.median_earnings > 0 && (
                              <span className="flex items-center text-xs font-black text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-900/50">
                                <TrendingUp className="w-3.5 h-3.5 mr-1" /> {formatCurrency(college.median_earnings)} Grad Salary
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 md:gap-8 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 group-hover:bg-slate-950 group-hover:border-blue-900/50 transition-colors">
                        <div className="text-center min-w-[5rem]">
                          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{activeNiche.highlightValueLabel}</span>
                          <span className="text-lg font-black text-blue-400">{activeNiche.getHighlightValue(college)}</span>
                        </div>
                        <div className="w-px h-10 bg-slate-800"></div>
                        <div className="text-center min-w-[5rem]">
                          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tuition</span>
                          <span className="text-sm font-black text-slate-300">{formatCurrency(college.tuition_in_state)}</span>
                        </div>
                        <div className="hidden md:flex bg-slate-800 p-2.5 rounded-xl shadow-inner border border-slate-700 group-hover:border-blue-500 group-hover:bg-blue-600 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all">
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
                        </div>
                      </div>

                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}