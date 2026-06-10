'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Activity, HelpCircle, Info, RefreshCw, Save } from 'lucide-react';
import { compileBasketballFitScore, BasketballPositionGroup } from '@/utils/BasketballRecruitingEngine';

export interface BasketballEditorProps {
  basketballStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function BasketballEditor({ basketballStats, genderKey, onSync, showToast }: BasketballEditorProps) {
  const currentPos = (basketballStats.position || 'Point Guard (PG)') as BasketballPositionGroup;
  
  const [posGroup, setPosGroup] = useState<BasketballPositionGroup>(['Point Guard (PG)','Shooting Guard (SG)','Small Forward (SF)','Power Forward (PF)','Center (C)'].includes(currentPos) ? currentPos : 'Point Guard (PG)');
  const [level, setLevel] = useState(basketballStats.level || 'Varsity Starter');
  const [games, setGames] = useState<number>(basketballStats.metaContext?.gamesPlayed || 20);
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = basketballStats.metaContext?.rawTotals || {};
  const [pts, setPts] = useState<string>(savedPayload.points?.toString() || '');
  const [reb, setReb] = useState<string>(savedPayload.rebounds?.toString() || '');
  const [ast, setAst] = useState<string>(savedPayload.assists?.toString() || '');
  const [fgPct, setFgPct] = useState<string>(savedPayload.fgPct?.toString() || '');
  const [threePtPct, setThreePtPct] = useState<string>(savedPayload.threePtPct?.toString() || '');

  useEffect(() => {
    if (!basketballStats.metaContext?.rawTotals) {
      setPts(''); setReb(''); setAst(''); setFgPct(''); setThreePtPct('');
    }
  }, [posGroup, basketballStats.metaContext?.rawTotals]);

  const computedInputObject = useMemo(() => {
    const result: Record<string, number | null> = {
      points: pts === '' ? null : parseFloat(pts),
      rebounds: reb === '' ? null : parseFloat(reb),
      assists: ast === '' ? null : parseFloat(ast),
      fgPct: fgPct === '' ? null : parseFloat(fgPct),
      threePtPct: threePtPct === '' ? null : parseFloat(threePtPct),
    };
    return result;
  }, [pts, reb, ast, fgPct, threePtPct]);

  const { compositeScore, analyticalTrace } = compileBasketballFitScore(
    genderKey,
    posGroup,
    level,
    games,
    computedInputObject
  );

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const mockMetricsArray = analyticalTrace.map(t => ({
      name: t.metricLabel,
      value: t.perGameRate.toFixed(1)
    }));

    await onSync({
      position: posGroup,
      level: level,
      metrics: mockMetricsArray,
      calculatedRating: compositeScore,
      metaContext: {
        gamesPlayed: games,
        rawTotals: { points: pts, rebounds: reb, assists: ast, fgPct, threePtPct }
      }
    });

    showToast("Basketball metrics synced securely!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500">
              <Activity className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Basketball Contextual Normalizer</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Engine evaluates <strong className="text-amber-500">Volume Metrics</strong> (Pts, Reb, Ast) relative to games played.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Scout Power Target</span>
              <span className="text-xs font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Dynamic Matrix Verified
              </span>
            </div>
            <div className="text-2xl font-black px-3 py-1 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-lg shrink-0 shadow-amber-500/10">
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Positional Assignment</label>
          <select value={posGroup} onChange={e => setPosGroup(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="Point Guard (PG)">Point Guard (PG)</option>
            <option value="Shooting Guard (SG)">Shooting Guard (SG)</option>
            <option value="Small Forward (SF)">Small Forward (SF)</option>
            <option value="Power Forward (PF)">Power Forward (PF)</option>
            <option value="Center (C)">Center (C)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Club / Academy Tiers</label>
          <select value={level} onChange={e => setLevel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-slate-200 cursor-pointer">
            <option value="JV / Dev Squad">JV / Dev Squad</option>
            <option value="Varsity Contributor">Varsity High School</option>
            <option value="Varsity Starter">Varsity Core Starter</option>
            <option value="All-Conference Tier">All-Conference / Regional</option>
            <option value="Elite Club (ECNL / AAU / Next)">Elite Club (EYBL / Under Armour)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Games Played (Exposure)</label>
          <div className="relative">
            {/* Changed to type="text" with inputMode="numeric" */}
            <input type="text" inputMode="numeric" value={games} onChange={e => setGames(Math.max(1, parseInt(e.target.value) || 0))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white shadow-inner" />
            <Activity className="w-4 h-4 text-slate-600 absolute right-4 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-4 relative z-10">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Total Points
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-amber-500 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Total points scored across all games.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          {/* Changed to type="text" with inputMode="decimal" */}
          <input type="text" inputMode="decimal" placeholder="(Optional)" value={pts} onChange={e => setPts(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-amber-500/50 transition-colors" />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Total Rebounds
          </label>
          {/* Changed to type="text" with inputMode="decimal" */}
          <input type="text" inputMode="decimal" placeholder="(Optional)" value={reb} onChange={e => setReb(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-amber-500/50 transition-colors" />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Total Assists
          </label>
          {/* Changed to type="text" with inputMode="decimal" */}
          <input type="text" inputMode="decimal" placeholder="(Optional)" value={ast} onChange={e => setAst(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-amber-500/50 transition-colors" />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            Overall FG %
            <div className="relative group inline-block">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-amber-500 cursor-help transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-slate-200 text-xs p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-slate-700 normal-case tracking-normal">
                Field Goal Percentage (e.g., 45.2). Do not divide by games.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </div>
          </label>
          {/* Changed to type="text" with inputMode="decimal" */}
          <input type="text" inputMode="decimal" placeholder="(Optional)" value={fgPct} onChange={e => setFgPct(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-amber-500/50 transition-colors" />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
            3-Point %
          </label>
          {/* Changed to type="text" with inputMode="decimal" */}
          <input type="text" inputMode="decimal" placeholder="(Optional)" value={threePtPct} onChange={e => setThreePtPct(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none text-white placeholder-slate-700 shadow-inner focus:border-amber-500/50 transition-colors" />
        </div>
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
                    <span className="text-slate-400 font-medium mt-1">Value: <strong className="text-white">{block.perGameRate.toFixed(1)}</strong></span>
                    <span className="text-[10px] font-bold text-amber-500 mt-0.5">Yield Index: {block.calibratedScore}/99</span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save Metrics'}
          </button>
        </div>
      </div>
    </div>
  );
}