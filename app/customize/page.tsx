'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Paintbrush, Crown, Zap, Save, CheckCircle2, AlertCircle, ShieldCheck, Trophy, Lock, ChevronRight, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

interface AthleteProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  equipped_border: string | null;
  equipped_title: string | null;
  equipped_card: string | null;
  is_premium: boolean;
  trust_level: number;
}

const EARNED_TITLES = [
  { id: 'legend', name: 'Legend', reqPercentile: 0.01, badgeClass: 'legend-badge', unlockText: 'Reach Top 1%' },
  { id: 'champion', name: 'Champion', reqPercentile: 0.05, badgeClass: 'champion-badge', unlockText: 'Reach Top 5%' },
  { id: 'elite', name: 'Elite', reqPercentile: 0.15, badgeClass: 'elite-badge', unlockText: 'Reach Top 15%' },
  { id: 'master', name: 'Master', reqPercentile: 0.30, badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300', unlockText: 'Reach Top 30%' },
  { id: 'contender', name: 'Contender', reqPercentile: 0.50, badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300', unlockText: 'Reach Top 50%' },
  { id: 'challenger', name: 'Challenger', reqPercentile: 0.75, badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300', unlockText: 'Reach Top 75%' },
  { id: 'prospect', name: 'Prospect', reqPercentile: 1.0, badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300', unlockText: 'Standard Rank' },
];

const CARD_STYLES = [
  { id: 'base', name: 'Standard Slate', price: 0, desc: 'The clean, minimal starting layout.', isPremium: false, gradient: 'bg-slate-800 border-slate-700' },
  { id: 'obsidian', name: 'Obsidian Stealth', price: 1000, desc: 'Deep, dark, matte black metallic finish.', isPremium: false, gradient: 'from-slate-900 via-slate-800 to-black' },
  { id: 'crimson', name: 'Crimson Flare', price: 1500, desc: 'A burning red metallic sheen.', isPremium: false, gradient: 'from-red-950 via-red-600 to-red-900' },
  { id: 'sapphire', name: 'Sapphire Ocean', price: 1500, desc: 'Deep aquatic blue metallic finish.', isPremium: false, gradient: 'from-blue-950 via-sky-500 to-blue-900' },
  { id: 'hype', name: 'Holo Classic', price: 2500, desc: 'The legendary iridescent foil.', isPremium: false, gradient: 'from-fuchsia-600 via-blue-600 to-cyan-500' },
  { id: 'amethyst', name: 'Amethyst Void', price: 3000, desc: 'Rich, vibrating purple energy.', isPremium: false, gradient: 'from-purple-950 via-fuchsia-500 to-purple-900' },
  { id: 'cyber', name: 'Neon Cyber', price: 4500, desc: 'High-voltage toxic green and cyan.', isPremium: false, gradient: 'from-emerald-950 via-emerald-400 to-cyan-500' },
  { id: 'premium', name: 'Chased Gold', price: 0, desc: 'Exclusive 24k gold foil. Pro Members only.', isPremium: true, gradient: 'from-yellow-500 via-amber-500 to-orange-500' },
];

const BORDER_STYLES = [
  { id: 'none', name: 'Standard Profile', price: 0, desc: 'The classic, clean athlete look.' },
  { id: 'pioneer', name: 'The Pioneer', price: 0, desc: 'Exclusive Early Adopter HUD Scanner.' },
  { id: 'border-blue-500', name: 'Sapphire Strike', price: 50, desc: 'A sharp, focused blue energy rim.' },
  { id: 'border-red-500', name: 'Crimson Phantom', price: 100, desc: 'Intimidating red aura.' },
  { id: 'border-emerald-400', name: 'Neon Pulse', price: 150, desc: 'Bright, energetic green boundary.' },
  { id: 'animated-silver', name: 'Silver Crest', price: 400, desc: 'Shimmering metallic finish for medalists.' },
  { id: 'toxic-slime', name: 'Toxic Slime', price: 450, desc: 'Bubbling, radioactive green ooze.' },
  { id: 'glacial-frost', name: 'Glacial Frost', price: 500, desc: 'Shattered ice with a freezing aura.' },
  { id: 'animated-gold', name: 'Gold Crest', price: 600, desc: 'Pure animated gold. For the champions.' },
  { id: 'animated-diamond', name: 'Diamond Crest', price: 1000, desc: 'Flawless, icy perfection. Highly respected.' },
  { id: 'cyber-matrix', name: 'Cyber Matrix', price: 1100, desc: 'Digital rain scanner. Enter the system.' },
  { id: 'synthwave', name: 'Synthwave Vapor', price: 1200, desc: 'Retro neon pink and cyan aesthetics.' },
  { id: 'neon-glitch', name: 'Neon Glitch', price: 1250, desc: 'Unstable cyberpunk aesthetic.' },
  { id: 'ethereal-cosmos', name: 'Ethereal Cosmos', price: 1500, desc: 'Harness the energy of a dying star.' },
  { id: 'molten-core', name: 'Molten Core', price: 1800, desc: 'Cracked earth leaking pulsating magma.' },
  { id: 'fire', name: 'Inferno', price: 2000, desc: 'Blazing with pure, uncontainable heat.' },
  { id: 'abyssal-void', name: 'Abyssal Void', price: 4000, desc: 'A singularity that consumes light and competition.' },
  { id: 'celestial-radiance', name: 'Celestial Radiance', price: 5000, desc: 'Biblically accurate speed. The ultimate flex.' },
];

export default function CustomizePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const [stagedCard, setStagedCard] = useState('base');
  const [stagedBorder, setStagedBorder] = useState('none');
  const [stagedTitle, setStagedTitle] = useState('prospect');
  
  const [unlockedCards, setUnlockedCards] = useState<string[]>(['base']);
  const [unlockedBorders, setUnlockedBorders] = useState<string[]>(['none']);
  
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [highestPercentile, setHighestPercentile] = useState<number>(1.0);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data, error } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, avatar_url, equipped_border, equipped_title, equipped_card, unlocked_borders, unlocked_cards, is_premium, trust_level, prs')
        .eq('id', session.user.id)
        .single();

      if (error) {
        showToast('Failed to load customization data.');
      } else if (data) {
        setProfile(data);
        
        let dbCard = data.equipped_card || 'base';
        if (dbCard === 'default') dbCard = 'base'; 
        
        setStagedCard(dbCard);
        setStagedBorder(data.equipped_border || 'none');
        setStagedTitle(data.equipped_title || 'prospect');
        
        let dbUnlockedCards = data.unlocked_cards || ['base'];
        if (dbUnlockedCards.includes('default')) dbUnlockedCards = dbUnlockedCards.map((c: string) => c === 'default' ? 'base' : c);
        setUnlockedCards(dbUnlockedCards);
        
        setUnlockedBorders(data.unlocked_borders || ['none']);

        // Temporarily default to 0.01 for demo, or connect to actual rank calculation
        if (data.prs && data.prs.length > 0) {
          setHighestPercentile(0.01); 
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase, router]);

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from('athletes').update({
        equipped_card: stagedCard,
        equipped_border: stagedBorder,
        equipped_title: stagedTitle
      }).eq('id', profile.id);

      if (error) throw error;
      
      setProfile({ 
        ...profile, 
        equipped_card: stagedCard, 
        equipped_border: stagedBorder,
        equipped_title: stagedTitle
      });
      showToast("Locker Room updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06090F] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Entering Locker Room</p>
      </div>
    );
  }

  const getCardStyles = (cardId: string) => {
    const isAnimated = ['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber'].includes(cardId);
    return {
        bgClass: cardId === 'base' ? 'bg-white/[0.02]' : `holo-card-${cardId}`,
        isAnimated: isAnimated,
        borderClass: cardId === 'base' ? 'border-white/5 hover:border-white/10' : 'border-white/20 shadow-xl'
    };
  };

  const currentStyles = getCardStyles(stagedCard);
  const activeTitle = EARNED_TITLES.find(t => t.id === stagedTitle) || EARNED_TITLES[6];

  const hasUnsavedChanges = stagedCard !== profile?.equipped_card || 
                            stagedBorder !== profile?.equipped_border || 
                            stagedTitle !== profile?.equipped_title;

  return (
    <main className="min-h-screen bg-[#06090F] text-white font-sans pb-32 relative overflow-hidden">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* 🚨 THE OVERHAULED TEXTURE ENGINE 🚨 */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerGlare { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes cyberScan { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(1000%); opacity: 0; } }
        @keyframes voidPulse { 0%, 100% { background-size: 100% 100%; filter: brightness(1); } 50% { background-size: 120% 120%; filter: brightness(1.2); } }
        
        .legend-badge { background: linear-gradient(90deg, #6b21a8 0%, #d946ef 20%, #6b21a8 40%, #d946ef 60%, #6b21a8 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #e879f9; box-shadow: 0 0 15px rgba(217, 70, 239, 0.5); font-weight: 900; }
        .champion-badge { background: linear-gradient(90deg, #991b1b 0%, #ef4444 20%, #991b1b 40%, #ef4444 60%, #991b1b 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #f87171; box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); font-weight: 900; }
        .elite-badge { background: linear-gradient(90deg, #0f172a 0%, #475569 20%, #0f172a 40%, #475569 60%, #0f172a 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #94a3b8; box-shadow: 0 0 15px rgba(148, 163, 184, 0.3); font-weight: 900; }

        .holo-card-base { background: transparent; }
        .holo-card-obsidian { background: linear-gradient(135deg, #0f172a 0%, #334155 25%, #000000 50%, #0f172a 75%, #1e293b 100%); background-size: 300% 300%; }
        .holo-card-crimson { background: linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #450a0a 100%); background-size: 300% 300%; }
        .holo-card-sapphire { background: linear-gradient(135deg, #172554 0%, #0ea5e9 50%, #172554 100%); background-size: 300% 300%; }
        
        /* SHATTERED HOLOGRAPHIC FOIL */
        .holo-card-hype { 
          background: 
            linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent 100%),
            linear-gradient(135deg, #4f46e5 0%, #9333ea 25%, #ec4899 50%, #3b82f6 75%, #4f46e5 100%); 
          background-size: 40px 40px, 300% 300%; 
        }

        /* BRUSHED GOLD FOIL */
        .holo-card-premium { 
          background: 
            repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px),
            linear-gradient(135deg, #b45309 0%, #f59e0b 25%, #fef08a 50%, #d97706 75%, #78350f 100%); 
          background-size: 100% 100%, 300% 300%; 
        }

        /* PULSATING NEBULA CORE */
        .holo-card-amethyst { 
          background: radial-gradient(circle at 50% 50%, #c026d3 0%, #7e22ce 30%, #3b0764 80%, #000000 100%); 
          animation: voidPulse 6s ease-in-out infinite;
        }
        .holo-card-amethyst::before {
          content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.1;
          background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 2px, #fff 3px, #fff 4px);
        }

        /* NEON HACKER MATRIX */
        .holo-card-cyber { 
          background: 
            linear-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.15) 1px, transparent 1px),
            linear-gradient(135deg, #022c22 0%, #064e3b 50%, #083344 100%);
          background-size: 20px 20px, 20px 20px, 100% 100%;
          box-shadow: inset 0 0 40px rgba(6, 182, 212, 0.3);
        }
        .holo-card-cyber::after {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 8px;
          background: rgba(34, 211, 238, 0.8); filter: blur(3px); box-shadow: 0 0 20px #22d3ee;
          animation: cyberScan 3s linear infinite;
        }
        
        .animate-foil { animation: foilShift 15s ease-in-out infinite; }
        .holo-glare { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%); background-size: 200% auto; animation: shimmerGlare 8s infinite linear; pointer-events: none; z-index: 10; mix-blend-mode: overlay;}
      `}} />

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'bg-rose-950/90 border-rose-900/50 text-rose-200' : 'bg-emerald-950/90 border-emerald-900/50 text-emerald-200'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />}
            <p className="text-xs font-bold leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 pt-24 relative z-10">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 font-bold text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-transparent hover:border-white/10 w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 text-white flex items-center gap-3">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Locker Room</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm md:text-base">Equip your hard-earned gear and flex your rank.</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving || !hasUnsavedChanges}
            className="bg-white hover:bg-slate-200 text-slate-900 px-8 py-3.5 rounded-xl font-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Loadout</>}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LIVE PREVIEW WIDGET */}
          <div className="lg:col-span-5 lg:order-last">
            <div className="sticky top-10">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Live Feed Preview</h3>
              
              <div className="relative group z-10">
                {currentStyles.isAnimated && <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-blue-600 to-cyan-500 rounded-[2rem] blur-2xl opacity-20 transition-opacity duration-700"></div>}
                
                <div className={`${currentStyles.bgClass} ${currentStyles.isAnimated ? 'animate-foil border-white/20' : 'border-slate-700/50'} rounded-[2rem] p-6 text-white relative overflow-hidden border shadow-2xl transition-all duration-300`}>
                    
                    {/* Conditionally Render Flashy Elements */}
                    {['hype', 'premium'].includes(stagedCard) && <div className="holo-glare rounded-[2rem]"></div>}
                    
                    {currentStyles.isAnimated && (
                      <>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay"></div>
                        <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none z-10">
                            <Trophy size={150} className="animate-[spin_60s_linear_infinite]" />
                        </div>
                      </>
                    )}

                    <div className="relative z-20 flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                                {currentStyles.isAnimated && <div className="absolute inset-0 bg-white rounded-full blur-lg opacity-30 animate-pulse pointer-events-none"></div>}
                                <div className="relative shrink-0 shadow-xl rounded-full border-2 border-white/40 bg-slate-900 block">
                                    <AvatarWithBorder avatarUrl={profile?.avatar_url || null} sizeClasses="w-16 h-16" borderId={stagedBorder} />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mb-2 shadow-sm ${currentStyles.isAnimated ? 'bg-white/10 border border-white/20 text-white backdrop-blur-md' : 'bg-slate-700/50 border border-slate-600 text-slate-300'}`}>
                                    <Zap className={`w-3 h-3 ${currentStyles.isAnimated ? 'text-yellow-300 animate-pulse' : 'text-slate-400'}`}/> New Verified PR
                                </div>
                                <div className="text-2xl font-black tracking-tight leading-none mb-2 flex items-center gap-2 truncate">
                                    {profile?.first_name} {profile?.last_name}
                                    {profile?.is_premium && <Crown className="w-4 h-4 text-yellow-400 shrink-0" />}
                                </div>
                                {/* 🚨 INJECTED STAGED TITLE PREVIEW 🚨 */}
                                <div>
                                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase text-white shadow-sm w-max ${activeTitle.badgeClass}`}>
                                    {activeTitle.name} Rank
                                  </span>
                                </div>
                            </div>
                        </div>

                        <div className={`${currentStyles.isAnimated ? 'bg-black/20 border-white/20' : 'bg-black/40 border-slate-700/50'} backdrop-blur-md border p-6 rounded-[1.5rem] flex flex-col items-center justify-center shadow-inner w-full`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest mb-1 text-center ${currentStyles.isAnimated ? 'text-white/70' : 'text-slate-400'}`}>100 Meters</span>
                            <span className="text-5xl leading-none font-black tracking-tighter text-white drop-shadow-md text-center whitespace-nowrap">
                                10.42
                            </span>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* SELECTION MENUS */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* 🚨 RANK TITLES (MOVED HERE) 🚨 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-black text-white tracking-tight">Rank Titles</h2>
              </div>
              <div className="relative mb-6">
                <button 
                  onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left bg-white/[0.02] border border-white/10 hover:border-white/20 shadow-sm group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase text-white ${activeTitle.badgeClass}`}>
                      {activeTitle.name}
                    </div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-white transition-colors">Currently Selected</span>
                  </div>
                  {isTitleDropdownOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {isTitleDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-64 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {EARNED_TITLES.map((title) => {
                        const isUnlocked = highestPercentile <= title.reqPercentile;
                        const isEquipped = stagedTitle === title.id;

                        return (
                          <button 
                            key={title.id}
                            disabled={!isUnlocked}
                            onClick={() => {
                              setStagedTitle(title.id);
                              setIsTitleDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                              isEquipped 
                                ? 'bg-blue-500/10 border border-blue-500/30' 
                                : isUnlocked 
                                  ? 'hover:bg-white/5 border border-transparent' 
                                  : 'opacity-40 cursor-not-allowed border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase text-white ${isUnlocked ? title.badgeClass : 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
                                {title.name}
                              </div>
                              {!isUnlocked && <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center"><Lock className="w-2.5 h-2.5 inline mr-1 -mt-0.5" />{title.unlockText}</span>}
                            </div>
                            {isEquipped && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* CARD STYLES */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Paintbrush className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-black text-white tracking-tight">Post Cards</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CARD_STYLES.map(card => {
                  const isSelected = stagedCard === card.id;
                  const isUnlocked = unlockedCards.includes(card.id) || card.price === 0 || (card.isPremium && profile?.is_premium);
                  const isLocked = !isUnlocked;

                  return (
                    <button
                      key={card.id}
                      onClick={() => !isLocked && setStagedCard(card.id)}
                      disabled={isLocked}
                      className={`text-left relative p-5 rounded-2xl border transition-all overflow-hidden group ${
                        isSelected 
                        ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                      } ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                    >
                      <div className={`absolute top-0 right-0 left-0 h-1.5 ${card.id === 'base' ? 'bg-slate-700' : `bg-gradient-to-r ${card.gradient}`}`}></div>
                      
                      <div className="flex justify-between items-start mb-2 mt-1">
                        <h4 className="font-black text-white text-lg flex items-center gap-2">
                          {card.name} 
                          {card.isPremium && <Crown className="w-4 h-4 text-amber-500" />}
                        </h4>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                        {isLocked && <Lock className="w-4 h-4 text-slate-500" />}
                      </div>
                      <p className="text-xs font-medium text-slate-400">{card.desc}</p>
                      
                      {isLocked && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <Link href="/shop" className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-400 flex items-center gap-1">
                            Go to Shop <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* AVATAR BORDERS */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-black text-white tracking-tight">Avatar Borders</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {BORDER_STYLES.map(border => {
                  const isSelected = stagedBorder === border.id;
                  const isUnlocked = unlockedBorders.includes(border.id) || border.price === 0;
                  const isLocked = !isUnlocked;
                  
                  return (
                    <button
                      key={border.id}
                      onClick={() => !isLocked && setStagedBorder(border.id)}
                      disabled={isLocked}
                      className={`text-left relative p-5 rounded-2xl border transition-all overflow-hidden flex items-center gap-4 ${
                        isSelected 
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                      } ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                    >
                      <div className="shrink-0">
                        <AvatarWithBorder avatarUrl={profile?.avatar_url || null} borderId={border.id} sizeClasses="w-12 h-12" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-white text-base truncate pr-2">{border.name}</h4>
                          {isLocked && <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5 line-clamp-2 pr-2">{border.desc}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </section>

          </div>
        </div>

      </div>
    </main>
  );
}