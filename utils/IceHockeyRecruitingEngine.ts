// =========================================================================
// 🏒 ICE HOCKEY POSITIONAL RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type IceHockeyPositionGroup = 'Center' | 'Winger' | 'Defenseman' | 'Goaltender';

export interface IceHockeyThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / ACHA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
  inverse?: boolean; // Used for GAA (lower is better)
}

// Standards based on normalized PER GAME expectations to account for HS (20 games) vs AAA (60 games)
export const ICE_HOCKEY_METRIC_STANDARDS: Record<'Boys' | 'Girls', Record<string, IceHockeyThresholds>> = {
  'Boys': {
    'GoalsPerGame': { t1: 1.2, t2: 1.0, t3: 0.8, t4: 0.6, t5: 0.4, t6: 0.2, t7: 0.1 },
    'AssistsPerGame': { t1: 1.5, t2: 1.2, t3: 0.9, t4: 0.6, t5: 0.4, t6: 0.2, t7: 0.1 },
    'PointsPerGame': { t1: 2.5, t2: 2.0, t3: 1.5, t4: 1.1, t5: 0.8, t6: 0.5, t7: 0.2 },
    'PlusMinusPerGame': { t1: 1.5, t2: 1.0, t3: 0.7, t4: 0.4, t5: 0.2, t6: 0.0, t7: -0.2 },
    'SavePct': { t1: 0.935, t2: 0.925, t3: 0.915, t4: 0.900, t5: 0.885, t6: 0.870, t7: 0.850 },
    'GAA': { t1: 1.50, t2: 2.00, t3: 2.50, t4: 3.00, t5: 3.50, t6: 4.00, t7: 4.50, inverse: true }
  },
  'Girls': {
    'GoalsPerGame': { t1: 1.0, t2: 0.8, t3: 0.6, t4: 0.4, t5: 0.3, t6: 0.15, t7: 0.05 },
    'AssistsPerGame': { t1: 1.2, t2: 1.0, t3: 0.8, t4: 0.5, t5: 0.3, t6: 0.2, t7: 0.1 },
    'PointsPerGame': { t1: 2.0, t2: 1.6, t3: 1.2, t4: 0.8, t5: 0.5, t6: 0.3, t7: 0.1 },
    'PlusMinusPerGame': { t1: 1.2, t2: 0.8, t3: 0.5, t4: 0.3, t5: 0.1, t6: 0.0, t7: -0.2 },
    'SavePct': { t1: 0.940, t2: 0.930, t3: 0.920, t4: 0.905, t5: 0.890, t6: 0.875, t7: 0.855 },
    'GAA': { t1: 1.40, t2: 1.80, t3: 2.20, t4: 2.75, t5: 3.25, t6: 3.75, t7: 4.25, inverse: true }
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.65,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference / Regional': 1.15,
  'All-State / National': 1.30,
  'Elite Club (AAA / USHL / PWHL)': 1.50
};

export const calculateIceHockeyMetricScore = (val: number, thresholds: IceHockeyThresholds): number => {
  if (isNaN(val)) return 10; // Removed val < 0 because Plus/Minus can be negative

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
    if (val >= thresholds.t1) return Math.min(99, Math.round(95 + ((val - thresholds.t1) / Math.abs(thresholds.t1 * 0.1)) * 4));
    if (val >= thresholds.t2) return Math.round(85 + ((val - thresholds.t2) / Math.abs(thresholds.t1 - thresholds.t2)) * 10);
    if (val >= thresholds.t3) return Math.round(75 + ((val - thresholds.t3) / Math.abs(thresholds.t2 - thresholds.t3)) * 10);
    if (val >= thresholds.t4) return Math.round(65 + ((val - thresholds.t4) / Math.abs(thresholds.t3 - thresholds.t4)) * 10);
    if (val >= thresholds.t5) return Math.round(55 + ((val - thresholds.t5) / Math.abs(thresholds.t4 - thresholds.t5)) * 10);
    if (val >= thresholds.t6) return Math.round(40 + ((val - thresholds.t6) / Math.abs(thresholds.t5 - thresholds.t6)) * 14);
    if (val >= thresholds.t7) return Math.round(20 + ((val - thresholds.t7) / Math.abs(thresholds.t6 - thresholds.t7)) * 19);
    return Math.max(10, Math.round((val / Math.max(0.1, thresholds.t7)) * 20));
  }
};

