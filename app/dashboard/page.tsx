'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, Trophy, Search, Activity, ChevronRight, BookOpen, Users, 
  TrendingUp, Landmark, SlidersHorizontal, ChevronDown, ChevronUp, 
  DollarSign, Percent, Award, Gem, RotateCcw, Bookmark, RefreshCw,
  UserCircle2, School, ShieldCheck, BookmarkPlus, Check, Trash2, 
  FileText, Save, ArrowRight, Medal, Plus, LogOut, X, Target, 
  Dumbbell, Scale, Swords, Globe, CheckCircle2, GraduationCap, Flame,
  Rocket, Crown, Calendar, Gift, Paintbrush, Share2, AlertCircle, Lock, Eye, Link as LinkIcon, Image as ImageIcon, 
  Download, CheckSquare, Square, Briefcase, Mail, Sparkles, Smartphone, BarChart2, Timer
} from 'lucide-react';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

// ==========================================
// 🚨 PROPRIETARY RECRUITING STANDARDS ENGINE 🚨
// ==========================================
type MetricType = 'time' | 'distance' | 'stat' | 'inverse_stat';

interface Standard {
  t1: number; t2: number; t3: number; t4: number; t5: number; t6: number; t7: number;
  type: MetricType;
}

const UNIVERSAL_STANDARDS: Record<string, Record<string, Record<string, Standard>>> = {
  'Boys': {
    'Track & Field': {
      '60 Meters': { t1: 6.75, t2: 6.90, t3: 7.05, t4: 7.20, t5: 7.40, t6: 7.60, t7: 8.00, type: 'time' },
      '100 Meters': { t1: 10.5, t2: 10.8, t3: 11.0, t4: 11.3, t5: 11.6, t6: 11.9, t7: 12.6, type: 'time' },
      '200 Meters': { t1: 21.2, t2: 21.8, t3: 22.2, t4: 22.8, t5: 23.5, t6: 24.5, t7: 26.0, type: 'time' },
      '400 Meters': { t1: 47.5, t2: 49.0, t3: 50.0, t4: 51.5, t5: 53.0, t6: 55.0, t7: 58.0, type: 'time' },
      '800 Meters': { t1: 112, t2: 115, t3: 117, t4: 120, t5: 125, t6: 130, t7: 140, type: 'time' }, 
      '1500 Meters': { t1: 231, t2: 239, t3: 244, t4: 250, t5: 264, t6: 275, t7: 300, type: 'time' },
      '1600 Meters': { t1: 250, t2: 258, t3: 264, t4: 270, t5: 285, t6: 295, t7: 320, type: 'time' }, 
      '3200 Meters': { t1: 540, t2: 560, t3: 575, t4: 590, t5: 620, t6: 650, t7: 720, type: 'time' }, 
      '110m Hurdles': { t1: 13.8, t2: 14.2, t3: 14.6, t4: 15.0, t5: 15.5, t6: 16.5, t7: 18.5, type: 'time' },
      '300m Hurdles': { t1: 37.0, t2: 38.5, t3: 39.5, t4: 41.0, t5: 42.5, t6: 44.5, t7: 48.0, type: 'time' },
      'Long Jump': { t1: 288, t2: 270, t3: 260, t4: 252, t5: 240, t6: 228, t7: 204, type: 'distance' }, 
      'Triple Jump': { t1: 588, t2: 564, t3: 540, t4: 516, t5: 492, t6: 468, t7: 420, type: 'distance' }, 
      'High Jump': { t1: 82, t2: 78, t3: 76, t4: 74, t5: 70, t6: 66, t7: 60, type: 'distance' }, 
      'Pole Vault': { t1: 198, t2: 186, t3: 174, t4: 162, t5: 150, t6: 132, t7: 108, type: 'distance' },
      'Shot Put': { t1: 720, t2: 660, t3: 600, t4: 540, t5: 480, t6: 444, t7: 360, type: 'distance' }, 
      'Discus': { t1: 2220, t2: 2040, t3: 1860, t4: 1740, t5: 1620, t6: 1440, t7: 1080, type: 'distance' },
      'Javelin': { t1: 2340, t2: 2160, t3: 2040, t4: 1920, t5: 1800, t6: 1620, t7: 1200, type: 'distance' },
    },
    'Cross Country': {
      '5K XC': { t1: 885, t2: 930, t3: 960, t4: 990, t5: 1020, t6: 1080, t7: 1140, type: 'time' },
      '3-Mile XC': { t1: 840, t2: 880, t3: 910, t4: 940, t5: 970, t6: 1020, t7: 1080, type: 'time' }
    },
    'Swimming & Diving': {
      '50 Free (SCY)': { t1: 20.5, t2: 21.2, t3: 21.8, t4: 22.5, t5: 23.5, t6: 24.5, t7: 26.0, type: 'time' },
      '100 Free (SCY)': { t1: 44.5, t2: 46.0, t3: 47.5, t4: 49.0, t5: 51.5, t6: 54.0, t7: 58.0, type: 'time' },
      '100 Fly (SCY)': { t1: 48.5, t2: 50.5, t3: 52.0, t4: 54.0, t5: 57.0, t6: 60.0, t7: 65.0, type: 'time' },
    },
    'Basketball': {
      'Points (Per Game)': { t1: 24, t2: 20, t3: 17, t4: 14, t5: 11, t6: 8, t7: 5, type: 'stat' },
      'Rebounds (Per Game)': { t1: 12, t2: 10, t3: 8, t4: 6, t5: 5, t6: 4, t7: 3, type: 'stat' },
      'Assists (Per Game)': { t1: 8, t2: 6, t3: 5, t4: 4, t5: 3, t6: 2, t7: 1, type: 'stat' },
      'Field Goal % (Season)': { t1: 60, t2: 55, t3: 50, t4: 46, t5: 42, t6: 38, t7: 35, type: 'stat' },
      '3-Point % (Season)': { t1: 42, t2: 38, t3: 35, t4: 32, t5: 28, t6: 25, t7: 22, type: 'stat' },
    },
    'Soccer': {
      'Goals (Season)': { t1: 25, t2: 20, t3: 15, t4: 12, t5: 9, t6: 6, t7: 3, type: 'stat' },
      'Assists (Season)': { t1: 18, t2: 14, t3: 10, t4: 8, t5: 6, t6: 4, t7: 2, type: 'stat' },
      'Clean Sheets (Season)': { t1: 12, t2: 10, t3: 8, t4: 6, t5: 4, t6: 3, t7: 1, type: 'stat' },
    },
    'Football': {
      'Passing Yards (Season)': { t1: 3200, t2: 2800, t3: 2400, t4: 1800, t5: 1400, t6: 1000, t7: 700, type: 'stat' },
      'Rushing Yards (Season)': { t1: 1800, t2: 1500, t3: 1200, t4: 900, t5: 700, t6: 500, t7: 300, type: 'stat' },
      'Receiving Yards (Season)': { t1: 1200, t2: 1000, t3: 800, t4: 600, t5: 450, t6: 300, t7: 200, type: 'stat' },
      'Tackles (Season)': { t1: 120, t2: 100, t3: 85, t4: 70, t5: 55, t6: 40, t7: 25, type: 'stat' },
      'Sacks (Season)': { t1: 15, t2: 12, t3: 9, t4: 7, t5: 5, t6: 3, t7: 1, type: 'stat' },
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
      '100 Meters': { t1: 11.7, t2: 12.1, t3: 12.4, t4: 12.8, t5: 13.2, t6: 13.6, t7: 14.5, type: 'time' },
      '200 Meters': { t1: 24.2, t2: 24.8, t3: 25.5, t4: 26.2, t5: 27.0, t6: 28.5, t7: 31.0, type: 'time' },
      '400 Meters': { t1: 54.5, t2: 57.0, t3: 58.5, t4: 60.5, t5: 63.0, t6: 66.0, t7: 72.0, type: 'time' },
      '800 Meters': { t1: 130, t2: 135, t3: 140, t4: 145, t5: 152, t6: 160, t7: 175, type: 'time' }, 
      '1500 Meters': { t1: 268, t2: 282, t3: 291, t4: 300, t5: 314, t6: 330, t7: 375, type: 'time' },
      '1600 Meters': { t1: 290, t2: 305, t3: 315, t4: 325, t5: 340, t6: 360, t7: 400, type: 'time' }, 
      '3000 Meters': { t1: 583, t2: 611, t3: 638, t4: 666, t5: 694, t6: 730, t7: 840, type: 'time' },
      '3200 Meters': { t1: 630, t2: 660, t3: 690, t4: 720, t5: 750, t6: 800, t7: 900, type: 'time' }, 
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
    'Cross Country': {
      '5K XC': { t1: 1050, t2: 1110, t3: 1155, t4: 1200, t5: 1260, t6: 1350, t7: 1440, type: 'time' },
      '3-Mile XC': { t1: 1000, t2: 1050, t3: 1090, t4: 1140, t5: 1200, t6: 1290, t7: 1380, type: 'time' }
    },
    'Swimming & Diving': {
      '50 Free (SCY)': { t1: 23.0, t2: 24.0, t3: 24.8, t4: 25.5, t5: 26.5, t6: 28.0, t7: 30.0, type: 'time' },
      '100 Free (SCY)': { t1: 50.5, t2: 52.5, t3: 54.0, t4: 56.0, t5: 58.5, t6: 62.0, t7: 66.0, type: 'time' },
    },
    'Basketball': {
      'Points (Per Game)': { t1: 22, t2: 18, t3: 15, t4: 12, t5: 10, t6: 7, t7: 4, type: 'stat' },
      'Rebounds (Per Game)': { t1: 10, t2: 8, t3: 7, t4: 5, t5: 4, t6: 3, t7: 2, type: 'stat' },
      'Assists (Per Game)': { t1: 7, t2: 5, t3: 4, t4: 3, t5: 2.5, t6: 1.5, t7: 1, type: 'stat' },
      'Field Goal % (Season)': { t1: 55, t2: 50, t3: 45, t4: 40, t5: 35, t6: 32, t7: 28, type: 'stat' },
      '3-Point % (Season)': { t1: 40, t2: 35, t3: 32, t4: 28, t5: 25, t6: 22, t7: 18, type: 'stat' },
    },
    'Soccer': {
      'Goals (Season)': { t1: 22, t2: 18, t3: 14, t4: 10, t5: 8, t6: 5, t7: 2, type: 'stat' },
      'Assists (Season)': { t1: 15, t2: 12, t3: 9, t4: 7, t5: 5, t6: 3, t7: 1, type: 'stat' },
      'Clean Sheets (Season)': { t1: 10, t2: 8, t3: 6, t4: 4, t5: 3, t6: 2, t7: 1, type: 'stat' },
    },
    'Volleyball': {
      'Kills (Per Set)': { t1: 5.0, t2: 4.2, t3: 3.5, t4: 2.8, t5: 2.2, t6: 1.8, t7: 1.2, type: 'stat' },
      'Digs (Per Set)': { t1: 6.0, t2: 5.0, t3: 4.2, t4: 3.5, t5: 2.8, t6: 2.2, t7: 1.5, type: 'stat' },
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

interface SportMetaConfig {
  positions: string[];
  requiresLevel: boolean;
  requiresAthleticism: boolean;
  defaultMetrics: string[];
}

const SPORT_CONFIGS_META: Record<string, SportMetaConfig> = {
  'Track & Field': { positions: ['Sprints', 'Distance', 'Hurdles', 'Jumps', 'Throws', 'Vault'], requiresLevel: false, requiresAthleticism: false, defaultMetrics: ['100 Meters', '200 Meters', '400 Meters', '800 Meters', '1500 Meters', '1600 Meters', '3200 Meters', '110m Hurdles', '300m Hurdles', 'Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault', 'Shot Put', 'Discus', 'Javelin'] },
  'Cross Country': { positions: ['Runner'], requiresLevel: false, requiresAthleticism: false, defaultMetrics: ['5K XC', '3-Mile XC', '2-Mile XC'] },
  'Swimming & Diving': { positions: ['Freestyle Sprint', 'Freestyle Distance', 'Backstroke', 'Breaststroke', 'Butterfly', 'Individual Medley', 'Diver'], requiresLevel: false, requiresAthleticism: false, defaultMetrics: ['50 Free (SCY)', '100 Free (SCY)', '200 Free (SCY)', '500 Free (SCY)', '100 Back (SCY)', '100 Breast (SCY)', '100 Fly (SCY)', '200 IM (SCY)', '1M Diving (6 Dives)'] },
  'Golf': { positions: ['Golfer'], requiresLevel: false, requiresAthleticism: false, defaultMetrics: ['18-Hole Scoring Average (Season)', '9-Hole Scoring Average (Season)', 'Tournament Wins (Career)', 'Driving Distance (Yds)'] },
  'Basketball': { positions: ['Point Guard (PG)', 'Shooting Guard (SG)', 'Small Forward (SF)', 'Power Forward (PF)', 'Center (C)'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['Points (Per Game)', 'Rebounds (Per Game)', 'Assists (Per Game)', 'Steals (Per Game)', 'Blocks (Per Game)', 'Field Goal % (Season)', '3-Point % (Season)'] },
  'Soccer': { positions: ['Goalkeeper (GK)', 'Center Back (CB)', 'Fullback (LB/RB)', 'Defensive Midfielder (DM)', 'Attacking Midfielder (AM)', 'Winger (LW/RW)', 'Striker (ST)'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['Goals (Season)', 'Assists (Season)', 'Clean Sheets (Season)', 'Minutes Played (Season)', 'Pass Completion % (Season)'] },
  'Football': { positions: ['Quarterback (QB)', 'Running Back (RB)', 'Wide Receiver (WR)', 'Tight End (TE)', 'Offensive Lineman (OL)', 'Defensive Lineman (DL)', 'Linebacker (LB)', 'Cornerback / Safety (DB)', 'Kicker / Punter (ST)'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['Passing Yards (Season)', 'Passing TDs (Season)', 'Rushing Yards (Season)', 'Receiving Yards (Season)', 'Total TDs (Season)', 'Tackles (Season)', 'Sacks (Season)', 'Interceptions (Season)'] },
  'Volleyball': { positions: ['Setter (S)', 'Outside Hitter (OH)', 'Opposite Hitter (OPP)', 'Middle Blocker (MB)', 'Libero / Defensive Specialist (L/DS)'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['Kills (Per Set)', 'Assists (Per Set)', 'Digs (Per Set)', 'Blocks (Per Set)', 'Aces (Per Set)', 'Hitting % (Season)'] },
  'Baseball': { positions: ['Pitcher (RHP/LHP)', 'Catcher (C)', 'First Base (1B)', 'Infield (2B/3B/SS)', 'Outfield (LF/CF/RF)'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['Batting Average (Season)', 'On-Base Plus Slugging (Season)', 'Home Runs (Season)', 'RBI (Season)', 'Stolen Bases (Season)', 'Earned Run Average (Season)', 'Fastball Velocity (MPH)'] },
  'Softball': { positions: ['Pitcher', 'Catcher', 'First Base', 'Infield', 'Outfield'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['Batting Average (Season)', 'On-Base Plus Slugging (Season)', 'Home Runs (Season)', 'RBI (Season)', 'Stolen Bases (Season)', 'Earned Run Average (Season)', 'Fastball Velocity (MPH)'] },
  'Wrestling': { positions: ['106 lbs', '113 lbs', '120 lbs', '126 lbs', '132 lbs', '138 lbs', '144 lbs', '150 lbs', '157 lbs', '165 lbs', '175 lbs', '190 lbs', '215 lbs', '285 lbs'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['Season Record (W-L)', 'Career Wins', 'Pins / Falls (Season)', 'Takedowns (Season)'] },
  'Tennis': { positions: ['Singles Player', 'Doubles Player'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['UTR (Universal Tennis Rating)', 'Season Record (W-L)', 'Career Wins', 'First Serve % (Season)'] },
  'Lacrosse': { positions: ['Attack', 'Midfield', 'Defense', 'Goalie', 'Faceoff Specialist (FO)'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['Goals (Season)', 'Assists (Season)', 'Ground Balls (Season)', 'Caused Turnovers (Season)', 'Faceoff Win % (Season)', 'Save % (Season)'] },
  'Field Hockey': { positions: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['Goals (Season)', 'Assists (Season)', 'Defensive Saves (Season)', 'Save % (Season)'] },
  'Ice Hockey': { positions: ['Center', 'Winger', 'Defenseman', 'Goaltender'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['Goals (Season)', 'Assists (Season)', 'Total Points (Season)', 'Plus/Minus (+/-)', 'Save % (Season)', 'Goals Against Average (Season)'] },
  'Water Polo': { positions: ['Driver', 'Utility', 'Center Forward (2M Attack)', 'Center Defender (2M Guard)', 'Goalkeeper'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['Goals (Season)', 'Assists (Season)', 'Steals (Season)', 'Sprints Won (Season)', 'Saves (Season)'] },
  'Gymnastics': { positions: ['All-Around', 'Vault Specialist', 'Bars Specialist', 'Beam Specialist', 'Floor Specialist'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['All-Around High Score', 'Vault High Score', 'Uneven Bars High Score', 'Balance Beam High Score', 'Floor Exercise High Score'] },
  'Bowling': { positions: ['Bowler'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['High Game (Career)', 'High 3-Game Series', 'Season Average', 'Strike % (Season)', 'Spare Conversion % (Season)'] },
  'Fencing': { positions: ['Foil Specialist', 'Épée Specialist', 'Sabre Specialist'], requiresLevel: true, requiresAthleticism: true, defaultMetrics: ['National Points / Ranking', 'Regional Record (W-L)', 'Touches Scored (Season)', 'Touches Received (Season)'] }
};

const ALL_SPORTS: string[] = Object.keys(SPORT_CONFIGS_META);

const SUGGESTED_MAJORS = Array.from(new Set([
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

const convertMarkToNumber = (markStr: string, type: MetricType): number => {
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
  return parseFloat(markStr.replace(/[a-zA-Z%"']/g, '').trim()) || (type === 'inverse_stat' || type === 'time' ? 99999 : 0);
};

// --- NCSA EVALUATION ENGINE ---
const evaluateMetric = (gender: string, sport: string, metricName: string, valueStr: string) => {
  const std = UNIVERSAL_STANDARDS[gender]?.[sport]?.[metricName];
  if (!std) return null;

  const val = convertMarkToNumber(valueStr, std.type);
  if (isNaN(val) || (val <= 0 && std.type !== 'inverse_stat')) return null;

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
  } else { 
    if (val <= std.t1) { score = 95 + Math.min(4, ((std.t1 - val) / (std.t1 * 0.05)) * 4); currentTier = 'Power 4 D1'; }
    else if (val <= std.t2) { score = 85 + ((std.t2 - val) / (std.t2 - std.t1)) * 10; currentTier = 'Mid-Major D1'; }
    else if (val <= std.t3) { score = 75 + ((std.t3 - val) / (std.t3 - std.t2)) * 10; currentTier = 'Top D2 / Walk-on';  }
    else if (val <= std.t4) { score = 65 + ((std.t4 - val) / (std.t4 - std.t3)) * 10; currentTier = 'Solid D2 / High D3';  }
    else if (val <= std.t5) { score = 55 + ((std.t5 - val) / (std.t5 - std.t4)) * 10; currentTier = 'D3 / NAIA'; }
    else if (val <= std.t6) { score = 40 + ((std.t6 - val) / (std.t6 - std.t5)) * 14; currentTier = 'Strong Varsity'; }
    else if (val <= std.t7) { score = 20 + ((std.t7 - val) / (std.t7 - std.t6)) * 19; currentTier = 'Varsity Standard'; }
  }

  return { score: Math.min(99, Math.max(5, Math.round(score))), currentTier };
};

const getOverallTier = (score: number) => {
  if (score >= 95) return { label: 'Power 4 D1 Recruit', desc: 'Top-tier prospect for major collegiate programs.', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200' };
  if (score >= 85) return { label: 'Mid-Major D1 Recruit', desc: 'Strong scholarship-level prospect.', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
  if (score >= 75) return { label: 'Top D2 / D1 Walk-On', desc: 'Highly competitive collegiate profile.', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
  if (score >= 65) return { label: 'Solid D2 / High D3', desc: 'Great fit for regional competitive programs.', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (score >= 55) return { label: 'D3 / NAIA Prospect', desc: 'Solid next-level potential.', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
  if (score >= 40) return { label: 'Strong Varsity', desc: 'Excellent high school competitor.', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' };
  return { label: 'Developing Athlete', desc: 'Keep grinding to hit recruiting standards.', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };
};

const getRealStats = (college: any) => {
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

export default function DashboardHomebase() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athleteProfile, setAthleteProfile] = useState<any>(null);
  const [streak, setStreak] = useState(0); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [savedColleges, setSavedColleges] = useState<any[]>([]);
  
  const [isSportsMenuOpen, setIsSportsMenuOpen] = useState(false);
  const [isCollegesOpen, setIsCollegesOpen] = useState(false);
  const sportsMenuRef = useRef<HTMLDivElement>(null);

  const [gpa, setGpa] = useState('');
  const [intendedMajor, setIntendedMajor] = useState('');
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const majorDropdownRef = useRef<HTMLDivElement>(null);

  const [accolades, setAccolades] = useState<string[]>([]);
  const [newAccolade, setNewAccolade] = useState('');
  const [schoolPrefs, setSchoolPrefs] = useState('');

  // Stats persist to athlete_sports
  const [sportStats, setSportStats] = useState<Record<string, { position: string, level: string, athleticism: string, calculatedRating?: number, metrics: { name: string, value: string }[] }>>({});
  const [newMetricName, setNewMetricName] = useState<Record<string, string>>({});
  const [newMetricValue, setNewMetricValue] = useState<Record<string, string>>({});

  const [selectedPRs, setSelectedPRs] = useState<string[]>([]);
  const [selectedAccolades, setSelectedAccolades] = useState<string[]>([]);
  const [includeGPA, setIncludeGPA] = useState(true);
  const [includeMajor, setIncludeMajor] = useState(true);
  const [isExportingCard, setIsExportingCard] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'social' | 'rewards'>('home');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const goToTab = (tab: 'home' | 'social' | 'rewards') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (majorDropdownRef.current && !majorDropdownRef.current.contains(event.target as Node)) setShowMajorDropdown(false);
      if (sportsMenuRef.current && !sportsMenuRef.current.contains(event.target as Node)) setIsSportsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadHomebase() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: coachData } = await supabase.from('coaches').select('id').eq('id', session.user.id).maybeSingle();
      if (coachData) { router.push('/dashboard/coach'); return; }

      const { data: athleteData } = await supabase.from('athletes').select('*').eq('id', session.user.id).maybeSingle();
      if (athleteData) {
        
        let loadedAccolades: string[] = [];
        if (athleteData.saved_resume) {
          try {
            const parsed = typeof athleteData.saved_resume === 'string' ? JSON.parse(athleteData.saved_resume) : athleteData.saved_resume;
            setGpa(parsed.gpa || '');
            setIntendedMajor(parsed.intendedMajor || '');
            loadedAccolades = parsed.accolades || [];
            setAccolades(loadedAccolades);
            setSchoolPrefs(parsed.schoolPrefs || '');
          } catch (e) {
            setSchoolPrefs(athleteData.saved_resume as string);
          }
        }

        // 🚨 LOAD FROM RELATIONAL TABLE (With RLS Fallback Logic) 🚨
        let { data: relationalSports, error: fetchErr } = await supabase
          .from('athlete_sports')
          .select('*')
          .eq('athlete_id', athleteData.id)
          .eq('is_active', true);

        if (fetchErr && (fetchErr.code === '42703' || fetchErr.message?.includes('is_active'))) {
           const fallback = await supabase.from('athlete_sports').select('*').eq('athlete_id', athleteData.id);
           relationalSports = fallback.data;
           fetchErr = fallback.error;
        }

        console.log("1. Supabase Fetch Error:", fetchErr);
        console.log("2. Supabase Returned Data:", relationalSports);

        if (!fetchErr && relationalSports) {
          const mappedSportStats: any = {};
          const activeSportsFromDB: string[] = [];

          relationalSports.forEach(row => {
            activeSportsFromDB.push(row.sport_name);
            let parsedMetrics = [];
            try { parsedMetrics = Array.isArray(row.metrics) ? row.metrics : JSON.parse(row.metrics); } catch (e) {}
            
            mappedSportStats[row.sport_name] = {
              position: row.position || '',
              level: row.level_of_play || '',
              athleticism: row.athleticism_tier || '',
              metrics: parsedMetrics || [],
              calculatedRating: row.custom_fit_score || 0
            };
          });

          setSportStats(mappedSportStats);
          
          if (activeSportsFromDB.length > 0) {
            athleteData.sports = activeSportsFromDB;
          }
        } else {
          console.warn("No sports found in athlete_sports table, or RLS is blocking the read. Falling back to athlete profile sports array.");
        }

        const finalSportsList = athleteData.sports || [];

        finalSportsList.forEach((sport: string) => {
          if (!sportStats[sport]) {
            setSportStats(prev => ({
              ...prev,
              [sport]: { position: '', level: '', athleticism: '', metrics: [], calculatedRating: 0 }
            }));
          }
        });

        if (athleteData.prs && athleteData.prs.length > 0) {
          setSelectedPRs(athleteData.prs.slice(0, 3).map((p: any) => p.event));
        }
        if (loadedAccolades.length > 0) {
          setSelectedAccolades(loadedAccolades.slice(0, 3));
        }

        const todayStr = new Date().toLocaleDateString('en-CA');
        let currentStreak = athleteData.current_login_streak || 0;
        const lastLoginStr = athleteData.last_login_date;

        if (lastLoginStr === todayStr) {
          setStreak(currentStreak);
        } else {
          let newStreak = 1; 
          if (lastLoginStr) {
            const diffDays = Math.ceil(Math.abs(new Date(todayStr).getTime() - new Date(lastLoginStr).getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) newStreak = currentStreak + 1;
          }
          setStreak(newStreak);
          await supabase.from('athletes').update({ current_login_streak: newStreak, last_login_date: todayStr }).eq('id', athleteData.id);
        }

        setAthleteProfile(athleteData);
      }

      const { data: savedCollegesData } = await supabase.from('saved_colleges').select(`id, college_id, universities (*)`).eq('athlete_id', session.user.id);
      if (savedCollegesData) {
        setSavedColleges(savedCollegesData);
        if (savedCollegesData.length > 0) setIsCollegesOpen(true); 
      }

      setLoading(false);
    }
    loadHomebase();
  }, [supabase, router]);

  useEffect(() => {
    const searchColleges = async () => {
      if (searchQuery.trim().length < 3) {
        setSearchResults([]);
        return;
      }
      const { data } = await supabase
        .from('universities')
        .select('id, name, state, division, logo_url')
        .ilike('name', `%${searchQuery.trim()}%`)
        .limit(6);
      
      if (data) setSearchResults(data);
    };
    const timeoutId = setTimeout(searchColleges, 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, supabase]);

  const handleSaveGender = async (selectedGender: string) => {
    if (!athleteProfile?.id) return;
    try {
      await supabase.from('athletes').update({ gender: selectedGender }).eq('id', athleteProfile.id);
      setAthleteProfile({ ...athleteProfile, gender: selectedGender });
      showToast("Gender updated. Scoring models calibrated.", "success");
    } catch (err) {
      showToast("Failed to update gender.", "error");
    }
  };

  // 🚨 DYNAMIC SYNCING 🚨
  const syncSportToSupabase = async (sport: string, updatedData: any) => {
    if (!athleteProfile?.id) return;
    
    // Evaluate the overall score
    const genderKey = athleteProfile?.gender === 'Girls' || athleteProfile?.gender === 'Women' ? 'Girls' : 'Boys';
    const spec = SPORT_CONFIGS_META[sport];
    let rating = 0;
    
    if (spec) {
        let baseRankScore = 45;
        if (spec.requiresLevel) {
          if (updatedData.level === 'JV / Dev Squad') baseRankScore = 40;
          else if (updatedData.level === 'Varsity Contributor') baseRankScore = 60;
          else if (updatedData.level === 'Varsity Starter') baseRankScore = 72;
          else if (updatedData.level === 'Elite Club (ECNL / AAU / Next)' || updatedData.level === 'All-Conference Tier') baseRankScore = 85;
          else if (updatedData.level === 'All-State / National') baseRankScore = 95;
          else baseRankScore = 50;

          let varianceModifier = 0;
          if (spec.requiresAthleticism) {
            if (updatedData.athleticism === 'Developing') varianceModifier = -6;
            else if (updatedData.athleticism === 'Above Average') varianceModifier = 3;
            else if (updatedData.athleticism === 'Elite / Generational') varianceModifier = 6;
          }
          baseRankScore += varianceModifier;
        } else {
          baseRankScore = 60;
        }

        let highestMetricScore = 0;
        if (updatedData.metrics && updatedData.metrics.length > 0) {
          updatedData.metrics.forEach((m: {name: string, value: string}) => {
             const evalResult = evaluateMetric(genderKey, sport, m.name, m.value);
             if (evalResult && evalResult.score > highestMetricScore) {
               highestMetricScore = evalResult.score;
             }
          });
        }

        if (highestMetricScore > 0) {
          if (spec.requiresLevel) rating = Math.min(99, Math.max(highestMetricScore, baseRankScore));
          else rating = highestMetricScore;
        } else {
          if (spec.requiresLevel) rating = Math.min(99, Math.max(10, baseRankScore));
        }
    }
    
    updatedData.calculatedRating = rating;
    setSportStats(prev => ({ ...prev, [sport]: updatedData }));

    let payload: any = {
      athlete_id: athleteProfile.id,
      sport_name: sport,
      position: updatedData.position || null,
      level_of_play: updatedData.level || null,
      athleticism_tier: updatedData.athleticism || null,
      metrics: updatedData.metrics || [],
      custom_fit_score: rating,
      is_active: true
    };

    let { error } = await supabase.from('athlete_sports').upsert(payload, { onConflict: 'athlete_id, sport_name' });

    if (error && error.message.includes('is_active')) {
      delete payload.is_active;
      const fallback = await supabase.from('athlete_sports').upsert(payload, { onConflict: 'athlete_id, sport_name' });
      error = fallback.error;
    }

    if (error) console.error("Supabase Sync Error: ", error.message);
  };

  const handleToggleSport = async (sportName: string) => {
    if (!athleteProfile?.id) return;
    try {
      const currentSports = athleteProfile.sports || [];
      let newSports;
      
      if (currentSports.includes(sportName)) {
        newSports = currentSports.filter((s: string) => s !== sportName);
        let payload: any = { athlete_id: athleteProfile.id, sport_name: sportName, is_active: false };
        let { error } = await supabase.from('athlete_sports').upsert(payload, { onConflict: 'athlete_id, sport_name' });
        
        if (error && error.message.includes('is_active')) {
          delete payload.is_active; 
          await supabase.from('athlete_sports').delete().eq('athlete_id', athleteProfile.id).eq('sport_name', sportName);
        }
      } else {
        newSports = [...currentSports, sportName];
        const blankStats = { position: '', level: '', athleticism: '', metrics: [] };
        if (!sportStats[sportName]) setSportStats(prev => ({ ...prev, [sportName]: blankStats }));
        await syncSportToSupabase(sportName, blankStats);
      }

      setAthleteProfile({ ...athleteProfile, sports: newSports });
      supabase.from('athletes').update({ sports: newSports }).eq('id', athleteProfile.id).then();
      showToast(`${sportName} array alignment updated.`, 'success');
    } catch (err) {
      showToast("Failed to update sports alignment", "error");
    }
  };

  const handleSaveCollegeDashboard = async (collegeId: string) => {
    if (!athleteProfile?.id) return;
    try {
      const exists = savedColleges.some(c => c.college_id === collegeId);
      if (exists) return;
      await supabase.from('saved_colleges').insert({ athlete_id: athleteProfile.id, college_id: collegeId });
      const { data } = await supabase.from('saved_colleges').select(`id, college_id, universities (*)`).eq('athlete_id', athleteProfile.id);
      if (data) setSavedColleges(data);
      setSearchQuery('');
      setIsCollegesOpen(true);
      showToast("College mapped to dashboard!", "success");
    } catch (err) { console.error(err); }
  };

  const handleRemoveCollegeDashboard = async (savedId: string) => {
    try {
      await supabase.from('saved_colleges').delete().eq('id', savedId);
      setSavedColleges(prev => prev.filter(c => c.id !== savedId));
      showToast("College removed.", "success");
    } catch (err) { console.error(err); }
  };

  // Invisible Auto-Save function for the main Portfolio Details (GPA, Major, Accolades)
  const autoSavePortfolio = async (overrides?: Partial<{ gpa: string, intendedMajor: string, accolades: string[], schoolPrefs: string }>) => {
    if (!athleteProfile?.id) return;
    try {
      let currentResume = typeof athleteProfile.saved_resume === 'string' ? JSON.parse(athleteProfile.saved_resume) : (athleteProfile.saved_resume || {});
      const { sportStats: legacyStats, ...cleanResume } = currentResume;
      
      const payload = {
        ...cleanResume,
        gpa: overrides?.gpa ?? gpa, 
        intendedMajor: overrides?.intendedMajor ?? intendedMajor, 
        accolades: overrides?.accolades ?? accolades, 
        schoolPrefs: overrides?.schoolPrefs ?? schoolPrefs
      };

      await supabase.from('athletes').update({ saved_resume: payload }).eq('id', athleteProfile.id);
      setAthleteProfile((prev: any) => ({ ...prev, saved_resume: payload }));
    } catch (err) { 
      console.error(err); 
    }
  };

  // --- COMPONENT HANDLERS ---
  const updateSportMeta = (sport: string, field: 'position' | 'level' | 'athleticism', value: string) => {
    const currentData = sportStats[sport] || { position: '', level: '', athleticism: '', metrics: [] };
    const updatedData = { ...currentData, [field]: value };
    syncSportToSupabase(sport, updatedData);
  };

  const addSportMetric = (sport: string) => {
    const name = newMetricName[sport]?.trim();
    const val = newMetricValue[sport]?.trim();
    if (!name || !val) return;

    const currentData = sportStats[sport] || { position: '', level: '', athleticism: '', metrics: [] };
    let newMetrics = [...currentData.metrics];
    const existingIdx = newMetrics.findIndex(m => m.name.toLowerCase() === name.toLowerCase());
    
    if (existingIdx >= 0) newMetrics[existingIdx] = { name, value: val }; 
    else newMetrics.push({ name, value: val });

    const updatedData = { ...currentData, metrics: newMetrics };
    setNewMetricName(prev => ({ ...prev, [sport]: '' }));
    setNewMetricValue(prev => ({ ...prev, [sport]: '' }));
    syncSportToSupabase(sport, updatedData);
  };

  const removeSportMetric = (sport: string, index: number) => {
    const currentData = sportStats[sport];
    if (!currentData) return;
    const newMetrics = [...currentData.metrics];
    newMetrics.splice(index, 1);
    const updatedData = { ...currentData, metrics: newMetrics };
    syncSportToSupabase(sport, updatedData);
  };

  const addAccolade = () => {
    if (newAccolade.trim().length > 0 && !accolades.includes(newAccolade.trim())) {
      const newAccs = [...accolades, newAccolade.trim()];
      setAccolades(newAccs);
      setNewAccolade('');
      if (selectedAccolades.length < 3) setSelectedAccolades([...selectedAccolades, newAccolade.trim()]);
      autoSavePortfolio({ accolades: newAccs });
    }
  };

  const removeAccolade = (acc: string) => {
    const newAccs = accolades.filter(a => a !== acc);
    setAccolades(newAccs);
    setSelectedAccolades(selectedAccolades.filter(a => a !== acc));
    autoSavePortfolio({ accolades: newAccs });
  };

  const handleDownloadSocialCard = async () => {
    setIsExportingCard(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('social-card-export');
      if (!element) throw new Error("Card element not found.");
      
      const canvas = await html2canvas(element, { backgroundColor: null, scale: 3, useCORS: true });
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = `${athleteProfile?.last_name}_RecruitingProfile.png`;
      link.href = dataUrl;
      link.click();
      showToast("Graphic exported successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export graphic.", "error");
    } finally {
      setIsExportingCard(false);
    }
  };

  const handleTogglePR = (event: string) => {
    if (selectedPRs.includes(event)) setSelectedPRs(selectedPRs.filter(e => e !== event));
    else {
      if (selectedPRs.length >= 4) return showToast("Max 4 PRs on the graphic.", "error");
      setSelectedPRs([...selectedPRs, event]);
    }
  };

  const handleToggleAccolade = (acc: string) => {
    if (selectedAccolades.includes(acc)) setSelectedAccolades(selectedAccolades.filter(a => a !== acc));
    else {
      if (selectedAccolades.length >= 3) return showToast("Max 3 Accolades on the graphic.", "error");
      setSelectedAccolades([...selectedAccolades, acc]);
    }
  };

  const handleShareCode = async (code: string) => {
    const shareText = `Join me on ChasedSports! Use my invite code: ${code}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'ChasedSports Invite', text: shareText }); } catch (err) {}
    } else {
      await navigator.clipboard.writeText(shareText);
      showToast("Invite code copied to clipboard!", "success");
    }
  };

  const getStreakStyle = () => {
    if (streak >= 30) return { bg: 'bg-slate-900 border-slate-700 shadow-[0_0_15px_rgba(217,70,239,0.5)]', text: 'bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-fuchsia-400 text-transparent bg-clip-text animate-pulse', icon: 'text-cyan-400 fill-fuchsia-500 animate-bounce' }; 
    if (streak >= 14) return { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: 'text-purple-500 fill-purple-400 animate-pulse' }; 
    if (streak >= 7) return { bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-800', icon: 'text-cyan-500 fill-cyan-400' }; 
    if (streak >= 3) return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: 'text-red-500 fill-red-500 animate-pulse' }; 
    return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: 'text-orange-500 fill-orange-400' }; 
  };
  const streakTheme = getStreakStyle();

  const userSports = athleteProfile?.sports || [];
  const primarySportQuery = userSports.length > 0 ? userSports[0] : 'general';
  const genderKey = athleteProfile?.gender === 'Girls' || athleteProfile?.gender === 'Women' ? 'Girls' : 'Boys';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Homebase...</p>
      </div>
    );
  }

  const myReferralCode = athleteProfile?.athletic_net_url?.match(/\d{5,}/)?.[0] || null;
  const currentRefs = athleteProfile?.verified_referrals || 0;
  const cycle = Math.floor(currentRefs / 5);
  const base = cycle * 5;
  const progressInCycle = currentRefs - base;
  const progressPct = Math.min(100, (progressInCycle / 5) * 100);

  const milestones = [
    { count: base + 1, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 2, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 3, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 4, label: '+1 Boost', icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500', isMajor: false },
    { count: base + 5, label: 'Plasma Border', icon: Crown, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500', isMajor: true },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-24 md:pb-12">
      
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 font-bold text-sm border ${toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-slate-900 text-white border-slate-700'}`}>
            {toast.type === 'error' ? <X className="w-4 h-4 text-red-400" /> : <Check className="w-4 h-4 text-emerald-400" />} {toast.message}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* 🚨 GENDER SELECTION GATE 🚨 */}
      {!athleteProfile?.gender && (
         <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6 px-4 relative z-50 shadow-lg">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
               <div>
                  <h3 className="text-xl font-black flex items-center gap-2">
                     <AlertCircle className="w-5 h-5 text-amber-300"/> Complete Your Athlete Profile
                  </h3>
                  <p className="text-blue-100 text-sm font-medium">Recruiting standards are separated by gender. Select your gender to unlock accurate college fit scoring.</p>
               </div>
               <div className="flex gap-3 w-full md:w-auto shrink-0">
                  <button onClick={() => handleSaveGender('Boys')} className="flex-1 md:w-32 bg-white text-blue-700 font-black py-2.5 rounded-xl shadow-md hover:scale-105 transition-transform">Boys</button>
                  <button onClick={() => handleSaveGender('Girls')} className="flex-1 md:w-32 bg-white text-blue-700 font-black py-2.5 rounded-xl shadow-md hover:scale-105 transition-transform">Girls</button>
               </div>
            </div>
         </div>
      )}

      {/* 🌟 GLOBAL FLOATING TABS OVERLAY 🌟 */}
      <div className="sticky top-20 md:top-24 z-[60] w-full flex justify-center px-4 animate-in slide-in-from-top-4 duration-500 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-full shadow-lg border border-slate-200/50 inline-flex gap-1 pointer-events-auto">
          <button 
            onClick={() => goToTab('home')} 
            className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <UserCircle2 className="w-4 h-4" /> <span className="hidden sm:inline">Homebase</span>
          </button>
          <button 
            onClick={() => goToTab('social')} 
            className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'social' ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <ImageIcon className="w-4 h-4" /> <span className="hidden sm:inline">Portfolio & Performance</span>
          </button>
          <button 
            onClick={() => goToTab('rewards')} 
            className={`px-6 py-2.5 rounded-full text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'rewards' ? 'bg-fuchsia-500 text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <Gift className="w-4 h-4" /> <span className="hidden sm:inline">Rewards</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC HEADER CONTAINER */}
      <div className={`bg-slate-900 text-white pb-24 md:pb-32 px-5 md:px-6 relative transition-all duration-300 ${isSportsMenuOpen ? 'z-[50]' : 'z-10'} ${!athleteProfile?.gender ? 'pt-16' : 'pt-8 -mt-16 md:-mt-20'}`}>
        <div className="absolute inset-0 pointer-events-none z-0 rounded-b-[3rem] overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8 relative z-30 pt-20">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
            <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
              <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId={athleteProfile?.equipped_border} sizeClasses="w-24 h-24 md:w-32 md:h-32" />
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                  {athleteProfile?.first_name ? `${athleteProfile.first_name} ${athleteProfile.last_name}` : 'Welcome, Athlete'}
                </h1>
              </div>

              <p className="text-base md:text-lg text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2 mb-6">
                <MapPin className="w-4 h-4 opacity-70" /> 
                {athleteProfile?.high_school || 'General Athlete Profile'} 
                {athleteProfile?.grad_year && ` • Class of ${athleteProfile.grad_year}`}
              </p>
              
              {/* Position-Aware Multi-Sport Dropdown Trigger */}
              <div className="relative inline-block text-left" ref={sportsMenuRef}>
                 <button 
                   onClick={() => setIsSportsMenuOpen(!isSportsMenuOpen)}
                   className={`inline-flex items-center gap-2 font-black px-6 py-3 rounded-xl transition-all shadow-md ${userSports.length > 0 ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                 >
                    {userSports.length > 0 ? 'Add / Update Sports' : 'Add / Update Sports'} <ChevronDown className={`w-4 h-4 transition-transform ${isSportsMenuOpen ? 'rotate-180' : ''}`} />
                 </button>
                 
                 {isSportsMenuOpen && (
                   <div className="absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mt-3 w-[280px] sm:w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 sm:p-4 z-[100] max-h-[70vh] overflow-y-auto custom-scrollbar text-slate-900 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2 border-b border-slate-100 mb-2">Sport Specifications</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {ALL_SPORTS.map((sport: string) => {
                         const isActive = userSports.includes(sport);
                         return (
                           <div 
                             key={sport} 
                             onMouseDown={(e) => { e.preventDefault(); handleToggleSport(sport); }}
                             className="flex items-center gap-3 w-full text-left p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                           >
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${isActive ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300 group-hover:border-blue-300'}`}>
                                 {isActive && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className={`text-sm font-bold truncate select-none ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{sport}</span>
                           </div>
                         )
                       })}
                     </div>
                   </div>
                 )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-8 md:-mt-16 relative z-20 space-y-6">
        
        {/* ==========================================
            TAB CONTENT: HOMEBASE (RECRUITING OVERVIEW)
            ========================================== */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* INLINE LINKED MATRIX ACTION ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/dashboard/email-builder" className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-[2rem] p-6 sm:p-8 shadow-md border border-blue-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[40px] rounded-full pointer-events-none"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-xl font-black text-white mb-1">Email Studio</h3>
                <p className="text-blue-100/70 text-sm font-medium">Auto-generate customized templates using sport-specific metrics.</p>
              </Link>

              <div onClick={() => goToTab('social')} className="bg-gradient-to-br from-emerald-900 to-teal-950 rounded-[2rem] p-6 sm:p-8 shadow-md border border-emerald-800 relative overflow-hidden group cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[40px] rounded-full pointer-events-none"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                    <ImageIcon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-xl font-black text-white mb-1">Portfolio & Fine-Tuning</h3>
                <p className="text-emerald-100/70 text-sm font-medium">Manage your public website and build custom social graphics.</p>
              </div>
            </div>

            {/* 🌟 POSITION-AWARE TRACK BONUS SEGMENT */}
            {userSports.includes('Track & Field') && (
              <div className="bg-gradient-to-br from-indigo-900 to-blue-950 rounded-[2rem] p-6 md:p-8 shadow-xl border border-indigo-800 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none"></div>
                 <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-blue-400"/> Track & Field Extensions Unlocked
                 </h2>
                 <p className="text-indigo-200 mb-6 font-medium text-sm">Deterministic tracking tools active for your verified race marks.</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/dashboard/track" className="bg-white/10 hover:bg-white/20 border border-white/10 p-6 rounded-2xl transition-all shadow-sm">
                       <h3 className="text-lg font-bold text-white mb-1">Track Portal</h3>
                       <p className="text-sm text-indigo-200">Synchronize official Athletic.net entries to claim profile verification status.</p>
                    </Link>
                    <Link href="/dashboard/email-builder" className="bg-white/10 hover:bg-white/20 border border-white/10 p-6 rounded-2xl transition-all shadow-sm">
                       <h3 className="text-lg font-bold text-white mb-1">Email Template Builder</h3>
                       <p className="text-sm text-indigo-200">Inject verified segment times cleanly into college coaching introduction templates.</p>
                    </Link>
                 </div>
              </div>
            )}

            {/* 🌟 ULTRA-SPECIFIC PERFORMANCE FINE-TUNER BLOCKS (HOMEBASE) 🌟 */}
            {userSports.length > 0 && (
              <div className="grid grid-cols-1 gap-6">
                {userSports.map((sport: string) => {
                  const config = SPORT_CONFIGS_META[sport];
                  if (!config) return null;
                  const rating = sportStats[sport]?.calculatedRating || 0;
                  const tier = getOverallTier(rating);

                  return (
                    <div key={sport} className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200 animate-in fade-in duration-300">
                      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 pb-4 border-b border-slate-100 gap-4">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                             {sport} Metrics
                             {sport === 'Track & Field' && <span title="Managed by Track Portal"><CheckCircle2 className="w-5 h-5 text-blue-500" /></span>}
                          </h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {!config.requiresLevel ? 'Deterministic Mark Evaluation' : 'Skill Stat Allocation Profile'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {rating > 0 && (
                            <div className={`flex items-center gap-4 ${tier.bg} border ${tier.border} p-3 rounded-2xl shadow-sm`}>
                               <div className="text-right hidden sm:block">
                                  <span className={`block text-[10px] font-black uppercase tracking-widest ${tier.color}`}>{tier.label}</span>
                                  <span className="text-xs font-medium text-slate-600">{tier.desc}</span>
                               </div>
                               <div className="w-px h-10 bg-black/10 hidden sm:block"></div>
                               <div className="text-center shrink-0 min-w-[3rem]">
                                 <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Score</span>
                                 <span className={`text-2xl font-black leading-none ${tier.color}`}>{rating}</span>
                               </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-6">
                        {config.requiresLevel && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Position / Group</label>
                              <select 
                                value={sportStats[sport]?.position || ''} 
                                onChange={(e) => updateSportMeta(sport, 'position', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Target...</option>
                                {config.positions.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            
                            <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Level Of Play</label>
                              <select 
                                value={sportStats[sport]?.level || ''} 
                                onChange={(e) => updateSportMeta(sport, 'level', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Level...</option>
                                <option value="JV / Dev Squad">JV / Dev Squad</option>
                                <option value="Varsity Contributor">Varsity Contributor</option>
                                <option value="Varsity Starter">Varsity Starter</option>
                                <option value="All-Conference Tier">All-Conference Tier</option>
                                <option value="All-State / National">All-State / National</option>
                                <option value="Elite Club (ECNL / AAU / Next)">Elite Club (ECNL / AAU / Next)</option>
                              </select>
                            </div>

                            {config.requiresAthleticism && (
                              <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Athleticism Class</label>
                                <select 
                                  value={sportStats[sport]?.athleticism || ''} 
                                  onChange={(e) => updateSportMeta(sport, 'athleticism', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select Tier...</option>
                                  <option value="Developing">Developing</option>
                                  <option value="Standard for Level">Standard for Level</option>
                                  <option value="Above Average">Above Average</option>
                                  <option value="Elite / Generational">Elite / Generational</option>
                                </select>
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block border-t border-slate-100 pt-4">Fine-Tuned Verification Metrics</label>
                          
                          {sport === 'Track & Field' && athleteProfile?.prs && athleteProfile.prs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 opacity-70">
                              {athleteProfile.prs.map((m: any, idx: number) => {
                                const evaluation = evaluateMetric(genderKey, sport, m.event, m.mark);
                                return (
                                  <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                                      <span className="text-slate-500 truncate pr-2">{m.event}: <span className="text-slate-900 font-black">{m.mark}</span></span>
                                      {evaluation && (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-100/50 border border-blue-200 px-2 py-0.5 rounded-md ml-auto sm:ml-0 whitespace-nowrap">
                                          {evaluation.currentTier}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                {sportStats[sport]?.metrics?.map((m: any, idx: number) => {
                                  const evaluation = evaluateMetric(genderKey, sport, m.name, m.value);
                                  return (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold shadow-sm">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <span className="text-slate-500 truncate pr-2">{m.name}: <span className="text-slate-900 font-black">{m.value}</span></span>
                                        {evaluation && (
                                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-100/50 border border-blue-200 px-2 py-0.5 rounded-md w-fit">
                                            {evaluation.currentTier}
                                          </span>
                                        )}
                                      </div>
                                      <button onClick={() => removeSportMetric(sport, idx)} className="text-slate-400 hover:text-red-500 shrink-0 ml-2"><X className="w-4 h-4"/></button>
                                    </div>
                                  )
                                })}
                              </div>

                              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2">
                                <input 
                                  type="text" list={`metrics-${sport}`} placeholder="Metric Category"
                                  value={newMetricName[sport] || ''} onChange={(e) => setNewMetricName(prev => ({ ...prev, [sport]: e.target.value }))}
                                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                />
                                <datalist id={`metrics-${sport}`}>
                                  {SPORT_CONFIGS_META[sport]?.defaultMetrics?.map((m: string) => <option key={m} value={m}>{m}</option>)}
                                </datalist>

                                <div className="flex gap-2 sm:w-1/3 shrink-0">
                                  <input 
                                    type="text" placeholder={!config.requiresLevel ? "Time (e.g. 10.54 / 4:12)" : "Value (e.g. 18.4)"}
                                    value={newMetricValue[sport] || ''} onChange={(e) => setNewMetricValue(prev => ({ ...prev, [sport]: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && addSportMetric(sport)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                  />
                                  <button onClick={() => addSportMetric(sport)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-xl font-bold transition-colors shrink-0 flex items-center justify-center shadow-md">
                                    <Plus className="w-5 h-5"/>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 🌟 TARGET COLLEGES EXPANDED COMPARISON TABLE 🌟 */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
               <button 
                 onClick={() => setIsCollegesOpen(!isCollegesOpen)} 
                 className="w-full flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 bg-white hover:bg-slate-50 transition-colors gap-4"
               >
                  <div className="flex items-center gap-4 text-left">
                     <div className="w-14 h-14 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                        <Bookmark className="w-6 h-6 text-blue-600 fill-blue-600" />
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Target Colleges Board</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">{savedColleges.length} programs loaded in tracked database metrics</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 self-end md:self-auto">
                    {isCollegesOpen ? <ChevronUp className="w-6 h-6 text-slate-400 shrink-0" /> : <ChevronDown className="w-6 h-6 text-slate-400 shrink-0" />}
                  </div>
               </button>

               {isCollegesOpen && (
                  <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 animate-in fade-in slide-in-from-top-4 duration-300">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                          <Scale className="w-5 h-5 text-blue-500" /> College Comparison Board
                        </h3>
                        <Link href="/search" className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 justify-center">
                           Find More Colleges <Search className="w-4 h-4" />
                        </Link>
                     </div>

                     {/* Grid of colleges showing stats for easy comparison */}
                     {savedColleges.length > 0 ? (
                       <div className="overflow-x-auto custom-scrollbar pb-4">
                         <table className="w-full text-left min-w-[900px]">
                           <thead>
                             <tr className="border-b-2 border-slate-200">
                               <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Program</th>
                               <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Athletic Match</th>
                               <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Net Tuition / Yr</th>
                               <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">10-Yr Salary</th>
                               <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Acceptance</th>
                               <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Size</th>
                               <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500 text-center">Action</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                             {savedColleges.map((saved: any) => {
                                const college = saved.universities; 
                                if (!college) return null;
                                const stats = getRealStats(college);

                                return (
                                  <tr key={saved.id} className="bg-white hover:bg-blue-50/50 transition-colors group">
                                    <td className="p-4 flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden">
                                        {college.logo_url ? <img src={college.logo_url} className="w-6 h-6 object-contain" /> : <School className="w-5 h-5 text-slate-400" />}
                                      </div>
                                      <div className="truncate max-w-[200px]">
                                        <Link href={`/college/${college.id}?sport=${primarySportQuery}`} className="font-black text-slate-900 hover:text-blue-600 transition-colors block truncate">{college.name}</Link>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{college.division} • {college.state}</span>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className="font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">{stats.matchScore > 0 ? stats.matchScore : '-'}</span>
                                    </td>
                                    <td className="p-4 font-black text-slate-700">{stats.tuitionStr}</td>
                                    <td className="p-4 font-black text-emerald-600">{stats.salaryStr}</td>
                                    <td className="p-4 font-bold text-slate-600">{stats.gradRateStr}</td>
                                    <td className="p-4 font-bold text-slate-600">{stats.popStr}</td>
                                    <td className="p-4 text-center">
                                      <button 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveCollegeDashboard(saved.id); }} 
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors inline-block"
                                        title="Remove from board"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                )
                             })}
                           </tbody>
                         </table>
                       </div>
                     ) : (
                       <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center">
                          <School className="w-12 h-12 text-slate-300 mb-4" />
                          <h4 className="text-lg font-black text-slate-900 mb-1">Your board is empty</h4>
                          <p className="text-sm text-slate-500 font-medium max-w-sm leading-relaxed mb-6">Head over to the Matchmaker to search the database and add colleges to compare.</p>
                          <Link href="/search" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-md">
                             Open College Finder
                          </Link>
                       </div>
                     )}
                  </div>
               )}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB CONTENT: PORTFOLIO & SOCIAL FINE-TUNING HUB
            ======================================================== */}
        {activeTab === 'social' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* PORTFOLIO DIGITAL IDENTITY SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               <div className="lg:col-span-7 space-y-6">
                  
                  {/* Public Status Card */}
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden z-20 text-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                    
                    <div className="flex items-center gap-4 mb-5 relative z-10">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl border border-blue-500/30 flex items-center justify-center shrink-0">
                        {athleteProfile?.trust_level > 0 ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Lock className="w-6 h-6 text-amber-500" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-black tracking-tight">{athleteProfile?.trust_level > 0 ? "Portfolio Live" : "Portfolio Unverified"}</h3>
                        <p className="text-xs font-medium text-slate-400">{athleteProfile?.trust_level > 0 ? "Coaches can search and view your profile." : "Sync a sport to verify and go public."}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 relative z-10">
                      <Link 
                         href="/customize" 
                         className="bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                      >
                         <Paintbrush className="w-4 h-4" /> Edit Theme & Design
                      </Link>
                      {athleteProfile?.trust_level > 0 && (
                        <button 
                           onClick={() => {
                             navigator.clipboard.writeText(`${window.location.origin}/athlete/${athleteProfile?.id}`);
                             showToast("Portfolio link copied to clipboard!", "success");
                           }}
                           className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                           <LinkIcon className="w-4 h-4" /> Copy Link
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Public Resume Details Editor */}
                  <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-6 border-b border-slate-100 gap-4">
                       <div>
                         <h2 className="text-2xl font-black text-slate-900 flex items-center">
                           <FileText className="w-6 h-6 mr-3 text-blue-500" /> Public Resume Details
                         </h2>
                         <p className="text-slate-500 font-medium text-sm mt-1">Fine-tune academics and honors for your public profile.</p>
                       </div>
                     </div>

                     <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div>
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Unweighted GPA Scale</label>
                              <input 
                                type="number" step="0.01" min="0" max="5" 
                                value={gpa} 
                                onChange={(e) => {
                                  setGpa(e.target.value);
                                }} 
                                onBlur={() => { autoSavePortfolio(); }}
                                placeholder="e.g. 3.95" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                           </div>
                           <div className="relative" ref={majorDropdownRef}>
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Intended Major Category</label>
                              <input 
                                type="text" 
                                value={intendedMajor} 
                                onFocus={() => setShowMajorDropdown(true)} 
                                onChange={(e) => { 
                                  setIntendedMajor(e.target.value); 
                                  setShowMajorDropdown(true); 
                                }} 
                                onBlur={() => { autoSavePortfolio(); }}
                                placeholder="Search categories..." 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {showMajorDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                  {SUGGESTED_MAJORS.filter(m => m.toLowerCase().includes(intendedMajor.toLowerCase())).map((m: string, idx: number) => (
                                    <button 
                                      key={idx} type="button" 
                                      onClick={() => { 
                                        setIntendedMajor(m); 
                                        setShowMajorDropdown(false);
                                        autoSavePortfolio(); 
                                      }} 
                                      className="w-full text-left px-3 py-2 text-sm font-bold text-slate-700 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      {m}
                                    </button>
                                  ))}
                                </div>
                              )}
                           </div>
                        </div>

                        <div>
                           <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">Platform Honors / Accolades</label>
                           <div className="space-y-2 mb-3">
                              {accolades.map((acc: string, i: number) => (
                                <div key={i} className="flex items-center justify-between bg-blue-50 border border-blue-100 text-blue-950 px-4 py-2.5 rounded-xl text-sm font-bold">
                                  <span className="truncate">{acc}</span>
                                  <button onClick={() => removeAccolade(acc)} className="text-blue-500 hover:text-red-500 shrink-0"><X className="w-4 h-4"/></button>
                                </div>
                              ))}
                           </div>
                           <div className="flex gap-2">
                             <input 
                               type="text" 
                               value={newAccolade} 
                               onChange={(e) => setNewAccolade(e.target.value)} 
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') addAccolade();
                               }} 
                               placeholder="Add accolade (e.g. Regional Champion)" 
                               className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                             />
                             <button 
                               onClick={() => addAccolade()} 
                               className="bg-slate-950 hover:bg-slate-800 text-white px-4 rounded-xl font-bold transition-colors shrink-0"
                             >
                               <Plus className="w-5 h-5"/>
                             </button>
                           </div>
                        </div>

                        <div>
                          <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">School Culture Preferences</label>
                          <textarea 
                            value={schoolPrefs} 
                            onChange={(e) => {
                              setSchoolPrefs(e.target.value);
                            }} 
                            onBlur={() => { autoSavePortfolio(); }}
                            placeholder="Define target program cultures or regional limits for coach searches..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                          />
                        </div>
                     </div>
                  </div>
               </div>

               {/* RIGHT: Live Phone Auto-Preview */}
               <div className="lg:col-span-5 flex justify-center items-start lg:sticky lg:top-36 max-h-[calc(100vh-10rem)] overflow-y-auto hide-scrollbar pb-6 px-2">
                  <div className="w-full max-w-[340px] mx-auto bg-slate-950 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-800 relative aspect-[9/19] flex flex-col shrink-0">
                     <div className="absolute top-0 inset-x-0 h-5 bg-slate-950 rounded-b-xl w-28 mx-auto z-10 flex items-center justify-center gap-1.5">
                       <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                       <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                     </div>
                     <div className="flex-1 bg-white rounded-[2.2rem] overflow-hidden relative shadow-inner">
                        <iframe 
                          src={`/athlete/${athleteProfile?.id || ''}`}
                          className="absolute inset-0 w-full h-full border-0 pointer-events-none custom-scrollbar"
                          title="Dynamic Device Portfolio Preview"
                        />
                     </div>
                     <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                        <Smartphone className="w-3 h-3"/> Active Live Synchronization
                     </div>
                  </div>
               </div>
            </div>

            <hr className="border-slate-200"/>

            {/* SOCIAL GRAPHIC STUDIO CAPTURE SUITE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               <div className="lg:col-span-5">
                  <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200">
                     <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-2">
                        <ImageIcon className="w-5 h-5 text-emerald-500" /> Export Parameter Matrix
                     </h3>
                     <p className="text-slate-500 font-medium text-xs mb-6">Allocate elements to display inside the compiled high-res layout output.</p>

                     <div className="space-y-6">
                        <div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Display Metrics (Max 4)</h4>
                           <div className="flex flex-col gap-1.5">
                             {athleteProfile?.prs?.map((pr: any, i: number) => (
                               <button key={i} onClick={() => handleTogglePR(pr.event)} className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selectedPRs.includes(pr.event) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                                 <span className="text-xs font-bold text-slate-800">{pr.event} <span className="text-slate-400 font-medium ml-1">({pr.mark})</span></span>
                                 {selectedPRs.includes(pr.event) ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4 text-slate-300" />}
                               </button>
                             ))}
                           </div>
                        </div>

                        <div>
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Display Honors (Max 3)</h4>
                           <div className="flex flex-col gap-1.5">
                             {accolades.map((acc: string, i: number) => (
                               <button key={i} onClick={() => handleToggleAccolade(acc)} className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selectedAccolades.includes(acc) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                                 <span className="text-xs font-bold text-slate-800 truncate pr-2">{acc}</span>
                                 {selectedAccolades.includes(acc) ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4 text-slate-300" />}
                               </button>
                             ))}
                           </div>
                        </div>

                        <button onClick={handleDownloadSocialCard} disabled={isExportingCard} className="w-full bg-slate-900 text-white font-black py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2">
                           {isExportingCard ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4"/> Compile High-Res Canvas</>}
                        </button>
                     </div>
                  </div>
               </div>

               {/* CANVAS EXPORT CONTAINER HOUSING */}
               <div className="lg:col-span-7 flex justify-center items-start lg:sticky lg:top-36 max-h-[calc(100vh-10rem)] overflow-y-auto hide-scrollbar pb-6 px-2">
                  <div id="social-card-export" className="relative w-full max-w-[420px] h-auto aspect-[4/5] bg-slate-900 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between overflow-hidden border border-slate-700/50 shadow-2xl shrink-0">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

                     <div className="flex items-center gap-4 z-10 shrink-0">
                        <AvatarWithBorder avatarUrl={athleteProfile?.avatar_url} borderId="none" sizeClasses="w-16 h-16 shadow-lg border border-slate-800 shrink-0" />
                        <div className="min-w-0">
                           <h2 className="text-xl sm:text-2xl font-black uppercase text-white leading-none mb-1 truncate">{athleteProfile?.first_name} <br/>{athleteProfile?.last_name}</h2>
                           <p className="text-xs font-bold text-slate-400 truncate">{athleteProfile?.high_school} {athleteProfile?.grad_year && `• CO ${athleteProfile.grad_year}`}</p>
                        </div>
                     </div>

                     <div className="z-10 mt-6 space-y-2.5 shrink-0">
                        {athleteProfile?.prs?.filter((p: any) => selectedPRs.includes(p.event)).map((pr: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-end border-b border-slate-800/60 pb-1.5">
                             <span className="text-sm font-black text-slate-300 truncate pr-2">{pr.event}</span>
                             <span className="text-xl font-black text-white shrink-0">{pr.mark}</span>
                          </div>
                        ))}
                     </div>

                     <div className="z-10 mt-auto flex justify-between items-end pt-6 border-t border-slate-800 shrink-0">
                        <div className="flex-1 border-l-2 border-emerald-500 pl-3 overflow-hidden pr-2">
                           {selectedAccolades.map((acc: string, idx: number) => <p key={idx} className="text-xs font-bold italic text-slate-400 mb-0.5 truncate">"{acc}"</p>)}
                           {includeGPA && gpa && <p className="text-xs font-black text-emerald-400 mt-1 truncate">GPA: {gpa}</p>}
                           {includeMajor && intendedMajor && <p className="text-xs font-black text-blue-400 truncate">Major: {intendedMajor}</p>}
                        </div>
                        <div className="text-right shrink-0">
                           <p className="text-[18px] font-black tracking-tighter text-white">Chased<span className="text-blue-500">Sports</span></p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

          </div>
        )}

        {/* ==========================================
            TAB CONTENT: REWARDS & GAMIFIED SYSTEM
            ========================================== */}
        {activeTab === 'rewards' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 shadow-xl border border-slate-800 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[80px] rounded-full pointer-events-none"></div>

              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 relative z-10">
                <div>
                  <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <Flame className="w-8 h-8 text-fuchsia-500" /> The Streak Path
                  </h3>
                  <p className="text-slate-400 font-medium text-sm mt-1">Log in daily to escalate your rewards. Don't break the chain.</p>
                </div>
                <div className="bg-slate-950 px-6 py-3 rounded-xl border border-slate-800 flex items-center gap-4 shadow-inner">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Streak</span>
                  <span className="text-3xl font-black text-fuchsia-400">{streak}</span>
                </div>
              </div>

              {/* 7-Day Track */}
              <div className="relative z-10 mb-8">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-center md:text-left">
                  Week {Math.floor(streak / 7) + 1} Progress
                </p>
                <div className="flex md:justify-center overflow-x-auto py-6 px-4 gap-4 hide-scrollbar snap-x">
                  {[1, 2, 3, 4, 5, 6, 7].map((day: number) => {
                    const currentWeek = Math.floor(streak / 7);
                    const absoluteDay = (currentWeek * 7) + day;
                    
                    const isClaimed = absoluteDay <= streak;
                    const isNext = absoluteDay === streak + 1;
                    const isMilestone = day === 7;
                    const isMidWeekDrop = day === 4;
                    const boostRewardCount = currentWeek + 1;
                    
                    let cashReward = 10;
                    let boostReward = 0;
                    
                    if (isMidWeekDrop) {
                       cashReward = 100 + (currentWeek * 20);
                       boostReward += 1;
                    }
                    if (isMilestone) {
                       boostReward += boostRewardCount;
                    }

                    return (
                      <div key={day} className={`shrink-0 w-36 snap-start rounded-2xl p-5 flex flex-col items-center justify-center text-center border-2 transition-all ${
                        isClaimed ? 'bg-slate-800/50 border-slate-700 opacity-50' :
                        isNext ? 'bg-slate-800 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.2)] scale-105' :
                        isMilestone ? 'bg-gradient-to-b from-slate-800 to-indigo-900 border-indigo-500' :
                        isMidWeekDrop ? 'bg-gradient-to-b from-slate-800 to-emerald-900/40 border-emerald-500/50' :
                        'bg-slate-900 border-slate-800'
                      }`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isNext ? 'text-fuchsia-400' : 'text-slate-500'}`}>
                          Day {absoluteDay}
                        </span>

                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                          isClaimed ? 'bg-slate-800 text-slate-600' :
                          isMilestone ? 'bg-indigo-500/20 text-indigo-400' :
                          isMidWeekDrop ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {isClaimed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                           isMilestone ? <Rocket className="w-6 h-6" /> :
                           isMidWeekDrop ? <Calendar className="w-5 h-5" /> :
                           <DollarSign className="w-5 h-5 text-emerald-400" />}
                        </div>

                        <div className="flex flex-col gap-1 items-center">
                           {cashReward > 0 && (
                             <span className={`font-bold text-xs ${isMidWeekDrop && !isClaimed ? 'text-emerald-400' : 'text-white'}`}>
                               +{cashReward} Cash
                             </span>
                           )}
                           {boostReward > 0 && (
                             <span className={`font-bold text-xs ${(isMilestone || isMidWeekDrop) && !isClaimed ? 'text-indigo-400' : 'text-white'}`}>
                               +{boostReward} Boost{boostReward > 1 ? 's' : ''}
                             </span>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* REFERRAL PROGRAM WITH MILESTONES */}
            <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
              
              <div className="flex flex-col relative z-10 h-full">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight mb-3 flex items-center gap-3">
                    <Users className="w-6 h-6 text-emerald-400" /> Invite & Earn
                  </h3>
                  <p className="text-slate-300 font-medium text-sm mb-6 leading-relaxed">
                    Get <strong className="text-amber-400">1 Free Boost</strong> for every single teammate that uses your unique code. Reach 5 invites to unlock the exclusive Plasma Border!
                  </p>
                  
                  {!myReferralCode ? (
                    <div className="bg-slate-800 border border-slate-700 text-slate-400 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" /> Sync your Athletic.net profile to generate your unique invite code!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="bg-slate-950 px-6 py-4 rounded-xl border border-emerald-500/30 flex items-center justify-between shadow-inner">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Your Code:</span>
                        <span className="text-2xl font-mono font-black tracking-widest text-emerald-400">{myReferralCode}</span>
                      </div>
                      <button 
                        onClick={() => handleShareCode(myReferralCode)}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3.5 rounded-xl font-black transition-colors flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-4 h-4" /> Share Code
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-8 border-t border-slate-800">
                  <div className="flex items-end justify-between mb-8">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-400"/> Invites
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        You have <strong className="text-white">{currentRefs}</strong> verified invites.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Next Mega Bonus</span>
                      <span className="text-sm font-black text-amber-400">{base + 5} Invites</span>
                    </div>
                  </div>

                  {/* Visual Track */}
                  <div className="relative w-full h-3 bg-slate-950 rounded-full border border-slate-800 shadow-inner mb-6 mx-auto max-w-[95%]">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 rounded-full transition-all duration-1000" 
                      style={{ width: `${progressPct}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                    </div>

                    {milestones.map((m: any, i: number) => {
                      const posPct = ((m.count - base) / 5) * 100;
                      const isAchieved = currentRefs >= m.count;
                      const Icon = m.icon;
                      
                      return (
                        <div key={i} className="absolute top-1/2 flex flex-col items-center" style={{ left: `${posPct}%`, transform: 'translate(-50%, -50%)' }}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 z-10 transition-colors duration-500 ${isAchieved ? m.bg : 'bg-slate-800'} ${m.isMajor ? 'w-8 h-8 shadow-[0_0_15px_rgba(245,158,11,0.5)] border-4' : ''}`}>
                            {isAchieved ? <CheckCircle2 className="w-3 h-3 text-white" /> : <Icon className={`w-3 h-3 ${m.isMajor ? 'text-amber-400' : 'text-slate-500'}`} />}
                          </div>

                          <div className="absolute top-8 text-center w-20">
                            <span className={`block text-[9px] font-black mb-0.5 ${isAchieved ? m.color : 'text-slate-500'}`}>{m.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}