// =========================================================================
// 🎾 TENNIS RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type TennisPositionGroup = 'Singles Player' | 'Doubles Player';

export interface TennisThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
}

export const TENNIS_METRIC_STANDARDS: Record<'Boys' | 'Girls', Record<string, TennisThresholds>> = {
  'Boys': {
    'UTR': { t1: 12.5, t2: 11.5, t3: 10.5, t4: 9.5, t5: 8.5, t6: 7.5, t7: 6.0 }, // Universal Tennis Rating
    'WinPct': { t1: 90, t2: 80, t3: 70, t4: 60, t5: 50, t6: 40, t7: 30 },
    'CareerWins': { t1: 80, t2: 65, t3: 50, t4: 40, t5: 30, t6: 20, t7: 10 },
    'FirstServePct': { t1: 70, t2: 65, t3: 60, t4: 55, t5: 50, t6: 45, t7: 40 }
  },
  'Girls': {
    'UTR': { t1: 10.5, t2: 9.5, t3: 8.5, t4: 7.5, t5: 6.5, t6: 5.5, t7: 4.5 },
    'WinPct': { t1: 90, t2: 80, t3: 70, t4: 60, t5: 50, t6: 40, t7: 30 },
    'CareerWins': { t1: 80, t2: 65, t3: 50, t4: 40, t5: 30, t6: 20, t7: 10 },
    'FirstServePct': { t1: 70, t2: 65, t3: 60, t4: 55, t5: 50, t6: 45, t7: 40 }
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.70,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference Tier': 1.15,
  'All-State / National': 1.30,
  'Elite Club (ITF / USTA National)': 1.45 // USTA/ITF high-level modifiers
};

export const calculateTennisMetricScore = (val: number, thresholds: TennisThresholds): number => {
  if (isNaN(val) || val < 0) return 10;

  if (val >= thresholds.t1) return Math.min(99, Math.round(95 + ((val - thresholds.t1) / (thresholds.t1 * 0.1)) * 4));
  if (val >= thresholds.t2) return Math.round(85 + ((val - thresholds.t2) / (thresholds.t1 - thresholds.t2)) * 10);
  if (val >= thresholds.t3) return Math.round(75 + ((val - thresholds.t3) / (thresholds.t2 - thresholds.t3)) * 10);
  if (val >= thresholds.t4) return Math.round(65 + ((val - thresholds.t4) / (thresholds.t3 - thresholds.t4)) * 10);
  if (val >= thresholds.t5) return Math.round(55 + ((val - thresholds.t5) / (thresholds.t4 - thresholds.t5)) * 10);
  if (val >= thresholds.t6) return Math.round(40 + ((val - thresholds.t6) / (thresholds.t5 - thresholds.t6)) * 14);
  if (val >= thresholds.t7) return Math.round(20 + ((val - thresholds.t7) / (thresholds.t6 - thresholds.t7)) * 19);
  
  return Math.max(10, Math.round((val / thresholds.t7) * 20));
};

export const compileTennisFitScore = (
  gender: string,
  levelOfPlay: string,
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const targetedGender = (gender === 'Boys' || gender === 'Men') ? 'Boys' : 'Girls';
  const genderStandards = TENNIS_METRIC_STANDARDS[targetedGender];
  
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];
  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  // For UTR, we DO NOT apply the level modifier. UTR is a universal global rating, 
  // so a 10.5 UTR is a 10.5 UTR regardless of whether they play JV or Varsity.
  const registerResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number, applyModifier = true) => {
    if (rawVal === null || rawVal === undefined || isNaN(rawVal) || rawVal === 0) return;

    const standards = genderStandards[thresholdKey];
    const modifiedValue = applyModifier ? rawVal * modifier : rawVal;

    const score = calculateTennisMetricScore(modifiedValue, standards);

    accumulatedWeightedScore += (score * weight);
    totalWeightsAssigned += weight;

    trace.push({
      metricLabel: key,
      rawValue: rawVal,
      calibratedScore: score,
      weightAllocation: `${weight * 100}%`
    });
  };

  // UTR is king in Tennis recruiting. Weights reflect this.
  registerResult('Universal Tennis Rating (UTR)', rawMetrics.utr, 'UTR', 0.60, false); // No modifier for UTR
  registerResult('Overall Win %', rawMetrics.winPct, 'WinPct', 0.20, true);
  registerResult('Career Wins', rawMetrics.careerWins, 'CareerWins', 0.10, true);
  registerResult('First Serve %', rawMetrics.firstServePct, 'FirstServePct', 0.10, true);

  let finalComposite = totalWeightsAssigned > 0 ? Math.round(accumulatedWeightedScore / totalWeightsAssigned) : 0;
  
  // Hard caps for lower competition levels IF they don't have a verified UTR entered
  if (!rawMetrics.utr || rawMetrics.utr === 0) {
    if (levelOfPlay === 'JV / Dev Squad') finalComposite = Math.min(50, finalComposite);
    else if (levelOfPlay === 'Varsity Contributor') finalComposite = Math.min(70, finalComposite);
  }

  return {
    compositeScore: Math.min(99, Math.max(10, finalComposite)),
    analyticalTrace: trace
  };
};