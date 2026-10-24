// ==========================================
// 🚨 PROPRIETARY RECRUITING STANDARDS ENGINE 🚨
// ==========================================

export type MetricType =
  | 'time'
  | 'distance'
  | 'stat'
  | 'inverse_stat'
  | 'measurable'
  | 'inverse_measurable';

export interface Standard {
  t1: number;
  t2: number;
  t3: number;
  t4: number;
  t5: number;
  t6: number;
  t7: number;
  type: MetricType;
}

export interface ImpactBucketOption {
  id: 'tier_4' | 'tier_3' | 'tier_2' | 'tier_1';
  label: string;
  subLabel: string;
  score: number;
  badge: string;
}

export interface CombineMetricPrompt {
  metricName: string;
  shortLabel: string;
  placeholder: string;
  unitHint: string;
}

export interface PositionBlueprint {
  impactTitle: string;
  impactSubtitle: string;
  impactBuckets: ImpactBucketOption[];
  combinePrompts: CombineMetricPrompt[];
}

export const UNIVERSAL_STANDARDS: Record<string, Record<string, Record<string, Standard>>> = {
  'Boys': {
    'Track & Field': {
      '55 Meters': { t1: 6.30, t2: 6.45, t3: 6.60, t4: 6.75, t5: 6.95, t6: 7.15, t7: 7.55, type: 'time' },
      '60 Meters': { t1: 6.75, t2: 6.90, t3: 7.05, t4: 7.20, t5: 7.40, t6: 7.60, t7: 8.00, type: 'time' },
      '100 Meters': { t1: 10.5, t2: 10.7, t3: 10.9, t4: 11.1, t5: 11.4, t6: 11.8, t7: 12.5, type: 'time' },
      '200 Meters': { t1: 21.2, t2: 21.7, t3: 22.1, t4: 22.6, t5: 23.2, t6: 24.2, t7: 25.5, type: 'time' },
      '300 Meters': { t1: 34.0, t2: 34.8, t3: 35.5, t4: 36.5, t5: 37.8, t6: 39.5, t7: 42.0, type: 'time' },
      '400 Meters': { t1: 47.5, t2: 48.8, t3: 50.0, t4: 51.0, t5: 52.5, t6: 54.5, t7: 57.0, type: 'time' },
      '500 Meters': { t1: 64.0, t2: 66.0, t3: 68.0, t4: 70.0, t5: 72.5, t6: 76.0, t7: 81.0, type: 'time' },
      '600 Meters': { t1: 80.0, t2: 82.5, t3: 85.0, t4: 87.5, t5: 91.0, t6: 95.0, t7: 102.0, type: 'time' },
      '800 Meters': { t1: 111, t2: 114, t3: 116, t4: 119, t5: 124, t6: 130, t7: 140, type: 'time' },
      '1000 Meters': { t1: 147, t2: 151, t3: 155, t4: 160, t5: 167, t6: 175, t7: 190, type: 'time' },
      '1500 Meters': { t1: 231, t2: 239, t3: 244, t4: 250, t5: 264, t6: 275, t7: 300, type: 'time' },
      '1600 Meters': { t1: 248, t2: 256, t3: 262, t4: 268, t5: 280, t6: 295, t7: 320, type: 'time' },
      '1 Mile': { t1: 250, t2: 258, t3: 264, t4: 270, t5: 282, t6: 297, t7: 322, type: 'time' },
      '3000 Meters': { t1: 503, t2: 521, t3: 535, t4: 549, t5: 577, t6: 605, t7: 670, type: 'time' },
      '3200 Meters': { t1: 540, t2: 560, t3: 575, t4: 590, t5: 620, t6: 650, t7: 720, type: 'time' },
      '2 Mile': { t1: 543, t2: 563, t3: 578, t4: 593, t5: 623, t6: 653, t7: 724, type: 'time' },
      '55m Hurdles': { t1: 7.30, t2: 7.50, t3: 7.70, t4: 7.95, t5: 8.25, t6: 8.70, t7: 9.50, type: 'time' },
      '60m Hurdles': { t1: 7.85, t2: 8.05, t3: 8.25, t4: 8.50, t5: 8.85, t6: 9.30, t7: 10.20, type: 'time' },
      '100m Hurdles': { t1: 13.8, t2: 14.2, t3: 14.6, t4: 15.0, t5: 15.5, t6: 16.5, t7: 18.5, type: 'time' },
      '110m Hurdles': { t1: 13.8, t2: 14.2, t3: 14.6, t4: 15.0, t5: 15.5, t6: 16.5, t7: 18.5, type: 'time' },
      '300m Hurdles': { t1: 37.0, t2: 38.5, t3: 39.5, t4: 41.0, t5: 42.5, t6: 44.5, t7: 48.0, type: 'time' },
      '400m Hurdles': { t1: 52.0, t2: 54.0, t3: 55.5, t4: 57.5, t5: 60.0, t6: 63.5, t7: 68.0, type: 'time' },
      'Long Jump': { t1: 288, t2: 276, t3: 264, t4: 252, t5: 240, t6: 228, t7: 204, type: 'distance' },
      'Triple Jump': { t1: 588, t2: 564, t3: 540, t4: 516, t5: 492, t6: 468, t7: 420, type: 'distance' },
      'High Jump': { t1: 82, t2: 78, t3: 76, t4: 74, t5: 70, t6: 66, t7: 60, type: 'distance' },
      'Pole Vault': { t1: 198, t2: 186, t3: 174, t4: 162, t5: 150, t6: 132, t7: 108, type: 'distance' },
      'Shot Put': { t1: 720, t2: 660, t3: 600, t4: 540, t5: 480, t6: 444, t7: 360, type: 'distance' },
      'Discus': { t1: 2220, t2: 2040, t3: 1860, t4: 1740, t5: 1620, t6: 1440, t7: 1080, type: 'distance' },
      'Javelin': { t1: 2340, t2: 2160, t3: 2040, t4: 1920, t5: 1800, t6: 1620, t7: 1200, type: 'distance' }
    },
    'Football': {
      '40-Yard Dash (Sec)': { t1: 4.48, t2: 4.58, t3: 4.68, t4: 4.78, t5: 4.90, t6: 5.05, t7: 5.30, type: 'time' },
      '10-Yard Split (Sec)': { t1: 1.52, t2: 1.57, t3: 1.62, t4: 1.68, t5: 1.74, t6: 1.82, t7: 1.95, type: 'time' },
      '5-10-5 Shuttle (Sec)': { t1: 4.12, t2: 4.24, t3: 4.35, t4: 4.46, t5: 4.58, t6: 4.75, t7: 5.00, type: 'time' },
      'Vertical Jump (Inches)': { t1: 36, t2: 33, t3: 31, t4: 29, t5: 27, t6: 24, t7: 20, type: 'measurable' },
      'Broad Jump': { t1: 120, t2: 114, t3: 108, t4: 102, t5: 96, t6: 90, t7: 80, type: 'distance' },
      'Bench Press Max (Lbs)': { t1: 315, t2: 285, t3: 260, t4: 235, t5: 210, t6: 185, t7: 155, type: 'measurable' }
    },
    'Basketball': {
      'Standing Reach': { t1: 104, t2: 100, t3: 96, t4: 93, t5: 90, t6: 86, t7: 82, type: 'distance' },
      'Vertical Jump (Inches)': { t1: 36, t2: 33, t3: 30, t4: 28, t5: 25, t6: 22, t7: 18, type: 'measurable' },
      'Points (Per Game)': { t1: 22, t2: 18, t3: 15, t4: 12, t5: 10, t6: 7, t7: 4, type: 'stat' },
      'Rebounds (Per Game)': { t1: 10, t2: 8, t3: 7, t4: 5, t5: 4, t6: 3, t7: 2, type: 'stat' },
      'Assists (Per Game)': { t1: 7, t2: 5, t3: 4, t4: 3, t5: 2, t6: 1, t7: 0.5, type: 'stat' },
      'Field Goal % (Season)': { t1: 58, t2: 53, t3: 48, t4: 45, t5: 42, t6: 38, t7: 35, type: 'stat' },
      '3-Point % (Season)': { t1: 42, t2: 38, t3: 35, t4: 32, t5: 28, t6: 25, t7: 22, type: 'stat' }
    },
    'Baseball': {
      'Fastball Velocity (MPH)': { t1: 92, t2: 88, t3: 85, t4: 82, t5: 79, t6: 76, t7: 72, type: 'measurable' },
      'Exit Velocity (MPH)': { t1: 98, t2: 94, t3: 90, t4: 87, t5: 84, t6: 80, t7: 75, type: 'measurable' },
      '60-Yard Dash (Sec)': { t1: 6.55, t2: 6.70, t3: 6.85, t4: 7.00, t5: 7.15, t6: 7.35, t7: 7.60, type: 'time' },
      'Pop Time (Sec)': { t1: 1.88, t2: 1.94, t3: 2.00, t4: 2.06, t5: 2.12, t6: 2.20, t7: 2.30, type: 'time' },
      'Infield / Outfield Velo (MPH)': { t1: 90, t2: 86, t3: 83, t4: 80, t5: 77, t6: 73, t7: 68, type: 'measurable' },
      'Batting Average (Season)': { t1: 0.450, t2: 0.410, t3: 0.380, t4: 0.340, t5: 0.310, t6: 0.280, t7: 0.250, type: 'stat' },
      'Earned Run Average (Season)': { t1: 1.50, t2: 2.10, t3: 2.75, t4: 3.50, t5: 4.25, t6: 5.00, t7: 6.00, type: 'inverse_stat' }
    },
    'Soccer': {
      '40-Yard Sprint (Sec)': { t1: 4.55, t2: 4.65, t3: 4.75, t4: 4.88, t5: 5.00, t6: 5.15, t7: 5.35, type: 'time' },
      'Minutes Played (Season)': { t1: 1800, t2: 1500, t3: 1200, t4: 900, t5: 600, t6: 300, t7: 150, type: 'stat' },
      'Goals (Season)': { t1: 22, t2: 18, t3: 14, t4: 10, t5: 8, t6: 5, t7: 2, type: 'stat' },
      'Assists (Season)': { t1: 15, t2: 12, t3: 9, t4: 7, t5: 5, t6: 3, t7: 1, type: 'stat' },
      'Clean Sheets (Season)': { t1: 10, t2: 8, t3: 6, t4: 4, t5: 3, t6: 2, t7: 1, type: 'stat' }
    },
    'Volleyball': {
      'Approach Touch': { t1: 136, t2: 132, t3: 128, t4: 124, t5: 120, t6: 115, t7: 110, type: 'distance' },
      'Block Touch': { t1: 130, t2: 126, t3: 122, t4: 118, t5: 114, t6: 110, t7: 105, type: 'distance' },
      'Kills (Per Set)': { t1: 5.0, t2: 4.2, t3: 3.5, t4: 2.8, t5: 2.2, t6: 1.8, t7: 1.2, type: 'stat' },
      'Digs (Per Set)': { t1: 6.0, t2: 5.0, t3: 4.2, t4: 3.5, t5: 2.8, t6: 2.2, t7: 1.5, type: 'stat' }
    },
    'Lacrosse': {
      'Shot Speed (MPH)': { t1: 98, t2: 93, t3: 89, t4: 85, t5: 81, t6: 76, t7: 70, type: 'measurable' },
      '40-Yard Dash (Sec)': { t1: 4.55, t2: 4.65, t3: 4.78, t4: 4.90, t5: 5.05, t6: 5.20, t7: 5.40, type: 'time' },
      'Faceoff Win % (Season)': { t1: 72, t2: 66, t3: 61, t4: 56, t5: 52, t6: 48, t7: 42, type: 'stat' },
      'Save % (Season)': { t1: 65, t2: 60, t3: 56, t4: 53, t5: 50, t6: 46, t7: 42, type: 'stat' }
    },
    'Ice Hockey': {
      'Save % (Season)': { t1: 93.5, t2: 92.0, t3: 90.8, t4: 89.5, t5: 88.0, t6: 86.5, t7: 84.0, type: 'measurable' },
      'Goals Against Average (Season)': { t1: 1.65, t2: 2.05, t3: 2.40, t4: 2.80, t5: 3.25, t6: 3.75, t7: 4.30, type: 'inverse_stat' },
      'Total Points (Season)': { t1: 65, t2: 52, t3: 42, t4: 32, t5: 24, t6: 16, t7: 10, type: 'stat' }
    },
    'Water Polo': {
      '100 Yard Freestyle (Sec)': { t1: 47.5, t2: 49.0, t3: 50.8, t4: 52.5, t5: 54.5, t6: 57.0, t7: 60.0, type: 'time' },
      'Goals (Season)': { t1: 75, t2: 60, t3: 48, t4: 36, t5: 26, t6: 18, t7: 10, type: 'stat' },
      'Saves (Season)': { t1: 240, t2: 200, t3: 165, t4: 135, t5: 105, t6: 80, t7: 50, type: 'stat' }
    },
    'Field Hockey': {
      '40-Yard Sprint (Sec)': { t1: 4.75, t2: 4.88, t3: 5.00, t4: 5.15, t5: 5.30, t6: 5.50, t7: 5.75, type: 'time' },
      'Save % (Season)': { t1: 86, t2: 82, t3: 78, t4: 74, t5: 70, t6: 65, t7: 60, type: 'stat' }
    },
    'Softball': {
      'Fastball Velocity (MPH)': { t1: 65, t2: 62, t3: 59, t4: 56, t5: 54, t6: 51, t7: 48, type: 'measurable' },
      'Exit Velocity (MPH)': { t1: 78, t2: 74, t3: 71, t4: 68, t5: 65, t6: 61, t7: 57, type: 'measurable' },
      '20-Yard Home-to-1B (Sec)': { t1: 2.72, t2: 2.82, t3: 2.92, t4: 3.02, t5: 3.12, t6: 3.25, t7: 3.40, type: 'time' },
      'Pop Time (Sec)': { t1: 1.72, t2: 1.80, t3: 1.88, t4: 1.96, t5: 2.05, t6: 2.15, t7: 2.28, type: 'time' }
    },
    'Golf': {
      '18-Hole Scoring Average (Season)': { t1: 71, t2: 73, t3: 75, t4: 78, t5: 82, t6: 86, t7: 92, type: 'inverse_measurable' },
      '9-Hole Scoring Average (Season)': { t1: 35, t2: 36, t3: 37, t4: 39, t5: 41, t6: 43, t7: 46, type: 'inverse_measurable' },
      'Driving Distance (Yds)': { t1: 295, t2: 280, t3: 268, t4: 255, t5: 242, t6: 228, t7: 210, type: 'measurable' },
      'Tournament Wins (Career)': { t1: 6, t2: 4, t3: 3, t4: 2, t5: 1, t6: 0.5, t7: 0.2, type: 'measurable' }
    },
    'Tennis': {
      'UTR (Universal Tennis Rating)': { t1: 11.8, t2: 10.8, t3: 9.8, t4: 8.8, t5: 7.5, t6: 6.0, t7: 4.5, type: 'measurable' },
      'First Serve % (Season)': { t1: 70, t2: 65, t3: 60, t4: 56, t5: 52, t6: 48, t7: 42, type: 'measurable' },
      'Career Wins': { t1: 80, t2: 65, t3: 50, t4: 38, t5: 28, t6: 18, t7: 10, type: 'measurable' }
    },
    'Gymnastics': {
      'All-Around High Score': { t1: 82.0, t2: 79.0, t3: 76.0, t4: 73.0, t5: 70.0, t6: 66.0, t7: 60.0, type: 'measurable' },
      'Vault High Score': { t1: 14.4, t2: 13.9, t3: 13.4, t4: 12.9, t5: 12.4, t6: 11.8, t7: 11.0, type: 'measurable' },
      'Floor Exercise High Score': { t1: 14.2, t2: 13.7, t3: 13.2, t4: 12.7, t5: 12.2, t6: 11.6, t7: 10.8, type: 'measurable' }
    },
    'Bowling': {
      'Season Average': { t1: 222, t2: 212, t3: 204, t4: 195, t5: 185, t6: 172, t7: 155, type: 'measurable' },
      'High 3-Game Series': { t1: 760, t2: 720, t3: 685, t4: 650, t5: 615, t6: 570, t7: 510, type: 'measurable' },
      'High Game (Career)': { t1: 299, t2: 285, t3: 270, t4: 255, t5: 240, t6: 220, t7: 195, type: 'measurable' },
      'Spare Conversion % (Season)': { t1: 88, t2: 82, t3: 76, t4: 70, t5: 64, t6: 56, t7: 45, type: 'measurable' }
    },
    'Fencing': {
      'National Points / Ranking': { t1: 1200, t2: 850, t3: 550, t4: 350, t5: 200, t6: 100, t7: 40, type: 'measurable' },
      'Touches Scored (Season)': { t1: 250, t2: 200, t3: 160, t4: 125, t5: 95, t6: 65, t7: 40, type: 'stat' }
    }
  },
  'Girls': {
    'Track & Field': {
      '55 Meters': { t1: 6.95, t2: 7.15, t3: 7.35, t4: 7.55, t5: 7.80, t6: 8.10, t7: 8.65, type: 'time' },
      '60 Meters': { t1: 7.45, t2: 7.65, t3: 7.85, t4: 8.05, t5: 8.30, t6: 8.60, t7: 9.20, type: 'time' },
      '100 Meters': { t1: 11.7, t2: 11.9, t3: 12.3, t4: 12.6, t5: 13.0, t6: 13.5, t7: 14.5, type: 'time' },
      '200 Meters': { t1: 24.2, t2: 24.6, t3: 25.2, t4: 25.8, t5: 26.8, t6: 28.5, t7: 31.0, type: 'time' },
      '300 Meters': { t1: 38.5, t2: 39.5, t3: 40.5, t4: 42.0, t5: 44.0, t6: 46.5, t7: 50.0, type: 'time' },
      '400 Meters': { t1: 54.5, t2: 56.5, t3: 58.0, t4: 60.0, t5: 62.5, t6: 66.0, t7: 72.0, type: 'time' },
      '500 Meters': { t1: 73.0, t2: 76.0, t3: 78.5, t4: 81.5, t5: 85.0, t6: 90.0, t7: 97.0, type: 'time' },
      '600 Meters': { t1: 91.0, t2: 94.0, t3: 97.0, t4: 101.0, t5: 106.0, t6: 112.0, t7: 120.0, type: 'time' },
      '800 Meters': { t1: 130, t2: 134, t3: 138, t4: 143, t5: 150, t6: 160, t7: 175, type: 'time' },
      '1000 Meters': { t1: 172, t2: 178, t3: 184, t4: 191, t5: 200, t6: 213, t7: 232, type: 'time' },
      '1500 Meters': { t1: 268, t2: 282, t3: 291, t4: 300, t5: 314, t6: 330, t7: 375, type: 'time' },
      '1600 Meters': { t1: 290, t2: 302, t3: 312, t4: 322, t5: 340, t6: 360, t7: 400, type: 'time' },
      '1 Mile': { t1: 292, t2: 304, t3: 314, t4: 324, t5: 342, t6: 362, t7: 402, type: 'time' },
      '3000 Meters': { t1: 583, t2: 611, t3: 638, t4: 666, t5: 694, t6: 730, t7: 840, type: 'time' },
      '3200 Meters': { t1: 630, t2: 655, t3: 680, t4: 710, t5: 750, t6: 800, t7: 900, type: 'time' },
      '2 Mile': { t1: 633, t2: 658, t3: 683, t4: 713, t5: 753, t6: 803, t7: 903, type: 'time' },
      '55m Hurdles': { t1: 8.00, t2: 8.25, t3: 8.55, t4: 8.90, t5: 9.40, t6: 10.10, t7: 11.20, type: 'time' },
      '60m Hurdles': { t1: 8.60, t2: 8.85, t3: 9.15, t4: 9.50, t5: 10.00, t6: 10.70, t7: 11.80, type: 'time' },
      '100m Hurdles': { t1: 13.8, t2: 14.3, t3: 14.8, t4: 15.5, t5: 16.5, t6: 17.8, t7: 20.0, type: 'time' },
      '110m Hurdles': { t1: 13.8, t2: 14.3, t3: 14.8, t4: 15.5, t5: 16.5, t6: 17.8, t7: 20.0, type: 'time' },
      '300m Hurdles': { t1: 42.5, t2: 44.5, t3: 46.5, t4: 48.5, t5: 51.0, t6: 54.0, t7: 59.0, type: 'time' },
      '400m Hurdles': { t1: 60.0, t2: 62.5, t3: 65.0, t4: 68.0, t5: 72.0, t6: 77.0, t7: 84.0, type: 'time' },
      'Long Jump': { t1: 234, t2: 222, t3: 210, t4: 198, t5: 186, t6: 174, t7: 150, type: 'distance' },
      'Triple Jump': { t1: 480, t2: 456, t3: 432, t4: 408, t5: 384, t6: 360, t7: 312, type: 'distance' },
      'High Jump': { t1: 68, t2: 64, t3: 62, t4: 60, t5: 58, t6: 54, t7: 50, type: 'distance' },
      'Pole Vault': { t1: 156, t2: 144, t3: 132, t4: 120, t5: 108, t6: 90, t7: 72, type: 'distance' },
      'Shot Put': { t1: 540, t2: 480, t3: 432, t4: 396, t5: 360, t6: 324, t7: 264, type: 'distance' },
      'Discus': { t1: 1800, t2: 1620, t3: 1500, t4: 1380, t5: 1260, t6: 1080, t7: 840, type: 'distance' },
      'Javelin': { t1: 1740, t2: 1560, t3: 1440, t4: 1320, t5: 1200, t6: 1020, t7: 780, type: 'distance' }
    },
    'Football': {
      '40-Yard Dash (Sec)': { t1: 4.75, t2: 4.88, t3: 5.00, t4: 5.15, t5: 5.30, t6: 5.50, t7: 5.75, type: 'time' },
      '10-Yard Split (Sec)': { t1: 1.62, t2: 1.68, t3: 1.74, t4: 1.80, t5: 1.88, t6: 1.96, t7: 2.10, type: 'time' },
      '5-10-5 Shuttle (Sec)': { t1: 4.35, t2: 4.48, t3: 4.60, t4: 4.75, t5: 4.90, t6: 5.10, t7: 5.35, type: 'time' },
      'Vertical Jump (Inches)': { t1: 30, t2: 27, t3: 25, t4: 23, t5: 21, t6: 19, t7: 16, type: 'measurable' },
      'Broad Jump': { t1: 104, t2: 98, t3: 92, t4: 86, t5: 80, t6: 74, t7: 66, type: 'distance' }
    },
    'Basketball': {
      'Standing Reach': { t1: 96, t2: 92, t3: 89, t4: 86, t5: 83, t6: 80, t7: 76, type: 'distance' },
      'Vertical Jump (Inches)': { t1: 29, t2: 26, t3: 24, t4: 22, t5: 20, t6: 18, t7: 15, type: 'measurable' },
      'Points (Per Game)': { t1: 20, t2: 16, t3: 13, t4: 10, t5: 8, t6: 5, t7: 3, type: 'stat' },
      'Rebounds (Per Game)': { t1: 10, t2: 8, t3: 7, t4: 5, t5: 4, t6: 3, t7: 2, type: 'stat' },
      'Assists (Per Game)': { t1: 7, t2: 5, t3: 4, t4: 3, t5: 2.5, t6: 1.5, t7: 1, type: 'stat' },
      'Field Goal % (Season)': { t1: 55, t2: 50, t3: 45, t4: 40, t5: 35, t6: 32, t7: 28, type: 'stat' },
      '3-Point % (Season)': { t1: 40, t2: 35, t3: 32, t4: 28, t5: 25, t6: 22, t7: 18, type: 'stat' }
    },
    'Soccer': {
      '40-Yard Sprint (Sec)': { t1: 4.85, t2: 4.98, t3: 5.10, t4: 5.25, t5: 5.40, t6: 5.60, t7: 5.85, type: 'time' },
      'Minutes Played (Season)': { t1: 1800, t2: 1500, t3: 1200, t4: 900, t5: 600, t6: 300, t7: 150, type: 'stat' },
      'Goals (Season)': { t1: 22, t2: 18, t3: 14, t4: 10, t5: 8, t6: 5, t7: 2, type: 'stat' },
      'Assists (Season)': { t1: 15, t2: 12, t3: 9, t4: 7, t5: 5, t6: 3, t7: 1, type: 'stat' },
      'Clean Sheets (Season)': { t1: 10, t2: 8, t3: 6, t4: 4, t5: 3, t6: 2, t7: 1, type: 'stat' }
    },
    'Volleyball': {
      'Approach Touch': { t1: 122, t2: 118, t3: 115, t4: 112, t5: 109, t6: 106, t7: 102, type: 'distance' },
      'Block Touch': { t1: 117, t2: 114, t3: 111, t4: 108, t5: 105, t6: 102, t7: 98, type: 'distance' },
      'Kills (Per Set)': { t1: 4.5, t2: 3.8, t3: 3.2, t4: 2.5, t5: 2.0, t6: 1.5, t7: 1.0, type: 'stat' },
      'Digs (Per Set)': { t1: 5.5, t2: 4.5, t3: 3.8, t4: 3.0, t5: 2.5, t6: 2.0, t7: 1.5, type: 'stat' },
      'Aces (Per Set)': { t1: 0.8, t2: 0.6, t3: 0.5, t4: 0.4, t5: 0.3, t6: 0.2, t7: 0.1, type: 'stat' }
    },
    'Softball': {
      'Fastball Velocity (MPH)': { t1: 65, t2: 62, t3: 59, t4: 56, t5: 54, t6: 51, t7: 48, type: 'measurable' },
      'Exit Velocity (MPH)': { t1: 78, t2: 74, t3: 71, t4: 68, t5: 65, t6: 61, t7: 57, type: 'measurable' },
      '20-Yard Home-to-1B (Sec)': { t1: 2.72, t2: 2.82, t3: 2.92, t4: 3.02, t5: 3.12, t6: 3.25, t7: 3.40, type: 'time' },
      'Pop Time (Sec)': { t1: 1.72, t2: 1.80, t3: 1.88, t4: 1.96, t5: 2.05, t6: 2.15, t7: 2.28, type: 'time' },
      'Overhand Throw Velo (MPH)': { t1: 66, t2: 63, t3: 60, t4: 57, t5: 54, t6: 51, t7: 47, type: 'measurable' },
      'Batting Average (AVG)': { t1: 0.480, t2: 0.440, t3: 0.400, t4: 0.360, t5: 0.320, t6: 0.280, t7: 0.250, type: 'stat' },
      'Earned Run Average (ERA)': { t1: 1.20, t2: 1.80, t3: 2.40, t4: 3.00, t5: 3.80, t6: 4.50, t7: 5.50, type: 'inverse_stat' }
    },
    'Baseball': {
      'Fastball Velocity (MPH)': { t1: 84, t2: 80, t3: 77, t4: 74, t5: 71, t6: 68, t7: 64, type: 'measurable' },
      'Exit Velocity (MPH)': { t1: 88, t2: 84, t3: 80, t4: 77, t5: 74, t6: 70, t7: 65, type: 'measurable' },
      '60-Yard Dash (Sec)': { t1: 6.90, t2: 7.10, t3: 7.25, t4: 7.45, t5: 7.65, t6: 7.85, t7: 8.10, type: 'time' },
      'Pop Time (Sec)': { t1: 1.95, t2: 2.02, t3: 2.10, t4: 2.18, t5: 2.25, t6: 2.35, t7: 2.45, type: 'time' }
    },
    'Lacrosse': {
      'Shot Speed (MPH)': { t1: 78, t2: 73, t3: 69, t4: 65, t5: 61, t6: 56, t7: 50, type: 'measurable' },
      '40-Yard Dash (Sec)': { t1: 4.88, t2: 5.00, t3: 5.12, t4: 5.25, t5: 5.40, t6: 5.60, t7: 5.85, type: 'time' },
      'Draw Control % (Season)': { t1: 68, t2: 62, t3: 57, t4: 52, t5: 48, t6: 44, t7: 38, type: 'stat' },
      'Save % (Season)': { t1: 58, t2: 54, t3: 50, t4: 47, t5: 44, t6: 40, t7: 35, type: 'stat' }
    },
    'Field Hockey': {
      '40-Yard Sprint (Sec)': { t1: 4.85, t2: 4.98, t3: 5.10, t4: 5.25, t5: 5.40, t6: 5.60, t7: 5.85, type: 'time' },
      'Save % (Season)': { t1: 86, t2: 82, t3: 78, t4: 74, t5: 70, t6: 65, t7: 60, type: 'stat' }
    },
    'Ice Hockey': {
      'Save % (Season)': { t1: 93.0, t2: 91.5, t3: 90.2, t4: 89.0, t5: 87.5, t6: 86.0, t7: 83.5, type: 'measurable' },
      'Goals Against Average (Season)': { t1: 1.75, t2: 2.15, t3: 2.50, t4: 2.90, t5: 3.35, t6: 3.85, t7: 4.40, type: 'inverse_stat' },
      'Total Points (Season)': { t1: 58, t2: 46, t3: 36, t4: 28, t5: 20, t6: 14, t7: 8, type: 'stat' }
    },
    'Water Polo': {
      '100 Yard Freestyle (Sec)': { t1: 53.5, t2: 55.2, t3: 57.0, t4: 59.0, t5: 61.5, t6: 64.0, t7: 68.0, type: 'time' },
      'Goals (Season)': { t1: 70, t2: 55, t3: 44, t4: 34, t5: 24, t6: 16, t7: 8, type: 'stat' },
      'Saves (Season)': { t1: 220, t2: 185, t3: 155, t4: 125, t5: 95, t6: 70, t7: 45, type: 'stat' }
    },
    'Golf': {
      '18-Hole Scoring Average (Season)': { t1: 74, t2: 77, t3: 80, t4: 84, t5: 88, t6: 94, t7: 100, type: 'inverse_measurable' },
      '9-Hole Scoring Average (Season)': { t1: 37, t2: 38, t3: 40, t4: 42, t5: 44, t6: 47, t7: 50, type: 'inverse_measurable' },
      'Driving Distance (Yds)': { t1: 255, t2: 242, t3: 230, t4: 218, t5: 205, t6: 192, t7: 175, type: 'measurable' },
      'Tournament Wins (Career)': { t1: 6, t2: 4, t3: 3, t4: 2, t5: 1, t6: 0.5, t7: 0.2, type: 'measurable' }
    },
    'Tennis': {
      'UTR (Universal Tennis Rating)': { t1: 9.8, t2: 8.8, t3: 7.8, t4: 6.8, t5: 5.8, t6: 4.8, t7: 3.5, type: 'measurable' },
      'First Serve % (Season)': { t1: 70, t2: 65, t3: 60, t4: 56, t5: 52, t6: 48, t7: 42, type: 'measurable' },
      'Career Wins': { t1: 80, t2: 65, t3: 50, t4: 38, t5: 28, t6: 18, t7: 10, type: 'measurable' }
    },
    'Gymnastics': {
      'All-Around High Score': { t1: 38.8, t2: 38.0, t3: 37.2, t4: 36.4, t5: 35.5, t6: 34.2, t7: 32.5, type: 'measurable' },
      'Vault High Score': { t1: 9.85, t2: 9.65, t3: 9.45, t4: 9.25, t5: 9.00, t6: 8.70, t7: 8.30, type: 'measurable' },
      'Uneven Bars High Score': { t1: 9.80, t2: 9.60, t3: 9.40, t4: 9.15, t5: 8.90, t6: 8.55, t7: 8.10, type: 'measurable' },
      'Balance Beam High Score': { t1: 9.80, t2: 9.60, t3: 9.40, t4: 9.15, t5: 8.90, t6: 8.55, t7: 8.10, type: 'measurable' },
      'Floor Exercise High Score': { t1: 9.85, t2: 9.65, t3: 9.45, t4: 9.25, t5: 9.00, t6: 8.70, t7: 8.30, type: 'measurable' }
    },
    'Bowling': {
      'Season Average': { t1: 205, t2: 195, t3: 186, t4: 176, t5: 166, t6: 155, t7: 140, type: 'measurable' },
      'High 3-Game Series': { t1: 710, t2: 670, t3: 635, t4: 600, t5: 565, t6: 525, t7: 475, type: 'measurable' },
      'High Game (Career)': { t1: 289, t2: 270, t3: 255, t4: 240, t5: 225, t6: 205, t7: 180, type: 'measurable' },
      'Spare Conversion % (Season)': { t1: 85, t2: 79, t3: 73, t4: 67, t5: 60, t6: 52, t7: 42, type: 'measurable' }
    },
    'Fencing': {
      'National Points / Ranking': { t1: 1200, t2: 850, t3: 550, t4: 350, t5: 200, t6: 100, t7: 40, type: 'measurable' },
      'Touches Scored (Season)': { t1: 240, t2: 190, t3: 150, t4: 120, t5: 90, t6: 60, t7: 35, type: 'stat' }
    }
  }
};

