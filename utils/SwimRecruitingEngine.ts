// =========================================================================
// 🏊‍♂️ SWIM & DIVE COMPOSITE RECRUITING ENGINE (DROP-IN CONFIG & UTILITIES) 
// =========================================================================

export type PoolCourseLength = 'SCY' | 'LCM' | 'SCM';

export interface SwimThresholds {
  t1: number; // Power 4 D1 (Score: 95-99)
  t2: number; // Mid-Major D1 (Score: 85-94)
  t3: number; // Top D2 / D1 Walk-On (Score: 75-84)
  t4: number; // Solid D2 / High D3 (Score: 65-74)
  t5: number; // D3 / NAIA Prospect (Score: 55-64)
  t6: number; // Strong Varsity (Score: 40-54)
  t7: number; // Varsity Standard (Score: 20-39)
}

// Strictly calibrated data marks (values normalized in total seconds)
export const SWIM_GENDER_STANDARDS: Record<'Boys' | 'Girls', Record<string, SwimThresholds>> = {
  'Boys': {
    '50 Free': { t1: 20.2, t2: 20.8, t3: 21.3, t4: 21.8, t5: 22.5, t6: 24.0, t7: 25.5 },
    '100 Free': { t1: 44.0, t2: 45.5, t3: 47.0, t4: 48.5, t5: 50.5, t6: 53.5, t7: 56.5 },
    '200 Free': { t1: 97.0, t2: 100.5, t3: 103.0, t4: 106.0, t5: 110.0, t6: 116.0, t7: 124.0 }, // 1:37.0 to 2:04.0
    '500 Free': { t1: 260.0, t2: 270.0, t3: 278.0, t4: 288.0, t5: 300.0, t6: 318.0, t7: 345.0 }, // 4:20.0 to 5:45.0
    '100 Fly': { t1: 48.0, t2: 50.0, t3: 51.5, t4: 53.0, t5: 56.0, t6: 59.5, t7: 64.0 },
    '100 Back': { t1: 48.5, t2: 50.5, t3: 52.0, t4: 54.0, t5: 56.5, t6: 60.0, t7: 64.5 },
    '100 Breast': { t1: 54.0, t2: 56.0, t3: 58.0, t4: 60.0, t5: 62.5, t6: 66.5, t7: 71.0 },
    '200 IM': { t1: 107.0, t2: 111.0, t3: 114.0, t4: 118.0, t5: 123.0, t6: 130.0, t7: 140.0 } // 1:47.0 to 2:20.0
  },
  'Girls': {
    '50 Free': { t1: 22.8, t2: 23.5, t3: 24.2, t4: 25.0, t5: 26.0, t6: 27.5, t7: 29.5 },
    '100 Free': { t1: 50.0, t2: 52.0, t3: 53.5, t4: 55.5, t5: 58.0, t6: 62.0, t7: 66.0 },
    '200 Free': { t1: 108.0, t2: 112.0, t3: 115.0, t4: 118.5, t5: 123.0, t6: 130.0, t7: 140.0 }, // 1:48.0 to 2:20.0
    '500 Free': { t1: 290.0, t2: 300.0, t3: 310.0, t4: 320.0, t5: 335.0, t6: 355.0, t7: 385.0 }, // 4:50.0 to 6:25.0
    '100 Fly': { t1: 54.0, t2: 56.0, t3: 58.0, t4: 60.0, t5: 62.5, t6: 67.0, t7: 73.0 },
    '100 Back': { t1: 54.5, t2: 56.5, t3: 58.5, t4: 60.5, t5: 63.0, t6: 67.5, t7: 73.5 },
    '100 Breast': { t1: 61.5, t2: 64.0, t3: 66.5, t4: 69.0, t5: 72.5, t6: 77.0, t7: 83.0 },
    '200 IM': { t1: 119.0, t2: 123.0, t3: 127.0, t4: 131.0, t5: 136.0, t6: 143.0, t7: 154.0 } // 1:59.0 to 2:34.0
  }
};

export const AVAILABLE_SWIM_EVENTS = Object.keys(SWIM_GENDER_STANDARDS['Boys']);

/**
 * Parses strict swim times safely into numeric seconds
 * Handles: "1:46.50", "46.5", "21.34"
 */
export const parseSwimTimeToSeconds = (timeStr: string): number => {
  const clean = timeStr.replace(/[^\d:.]/g, '').trim();
  if (!clean) return NaN;

  if (clean.includes(':')) {
    const parts = clean.split(':');
    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return (minutes * 60) + seconds;
  }

  const rawNum = parseFloat(clean);
  if (rawNum > 10 && rawNum < 600) return rawNum; 
  return NaN;
};

/**
 * Formats raw seconds back cleanly into MM:SS.ms format for UI rendering
 */
