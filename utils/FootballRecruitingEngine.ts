// =========================================================================
// 🏈 FOOTBALL MULTI-VARIATE POSITION RECRUITING ENGINE & BASES
// =========================================================================

export type FootballPositionGroup = 'QB' | 'RB' | 'WR_TE' | 'OL' | 'DL_LB' | 'DB' | 'ST';

export interface FootballThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
}

// Normalized per-game metrics or raw execution percentages
export const FOOTBALL_METRIC_STANDARDS: Record<string, FootballThresholds> = {
  'QB_PassingYardsPerGame': { t1: 280, t2: 240, t3: 210, t4: 180, t5: 150, t6: 120, t7: 90 },
  'QB_PassingTDsPerGame': { t1: 3.2, t2: 2.6, t3: 2.1, t4: 1.6, t5: 1.2, t6: 0.9, t7: 0.5 },
  'QB_CompletionPct': { t1: 68, t2: 64, t3: 60, t4: 56, t5: 52, t6: 48, t7: 44 },

  'RB_RushingYardsPerGame': { t1: 145, t2: 120, t3: 100, t4: 85, t5: 70, t6: 55, t7: 40 },
  'RB_YardsPerCarry': { t1: 7.8, t2: 6.8, t3: 6.0, t4: 5.4, t5: 4.8, t6: 4.2, t7: 3.6 },
  'RB_TotalTDsPerGame': { t1: 2.2, t2: 1.8, t3: 1.4, t4: 1.1, t5: 0.8, t6: 0.5, t7: 0.3 },

  'WR_TE_ReceivingYardsPerGame': { t1: 105, t2: 88, t3: 75, t4: 64, t5: 52, t6: 40, t7: 28 },
  'WR_TE_YardsPerCatch': { t1: 18.5, t2: 16.0, t3: 14.2, t4: 12.8, t5: 11.5, t6: 10.2, t7: 9.0 },
  'WR_TE_ReceivingTDsPerGame': { t1: 1.4, t2: 1.1, t3: 0.9, t4: 0.7, t5: 0.5, t6: 0.3, t7: 0.15 },

  'OL_PancakesPerGame': { t1: 5.5, t2: 4.2, t3: 3.4, t4: 2.6, t5: 1.9, t6: 1.3, t7: 0.7 },
  'OL_SacksAllowed': { t1: 0, t2: 0.5, t3: 1.0, t4: 1.5, t5: 2.2, t6: 3.2, t7: 4.5 }, // Inverse metric logic

  'DL_LB_TacklesPerGame': { t1: 11.5, t2: 9.5, t3: 8.0, t4: 6.8, t5: 5.5, t6: 4.2, t7: 3.0 },
  'DL_LB_TFLPerGame': { t1: 2.4, t2: 1.8, t3: 1.4, t4: 1.0, t5: 0.7, t6: 0.4, t7: 0.2 },
  'DL_LB_SacksPerGame': { t1: 1.3, t2: 0.9, t3: 0.6, t4: 0.4, t5: 0.25, t6: 0.12, t7: 0.05 },

  'DB_PassBreakupsPerGame': { t1: 1.8, t2: 1.4, t3: 1.1, t4: 0.8, t5: 0.6, t6: 0.4, t7: 0.2 },
  'DB_InterceptionsPerGame': { t1: 0.6, t2: 0.45, t3: 0.35, t4: 0.25, t5: 0.18, t6: 0.10, t7: 0.05 },

  'ST_FieldGoalPct': { t1: 85, t2: 78, t3: 72, t4: 65, t5: 58, t6: 50, t7: 42 },
  'ST_PuntAverage': { t1: 44, t2: 41, t3: 38, t4: 36, t5: 34, t6: 32, t7: 30 }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.65,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference Tier': 1.15,
  'All-State / National': 1.30,
  'Elite Club (ECNL / AAU / Next)': 1.25
};

