'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  Users, MessageSquare, Trophy, Shield, Crown, Activity, 
  Gift, AlertCircle, X, CheckCircle2, ChevronRight, 
  Star, Target, ArrowRight, Sparkles, Search, MapPin, Plus, Building2
} from 'lucide-react';
import Link from 'next/link';

// 🚨 REUSABLE COMPONENTS
import { ChasedCash } from '@/components/ChasedCash';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

// --- GAMIFIED TIER SYSTEM ---
const getLocalTierStyles = (score: number) => {
  if (score >= 95) return { tier: 'Power 4 D1', colorClass: 'text-fuchsia-400', bgClass: 'bg-fuchsia-500/10', borderClass: 'border-fuchsia-500/50' };
  if (score >= 85) return { tier: 'Mid-Major D1', colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/50' };
  if (score >= 75) return { tier: 'Top D2 / Walk-On', colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/50' };
  if (score >= 65) return { tier: 'D2 / D3 Prospect', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/50' };
  if (score >= 55) return { tier: 'NAIA Prospect', colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/50' };
  if (score >= 40) return { tier: 'Strong Varsity', colorClass: 'text-slate-300', bgClass: 'bg-slate-500/20', borderClass: 'border-slate-400/50' };
  if (score >= 20) return { tier: 'Varsity Contributor', colorClass: 'text-slate-400', bgClass: 'bg-slate-500/10', borderClass: 'border-slate-500/30' };
  return { tier: 'Developmental', colorClass: 'text-slate-500', bgClass: 'bg-slate-500/5', borderClass: 'border-slate-600/30' };
};

// --- RECRUITING SCORE MATH (TRACK & FIELD) ---
const parseMarkToNumber = (mark: string, event: string): number => {
  if (!mark) return 0;
  const cleanMark = mark.replace(/[a-zA-Z*]/g, '').trim();
  if (cleanMark.includes("'")) {
    const parts = cleanMark.split("'");
    const feet = parseFloat(parts[0]) || 0;
    const inches = parseFloat(parts[1]?.replace('"', '')) || 0;
    return ((feet * 12) + inches); 
  }
  if (cleanMark.includes(":")) {
    const parts = cleanMark.split(":");
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return (minutes * 60) + seconds; 
  }
  return parseFloat(cleanMark) || 0;
};

const RECRUITING_STANDARDS: Record<string, Record<string, { t1: number, t2: number, t3: number, t4: number, t5: number, t6: number, t7: number, isField?: boolean }>> = {
  'Boys': {
    '60 Meters': { t1: 6.75, t2: 6.90, t3: 7.05, t4: 7.20, t5: 7.40, t6: 7.60, t7: 8.00 },
    '100 Meters': { t1: 10.5, t2: 10.8, t3: 11.0, t4: 11.3, t5: 11.6, t6: 11.9, t7: 12.6 },
    '200 Meters': { t1: 21.2, t2: 21.8, t3: 22.2, t4: 22.8, t5: 23.5, t6: 24.5, t7: 26.0 },
    '400 Meters': { t1: 47.5, t2: 49.0, t3: 50.0, t4: 51.5, t5: 53.0, t6: 55.0, t7: 58.0 },
    '800 Meters': { t1: 112, t2: 115, t3: 117, t4: 120, t5: 125, t6: 130, t7: 140 }, 
    '1500 Meters': { t1: 231, t2: 239, t3: 244, t4: 250, t5: 264, t6: 275, t7: 300 },
    '1600 Meters': { t1: 250, t2: 258, t3: 264, t4: 270, t5: 285, t6: 295, t7: 320 }, 
    '3000 Meters': { t1: 500, t2: 518, t3: 532, t4: 546, t5: 574, t6: 600, t7: 660 },
    '3200 Meters': { t1: 540, t2: 560, t3: 575, t4: 590, t5: 620, t6: 650, t7: 720 }, 
    '110m Hurdles': { t1: 13.8, t2: 14.2, t3: 14.6, t4: 15.0, t5: 15.5, t6: 16.5, t7: 18.5 },
    '300m Hurdles': { t1: 37.0, t2: 38.5, t3: 39.5, t4: 41.0, t5: 42.5, t6: 44.5, t7: 48.0 },
    'Long Jump': { t1: 288, t2: 270, t3: 260, t4: 252, t5: 240, t6: 228, t7: 204, isField: true }, 
    'High Jump': { t1: 82, t2: 78, t3: 76, t4: 74, t5: 70, t6: 66, t7: 60, isField: true }, 
    'Pole Vault': { t1: 198, t2: 186, t3: 174, t4: 162, t5: 150, t6: 132, t7: 108, isField: true },
    'Shot Put': { t1: 720, t2: 660, t3: 600, t4: 540, t5: 480, t6: 444, t7: 360, isField: true }, 
    'Discus': { t1: 2220, t2: 2040, t3: 1860, t4: 1740, t5: 1620, t6: 1440, t7: 1080, isField: true },
    'Javelin': { t1: 2340, t2: 2160, t3: 2040, t4: 1920, t5: 1800, t6: 1620, t7: 1200, isField: true }
  },
  'Girls': {
    '60 Meters': { t1: 7.45, t2: 7.65, t3: 7.85, t4: 8.05, t5: 8.30, t6: 8.60, t7: 9.20 },
    '100 Meters': { t1: 11.7, t2: 12.1, t3: 12.4, t4: 12.8, t5: 13.2, t6: 13.6, t7: 14.5 },
    '200 Meters': { t1: 24.2, t2: 24.8, t3: 25.5, t4: 26.2, t5: 27.0, t6: 28.5, t7: 31.0 },
    '400 Meters': { t1: 54.5, t2: 57.0, t3: 58.5, t4: 60.5, t5: 63.0, t6: 66.0, t7: 72.0 },
    '800 Meters': { t1: 130, t2: 135, t3: 140, t4: 145, t5: 152, t6: 160, t7: 175 }, 
    '1500 Meters': { t1: 268, t2: 282, t3: 291, t4: 300, t5: 314, t6: 330, t7: 375 },
    '1600 Meters': { t1: 290, t2: 305, t3: 315, t4: 325, t5: 340, t6: 360, t7: 400 }, 
    '100m Hurdles': { t1: 13.8, t2: 14.3, t3: 14.8, t4: 15.5, t5: 16.5, t6: 17.8, t7: 20.0 },
    '300m Hurdles': { t1: 42.5, t2: 44.5, t3: 46.5, t4: 48.5, t5: 51.0, t6: 54.0, t7: 59.0 },
    'Long Jump': { t1: 234, t2: 222, t3: 210, t4: 198, t5: 186, t6: 174, t7: 150, isField: true }, 
    'High Jump': { t1: 68, t2: 64, t3: 62, t4: 60, t5: 58, t6: 54, t7: 50, isField: true }, 
    'Pole Vault': { t1: 156, t2: 144, t3: 132, t4: 120, t5: 108, t6: 90, t7: 72, isField: true },
    'Shot Put': { t1: 540, t2: 480, t3: 432, t4: 396, t5: 360, t6: 324, t7: 264, isField: true }, 
    'Discus': { t1: 1800, t2: 1620, t3: 1500, t4: 1380, t5: 1260, t6: 1080, t7: 840, isField: true },
    'Javelin': { t1: 1740, t2: 1560, t3: 1440, t4: 1320, t5: 1200, t6: 1020, t7: 780, isField: true }
  }
};

const getEventScore = (markStr: string, event: string, gender: string): number => {
  const standards = RECRUITING_STANDARDS[gender] || RECRUITING_STANDARDS['Boys'];
  const normalizedEvent = event
    .replace(/Meter\b/i, 'Meters')
    .replace('100 Meter Hurdles', '100m Hurdles')
    .replace('110 Meter Hurdles', '110m Hurdles')
    .replace('300 Meter Hurdles', '300m Hurdles');

  const eventStds = standards[normalizedEvent] || standards[event];
  if (!eventStds) return 5;

  const val = parseMarkToNumber(markStr, event);
  
  let score = 5;
  if (eventStds.isField) {
    if (val >= eventStds.t1) score = 95 + Math.min(4, ((val - eventStds.t1) / (eventStds.t1 * 0.05)) * 4);
    else if (val >= eventStds.t2) score = 85 + ((val - eventStds.t2) / (eventStds.t1 - eventStds.t2)) * 10;
    else if (val >= eventStds.t3) score = 75 + ((val - eventStds.t3) / (eventStds.t2 - eventStds.t3)) * 10;
    else if (val >= eventStds.t4) score = 65 + ((val - eventStds.t4) / (eventStds.t3 - eventStds.t4)) * 10;
    else if (val >= eventStds.t5) score = 55 + ((val - eventStds.t5) / (eventStds.t4 - eventStds.t5)) * 10;
    else if (val >= eventStds.t6) score = 40 + ((val - eventStds.t6) / (eventStds.t5 - eventStds.t6)) * 14;
    else if (val >= eventStds.t7) score = 20 + ((val - eventStds.t7) / (eventStds.t6 - eventStds.t7)) * 19;
    else { const t8 = eventStds.t7 * 0.85; if (val >= t8) { score = 5 + ((val - t8) / (eventStds.t7 - t8)) * 14; } else { score = 5; } }
  } else {
    if (val <= eventStds.t1) score = 95 + Math.min(4, ((eventStds.t1 - val) / (eventStds.t1 * 0.05)) * 4);
    else if (val <= eventStds.t2) score = 85 + ((eventStds.t2 - val) / (eventStds.t2 - eventStds.t1)) * 10;
    else if (val <= eventStds.t3) score = 75 + ((eventStds.t3 - val) / (eventStds.t3 - eventStds.t2)) * 10;
    else if (val <= eventStds.t4) score = 65 + ((eventStds.t4 - val) / (eventStds.t4 - eventStds.t3)) * 10;
    else if (val <= eventStds.t5) score = 55 + ((eventStds.t5 - val) / (eventStds.t5 - eventStds.t4)) * 10;
    else if (val <= eventStds.t6) score = 40 + ((eventStds.t6 - val) / (eventStds.t6 - eventStds.t5)) * 14;
    else if (val <= eventStds.t7) score = 20 + ((eventStds.t7 - val) / (eventStds.t7 - eventStds.t6)) * 19;
    else { const t8 = eventStds.t7 * 1.15; if (val <= t8) { score = 5 + ((t8 - val) / (t8 - eventStds.t7)) * 14; } else { score = 5; } }
  }
  return Math.min(99, Math.max(5, Math.round(score)));
};

// --- TYPES ---
interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  equipped_border: string | null;
  sport_scores: Record<string, number>; 
  sports: string[];
  created_at: string;
  is_premium: boolean;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  timestamp: Date;
}

export default function TeamHeadquarters() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboards' | 'rewards' | 'chat'>('leaderboards');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamName, setTeamName] = useState("Your Team");
  
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [activeSport, setActiveSport] = useState<string>('Track & Field');

  const [lastCashClaim, setLastCashClaim] = useState<Date | null>(null);
  const [claimedMilestones, setClaimedMilestones] = useState<Set<number>>(new Set());
  const [isClaiming, setIsClaiming] = useState(false);

  const [userCoins, setUserCoins] = useState(0);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [onboardingView, setOnboardingView] = useState<'search' | 'create'>('search');
  
  const [createData, setCreateData] = useState({
    name: '', city: '', state: '', mascot: '', conference: ''
  });

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000); 
  };

  useEffect(() => {
    async function loadTeamData() {
      try {
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;
        if (!session) return;

        const { data: userData, error: userErr } = await supabase
          .from('athletes')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (userErr) throw userErr;

        if (userData) {
          setCurrentUser(userData);
          setUserCoins(userData.coins || 0);

          if (!userData.high_school || userData.high_school.trim() === '') {
            setNeedsOnboarding(true);
            setLoading(false);
            return;
          }

          setTeamName(userData.high_school);
          
          const claimThreshold = userData.last_cash_claim 
            ? new Date(userData.last_cash_claim) 
            : new Date(userData.created_at);
            
          setLastCashClaim(claimThreshold);

          const rawSchool = userData.high_school.trim();
          const strippedSchoolQuery = rawSchool.replace(/\b(high school|h\.s\.|hs|highschool|senior high)\b/gi, '').trim();

          const { data: teammates, error: tmErr } = await supabase
            .from('athletes')
            .select('*') 
            .or(`high_school.ilike.%${strippedSchoolQuery}%,high_school.eq.${rawSchool}`)
            .order('created_at', { ascending: true }); 

          if (tmErr) {
            showToast(`DB Search Error: ${tmErr.message}`, 'error');
          }

          let safeTeammates = teammates || [];
          
          if (!safeTeammates.some(t => t.id === userData.id)) {
            safeTeammates.push(userData);
          }

          const teammateIds = safeTeammates.map(t => t.id);

          let sportsData: any[] = [];
          if (teammateIds.length > 0) {
            // 🚨 ADDED "metrics" TO THE SELECT SO WE CAN DO ON-THE-FLY SCORE CALCS
            const { data: spData, error: spErr } = await supabase
              .from('athlete_sports')
              .select('athlete_id, sport_name, custom_fit_score, meta_context, metrics, is_active')
              .in('athlete_id', teammateIds)
              .eq('is_active', true);
            
            if (spErr) {
               showToast(`Sports Fetch Error: ${spErr.message}`, 'error');
            } else if (spData) {
               sportsData = spData;
            }
          }

          const scoresMap: Record<string, Record<string, number>> = {};
          const activeSportsMap: Record<string, string[]> = {};
          const globalSportsSet = new Set<string>();
          const trackMetricsMap: Record<string, any[]> = {}; // Store raw metrics for fast lookup

          globalSportsSet.add('Track & Field');

          sportsData.forEach(row => {
            if (!scoresMap[row.athlete_id]) scoresMap[row.athlete_id] = {};
            if (!activeSportsMap[row.athlete_id]) activeSportsMap[row.athlete_id] = [];
            
            let contextRating = 0;
            if (row.meta_context && typeof row.meta_context === 'object') {
                contextRating = (row.meta_context as any).calculatedRating || 0;
            } else if (typeof row.meta_context === 'string') {
                try { contextRating = JSON.parse(row.meta_context).calculatedRating || 0; } catch(e){}
            }
            
            const calculatedRatingValue = row.custom_fit_score || contextRating || 0;
            scoresMap[row.athlete_id][row.sport_name] = calculatedRatingValue;
            
            if (!activeSportsMap[row.athlete_id].includes(row.sport_name)) {
              activeSportsMap[row.athlete_id].push(row.sport_name);
            }
            globalSportsSet.add(row.sport_name);

            // Harvest the row metrics specifically for Track & Field
            if (row.sport_name === 'Track & Field' && row.metrics) {
              let parsedMetrics: any[] = [];
              if (Array.isArray(row.metrics)) {
                parsedMetrics = row.metrics;
              } else if (typeof row.metrics === 'string') {
                try { parsedMetrics = JSON.parse(row.metrics); } catch(e){}
              }
              trackMetricsMap[row.athlete_id] = parsedMetrics;
            }
          });

          const processed = safeTeammates.map(t => {
            let trackPrScore = 0;
            const tGender = t.gender || 'Boys';
            
            // 1. Evaluate Legacy `prs` JSON
            let parsedPrs: any[] = [];
            if (Array.isArray(t.prs)) {
              parsedPrs = t.prs;
            } else if (typeof t.prs === 'string') {
              try { parsedPrs = JSON.parse(t.prs); } catch(e){}
            }

            if (parsedPrs.length > 0) {
              parsedPrs.forEach((pr: any) => {
                if (pr.mark && pr.event) {
                  const score = getEventScore(pr.mark, pr.event, tGender);
                  if (score > trackPrScore) trackPrScore = score;
                }
              });
            }

            // 2. Evaluate Dynamic `athlete_sports.metrics` 
            // Handles migrating athletes who have stats but no assigned `custom_fit_score`
            const newTrackMetrics = trackMetricsMap[t.id] || [];
            if (newTrackMetrics.length > 0) {
              newTrackMetrics.forEach((m: any) => {
                if (m.name && m.value) {
                  const score = getEventScore(m.value, m.name, tGender);
                  if (score > trackPrScore) trackPrScore = score;
                }
              });
            }

            const individualAthleteSports = new Set<string>();
            individualAthleteSports.add('Track & Field');
            
            if (activeSportsMap[t.id]) {
              activeSportsMap[t.id].forEach(s => individualAthleteSports.add(s));
            }

            const integratedScores = { ...(scoresMap[t.id] || {}) };
            // Save whichever score is highest (Legacy vs New Table vs DB Score)
            const savedDbScore = integratedScores['Track & Field'] || 0;
            integratedScores['Track & Field'] = Math.max(savedDbScore, trackPrScore);

            return {
              id: t.id,
              first_name: t.first_name || 'Unknown',
              last_name: t.last_name || 'Athlete',
              avatar_url: t.avatar_url || null,
              equipped_border: t.equipped_border || null,
              sport_scores: integratedScores,
              sports: Array.from(individualAthleteSports),
              created_at: t.created_at || new Date().toISOString(),
              is_premium: t.is_premium || false
            };
          });

          setTeamMembers(processed);
          
          const sortedSportsArray = Array.from(globalSportsSet);
          setAvailableSports(sortedSportsArray);
          
          if (sortedSportsArray.length > 0 && !sortedSportsArray.includes(activeSport)) {
            setActiveSport(sortedSportsArray[0]);
          }

          const storedClaimedMilestones = localStorage.getItem(`claimed_milestones_${session.user.id}`);
          if (storedClaimedMilestones) setClaimedMilestones(new Set(JSON.parse(storedClaimedMilestones)));
        }
        
        setChatMessages([
          { id: '1', sender_id: 'sys', sender_name: 'System', text: 'Welcome to the Team Locker Room.', timestamp: new Date() }
        ]);
        
        setLoading(false);
      } catch (err: any) {
        showToast(err.message, 'error');
        setLoading(false);
      }
    }
    
    loadTeamData();
  }, [supabase, activeSport]);

  // --- TEAM ONBOARDING LOGIC ---
  useEffect(() => {
    if (!needsOnboarding || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchTeams = async () => {
      setIsSearching(true);
      
      const { data: officialTeams } = await supabase
        .from('teams')
        .select('high_school_name, city, state, mascot')
        .or(`high_school_name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
        .limit(10);

      const { data: athleteSchools } = await supabase
        .from('athletes')
        .select('high_school')
        .ilike('high_school', `%${searchQuery}%`)
        .not('high_school', 'is', null)
        .limit(20);

      const uniqueSchools = new Map();

      if (officialTeams) {
        officialTeams.forEach(t => uniqueSchools.set(t.high_school_name, t));
      }

      if (athleteSchools) {
        athleteSchools.forEach(a => {
          if (a.high_school && !uniqueSchools.has(a.high_school)) {
            uniqueSchools.set(a.high_school, {
              high_school_name: a.high_school,
              city: 'Unknown',
              state: 'US',
              mascot: ''
            });
          }
        });
      }

      setSearchResults(Array.from(uniqueSchools.values()).slice(0, 8));
      setIsSearching(false);
    };

    const delayDebounceFn = setTimeout(() => {
      searchTeams();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, needsOnboarding, supabase]);

  const handleJoinTeam = async (schoolName: string) => {
    if (!currentUser) return;
    setIsClaiming(true);
    try {
      const { error } = await supabase
        .from('athletes')
        .update({ high_school: schoolName })
        .eq('id', currentUser.id);

      if (error) throw error;
      
      showToast(`Successfully joined ${schoolName}!`, 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      showToast(err.message, 'error');
      setIsClaiming(false);
    }
  };

  const sanitizeSchoolName = (input: string) => {
    let cleaned = input.replace(/\b(high school|h\.s\.|hs|highschool|senior high)\b/gi, '').trim();
    cleaned = cleaned.replace(/[,.-]+$/, '').trim(); 
    return cleaned.length > 0 ? `${cleaned} HS` : '';
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isClaiming) return;
    
    const finalSchoolName = sanitizeSchoolName(createData.name);
    if (!finalSchoolName) {
      showToast("Please enter a valid school name.", 'error');
      return;
    }

    setIsClaiming(true);
    try {
      const { error: teamError } = await supabase
        .from('teams')
        .insert({
          high_school_name: finalSchoolName,
          city: createData.city,
          state: createData.state,
          mascot: createData.mascot,
          conference: createData.conference,
          boost_tokens: 0,
          cash_gen_tokens: 0,
          upgrade_tokens: 0
        });

      if (teamError && teamError.code !== '23505') { 
        throw teamError;
      }

      const { error: athleteError } = await supabase
        .from('athletes')
        .update({ high_school: finalSchoolName })
        .eq('id', currentUser.id);

      if (athleteError) throw athleteError;

      showToast(`${finalSchoolName} Established! Welcome home.`, 'success');
      setTimeout(() => window.location.reload(), 1000);

    } catch (err: any) {
      showToast(err.message, 'error');
      setIsClaiming(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentUser) return;
    
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender_id: currentUser.id,
      sender_name: currentUser.first_name,
      text: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages([...chatMessages, newMsg]);
    setChatInput('');
  };

  // --- REWARDS MATH ---
  const multiplier = 1.00 + (teamMembers.length * 0.05);
  const baseReward = 500;
  const payoutPerAthlete = Math.floor(baseReward * multiplier);
  
  const claimableRecruits = teamMembers.filter(r => {
    if (!lastCashClaim || r.id === currentUser?.id) return false;
    return new Date(r.created_at) > lastCashClaim;
  });
  
  const totalPendingCash = claimableRecruits.length * payoutPerAthlete;

  const totalMilestonesUnlocked = Math.floor(teamMembers.length / 10);
  const milestones = Array.from({ length: totalMilestonesUnlocked }, (_, i) => (i + 1) * 10);
  const nextMilestone = (totalMilestonesUnlocked + 1) * 10;
  const progressToNext = teamMembers.length % 10;

  const handleClaimRecruitRewards = async () => {
    if (!currentUser || claimableRecruits.length === 0 || isClaiming) return;
    setIsClaiming(true);

    try {
      const newBalance = userCoins + totalPendingCash;
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('athletes')
        .update({ 
          coins: newBalance,
          last_cash_claim: now 
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      setUserCoins(newBalance);
      setLastCashClaim(new Date(now));

      showToast(`Payload Claimed! +${totalPendingCash.toLocaleString()} ChasedCash added.`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClaimMilestone = async (milestoneCount: number) => {
    if (!currentUser || claimedMilestones.has(milestoneCount) || isClaiming) return;
    setIsClaiming(true);

    try {
      let rewardMessage = "";
      
      if (currentUser.is_premium) {
        const newBalance = userCoins + 1000;
        const { error } = await supabase.from('athletes').update({ coins: newBalance }).eq('id', currentUser.id);
        if (error) throw error;
        setUserCoins(newBalance);
        rewardMessage = "Milestone Reached! +1,000 ChasedCash awarded.";
      } else {
        const { error } = await supabase.from('athletes').update({ is_premium: true }).eq('id', currentUser.id);
        if (error) throw error;
        setCurrentUser({ ...currentUser, is_premium: true });
        rewardMessage = "Milestone Reached! 1 Month of Premium activated.";
      }

      const newClaimedMilestones = new Set(claimedMilestones).add(milestoneCount);
      setClaimedMilestones(newClaimedMilestones);
      localStorage.setItem(`claimed_milestones_${currentUser.id}`, JSON.stringify(Array.from(newClaimedMilestones)));

      showToast(rewardMessage, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // ==========================================
  // RENDER: TEAM ONBOARDING VIEW
  // ==========================================
  if (needsOnboarding) {
    return (
      <main className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center p-6 selection:bg-emerald-500/30">
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
            <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
              {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />}
              <p className="text-sm font-bold leading-tight">{toast.message}</p>
              <button onClick={() => setToast(null)} className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 text-center mb-8">
            <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Find Your Squad.</h1>
            <p className="text-slate-400 font-medium text-sm">You haven't joined a high school yet. Link up with your teammates to pool bounties and hit milestones.</p>
          </div>

          {onboardingView === 'search' ? (
            <div className="relative z-10 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by school, city, or state..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-2xl pl-12 pr-4 py-4 text-white font-medium outline-none transition-colors"
                />
              </div>

              {searchQuery.length > 1 && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-h-[250px] overflow-y-auto custom-scrollbar">
                  {isSearching ? (
                    <div className="p-6 text-center text-slate-500 font-bold text-sm animate-pulse">Scanning the database...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((team, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleJoinTeam(team.high_school_name)}
                        className="w-full text-left p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">{team.high_school_name}</p>
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" /> {team.city}, {team.state} {team.mascot && `• ${team.mascot}`}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-slate-400 font-bold text-sm mb-1">No schools found.</p>
                      <p className="text-slate-500 text-xs">Be the first to claim your territory.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 text-center">
                <p className="text-sm font-bold text-slate-500 mb-3">Can't find your school?</p>
                <button 
                  onClick={() => setOnboardingView('create')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Add High School
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateTeam} className="relative z-10 space-y-4 animate-in slide-in-from-right-4 fade-in">
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3 h-3" /> Founding Member
                </p>
                <p className="text-amber-200/70 text-sm font-medium leading-snug">
                  You are creating the official hub for your school. Make sure the spelling is accurate so your teammates can find it!
                </p>
              </div>

              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">School Name</label>
                <input required type="text" value={createData.name} onChange={e => setCreateData({...createData, name: e.target.value})} placeholder="e.g. South Albany" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors" />
                <p className="text-[10px] text-slate-500 mt-1 font-medium">We'll automatically format it to add "HS" at the end.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">City</label>
                  <input required type="text" value={createData.city} onChange={e => setCreateData({...createData, city: e.target.value})} placeholder="e.g. Albany" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">State</label>
                  <input required type="text" maxLength={2} value={createData.state} onChange={e => setCreateData({...createData, state: e.target.value.toUpperCase()})} placeholder="e.g. OR" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">Mascot</label>
                  <input required type="text" value={createData.mascot} onChange={e => setCreateData({...createData, mascot: e.target.value})} placeholder="e.g. RedHawks" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5">Conference</label>
                  <input required type="text" value={createData.conference} onChange={e => setCreateData({...createData, conference: e.target.value.toUpperCase()})} placeholder="e.g. 5A" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors uppercase" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setOnboardingView('search')} className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={isClaiming || !createData.name || !createData.city || !createData.state} className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] text-sm disabled:opacity-50">
                  {isClaiming ? 'Establishing Hub...' : 'Create School Hub'}
                </button>
              </div>
            </form>
          )}

        </div>
      </main>
    );
  }

  // ==========================================
  // RENDER: MAIN DASHBOARD
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans pb-32 selection:bg-emerald-500/30">
      
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />}
            <p className="text-sm font-bold leading-tight">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border-b border-slate-800 pt-12 pb-6 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-black tracking-widest uppercase mb-3">
              <Shield className="w-3 h-3 mr-1.5 text-emerald-400" /> Team Headquarters
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">{teamName}</h1>
            <p className="text-slate-400 font-medium flex items-center gap-2">
              <Users className="w-4 h-4" /> {teamMembers.length} Active Athletes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/50 px-5 py-3 rounded-2xl border border-slate-800 flex items-center gap-2 shadow-inner">
              <ChasedCash className="w-5 h-5 text-emerald-400" />
              <span className="font-black text-xl text-white">{userCoins.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8">
        
        <div className="flex gap-2 mb-8 border-b border-slate-800 pb-px overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab('leaderboards')} className={`px-6 py-3 font-bold text-sm tracking-wide transition-all border-b-2 whitespace-nowrap ${activeTab === 'leaderboards' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <Trophy className="w-4 h-4 inline mr-2 -mt-0.5" /> Leaderboards
          </button>
          <button onClick={() => setActiveTab('rewards')} className={`px-6 py-3 font-black text-sm tracking-wide transition-all border-b-2 whitespace-nowrap rounded-t-lg ${activeTab === 'rewards' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <Gift className="w-4 h-4 inline mr-2 -mt-0.5" /> Bounty & Rewards
          </button>
          <button onClick={() => setActiveTab('chat')} className={`px-6 py-3 font-bold text-sm tracking-wide transition-all border-b-2 whitespace-nowrap ${activeTab === 'chat' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <MessageSquare className="w-4 h-4 inline mr-2 -mt-0.5" /> Team Chat
          </button>
        </div>

        {/* =========================================
            TAB 1: SPORT LEADERBOARDS
        ========================================= */}
        {activeTab === 'leaderboards' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            
            {/* Sport Selector Pills */}
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {availableSports.map(sport => (
                <button 
                  key={sport}
                  onClick={() => setActiveSport(sport)}
                  className={`px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeSport === sport ? 'bg-emerald-500 text-emerald-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  {sport}
                </button>
              ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                    <Activity className="w-7 h-7 text-emerald-500" /> {activeSport} Rankings
                  </h3>
                  <p className="text-slate-400 font-medium text-sm">
                    {activeSport.includes('Track') ? 'See who runs the yard. Track & Field is ranked by Base Recruiting Score.' : `Ranked by calculated Fit Score & Skill Tier.`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col p-2 gap-2">
                {teamMembers.filter(m => m.sports.includes(activeSport)).length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-bold text-sm border border-dashed border-slate-800 rounded-2xl m-2">
                    No active competitors logged inside this bracket yet.
                  </div>
                ) : (
                  teamMembers
                    .filter(m => m.sports.includes(activeSport))
                    .sort((a, b) => {
                      const scoreA = a.sport_scores[activeSport] || 0;
                      const scoreB = b.sport_scores[activeSport] || 0;
                      if (scoreA !== scoreB) return scoreB - scoreA;
                      return a.first_name.localeCompare(b.first_name);
                    })
                    .map((athlete, idx) => {
                      const rank = idx + 1;
                      const isTop3 = rank <= 3;
                      const score = athlete.sport_scores[activeSport] || 0;
                      const isTrack = activeSport.includes('Track');
                      const tierStyles = !isTrack ? getLocalTierStyles(score) : null;
                      
                      return (
                        <Link href={`/athlete/${athlete.id}`} key={athlete.id} className={`p-4 md:p-6 flex items-center gap-4 transition-all block w-full text-left cursor-pointer group rounded-2xl ${isTop3 ? 'bg-slate-800/30 border border-slate-700/50' : 'border border-transparent hover:bg-slate-800/30'}`}>
                          <div className="w-8 shrink-0 text-center">
                            {rank === 1 ? <Crown className="w-6 h-6 mx-auto text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" /> :
                             rank === 2 ? <div className="w-6 h-6 rounded-full bg-slate-300 mx-auto border-2 border-slate-400 shadow-[0_0_8px_rgba(203,213,225,0.3)]"></div> :
                             rank === 3 ? <div className="w-6 h-6 rounded-full bg-amber-600 mx-auto border-2 border-amber-700 shadow-[0_0_8px_rgba(217,119,6,0.3)]"></div> :
                             <span className="font-black text-lg text-slate-600">#{rank}</span>}
                          </div>
                          
                          <AvatarWithBorder avatarUrl={athlete.avatar_url} borderId={athlete.equipped_border} sizeClasses="w-12 h-12 shadow-md shrink-0" />
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white truncate text-lg group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                              {athlete.first_name} {athlete.last_name}
                              {!isTrack && score > 0 && tierStyles && (
                                 <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${tierStyles.colorClass} ${tierStyles.bgClass} ${tierStyles.borderClass} hidden sm:inline-block`}>
                                   {tierStyles.tier}
                                 </span>
                              )}
                            </h4>
                            {athlete.is_premium && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md mt-1"><Star className="w-3 h-3" /> Premium</span>}
                          </div>
                          
                          <div className="text-right shrink-0 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">
                              {isTrack ? 'Recruit Score' : 'Fit Score'}
                            </span>
                            <span className={`font-black text-xl ${isTop3 ? 'text-emerald-400' : 'text-slate-300'}`}>
                              {score}
                            </span>
                          </div>
                        </Link>
                      );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            TAB 2: REWARDS & BOUNTIES
        ========================================= */}
        {activeTab === 'rewards' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-3xl p-8 relative overflow-hidden backdrop-blur-md">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/30 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
                    <Target className="w-8 h-8 text-amber-500" /> Bounty Multiplier
                  </h2>
                  <p className="text-amber-200/80 font-medium max-w-lg">
                    Earn ChasedCash for every athlete that joins your school after you. The more total athletes signed up from your school, the higher the payout multiplier grows for everyone!
                  </p>
                </div>
                <div className="text-center bg-slate-950/50 p-6 rounded-2xl border border-amber-500/30 backdrop-blur-md shrink-0 min-w-[200px]">
                  <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">Current Yield</p>
                  <p className="text-5xl font-black text-white">{multiplier.toFixed(2)}x</p>
                  <p className="text-sm font-bold text-amber-200/60 mt-2">{payoutPerAthlete} Cash / recruit</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col shadow-xl relative">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-white mb-1">Unclaimed Recruits</h3>
                    <p className="text-sm text-slate-400 font-medium">Athletes who joined since your last claim.</p>
                  </div>
                  <div className="bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 text-right">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Pending Cash</p>
                    <p className="text-xl font-black text-emerald-400">+{totalPendingCash.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-3 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {claimableRecruits.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-2xl">
                      <Users className="w-8 h-8 text-slate-600 mb-3" />
                      <p className="text-slate-400 font-bold">No new recruits yet.</p>
                      <p className="text-slate-500 text-sm mt-1">Tell your team to sign up to earn bounties!</p>
                    </div>
                  ) : (
                    claimableRecruits.map(recruit => (
                      <div key={recruit.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AvatarWithBorder avatarUrl={recruit.avatar_url} borderId={recruit.equipped_border} sizeClasses="w-10 h-10" />
                          <div>
                            <p className="font-bold text-white text-sm">{recruit.first_name} {recruit.last_name}</p>
                            <p className="text-xs text-slate-500 font-medium">{new Date(recruit.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-black text-sm">+{payoutPerAthlete}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{multiplier.toFixed(2)}x Boost</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button 
                  onClick={handleClaimRecruitRewards}
                  disabled={claimableRecruits.length === 0 || isClaiming}
                  className="w-full mt-auto bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-emerald-950 font-black py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isClaiming ? 'Claiming...' : `Claim +${totalPendingCash.toLocaleString()} ChasedCash`} <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col shadow-xl">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-fuchsia-500" /> Team Milestones
                  </h3>
                  <p className="text-sm text-slate-400 font-medium">Every 10 athletes unlocks massive rewards for the entire roster.</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-8">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Next Milestone</p>
                      <p className="text-lg font-black text-white">{nextMilestone} Athletes</p>
                    </div>
                    <p className="text-fuchsia-400 font-black text-xl">{teamMembers.length} / {nextMilestone}</p>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden">
                    <div className="bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 h-full rounded-full transition-all duration-1000" style={{ width: `${(progressToNext / 10) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-center text-slate-500 font-bold mt-3">{10 - progressToNext} more recruits to unlock!</p>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                  {milestones.length === 0 ? (
                    <div className="text-center p-6">
                      <p className="text-slate-500 font-bold text-sm">Hit 10 total members to unlock your first milestone.</p>
                    </div>
                  ) : (
                    milestones.reverse().map(ms => {
                      const isClaimed = claimedMilestones.has(ms);
                      return (
                        <div key={ms} className={`border p-4 rounded-2xl flex items-center justify-between transition-all ${isClaimed ? 'bg-slate-950/50 border-slate-800 opacity-60' : 'bg-fuchsia-500/10 border-fuchsia-500/30'}`}>
                          <div>
                            <p className={`font-black ${isClaimed ? 'text-slate-400' : 'text-fuchsia-400'}`}>{ms} Athlete Milestone</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Reward: Premium / 1k Cash</p>
                          </div>
                          {isClaimed ? (
                            <span className="text-slate-500 text-xs font-black uppercase tracking-widest bg-slate-900 px-3 py-1.5 rounded-lg">Claimed</span>
                          ) : (
                            <button 
                              onClick={() => handleClaimMilestone(ms)}
                              disabled={isClaiming}
                              className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-black px-4 py-2 rounded-lg transition-colors shadow-[0_0_10px_rgba(192,38,211,0.3)] disabled:opacity-50"
                            >
                              Claim Reward
                            </button>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =========================================
            TAB 3: TEAM CHAT
        ========================================= */}
        {activeTab === 'chat' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col h-[600px] overflow-hidden shadow-xl">
            <div className="p-4 md:p-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-blue-500" /> Team Locker Room
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-950/50 custom-scrollbar">
              {chatMessages.map(msg => {
                const isMe = msg.sender_id === currentUser?.id;
                const isSystem = msg.sender_id === 'sys';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-6">
                      <span className="bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{msg.text}</span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <Link href={`/athlete/${msg.sender_id}`} className="text-[10px] font-bold text-slate-500 hover:text-blue-400 transition-colors mb-1 ml-1">{msg.sender_name}</Link>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm md:text-base font-medium ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Message the team..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition-colors"
                />
                <button type="submit" disabled={!chatInput.trim()} className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-colors disabled:opacity-50">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}