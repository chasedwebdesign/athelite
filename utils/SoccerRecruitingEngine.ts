// =========================================================================
// ⚽ SOCCER POSITIONAL RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type SoccerPositionGroup = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface SoccerThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
}

export const SOCCER_METRIC_STANDARDS: Record<string, SoccerThresholds> = {
  'FWD_GoalsPerGame': { t1: 1.3, t2: 1.0, t3: 0.8, t4: 0.6, t5: 0.45, t6: 0.3, t7: 0.15 },
  'MID_AssistsPerGame': { t1: 0.9, t2: 0.7, t3: 0.55, t4: 0.4, t5: 0.3, t6: 0.2, t7: 0.1 },
  
  'DEF_TacklesInterceptionsPerGame': { t1: 8.5, t2: 7.0, t3: 5.8, t4: 4.8, t5: 3.8, t6: 2.8, t7: 1.8 },
  'CleanSheetsPerGame': { t1: 0.6, t2: 0.5, t3: 0.4, t4: 0.32, t5: 0.25, t6: 0.18, t7: 0.10 },
  'PassCompletionPct': { t1: 85, t2: 80, t3: 76, t4: 71, t5: 66, t6: 60, t7: 54 },

  'GK_SavePct': { t1: 88, t2: 83, t3: 79, t4: 74, t5: 68, t6: 62, t7: 55 },
  'GK_GAA': { t1: 0.5, t2: 0.8, t3: 1.1, t4: 1.4, t5: 1.8, t6: 2.3, t7: 3.0 }, // Inverse standard logic

  'MinutesPerGame': { t1: 78, t2: 74, t3: 70, t4: 65, t5: 58, t6: 50, t7: 40 }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.60,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference Tier': 1.15,
  'All-State / National': 1.30,
  'Elite Club (ECNL / AAU / Next)': 1.45 // Strong premium scaling for top national club academies
};

export const calculateSingleSoccerMetricScore = (
  val: number,
  thresholds: SoccerThresholds,
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

export const compileSoccerFitScore = (
  positionGroup: SoccerPositionGroup,
  levelOfPlay: string,
  gamesPlayed: number,
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const normalizedGames = Math.max(1, gamesPlayed);
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];

  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerMetricResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number, isInverse = false, isRateBased = true) => {
    // 🚨 KEY FIX: If the user didn't provide this stat, skip it entirely. Do not weight it or score it as a 0.
    if (rawVal === null || rawVal === undefined || isNaN(rawVal)) return;

    const targetValue = isRateBased ? (rawVal / normalizedGames) : rawVal;
    const standards = SOCCER_METRIC_STANDARDS[thresholdKey];
    
    if (!standards) return;

    const modifiedValue = isInverse ? (targetValue / modifier) : (targetValue * modifier);
    const score = calculateSingleSoccerMetricScore(modifiedValue, standards, isInverse);

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
  if (positionGroup === 'GK') {
    registerMetricResult('Save Percentage', rawMetrics.savePct, 'GK_SavePct', 0.45, false, false);
    registerMetricResult('Goals Against Avg', rawMetrics.gaa, 'GK_GAA', 0.35, true, false);
    registerMetricResult('Clean Sheets', rawMetrics.cleanSheets, 'CleanSheetsPerGame', 0.20);
  } 
  else if (positionGroup === 'DEF') {
    registerMetricResult('Defensive Actions', rawMetrics.defactions, 'DEF_TacklesInterceptionsPerGame', 0.45);
    registerMetricResult('Clean Sheets', rawMetrics.cleanSheets, 'CleanSheetsPerGame', 0.35);
    registerMetricResult('Pass Completion %', rawMetrics.passPct, 'PassCompletionPct', 0.20, false, false);
  } 
  else if (positionGroup === 'MID') {
    registerMetricResult('Assists', rawMetrics.assists, 'MID_AssistsPerGame', 0.45);
    registerMetricResult('Pass Completion %', rawMetrics.passPct, 'PassCompletionPct', 0.35, false, false);
    registerMetricResult('Goals Scored', rawMetrics.goals, 'FWD_GoalsPerGame', 0.20);
  } 
  else if (positionGroup === 'FWD') {
    registerMetricResult('Goals Scored', rawMetrics.goals, 'FWD_GoalsPerGame', 0.55);
    registerMetricResult('Assists', rawMetrics.assists, 'MID_AssistsPerGame', 0.25);
    registerMetricResult('Minutes Played', rawMetrics.minutes, 'MinutesPerGame', 0.20);
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