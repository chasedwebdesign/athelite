'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { 
  ChevronDown, Search, ArrowRight, Target, Trophy, 
  Activity, ShieldCheck, Zap, Calculator, Check
} from 'lucide-react';
import Image from 'next/image';

// ==========================================
// 🚨 RECRUITING STANDARDS ENGINE 🚨
// ==========================================
const FIELD_EVENTS = ['Shot Put', 'Discus', 'Javelin', 'Hammer', 'High Jump', 'Pole Vault', 'Long Jump', 'Triple Jump'];

const RECRUITING_STANDARDS: Record<string, Record<string, { t1: number, t2: number, t3: number, t4: number, t5: number, t6: number, t7: number, isField?: boolean }>> = {
  'Boys': {
    '60 Meters': { t1: 6.75, t2: 6.90, t3: 7.05, t4: 7.20, t5: 7.40, t6: 7.60, t7: 8.00 },
    '100 Meters': { t1: 10.5, t2: 10.8, t3: 11.0, t4: 11.3, t5: 11.6, t6: 11.9, t7: 12.6 },
    '200 Meters': { t1: 21.2, t2: 21.8, t3: 22.2, t4: 22.8, t5: 23.5, t6: 24.5, t7: 26.0 },
    '400 Meters': { t1: 47.5, t2: 49.0, t3: 50.0, t4: 51.5, t5: 53.0, t6: 55.0, t7: 58.0 },
    '800 Meters': { t1: 112, t2: 115, t3: 117, t4: 120, t5: 125, t6: 130, t7: 140 }, 
    '1500 Meters': { t1: 231, t2: 239, t3: 244, t4: 250, t5: 264, t6: 275, t7: 300 },
    '1600 Meters': { t1: 250, t2: 258, t3: 264, t4: 270, t5: 285, t6: 295, t7: 320 }, 
    '3000 Meters': { t1: 500, t2: 518, t3: 532, t4: 546, t5: 574, t6: 600, t7: 660 },
    '3200 Meters': { t1: 540, t2: 560, t3: 575, t4: 590, t5: 620, t6: 650, t7: 720 }, 
    '110m Hurdles': { t1: 13.8, t2: 14.2, t3: 14.6, t4: 15.0, t5: 15.5, t6: 16.5, t7: 18.5 },
    '300m Hurdles': { t1: 37.0, t2: 38.5, t3: 39.5, t4: 41.0, t5: 42.5, t6: 44.5, t7: 48.0 },
    'Long Jump': { t1: 288, t2: 270, t3: 260, t4: 252, t5: 240, t6: 228, t7: 204, isField: true }, 
    'Triple Jump': { t1: 588, t2: 564, t3: 540, t4: 516, t5: 492, t6: 468, t7: 420, isField: true }, 
    'High Jump': { t1: 82, t2: 78, t3: 76, t4: 74, t5: 70, t6: 66, t7: 60, isField: true }, 
    'Pole Vault': { t1: 198, t2: 186, t3: 174, t4: 162, t5: 150, t6: 132, t7: 108, isField: true },
    'Shot Put': { t1: 720, t2: 660, t3: 600, t4: 540, t5: 480, t6: 444, t7: 360, isField: true }, 
    'Discus': { t1: 2220, t2: 2040, t3: 1860, t4: 1740, t5: 1620, t6: 1440, t7: 1080, isField: true },
    'Javelin': { t1: 2340, t2: 2160, t3: 2040, t4: 1920, t5: 1800, t6: 1620, t7: 1200, isField: true },
  },
  'Girls': {
    '60 Meters': { t1: 7.45, t2: 7.65, t3: 7.85, t4: 8.05, t5: 8.30, t6: 8.60, t7: 9.20 },
    '100 Meters': { t1: 11.7, t2: 12.1, t3: 12.4, t4: 12.8, t5: 13.2, t6: 13.6, t7: 14.5 },
    '200 Meters': { t1: 24.2, t2: 24.8, t3: 25.5, t4: 26.2, t5: 27.0, t6: 28.5, t7: 31.0 },
    '400 Meters': { t1: 54.5, t2: 57.0, t3: 58.5, t4: 60.5, t5: 63.0, t6: 66.0, t7: 72.0 },
    '800 Meters': { t1: 130, t2: 135, t3: 140, t4: 145, t5: 152, t6: 160, t7: 175 }, 
    '1500 Meters': { t1: 268, t2: 282, t3: 291, t4: 300, t5: 314, t6: 330, t7: 375 },
    '1600 Meters': { t1: 290, t2: 305, t3: 315, t4: 325, t5: 340, t6: 360, t7: 400 }, 
    '3000 Meters': { t1: 583, t2: 611, t3: 638, t4: 666, t5: 694, t6: 730, t7: 840 },
    '3200 Meters': { t1: 630, t2: 660, t3: 690, t4: 720, t5: 750, t6: 800, t7: 900 }, 
    '100m Hurdles': { t1: 13.8, t2: 14.3, t3: 14.8, t4: 15.5, t5: 16.5, t6: 17.8, t7: 20.0 },
    '300m Hurdles': { t1: 42.5, t2: 44.5, t3: 46.5, t4: 48.5, t5: 51.0, t6: 54.0, t7: 59.0 },
    'Long Jump': { t1: 234, t2: 222, t3: 210, t4: 198, t5: 186, t6: 174, t7: 150, isField: true }, 
    'Triple Jump': { t1: 480, t2: 456, t3: 432, t4: 408, t5: 384, t6: 360, t7: 312, isField: true },
    'High Jump': { t1: 68, t2: 64, t3: 62, t4: 60, t5: 58, t6: 54, t7: 50, isField: true }, 
    'Pole Vault': { t1: 156, t2: 144, t3: 132, t4: 120, t5: 108, t6: 90, t7: 72, isField: true },
    'Shot Put': { t1: 540, t2: 480, t3: 432, t4: 396, t5: 360, t6: 324, t7: 264, isField: true }, 
    'Discus': { t1: 1800, t2: 1620, t3: 1500, t4: 1380, t5: 1260, t6: 1080, t7: 840, isField: true },
    'Javelin': { t1: 1740, t2: 1560, t3: 1440, t4: 1320, t5: 1200, t6: 1020, t7: 780, isField: true },
  }
};

