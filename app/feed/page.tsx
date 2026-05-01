'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation'; 
import { MessageSquare, Send, Clock, ShieldCheck, CheckCircle2, MapPin, Mail, Lock, X, Trophy, GraduationCap, ChevronDown, School, UserCircle2, Users, Coffee, Globe, Reply, AlertCircle, MoreHorizontal, Flag, Flame, Target, Image as ImageIcon, Crown, Sparkles, Rocket, EyeOff, FileText, Search, Filter, BookmarkPlus, BookmarkCheck, BarChart3, RefreshCw, Save, Timer } from 'lucide-react';
import Link from 'next/link';

import { AvatarWithBorder } from '@/components/AnimatedBorders';

// 🚨 MASTER PROMOTION SWITCH 🚨
// Change to false to disable the 1-Month Free Pro promotion for a user's first post.
const PROMOTION_FIRST_POST_FREE_MONTH = true;

const BAD_WORDS = ['fuck', 'shit', 'bitch', 'ass', 'asshole', 'dick', 'pussy', 'cunt', 'slut', 'whore', 'fag', 'faggot', 'nigger', 'nigga', 'retard', 'bastard', 'motherfucker'];

const containsBadWords = (text: string) => {
  return BAD_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  });
};

const TRACK_EVENTS = [
  '50 Meters', '55 Meters', '60 Meters', '100 Meters', '150 Meters', '200 Meters', '300 Meters', '400 Meters', '500 Meters', '600 Meters', '800 Meters', '1000 Meters', '1500 Meters', '1600 Meters', '1 Mile', '3000 Meters', '3200 Meters', '2 Mile', '5000 Meters', '10,000 Meters', '100m Hurdles', '110m Hurdles', '200m Hurdles', '300m Hurdles', '400m Hurdles', 'Shot Put', 'Discus', 'Javelin', 'Hammer', 'Weight Throw', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump', 'Pentathlon', 'Heptathlon', 'Decathlon'
];

const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

const TIER_THRESHOLDS: Record<string, number> = {
  'Power 4 D1': 95,
  'Mid-Major D1': 85,
  'D1 Walk-On / Top D2': 75,
  'Solid D2 / High D3': 65,
  'D3 / NAIA': 55,
  'Strong Varsity': 40,
  'Varsity Standard': 20,
  'Any': 5
};

