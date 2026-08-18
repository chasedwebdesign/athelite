'use client';

import React, { useState } from 'react';
import { Lock, RefreshCcw, AlertTriangle, Unlock } from 'lucide-react';
import { Points } from '@/components/Points';

interface PointUnlockOverlayProps {
  cost: number;
  balance: number;
  isUnlocking: boolean;
  onUnlock: () => void;
  title?: string;
}

export default function PointUnlockOverlay({ 
  cost, 
  balance, 
  isUnlocking, 
  onUnlock,
  title = "Unlock Premium" 
}: PointUnlockOverlayProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const canAfford = balance >= cost;

  return (
    // Solid dark background to block out the parent's color entirely
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0e17] p-4 transition-all rounded-[1.25rem] overflow-hidden border border-slate-800/80 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
      
      {/* Cool Ambient Glow Effects for a premium aesthetic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[80%] h-[80%] bg-blue-600/15 blur-[80px] rounded-full"></div>
        <div className="absolute -bottom-[30%] -right-[10%] w-[80%] h-[80%] bg-amber-500/10 blur-[80px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full flex justify-center">
        {!showConfirm ? (
          // Primary Gamified Unlock Button
          <button 
            onClick={() => setShowConfirm(true)}
            className="bg-[#161b26] border border-slate-700/80 hover:border-amber-500/50 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center gap-5 transition-all duration-300 group hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] cursor-pointer w-full max-w-[340px] relative overflow-hidden"
          >
            {/* Subtle animated background glow on hover */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="flex items-center gap-3 text-lg font-black text-white tracking-wide mt-1 relative z-10">
              <Lock className="w-5 h-5 text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] group-hover:animate-pulse" strokeWidth={2.5} />
              {title}
            </div>
            
            {/* Evenly distributed pill container for Cost & Balance */}
            <div className="bg-[#0b0f19] rounded-2xl p-2 flex items-center justify-between border border-slate-800 shadow-inner w-full relative">
                
               {/* Left: Cost Section */}
               <div className="flex-1 flex flex-col items-start pl-3">
                 <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-0.5">Cost</span>
                 <span className={`text-[17px] font-black tracking-tight leading-none ${canAfford ? 'text-white' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}>
                   {cost.toLocaleString()}
                 </span>
               </div>

               {/* Center: Glowing Blue Coin wrapped in a fixed circle to guarantee perfect centering */}
               <div className="shrink-0 w-12 h-12 flex items-center justify-center bg-[#161b26] rounded-full border border-slate-700/60 shadow-[0_0_15px_rgba(0,0,0,0.6)] relative z-10 -mx-2">
                 {/* Behind-coin glow */}
                 <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md"></div>
                 <Points className="w-9 h-9 relative z-10 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
               </div>

               {/* Right: Balance Section */}
               <div className="flex-1 flex flex-col items-end pr-3">
                 <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-0.5">Balance</span>
                 <span className="text-blue-400 text-[17px] font-black tracking-tight leading-none">
                   {balance.toLocaleString()}
                 </span>
               </div>
               
            </div>
          </button>
        ) : (
          // Inline Confirmation UI
          <div className="bg-[#161b26] border border-slate-700/80 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95)] flex flex-col items-center gap-5 w-full max-w-[340px] animate-in zoom-in-95 fade-in duration-200 relative overflow-hidden">
              
             <div className="flex flex-col items-center gap-3 text-center relative z-10">
               <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mb-1 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)] relative">
                 <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-20"></div>
                 <AlertTriangle className="w-7 h-7 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] relative z-10" />
               </div>
               <h3 className="text-white font-black text-xl tracking-tight">Are you sure?</h3>
               <p className="text-slate-400 text-[13px] font-bold leading-relaxed px-2">
                 This will permanently deduct <span className="text-white font-black">{cost.toLocaleString()}</span> points from your wallet.
               </p>
             </div>
             
             <div className="flex items-center gap-3 w-full mt-2 relative z-10">
               <button 
                 onClick={() => setShowConfirm(false)}
                 disabled={isUnlocking}
                 className="flex-1 bg-[#0b0f19] hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
               >
                 Cancel
               </button>
               <button 
                 onClick={onUnlock}
                 disabled={isUnlocking || !canAfford}
                 className={`flex-1 text-[11px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] ${
                   canAfford 
                    ? 'bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.35)] border border-amber-400/50' 
                    : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700'
                 }`}
               >
                 {isUnlocking ? (
                   <RefreshCcw className="w-4 h-4 animate-spin text-slate-950" />
                 ) : !canAfford ? (
                   'Not Enough'
                 ) : (
                   <>
                     <Unlock className="w-3.5 h-3.5" /> Confirm
                   </>
                 )}
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}