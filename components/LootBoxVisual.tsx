'use client';

import React from 'react';
import { Hexagon, Sparkles, Crown } from 'lucide-react';

interface LootBoxVisualProps {
  tier: 'standard' | 'premium' | 'ultra';
  className?: string;
  size?: 'sm' | 'md' | 'lg'; // Controls the scaling boundary
}

export const LootBoxVisual = ({ tier, className = '', size = 'md' }: LootBoxVisualProps) => {
  // Defines the physical space the component takes up in the layout DOM
  const wrapperClasses = {
    sm: 'w-10 h-10 sm:w-14 sm:h-14',
    // INCREASED: Expanded the physical wrapper size for default Shop/Modal views
    md: 'w-36 h-36 sm:w-52 sm:h-52',
    lg: 'w-full h-full min-h-[350px]',
  }[size];

  // Dynamically shrinks the massive CSS art without breaking flex layouts
  const scaleClasses = {
    sm: 'scale-[0.15] sm:scale-[0.20]', // Drastically shrunken for the 28-day grid
    // INCREASED: Bumped up the scale modifier to make the boxes pop inside ShopPage
    md: 'scale-[0.70] sm:scale-[0.90]',
    lg: 'scale-100', // Full size
  }[size];

  const renderStandard = () => (
    <div className="relative flex items-center justify-center w-[250px] h-[250px] group/standard cursor-pointer">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full opacity-50 group-hover/standard:opacity-100 transition-opacity duration-500" />
      
      {/* Light Beam (Hover) */}
      <div className="absolute bottom-[50%] left-1/2 -translate-x-1/2 w-16 h-0 bg-gradient-to-t from-blue-400/40 to-transparent blur-md transition-all duration-500 group-hover/standard:h-24 opacity-0 group-hover/standard:opacity-100 z-0 pointer-events-none" />

      {/* The Crate */}
      <div className="relative z-10 w-36 h-36 flex flex-col items-center justify-center">
        {/* Lid */}
        <div className="w-full h-[50%] bg-slate-800 border-t-2 border-l border-r border-slate-600 rounded-t-xl relative flex items-center justify-center shadow-[inset_0_8px_15px_rgba(255,255,255,0.05),inset_0_-2px_10px_rgba(0,0,0,0.4)] transition-transform duration-500 group-hover/standard:-translate-y-3 z-30 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_20%,rgba(255,255,255,0.05)_25%,transparent_30%)]" />
          <Hexagon className="w-8 h-8 text-blue-300 drop-shadow-[0_0_10px_rgba(147,197,253,0.5)] relative z-10 transition-transform duration-500 group-hover/standard:scale-110" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-2 bg-slate-700 border-t border-x border-slate-500 rounded-t-sm" />
        </div>

        {/* Glowing Seam */}
        <div className="w-[105%] h-1.5 bg-blue-300 rounded-full shadow-[0_0_15px_5px_rgba(96,165,250,0.4)] absolute top-[50%] -translate-y-1/2 z-20 transition-all duration-500 group-hover/standard:shadow-[0_0_20px_8px_rgba(96,165,250,0.7)] group-hover/standard:h-2 flex items-center justify-center">
          <div className="w-10 h-full bg-white blur-[1px] opacity-70" />
        </div>

        {/* Base */}
        <div className="w-[95%] h-[50%] bg-slate-700 rounded-b-xl shadow-[inset_0_-8px_20px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(0,0,0,0.3)] relative overflow-hidden transition-transform duration-500 group-hover/standard:translate-y-1 border-b-2 border-x border-slate-800 z-10">
          <div className="absolute top-0 left-4 w-1 h-full bg-slate-800 shadow-[inset_1px_0_0_rgba(255,255,255,0.1)]" />
          <div className="absolute top-0 right-4 w-1 h-full bg-slate-800 shadow-[inset_1px_0_0_rgba(255,255,255,0.1)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-3 bg-slate-800 border-b border-x border-slate-900 rounded-b-sm shadow-[inset_0_-1px_2px_rgba(255,255,255,0.1)]" />
        </div>
      </div>
    </div>
  );

  const renderPremium = () => (
    <div className="relative flex items-center justify-center w-[300px] h-[300px] group/premium cursor-pointer">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-fuchsia-500/20 blur-3xl rounded-full opacity-50 group-hover/premium:opacity-100 transition-opacity duration-500" />
      
      {/* Particle System & Light Beam */}
      <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-0 group-hover/premium:opacity-100 transition-opacity duration-300">
        <div className="absolute top-[45%] left-[35%] w-2 h-2 bg-fuchsia-400 rotate-45 transition-all duration-700 group-hover/premium:-translate-y-16 group-hover/premium:-translate-x-8 group-hover/premium:scale-125 blur-[1px] shadow-[0_0_10px_rgba(217,70,239,0.8)]" />
        <div className="absolute top-[50%] left-[65%] w-1.5 h-1.5 bg-cyan-400 rotate-12 transition-all duration-700 delay-100 group-hover/premium:-translate-y-20 group-hover/premium:translate-x-10 group-hover/premium:scale-150 blur-[1px] shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        <div className="absolute bottom-[50%] left-1/2 -translate-x-1/2 w-20 h-0 bg-gradient-to-t from-fuchsia-400/50 via-purple-500/20 to-transparent blur-lg transition-all duration-500 group-hover/premium:h-32" />
      </div>

      {/* The Crate */}
      <div className="relative z-10 w-40 h-40 flex flex-col items-center justify-center">
        {/* Lid (Trapezoid Cut) */}
        <div className="w-full h-[55%] bg-indigo-950 border-t-2 border-indigo-500/50 [clip-path:polygon(10%_0%,90%_0%,100%_100%,0%_100%)] relative flex items-center justify-center pt-2 shadow-[inset_0_10px_20px_rgba(255,255,255,0.05),inset_0_-4px_15px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover/premium:-translate-y-4 z-30">
             <div className="absolute top-0 left-[20%] w-[1px] h-full bg-indigo-700/50 skew-x-[-15deg]" />
             <div className="absolute top-0 right-[20%] w-[1px] h-full bg-indigo-700/50 skew-x-[15deg]" />
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-800/80 to-transparent opacity-80" />
             <Sparkles className="w-10 h-10 text-fuchsia-300 drop-shadow-[0_0_15px_rgba(217,70,239,0.8)] relative z-10 transition-transform duration-500 group-hover/premium:scale-110" />
        </div>

        {/* Glowing Seam with Cyber-Lock */}
        <div className="w-[105%] h-2 bg-gradient-to-r from-fuchsia-400/50 via-white to-fuchsia-400/50 rounded-full shadow-[0_0_20px_6px_rgba(217,70,239,0.5)] absolute top-[55%] -translate-y-1/2 z-20 transition-all duration-500 group-hover/premium:shadow-[0_0_30px_10px_rgba(217,70,239,0.8)] group-hover/premium:h-2.5 flex items-center justify-center">
          <div className="w-8 h-5 bg-indigo-950 border border-fuchsia-500/50 [clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)] flex items-center justify-center shadow-[0_0_10px_rgba(217,70,239,0.5)] transition-transform duration-500 group-hover/premium:scale-110 group-hover/premium:bg-fuchsia-900">
             <div className="w-4 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)]" />
          </div>
        </div>

        {/* Base */}
        <div className="w-[92%] h-[45%] bg-gradient-to-b from-indigo-800 to-indigo-950 rounded-b-xl shadow-[inset_0_-10px_20px_rgba(0,0,0,0.8)] relative overflow-hidden transition-transform duration-500 group-hover/premium:translate-y-1 border-b-2 border-indigo-400/30 z-10">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-full flex justify-between px-1">
                <div className="w-1 h-full bg-black/40 shadow-[inset_1px_0_0_rgba(255,255,255,0.15)]" />
                <div className="w-1 h-full bg-black/40 shadow-[inset_1px_0_0_rgba(255,255,255,0.15)]" />
             </div>
        </div>
      </div>
    </div>
  );

  const renderUltra = () => (
    <div className="relative flex items-center justify-center w-[350px] h-[350px] group/ultra cursor-pointer">
      {/* Intense Ambient Background Glow */}
      <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full opacity-50 group-hover/ultra:opacity-100 group-hover/ultra:bg-amber-500/30 transition-all duration-700" />
      
      {/* Particle System & Massive Volumetric Light */}
      <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-0 group-hover/ultra:opacity-100 transition-opacity duration-300">
        <div className="absolute top-[45%] left-[30%] w-2 h-2 border-[1.5px] border-yellow-400 rotate-45 transition-all duration-700 group-hover/ultra:-translate-y-24 group-hover/ultra:-translate-x-12 group-hover/ultra:scale-150 group-hover/ultra:rotate-90 shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
        <div className="absolute top-[45%] left-[70%] w-3 h-3 border-[1.5px] border-amber-300 rotate-12 transition-all duration-1000 delay-75 group-hover/ultra:-translate-y-28 group-hover/ultra:translate-x-14 group-hover/ultra:scale-125 group-hover/ultra:rotate-[120deg] shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
        <div className="absolute top-[50%] left-[50%] w-1.5 h-1.5 bg-yellow-100 rotate-45 transition-all duration-700 delay-150 group-hover/ultra:-translate-y-36 group-hover/ultra:scale-150 shadow-[0_0_20px_rgba(255,255,255,1)]" />
        
        {/* Core Light Beam */}
        <div className="absolute bottom-[45%] left-1/2 -translate-x-1/2 w-40 h-0 bg-gradient-to-t from-yellow-100/80 via-amber-400/40 to-transparent blur-2xl transition-all duration-500 group-hover/ultra:h-56" />
      </div>

      {/* The Physical Chest */}
      <div className="relative z-10 w-56 h-48 flex flex-col items-center justify-center">
        
        {/* The Lid (Domed/Angled Metallic Slate) */}
        <div className="w-full h-[55%] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border-t border-slate-500 [clip-path:polygon(15%_0%,85%_0%,100%_100%,0%_100%)] relative flex items-center justify-center shadow-[inset_0_15px_30px_rgba(0,0,0,0.7)] transition-transform duration-500 group-hover/ultra:-translate-y-6 z-30">
          
          {/* Glassmorphic Specular Highlight */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.15),_transparent_70%)]" />

          {/* Lid Gold Straps (V-Shape) */}
          <div className="absolute top-0 left-[20%] w-5 h-full bg-gradient-to-b from-yellow-200 via-yellow-500 to-amber-700 skew-x-[18deg] origin-top shadow-[4px_0_10px_rgba(0,0,0,0.6)] border-l border-yellow-100/50 border-r border-amber-900 flex justify-center pt-2">
             <div className="w-1.5 h-1.5 bg-yellow-100 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
          </div>
          <div className="absolute top-0 right-[20%] w-5 h-full bg-gradient-to-b from-yellow-200 via-yellow-500 to-amber-700 skew-x-[-18deg] origin-top shadow-[-4px_0_10px_rgba(0,0,0,0.6)] border-r border-yellow-100/50 border-l border-amber-900 flex justify-center pt-2">
             <div className="w-1.5 h-1.5 bg-yellow-100 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
          </div>

          {/* Crown Embed with Bloom */}
          <div className="relative mb-2">
            <Crown className="absolute inset-0 w-16 h-16 text-yellow-400 blur-md opacity-0 transition-opacity duration-500 group-hover/ultra:opacity-60" />
            <Crown className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] relative z-10 transition-transform duration-500 group-hover/ultra:scale-110" />
          </div>
        </div>

        {/* Center Ornate Lock / Emblem */}
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 transition-transform duration-500 group-hover/ultra:scale-110 group-hover/ultra:-translate-y-8">
          <div className="w-14 h-16 bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-700 [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] flex items-center justify-center p-[2px] shadow-[0_10px_20px_rgba(0,0,0,0.7)]">
            <div className="w-full h-full bg-slate-900 [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent)]" />
               {/* Keyhole / Energy Core */}
               <div className="w-2.5 h-6 bg-amber-500/20 border border-amber-500/50 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)] flex flex-col items-center justify-start pt-1">
                  <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,1)]" />
               </div>
            </div>
          </div>
        </div>

        {/* The Core Seam (Blinding Light Escaping) */}
        <div className="w-[102%] h-2 bg-gradient-to-r from-amber-600 via-white to-amber-600 rounded-full shadow-[0_0_25px_8px_rgba(250,204,21,0.7)] absolute top-[55%] -translate-y-1/2 z-20 transition-all duration-500 group-hover/ultra:shadow-[0_0_60px_20px_rgba(250,204,21,1)] group-hover/ultra:h-4 group-hover/ultra:bg-white flex items-center justify-center">
            {/* Center Blinding Core */}
            <div className="w-32 h-full bg-white blur-[3px] opacity-100 shadow-[0_0_20px_rgba(255,255,255,1)] transition-all duration-500 group-hover/ultra:w-48" />
        </div>

        {/* The Base (Premium Embossed Armor) */}
        <div className="w-[95%] h-[45%] bg-amber-950 rounded-b-lg shadow-[inset_0_-20px_40px_rgba(0,0,0,0.9),inset_0_2px_5px_rgba(255,255,255,0.2)] relative overflow-hidden transition-transform duration-500 group-hover/ultra:translate-y-2 border-b-4 border-amber-900 z-10">
          
          {/* CSS Embossed Quilted/Diamond Pattern */}
          <div 
            className="absolute inset-0 opacity-80 mix-blend-overlay"
            style={{
              backgroundImage: `
                linear-gradient(135deg, rgba(0,0,0,0.8) 25%, transparent 25%),
                linear-gradient(225deg, rgba(0,0,0,0.8) 25%, transparent 25%),
                linear-gradient(45deg, rgba(0,0,0,0.8) 25%, transparent 25%),
                linear-gradient(315deg, rgba(0,0,0,0.8) 25%, transparent 25%)
              `,
              backgroundPosition: '12px 0, 12px 0, 0 0, 0 0',
              backgroundSize: '24px 24px'
            }}
          />
          
          {/* Deep Shadow Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

          {/* Base Vertical Straps */}
          <div className="absolute top-0 left-[23%] -translate-x-1/2 w-5 h-full bg-gradient-to-r from-yellow-300 via-yellow-600 to-amber-800 shadow-[4px_0_10px_rgba(0,0,0,0.8),-4px_0_10px_rgba(0,0,0,0.8)] border-x border-amber-900/50 flex flex-col justify-between py-2 items-center z-10">
             <div className="w-2 h-2 bg-yellow-200 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
             <div className="w-2 h-2 bg-yellow-600 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
          </div>
          
          <div className="absolute top-0 right-[23%] translate-x-1/2 w-5 h-full bg-gradient-to-r from-yellow-300 via-yellow-600 to-amber-800 shadow-[4px_0_10px_rgba(0,0,0,0.8),-4px_0_10px_rgba(0,0,0,0.8)] border-x border-amber-900/50 flex flex-col justify-between py-2 items-center z-10">
             <div className="w-2 h-2 bg-yellow-200 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
             <div className="w-2 h-2 bg-yellow-600 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
          </div>

          {/* 3D Base Corner Brackets */}
          <div className="absolute bottom-0 left-0 w-8 h-8 z-20">
             <div className="absolute inset-0 bg-gradient-to-tr from-yellow-300 via-amber-600 to-amber-900 [clip-path:polygon(0_100%,0_0,100%_100%)]" />
             <div className="absolute bottom-0 left-0 w-full h-[2px] bg-yellow-200/60" />
             <div className="absolute bottom-0 left-0 w-[2px] h-full bg-yellow-200/60" />
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 z-20">
             <div className="absolute inset-0 bg-gradient-to-tl from-yellow-300 via-amber-600 to-amber-900 [clip-path:polygon(100%_100%,100%_0,0_100%)]" />
             <div className="absolute bottom-0 right-0 w-full h-[2px] bg-yellow-200/60" />
             <div className="absolute bottom-0 right-0 w-[2px] h-full bg-yellow-200/60" />
          </div>
        </div>

      </div>
    </div>
  );

  // If size is explicitly requested as full/large, render without absolute bounds.
  if (size === 'lg') {
    return (
      <div className={`relative flex items-center justify-center ${wrapperClasses} ${className}`}>
        {tier === 'standard' && renderStandard()}
        {tier === 'premium' && renderPremium()}
        {tier === 'ultra' && renderUltra()}
      </div>
    );
  }

  // 🚨 THE STRETCH FIX:
  // The outer div (wrapperClasses) dictates the physical layout boundaries in the flex grid.
  // The inner div scales the CSS art using absolute positioning, making it completely exempt from flexbox stretching rules.
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${wrapperClasses} ${className}`}>
      <div className={`absolute flex items-center justify-center origin-center transition-transform ${scaleClasses} pointer-events-none`}>
        <div className="pointer-events-auto flex items-center justify-center">
          {tier === 'standard' && renderStandard()}
          {tier === 'premium' && renderPremium()}
          {tier === 'ultra' && renderUltra()}
        </div>
      </div>
    </div>
  );
};