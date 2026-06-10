// =========================================================================
// 🤽‍♂️ WATER POLO POSITIONAL RECRUITING ENGINE & PERFORMANCE BASES
// =========================================================================

export type WaterPoloPositionGroup = 'Driver' | 'Utility' | 'Center Forward (2M Attack)' | 'Center Defender (2M Guard)' | 'Goalkeeper';

export interface WaterPoloThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
}

export const WATER_POLO_METRIC_STANDARDS: Record<'Boys' | 'Girls', Record<string, WaterPoloThresholds>> = {
  'Boys': {
    'GoalsPerGame': { t1: 3.5, t2: 2.8, t3: 2.2, t4: 1.5, t5: 1.0, t6: 0.5, t7: 0.2 },
    'AssistsPerGame': { t1: 2.5, t2: 2.0, t3: 1.5, t4: 1.0, t5: 0.6, t6: 0.3, t7: 0.1 },
    'StealsPerGame': { t1: 3.0, t2: 2.4, t3: 1.8, t4: 1.2, t5: 0.8, t6: 0.4, t7: 0.2 },
    'SprintsPerGame': { t1: 1.5, t2: 1.2, t3: 0.9, t4: 0.6, t5: 0.4, t6: 0.2, t7: 0.1 },
    'SavesPerGame': { t1: 12.0, t2: 10.0, t3: 8.0, t4: 6.0, t5: 4.5, t6: 3.0, t7: 1.5 },
    'SavePct': { t1: 0.65, t2: 0.60, t3: 0.55, t4: 0.50, t5: 0.45, t6: 0.40, t7: 0.35 }
  },
  'Girls': {
    'GoalsPerGame': { t1: 3.0, t2: 2.4, t3: 1.8, t4: 1.2, t5: 0.8, t6: 0.4, t7: 0.1 },
    'AssistsPerGame': { t1: 2.2, t2: 1.8, t3: 1.3, t4: 0.9, t5: 0.5, t6: 0.2, t7: 0.1 },
    'StealsPerGame': { t1: 2.8, t2: 2.2, t3: 1.6, t4: 1.0, t5: 0.7, t6: 0.3, t7: 0.1 },
    'SprintsPerGame': { t1: 1.2, t2: 0.9, t3: 0.7, t4: 0.5, t5: 0.3, t6: 0.1, t7: 0.05 },
    'SavesPerGame': { t1: 11.0, t2: 9.0, t3: 7.0, t4: 5.5, t5: 4.0, t6: 2.5, t7: 1.0 },
    'SavePct': { t1: 0.62, t2: 0.58, t3: 0.53, t4: 0.48, t5: 0.43, t6: 0.38, t7: 0.33 }
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.65,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference / Regional': 1.15,
  'All-State / National': 1.30,
  'Elite Club (ODP / Junior Olympics)': 1.45
};

export const calculateWaterPoloMetricScore = (val: number, thresholds: WaterPoloThresholds): number => {
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

export const compileWaterPoloFitScore = (
  gender: string,
  positionGroup: WaterPoloPositionGroup,
  levelOfPlay: string,
  gamesPlayed: number,
  rawMetrics: Record<string, number | null>
): { compositeScore: number; analyticalTrace: any[] } => {
  const targetedGender = (gender === 'Girls' || gender === 'Women') ? 'Girls' : 'Boys';
  const genderStandards = WATER_POLO_METRIC_STANDARDS[targetedGender];
  
  const normalizedGames = Math.max(1, gamesPlayed);
  const modifier = LEVEL_MODIFIERS[levelOfPlay] || 1.0;
  const trace: any[] = [];
  let accumulatedWeightedScore = 0;
  let totalWeightsAssigned = 0;

  const registerResult = (key: string, rawVal: number | null | undefined, thresholdKey: string, weight: number, isPerGame = true) => {
    if (rawVal === null || rawVal === undefined || isNaN(rawVal)) return;

    let targetValue = isPerGame ? (rawVal / normalizedGames) : rawVal;

    // Auto-correct percentages (if they enter 60 instead of 0.60)
    if (thresholdKey === 'SavePct' && targetValue > 1) {
      targetValue = targetValue / 100;
    }

    const standards = genderStandards[thresholdKey];
    
    // Percentages aren't affected by volume multipliers the same way
    const modifiedValue = thresholdKey === 'SavePct' ? targetValue * (1 + (modifier - 1) * 0.5) : targetValue * modifier;
    const score = calculateWaterPoloMetricScore(modifiedValue, standards);

    accumulatedWeightedScore += (score * weight);
    totalWeightsAssigned += weight;

    trace.push({
      metricLabel: key,
      perGameRate: targetValue,
      calibratedScore: score,
      weightAllocation: `${weight * 100}%`
    });
  };

  if (positionGroup === 'Goalkeeper') {
    registerResult('Saves', rawMetrics.saves, 'SavesPerGame', 0.60);
    registerResult('Save %', rawMetrics.savePct, 'SavePct', 0.40, false);
  } else {
    // Dynamic weight shifting based on field position
    if (positionGroup === 'Center Forward (2M Attack)') {
      registerResult('Goals', rawMetrics.goals, 'GoalsPerGame', 0.55);
      registerResult('Steals', rawMetrics.steals, 'StealsPerGame', 0.20);
      registerResult('Assists', rawMetrics.assists, 'AssistsPerGame', 0.15);
      registerResult('Sprints Won', rawMetrics.sprints, 'SprintsPerGame', 0.10);
    } else if (positionGroup === 'Center Defender (2M Guard)') {
      registerResult('Steals', rawMetrics.steals, 'StealsPerGame', 0.45);
      registerResult('Assists', rawMetrics.assists, 'AssistsPerGame', 0.30);
      registerResult('Goals', rawMetrics.goals, 'GoalsPerGame', 0.15);
      registerResult('Sprints Won', rawMetrics.sprints, 'SprintsPerGame', 0.10);
    } else { // Driver or Utility
      registerResult('Goals', rawMetrics.goals, 'GoalsPerGame', 0.35);
      registerResult('Assists', rawMetrics.assists, 'AssistsPerGame', 0.30);
      registerResult('Steals', rawMetrics.steals, 'StealsPerGame', 0.25);
      registerResult('Sprints Won', rawMetrics.sprints, 'SprintsPerGame', 0.10);
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