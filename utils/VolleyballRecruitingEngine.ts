// =========================================================================
// 🏐 VOLLEYBALL POSITIONAL RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type VolleyballPositionGroup = 'Setter (S)' | 'Outside Hitter (OH)' | 'Opposite Hitter (OPP)' | 'Middle Blocker (MB)' | 'Libero / Defensive Specialist (L/DS)';

export interface VolleyballThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
}

export const VOLLEYBALL_METRIC_STANDARDS: Record<'Boys' | 'Girls', Record<string, VolleyballThresholds>> = {
  'Boys': {
    'KillsPerSet': { t1: 5.0, t2: 4.2, t3: 3.5, t4: 2.8, t5: 2.2, t6: 1.8, t7: 1.2 },
    'DigsPerSet': { t1: 6.0, t2: 5.0, t3: 4.2, t4: 3.5, t5: 2.8, t6: 2.2, t7: 1.5 },
    'AssistsPerSet': { t1: 10.5, t2: 9.0, t3: 7.5, t4: 6.0, t5: 4.5, t6: 3.0, t7: 1.5 },
    'BlocksPerSet': { t1: 1.2, t2: 1.0, t3: 0.8, t4: 0.6, t5: 0.4, t6: 0.2, t7: 0.1 },
    'AcesPerSet': { t1: 0.8, t2: 0.6, t3: 0.5, t4: 0.4, t5: 0.3, t6: 0.2, t7: 0.1 },
    'HittingPct': { t1: 45, t2: 40, t3: 35, t4: 30, t5: 25, t6: 20, t7: 15 } // Evaluated as whole numbers (e.g. 45 = .450)
  },
  'Girls': {
    'KillsPerSet': { t1: 4.5, t2: 3.8, t3: 3.2, t4: 2.5, t5: 2.0, t6: 1.5, t7: 1.0 },
    'DigsPerSet': { t1: 5.5, t2: 4.5, t3: 3.8, t4: 3.0, t5: 2.5, t6: 2.0, t7: 1.5 },
    'AssistsPerSet': { t1: 9.5, t2: 8.0, t3: 6.5, t4: 5.0, t5: 3.5, t6: 2.0, t7: 1.0 },
    'BlocksPerSet': { t1: 1.0, t2: 0.8, t3: 0.6, t4: 0.5, t5: 0.4, t6: 0.2, t7: 0.1 },
    'AcesPerSet': { t1: 0.8, t2: 0.6, t3: 0.5, t4: 0.4, t5: 0.3, t6: 0.2, t7: 0.1 },
    'HittingPct': { t1: 40, t2: 35, t3: 30, t4: 25, t5: 20, t6: 15, t7: 10 }
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.60,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference Tier': 1.15,
  'All-State / National': 1.30,
  'Elite Club (ECNL / AAU / Next)': 1.45 // High tier modifier for open/national AAU
};

export const calculateSingleVolleyballMetricScore = (val: number, thresholds: VolleyballThresholds): number => {
  if (isNaN(val) || val < 0) return 10;
  if (val >= thresholds.t1) return Math.min(99, Math.round(95 + ((val - thresholds.t1) / thresholds.t1) * 20));
  if (val >= thresholds.t2) return Math.round(85 + ((val - thresholds.t2) / (thresholds.t1 - thresholds.t2)) * 10);
  if (val >= thresholds.t3) return Math.round(75 + ((val - thresholds.t3) / (thresholds.t2 - thresholds.t3)) * 10);
  if (val >= thresholds.t4) return Math.round(65 + ((val - thresholds.t4) / (thresholds.t3 - thresholds.t4)) * 10);
  if (val >= thresholds.t5) return Math.round(55 + ((val - thresholds.t5) / (thresholds.t4 - thresholds.t5)) * 10);
  if (val >= thresholds.t6) return Math.round(40 + ((val - thresholds.t6) / (thresholds.t5 - thresholds.t6)) * 14);
  if (val >= thresholds.t7) return Math.round(20 + ((val - thresholds.t7) / (thresholds.t6 - thresholds.t7)) * 19);
  return Math.max(10, Math.round((val / thresholds.t7) * 20));
};

export const compileVolleyballFitScore = (
  gender: string,
  positionGroup: VolleyballPositionGroup,
  levelOfPlay: string,
  setsPlayed: number,
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const targetedGender = (gender === 'Boys' || gender === 'Men') ? 'Boys' : 'Girls';
  const genderStandards = VOLLEYBALL_METRIC_STANDARDS[targetedGender];
  
  const normalizedSets = Math.max(1, setsPlayed);
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];
  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerMetricResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number, isRateBased = true) => {
    if (rawVal === null || rawVal === undefined || isNaN(rawVal)) return;

    const targetValue = isRateBased ? (rawVal / normalizedSets) : rawVal;
    const standards = genderStandards[thresholdKey];
    if (!standards) return;

    const modifiedValue = targetValue * modifier;
    const score = calculateSingleVolleyballMetricScore(modifiedValue, standards);

    accumulatedWeightedScore += (score * weight);
    totalWeightsAssigned += weight;

    trace.push({
      metricLabel: key,
      rawTotal: rawVal,
      perSetRate: targetValue,
      calibratedScore: score,
      weightAllocation: `${weight * 100}%`
    });
  };

  if (positionGroup === 'Setter (S)') {
    registerMetricResult('Assists', rawMetrics.assists, 'AssistsPerSet', 0.60);
    registerMetricResult('Digs', rawMetrics.digs, 'DigsPerSet', 0.20);
    registerMetricResult('Aces', rawMetrics.aces, 'AcesPerSet', 0.10);
    registerMetricResult('Blocks', rawMetrics.blocks, 'BlocksPerSet', 0.10);
  } 
  else if (positionGroup === 'Outside Hitter (OH)' || positionGroup === 'Opposite Hitter (OPP)') {
    registerMetricResult('Kills', rawMetrics.kills, 'KillsPerSet', 0.40);
    registerMetricResult('Hitting %', rawMetrics.hittingPct, 'HittingPct', 0.30, false);
    registerMetricResult('Digs', rawMetrics.digs, 'DigsPerSet', 0.20);
    registerMetricResult('Blocks', rawMetrics.blocks, 'BlocksPerSet', 0.10);
  } 
  else if (positionGroup === 'Middle Blocker (MB)') {
    registerMetricResult('Blocks', rawMetrics.blocks, 'BlocksPerSet', 0.45);
    registerMetricResult('Hitting %', rawMetrics.hittingPct, 'HittingPct', 0.35, false);
    registerMetricResult('Kills', rawMetrics.kills, 'KillsPerSet', 0.20);
  } 
  else if (positionGroup === 'Libero / Defensive Specialist (L/DS)') {
    registerMetricResult('Digs', rawMetrics.digs, 'DigsPerSet', 0.70);
    registerMetricResult('Assists', rawMetrics.assists, 'AssistsPerSet', 0.15);
    registerMetricResult('Aces', rawMetrics.aces, 'AcesPerSet', 0.15);
  }

  let finalComposite = totalWeightsAssigned > 0 ? Math.round(accumulatedWeightedScore / totalWeightsAssigned) : 0;
  if (levelOfPlay === 'JV / Dev Squad') finalComposite = Math.min(45, finalComposite);
  else if (levelOfPlay === 'Varsity Contributor') finalComposite = Math.min(65, finalComposite);

  return {
    compositeScore: Math.min(99, Math.max(10, finalComposite)),
    analyticalTrace: trace
  };
};