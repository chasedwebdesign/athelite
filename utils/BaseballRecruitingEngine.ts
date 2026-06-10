// =========================================================================
// ⚾ BASEBALL POSITIONAL RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type BaseballPositionGroup = 'Pitcher (RHP/LHP)' | 'Catcher (C)' | 'First Base (1B)' | 'Infield (2B/3B/SS)' | 'Outfield (LF/CF/RF)';

export interface BaseballThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
  inverse?: boolean; // Used for stats where lower is better (ERA)
}

export const BASEBALL_METRIC_STANDARDS: Record<'Boys' | 'Girls', Record<string, BaseballThresholds>> = {
  'Boys': {
    'BattingAverage': { t1: 0.450, t2: 0.410, t3: 0.380, t4: 0.350, t5: 0.320, t6: 0.280, t7: 0.250 },
    'OPS': { t1: 1.300, t2: 1.150, t3: 1.000, t4: 0.900, t5: 0.800, t6: 0.700, t7: 0.600 },
    'HomeRunsPerGame': { t1: 0.35, t2: 0.25, t3: 0.15, t4: 0.10, t5: 0.08, t6: 0.05, t7: 0.02 },
    'RBIPerGame': { t1: 1.2, t2: 1.0, t3: 0.8, t4: 0.6, t5: 0.5, t6: 0.3, t7: 0.2 },
    'StolenBasesPerGame': { t1: 1.0, t2: 0.8, t3: 0.6, t4: 0.4, t5: 0.3, t6: 0.2, t7: 0.1 },
    'Velocity': { t1: 93, t2: 89, t3: 86, t4: 83, t5: 80, t6: 77, t7: 74 },
    'ERA': { t1: 1.50, t2: 2.10, t3: 2.75, t4: 3.50, t5: 4.25, t6: 5.00, t7: 6.00, inverse: true }
  },
  'Girls': {
    // Fallback identical to Boys in case a female athlete registers for Baseball instead of Softball
    'BattingAverage': { t1: 0.450, t2: 0.410, t3: 0.380, t4: 0.350, t5: 0.320, t6: 0.280, t7: 0.250 },
    'OPS': { t1: 1.300, t2: 1.150, t3: 1.000, t4: 0.900, t5: 0.800, t6: 0.700, t7: 0.600 },
    'HomeRunsPerGame': { t1: 0.35, t2: 0.25, t3: 0.15, t4: 0.10, t5: 0.08, t6: 0.05, t7: 0.02 },
    'RBIPerGame': { t1: 1.2, t2: 1.0, t3: 0.8, t4: 0.6, t5: 0.5, t6: 0.3, t7: 0.2 },
    'StolenBasesPerGame': { t1: 1.0, t2: 0.8, t3: 0.6, t4: 0.4, t5: 0.3, t6: 0.2, t7: 0.1 },
    'Velocity': { t1: 93, t2: 89, t3: 86, t4: 83, t5: 80, t6: 77, t7: 74 },
    'ERA': { t1: 1.50, t2: 2.10, t3: 2.75, t4: 3.50, t5: 4.25, t6: 5.00, t7: 6.00, inverse: true }
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.70,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference Tier': 1.15,
  'All-State / National': 1.30,
  'Elite Club (Perfect Game / PBR)': 1.45
};

export const calculateBaseballMetricScore = (val: number, thresholds: BaseballThresholds): number => {
  if (isNaN(val) || val < 0) return 10;

  if (thresholds.inverse) {
    // For ERA, lower is better
    if (val <= thresholds.t1) return Math.min(99, Math.round(95 + ((thresholds.t1 - val) / (thresholds.t1 * 0.1)) * 4));
    if (val <= thresholds.t2) return Math.round(85 + ((thresholds.t2 - val) / (thresholds.t2 - thresholds.t1)) * 10);
    if (val <= thresholds.t3) return Math.round(75 + ((thresholds.t3 - val) / (thresholds.t3 - thresholds.t2)) * 10);
    if (val <= thresholds.t4) return Math.round(65 + ((thresholds.t4 - val) / (thresholds.t4 - thresholds.t3)) * 10);
    if (val <= thresholds.t5) return Math.round(55 + ((thresholds.t5 - val) / (thresholds.t5 - thresholds.t4)) * 10);
    if (val <= thresholds.t6) return Math.round(40 + ((thresholds.t6 - val) / (thresholds.t6 - thresholds.t5)) * 14);
    if (val <= thresholds.t7) return Math.round(20 + ((thresholds.t7 - val) / (thresholds.t7 - thresholds.t6)) * 19);
    return 10;
  } else {
    // Standard Higher is Better
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

export const compileBaseballFitScore = (
  gender: string,
  positionGroup: BaseballPositionGroup,
  levelOfPlay: string,
  gamesPlayed: number,
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const targetedGender = (gender === 'Girls' || gender === 'Women') ? 'Girls' : 'Boys';
  const genderStandards = BASEBALL_METRIC_STANDARDS[targetedGender];
  
  const normalizedGames = Math.max(1, gamesPlayed);
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];
  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number, isPerGame = false, isInverse = false) => {
    if (rawVal === null || rawVal === undefined || isNaN(rawVal)) return;

    const rate = isPerGame ? (rawVal / normalizedGames) : rawVal;
    const standards = genderStandards[thresholdKey];
    
    // For inverse stats (like ERA), multiplying by a >1.0 modifier makes the ERA worse (higher). 
    // This correctly penalizes lower competition levels.
    let modifiedValue = rate;
    if (isInverse) {
      modifiedValue = rate * (1 + (1 - modifier)); // If mod is 0.85 (JV), ERA inflates slightly.
    } else {
      modifiedValue = rate * modifier;
    }

    const score = calculateBaseballMetricScore(modifiedValue, standards);

    accumulatedWeightedScore += (score * weight);
    totalWeightsAssigned += weight;

    trace.push({
      metricLabel: key,
      perGameRate: rate,
      calibratedScore: score,
      weightAllocation: `${weight * 100}%`
    });
  };

  if (positionGroup === 'Pitcher (RHP/LHP)') {
    registerResult('Fastball Velo (MPH)', rawMetrics.velocity, 'Velocity', 0.60, false, false);
    registerResult('ERA', rawMetrics.era, 'ERA', 0.40, false, true);
  } else {
    // Position Players
    registerResult('Batting Average', rawMetrics.ba, 'BattingAverage', 0.30, false);
    registerResult('OPS', rawMetrics.ops, 'OPS', 0.35, false);
    registerResult('Home Runs', rawMetrics.hr, 'HomeRunsPerGame', 0.15, true);
    registerResult('RBI', rawMetrics.rbi, 'RBIPerGame', 0.10, true);
    
    // Middle Infield and Centerfield weigh speed slightly higher
    const speedWeight = (positionGroup === 'Infield (2B/3B/SS)' || positionGroup === 'Outfield (LF/CF/RF)') ? 0.10 : 0.05;
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