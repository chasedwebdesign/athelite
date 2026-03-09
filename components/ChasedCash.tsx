import React from 'react';

interface ChasedCashProps {
  className?: string;
}

export function ChasedCash({ className = "w-10 h-7" }: ChasedCashProps) {
  return (
    <svg 
      viewBox="0 0 140 95" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 overflow-visible ${className}`}
    >
      <defs>
        {/* Deep Shadow Black Bottom Bill */}
        <linearGradient id="cash-bottom" x1="15" y1="25" x2="125" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#171717" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
        
        {/* Mid Charcoal Middle Bill */}
        <linearGradient id="cash-middle" x1="15" y1="20" x2="125" y2="75" gradientUnits="userSpaceOnUse">
          <stop stopColor="#27272a" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
        
        {/* Rich Black Top Bill */}
        <linearGradient id="cash-top" x1="15" y1="15" x2="125" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3f3f46" />
          <stop offset="0.3" stopColor="#18181b" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
        
        {/* Bright Gold Seal */}
        <linearGradient id="gold-seal" x1="50" y1="20" x2="90" y2="65" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" />
          <stop offset="0.4" stopColor="#eab308" />
          <stop offset="1" stopColor="#713f12" />
        </linearGradient>
        
        {/* Inner Indented Gold */}
        <linearGradient id="gold-seal-inner" x1="55" y1="25" x2="85" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#eab308" />
          <stop offset="1" stopColor="#854d0e" />
        </linearGradient>
        
        {/* 3D Drop Shadows */}
        <filter id="stack-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.5" />
        </filter>
        <filter id="seal-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
        </filter>
        <filter id="text-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#422006" floodOpacity="0.9" />
        </filter>
      </defs>

      {/* Bottom Bill (Rotated left) */}
      <g filter="url(#stack-shadow)">
        <rect x="15" y="25" width="110" height="55" rx="6" transform="rotate(-8 70 52.5)" fill="url(#cash-bottom)" stroke="#3f3f46" strokeWidth="1" />
      </g>

      {/* Middle Bill (Rotated right) */}
      <rect x="15" y="20" width="110" height="55" rx="6" transform="rotate(5 70 47.5)" fill="url(#cash-middle)" stroke="#52525b" strokeWidth="1" />

      {/* Top Bill (Front and center) */}
      <rect x="15" y="15" width="110" height="55" rx="6" fill="url(#cash-top)" stroke="#fbbf24" strokeWidth="1.5" />
      
      {/* Inner Dashed Border (Gold Accent) */}
      <rect x="20" y="20" width="100" height="45" rx="4" fill="none" stroke="#fde68a" strokeWidth="1" strokeDasharray="5 3" opacity="0.4"/>

      {/* --- LARGER CENTER EMBLEM --- */}
      <g filter="url(#seal-shadow)">
        {/* Heavy Gold Outer Ring */}
        <circle cx="70" cy="42.5" r="22" fill="url(#gold-seal)" stroke="#fef9c3" strokeWidth="1.5" />
        
        {/* Indented Inner Ring */}
        <circle cx="70" cy="42.5" r="16" fill="url(#gold-seal-inner)" stroke="#a16207" strokeWidth="1" />
        
        {/* The White/Gold "C" */}
        <text 
          x="70" 
          y="54" 
          fontFamily="Arial, Helvetica, sans-serif" 
          fontWeight="900" 
          fontSize="34" 
          fill="#ffffff" 
          textAnchor="middle" 
          filter="url(#text-glow)"
          letterSpacing="-1"
        >
          C
        </text>
      </g>

      {/* Glossy Top Reflection */}
      <path d="M 17 21 Q 70 28 123 21 L 123 16 Q 70 16 17 16 Z" fill="#ffffff" opacity="0.1" />
    </svg>
  );
}