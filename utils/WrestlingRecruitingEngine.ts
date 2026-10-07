export interface WrestlingMetrics {
  seasonWins: number | null;
  seasonLosses: number | null;
}

export interface AnalyticalTraceItem {
  metricLabel: string;
  perMatchRate: number | null;
  calibratedScore: number;
}

export interface WrestlingFitResult {
  compositeScore: number;
  analyticalTrace: AnalyticalTraceItem[];
}

export function compileWrestlingFitScore(
  genderKey: string,
  level: string, // Kept in signature to prevent breaks, but ignored in math
  matches: number,
  inputObject: WrestlingMetrics
): WrestlingFitResult {
  const trace: AnalyticalTraceItem[] = [];
  
  const wins = inputObject.seasonWins || 0;
  const losses = inputObject.seasonLosses || 0;
  const totalMatches = wins + losses;
  
  let finalComposite = 0; // Default to 0 (Need Data) if no matches entered
  let winRate = 0;

  if (totalMatches > 0) {
    winRate = wins / totalMatches;
    
    // Pure scaling: 0% = 1, 50% = 50, 100% = 99
    finalComposite = Math.round(1 + (winRate * 98));
    
    trace.push({
      metricLabel: `Win Rate Impact (${(winRate * 100).toFixed(1)}%)`,
      perMatchRate: winRate,
      calibratedScore: finalComposite
    });
  }

  // Safety clamps
  if (finalComposite > 99) finalComposite = 99;
  if (finalComposite > 0 && finalComposite < 1) finalComposite = 1;

  return {
    compositeScore: finalComposite,
    analyticalTrace: trace
  };
}