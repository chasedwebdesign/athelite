import React from 'react';
import { UserCircle2, Medal, School } from 'lucide-react';

// ==========================================
// 1. TIGHTER FLUID FIRE BORDER (INFERNO)
// ==========================================
const FireBorder = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes flame-updraft {
        0% { transform: translateY(120%) scale(1.2); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translateY(-120%) scale(0.8); opacity: 0; }
      }
      .mask-ring-flame {
        -webkit-mask-image: radial-gradient(closest-side, transparent 82%, black 84%, black 93%, transparent 96%);
        mask-image: radial-gradient(closest-side, transparent 82%, black 84%, black 93%, transparent 96%);
      }
      .flame-streak {
        position: absolute;
        background: linear-gradient(to top, #991b1b 0%, #ea580c 50%, #facc15 100%);
        border-radius: 50%;
        filter: blur(3px);
        animation: flame-updraft 2s infinite ease-in;
      }
    `}} />

    {/* Ambient Heat Glow */}
    <div className="absolute -inset-4 bg-gradient-to-t from-red-700 via-orange-600 to-transparent rounded-full blur-xl opacity-60 animate-pulse"></div>

    {/* The Fire Mask Container */}
    <div className="absolute -inset-[8%] rounded-full mask-ring-flame overflow-hidden pointer-events-none z-20">
       <div className="absolute inset-0 bg-gradient-to-t from-red-800 via-red-600 to-orange-500 opacity-90"></div>
       <div className="flame-streak left-[10%] w-[25%] h-[80%]" style={{ animationDuration: '1.5s', animationDelay: '0.0s' }}></div>
       <div className="flame-streak left-[25%] w-[35%] h-[90%]" style={{ animationDuration: '1.8s', animationDelay: '0.4s' }}></div>
       <div className="flame-streak left-[45%] w-[20%] h-[70%]" style={{ animationDuration: '1.3s', animationDelay: '0.8s' }}></div>
       <div className="flame-streak left-[60%] w-[30%] h-[85%]" style={{ animationDuration: '1.7s', animationDelay: '0.2s' }}></div>
       <div className="flame-streak left-[80%] w-[25%] h-[75%]" style={{ animationDuration: '1.6s', animationDelay: '0.6s' }}></div>
       <div className="flame-streak left-[35%] w-[15%] h-[60%]" style={{ animationDuration: '1.4s', animationDelay: '0.9s' }}></div>
       <div className="flame-streak left-[70%] w-[20%] h-[80%]" style={{ animationDuration: '1.9s', animationDelay: '0.3s' }}></div>
    </div>

    {/* Crisp Inner Boundary Line */}
    <div className="absolute inset-[1px] rounded-full border-2 border-slate-900 z-10 shadow-inner"></div>

    {/* Avatar Container */}
    <div className="absolute inset-[2px] z-10 rounded-full overflow-hidden flex items-center justify-center bg-slate-900 shadow-xl">
      {children}
    </div>
  </div>
);

// ==========================================
// 2. ANIMATED SILVER BORDER (THINNER)
// ==========================================
const SilverBorder = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="absolute -inset-1 rounded-full overflow-hidden shadow-[0_0_10px_rgba(148,163,184,0.5)] z-0">
      <div className="absolute inset-[-50%] animate-[spin_4s_linear_infinite]" 
           style={{ background: 'conic-gradient(from 0deg, #94a3b8, #f8fafc, #64748b, #f1f5f9, #94a3b8)' }}></div>
    </div>
    <div className="absolute inset-[2px] rounded-full border border-slate-300 z-10"></div>
    <div className="absolute inset-[3px] z-20 rounded-full overflow-hidden flex items-center justify-center bg-slate-100">
      {children}
    </div>
  </div>
);

// ==========================================
// 3. ANIMATED GOLD BORDER (THINNER)
// ==========================================
const GoldBorder = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="absolute -inset-1 rounded-full overflow-hidden shadow-[0_0_15px_rgba(234,179,8,0.5)] z-0">
      <div className="absolute inset-[-50%] animate-[spin_4s_linear_infinite]" 
           style={{ background: 'conic-gradient(from 0deg, #b45309, #fef08a, #d97706, #fde047, #b45309)' }}></div>
    </div>
    <div className="absolute inset-[2px] rounded-full border border-yellow-400 z-10"></div>
    <div className="absolute inset-[3px] z-20 rounded-full overflow-hidden flex items-center justify-center bg-slate-100">
      {children}
    </div>
  </div>
);

// ==========================================
// 4. DEEP BLUE DIAMOND BORDER (THINNER)
// ==========================================
const DiamondBorder = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    {/* Deep Blue Glow */}
    <div className="absolute -inset-2 bg-blue-700/40 rounded-full blur-xl animate-pulse"></div>
    
    <div className="absolute -inset-1 rounded-full overflow-hidden shadow-[0_0_15px_#1d4ed8] z-0">
      {/* High contrast Midnight Blue and Pure White facets */}
      <div className="absolute inset-[-50%] animate-[spin_4s_linear_infinite]" 
           style={{ background: 'conic-gradient(from 0deg, #0f172a, #1e3a8a, #ffffff, #1e40af, #3b82f6, #ffffff, #0f172a)' }}></div>
      {/* Sharp icy highlight overlay */}
      <div className="absolute inset-[-50%] animate-[spin_2s_linear_infinite_reverse] opacity-40 mix-blend-overlay" 
           style={{ background: 'conic-gradient(from 180deg, transparent, #e0f2fe, transparent, #ffffff, transparent)' }}></div>
    </div>

    <div className="absolute inset-[2px] rounded-full border-2 border-blue-200/60 z-10 shadow-inner"></div>
    
    <div className="absolute inset-[3px] z-20 rounded-full overflow-hidden flex items-center justify-center bg-slate-900">
      {children}
    </div>
  </div>
);

// ==========================================
// 5. SMOOTH CHROMATIC NEON GLITCH
// ==========================================
const NeonGlitchBorder = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <style dangerouslySetInnerHTML={{__html: `
      /* Using opacity layering instead of screen blending.
         Base opacity is 0.6, so overlap creates deep purple.
         Glitch state hits opacity 1 for bright distinct colors.
      */
      @keyframes chromatic-cyan {
        0%, 85% { transform: translate(0, 0) scale(1); opacity: 0.6; filter: blur(0px); }
        87% { transform: translate(-3px, 2px) scale(1.02) skewX(2deg); opacity: 1; filter: blur(1px); }
        89% { transform: translate(3px, -2px) scale(0.98) skewX(-2deg); opacity: 1; filter: blur(0px); }
        91% { transform: translate(0, 0) scale(1); opacity: 0.6; }
        95% { transform: translate(-2px, 0); opacity: 0.8; }
        98% { transform: translate(0, 0); opacity: 0.6; }
        100% { transform: translate(0, 0); }
      }
      @keyframes chromatic-pink {
        0%, 85% { transform: translate(0, 0) scale(1); opacity: 0.6; filter: blur(0px); }
        87% { transform: translate(3px, -2px) scale(0.98) skewX(-2deg); opacity: 1; filter: blur(1px); }
        89% { transform: translate(-3px, 2px) scale(1.02) skewX(2deg); opacity: 1; filter: blur(0px); }
        91% { transform: translate(0, 0) scale(1); opacity: 0.6; }
        95% { transform: translate(2px, 0); opacity: 0.8; }
        98% { transform: translate(0, 0); opacity: 0.6; }
        100% { transform: translate(0, 0); }
      }
    `}} />
    
    {/* Darker Ambient Glow for contrast */}
    <div className="absolute -inset-4 bg-fuchsia-900/50 rounded-full blur-xl animate-pulse z-0"></div>

    <div className="absolute -inset-[3px] rounded-full border-[3px] border-cyan-500 shadow-[0_0_12px_#06b6d4] z-10" 
         style={{ animation: 'chromatic-cyan 3.5s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}></div>
         
    <div className="absolute -inset-[3px] rounded-full border-[3px] border-fuchsia-500 shadow-[0_0_12px_#d946ef] z-10" 
         style={{ animation: 'chromatic-pink 3.5s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94)', animationDelay: '0.1s' }}></div>

    {/* Avatar Container (Dark background for neon contrast) */}
    <div className="absolute inset-[3px] z-20 rounded-full overflow-hidden flex items-center justify-center bg-slate-900">
      {children}
    </div>
  </div>
);

// ==========================================
// 6. FLUID ETHEREAL COSMOS BORDER
// ==========================================
const EtherealCosmosBorder = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 flex items-center justify-center overflow-visible">
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes nebula-spin { 100% { transform: rotate(360deg); } }
      @keyframes pulse-ring { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 1; } }
    `}} />
    <div className="absolute -inset-6 animate-[nebula-spin_12s_linear_infinite] opacity-60 blur-2xl rounded-full z-0" style={{ background: 'conic-gradient(from 0deg, #3b0764, #4f46e5, #0ea5e9, #a855f7, #ec4899, #3b0764)' }}></div>
    <div className="absolute -inset-2 border-2 border-indigo-400/50 rounded-full animate-[pulse-ring_3s_ease-in-out_infinite] z-0"></div>
    <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] z-10 animate-[nebula-spin_6s_linear_infinite]" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="cosmos-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="url(#cosmos-grad-1)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="30 70" />
    </svg>
    <svg className="absolute -inset-[2px] w-[calc(100%+4px)] h-[calc(100%+4px)] z-10 animate-[nebula-spin_8s_linear_infinite_reverse]" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="cosmos-grad-2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="url(#cosmos-grad-2)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="15 85" />
    </svg>
    <div className="absolute inset-[3px] bg-slate-950 rounded-full z-10 shadow-[inset_0_0_12px_#000]"></div>
    <div className="absolute inset-[5px] z-20 rounded-full overflow-hidden flex items-center justify-center bg-slate-900">
      {children}
    </div>
  </div>
);

