'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  CheckCircle2, Plus, X, Medal, ShieldCheck, Trash2, Trophy, 
  ChevronDown, Award, Edit3, School, Check, Globe, User, 
  Sparkles, AlertTriangle, Zap, Gauge, Layers
} from 'lucide-react';
import { 
  evaluateMetric, 
  getOverallTier, 
  SportMetaConfig, 
  getSportPositionBlueprint,
  ImpactBucketOption,
  CombineMetricPrompt
} from '@/utils/constants/RecruitingStandards';

// 🚨 Dedicated Stopwatch / Mat Editors
import XCEditor from '@/components/dashboard/sports/XCEditor';
import SwimEditor from '@/components/dashboard/sports/SwimEditor';
import TrackEditor from '@/components/dashboard/sports/TrackEditor';
import WrestlingEditor from '@/components/dashboard/sports/WrestlingEditor';

export interface SportMetricItem {
  name: string;
  value: string;
  score?: number;
}

export interface IndexedSportMetric {
  metric: SportMetricItem;
  originalIndex: number;
}

const TEAM_SPORTS = [
  'Football', 'Soccer', 'Lacrosse', 'Field Hockey', 
  'Basketball', 'Volleyball', 'Baseball', 'Softball', 
  'Ice Hockey', 'Water Polo'
];

const CUSTOM_EDITOR_SPORTS = [
  'Cross Country',
  'Swimming & Diving',
  'Track & Field',
  'Wrestling'
];

// 🚨 Enforced Strict Values for Dropdown Selectors
const TEAM_PLACEMENTS = [
  '1st Place (Champion)', '2nd Place', '3rd Place', '4th Place', '5th Place',
  '6th Place', '7th Place', '8th Place', '9th Place', '10th Place',
  '11th Place', '12th Place', 'Top 16 / Sweet 16', 'Top 32', 'Qualifier'
];

const INDIVIDUAL_PLACEMENTS = [
  '1st Place (Champion)', '2nd Place', '3rd Place', '4th Place', '5th Place',
  '6th Place', '7th Place', '8th Place', '9th Place', '10th Place',
  '11th Place', '12th Place', '13th-25th Place', '26th-50th Place', '51st+ Place', 'Qualifier'
];

const CONTRIBUTION_LEVELS = [
  'Starting / Core Contributor',
  'Started Some of the Time',
  'Not Starting / Reserve'
];

const COMPETITION_LEVELS = [
  'Conference / District',
  'State',
  'Regional',
  'National'
];

const QUICK_HONOR_PRESETS = [
  'All-State 1st Team',
  'All-State 2nd Team / Honorable Mention',
  'All-Conference / All-District 1st Team',
  'All-Conference / All-District 2nd Team',
  'Team MVP / Player of the Year',
  'Varsity Team Captain',
  'Verified College Offer / Camp Invite',
  'Academic All-State'
];

// 🚨 Baseline & Context Scoring Matrices
const LEVEL_BASE_SCORES: Record<string, number> = {
  'JV / Dev Squad': 35,
  'Varsity Contributor': 50,
  'Varsity Starter': 64,
  'All-Conference Tier': 75,
  'Elite Club (ECNL / AAU / Next)': 80,
  'All-State / National': 88
};

const SCHOOL_SIZE_MODIFIERS: Record<string, number> = {
  'Small (< 500)': -2,
  'Medium (500 - 999)': 0,
  'Large (1,000 - 1,999)': 3,
  'Mega (2,000+)': 5
};

const IMPACT_METRIC_KEY = 'Impact Archetype';

