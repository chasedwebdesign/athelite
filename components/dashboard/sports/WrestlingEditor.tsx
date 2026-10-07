'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Swords, Info, RefreshCw, Save } from 'lucide-react';
import { compileWrestlingFitScore } from '@/utils/WrestlingRecruitingEngine';

export interface WrestlingEditorProps {
  wrestlingStats: any;
  genderKey: string;
  onSync: (updatedData: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function WrestlingEditor({ wrestlingStats, genderKey, onSync, showToast }: WrestlingEditorProps) {
  const [isSaving, setIsSaving] = useState(false);

  const savedPayload = wrestlingStats.metaContext?.rawTotals || {};
  const [seasonWins, setSeasonWins] = useState<string>(savedPayload.seasonWins?.toString() || '');
  const [seasonLosses, setSeasonLosses] = useState<string>(savedPayload.seasonLosses?.toString() || '');

  useEffect(() => {
    if (!wrestlingStats.metaContext?.rawTotals) {
      setSeasonWins('');
      setSeasonLosses('');
    }
  }, [wrestlingStats.metaContext?.rawTotals]);

  const computedMatches = useMemo(() => {
    const wins = parseInt(seasonWins) || 0;
    const losses = parseInt(seasonLosses) || 0;
    return wins + losses; 
  }, [seasonWins, seasonLosses]);

  const computedInputObject = useMemo(() => {
    return {
      seasonWins: seasonWins === '' ? null : parseInt(seasonWins),
      seasonLosses: seasonLosses === '' ? null : parseInt(seasonLosses),
    };
  }, [seasonWins, seasonLosses]);

  const { compositeScore, analyticalTrace } = compileWrestlingFitScore(
    genderKey,
    'Varsity', // Pass generic string to satisfy the standard engine signature
    computedMatches,
    computedInputObject
  );

  const handleManualSave = async () => {
    setIsSaving(true);
    
    const mockMetricsArray = analyticalTrace.map((t: any) => ({
      name: t.metricLabel,
      value: t.perMatchRate?.toFixed(2) || '0'
    }));

    await onSync({
      level: 'Varsity', 
      metrics: mockMetricsArray,
      calculatedRating: compositeScore,
      metaContext: {
        matchesPlayed: computedMatches,
        rawTotals: { seasonWins, seasonLosses }
      }
    });

    showToast("Wrestling record synced successfully!", "success");
    setIsSaving(false);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden w-full animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
              <Swords className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black tracking-tight">Wrestling Dominance</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Your recruiting score is driven entirely by your <strong className="text-rose-400">Win Rate</strong>.
          </p>
        </div>

        {compositeScore > 0 && (
          <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-inner w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-left">
              <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500">Record Modifier</span>
              <span className="text-xs font-black bg-gradient-to-r from-rose-400 to-red-400 bg-clip-text text-transparent">
                System Active
              </span>
            </div>
            <div className={`text-2xl font-black px-3 py-1 rounded-xl shadow-lg shrink-0 ${compositeScore >= 50 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20 text-white' : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/20 text-white'}`}>
              {compositeScore}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-6 relative z-10">
        {/* WINS INPUT */}
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-emerald-500/20 shadow-inner">
          <label className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-emerald-400 mb-3 block text-center">
            Total Wins
          </label>
          <input 
            type="number" 
            placeholder="0" 
            value={seasonWins} 
            onChange={e => setSeasonWins(e.target.value)} 
            className="w-full bg-slate-950/80 border border-emerald-500/30 rounded-xl px-4 py-4 text-3xl font-black outline-none text-emerald-300 placeholder-emerald-900/50 shadow-inner focus:border-emerald-400 transition-colors text-center"
          />
        </div>

        {/* LOSSES INPUT */}
        <div className="bg-slate-900/50 p-4 rounded-2xl border border-rose-500/20 shadow-inner">
          <label className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-rose-400 mb-3 block text-center">
            Total Losses
          </label>
          <input 
            type="number" 
            placeholder="0" 
            value={seasonLosses} 
            onChange={e => setSeasonLosses(e.target.value)} 
            className="w-full bg-slate-950/80 border border-rose-500/30 rounded-xl px-4 py-4 text-3xl font-black outline-none text-rose-300 placeholder-rose-900/50 shadow-inner focus:border-rose-400 transition-colors text-center"
          />
        </div>
      </div>

      <div className="pt-6 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-slate-800/80 mt-6">
        <div className="w-full md:w-2/3">
          {analyticalTrace && analyticalTrace.length > 0 && (
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Normalization Engine
              </h4>
              <div className="flex flex-wrap gap-2">
                {analyticalTrace.map((block: any, idx: number) => (
                  <div key={idx} className="bg-slate-950/90 border border-slate-900 p-2.5 rounded-xl flex flex-col text-[11px] flex-1 min-w-[120px]">
                    <span className="font-black text-slate-300 truncate">{block.metricLabel}</span>
                    <span className="text-[10px] font-bold text-rose-400 mt-0.5">
                      Yield: {block.calibratedScore}
                    </span>
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
            className="w-full md:w-auto h-14 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            {isSaving ? 'Syncing...' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  );
}