// ==========================================
// 7. NEW FREE BONUS BORDER: THE PIONEER
// ==========================================
const PioneerBorder = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes pioneer-spin-slow { 100% { transform: rotate(360deg); } }
      @keyframes pioneer-spin-fast { 100% { transform: rotate(-360deg); } }
      @keyframes pioneer-flicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    `}} />
    
    {/* Ambient Holographic Glow */}
    <div className="absolute -inset-4 bg-cyan-600/20 rounded-full blur-xl animate-[pioneer-flicker_3s_ease-in-out_infinite] z-0"></div>

    {/* Outer HUD Tech Ring (Counter-clockwise rotation) */}
    <svg className="absolute -inset-[6px] w-[calc(100%+12px)] h-[calc(100%+12px)] z-10 animate-[pioneer-spin-fast_12s_linear_infinite]" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <circle cx="50" cy="50" r="49" fill="none" stroke="#0369a1" strokeWidth="0.5" strokeDasharray="2 4" />
      <circle cx="50" cy="50" r="49" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="15 60" strokeLinecap="round" />
    </svg>

    {/* Main Radar Container */}
    <div className="absolute -inset-1 rounded-full bg-slate-950 shadow-[inset_0_0_15px_#020617] z-10 overflow-hidden border border-slate-800">
       {/* Sweeping Radar Beam */}
       <div className="absolute inset-[-50%] animate-[pioneer-spin-slow_2.5s_linear_infinite]" 
            style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(14, 165, 233, 0.4) 85%, rgba(56, 189, 248, 0.9) 98%, #ffffff 100%)' }}></div>
    </div>

    {/* Inner HUD Ring (Clockwise rotation) */}
    <div className="absolute inset-[1px] rounded-full border border-cyan-400/30 z-20 shadow-[0_0_10px_rgba(56,189,248,0.4)]">
        <svg className="absolute inset-0 w-full h-full animate-[pioneer-spin-slow_8s_linear_infinite]" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
           <circle cx="50" cy="50" r="49" fill="none" stroke="#bae6fd" strokeWidth="1" strokeDasharray="4 8" opacity="0.7" />
        </svg>
    </div>
    
    {/* Avatar Container */}
    <div className="absolute inset-[4px] z-30 rounded-full overflow-hidden flex items-center justify-center bg-slate-950 shadow-2xl">
      {children}
    </div>
  </div>
);

// ==========================================
// 8. EXCLUSIVE REFERRAL BORDER (PLASMA SURGE)
// ==========================================
const PlasmaSurgeBorder = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes plasma-spin { 100% { transform: rotate(360deg); } }
      @keyframes plasma-pulse { 0%, 100% { opacity: 0.7; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1.02); } }
    `}} />
    
    <div className="absolute -inset-4 bg-emerald-900/60 rounded-full blur-xl animate-pulse z-0"></div>
    
    <div className="absolute -inset-1.5 rounded-full overflow-hidden shadow-[0_0_20px_#10b981] z-10 animate-[plasma-pulse_2s_ease-in-out_infinite]">
       <div className="absolute inset-[-50%] animate-[plasma-spin_1.5s_linear_infinite]" 
            style={{ background: 'conic-gradient(from 0deg, #022c22, #10b981, #22d3ee, #10b981, #022c22)' }}></div>
    </div>

    <div className="absolute inset-[2px] rounded-full border-2 border-emerald-300 z-10 shadow-inner"></div>
    
    <div className="absolute inset-[4px] z-20 rounded-full overflow-hidden flex items-center justify-center bg-slate-950">
      {children}
    </div>
  </div>
);