const getLocalTierStyles = (score: number) => {
  if (score >= 95) return { tier: 'Power 4 D1', colorClass: 'text-fuchsia-400', bgClass: 'bg-fuchsia-500/10', borderClass: 'border-fuchsia-500/30' };
  if (score >= 85) return { tier: 'Mid-Major D1', colorClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/30' };
  if (score >= 75) return { tier: 'Top D2 / Walk-On', colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/30' };
  if (score >= 65) return { tier: 'D2 / D3 Prospect', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/30' };
  if (score >= 55) return { tier: 'NAIA Prospect', colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/30' };
  if (score >= 40) return { tier: 'Strong Varsity', colorClass: 'text-slate-300', bgClass: 'bg-slate-500/20', borderClass: 'border-slate-400/50' };
  if (score >= 20) return { tier: 'Varsity Contributor', colorClass: 'text-slate-400', bgClass: 'bg-slate-500/10', borderClass: 'border-slate-500/30' };
  return { tier: 'Developmental', colorClass: 'text-slate-500', bgClass: 'bg-slate-500/5', borderClass: 'border-slate-600/30' };
};

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// 🚨 Deterministic Accolade Bonus Calculator (Max +14 pts)
const calculateAccoladeBonus = (accolades: any[]): number => {
  if (!accolades || accolades.length === 0) return 0;
  let totalBonus = 0;

  accolades.forEach((acc: any) => {
    if (acc.type === 'HS_Team' || acc.type === 'Club_Team') {
      const levelMult = acc.level === 'National' ? 2.0 : acc.level === 'Regional' ? 1.5 : acc.level === 'State' ? 1.25 : 0.8;
      const contribMult = acc.contribution === 'Starting / Core Contributor' ? 1.0 : acc.contribution === 'Started Some of the Time' ? 0.6 : 0.25;
      
      let placeBase = 1.5;
      if (acc.placement === '1st Place (Champion)') placeBase = 5.0;
      else if (acc.placement === '2nd Place') placeBase = 4.0;
      else if (acc.placement === '3rd Place') placeBase = 3.2;
      else if (['4th Place', '5th Place', '6th Place', '7th Place', '8th Place'].includes(acc.placement)) placeBase = 2.4;

      totalBonus += placeBase * levelMult * contribMult;
    } else if (acc.type === 'Individual') {
      const levelMult = acc.level === 'National' ? 2.2 : acc.level === 'Regional' ? 1.6 : acc.level === 'State' ? 1.3 : 0.85;
      
      let placeBase = 1.5;
      if (acc.placement === '1st Place (Champion)') placeBase = 5.5;
      else if (acc.placement === '2nd Place') placeBase = 4.5;
      else if (acc.placement === '3rd Place') placeBase = 3.8;
      else if (['4th Place', '5th Place', '6th Place', '7th Place', '8th Place'].includes(acc.placement)) placeBase = 2.8;

      totalBonus += placeBase * levelMult;
    } else if (acc.type === 'Honor' || acc.type === 'other') {
      const text = (acc.text || '').toLowerCase();
      if (text.includes('offer') || text.includes('all-state 1st') || text.includes('national')) {
        totalBonus += 5.0;
      } else if (text.includes('all-state') || text.includes('mvp') || text.includes('player of the year') || text.includes('1st team')) {
        totalBonus += 3.5;
      } else {
        totalBonus += 2.0;
      }
    }
  });

  return Math.min(14, Math.round(totalBonus));
};

// 🚨 Dynamic Theming Engine
const getEquippedStyles = (profile: any) => {
  const style = profile?.equipped_card || profile?.equipped_border || 'base';
  switch (style) {
    case 'obsidian': return { 
      bg: 'bg-slate-900/60', border: 'border-slate-600', glow: 'shadow-[0_0_20px_rgba(71,85,105,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(71,85,105,0.15)]',
      text: 'text-slate-300', highlight: 'text-white', icon: 'text-slate-400',
      focusRing: 'focus:ring-slate-500/30 focus:border-slate-500',
      glowLine: 'from-slate-500/0 via-slate-500/50 to-slate-500/0'
    };
    case 'crimson': return { 
      bg: 'bg-red-950/30', border: 'border-red-500/50', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
      text: 'text-red-200', highlight: 'text-red-400', icon: 'text-red-500',
      focusRing: 'focus:ring-red-500/30 focus:border-red-500',
      glowLine: 'from-red-500/0 via-red-500/50 to-red-500/0'
    };
    case 'sapphire': return { 
      bg: 'bg-blue-950/30', border: 'border-blue-500/50', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      text: 'text-blue-200', highlight: 'text-blue-400', icon: 'text-blue-500',
      focusRing: 'focus:ring-blue-500/30 focus:border-blue-500',
      glowLine: 'from-blue-500/0 via-blue-500/50 to-blue-500/0'
    };
    case 'hype': return { 
      bg: 'bg-indigo-950/30', border: 'border-indigo-500/50', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]',
      text: 'text-indigo-200', highlight: 'text-indigo-400', icon: 'text-indigo-500',
      focusRing: 'focus:ring-indigo-500/30 focus:border-indigo-500',
      glowLine: 'from-indigo-500/0 via-indigo-500/50 to-indigo-500/0'
    };
    case 'premium': return { 
      bg: 'bg-amber-950/30', border: 'border-amber-500/50', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      text: 'text-amber-200', highlight: 'text-amber-400', icon: 'text-amber-500',
      focusRing: 'focus:ring-amber-500/30 focus:border-amber-500',
      glowLine: 'from-amber-500/0 via-amber-500/50 to-amber-500/0'
    };
    case 'amethyst': return { 
      bg: 'bg-fuchsia-950/30', border: 'border-fuchsia-500/50', glow: 'shadow-[0_0_20px_rgba(217,70,239,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(217,70,239,0.15)]',
      text: 'text-fuchsia-200', highlight: 'text-fuchsia-400', icon: 'text-fuchsia-500',
      focusRing: 'focus:ring-fuchsia-500/30 focus:border-fuchsia-500',
      glowLine: 'from-fuchsia-500/0 via-fuchsia-500/50 to-fuchsia-500/0'
    };
    case 'cyber': return { 
      bg: 'bg-cyan-950/30', border: 'border-cyan-500/50', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]', hoverGlow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      text: 'text-cyan-200', highlight: 'text-cyan-400', icon: 'text-cyan-500',
      focusRing: 'focus:ring-cyan-500/30 focus:border-cyan-500',
      glowLine: 'from-cyan-500/0 via-cyan-500/50 to-cyan-500/0'
    };
    default: return { 
      bg: 'bg-slate-950/50', border: 'border-slate-800', glow: 'shadow-lg', hoverGlow: 'hover:shadow-lg',
      text: 'text-slate-400', highlight: 'text-white', icon: 'text-indigo-500',
      focusRing: 'focus:ring-indigo-500/30 focus:border-indigo-500',
      glowLine: 'from-indigo-500/0 via-indigo-500/50 to-indigo-500/0'
    };
  }
};

type RegistryTabSection = 'impact' | 'measurables' | 'honors';
type CustomSportSection = 'marks' | 'honors';

interface SportRegistryProps {
  sport?: string;
  sportName?: string;
  sportStats: any;
  genderKey: string;
  athleteProfile: any;
  config: SportMetaConfig;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onDisable?: () => void;
  onDelete?: () => void;
}

export default function SportEditorRegistry({ 
  sport, sportName, sportStats, genderKey, athleteProfile, config, onSync, showToast, onDisable, onDelete 
}: SportRegistryProps) {
  
  const actualSport = sport || sportName || sportStats?.sport_name || sportStats?.sport || '';
  const isTeamSport = TEAM_SPORTS.includes(actualSport);
  const isCustomEditorSport = CUSTOM_EDITOR_SPORTS.includes(actualSport);

  const eq = getEquippedStyles(athleteProfile);

  // 3-Button Fixed Pillar Navigation (Zero horizontal swiping)
  const [activeSection, setActiveSection] = useState<RegistryTabSection>('impact');
  const [customSportTab, setCustomSportTab] = useState<CustomSportSection>('marks');

  // Position-Specific Zero-Friction Blueprint
  const activePosition = sportStats?.position || config?.positions?.[0] || '';
  const blueprint = useMemo(
    () => getSportPositionBlueprint(actualSport, activePosition),
    [actualSport, activePosition]
  );

  // Combine Measurable Local State (prevents spamming Supabase on every keystroke)
  const [combineDrafts, setCombineDrafts] = useState<Record<string, string>>({});
  const [showCustomMetricBar, setShowCustomMetricBar] = useState(false);

  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');
  
  const [editingGenericIdx, setEditingGenericIdx] = useState<number | null>(null);
  const [editGenericName, setEditGenericName] = useState('');
  const [editGenericValue, setEditGenericValue] = useState('');

  const [localAccolades, setLocalAccolades] = useState<any[]>(sportStats?.metaContext?.accolades || []);
  const [showAccoladeForm, setShowAccoladeForm] = useState(false);
  const [editingAccoladeIdx, setEditingAccoladeIdx] = useState<number | null>(null); 
  
  const [accCategory, setAccCategory] = useState<'HS_Team' | 'Club_Team' | 'Individual' | 'Honor' | ''>('');
  const [accLevel, setAccLevel] = useState('');
  const [accPlacement, setAccPlacement] = useState('');
  const [accContribution, setAccContribution] = useState('');
  const [accHonorText, setAccHonorText] = useState('');

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Hydrate combine drafts and accolades when sport tab or metrics change
  useEffect(() => {
    setLocalAccolades(sportStats?.metaContext?.accolades || []);
    setEditingGenericIdx(null);
    setShowAccoladeForm(false);
    setConfirmingDelete(false);

    const initialDrafts: Record<string, string> = {};
    const rawMetrics: SportMetricItem[] = Array.isArray(sportStats?.metrics) ? sportStats.metrics : [];
    rawMetrics.forEach((m: SportMetricItem) => {
      if (m?.name && m.name !== IMPACT_METRIC_KEY) {
        initialDrafts[m.name] = String(m.value ?? '');
      }
    });
    setCombineDrafts(initialDrafts);
  }, [actualSport, sportStats?.metrics, sportStats?.metaContext?.accolades]);

  // Determine currently active Impact Bucket
  const selectedImpactTierId: string = useMemo(() => {
    if (sportStats?.metaContext?.impactTierId) {
      return String(sportStats.metaContext.impactTierId);
    }
    const rawMetrics: SportMetricItem[] = Array.isArray(sportStats?.metrics) ? sportStats.metrics : [];
    const existingBadgeMetric = rawMetrics.find((m: SportMetricItem) => m.name === IMPACT_METRIC_KEY);
    if (existingBadgeMetric) {
      const matched = blueprint.impactBuckets.find((b: ImpactBucketOption) => b.badge === existingBadgeMetric.value);
      if (matched) return matched.id;
    }
    return '';
  }, [sportStats?.metaContext?.impactTierId, sportStats?.metrics, blueprint.impactBuckets]);

  const activeImpactBucket: ImpactBucketOption | null = useMemo(
    () => blueprint.impactBuckets.find((b: ImpactBucketOption) => b.id === selectedImpactTierId) || null,
    [blueprint.impactBuckets, selectedImpactTierId]
  );

  // 🚨 4-Pillar Composite Score Compiler (Impact Bucket + Combine Measurables + Level + Context/Accolades)
  const compileRegistryBaselineScore = (
    nextLevel: string,
    nextSchoolSize: string,
    nextMetrics: SportMetricItem[],
    nextAccolades: any[],
    explicitImpactScore?: number
  ): number => {
    let topCombineScore = 0;
    const combineScores: number[] = [];

    if (nextMetrics && nextMetrics.length > 0) {
      nextMetrics.forEach((m: SportMetricItem) => {
        if (!m?.name || m.name === IMPACT_METRIC_KEY) return;
        const evalResult = evaluateMetric(genderKey, actualSport, m.name, String(m.value), nextLevel || 'Varsity Starter');
        const mScore = evalResult?.score || m.score || 0;
        if (mScore > 0) {
          combineScores.push(mScore);
          if (mScore > topCombineScore) topCombineScore = mScore;
        }
      });
    }

    const avgCombineScore = combineScores.length > 0
      ? Math.round(topCombineScore * 0.7 + (combineScores.reduce((a: number, b: number) => a + b, 0) / combineScores.length) * 0.3)
      : 0;

    const impactScore = explicitImpactScore !== undefined
      ? explicitImpactScore
      : (activeImpactBucket?.score || sportStats?.metaContext?.impactTierScore || 0);

    const levelBase = LEVEL_BASE_SCORES[nextLevel] || 0;
    const sizeMod = SCHOOL_SIZE_MODIFIERS[nextSchoolSize] || 0;
    const accoladeMod = calculateAccoladeBonus(nextAccolades);

    if (impactScore === 0 && avgCombineScore === 0 && levelBase === 0 && accoladeMod === 0) {
      return sportStats?.calculatedRating || 0;
    }

    let coreScore = 0;
    if (impactScore > 0 && avgCombineScore > 0 && levelBase > 0) {
      coreScore = Math.round(impactScore * 0.40 + avgCombineScore * 0.35 + levelBase * 0.25);
    } else if (impactScore > 0 && levelBase > 0) {
      coreScore = Math.round(impactScore * 0.60 + levelBase * 0.40);
    } else if (avgCombineScore > 0 && levelBase > 0) {
      coreScore = Math.round(avgCombineScore * 0.65 + levelBase * 0.35);
    } else if (impactScore > 0 && avgCombineScore > 0) {
      coreScore = Math.round(impactScore * 0.50 + avgCombineScore * 0.50);
    } else {
      coreScore = impactScore || avgCombineScore || levelBase;
    }

    let finalScore = coreScore + sizeMod + accoladeMod;

    if (nextLevel === 'JV / Dev Squad') {
      const cap = avgCombineScore >= 80 ? 58 : 49;
      finalScore = Math.min(cap, finalScore);
    } else if (nextLevel === 'Varsity Contributor') {
      const cap = avgCombineScore >= 85 ? 72 : 68;
      finalScore = Math.min(cap, finalScore);
    }

    return Math.min(99, Math.max(10, Math.round(finalScore)));
  };

  // 🚨 Safe sync wrapper for custom child editors so metaContext (accolades/schoolSize) is never wiped
  const handleChildEditorSync = async (childPayload: any) => {
    const mergedMetaContext = {
      ...(sportStats?.metaContext || {}),
      ...(childPayload?.metaContext || {}),
      accolades: localAccolades
    };

    await onSync({
      ...sportStats,
      ...childPayload,
      metaContext: mergedMetaContext
    });
  };

  const updateSportMeta = (field: string, value: string) => {
    const nextPosition = field === 'position' ? value : (sportStats?.position || '');
    const nextLevel = field === 'level' ? value : (sportStats?.level || '');
    const nextSize = sportStats?.metaContext?.schoolSize || '';
    const nextMetrics: SportMetricItem[] = Array.isArray(sportStats?.metrics) ? [...sportStats.metrics] : [];

    let nextImpactScore = activeImpactBucket?.score || 0;
    let nextImpactLabel = activeImpactBucket?.label || '';
    if (field === 'position' && selectedImpactTierId) {
      const nextBp = getSportPositionBlueprint(actualSport, nextPosition);
      const mappedBucket = nextBp.impactBuckets.find((b: ImpactBucketOption) => b.id === selectedImpactTierId);
      if (mappedBucket) {
        nextImpactScore = mappedBucket.score;
        nextImpactLabel = mappedBucket.label;
        const badgeObj: SportMetricItem = { name: IMPACT_METRIC_KEY, value: mappedBucket.badge, score: mappedBucket.score };
        const existingIdx = nextMetrics.findIndex((m: SportMetricItem) => m.name === IMPACT_METRIC_KEY);
        if (existingIdx >= 0) nextMetrics[existingIdx] = badgeObj;
        else nextMetrics.unshift(badgeObj);
      }
    }

    const updatedRating = compileRegistryBaselineScore(
      nextLevel,
      nextSize,
      nextMetrics,
      localAccolades,
      nextImpactScore
    );

    onSync({ 
      ...sportStats, 
      [field]: value,
      metrics: nextMetrics,
      calculatedRating: updatedRating,
      metaContext: {
        ...(sportStats?.metaContext || {}),
        ...(nextImpactScore > 0 ? {
          impactTierId: selectedImpactTierId,
          impactTierLabel: nextImpactLabel,
          impactTierScore: nextImpactScore
        } : {})
      }
    });
  };

  const updateMetaContext = (field: string, value: string) => {
    const nextLevel = sportStats?.level || '';
    const nextSize = field === 'schoolSize' ? value : (sportStats?.metaContext?.schoolSize || '');
    const nextMetrics: SportMetricItem[] = Array.isArray(sportStats?.metrics) ? sportStats.metrics : [];
    const updatedRating = compileRegistryBaselineScore(nextLevel, nextSize, nextMetrics, localAccolades);

    onSync({
      ...sportStats,
      calculatedRating: updatedRating,
      metaContext: {
        ...(sportStats?.metaContext || {}),
        [field]: value
      }
    });
  };

  // 🚨 1-Tap Impact Bucket Selection Handler
  const handleSelectImpactBucket = (bucket: ImpactBucketOption) => {
    const nextMetrics: SportMetricItem[] = Array.isArray(sportStats?.metrics) ? [...sportStats.metrics] : [];
    const badgeObj: SportMetricItem = { name: IMPACT_METRIC_KEY, value: bucket.badge, score: bucket.score };
    const existingIdx = nextMetrics.findIndex((m: SportMetricItem) => m.name === IMPACT_METRIC_KEY);

    if (existingIdx >= 0) nextMetrics[existingIdx] = badgeObj;
    else nextMetrics.unshift(badgeObj);

    const nextLevel = sportStats?.level || (config?.requiresLevel ? 'Varsity Starter' : '');
    const nextPosition = sportStats?.position || config?.positions?.[0] || '';
    const nextSize = sportStats?.metaContext?.schoolSize || '';

    const updatedRating = compileRegistryBaselineScore(
      nextLevel,
      nextSize,
      nextMetrics,
      localAccolades,
      bucket.score
    );

    onSync({
      ...sportStats,
      position: nextPosition,
      level: nextLevel,
      metrics: nextMetrics,
      calculatedRating: updatedRating,
      metaContext: {
        ...(sportStats?.metaContext || {}),
        impactTierId: bucket.id,
        impactTierLabel: bucket.label,
        impactTierScore: bucket.score
      }
    });

    showToast(`Impact tier set to "${bucket.badge}"!`, 'success');
  };

  // 🚨 Combine Measurable Commit Handler (Triggered on Blur or Enter)
  const commitCombineMeasurable = (metricName: string, rawValue: string) => {
    const trimmed = rawValue.trim();
    const currentMetrics: SportMetricItem[] = Array.isArray(sportStats?.metrics) ? [...sportStats.metrics] : [];
    const existingIdx = currentMetrics.findIndex((m: SportMetricItem) => m.name.toLowerCase() === metricName.toLowerCase());

    if (!trimmed && existingIdx === -1) return;
    if (existingIdx >= 0 && String(currentMetrics[existingIdx].value) === trimmed) return;

    if (!trimmed && existingIdx >= 0) {
      currentMetrics.splice(existingIdx, 1);
    } else {
      const evalLevel = sportStats?.level || 'Varsity Starter';
      const evalResult = evaluateMetric(genderKey, actualSport, metricName, trimmed, evalLevel);
      const metricObj: SportMetricItem = {
        name: metricName,
        value: trimmed,
        ...(evalResult?.score ? { score: evalResult.score } : {})
      };
      if (existingIdx >= 0) currentMetrics[existingIdx] = metricObj;
      else currentMetrics.push(metricObj);
    }

    const updatedRating = compileRegistryBaselineScore(
      sportStats?.level || '',
      sportStats?.metaContext?.schoolSize || '',
      currentMetrics,
      localAccolades
    );

    onSync({
      ...sportStats,
      position: sportStats?.position || config?.positions?.[0] || '',
      metrics: currentMetrics,
      calculatedRating: updatedRating
    });

    showToast(`${metricName.split('(')[0].trim()} synced!`, 'success');
  };

  const addSportMetric = () => {
    const name = newMetricName.trim();
    const val = newMetricValue.trim();
    if (!name || !val) return;

    const evalLevel = sportStats?.level || 'Varsity Starter';
    const evalResult = evaluateMetric(genderKey, actualSport, name, val, evalLevel);
    const metricObj: SportMetricItem = { name, value: val, ...(evalResult?.score ? { score: evalResult.score } : {}) };

    const newMetrics: SportMetricItem[] = Array.isArray(sportStats?.metrics) ? [...sportStats.metrics] : [];
    const existingIdx = newMetrics.findIndex((m: SportMetricItem) => m.name.toLowerCase() === name.toLowerCase());
    
    if (existingIdx >= 0) newMetrics[existingIdx] = metricObj; 
    else newMetrics.push(metricObj);

    const updatedRating = compileRegistryBaselineScore(
      sportStats?.level || '',
      sportStats?.metaContext?.schoolSize || '',
      newMetrics,
      localAccolades
    );

    setNewMetricName('');
    setNewMetricValue('');
    setShowCustomMetricBar(false);
    onSync({ ...sportStats, metrics: newMetrics, calculatedRating: updatedRating });
    showToast(`${name} added to profile!`, 'success');
  };

  const saveEditedGenericMetric = () => {
    if (editingGenericIdx === null) return;
    const name = editGenericName.trim();
    const val = editGenericValue.trim();
    if (!name || !val) return;

    const evalLevel = sportStats?.level || 'Varsity Starter';
    const evalResult = evaluateMetric(genderKey, actualSport, name, val, evalLevel);
    const metricObj: SportMetricItem = { name, value: val, ...(evalResult?.score ? { score: evalResult.score } : {}) };

    const newMetrics: SportMetricItem[] = Array.isArray(sportStats?.metrics) ? [...sportStats.metrics] : [];
    newMetrics[editingGenericIdx] = metricObj;
    
    const updatedRating = compileRegistryBaselineScore(
      sportStats?.level || '',
      sportStats?.metaContext?.schoolSize || '',
      newMetrics,
      localAccolades
    );

    onSync({ ...sportStats, metrics: newMetrics, calculatedRating: updatedRating });
    setEditingGenericIdx(null);
    showToast('Metric updated successfully', 'success');
  };

  const removeSportMetric = (index: number) => {
    const newMetrics: SportMetricItem[] = Array.isArray(sportStats?.metrics) ? [...sportStats.metrics] : [];
    newMetrics.splice(index, 1);
    const updatedRating = compileRegistryBaselineScore(
      sportStats?.level || '',
      sportStats?.metaContext?.schoolSize || '',
      newMetrics,
      localAccolades
    );
    onSync({ ...sportStats, metrics: newMetrics, calculatedRating: updatedRating });
    if (editingGenericIdx === index) setEditingGenericIdx(null);
  };

  const saveAccoladesData = (updatedAccolades: any[]) => {
    const rawMetrics: SportMetricItem[] = Array.isArray(sportStats?.metrics) ? sportStats.metrics : [];
    const updatedRating = isCustomEditorSport
      ? (sportStats?.calculatedRating || 0)
      : compileRegistryBaselineScore(
          sportStats?.level || '',
          sportStats?.metaContext?.schoolSize || '',
          rawMetrics,
          updatedAccolades
        );

    onSync({
      ...sportStats,
      calculatedRating: updatedRating,
      metaContext: {
        ...(sportStats?.metaContext || {}),
        accolades: updatedAccolades
      }
    });
    showToast('Placements & honors synced successfully!', 'success');
  };

  const handleAddAccolade = () => {
    let newAcc: any = null;

    if (accCategory === 'HS_Team' || accCategory === 'Club_Team') {
      if (!accLevel || !accPlacement || !accContribution) {
        return showToast('Please select a level, placement, and contribution.', 'error');
      }
      if (!TEAM_PLACEMENTS.includes(accPlacement)) {
        return showToast('Please select a valid placement from the list.', 'error');
      }
      newAcc = { type: accCategory, level: accLevel, placement: accPlacement, contribution: accContribution };
    
    } else if (accCategory === 'Individual') {
      if (!accLevel || !accPlacement) {
        return showToast('Please select a competition level and placement.', 'error');
      }
      if (!INDIVIDUAL_PLACEMENTS.includes(accPlacement)) {
        return showToast('Please select a valid individual placement from the list.', 'error');
      }
      newAcc = { type: accCategory, level: accLevel, placement: accPlacement };
    
    } else if (accCategory === 'Honor') {
      if (!accHonorText.trim()) {
        return showToast('Please select a preset honor or enter a custom description.', 'error');
      }
      newAcc = { type: 'Honor', text: accHonorText.trim() };
    }

    if (newAcc) {
      let updated: any[];
      if (editingAccoladeIdx !== null) {
        updated = [...localAccolades];
        updated[editingAccoladeIdx] = newAcc;
      } else {
        updated = [...localAccolades, newAcc];
      }
      
      setLocalAccolades(updated);
      
      setShowAccoladeForm(false);
      setAccCategory('');
      setAccLevel('');
      setAccPlacement('');
      setAccContribution('');
      setAccHonorText('');
      setEditingAccoladeIdx(null); 
      
      saveAccoladesData(updated);
    }
  };

  const handleRemoveAccolade = (indexToRemove: number) => {
    const updated = localAccolades.filter((_: any, idx: number) => idx !== indexToRemove);
    setLocalAccolades(updated);
    saveAccoladesData(updated);
  };

  const handleDisableSport = async () => {
    if (onDisable) return onDisable();
    if (!athleteProfile?.id) return;
    try {
      const supabase = createClient();
      await supabase.from('athlete_sports').update({ is_active: false }).eq('athlete_id', athleteProfile.id).eq('sport_name', actualSport);
      showToast(`${actualSport} has been disabled.`, 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast('Failed to disable sport.', 'error');
    }
  };

  const handleDeleteSport = async () => {
    if (onDelete) return onDelete();
    if (!athleteProfile?.id) return;
    try {
      const supabase = createClient();
      await supabase.from('athlete_sports').delete().eq('athlete_id', athleteProfile.id).eq('sport_name', actualSport);
      showToast(`${actualSport} data has been completely removed.`, 'success');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast('Failed to delete sport.', 'error');
    }
  };

  const getDisplayScore = () => {
    const rawMetrics: SportMetricItem[] = Array.isArray(sportStats?.metrics) ? sportStats.metrics : [];
    if (actualSport === 'Track & Field' || actualSport === 'Swimming & Diving') {
      if (rawMetrics.length === 0) return 0;
      let topScore = 0;
      rawMetrics.forEach((m: SportMetricItem) => {
        const evalLevel = actualSport === 'Track & Field' ? 'Varsity' : (sportStats?.level || 'Varsity');
        const evalResult = evaluateMetric(genderKey, actualSport, m.name, m.value, evalLevel);
        const metricScore = m.score || evalResult?.score || 0;
        if (metricScore > topScore) topScore = metricScore;
      });
      return Math.max(topScore, sportStats?.calculatedRating || 0);
    }
    if (isCustomEditorSport) {
      return sportStats?.calculatedRating || 0;
    }
    const liveCompiled = compileRegistryBaselineScore(
      sportStats?.level || '',
      sportStats?.metaContext?.schoolSize || '',
      rawMetrics,
      localAccolades
    );
    return liveCompiled > 0 ? liveCompiled : (sportStats?.calculatedRating || 0);
  };

  const rating = getDisplayScore();
  const tier = getOverallTier(rating);
  const accoladeBonusPts = calculateAccoladeBonus(localAccolades);
  const loggedCombineCount = Object.values(combineDrafts).filter(Boolean).length;

  // Additional user-added metrics (excluding the Impact Archetype badge and primary combine prompts)
  const combinePromptNames = useMemo(
    () => new Set(blueprint.combinePrompts.map((p: CombineMetricPrompt) => p.metricName.toLowerCase())),
    [blueprint.combinePrompts]
  );

  const extraMetricsWithIndex = useMemo<IndexedSportMetric[]>(() => {
    const rawMetrics: SportMetricItem[] = Array.isArray(sportStats?.metrics) ? sportStats.metrics : [];
    return rawMetrics
      .map((m: SportMetricItem, idx: number): IndexedSportMetric => ({ metric: m, originalIndex: idx }))
      .filter(
        (item: IndexedSportMetric) =>
          Boolean(item.metric?.name) &&
          item.metric.name !== IMPACT_METRIC_KEY &&
          !combinePromptNames.has(item.metric.name.toLowerCase())
      );
  }, [sportStats?.metrics, combinePromptNames]);

  const totalLoggedMeasurables = loggedCombineCount + extraMetricsWithIndex.length;

  const renderCustomEditor = () => {
    const props = { 
      sportStats, 
      genderKey, 
      onSync: handleChildEditorSync, 
      showToast, 
      athleteProfile, 
      config, 
      displayRating: rating, 
      displayTier: tier, 
      equippedTheme: eq 
    };
    switch (actualSport) {
      case 'Cross Country': return <XCEditor xcStats={sportStats} {...props} />;
      case 'Swimming & Diving': return <SwimEditor swimStats={sportStats} {...props} />;
      case 'Track & Field': return <TrackEditor trackStats={sportStats} {...props} />;
      case 'Wrestling': return <WrestlingEditor wrestlingStats={sportStats} {...props} />;
      default: return null;
    }
  };

  const CustomEditorComponent = renderCustomEditor();

  // Reusable Honors & Placements Block (No Truncated Headers)
  const renderHonorsSection = () => (
    <div className="pt-1 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 pb-3 border-b border-slate-800/60 gap-2.5">
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <h4 className="text-xs sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" /> 
              <span>Placements & Honors</span>
            </h4>
            {accoladeBonusPts > 0 && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300">
                +{accoladeBonusPts} Score Boost
              </span>
            )}
          </div>
          <p className="text-[10px] font-medium text-slate-400 mt-0.5 leading-snug">
            Verified team finishes and individual honors boost your composite rating.
          </p>
        </div>
        {!showAccoladeForm && (
          <button 
            type="button"
            onClick={() => setShowAccoladeForm(true)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Placement / Honor
          </button>
        )}
      </div>

      {!showAccoladeForm && localAccolades.length === 0 && (
        <div 
          onClick={() => setShowAccoladeForm(true)}
          className={`flex flex-col items-center justify-center p-5 border border-dashed ${eq.border} rounded-2xl text-center cursor-pointer hover:bg-slate-800/30 transition-all`}
        >
          <Medal className="w-6 h-6 text-amber-500/50 mb-1.5" />
          <h4 className="text-xs sm:text-sm font-black text-slate-300">No Placements or Honors Logged</h4>
          <p className="text-[10px] font-bold text-slate-500 mt-0.5">Tap to add All-Conference, State Finishes, or Team Titles</p>
        </div>
      )}

      {localAccolades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-2">
          {localAccolades.map((acc: any, idx: number) => {
            let IconUI = null;
            if (acc.type === 'HS_Team') IconUI = <School className="w-4 h-4 text-amber-400" />;
            else if (acc.type === 'Club_Team') IconUI = <Globe className="w-4 h-4 text-cyan-400" />;
            else if (acc.type === 'Individual') IconUI = <User className="w-4 h-4 text-emerald-400" />;
            else IconUI = <Award className="w-4 h-4 text-indigo-400" />;

            const displayTitle = acc.type === 'Honor' || acc.type === 'other' 
              ? acc.text 
              : (acc.type === 'state' ? `${getOrdinal(Number(acc.placement))} Place` : `${acc.placement}${acc.level ? ` • ${acc.level}` : ''}`);
            const displaySub = acc.contribution || (acc.type === 'Honor' || acc.type === 'other' ? 'Career Accolade' : 'Individual Tournament Rank');

            return (
              <div key={idx} className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    {IconUI}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-black text-white break-words leading-snug">{displayTitle}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 break-words">{displaySub}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingAccoladeIdx(idx); 
                      setAccCategory(acc.type || '');
                      if (acc.type === 'Honor') setAccHonorText(acc.text || '');
                      else { setAccLevel(acc.level || ''); setAccPlacement(acc.placement || ''); setAccContribution(acc.contribution || ''); }
                      setShowAccoladeForm(true);
                    }}
                    className="w-7 h-7 flex items-center justify-center bg-slate-800 rounded-lg text-slate-300 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleRemoveAccolade(idx)}
                    className="w-7 h-7 flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAccoladeForm && (
        <div className="bg-slate-950 border border-indigo-500/30 p-3.5 sm:p-5 rounded-2xl relative mt-2 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {editingAccoladeIdx !== null ? 'Edit Accolade' : 'Select Accolade Type'}
            </span>
            <button 
              type="button"
              onClick={() => { setShowAccoladeForm(false); setAccCategory(''); setEditingAccoladeIdx(null); }} 
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white bg-slate-900 rounded-lg"
            >
              <X className="w-4 h-4"/>
            </button>
          </div>
          
          <div className={`grid ${isTeamSport ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'} gap-1.5 sm:gap-2 mb-4`}>
            <button type="button" onClick={() => setAccCategory('HS_Team')} className={`py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${accCategory === 'HS_Team' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>HS Team</button>
            <button type="button" onClick={() => setAccCategory('Club_Team')} className={`py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${accCategory === 'Club_Team' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>Club Team</button>
            {!isTeamSport && <button type="button" onClick={() => setAccCategory('Individual')} className={`py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${accCategory === 'Individual' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>Individual</button>}
            <button type="button" onClick={() => setAccCategory('Honor')} className={`py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${accCategory === 'Honor' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>Honor</button>
          </div>

          {(accCategory === 'HS_Team' || accCategory === 'Club_Team') && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
              <div className="relative">
                <select value={accLevel} onChange={(e) => setAccLevel(e.target.value)} className="w-full bg-slate-900 border border-slate-700 pl-3 pr-8 py-2.5 rounded-xl text-xs font-bold text-white outline-none appearance-none cursor-pointer">
                  <option value="">Select Level...</option>
                  {COMPETITION_LEVELS.map((level: string) => <option key={level} value={level}>{level}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={accPlacement} onChange={(e) => setAccPlacement(e.target.value)} className="w-full bg-slate-900 border border-slate-700 pl-3 pr-8 py-2.5 rounded-xl text-xs font-bold text-white outline-none appearance-none cursor-pointer">
                  <option value="">Select Placement...</option>
                  {TEAM_PLACEMENTS.map((p: string) => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={accContribution} onChange={(e) => setAccContribution(e.target.value)} className="w-full bg-slate-900 border border-slate-700 pl-3 pr-8 py-2.5 rounded-xl text-xs font-bold text-white outline-none appearance-none cursor-pointer">
                  <option value="">Select Role...</option>
                  {CONTRIBUTION_LEVELS.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {accCategory === 'Individual' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
              <div className="relative">
                <select value={accLevel} onChange={(e) => setAccLevel(e.target.value)} className="w-full bg-slate-900 border border-slate-700 pl-3 pr-8 py-2.5 rounded-xl text-xs font-bold text-white outline-none appearance-none cursor-pointer">
                  <option value="">Select Level...</option>
                  {COMPETITION_LEVELS.map((level: string) => <option key={level} value={level}>{level}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={accPlacement} onChange={(e) => setAccPlacement(e.target.value)} className="w-full bg-slate-900 border border-slate-700 pl-3 pr-8 py-2.5 rounded-xl text-xs font-bold text-white outline-none appearance-none cursor-pointer">
                  <option value="">Select Placement...</option>
                  {INDIVIDUAL_PLACEMENTS.map((p: string) => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {accCategory === 'Honor' && (
            <div className="space-y-2.5 mb-3">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_HONOR_PRESETS.map((preset: string) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAccHonorText(preset)}
                    className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 text-left ${
                      accHonorText === preset
                        ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                    <span>{preset}</span>
                  </button>
                ))}
              </div>
              <input 
                type="text" 
                value={accHonorText} 
                onChange={(e) => setAccHonorText(e.target.value)} 
                placeholder="Or type custom honor (e.g. All-Conference 1st Team)" 
                className="w-full bg-slate-900 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500" 
              />
            </div>
          )}

          {accCategory && (
            <button 
              type="button"
              onClick={handleAddAccolade} 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Save Record
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-3 sm:gap-4 relative">
      
      {/* 🚨 TOP UTILITY BAR (Unclipped Label + Disable/Delete) 🚨 */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${eq.icon}`} />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {isCustomEditorSport ? 'Event Manager' : 'Recruiting Matrix'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!confirmingDelete ? (
            <>
              <button 
                type="button"
                onClick={handleDisableSport}
                className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-400 bg-slate-900/60 hover:bg-slate-900 px-2.5 py-1 rounded-lg transition-colors border border-slate-800/80"
              >
                Disable
              </button>
              <button 
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-400 bg-slate-900/60 hover:bg-slate-900 px-2.5 py-1 rounded-lg transition-colors border border-slate-800/80 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-500/40 px-2.5 py-1 rounded-xl animate-in fade-in duration-200">
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              <span className="text-[9px] font-black uppercase tracking-wider text-red-200">
                Delete?
              </span>
              <button
                type="button"
                onClick={handleDeleteSport}
                className="text-[9px] font-black uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded-md transition-colors"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-[9px] font-black uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md transition-colors"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {CustomEditorComponent ? (
        <div className="space-y-3">
          {/* 2-Button Fixed Switcher for Stopwatch / Mat Sports */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950/90 p-1 rounded-2xl border border-slate-800/90">
            <button
              type="button"
              onClick={() => setCustomSportTab('marks')}
              className={`py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                customSportTab === 'marks'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gauge className="w-3.5 h-3.5 shrink-0" />
              <span>Events & PRs</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomSportTab('honors')}
              className={`py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                customSportTab === 'honors'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Honors{localAccolades.length > 0 ? ` (${localAccolades.length})` : ''}</span>
            </button>
          </div>

          {customSportTab === 'marks' ? (
            CustomEditorComponent
          ) : (
            <div className={`bg-slate-900/80 backdrop-blur-xl border ${eq.border} rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-6`}>
              {renderHonorsSection()}
            </div>
          )}
        </div>
      ) : (
        <div className={`bg-slate-900/80 backdrop-blur-xl border ${eq.border} rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-6 relative animate-in fade-in duration-300 space-y-4 sm:space-y-5`}>
          <div className={`absolute top-0 left-0 w-full h-1 rounded-t-3xl bg-gradient-to-r ${eq.glowLine}`}></div>
          
          {/* 🚨 PILLAR 1: FULL-WIDTH MOBILE DROPDOWNS (Zero Text Cutoff) 🚨 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {config?.positions && config.positions.length > 0 && (
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                  Position / Role
                </label>
                <div className="relative">
                  <select 
                    value={activePosition} 
                    onChange={(e) => updateSportMeta('position', e.target.value)}
                    className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-8 py-2.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing} appearance-none transition-all cursor-pointer`}
                  >
                    {config.positions.map((p: string) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
            
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
                Competition Level
              </label>
              <div className="relative">
                <select 
                  value={sportStats?.level || ''} 
                  onChange={(e) => updateSportMeta('level', e.target.value)}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-8 py-2.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing} appearance-none transition-all cursor-pointer`}
                >
                  <option value="">Select Level...</option>
                  <option value="JV / Dev Squad">JV / Dev Squad</option>
                  <option value="Varsity Contributor">Varsity Contributor</option>
                  <option value="Varsity Starter">Varsity Starter</option>
                  <option value="All-Conference Tier">All-Conference Tier</option>
                  <option value="All-State / National">All-State / National</option>
                  <option value="Elite Club (ECNL / AAU / Next)">Elite Club / National Travel</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                <School className="w-3 h-3 text-indigo-400 shrink-0" /> School Classification Size
              </label>
              <div className="relative">
                <select 
                  value={sportStats?.metaContext?.schoolSize || ''} 
                  onChange={(e) => updateMetaContext('schoolSize', e.target.value)}
                  className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-8 py-2.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing} appearance-none transition-all cursor-pointer`}
                >
                  <option value="">Select Size...</option>
                  <option value="Small (< 500)">Small (&lt; 500 students)</option>
                  <option value="Medium (500 - 999)">Medium (500 - 999 students)</option>
                  <option value="Large (1,000 - 1,999)">Large (1,000 - 1,999 students)</option>
                  <option value="Mega (2,000+)">Mega (2,000+ students)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 🚨 FIXED 3-BUTTON PILLAR SWITCHER (Zero Horizontal Swiping) 🚨 */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950/90 p-1 rounded-2xl border border-slate-800/90">
            <button
              type="button"
              onClick={() => setActiveSection('impact')}
              className={`py-2.5 px-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                activeSection === 'impact'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 shrink-0 ${activeImpactBucket ? 'text-amber-300' : ''}`} />
              <span>Impact</span>
              {activeImpactBucket && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('measurables')}
              className={`py-2.5 px-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                activeSection === 'measurables'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gauge className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span>Stats{totalLoggedMeasurables > 0 ? ` (${totalLoggedMeasurables})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('honors')}
              className={`py-2.5 px-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                activeSection === 'honors'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Honors{localAccolades.length > 0 ? ` (${localAccolades.length})` : ''}</span>
            </button>
          </div>

          {/* 🚨 TAB 1: ON-FIELD IMPACT BUCKETS 🚨 */}
          {activeSection === 'impact' && (
            <div className="pt-1 animate-in fade-in duration-200">
              <div className="mb-3">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5 leading-snug">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{blueprint.impactTitle}</span>
                </h4>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5 leading-snug">
                  {blueprint.impactSubtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {blueprint.impactBuckets.map((bucket: ImpactBucketOption) => {
                  const isSelected = selectedImpactTierId === bucket.id;
                  const bStyle = getLocalTierStyles(bucket.score);

                  return (
                    <button
                      key={bucket.id}
                      type="button"
                      onClick={() => handleSelectImpactBucket(bucket)}
                      className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all relative group cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-950/50 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 w-full mb-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${bStyle.bgClass} ${bStyle.borderClass} ${bStyle.colorClass}`}>
                          {bucket.badge}
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="w-full">
                        <div className={`text-xs sm:text-sm font-black leading-snug mb-1 ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                          {bucket.label}
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 leading-snug">
                          {bucket.subLabel}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🚨 TAB 2: VERIFIED COMBINE & KEY STATS (Full Labels, Zero Cutoff) 🚨 */}
          {activeSection === 'measurables' && (
            <div className="pt-1 animate-in fade-in duration-200 space-y-4">
              {blueprint.combinePrompts.length > 0 && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5 leading-snug">
                        <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Verified Combine & Key Stats</span>
                      </h4>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5 leading-snug">
                        Auto-saves when you tap outside the box or press Enter.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCustomMetricBar(!showCustomMetricBar)}
                      className="w-full sm:w-auto text-[10px] font-black uppercase tracking-wider text-indigo-300 hover:text-white bg-indigo-500/15 border border-indigo-500/30 px-3 py-2 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> {showCustomMetricBar ? 'Hide Custom Stat' : 'Add Custom Stat'}
                    </button>
                  </div>

                  {/* Clean Horizontal Rows on Mobile (No Cut-Off Labels), 3-Col Grid on Desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {blueprint.combinePrompts.map((prompt: CombineMetricPrompt) => {
                      const draftVal = combineDrafts[prompt.metricName] ?? '';
                      const liveEval = draftVal
                        ? evaluateMetric(genderKey, actualSport, prompt.metricName, draftVal, sportStats?.level || 'Varsity Starter')
                        : null;
                      const mStyle = liveEval ? getLocalTierStyles(liveEval.score) : null;

                      return (
                        <div
                          key={prompt.metricName}
                          className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 sm:p-3.5 flex items-center sm:flex-col justify-between gap-3 sm:items-stretch focus-within:border-cyan-500/50 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 min-w-0 flex-1">
                            <label className="text-xs sm:text-[11px] font-black uppercase tracking-wider text-white sm:text-slate-200 leading-snug break-words">
                              {prompt.shortLabel}
                            </label>
                            {liveEval && mStyle ? (
                              <span className={`self-start sm:self-auto text-[9px] font-black px-2 py-0.5 rounded-md border shrink-0 ${mStyle.bgClass} ${mStyle.borderClass} ${mStyle.colorClass}`}>
                                {liveEval.score} • {mStyle.tier}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                                {prompt.unitHint}
                              </span>
                            )}
                          </div>

                          <input
                            type="text"
                            placeholder={prompt.placeholder}
                            value={draftVal}
                            onChange={(e) =>
                              setCombineDrafts((prev: Record<string, string>) => ({
                                ...prev,
                                [prompt.metricName]: e.target.value
                              }))
                            }
                            onBlur={(e) => commitCombineMeasurable(prompt.metricName, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            className="w-28 sm:w-full shrink-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm font-black text-white text-center sm:text-left placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 🚨 OPTIONAL CUSTOM STAT / EXTRA METRICS SECTION 🚨 */}
              {(extraMetricsWithIndex.length > 0 || showCustomMetricBar) && (
                <div className="border-t border-slate-800/60 pt-3.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-indigo-400" /> Additional Logged Stats & Marks
                  </p>

                  {extraMetricsWithIndex.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mb-3">
                      {extraMetricsWithIndex.map(({ metric: m, originalIndex: idx }: IndexedSportMetric) => {
                        const evalLevel = sportStats?.level || 'Varsity Starter';
                        const evaluation = evaluateMetric(genderKey, actualSport, m.name, m.value, evalLevel);
                        const metricScore = evaluation?.score || m.score || 0;
                        const mStyle = getLocalTierStyles(metricScore);
                        
                        if (editingGenericIdx === idx) {
                          return (
                            <div key={idx} className="col-span-full bg-slate-900 border border-indigo-500/40 p-2.5 rounded-xl flex flex-col sm:flex-row items-center gap-2">
                              <input 
                                type="text" 
                                value={editGenericName} 
                                onChange={(e) => setEditGenericName(e.target.value)} 
                                className="w-full sm:w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-300"
                                placeholder="Event / Stat Name"
                              />
                              <input 
                                type="text" 
                                value={editGenericValue} 
                                onChange={(e) => setEditGenericValue(e.target.value)} 
                                className="w-full sm:w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-bold text-white"
                                placeholder="Value"
                              />
                              <div className="flex gap-1.5 w-full sm:w-auto">
                                <button type="button" onClick={saveEditedGenericMetric} className="flex-1 sm:flex-none bg-emerald-500/20 text-emerald-400 rounded-lg px-3 py-2 font-bold text-xs"><Check className="w-3.5 h-3.5 mx-auto" /></button>
                                <button type="button" onClick={() => removeSportMetric(idx)} className="flex-1 sm:flex-none bg-red-500/20 text-red-400 rounded-lg px-3 py-2 font-bold text-xs"><Trash2 className="w-3.5 h-3.5 mx-auto" /></button>
                                <button type="button" onClick={() => setEditingGenericIdx(null)} className="flex-1 sm:flex-none bg-slate-800 text-slate-400 rounded-lg px-3 py-2 font-bold text-xs"><X className="w-3.5 h-3.5 mx-auto" /></button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={idx} 
                            onClick={() => {
                              setEditingGenericIdx(idx);
                              setEditGenericName(m.name);
                              setEditGenericValue(m.value);
                            }}
                            className="bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 p-3 rounded-xl flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="min-w-0">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block break-words">{m.name}</span>
                              {metricScore > 0 && <span className={`text-[9px] font-black ${mStyle.colorClass}`}>Score: {metricScore}</span>}
                            </div>
                            <span className="text-sm sm:text-base font-black text-white shrink-0">{m.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {showCustomMetricBar && (
                    <div className={`bg-slate-950/80 p-3 rounded-2xl border ${eq.border} shadow-inner flex flex-col sm:flex-row gap-2 animate-in fade-in duration-200`}>
                      <div className="relative flex-1">
                        <input 
                          type="text" list={`metrics-${actualSport}`} placeholder="Stat Name (e.g. Batting Avg)"
                          value={newMetricName} onChange={(e) => setNewMetricName(e.target.value)}
                          className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing}`}
                        />
                        <datalist id={`metrics-${actualSport}`}>
                          {config?.defaultMetrics?.map((m: string) => <option key={m} value={m}>{m}</option>)}
                        </datalist>
                      </div>
                      <div className="flex gap-2 sm:w-1/3 shrink-0">
                        <input 
                          type="text" placeholder="Value"
                          value={newMetricValue} onChange={(e) => setNewMetricValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addSportMetric()}
                          className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 ${eq.focusRing}`}
                        />
                        <button type="button" onClick={addSportMetric} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl font-bold flex items-center justify-center transition-colors shrink-0">
                          <Plus className="w-4 h-4"/>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 🚨 TAB 3: PLACEMENTS & HONORS 🚨 */}
          {activeSection === 'honors' && renderHonorsSection()}
        </div>
      )}

    </div>
  );
}