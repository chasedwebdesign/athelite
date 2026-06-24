export type XCDifficulty = 'fast' | 'standard' | 'tactical';

export interface XCThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
}

export const XC_GENDER_STANDARDS: Record<'Boys' | 'Girls', Record<'5K XC' | '3-Mile XC', XCThresholds>> = {
  'Boys': {
    '5K XC': { t1: 900, t2: 935, t3: 965, t4: 1000, t5: 1045, t6: 1110, t7: 1200 },
    '3-Mile XC': { t1: 855, t2: 890, t3: 920, t4: 955, t5: 1000, t6: 1060, t7: 1140 }
  },
  'Girls': {
    '5K XC': { t1: 1040, t2: 1085, t3: 1130, t4: 1180, t5: 1245, t6: 1335, t7: 1470 },
    '3-Mile XC': { t1: 990, t2: 1030, t3: 1075, t4: 1125, t5: 1190, t6: 1280, t7: 1410 }
  }
};

export const parseXCTimeToSeconds = (timeStr: string): number => {
  const clean = timeStr.replace(/[^\d:.]/g, '').trim();
  if (!clean) return NaN;

  if (clean.includes(':')) {
    const parts = clean.split(':');
    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return (minutes * 60) + seconds;
  }

  const rawNum = parseFloat(clean);
  if (rawNum > 300 && rawNum < 3600) return rawNum; 
  return NaN;
};

export const formatSecondsToXCTime = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return '--:--';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const calculateSingleXCScore = (seconds: number, thresholds: XCThresholds): number => {
  if (seconds <= thresholds.t1) {
    const bonus = ((thresholds.t1 - seconds) / thresholds.t1) * 20;
    return Math.min(99, Math.round(95 + bonus));
  }
  if (seconds <= thresholds.t2) return Math.round(85 + ((thresholds.t2 - seconds) / (thresholds.t2 - thresholds.t1)) * 10);
  if (seconds <= thresholds.t3) return Math.round(75 + ((thresholds.t3 - seconds) / (thresholds.t3 - thresholds.t2)) * 10);
  if (seconds <= thresholds.t4) return Math.round(65 + ((thresholds.t4 - seconds) / (thresholds.t4 - thresholds.t3)) * 10);
  if (seconds <= thresholds.t5) return Math.round(55 + ((thresholds.t5 - seconds) / (thresholds.t5 - thresholds.t4)) * 10);
  if (seconds <= thresholds.t6) return Math.round(40 + ((thresholds.t6 - seconds) / (thresholds.t6 - thresholds.t5)) * 15);
  if (seconds <= thresholds.t7) return Math.round(20 + ((thresholds.t7 - seconds) / (thresholds.t7 - thresholds.t6)) * 19);
  
  const distanceFromFloor = seconds - thresholds.t7;
  // 🚨 NEW UX UPGRADE: Limit the penalty to 5 points so the absolute floor rests securely at 15
  const floorPenalty = Math.min(5, (distanceFromFloor / 120) * 5);
  return Math.max(15, Math.round(20 - floorPenalty));
};

export const compileCrossCountryFitScore = (
  gender: string,
  metrics: { name: string; value: string }[],
  courseDifficulty: XCDifficulty = 'standard'
): { compositeScore: number; parsedMetrics: any[] } => {
  const targetedGender = (gender === 'Girls' || gender === 'Women') ? 'Girls' : 'Boys';
  const standards = XC_GENDER_STANDARDS[targetedGender];

  let difficultyModifier = 1.0;
  if (courseDifficulty === 'fast') difficultyModifier = 1.02;
  if (courseDifficulty === 'tactical') difficultyModifier = 0.97;

  let totalWeightedScore = 0;
  let runningWeightsAccumulated = 0;
  const processedResults: any[] = [];

  const m5k = metrics.find(m => m.name === '5K XC');
  const m3m = metrics.find(m => m.name === '3-Mile XC');

  if (m5k && m5k.value.trim() !== '') {
    const rawSeconds = parseXCTimeToSeconds(m5k.value);
    if (!isNaN(rawSeconds)) {
      const adjustedSeconds = rawSeconds * difficultyModifier;
      const calculatedScore = calculateSingleXCScore(adjustedSeconds, standards['5K XC']);
      const allocatedWeight = (m3m && m3m.value.trim() !== '') ? 0.70 : 1.0;
      totalWeightedScore += (calculatedScore * allocatedWeight);
      runningWeightsAccumulated += allocatedWeight;

      processedResults.push({ name: '5K XC', raw: m5k.value, seconds: rawSeconds, adjustedSeconds, score: calculatedScore });
    }
  }

  if (m3m && m3m.value.trim() !== '') {
    const rawSeconds = parseXCTimeToSeconds(m3m.value);
    if (!isNaN(rawSeconds)) {
      const adjustedSeconds = rawSeconds * difficultyModifier;
      const calculatedScore = calculateSingleXCScore(adjustedSeconds, standards['3-Mile XC']);
      const allocatedWeight = (m5k && m5k.value.trim() !== '') ? 0.30 : 1.0;
      totalWeightedScore += (calculatedScore * allocatedWeight);
      runningWeightsAccumulated += allocatedWeight;

      processedResults.push({ name: '3-Mile XC', raw: m3m.value, seconds: rawSeconds, adjustedSeconds, score: calculatedScore });
    }
  }

  // 🚨 NEW UX UPGRADE: Minimum composite clamp set to 15
  const finalComposite = runningWeightsAccumulated > 0 
    ? Math.min(99, Math.max(15, Math.round(totalWeightedScore / runningWeightsAccumulated)))
    : 0;

  return { compositeScore: finalComposite, parsedMetrics: processedResults };
};