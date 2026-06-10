// =========================================================================
// 🤸‍♀️ GYMNASTICS POSITIONAL RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type GymnasticsPositionGroup = 'All-Around' | 'Vault Specialist' | 'Bars Specialist' | 'Beam Specialist' | 'Floor Specialist';

export interface GymnasticsThresholds {
  t1: number; // Power 4 D1 (Score: 95-99) - Elite / Level 10 National
  t2: number; // Mid-Major D1 (Score: 85-94) - Strong Level 10
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84) - Level 10 / High Level 9
  t4: number; // Solid D2 / High D3 (Score: 65-74) - Level 9
  t5: number; // D3 / NAIA Prospect (Score: 55-64) - Level 8/9
  t6: number; // Strong Varsity (Score: 40-54) - Level 8
  t7: number; // Varsity Standard (Score: 20-39) - Level 7
}

export const GYMNASTICS_METRIC_STANDARDS: Record<'Boys' | 'Girls', Record<string, GymnasticsThresholds>> = {
  'Girls': {
    'AllAround': { t1: 38.5, t2: 37.5, t3: 36.5, t4: 35.0, t5: 34.0, t6: 32.0, t7: 28.0 },
    'Vault': { t1: 9.75, t2: 9.50, t3: 9.25, t4: 9.00, t5: 8.75, t6: 8.20, t7: 7.50 },
    'Bars': { t1: 9.70, t2: 9.45, t3: 9.20, t4: 8.90, t5: 8.60, t6: 8.00, t7: 7.20 },
    'Beam': { t1: 9.75, t2: 9.50, t3: 9.25, t4: 8.95, t5: 8.70, t6: 8.10, t7: 7.30 },
    'Floor': { t1: 9.80, t2: 9.55, t3: 9.30, t4: 9.05, t5: 8.80, t6: 8.30, t7: 7.50 }
  },
  'Boys': {
    // Boys use 6 events typically, but to align with the core database schema (Vault, Bars, Beam, Floor)
    // we fallback to identical thresholds. (Most college programs are Women's Gymnastics).
    'AllAround': { t1: 38.5, t2: 37.5, t3: 36.5, t4: 35.0, t5: 34.0, t6: 32.0, t7: 28.0 },
    'Vault': { t1: 9.75, t2: 9.50, t3: 9.25, t4: 9.00, t5: 8.75, t6: 8.20, t7: 7.50 },
    'Bars': { t1: 9.70, t2: 9.45, t3: 9.20, t4: 8.90, t5: 8.60, t6: 8.00, t7: 7.20 },
    'Beam': { t1: 9.75, t2: 9.50, t3: 9.25, t4: 8.95, t5: 8.70, t6: 8.10, t7: 7.30 },
    'Floor': { t1: 9.80, t2: 9.55, t3: 9.30, t4: 9.05, t5: 8.80, t6: 8.30, t7: 7.50 }
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.70, // Level 7
  'Varsity Contributor': 0.85, // Level 8
  'Varsity Starter': 1.0, // Level 9
  'All-Conference Tier': 1.05, // High Level 9
  'All-State / National': 1.15, // Level 10
  'Elite Club (Level 10 / Elite)': 1.30 // Elite
};

export const calculateGymnasticsMetricScore = (val: number, thresholds: GymnasticsThresholds): number => {
  if (isNaN(val) || val < 0) return 10;
  if (val >= thresholds.t1) return Math.min(99, Math.round(95 + ((val - thresholds.t1) / (thresholds.t1 * 0.05)) * 4));
  if (val >= thresholds.t2) return Math.round(85 + ((val - thresholds.t2) / (thresholds.t1 - thresholds.t2)) * 10);
  if (val >= thresholds.t3) return Math.round(75 + ((val - thresholds.t3) / (thresholds.t2 - thresholds.t3)) * 10);
  if (val >= thresholds.t4) return Math.round(65 + ((val - thresholds.t4) / (thresholds.t3 - thresholds.t4)) * 10);
  if (val >= thresholds.t5) return Math.round(55 + ((val - thresholds.t5) / (thresholds.t4 - thresholds.t5)) * 10);
  if (val >= thresholds.t6) return Math.round(40 + ((val - thresholds.t6) / (thresholds.t5 - thresholds.t6)) * 14);
  if (val >= thresholds.t7) return Math.round(20 + ((val - thresholds.t7) / (thresholds.t6 - thresholds.t7)) * 19);
  
  return Math.max(10, Math.round((val / thresholds.t7) * 20));
};

export const compileGymnasticsFitScore = (
  gender: string,
  positionGroup: GymnasticsPositionGroup,
  levelOfPlay: string,
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const targetedGender = (gender === 'Boys' || gender === 'Men') ? 'Boys' : 'Girls';
  const genderStandards = GYMNASTICS_METRIC_STANDARDS[targetedGender];
  
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];
  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number) => {
    if (rawVal === null || rawVal === undefined || isNaN(rawVal) || rawVal === 0) return;

    const standards = genderStandards[thresholdKey];
    
    // Applying level modifiers to gymnastics scores makes a Level 8 9.5 drop to an 8.0, 
    // which aligns beautifully with college recruiting standardizations.
    const modifiedValue = rawVal * modifier;
    const score = calculateGymnasticsMetricScore(modifiedValue, standards);

    accumulatedWeightedScore += (score * weight);
    totalWeightsAssigned += weight;

    trace.push({
      metricLabel: key,
      rawValue: rawVal,
      calibratedScore: score,
      weightAllocation: `${weight * 100}%`
    });
  };

  if (positionGroup === 'All-Around') {
    registerResult('All-Around', rawMetrics.aa, 'AllAround', 0.60);
    registerResult('Vault', rawMetrics.vault, 'Vault', 0.10);
    registerResult('Bars', rawMetrics.bars, 'Bars', 0.10);
    registerResult('Beam', rawMetrics.beam, 'Beam', 0.10);
    registerResult('Floor', rawMetrics.floor, 'Floor', 0.10);
  } else if (positionGroup === 'Vault Specialist') {
    registerResult('Vault', rawMetrics.vault, 'Vault', 0.85);
    registerResult('Floor', rawMetrics.floor, 'Floor', 0.15); // Power events crossover
  } else if (positionGroup === 'Bars Specialist') {
    registerResult('Bars', rawMetrics.bars, 'Bars', 0.90);
    registerResult('All-Around', rawMetrics.aa, 'AllAround', 0.10);
  } else if (positionGroup === 'Beam Specialist') {
    registerResult('Beam', rawMetrics.beam, 'Beam', 0.90);
    registerResult('All-Around', rawMetrics.aa, 'AllAround', 0.10);
  } else if (positionGroup === 'Floor Specialist') {
    registerResult('Floor', rawMetrics.floor, 'Floor', 0.85);
    registerResult('Vault', rawMetrics.vault, 'Vault', 0.15);
  }

  let finalComposite = totalWeightsAssigned > 0 ? Math.round(accumulatedWeightedScore / totalWeightsAssigned) : 0;
  
  if (levelOfPlay === 'JV / Dev Squad' || levelOfPlay === 'Varsity Contributor') {
    finalComposite = Math.min(55, finalComposite); // Cap non-Level 10/Elite prospects
  }

  return {
    compositeScore: Math.min(99, Math.max(10, finalComposite)),
    analyticalTrace: trace
  };
};