// =========================================================================
// ⛳ GOLF RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type GolfPositionGroup = 'Golfer';

export interface GolfThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
  inverse?: boolean; // Used for stats where lower is better (Scoring Average)
}

export const GOLF_METRIC_STANDARDS: Record<'Boys' | 'Girls', Record<string, GolfThresholds>> = {
  'Boys': {
    'Avg18': { t1: 71, t2: 73, t3: 75, t4: 78, t5: 82, t6: 86, t7: 92, inverse: true },
    'Avg9': { t1: 35, t2: 36, t3: 37, t4: 39, t5: 41, t6: 43, t7: 46, inverse: true },
    'DrivingDistance': { t1: 300, t2: 285, t3: 270, t4: 260, t5: 250, t6: 230, t7: 210 },
    'TournamentWins': { t1: 10, t2: 7, t3: 5, t4: 3, t5: 2, t6: 1, t7: 0.5 } // Career/Season significant wins
  },
  'Girls': {
    'Avg18': { t1: 74, t2: 77, t3: 80, t4: 84, t5: 88, t6: 94, t7: 100, inverse: true },
    'Avg9': { t1: 37, t2: 38, t3: 40, t4: 42, t5: 44, t6: 47, t7: 50, inverse: true },
    'DrivingDistance': { t1: 240, t2: 230, t3: 220, t4: 205, t5: 195, t6: 180, t7: 160 },
    'TournamentWins': { t1: 10, t2: 7, t3: 5, t4: 3, t5: 2, t6: 1, t7: 0.5 }
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.70,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference Tier': 1.15,
  'All-State / National': 1.30,
  'Elite Club (AJGA / Junior Am)': 1.45
};

export const calculateGolfMetricScore = (val: number, thresholds: GolfThresholds): number => {
  if (isNaN(val) || val < 0) return 10;

  if (thresholds.inverse) {
    if (val <= thresholds.t1) return Math.min(99, Math.round(95 + ((thresholds.t1 - val) / (thresholds.t1 * 0.05)) * 4));
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

export const compileGolfFitScore = (
  gender: string,
  levelOfPlay: string,
  tournamentsPlayed: number, // Acts as exposure/reliability
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const targetedGender = (gender === 'Boys' || gender === 'Men') ? 'Boys' : 'Girls';
  const genderStandards = GOLF_METRIC_STANDARDS[targetedGender];
  
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];
  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number, isInverse = false) => {
    if (rawVal === null || rawVal === undefined || isNaN(rawVal) || rawVal === 0) return;

    const standards = genderStandards[thresholdKey];
    
    // For inverse stats (like 18-Hole Avg), multiplying by a >1.0 modifier makes the score worse (higher). 
    // This perfectly penalizes JV/weak conference golfers who shoot a 78 vs a National kid who shoots a 78.
    let modifiedValue = rawVal;
    if (isInverse) {
      modifiedValue = rawVal * (1 + (1 - modifier)); 
    } else {
      modifiedValue = rawVal * modifier;
    }

    const score = calculateGolfMetricScore(modifiedValue, standards);

    accumulatedWeightedScore += (score * weight);
    totalWeightsAssigned += weight;

    trace.push({
      metricLabel: key,
      rawValue: rawVal,
      calibratedScore: score,
      weightAllocation: `${weight * 100}%`
    });
  };

  // 18-hole carries the most weight. If they only play 9-hole, we fallback to 9-hole carrying the weight.
  if (rawMetrics.avg18 && rawMetrics.avg18 > 0) {
    registerResult('18-Hole Avg', rawMetrics.avg18, 'Avg18', 0.65, true);
    registerResult('9-Hole Avg', rawMetrics.avg9, 'Avg9', 0.10, true);
  } else {
    registerResult('9-Hole Avg', rawMetrics.avg9, 'Avg9', 0.75, true);
  }

  registerResult('Driving Dist.', rawMetrics.drive, 'DrivingDistance', 0.15, false);
  registerResult('Tourney Wins', rawMetrics.wins, 'TournamentWins', 0.10, false);

  let finalComposite = totalWeightsAssigned > 0 ? Math.round(accumulatedWeightedScore / totalWeightsAssigned) : 0;
  
  // Reliability bump: if they have played many tournaments, give a slight bump to the composite score for proven consistency
  if (tournamentsPlayed > 15 && finalComposite > 0) {
    finalComposite = Math.min(99, finalComposite + 2);
  }

  if (levelOfPlay === 'JV / Dev Squad') finalComposite = Math.min(60, finalComposite);
  else if (levelOfPlay === 'Varsity Contributor') finalComposite = Math.min(75, finalComposite);

  return {
    compositeScore: Math.min(99, Math.max(10, finalComposite)),
    analyticalTrace: trace
  };
};