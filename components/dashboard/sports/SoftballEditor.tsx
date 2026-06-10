'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Target, Activity, HelpCircle, Info, RefreshCw, Save } from 'lucide-react';
import { compileSoftballFitScore, SoftballPositionGroup } from '@/utils/SoftballRecruitingEngine';

export interface SoftballEditorProps {
  softballStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function SoftballEditor({ softballStats, genderKey, onSync, showToast }: SoftballEditorProps) {
  const currentPos = (softballStats.position || 'Outfield') as SoftballPositionGroup;
  
  const [posGroup, setPosGroup] = useState<SoftballPositionGroup>(
    ['Pitcher', 'Catcher', 'First Base', 'Infield', 'Outfield'].includes(currentPos) 
      ? currentPos 
      : 'Outfield'
  );
  
  const [level, setLevel] = useState(softballStats.level || 'Varsity Starter');
  const [games, setGames] = useState<number>(softballStats.metaContext?.gamesPlayed || 25);
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = softballStats.metaContext?.rawTotals || {};
  
  // Hitting Stats
  const [ba, setBa] = useState<string>(savedPayload.ba?.toString() || '');
  const [ops, setOps] = useState<string>(savedPayload.ops?.toString() || '');
  const [hr, setHr] = useState<string>(savedPayload.hr?.toString() || '');
  const [rbi, setRbi] = useState<string>(savedPayload.rbi?.toString() || '');
  const [sb, setSb] = useState<string>(savedPayload.sb?.toString() || '');

  // Pitching Stats
  const [velocity, setVelocity] = useState<string>(savedPayload.velocity?.toString() || '');
  const [era, setEra] = useState<string>(savedPayload.era?.toString() || '');

  useEffect(() => {
    if (!softballStats.metaContext?.rawTotals) {
      setBa(''); setOps(''); setHr(''); setRbi(''); setSb('');
      setVelocity(''); setEra('');
    }
  }, [posGroup, softballStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const result: Record<string, number | null> = {};
    if (posGroup === 'Pitcher') {
      result.velocity = velocity === '' ? null : parseFloat(velocity);
      result.era = era === '' ? null : parseFloat(era);
    } else {
      result.ba = ba === '' ? null : parseFloat(ba);
      result.ops = ops === '' ? null : parseFloat(ops);
      result.hr = hr === '' ? null : parseFloat(hr);
      result.rbi = rbi === '' ? null : parseFloat(rbi);
      result.sb = sb === '' ? null : parseFloat(sb);
    }
    return result;
  }, [posGroup, ba, ops, hr, rbi, sb, velocity, era]);

  const { compositeScore, analyticalTrace } = compileSoftballFitScore(
    genderKey,
    posGroup,
    level,
    games,
    computedInputObject as any
  );

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const mockMetricsArray = analyticalTrace.map(t => ({
      name: t.metricLabel,
      value: t.perGameRate.toFixed(3)
    }));

    await onSync({
      position: posGroup,
      level: level,
      metrics: mockMetricsArray,
      calculatedRating: compositeScore,
      metaContext: {
        gamesPlayed: games,
        rawTotals: posGroup === 'Pitcher' 
          ? { velocity, era } 
          : { ba, ops, hr, rbi, sb }
      }
    });

    showToast("Softball metrics verified and secured!", "success");
    setIsSaving(false);
  };

  const isPitcher = posGroup === 'Pitcher';

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-pink-500/10 rounded-xl border border-pink-500/20 text-pink-500">
              <Target className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Softball Contextual Normalizer</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Engine evaluates <strong className="text-pink-500">Averages & Volume Rates</strong> relative to games played.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Scout Power Target</span>
              <span className="text-xs font-black bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                Dynamic Matrix Verified
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-xl shadow-lg shrink-0 shadow-pink-500/10">
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Positional Assignment</label>
          <select value={posGroup} onChange={e => setPosGroup(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="Pitcher">Pitcher</option>
            <option value="Catcher">Catcher</option>
            <option value="First Base">First Base</option>
            <option value="Infield">Infield</option>
            <option value="Outfield">Outfield</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Club / Academy Tiers</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="JV / Dev Squad">JV / Dev Squad</option>
            <option value="Varsity Contributor">Varsity Contributor</option>
            <option value="Varsity Starter">Varsity Core Starter</option>
            <option value="All-Conference Tier">All-Conference / Regional</option>
            <option value="All-State / National">All-State / National</option>
            <option value="Elite Club (Alliance / PGF)">Elite Club (Alliance / PGF)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Games Played (Exposure)</label>
          <div className="relative">
            <input type="text" inputMode="numeric" value={games} onChange={e => setGames(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            <Activity className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-4 relative z-10">
        
        {isPitcher ? (
          <>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Fastball Velocity (MPH)
                <div className="relative group inline-block">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-pink-500 cursor-help transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                    Peak verified fastball velocity.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              </label>
              <input type="text" inputMode="decimal" placeholder="(e.g. 62)" value={velocity} onChange={e => setVelocity(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-pink-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Earned Run Avg (ERA)
              </label>
              <input type="text" inputMode="decimal" placeholder="(e.g. 2.10)" value={era} onChange={e => setEra(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-pink-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Batting Avg (BA)
                <div className="relative group inline-block">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-pink-500 cursor-help transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                    Enter as decimal (e.g. 0.410)
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              </label>
              <input type="text" inputMode="decimal" placeholder="(e.g. 0.400)" value={ba} onChange={e => setBa(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-pink-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Total OPS
              </label>
              <input type="text" inputMode="decimal" placeholder="(e.g. 1.150)" value={ops} onChange={e => setOps(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-pink-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Total HRs
              </label>
              <input type="text" inputMode="decimal" placeholder="(Optional)" value={hr} onChange={e => setHr(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-pink-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Total RBI
              </label>
              <input type="text" inputMode="decimal" placeholder="(Optional)" value={rbi} onChange={e => setRbi(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-pink-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                Stolen Bases
              </label>
              <input type="text" inputMode="decimal" placeholder="(Optional)" value={sb} onChange={e => setSb(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-pink-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
            </div>
          </>
        )}
      </div>

      <div className="pt-6 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-800/80 mt-6">
        <div className="w-full md:w-2/3">
          {analyticalTrace.length > 0 && (
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Normalization Telemetry
              </h4>
              <div className="flex flex-wrap gap-2">
                {analyticalTrace.map((block, idx) => (
                  <div key={idx} className="bg-slate-950/90 border border-slate-900 p-2.5 rounded-xl flex flex-col text-[11px] flex-1 min-w-[120px]">
                    <span className="font-black text-slate-300 truncate">{block.metricLabel}</span>
                    <span className="text-slate-400 font-medium mt-1">Value: <strong className="text-white">{block.perGameRate.toFixed(3)}</strong></span>
                    <span className="text-[10px] font-bold text-pink-500 mt-0.5">Yield Index: {block.calibratedScore}/99</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-auto self-stretch flex items-end">
          <button 
            onClick={handleManualSave}
            disabled={isSaving}
            className="w-full md:w-auto h-14 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}