// ==========================================
// 9. NEW EXOTIC: ABYSSAL VOID (BLACK HOLE)
// ==========================================
const AbyssalVoidBorder = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes void-spin { 100% { transform: rotate(360deg); } }
      @keyframes void-pulse { 0%, 100% { transform: scale(0.95); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } }
      @keyframes accretion-wobble { 0%, 100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.02) rotate(180deg); } }
    `}} />
    
    {/* Deep gravity well glow */}
    <div className="absolute -inset-6 bg-fuchsia-900/50 rounded-full blur-2xl animate-[void-pulse_4s_ease-in-out_infinite] z-0"></div>
    
    {/* Accretion Disk */}
    <div className="absolute -inset-2 rounded-full bg-slate-950 shadow-[0_0_30px_#4c1d95] z-0 overflow-hidden animate-[accretion-wobble_3s_ease-in-out_infinite]">
       <div className="absolute inset-[-50%] animate-[void-spin_2s_linear_infinite]"
            style={{ background: 'conic-gradient(from 0deg, #000000, #4c1d95, #c026d3, #000000, #1e1b4b, #000000)' }}></div>
    </div>

    {/* Event Horizon (pure black inner ring) */}
    <div className="absolute -inset-1 rounded-full border-[4px] border-black shadow-[inset_0_0_20px_#000] z-10"></div>
    
    {/* Swirling energy overlay (screen/lighten effect) */}
    <div className="absolute inset-[-1px] rounded-full mix-blend-screen opacity-60 z-20 animate-[void-spin_3s_linear_infinite_reverse]"
         style={{ background: 'conic-gradient(from 180deg, transparent, rgba(232, 121, 249, 0.8), transparent)' }}></div>

    {/* Avatar Container (Deep dark background to simulate being inside the void) */}
    <div className="absolute inset-[3px] z-30 rounded-full overflow-hidden flex items-center justify-center bg-black shadow-[inset_0_0_15px_#000]">
      {children}
    </div>
  </div>
);

// ==========================================
// 10. NEW EXOTIC: CELESTIAL RADIANCE (GOD TIER)
// ==========================================
const CelestialRadianceBorder = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes celestial-spin { 100% { transform: rotate(360deg); } }
      @keyframes celestial-spin-reverse { 100% { transform: rotate(-360deg); } }
      @keyframes celestial-breathe { 0%, 100% { opacity: 0.5; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } }
    `}} />
    
    {/* Soft, wide angelic aura */}
    <div className="absolute -inset-6 bg-gradient-to-tr from-yellow-200/20 via-white/40 to-amber-300/20 rounded-full blur-xl animate-[celestial-breathe_4s_ease-in-out_infinite] z-0"></div>
    
    {/* Harder, glowing back-plate */}
    <div className="absolute -inset-[2px] rounded-full bg-yellow-400/20 blur-sm z-0"></div>

    {/* Sweeping Corona of Light (Sharp leading edge fading into gold) */}
    <div className="absolute -inset-[3px] rounded-full overflow-hidden z-10 shadow-[0_0_15px_rgba(253,224,71,0.4)]">
      <div className="absolute inset-[-50%] animate-[celestial-spin_4s_linear_infinite]" 
           style={{ background: 'conic-gradient(from 0deg, transparent 0%, transparent 10%, #ffffff 15%, #fde047 17%, transparent 30%, transparent 50%, transparent 60%, #ffffff 65%, #fde047 67%, transparent 80%)' }}></div>
    </div>

    {/* Outer Holy Halo (Slow reverse spin with delicate geometry) */}
    <svg className="absolute -inset-[7px] w-[calc(100%+14px)] h-[calc(100%+14px)] z-20 animate-[celestial-spin-reverse_24s_linear_infinite]" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <circle cx="50" cy="50" r="49" fill="none" stroke="#fef08a" strokeWidth="0.5" strokeDasharray="1 3" opacity="0.8" />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#fde047" strokeWidth="0.5" strokeDasharray="12 6" opacity="0.5" />
    </svg>

    {/* Inner Power Ring (Fast forward spin) */}
    <svg className="absolute -inset-[1px] w-[calc(100%+2px)] h-[calc(100%+2px)] z-20 animate-[celestial-spin_12s_linear_infinite]" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      <circle cx="50" cy="50" r="49" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="15 5 1 5" filter="drop-shadow(0 0 2px #fde047)" />
    </svg>

    {/* Crisp Inner Rim */}
    <div className="absolute inset-[1px] rounded-full border border-yellow-100 z-20 shadow-[inset_0_0_12px_rgba(253,224,71,0.6),0_0_8px_rgba(253,224,71,0.4)]"></div>

    {/* Avatar Container */}
    <div className="absolute inset-[3px] z-30 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-2xl">
      {children}
    </div>
  </div>
);

