// =========================================================================
// 🥍 LACROSSE POSITIONAL RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type LacrossePositionGroup = 'Attack' | 'Midfield' | 'Defense' | 'Goalie' | 'FO';

export interface LacrosseThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
}

// Normalized per-game metrics or raw execution percentages
export const LACROSSE_METRIC_STANDARDS: Record<'Boys' | 'Girls', Record<string, LacrosseThresholds>> = {
  'Boys': {
    'GoalsPerGame': { t1: 3.5, t2: 2.8, t3: 2.2, t4: 1.6, t5: 1.2, t6: 0.8, t7: 0.4 },
    'AssistsPerGame': { t1: 2.5, t2: 1.9, t3: 1.4, t4: 1.0, t5: 0.7, t6: 0.4, t7: 0.2 },
    'GroundBallsPerGame': { t1: 6.0, t2: 4.8, t3: 3.8, t4: 2.8, t5: 2.0, t6: 1.2, t7: 0.6 },
    'CausedTurnoversPerGame': { t1: 2.8, t2: 2.2, t3: 1.7, t4: 1.2, t5: 0.8, t6: 0.5, t7: 0.2 },
    'FaceoffWinPct': { t1: 72, t2: 65, t3: 60, t4: 55, t5: 50, t6: 45, t7: 40 },
    'SavePct': { t1: 65, t2: 60, t3: 56, t4: 52, t5: 48, t6: 44, t7: 38 },
    'GAA': { t1: 4.5, t2: 5.5, t3: 6.8, t4: 8.0, t5: 9.5, t6: 11.0, t7: 13.0 } // Inverse standard
  },
  'Girls': {
    'GoalsPerGame': { t1: 4.0, t2: 3.2, t3: 2.5, t4: 1.8, t5: 1.3, t6: 0.9, t7: 0.5 },
    'AssistsPerGame': { t1: 2.2, t2: 1.7, t3: 1.2, t4: 0.8, t5: 0.5, t6: 0.3, t7: 0.1 },
    'GroundBallsPerGame': { t1: 4.5, t2: 3.5, t3: 2.8, t4: 2.0, t5: 1.4, t6: 0.8, t7: 0.4 },
    'CausedTurnoversPerGame': { t1: 2.5, t2: 2.0, t3: 1.5, t4: 1.0, t5: 0.7, t6: 0.4, t7: 0.2 },
    'FaceoffWinPct': { t1: 70, t2: 62, t3: 57, t4: 52, t5: 47, t6: 42, t7: 35 }, // Draw Controls % equivalent
    'SavePct': { t1: 55, t2: 50, t3: 46, t4: 42, t5: 38, t6: 34, t7: 28 },
    'GAA': { t1: 5.5, t2: 6.5, t3: 7.8, t4: 9.0, t5: 10.5, t6: 12.0, t7: 14.0 } // Inverse standard
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.60,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference Tier': 1.15,
  'All-State / National': 1.30,
  'Elite Club (ECNL / AAU / Next)': 1.40 
};

export const calculateSingleLacrosseMetricScore = (
  val: number,
  thresholds: LacrosseThresholds,
  isInverse: boolean = false
): number => {
  if (isNaN(val) || val < 0) return 10;

  if (!isInverse) {
    if (val >= thresholds.t1) return Math.min(99, Math.round(95 + ((val - thresholds.t1) / thresholds.t1) * 20));
    if (val >= thresholds.t2) return Math.round(85 + ((val - thresholds.t2) / (thresholds.t1 - thresholds.t2)) * 10);
    if (val >= thresholds.t3) return Math.round(75 + ((val - thresholds.t3) / (thresholds.t2 - thresholds.t3)) * 10);
    if (val >= thresholds.t4) return Math.round(65 + ((val - thresholds.t4) / (thresholds.t3 - thresholds.t4)) * 10);
    if (val >= thresholds.t5) return Math.round(55 + ((val - thresholds.t5) / (thresholds.t4 - thresholds.t5)) * 10);
    if (val >= thresholds.t6) return Math.round(40 + ((val - thresholds.t6) / (thresholds.t5 - thresholds.t6)) * 14);
    if (val >= thresholds.t7) return Math.round(20 + ((val - thresholds.t7) / (thresholds.t6 - thresholds.t7)) * 19);
    return Math.max(10, Math.round((val / thresholds.t7) * 20));
  } else {
    if (val <= thresholds.t1) return 99;
    if (val <= thresholds.t2) return Math.round(85 + ((thresholds.t2 - val) / (thresholds.t2 - thresholds.t1)) * 14);
    if (val <= thresholds.t3) return Math.round(75 + ((thresholds.t3 - val) / (thresholds.t3 - thresholds.t2)) * 10);
    if (val <= thresholds.t4) return Math.round(65 + ((thresholds.t4 - val) / (thresholds.t4 - thresholds.t3)) * 10);
    if (val <= thresholds.t5) return Math.round(55 + ((thresholds.t5 - val) / (thresholds.t5 - thresholds.t4)) * 10);
    if (val <= thresholds.t6) return Math.round(40 + ((thresholds.t6 - val) / (thresholds.t6 - thresholds.t5)) * 14);
    if (val <= thresholds.t7) return Math.round(20 + ((thresholds.t7 - val) / (thresholds.t7 - thresholds.t6)) * 19);
    return 10;
  }
};

export const compileLacrosseFitScore = (
  gender: string,
  positionGroup: LacrossePositionGroup,
  levelOfPlay: string,
  gamesPlayed: number,
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const targetedGender = (gender === 'Girls' || gender === 'Women') ? 'Girls' : 'Boys';
  const genderStandards = LACROSSE_METRIC_STANDARDS[targetedGender];
  
  const normalizedGames = Math.max(1, gamesPlayed);
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];

  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerMetricResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number, isInverse = false, isRateBased = true) => {
    // 🚨 Skip metrics the athlete left blank (dynamically re-weights based on what IS provided)
    if (rawVal === null || rawVal === undefined || isNaN(rawVal)) return;

    const targetValue = isRateBased ? (rawVal / normalizedGames) : rawVal;
    const standards = genderStandards[thresholdKey];
    
    if (!standards) return;

    const modifiedValue = isInverse ? (targetValue / modifier) : (targetValue * modifier);
    const score = calculateSingleLacrosseMetricScore(modifiedValue, standards, isInverse);

    accumulatedWeightedScore += (score * weight);
    totalWeightsAssigned += weight;

    trace.push({
      metricLabel: key,
      rawTotal: rawVal,
      perGameRate: targetValue,
      calibratedScore: score,
      weightAllocation: `${weight * 100}%` // Note: this is base relative weight, true % depends on totalWeightsAssigned
    });
  };

  // Positional Matrix Allocation Layouts
  if (positionGroup === 'Attack') {
    registerMetricResult('Goals Scored', rawMetrics.statA, 'GoalsPerGame', 0.50);
    registerMetricResult('Assists', rawMetrics.statB, 'AssistsPerGame', 0.35);
    registerMetricResult('Ground Balls', rawMetrics.statC, 'GroundBallsPerGame', 0.15);
  } 
  else if (positionGroup === 'Midfield') {
    registerMetricResult('Goals Scored', rawMetrics.statA, 'GoalsPerGame', 0.35);
    registerMetricResult('Assists', rawMetrics.statB, 'AssistsPerGame', 0.35);
    registerMetricResult('Ground Balls', rawMetrics.statC, 'GroundBallsPerGame', 0.30);
  } 
  else if (positionGroup === 'Defense') {
    registerMetricResult('Caused Turnovers', rawMetrics.statA, 'CausedTurnoversPerGame', 0.55);
    registerMetricResult('Ground Balls', rawMetrics.statB, 'GroundBallsPerGame', 0.35);
    registerMetricResult('Assists', rawMetrics.statC, 'AssistsPerGame', 0.10);
  } 
  else if (positionGroup === 'Goalie') {
    registerMetricResult('Save Percentage', rawMetrics.statA, 'SavePct', 0.60, false, false);
    registerMetricResult('Goals Against Avg', rawMetrics.statB, 'GAA', 0.40, true, false);
  }
  else if (positionGroup === 'FO') {
    registerMetricResult('Faceoff Win %', rawMetrics.statA, 'FaceoffWinPct', 0.70, false, false);
    registerMetricResult('Ground Balls', rawMetrics.statB, 'GroundBallsPerGame', 0.30);
  }

  let finalComposite = totalWeightsAssigned > 0 
    ? Math.round(accumulatedWeightedScore / totalWeightsAssigned) 
    : 0;

  // Enforce sub-varsity limits dynamically
  if (levelOfPlay === 'JV / Dev Squad') {
    finalComposite = Math.min(45, finalComposite);
  } else if (levelOfPlay === 'Varsity Contributor') {
    finalComposite = Math.min(65, finalComposite);
  }

  return {
    compositeScore: Math.min(99, Math.max(10, finalComposite)),
    analyticalTrace: trace
  };
};