export const calculateSingleFootballMetricScore = (
  val: number,
  thresholds: FootballThresholds,
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
    // Inverse processing for parameters like sacks allowed (fewer is optimal)
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

export const compileFootballFitScore = (
  positionGroup: FootballPositionGroup,
  levelOfPlay: string,
  gamesPlayed: number,
  rawMetrics: Record<string, number>
): { compositeScore: number; structuralTrace: any[] } => {
  const normalizedGames = Math.max(1, gamesPlayed);
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];

  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerMetricResult = (key: string, rawVal: number, thresholdKey: string, weight: number, isInverse = false, isRateBased = true) => {
    const targetValue = isRateBased ? (rawVal / normalizedGames) : rawVal;
    const standards = FOOTBALL_METRIC_STANDARDS[thresholdKey];
    
    if (!standards) return;

    // Level configuration applies a baseline adjustment scalar matrix to normalize cross-league friction
    const modifiedValue = isInverse ? (targetValue / modifier) : (targetValue * modifier);
    const score = calculateSingleFootballMetricScore(modifiedValue, standards, isInverse);

    accumulatedWeightedScore += (score * weight);
    totalWeightsAssigned += weight;

    trace.push({
      metricLabel: key.replace(/([A-Z])/g, ' $1').trim(),
      rawTotal: rawVal,
      perGameRate: targetValue,
      calibratedScore: score,
      weightAllocation: `${weight * 100}%`
    });
  };

  // Position-Specific Structural Weight Matrices Mapping
  if (positionGroup === 'QB') {
    registerMetricResult('Passing Yards', rawMetrics.passingYards || 0, 'QB_PassingYardsPerGame', 0.45);
    registerMetricResult('Passing TDs', rawMetrics.passingTDs || 0, 'QB_PassingTDsPerGame', 0.35);
    registerMetricResult('Completion Pct', rawMetrics.completionPct || 0, 'QB_CompletionPct', 0.20, false, false);
  } 
  else if (positionGroup === 'RB') {
    registerMetricResult('Rushing Yards', rawMetrics.rushingYards || 0, 'RB_RushingYardsPerGame', 0.50);
    registerMetricResult('Yards Per Carry', rawMetrics.yardsPerCarry || 0, 'RB_YardsPerCarry', 0.30, false, false);
    registerMetricResult('Total TDs', rawMetrics.totalTDs || 0, 'RB_TotalTDsPerGame', 0.20);
  } 
  else if (positionGroup === 'WR_TE') {
    registerMetricResult('Receiving Yards', rawMetrics.receivingYards || 0, 'WR_TE_ReceivingYardsPerGame', 0.50);
    registerMetricResult('Yards Per Catch', rawMetrics.yardsPerCatch || 0, 'WR_TE_YardsPerCatch', 0.30, false, false);
    registerMetricResult('Receiving TDs', rawMetrics.receivingTDs || 0, 'WR_TE_ReceivingTDsPerGame', 0.20);
  } 
  else if (positionGroup === 'OL') {
    registerMetricResult('Pancake Blocks', rawMetrics.pancakes || 0, 'OL_PancakesPerGame', 0.65);
    registerMetricResult('Sacks Allowed', rawMetrics.sacksAllowed || 0, 'OL_SacksAllowed', 0.35, true, false);
  } 
  else if (positionGroup === 'DL_LB') {
    registerMetricResult('Total Tackles', rawMetrics.tackles || 0, 'DL_LB_TacklesPerGame', 0.40);
    registerMetricResult('Tackles For Loss', rawMetrics.tfl || 0, 'DL_LB_TFLPerGame', 0.35);
    registerMetricResult('Quarterback Sacks', rawMetrics.sacks || 0, 'DL_LB_SacksPerGame', 0.25);
  } 
  else if (positionGroup === 'DB') {
    registerMetricResult('Pass Breakups (PBU)', rawMetrics.pbus || 0, 'DB_PassBreakupsPerGame', 0.60);
    registerMetricResult('Interceptions', rawMetrics.interceptions || 0, 'DB_InterceptionsPerGame', 0.40);
  } 
  else if (positionGroup === 'ST') {
    registerMetricResult('Field Goal Pct', rawMetrics.fgPct || 0, 'ST_FieldGoalPct', 0.60, false, false);
    registerMetricResult('Punt Average Yards', rawMetrics.puntAvg || 0, 'ST_PuntAverage', 0.40, false, false);
  }

  let finalComposite = totalWeightsAssigned > 0 
    ? Math.round(accumulatedWeightedScore / totalWeightsAssigned) 
    : 0;

  // Level Gated Ceilings: Sub-varsity play layers can never exceed a developmental cap indicator
  if (levelOfPlay === 'JV / Dev Squad') {
    finalComposite = Math.min(45, finalComposite);
  } else if (levelOfPlay === 'Varsity Contributor') {
    finalComposite = Math.min(65, finalComposite);
  }

  return {
    compositeScore: Math.min(99, Math.max(10, finalComposite)),
    structuralTrace: trace
  };
};