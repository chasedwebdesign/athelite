// ==========================================
// 🚨 PROPRIETARY RECRUITING STANDARDS ENGINE 🚨
// ==========================================

export type MetricType = 'time' | 'distance' | 'stat' | 'inverse_stat';

export interface Standard {
  t1: number; t2: number; t3: number; t4: number; t5: number; t6: number; t7: number;
  type: MetricType;
}

export const UNIVERSAL_STANDARDS: Record<string, Record<string, Record<string, Standard>>> = {
  'Boys': {
    'Track & Field': {
      '60 Meters': { t1: 6.75, t2: 6.90, t3: 7.05, t4: 7.20, t5: 7.40, t6: 7.60, t7: 8.00, type: 'time' },
      '100 Meters': { t1: 10.5, t2: 10.7, t3: 10.9, t4: 11.1, t5: 11.4, t6: 11.8, t7: 12.5, type: 'time' },
      '200 Meters': { t1: 21.2, t2: 21.7, t3: 22.1, t4: 22.6, t5: 23.2, t6: 24.2, t7: 25.5, type: 'time' },
      '400 Meters': { t1: 47.5, t2: 48.8, t3: 50.0, t4: 51.0, t5: 52.5, t6: 54.5, t7: 57.0, type: 'time' },
      '800 Meters': { t1: 111, t2: 114, t3: 116, t4: 119, t5: 124, t6: 130, t7: 140, type: 'time' }, 
      '1500 Meters': { t1: 231, t2: 239, t3: 244, t4: 250, t5: 264, t6: 275, t7: 300, type: 'time' },
      '1600 Meters': { t1: 248, t2: 256, t3: 262, t4: 268, t5: 280, t6: 295, t7: 320, type: 'time' }, 
      '3200 Meters': { t1: 540, t2: 560, t3: 575, t4: 590, t5: 620, t6: 650, t7: 720, type: 'time' }, 
      '110m Hurdles': { t1: 13.8, t2: 14.2, t3: 14.6, t4: 15.0, t5: 15.5, t6: 16.5, t7: 18.5, type: 'time' },
      '300m Hurdles': { t1: 37.0, t2: 38.5, t3: 39.5, t4: 41.0, t5: 42.5, t6: 44.5, t7: 48.0, type: 'time' },
      'Long Jump': { t1: 288, t2: 276, t3: 264, t4: 252, t5: 240, t6: 228, t7: 204, type: 'distance' }, 
      'Triple Jump': { t1: 588, t2: 564, t3: 540, t4: 516, t5: 492, t6: 468, t7: 420, type: 'distance' }, 
      'High Jump': { t1: 82, t2: 78, t3: 76, t4: 74, t5: 70, t6: 66, t7: 60, type: 'distance' }, 
      'Pole Vault': { t1: 198, t2: 186, t3: 174, t4: 162, t5: 150, t6: 132, t7: 108, type: 'distance' },
      'Shot Put': { t1: 720, t2: 660, t3: 600, t4: 540, t5: 480, t6: 444, t7: 360, type: 'distance' }, 
      'Discus': { t1: 2220, t2: 2040, t3: 1860, t4: 1740, t5: 1620, t6: 1440, t7: 1080, type: 'distance' },
      'Javelin': { t1: 2340, t2: 2160, t3: 2040, t4: 1920, t5: 1800, t6: 1620, t7: 1200, type: 'distance' },
    },
    'Basketball': {
      'Points (Per Game)': { t1: 22, t2: 18, t3: 15, t4: 12, t5: 10, t6: 7, t7: 4, type: 'stat' },
      'Rebounds (Per Game)': { t1: 10, t2: 8, t3: 7, t4: 5, t5: 4, t6: 3, t7: 2, type: 'stat' },
      'Assists (Per Game)': { t1: 7, t2: 5, t3: 4, t4: 3, t5: 2, t6: 1, t7: 0.5, type: 'stat' },
      'Field Goal % (Season)': { t1: 58, t2: 53, t3: 48, t4: 45, t5: 42, t6: 38, t7: 35, type: 'stat' },
      '3-Point % (Season)': { t1: 42, t2: 38, t3: 35, t4: 32, t5: 28, t6: 25, t7: 22, type: 'stat' },
    },
    'Baseball': {
      'Fastball Velocity (MPH)': { t1: 93, t2: 89, t3: 86, t4: 83, t5: 80, t6: 77, t7: 74, type: 'stat' },
      'Batting Average (Season)': { t1: 0.450, t2: 0.410, t3: 0.380, t4: 0.340, t5: 0.310, t6: 0.280, t7: 0.250, type: 'stat' },
      'Earned Run Average (Season)': { t1: 1.50, t2: 2.10, t3: 2.75, t4: 3.50, t5: 4.25, t6: 5.00, t7: 6.00, type: 'inverse_stat' },
    },
    'Golf': {
      '18-Hole Scoring Average (Season)': { t1: 71, t2: 73, t3: 75, t4: 78, t5: 82, t6: 86, t7: 92, type: 'inverse_stat' },
      '9-Hole Scoring Average (Season)': { t1: 35, t2: 36, t3: 37, t4: 39, t5: 41, t6: 43, t7: 46, type: 'inverse_stat' },
    },
    'Volleyball': {
      'Kills (Per Set)': { t1: 5.0, t2: 4.2, t3: 3.5, t4: 2.8, t5: 2.2, t6: 1.8, t7: 1.2, type: 'stat' },
      'Digs (Per Set)': { t1: 6.0, t2: 5.0, t3: 4.2, t4: 3.5, t5: 2.8, t6: 2.2, t7: 1.5, type: 'stat' },
    }
  },
  'Girls': {
    'Track & Field': {
      '60 Meters': { t1: 7.45, t2: 7.65, t3: 7.85, t4: 8.05, t5: 8.30, t6: 8.60, t7: 9.20, type: 'time' },
      '100 Meters': { t1: 11.7, t2: 11.9, t3: 12.3, t4: 12.6, t5: 13.0, t6: 13.5, t7: 14.5, type: 'time' },
      '200 Meters': { t1: 24.2, t2: 24.6, t3: 25.2, t4: 25.8, t5: 26.8, t6: 28.5, t7: 31.0, type: 'time' },
      '400 Meters': { t1: 54.5, t2: 56.5, t3: 58.0, t4: 60.0, t5: 62.5, t6: 66.0, t7: 72.0, type: 'time' },
      '800 Meters': { t1: 130, t2: 134, t3: 138, t4: 143, t5: 150, t6: 160, t7: 175, type: 'time' }, 
      '1500 Meters': { t1: 268, t2: 282, t3: 291, t4: 300, t5: 314, t6: 330, t7: 375, type: 'time' },
      '1600 Meters': { t1: 290, t2: 302, t3: 312, t4: 322, t5: 340, t6: 360, t7: 400, type: 'time' }, 
      '3000 Meters': { t1: 583, t2: 611, t3: 638, t4: 666, t5: 694, t6: 730, t7: 840, type: 'time' },
      '3200 Meters': { t1: 630, t2: 655, t3: 680, t4: 710, t5: 750, t6: 800, t7: 900, type: 'time' }, 
      '100m Hurdles': { t1: 13.8, t2: 14.3, t3: 14.8, t4: 15.5, t5: 16.5, t6: 17.8, t7: 20.0, type: 'time' },
      '300m Hurdles': { t1: 42.5, t2: 44.5, t3: 46.5, t4: 48.5, t5: 51.0, t6: 54.0, t7: 59.0, type: 'time' },
      'Long Jump': { t1: 234, t2: 222, t3: 210, t4: 198, t5: 186, t6: 174, t7: 150, type: 'distance' }, 
      'Triple Jump': { t1: 480, t2: 456, t3: 432, t4: 408, t5: 384, t6: 360, t7: 312, type: 'distance' },
      'High Jump': { t1: 68, t2: 64, t3: 62, t4: 60, t5: 58, t6: 54, t7: 50, type: 'distance' }, 
      'Pole Vault': { t1: 156, t2: 144, t3: 132, t4: 120, t5: 108, t6: 90, t7: 72, type: 'distance' },
      'Shot Put': { t1: 540, t2: 480, t3: 432, t4: 396, t5: 360, t6: 324, t7: 264, type: 'distance' }, 
      'Discus': { t1: 1800, t2: 1620, t3: 1500, t4: 1380, t5: 1260, t6: 1080, t7: 840, type: 'distance' },
      'Javelin': { t1: 1740, t2: 1560, t3: 1440, t4: 1320, t5: 1200, t6: 1020, t7: 780, type: 'distance' },
    },
    'Basketball': {
      'Points (Per Game)': { t1: 20, t2: 16, t3: 13, t4: 10, t5: 8, t6: 5, t7: 3, type: 'stat' },
      'Rebounds (Per Game)': { t1: 10, t2: 8, t3: 7, t4: 5, t5: 4, t6: 3, t7: 2, type: 'stat' },
      'Assists (Per Game)': { t1: 7, t2: 5, t3: 4, t4: 3, t5: 2.5, t6: 1.5, t7: 1, type: 'stat' },
      'Field Goal % (Season)': { t1: 55, t2: 50, t3: 45, t4: 40, t5: 35, t6: 32, t7: 28, type: 'stat' },
      '3-Point % (Season)': { t1: 40, t2: 35, t3: 32, t4: 28, t5: 25, t6: 22, t7: 18, type: 'stat' },
    },
    'Soccer': {
      'Minutes Played (Season)': { t1: 1800, t2: 1500, t3: 1200, t4: 900, t5: 600, t6: 300, t7: 150, type: 'stat' },
      'Goals (Season)': { t1: 22, t2: 18, t3: 14, t4: 10, t5: 8, t6: 5, t7: 2, type: 'stat' },
      'Assists (Season)': { t1: 15, t2: 12, t3: 9, t4: 7, t5: 5, t6: 3, t7: 1, type: 'stat' },
      'Clean Sheets (Season)': { t1: 10, t2: 8, t3: 6, t4: 4, t5: 3, t6: 2, t7: 1, type: 'stat' },
    },
    'Volleyball': {
      'Kills (Per Set)': { t1: 4.5, t2: 3.8, t3: 3.2, t4: 2.5, t5: 2.0, t6: 1.5, t7: 1.0, type: 'stat' },
      'Digs (Per Set)': { t1: 5.5, t2: 4.5, t3: 3.8, t4: 3.0, t5: 2.5, t6: 2.0, t7: 1.5, type: 'stat' },
      'Aces (Per Set)': { t1: 0.8, t2: 0.6, t3: 0.5, t4: 0.4, t5: 0.3, t6: 0.2, t7: 0.1, type: 'stat' },
    },
    'Softball': {
      'Fastball Velocity (MPH)': { t1: 65, t2: 62, t3: 59, t4: 56, t5: 54, t6: 51, t7: 48, type: 'stat' },
      'Batting Average (AVG)': { t1: 0.480, t2: 0.440, t3: 0.400, t4: 0.360, t5: 0.320, t6: 0.280, t7: 0.250, type: 'stat' },
      'Earned Run Average (ERA)': { t1: 1.20, t2: 1.80, t3: 2.40, t4: 3.00, t5: 3.80, t6: 4.50, t7: 5.50, type: 'inverse_stat' },
    },
    'Golf': {
      '18-Hole Scoring Average (Season)': { t1: 74, t2: 77, t3: 80, t4: 84, t5: 88, t6: 94, t7: 100, type: 'inverse_stat' },
      '9-Hole Scoring Average (Season)': { t1: 37, t2: 38, t3: 40, t4: 42, t5: 44, t6: 47, t7: 50, type: 'inverse_stat' },
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
  'Track & Field': { positions: ['Sprints', 'Distance', 'Hurdles', 'Jumps', 'Throws', 'Vault'], requiresLevel: false, defaultMetrics: ['100 Meters', '200 Meters', '400 Meters', '800 Meters', '1500 Meters', '1600 Meters', '3200 Meters', '110m Hurdles', '300m Hurdles', 'Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault', 'Shot Put', 'Discus', 'Javelin'] },
  'Cross Country': { positions: ['Runner'], requiresLevel: false, defaultMetrics: [] }, 
  'Swimming & Diving': { positions: ['Freestyle Sprint', 'Freestyle Distance', 'Backstroke', 'Breaststroke', 'Butterfly', 'Individual Medley', 'Diver'], requiresLevel: false, defaultMetrics: [] },
  'Golf': { positions: ['Golfer'], requiresLevel: false, defaultMetrics: ['18-Hole Scoring Average (Season)', '9-Hole Scoring Average (Season)', 'Tournament Wins (Career)', 'Driving Distance (Yds)'] },
  'Basketball': { positions: ['Point Guard (PG)', 'Shooting Guard (SG)', 'Small Forward (SF)', 'Power Forward (PF)', 'Center (C)'], requiresLevel: true, defaultMetrics: [] }, 
  'Soccer': { positions: ['Goalkeeper (GK)', 'Center Back (CB)', 'Fullback (LB/RB)', 'Defensive Midfielder (DM)', 'Attacking Midfielder (AM)', 'Winger (LW/RW)', 'Striker (ST)'], requiresLevel: true, defaultMetrics: [] }, 
  'Football': { positions: ['Quarterback (QB)', 'Running Back (RB)', 'Wide Receiver (WR)', 'Tight End (TE)', 'Offensive Lineman (OL)', 'Defensive Lineman (DL)', 'Linebacker (LB)', 'Cornerback / Safety (DB)', 'Kicker / Punter (ST)'], requiresLevel: true, defaultMetrics: [] }, 
  'Lacrosse': { positions: ['Attack', 'Midfield', 'Defense', 'Goalie', 'Faceoff Specialist (FO)'], requiresLevel: true, defaultMetrics: [] },
  'Field Hockey': { positions: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'], requiresLevel: true, defaultMetrics: [] }, 
  'Volleyball': { positions: ['Setter (S)', 'Outside Hitter (OH)', 'Opposite Hitter (OPP)', 'Middle Blocker (MB)', 'Libero / Defensive Specialist (L/DS)'], requiresLevel: true, defaultMetrics: [] }, 
  'Baseball': { positions: ['Pitcher (RHP/LHP)', 'Catcher (C)', 'First Base (1B)', 'Infield (2B/3B/SS)', 'Outfield (LF/CF/RF)'], requiresLevel: true, defaultMetrics: ['Batting Average (Season)', 'On-Base Plus Slugging (Season)', 'Home Runs (Season)', 'RBI (Season)', 'Stolen Bases (Season)', 'Earned Run Average (Season)', 'Fastball Velocity (MPH)'] },
  'Softball': { positions: ['Pitcher', 'Catcher', 'First Base', 'Infield', 'Outfield'], requiresLevel: true, defaultMetrics: ['Batting Average (Season)', 'On-Base Plus Slugging (Season)', 'Home Runs (Season)', 'RBI (Season)', 'Stolen Bases (Season)', 'Earned Run Average (Season)', 'Fastball Velocity (MPH)'] },
  'Wrestling': { positions: ['106 lbs', '113 lbs', '120 lbs', '126 lbs', '132 lbs', '138 lbs', '144 lbs', '150 lbs', '157 lbs', '165 lbs', '175 lbs', '190 lbs', '215 lbs', '285 lbs'], requiresLevel: true, defaultMetrics: ['Season Record (W-L)', 'Career Wins', 'Pins / Falls (Season)', 'Takedowns (Season)'] },
  'Tennis': { positions: ['Singles Player', 'Doubles Player'], requiresLevel: true, defaultMetrics: ['UTR (Universal Tennis Rating)', 'Season Record (W-L)', 'Career Wins', 'First Serve % (Season)'] },
  'Ice Hockey': { positions: ['Center', 'Winger', 'Defenseman', 'Goaltender'], requiresLevel: true, defaultMetrics: ['Goals (Season)', 'Assists (Season)', 'Total Points (Season)', 'Plus/Minus (+/-)', 'Save % (Season)', 'Goals Against Average (Season)'] },
  'Water Polo': { positions: ['Driver', 'Utility', 'Center Forward (2M Attack)', 'Center Defender (2M Guard)', 'Goalkeeper'], requiresLevel: true, defaultMetrics: ['Goals (Season)', 'Assists (Season)', 'Steals (Season)', 'Sprints Won (Season)', 'Saves (Season)'] },
  'Gymnastics': { positions: ['All-Around', 'Vault Specialist', 'Bars Specialist', 'Beam Specialist', 'Floor Specialist'], requiresLevel: true, defaultMetrics: ['All-Around High Score', 'Vault High Score', 'Uneven Bars High Score', 'Balance Beam High Score', 'Floor Exercise High Score'] },
  'Bowling': { positions: ['Bowler'], requiresLevel: true, defaultMetrics: ['High Game (Career)', 'High 3-Game Series', 'Season Average', 'Strike % (Season)', 'Spare Conversion % (Season)'] },
  'Fencing': { positions: ['Foil Specialist', 'Épée Specialist', 'Sabre Specialist'], requiresLevel: true, defaultMetrics: ['National Points / Ranking', 'Regional Record (W-L)', 'Touches Scored (Season)', 'Touches Received (Season)'] }
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

export const convertMarkToNumber = (markStr: string, type: MetricType): number => {
  if (type === 'distance') {
    const clean = markStr.replace(/[^0-9.]/g, ' ').trim().split(/\s+/);
    const feet = parseFloat(clean[0]) || 0;
    const inches = parseFloat(clean[1]) || 0;
    return (feet * 12) + inches;
  } 
  if (type === 'time' && markStr.includes(':')) {
    const parts = markStr.split(':');
    return (parseFloat(parts[0]) * 60) + parseFloat(parts[1]);
  }
  return parseFloat(markStr.replace(/[a-zA-Z%"']/g, '').trim()); 
};

export const evaluateMetric = (gender: string, sport: string, metricName: string, valueStr: string, level: string = 'Varsity Starter') => {
  const std = UNIVERSAL_STANDARDS[gender]?.[sport]?.[metricName];
  if (!std) return null;

  const rawVal = convertMarkToNumber(valueStr, std.type);
  if (isNaN(rawVal) || rawVal < 0) return null; 

  let val = rawVal;
  if (std.type === 'stat') val = rawVal * (LEVEL_MODIFIERS[level] || 1.0);
  if (std.type === 'inverse_stat') val = rawVal / (LEVEL_MODIFIERS[level] || 1.0);

  let score = 5;
  let currentTier = 'JV Standard';
  
  if (std.type === 'distance' || std.type === 'stat') {
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
    else if (val <= std.t3) { score = 75 + ((std.t3 - val) / (std.t3 - std.t2)) * 10; currentTier = 'Top D2 / Walk-on';  }
    else if (val <= std.t4) { score = 65 + ((std.t4 - val) / (std.t4 - std.t3)) * 10; currentTier = 'Solid D2 / High D3';  }
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
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g,"")) : Number(val);
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