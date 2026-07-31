'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Paintbrush, Trophy, CheckCircle2, Lock, AlertCircle, X, Store, Activity, Sparkles, Flame, Gem, Shield, Crown, Image as ImageIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Points } from '@/components/Points'; 
import { AvatarWithBorder } from '@/components/AnimatedBorders'; 

// --- GAMIFIED SHOP INVENTORIES ---

const SHOP_CARDS = [
  { id: 'base', name: 'Standard Slate', price: 0, rarity: 'Common', desc: 'The clean, minimal starting layout.', isPremium: false, gradient: 'bg-slate-800 border-slate-700' },
  { id: 'obsidian', name: 'Obsidian Stealth', price: 50, rarity: 'Epic', desc: 'Deep, dark, matte black metallic finish.', isPremium: false, gradient: 'from-slate-900 via-slate-800 to-black' },
  { id: 'crimson', name: 'Crimson Flare', price: 100, rarity: 'Epic', desc: 'A burning red metallic sheen.', isPremium: false, gradient: 'from-red-950 via-red-600 to-red-900' },
  { id: 'sapphire', name: 'Sapphire Ocean', price: 150, rarity: 'Epic', desc: 'Deep aquatic blue metallic finish.', isPremium: false, gradient: 'from-blue-950 via-sky-500 to-blue-900' },
  { id: 'hype', name: 'Holo Classic', price: 250, rarity: 'Legendary', desc: 'The legendary iridescent foil.', isPremium: false, gradient: 'from-fuchsia-600 via-blue-600 to-cyan-500' },
  { id: 'amethyst', name: 'Amethyst Void', price: 350, rarity: 'Legendary', desc: 'Rich, vibrating purple energy.', isPremium: false, gradient: 'from-purple-950 via-fuchsia-500 to-purple-900' },
  { id: 'cyber', name: 'Neon Cyber', price: 500, rarity: 'Exotic', desc: 'High-voltage toxic green and cyan.', isPremium: false, gradient: 'from-emerald-950 via-emerald-400 to-cyan-500' },
  { id: 'premium', name: 'Chased Gold', price: 0, rarity: 'Exotic', desc: 'Exclusive 24k gold foil. Pro Members only.', isPremium: true, gradient: 'from-yellow-500 via-amber-500 to-orange-500' },
];

const SHOP_BORDERS = [
  { id: 'none', name: 'Standard Profile', price: 0, rarity: 'Common', desc: 'The classic, clean athlete look.' },
  { id: 'pioneer', name: 'The Pioneer', price: 0, rarity: 'Epic', desc: 'Exclusive Early Adopter HUD Scanner.' },
  { id: 'border-blue-500', name: 'Sapphire Strike', price: 25, rarity: 'Rare', desc: 'A sharp, focused blue energy rim.' },
  { id: 'border-red-500', name: 'Crimson Phantom', price: 50, rarity: 'Rare', desc: 'Intimidating red aura.' },
  { id: 'border-emerald-400', name: 'Neon Pulse', price: 75, rarity: 'Rare', desc: 'Bright, energetic green boundary.' },
  { id: 'animated-silver', name: 'Silver Crest', price: 100, rarity: 'Epic', desc: 'Shimmering metallic finish for medalists.' },
  { id: 'toxic-slime', name: 'Toxic Slime', price: 125, rarity: 'Epic', desc: 'Bubbling, radioactive green ooze.' },
  { id: 'glacial-frost', name: 'Glacial Frost', price: 150, rarity: 'Epic', desc: 'Shattered ice with a freezing aura.' },
  { id: 'animated-gold', name: 'Gold Crest', price: 200, rarity: 'Epic', desc: 'Pure animated gold. For the champions.' },
  { id: 'animated-diamond', name: 'Diamond Crest', price: 250, rarity: 'Legendary', desc: 'Flawless, icy perfection. Highly respected.' },
  { id: 'cyber-matrix', name: 'Cyber Matrix', price: 300, rarity: 'Legendary', desc: 'Digital rain scanner. Enter the system.' },
  { id: 'synthwave', name: 'Synthwave Vapor', price: 350, rarity: 'Legendary', desc: 'Retro neon pink and cyan aesthetics.' },
  { id: 'neon-glitch', name: 'Neon Glitch', price: 400, rarity: 'Legendary', desc: 'Unstable cyberpunk aesthetic.' },
  { id: 'ethereal-cosmos', name: 'Ethereal Cosmos', price: 425, rarity: 'Mythic', desc: 'Harness the energy of a dying star.' },
  { id: 'molten-core', name: 'Molten Core', price: 450, rarity: 'Mythic', desc: 'Cracked earth leaking pulsating magma.' },
  { id: 'fire', name: 'Inferno', price: 475, rarity: 'Mythic', desc: 'Blazing with pure, uncontainable heat.' },
  { id: 'abyssal-void', name: 'Abyssal Void', price: 490, rarity: 'Exotic', desc: 'A singularity that consumes light and competition.' },
  { id: 'celestial-radiance', name: 'Celestial Radiance', price: 500, rarity: 'Exotic', desc: 'Biblically accurate speed. The ultimate flex.' },
];