export const compileIceHockeyFitScore = (
  gender: string,
  positionGroup: IceHockeyPositionGroup,
  levelOfPlay: string,
  gamesPlayed: number,
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const targetedGender = (gender === 'Girls' || gender === 'Women') ? 'Girls' : 'Boys';
  const genderStandards = ICE_HOCKEY_METRIC_STANDARDS[targetedGender];
  
  const normalizedGames = Math.max(1, gamesPlayed);
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];
  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number, isPerGame = false, isInverse = false) => {
    if (rawVal === null || rawVal === undefined || isNaN(rawVal)) return;

    let targetValue = isPerGame ? (rawVal / normalizedGames) : rawVal;

    // Auto-correct Save % if they entered a whole number (e.g. 92 instead of 0.92)
    if (thresholdKey === 'SavePct' && targetValue > 1) {
      targetValue = targetValue / 100;
    }

    const standards = genderStandards[thresholdKey];
    let modifiedValue = targetValue;

    if (thresholdKey !== 'SavePct') {
      if (isInverse) {
        modifiedValue = targetValue * (1 + (1 - modifier)); 
      } else {
        modifiedValue = targetValue * modifier;
      }
    }

    const score = calculateIceHockeyMetricScore(modifiedValue, standards);

    accumulatedWeightedScore += (score * weight);
    totalWeightsAssigned += weight;

    trace.push({
      metricLabel: key,
      perGameRate: targetValue,
      calibratedScore: score,
      weightAllocation: `${weight * 100}%`
    });
  };

  if (positionGroup === 'Goaltender') {
    registerResult('Save %', rawMetrics.savePct, 'SavePct', 0.60, false, false);
    registerResult('Goals Against Avg', rawMetrics.gaa, 'GAA', 0.40, false, true);
  } else {
    // Skaters (Auto-calculate Total Points)
    const g = rawMetrics.goals || 0;
    const a = rawMetrics.assists || 0;
    const points = g + a;

    if (positionGroup === 'Center' || positionGroup === 'Winger') {
      registerResult('Total Points', points, 'PointsPerGame', 0.45, true);
      registerResult('Goals', rawMetrics.goals, 'GoalsPerGame', 0.30, true);
      registerResult('Assists', rawMetrics.assists, 'AssistsPerGame', 0.15, true);
      registerResult('Plus/Minus', rawMetrics.plusMinus, 'PlusMinusPerGame', 0.10, true);
    } else if (positionGroup === 'Defenseman') {
      registerResult('Plus/Minus', rawMetrics.plusMinus, 'PlusMinusPerGame', 0.35, true);
      registerResult('Assists', rawMetrics.assists, 'AssistsPerGame', 0.30, true);
      registerResult('Total Points', points, 'PointsPerGame', 0.25, true);
      registerResult('Goals', rawMetrics.goals, 'GoalsPerGame', 0.10, true);
    }
  }

  let finalComposite = totalWeightsAssigned > 0 ? Math.round(accumulatedWeightedScore / totalWeightsAssigned) : 0;
  
  if (levelOfPlay === 'JV / Dev Squad') finalComposite = Math.min(55, finalComposite);
  else if (levelOfPlay === 'Varsity Contributor') finalComposite = Math.min(75, finalComposite);

  return {
    compositeScore: Math.min(99, Math.max(10, finalComposite)),
    analyticalTrace: trace
  };
};