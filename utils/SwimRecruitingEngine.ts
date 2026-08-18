// =========================================================================
// 🏊‍♂️ SWIM & DIVE COMPOSITE RECRUITING ENGINE (UNWEIGHTED)
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
// These thresholds reflect SCY (Short Course Yards) typical recruiting standards
export const SWIM_GENDER_STANDARDS: Record<'Boys' | 'Girls', Record<string, SwimThresholds>> = {
  'Boys': {
    '50 Free': { t1: 20.2, t2: 20.8, t3: 21.3, t4: 21.8, t5: 22.5, t6: 24.0, t7: 25.5 },
    '100 Free': { t1: 44.0, t2: 45.5, t3: 47.0, t4: 48.5, t5: 50.5, t6: 53.5, t7: 56.5 },
    '200 Free': { t1: 97.0, t2: 100.5, t3: 103.0, t4: 106.0, t5: 110.0, t6: 116.0, t7: 124.0 }, 
    '500 Free': { t1: 260.0, t2: 270.0, t3: 278.0, t4: 288.0, t5: 300.0, t6: 318.0, t7: 345.0 }, 
    '1000 Free': { t1: 545.0, t2: 560.0, t3: 575.0, t4: 595.0, t5: 620.0, t6: 660.0, t7: 700.0 }, 
    '1650 Free': { t1: 915.0, t2: 945.0, t3: 975.0, t4: 1005.0, t5: 1050.0, t6: 1110.0, t7: 1200.0 }, 
    '100 Fly': { t1: 48.0, t2: 50.0, t3: 51.5, t4: 53.0, t5: 56.0, t6: 59.5, t7: 64.0 },
    '200 Fly': { t1: 106.0, t2: 110.0, t3: 114.0, t4: 118.0, t5: 124.0, t6: 132.0, t7: 145.0 },
    '100 Back': { t1: 48.5, t2: 50.5, t3: 52.0, t4: 54.0, t5: 56.5, t6: 60.0, t7: 64.5 },
    '200 Back': { t1: 105.0, t2: 109.0, t3: 113.0, t4: 117.0, t5: 122.0, t6: 130.0, t7: 140.0 },
    '100 Breast': { t1: 54.0, t2: 56.0, t3: 58.0, t4: 60.0, t5: 62.5, t6: 66.5, t7: 71.0 },
    '200 Breast': { t1: 118.0, t2: 123.0, t3: 128.0, t4: 133.0, t5: 139.0, t6: 148.0, t7: 160.0 },
    '200 IM': { t1: 107.0, t2: 111.0, t3: 114.0, t4: 118.0, t5: 123.0, t6: 130.0, t7: 140.0 }, 
    '400 IM': { t1: 229.0, t2: 236.0, t3: 244.0, t4: 252.0, t5: 262.0, t6: 280.0, t7: 300.0 }
  },
  'Girls': {
    '50 Free': { t1: 22.8, t2: 23.5, t3: 24.2, t4: 25.0, t5: 26.0, t6: 27.5, t7: 29.5 },
    '100 Free': { t1: 50.0, t2: 52.0, t3: 53.5, t4: 55.5, t5: 58.0, t6: 62.0, t7: 66.0 },
    '200 Free': { t1: 108.0, t2: 112.0, t3: 115.0, t4: 118.5, t5: 123.0, t6: 130.0, t7: 140.0 },
    '500 Free': { t1: 290.0, t2: 300.0, t3: 310.0, t4: 320.0, t5: 335.0, t6: 355.0, t7: 385.0 }, 
    '1000 Free': { t1: 590.0, t2: 610.0, t3: 630.0, t4: 650.0, t5: 680.0, t6: 720.0, t7: 780.0 }, 
    '1650 Free': { t1: 980.0, t2: 1010.0, t3: 1040.0, t4: 1070.0, t5: 1110.0, t6: 1170.0, t7: 1260.0 }, 
    '100 Fly': { t1: 54.0, t2: 56.0, t3: 58.0, t4: 60.0, t5: 62.5, t6: 67.0, t7: 73.0 },
    '200 Fly': { t1: 118.0, t2: 123.0, t3: 128.0, t4: 133.0, t5: 140.0, t6: 150.0, t7: 165.0 },
    '100 Back': { t1: 54.5, t2: 56.5, t3: 58.5, t4: 60.5, t5: 63.0, t6: 67.5, t7: 73.5 },
    '200 Back': { t1: 116.0, t2: 120.0, t3: 124.0, t4: 129.0, t5: 135.0, t6: 145.0, t7: 158.0 },
    '100 Breast': { t1: 61.5, t2: 64.0, t3: 66.5, t4: 69.0, t5: 72.5, t6: 77.0, t7: 83.0 },
    '200 Breast': { t1: 132.0, t2: 137.0, t3: 142.0, t4: 148.0, t5: 156.0, t6: 168.0, t7: 185.0 },
    '200 IM': { t1: 119.0, t2: 123.0, t3: 127.0, t4: 131.0, t5: 136.0, t6: 143.0, t7: 154.0 }, 
    '400 IM': { t1: 255.0, t2: 263.0, t3: 272.0, t4: 282.0, t5: 295.0, t6: 315.0, t7: 340.0 } 
  }
};

export const AVAILABLE_SWIM_EVENTS = Object.keys(SWIM_GENDER_STANDARDS['Boys']);

/**
 * Universal Shared Tier Mapper for Swimming UI displays
 */
export const getSwimTierLabel = (score: number) => {
  if (score >= 95) return { text: 'Power 4 D1 Elite', color: 'from-sky-400 to-indigo-500 shadow-sky-500/20', solid: 'text-sky-400' };
  if (score >= 85) return { text: 'Mid-Major D1 Priority', color: 'from-blue-400 to-cyan-500 shadow-blue-500/20', solid: 'text-blue-400' };
  if (score >= 75) return { text: 'Top D2 / D1 Walk-on', color: 'from-cyan-400 to-teal-500 shadow-cyan-500/20', solid: 'text-cyan-400' };
  if (score >= 65) return { text: 'Solid D2 / High D3', color: 'from-teal-400 to-emerald-500 shadow-teal-500/20', solid: 'text-teal-400' };
  if (score >= 55) return { text: 'D3 / NAIA Prospect', color: 'from-emerald-400 to-green-500 shadow-emerald-500/20', solid: 'text-emerald-400' };
  if (score >= 40) return { text: 'Strong Varsity', color: 'from-slate-400 to-slate-600 shadow-slate-500/20', solid: 'text-slate-400' };
  return { text: 'Developing Varsity', color: 'from-slate-600 to-slate-800 shadow-slate-500/20', solid: 'text-slate-500' };
};

/**
 * Parses strict swim times safely into numeric seconds
 * Handles: "17:01.50", "46.5", "1:46.50", "21.34"
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
  if (rawNum > 10 && rawNum < 2000) return rawNum; 
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
  if (course === 'LCM') return 0.88; 
  if (course === 'SCM') return 0.893; 
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
 * Main Orchestrator: Finds the events, computes them, and returns an unweighted pure average.
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

  // 2. Sort by highest score first to display the best events at the top of the UI
  scoredEvents.sort((a, b) => b.score - a.score);

  // 3. Compute Unweighted Pure Average
  const totalScore = scoredEvents.reduce((sum, ev) => sum + ev.score, 0);
  const finalComposite = totalScore / scoredEvents.length;

  return { 
    compositeScore: Math.min(99, Math.max(10, Math.round(finalComposite))), 
    parsedMetrics: scoredEvents 
  };
};