const getRarityConfig = (rarity: string) => {
  switch(rarity) {
    case 'Common': return { badge: 'bg-slate-800 text-slate-300 border-slate-600', cardGlow: 'hover:shadow-[0_0_30px_rgba(148,163,184,0.2)] border-slate-800 hover:border-slate-500', icon: Activity, text: 'text-slate-300' };
    case 'Rare': return { badge: 'bg-blue-900/50 text-blue-400 border-blue-700', cardGlow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] border-slate-800 hover:border-blue-500', icon: Shield, text: 'text-blue-400' };
    case 'Epic': return { badge: 'bg-purple-900/50 text-purple-400 border-purple-700', cardGlow: 'hover:shadow-[0_0_45px_rgba(168,85,247,0.4)] border-slate-800 hover:border-purple-500', icon: Sparkles, text: 'text-purple-400' };
    case 'Legendary': return { badge: 'bg-amber-900/50 text-amber-400 border-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.2)]', cardGlow: 'shadow-[0_0_15px_rgba(251,191,36,0.1)] hover:shadow-[0_0_50px_rgba(251,191,36,0.4)] border-amber-900/40 hover:border-amber-500', icon: Gem, text: 'text-amber-400' };
    case 'Mythic': return { badge: 'bg-red-900/50 text-red-400 border-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]', cardGlow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_60px_rgba(239,68,68,0.5)] border-red-900/50 hover:border-red-500', icon: Flame, text: 'text-red-400' };
    case 'Exotic': return { badge: 'bg-gradient-to-r from-fuchsia-600 via-cyan-600 to-fuchsia-600 text-white border-transparent bg-[length:200%_auto] animate-[shimmerSlow_3s_linear_infinite] shadow-[0_0_15px_rgba(217,70,239,0.5)]', cardGlow: 'shadow-[0_0_30px_rgba(217,70,239,0.2)] hover:shadow-[0_0_70px_rgba(34,211,238,0.5)] border-fuchsia-500/50 hover:border-cyan-400', icon: Crown, text: 'bg-gradient-to-r from-fuchsia-400 to-cyan-400 text-transparent bg-clip-text' };
    default: return { badge: 'bg-slate-800 text-slate-400 border-slate-700', cardGlow: 'hover:shadow-2xl hover:border-slate-600', icon: Activity, text: 'text-slate-300' };
  }
};