const ALL_EVENTS = Object.keys(RECRUITING_STANDARDS['Boys']);

// Helpers for math formatting
const convertMarkToNumber = (markStr: string, isField: boolean): number => {
  if (isField) {
    const clean = markStr.replace(/[^0-9.]/g, ' ').trim().split(/\s+/);
    const feet = parseFloat(clean[0]) || 0;
    const inches = parseFloat(clean[1]) || 0;
    return (feet * 12) + inches;
  } else {
    if (markStr.includes(':')) {
      const parts = markStr.split(':');
      return (parseFloat(parts[0]) * 60) + parseFloat(parts[1]);
    }
    return parseFloat(markStr.replace(/[a-zA-Z]/g, '').trim()) || 99999;
  }
};

const formatMarkFromNumber = (val: number, isField: boolean): string => {
  if (isField) {
    const feet = Math.floor(val / 12);
    const inches = val % 12;
    if (feet > 0) return `${feet}' ${inches.toFixed(1).replace(/\.0$/, '')}"`;
    return `${inches.toFixed(1).replace(/\.0$/, '')}"`;
  } else {
    if (val >= 60) {
      const minutes = Math.floor(val / 60);
      const seconds = (val % 60).toFixed(2).padStart(5, '0');
      return `${minutes}:${seconds}`;
    }
    return val.toFixed(2);
  }
};

interface CalculationResult {
  score: number;
  currentTier: string;
  nextTier: string;
  targetMarkFormatted: string;
  deltaFormatted: string;
  label: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
  isField: boolean;
}

