'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation'; 
import { MessageSquare, Send, Clock, ShieldCheck, CheckCircle2, MapPin, Mail, Lock, X, Trophy, GraduationCap, School, UserCircle2, Users, AlertCircle, Flame, Target, Image as ImageIcon, Crown, EyeOff, Eye, Search, Rocket, AlertTriangle, ChevronDown, Sparkles, Activity, Star, Zap, TrendingUp, HelpCircle, MoreHorizontal, Edit2, Trash2, Flag, Paintbrush, Briefcase, RefreshCw, ArrowDownWideNarrow, Info } from 'lucide-react';
import Link from 'next/link';

import { AvatarWithBorder } from '@/components/AnimatedBorders';

const BAD_WORDS = ['fuck', 'shit', 'bitch', 'ass', 'asshole', 'dick', 'pussy', 'cunt', 'slut', 'whore', 'fag', 'faggot', 'nigger', 'nigga', 'retard', 'bastard', 'motherfucker'];

const containsBadWords = (text: string) => {
  return BAD_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  });
};

const censorText = (text: string) => {
  let censored = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'ig');
    censored = censored.replace(regex, '***');
  });
  return censored;
};

// --- MATH HELPERS FOR PR DELTA ---
const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

const ALL_TRACK_EVENTS = [
  '60 Meters', '100 Meters', '200 Meters', '400 Meters', '800 Meters', '1500 Meters', '1600 Meters', '3000 Meters', '3200 Meters',
  '100m Hurdles', '110m Hurdles', '200m Hurdles', '300m Hurdles', '400m Hurdles',
  'Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'
];

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

const formatDelta = (delta: number, isField: boolean): string => {
  if (isField) {
    const absDelta = Math.abs(delta);
    const feet = Math.floor(absDelta / 12);
    const inches = absDelta % 12;
    if (feet > 0) return `${feet}' ${inches.toFixed(1).replace(/\.0$/, '')}"`;
    return `${inches.toFixed(1).replace(/\.0$/, '')}"`;
  } else {
    return `${Math.abs(delta).toFixed(2)}s`;
  }
};

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
  base_prs?: { event: string; mark: string }[] | null;
  equipped_border?: string | null;
  equipped_title?: string | null; 
  equipped_card?: string | null; 
  grad_year?: number | null;
  is_premium?: boolean; 
  is_looking_for_college?: boolean;
  coins?: number;
}

interface CoachData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  school_name: string | null;
  avatar_url: string | null;
  coach_type: string;
  is_verified: boolean;
  division?: string | null;
  sport?: string | null;
  coach_title?: string | null;
}

interface CoachProfile { 
  id: string; 
  first_name: string | null; 
  last_name: string | null; 
  school_name: string | null; 
  sport: string | null;
  coach_title: string | null;
  division: string | null;
  coach_type: string; 
  avatar_url: string | null; 
  email: string | null; 
  is_verified: boolean;
  is_founder: boolean; 
  is_premium?: boolean;
}

interface CommentData {
  id: string; athlete_id: string; name: string; avatar_url: string | null; border: string | null; text: string; created_at: string;
}

interface Post {
  id: string; content: string; created_at: string; athlete_id: string; linked_pr_event?: string | null; linked_pr_mark?: string | null;  
  linked_prs?: { event: string; mark: string }[] | null; image_url?: string | null; likes?: string[]; 
  comments?: CommentData[]; is_boosted?: boolean; athletes: AthleteData;
}

// 🚨 PREDEFINED OPTIONS FOR DROPDOWNS 🚨
const SPORT_OPTIONS = [
  'Track & Field',
  'Cross Country',
  'Football',
  'Basketball',
  'Soccer',
  'Baseball',
  'Volleyball',
  'Softball',
  'Wrestling'
];

const COACH_TITLES = [
  'Head Coach',
  'Associate Head Coach',
  'Assistant Coach',
  'Director of Operations',
  'Recruiting Coordinator',
  'Sprints & Hurdles Coach',
  'Distance', 
  'Jumps Coach',
  'Throws Coach',
  'Pole Vault Coach',
  'Multi-Events Coach',
  'Graduate Assistant',
  'Volunteer Assistant'
];

// --- MATH HELPERS FOR PR DELTA & SCORES ---
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

  const val = parseMarkToNumber(markStr, eventStds.isField ? event : 'track');
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

const getScoreTier = (score: number) => {
  if (score >= 95) return 'Power 4 D1';
  if (score >= 85) return 'Mid-Major D1';
  if (score >= 75) return 'D1 Walk-On';
  if (score >= 65) return 'Top D2/D3';
  if (score >= 55) return 'NAIA Prospect';
  if (score >= 40) return 'Strong Varsity';
  if (score >= 20) return 'Varsity Standard';
  if (score > 0) return 'JV Standard';
  return 'Unranked';
};

const getAthleteProjection = (prs: any[], gender: string) => {
  if (!prs || !Array.isArray(prs) || prs.length === 0) return { overallScore: 0, overallLabel: 'Unranked', bestEvent: 'N/A' };

  let bestScore = 0;

  prs.forEach((pr) => {
    if (!pr.event || !pr.mark) return;
    const score = getEventScore(pr.mark, pr.event, gender);
    if (score > bestScore) bestScore = score;
  });

  bestScore = Math.min(99, Math.max(5, Math.round(bestScore)));
  const bestTier = getScoreTier(bestScore);

  return { overallScore: bestScore, overallLabel: bestTier, bestEvent: prs[0]?.event || 'N/A' };
};

// 🚨 DYNAMIC HIGH SCHOOL GRAD YEAR CALCULATION 🚨
const getValidGradYears = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  // If it's past July 15th, the seniors have graduated, roll over to the next class
  const isAfterRollover = today.getMonth() > 6 || (today.getMonth() === 6 && today.getDate() >= 15);
  const seniorYear = isAfterRollover ? currentYear + 1 : currentYear;
  
  return [seniorYear, seniorYear + 1, seniorYear + 2, seniorYear + 3];
};

// 🚨 CENTRALIZED CARD STYLES HELPER 🚨
const getCardStyles = (cardId: string | null | undefined, type: 'post' | 'dir') => {
  let id = cardId || 'base';
  if (id === 'default') id = 'base';

  const isFoil = ['hype', 'premium', 'crimson', 'sapphire'].includes(id);
  const isAnimated = ['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber'].includes(id);
  const hasGlare = ['hype', 'premium'].includes(id); 
  const hasTrophy = ['hype', 'premium'].includes(id);

  let bgClass = '';
  if (id === 'base') {
     bgClass = type === 'post' ? 'bg-white/[0.02]' : 'bg-gradient-to-b from-white/[0.05] to-transparent';
  } else {
     bgClass = `holo-card-${id}`;
  }

  return {
     bgClass,
     isFoil,
     isCustom: id !== 'base',
     isAnimated,
     hasGlare,
     hasTrophy,
     borderClass: id === 'base' ? (type === 'post' ? 'border-white/5 hover:border-white/10' : 'border-white/10') : 'border-white/20 shadow-xl'
  };
};