export default function ShopPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  
  // Economy State
  const [userCoins, setUserCoins] = useState<number>(0);
  
  // Inventory State
  const [unlockedBorders, setUnlockedBorders] = useState<string[]>(['none']);
  const [equippedBorder, setEquippedBorder] = useState<string>('none');
  const [unlockedCards, setUnlockedCards] = useState<string[]>(['base']);
  const [equippedCard, setEquippedCard] = useState<string>('base');
  
  // UI State
  const [activeTab, setActiveTab] = useState<'cards' | 'borders'>('cards');
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [justPurchased, setJustPurchased] = useState<string | null>(null); 
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function loadShopData() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: cData } = await supabase.from('coaches').select('id').eq('id', session.user.id).maybeSingle();
      if (cData) {
        router.push('/dashboard');
        return;
      }

      const { data: aData } = await supabase
        .from('athletes')
        .select('id, avatar_url, trust_level, is_premium, coins, unlocked_borders, equipped_border, unlocked_cards, equipped_card')
        .eq('id', session.user.id)
        .maybeSingle();

      if (aData) {
        setAthleteId(aData.id);
        setAvatarUrl(aData.avatar_url);
        setIsUnverified(aData.trust_level === 0);
        setIsPremium(aData.is_premium || false);
        setUserCoins(aData.coins || 0);
        
        setUnlockedBorders(aData.unlocked_borders || ['none']);
        setEquippedBorder(aData.equipped_border || 'none');
        
        let dbCard = aData.equipped_card || 'base';
        if (dbCard === 'default') dbCard = 'base';
        let dbUnlockedCards = aData.unlocked_cards || ['base'];
        if (dbUnlockedCards.includes('default')) dbUnlockedCards = dbUnlockedCards.map((c: string) => c === 'default' ? 'base' : c);

        setUnlockedCards(dbUnlockedCards);
        setEquippedCard(dbCard);
      }
      
      setLoading(false);
    }
    
    loadShopData();
  }, [supabase, router]);

  const handlePurchaseOrEquip = async (item: any, type: 'card' | 'border') => {
    if (!athleteId) return;
    if (isUnverified) {
      showToast("You must verify your profile on the dashboard to use the shop.");
      return;
    }

    if (item.isPremium && !isPremium) {
      showToast("This item is reserved for Pro Members.", "error");
      return;
    }

    setIsProcessingTx(true);

    try {
      // 🛡️ HANDLE BORDERS
      if (type === 'border') {
        const isUnlocked = unlockedBorders.includes(item.id) || item.price === 0;

        if (isUnlocked) {
          const { error } = await supabase.from('athletes').update({ equipped_border: item.id }).eq('id', athleteId);
          if (error) throw error;
          
          setEquippedBorder(item.id);
          if (!unlockedBorders.includes(item.id)) {
              setUnlockedBorders([...unlockedBorders, item.id]);
              await supabase.from('athletes').update({ unlocked_borders: [...unlockedBorders, item.id] }).eq('id', athleteId);
          }
          showToast(`Equipped ${item.name}!`, "success");
        } else {
          if (userCoins < item.price) {
            showToast("Not enough cash! Hit some PRs or login daily to earn more.");
            setIsProcessingTx(false);
            return;
          }

          const newBalance = userCoins - item.price;
          const newUnlocked = [...unlockedBorders, item.id];

          const { error } = await supabase.from('athletes').update({ 
            coins: newBalance, 
            unlocked_borders: newUnlocked,
            equipped_border: item.id 
          }).eq('id', athleteId);

          if (error) throw error;
          
          setJustPurchased(item.id);
          setUserCoins(newBalance);
          setUnlockedBorders(newUnlocked);
          setEquippedBorder(item.id);
          
          setTimeout(() => setJustPurchased(null), 1500);
        }
      }

      // 🃏 HANDLE CARDS
      if (type === 'card') {
        const isUnlocked = unlockedCards.includes(item.id) || item.price === 0 || item.isPremium;

        if (isUnlocked) {
          const { error } = await supabase.from('athletes').update({ equipped_card: item.id }).eq('id', athleteId);
          if (error) throw error;
          
          setEquippedCard(item.id);
          if (!unlockedCards.includes(item.id)) {
              setUnlockedCards([...unlockedCards, item.id]);
              await supabase.from('athletes').update({ unlocked_cards: [...unlockedCards, item.id] }).eq('id', athleteId);
          }
          showToast(`Equipped ${item.name}!`, "success");
        } else {
          if (userCoins < item.price) {
            showToast("Not enough cash! Hit some PRs or login daily to earn more.");
            setIsProcessingTx(false);
            return;
          }

          const newBalance = userCoins - item.price;
          const newUnlocked = [...unlockedCards, item.id];

          const { error } = await supabase.from('athletes').update({ 
            coins: newBalance, 
            unlocked_cards: newUnlocked,
            equipped_card: item.id 
          }).eq('id', athleteId);

          if (error) throw error;
          
          setJustPurchased(item.id);
          setUserCoins(newBalance);
          setUnlockedCards(newUnlocked);
          setEquippedCard(item.id);
          
          setTimeout(() => setJustPurchased(null), 1500);
        }
      }

    } catch (err: any) {
      showToast(`Transaction failed: ${err.message}`);
    } finally {
      setIsProcessingTx(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center animate-in fade-in duration-700">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-amber-600 rounded-full animate-spin shadow-[0_0_15px_rgba(251,191,36,0.5)]"></div>
        <p className="text-slate-400 font-bold mt-4 animate-pulse">Entering The Vault...</p>
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

  return (
    <main className="min-h-screen bg-[#020617] text-white font-sans pb-32 selection:bg-amber-500/30 overflow-hidden relative">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes unlock-burst {
          0% { transform: scale(1); filter: brightness(1); box-shadow: 0 0 0 transparent; }
          30% { transform: scale(1.08); filter: brightness(1.5); box-shadow: 0 0 80px rgba(251, 191, 36, 1); z-index: 50; }
          100% { transform: scale(1); filter: brightness(1); box-shadow: 0 0 20px rgba(251, 191, 36, 0); z-index: 1; }
        }
        .animate-unlock { animation: unlock-burst 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerGlare { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes cyberScan { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(1000%); opacity: 0; } }
        @keyframes voidPulse { 0%, 100% { background-size: 100% 100%; filter: brightness(1); } 50% { background-size: 120% 120%; filter: brightness(1.2); } }
        
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

      {/* TOAST NOTIFICATIONS */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 backdrop-blur-md ${toast.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-200' : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />}
            <p className="text-sm font-bold leading-tight">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* FIXED DYNAMIC PARALLAX BACKGROUNDS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]"></div>
        <div 
          className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full transition-transform duration-700 ease-out"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
        <div 
          className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full transition-transform duration-700 ease-out"
          style={{ transform: `translateY(${scrollY * -0.2}px)` }}
        />
        <div 
          className="absolute bottom-[-20%] left-[30%] w-[700px] h-[700px] bg-cyan-600/10 blur-[150px] rounded-full transition-transform duration-700 ease-out"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#020617] to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* 🚨 SHOP HEADER WITH GAMIFIED WALLET CARD 🚨 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
          <div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md">
              <Store className="w-4 h-4 mr-2" /> The Vault
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-3 drop-shadow-lg text-white">Supply Shop</h1>
            <p className="text-slate-400 font-medium text-lg max-w-xl">Spend your Points to unlock premium profile borders and designer cards.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch gap-4 shrink-0 hover:-translate-y-1 transition-transform duration-500 cursor-default group">
            {/* Super Valuable ChasedCash Card */}
            <div className="bg-white/95 backdrop-blur-xl p-4 sm:p-5 rounded-[2rem] shadow-[0_15px_50px_rgba(0,0,0,0.5)] flex items-center gap-5 border border-slate-200 group-hover:shadow-[0_20px_60px_rgba(255,255,255,0.1)] transition-all duration-500">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden border border-slate-700 shrink-0">
                <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
                <Points className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] transform group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex flex-col pr-4 sm:pr-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> CHASEDCASH
                </span>
                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-1.5 drop-shadow-sm">
                  {userCoins.toLocaleString()}
                </span>
                <Link href="/dashboard" className="text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors flex items-center gap-1 w-fit group/link">
                  DASHBOARD <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* UNVERIFIED WARNING */}
        {isUnverified && (
          <div className="bg-red-950/50 border border-red-500/30 p-6 rounded-2xl mb-10 flex items-start gap-4 shadow-[0_10px_30px_rgba(220,38,38,0.15)] backdrop-blur-md hover:-translate-y-1 transition-transform duration-300">
            <Lock className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <h4 className="text-red-400 font-bold mb-1">Store Locked</h4>
              <p className="text-red-300/80 text-sm font-medium mb-3">You must verify your Athletic.net profile on the dashboard before you can make purchases.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/50 text-red-200 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-red-600/40 hover:scale-105 active:scale-95 transition-all shadow-md">
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* 🚨 NAVIGATION TABS 🚨 */}
        <div className="flex flex-wrap gap-3 mb-8 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 w-fit backdrop-blur-md shadow-xl">
          <button 
            onClick={() => setActiveTab('cards')}
            className={`px-6 py-3 rounded-xl font-black transition-all duration-300 flex items-center gap-2 text-sm active:scale-95 ${activeTab === 'cards' ? 'bg-amber-500 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <ImageIcon className="w-4 h-4" /> Designer Cards
          </button>
          <button 
            onClick={() => setActiveTab('borders')}
            className={`px-6 py-3 rounded-xl font-black transition-all duration-300 flex items-center gap-2 text-sm active:scale-95 ${activeTab === 'borders' ? 'bg-amber-500 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Shield className="w-4 h-4" /> Profile Borders
          </button>
        </div>

        {/* TAB CONTENT: CARDS */}
        {activeTab === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {SHOP_CARDS.map((card) => {
              const isUnlocked = unlockedCards.includes(card.id) || card.price === 0 || (card.isPremium && isPremium);
              const isEquipped = equippedCard === card.id;
              const isJustPurchased = justPurchased === card.id;
              const rarityStyle = getRarityConfig(card.rarity);
              const RarityIcon = rarityStyle.icon;
              const cardStyles = getCardStyles(card.id);

              return (
                <div 
                  key={card.id} 
                  className={`bg-slate-900/80 backdrop-blur-md rounded-[2.5rem] p-1 transition-all duration-500 relative flex flex-col group hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${isEquipped ? 'scale-[1.02] z-10' : ''} ${isJustPurchased ? 'animate-unlock' : ''}`}
                >
                  <div className={`absolute inset-0 rounded-[2.5rem] border-2 transition-all duration-500 ${isEquipped ? 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)]' : rarityStyle.cardGlow}`}></div>
                  
                  {isJustPurchased && (
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm z-50 rounded-[2.5rem] flex items-center justify-center pointer-events-none">
                      <div className="bg-amber-400 text-amber-950 font-black text-2xl px-6 py-2 rounded-xl shadow-[0_0_50px_rgba(251,191,36,1)] -rotate-6 scale-125">
                        UNLOCKED!
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-900/90 h-full rounded-[2.3rem] p-6 sm:p-8 flex flex-col relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${rarityStyle.badge}`}>
                        <RarityIcon className="w-3.5 h-3.5 mr-1.5" /> {card.rarity}
                      </div>
                      <div>
                        {isEquipped ? (
                          <span className="bg-amber-500 text-amber-950 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.6)]">Equipped</span>
                        ) : isUnlocked ? (
                          <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border border-slate-700 shadow-inner">Owned</span>
                        ) : card.isPremium && !isPremium ? (
                          <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border border-slate-700 flex items-center gap-1 shadow-inner">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* LIVE CARD PREVIEW BLOCK */}
                    <div className={`h-48 w-full rounded-2xl mb-8 flex items-center justify-center border shadow-inner relative overflow-hidden group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-500
                        ${cardStyles.bgClass} ${cardStyles.isAnimated ? 'animate-foil border-white/20' : 'border-white/5 bg-slate-800'}
                    `}>
                        {cardStyles.isAnimated && ['hype', 'premium'].includes(card.id) && <div className="holo-glare rounded-2xl"></div>}
                        {cardStyles.isAnimated && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay"></div>}
                        {cardStyles.isAnimated && (
                          <div className="absolute -top-10 -right-10 opacity-[0.05] pointer-events-none">
                              <Trophy size={100} className="animate-[spin_60s_linear_infinite]" />
                          </div>
                        )}
                        <div className="relative z-20 transform group-hover:scale-110 transition-transform duration-500 shadow-2xl rounded-full border-2 border-white/40 bg-slate-900">
                          <AvatarWithBorder avatarUrl={avatarUrl} borderId={equippedBorder} sizeClasses="w-24 h-24" />
                        </div>
                    </div>

                    <div className="mb-8 flex-grow text-center">
                      <h3 className={`text-2xl font-black leading-tight mb-2 ${rarityStyle.text}`}>{card.name}</h3>
                      <p className="text-sm font-medium text-slate-400 leading-relaxed px-2">{card.desc}</p>
                    </div>

                    <button 
                      disabled={isProcessingTx || isUnverified || isEquipped || isJustPurchased || (!isUnlocked && userCoins < card.price) || (card.isPremium && !isPremium)}
                      onClick={() => handlePurchaseOrEquip(card, 'card')}
                      className={`w-full py-4 rounded-xl font-black transition-all duration-300 flex items-center justify-center gap-2 ${
                        isEquipped 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                          : isUnlocked || card.price === 0
                            ? 'bg-slate-100 text-slate-900 hover:bg-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]' 
                            : card.isPremium && !isPremium
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 hover:from-amber-400 hover:to-yellow-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)]'
                      }`}
                    >
                      {isEquipped ? (
                        <><CheckCircle2 className="w-5 h-5" /> Equipped</>
                      ) : isUnlocked || card.price === 0 ? (
                        'Equip Card'
                      ) : card.isPremium && !isPremium ? (
                        <><Lock className="w-4 h-4" /> Pro Member Only</>
                      ) : (
                        <>Unlock for <Points className="w-7 h-5 ml-1" /> {card.price}</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB CONTENT: BORDERS */}
        {activeTab === 'borders' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {SHOP_BORDERS.map((border) => {
              const isUnlocked = unlockedBorders.includes(border.id) || border.price === 0;
              const isEquipped = equippedBorder === border.id;
              const isJustPurchased = justPurchased === border.id;
              const rarityStyle = getRarityConfig(border.rarity);
              const RarityIcon = rarityStyle.icon;

              return (
                <div 
                  key={border.id} 
                  className={`bg-slate-900/80 backdrop-blur-md rounded-[2.5rem] p-1 transition-all duration-500 relative flex flex-col group hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${isEquipped ? 'scale-[1.02] z-10' : ''} ${isJustPurchased ? 'animate-unlock' : ''}`}
                >
                  <div className={`absolute inset-0 rounded-[2.5rem] border-2 transition-all duration-500 ${isEquipped ? 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)]' : rarityStyle.cardGlow}`}></div>
                  
                  {isJustPurchased && (
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm z-50 rounded-[2.5rem] flex items-center justify-center pointer-events-none">
                      <div className="bg-amber-400 text-amber-950 font-black text-2xl px-6 py-2 rounded-xl shadow-[0_0_50px_rgba(251,191,36,1)] -rotate-6 scale-125">
                        UNLOCKED!
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-900/90 h-full rounded-[2.3rem] p-6 sm:p-8 flex flex-col relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${rarityStyle.badge}`}>
                        <RarityIcon className="w-3.5 h-3.5 mr-1.5" /> {border.rarity}
                      </div>
                      <div>
                        {isEquipped ? (
                          <span className="bg-amber-500 text-amber-950 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.6)]">Equipped</span>
                        ) : isUnlocked ? (
                          <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border border-slate-700 shadow-inner">Owned</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="h-48 w-full bg-slate-950/50 rounded-2xl mb-8 flex items-center justify-center border border-slate-800 relative overflow-hidden group-hover:bg-slate-950/80 transition-colors shadow-inner group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                      <div className="transform group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">
                        <AvatarWithBorder avatarUrl={avatarUrl} borderId={border.id} sizeClasses="w-32 h-32" />
                      </div>
                    </div>

                    <div className="mb-8 flex-grow text-center">
                      <h3 className={`text-2xl font-black leading-tight mb-2 ${rarityStyle.text}`}>{border.name}</h3>
                      <p className="text-sm font-medium text-slate-400 leading-relaxed px-2">{border.desc}</p>
                    </div>

                    <button 
                      disabled={isProcessingTx || isUnverified || isEquipped || isJustPurchased || (!isUnlocked && userCoins < border.price)}
                      onClick={() => handlePurchaseOrEquip(border, 'border')}
                      className={`w-full py-4 rounded-xl font-black transition-all duration-300 flex items-center justify-center gap-2 ${
                        isEquipped 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                          : isUnlocked || border.price === 0
                            ? 'bg-slate-100 text-slate-900 hover:bg-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]' 
                            : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 hover:from-amber-400 hover:to-yellow-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)]'
                      }`}
                    >
                      {isEquipped ? (
                        <><CheckCircle2 className="w-5 h-5" /> Equipped</>
                      ) : isUnlocked || border.price === 0 ? (
                        'Equip Border'
                      ) : (
                        <>
                          Unlock for <Points className="w-7 h-5 ml-1" /> {border.price}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}