const EARNED_TITLES = [
  { id: 'legend', name: 'Legend', badgeClass: 'legend-badge' },
  { id: 'champion', name: 'Champion', badgeClass: 'champion-badge' },
  { id: 'elite', name: 'Elite', badgeClass: 'elite-badge' },
  { id: 'master', name: 'Master', badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300' },
  { id: 'contender', name: 'Contender', badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
  { id: 'challenger', name: 'Challenger', badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300' },
  { id: 'prospect', name: 'Prospect', badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300' },
];

const PRO_BADGES = [
  { id: 'visiting', label: '✈️ Planning Visits', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  { id: 'academic', label: '📚 High Academic', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'ready', label: '✍️ Ready to Sign', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'rising', label: '🚀 Fast Riser', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
];

interface AthleteData {
  id: string;
  first_name: string;
  last_name: string;
  high_school: string;
  state: string;
  gender: string;
  avatar_url: string | null;
  trust_level: number;
  prs: { event: string; mark: string }[] | null;
  equipped_border?: string | null;
  equipped_title?: string | null; 
  majors?: string | null;
  grad_year?: number | null;
  is_premium?: boolean; 
  boosts_available?: number;
  saved_resume?: string | null; 
  profile_views?: number;
}

interface CommentData {
  id: string; athlete_id: string; name: string; avatar_url: string | null; border: string | null; text: string; created_at: string;
}

interface Post {
  id: string; content: string; created_at: string; athlete_id: string; linked_pr_event?: string | null; linked_pr_mark?: string | null;  
  linked_prs?: { event: string; mark: string }[] | null; channel?: string | null; image_url?: string | null; likes?: string[]; 
  is_bounty?: boolean; bounty_amount?: number; comments?: CommentData[]; pro_badge?: string | null; is_boosted?: boolean;
  hide_rank?: boolean; attached_resume?: string | null; athletes: AthleteData;
}

// 🚨 EXTRACTED MATH HELPER FUNCTIONS 🚨
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
    '200m Hurdles': { t1: 24.5, t2: 25.5, t3: 26.5, t4: 27.5, t5: 29.0, t6: 30.5, t7: 33.0 },
    '300m Hurdles': { t1: 37.0, t2: 38.5, t3: 39.5, t4: 41.0, t5: 42.5, t6: 44.5, t7: 48.0 },
    '400m Hurdles': { t1: 52.0, t2: 54.0, t3: 56.0, t4: 58.0, t5: 60.0, t6: 63.0, t7: 68.0 },
    'Long Jump': { t1: 288, t2: 270, t3: 260, t4: 252, t5: 240, t6: 228, t7: 204, isField: true }, 
    'Triple Jump': { t1: 588, t2: 564, t3: 540, t4: 516, t5: 492, t6: 468, t7: 420, isField: true }, 
    'High Jump': { t1: 82, t2: 78, t3: 76, t4: 74, t5: 70, t6: 66, t7: 60, isField: true }, 
    'Pole Vault': { t1: 198, t2: 186, t3: 174, t4: 162, t5: 150, t6: 132, t7: 108, isField: true },
    'Shot Put': { t1: 720, t2: 660, t3: 600, t4: 540, t5: 480, t6: 444, t7: 360, isField: true }, 
    'Discus': { t1: 2220, t2: 2040, t3: 1860, t4: 1740, t5: 1620, t6: 1440, t7: 1080, isField: true },
    'Javelin': { t1: 2340, t2: 2160, t3: 2040, t4: 1920, t5: 1800, t6: 1620, t7: 1200, isField: true },
    'Hammer': { t1: 2400, t2: 2160, t3: 1920, t4: 1740, t5: 1560, t6: 1320, t7: 960, isField: true }
  },
  'Girls': {
    '60 Meters': { t1: 7.45, t2: 7.65, t3: 7.85, t4: 8.05, t5: 8.30, t6: 8.60, t7: 9.20 },
    '100 Meters': { t1: 11.7, t2: 12.1, t3: 12.4, t4: 12.8, t5: 13.2, t6: 13.6, t7: 14.5 },
    '200 Meters': { t1: 24.2, t2: 24.8, t3: 25.5, t4: 26.2, t5: 27.0, t6: 28.5, t7: 31.0 },
    '400 Meters': { t1: 54.5, t2: 57.0, t3: 58.5, t4: 60.5, t5: 63.0, t6: 66.0, t7: 72.0 },
    '800 Meters': { t1: 130, t2: 135, t3: 140, t4: 145, t5: 152, t6: 160, t7: 175 }, 
    '1500 Meters': { t1: 268, t2: 282, t3: 291, t4: 300, t5: 314, t6: 330, t7: 375 },
    '1600 Meters': { t1: 290, t2: 305, t3: 315, t4: 325, t5: 340, t6: 360, t7: 400 }, 
    '3000 Meters': { t1: 583, t2: 611, t3: 638, t4: 666, t5: 694, t6: 730, t7: 840 },
    '3200 Meters': { t1: 630, t2: 660, t3: 690, t4: 720, t5: 750, t6: 800, t7: 900 }, 
    '100m Hurdles': { t1: 13.8, t2: 14.3, t3: 14.8, t4: 15.5, t5: 16.5, t6: 17.8, t7: 20.0 },
    '200m Hurdles': { t1: 28.0, t2: 29.0, t3: 30.5, t4: 32.0, t5: 34.0, t6: 36.0, t7: 40.0 },
    '300m Hurdles': { t1: 42.5, t2: 44.5, t3: 46.5, t4: 48.5, t5: 51.0, t6: 54.0, t7: 59.0 },
    '400m Hurdles': { t1: 60.0, t2: 63.0, t3: 66.0, t4: 69.0, t5: 72.0, t6: 76.0, t7: 85.0 },
    'Long Jump': { t1: 234, t2: 222, t3: 210, t4: 198, t5: 186, t6: 174, t7: 150, isField: true }, 
    'Triple Jump': { t1: 480, t2: 456, t3: 432, t4: 408, t5: 384, t6: 360, t7: 312, isField: true },
    'High Jump': { t1: 68, t2: 64, t3: 62, t4: 60, t5: 58, t6: 54, t7: 50, isField: true }, 
    'Pole Vault': { t1: 156, t2: 144, t3: 132, t4: 120, t5: 108, t6: 90, t7: 72, isField: true },
    'Shot Put': { t1: 540, t2: 480, t3: 432, t4: 396, t5: 360, t6: 324, t7: 264, isField: true }, 
    'Discus': { t1: 1800, t2: 1620, t3: 1500, t4: 1380, t5: 1260, t6: 1080, t7: 840, isField: true },
    'Javelin': { t1: 1740, t2: 1560, t3: 1440, t4: 1320, t5: 1200, t6: 1020, t7: 780, isField: true },
    'Hammer': { t1: 1920, t2: 1680, t3: 1500, t4: 1320, t5: 1140, t6: 960, t7: 720, isField: true }
  }
};

const convertMarkToNumber = (markStr: string, isField: boolean): number => {
  if (isField) {
    const clean = markStr.replace(/[^0-9.]/g, ' ').trim().split(/\s+/);
    const feet = parseFloat(clean[0]) || 0;
    const inches = parseFloat(clean[1]) || 0;
    return (feet * 12) + inches;
  } else {
    if (markStr.includes(':')) {
      const parts = markStr.split(':');
      return (parseFloat(parts[0]) * 60) + parseFloat(parts[1]);
    }
    return parseFloat(markStr.replace(/[a-zA-Z]/g, '').trim()) || 99999;
  }
};

const formatMarkFromNumber = (val: number, isField: boolean): string => {
  if (isField) {
    const feet = Math.floor(val / 12);
    const inches = val % 12;
    if (feet > 0) return `${feet}' ${inches.toFixed(1).replace(/\.0$/, '')}"`;
    return `${inches.toFixed(1).replace(/\.0$/, '')}"`;
  } else {
    if (val >= 60) {
      const minutes = Math.floor(val / 60);
      const seconds = (val % 60).toFixed(2).padStart(5, '0');
      return `${minutes}:${seconds}`;
    }
    return val.toFixed(2);
  }
};

const parseMarkForSorting = (mark: string, event: string): number => {
  const isField = FIELD_EVENTS.includes(event);
  const val = convertMarkToNumber(mark, isField);
  return isField ? -val : val;
};

const getEventScore = (markStr: string, event: string, gender: string): number => {
  const standards = RECRUITING_STANDARDS[gender] || RECRUITING_STANDARDS['Boys'];
  const normalizedEvent = event
    .replace(/Meter\b/i, 'Meters')
    .replace('100 Meter Hurdles', '100m Hurdles')
    .replace('110 Meter Hurdles', '110m Hurdles')
    .replace('200 Meter Hurdles', '200m Hurdles')
    .replace('300 Meter Hurdles', '300m Hurdles')
    .replace('400 Meter Hurdles', '400m Hurdles');

  const eventStds = standards[normalizedEvent] || standards[event];
  if (!eventStds) return 5;

  const val = convertMarkToNumber(markStr, !!eventStds.isField);
  let score = 5;

  if (eventStds.isField) {
    if (val >= eventStds.t1) score = 95 + Math.min(4, ((val - eventStds.t1) / (eventStds.t1 * 0.05)) * 4);
    else if (val >= eventStds.t2) score = 85 + ((val - eventStds.t2) / (eventStds.t1 - eventStds.t2)) * 10;
    else if (val >= eventStds.t3) score = 75 + ((val - eventStds.t3) / (eventStds.t2 - eventStds.t3)) * 10;
    else if (val >= eventStds.t4) score = 65 + ((val - eventStds.t4) / (eventStds.t3 - eventStds.t4)) * 10;
    else if (val >= eventStds.t5) score = 55 + ((val - eventStds.t5) / (eventStds.t4 - eventStds.t5)) * 10;
    else if (val >= eventStds.t6) score = 40 + ((val - eventStds.t6) / (eventStds.t5 - eventStds.t6)) * 14;
    else if (val >= eventStds.t7) score = 20 + ((val - eventStds.t7) / (eventStds.t6 - eventStds.t7)) * 19;
    else { const t8 = eventStds.t7 * 0.85; if (val >= t8) { score = 5 + ((val - t8) / (eventStds.t7 - t8)) * 14; } }
  } else {
    if (val <= eventStds.t1) score = 95 + Math.min(4, ((eventStds.t1 - val) / (eventStds.t1 * 0.05)) * 4);
    else if (val <= eventStds.t2) score = 85 + ((eventStds.t2 - val) / (eventStds.t2 - eventStds.t1)) * 10;
    else if (val <= eventStds.t3) score = 75 + ((eventStds.t3 - val) / (eventStds.t3 - eventStds.t2)) * 10;
    else if (val <= eventStds.t4) score = 65 + ((eventStds.t4 - val) / (eventStds.t4 - eventStds.t3)) * 10;
    else if (val <= eventStds.t5) score = 55 + ((eventStds.t5 - val) / (eventStds.t5 - eventStds.t4)) * 10;
    else if (val <= eventStds.t6) score = 40 + ((eventStds.t6 - val) / (eventStds.t6 - eventStds.t5)) * 14;
    else if (val <= eventStds.t7) score = 20 + ((eventStds.t7 - val) / (eventStds.t7 - eventStds.t6)) * 19;
    else { const t8 = eventStds.t7 * 1.15; if (val <= t8) { score = 5 + ((t8 - val) / (t8 - eventStds.t7)) * 14; } }
  }
  return Math.min(99, Math.max(5, Math.round(score)));
};

interface ProjectionResult {
  overallScore: number;
  overallLabel: string;
  overallDesc: string;
  color: string;
  bg: string;
  border: string;
  bestEvent: string;
  eventBreakdowns: any[];
}

const getAthleteProjection = (prs: any[], gender: string): ProjectionResult => {
  if (!prs || !Array.isArray(prs) || prs.length === 0) return { overallScore: 0, overallLabel: 'Unranked', overallDesc: '', color: 'text-slate-500', bg: '', border: '', bestEvent: 'N/A', eventBreakdowns: [] };

  let bestScore = 0;
  let bestTier = 'Developmental';

  prs.forEach((pr) => {
    if (!pr.event || !pr.mark) return;
    const score = getEventScore(pr.mark, pr.event, gender);
    if (score > bestScore) bestScore = score;
  });

  bestScore = Math.min(99, Math.max(5, Math.round(bestScore)));
  let color = '';
  
  if (bestScore >= 95) { bestTier = 'Power 4 D1'; color = 'text-fuchsia-600'; }
  else if (bestScore >= 85) { bestTier = 'Mid-Major D1'; color = 'text-purple-600'; }
  else if (bestScore >= 75) { bestTier = 'D1 Walk-On'; color = 'text-blue-600'; }
  else if (bestScore >= 65) { bestTier = 'Top D2/D3'; color = 'text-emerald-600'; }
  else if (bestScore >= 55) { bestTier = 'NAIA Prospect'; color = 'text-amber-600'; }
  else if (bestScore >= 40) { bestTier = 'Strong Varsity'; color = 'text-slate-600'; }
  else if (bestScore >= 20) { bestTier = 'Varsity Standard'; color = 'text-slate-500'; }
  else { bestTier = 'JV Standard'; color = 'text-slate-400'; }

  return { overallScore: bestScore, overallLabel: bestTier, overallDesc: '', color, bg: '', border: '', bestEvent: prs[0]?.event || 'N/A', eventBreakdowns: [] };
};

export default function FeedPage() {
  const supabase = createClient();
  const router = useRouter(); 
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(''); 
  const [currentUserProfile, setCurrentUserProfile] = useState<AthleteData | null>(null);
  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');
  const [coachType, setCoachType] = useState<string | null>(null);
  const [isVerifiedAthlete, setIsVerifiedAthlete] = useState(false);
  const [isVerifiedCoach, setIsVerifiedCoach] = useState(false);
  const [isPremiumCoach, setIsPremiumCoach] = useState(false);
  const [myPRs, setMyPRs] = useState<{event: string, mark: string}[]>([]);
  const [isGraduated, setIsGraduated] = useState(false);
  const [coachWatchlist, setCoachWatchlist] = useState<string[]>([]);
  
  const [feedTab, setFeedTab] = useState<'recruiting' | 'athlete' | 'bounties' | 'legacy'>('recruiting');

  // 🚨 FILTER ENGINE STATE (Includes timeMin for TS Safety) 🚨
  const [discoveryFilters, setDiscoveryFilters] = useState({ gender: 'Any', gradYear: 'Any', state: '', event: '', targetTier: 'Any', timeMin: '' });
  const [activeFilters, setActiveFilters] = useState({ gender: 'Any', gradYear: 'Any', state: '', event: '', targetTier: 'Any', timeMin: '' });
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPRIndex, setSelectedPRIndex] = useState<string>(''); 
  const [selectedPRs, setSelectedPRs] = useState<number[]>([]); 
  const [myMajors, setMyMajors] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null); 
  const [selectedProBadge, setSelectedProBadge] = useState<string | null>(null);
  const [hideRank, setHideRank] = useState(false);
  
  const [showResumeInput, setShowResumeInput] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [viewingResumePost, setViewingResumePost] = useState<Post | null>(null);

  const postInputRef = useRef<HTMLTextAreaElement>(null); 
  const [isPosting, setIsPosting] = useState(false);
  const [timeUntilNextPost, setTimeUntilNextPost] = useState<string | null>(null);
  
  const [isBoosting, setIsBoosting] = useState(false);
  const [postToBoost, setPostToBoost] = useState<string | null>(null);

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'pitch' | 'chat'>('pitch');
  const [selectedPostForMessage, setSelectedPostForMessage] = useState<Post | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); 
  
  const [senderName, setSenderName] = useState('');
  const [senderSchool, setSenderSchool] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const hasLoggedImpression = useRef(false);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const canMessageAthlete = (gradYear: number | null) => {
    if (viewerRole !== 'coach') return true; 
    if (!gradYear) return true; 
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const isPastJune15 = today.getMonth() > 5 || (today.getMonth() === 5 && today.getDate() >= 15);
    
    const sophomoreYear = gradYear - 2;
    if (currentYear > sophomoreYear || (currentYear === sophomoreYear && isPastJune15)) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchFeedAndUser();
  }, [supabase]);

  async function fetchFeedAndUser() {
    const { data: { session } } = await supabase.auth.getSession();
    
    let isCoachCheck = false;

    if (session) {
      setCurrentUserId(session.user.id);
      setCurrentUserEmail(session.user.email || '');

      const { data: cData, error: cError } = await supabase.from('coaches').select('*').eq('id', session.user.id).maybeSingle();
      if (cError) console.error("🚨 Coach Fetch Error:", cError);
      
      if (cData) {
        isCoachCheck = true;
        setViewerRole('coach');
        setIsVerifiedCoach(cData.is_verified === true);
        setIsPremiumCoach(cData.is_premium === true);
        setCoachType(cData.coach_type || 'college');
        setSenderName(`Coach ${cData.last_name || cData.name || ''}`);
        setSenderSchool(cData.school_name || cData.name || 'College Program');
        setSenderEmail(session.user.email || '');
        setFeedTab('recruiting'); 

        const { data: savedData } = await supabase.from('saved_recruits').select('athlete_id').eq('coach_id', session.user.id);
        if (savedData) setCoachWatchlist(savedData.map(s => s.athlete_id));

      } else {
        const { data: aData } = await supabase
          .from('athletes')
          .select('id, first_name, last_name, high_school, state, gender, avatar_url, trust_level, prs, equipped_border, equipped_title, majors, grad_year, is_premium, boosts_available, saved_resume, profile_views')
          .eq('id', session.user.id)
          .maybeSingle();

        if (aData) {
          setViewerRole('athlete');
          setIsVerifiedAthlete(aData.trust_level > 0);
          setCurrentUserProfile(aData as AthleteData);
          setMyMajors(aData.majors || '');
          setSenderName(`${aData.first_name} ${aData.last_name}`);
          setSenderSchool(aData.high_school || '');
          setSenderEmail(session.user.email || '');
          setResumeText(aData.saved_resume || ''); 
          
          if (aData.prs) setMyPRs(aData.prs);

          if (aData.grad_year) {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth(); 
            const activeGradYearCutoff = currentMonth > 5 ? currentYear + 1 : currentYear;
            if (aData.grad_year < activeGradYearCutoff) {
              setIsGraduated(true);
            }
          }
          
          if (aData.trust_level > 0) {
            const { data: recentPosts } = await supabase
              .from('posts')
              .select('created_at, channel')
              .eq('athlete_id', session.user.id)
              .order('created_at', { ascending: false })
              .limit(10);

            const lastMainPost = recentPosts?.find(p => !p.channel || p.channel === 'recruiting');

            if (lastMainPost) {
              const lastPostTime = new Date(lastMainPost.created_at).getTime();
              const currentTime = new Date().getTime();
              const hoursSinceLastPost = (currentTime - lastPostTime) / (1000 * 60 * 60);

              if (hoursSinceLastPost < 24) {
                const hoursLeft = Math.ceil(24 - hoursSinceLastPost);
                setTimeUntilNextPost(`${hoursLeft}h remaining`);
              }
            }
          }
        }
      }
    }

    const { data: feedData } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, athlete_id, linked_pr_event, linked_pr_mark, linked_prs, channel, image_url, likes, is_bounty, bounty_amount, comments, pro_badge, is_boosted, hide_rank, attached_resume,
        athletes (id, first_name, last_name, high_school, state, gender, avatar_url, trust_level, prs, equipped_border, equipped_title, majors, grad_year, is_premium, profile_views)
      `);
    
    const now = new Date().getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    const processedPosts = (feedData || []).map((post: any) => {
      let activeBoost = post.is_boosted;
      if (activeBoost) {
        const postAge = now - new Date(post.created_at).getTime();
        if (postAge > TWENTY_FOUR_HOURS) activeBoost = false;
      }
      return { ...post, is_boosted: activeBoost };
    });

    processedPosts.sort((a, b) => {
      if (a.is_boosted && !b.is_boosted) return -1;
      if (!a.is_boosted && b.is_boosted) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setPosts(processedPosts as Post[]);

    if (isCoachCheck && feedData && feedData.length > 0 && !hasLoggedImpression.current) {
       hasLoggedImpression.current = true; 
       const uniqueAthleteIds = Array.from(new Set(feedData.map((p: any) => p.athlete_id)));
       if (uniqueAthleteIds.length > 0) {
           const { error } = await supabase.rpc('increment_search_appearances', { athlete_ids: uniqueAthleteIds });
           if (error) console.error("🚨 Feed Impression Error:", error);
       }
    }

    setLoading(false);
  }

  const handleViewProfile = (athleteId: string) => {
    router.push(`/athlete/${athleteId}`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast("Only images are supported at this time.", "error"); e.target.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { showToast("Images must be under 5MB. Please compress your image.", "error"); e.target.value = ''; return; }
    setMediaFile(file);
  };

  const handleTogglePRSelection = (index: number) => {
    setSelectedPRs(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    if (feedTab === 'recruiting' && timeUntilNextPost) return; 

    const isPremium = currentUserProfile?.is_premium;

    let contentToSubmit = newPostContent.trim();
    if (feedTab === 'recruiting' && !isPremium) {
      const prLinked = selectedPRIndex !== '' ? myPRs[Number(selectedPRIndex)] : null;
      let automatedPitch = "I am officially looking for college track and field opportunities!";
      if (myMajors) automatedPitch += ` I am planning to major in ${myMajors}.`;
      if (prLinked) automatedPitch += ` Check out my verified mark in the ${prLinked.event}.`;
      contentToSubmit = automatedPitch;
    }

    if (!contentToSubmit) return;

    if (containsBadWords(contentToSubmit) || (showResumeInput && containsBadWords(resumeText))) {
      showToast("Your update contains inappropriate language.");
      return;
    }
    
    setIsPosting(true);
    try {
      let grantedPremiumNow = false;
      const hasPostedBefore = posts.some(p => p.athlete_id === currentUserId);
      
      let updates: any = {};
      if (feedTab === 'recruiting') {
        updates.majors = myMajors;
        if (isPremium && showResumeInput) updates.saved_resume = resumeText;
      }

      // 🚨 PROMOTION LOGIC: FIRST POST GIVES PREMIUM 🚨
      if (PROMOTION_FIRST_POST_FREE_MONTH && !hasPostedBefore && !isPremium) {
        updates.is_premium = true;
        
        // Calculate 30 days from now for expiration
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        updates.premium_expires_at = expiryDate.toISOString();
        
        grantedPremiumNow = true;
      }

      if (Object.keys(updates).length > 0) {
        // 🚨 EXPLICIT ERROR CATCHING ADDED HERE 🚨
        const { error: profileUpdateError } = await supabase
          .from('athletes')
          .update(updates)
          .eq('id', currentUserId);
          
        if (profileUpdateError) {
          console.error("Supabase rejected the profile update:", profileUpdateError);
          throw new Error(`Failed to apply premium: ${profileUpdateError.message}`);
        }
      }

      let uploadedMediaUrl = null;
      if (mediaFile) uploadedMediaUrl = URL.createObjectURL(mediaFile); 

      const finalLinkedPRs = isPremium 
        ? selectedPRs.map(i => myPRs[i]) 
        : (selectedPRIndex !== '' ? [myPRs[Number(selectedPRIndex)]] : null);

      const finalBadge = (feedTab === 'recruiting' && isPremium) ? selectedProBadge : null;
      const finalHideRank = isPremium ? hideRank : false;
      const finalAttachedResume = (feedTab === 'recruiting' && isPremium && showResumeInput && resumeText.trim()) ? resumeText : null;
      
      const { error } = await supabase.from('posts').insert({
        athlete_id: currentUserId,
        content: contentToSubmit,
        linked_prs: finalLinkedPRs,
        channel: feedTab,
        image_url: uploadedMediaUrl,
        pro_badge: finalBadge,
        hide_rank: finalHideRank,
        attached_resume: finalAttachedResume
      });

      if (error) throw error;
      
      setNewPostContent(''); setSelectedPRIndex(''); setSelectedPRs([]); setMediaFile(null); setSelectedProBadge(null); setHideRank(false); setShowResumeInput(false);
      if (feedTab === 'recruiting') setTimeUntilNextPost('24h remaining');
      
      if (grantedPremiumNow) {
        showToast("🎉 Promo Unlocked: You earned 1 Month of Free Pro for your first post!", "success");
      } else {
        showToast("Posted successfully!", "success");
      }
      
      fetchFeedAndUser(); 
    } catch (err: any) { showToast(`Error posting: ${err.message}`); } finally { setIsPosting(false); }
  };

  const handleBoostClick = (postId: string) => {
    if (!currentUserProfile) return;
    const availableBoosts = currentUserProfile.boosts_available || 0;
    if (availableBoosts <= 0) { showToast("You are out of Boosts! Upgrade or visit the Vault to get more.", "error"); return; }
    setPostToBoost(postId);
  };

  const confirmBoost = async () => {
    if (!postToBoost || !currentUserProfile || !currentUserId) return;
    setIsBoosting(true);
    const availableBoosts = currentUserProfile.boosts_available || 0;

    try {
      const { error } = await supabase.rpc('apply_post_boost', { p_post_id: postToBoost, p_athlete_id: currentUserId });
      if (error) throw error;

      setPosts(currentPosts => {
        const updated = currentPosts.map(post => post.id === postToBoost ? { ...post, is_boosted: true } : post);
        return updated.sort((a, b) => {
          if (a.is_boosted && !b.is_boosted) return -1;
          if (!a.is_boosted && b.is_boosted) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      });
      
      setCurrentUserProfile({ ...currentUserProfile, boosts_available: availableBoosts - 1 });
      showToast(`Post Boosted! You have ${availableBoosts - 1} boosts left.`, "success");
    } catch (err: any) { showToast("Failed to boost: " + err.message); } finally { setIsBoosting(false); setPostToBoost(null); }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim() || !currentUserId) return;
    if (containsBadWords(text)) { showToast("Your text contains inappropriate language."); return; }

    setIsSubmittingComment(true);
    try {
      const myAvatar = viewerRole === 'coach' ? null : currentUserProfile?.avatar_url;
      const myBorder = viewerRole === 'coach' ? 'none' : currentUserProfile?.equipped_border;

      const newComment: CommentData = {
        id: Math.random().toString(), 
        athlete_id: currentUserId,
        name: currentUserProfile ? `${currentUserProfile.first_name} ${currentUserProfile.last_name}` : senderName,
        avatar_url: myAvatar || '', 
        border: myBorder || 'none',
        text: text.trim(),
        created_at: new Date().toISOString()
      };

      setPosts(currentPosts => currentPosts.map(post => {
        if (post.id === postId) return { ...post, comments: [...(post.comments || []), newComment] };
        return post;
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));

      const { error } = await supabase.rpc('add_post_comment', { 
        p_post_id: postId, p_athlete_id: currentUserId, p_name: newComment.name, p_avatar_url: newComment.avatar_url, p_border: newComment.border, p_text: newComment.text
      });
      if (error) throw error;
    } catch (err: any) { showToast("Failed to submit: " + err.message); } finally { setIsSubmittingComment(false); }
  };

  const toggleComments = (postId: string) => { setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] })); };

  const handleToggleFire = async (postId: string) => {
    if (!currentUserId) { router.push('/login'); return; }

    setPosts(currentPosts => currentPosts.map(post => {
      if (post.id === postId) {
        const likes = post.likes || [];
        const hasLiked = likes.includes(currentUserId);
        const newLikes = hasLiked ? likes.filter(id => id !== currentUserId) : [...likes, currentUserId];
        return { ...post, likes: newLikes };
      }
      return post;
    }));
    await supabase.rpc('toggle_post_like', { p_post_id: postId, p_user_id: currentUserId });
  };

  const handleContactClick = (post: Post) => {
    if (viewerRole === 'guest' || !currentUserId) { router.push('/login?reason=contact'); return; }
    if (viewerRole === 'coach' && !isVerifiedCoach) { showToast("Please verify your coaching profile on the dashboard to send direct pitches."); return; }
    if (viewerRole === 'athlete' && !isVerifiedAthlete) { showToast("Please sync your Athletic.net profile to message other athletes."); return; }
    
    if (viewerRole === 'coach' && post.athletes.grad_year && !canMessageAthlete(post.athletes.grad_year)) {
      showToast("NCAA Compliance: You cannot directly message athletes prior to June 15th after their sophomore year.", "error");
      return;
    }

    openMessageModal(post, 'pitch');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostForMessage) return;
    if (containsBadWords(messageContent)) return showToast("Keep it clean.");

    setIsSending(true);
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const checkEmail = currentUserEmail || senderEmail;
      
      const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('sender_email', checkEmail).gte('created_at', twentyFourHoursAgo);
      if (count !== null && count >= 10) { showToast("Daily Limit Reached: You can only send 10 new connection requests or pitches per day."); setIsSending(false); return; }

      const { error } = await supabase.from('messages').insert({
        athlete_id: selectedPostForMessage.athlete_id,
        sender_name: senderName, 
        sender_school: senderSchool, 
        sender_email: senderEmail, 
        content: `[In response to your Recruiting Pitch]:\n\n${messageContent}`,
        status: 'pending' 
      });
      
      if (error) throw error;
      setSendSuccess(true);
      setTimeout(() => { setIsMessageModalOpen(false); setSendSuccess(false); setMessageContent(''); }, 2000);
    } catch (error: any) { showToast(`Failed to send message: ${error.message}`); } finally { setIsSending(false); }
  };

  const openMessageModal = (post: Post, mode: 'pitch' | 'chat') => {
    setSelectedPostForMessage(post); setModalMode(mode); setSendSuccess(false); setIsMessageModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString); const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    if (isToday) return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getListGlowClass = (border?: string | null, isBoosted?: boolean, isPremium?: boolean) => {
    if (isBoosted) return 'ring-[3px] ring-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.3)] bg-slate-900 z-20 border-transparent';
    if (isPremium) return 'bg-slate-900 border-slate-800 text-slate-200 hover:z-10 shadow-xl';
    
    if (border === 'border-legend') return 'list-item-legend bg-white';
    if (border === 'border-champion') return 'list-item-champion bg-white';
    if (border === 'border-elite') return 'list-item-elite bg-white';
    
    return 'bg-white border-slate-200 hover:z-10 hover:bg-slate-50/50 shadow-sm'; 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Network...</p>
      </div>
    );
  }

  // 🚨 RECRUITING FEED FILTER & DEDUPLICATION ALGORITHM 🚨
  let filteredPosts = posts.filter(post => {
    
    // Tab logic
    if (feedTab === 'recruiting') {
      if (post.channel && post.channel !== 'recruiting' && post.channel !== 'main') return false;
    } else if (feedTab === 'bounties') {
      if (!post.is_bounty) return false;
    } else {
      if (post.channel !== feedTab) return false;
    }

    // Interactive Filtering Logic (Only in Recruiting Tab)
    if (feedTab === 'recruiting' && isApplyingFilters) {
      
      // 🚨 PRO BYPASS RULE: If free coach, Boosted posts ALWAYS bypass filters and show at the top.
      // If Pro Coach, they don't get the bypass immunity; they are strictly filtered out if they don't match.
      if (!isPremiumCoach && post.is_boosted) {
        return true; 
      }

      const a = post.athletes;
      
      if (activeFilters.gender !== 'Any' && a.gender !== activeFilters.gender) return false;
      if (activeFilters.gradYear !== 'Any' && a.grad_year?.toString() !== activeFilters.gradYear) return false;
      if (activeFilters.state && a.state?.toLowerCase() !== activeFilters.state.toLowerCase()) return false;

      // FREE COACHES ONLY GET EVENT FILTER (NO TIER, NO TIME MIN)
      if (!isPremiumCoach) {
         if (activeFilters.event && activeFilters.event !== 'Any Event') {
            const hasEvent = a.prs?.some(p => p.event === activeFilters.event);
            if (!hasEvent) return false;
         }
         return true;
      }

      // PRO COACHES GET TIER AND TIME MIN
      const reqTierScore = TIER_THRESHOLDS[activeFilters.targetTier] || 5;
      
      if (activeFilters.event || reqTierScore > 5 || activeFilters.timeMin) {
        if (!a.prs || a.prs.length === 0) return false;
        
        let passesEventCriteria = false;
        
        if (activeFilters.event && activeFilters.event !== 'Any Event') {
          const pr = a.prs.find(p => p.event === activeFilters.event);
          if (!pr) return false;
          
          const score = getEventScore(pr.mark, pr.event, a.gender || 'Boys');
          if (score < reqTierScore) return false;

          // ADVANCED BYPASS TIME FILTER (PRO ONLY)
          if (activeFilters.timeMin) {
            const isField = FIELD_EVENTS.includes(pr.event);
            const reqVal = convertMarkToNumber(activeFilters.timeMin, isField);
            const markVal = convertMarkToNumber(pr.mark, isField);
            // Track = lower is better (mark <= req). Field = higher is better (mark >= req)
            if (isField ? markVal < reqVal : markVal > reqVal) return false;
          }
          
          passesEventCriteria = true;
        } else {
          // No specific event, just check if ANY event meets the target tier score
          passesEventCriteria = a.prs.some(pr => getEventScore(pr.mark, pr.event, a.gender || 'Boys') >= reqTierScore);
        }

        if (!passesEventCriteria) return false;
      }
    }

    return true;
  });

  if (feedTab === 'recruiting') {
    const seenAthletes = new Set();
    filteredPosts = filteredPosts.filter(post => {
      // Always allow boosted posts to be considered the "one" post for that athlete
      if (seenAthletes.has(post.athlete_id)) return false;
      seenAthletes.add(post.athlete_id);
      return true;
    });
  }

  const canViewAthleteFeed = viewerRole === 'athlete' && !isGraduated;
  const canViewLegacy = viewerRole === 'athlete' && isGraduated;
  const canUserInteract = (viewerRole === 'athlete' && isVerifiedAthlete) || (viewerRole === 'coach' && isVerifiedCoach);

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32 relative">
      
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />}
            <p className="text-sm font-bold leading-tight">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {openDropdownId && <div className="fixed inset-0 z-[80]" onClick={() => setOpenDropdownId(null)} />}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .legend-badge { background: linear-gradient(90deg, #6b21a8 0%, #d946ef 20%, #6b21a8 40%, #d946ef 60%, #6b21a8 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #e879f9; }
        .champion-badge { background: linear-gradient(90deg, #991b1b 0%, #ef4444 20%, #991b1b 40%, #ef4444 60%, #991b1b 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #f87171; }
        .elite-badge { background: linear-gradient(90deg, #0f172a 0%, #475569 20%, #0f172a 40%, #475569 60%, #0f172a 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #94a3b8; }
        .list-item-legend { animation: pulse-legend-list 5s ease-in-out infinite; }
        @keyframes pulse-legend-list { 0%, 100% { box-shadow: inset 4px 0 0 #d946ef, inset 0 0 20px rgba(217, 70, 239, 0.03); background-color: rgba(217, 70, 239, 0.01); } 50% { box-shadow: inset 4px 0 0 #e879f9, inset 0 0 40px rgba(217, 70, 239, 0.08); background-color: rgba(217, 70, 239, 0.03); } }
        .list-item-champion { animation: pulse-champion-list 5s ease-in-out infinite; }
        @keyframes pulse-champion-list { 0%, 100% { box-shadow: inset 4px 0 0 #ef4444, inset 0 0 20px rgba(239, 68, 68, 0.03); background-color: rgba(239, 68, 68, 0.01); } 50% { box-shadow: inset 4px 0 0 #f87171, inset 0 0 40px rgba(239, 68, 68, 0.08); background-color: rgba(239, 68, 68, 0.03); } }
        .list-item-elite { animation: pulse-elite-list 5s ease-in-out infinite; }
        @keyframes pulse-elite-list { 0%, 100% { box-shadow: inset 4px 0 0 #64748b, inset 0 0 20px rgba(100, 116, 139, 0.03); background-color: rgba(100, 116, 139, 0.01); } 50% { box-shadow: inset 4px 0 0 #94a3b8, inset 0 0 40px rgba(100, 116, 139, 0.08); background-color: rgba(100, 116, 139, 0.03); } }
      `}} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12">
        
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">The Network</h1>
          <p className="text-slate-500 font-medium text-lg">Live updates, bounties, and conversations from verified athletes.</p>
        </div>

        {/* 🚨 DYNAMIC TAB BAR 🚨 */}
        <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar pb-2">
          
          <button onClick={() => setFeedTab('recruiting')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${feedTab === 'recruiting' ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            <ShieldCheck className="w-4 h-4" /> Recruiting Engine
          </button>
          
          {canViewAthleteFeed && (
            <button onClick={() => setFeedTab('athlete')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${feedTab === 'athlete' ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'}`}>
              <Users className="w-4 h-4" /> Athlete Feed
            </button>
          )}
          
          {viewerRole !== 'coach' && (
            <button onClick={() => setFeedTab('bounties')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${feedTab === 'bounties' ? 'bg-amber-500 text-amber-950 shadow-md' : 'bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300'}`}>
              <Target className="w-4 h-4" /> Bounties
            </button>
          )}

          {canViewLegacy && (
            <button onClick={() => setFeedTab('legacy')} className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${feedTab === 'legacy' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'}`}>
              <Coffee className="w-4 h-4" /> Legacy Lounge
            </button>
          )}
        </div>

        {/* 🚨 COACH DISCOVERY FILTERS (REDESIGNED & LOCKED) 🚨 */}
        {feedTab === 'recruiting' && viewerRole === 'coach' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200 mb-8 relative overflow-hidden">
              
              <div className="flex items-center gap-2 mb-1">
                <Filter className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-black text-slate-900">Database Filters</h2>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-6">Narrow results to find your perfect recruit.</p>

              <form onSubmit={(e) => {
                e.preventDefault();
                setActiveFilters(discoveryFilters);
                setIsApplyingFilters(true);
              }} className="flex flex-col gap-6">
                
                {/* 🟢 BASIC FILTERS - UNLOCKED FOR ALL COACHES 🟢 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Division</label>
                    <select value={discoveryFilters.gender} onChange={(e) => setDiscoveryFilters({...discoveryFilters, gender: e.target.value})} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all">
                      <option value="Any">Any</option>
                      <option value="Boys">Mens</option>
                      <option value="Girls">Womens</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Grad Year</label>
                    <select value={discoveryFilters.gradYear} onChange={(e) => setDiscoveryFilters({...discoveryFilters, gradYear: e.target.value})} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all">
                      <option value="Any">All Years</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">State</label>
                    <input type="text" maxLength={2} placeholder="e.g. CA, TX" value={discoveryFilters.state} onChange={(e) => setDiscoveryFilters({...discoveryFilters, state: e.target.value.toUpperCase()})} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all uppercase placeholder:text-slate-300" />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Key Event</label>
                    <select value={discoveryFilters.event} onChange={(e) => setDiscoveryFilters({...discoveryFilters, event: e.target.value})} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all">
                      <option value="">Any Event</option>
                      {TRACK_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                      {FIELD_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                    </select>
                  </div>
                </div>

                {/* 🔒 ADVANCED "BYPASS" FILTERS - LOCKED FOR FREE USERS 🔒 */}
                <div className="relative rounded-2xl bg-slate-50 border border-slate-100 p-6 overflow-hidden">
                  
                  {!isPremiumCoach && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center border border-slate-200 rounded-2xl">
                       <div className="flex items-center gap-2 mb-1">
                          <Lock className="w-4 h-4 text-indigo-600" />
                          <h3 className="font-black text-slate-900">Advanced Filters Locked</h3>
                       </div>
                       <p className="text-xs font-medium text-slate-500 mb-3 text-center max-w-xs">Upgrade to Coach Pro to bypass the Boost Feed and search by strict time/mark minimums.</p>
                       <Link href="/coach-pro" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors">
                          <Crown className="w-3.5 h-3.5 text-amber-400" /> Unlock Pro Engine
                       </Link>
                    </div>
                  )}
                  
                  <div className={`${!isPremiumCoach ? 'opacity-30 blur-[2px] pointer-events-none select-none' : ''}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5 ml-1">Target Tier (Pro)</label>
                        <select value={discoveryFilters.targetTier} onChange={(e) => setDiscoveryFilters({...discoveryFilters, targetTier: e.target.value})} className="w-full bg-white border border-indigo-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold transition-all">
                          <option value="Any">Any</option>
                          {Object.keys(TIER_THRESHOLDS).map(tier => <option key={tier} value={tier}>{tier}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5 ml-1">Time/Mark Minimum (Pro)</label>
                        <input type="text" placeholder="e.g. 10.8 or 21' 6&quot;" value={discoveryFilters.timeMin} onChange={(e) => setDiscoveryFilters({...discoveryFilters, timeMin: e.target.value})} className="w-full bg-white border border-indigo-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium placeholder:text-slate-300" />
                      </div>
                      
                      <div className="flex flex-col justify-end">
                        <button type="button" className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 text-sm h-[46px]">
                          <Save className="w-4 h-4" /> Save Preset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-4 rounded-xl transition-all shadow-md mt-2 text-base">
                  <div className="flex items-center justify-center gap-2">Find Target Recruits</div>
                </button>

              </form>
            </div>
          </div>
        )}

        {/* FEED FILTERS HEADER (SHOWS ACTIVE FILTERS AND CLEAR BUTTON) */}
        {isApplyingFilters && viewerRole === 'coach' && feedTab === 'recruiting' && (
           <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-black text-slate-500 uppercase tracking-widest text-xs">Search Results ({filteredPosts.length})</h3>
              <button 
                onClick={() => {
                  setIsApplyingFilters(false);
                  setDiscoveryFilters({ gender: 'Any', gradYear: 'Any', state: '', event: '', targetTier: 'Any', timeMin: '' });
                  setActiveFilters({ gender: 'Any', gradYear: 'Any', state: '', event: '', targetTier: 'Any', timeMin: '' });
                }} 
                className="text-xs font-bold text-indigo-600 hover:text-indigo-500"
              >
                Clear Search
              </button>
           </div>
        )}

        {/* 🚨 HIGHLIGHTED BANNERS 🚨 */}
        {feedTab === 'recruiting' && viewerRole !== 'coach' && (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-[2rem] p-6 mb-8 text-white relative overflow-hidden shadow-lg border border-blue-700 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="relative z-10 flex items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shrink-0 mx-auto sm:mx-0">
                <School className="w-7 h-7 text-blue-300" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight mb-1">The Recruitment Zone</h3>
                <p className="text-blue-200/90 text-sm font-medium">College Coaches actively monitor this feed. Post your verified PRs and official visit recaps here to get noticed.</p>
              </div>
            </div>
          </div>
        )}

        {feedTab === 'athlete' && (
          <div className="bg-slate-100 rounded-[2rem] p-6 mb-8 border border-slate-200 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border border-slate-200 shrink-0 mx-auto sm:mx-0 shadow-sm">
                <Users className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Athlete Only Feed</h3>
                <p className="text-slate-500 text-sm font-medium">Coaches cannot see this tab. Hype up your teammates, ask questions, or just talk track.</p>
              </div>
            </div>
          </div>
        )}

        {/* --- POST CREATOR (Hidden from Coaches) --- */}
        {viewerRole === 'athlete' && isVerifiedAthlete && (feedTab === 'recruiting' || feedTab === 'athlete' || feedTab === 'legacy') && (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 mb-8 relative overflow-hidden z-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none"></div>
            
            {feedTab === 'recruiting' && timeUntilNextPost ? (
              <div className="flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Pitch Submitted!</h3>
                <p className="text-slate-500 font-medium max-w-sm mb-6">
                  To keep the recruiting feed high-quality for coaches, athletes can only post here once every 24 hours.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 flex items-center justify-center gap-2 shadow-inner">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-black text-slate-700 tracking-wider uppercase text-sm">Cooldown: {timeUntilNextPost}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreatePost} className="p-6 md:p-8 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className={`w-5 h-5 ${feedTab === 'athlete' ? 'text-blue-500' : 'text-indigo-600'}`} />
                  <span className="font-bold text-slate-800 text-lg">
                    {feedTab === 'recruiting' ? 'Create Recruiting Pitch' : 'Share an accomplishment or thought...'}
                  </span>
                </div>

                <div className="space-y-4 mb-4">
                  
                  {feedTab === 'recruiting' && (
                    <>
                      <div className="relative z-10">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={myMajors} onChange={(e) => setMyMajors(e.target.value)} placeholder="Target Major (e.g. Business)" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                      </div>
                    </>
                  )}

                  {/* 🚨 FREE VS PRO EDITOR LOGIC 🚨 */}
                  {feedTab === 'recruiting' && !currentUserProfile?.is_premium ? (
                    // FREE USER LOGIC (Single PR Dropdown + Locked Editor)
                    <>
                      <div className="relative z-10">
                        <select value={selectedPRIndex} onChange={(e) => setSelectedPRIndex(e.target.value)} className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl pl-10 pr-10 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                          <option value="">Highlight a PR (Optional)</option>
                          {myPRs.map((pr, index) => <option key={index} value={index}>{pr.event} - {pr.mark}</option>)}
                        </select>
                        <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                      <div className="relative mt-2">
                        <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-xl border border-slate-200">
                          <Link href="/pro" className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-black px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                            <Lock className="w-4 h-4" /> Unlock Custom Pitches
                          </Link>
                        </div>
                        <textarea disabled placeholder="Free users get an automated pitch. Upgrade to Pro to write custom recruiting letters!" className="w-full bg-slate-50 border border-slate-200 text-slate-400 rounded-xl p-4 font-medium resize-none h-28 cursor-not-allowed" />
                      </div>
                    </>
                  ) : feedTab === 'recruiting' && currentUserProfile?.is_premium ? (
                    // PRO USER EDITOR 
                    <div className="p-1 rounded-[1.1rem] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 animate-[shimmerSlow_4s_linear_infinite] bg-[length:200%_auto] mt-4 relative z-0 shadow-lg shadow-amber-500/20">
                      <div className="bg-slate-900 rounded-xl p-4 relative z-10">
                        
                        {/* Status Tag Selector */}
                        <div className="mb-4 overflow-x-auto hide-scrollbar flex gap-2 pb-1">
                          {PRO_BADGES.map(badge => (
                            <button 
                              key={badge.id}
                              type="button"
                              onClick={() => setSelectedProBadge(badge.id === selectedProBadge ? null : badge.id)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border ${selectedProBadge === badge.id ? badge.color : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                            >
                              {badge.label}
                            </button>
                          ))}
                        </div>

                        {/* Multi-Select PR Pills */}
                        {myPRs.length > 0 && (
                          <div className="mb-4">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Trophy className="w-3 h-3"/> Attach PRs</p>
                            <div className="flex flex-wrap gap-2">
                              {myPRs.map((pr, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleTogglePRSelection(idx)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${selectedPRs.includes(idx) ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                                >
                                  {pr.event}: {pr.mark}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
                          <span className="text-xs font-black text-amber-400 flex items-center gap-1.5 uppercase tracking-widest"><Crown className="w-3.5 h-3.5" /> Pro Editor</span>
                          
                          <div className="flex items-center gap-2">
                            {/* Hide League Toggle */}
                            <button 
                              type="button" 
                              onClick={() => setHideRank(!hideRank)} 
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${hideRank ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                            >
                              <EyeOff className="w-3 h-3" /> {hideRank ? 'Rank Hidden' : 'Hide Rank'}
                            </button>
                            
                            {/* 🚨 Attach Resume Toggle 🚨 */}
                            <button 
                              type="button" 
                              onClick={() => setShowResumeInput(!showResumeInput)} 
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border ${showResumeInput ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                            >
                              <FileText className="w-3 h-3" /> {showResumeInput ? 'Resume Attached' : 'Attach Resume'}
                            </button>
                          </div>
                        </div>
                        
                        <textarea 
                          ref={postInputRef}
                          required 
                          maxLength={500} 
                          value={newPostContent} 
                          onChange={(e) => setNewPostContent(e.target.value)} 
                          placeholder="Write a custom pitch to coaches..." 
                          className="w-full bg-transparent border-none text-white focus:outline-none font-medium resize-none h-24 placeholder:text-slate-500 mb-2" 
                        />

                        {/* 🚨 Resume Editor Area 🚨 */}
                        {showResumeInput && (
                          <div className="mt-2 pt-3 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <FileText className="w-3 h-3" /> Athletic Resume (Saves automatically)
                            </p>
                            <textarea 
                              value={resumeText} 
                              onChange={(e) => setResumeText(e.target.value)} 
                              placeholder="GPA: 3.9&#10;SAT: 1450&#10;Key Achievements: State Finalist 2023..." 
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 font-medium resize-none h-32 placeholder:text-slate-600" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // STANDARD ATHLETE FEED BOX
                    <textarea 
                      ref={postInputRef}
                      required 
                      maxLength={500} 
                      value={newPostContent} 
                      onChange={(e) => setNewPostContent(e.target.value)} 
                      placeholder="Just finished a brutal workout... anyone else's legs dead?" 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none h-24" 
                    />
                  )}

                </div>

                {mediaFile && (
                  <div className="relative w-max mb-4">
                    <img src={URL.createObjectURL(mediaFile)} alt="Upload Preview" onError={(e) => e.currentTarget.style.display = 'none'} className="h-24 rounded-lg object-cover border border-slate-200 shadow-sm" />
                    <button type="button" onClick={() => setMediaFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                  
                  {/* 🚨 MEDIA UPLOAD LOCK FOR FREE USERS IN RECRUITING */}
                  {(feedTab !== 'recruiting' || currentUserProfile?.is_premium) ? (
                    <label className="cursor-pointer flex items-center justify-center p-2.5 bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-full transition-colors">
                      <ImageIcon className="w-5 h-5" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                    </label>
                  ) : (
                    <div className="p-2.5 flex items-center justify-center text-slate-300 cursor-not-allowed" title="Media uploads are a Pro feature in the Recruiting Zone">
                       <Lock className="w-4 h-4 opacity-50" />
                    </div>
                  )}

                  <button type="submit" disabled={isPosting || (currentUserProfile?.is_premium || feedTab !== 'recruiting' ? !newPostContent.trim() : false)} className={`bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-3 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2`}>
                    {isPosting ? 'Sending...' : <><Send className="w-4 h-4" /> Post</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* --- THE SEAMLESS TIMELINE LIST --- */}
        <div>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-200 border-dashed shadow-sm mt-8">
              {feedTab === 'bounties' ? (
                <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              ) : (
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              )}
              <h3 className="text-2xl font-black text-slate-900 mb-2">Nothing here yet...</h3>
              <p className="text-slate-500 font-medium">No posts match your filters. Try broadening your search.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {filteredPosts.map((post) => {
                const isMyPost = currentUserId === post.athlete_id;
                const isRecruiting = post.channel === 'recruiting' || !post.channel || post.channel === 'main';
                const activeTitle = EARNED_TITLES.find(t => t.id === post.athletes.equipped_title);
                const activeBadge = PRO_BADGES.find(b => b.id === post.pro_badge);
                const isPremiumPost = post.athletes.is_premium && isRecruiting; 
                
                const likesCount = post.likes ? post.likes.length : 0;
                const iLikedThis = post.likes ? post.likes.includes(currentUserId || '') : false;
                
                // Comments Logic
                const allComments = post.comments || [];
                const responders = new Set(allComments.filter(c => c.athlete_id !== post.athlete_id).map(c => c.athlete_id));
                const uniqueRespondersCount = responders.size;
                const hasResponded = responders.has(currentUserId || '');
                const commentsCount = allComments.length;
                const isCommentsOpen = expandedComments[post.id];

                let visibleComments = allComments;
                if (isRecruiting && !isMyPost) {
                   const myFirstName = senderName.split(' ')[0];
                   visibleComments = allComments.filter(c => 
                     c.athlete_id === currentUserId || 
                     (c.athlete_id === post.athlete_id && c.text.includes(`@${myFirstName}`))
                   );
                }

                const allowCommentInput = canUserInteract && (!isRecruiting || isMyPost || !hasResponded);

                // 🚨 NCAA RESTRICTION CHECK FOR POSTS 🚨
                const isNCAARestricted = viewerRole === 'coach' && post.athletes.grad_year && !canMessageAthlete(post.athletes.grad_year);

                // 🚨 AUTOMATED BOUNTY CARD
                if (post.is_bounty) {
                  return (
                    <div key={post.id} className="p-6 sm:p-8 bg-amber-50/50 hover:bg-amber-50 transition-colors relative group rounded-[2rem] border border-amber-100 shadow-sm overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Target className="w-24 h-24 text-amber-500" />
                      </div>
                      <div className="flex items-center gap-4 mb-4 relative z-10">
                        
                        {/* 🚨 CLICKABLE AVATAR 🚨 */}
                        <button onClick={() => handleViewProfile(post.athlete_id)} className="shrink-0 group-hover:scale-105 transition-transform text-left">
                          <AvatarWithBorder avatarUrl={post.athletes.avatar_url} borderId={post.athletes.equipped_border} sizeClasses="w-12 h-12" />
                        </button>
                        
                        <div>
                          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-0.5">Bounty Claimed!</p>
                          
                          {/* 🚨 CLICKABLE NAME 🚨 */}
                          <button onClick={() => handleViewProfile(post.athlete_id)} className="text-left font-black text-lg text-slate-900 hover:text-blue-600 transition-colors">
                            {post.athletes.first_name} {post.athletes.last_name}
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm relative z-10 flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Shattered Target PR</span>
                          <span className="font-black text-xl text-slate-800">{post.linked_pr_event}: <span className="text-amber-500">{post.linked_pr_mark}</span></span>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Payout</span>
                          <span className="font-black text-2xl text-emerald-500">+{post.bounty_amount} Cash</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-4 relative z-10">
                        <button onClick={() => handleToggleFire(post.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${iLikedThis ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-white text-slate-500 hover:bg-orange-50 hover:text-orange-500 border border-slate-200'}`}>
                          <Flame className={`w-4 h-4 ${iLikedThis ? 'fill-current' : ''}`} /> {likesCount > 0 ? likesCount : 'Fire'}
                        </button>
                        <span className="text-xs font-bold text-slate-400 ml-auto">{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  )
                }

                // 🏆 STANDARD / PREMIUM FEED CARD RENDER 
                return (
                  <div key={post.id} className={`p-6 sm:p-8 transition-all duration-300 relative z-0 rounded-[2rem] border shadow-sm ${getListGlowClass(post.athletes.equipped_border, post.is_boosted, isPremiumPost)}`}>
                    
                    {post.is_boosted && (
                      <div className="flex items-center gap-2 mb-5 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 px-4 py-1.5 rounded-lg w-max shadow-md">
                        <Rocket className="w-4 h-4" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Boosted Pitch</span>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4 min-w-0">
                        
                        {/* 🚨 CLICKABLE AVATAR 🚨 */}
                        <button onClick={() => handleViewProfile(post.athlete_id)} className="shrink-0 group-hover:scale-105 transition-transform z-10 text-left">
                          <AvatarWithBorder avatarUrl={post.athletes.avatar_url} borderId={post.athletes.equipped_border} sizeClasses="w-12 h-12 sm:w-14 sm:h-14" />
                        </button>

                        <div className="min-w-0 pt-0.5">
                          <div className="flex items-center gap-2 mb-1">
                            
                            {/* 🚨 CLICKABLE NAME 🚨 */}
                            <button onClick={() => handleViewProfile(post.athlete_id)} className="text-left flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                              <h3 className={`font-black text-lg sm:text-xl tracking-tight leading-tight truncate ${isPremiumPost ? 'text-white' : 'text-slate-900'}`}>
                                {post.athletes.first_name} {post.athletes.last_name}
                              </h3>
                              {post.athletes.trust_level > 0 && (
                                <span title="Verified" className="flex items-center shrink-0">
                                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                                </span>
                              )}
                              {post.athletes.is_premium && (
                                <span title="Pro Member" className={`flex items-center shrink-0 p-0.5 rounded ml-1 ${isPremiumPost ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                                  <Crown className="w-3 h-3" />
                                </span>
                              )}
                            </button>
                            
                            {/* Render Rank Title (Unless Hidden) */}
                            {activeTitle && activeTitle.id !== 'prospect' && !post.hide_rank && (
                              <span className={`hidden sm:inline-block px-2.5 py-0.5 rounded-[5px] text-[10px] font-black tracking-widest uppercase text-white ${activeTitle.badgeClass}`}>
                                {activeTitle.name}
                              </span>
                            )}
                          </div>
                          
                          <p className={`text-xs sm:text-sm font-bold flex items-center mt-1 truncate ${isPremiumPost ? 'text-slate-400' : 'text-slate-500'}`}>
                            <MapPin className="w-3.5 h-3.5 mr-1 opacity-70 shrink-0" /> <span className="truncate">{post.athletes.high_school}</span>
                          </p>

                          {/* TAGS ROW */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {post.athletes.majors && (
                              <span className={`flex items-center text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider truncate border ${isPremiumPost ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                <GraduationCap className={`w-3 h-3 mr-1 shrink-0 ${isPremiumPost ? 'text-indigo-400' : 'text-purple-500'}`}/> <span className="truncate">{post.athletes.majors}</span>
                              </span>
                            )}
                            
                            {/* 🚨 RENDER PRO BADGE IF EXISTS 🚨 */}
                            {activeBadge && (
                              <span className={`flex items-center text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${activeBadge.color}`}>
                                {activeBadge.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 relative z-20">
                        <span className={`text-[10px] sm:text-xs font-bold shrink-0 mt-1 pl-2 ${isPremiumPost ? 'text-slate-500' : 'text-slate-400'}`}>{formatDate(post.created_at)}</span>
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === post.id ? null : post.id)} 
                          className={`p-1.5 rounded-full transition-colors mt-0.5 relative z-[90] ${isPremiumPost ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
                        >
                          <MoreHorizontal className="w-5 h-5 pointer-events-none" />
                        </button>
                        
                        {openDropdownId === post.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-100">
                            
                            {/* 🚨 CLICKABLE DROP-DOWN VIEW PROFILE 🚨 */}
                            <button onClick={() => { setOpenDropdownId(null); handleViewProfile(post.athlete_id); }} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left">
                              <UserCircle2 className="w-4 h-4 mr-2.5" /> View Profile
                            </button>

                            {!isMyPost && !isNCAARestricted && (
                              <button onClick={() => { setOpenDropdownId(null); handleContactClick(post); }} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left">
                                <Mail className="w-4 h-4 mr-2.5" /> Direct Message
                              </button>
                            )}
                            {isNCAARestricted && (
                              <div className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-slate-400 cursor-not-allowed bg-slate-50">
                                <Lock className="w-4 h-4 mr-2.5" /> NCAA Restricted
                              </div>
                            )}
                            <button onClick={() => { setOpenDropdownId(null); showToast('Post reported.', 'success'); }} className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left border-t border-slate-100 mt-1 pt-2">
                              <Flag className="w-4 h-4 mr-2.5" /> Report Post
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className={`font-medium text-[15px] sm:text-base leading-relaxed mb-4 whitespace-pre-wrap ml-0 sm:ml-16 ${isPremiumPost ? 'text-slate-200' : 'text-slate-700'}`}>
                      {post.content.split(/(@\S+)/).map((part, i) => 
                        part.startsWith('@') ? <span key={i} className={`font-bold px-1 rounded ${isPremiumPost ? 'text-blue-400 bg-blue-500/20' : 'text-blue-600 bg-blue-50'}`}>{part}</span> : part
                      )}
                    </p>

                    {/* FIXED EMPTY IMAGE BUG */}
                    {post.image_url && post.image_url.trim() !== '' && post.image_url !== 'null' && (
                      <div className="ml-0 sm:ml-16 mb-6">
                        <img 
                          src={post.image_url} 
                          onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }} 
                          alt="" 
                          className={`rounded-2xl max-h-96 w-full object-cover border shadow-sm ${isPremiumPost ? 'border-slate-700' : 'border-slate-200'}`} 
                        />
                      </div>
                    )}

                    <div className="ml-0 sm:ml-16 flex flex-col gap-5">
                      
                      {/* 🚨 THE GRAND MULTI-PR LIST RENDERER 🚨 */}
                      {(post.linked_prs && post.linked_prs.length > 0) ? (
                        <div className="flex flex-col gap-3">
                          {post.linked_prs.map((pr, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border shadow-sm ${isPremiumPost ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-blue-50 to-white border-blue-100'}`}>
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className={`p-2.5 sm:p-3 rounded-xl shadow-inner ${isPremiumPost ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                                  <Trophy className={`w-5 h-5 sm:w-6 sm:h-6 ${isPremiumPost ? 'text-blue-400' : 'text-blue-600'}`} />
                                </div>
                                <div className="flex flex-col">
                                  <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${isPremiumPost ? 'text-slate-500' : 'text-slate-400'}`}>Verified Event</span>
                                  <span className={`text-sm sm:text-lg font-black uppercase tracking-tight ${isPremiumPost ? 'text-slate-200' : 'text-slate-900'}`}>{pr.event}</span>
                                </div>
                              </div>
                              <div className={`text-2xl sm:text-3xl font-black tracking-tighter ${isPremiumPost ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-blue-600'}`}>
                                {pr.mark}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : post.linked_pr_event ? (
                        /* Legacy Single PR Fallback */
                        <div className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border shadow-sm ${isPremiumPost ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-blue-50 to-white border-blue-100'}`}>
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`p-2.5 sm:p-3 rounded-xl shadow-inner ${isPremiumPost ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                              <Trophy className={`w-5 h-5 sm:w-6 sm:h-6 ${isPremiumPost ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${isPremiumPost ? 'text-slate-500' : 'text-slate-400'}`}>Verified Event</span>
                              <span className={`text-sm sm:text-lg font-black uppercase tracking-tight ${isPremiumPost ? 'text-slate-200' : 'text-slate-900'}`}>{post.linked_pr_event}</span>
                            </div>
                          </div>
                          <div className={`text-2xl sm:text-3xl font-black tracking-tighter ${isPremiumPost ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-blue-600'}`}>
                            {post.linked_pr_mark}
                          </div>
                        </div>
                      ) : null}

                      {/* 🚨 ACTIONS ROW WITH NEW VIEW PROFILE BUTTON 🚨 */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button onClick={() => handleToggleFire(post.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-colors shadow-sm ${iLikedThis ? 'bg-orange-500 text-white' : (isPremiumPost ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200')}`}>
                          <Flame className={`w-4 h-4 ${iLikedThis ? 'fill-current' : ''}`} /> {likesCount > 0 ? likesCount : 'Hype'}
                        </button>
                        
                        {isNCAARestricted ? (
                          <button 
                            disabled
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-colors shadow-sm cursor-not-allowed ${isPremiumPost ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
                          >
                            <Lock className="w-4 h-4" /> Restricted
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              if (isRecruiting) {
                                handleContactClick(post);
                              } else {
                                toggleComments(post.id);
                              }
                            }} 
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-colors shadow-sm ${isCommentsOpen && !isRecruiting ? (isPremiumPost ? 'bg-blue-500 text-white border border-blue-500' : 'bg-blue-600 text-white border border-blue-600') : (isPremiumPost ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200')}`}
                          >
                            <MessageSquare className="w-4 h-4" /> 
                            {isRecruiting ? 'Respond' : (commentsCount > 0 ? commentsCount : 'Comment')}
                          </button>
                        )}

                        {/* 🚨 NEW: OBVIOUS VIEW PROFILE BUTTON 🚨 */}
                        <button 
                          onClick={() => handleViewProfile(post.athlete_id)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-colors shadow-sm ${isPremiumPost ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500' : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-800'}`}
                        >
                          <UserCircle2 className="w-4 h-4" /> View Profile
                        </button>

                        {/* VIEW RESUME BUTTON */}
                        {post.attached_resume && (
                          <button onClick={() => setViewingResumePost(post)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-colors shadow-sm ${isPremiumPost ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}>
                            <FileText className="w-4 h-4" /> View Resume
                          </button>
                        )}

                        {/* BOOST BUTTON UI */}
                        {isMyPost && isRecruiting && !post.is_boosted && (
                          <button 
                            disabled={isBoosting}
                            onClick={() => handleBoostClick(post.id)} 
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-colors bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] ml-auto border border-amber-300 disabled:opacity-50"
                          >
                            <Rocket className="w-4 h-4" /> {isBoosting ? 'Boosting...' : 'Boost'}
                          </button>
                        )}
                      </div>

                      {/* 🚨 COMMENTS / RESPONSES SECTION 🚨 */}
                      {isCommentsOpen && !isRecruiting && (
                        <div className={`mt-2 pt-5 border-t relative z-10 animate-in fade-in slide-in-from-top-2 duration-200 ${isPremiumPost ? 'border-slate-800' : 'border-slate-100'}`}>
                          
                          <div className="space-y-5 mb-4 max-h-64 overflow-y-auto px-4 py-2 hide-scrollbar">
                            {visibleComments.map(comment => (
                              <div key={comment.id} className="flex items-start gap-3">
                                <div className="shrink-0 pt-0.5">
                                  <AvatarWithBorder avatarUrl={comment.avatar_url} borderId={comment.border} sizeClasses="w-8 h-8" />
                                </div>
                                <div className="flex flex-col items-start w-full">
                                  <div className={`px-4 py-2.5 rounded-2xl rounded-tl-none border max-w-[90%] sm:max-w-[85%] ${isPremiumPost ? (comment.athlete_id === post.athlete_id ? 'bg-blue-900/30 border-blue-500/30 text-slate-200' : 'bg-slate-800 border-slate-700 text-slate-300') : (comment.athlete_id === post.athlete_id ? 'bg-blue-50 border-blue-100 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700')}`}>
                                    <p className={`text-[11px] font-black mb-0.5 flex items-center gap-1.5 ${isPremiumPost ? 'text-white' : 'text-slate-900'}`}>
                                      {comment.name}
                                      {comment.athlete_id === post.athlete_id && <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest">Author</span>}
                                    </p>
                                    <p className="text-sm font-medium whitespace-pre-wrap">
                                      {comment.text.split(/(@\S+)/).map((part, i) => 
                                        part.startsWith('@') ? <span key={i} className={`${isPremiumPost ? 'text-blue-400' : 'text-blue-600'} font-bold`}>{part}</span> : part
                                      )}
                                    </p>
                                  </div>
                                  
                                  {isMyPost && comment.athlete_id !== currentUserId && (
                                    <button 
                                      onClick={() => {
                                        const firstName = comment.name.split(' ')[0];
                                        setCommentInputs(prev => ({...prev, [post.id]: `@${firstName} `}));
                                      }} 
                                      className={`text-[10px] font-bold mt-1 ml-2 flex items-center gap-1 transition-colors ${isPremiumPost ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-600'}`}
                                    >
                                      <Reply className="w-3 h-3" /> Reply
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {visibleComments.length === 0 && (
                              <p className={`text-sm font-bold italic ${isPremiumPost ? 'text-slate-600' : 'text-slate-400'}`}>No responses yet.</p>
                            )}
                          </div>
                          
                          {allowCommentInput && (
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={commentInputs[post.id] || ''} 
                                onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})} 
                                placeholder="Add a comment..." 
                                className={`flex-1 rounded-full px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 border shadow-inner ${isPremiumPost ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:bg-slate-950' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'}`} 
                              />
                              <button 
                                onClick={() => handleAddComment(post.id)} 
                                disabled={isSubmittingComment || !commentInputs[post.id]?.trim()} 
                                className="bg-blue-600 hover:bg-blue-500 text-white w-11 h-11 flex items-center justify-center rounded-full disabled:opacity-50 transition-colors shrink-0 shadow-md"
                              >
                                <Send className="w-4 h-4 ml-0.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 🚨 RESUME VIEWER MODAL 🚨 */}
      {viewingResumePost && viewingResumePost.attached_resume && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 border border-emerald-200">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-xl leading-tight">{viewingResumePost.athletes.first_name}'s Resume</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Attached to Recruiting Pitch</p>
                </div>
              </div>
              <button onClick={() => setViewingResumePost(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto bg-white flex-1">
              <div className="prose prose-slate max-w-none font-medium whitespace-pre-wrap text-slate-700 leading-relaxed">
                {viewingResumePost.attached_resume}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 BOOST CONFIRMATION MODAL 🚨 */}
      {postToBoost && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-inner">
                <Rocket className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Boost this Pitch?</h3>
              <p className="text-slate-500 font-medium mb-6">
                Boosting will pin this post to the top of the Recruiting feed for 24 hours with a premium highlight.
                <br/><br/>
                <span className="font-bold text-slate-700">You have {currentUserProfile?.boosts_available || 0} boosts remaining.</span>
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPostToBoost(null)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  disabled={isBoosting}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmBoost}
                  disabled={isBoosting}
                  className="flex-1 px-4 py-3 rounded-xl font-black text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isBoosting ? 'Boosting...' : 'Yes, Boost It'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isMessageModalOpen && selectedPostForMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMessageModalOpen(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900">Contact Athlete</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Secure Direct Message</p>
                </div>
              </div>
              <button onClick={() => setIsMessageModalOpen(false)} className="relative z-10 p-2 text-slate-400 hover:bg-white rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6">
              {sendSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-2">Pitch Delivered</h4>
                  <p className="text-slate-500 font-medium">Your message has been sent to {selectedPostForMessage.athletes.first_name}'s secure inbox.</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Privacy Protected</p>
                    <p className="text-sm text-blue-800 font-medium leading-relaxed">Your contact information is safely verified. Your message will be sent directly to the athlete's internal inbox.</p>
                  </div>
                  <textarea 
                    required
                    value={messageContent}
                    onChange={e => setMessageContent(e.target.value)}
                    placeholder={`Write your message to ${selectedPostForMessage.athletes.first_name}...`}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-4 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <button type="submit" disabled={isSending || !messageContent.trim()} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
                    {isSending ? 'Sending securely...' : <><Send className="w-5 h-5" /> Send Direct Message</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}