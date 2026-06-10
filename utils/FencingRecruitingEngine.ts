// =========================================================================
// 🤺 FENCING POSITIONAL RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type FencingPositionGroup = 'Foil Specialist' | 'Épée Specialist' | 'Sabre Specialist';

export interface FencingThresholds {
  t1: number; // Power 4 D1 / Elite NCAA (Score: 95-99)
  t2: number; // Mid-Major D1 / Top NCAA (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D3 / High Club (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
}

export const FENCING_METRIC_STANDARDS: Record<'Boys' | 'Girls', Record<string, FencingThresholds>> = {
  'Boys': {
    'NationalPoints': { t1: 1000, t2: 750, t3: 500, t4: 250, t5: 100, t6: 50, t7: 10 },
    'WinPct': { t1: 90, t2: 80, t3: 70, t4: 60, t5: 50, t6: 40, t7: 30 },
    'TouchDiffPerBout': { t1: 4.0, t2: 3.0, t3: 2.0, t4: 1.0, t5: 0.0, t6: -1.0, t7: -2.0 }
  },
  'Girls': {
    'NationalPoints': { t1: 1000, t2: 750, t3: 500, t4: 250, t5: 100, t6: 50, t7: 10 },
    'WinPct': { t1: 90, t2: 80, t3: 70, t4: 60, t5: 50, t6: 40, t7: 30 },
    'TouchDiffPerBout': { t1: 4.0, t2: 3.0, t3: 2.0, t4: 1.0, t5: 0.0, t6: -1.0, t7: -2.0 }
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.65,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference / Regional': 1.15,
  'All-State / National': 1.30,
  'Elite Club (USFA National / NAC)': 1.50
};

export const calculateFencingMetricScore = (val: number, thresholds: FencingThresholds): number => {
  if (isNaN(val)) return 10; // Removed < 0 check because Touch Differential can be negative

  if (val >= thresholds.t1) return Math.min(99, Math.round(95 + ((val - thresholds.t1) / Math.max(1, (thresholds.t1 * 0.1))) * 4));
  if (val >= thresholds.t2) return Math.round(85 + ((val - thresholds.t2) / (thresholds.t1 - thresholds.t2)) * 10);
  if (val >= thresholds.t3) return Math.round(75 + ((val - thresholds.t3) / (thresholds.t2 - thresholds.t3)) * 10);
  if (val >= thresholds.t4) return Math.round(65 + ((val - thresholds.t4) / (thresholds.t3 - thresholds.t4)) * 10);
  if (val >= thresholds.t5) return Math.round(55 + ((val - thresholds.t5) / (thresholds.t4 - thresholds.t5)) * 10);
  if (val >= thresholds.t6) return Math.round(40 + ((val - thresholds.t6) / (thresholds.t5 - thresholds.t6)) * 14);
  if (val >= thresholds.t7) return Math.round(20 + ((val - thresholds.t7) / (thresholds.t6 - thresholds.t7)) * 19);
  
  // Prevent negative scoring from extreme negative touch differentials
  return Math.max(10, Math.round((Math.max(0, val - (thresholds.t7 - 2)) / 2) * 20)); 
};

export const compileFencingFitScore = (
  gender: string,
  levelOfPlay: string,
  boutsPlayed: number, // Exposure
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const targetedGender = (gender === 'Girls' || gender === 'Women') ? 'Girls' : 'Boys';
  const genderStandards = FENCING_METRIC_STANDARDS[targetedGender];
  
  const normalizedBouts = Math.max(1, boutsPlayed);
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];
  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number, applyModifier = true) => {
    if (rawVal === null || rawVal === undefined || isNaN(rawVal)) return;

    const standards = genderStandards[thresholdKey];
    
    // National points do not get modified by level, they are an absolute tier
    const modifiedValue = applyModifier ? rawVal * modifier : rawVal;

    const score = calculateFencingMetricScore(modifiedValue, standards);

    accumulatedWeightedScore += (score * weight);
    totalWeightsAssigned += weight;

    trace.push({
      metricLabel: key,
      rawValue: rawVal,
      calibratedScore: score,
      weightAllocation: `${weight * 100}%`
    });
  };

  // USFA National Points are the gold standard. If they don't have them, we shift the weight to WinPct and Touch Diff
  const hasNationalPoints = rawMetrics.nationalPoints && rawMetrics.nationalPoints > 0;

  if (hasNationalPoints) {
    registerResult('National Points', rawMetrics.nationalPoints, 'NationalPoints', 0.50, false);
    registerResult('Regional Win %', rawMetrics.winPct, 'WinPct', 0.30, true);
  } else {
    registerResult('Regional Win %', rawMetrics.winPct, 'WinPct', 0.65, true);
  }

  // Calculate Touch Differential per Bout
  if (rawMetrics.touchesScored !== null && rawMetrics.touchesReceived !== null && rawMetrics.touchesScored !== undefined && rawMetrics.touchesReceived !== undefined) {
    const diff = rawMetrics.touchesScored - rawMetrics.touchesReceived;
    const diffPerBout = diff / normalizedBouts;
    registerResult('Touch Diff/Bout', diffPerBout, 'TouchDiffPerBout', hasNationalPoints ? 0.20 : 0.35, true);
  }

  let finalComposite = totalWeightsAssigned > 0 ? Math.round(accumulatedWeightedScore / totalWeightsAssigned) : 0;
  
  if (!hasNationalPoints) {
    if (levelOfPlay === 'JV / Dev Squad') finalComposite = Math.min(50, finalComposite);
    else if (levelOfPlay === 'Varsity Contributor') finalComposite = Math.min(65, finalComposite);
    else if (levelOfPlay === 'Varsity Starter') finalComposite = Math.min(80, finalComposite);
  }

  return {
    compositeScore: Math.min(99, Math.max(10, finalComposite)),
    analyticalTrace: trace
  };
};