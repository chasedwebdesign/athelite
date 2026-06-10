// =========================================================================
// 🥎 SOFTBALL POSITIONAL RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type SoftballPositionGroup = 'Pitcher' | 'Catcher' | 'First Base' | 'Infield' | 'Outfield';

export interface SoftballThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
  inverse?: boolean; // Used for stats where lower is better (ERA)
}

export const SOFTBALL_METRIC_STANDARDS: Record<'Girls' | 'Boys', Record<string, SoftballThresholds>> = {
  'Girls': {
    'BattingAverage': { t1: 0.480, t2: 0.440, t3: 0.400, t4: 0.360, t5: 0.320, t6: 0.280, t7: 0.250 },
    'OPS': { t1: 1.350, t2: 1.200, t3: 1.050, t4: 0.900, t5: 0.800, t6: 0.700, t7: 0.600 },
    'HomeRunsPerGame': { t1: 0.40, t2: 0.30, t3: 0.20, t4: 0.10, t5: 0.05, t6: 0.02, t7: 0.01 },
    'RBIPerGame': { t1: 1.3, t2: 1.1, t3: 0.9, t4: 0.7, t5: 0.5, t6: 0.3, t7: 0.1 },
    'StolenBasesPerGame': { t1: 1.2, t2: 0.9, t3: 0.7, t4: 0.5, t5: 0.3, t6: 0.2, t7: 0.1 },
    'Velocity': { t1: 65, t2: 62, t3: 59, t4: 56, t5: 54, t6: 51, t7: 48 },
    'ERA': { t1: 1.20, t2: 1.80, t3: 2.40, t4: 3.00, t5: 3.80, t6: 4.50, t7: 5.50, inverse: true }
  },
  'Boys': {
    // Fallback identical to Girls in case a male athlete registers for Softball
    'BattingAverage': { t1: 0.480, t2: 0.440, t3: 0.400, t4: 0.360, t5: 0.320, t6: 0.280, t7: 0.250 },
    'OPS': { t1: 1.350, t2: 1.200, t3: 1.050, t4: 0.900, t5: 0.800, t6: 0.700, t7: 0.600 },
    'HomeRunsPerGame': { t1: 0.40, t2: 0.30, t3: 0.20, t4: 0.10, t5: 0.05, t6: 0.02, t7: 0.01 },
    'RBIPerGame': { t1: 1.3, t2: 1.1, t3: 0.9, t4: 0.7, t5: 0.5, t6: 0.3, t7: 0.1 },
    'StolenBasesPerGame': { t1: 1.2, t2: 0.9, t3: 0.7, t4: 0.5, t5: 0.3, t6: 0.2, t7: 0.1 },
    'Velocity': { t1: 65, t2: 62, t3: 59, t4: 56, t5: 54, t6: 51, t7: 48 },
    'ERA': { t1: 1.20, t2: 1.80, t3: 2.40, t4: 3.00, t5: 3.80, t6: 4.50, t7: 5.50, inverse: true }
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.70,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference Tier': 1.15,
  'All-State / National': 1.30,
  'Elite Club (Alliance / PGF)': 1.45
};

export const calculateSoftballMetricScore = (val: number, thresholds: SoftballThresholds): number => {
  if (isNaN(val) || val < 0) return 10;

  if (thresholds.inverse) {
    if (val <= thresholds.t1) return Math.min(99, Math.round(95 + ((thresholds.t1 - val) / (thresholds.t1 * 0.1)) * 4));
    if (val <= thresholds.t2) return Math.round(85 + ((thresholds.t2 - val) / (thresholds.t2 - thresholds.t1)) * 10);
    if (val <= thresholds.t3) return Math.round(75 + ((thresholds.t3 - val) / (thresholds.t3 - thresholds.t2)) * 10);
    if (val <= thresholds.t4) return Math.round(65 + ((thresholds.t4 - val) / (thresholds.t4 - thresholds.t3)) * 10);
    if (val <= thresholds.t5) return Math.round(55 + ((thresholds.t5 - val) / (thresholds.t5 - thresholds.t4)) * 10);
    if (val <= thresholds.t6) return Math.round(40 + ((thresholds.t6 - val) / (thresholds.t6 - thresholds.t5)) * 14);
    if (val <= thresholds.t7) return Math.round(20 + ((thresholds.t7 - val) / (thresholds.t7 - thresholds.t6)) * 19);
    return 10;
  } else {
    if (val >= thresholds.t1) return Math.min(99, Math.round(95 + ((val - thresholds.t1) / (thresholds.t1 * 0.1)) * 4));
    if (val >= thresholds.t2) return Math.round(85 + ((val - thresholds.t2) / (thresholds.t1 - thresholds.t2)) * 10);
    if (val >= thresholds.t3) return Math.round(75 + ((val - thresholds.t3) / (thresholds.t2 - thresholds.t3)) * 10);
    if (val >= thresholds.t4) return Math.round(65 + ((val - thresholds.t4) / (thresholds.t3 - thresholds.t4)) * 10);
    if (val >= thresholds.t5) return Math.round(55 + ((val - thresholds.t5) / (thresholds.t4 - thresholds.t5)) * 10);
    if (val >= thresholds.t6) return Math.round(40 + ((val - thresholds.t6) / (thresholds.t5 - thresholds.t6)) * 14);
    if (val >= thresholds.t7) return Math.round(20 + ((val - thresholds.t7) / (thresholds.t6 - thresholds.t7)) * 19);
    return Math.max(10, Math.round((val / thresholds.t7) * 20));
  }
};

export const compileSoftballFitScore = (
  gender: string,
  positionGroup: SoftballPositionGroup,
  levelOfPlay: string,
  gamesPlayed: number,
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const targetedGender = (gender === 'Boys' || gender === 'Men') ? 'Boys' : 'Girls';
  const genderStandards = SOFTBALL_METRIC_STANDARDS[targetedGender];
  
  const normalizedGames = Math.max(1, gamesPlayed);
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];
  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number, isPerGame = false, isInverse = false) => {
    if (rawVal === null || rawVal === undefined || isNaN(rawVal)) return;

    const rate = isPerGame ? (rawVal / normalizedGames) : rawVal;
    const standards = genderStandards[thresholdKey];
    
    let modifiedValue = rate;
    if (isInverse) {
      modifiedValue = rate * (1 + (1 - modifier));
    } else {
      modifiedValue = rate * modifier;
    }

    const score = calculateSoftballMetricScore(modifiedValue, standards);

    accumulatedWeightedScore += (score * weight);
    totalWeightsAssigned += weight;

    trace.push({
      metricLabel: key,
      perGameRate: rate,
      calibratedScore: score,
      weightAllocation: `${weight * 100}%`
    });
  };

  if (positionGroup === 'Pitcher') {
    registerResult('Fastball Velo (MPH)', rawMetrics.velocity, 'Velocity', 0.60, false, false);
    registerResult('ERA', rawMetrics.era, 'ERA', 0.40, false, true);
  } else {
    registerResult('Batting Average', rawMetrics.ba, 'BattingAverage', 0.30, false);
    registerResult('OPS', rawMetrics.ops, 'OPS', 0.35, false);
    registerResult('Home Runs', rawMetrics.hr, 'HomeRunsPerGame', 0.15, true);
    registerResult('RBI', rawMetrics.rbi, 'RBIPerGame', 0.10, true);
    
    const speedWeight = (positionGroup === 'Infield' || positionGroup === 'Outfield') ? 0.10 : 0.05;
    registerResult('Stolen Bases', rawMetrics.sb, 'StolenBasesPerGame', speedWeight, true);
  }

  let finalComposite = totalWeightsAssigned > 0 ? Math.round(accumulatedWeightedScore / totalWeightsAssigned) : 0;
  
  if (levelOfPlay === 'JV / Dev Squad') finalComposite = Math.min(55, finalComposite);
  else if (levelOfPlay === 'Varsity Contributor') finalComposite = Math.min(75, finalComposite);

  return {
    compositeScore: Math.min(99, Math.max(10, finalComposite)),
    analyticalTrace: trace
  };
};