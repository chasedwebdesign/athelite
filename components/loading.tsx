'use client';

import React from 'react';
import Navbar from '@/components/Navbar';

export default function Loading({ isComplete = false }: { isComplete?: boolean }) {
  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center w-screen h-screen overflow-hidden transition-colors duration-1000 ${isComplete ? 'bg-emerald-50/70' : 'bg-sky-50'}`}>
      
      {/* --- Restored Navbar --- */}
      <div className="absolute top-0 left-0 w-full z-[10000]">
        <Navbar />
      </div>

      {/* --- Dynamic Ambient Background Blobs (Made Subtle) --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob transition-colors duration-1000 ${isComplete ? 'bg-emerald-200' : 'bg-sky-200'}`}></div>
        <div className={`absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob animation-delay-2000 transition-colors duration-1000 ${isComplete ? 'bg-teal-100' : 'bg-blue-100'}`}></div>
        <div className={`absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-blob animation-delay-4000 transition-colors duration-1000 ${isComplete ? 'bg-green-100' : 'bg-cyan-100'}`}></div>
      </div>

      {/* Embedded Animations */}
      <style>
        {`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .spin-slow {
            animation: spin 3s linear infinite;
          }
          .spin-reverse-fast {
            animation: spin 1.5s linear infinite reverse;
          }
          .pulse-glow {
            animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
            50% { opacity: .8; transform: scale(1.5); box-shadow: 0 0 20px 10px rgba(14, 165, 233, 0); }
          }
          @keyframes dash {
            0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
            50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
            100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
          }
          .loader-ring {
            animation: dash 1.5s ease-in-out infinite, spin 2s linear infinite;
          }
        `}
      </style>

      {/* --- Foreground Glassmorphism Card --- */}
      <div className="z-10 flex flex-col items-center justify-center bg-white/50 backdrop-blur-2xl rounded-[3rem] p-12 shadow-[0_8px_32px_0_rgba(14,165,233,0.10)] border border-white/70 w-[90%] max-w-sm relative overflow-hidden transition-all duration-700 mt-16">
        
        {/* Subtle Inner Top Glow */}
        <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-1000 ${isComplete ? 'bg-gradient-to-r from-emerald-300/0 via-emerald-300 to-emerald-300/0' : 'bg-gradient-to-r from-sky-300/0 via-sky-300 to-sky-300/0'}`}></div>

        {/* Super Cool Custom Loader Graphic */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-8">
          {/* Outer Track Ring */}
          <div className={`absolute inset-0 rounded-full border-4 border-dashed opacity-20 spin-slow ${isComplete ? 'border-emerald-400' : 'border-sky-400'}`}></div>
          
          {/* Inner Accent Ring */}
          <div className={`absolute inset-3 rounded-full border-4 border-transparent border-b-current border-l-current opacity-50 spin-reverse-fast ${isComplete ? 'text-emerald-400' : 'text-blue-400'}`}></div>

          {/* SVG Animated Dash Ring */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${isComplete ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}>
             <svg className="w-full h-full text-sky-400 loader-ring" viewBox="0 0 50 50">
               <circle cx="25" cy="25" r="20" fill="none" strokeWidth="3" stroke="currentColor" strokeLinecap="round"></circle>
             </svg>
          </div>

          {/* Center Element */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isComplete ? (
              <svg className="w-12 h-12 text-emerald-500 animate-[bounce_1s_ease-in-out_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="w-4 h-4 bg-sky-400 rounded-full pulse-glow"></div>
            )}
          </div>
        </div>

        {/* --- Loading Text with Roller Animation --- */}
        <div className="flex flex-col items-center text-center">
          <h3 className={`text-2xl font-black tracking-[0.25em] uppercase transition-colors duration-700 ${isComplete ? 'text-emerald-600' : 'text-slate-700'}`}>
            {isComplete ? "Done" : "Loading"}
          </h3>
          
          <div className="h-5 mt-3 overflow-hidden relative w-full">
             <div className={`flex flex-col items-center transition-transform duration-700 ${isComplete ? '-translate-y-5' : 'translate-y-0'}`}>
                <p className="h-5 text-xs font-bold text-sky-600/70 tracking-widest uppercase animate-pulse">
                  Preparing the field...
                </p>
                <p className="h-5 text-xs font-bold text-emerald-600/80 tracking-widest uppercase">
                  Taking you to dashboard...
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}