export const formatSecondsToSwimTime = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return '--.--';
  if (totalSeconds < 60) return totalSeconds.toFixed(2);
  
  const mins = Math.floor(totalSeconds / 60);
  const secs = (totalSeconds % 60).toFixed(2);
  return `${mins}:${Number(secs) < 10 ? '0' : ''}${secs}`;
};

/**
 * Converts LCM or SCM times to standard SCY equivalents mathematically
 */
const getCourseModifier = (course: PoolCourseLength): number => {
  if (course === 'LCM') return 0.88; // Long Course Meters to Short Course Yards
  if (course === 'SCM') return 0.893; // Short Course Meters to Short Course Yards
  return 1.0; // SCY base
};

/**
 * Compiles dynamic single metric scores using continuous mathematical interpolation
 */
export const calculateSingleSwimScore = (seconds: number, thresholds: SwimThresholds): number => {
  if (seconds <= thresholds.t1) {
    const bonus = ((thresholds.t1 - seconds) / thresholds.t1) * 20;
    return Math.min(99, Math.round(95 + bonus));
  }
  if (seconds <= thresholds.t2) return Math.round(85 + ((thresholds.t2 - seconds) / (thresholds.t2 - thresholds.t1)) * 10);
  if (seconds <= thresholds.t3) return Math.round(75 + ((thresholds.t3 - seconds) / (thresholds.t3 - thresholds.t2)) * 10);
  if (seconds <= thresholds.t4) return Math.round(65 + ((thresholds.t4 - seconds) / (thresholds.t4 - thresholds.t3)) * 10);
  if (seconds <= thresholds.t5) return Math.round(55 + ((thresholds.t5 - seconds) / (thresholds.t5 - thresholds.t4)) * 10);
  if (seconds <= thresholds.t6) return Math.round(40 + ((thresholds.t6 - seconds) / (thresholds.t6 - thresholds.t5)) * 15);
  if (seconds <= thresholds.t7) return Math.round(20 + ((thresholds.t7 - seconds) / (thresholds.t7 - thresholds.t6)) * 20);
  
  const distanceFromFloor = seconds - thresholds.t7;
  const floorPenalty = Math.min(10, (distanceFromFloor / (thresholds.t7 * 0.2)) * 5);
  return Math.max(10, Math.round(20 - floorPenalty));
};

/**
 * Main Orchestrator: Finds the best events, anchors the top score, and weights versatility.
 */
export const compileSwimFitScore = (
  gender: string,
  metrics: { name: string; value: string }[],
  poolCourse: PoolCourseLength = 'SCY'
): { compositeScore: number; parsedMetrics: any[] } => {
  const targetedGender = (gender === 'Girls' || gender === 'Women') ? 'Girls' : 'Boys';
  const standards = SWIM_GENDER_STANDARDS[targetedGender];
  const difficultyModifier = getCourseModifier(poolCourse);

  const scoredEvents: any[] = [];

  // 1. Parse and score every provided event
  metrics.forEach(m => {
    if (m.value.trim() !== '' && standards[m.name]) {
      const rawSeconds = parseSwimTimeToSeconds(m.value);
      if (!isNaN(rawSeconds)) {
        const adjustedSeconds = rawSeconds * difficultyModifier;
        const calculatedScore = calculateSingleSwimScore(adjustedSeconds, standards[m.name]);
        
        scoredEvents.push({
          name: m.name,
          raw: m.value,
          seconds: rawSeconds,
          adjustedSeconds,
          score: calculatedScore
        });
      }
    }
  });

  if (scoredEvents.length === 0) return { compositeScore: 0, parsedMetrics: [] };

  // 2. Sort by highest score first to identify their specialty "Anchor"
  scoredEvents.sort((a, b) => b.score - a.score);

  // 3. Apply Anchor / Versatility Weighting Math
  let finalComposite = 0;
  
  if (scoredEvents.length === 1) {
    scoredEvents[0].appliedWeight = '100%';
    finalComposite = scoredEvents[0].score;
  } else if (scoredEvents.length === 2) {
    scoredEvents[0].appliedWeight = '70%';
    scoredEvents[1].appliedWeight = '30%';
    finalComposite = (scoredEvents[0].score * 0.70) + (scoredEvents[1].score * 0.30);
  } else {
    scoredEvents[0].appliedWeight = '65%';
    scoredEvents[1].appliedWeight = '25%';
    scoredEvents[2].appliedWeight = '10%';
    finalComposite = (scoredEvents[0].score * 0.65) + (scoredEvents[1].score * 0.25) + (scoredEvents[2].score * 0.10);
    
    // Ignore anything past the top 3 events for the aggregate score, but keep them in the parsedMetrics log
    for (let i = 3; i < scoredEvents.length; i++) {
       scoredEvents[i].appliedWeight = '0% (Log Only)';
    }
  }

  return { 
    compositeScore: Math.min(99, Math.max(10, Math.round(finalComposite))), 
    parsedMetrics: scoredEvents 
  };
};