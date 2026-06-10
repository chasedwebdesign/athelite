// =========================================================================
// 🎳 BOWLING POSITIONAL RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type BowlingPositionGroup = 'Bowler';

export interface BowlingThresholds {
  t1: number; // Power 4 D1 / Tier 1 (Score: 95-99)
  t2: number; // Mid-Major D1 / Tier 2 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
}

export const BOWLING_METRIC_STANDARDS: Record<'Boys' | 'Girls', Record<string, BowlingThresholds>> = {
  'Boys': {
    'SeasonAverage': { t1: 220, t2: 210, t3: 200, t4: 190, t5: 180, t6: 170, t7: 150 },
    'HighGame': { t1: 290, t2: 279, t3: 265, t4: 250, t5: 235, t6: 220, t7: 200 },
    'HighSeries': { t1: 780, t2: 740, t3: 700, t4: 660, t5: 620, t6: 580, t7: 520 },
    'StrikePct': { t1: 60, t2: 55, t3: 50, t4: 45, t5: 40, t6: 35, t7: 30 },
    'SparePct': { t1: 85, t2: 80, t3: 75, t4: 70, t5: 65, t6: 60, t7: 50 }
  },
  'Girls': {
    'SeasonAverage': { t1: 205, t2: 195, t3: 185, t4: 175, t5: 165, t6: 155, t7: 135 },
    'HighGame': { t1: 279, t2: 265, t3: 250, t4: 235, t5: 220, t6: 200, t7: 180 },
    'HighSeries': { t1: 740, t2: 700, t3: 660, t4: 620, t5: 580, t6: 540, t7: 480 },
    'StrikePct': { t1: 50, t2: 45, t3: 40, t4: 35, t5: 30, t6: 25, t7: 20 },
    'SparePct': { t1: 85, t2: 80, t3: 75, t4: 70, t5: 65, t6: 60, t7: 50 }
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.75,
  'Varsity Contributor': 0.90,
  'Varsity Starter': 1.0,
  'All-Conference Tier': 1.05,
  'All-State / National': 1.15,
  'USBC Junior Gold / Elite': 1.25
};

export const calculateBowlingMetricScore = (val: number, thresholds: BowlingThresholds): number => {
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

export const compileBowlingFitScore = (
  gender: string,
  levelOfPlay: string,
  gamesPlayed: number, // Acts as exposure/reliability
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const targetedGender = (gender === 'Girls' || gender === 'Women') ? 'Girls' : 'Boys';
  const genderStandards = BOWLING_METRIC_STANDARDS[targetedGender];
  
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];
  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number) => {
    if (rawVal === null || rawVal === undefined || isNaN(rawVal) || rawVal === 0) return;

    let targetValue = rawVal;

    // Auto-correct percentages if they enter decimals (0.60 instead of 60)
    if ((thresholdKey === 'StrikePct' || thresholdKey === 'SparePct') && targetValue > 0 && targetValue <= 1) {
      targetValue = targetValue * 100;
    }

    const standards = genderStandards[thresholdKey];
    const modifiedValue = targetValue * modifier;
    const score = calculateBowlingMetricScore(modifiedValue, standards);

    accumulatedWeightedScore += (score * weight);
    totalWeightsAssigned += weight;

    trace.push({
      metricLabel: key,
      rawValue: rawVal,
      calibratedScore: score,
      weightAllocation: `${weight * 100}%`
    });
  };

  // Weight distribution: Averages and consistency matter most
  registerResult('Season Avg', rawMetrics.seasonAvg, 'SeasonAverage', 0.45);
  registerResult('Strike %', rawMetrics.strikePct, 'StrikePct', 0.20);
  registerResult('Spare %', rawMetrics.sparePct, 'SparePct', 0.20);
  registerResult('High Game', rawMetrics.highGame, 'HighGame', 0.05);
  registerResult('High Series', rawMetrics.highSeries, 'HighSeries', 0.10);

  let finalComposite = totalWeightsAssigned > 0 ? Math.round(accumulatedWeightedScore / totalWeightsAssigned) : 0;
  
  // Reliability bump: if they have bowled a significant number of games, bump their score slightly
  if (gamesPlayed >= 40 && finalComposite > 0) {
    finalComposite = Math.min(99, finalComposite + 2);
  }

  // Soft Caps for lower competition
  if (levelOfPlay === 'JV / Dev Squad') finalComposite = Math.min(55, finalComposite);
  else if (levelOfPlay === 'Varsity Contributor') finalComposite = Math.min(75, finalComposite);

  return {
    compositeScore: Math.min(99, Math.max(10, finalComposite)),
    analyticalTrace: trace
  };
};