export default function DivisionChecker() {
  const supabase = createClient();
  const [session, setSession] = useState<any>(null);

  const [gender, setGender] = useState<'Boys' | 'Girls'>('Boys');
  
  // 🚨 SMART COMBOBOX STATES 🚨
  const [eventSearch, setEventSearch] = useState<string>('100 Meters');
  const [selectedEvent, setSelectedEvent] = useState<string>('100 Meters');
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [mark, setMark] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🚨 AUTHENTICATION CHECK 🚨
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, [supabase]);

  const isFieldEvent = FIELD_EVENTS.includes(selectedEvent);
  const placeholderText = isFieldEvent ? "e.g. 45' 2\"" : (selectedEvent.includes('1500') || selectedEvent.includes('1600') || selectedEvent.includes('800') || selectedEvent.includes('3200')) ? "e.g. 4:15.50" : "e.g. 10.84";

  // Filter events based on typing
  const filteredEvents = ALL_EVENTS.filter(e => e.toLowerCase().includes(eventSearch.toLowerCase()));

  // Handle clicking outside the custom dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsEventDropdownOpen(false);
        // Reset search to the last valid selected event if they clicked away
        if (!ALL_EVENTS.includes(eventSearch)) {
          setEventSearch(selectedEvent);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [eventSearch, selectedEvent]);

  const handleSelectEvent = (ev: string) => {
    setEventSearch(ev);
    setSelectedEvent(ev);
    setIsEventDropdownOpen(false);
    setMark(''); 
    setResult(null);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ALL_EVENTS.includes(selectedEvent)) {
      setError("Please select a valid event from the list.");
      return;
    }
    if (!mark.trim()) {
      setError("Please enter a valid mark.");
      return;
    }
    setError(null);
    setIsCalculating(true);
    setResult(null);

    // Simulate dopamine loading state
    setTimeout(() => {
      const std = RECRUITING_STANDARDS[gender][selectedEvent];
      if (!std) {
        setError("Event standards not found.");
        setIsCalculating(false);
        return;
      }

      const val = convertMarkToNumber(mark, !!std.isField);
      let score = 5;
      let currentTier = 'JV Standard';
      let nextTier = 'Varsity';
      let targetMarkNum = std.t7;
      let delta = 0;

      if (std.isField) {
        if (val >= std.t1) { score = 95 + Math.min(4, ((val - std.t1) / (std.t1 * 0.05)) * 4); currentTier = 'Power 4 D1'; nextTier = 'Elite'; targetMarkNum = std.t1 * 1.05; }
        else if (val >= std.t2) { score = 85 + ((val - std.t2) / (std.t1 - std.t2)) * 10; currentTier = 'Mid-Major D1'; nextTier = 'Power 4 D1'; targetMarkNum = std.t1; }
        else if (val >= std.t3) { score = 75 + ((val - std.t3) / (std.t2 - std.t3)) * 10; currentTier = 'Top D2 / Walk-on'; nextTier = 'Mid-Major D1'; targetMarkNum = std.t2; }
        else if (val >= std.t4) { score = 65 + ((val - std.t4) / (std.t3 - std.t4)) * 10; currentTier = 'Solid D2 / High D3'; nextTier = 'Top D2'; targetMarkNum = std.t3; }
        else if (val >= std.t5) { score = 55 + ((val - std.t5) / (std.t4 - std.t5)) * 10; currentTier = 'D3 / NAIA'; nextTier = 'Solid D2'; targetMarkNum = std.t4; }
        else if (val >= std.t6) { score = 40 + ((val - std.t6) / (std.t5 - std.t6)) * 14; currentTier = 'Strong Varsity'; nextTier = 'D3 / NAIA'; targetMarkNum = std.t5; }
        else if (val >= std.t7) { score = 20 + ((val - std.t7) / (std.t6 - std.t7)) * 19; currentTier = 'Varsity Standard'; nextTier = 'Strong Varsity'; targetMarkNum = std.t6; }
        else { const t8 = std.t7 * 0.85; if (val >= t8) { score = 5 + ((val - t8) / (std.t7 - t8)) * 14; } else { score = 5; }; currentTier = 'JV Standard'; nextTier = 'Varsity Standard'; targetMarkNum = std.t7; }
        delta = targetMarkNum - val;
      } else {
        if (val <= std.t1) { score = 95 + Math.min(4, ((std.t1 - val) / (std.t1 * 0.05)) * 4); currentTier = 'Power 4 D1'; nextTier = 'Elite'; targetMarkNum = std.t1 * 0.95; }
        else if (val <= std.t2) { score = 85 + ((std.t2 - val) / (std.t2 - std.t1)) * 10; currentTier = 'Mid-Major D1'; nextTier = 'Power 4 D1'; targetMarkNum = std.t1; }
        else if (val <= std.t3) { score = 75 + ((std.t3 - val) / (std.t3 - std.t2)) * 10; currentTier = 'Top D2 / Walk-on'; nextTier = 'Mid-Major D1'; targetMarkNum = std.t2; }
        else if (val <= std.t4) { score = 65 + ((std.t4 - val) / (std.t4 - std.t3)) * 10; currentTier = 'Solid D2 / High D3'; nextTier = 'Top D2'; targetMarkNum = std.t3; }
        else if (val <= std.t5) { score = 55 + ((std.t5 - val) / (std.t5 - std.t4)) * 10; currentTier = 'D3 / NAIA'; nextTier = 'Solid D2'; targetMarkNum = std.t4; }
        else if (val <= std.t6) { score = 40 + ((std.t6 - val) / (std.t6 - std.t5)) * 14; currentTier = 'Strong Varsity'; nextTier = 'D3 / NAIA'; targetMarkNum = std.t5; }
        else if (val <= std.t7) { score = 20 + ((std.t7 - val) / (std.t7 - std.t6)) * 19; currentTier = 'Varsity Standard'; nextTier = 'Strong Varsity'; targetMarkNum = std.t6; }
        else { const t8 = std.t7 * 1.15; if (val <= t8) { score = 5 + ((t8 - val) / (t8 - std.t7)) * 14; } else { score = 5; }; currentTier = 'JV Standard'; nextTier = 'Varsity Standard'; targetMarkNum = std.t7; }
        delta = val - targetMarkNum; 
      }
      
      score = Math.min(99, Math.max(5, Math.round(score)));

      let label = 'JV Standard'; let desc = 'Keep working hard in practice to hit the Varsity standard!'; let color = 'text-slate-500'; let bg = 'bg-slate-100/80'; let border = 'border-slate-300/50';
      if (score >= 95) { label = 'Power 4 D1 Recruit'; desc = 'You are hitting priority marks for top-tier D1 programs.'; color = 'text-fuchsia-600'; bg = 'bg-fuchsia-50/80'; border = 'border-fuchsia-200/60'; }
      else if (score >= 85) { label = 'Mid-Major D1 Recruit'; desc = 'You are hitting scholarship-level marks for D1 and elite D2 programs.'; color = 'text-purple-600'; bg = 'bg-purple-50/80'; border = 'border-purple-200/60'; }
      else if (score >= 75) { label = 'D1 Walk-On / Top D2'; desc = 'You have a highly competitive profile for D2 scholarships or D1 walk-on spots.'; color = 'text-blue-600'; bg = 'bg-blue-50/80'; border = 'border-blue-200/60'; }
      else if (score >= 65) { label = 'Solid D2 / High D3'; desc = 'You are a priority recruit for strong D2 and D3 programs.'; color = 'text-emerald-600'; bg = 'bg-emerald-50/80'; border = 'border-emerald-200/60'; }
      else if (score >= 55) { label = 'D3 / NAIA Prospect'; desc = 'You have solid next-level potential for D3 or NAIA programs.'; color = 'text-amber-600'; bg = 'bg-amber-50/80'; border = 'border-amber-200/60'; }
      else if (score >= 40) { label = 'Strong Varsity'; desc = 'You are a great high school competitor. A bit more work and you are college bound.'; color = 'text-slate-700'; bg = 'bg-slate-100/80'; border = 'border-slate-300/50'; }

      setResult({
        score,
        currentTier,
        nextTier,
        targetMarkFormatted: formatMarkFromNumber(targetMarkNum, !!std.isField),
        deltaFormatted: !!std.isField ? `+${formatMarkFromNumber(delta, true)}` : `-${delta.toFixed(2)}s`,
        label,
        desc,
        color,
        bg,
        border,
        isField: !!std.isField
      });

      setIsCalculating(false);
    }, 600); 
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-200 relative overflow-hidden flex flex-col">
      
      {/* 🚨 AMBIENT BACKGROUND ANIMATIONS (Apple Style) 🚨 */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(20px) scale(0.95); }
        }
        .orb-1 { animation: float 12s ease-in-out infinite; }
        .orb-2 { animation: float-reverse 15s ease-in-out infinite; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}} />

      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none orb-1"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-400/10 blur-[120px] rounded-full pointer-events-none orb-2"></div>
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-purple-400/5 blur-[100px] rounded-full pointer-events-none orb-1" style={{ animationDelay: '2s' }}></div>

      {/* MINIMAL NAVBAR */}
      <nav className="w-full relative z-30 py-6 px-6 lg:px-12 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 overflow-hidden group-hover:scale-105 transition-transform">
            <Image src="/icon.png" alt="ChasedSports Icon" fill className="object-contain" priority />
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 hidden sm:block">
            Chased<span className="text-blue-600">Sports</span>
          </span>
        </Link>
        {session ? (
          <Link href="/dashboard" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-blue-200 shadow-sm hover:shadow-md flex items-center gap-2">
            Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-200/60 shadow-sm hover:shadow-md">
            Sign In
          </Link>
        )}
      </nav>

      {/* MAIN CONTENT CONTENT */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10 w-full max-w-2xl mx-auto">
        
        {/* HERO COPY */}
        <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md border border-slate-200 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-sm">
            <Calculator className="w-3.5 h-3.5" /> Division Checker
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 mb-6 text-balance drop-shadow-sm">
            Where do you <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">stack up?</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 font-medium max-w-md mx-auto text-balance">
            Enter your PR below to see exactly what college division your mark aligns with right now.
          </p>
        </div>

        {/* 🚨 GLASSMORPHIC CALCULATOR CARD (30%) 🚨 */}
        <div className="w-full bg-white/50 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] p-6 sm:p-10 mb-8 transition-all relative z-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          <form onSubmit={handleCalculate} className="space-y-6 sm:space-y-8">
            
            {/* Gender Toggle - Apple iOS Style */}
            <div className="bg-slate-200/50 backdrop-blur-md p-1.5 rounded-2xl flex relative w-full max-w-[240px] mx-auto shadow-inner border border-slate-300/30">
              <button 
                type="button"
                onClick={() => setGender('Boys')}
                className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all duration-300 z-10 ${gender === 'Boys' ? 'bg-white shadow-md text-blue-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Boys
              </button>
              <button 
                type="button"
                onClick={() => setGender('Girls')}
                className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all duration-300 z-10 ${gender === 'Girls' ? 'bg-white shadow-md text-fuchsia-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Girls
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              
              {/* 🚨 SMART COMBOBOX: SEARCHABLE EVENT INPUT 🚨 */}
              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Select Event</label>
                <div className="relative group">
                  <input 
                    type="text"
                    value={eventSearch}
                    onChange={(e) => {
                      setEventSearch(e.target.value);
                      setIsEventDropdownOpen(true);
                      setResult(null);
                    }}
                    onFocus={() => {
                      setEventSearch(''); // Clear to show all options on focus
                      setIsEventDropdownOpen(true);
                    }}
                    placeholder="Search event..."
                    className="w-full bg-white/60 hover:bg-white/90 border border-slate-200 hover:border-blue-300 rounded-2xl pl-12 pr-5 py-4 text-slate-900 font-bold text-base focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all placeholder:text-slate-400 placeholder:font-medium"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform duration-300 ${isEventDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Dropdown Options */}
                {isEventDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] z-50 max-h-60 overflow-y-auto custom-scrollbar p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {filteredEvents.length > 0 ? (
                      filteredEvents.map(ev => (
                        <button
                          key={ev}
                          type="button"
                          onClick={() => handleSelectEvent(ev)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors flex items-center justify-between ${selectedEvent === ev ? 'bg-blue-50 text-blue-700 font-black' : 'text-slate-700 font-bold hover:bg-slate-100'}`}
                        >
                          {ev}
                          {selectedEvent === ev && <Check className="w-4 h-4 text-blue-500" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-slate-400 text-sm italic text-center font-medium">No events found.</div>
                    )}
                  </div>
                )}
              </div>

              {/* Mark Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Your Personal Record</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={mark}
                    onChange={(e) => {
                      setMark(e.target.value);
                      setResult(null);
                    }}
                    placeholder={placeholderText}
                    className="w-full bg-white/60 hover:bg-white/90 border border-slate-200 hover:border-blue-300 rounded-2xl pl-12 pr-5 py-4 text-slate-900 font-black text-base focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all placeholder:text-slate-300 placeholder:font-medium tracking-wide"
                  />
                  <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-yellow-500 transition-colors" />
                </div>
              </div>
            </div>

            {error && <p className="text-rose-500 text-sm font-bold text-center animate-in fade-in bg-rose-50 py-2 rounded-lg border border-rose-100">{error}</p>}

            {/* Action Button (10% Accent Color) */}
            <button 
              type="submit" 
              disabled={isCalculating || !mark}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 sm:py-5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100 flex items-center justify-center gap-2 text-base sm:text-lg mt-4 group"
            >
              {isCalculating ? (
                <Activity className="w-5 h-5 animate-pulse" />
              ) : (
                <>Analyze My PR <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>

        {/* 🚨 DYNAMIC RESULTS VIEW 🚨 */}
        {result && !isCalculating && (
          <div className="w-full animate-in slide-in-from-bottom-8 fade-in duration-500 ease-out mb-12">
            
            <div className={`w-full rounded-[2.5rem] border ${result.bg} ${result.border} backdrop-blur-xl p-8 sm:p-10 relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 group hover:shadow-2xl`}>
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none scale-150 transform translate-x-4 -translate-y-4 group-hover:scale-[1.6] group-hover:-rotate-12 transition-transform duration-700">
                <Target className={`w-48 h-48 ${result.color}`} />
              </div>
              
              <div className="relative z-10 flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Projected Division
                  </p>
                  <h2 className={`text-3xl sm:text-4xl font-black tracking-tight mb-3 ${result.color}`}>
                    {result.label}
                  </h2>
                  <p className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed max-w-md">
                    {result.desc}
                  </p>
                </div>

                <div className="w-full sm:w-auto shrink-0 flex flex-row sm:flex-col justify-between sm:justify-center items-center gap-4 bg-white/70 backdrop-blur-md p-5 rounded-[1.5rem] border border-white/60 shadow-sm hover:bg-white/90 transition-colors">
                   <div className="text-center">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Recruit Score</span>
                      <div className="flex items-end justify-center gap-0.5">
                        <span className={`text-4xl font-black leading-none ${result.color}`}>{Math.round(result.score)}</span>
                        <span className="text-xs font-bold text-slate-400 pb-1">/99</span>
                      </div>
                   </div>
                   
                   <div className="w-px h-10 sm:w-10 sm:h-px bg-slate-200"></div>
                   
                   <div className="text-center">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Next Tier Goal</span>
                      <span className="text-xl font-black text-slate-800 block leading-none mb-1">{result.targetMarkFormatted}</span>
                      <span className={`text-[10px] font-bold ${result.isField ? 'text-emerald-500' : 'text-blue-500'}`}>
                        {result.deltaFormatted} Needed
                      </span>
                   </div>
                </div>

              </div>
            </div>

            {/* 🚨 ACQUISITION HOOK / CTA 🚨 */}
            <div className="mt-6 bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-8 sm:p-10 text-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:border-blue-300 transition-colors duration-500">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-100 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                {session ? "Update your athletic profile" : "Want coaches to see this?"}
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-8 max-w-sm mx-auto">
                {session 
                  ? "Head to your dashboard to add this PR to your verified portfolio so college coaches can easily find you."
                  : "Create your free Athletic Portfolio, sync your official Athletic.net times, and get indexed on our national database for college coaches."
                }
              </p>
              <Link 
                href={session ? "/dashboard" : "/login"} 
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 active:scale-[0.98] w-full sm:w-auto"
              >
                <Zap className="w-5 h-5" /> {session ? 'Go to Dashboard' : 'Claim My Portfolio'}
              </Link>
            </div>

          </div>
        )}
      </main>

    </div>
  );
}