export const LEVEL_MODIFIERS: Record<string, number> = {
  'JV / Dev Squad': 0.6,
  'Varsity Contributor': 0.85,
  'Varsity Starter': 1.0,
  'All-Conference Tier': 1.15,
  'All-State / National': 1.3,
  'Elite Club (ECNL / AAU / Next)': 1.5
};

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
  "VA", "WA", "WV", "WI", "WY"
];

export interface SportMetaConfig {
  positions: string[];
  requiresLevel: boolean;
  defaultMetrics: string[];
}

export const SPORT_CONFIGS_META: Record<string, SportMetaConfig> = {
  'Track & Field': { positions: ['Sprints', 'Distance', 'Hurdles', 'Jumps', 'Throws', 'Vault'], requiresLevel: false, defaultMetrics: ['55 Meters', '60 Meters', '100 Meters', '200 Meters', '300 Meters', '400 Meters', '500 Meters', '600 Meters', '800 Meters', '1000 Meters', '1500 Meters', '1600 Meters', '1 Mile', '3000 Meters', '3200 Meters', '2 Mile', '55m Hurdles', '60m Hurdles', '100m Hurdles', '110m Hurdles', '300m Hurdles', '400m Hurdles', 'Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault', 'Shot Put', 'Discus', 'Javelin'] },
  'Cross Country': { positions: ['Runner'], requiresLevel: false, defaultMetrics: [] },
  'Swimming & Diving': { positions: ['Freestyle Sprint', 'Freestyle Distance', 'Backstroke', 'Breaststroke', 'Butterfly', 'Individual Medley', 'Diver'], requiresLevel: false, defaultMetrics: [] },
  'Golf': { positions: ['Golfer'], requiresLevel: false, defaultMetrics: ['18-Hole Scoring Average (Season)', '9-Hole Scoring Average (Season)', 'Driving Distance (Yds)', 'Tournament Wins (Career)'] },
  'Basketball': { positions: ['Point Guard (PG)', 'Shooting Guard (SG)', 'Small Forward (SF)', 'Power Forward (PF)', 'Center (C)'], requiresLevel: true, defaultMetrics: ['Standing Reach', 'Vertical Jump (Inches)', 'Points (Per Game)', 'Rebounds (Per Game)', 'Assists (Per Game)', 'Field Goal % (Season)', '3-Point % (Season)'] },
  'Soccer': { positions: ['Goalkeeper (GK)', 'Center Back (CB)', 'Fullback (LB/RB)', 'Defensive Midfielder (DM)', 'Attacking Midfielder (AM)', 'Winger (LW/RW)', 'Striker (ST)'], requiresLevel: true, defaultMetrics: ['40-Yard Sprint (Sec)', 'Minutes Played (Season)', 'Goals (Season)', 'Assists (Season)', 'Clean Sheets (Season)'] },
  'Football': { positions: ['Quarterback (QB)', 'Running Back (RB)', 'Wide Receiver (WR)', 'Tight End (TE)', 'Offensive Lineman (OL)', 'Defensive Lineman (DL)', 'Linebacker (LB)', 'Cornerback / Safety (DB)', 'Kicker / Punter (ST)'], requiresLevel: true, defaultMetrics: ['40-Yard Dash (Sec)', '10-Yard Split (Sec)', '5-10-5 Shuttle (Sec)', 'Vertical Jump (Inches)', 'Broad Jump', 'Bench Press Max (Lbs)'] },
  'Lacrosse': { positions: ['Attack', 'Midfield', 'Defense', 'Goalie', 'Faceoff Specialist (FO)'], requiresLevel: true, defaultMetrics: ['Shot Speed (MPH)', '40-Yard Dash (Sec)', 'Faceoff Win % (Season)', 'Save % (Season)'] },
  'Field Hockey': { positions: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'], requiresLevel: true, defaultMetrics: ['40-Yard Sprint (Sec)', 'Save % (Season)'] },
  'Volleyball': { positions: ['Setter (S)', 'Outside Hitter (OH)', 'Opposite Hitter (OPP)', 'Middle Blocker (MB)', 'Libero / Defensive Specialist (L/DS)'], requiresLevel: true, defaultMetrics: ['Approach Touch', 'Block Touch', 'Kills (Per Set)', 'Digs (Per Set)', 'Aces (Per Set)'] },
  'Baseball': { positions: ['Pitcher (RHP/LHP)', 'Catcher (C)', 'First Base (1B)', 'Infield (2B/3B/SS)', 'Outfield (LF/CF/RF)'], requiresLevel: true, defaultMetrics: ['Fastball Velocity (MPH)', 'Exit Velocity (MPH)', '60-Yard Dash (Sec)', 'Pop Time (Sec)', 'Infield / Outfield Velo (MPH)', 'Batting Average (Season)', 'Earned Run Average (Season)'] },
  'Softball': { positions: ['Pitcher', 'Catcher', 'First Base', 'Infield', 'Outfield'], requiresLevel: true, defaultMetrics: ['Fastball Velocity (MPH)', 'Exit Velocity (MPH)', '20-Yard Home-to-1B (Sec)', 'Pop Time (Sec)', 'Overhand Throw Velo (MPH)', 'Batting Average (AVG)', 'Earned Run Average (ERA)'] },
  'Wrestling': { positions: ['106 lbs', '113 lbs', '120 lbs', '126 lbs', '132 lbs', '138 lbs', '144 lbs', '150 lbs', '157 lbs', '165 lbs', '175 lbs', '190 lbs', '215 lbs', '285 lbs'], requiresLevel: true, defaultMetrics: ['Season Record (W-L)', 'Career Wins', 'Pins / Falls (Season)', 'Takedowns (Season)'] },
  'Tennis': { positions: ['Singles Player', 'Doubles Player'], requiresLevel: true, defaultMetrics: ['UTR (Universal Tennis Rating)', 'First Serve % (Season)', 'Career Wins'] },
  'Ice Hockey': { positions: ['Center', 'Winger', 'Defenseman', 'Goaltender'], requiresLevel: true, defaultMetrics: ['Total Points (Season)', 'Save % (Season)', 'Goals Against Average (Season)'] },
  'Water Polo': { positions: ['Driver', 'Utility', 'Center Forward (2M Attack)', 'Center Defender (2M Guard)', 'Goalkeeper'], requiresLevel: true, defaultMetrics: ['100 Yard Freestyle (Sec)', 'Goals (Season)', 'Saves (Season)'] },
  'Gymnastics': { positions: ['All-Around', 'Vault Specialist', 'Bars Specialist', 'Beam Specialist', 'Floor Specialist'], requiresLevel: true, defaultMetrics: ['All-Around High Score', 'Vault High Score', 'Uneven Bars High Score', 'Balance Beam High Score', 'Floor Exercise High Score'] },
  'Bowling': { positions: ['Bowler'], requiresLevel: true, defaultMetrics: ['Season Average', 'High 3-Game Series', 'High Game (Career)', 'Spare Conversion % (Season)'] },
  'Fencing': { positions: ['Foil Specialist', 'Épée Specialist', 'Sabre Specialist'], requiresLevel: true, defaultMetrics: ['National Points / Ranking', 'Touches Scored (Season)'] }
};

export const ALL_SPORTS: string[] = Object.keys(SPORT_CONFIGS_META);

export const SUGGESTED_MAJORS = Array.from(new Set([
  'Business & Marketing', 'Accounting', 'Finance', 'Sports Management',
  'Health Professions & Nursing', 'Pre-Med', 'Physical Therapy',
  'Kinesiology & Parks/Recreation', 'Exercise Science',
  'Visual & Performing Arts', 'Graphic Design', 'Film',
  'Homeland Security & Law Enforcement', 'Criminal Justice',
  'Legal Professions & Studies', 'Pre-Law',
  'Computer & Information Sciences', 'Software Engineering', 'Cybersecurity',
  'Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Communications & Journalism', 'Public Relations',
  'Education', 'Teaching',
  'Biological & Biomedical Sciences', 'Biology',
  'Psychology', 'History', 'English Language & Literature',
  'Agriculture', 'Architecture', 'Undecided'
])).sort();

// ==========================================
// 🚨 ZERO-FRICTION POSITION BLUEPRINT ENGINE 🚨
// ==========================================

export const getSportPositionBlueprint = (sport: string, position: string = ''): PositionBlueprint => {
  const pos = position.toLowerCase();

  if (sport === 'Football') {
    if (pos.includes('qb') || pos.includes('quarterback')) {
      return {
        impactTitle: 'Quarterback Command & Production Tier',
        impactSubtitle: 'Tap the tier that matches your typical Friday night output (no weekly math required)',
        impactBuckets: [
          { id: 'tier_4', label: 'Developmental / Backup QB', subLabel: 'Sub-varsity starter or varsity situational packages (<120 yds/gm)', score: 52, badge: 'Developing' },
          { id: 'tier_3', label: 'Consistent Varsity Starter', subLabel: 'Full-time game manager; 130–185 yds/gm or 58%+ completions', score: 68, badge: 'Varsity Starter' },
          { id: 'tier_2', label: 'All-Conference Playmaker', subLabel: 'Primary offensive engine; 190–240 yds/gm & 2+ TDs/gm', score: 82, badge: 'All-League Impact' },
          { id: 'tier_1', label: 'Elite Field General', subLabel: '245+ yds/gm, 65%+ completion, or elite dual-threat D1 projection', score: 94, badge: 'D1 Caliber' }
        ],
        combinePrompts: [
          { metricName: '40-Yard Dash (Sec)', shortLabel: '40-Yd Dash', placeholder: 'e.g. 4.68', unitHint: 'Seconds' },
          { metricName: '5-10-5 Shuttle (Sec)', shortLabel: 'Pro Shuttle', placeholder: 'e.g. 4.28', unitHint: 'Seconds' },
          { metricName: 'Vertical Jump (Inches)', shortLabel: 'Vertical Jump', placeholder: 'e.g. 32', unitHint: 'Inches' }
        ]
      };
    }
    if (pos.includes('ol') || pos.includes('offensive line')) {
      return {
        impactTitle: 'Offensive Line Trench Dominance Tier',
        impactSubtitle: 'Evaluates pass-protection anchor value & physical finishing (solves the zero-stat OL paradox)',
        impactBuckets: [
          { id: 'tier_4', label: 'Rotational / Developing Lineman', subLabel: 'Developing footwork & strength; rotational varsity snaps', score: 54, badge: 'Developing' },
          { id: 'tier_3', label: 'Reliable Starting Lineman', subLabel: 'Every-down varsity starter; sound assignment execution', score: 69, badge: 'Varsity Starter' },
          { id: 'tier_2', label: 'Trench Enforcer / All-League', subLabel: 'Consistent pancake finisher; rarely surrenders QB pressures', score: 83, badge: 'All-League Anchor' },
          { id: 'tier_1', label: 'Blindside Lockdown / D1 Frame', subLabel: 'Zero sacks allowed; dominant drive-blocker against top edges', score: 95, badge: 'Elite Trench' }
        ],
        combinePrompts: [
          { metricName: '10-Yard Split (Sec)', shortLabel: '10-Yd Split', placeholder: 'e.g. 1.68', unitHint: 'Seconds' },
          { metricName: '5-10-5 Shuttle (Sec)', shortLabel: 'Pro Shuttle', placeholder: 'e.g. 4.48', unitHint: 'Seconds' },
          { metricName: 'Bench Press Max (Lbs)', shortLabel: 'Bench Max', placeholder: 'e.g. 285', unitHint: 'Pounds' }
        ]
      };
    }
    if (pos.includes('db') || pos.includes('corner') || pos.includes('safety')) {
      return {
        impactTitle: 'Secondary Coverage & Lockdown Tier',
        impactSubtitle: 'Rewards lockdown island coverage even when opposing QBs avoid throwing your way',
        impactBuckets: [
          { id: 'tier_4', label: 'Sub-Package / Special Teams DB', subLabel: 'Dime/Nickel contributor & core special teams tackler', score: 53, badge: 'Contributor' },
          { id: 'tier_3', label: 'Starting Corner / Safety', subLabel: 'Every-down secondary starter; reliable open-field tackler', score: 68, badge: 'Varsity Starter' },
          { id: 'tier_2', label: 'Ballhawk / Playmaker DB', subLabel: 'High PBU/INT production or physical box-safety eraser', score: 82, badge: 'All-League DB' },
          { id: 'tier_1', label: 'Lockdown Island / Range Safety', matches: true, subLabel: 'Shadows opponent WR1 with fluid hips & elite closing burst', score: 94, badge: 'Lockdown Island' } as any
        ],
        combinePrompts: [
          { metricName: '40-Yard Dash (Sec)', shortLabel: '40-Yd Dash', placeholder: 'e.g. 4.52', unitHint: 'Seconds' },
          { metricName: 'Vertical Jump (Inches)', shortLabel: 'Vertical Jump', placeholder: 'e.g. 34', unitHint: 'Inches' },
          { metricName: 'Broad Jump', shortLabel: 'Broad Jump', placeholder: "e.g. 9'10\"", unitHint: 'Ft / In' }
        ]
      };
    }
    if (pos.includes('dl') || pos.includes('lb') || pos.includes('linebacker') || pos.includes('defensive line')) {
      return {
        impactTitle: 'Front-Seven Disruption & Tackling Tier',
        impactSubtitle: 'Measures pocket disruption, gap integrity, and sideline-to-sideline production',
        impactBuckets: [
          { id: 'tier_4', label: 'Rotational Front-Seven', subLabel: 'Situational pass-rush or run-downs contributor', score: 53, badge: 'Rotation' },
          { id: 'tier_3', label: 'Every-Down Varsity Starter', subLabel: '5–7 tackles/gm or consistent edge/interior gap control', score: 68, badge: 'Varsity Starter' },
          { id: 'tier_2', label: 'High-Motor Disruptor', subLabel: '8+ tackles/gm or regular TFLs & pocket collapses', score: 83, badge: 'All-League Front 7' },
          { id: 'tier_1', label: 'Game-Wrecking Edge / Mike LB', subLabel: 'Commands double-teams; 10+ tackles/gm or elite sack rate', score: 94, badge: 'D1 Disruptor' }
        ],
        combinePrompts: [
          { metricName: '40-Yard Dash (Sec)', shortLabel: '40-Yd Dash', placeholder: 'e.g. 4.65', unitHint: 'Seconds' },
          { metricName: '10-Yard Split (Sec)', shortLabel: '10-Yd Split', placeholder: 'e.g. 1.58', unitHint: 'Seconds' },
          { metricName: 'Bench Press Max (Lbs)', shortLabel: 'Bench Max', placeholder: 'e.g. 275', unitHint: 'Pounds' }
        ]
      };
    }
    if (pos.includes('st') || pos.includes('kicker') || pos.includes('punter')) {
      return {
        impactTitle: 'Special Teams Leg Strength & Accuracy Tier',
        impactSubtitle: 'Select your consistent game-day kicking and punting execution range',
        impactBuckets: [
          { id: 'tier_4', label: 'Developing Specialist', subLabel: 'PAT specialist & directional kickoff contributor', score: 52, badge: 'Developing' },
          { id: 'tier_3', label: 'Reliable Varsity Specialist', subLabel: 'Consistent inside 38 yds; 35+ yd punt average', score: 67, badge: 'Varsity Starter' },
          { id: 'tier_2', label: 'All-Conference Weapon', subLabel: '45+ yd FG range, regular touchbacks, or 40+ yd punt avg', score: 82, badge: 'All-League ST' },
          { id: 'tier_1', label: 'D1 / National Charting Specialist', subLabel: '50+ yd FG range, 4.3s+ hangtime, & deep kickoff touchbacks', score: 94, badge: 'Elite Specialist' }
        ],
        combinePrompts: [
          { metricName: '40-Yard Dash (Sec)', shortLabel: '40-Yd Dash', placeholder: 'e.g. 4.85', unitHint: 'Seconds' },
          { metricName: 'Broad Jump', shortLabel: 'Broad Jump', placeholder: "e.g. 9'2\"", unitHint: 'Ft / In' }
        ]
      };
    }
    // Default RB / WR / TE Skill Blueprint
    return {
      impactTitle: 'Skill Position Explosiveness & Touch Production',
      impactSubtitle: 'Tap the tier that matches your typical per-game yardage and big-play role',
      impactBuckets: [
        { id: 'tier_4', label: 'Rotational / Slot / RB2 Contributor', subLabel: 'Situational touches & special teams return value (<45 yds/gm)', score: 53, badge: 'Contributor' },
        { id: 'tier_3', label: 'Starting Skill Threat', subLabel: '50–85 all-purpose yds/gm; reliable chains-mover', score: 68, badge: 'Varsity Starter' },
        { id: 'tier_2', label: 'Feature Playmaker (WR1 / RB1)', subLabel: '90–125 yds/gm; primary red-zone & explosive play target', score: 83, badge: 'Feature Weapon' },
        { id: 'tier_1', label: 'Dynamic Home-Run Threat', subLabel: '130+ yds/gm or elite YAC/separation against bracket coverage', score: 94, badge: 'D1 Playmaker' }
      ],
      combinePrompts: [
        { metricName: '40-Yard Dash (Sec)', shortLabel: '40-Yd Dash', placeholder: 'e.g. 4.50', unitHint: 'Seconds' },
        { metricName: 'Vertical Jump (Inches)', shortLabel: 'Vertical Jump', placeholder: 'e.g. 35', unitHint: 'Inches' },
        { metricName: 'Broad Jump', shortLabel: 'Broad Jump', placeholder: "e.g. 10'0\"", unitHint: 'Ft / In' }
      ]
    };
  }

  if (sport === 'Baseball' || sport === 'Softball') {
    const isSoftball = sport === 'Softball';
    if (pos.includes('pitcher')) {
      return {
        impactTitle: 'Pitching Arsenal & Mound Command Tier',
        impactSubtitle: 'Select your role in the rotation and strikeout/contact suppression level',
        impactBuckets: [
          { id: 'tier_4', label: 'Bullpen / Innings Reliever', subLabel: 'Developing secondary pitches; middle relief appearances', score: 53, badge: 'Reliever' },
          { id: 'tier_3', label: 'Varsity Rotation Starter / Closer', subLabel: 'Consistent strike-thrower; keeps ERA under 3.20', score: 68, badge: 'Rotation Arm' },
          { id: 'tier_2', label: 'Staff Ace (Game 1 Starter)', subLabel: 'Commands 3 pitches for strikes; high K-rate vs top lineups', score: 83, badge: 'Staff Ace' },
          { id: 'tier_1', label: 'Dominant Collegiate-Ready Arm', subLabel: 'Overpowering velocity & spin; sub-1.75 ERA against elite travel/HS', score: 94, badge: 'Elite Arm' }
        ],
        combinePrompts: [
          { metricName: 'Fastball Velocity (MPH)', shortLabel: 'Peak Fastball', placeholder: isSoftball ? 'e.g. 63' : 'e.g. 88', unitHint: 'MPH' },
          { metricName: isSoftball ? 'Earned Run Average (ERA)' : 'Earned Run Average (Season)', shortLabel: 'Season ERA', placeholder: 'e.g. 1.85', unitHint: 'ERA' }
        ]
      };
    }
    if (pos.includes('catcher')) {
      return {
        impactTitle: 'Catcher Defensive Receiving & Offensive Impact',
        impactSubtitle: 'Captures pop-time transfer, framing, and middle-of-the-order bat value',
        impactBuckets: [
          { id: 'tier_4', label: 'Rotational / Bullpen Catcher', subLabel: 'Developing blocking & transfer mechanics', score: 53, badge: 'Developing' },
          { id: 'tier_3', label: 'Everyday Starting Catcher', subLabel: 'Commands pitching staff; reliable framing & quality ABs', score: 69, badge: 'Varsity Starter' },
          { id: 'tier_2', label: 'Shut-Down Receiver & Gap Hitter', subLabel: 'Controls opposing run game; hits .340+ in heart of order', score: 83, badge: 'All-League C' },
          { id: 'tier_1', label: 'Premier Field General & Power Bat', subLabel: 'Elite pop time + high exit-velo middle-of-lineup force', score: 94, badge: 'D1 Catcher' }
        ],
        combinePrompts: [
          { metricName: 'Pop Time (Sec)', shortLabel: 'Pop Time', placeholder: isSoftball ? 'e.g. 1.78' : 'e.g. 1.94', unitHint: 'Seconds' },
          { metricName: 'Exit Velocity (MPH)', shortLabel: 'Exit Velo', placeholder: isSoftball ? 'e.g. 74' : 'e.g. 92', unitHint: 'MPH' }
        ]
      };
    }
    return {
      impactTitle: 'Offensive Barrel Quality & Defensive Range Tier',
      impactSubtitle: 'Select your lineup slot, on-base consistency, and defensive profile',
      impactBuckets: [
        { id: 'tier_4', label: 'Platoon / Defensive Replacement', subLabel: 'Pinch-runner, courtesy runner, or rotational starter', score: 52, badge: 'Contributor' },
        { id: 'tier_3', label: 'Everyday Lineup Starter', subLabel: 'Hits .300–.350 with clean defensive actions', score: 68, badge: 'Varsity Starter' },
        { id: 'tier_2', label: 'Top-of-Order Catalyst / Cleanup Bat', subLabel: 'Hits .360–.420 with extra-base power & lockdown glove', score: 83, badge: 'All-League Bat' },
        { id: 'tier_1', label: '5-Tool Collegiate Prospect', subLabel: '.430+ AVG or elite showcase exit-velo & plus range/arm', score: 94, badge: '5-Tool Prospect' }
      ],
      combinePrompts: [
        { metricName: 'Exit Velocity (MPH)', shortLabel: 'Exit Velocity', placeholder: isSoftball ? 'e.g. 75' : 'e.g. 93', unitHint: 'MPH' },
        { metricName: isSoftball ? '20-Yard Home-to-1B (Sec)' : '60-Yard Dash (Sec)', shortLabel: isSoftball ? 'Home-to-1B' : '60-Yd Dash', placeholder: isSoftball ? 'e.g. 2.82' : 'e.g. 6.72', unitHint: 'Seconds' },
        { metricName: isSoftball ? 'Overhand Throw Velo (MPH)' : 'Infield / Outfield Velo (MPH)', shortLabel: 'Throw Velo', placeholder: isSoftball ? 'e.g. 63' : 'e.g. 86', unitHint: 'MPH' }
      ]
    };
  }

  if (sport === 'Basketball') {
    return {
      impactTitle: 'Two-Way Hardwood Impact & Usage Tier',
      impactSubtitle: 'Select your rotation role, scoring efficiency, and defensive versatility',
      impactBuckets: [
        { id: 'tier_4', label: 'Bench Spark / Rotational Minutes', subLabel: '10–15 mins/gm; defensive energy & spot-up spacing', score: 53, badge: 'Rotation' },
        { id: 'tier_3', label: 'Core Starting Five', subLabel: '8–13 PPG or primary defensive stopper / rebounder', score: 68, badge: 'Varsity Starter' },
        { id: 'tier_2', label: 'Primary Scoring / Playmaking Option', subLabel: '14–19 PPG, 5+ RPG/APG, All-Conference caliber', score: 83, badge: 'All-League' },
        { id: 'tier_1', label: 'Franchise Two-Way Prospect', subLabel: '20+ PPG or elite positional length, creation & rim protection', score: 94, badge: 'D1 Prospect' }
      ],
      combinePrompts: [
        { metricName: 'Standing Reach', shortLabel: 'Standing Reach', placeholder: "e.g. 8'4\"", unitHint: 'Ft / In' },
        { metricName: 'Vertical Jump (Inches)', shortLabel: 'Vertical Jump', placeholder: 'e.g. 33', unitHint: 'Inches' },
        { metricName: 'Points (Per Game)', shortLabel: 'Points / Gm', placeholder: 'e.g. 16.5', unitHint: 'PPG' }
      ]
    };
  }

  if (sport === 'Soccer') {
    if (pos.includes('gk') || pos.includes('goalkeeper')) {
      return {
        impactTitle: 'Goalkeeper Box Command & Distribution Tier',
        impactSubtitle: 'Evaluates shot-stopping, aerial command, and build-out distribution',
        impactBuckets: [
          { id: 'tier_4', label: 'Cup / Rotational Keeper', subLabel: 'Developing vocal command & shot-stopping consistency', score: 53, badge: 'Developing' },
          { id: 'tier_3', label: 'Starting Varsity / Club Keeper', subLabel: 'Reliable shot-stopper; 4–6 clean sheets per season', score: 68, badge: 'Starter' },
          { id: 'tier_2', label: 'All-Conference / ECNL-RL Keeper', subLabel: 'Commands 18-yard box; accurate long distribution & 7+ shutouts', score: 83, badge: 'All-League GK' },
          { id: 'tier_1', label: 'National-Level Shot Stopper', subLabel: 'Saves high-xG chances; modern sweeper-keeper with elite frame', score: 94, badge: 'Elite GK' }
        ],
        combinePrompts: [
          { metricName: 'Clean Sheets (Season)', shortLabel: 'Clean Sheets', placeholder: 'e.g. 8', unitHint: 'Shutouts' },
          { metricName: 'Minutes Played (Season)', shortLabel: 'Minutes Played', placeholder: 'e.g. 1500', unitHint: 'Minutes' }
        ]
      };
    }
    if (pos.includes('cb') || pos.includes('back') || pos.includes('dm')) {
      return {
        impactTitle: 'Defensive Line & Build-Up Control Tier',
        impactSubtitle: 'Rewards 1v1 defending, line-breaking passes, and 90-minute durability',
        impactBuckets: [
          { id: 'tier_4', label: 'Squad Rotation Defender / DM', subLabel: 'Sub appearances & tactical defensive depth', score: 53, badge: 'Rotation' },
          { id: 'tier_3', label: '80+ Minute Starting Anchor', subLabel: 'Wins aerial/ground duels; composed under high press', score: 69, badge: 'Starter' },
          { id: 'tier_2', label: 'Backline Leader / Progressive 6', subLabel: 'Organizes defensive line; dictates tempo & shuts down wingers', score: 83, badge: 'All-League Anchor' },
          { id: 'tier_1', label: 'Premier Lockdown CB / Holding Mid', subLabel: 'Dominant recovery pace, two-footed build-up & ECNL/MLS Next pedigree', score: 94, badge: 'Elite Defender' }
        ],
        combinePrompts: [
          { metricName: '40-Yard Sprint (Sec)', shortLabel: '40-Yd Sprint', placeholder: 'e.g. 4.68', unitHint: 'Seconds' },
          { metricName: 'Minutes Played (Season)', shortLabel: 'Minutes Played', placeholder: 'e.g. 1600', unitHint: 'Minutes' }
        ]
      };
    }
    return {
      impactTitle: 'Attacking Creation & Final-Third Production',
      impactSubtitle: 'Select your 1v1 chance creation, pressing rate, and goal/assist impact',
      impactBuckets: [
        { id: 'tier_4', label: 'Impact Sub / Wing Rotation', subLabel: 'Brings pace and pressing energy off the bench', score: 53, badge: 'Rotation' },
        { id: 'tier_3', label: 'Starting Attacker / Box-to-Box Mid', subLabel: '6–12 combined G+A; consistent link-up play', score: 68, badge: 'Starter' },
        { id: 'tier_2', label: 'Primary Chance Creator / Finisher', subLabel: '14–22 combined G+A; draws double-teams in final third', score: 83, badge: 'All-League Attack' },
        { id: 'tier_1', label: 'Elite Dynamic 9 / Playmaker 10', subLabel: '25+ G+A or premier national club starter with clinical finishing', score: 94, badge: 'D1 Attacker' }
      ],
      combinePrompts: [
        { metricName: 'Goals (Season)', shortLabel: 'Season Goals', placeholder: 'e.g. 15', unitHint: 'Goals' },
        { metricName: 'Assists (Season)', shortLabel: 'Season Assists', placeholder: 'e.g. 10', unitHint: 'Assists' },
        { metricName: '40-Yard Sprint (Sec)', shortLabel: '40-Yd Sprint', placeholder: 'e.g. 4.65', unitHint: 'Seconds' }
      ]
    };
  }

  if (sport === 'Volleyball') {
    return {
      impactTitle: 'Court Rotation & Point-Scoring Efficiency Tier',
      impactSubtitle: 'Select your 6-rotation impact, serve-receive grade, or terminal attack rate',
      impactBuckets: [
        { id: 'tier_4', label: 'Specialized / DS Rotation', subLabel: 'Serving specialist or situational front/back-row sub', score: 53, badge: 'Specialist' },
        { id: 'tier_3', label: 'Starting Lineup Contributor', subLabel: 'Consistent starter in HS/Club; solid block or serve-receive', score: 68, badge: 'Starter' },
        { id: 'tier_2', label: '6-Rotation Terminal Hitter / Floor Captain', subLabel: '3.2+ kills/set, 4.0+ digs/set, or high-tempo 5-1 setter', score: 83, badge: 'All-League' },
        { id: 'tier_1', label: 'Open-Division / D1 Physical Prospect', subLabel: 'Elite net touch, heavy arm swing, or lockdown libero range', score: 94, badge: 'D1 Prospect' }
      ],
      combinePrompts: [
        { metricName: 'Approach Touch', shortLabel: 'Approach Touch', placeholder: "e.g. 9'11\"", unitHint: 'Ft / In' },
        { metricName: 'Block Touch', shortLabel: 'Block Touch', placeholder: "e.g. 9'5\"", unitHint: 'Ft / In' },
        { metricName: pos.includes('libero') ? 'Digs (Per Set)' : 'Kills (Per Set)', shortLabel: pos.includes('libero') ? 'Digs / Set' : 'Kills / Set', placeholder: 'e.g. 3.8', unitHint: 'Per Set' }
      ]
    };
  }

  if (sport === 'Golf') {
    return {
      impactTitle: 'Tournament Scoring & Course Management Tier',
      impactSubtitle: 'Select your typical 18-hole tournament scoring bracket',
      impactBuckets: [
        { id: 'tier_4', label: 'Varsity Lineup Golfer (86–95 Avg)', subLabel: 'Consistent varsity dual-match & invitational qualifier', score: 52, badge: 'Varsity' },
        { id: 'tier_3', label: 'Low-80s Tournament Competitor (79–85 Avg)', subLabel: 'Top-2 on HS roster; regular district/regional medalist contender', score: 68, badge: 'Regional Contender' },
        { id: 'tier_2', label: 'Mid-70s Junior Tour Player (74–78 Avg)', subLabel: 'Competes in state championships & multi-day AJGA/junior tours', score: 83, badge: 'All-State Caliber' },
        { id: 'tier_1', label: 'Par / Sub-Par Collegiate Recruit (≤73 Avg)', subLabel: 'Under-par tournament rounds & national junior golf ranking', score: 95, badge: 'D1 Recruit' }
      ],
      combinePrompts: [
        { metricName: '18-Hole Scoring Average (Season)', shortLabel: '18-Hole Avg', placeholder: 'e.g. 74.2', unitHint: 'Strokes' },
        { metricName: 'Driving Distance (Yds)', shortLabel: 'Driving Dist', placeholder: 'e.g. 280', unitHint: 'Yards' }
      ]
    };
  }

  if (sport === 'Tennis') {
    return {
      impactTitle: 'Match Play & Universal Tennis Rating (UTR) Tier',
      impactSubtitle: 'Select your flight position and verified UTR competitive band',
      impactBuckets: [
        { id: 'tier_4', label: 'Varsity Lineup (#2–#3 Singles / #1 Doubles)', subLabel: 'Consistent conference winner; developing tournament UTR', score: 54, badge: 'Varsity' },
        { id: 'tier_3', label: '#1 Varsity Singles / Sectional Contender', subLabel: 'District/Regional qualifier with strong USTA match volume', score: 69, badge: '#1 Singles' },
        { id: 'tier_2', label: 'State Placer / High-UTR Tournament Player', subLabel: 'Deep state draw runs & verified multi-surface USTA wins', score: 83, badge: 'All-State' },
        { id: 'tier_1', label: 'Blue-Chip / National Ranking Prospect', subLabel: 'Top-tier UTR for gender; ready for immediate collegiate lineup', score: 95, badge: 'D1 Recruit' }
      ],
      combinePrompts: [
        { metricName: 'UTR (Universal Tennis Rating)', shortLabel: 'Verified UTR', placeholder: 'e.g. 9.5', unitHint: '1.0 - 16.5' },
        { metricName: 'First Serve % (Season)', shortLabel: '1st Serve %', placeholder: 'e.g. 64', unitHint: 'Percent' }
      ]
    };
  }

  // Fallback for Lacrosse, Ice Hockey, Field Hockey, Water Polo, Gymnastics, Bowling, Fencing
  return {
    impactTitle: `${sport} Competitive Impact & Role Tier`,
    impactSubtitle: 'Select the tier that best describes your current starting status and competitive output',
    impactBuckets: [
      { id: 'tier_4', label: 'Rotational / Developmental Contributor', subLabel: 'Building varsity experience & specialized situational role', score: 52, badge: 'Developing' },
      { id: 'tier_3', label: 'Consistent Varsity Starter', subLabel: 'Reliable every-game starter executing core scheme duties', score: 68, badge: 'Varsity Starter' },
      { id: 'tier_2', label: 'High-Impact All-Conference Performer', subLabel: 'Top statistical leader on team; recognized across conference', score: 82, badge: 'All-Conference' },
      { id: 'tier_1', label: 'Elite All-State / National Prospect', subLabel: 'Dominant two-way force competing against top regional/national talent', score: 94, badge: 'Elite Prospect' }
    ],
    combinePrompts: (SPORT_CONFIGS_META[sport]?.defaultMetrics || []).slice(0, 3).map((m) => ({
      metricName: m,
      shortLabel: m.split('(')[0].trim(),
      placeholder: 'Enter mark',
      unitHint: m.includes('(') ? m.split('(')[1].replace(')', '') : 'Value'
    }))
  };
};

export const convertMarkToNumber = (markStr: string, type: MetricType): number => {
  if (!markStr) return NaN;
  const str = String(markStr).trim();

  if (type === 'distance') {
    const clean = str.replace(/[^0-9.]/g, ' ').trim().split(/\s+/);
    const feet = parseFloat(clean[0]) || 0;
    const inches = parseFloat(clean[1]) || 0;
    return (feet * 12) + inches;
  }
  if (type === 'time' && str.includes(':')) {
    const parts = str.split(':');
    return (parseFloat(parts[0]) * 60) + parseFloat(parts[1]);
  }
  return parseFloat(str.replace(/[a-zA-Z%"']/g, '').trim());
};

export const evaluateMetric = (
  gender: string,
  sport: string,
  metricName: string,
  valueStr: string,
  level: string = 'Varsity Starter'
) => {
  const normGender =
    gender === 'Girls' || gender === 'girls' || gender === 'Female' || gender === 'female' || gender === 'F'
      ? 'Girls'
      : 'Boys';

  const std =
    UNIVERSAL_STANDARDS[normGender]?.[sport]?.[metricName] ||
    UNIVERSAL_STANDARDS['Boys']?.[sport]?.[metricName] ||
    UNIVERSAL_STANDARDS['Girls']?.[sport]?.[metricName];

  if (!std) return null;

  const rawVal = convertMarkToNumber(valueStr, std.type);
  if (isNaN(rawVal) || rawVal < 0) return null;

  let val = rawVal;
  // Only apply level modifiers to box-score counting/rate stats, NEVER to objective combine measurables or stopwatch times
  if (std.type === 'stat') val = rawVal * (LEVEL_MODIFIERS[level] || 1.0);
  if (std.type === 'inverse_stat') val = rawVal / (LEVEL_MODIFIERS[level] || 1.0);

  let score = 5;
  let currentTier = 'JV Standard';

  if (std.type === 'distance' || std.type === 'stat' || std.type === 'measurable') {
    if (val >= std.t1) { score = 95 + Math.min(4, ((val - std.t1) / (std.t1 * 0.05)) * 4); currentTier = 'Power 4 D1'; }
    else if (val >= std.t2) { score = 85 + ((val - std.t2) / (std.t1 - std.t2)) * 10; currentTier = 'Mid-Major D1'; }
    else if (val >= std.t3) { score = 75 + ((val - std.t3) / (std.t2 - std.t3)) * 10; currentTier = 'Top D2 / Walk-on'; }
    else if (val >= std.t4) { score = 65 + ((val - std.t4) / (std.t3 - std.t4)) * 10; currentTier = 'Solid D2 / High D3'; }
    else if (val >= std.t5) { score = 55 + ((val - std.t5) / (std.t4 - std.t5)) * 10; currentTier = 'D3 / NAIA'; }
    else if (val >= std.t6) { score = 40 + ((val - std.t6) / (std.t5 - std.t6)) * 14; currentTier = 'Strong Varsity'; }
    else if (val >= std.t7) { score = 20 + ((val - std.t7) / (std.t6 - std.t7)) * 19; currentTier = 'Varsity Standard'; }
    else { score = 5 + (val / std.t7) * 15; currentTier = 'Developing Athlete'; }
  } else {
    if (val <= std.t1) { score = 95 + Math.min(4, ((std.t1 - val) / (std.t1 * 0.05)) * 4); currentTier = 'Power 4 D1'; }
    else if (val <= std.t2) { score = 85 + ((std.t2 - val) / (std.t2 - std.t1)) * 10; currentTier = 'Mid-Major D1'; }
    else if (val <= std.t3) { score = 75 + ((std.t3 - val) / (std.t3 - std.t2)) * 10; currentTier = 'Top D2 / Walk-on'; }
    else if (val <= std.t4) { score = 65 + ((std.t4 - val) / (std.t4 - std.t3)) * 10; currentTier = 'Solid D2 / High D3'; }
    else if (val <= std.t5) { score = 55 + ((std.t5 - val) / (std.t5 - std.t4)) * 10; currentTier = 'D3 / NAIA'; }
    else if (val <= std.t6) { score = 40 + ((std.t6 - val) / (std.t6 - std.t5)) * 14; currentTier = 'Strong Varsity'; }
    else if (val <= std.t7) { score = 20 + ((std.t7 - val) / (std.t7 - std.t6)) * 19; currentTier = 'Varsity Standard'; }
    else { score = 10; currentTier = 'Developing Athlete'; }
  }

  return { score: Math.min(99, Math.max(5, Math.round(score))), currentTier };
};

export const getOverallTier = (score: number) => {
  if (score >= 95) return { label: 'Power 4 D1 Recruit', desc: 'Top-tier prospect for major collegiate programs.', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200' };
  if (score >= 85) return { label: 'Mid-Major D1 Recruit', desc: 'Strong scholarship-level prospect.', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
  if (score >= 75) return { label: 'Top D2 / D1 Walk-On', desc: 'Highly competitive collegiate profile.', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
  if (score >= 65) return { label: 'Solid D2 / High D3', desc: 'Great fit for regional competitive programs.', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (score >= 55) return { label: 'D3 / NAIA Prospect', desc: 'Solid next-level potential.', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
  if (score >= 40) return { label: 'Strong Varsity', desc: 'Excellent high school competitor.', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' };
  return { label: 'Developing Athlete', desc: 'Keep grinding to hit recruiting standards.', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };
};

export const getRealStats = (college: any) => {
  if (!college) return { tuitionStr: 'N/A', salaryStr: 'N/A', gradRateStr: 'N/A', popStr: 'N/A', matchScore: 0 };

  const rawTuition = college.tuition_out_of_state || college.out_of_state_tuition || college.tuition_in_state || college.tuition || 0;
  const rawSalary = college.median_earnings || college.median_salary || 0;
  const rawGradRate = college.graduation_rate || college.acceptance_rate || 0;
  const popStr = college.student_population ? Number(college.student_population).toLocaleString() : 'N/A';

  const formatCurrencyLocal = (val: any) => {
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : Number(val);
    if (!num || isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  const seed = college.name ? college.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 100;
  const matchScore = 60 + (seed % 39);

  return {
    tuitionStr: formatCurrencyLocal(rawTuition) !== 'N/A' ? `${formatCurrencyLocal(rawTuition)}/yr` : 'N/A',
    salaryStr: formatCurrencyLocal(rawSalary),
    gradRateStr: rawGradRate,
    popStr,
    matchScore
  };
};