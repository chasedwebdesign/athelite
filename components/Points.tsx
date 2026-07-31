import React from 'react';

interface PointsProps {
  className?: string;
}

export function Points({ className = "w-10 h-10" }: PointsProps) {
  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 overflow-visible ${className}`}
    >
      <style>
        {`
          .spin-clockwise { transform-origin: 60px 60px; animation: spin 16s linear infinite; }
          .spin-counter { transform-origin: 60px 60px; animation: spin 24s linear infinite reverse; }
          .pulse { animation: pulse 3s ease-in-out infinite; }
          .float { transform-origin: 60px 60px; animation: float 5s ease-in-out infinite; }
          .trace-line { stroke-dasharray: 150; stroke-dashoffset: 150; animation: trace 6s linear infinite; }
          .trace-line-delayed { stroke-dasharray: 100; stroke-dashoffset: 100; animation: trace 8s linear infinite 2s; }
          
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
          @keyframes trace { 100% { stroke-dashoffset: 0; } }
          @keyframes float { 
            0%, 100% { transform: translateY(0px); filter: drop-shadow(0px 3px 3px rgba(2, 132, 199, 0.4)); } 
            50% { transform: translateY(-3px); filter: drop-shadow(0px 8px 6px rgba(2, 132, 199, 0.6)); } 
          }
        `}
      </style>

      <defs>
        {/* Ambient Glow */}
        <filter id="point-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#0284c7" floodOpacity="0.4" />
        </filter>
        
        {/* Deep 3D Base Gradients */}
        <linearGradient id="base-gradient" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#082f49" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>

        <linearGradient id="inner-depth" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0c4a6e" />
          <stop offset="0.5" stopColor="#0284c7" />
          <stop offset="1" stopColor="#e0f2fe" />
        </linearGradient>

        {/* Text Gradient */}
        <linearGradient id="text-gradient" x1="30" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#bae6fd" />
        </linearGradient>

        {/* Top Gloss Sheen */}
        <linearGradient id="sheen-gradient" x1="60" y1="10" x2="60" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 1. Deep Base Token */}
      <circle cx="60" cy="60" r="54" fill="url(#base-gradient)" filter="url(#point-glow)" />

      {/* 2. Rotating Tech Outer Ring */}
      <circle 
        cx="60" cy="60" r="50" 
        fill="none" 
        stroke="#7dd3fc" 
        strokeWidth="1.5" 
        strokeDasharray="4 8 20 8" 
        className="spin-clockwise" 
        opacity="0.8" 
      />
      <circle 
        cx="60" cy="60" r="48" 
        fill="none" 
        stroke="#38bdf8" 
        strokeWidth="0.75" 
        strokeDasharray="40 10 10 10" 
        className="spin-counter" 
        opacity="0.5" 
      />

      {/* 3. Inner Depth Background */}
      <circle cx="60" cy="60" r="45" fill="url(#inner-depth)" />

      {/* 4. Topography Lines (Organic Map Contours) */}
      <g opacity="0.6">
        {/* Outer Contour */}
        <path 
          d="M 25 60 C 25 35 40 20 60 25 C 80 30 95 45 90 65 C 85 85 70 95 50 90 C 30 85 25 80 25 60 Z" 
          fill="none" 
          stroke="#7dd3fc" 
          strokeWidth="1" 
          className="trace-line" 
        />
        {/* Middle Contour */}
        <path 
          d="M 35 60 C 35 45 48 35 60 38 C 72 41 82 50 80 62 C 78 74 68 82 55 78 C 42 74 35 70 35 60 Z" 
          fill="none" 
          stroke="#e0f2fe" 
          strokeWidth="0.75" 
          className="trace-line-delayed" 
          opacity="0.8" 
        />
        {/* Inner Contour */}
        <path 
          d="M 45 60 C 45 52 52 46 60 48 C 66 49 72 54 71 60 C 70 66 65 72 58 70 C 50 68 45 65 45 60 Z" 
          fill="none" 
          stroke="#ffffff" 
          strokeWidth="0.5" 
          className="trace-line" 
          opacity="0.6"
        />
      </g>

      {/* 5. Floating & Perfectly Centered "C" */}
      <g className="float">
        <text 
          x="60.5" 
          y="62" 
          fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          fontStyle="normal" 
          fontWeight="900" 
          fontSize="56" 
          fill="url(#text-gradient)" 
          textAnchor="middle" 
          dominantBaseline="central"
        >
          C
        </text>
      </g>

      {/* 6. Pulsing Energy Stars */}
      <g className="pulse" style={{ transformOrigin: '82px 36px' }}>
        <path d="M 82 29 L 83.5 35 L 89 36 L 83.5 37 L 82 43 L 80.5 37 L 75 36 L 80.5 35 Z" fill="#ffffff" />
      </g>
      <g className="pulse" style={{ transformOrigin: '32px 76px', animationDelay: '1s' }}>
        <path d="M 32 72 L 32.7 75 L 36 76 L 32.7 77 L 32 80 L 31.3 77 L 28 76 L 31.3 75 Z" fill="#7dd3fc" />
      </g>

      {/* 7. 3D Glassmorphism Dome Highlight */}
      <path 
        d="M 15 60 A 45 45 0 0 1 105 60 A 45 28 0 0 0 15 60 Z" 
        fill="url(#sheen-gradient)" 
      />
    </svg>
  );
}