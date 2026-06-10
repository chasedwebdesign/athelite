// =========================================================================
// 🏑 FIELD HOCKEY POSITIONAL RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type FieldHockeyPositionGroup = 'Forward' | 'Midfielder' | 'Defender' | 'Goalkeeper';

export interface FieldHockeyThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
}

// Normalized per-game metrics or raw execution percentages
export const FIELD_HOCKEY_METRIC_STANDARDS: Record<'Boys' | 'Girls', Record<string, FieldHockeyThresholds>> = {
  'Boys': {
    // Boys FH is rare in the US high school system, using calibrated international youth baselines
    'GoalsPerGame': { t1: 1.6, t2: 1.2, t3: 0.9, t4: 0.6, t5: 0.4, t6: 0.2, t7: 0.1 },
    'AssistsPerGame': { t1: 1.0, t2: 0.8, t3: 0.6, t4: 0.4, t5: 0.3, t6: 0.2, t7: 0.1 },
    'DefSavesPerGame': { t1: 0.6, t2: 0.4, t3: 0.3, t4: 0.2, t5: 0.15, t6: 0.1, t7: 0.05 },
    'GK_SavePct': { t1: 85, t2: 80, t3: 75, t4: 70, t5: 65, t6: 60, t7: 55 },
    'GK_GAA': { t1: 0.8, t2: 1.2, t3: 1.6, t4: 2.0, t5: 2.5, t6: 3.2, t7: 4.0 } // Inverse
  },
  'Girls': {
    // Girls FH is a massive US collegiate recruiting market. Strict baselines.
    'GoalsPerGame': { t1: 1.5, t2: 1.1, t3: 0.8, t4: 0.6, t5: 0.4, t6: 0.2, t7: 0.1 },
    'AssistsPerGame': { t1: 1.0, t2: 0.8, t3: 0.6, t4: 0.4, t5: 0.3, t6: 0.2, t7: 0.1 },
    'DefSavesPerGame': { t1: 0.5, t2: 0.4, t3: 0.3, t4: 0.2, t5: 0.15, t6: 0.1, t7: 0.05 },
    'GK_SavePct': { t1: 88, t2: 84, t3: 80, t4: 75, t5: 70, t6: 65, t7: 60 },
    'GK_GAA': { t1: 0.5, t2: 0.8, t3: 1.1, t4: 1.5, t5: 2.0, t6: 2.5, t7: 3.5 } // Inverse
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.60,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference Tier': 1.15,
  'All-State / National': 1.30,
  'Elite Club (ECNL / AAU / Next)': 1.40 // Heavy premium for top travel teams (MAX FH, Nexus, etc.)
};

export const calculateSingleFieldHockeyMetricScore = (
  val: number,
  thresholds: FieldHockeyThresholds,
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

export const compileFieldHockeyFitScore = (
  gender: string,
  positionGroup: FieldHockeyPositionGroup,
  levelOfPlay: string,
  gamesPlayed: number,
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const targetedGender = (gender === 'Boys' || gender === 'Men') ? 'Boys' : 'Girls';
  const genderStandards = FIELD_HOCKEY_METRIC_STANDARDS[targetedGender];
  
  const normalizedGames = Math.max(1, gamesPlayed);
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];

  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerMetricResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number, isInverse = false, isRateBased = true) => {
    // 🚨 Skip metrics the athlete left blank to prevent tanking the average
    if (rawVal === null || rawVal === undefined || isNaN(rawVal)) return;

    const targetValue = isRateBased ? (rawVal / normalizedGames) : rawVal;
    const standards = genderStandards[thresholdKey];
    
    if (!standards) return;

    const modifiedValue = isInverse ? (targetValue / modifier) : (targetValue * modifier);
    const score = calculateSingleFieldHockeyMetricScore(modifiedValue, standards, isInverse);

    accumulatedWeightedScore += (score * weight);
    totalWeightsAssigned += weight;

    trace.push({
      metricLabel: key,
      rawTotal: rawVal,
      perGameRate: targetValue,
      calibratedScore: score,
      weightAllocation: `${weight * 100}%`
    });
  };

  // Positional Matrix Allocation Layouts
  if (positionGroup === 'Forward') {
    registerMetricResult('Goals Scored', rawMetrics.goals, 'GoalsPerGame', 0.60);
    registerMetricResult('Assists', rawMetrics.assists, 'AssistsPerGame', 0.40);
  } 
  else if (positionGroup === 'Midfielder') {
    registerMetricResult('Assists', rawMetrics.assists, 'AssistsPerGame', 0.45);
    registerMetricResult('Goals Scored', rawMetrics.goals, 'GoalsPerGame', 0.35);
    registerMetricResult('Defensive Saves', rawMetrics.defSaves, 'DefSavesPerGame', 0.20);
  } 
  else if (positionGroup === 'Defender') {
    registerMetricResult('Defensive Saves', rawMetrics.defSaves, 'DefSavesPerGame', 0.60);
    registerMetricResult('Assists', rawMetrics.assists, 'AssistsPerGame', 0.30);
    registerMetricResult('Goals Scored', rawMetrics.goals, 'GoalsPerGame', 0.10);
  } 
  else if (positionGroup === 'Goalkeeper') {
    registerMetricResult('Save Percentage', rawMetrics.savePct, 'GK_SavePct', 0.60, false, false);
    registerMetricResult('Goals Against Avg', rawMetrics.gaa, 'GK_GAA', 0.40, true, false);
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