// ==========================================
// THE MAIN EXPORTED COMPONENT
// ==========================================

interface AvatarWithBorderProps {
  avatarUrl: string | null;
  borderId: string | null | undefined;
  sizeClasses?: string;
  userRole?: 'athlete' | 'coach';
}

export function AvatarWithBorder({ avatarUrl, borderId, sizeClasses = "w-12 h-12", userRole = 'athlete' }: AvatarWithBorderProps) {
  
  const DefaultIcon = userRole === 'coach' ? School : (borderId === 'none' || !borderId ? UserCircle2 : Medal);

  const AvatarImage = (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
      {avatarUrl ? (
        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        <DefaultIcon className="w-[50%] h-[50%] text-slate-400/80" />
      )}
    </div>
  );

  // 1. METALLIC & GEM BORDERS
  if (borderId === 'animated-silver') {
    return <div className={`relative ${sizeClasses} shrink-0 aspect-square rounded-full block`}><SilverBorder>{AvatarImage}</SilverBorder></div>;
  }
  if (borderId === 'animated-gold') {
    return <div className={`relative ${sizeClasses} shrink-0 aspect-square rounded-full block`}><GoldBorder>{AvatarImage}</GoldBorder></div>;
  }
  if (borderId === 'animated-diamond') {
    return <div className={`relative ${sizeClasses} shrink-0 aspect-square rounded-full block`}><DiamondBorder>{AvatarImage}</DiamondBorder></div>;
  }

  // 2. PREMIUM ANIMATED BORDERS
  if (borderId === 'fire') {
    return <div className={`relative ${sizeClasses} shrink-0 aspect-square rounded-full block`}><FireBorder>{AvatarImage}</FireBorder></div>;
  }
  if (borderId === 'neon-glitch') {
    return <div className={`relative ${sizeClasses} shrink-0 aspect-square rounded-full block`}><NeonGlitchBorder>{AvatarImage}</NeonGlitchBorder></div>;
  }
  if (borderId === 'ethereal-cosmos') {
     return <div className={`relative ${sizeClasses} shrink-0 aspect-square rounded-full block`}><EtherealCosmosBorder>{AvatarImage}</EtherealCosmosBorder></div>;
  }
  
  // 3. SPECIAL FREE BORDER
  if (borderId === 'pioneer') {
     return <div className={`relative ${sizeClasses} shrink-0 aspect-square rounded-full block`}><PioneerBorder>{AvatarImage}</PioneerBorder></div>;
  }
  
  // 4. EXCLUSIVE REWARDS
  if (borderId === 'plasma-surge') {
     return <div className={`relative ${sizeClasses} shrink-0 aspect-square rounded-full block`}><PlasmaSurgeBorder>{AvatarImage}</PlasmaSurgeBorder></div>;
  }

  // 5. EXOTIC / GOD TIER BORDERS
  if (borderId === 'abyssal-void') {
     return <div className={`relative ${sizeClasses} shrink-0 aspect-square rounded-full block`}><AbyssalVoidBorder>{AvatarImage}</AbyssalVoidBorder></div>;
  }
  if (borderId === 'celestial-radiance') {
     return <div className={`relative ${sizeClasses} shrink-0 aspect-square rounded-full block`}><CelestialRadianceBorder>{AvatarImage}</CelestialRadianceBorder></div>;
  }

  // 6. FALLBACK TO STANDARD CSS BORDERS
  let standardClass = 'border-[3px] border-slate-200 shadow-sm'; 

  if (borderId && borderId !== 'none') {
     if(borderId.startsWith('border-')) {
         standardClass = `border-[3px] ${borderId} shadow-md`;
     }
  }

  return (
    <div className={`relative ${sizeClasses} shrink-0 aspect-square rounded-full flex items-center justify-center overflow-hidden z-10 bg-slate-50 ${standardClass} transition-all duration-300 group-hover:scale-105`}>
      {AvatarImage}
    </div>
  );
}