// =========================================================================
// 🏀 BASKETBALL POSITIONAL RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type BasketballPositionGroup = 'Point Guard (PG)' | 'Shooting Guard (SG)' | 'Small Forward (SF)' | 'Power Forward (PF)' | 'Center (C)';

export interface BasketballThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
}

export const BASKETBALL_METRIC_STANDARDS: Record<'Boys' | 'Girls', Record<string, BasketballThresholds>> = {
  'Boys': {
    'PointsPerGame': { t1: 22.0, t2: 18.0, t3: 15.0, t4: 12.0, t5: 10.0, t6: 7.0, t7: 4.0 },
    'ReboundsPerGame': { t1: 10.0, t2: 8.0, t3: 7.0, t4: 5.0, t5: 4.0, t6: 3.0, t7: 2.0 },
    'AssistsPerGame': { t1: 7.0, t2: 5.0, t3: 4.0, t4: 3.0, t5: 2.0, t6: 1.0, t7: 0.5 },
    'FieldGoalPct': { t1: 58.0, t2: 53.0, t3: 48.0, t4: 45.0, t5: 42.0, t6: 38.0, t7: 35.0 },
    'ThreePointPct': { t1: 42.0, t2: 38.0, t3: 35.0, t4: 32.0, t5: 28.0, t6: 25.0, t7: 22.0 }
  },
  'Girls': {
    'PointsPerGame': { t1: 20.0, t2: 16.0, t3: 13.0, t4: 10.0, t5: 8.0, t6: 5.0, t7: 3.0 },
    'ReboundsPerGame': { t1: 10.0, t2: 8.0, t3: 7.0, t4: 5.0, t5: 4.0, t6: 3.0, t7: 2.0 },
    'AssistsPerGame': { t1: 7.0, t2: 5.0, t3: 4.0, t4: 3.0, t5: 2.5, t6: 1.5, t7: 1.0 },
    'FieldGoalPct': { t1: 55.0, t2: 50.0, t3: 45.0, t4: 40.0, t5: 35.0, t6: 32.0, t7: 28.0 },
    'ThreePointPct': { t1: 40.0, t2: 35.0, t3: 32.0, t4: 28.0, t5: 25.0, t6: 22.0, t7: 18.0 }
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.60,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference Tier': 1.15,
  'All-State / National': 1.30,
  'Elite Club (ECNL / AAU / Next)': 1.45 // EYBL / Under Armour circuit premium
};

export const calculateSingleBasketballMetricScore = (
  val: number,
  thresholds: BasketballThresholds
): number => {
  if (isNaN(val) || val <= 0) return 10;

  if (val >= thresholds.t1) return Math.min(99, Math.round(95 + ((val - thresholds.t1) / thresholds.t1) * 20));
  if (val >= thresholds.t2) return Math.round(85 + ((val - thresholds.t2) / (thresholds.t1 - thresholds.t2)) * 10);
  if (val >= thresholds.t3) return Math.round(75 + ((val - thresholds.t3) / (thresholds.t2 - thresholds.t3)) * 10);
  if (val >= thresholds.t4) return Math.round(65 + ((val - thresholds.t4) / (thresholds.t3 - thresholds.t4)) * 10);
  if (val >= thresholds.t5) return Math.round(55 + ((val - thresholds.t5) / (thresholds.t4 - thresholds.t5)) * 10);
  if (val >= thresholds.t6) return Math.round(40 + ((val - thresholds.t6) / (thresholds.t5 - thresholds.t6)) * 14);
  if (val >= thresholds.t7) return Math.round(20 + ((val - thresholds.t7) / (thresholds.t6 - thresholds.t7)) * 19);
  return Math.max(10, Math.round((val / thresholds.t7) * 20));
};

export const compileBasketballFitScore = (
  gender: string,
  positionGroup: BasketballPositionGroup,
  levelOfPlay: string,
  gamesPlayed: number,
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const targetedGender = (gender === 'Girls' || gender === 'Women') ? 'Girls' : 'Boys';
  const genderStandards = BASKETBALL_METRIC_STANDARDS[targetedGender];
  
  const normalizedGames = Math.max(1, gamesPlayed);
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];

  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerMetricResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number, isRateBased = true) => {
    // 🚨 Skip metrics the athlete left blank to prevent tanking the average
    if (rawVal === null || rawVal === undefined || isNaN(rawVal)) return;

    const targetValue = isRateBased ? (rawVal / normalizedGames) : rawVal;
    const standards = genderStandards[thresholdKey];
    
    if (!standards) return;

    const modifiedValue = targetValue * modifier;
    const score = calculateSingleBasketballMetricScore(modifiedValue, standards);

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
  if (positionGroup === 'Point Guard (PG)') {
    registerMetricResult('Assists', rawMetrics.assists, 'AssistsPerGame', 0.35);
    registerMetricResult('Points', rawMetrics.points, 'PointsPerGame', 0.30);
    registerMetricResult('3-Point %', rawMetrics.threePtPct, 'ThreePointPct', 0.15, false);
    registerMetricResult('Field Goal %', rawMetrics.fgPct, 'FieldGoalPct', 0.10, false);
    registerMetricResult('Rebounds', rawMetrics.rebounds, 'ReboundsPerGame', 0.10);
  } 
  else if (positionGroup === 'Shooting Guard (SG)') {
    registerMetricResult('Points', rawMetrics.points, 'PointsPerGame', 0.40);
    registerMetricResult('3-Point %', rawMetrics.threePtPct, 'ThreePointPct', 0.25, false);
    registerMetricResult('Field Goal %', rawMetrics.fgPct, 'FieldGoalPct', 0.15, false);
    registerMetricResult('Assists', rawMetrics.assists, 'AssistsPerGame', 0.10);
    registerMetricResult('Rebounds', rawMetrics.rebounds, 'ReboundsPerGame', 0.10);
  } 
  else if (positionGroup === 'Small Forward (SF)') {
    registerMetricResult('Points', rawMetrics.points, 'PointsPerGame', 0.35);
    registerMetricResult('Rebounds', rawMetrics.rebounds, 'ReboundsPerGame', 0.25);
    registerMetricResult('Field Goal %', rawMetrics.fgPct, 'FieldGoalPct', 0.20, false);
    registerMetricResult('3-Point %', rawMetrics.threePtPct, 'ThreePointPct', 0.10, false);
    registerMetricResult('Assists', rawMetrics.assists, 'AssistsPerGame', 0.10);
  } 
  else if (positionGroup === 'Power Forward (PF)') {
    registerMetricResult('Rebounds', rawMetrics.rebounds, 'ReboundsPerGame', 0.35);
    registerMetricResult('Points', rawMetrics.points, 'PointsPerGame', 0.30);
    registerMetricResult('Field Goal %', rawMetrics.fgPct, 'FieldGoalPct', 0.25, false);
    registerMetricResult('Assists', rawMetrics.assists, 'AssistsPerGame', 0.05);
    registerMetricResult('3-Point %', rawMetrics.threePtPct, 'ThreePointPct', 0.05, false);
  }
  else if (positionGroup === 'Center (C)') {
    registerMetricResult('Rebounds', rawMetrics.rebounds, 'ReboundsPerGame', 0.40);
    registerMetricResult('Field Goal %', rawMetrics.fgPct, 'FieldGoalPct', 0.30, false);
    registerMetricResult('Points', rawMetrics.points, 'PointsPerGame', 0.20);
    registerMetricResult('Assists', rawMetrics.assists, 'AssistsPerGame', 0.05);
    registerMetricResult('3-Point %', rawMetrics.threePtPct, 'ThreePointPct', 0.05, false);
  }

  let finalComposite = totalWeightsAssigned > 0 
    ? Math.round(accumulatedWeightedScore / totalWeightsAssigned) 
    : 0;

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