export default function FeedPage() {
  const supabase = createClient();
  const router = useRouter(); 
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [coachesList, setCoachesList] = useState<CoachData[]>([]);
  const [recruitsList, setRecruitsList] = useState<AthleteData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(''); 
  const [currentUserProfile, setCurrentUserProfile] = useState<AthleteData | null>(null);
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');
  
  const [isUpperclassman, setIsUpperclassman] = useState(false);
  const [isLookingForCollege, setIsLookingForCollege] = useState(false);
  
  const [feedTab, setFeedTab] = useState<'feed' | 'network'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  
  // COACH FINDER FILTERS
  const [filterDivision, setFilterDivision] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [filterTitle, setFilterTitle] = useState('');

  // ATHLETE FINDER FILTERS (For Coaches)
  const [filterAthleteState, setFilterAthleteState] = useState('');
  const [filterGradYear, setFilterGradYear] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterTargetScore, setFilterTargetScore] = useState('');
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [isSortByScore, setIsSortByScore] = useState(true);

  const [myPRs, setMyPRs] = useState<{event: string, mark: string}[]>([]);

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});

  // Messaging State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<{ id: string, name: string, school: string, role: string } | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Edit States for Posts
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  // Report & Modal States
  const [reportModal, setReportModal] = useState<{type: 'post'|'comment', id: string, targetId: string, content: string} | null>(null);
  const [reportReason, setReportReason] = useState('Inappropriate Language');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);

  // Profile Edit State (For Coaches)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editDivision, setEditDivision] = useState('');
  const [editSport, setEditSport] = useState('');
  const [editCoachTitle, setEditCoachTitle] = useState('');
  const [schoolOptions, setSchoolOptions] = useState<{id: string, name: string, division: string}[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);
  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Animation & Modal States
  const [animatingHype, setAnimatingHype] = useState<string | null>(null);
  const [coinPopId, setCoinPopId] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchFeedAndUser();
  }, [supabase]);

  useEffect(() => {
    if (feedTab === 'network') {
      if (viewerRole !== 'coach') fetchCoaches();
      if (viewerRole === 'coach') fetchRecruits();
    }
  }, [feedTab, viewerRole]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.more-dropdown')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🚨 AUTOCOMPLETE FOR UNIVERSITIES (COACH PROFILE) 🚨
  useEffect(() => {
    const searchUniversities = async () => {
      if (!editSchoolName || editSchoolName.length < 2) {
        setSchoolOptions([]);
        return;
      }
      setIsSearchingSchool(true);
      
      const { data } = await supabase
        .from('universities')
        .select('id, name, division')
        .ilike('name', `%${editSchoolName}%`)
        .order('name')
        .limit(10);
      
      if (data) setSchoolOptions(data);
      setIsSearchingSchool(false);
    };

    const timeoutId = setTimeout(() => {
      searchUniversities();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [editSchoolName, supabase]);

  async function fetchFeedAndUser() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setCurrentUserId(session.user.id);
      setCurrentUserEmail(session.user.email || '');

      const { data: cData } = await supabase.from('coaches').select('*').eq('id', session.user.id).maybeSingle();
      
      if (cData) {
        setViewerRole('coach');
        setCoachProfile(cData);
      } else {
        const { data: aData, error: aError } = await supabase
          .from('athletes')
          .select('id, first_name, last_name, high_school, state, gender, avatar_url, trust_level, prs, equipped_card, grad_year, is_premium, is_looking_for_college, coins, equipped_border')
          .eq('id', session.user.id)
          .maybeSingle();

        if (aError) {
           console.error("Supabase Athlete Fetch Error:", aError.message);
        }

        if (aData) {
          setViewerRole('athlete');
          setCurrentUserProfile(aData as AthleteData);
          setIsLookingForCollege(aData.is_looking_for_college || false);
          
          if (aData.prs) {
            // Sort PRs to show top ones
            const sortedPrs = [...aData.prs].sort((a, b) => {
              const aVal = parseMarkToNumber(a.mark, a.event);
              const bVal = parseMarkToNumber(b.mark, b.event);
              const isField = FIELD_EVENTS.includes(a.event);
              return isField ? bVal - aVal : aVal - bVal;
            });
            setMyPRs(sortedPrs);
          }

          if (aData.grad_year) {
            const currentYear = new Date().getFullYear();
            if (aData.grad_year <= currentYear + 2) {
              setIsUpperclassman(true);
            }
          }
        }
      }
    }

    const { data: feedData, error: feedError } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, athlete_id, linked_pr_event, linked_pr_mark, linked_prs, image_url, likes, comments, is_boosted,
        athletes (id, first_name, last_name, high_school, state, gender, avatar_url, trust_level, prs, base_prs, equipped_border, equipped_title, equipped_card, grad_year, is_premium)
      `)
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (feedError) {
      console.error("Database Error Fetching Posts:", feedError);
      showToast("Database blocked feed access. Check RLS policies.", "error");
    }
    
    setPosts((feedData as unknown as Post[]) || []);
    setLoading(false);
  }

  async function fetchCoaches() {
    const { data, error } = await supabase
      .from('coaches')
      .select('id, first_name, last_name, school_name, avatar_url, coach_type, is_verified, division, sport, coach_title')
      .order('school_name', { ascending: true });
      
    if (error) {
      console.error("Supabase Coach Fetch Error:", error.message);
      showToast("Could not load coaches. Check console for database errors.", "error");
    }
      
    if (data) setCoachesList(data as unknown as CoachData[]);
  }

  async function fetchRecruits() {
    const { data, error } = await supabase
      .from('athletes')
      .select('id, first_name, last_name, high_school, state, gender, avatar_url, grad_year, prs, trust_level, is_premium, is_looking_for_college, equipped_border, equipped_card')
      .not('first_name', 'is', null) // Database level nuke of true nulls
      .order('trust_level', { ascending: false })
      .limit(300);

    if (error) {
      console.error("Supabase Recruits Fetch Error:", error.message);
      showToast("Could not load athletes. Check console for database errors.", "error");
    }

    if (data) {
      // Aggressive JS level nuke of empty strings and literal "null" strings
      const validRecruits = (data as unknown as AthleteData[]).filter(r => {
          const fName = r.first_name || '';
          const lName = r.last_name || '';
          return fName.trim().length > 0 && 
                 lName.trim().length > 0 && 
                 fName.toLowerCase() !== 'null' && 
                 lName.toLowerCase() !== 'null';
      });
      setRecruitsList(validRecruits);
    }
  }

  // --- COACH PROFILE EDIT FUNCTIONS ---
  const handleEditToggle = () => {
    if (!coachProfile) return;
    setEditFirstName(coachProfile.first_name || '');
    setEditLastName(coachProfile.last_name || '');
    setEditSchoolName(coachProfile.school_name || '');
    setEditDivision(coachProfile.division || '');
    setEditSport(coachProfile.sport || '');
    setEditCoachTitle(coachProfile.coach_title || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!coachProfile?.id) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase.from('coaches').update({
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        school_name: editSchoolName.trim(),
        division: editDivision.trim() || null,
        sport: editSport.trim(),
        coach_title: editCoachTitle.trim()
      }).eq('id', coachProfile.id);

      if (error) throw error;

      setCoachProfile(prev => prev ? { 
        ...prev, 
        first_name: editFirstName.trim(), 
        last_name: editLastName.trim(), 
        school_name: editSchoolName.trim(),
        division: editDivision.trim() || null,
        sport: editSport.trim(),
        coach_title: editCoachTitle.trim()
      } : null);
      
      setIsEditingProfile(false);
      showToast("Profile updated successfully!", "success");
    } catch (err: any) {
      showToast(`Failed to save profile: ${err.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleToggleCollegeSearch = async () => {
    if (!isUpperclassman) {
      showToast("Only Juniors and Seniors can activate College Search.", "error");
      return;
    }
    const newVal = !isLookingForCollege;
    setIsLookingForCollege(newVal);
    await supabase.from('athletes').update({ is_looking_for_college: newVal }).eq('id', currentUserId);
    showToast(newVal ? "Beacon Activated: Coaches can now find you! 📡" : "College Search hidden.", "success");
  };

  // --- POST & COMMENT MANAGEMENT ---

  const handleSavePostEdit = async (postId: string) => {
    if (!editPostContent.trim()) return;

    let finalContent = editPostContent.trim();
    let wasCensored = false;

    if (containsBadWords(finalContent)) {
      finalContent = censorText(finalContent);
      wasCensored = true;
      // Background auto-report
      if (currentUserId) {
        supabase.from('reports').insert({
          reporter_id: currentUserId, 
          reported_id: currentUserId,
          content_type: 'post',
          content_id: postId,
          content_snapshot: editPostContent,
          reason: 'Auto-detected Profanity in Edit'
        }).then(); 
      }
    }

    try {
      const { error } = await supabase.from('posts').update({ content: finalContent }).eq('id', postId);
      if (error) throw error;
      
      setPosts(posts.map(p => p.id === postId ? { ...p, content: finalContent } : p));
      setEditingPostId(null);

      if (wasCensored) {
        showToast("Warning: Inappropriate language was removed and flagged.", "error");
      } else {
        showToast("Post updated successfully.", "success");
      }
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(posts.filter(p => p.id !== postId));
      showToast("Post deleted.", "success");
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleSaveCommentEdit = async (postId: string, commentId: string) => {
    if (!editCommentContent.trim()) return;

    let finalContent = editCommentContent.trim();
    let wasCensored = false;

    if (containsBadWords(finalContent)) {
      finalContent = censorText(finalContent);
      wasCensored = true;
      if (currentUserId) {
        supabase.from('reports').insert({
          reporter_id: currentUserId,
          reported_id: currentUserId,
          content_type: 'comment',
          content_id: commentId,
          content_snapshot: editCommentContent,
          reason: 'Auto-detected Profanity in Comment Edit'
        }).then(); 
      }
    }

    try {
      const targetPost = posts.find(p => p.id === postId);
      if (!targetPost || !targetPost.comments) return;

      const updatedComments = targetPost.comments.map(c => 
        c.id === commentId ? { ...c, text: finalContent } : c
      );

      const { error } = await supabase.from('posts').update({ comments: updatedComments }).eq('id', postId);
      if (error) throw error;

      setPosts(posts.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
      setEditingCommentId(null);
      
      if (wasCensored) {
        showToast("Warning: Inappropriate language was removed and flagged.", "error");
      } else {
        showToast("Comment updated.", "success");
      }
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      const targetPost = posts.find(p => p.id === postId);
      if (!targetPost || !targetPost.comments) return;

      const updatedComments = targetPost.comments.filter(c => c.id !== commentId);

      const { error } = await supabase.from('posts').update({ comments: updatedComments }).eq('id', postId);
      if (error) throw error;

      setPosts(posts.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
      showToast("Comment removed.", "success");
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !reportModal) return;

    setIsSubmittingReport(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: currentUserId,
        reported_id: reportModal.targetId,
        content_type: reportModal.type,
        content_id: reportModal.id,
        content_snapshot: reportModal.content,
        reason: reportReason
      });

      if (error) throw error;
      showToast("Report submitted successfully. Our team will review it shortly.", "success");
      setReportModal(null);
    } catch (err: any) {
      showToast("Failed to submit report. Please try again.", "error");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // --- ENGAGEMENT & ACTIONS ---

  const handleToggleFire = async (postId: string, postAuthorId: string) => {
    if (!currentUserId) { router.push('/login'); return; }
    
    setAnimatingHype(postId);
    setTimeout(() => setAnimatingHype(null), 300);

    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;
    const hasLiked = targetPost.likes?.includes(currentUserId);

    setPosts(currentPosts => currentPosts.map(post => {
      if (post.id === postId) {
        const likes = post.likes || [];
        const newLikes = hasLiked ? likes.filter(id => id !== currentUserId) : [...likes, currentUserId];
        return { ...post, likes: newLikes };
      }
      return post;
    }));
    
    await supabase.rpc('toggle_post_like', { p_post_id: postId, p_user_id: currentUserId });

    if (!hasLiked && postAuthorId !== currentUserId) {
      try {
        const { data } = await supabase.from('athletes').select('coins').eq('id', postAuthorId).single();
        if (data) {
          await supabase.from('athletes').update({ coins: (data.coins || 0) + 2 }).eq('id', postAuthorId);
          setCoinPopId(postId);
          setTimeout(() => setCoinPopId(null), 1000);
        }
      } catch (e) { console.error("Failed to send cash", e); }
    } else if (hasLiked && postAuthorId !== currentUserId) {
      try {
        const { data } = await supabase.from('athletes').select('coins').eq('id', postAuthorId).single();
        if (data && data.coins >= 2) {
          await supabase.from('athletes').update({ coins: data.coins - 2 }).eq('id', postAuthorId);
        }
      } catch (e) { console.error("Failed to retract cash", e); }
    }
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault(); 
    const text = commentInputs[postId];
    if (!text || !text.trim() || !currentUserId) return;

    let finalContent = text.trim();
    let wasCensored = false;

    if (containsBadWords(finalContent)) {
      finalContent = censorText(finalContent);
      wasCensored = true;
      supabase.from('reports').insert({
        reporter_id: currentUserId,
        reported_id: currentUserId,
        content_type: 'comment',
        content_id: 'new_comment', 
        content_snapshot: text,
        reason: 'Auto-detected Profanity in New Comment'
      }).then(); 
    }

    setIsSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const myAvatar = viewerRole === 'coach' ? coachProfile?.avatar_url : currentUserProfile?.avatar_url;
      const myBorder = viewerRole === 'coach' ? 'none' : currentUserProfile?.equipped_border;
      const myName = viewerRole === 'coach' ? `Coach ${coachProfile?.last_name || ''}` : currentUserProfile?.first_name + ' ' + currentUserProfile?.last_name;

      const newComment: CommentData = {
        id: Math.random().toString(), 
        athlete_id: currentUserId,
        name: myName.trim(),
        avatar_url: myAvatar || '', 
        border: myBorder || 'none',
        text: finalContent,
        created_at: new Date().toISOString()
      };

      setPosts(currentPosts => currentPosts.map(post => {
        if (post.id === postId) return { ...post, comments: [...(post.comments || []), newComment] };
        return post;
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));

      const targetPost = posts.find(p => p.id === postId);
      const currentComments = targetPost?.comments || [];
      await supabase.from('posts').update({ comments: [...currentComments, newComment] }).eq('id', postId);
      
      if (wasCensored) showToast("Warning: Inappropriate language was removed and flagged.", "error");

    } catch (err: any) { showToast("Failed to submit: " + err.message); } 
    finally { setIsSubmittingComment(prev => ({ ...prev, [postId]: false })); }
  };

  const toggleComments = (postId: string) => { setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] })); };

  const openMessageModal = (id: string, name: string, school: string, role: string) => {
    if (viewerRole === 'guest' || !currentUserId) { router.push('/login?reason=contact'); return; }
    setMessageRecipient({ id, name, school, role });
    setSendSuccess(false);
    setMessageContent('');
    setIsMessageModalOpen(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageRecipient || !currentUserId) return;
    
    let finalContent = messageContent.trim();
    if (containsBadWords(finalContent)) {
      finalContent = censorText(finalContent);
      showToast("Warning: Inappropriate language was removed.", "error");
    }

    setIsSending(true);
    try {
      if (!isUpperclassman && messageRecipient.role === 'coach') {
         finalContent = `[⚠️ NCAA COMPLIANCE WARNING: The sender is an underclassman (Freshman/Sophomore). Per NCAA rules, you cannot reply to this message until June 15th after their Sophomore year.]\n\n${finalContent}`;
      }

      const { error } = await supabase.from('messages').insert({
        athlete_id: messageRecipient.role === 'athlete' ? messageRecipient.id : currentUserId,
        sender_email: currentUserEmail, 
        content: finalContent,
        status: 'pending' 
      });
      
      if (error) throw error;
      setSendSuccess(true);
      setTimeout(() => { setIsMessageModalOpen(false); setSendSuccess(false); setMessageContent(''); }, 2000);
    } catch (error: any) { showToast(`Failed to send message: ${error.message}`); } finally { setIsSending(false); }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString); const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    if (isToday) return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // 🚨 SKELETON POST LOADER 🚨
  const FeedSkeleton = () => (
    <div className="space-y-8 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 bg-white/5 rounded-full shrink-0" />
            <div className="space-y-2 flex-1 pt-1">
              <div className="w-32 h-4 bg-white/5 rounded" />
              <div className="w-24 h-3 bg-white/5 rounded" />
            </div>
          </div>
          <div className="space-y-3 mb-6">
            <div className="w-full h-3 bg-white/5 rounded" />
            <div className="w-5/6 h-3 bg-white/5 rounded" />
            <div className="w-4/6 h-3 bg-white/5 rounded" />
          </div>
          <div className="border-t border-white/5 pt-5 flex gap-3">
            <div className="w-24 h-10 bg-white/5 rounded-xl" />
            <div className="w-28 h-10 bg-white/5 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );

  // --- NEW ADVANCED FILTERING LOGIC ---
  let displayCoaches: CoachData[] = [];
  let displayAthletes: AthleteData[] = [];
  let showingCoachRecommendations = false;

  const validGradYears = getValidGradYears();

  if (feedTab === 'network') {
    if (viewerRole !== 'coach') {
      // ATHLETES LOOKING FOR COACHES
      const baseFilteredCoaches = coachesList.filter(c => {
        const matchQuery = !searchQuery || 
          c.school_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          c.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.first_name?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchDiv = !filterDivision || c.division === filterDivision;
        const matchSport = !filterSport || c.sport === filterSport;
        
        return matchQuery && matchDiv && matchSport;
      });

      const exactMatches = baseFilteredCoaches.filter(c => !filterTitle || c.coach_title === filterTitle);

      if (exactMatches.length > 0) {
        displayCoaches = exactMatches;
      } else if (baseFilteredCoaches.length > 0 && filterTitle) {
        // Fallback: Exact title not found, but we found coaches in the same sport/school
        displayCoaches = baseFilteredCoaches;
        showingCoachRecommendations = true;
      } else {
        displayCoaches = baseFilteredCoaches;
      }
    } else {
      // COACHES LOOKING FOR RECRUITS
      displayAthletes = recruitsList.filter(r => {
        const fullName = `${r.first_name || ''} ${r.last_name || ''}`.trim().toLowerCase();
        
        const searchMatch = !searchQuery || 
          fullName.includes(searchQuery.toLowerCase()) || 
          (r.high_school && r.high_school.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const stateMatch = !filterAthleteState || r.state === filterAthleteState;
        const gradYearMatch = !filterGradYear || r.grad_year?.toString() === filterGradYear;
        const genderMatch = !filterGender || r.gender === filterGender;

        // Event Targeting Match
        let eventMatch = true;

        if (filterEvent) {
          const pr = r.prs?.find(p => p.event.toLowerCase() === filterEvent.toLowerCase());
          if (!pr) {
            eventMatch = false;
          }
        }

        return searchMatch && stateMatch && gradYearMatch && genderMatch && eventMatch;
      });

      // Sort athletes by Event Score if a specific event is being targeted AND sorting is enabled
      if (filterEvent && isSortByScore) {
        displayAthletes.sort((a, b) => {
          const prA = a.prs?.find(p => p.event.toLowerCase() === filterEvent.toLowerCase());
          const prB = b.prs?.find(p => p.event.toLowerCase() === filterEvent.toLowerCase());
          const scoreA = prA ? getEventScore(prA.mark, prA.event, a.gender || 'Boys') : -1;
          const scoreB = prB ? getEventScore(prB.mark, prB.event, b.gender || 'Boys') : -1;
          return scoreB - scoreA; // Highest to lowest score
        });
      }
    }
  }

  // Filter sport suggestions for Coach Edit Modal
  const filteredSports = SPORT_OPTIONS.filter(s => 
    s.toLowerCase().includes(editSport.toLowerCase()) && s.toLowerCase() !== editSport.toLowerCase()
  );

  // Filter title suggestions for Coach Edit Modal
  const filteredTitles = COACH_TITLES.filter(t => 
    t.toLowerCase().includes(editCoachTitle.toLowerCase()) && t.toLowerCase() !== editCoachTitle.toLowerCase()
  );

  const profileIncomplete = viewerRole === 'coach' && coachProfile && (!coachProfile.first_name || !coachProfile.last_name || !coachProfile.school_name || !coachProfile.sport || !coachProfile.coach_title);

  return (
    <main className="min-h-screen bg-[#06090F] text-white font-sans pb-32 relative selection:bg-blue-500/30 overflow-hidden">
      
      {/* 🚨 MINIMAL AMBIENT GLOWS 🚨 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerGlare { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes pulseHype { 0% { transform: scale(1); } 50% { transform: scale(1.15) rotate(-5deg); } 100% { transform: scale(1); } }
        @keyframes floatUpFade { 0% { opacity: 0; transform: translateY(10px) scale(0.8); } 20% { opacity: 1; transform: translateY(0px) scale(1.2); } 80% { opacity: 1; transform: translateY(-30px) scale(1); } 100% { opacity: 0; transform: translateY(-40px) scale(0.9); } }
        
        @keyframes cyberScan { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(1000%); opacity: 0; } }
        @keyframes voidPulse { 0%, 100% { background-size: 100% 100%; filter: brightness(1); } 50% { background-size: 120% 120%; filter: brightness(1.2); } }
        
        .holo-card-base { background: transparent; }
        .holo-card-obsidian { background: linear-gradient(135deg, #0f172a 0%, #334155 25%, #000000 50%, #0f172a 75%, #1e293b 100%); background-size: 300% 300%; }
        .holo-card-crimson { background: linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #450a0a 100%); background-size: 300% 300%; }
        .holo-card-sapphire { background: linear-gradient(135deg, #172554 0%, #0ea5e9 50%, #172554 100%); background-size: 300% 300%; }
        
        /* SHATTERED HOLOGRAPHIC FOIL */
        .holo-card-hype { 
          background: 
            linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent 100%),
            linear-gradient(135deg, #4f46e5 0%, #9333ea 25%, #ec4899 50%, #3b82f6 75%, #4f46e5 100%); 
          background-size: 40px 40px, 300% 300%; 
        }

        /* BRUSHED GOLD FOIL */
        .holo-card-premium { 
          background: 
            repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px),
            linear-gradient(135deg, #b45309 0%, #f59e0b 25%, #fef08a 50%, #d97706 75%, #78350f 100%); 
          background-size: 100% 100%, 300% 300%; 
        }

        /* PULSATING NEBULA CORE */
        .holo-card-amethyst { 
          background: radial-gradient(circle at 50% 50%, #c026d3 0%, #7e22ce 30%, #3b0764 80%, #000000 100%); 
          animation: voidPulse 6s ease-in-out infinite;
        }
        .holo-card-amethyst::before {
          content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.1;
          background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 2px, #fff 3px, #fff 4px);
        }

        /* NEON HACKER MATRIX */
        .holo-card-cyber { 
          background: 
            linear-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.15) 1px, transparent 1px),
            linear-gradient(135deg, #022c22 0%, #064e3b 50%, #083344 100%);
          background-size: 20px 20px, 20px 20px, 100% 100%;
          box-shadow: inset 0 0 40px rgba(6, 182, 212, 0.3);
        }
        .holo-card-cyber::after {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 8px;
          background: rgba(34, 211, 238, 0.8); filter: blur(3px); box-shadow: 0 0 20px #22d3ee;
          animation: cyberScan 3s linear infinite;
        }

        .animate-foil { animation: foilShift 15s ease-in-out infinite; }
        .holo-glare { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%); background-size: 200% auto; animation: shimmerGlare 8s infinite linear; pointer-events: none; z-index: 10; mix-blend-mode: overlay;}
        .hype-pop { animation: pulseHype 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .coin-float { position: absolute; top: -20px; left: 50%; margin-left: -20px; color: #4ade80; font-weight: 900; font-size: 1.1rem; text-shadow: 0 2px 10px rgba(74,222,128,0.4); pointer-events: none; animation: floatUpFade 1s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 50; }
      `}} />

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'bg-rose-950/90 border-rose-900/50 text-rose-200' : 'bg-emerald-950/90 border-emerald-900/50 text-emerald-200'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />}
            <p className="text-xs font-bold leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      {/* 🚨 SCORING GUIDE MODAL 🚨 */}
      {showScoringModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowScoringModal(false)}></div>
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-400 border border-indigo-500/30">
            <div className="bg-indigo-950/30 border-b border-indigo-900/50 p-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/30">
                  <Star className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-white tracking-tight">Scoring System</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Recruiting Metrics Explained</p>
                </div>
              </div>
              <button onClick={() => setShowScoringModal(false)} className="relative z-10 p-2 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 md:p-8 space-y-4">
              <p className="text-sm text-slate-300 font-medium leading-relaxed mb-6">
                ChasedSports automatically standardizes times and marks across all events and genders into a simple <strong className="text-white">0-99 score</strong> to help you quickly identify prospects that fit your program.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                  <div className="w-16 text-center shrink-0">
                    <span className="text-xl font-black text-fuchsia-400">95+</span>
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">Power 4 D1</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Top tier national talent. Immediate impact at major D1 programs.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                  <div className="w-16 text-center shrink-0">
                    <span className="text-xl font-black text-purple-400">85+</span>
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">Mid-Major D1</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Strong D1 prospect. Competitive at the mid-major level.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                  <div className="w-16 text-center shrink-0">
                    <span className="text-xl font-black text-blue-400">75+</span>
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">D1 Walk-On / Top D2</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Fringe D1 standard or high-impact D2 recruit.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                  <div className="w-16 text-center shrink-0">
                    <span className="text-xl font-black text-emerald-400">65+</span>
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">D2 / D3 Prospect</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Solid collegiate potential for D2 or competitive D3 programs.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                  <div className="w-16 text-center shrink-0">
                    <span className="text-xl font-black text-amber-400">55+</span>
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">NAIA Prospect</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Developing talent fitting for NAIA or junior college programs.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 HELP MODAL 🚨 */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowHelpModal(false)}></div>
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-400 border border-slate-700">
            <div className="bg-slate-800/50 border-b border-slate-700 p-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600">
                  <HelpCircle className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-white tracking-tight">How It Works</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">The Arena Guide</p>
                </div>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="relative z-10 p-2 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-full transition-colors border border-transparent"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
               <div className="bg-black/40 border border-slate-700 rounded-2xl p-5 shadow-inner">
                 <h4 className="font-black text-white text-sm flex items-center gap-2 mb-2">
                   <Zap className="w-4 h-4 text-yellow-400" /> Getting Featured
                 </h4>
                 <p className="text-xs text-slate-400 leading-relaxed font-medium">
                   Want the massive Holographic PR Card on the Global Feed? It triggers automatically when you: <br/>
                   <span className="text-white mt-1 block">• Claim a Bounty here in the Arena</span>
                   <span className="text-white block">• Sync a new PR from your Dashboard</span>
                   <span className="text-blue-400 font-bold block mt-2 text-[10px] uppercase tracking-widest">Pro Tip: Premium members automatically get the Gold Card!</span>
                 </p>
               </div>

               <div className="bg-black/40 border border-slate-700 rounded-2xl p-5 shadow-inner">
                 <h4 className="font-black text-white text-sm flex items-center gap-2 mb-2">
                   <Flame className="w-4 h-4 text-orange-500" /> The Hype Economy
                 </h4>
                 <p className="text-xs text-slate-400 leading-relaxed font-medium">
                   Hype is our version of likes. It costs you nothing to hype up your friends, but <strong>every time someone hypes your post, you earn +2 ChasedCash!</strong> 💸 Keep stacking PRs to get more hype and buy gear in the shop.
                 </p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 REPORT MODAL 🚨 */}
      {reportModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setReportModal(null)}></div>
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-400 border border-white/10">
            <div className="bg-rose-950/30 border-b border-rose-900/50 p-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/30">
                  <Flag className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-white tracking-tight">Report Content</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Keep the community safe</p>
                </div>
              </div>
              <button onClick={() => setReportModal(null)} className="relative z-10 p-2 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white rounded-full transition-colors border border-transparent"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmitReport} className="p-6 md:p-8 space-y-6">
               <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                 <p className="text-xs font-bold text-slate-500 mb-2">You are reporting this {reportModal.type}:</p>
                 <p className="text-sm italic text-slate-300 border-l-2 border-rose-500 pl-3 line-clamp-3">"{reportModal.content}"</p>
               </div>

               <div>
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Reason for report</label>
                 <select 
                   value={reportReason} 
                   onChange={(e) => setReportReason(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 text-white text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500"
                 >
                   <option value="Inappropriate Language" className="bg-slate-900">Inappropriate Language / Profanity</option>
                   <option value="Harassment or Bullying" className="bg-slate-900">Harassment or Bullying</option>
                   <option value="Unsportsmanlike Conduct" className="bg-slate-900">Unsportsmanlike Conduct</option>
                   <option value="Spam" className="bg-slate-900">Spam or Self-Promotion</option>
                   <option value="Other" className="bg-slate-900">Other</option>
                 </select>
               </div>

               <button type="submit" disabled={isSubmittingReport} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                 {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* 🚨 COACH PROFILE EDIT MODAL (Shows in Feed if Coach) 🚨 */}
      {viewerRole === 'coach' && isEditingProfile && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsEditingProfile(false)}></div>
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-400 border border-indigo-500/30">
            <div className="bg-indigo-950/30 border-b border-indigo-900/50 p-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/30">
                  <Briefcase className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-white tracking-tight">Complete Profile</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">NCAA Directory Setup</p>
                </div>
              </div>
              <button onClick={() => setIsEditingProfile(false)} className="relative z-10 p-2 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 md:p-8 space-y-4">
               <div className="grid grid-cols-2 gap-3 mb-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                    <input type="text" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} placeholder="John" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                    <input type="text" value={editLastName} onChange={e => setEditLastName(e.target.value)} placeholder="Doe" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1" />
                  </div>
                </div>

                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">University Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={editSchoolName} 
                      onChange={e => { 
                        setEditSchoolName(e.target.value); 
                        setEditDivision(''); 
                        setShowSchoolDropdown(true); 
                      }}
                      onFocus={() => { if (editSchoolName.length >= 2) setShowSchoolDropdown(true); }}
                      onBlur={() => setShowSchoolDropdown(false)}
                      placeholder="Search for your university..." 
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1 pr-10" 
                    />
                    {isSearchingSchool && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5">
                        <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
                      </div>
                    )}
                  </div>
                  {showSchoolDropdown && schoolOptions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                      {schoolOptions.map(option => (
                        <button
                          key={option.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault(); 
                            setEditSchoolName(option.name);
                            setEditDivision(option.division || '');
                            setShowSchoolDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex justify-between items-center border-b border-slate-700/50 last:border-0"
                        >
                          <span className="truncate pr-2">{option.name}</span>
                          {option.division && (
                            <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                              {option.division}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sport</label>
                    <input 
                      type="text" 
                      value={editSport} 
                      onChange={e => { setEditSport(e.target.value); setShowSportDropdown(true); }}
                      onFocus={() => setShowSportDropdown(true)}
                      onBlur={() => setShowSportDropdown(false)}
                      placeholder="e.g. Track & Field" 
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1" 
                    />
                    {showSportDropdown && filteredSports.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredSports.map(sport => (
                          <button
                            key={sport}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault(); 
                              setEditSport(sport);
                              setShowSportDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            {sport}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ml-1 transition-colors ${!editSport.trim() ? 'text-slate-600' : 'text-slate-400'}`}>Title</label>
                    <input 
                      type="text" 
                      value={editCoachTitle} 
                      onChange={e => { setEditCoachTitle(e.target.value); setShowTitleDropdown(true); }}
                      onFocus={() => setShowTitleDropdown(true)}
                      onBlur={() => setShowTitleDropdown(false)}
                      disabled={!editSport.trim()}
                      placeholder={editSport.trim() ? "e.g. Head Coach" : "Select a sport first"} 
                      className={`w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1 transition-all ${!editSport.trim() ? 'opacity-50 cursor-not-allowed bg-slate-800' : ''}`} 
                    />
                    {showTitleDropdown && editSport.trim() && filteredTitles.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredTitles.map(title => (
                          <button
                            key={title}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setEditCoachTitle(title);
                              setShowTitleDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            {title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <button onClick={handleSaveProfile} disabled={isSavingProfile || !editFirstName.trim() || !editLastName.trim() || !editSchoolName.trim() || !editSport.trim() || !editCoachTitle.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center">
                    {isSavingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 relative z-30">
        
        {/* 🚨 HEADER 🚨 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 text-white flex items-center gap-3">
                  The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Network</span>
                  <button 
                    onClick={() => setShowHelpModal(true)} 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10 shadow-sm cursor-pointer group shrink-0"
                  >
                    <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-400 group-hover:text-blue-300" />
                  </button>
                </h1>
                <p className="text-slate-400 font-medium text-sm md:text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" /> Global PR Feed & Connections
                </p>
            </div>
            
            {/* Coach Profile Completion Warning */}
            {profileIncomplete && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                <button onClick={handleEditToggle} className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-400 text-white px-5 py-2.5 rounded-2xl font-black transition-all shadow-lg hover:-translate-y-0.5">
                  <AlertTriangle className="w-4 h-4" /> Complete Profile
                </button>
              </div>
            )}
        </div>

        {/* 🚨 MAIN TAB BAR 🚨 */}
        <div className="flex gap-4 mb-8 overflow-x-auto custom-scrollbar pb-1 border-b border-white/5 relative">
          <button 
            onClick={() => setFeedTab('feed')} 
            className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${feedTab === 'feed' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Activity className="w-4 h-4" /> Global Feed 
            {feedTab === 'feed' && (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
              </>
            )}
          </button>
          <button 
            onClick={() => setFeedTab('network')} 
            className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${feedTab === 'network' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Users className="w-4 h-4" /> {viewerRole === 'coach' ? 'Athlete Finder' : 'Coach Finder'}
            {feedTab === 'network' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />}
          </button>

          {viewerRole === 'athlete' && (
            <Link href="/customize" className="ml-auto pb-4 text-sm font-bold transition-all relative flex items-center gap-1.5 text-fuchsia-400 hover:text-fuchsia-300">
              <Paintbrush className="w-4 h-4" /> Customize Cards
            </Link>
          )}
        </div>

        {/* ======================= TAB: GLOBAL FEED ======================= */}
        {feedTab === 'feed' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                
                {/* 🚨 RECENT PRs WIDGET 🚨 */}
                {viewerRole === 'athlete' && myPRs.length > 0 && (
                  <div className="mb-8 bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-4 flex flex-wrap items-center gap-3 shadow-inner relative">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0 border-r border-white/10 pr-3">
                      <Trophy className="w-4 h-4 text-yellow-500" /> Top Marks
                    </div>
                    {myPRs.slice(0, 5).map((pr, idx) => (
                      <div key={idx} className="shrink-0 bg-black/30 border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{pr.event}</span>
                        <span className="text-sm font-black text-white">{pr.mark}</span>
                      </div>
                    ))}
                    
                    <div className="ml-auto shrink-0 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1.5 rounded-md border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" /> Coaches can view
                    </div>
                  </div>
                )}

                {/* FEED POSTS */}
                <div className="space-y-8">
                    {loading ? (
                        <FeedSkeleton />
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20 bg-white/[0.01] rounded-[2rem] border border-white/5 border-dashed relative overflow-hidden">
                            <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">The arena is quiet...</h3>
                            <p className="text-slate-500 text-sm">Be the first to ignite the feed with an update.</p>
                        </div>
                    ) : (
                        posts.map(post => {
                            if (!post.athletes) return null;

                            const isPRAlert = !!(post.linked_pr_event || (post.linked_prs && post.linked_prs.length > 0));
                            const likesCount = post.likes ? post.likes.length : 0;
                            const iLikedThis = post.likes ? post.likes.includes(currentUserId || '') : false;
                            
                            const allComments = post.comments || [];
                            const isCommentsOpen = expandedComments[post.id];
                            const commentsCount = allComments.length;

                            const prEvent = post.linked_pr_event || post.linked_prs?.[0]?.event;
                            const prMark = post.linked_pr_mark || post.linked_prs?.[0]?.mark;
                            const basePrs = post.athletes.base_prs || [];
                            
                            let improvementDelta = null;
                            if (prEvent && prMark && basePrs.length > 0) {
                                const baseRecord = basePrs.find(b => b.event === prEvent);
                                if (baseRecord && baseRecord.mark !== prMark) {
                                    const oldNum = parseMarkToNumber(baseRecord.mark, prEvent);
                                    const newNum = parseMarkToNumber(prMark, prEvent);
                                    const isField = FIELD_EVENTS.includes(prEvent);
                                    const delta = isField ? newNum - oldNum : oldNum - newNum;
                                    if (delta > 0) improvementDelta = formatDelta(delta, isField);
                                }
                            }

                            // 🚨 USE CENTRALIZED CARD CSS ENGINE
                            const cardStyles = getCardStyles(post.athletes.equipped_card, 'post');
                            const isMyPost = post.athlete_id === currentUserId;
                            const isEditingThisPost = editingPostId === post.id;

                            return (
                                <div key={post.id} className="relative z-0">
                                    {isPRAlert ? (
                                        // 🚨 SUPER DUPER HOLOGRAPHIC PR ALERT CARD 🚨
                                        <div className="relative group hover:-translate-y-1 transition-transform duration-500 z-10 hover:z-20">
                                            {cardStyles.isAnimated && <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-blue-600 to-cyan-500 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>}
                                            
                                            <div className={`${cardStyles.bgClass} ${cardStyles.isAnimated ? 'animate-foil border-white/20 shadow-2xl' : 'border-white/10 shadow-lg'} rounded-[2rem] p-6 sm:p-8 text-white relative overflow-hidden border`}>
                                                
                                                {/* Card Glare & Textures */}
                                                {cardStyles.hasGlare && <div className="holo-glare rounded-[2rem]"></div>}
                                                {cardStyles.isAnimated && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>}
                                                
                                                {/* Trophy only on premium/hype */}
                                                {cardStyles.hasTrophy && (
                                                  <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none z-10">
                                                      <Trophy size={200} className="animate-[spin_60s_linear_infinite]" />
                                                  </div>
                                                )}

                                                {/* 🚨 POST DROPDOWN MENU 🚨 */}
                                                <div className="absolute top-4 right-4 z-50 more-dropdown">
                                                  <button onClick={() => setActiveDropdown(activeDropdown === post.id ? null : post.id)} className="p-1.5 bg-black/20 hover:bg-black/40 rounded-lg text-white/70 hover:text-white transition-colors border border-white/10 backdrop-blur-md">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                  </button>
                                                  {activeDropdown === post.id && (
                                                    <div className="absolute right-0 mt-2 w-36 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden py-1">
                                                      {isMyPost ? (
                                                        <>
                                                          <button onClick={() => { setEditingPostId(post.id); setEditPostContent(post.content || ""); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                                            <Edit2 className="w-4 h-4" /> Edit
                                                          </button>
                                                          <button onClick={() => { handleDeletePost(post.id); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2 border-t border-white/5">
                                                            <Trash2 className="w-4 h-4" /> Delete
                                                          </button>
                                                        </>
                                                      ) : (
                                                        <button onClick={() => { setReportModal({ type: 'post', id: post.id, targetId: post.athlete_id, content: post.content }); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2">
                                                          <Flag className="w-4 h-4" /> Report
                                                        </button>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>

                                                <div className="relative z-20 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-6 pt-4">
                                                    
                                                    {/* INFO SECTION (Left Side) */}
                                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 flex-1 w-full min-w-0">
                                                        <div className="relative shrink-0">
                                                            {cardStyles.isAnimated && <div className="absolute inset-0 bg-white rounded-full blur-lg opacity-30 animate-pulse pointer-events-none"></div>}
                                                            <Link href={`/athlete/${post.athlete_id}`} className="relative shrink-0 transition-transform shadow-xl rounded-full border-2 border-white/40 bg-slate-900 block group-hover:scale-105 duration-300">
                                                                <AvatarWithBorder avatarUrl={post.athletes.avatar_url} sizeClasses="w-16 h-16 sm:w-20 sm:h-20" borderId={post.athletes.equipped_border || 'none'} />
                                                            </Link>
                                                        </div>

                                                        <div className="flex-1 text-center sm:text-left flex flex-col items-center sm:items-start w-full min-w-0">
                                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 shadow-sm ${cardStyles.isCustom ? 'bg-white/10 border border-white/20 text-white backdrop-blur-md' : 'bg-slate-700/50 border border-slate-600 text-slate-300'}`}>
                                                                <Zap className={`w-3 h-3 ${cardStyles.isCustom ? 'text-yellow-300 animate-pulse' : 'text-slate-400'}`}/> New Verified PR
                                                            </div>
                                                            <Link href={`/athlete/${post.athlete_id}`} className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight hover:text-white/80 transition-colors drop-shadow-md leading-none mb-2 flex items-center justify-center sm:justify-start gap-2 flex-wrap w-full">
                                                                <span>{post.athletes.first_name} {post.athletes.last_name}</span>
                                                                {post.athletes.is_premium && <Crown className="w-5 h-5 text-yellow-400 drop-shadow-sm shrink-0" />}
                                                            </Link>
                                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                                                                <span className="bg-black/20 px-2.5 py-1 rounded-md text-white/80 font-bold text-[9px] tracking-widest uppercase flex items-center gap-1 border border-white/5 backdrop-blur-sm">
                                                                    <MapPin className="w-3 h-3 opacity-80 shrink-0" /> <span className="truncate max-w-[150px]">{post.athletes.high_school}</span> <span className="hidden sm:inline">•</span> <span className="hidden sm:inline">{post.athletes.state}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* THE MARK SECTION (Right Side) */}
                                                    <div className={`${cardStyles.isCustom ? 'bg-black/20 border-white/20' : 'bg-black/40 border-slate-700/50'} backdrop-blur-md border p-6 rounded-[1.5rem] flex flex-col items-center justify-center shadow-inner w-full md:w-auto shrink-0 min-w-[180px]`}>
                                                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1 text-center ${cardStyles.isCustom ? 'text-white/70' : 'text-slate-400'}`}>{prEvent}</span>
                                                        <span className="text-[clamp(2.5rem,6vw,4.5rem)] leading-none font-black tracking-tighter text-white drop-shadow-md text-center whitespace-nowrap w-full">
                                                            {prMark}
                                                        </span>
                                                        {improvementDelta && (
                                                            <div className="mt-2 bg-white/20 px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-md shadow-sm flex items-center gap-1.5">
                                                                <TrendingUp className="w-3 h-3 text-green-300 shrink-0" />
                                                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white text-center">Improved by {improvementDelta}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Editable Post Content */}
                                                {(post.content || isEditingThisPost) && (
                                                    <div className="relative z-20 mt-6 bg-black/30 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-white/10 shadow-inner">
                                                        {isEditingThisPost ? (
                                                          <div className="flex flex-col gap-3">
                                                            <textarea 
                                                              value={editPostContent} 
                                                              onChange={(e) => setEditPostContent(e.target.value)}
                                                              placeholder="Say something about this PR..." 
                                                              className="w-full bg-black/40 text-white rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-white/50 resize-none h-24 border border-white/5" 
                                                            />
                                                            <div className="flex gap-2 justify-end">
                                                              <button onClick={() => setEditingPostId(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors">Cancel</button>
                                                              <button onClick={() => handleSavePostEdit(post.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition-colors shadow-sm">Save</button>
                                                            </div>
                                                          </div>
                                                        ) : (
                                                          <p className="text-sm md:text-base font-medium italic text-white/90 whitespace-pre-wrap">"{post.content}"</p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="relative z-20 mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        <div className="relative flex-1 sm:flex-none">
                                                            {coinPopId === post.id && <span className="coin-float">+2 💸</span>}
                                                            <button 
                                                                onClick={() => handleToggleFire(post.id, post.athlete_id)} 
                                                                className={`w-full flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-300 shadow-sm backdrop-blur-md ${iLikedThis ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-black/20 hover:bg-black/40 text-white border border-white/5 hover:border-white/10'} ${animatingHype === post.id ? 'hype-pop' : ''}`}
                                                            >
                                                                <Flame className={`w-3.5 h-3.5 ${iLikedThis ? 'fill-current text-orange-500 animate-pulse' : 'text-white'}`} /> {likesCount > 0 ? likesCount : 'Hype'}
                                                            </button>
                                                        </div>
                                                        <button onClick={() => toggleComments(post.id)} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm backdrop-blur-md ${isCommentsOpen ? 'bg-blue-600 text-white' : 'bg-black/20 hover:bg-black/40 text-white border border-white/5 hover:border-white/10'}`}>
                                                            <MessageSquare className="w-4 h-4" /> {commentsCount > 0 ? commentsCount : 'Comment'}
                                                        </button>
                                                    </div>
                                                    {viewerRole !== 'guest' && post.athlete_id !== currentUserId && (
                                                        <button onClick={() => openMessageModal(post.athlete_id, post.athletes.first_name, post.athletes.high_school, 'athlete')} className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-black text-slate-900 bg-white hover:bg-slate-200 px-5 py-2.5 rounded-xl transition-all shadow-lg hover:-translate-y-0.5">
                                                            <Mail className="w-4 h-4" /> Connect
                                                        </button>
                                                    )}
                                                </div>

                                                {/* PR ALERT PUBLIC COMMENTS */}
                                                {isCommentsOpen && (
                                                    <div className="mt-5 pt-5 border-t border-white/10 relative z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                            {allComments.map(comment => {
                                                              const isMyComment = comment.athlete_id === currentUserId;
                                                              const isEditingThisComment = editingCommentId === comment.id;

                                                              return (
                                                                <div key={comment.id} className="flex items-start gap-3 group/comment">
                                                                    <div className="shrink-0 pt-1">
                                                                        <AvatarWithBorder avatarUrl={comment.avatar_url} borderId={comment.border} sizeClasses="w-8 h-8 shadow-sm" />
                                                                    </div>
                                                                    <div className="bg-black/30 backdrop-blur-md border border-white/10 p-3 rounded-2xl rounded-tl-none text-white w-full max-w-[85%] shadow-inner relative">
                                                                        
                                                                        {/* Comment Dropdown */}
                                                                        <div className="absolute top-2 right-2 z-50 more-dropdown opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                                                          <button onClick={() => setActiveDropdown(activeDropdown === comment.id ? null : comment.id)} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors">
                                                                            <MoreHorizontal className="w-4 h-4" />
                                                                          </button>
                                                                          {activeDropdown === comment.id && (
                                                                            <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden py-1 z-50">
                                                                              {isMyComment ? (
                                                                                <>
                                                                                  <button onClick={() => { setEditingCommentId(comment.id); setEditCommentContent(comment.text); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                                                                    <Edit2 className="w-3 h-3" /> Edit
                                                                                  </button>
                                                                                  <button onClick={() => { handleDeleteComment(post.id, comment.id); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2 border-t border-white/5">
                                                                                    <Trash2 className="w-3 h-3" /> Delete
                                                                                  </button>
                                                                                </>
                                                                              ) : (
                                                                                <button onClick={() => { setReportModal({ type: 'comment', id: comment.id, targetId: comment.athlete_id, content: comment.text }); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2">
                                                                                  <Flag className="w-3 h-3" /> Report
                                                                                </button>
                                                                              )}
                                                                            </div>
                                                                          )}
                                                                        </div>

                                                                        <div className="flex items-center justify-between mb-1.5 pr-6">
                                                                            <p className="text-[10px] font-black opacity-80 flex items-center gap-2 uppercase tracking-widest">
                                                                                {comment.name}
                                                                                {comment.athlete_id === post.athlete_id && <span className="bg-blue-500 text-white text-[8px] px-2 py-0.5 rounded shadow-sm">Author</span>}
                                                                            </p>
                                                                            <span className="text-[9px] text-white/40 font-bold">{formatDate(comment.created_at)}</span>
                                                                        </div>
                                                                        
                                                                        {isEditingThisComment ? (
                                                                          <div className="flex flex-col gap-2 mt-2">
                                                                            <input 
                                                                              type="text" 
                                                                              value={editCommentContent} 
                                                                              onChange={(e) => setEditCommentContent(e.target.value)} 
                                                                              className="bg-black/40 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/50 w-full border border-white/5" 
                                                                            />
                                                                            <div className="flex gap-2 justify-end">
                                                                              <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] font-bold text-white transition-colors">Cancel</button>
                                                                              <button onClick={() => handleSaveCommentEdit(post.id, comment.id)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[10px] font-bold text-white transition-colors shadow-sm">Save</button>
                                                                            </div>
                                                                          </div>
                                                                        ) : (
                                                                          <p className="text-sm font-medium leading-relaxed pr-6">{comment.text}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                              );
                                                            })}
                                                            {allComments.length === 0 && <p className="text-xs text-white/50 font-bold italic text-center py-4">Be the first to hype this up!</p>}
                                                        </div>
                                                        {viewerRole !== 'guest' && (
                                                            <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-3 items-center bg-black/20 p-2 rounded-full border border-white/10 backdrop-blur-md w-full">
                                                                <input 
                                                                    type="text" 
                                                                    value={commentInputs[post.id] || ''} 
                                                                    onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})} 
                                                                    placeholder="Add a comment..." 
                                                                    className="flex-1 bg-transparent px-4 py-1.5 text-sm font-bold text-white placeholder:text-white/30 focus:outline-none w-full" 
                                                                />
                                                                <button type="submit" disabled={isSubmittingComment[post.id] || !commentInputs[post.id]?.trim()} className="bg-blue-600 hover:bg-blue-500 text-white w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-50 transition-transform hover:scale-105 active:scale-95 shrink-0">
                                                                    <Send className="w-3.5 h-3.5 ml-0.5" />
                                                                </button>
                                                            </form>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        // 📝 STANDARD FEED POST 📝
                                        <div className={`${cardStyles.bgClass} ${cardStyles.isAnimated ? 'animate-foil shadow-xl' : ''} ${cardStyles.borderClass} rounded-[2rem] p-6 sm:p-8 transition-all duration-300 relative group overflow-hidden border`}>
                                            
                                            {/* Card Glare & Textures */}
                                            {cardStyles.hasGlare && <div className="holo-glare rounded-[2rem]"></div>}
                                            {cardStyles.isAnimated && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>}
                                            
                                            {post.is_boosted && (
                                                <div className="absolute -top-3 -right-3 z-20 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1 border border-white/20 transform rotate-3">
                                                    <Rocket className="w-3 h-3" /> Boosted
                                                </div>
                                            )}

                                            {/* 🚨 POST DROPDOWN MENU 🚨 */}
                                            <div className="absolute top-4 right-4 z-50 more-dropdown opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button onClick={() => setActiveDropdown(activeDropdown === post.id ? null : post.id)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
                                                <MoreHorizontal className="w-5 h-5" />
                                              </button>
                                              {activeDropdown === post.id && (
                                                <div className="absolute right-0 mt-2 w-36 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden py-1">
                                                  {post.athlete_id === currentUserId ? (
                                                    <>
                                                      <button onClick={() => { setEditingPostId(post.id); setEditPostContent(post.content || ""); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                                        <Edit2 className="w-4 h-4" /> Edit
                                                      </button>
                                                      <button onClick={() => { handleDeletePost(post.id); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2 border-t border-white/5">
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                      </button>
                                                    </>
                                                  ) : (
                                                    <button onClick={() => { setReportModal({ type: 'post', id: post.id, targetId: post.athlete_id, content: post.content }); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2">
                                                      <Flag className="w-4 h-4" /> Report
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                            
                                            <div className="relative z-20 flex justify-between items-start mb-5 pt-2">
                                                <div className="flex items-center gap-4">
                                                    <Link href={`/athlete/${post.athlete_id}`} className="shrink-0 hover:scale-105 transition-transform shadow-md rounded-full border border-white/5">
                                                        <AvatarWithBorder avatarUrl={post.athletes.avatar_url} sizeClasses="w-12 h-12" borderId={post.athletes.equipped_border || 'none'} />
                                                    </Link>
                                                    <div>
                                                        <Link href={`/athlete/${post.athlete_id}`} className={`font-black text-lg transition-colors tracking-tight leading-none flex items-center gap-1.5 ${post.athletes.is_premium ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 hover:to-blue-500' : 'text-white hover:text-blue-400'}`}>
                                                            {post.athletes.first_name} {post.athletes.last_name}
                                                            {post.athletes.is_premium && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                                                        </Link>
                                                        <div className="flex items-center flex-wrap gap-2 mt-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                                <span className="truncate max-w-[120px]">{post.athletes.high_school}</span> <span className="hidden sm:inline">•</span> <span className="hidden sm:inline">{formatDate(post.created_at)}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Editable Post Content */}
                                            {editingPostId === post.id ? (
                                              <div className="relative z-20 flex flex-col gap-3 mb-5">
                                                <textarea 
                                                  value={editPostContent} 
                                                  onChange={(e) => setEditPostContent(e.target.value)} 
                                                  className="w-full bg-black/40 text-white rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-white/50 resize-none h-24 border border-white/5" 
                                                />
                                                <div className="flex gap-2 justify-end">
                                                  <button onClick={() => setEditingPostId(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors">Cancel</button>
                                                  <button onClick={() => handleSavePostEdit(post.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition-colors shadow-sm">Save</button>
                                                </div>
                                              </div>
                                            ) : (
                                              <p className="relative z-20 text-white font-medium whitespace-pre-wrap mb-5 leading-relaxed text-sm sm:text-base pr-8">
                                                  {post.content}
                                              </p>
                                            )}
                                            
                                            {post.image_url && (
                                                <div className="relative z-20 rounded-2xl overflow-hidden border border-white/5 shadow-md mb-6 group-hover:shadow-lg transition-shadow">
                                                    <img src={post.image_url} alt="" className="max-h-[400px] w-full object-cover transform hover:scale-105 transition-transform duration-700" />
                                                </div>
                                            )}

                                            <div className="relative z-20 border-t border-white/10 pt-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                                    <div className="relative flex-1 sm:flex-none">
                                                        {coinPopId === post.id && <span className="coin-float">+2 💸</span>}
                                                        <button 
                                                            onClick={() => handleToggleFire(post.id, post.athlete_id)} 
                                                            className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-300 shadow-sm backdrop-blur-md ${iLikedThis ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-black/20 hover:bg-black/40 text-white border border-white/5 hover:border-white/10'} ${animatingHype === post.id ? 'hype-pop' : ''}`}
                                                        >
                                                            <Flame className={`w-3.5 h-3.5 ${iLikedThis ? 'fill-current text-orange-500 animate-pulse' : 'text-white'}`} /> {likesCount > 0 ? likesCount : 'Hype'}
                                                        </button>
                                                    </div>
                                                    <button onClick={() => toggleComments(post.id)} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm backdrop-blur-md ${isCommentsOpen ? 'bg-blue-600 text-white' : 'bg-black/20 hover:bg-black/40 text-white border border-white/5 hover:border-white/10'}`}>
                                                        <MessageSquare className="w-3.5 h-3.5" /> {commentsCount > 0 ? commentsCount : 'Comment'}
                                                    </button>
                                                </div>
                                                
                                                {viewerRole !== 'guest' && post.athlete_id !== currentUserId && (
                                                    <button onClick={() => openMessageModal(post.athlete_id, post.athletes.first_name, post.athletes.high_school, 'athlete')} className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-black bg-white/10 backdrop-blur-md text-white hover:bg-white px-5 py-2.5 rounded-xl transition-colors hover:text-slate-900">
                                                        <Mail className="w-3.5 h-3.5" /> Connect
                                                    </button>
                                                )}
                                            </div>

                                            {/* STANDARD POST PUBLIC COMMENTS */}
                                            {isCommentsOpen && (
                                                <div className="mt-5 pt-5 border-t border-white/10 relative z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                        {allComments.map(comment => {
                                                          const isMyComment = comment.athlete_id === currentUserId;
                                                          const isEditingThisComment = editingCommentId === comment.id;

                                                          return (
                                                            <div key={comment.id} className="flex items-start gap-3 group/comment">
                                                                <div className="shrink-0 pt-1">
                                                                    <AvatarWithBorder avatarUrl={comment.avatar_url} borderId={comment.border} sizeClasses="w-8 h-8 shadow-sm" />
                                                                </div>
                                                                <div className="bg-black/30 backdrop-blur-md border border-white/10 p-3 rounded-2xl rounded-tl-none text-white w-full max-w-[85%] shadow-inner relative">
                                                                    
                                                                    {/* Comment Dropdown */}
                                                                    <div className="absolute top-2 right-2 z-50 more-dropdown opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                                                      <button onClick={() => setActiveDropdown(activeDropdown === comment.id ? null : comment.id)} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors">
                                                                        <MoreHorizontal className="w-4 h-4" />
                                                                      </button>
                                                                      {activeDropdown === comment.id && (
                                                                        <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden py-1 z-50">
                                                                          {isMyComment ? (
                                                                            <>
                                                                              <button onClick={() => { setEditingCommentId(comment.id); setEditCommentContent(comment.text); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                                                                                <Edit2 className="w-3 h-3" /> Edit
                                                                              </button>
                                                                              <button onClick={() => { handleDeleteComment(post.id, comment.id); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2 border-t border-white/5">
                                                                                <Trash2 className="w-3 h-3" /> Delete
                                                                              </button>
                                                                            </>
                                                                          ) : (
                                                                            <button onClick={() => { setReportModal({ type: 'comment', id: comment.id, targetId: comment.athlete_id, content: comment.text }); setActiveDropdown(null); }} className="w-full text-left px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2">
                                                                              <Flag className="w-3 h-3" /> Report
                                                                            </button>
                                                                          )}
                                                                        </div>
                                                                      )}
                                                                    </div>

                                                                    <div className="flex items-center justify-between mb-1.5 pr-6">
                                                                        <p className="text-[10px] font-black opacity-80 flex items-center gap-2 uppercase tracking-widest">
                                                                            {comment.name}
                                                                            {comment.athlete_id === post.athlete_id && <span className="bg-blue-500 text-white text-[8px] px-2 py-0.5 rounded shadow-sm">Author</span>}
                                                                        </p>
                                                                        <span className="text-[9px] text-white/40 font-bold">{formatDate(comment.created_at)}</span>
                                                                    </div>
                                                                    
                                                                    {isEditingThisComment ? (
                                                                      <div className="flex flex-col gap-2 mt-2">
                                                                        <input 
                                                                          type="text" 
                                                                          value={editCommentContent} 
                                                                          onChange={(e) => setEditCommentContent(e.target.value)} 
                                                                          className="bg-black/40 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/50 w-full border border-white/5" 
                                                                        />
                                                                        <div className="flex gap-2 justify-end">
                                                                          <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] font-bold text-white transition-colors">Cancel</button>
                                                                          <button onClick={() => handleSaveCommentEdit(post.id, comment.id)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[10px] font-bold text-white transition-colors shadow-sm">Save</button>
                                                                        </div>
                                                                      </div>
                                                                    ) : (
                                                                      <p className="text-sm font-medium leading-relaxed pr-6">{comment.text}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                          );
                                                        })}
                                                        {allComments.length === 0 && <p className="text-xs text-white/50 font-bold italic text-center py-4">Be the first to hype this up!</p>}
                                                    </div>
                                                    {viewerRole !== 'guest' && (
                                                        <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-3 items-center bg-black/20 p-2 rounded-full border border-white/10 backdrop-blur-md w-full">
                                                            <input 
                                                                type="text" 
                                                                value={commentInputs[post.id] || ''} 
                                                                onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})} 
                                                                placeholder="Add a comment..." 
                                                                className="flex-1 bg-transparent px-4 py-1.5 text-sm font-bold text-white placeholder:text-white/30 focus:outline-none w-full" 
                                                            />
                                                            <button type="submit" disabled={isSubmittingComment[post.id] || !commentInputs[post.id]?.trim()} className="bg-blue-600 hover:bg-blue-500 text-white w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-50 transition-transform hover:scale-105 active:scale-95 shrink-0">
                                                                <Send className="w-3.5 h-3.5 ml-0.5" />
                                                            </button>
                                                        </form>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        )}

        {/* ======================= TAB: NETWORK DIRECTORY ======================= */}
        {feedTab === 'network' && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                
                {/* 🚨 ULTRA-GLASSY ENHANCED SEARCH FILTERS 🚨 */}
                <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] p-6 md:p-8 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] mb-10 z-20 relative overflow-visible">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 rounded-[2.5rem] pointer-events-none"></div>
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-5 items-center justify-between">
                      <div className="relative group flex-1 w-full">
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
                          <input 
                              type="text" 
                              placeholder={viewerRole === 'coach' ? "Search athletes by name or high school..." : "Search college programs or coach names..."}
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-black/20 border border-white/5 hover:border-white/10 rounded-[1.5rem] pl-14 pr-6 py-4 text-white font-bold focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm md:text-base placeholder:text-slate-500 shadow-inner backdrop-blur-md"
                          />
                      </div>
                      {viewerRole === 'coach' && (
                        <button onClick={() => setShowScoringModal(true)} className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-4 py-2.5 rounded-xl shrink-0 w-full sm:w-auto h-full min-h-[54px]">
                          <Info className="w-4 h-4" /> Scoring Guide
                        </button>
                      )}
                    </div>

                    {viewerRole !== 'coach' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative group">
                          <select 
                            value={filterDivision} 
                            onChange={e => setFilterDivision(e.target.value)}
                            className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all shadow-inner backdrop-blur-md"
                          >
                            <option value="" className="bg-slate-900">All Divisions</option>
                            <option value="NCAA D1" className="bg-slate-900">NCAA D1</option>
                            <option value="NCAA D2" className="bg-slate-900">NCAA D2</option>
                            <option value="NCAA D3" className="bg-slate-900">NCAA D3</option>
                            <option value="NAIA" className="bg-slate-900">NAIA</option>
                            <option value="NJCAA" className="bg-slate-900">NJCAA / JUCO</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors pointer-events-none" />
                        </div>

                        <div className="relative group">
                          <select 
                            value={filterSport} 
                            onChange={e => setFilterSport(e.target.value)}
                            className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all shadow-inner backdrop-blur-md"
                          >
                            <option value="" className="bg-slate-900">All Sports</option>
                            {SPORT_OPTIONS.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors pointer-events-none" />
                        </div>

                        <div className="relative group">
                          <select 
                            value={filterTitle} 
                            onChange={e => setFilterTitle(e.target.value)}
                            className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all shadow-inner backdrop-blur-md"
                          >
                            <option value="" className="bg-slate-900">All Titles / Jobs</option>
                            {COACH_TITLES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors pointer-events-none" />
                        </div>
                      </div>
                    ) : (
                      // 🏃‍♂️ ATHLETE FILTERS FOR COACHES 🏃‍♂️
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="relative group">
                          <select 
                            value={filterAthleteState} 
                            onChange={e => setFilterAthleteState(e.target.value)}
                            className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all shadow-inner backdrop-blur-md"
                          >
                            <option value="" className="bg-slate-900">State</option>
                            {Array.from(new Set(recruitsList.map(r => r.state).filter(Boolean))).sort().map(s => (
                              <option key={s} value={s} className="bg-slate-900">{s}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors pointer-events-none" />
                        </div>

                        <div className="relative group">
                          <select 
                            value={filterGradYear} 
                            onChange={e => setFilterGradYear(e.target.value)}
                            className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all shadow-inner backdrop-blur-md"
                          >
                            <option value="" className="bg-slate-900">Class</option>
                            {validGradYears.map(y => (
                              <option key={y} value={y.toString()} className="bg-slate-900">{y}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors pointer-events-none" />
                        </div>

                        <div className="relative group">
                          <select 
                            value={filterGender} 
                            onChange={e => setFilterGender(e.target.value)}
                            className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 appearance-none cursor-pointer transition-all shadow-inner backdrop-blur-md"
                          >
                            <option value="" className="bg-slate-900">Gender</option>
                            <option value="Boys" className="bg-slate-900">Boys</option>
                            <option value="Girls" className="bg-slate-900">Girls</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors pointer-events-none" />
                        </div>
                        
                        <div className="relative col-span-2 md:col-span-1 group">
                          <input 
                            type="text" 
                            value={filterEvent} 
                            onChange={e => { setFilterEvent(e.target.value); setShowEventDropdown(true); }}
                            onFocus={() => setShowEventDropdown(true)}
                            onBlur={() => setTimeout(() => setShowEventDropdown(false), 200)}
                            placeholder="Event (e.g. 100)"
                            className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500 shadow-inner backdrop-blur-md"
                          />
                          {showEventDropdown && filterEvent && (
                            <div className="absolute z-50 w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                              {ALL_TRACK_EVENTS.filter(e => e.toLowerCase().includes(filterEvent.toLowerCase())).map(ev => (
                                <button
                                  key={ev}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setFilterEvent(ev);
                                    setShowEventDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b border-white/5 last:border-0"
                                >
                                  {ev}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="relative col-span-2 md:col-span-1 group">
                          <Target className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${!filterEvent ? 'text-slate-600' : 'text-indigo-400'}`} />
                          <input 
                            type="number" 
                            placeholder="Min Score..."
                            value={filterTargetScore}
                            onChange={e => setFilterTargetScore(e.target.value)}
                            disabled={!filterEvent}
                            className="w-full bg-black/20 border border-white/5 hover:border-white/10 text-white text-sm font-bold rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner backdrop-blur-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>

                        {/* VISUAL SORT INDICATOR */}
                        {filterEvent && (
                          <div className="col-span-2 md:col-span-5 flex justify-end animate-in fade-in slide-in-from-top-2 duration-300 mt-2">
                            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg backdrop-blur-md shadow-inner">
                              <ArrowDownWideNarrow className="w-3.5 h-3.5" /> Sorting By Highest Score First
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>

                {showingCoachRecommendations && (
                  <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-blue-400 font-black text-sm">Recommended Contacts</h4>
                      <p className="text-blue-200/70 text-xs font-medium mt-1">
                        We couldn't find a coach with that exact title at your target school, but here are the other coaches from that program who can help you get recruited!
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {viewerRole !== 'coach' ? (
                        // 🎓 COACHES DIRECTORY 🎓
                        displayCoaches.length > 0 ? (
                            displayCoaches.map(coach => (
                                <div key={coach.id} className="bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-500 flex flex-col justify-between h-full group hover:-translate-y-1 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full z-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start gap-4 mb-6 relative z-10">
                                        <AvatarWithBorder avatarUrl={coach.avatar_url} sizeClasses="w-16 h-16 shadow-md border border-white/5" borderId="none" userRole="coach" />
                                        <div className="pt-1 w-full min-w-0">
                                            <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors leading-tight truncate">Coach {coach.last_name}</h3>
                                            
                                            <div className="flex flex-col gap-1.5 mt-1.5">
                                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 truncate">
                                                <School className="w-3 h-3 shrink-0" /> <span className="truncate">{coach.school_name}</span>
                                              </p>
                                              
                                              {(coach.coach_title || coach.sport) && (
                                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 truncate">
                                                  <Briefcase className="w-3 h-3 shrink-0" /> 
                                                  <span className="truncate">{coach.coach_title || 'Coach'} • {coach.sport || 'Athletics'}</span>
                                                </p>
                                              )}

                                              {coach.division && (
                                                <div className="mt-1">
                                                  <span className="text-[9px] font-black text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest backdrop-blur-md">
                                                    {coach.division}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => openMessageModal(coach.id, `Coach ${coach.last_name}`, coach.school_name || 'Coach', 'coach')}
                                        className="w-full bg-white/10 hover:bg-blue-600 text-white font-black py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm relative z-10 backdrop-blur-md shadow-inner"
                                    >
                                        <Mail className="w-4 h-4" /> Message Coach
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-1 sm:col-span-2 text-center py-20 bg-white/[0.03] backdrop-blur-xl rounded-[2rem] border border-white/5 border-dashed shadow-inner">
                                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">No coaches found</h3>
                                <p className="text-slate-500 text-sm">Try adjusting your filters or searching for a different school.</p>
                            </div>
                        )
                    ) : (
                        // 🏃‍♂️ ATHLETES DIRECTORY (COACH VIEW) 🏃‍♂️
                        displayAthletes.length > 0 ? (
                            displayAthletes.map(athlete => {
                                // Event Filtering Override Logic
                                let targetScore = 0;
                                let targetTier = 'Unranked';
                                let isTargetedScore = false;

                                if (filterEvent && athlete.prs) {
                                  const targetPr = athlete.prs.find(p => p.event.toLowerCase() === filterEvent.toLowerCase());
                                  if (targetPr) {
                                    targetScore = getEventScore(targetPr.mark, targetPr.event, athlete.gender || 'Boys');
                                    targetTier = getScoreTier(targetScore);
                                    isTargetedScore = true;
                                  }
                                }

                                if (!isTargetedScore) {
                                  const projection = athlete.prs && athlete.prs.length > 0 
                                    ? getAthleteProjection(athlete.prs, athlete.gender || 'Boys') 
                                    : { overallScore: 0, overallLabel: 'Unranked', bestEvent: 'N/A' };
                                  targetScore = projection.overallScore;
                                  targetTier = projection.overallLabel;
                                }
                                  
                                // Make sure targeted event floats to the front
                                const prsToDisplay = athlete.prs ? [...athlete.prs] : [];
                                if (filterEvent) {
                                  prsToDisplay.sort((a, b) => (a.event.toLowerCase() === filterEvent.toLowerCase() ? -1 : b.event.toLowerCase() === filterEvent.toLowerCase() ? 1 : 0));
                                }

                                // 🚨 MAP EQUIPPED BACKGROUND CARD TO THE DIRECTORY CARD 🚨
                                const cardStyles = getCardStyles(athlete.equipped_card, 'dir');

                                return (
                                  <div key={athlete.id} className={`${cardStyles.bgClass} ${cardStyles.isFoil ? 'animate-foil shadow-lg' : ''} ${cardStyles.borderClass} backdrop-blur-xl rounded-[2rem] p-6 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-500 flex flex-col justify-between h-full group hover:-translate-y-1 relative overflow-hidden border`}>
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full z-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                      
                                      {/* GLOWS & TEXTURES FOR PREMIUM CARDS */}
                                      {cardStyles.hasGlare && <div className="holo-glare rounded-[2rem]"></div>}
                                      {cardStyles.isFoil && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>}

                                      <div className="flex items-start gap-4 mb-6 relative z-10">
                                          <Link href={`/athlete/${athlete.id}`} className="shrink-0 hover:scale-105 transition-transform block shadow-xl rounded-full bg-slate-900 border-2 border-white/20">
                                              <AvatarWithBorder avatarUrl={athlete.avatar_url} sizeClasses="w-16 h-16 shadow-md" borderId={athlete.equipped_border || 'none'} />
                                          </Link>
                                          <div className="min-w-0 pt-1 w-full">
                                              <div className="flex items-center justify-between gap-2">
                                                <Link href={`/athlete/${athlete.id}`} className="text-left font-bold text-lg text-white group-hover:text-indigo-400 transition-colors leading-tight truncate w-full flex items-center gap-1.5">
                                                    {athlete.first_name} {athlete.last_name}
                                                    {athlete.is_premium && <Crown className="w-3.5 h-3.5 text-yellow-400 drop-shadow-sm shrink-0" />}
                                                </Link>
                                              </div>

                                              <div className="flex flex-col gap-1 mt-1">
                                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                                                      {athlete.high_school}
                                                  </p>
                                                  
                                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                    <p className="text-[9px] font-black text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30 uppercase tracking-widest backdrop-blur-md">
                                                        Class of {athlete.grad_year || 'N/A'}
                                                    </p>
                                                    {targetScore > 0 && (
                                                      <p className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest backdrop-blur-md flex items-center gap-1 ${
                                                        targetScore >= 85 ? 'text-amber-300 bg-amber-500/20 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
                                                        targetScore >= 65 ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' :
                                                        'text-blue-300 bg-blue-500/20 border-blue-500/30'
                                                      }`}>
                                                          <Star className="w-3 h-3" /> {filterEvent ? `${filterEvent}:` : 'OVR Score:'} {targetScore}
                                                      </p>
                                                    )}
                                                    {athlete.is_looking_for_college && (
                                                      <p className="text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1 backdrop-blur-md">
                                                          <Target className="w-2.5 h-2.5" /> Recruiting
                                                      </p>
                                                    )}
                                                  </div>
                                                  
                                                  {/* ADDED PRs FOR COACHES TO VIEW */}
                                                  {prsToDisplay.length > 0 && (
                                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                                          {prsToDisplay.slice(0, 2).map((pr, i) => {
                                                              const isTargeted = filterEvent && filterEvent.toLowerCase() === pr.event.toLowerCase();
                                                              return (
                                                                <div key={i} className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 shadow-inner border backdrop-blur-md ${isTargeted ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-black/20 border-white/10'}`}>
                                                                    <span className={`text-[8px] uppercase font-bold ${isTargeted ? 'text-indigo-300' : 'text-slate-400'}`}>{pr.event}</span>
                                                                    <span className={`text-[10px] font-black ${isTargeted ? 'text-white' : 'text-white'}`}>{pr.mark}</span>
                                                                </div>
                                                              );
                                                          })}
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 mt-auto relative z-10">
                                          <Link href={`/athlete/${athlete.id}`} className="bg-black/20 hover:bg-black/40 text-white border border-white/10 font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs backdrop-blur-md shadow-inner">
                                              <UserCircle2 className="w-4 h-4" /> Profile
                                          </Link>
                                          <button 
                                              onClick={() => openMessageModal(athlete.id, athlete.first_name, athlete.high_school, 'athlete')}
                                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs shadow-lg border border-indigo-500"
                                          >
                                              <Mail className="w-4 h-4" /> Message
                                          </button>
                                      </div>
                                  </div>
                                );
                            })
                        ) : (
                            <div className="col-span-1 sm:col-span-2 text-center py-20 bg-white/[0.03] backdrop-blur-xl rounded-[2rem] border border-white/5 border-dashed shadow-inner">
                                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">No athletes found</h3>
                                <p className="text-slate-500 text-sm">Try adjusting your filters or searching for a different name.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        )}

      </div>

      {/* 🚨 MESSAGING MODAL WITH UNDERCLASSMAN WARNING 🚨 */}
      {isMessageModalOpen && messageRecipient && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMessageModalOpen(false)}></div>
          <div className="bg-[#0f172a] rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-400 border border-white/10">
            <div className="bg-white/[0.02] border-b border-white/5 p-6 md:p-8 flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-white tracking-tight">Message</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5"><Target className="w-3 h-3 text-blue-500"/> {messageRecipient.name}</p>
                </div>
              </div>
              <button onClick={() => setIsMessageModalOpen(false)} className="relative z-10 p-2 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white rounded-full transition-colors border border-transparent hover:border-white/10"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 md:p-8">
              {sendSuccess ? (
                <div className="text-center py-8 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-500/30">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h4 className="text-3xl font-black text-white mb-2 tracking-tight">Delivered!</h4>
                  <p className="text-slate-400 text-sm">Sent directly to {messageRecipient.name}'s secure inbox.</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* UNDERCLASSMAN NCAA WARNING BANNER */}
                  {!isUpperclassman && messageRecipient.role === 'coach' && (
                     <div className="bg-amber-500/10 border border-amber-500/30 rounded-[1.5rem] p-5 flex items-start gap-4 shadow-inner">
                         <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                         <div>
                             <h4 className="font-black text-amber-400 text-sm mb-1">NCAA Underclassman Alert</h4>
                             <p className="text-[11px] font-medium text-amber-200/70 leading-relaxed">
                                 Because you are a Freshman or Sophomore, NCAA rules prohibit coaches from replying to your direct messages until June 15th after your Sophomore year. <strong className="text-amber-400 font-black">They will still receive this message</strong>, but cannot respond yet.
                             </p>
                         </div>
                     </div>
                  )}

                  <textarea 
                    required
                    value={messageContent}
                    onChange={e => setMessageContent(e.target.value)}
                    placeholder="Write your secure message..."
                    className="w-full bg-black/40 border border-white/10 text-white rounded-[1.5rem] p-5 h-40 resize-none focus:outline-none focus:border-blue-500/50 font-medium text-sm placeholder:text-slate-600 transition-all"
                  />
                  <button type="submit" disabled={isSending || !messageContent.trim()} className="w-full bg-white hover:bg-slate-200 text-slate-900 font-black py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    {isSending ? 'Encrypting & Sending...' : <><Send className="w-4 h-4" /> Send Secure Message</>}
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