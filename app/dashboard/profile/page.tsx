'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Camera, Check, CheckCircle2, CheckSquare, ChevronDown, ChevronRight, Download, 
  Edit3, FileText, Globe, ImageIcon, Info, LinkIcon, Lock, 
  Paintbrush, Plus, RefreshCw, Save, Square, Trash2, Trophy, UserCircle2, X,
  MapPin, Calendar, User, BookOpen, Star, Zap, ExternalLink, AlertCircle
} from 'lucide-react';
import { AvatarWithBorder } from '@/components/AnimatedBorders';
import EmailVerification from '@/components/EmailVerification';
import { Points } from '@/components/Points';
import { SUGGESTED_MAJORS, evaluateMetric, SPORT_CONFIGS_META } from '@/utils/constants/RecruitingStandards';

// --- STRICT US STATE MAPPING ---
const US_STATES_MAP = [
  { abbr: 'AL', name: 'Alabama' }, { abbr: 'AK', name: 'Alaska' }, { abbr: 'AZ', name: 'Arizona' },
  { abbr: 'AR', name: 'Arkansas' }, { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DE', name: 'Delaware' }, { abbr: 'FL', name: 'Florida' },
  { abbr: 'GA', name: 'Georgia' }, { abbr: 'HI', name: 'Hawaii' }, { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' }, { abbr: 'IN', name: 'Indiana' }, { abbr: 'IA', name: 'Iowa' },
  { abbr: 'KS', name: 'Kansas' }, { abbr: 'KY', name: 'Kentucky' }, { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' }, { abbr: 'MD', name: 'Maryland' }, { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MI', name: 'Michigan' }, { abbr: 'MN', name: 'Minnesota' }, { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' }, { abbr: 'MT', name: 'Montana' }, { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NV', name: 'Nevada' }, { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' }, { abbr: 'NY', name: 'New York' }, { abbr: 'NC', name: 'North Carolina' },
  { abbr: 'ND', name: 'North Dakota' }, { abbr: 'OH', name: 'Ohio' }, { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' }, { abbr: 'PA', name: 'Pennsylvania' }, { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' }, { abbr: 'SD', name: 'South Dakota' }, { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' }, { abbr: 'UT', name: 'Utah' }, { abbr: 'VT', name: 'Vermont' },
  { abbr: 'VA', name: 'Virginia' }, { abbr: 'WA', name: 'Washington' }, { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WY', name: 'Wyoming' }
];

// --- CORE RECRUITING DATA STRUCTURES FOR LOCAL CALCULATIONS ---
const RECRUITING_STANDARDS_DASHBOARD: Record<string, Record<string, { t1: number, t2: number, t3: number, t4: number, t5: number, t6: number, t7: number, isField?: boolean, isMulti?: boolean }>> = {
  'Boys': {
    '55 Meters': { t1: 6.30, t2: 6.45, t3: 6.60, t4: 6.75, t5: 6.90, t6: 7.10, t7: 7.50 },
    '60 Meters': { t1: 6.75, t2: 6.90, t3: 7.05, t4: 7.20, t5: 7.40, t6: 7.60, t7: 8.00 },
    '100 Meters': { t1: 10.5, t2: 10.8, t3: 11.0, t4: 11.3, t5: 11.6, t6: 11.9, t7: 12.6 },
    '200 Meters': { t1: 21.2, t2: 21.8, t3: 22.2, t4: 22.8, t5: 23.5, t6: 24.5, t7: 26.0 },
    '300 Meters': { t1: 34.0, t2: 35.0, t3: 36.0, t4: 37.0, t5: 38.5, t6: 40.0, t7: 43.0 },
    '400 Meters': { t1: 47.5, t2: 49.0, t3: 50.0, t4: 51.5, t5: 53.0, t6: 55.0, t7: 58.0 },
    '500 Meters': { t1: 64.0, t2: 65.5, t3: 67.0, t4: 69.0, t5: 72.0, t6: 75.0, t7: 80.0 },
    '600 Meters': { t1: 79.0, t2: 81.0, t3: 83.0, t4: 86.0, t5: 89.0, t6: 93.0, t7: 100.0 },
    '800 Meters': { t1: 112, t2: 115, t3: 117, t4: 120, t5: 125, t6: 130, t7: 140 }, 
    '1000 Meters': { t1: 147, t2: 151, t3: 155, t4: 160, t5: 165, t6: 172, t7: 185 },
    '1500 Meters': { t1: 231, t2: 239, t3: 244, t4: 250, t5: 264, t6: 275, t7: 300 },
    '1600 Meters': { t1: 250, t2: 258, t3: 264, t4: 270, t5: 285, t6: 295, t7: 320 }, 
    '1 Mile': { t1: 252, t2: 260, t3: 266, t4: 272, t5: 287, t6: 297, t7: 323 },
    '3000 Meters': { t1: 505, t2: 520, t3: 535, t4: 550, t5: 575, t6: 605, t7: 650 },
    '3200 Meters': { t1: 535, t2: 555, t3: 570, t4: 585, t5: 610, t6: 645, t7: 690 },
    '2 Mile': { t1: 538, t2: 558, t3: 573, t4: 588, t5: 613, t6: 648, t7: 694 },
    '5000 Meters': { t1: 870, t2: 900, t3: 930, t4: 960, t5: 1005, t6: 1050, t7: 1140 },
    '10000 Meters': { t1: 1830, t2: 1890, t3: 1950, t4: 2010, t5: 2100, t6: 2200, t7: 2400 },
    '55m Hurdles': { t1: 7.30, t2: 7.50, t3: 7.75, t4: 8.00, t5: 8.30, t6: 8.70, t7: 9.50 },
    '60m Hurdles': { t1: 7.78, t2: 8.00, t3: 8.25, t4: 8.50, t5: 8.80, t6: 9.20, t7: 10.00 },
    '110m Hurdles': { t1: 13.8, t2: 14.2, t3: 14.6, t4: 15.0, t5: 15.5, t6: 16.5, t7: 18.5 },
    '300m Hurdles': { t1: 37.0, t2: 38.5, t3: 39.5, t4: 41.0, t5: 42.5, t6: 44.5, t7: 48.0 },
    '400m Hurdles': { t1: 52.0, t2: 53.5, t3: 55.0, t4: 57.0, t5: 59.5, t6: 62.0, t7: 66.0 },
    '2000m Steeplechase': { t1: 360, t2: 375, t3: 390, t4: 410, t5: 430, t6: 460, t7: 500 },
    '3000m Steeplechase': { t1: 540, t2: 565, t3: 585, t4: 610, t5: 640, t6: 680, t7: 740 },
    'Long Jump': { t1: 288, t2: 270, t3: 260, t4: 252, t5: 240, t6: 228, t7: 204, isField: true }, 
    'Triple Jump': { t1: 576, t2: 552, t3: 528, t4: 504, t5: 480, t6: 456, t7: 420, isField: true }, 
    'High Jump': { t1: 82, t2: 78, t3: 76, t4: 74, t5: 70, t6: 66, t7: 60, isField: true }, 
    'Pole Vault': { t1: 198, t2: 186, t3: 174, t4: 162, t5: 150, t6: 132, t7: 108, isField: true },
    'Shot Put': { t1: 720, t2: 660, t3: 600, t4: 540, t5: 480, t6: 444, t7: 360, isField: true }, 
    'Discus': { t1: 2220, t2: 2040, t3: 1860, t4: 1740, t5: 1620, t6: 1440, t7: 1080, isField: true },
    'Javelin': { t1: 2280, t2: 2100, t3: 1920, t4: 1740, t5: 1560, t6: 1380, t7: 1200, isField: true },
    'Hammer Throw': { t1: 2400, t2: 2160, t3: 1920, t4: 1680, t5: 1440, t6: 1200, t7: 960, isField: true },
    'Weight Throw': { t1: 864, t2: 780, t3: 720, t4: 660, t5: 600, t6: 540, t7: 480, isField: true },
    'Pentathlon': { t1: 3600, t2: 3400, t3: 3100, t4: 2800, t5: 2500, t6: 2200, t7: 1900, isMulti: true },
    'Heptathlon': { t1: 5200, t2: 4800, t3: 4400, t4: 4000, t5: 3600, t6: 3200, t7: 2800, isMulti: true },
    'Decathlon': { t1: 6800, t2: 6400, t3: 6000, t4: 5500, t5: 5000, t6: 4500, t7: 4000, isMulti: true }
  },
  'Girls': {
    '55 Meters': { t1: 6.95, t2: 7.15, t3: 7.35, t4: 7.55, t5: 7.80, t6: 8.10, t7: 8.60 },
    '60 Meters': { t1: 7.45, t2: 7.65, t3: 7.85, t4: 8.05, t5: 8.30, t6: 8.60, t7: 9.20 },
    '100 Meters': { t1: 11.7, t2: 12.1, t3: 12.4, t4: 12.8, t5: 13.2, t6: 13.6, t7: 14.5 },
    '200 Meters': { t1: 24.2, t2: 24.8, t3: 25.5, t4: 26.2, t5: 27.0, t6: 28.5, t7: 31.0 },
    '300 Meters': { t1: 39.0, t2: 40.5, t3: 41.5, t4: 43.0, t5: 45.0, t6: 47.0, t7: 51.0 },
    '400 Meters': { t1: 54.5, t2: 57.0, t3: 58.5, t4: 60.5, t5: 63.0, t6: 66.0, t7: 72.0 },
    '500 Meters': { t1: 74.0, t2: 76.5, t3: 78.5, t4: 81.0, t5: 84.0, t6: 88.0, t7: 95.0 },
    '600 Meters': { t1: 91.0, t2: 94.0, t3: 96.0, t4: 99.0, t5: 103.0, t6: 108.0, t7: 116.0 },
    '800 Meters': { t1: 130, t2: 135, t3: 140, t4: 145, t5: 152, t6: 160, t7: 175 }, 
    '1000 Meters': { t1: 172, t2: 178, t3: 183, t4: 189, t5: 198, t6: 208, t7: 225 },
    '1500 Meters': { t1: 268, t2: 282, t3: 291, t4: 300, t5: 314, t6: 330, t7: 375 },
    '1600 Meters': { t1: 290, t2: 305, t3: 315, t4: 325, t5: 340, t6: 360, t7: 400 }, 
    '1 Mile': { t1: 292, t2: 307, t3: 317, t4: 327, t5: 342, t6: 363, t7: 403 },
    '3000 Meters': { t1: 590, t2: 615, t3: 635, t4: 660, t5: 690, t6: 730, t7: 800 },
    '3200 Meters': { t1: 630, t2: 660, t3: 690, t4: 720, t5: 765, t6: 825, t7: 900 },
    '2 Mile': { t1: 634, t2: 664, t3: 694, t4: 724, t5: 769, t6: 830, t7: 905 },
    '5000 Meters': { t1: 1045, t2: 1080, t3: 1125, t4: 1170, t5: 1230, t6: 1320, t7: 1440 },
    '10000 Meters': { t1: 2160, t2: 2250, t3: 2340, t4: 2460, t5: 2610, t6: 2790, t7: 3000 },
    '55m Hurdles': { t1: 7.90, t2: 8.20, t3: 8.50, t4: 8.90, t5: 9.30, t6: 9.90, t7: 10.90 },
    '60m Hurdles': { t1: 8.40, t2: 8.70, t3: 9.00, t4: 9.40, t5: 9.80, t6: 10.50, t7: 11.50 },
    '100m Hurdles': { t1: 13.8, t2: 14.3, t3: 14.8, t4: 15.5, t5: 16.5, t6: 17.8, t7: 20.0 },
    '300m Hurdles': { t1: 42.5, t2: 44.5, t3: 46.5, t4: 48.5, t5: 51.0, t6: 54.0, t7: 59.0 },
    '400m Hurdles': { t1: 59.5, t2: 62.0, t3: 64.5, t4: 67.5, t5: 71.0, t6: 75.0, t7: 80.0 },
    '2000m Steeplechase': { t1: 420, t2: 440, t3: 460, t4: 490, t5: 520, t6: 560, t7: 610 },
    '3000m Steeplechase': { t1: 630, t2: 660, t3: 690, t4: 735, t5: 780, t6: 840, t7: 920 },
    'Long Jump': { t1: 234, t2: 222, t3: 210, t4: 198, t5: 186, t6: 174, t7: 150, isField: true }, 
    'Triple Jump': { t1: 468, t2: 444, t3: 420, t4: 396, t5: 372, t6: 348, t7: 324, isField: true }, 
    'High Jump': { t1: 68, t2: 64, t3: 62, t4: 60, t5: 58, t6: 54, t7: 50, isField: true }, 
    'Pole Vault': { t1: 156, t2: 144, t3: 132, t4: 120, t5: 108, t6: 90, t7: 72, isField: true },
    'Shot Put': { t1: 540, t2: 480, t3: 432, t4: 396, t5: 360, t6: 324, t7: 264, isField: true }, 
    'Discus': { t1: 1800, t2: 1620, t3: 1500, t4: 1380, t5: 1260, t6: 1080, t7: 840, isField: true },
    'Javelin': { t1: 1680, t2: 1500, t3: 1380, t4: 1260, t5: 1140, t6: 960, t7: 780, isField: true },
    'Hammer Throw': { t1: 1920, t2: 1680, t3: 1500, t4: 1320, t5: 1140, t6: 960, t7: 780, isField: true },
    'Weight Throw': { t1: 660, t2: 600, t3: 540, t4: 480, t5: 420, t6: 360, t7: 300, isField: true },
    'Pentathlon': { t1: 3600, t2: 3400, t3: 3100, t4: 2800, t5: 2500, t6: 2200, t7: 1900, isMulti: true },
    'Heptathlon': { t1: 5200, t2: 4800, t3: 4400, t4: 4000, t5: 3600, t6: 3200, t7: 2800, isMulti: true },
    'Decathlon': { t1: 6800, t2: 6400, t3: 6000, t4: 5500, t5: 5000, t6: 4500, t7: 4000, isMulti: true }
  }
};

const parseMarkToNumber = (mark: string): number => {
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

const formatInchesToFeet = (totalInches: number): string => {
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}' ${inches}"`;
};

export const getTierStyles = (score: number) => {
  if (score >= 95) return { tier: 'Power 4 D1', nextTier: 'MAX RANK', scoreRequired: 99, colorClass: 'text-fuchsia-400', bgClass: 'bg-fuchsia-500/10', barClass: 'bg-fuchsia-500', borderClass: 'border-fuchsia-500/50', glowClass: 'shadow-[0_0_30px_rgba(217,70,239,0.4)]' };
  if (score >= 85) return { tier: 'Mid-Major D1', nextTier: 'Power 4 D1', scoreRequired: 95, colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10', barClass: 'bg-purple-500', borderClass: 'border-purple-500/50', glowClass: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]' };
  if (score >= 75) return { tier: 'Top D2 / Walk-On', nextTier: 'Mid-Major D1', scoreRequired: 85, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', barClass: 'bg-blue-500', borderClass: 'border-blue-500/50', glowClass: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' };
  if (score >= 65) return { tier: 'D2 / D3 Prospect', nextTier: 'Top D2 / Walk-On', scoreRequired: 75, colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', barClass: 'bg-emerald-500', borderClass: 'border-emerald-500/50', glowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]' };
  if (score >= 55) return { tier: 'NAIA Prospect', nextTier: 'D2 / D3 Prospect', scoreRequired: 65, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', barClass: 'bg-amber-500', borderClass: 'border-amber-500/50', glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]' };
  if (score >= 40) return { tier: 'Strong Varsity', nextTier: 'NAIA Prospect', scoreRequired: 55, colorClass: 'text-slate-500', bgClass: 'bg-slate-500/20', barClass: 'bg-slate-400', borderClass: 'border-slate-400/50', glowClass: '' };
  if (score >= 20) return { tier: 'Varsity Contributor', nextTier: 'Strong Varsity', scoreRequired: 40, colorClass: 'text-slate-400', bgClass: 'bg-slate-500/10', barClass: 'bg-slate-500', borderClass: 'border-slate-500/30', glowClass: '' };
  if (score > 0) return { tier: 'Developmental', nextTier: 'Varsity Contributor', scoreRequired: 20, colorClass: 'text-slate-400', bgClass: 'bg-slate-500/5', barClass: 'bg-slate-600', borderClass: 'border-slate-600/30', glowClass: '' };
  return { tier: 'Unranked', nextTier: 'Developmental', scoreRequired: 10, colorClass: 'text-slate-400', bgClass: 'bg-slate-500/5', barClass: 'bg-slate-600', borderClass: 'border-slate-600/30', glowClass: '' };
};

type AccoladeObj = { text: string; category: string };

const getBaseUsername = (first: string, last: string) => {
  if (!first || !last) return '';
  let base = `${first}-${last}`.toLowerCase();
  base = base.replace(/[^a-z0-9-]/g, ''); 
  base = base.replace(/-+/g, '-'); 
  return base;
};

export default function ProfilePage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athleteProfile, setAthleteProfile] = useState<any>(null);
  const [sportStats, setSportStats] = useState<Record<string, any>>({});
  
  // Tab UI State
  const [activeTab, setActiveTab] = useState<'basics' | 'social_media'>('basics');

  // Profile Form States
  const [profileForm, setProfileForm] = useState({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    gender: '', 
    grad_year: '20', // Default initial state guarantees the '20'
    city: '',
    state: '',
    custom_slug: ''
  });
  
  const [gpa, setGpa] = useState('');
  const [intendedMajor, setIntendedMajor] = useState('');
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [schoolPrefs, setSchoolPrefs] = useState('');
  const [accolades, setAccolades] = useState<AccoladeObj[]>([]);
  const [newAccolade, setNewAccolade] = useState('');
  
  // Validation States
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [slugCooldown, setSlugCooldown] = useState(0);
  const cooldownRef = useRef(0);

  // Email Change & Verification States
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isEmailVerificationModalOpen, setIsEmailVerificationModalOpen] = useState(false);

  // Social Card States
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedAccolades, setSelectedAccolades] = useState<string[]>([]);
  const [includeGPA, setIncludeGPA] = useState(true);
  const [includeMajor, setIncludeMajor] = useState(true);
  const [isExportingCard, setIsExportingCard] = useState(false);

  // Utility States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const majorDropdownRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (majorDropdownRef.current && !majorDropdownRef.current.contains(event.target as Node)) {
        setShowMajorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- SLUG COOLDOWN & VERIFICATION EFFECT ---
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (slugCooldown > 0) {
      cooldownRef.current = slugCooldown;
      timer = setTimeout(() => setSlugCooldown((c) => c - 1), 1000);
    } else if (slugCooldown === 0 && cooldownRef.current > 0) {
      cooldownRef.current = 0;
      verifySlugSync();
    }
    return () => clearTimeout(timer);
  }, [slugCooldown]);

  const verifySlugSync = async () => {
    if (!athleteProfile?.id) return;
    try {
      const { data, error } = await supabase
        .from('athletes')
        .select('custom_slug')
        .eq('id', athleteProfile.id)
        .maybeSingle();

      if (data && !error) {
        setAthleteProfile((prev: any) => ({ ...prev, custom_slug: data.custom_slug }));
        setProfileForm((prev: any) => ({ ...prev, custom_slug: data.custom_slug || '' }));
        showToast("Routing synchronized and live!", "success");
      }
    } catch (e) {
      console.error("Slug sync verification failed", e);
    }
  };

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    let isMounted = true; 

    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return; 

      if (!session) { router.push('/login'); return; }
      const authEmail = session?.user?.email || '';

      const { data: athleteData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();
      if (!isMounted) return;

      if (athleteData) {
        // Hydrate Basic Identity & Location Form
        setProfileForm({
          first_name: athleteData.first_name || '',
          last_name: athleteData.last_name || '',
          email: athleteData.email || authEmail, // Sync the fallback email
          gender: athleteData.gender || '',
          grad_year: athleteData.grad_year?.toString() || '20', // Pre-fill with '20' if missing
          city: athleteData.city || '',
          state: athleteData.state || '',
          custom_slug: athleteData.custom_slug || ''
        });

        if (athleteData.custom_slug) {
            setSlugStatus('available');
        }

        // Hydrate Academic Portfolio
        let parsedResume: any = {};
        let masterAccolades: AccoladeObj[] = [];

        const sanitizeAccoladeText = (val: any, categoryStr: string): string => {
          const suffixCat = categoryStr && categoryStr !== 'General' ? ` (${categoryStr})` : '';
          if (!val) return '';
          if (typeof val === 'string') return `${val}${suffixCat}`.trim();
          if (typeof val === 'object') {
            if (val.type === 'HS_Team' || val.type === 'Club_Team') {
               const teamType = val.type === 'HS_Team' ? 'HS Team' : 'Club';
               return `${val.placement} - ${val.level} ${teamType}${suffixCat}`;
            }
            if (val.type === 'Individual') return `${val.placement} - ${val.level} Ind.${suffixCat}`;
            if (val.type === 'Honor') return `${val.text}${suffixCat}`;
            if (val.text) return `${val.text}${suffixCat}`.trim();
            if (val.title) return `${val.title}${suffixCat}`.trim();
          }
          return `Legacy Accolade${suffixCat}`.trim();
        };

        if (athleteData.saved_resume) {
          try {
            parsedResume = typeof athleteData.saved_resume === 'string' ? JSON.parse(athleteData.saved_resume) : athleteData.saved_resume;
            setGpa(parsedResume.gpa || '');
            setIntendedMajor(parsedResume.intendedMajor || '');
            setSchoolPrefs(parsedResume.schoolPrefs || '');
            
            if (parsedResume.accolades && Array.isArray(parsedResume.accolades)) {
              parsedResume.accolades.forEach((a: any) => {
                 const cleanText = sanitizeAccoladeText(a, 'General');
                 if (cleanText) masterAccolades.push({ text: cleanText, category: 'General' });
              });
            }
          } catch (e: any) {
            setSchoolPrefs(athleteData.saved_resume as string);
          }
        }

        // Hydrate Sport Stats
        let { data: relationalSports } = await supabase.from('athlete_sports').select('*').eq('athlete_id', athleteData.id);
        const mappedSportStats: any = {};
        
        if (relationalSports) {
          relationalSports.forEach((row: any) => {
            if (row.is_active !== false) {
              let parsedMetrics = [];
              let parsedMetaContext: any = {};
              try { parsedMetrics = Array.isArray(row.metrics) ? row.metrics : JSON.parse(row.metrics); } catch (e: any) {}
              try { parsedMetaContext = row.meta_context ? (typeof row.meta_context === 'string' ? JSON.parse(row.meta_context) : row.meta_context) : {}; } catch (e: any) {}
              
              if (parsedMetaContext.accolades && Array.isArray(parsedMetaContext.accolades)) {
                 parsedMetaContext.accolades.forEach((a: any) => {
                   const cleanText = sanitizeAccoladeText(a, row.sport_name);
                   if (cleanText) masterAccolades.push({ text: cleanText, category: row.sport_name });
                 });
              }

              mappedSportStats[row.sport_name] = {
                position: row.position || '',
                level: row.level_of_play || '',
                metrics: parsedMetrics || [],
                calculatedRating: row.custom_fit_score || 0,
                metaContext: parsedMetaContext,
                isActive: true
              };
            }
          });
        }

        setSportStats(mappedSportStats);
        setAccolades(masterAccolades);
        if (masterAccolades.length > 0) {
          setSelectedAccolades(masterAccolades.slice(0, 3).map(a => a.text));
        }

        setAthleteProfile(athleteData);
      }
      setLoading(false);
    }
    
    loadProfile();
    return () => { isMounted = false; };
  }, [supabase, router]); 

  // --- DERIVED METRICS ---
  const genderKey = athleteProfile?.gender === 'Girls' || athleteProfile?.gender === 'Women' ? 'Girls' : 'Boys';
  const userSports = Object.keys(sportStats).filter(s => sportStats[s].isActive !== false);
  
  const allAvailableMetrics = useMemo(() => {
    const list: {
      id: string, label: string, value: string, source: string, score: number, tier: string, nextTier: string, scoreRequired: number,
      colorClass: string, bgClass: string, barClass: string, borderClass: string, glowClass: string, levelUpMessage: string
    }[] = [];
    
    userSports.forEach(sport => {
      const stats = sportStats[sport];
      if (stats?.metrics && stats.metrics.length > 0) {
        stats.metrics.forEach((m: any, metricIdx: number) => {
          
          if (sport === 'Track & Field') {
            const evalResult = evaluateMetric(genderKey, 'Track & Field', m.name, m.value, 'Varsity');
            const score = m.score || evalResult?.score || stats.calculatedRating || 0; 
            const styles = getTierStyles(score);

            let levelUpMessage = "Keep training to unlock the next performance tier!";
            const genderStandards = RECRUITING_STANDARDS_DASHBOARD[genderKey];
            const eventStandards = genderStandards?.[m.name];

            if (eventStandards) {
              const currentVal = parseMarkToNumber(m.value);
              let targetKey: keyof typeof eventStandards = 't6';
              
              if (score >= 85) targetKey = 't1';
              else if (score >= 75) targetKey = 't2';
              else if (score >= 65) targetKey = 't3';
              else if (score >= 55) targetKey = 't4';
              else if (score >= 40) targetKey = 't5';
              else if (score >= 20) targetKey = 't6';
              
              const targetVal = eventStandards[targetKey] as number;

              if (currentVal && targetVal) {
                if (eventStandards.isField) {
                  const diff = targetVal - currentVal;
                  if (diff > 0) levelUpMessage = `Add +${formatInchesToFeet(diff)} to your mark to reach the ${styles.nextTier} bracket.`;
                } else if (eventStandards.isMulti) {
                  const diff = targetVal - currentVal;
                  if (diff > 0) levelUpMessage = `Earn +${diff} points to reach the ${styles.nextTier} bracket.`;
                } else {
                  const diff = currentVal - targetVal;
                  if (diff > 0) levelUpMessage = `Run ${diff.toFixed(2)}s faster to scale up to the ${styles.nextTier} bracket.`;
                }
              }
            }
            if (score >= 95) levelUpMessage = "👑 MAX TIER REACHED. You possess elite standard metrics for this event.";
            list.push({ id: `track-${m.name}-${metricIdx}`, label: m.name, value: m.value, source: 'Track', score, ...styles, levelUpMessage });
            
          } else if (sport === 'Swimming & Diving') {
             const evalResult = evaluateMetric(genderKey, sport, m.name, m.value, 'Varsity');
             const score = m.score || evalResult?.score || stats.calculatedRating || 0; 
             const styles = getTierStyles(score);
             const levelUpMessage = score >= 95 ? "👑 MAX TIER REACHED. Elite standard metrics." : `Earn a faster time to reach the ${styles.nextTier} bracket.`;
             list.push({ id: `swim-${m.name}-${metricIdx}`, label: m.name, value: m.value, source: 'Swim', score, ...styles, levelUpMessage });

          } else {
            const evalResult = evaluateMetric(genderKey, sport, m.name, m.value, stats.level || 'Varsity');
            const score = m.score || evalResult?.score || stats.calculatedRating || 0;
            const styles = getTierStyles(score);
            const ptsNeeded = styles.scoreRequired - score;
            const levelUpMessage = score >= 95 
              ? "👑 MAX TIER UNLOCKED. Your metrics sit at the pinnacle of this position category."
              : `Earn +${ptsNeeded} Recruit Rating points to reach the ${styles.nextTier} bracket.`;
            list.push({ id: `${sport}-${m.name}-${metricIdx}`, label: m.name, value: m.value, source: sport, score, ...styles, levelUpMessage });
          }
        });
      }
    });

    return list.sort((a, b) => b.score - a.score); 
  }, [sportStats, userSports, genderKey]);

  useEffect(() => {
     if (selectedMetrics.length === 0 && allAvailableMetrics.length > 0) {
        setSelectedMetrics(allAvailableMetrics.slice(0, 4).map(m => m.label));
     }
  }, [allAvailableMetrics, selectedMetrics.length]);

  const readiness = useMemo(() => {
    let score = 0;
    let nextQuest = "Profile complete! You are fully optimized for the Matchmaker.";
    
    if (profileForm.first_name && profileForm.last_name) score += 10;
    if (athleteProfile?.trust_level === 1) score += 10; else if (score >= 10) nextQuest = "Verify your account identity to unlock the Team HQ.";
    if (profileForm.city && profileForm.state) score += 10; else if (score >= 20) nextQuest = "Search and join your High School team roster.";
    if (gpa) score += 15; else if (score >= 30) nextQuest = "Add your Unweighted GPA below to boost your Matchmaker visibility.";
    if (intendedMajor) score += 15; else if (score >= 45) nextQuest = "Define an Intended Major below to unlock academic matching.";
    if (accolades.length > 0) score += 15; else if (score >= 60) nextQuest = "Log your first Season Accolade to prove your leadership.";
    if (allAvailableMetrics.length > 0) score += 25; else if (score >= 75) nextQuest = "Sync a sport metric to activate the Recruit Engine.";

    return { score: Math.min(100, score), nextQuest };
  }, [athleteProfile, profileForm, gpa, intendedMajor, accolades, allAvailableMetrics]);

  // --- USERNAME BASE NAME SYNC LOGIC ---
  useEffect(() => {
    if (profileForm.first_name && profileForm.last_name) {
      const baseName = getBaseUsername(profileForm.first_name, profileForm.last_name);
      
      // Keep username synchronized if base name changes structurally
      if (profileForm.custom_slug && !profileForm.custom_slug.startsWith(baseName)) {
          setProfileForm(prev => ({ ...prev, custom_slug: baseName }));
          setSlugStatus(baseName === athleteProfile?.custom_slug ? 'available' : 'checking');
      } else if (!profileForm.custom_slug && !isSlugManuallyEdited) {
          setProfileForm(prev => ({ ...prev, custom_slug: baseName }));
          setSlugStatus(baseName === athleteProfile?.custom_slug ? 'available' : 'checking');
      }
    }
  }, [profileForm.first_name, profileForm.last_name]);

  // --- USERNAME DEBOUNCE VERIFICATION ---
  useEffect(() => {
    if (!profileForm.custom_slug) {
      setSlugStatus('idle');
      return;
    }
    
    // If it instantly matches their saved DB username, we already set it to 'available' in onChange
    if (profileForm.custom_slug === athleteProfile?.custom_slug) {
      return;
    }

    const checkSlug = async () => {
      const { data } = await supabase
        .from('athletes')
        .select('id')
        .eq('custom_slug', profileForm.custom_slug)
        .neq('id', athleteProfile?.id || '')
        .maybeSingle();

      if (data) {
        setSlugStatus('taken');
      } else {
        setSlugStatus('available');
      }
    };

    // Only run the DB check if it's currently flagged as 'checking'
    if (slugStatus === 'checking') {
      const timeoutId = setTimeout(checkSlug, 600);
      return () => clearTimeout(timeoutId);
    }
  }, [profileForm.custom_slug, athleteProfile?.id, athleteProfile?.custom_slug, supabase, slugStatus]);

  // --- PAGE LEAVE VALIDATION (Passive Banner Check) ---
  const isProfileComplete = Boolean(
      profileForm.first_name && 
      profileForm.last_name && 
      profileForm.grad_year && profileForm.grad_year.length === 4 &&
      profileForm.city && 
      profileForm.state && 
      profileForm.gender && 
      profileForm.custom_slug && 
      slugStatus === 'available'
  );

  // Dynamic Validation Styling Helper
  const getValidationClass = (value: string | number | null) => {
    return value ? 'border-emerald-500 focus-within:border-emerald-600 bg-emerald-50/20' : 'border-red-500 focus-within:border-red-600 bg-red-50/20';
  };

  const isNameComplete = Boolean(profileForm.first_name && profileForm.last_name);
  const slugValidationClass = !isNameComplete
    ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-60' 
    : (profileForm.custom_slug && slugStatus === 'available')
      ? 'border-emerald-500 focus-within:border-emerald-600 bg-emerald-50/20'
      : 'border-red-500 focus-within:border-red-600 bg-red-50/20';

  // --- ACTION HANDLERS ---
  const publicPortfolioUrl = `/athlete/${athleteProfile?.custom_slug || athleteProfile?.id}`;

  const handlePreviewCooldownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (slugStatus === 'checking') {
      showToast("Please wait for username availability check to complete.", "error");
      return;
    }
    if (slugCooldown > 0) {
      showToast(`Please wait ${slugCooldown}s for the URL to propagate on the network.`, "error");
      return;
    }
    // Instant execution with no synthetic delay
    window.open(publicPortfolioUrl, '_blank');
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toLowerCase();
    
    // Auto-convert spaces to hyphens and strip bad characters immediately
    val = val.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');

    const baseName = getBaseUsername(profileForm.first_name, profileForm.last_name);
    
    // LOCK THE BASE NAME: Reject the keystroke completely if they try to backspace into the base name
    if (baseName && !val.startsWith(baseName)) {
      val = baseName;
    }

    // Prevents UI hesitation/flicker if they typed an invalid character that got stripped, 
    // or if they tried to backspace the base name (meaning the actual state string didn't change).
    if (val === profileForm.custom_slug) {
      return; 
    }

    setProfileForm({ ...profileForm, custom_slug: val });
    setIsSlugManuallyEdited(true);

    // Bypass 'checking' delay if they reverted to their already-saved DB username
    if (athleteProfile?.custom_slug && val === athleteProfile.custom_slug) {
      setSlugStatus('available');
    } else {
      setSlugStatus('checking');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const userId = athleteProfile?.id;
    if (!file || !userId) return;

    setIsUploadingAvatar(true);
    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 500, useWebWorker: true });
      const fileName = `${userId}-avatar.jpg`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, compressedFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const urlWithTime = `${data.publicUrl}?t=${new Date().getTime()}`;

      await supabase.from('athletes').update({ avatar_url: urlWithTime }).eq('id', userId);
      setAthleteProfile((prev: any) => ({ ...prev, avatar_url: urlWithTime }));
      showToast("Profile picture updated successfully!", "success");
    } catch (error: any) {
      showToast("Failed to upload profile picture.", "error");
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveBasicProfile = async () => {
    // Failing silently on auto-save without showing a toast notification prevents annoying popup spam for users typing around
    if (!profileForm.first_name || !profileForm.last_name || !profileForm.gender || profileForm.grad_year.length !== 4) {
      return; 
    }
    if (slugStatus === 'taken' || slugStatus === 'checking') {
      return;
    }

    const parsedYear = parseInt(profileForm.grad_year, 10);
    try {
      const isSlugChanged = profileForm.custom_slug !== athleteProfile?.custom_slug && profileForm.custom_slug !== '';

      const { error } = await supabase.from('athletes').update({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        gender: profileForm.gender,
        grad_year: isNaN(parsedYear) ? null : parsedYear,
        city: profileForm.city,
        state: profileForm.state, // Strictly saves the full state name
        custom_slug: profileForm.custom_slug || null,
        email: profileForm.email // Sync email to DB if missing
      }).eq('id', athleteProfile.id);

      // Catch silent failures from RLS or schema issues
      if (error) throw error; 

      setAthleteProfile((prev: any) => ({ 
        ...prev, 
        first_name: profileForm.first_name, 
        last_name: profileForm.last_name,
        gender: profileForm.gender,
        grad_year: isNaN(parsedYear) ? null : parsedYear,
        city: profileForm.city,
        state: profileForm.state,
        custom_slug: profileForm.custom_slug
      }));

      if (isSlugChanged) {
         setSlugCooldown(15);
         showToast("Username updated. Synchronizing public URL...", "success");
      } else {
         showToast("Profile details updated.", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save profile.", "error");
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmailInput || !newEmailInput.includes('@')) return showToast("Enter a valid email address.", "error");
    setIsUpdatingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmailInput });
    setIsUpdatingEmail(false);
    
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Verification sent! Please check your new inbox to confirm.", "success");
      await supabase.from('athletes').update({ trust_level: 0 }).eq('id', athleteProfile.id);
      setAthleteProfile((prev: any) => ({ ...prev, trust_level: 0 }));
      setIsChangeEmailModalOpen(false);
      setNewEmailInput('');
    }
  };

  const handleResendVerification = async () => {
    if (!profileForm.email) return showToast("No email found to verify.", "error");
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: profileForm.email,
    });

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Verification link sent! Please check your inbox.", "success");
    }
  };

  const autoSavePortfolio = async (overrides?: Partial<{ gpa: string, intendedMajor: string, accolades: string[], schoolPrefs: string }>) => {
    if (!athleteProfile?.id) return;
    try {
      let currentResume = typeof athleteProfile.saved_resume === 'string' ? JSON.parse(athleteProfile.saved_resume) : (athleteProfile.saved_resume || {});
      const { sportStats: legacyStats, ...cleanResume } = currentResume;
      
      const payload = {
        ...cleanResume,
        gpa: overrides?.gpa ?? gpa, 
        intendedMajor: overrides?.intendedMajor ?? intendedMajor, 
        accolades: overrides?.accolades ?? accolades.filter(a => a.category === 'General').map(a => a.text), 
        schoolPrefs: overrides?.schoolPrefs ?? schoolPrefs
      };

      const { error } = await supabase.from('athletes').update({ saved_resume: payload }).eq('id', athleteProfile.id);
      if (error) throw error; // Catch silent errors

      setAthleteProfile((prev: any) => ({ ...prev, saved_resume: payload }));
    } catch (err: any) { 
      showToast(err.message || "Failed to save portfolio preferences.", "error");
    }
  };

  const addAccolade = () => {
    if (!newAccolade.trim() || accolades.some(a => a.text === newAccolade.trim())) return;
    const newObj = { text: newAccolade.trim(), category: 'General' };
    const newAccs = [...accolades, newObj];
    setAccolades(newAccs);
    setNewAccolade('');

    if (selectedAccolades.length < 3) setSelectedAccolades([...selectedAccolades, newObj.text]);
    const generalAccs = newAccs.filter(a => a.category === 'General').map(a => a.text);
    autoSavePortfolio({ accolades: generalAccs });
    showToast(`Saved to Academic Profile`, "success");
  };

  const removeAccolade = (accObj: AccoladeObj) => {
    const newAccs = accolades.filter(a => a.text !== accObj.text);
    setAccolades(newAccs);
    setSelectedAccolades(prev => prev.filter(a => a !== accObj.text));

    if (accObj.category === 'General') {
       const generalAccs = newAccs.filter(a => a.category === 'General').map(a => a.text);
       autoSavePortfolio({ accolades: generalAccs });
    }
    showToast("Honor removed from record.", "success");
  };

  const handleToggleMetric = (label: string) => {
    if (selectedMetrics.includes(label)) setSelectedMetrics(selectedMetrics.filter(e => e !== label));
    else {
      if (selectedMetrics.length >= 4) return showToast("Max 4 metrics on the graphic.", "error");
      setSelectedMetrics([...selectedMetrics, label]);
    }
  };

  const handleToggleAccolade = (acc: string) => {
    if (selectedAccolades.includes(acc)) setSelectedAccolades(selectedAccolades.filter(a => a !== acc));
    else {
      if (selectedAccolades.length >= 3) return showToast("Max 3 Accolades on the graphic.", "error");
      setSelectedAccolades([...selectedAccolades, acc]);
    }
  };

  const handleDownloadSocialCard = async () => {
    setIsExportingCard(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('social-card-export');
      if (!element) throw new Error("Card element not found.");
      
      const canvas = await html2canvas(element, { backgroundColor: null, scale: 3, useCORS: true });
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `${athleteProfile?.last_name}_RecruitingProfile.png`;
      link.href = dataUrl;
      link.click();
      showToast("Graphic exported successfully!", "success");
    } catch (err: any) {
      showToast("Failed to export graphic.", "error");
    } finally {
      setIsExportingCard(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Profile Studio...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-12 text-slate-900 relative overflow-x-hidden pt-6">
      
      {/* 🚨 UNVERIFIED ALERT BANNER 🚨 */}
      {!loading && athleteProfile && athleteProfile.trust_level !== 1 && (
        <div className="w-full bg-amber-500 text-amber-950 px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-40 mb-6 shadow-md rounded-2xl max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-pulse"></span>
            <p className="text-sm font-medium">
              <strong className="font-black">Action Required:</strong> Your email is unverified. This hides your profile from the Matchmaker.
            </p>
          </div>
          <button
            onClick={() => setIsEmailVerificationModalOpen(true)}
            className="bg-white/20 hover:bg-white/30 border border-white/20 text-amber-950 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all active:scale-[0.98] flex items-center gap-2"
          >
            Verify Now <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 🚨 INCOMPLETE PROFILE BANNER 🚨 */}
      {!loading && athleteProfile && !isProfileComplete && (
        <div className="w-full bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-4 relative z-40 mb-6 shadow-md rounded-2xl max-w-6xl mx-auto">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            <strong className="font-black">Profile Incomplete:</strong> Please fill out all red highlighted boxes below to unlock dashboard navigation.
          </p>
        </div>
      )}

      {/* Toast System */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 font-bold text-sm border ${toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-slate-900 text-white border-slate-700'}`}>
            {toast.type === 'error' ? <X className="w-4 h-4 text-red-400" /> : <Check className="w-4 h-4 text-emerald-400" />} {toast.message}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10 space-y-6">
        
        {/* Tab Sub-Navigation */}
        <div className="flex border-b border-slate-200 w-full overflow-x-auto custom-scrollbar gap-8 px-2 mb-6">
          <button 
            onClick={() => setActiveTab('basics')} 
            className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'basics' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <UserCircle2 className="w-4 h-4" /> My Profile
          </button>
          <button 
            onClick={() => setActiveTab('social_media')} 
            className={`pb-3 text-sm font-black transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'social_media' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <ImageIcon className="w-4 h-4" /> Social Media
          </button>
        </div>

        {/* VIEW 1: MY PROFILE */}
        {activeTab === 'basics' && (
          <div className="flex flex-col md:flex-row gap-8 items-start animate-in fade-in duration-300">
             
             {/* LEFT SIDEBAR */}
             <div className="w-full md:w-[320px] shrink-0 space-y-5">
                
                {/* Avatar & Quick Action Card */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
                   <div 
                     className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer mb-4" 
                     onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                   >
                     {isUploadingAvatar ? (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                     ) : (
                        <img 
                          src={athleteProfile?.avatar_url || 'https://via.placeholder.com/300'} 
                          alt="Athlete Avatar" 
                          className="w-full h-full object-cover border border-slate-100 rounded-2xl"
                        />
                     )}
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-bold flex items-center gap-2"><Camera className="w-4 h-4"/> Change photo</span>
                     </div>
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleAvatarUpload} />
                   </div>

                   {/* Primary Public Portfolio Action */}
                   <div className="space-y-2">
                     <button 
                        onClick={handlePreviewCooldownClick}
                        disabled={slugCooldown > 0 || slugStatus === 'checking'}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] text-xs disabled:opacity-75 disabled:cursor-wait"
                     >
                        {slugCooldown > 0 || slugStatus === 'checking' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                        {slugStatus === 'checking' ? 'Verifying URL...' : slugCooldown > 0 ? `Syncing Route (${slugCooldown}s)` : 'View Public Portfolio'}
                     </button>
                     
                     <div className="flex items-center justify-between pt-2 border-t border-slate-100 px-1">
                       <Link href="/customize" className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors">
                          <Paintbrush className="w-3.5 h-3.5 text-blue-500" /> Edit Theme & Border
                       </Link>
                       
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText(`${window.location.origin}${publicPortfolioUrl}`);
                           showToast("Portfolio link copied to clipboard!", "success");
                         }}
                         className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                         title="Copy Public Link"
                       >
                         <LinkIcon className="w-3.5 h-3.5" /> Copy Link
                       </button>
                     </div>
                   </div>
                </div>

                {/* Demographics Card (Interactive & Validated) */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interactive Bio Stats</h3>
                   
                   {/* Updatable Location */}
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                       <MapPin className="w-3.5 h-3.5 text-blue-500" /> Location (City & State)
                     </label>
                     <div className="grid grid-cols-2 gap-2">
                       <input 
                         type="text"
                         value={profileForm.city}
                         onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                         onBlur={handleSaveBasicProfile}
                         placeholder="City"
                         className={`w-full border-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none transition-colors ${getValidationClass(profileForm.city)}`}
                       />
                       <select
                         value={profileForm.state}
                         onChange={(e) => {
                           setProfileForm({ ...profileForm, state: e.target.value });
                           setTimeout(handleSaveBasicProfile, 100);
                         }}
                         className={`w-full border-2 rounded-xl px-2 py-2 text-xs font-bold text-slate-800 outline-none transition-colors ${getValidationClass(profileForm.state)}`}
                       >
                         <option value="">State...</option>
                         {US_STATES_MAP.map(s => <option key={s.abbr} value={s.name}>{s.abbr} - {s.name}</option>)}
                       </select>
                     </div>
                   </div>

                   {/* Updatable Grad Year */}
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                       <Calendar className="w-3.5 h-3.5 text-blue-500" /> Graduation Year
                     </label>
                     <input 
                       type="text"
                       inputMode="numeric"
                       maxLength={4}
                       value={profileForm.grad_year}
                       onChange={(e) => {
                         let val = e.target.value.replace(/\D/g, ''); // strip out non-digits
                         if (!val.startsWith('20')) {
                           val = '20' + val.replace(/^20/, ''); // ensure it always begins with '20'
                         }
                         if (val.length < 2) val = '20'; // block backspacing past '20'
                         if (val.length > 4) val = val.substring(0, 4); // cap length
                         setProfileForm({ ...profileForm, grad_year: val });
                       }}
                       onBlur={handleSaveBasicProfile}
                       placeholder="2027"
                       className={`w-full border-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none transition-colors ${profileForm.grad_year.length === 4 ? 'border-emerald-500 focus-within:border-emerald-600 bg-emerald-50/20' : 'border-red-500 focus-within:border-red-600 bg-red-50/20'}`}
                     />
                   </div>

                   {/* Updatable Roster Gender */}
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                       <User className="w-3.5 h-3.5 text-blue-500" /> Athletic Division
                     </label>
                     <div className={`flex gap-2 p-1 rounded-xl border-2 transition-colors ${getValidationClass(profileForm.gender)}`}>
                       <button
                         type="button"
                         onClick={() => {
                           setProfileForm({ ...profileForm, gender: 'Boys' });
                           setTimeout(handleSaveBasicProfile, 100);
                         }}
                         className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors border ${profileForm.gender === 'Boys' ? 'bg-blue-500 border-blue-500 text-white' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`}
                       >
                         Boys
                       </button>
                       <button
                         type="button"
                         onClick={() => {
                           setProfileForm({ ...profileForm, gender: 'Girls' });
                           setTimeout(handleSaveBasicProfile, 100);
                         }}
                         className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors border ${profileForm.gender === 'Girls' ? 'bg-fuchsia-500 border-fuchsia-500 text-white' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100'}`}
                       >
                         Girls
                       </button>
                     </div>
                   </div>
                </div>

                {/* Intended Major Card */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Intended Major</h3>
                   <div className="relative" ref={majorDropdownRef}>
                      <input 
                        type="text" 
                        value={intendedMajor} 
                        onFocus={() => setShowMajorDropdown(true)} 
                        onChange={(e) => { setIntendedMajor(e.target.value); setShowMajorDropdown(true); }} 
                        onBlur={() => autoSavePortfolio()}
                        placeholder="Search majors..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                      />
                      {showMajorDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto custom-scrollbar p-1">
                          {SUGGESTED_MAJORS.filter(m => m.toLowerCase().includes(intendedMajor.toLowerCase())).map((m: string, idx: number) => (
                            <button 
                              key={`major-sugg-${idx}`} type="button" 
                              onClick={() => { setIntendedMajor(m); setShowMajorDropdown(false); autoSavePortfolio(); }} 
                              className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      )}
                   </div>
                </div>
             </div>

             {/* MAIN CONTENT COLUMN */}
             <div className="flex-1 w-full space-y-6">
                
                {/* Header Block */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                      {profileForm.first_name || 'New'} {profileForm.last_name || 'Athlete'}
                    </h1>
                    <p className="text-xs font-bold text-slate-400 mt-1">
                      {profileForm.city && profileForm.state ? `${profileForm.city}, ${profileForm.state}` : 'Location unknown'} • Class of {profileForm.grad_year && profileForm.grad_year.length === 4 ? profileForm.grad_year : '20xx'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handlePreviewCooldownClick}
                      disabled={slugCooldown > 0 || slugStatus === 'checking'}
                      className="hidden sm:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors border border-slate-200 disabled:opacity-75 disabled:cursor-wait"
                    >
                      {slugCooldown > 0 || slugStatus === 'checking' ? <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" /> : <Globe className="w-3.5 h-3.5 text-blue-600" />}
                      {slugStatus === 'checking' ? 'Verifying...' : slugCooldown > 0 ? `Syncing (${slugCooldown}s)` : 'Preview Portfolio'}
                    </button>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-2.5 flex items-center gap-3 shrink-0">
                      <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center border border-indigo-200">
                        <Points />
                      </div>
                      <div>
                        <p className="text-lg font-black text-indigo-700 leading-none">{athleteProfile?.coins || 0}</p>
                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Points</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Readiness Meter Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                   <div>
                     <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
                       Profile Strength <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                     </h3>
                     <p className="text-xs font-medium text-slate-500 max-w-sm">{readiness.nextQuest}</p>
                   </div>
                   <div className="flex items-center gap-3 shrink-0">
                     <span className="text-xl font-black text-slate-900">{readiness.score}<span className="text-slate-400 text-sm">%</span></span>
                     <div className="w-32 h-3 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${readiness.score}%` }}></div>
                     </div>
                   </div>
                </div>

                {/* Identity Form (Strictly Validated) */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                   <h3 className="text-lg font-black text-slate-900 mb-5">Identity Details</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     
                     <div className={`border-2 rounded-xl p-3 transition-colors ${getValidationClass(profileForm.first_name)}`}>
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">First Name</label>
                       <input 
                         type="text" value={profileForm.first_name} 
                         onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})} 
                         onBlur={handleSaveBasicProfile}
                         className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder-slate-400" placeholder="Required"
                       />
                     </div>
                     
                     <div className={`border-2 rounded-xl p-3 transition-colors ${getValidationClass(profileForm.last_name)}`}>
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Last Name</label>
                       <input 
                         type="text" value={profileForm.last_name} 
                         onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})} 
                         onBlur={handleSaveBasicProfile}
                         className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder-slate-400" placeholder="Required"
                       />
                     </div>

                     {/* Profile Username Block */}
                     <div className={`border-2 rounded-xl p-3 sm:col-span-2 transition-colors ${slugValidationClass}`}>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                            Profile Username
                          </label>
                          {isNameComplete && (
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              slugStatus === 'checking' ? 'text-blue-500 animate-pulse' :
                              slugStatus === 'available' ? 'text-emerald-500' :
                              slugStatus === 'taken' ? 'text-red-500' : 'text-slate-400'
                            }`}>
                              {slugStatus === 'checking' ? 'Checking...' :
                               slugStatus === 'available' ? 'Owned' :
                               slugStatus === 'taken' ? 'Already Taken' : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-slate-400 font-bold text-sm mr-1 hidden sm:inline">chasedsports.com/athlete/</span>
                          <span className="text-slate-400 font-bold text-sm mr-1 sm:hidden">.../</span>
                          <input 
                            type="text" 
                            value={profileForm.custom_slug}
                            disabled={!isNameComplete}
                            onChange={handleUsernameChange}
                            onBlur={handleSaveBasicProfile}
                            className="flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder-slate-400 disabled:text-slate-500" 
                            placeholder={isNameComplete ? "e.g. chase-fulleton" : "Complete first and last name first"}
                          />
                        </div>
                        {isNameComplete && (
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">
                              Your first and last name are locked in. You may add numbers or words at the end to make it unique.
                            </p>
                        )}
                     </div>
                     
                     {/* Locked Email Block (Updated with direct Fallback and Verify Option) */}
                     <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:col-span-2 flex items-center justify-between gap-4 group">
                       <div className="min-w-0 flex-1">
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Contact Email</label>
                         <div className="flex flex-wrap items-center gap-2">
                           <p className="text-sm font-bold text-slate-900 truncate">{profileForm.email || 'No email attached'}</p>
                           {athleteProfile?.trust_level !== 1 && (
                             <button
                               onClick={handleResendVerification}
                               className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-colors"
                               title="Resend Verification Email"
                             >
                               Verify Email
                             </button>
                           )}
                         </div>
                       </div>
                       <button 
                         onClick={() => setIsChangeEmailModalOpen(true)}
                         className="text-[10px] font-black uppercase tracking-widest bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                       >
                         Change
                       </button>
                     </div>
                   </div>
                </div>

                {/* Bio / School Prefs */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                   <h3 className="text-lg font-black text-slate-900 mb-3">Bio / School Preferences</h3>
                   <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
                     <Zap className="w-4 h-4 fill-emerald-500" /> Define target program cultures to help coaches match with your goals.
                   </div>
                   <textarea 
                     value={schoolPrefs} 
                     onChange={(e) => setSchoolPrefs(e.target.value)} 
                     onBlur={() => autoSavePortfolio()}
                     placeholder="Things coaches should know about me (e.g., I am a hardworking student looking for a D2 program with a strong engineering department...)" 
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-800 h-32 focus:outline-none focus:border-blue-500 resize-none" 
                   />
                </div>

                {/* Education */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                   <h3 className="text-lg font-black text-slate-900 mb-5">Education</h3>
                   <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                     <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                       <BookOpen className="w-6 h-6" />
                     </div>
                     <div>
                       <h4 className="text-sm font-black text-slate-900">{athleteProfile?.high_school || 'High School not set'}</h4>
                       <p className="text-xs text-slate-500 font-bold mt-0.5">High School • Class of {profileForm.grad_year}</p>
                     </div>
                   </div>
                   <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 w-full sm:w-1/2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Unweighted GPA Scale</label>
                      <input 
                        type="number" step="0.01" min="0" max="5" 
                        value={gpa} 
                        onChange={(e) => setGpa(e.target.value)} 
                        onBlur={() => autoSavePortfolio()}
                        placeholder="e.g. 3.95" 
                        className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder-slate-400"
                      />
                   </div>
                </div>

                {/* Academics & General Honors */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                   <h3 className="text-lg font-black text-slate-900 mb-3">Academic Honors & Extracurriculars</h3>
                   <p className="text-xs text-slate-500 font-medium mb-5">Add non-athletic honors here. Sport-specific placements are added in Homebase.</p>
                   
                   {accolades.filter(a => a.category === 'General').length > 0 && (
                     <div className="space-y-2 mb-4">
                        {accolades.filter(a => a.category === 'General').map((acc, i) => (
                          <div key={`acc-${i}`} className="flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl text-sm font-bold group">
                            <div className="flex items-center gap-3 truncate pr-4">
                               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-200 px-2 py-1 rounded shrink-0">Academic</span>
                               <span className="truncate">{acc.text}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => { setNewAccolade(acc.text); removeAccolade(acc); }} className="text-slate-400 hover:text-blue-500 transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                              <button onClick={() => removeAccolade(acc)} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete"><X className="w-4 h-4"/></button>
                            </div>
                          </div>
                        ))}
                     </div>
                   )}

                   <div className="flex flex-col sm:flex-row gap-2">
                     <input 
                       type="text" value={newAccolade} 
                       onChange={(e) => setNewAccolade(e.target.value)} 
                       onKeyDown={(e) => { if (e.key === 'Enter') addAccolade(); }} 
                       placeholder="Accolade detail (e.g. National Honor Society, Class Treasurer)" 
                       className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                     />
                     <button onClick={() => addAccolade()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-colors shrink-0 flex items-center justify-center text-sm shadow-sm">
                       Add Honor
                     </button>
                   </div>
                </div>

             </div>
          </div>
        )}

        {/* VIEW 2: SOCIAL MEDIA GENERATOR */}
        {activeTab === 'social_media' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
             <div className="lg:col-span-5">
                <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200">
                   <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-2">
                      <ImageIcon className="w-5 h-5 text-emerald-500" /> Export Parameter Matrix
                   </h3>
                   <p className="text-slate-500 font-medium text-xs mb-6">Allocate elements to display inside the compiled high-res layout output.</p>

                   <div className="space-y-8">
                      <div>
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Display Metrics (Max 4)</h4>
                         <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                           {allAvailableMetrics.length > 0 ? (
                             allAvailableMetrics.map((metric, i) => (
                               <button key={`metric-${metric.id}-${i}`} onClick={() => handleToggleMetric(metric.label)} className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selectedMetrics.includes(metric.label) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}>
                                  <div>
                                     <span className="text-xs font-bold text-slate-800 block mb-0.5">{metric.label} <span className="text-slate-400 font-medium ml-1">({metric.value})</span></span>
                                     <span className={`text-[10px] font-black uppercase tracking-widest ${metric.colorClass}`}>{metric.tier} • {metric.score}/99</span>
                                  </div>
                                  {selectedMetrics.includes(metric.label) ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-slate-300" />}
                               </button>
                             ))
                           ) : (
                             <div className="text-xs text-slate-400 font-medium p-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 space-y-2">
                               <p>No valid metrics found.</p>
                               <Link href="/dashboard" className="text-blue-500 hover:text-blue-600 font-bold underline">Go to Homebase to log sport stats</Link>
                             </div>
                           )}
                         </div>
                      </div>

                      <div>
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Display Honors (Max 3)</h4>
                         {accolades.length > 0 ? (
                           <div className="flex flex-col gap-1.5 mb-3">
                             {accolades.map((acc, i) => (
                               <div key={`sel-acc-${i}`} className={`flex items-center justify-between pr-2 rounded-xl border transition-all ${selectedAccolades.includes(acc.text) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}>
                                  <button onClick={() => handleToggleAccolade(acc.text)} className="flex-1 flex items-center justify-between p-3 text-left">
                                     <div className="flex items-center gap-2 truncate pr-2">
                                       <span className={`text-[9px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded shadow-sm shrink-0 ${acc.category === 'General' ? 'bg-slate-800' : 'bg-blue-600'}`}>{acc.category === 'General' ? 'Academic' : 'Athletic'}</span>
                                       <span className="text-xs font-bold text-slate-800 truncate">{acc.text}</span>
                                     </div>
                                     {selectedAccolades.includes(acc.text) ? <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
                                  </button>
                                  <div className="w-px h-6 bg-slate-200 mx-1 shrink-0"></div>
                                  <button onClick={() => removeAccolade(acc)} className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center mb-3">
                              <Trophy className="w-5 h-5 text-slate-300 mb-2" />
                              <p className="text-[11px] text-slate-500 font-medium max-w-[200px]">No honors mapped yet. Add one in the Profile tab to display it here.</p>
                           </div>
                         )}
                      </div>

                      <button onClick={handleDownloadSocialCard} disabled={isExportingCard} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2">
                         {isExportingCard ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4"/> Compile High-Res Canvas</>}
                      </button>
                   </div>
                </div>
             </div>

             <div className="lg:col-span-7 flex justify-center items-start lg:sticky lg:top-36 pb-6 px-2 relative">
                <div id="social-card-export" className="relative w-full max-w-[420px] h-auto aspect-[4/5] bg-slate-900 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between overflow-hidden border border-slate-700/50 shadow-2xl shrink-0">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

                   <div className="flex items-center gap-4 z-10 shrink-0">
                      <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId="none" sizeClasses="w-16 h-16 shadow-lg border border-slate-800 shrink-0" />
                      <div className="min-w-0">
                         <h2 className="text-xl sm:text-2xl font-black uppercase text-white leading-none mb-1 truncate">{athleteProfile?.first_name} <br/>{athleteProfile?.last_name}</h2>
                         <p className="text-xs font-bold text-slate-400 truncate">{athleteProfile?.high_school} {athleteProfile?.grad_year && `• CO ${athleteProfile.grad_year}`}</p>
                      </div>
                   </div>

                   <div className="z-10 mt-6 space-y-2.5 shrink-0">
                      {allAvailableMetrics.filter(m => selectedMetrics.includes(m.label)).map((metric, idx) => (
                        <div key={`metric-disp-${idx}`} className="flex justify-between items-end border-b border-slate-800/60 pb-1.5 relative">
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{metric.tier} Tier</span>
                              <span className={`text-sm font-black truncate pr-2 ${metric.colorClass}`}>{metric.label}</span>
                           </div>
                           <span className="text-xl font-black text-white shrink-0">{metric.value}</span>
                        </div>
                      ))}
                      {allAvailableMetrics.length === 0 || selectedMetrics.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 rounded-xl bg-slate-800/50 text-center">
                           <p className="text-[11px] text-slate-400 font-medium">Select metrics to preview them here.</p>
                        </div>
                      ) : null}
                   </div>

                   <div className="z-10 mt-auto flex justify-between items-end pt-6 border-t border-slate-800 shrink-0">
                      <div className="flex-1 border-l-2 border-emerald-500 pl-3 overflow-hidden pr-2">
                         {selectedAccolades.map((accText: string, idx: number) => <p key={`acc-text-${idx}`} className="text-xs font-bold italic text-slate-400 mb-0.5 truncate">"{accText}"</p>)}
                         {includeGPA && gpa && <p className="text-xs font-black text-emerald-400 mt-1 truncate">GPA: {gpa}</p>}
                         {includeMajor && intendedMajor && <p className="text-xs font-black text-blue-400 truncate">Major: {intendedMajor}</p>}
                      </div>
                      <div className="text-right shrink-0">
                         <p className="text-[18px] font-black tracking-tighter text-white">Chased<span className="text-blue-500">Sports</span></p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

      </div>

      {/* 🚨 MODAL: CHANGE ACCOUNT EMAIL 🚨 */}
      {isChangeEmailModalOpen && (
        <div className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><UserCircle2 className="w-5 h-5 text-blue-500" /> Account Access</h3>
              <button onClick={() => setIsChangeEmailModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                 <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                 <p className="text-xs font-bold text-amber-800 leading-relaxed">
                   Updating your email requires re-verification. A confirmation link will be sent to your new address. Your profile may be hidden from the Matchmaker until verified.
                 </p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">New Email Address</label>
                <input 
                  type="email" 
                  value={newEmailInput} 
                  onChange={(e) => setNewEmailInput(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. athlete@newemail.com"
                />
              </div>
              <button 
                onClick={handleUpdateEmail}
                disabled={isUpdatingEmail}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-black py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] flex justify-center items-center gap-2 mt-2"
              >
                {isUpdatingEmail ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Send Verification Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 MODAL: EMAIL VERIFICATION (OTP) 🚨 */}
      {isEmailVerificationModalOpen && (
        <div className="fixed inset-0 z-[500] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md relative animate-in zoom-in-95 duration-300">
             <button 
               onClick={() => {
                 setIsEmailVerificationModalOpen(false);
                 window.location.reload();
               }} 
               className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 text-white font-black"
             >
               <X className="w-5 h-5" />
             </button>
             <EmailVerification />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}} />
    </main>
  );
}