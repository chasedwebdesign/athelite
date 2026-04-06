'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Paintbrush, CheckCircle2, Lock, AlertCircle, X, Store, Activity, Sparkles, Flame, Gem, Shield, Crown, Zap, PackageOpen } from 'lucide-react';
import Link from 'next/link';

// 🚨 IMPORTED REUSABLE COMPONENTS
import { ChasedCash } from '@/components/ChasedCash'; 
import { AvatarWithBorder } from '@/components/AnimatedBorders'; 

// --- GAMIFIED SHOP INVENTORY ---
const SHOP_BORDERS = [
  // SPECIAL OFFERS
  { id: 'none', name: 'Standard Profile', price: 0, rarity: 'Common', desc: 'The classic, clean athlete look.' },
  { id: 'pioneer', name: 'The Pioneer', price: 0, rarity: 'Epic', desc: 'Exclusive Early Adopter HUD Scanner.' },
  
  // RARE TIER
  { id: 'border-blue-500', name: 'Sapphire Strike', price: 50, rarity: 'Rare', desc: 'A sharp, focused blue energy rim.' },
  { id: 'border-red-500', name: 'Crimson Phantom', price: 100, rarity: 'Rare', desc: 'Intimidating red aura.' },
  { id: 'border-emerald-400', name: 'Neon Pulse', price: 150, rarity: 'Rare', desc: 'Bright, energetic green boundary.' },
  
  // EPIC TIER
  { id: 'animated-silver', name: 'Silver Crest', price: 400, rarity: 'Epic', desc: 'Shimmering metallic finish for medalists.' },
  { id: 'animated-gold', name: 'Gold Crest', price: 600, rarity: 'Epic', desc: 'Pure animated gold. For the champions.' },
  
  // LEGENDARY TIER
  { id: 'animated-diamond', name: 'Diamond Crest', price: 1000, rarity: 'Legendary', desc: 'Flawless, icy perfection. Highly respected.' },
  { id: 'neon-glitch', name: 'Neon Glitch', price: 1250, rarity: 'Legendary', desc: 'Unstable cyberpunk aesthetic.' },
  
  // MYTHIC TIER
  { id: 'ethereal-cosmos', name: 'Ethereal Cosmos', price: 1500, rarity: 'Mythic', desc: 'Harness the energy of a dying star.' },
  { id: 'fire', name: 'Inferno', price: 2000, rarity: 'Mythic', desc: 'Blazing with pure, uncontainable heat.' },

  // 🚨 EXOTIC / GOD TIER 🚨
  { id: 'abyssal-void', name: 'Abyssal Void', price: 4000, rarity: 'Exotic', desc: 'A singularity that consumes light and competition.' },
  { id: 'celestial-radiance', name: 'Celestial Radiance', price: 5000, rarity: 'Exotic', desc: 'Biblically accurate speed. The ultimate flex.' },
];

// 🚨 NEW: CONSUMABLES INVENTORY
const SHOP_CONSUMABLES = [
  { id: 'boost-1', type: 'boost', amount: 1, name: '1x Profile Boost', price: 150, rarity: 'Rare', desc: 'Push your profile to the top of coach discovery feeds for 24 hours.' },
  { id: 'boost-3', type: 'boost', amount: 3, name: '3x Boost Bundle', price: 400, rarity: 'Epic', desc: 'A bundle of 3 profile boosts. Save 50 coins!' },
  { id: 'boost-10', type: 'boost', amount: 10, name: '10x Mega Bundle', price: 1200, rarity: 'Legendary', desc: 'Dominate the recruiting feeds. Massive discount.' },
];

const getRarityConfig = (rarity: string) => {
  switch(rarity) {
    case 'Common': return { badge: 'bg-slate-800 text-slate-300 border-slate-600', cardGlow: 'hover:shadow-[0_0_20px_rgba(148,163,184,0.15)] border-slate-800 hover:border-slate-500', icon: Activity, text: 'text-slate-300' };
    case 'Rare': return { badge: 'bg-blue-900/50 text-blue-400 border-blue-700', cardGlow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] border-slate-800 hover:border-blue-500', icon: Shield, text: 'text-blue-400' };
    case 'Epic': return { badge: 'bg-purple-900/50 text-purple-400 border-purple-700', cardGlow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] border-slate-800 hover:border-purple-500', icon: Sparkles, text: 'text-purple-400' };
    case 'Legendary': return { badge: 'bg-amber-900/50 text-amber-400 border-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.2)]', cardGlow: 'shadow-[0_0_15px_rgba(251,191,36,0.1)] hover:shadow-[0_0_40px_rgba(251,191,36,0.4)] border-amber-900/40 hover:border-amber-500', icon: Gem, text: 'text-amber-400' };
    case 'Mythic': return { badge: 'bg-red-900/50 text-red-400 border-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]', cardGlow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_50px_rgba(239,68,68,0.5)] border-red-900/50 hover:border-red-500', icon: Flame, text: 'text-red-400' };
    case 'Exotic': return { badge: 'bg-gradient-to-r from-fuchsia-600 via-cyan-600 to-fuchsia-600 text-white border-transparent bg-[length:200%_auto] animate-[shimmerSlow_3s_linear_infinite] shadow-[0_0_15px_rgba(217,70,239,0.5)]', cardGlow: 'shadow-[0_0_30px_rgba(217,70,239,0.2)] hover:shadow-[0_0_60px_rgba(34,211,238,0.5)] border-fuchsia-500/50 hover:border-cyan-400', icon: Crown, text: 'bg-gradient-to-r from-fuchsia-400 to-cyan-400 text-transparent bg-clip-text' };
    default: return { badge: 'bg-slate-800 text-slate-400 border-slate-700', cardGlow: 'hover:shadow-xl hover:border-slate-600', icon: Activity, text: 'text-slate-300' };
  }
};

export default function ShopPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(true);
  
  // Economy State
  const [userCoins, setUserCoins] = useState<number>(0);
  const [userBoosts, setUserBoosts] = useState<number>(0); // Tracker for boosts
  const [unlockedBorders, setUnlockedBorders] = useState<string[]>(['none']);
  const [equippedBorder, setEquippedBorder] = useState<string>('none');
  
  // UI State
  const [activeTab, setActiveTab] = useState<'cosmetics' | 'consumables'>('cosmetics');
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [justPurchased, setJustPurchased] = useState<string | null>(null); 
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
        .select('id, trust_level, coins, unlocked_borders, equipped_border, boosts_available')
        .eq('id', session.user.id)
        .maybeSingle();

      if (aData) {
        setAthleteId(aData.id);
        setIsUnverified(aData.trust_level === 0);
        setUserCoins(aData.coins || 0);
        setUserBoosts(aData.boosts_available || 0);
        setUnlockedBorders(aData.unlocked_borders || ['none']);
        setEquippedBorder(aData.equipped_border || 'none');
      }
      
      setLoading(false);
    }
    
    loadShopData();
  }, [supabase, router]);

  // 🚨 REWIRED TO HANDLE BOTH BORDERS AND BOOSTS
  const handlePurchaseOrEquip = async (item: any, isConsumable: boolean = false) => {
    if (!athleteId) return;
    if (isUnverified) {
      showToast("You must verify your profile on the dashboard to use the shop.");
      return;
    }

    setIsProcessingTx(true);

    try {
      // HANDLE CONSUMABLES (BOOSTS)
      if (isConsumable) {
        if (userCoins < item.price) {
          showToast("Not enough cash! Hit some PRs or login daily to earn more.");
          setIsProcessingTx(false);
          return;
        }

        const newBalance = userCoins - item.price;
        const newBoosts = userBoosts + item.amount;

        const { error } = await supabase.from('athletes').update({ 
          coins: newBalance, 
          boosts_available: newBoosts 
        }).eq('id', athleteId);

        if (error) throw error;

        setJustPurchased(item.id);
        setUserCoins(newBalance);
        setUserBoosts(newBoosts);
        showToast(`Successfully purchased ${item.amount}x Boosts!`, "success");

        setTimeout(() => setJustPurchased(null), 1500);
        setIsProcessingTx(false);
        return;
      }

      // HANDLE COSMETICS (BORDERS)
      const isUnlocked = unlockedBorders.includes(item.id) || item.price === 0;

      if (isUnlocked) {
        // Just Equip
        const { error } = await supabase.from('athletes').update({ equipped_border: item.id }).eq('id', athleteId);
        if (error) throw error;
        setEquippedBorder(item.id);
        
        if (!unlockedBorders.includes(item.id)) {
            setUnlockedBorders([...unlockedBorders, item.id]);
            await supabase.from('athletes').update({ unlocked_borders: [...unlockedBorders, item.id] }).eq('id', athleteId);
        }
        
        showToast(`Equipped ${item.name}!`, "success");
      } else {
        // Purchase Border
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
    } catch (err: any) {
      showToast(`Transaction failed: ${err.message}`);
    } finally {
      setIsProcessingTx(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-amber-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold mt-4 animate-pulse">Entering The Vault...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white font-sans pb-32 selection:bg-amber-500/30">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes unlock-burst {
          0% { transform: scale(1); filter: brightness(1); box-shadow: 0 0 0 transparent; }
          30% { transform: scale(1.08); filter: brightness(1.5); box-shadow: 0 0 50px rgba(251, 191, 36, 0.8); z-index: 50; }
          100% { transform: scale(1); filter: brightness(1); box-shadow: 0 0 20px rgba(251, 191, 36, 0); z-index: 1; }
        }
        .animate-unlock {
          animation: unlock-burst 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
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

      {/* GAMIFIED HERO BACKGROUND */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-[#020617] overflow-hidden -z-10 border-b border-slate-800/50">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]"></div>
        <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#020617] to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16">
        
        {/* SHOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative z-10">
          <div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Store className="w-4 h-4 mr-2" /> The Vault
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-3 drop-shadow-lg text-white">Supply Shop</h1>
            <p className="text-slate-400 font-medium text-lg max-w-xl">Spend your ChasedCash to unlock profile borders and recruiting boosts.</p>
          </div>
          
          <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-between gap-6 border border-slate-700/50 shrink-0">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Available Funds</p>
              <div className="flex items-center gap-2">
                <ChasedCash className="w-8 h-6" />
                <span className="text-3xl font-black tracking-tight text-white drop-shadow-md">{userCoins}</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-700"></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Boosts</p>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-3xl font-black tracking-tight text-white drop-shadow-md">{userBoosts}</span>
              </div>
            </div>
            <Link href="/dashboard" className="ml-2 bg-slate-800 hover:bg-slate-700 p-3 rounded-xl transition-colors border border-slate-700">
              <Activity className="w-5 h-5 text-amber-400" />
            </Link>
          </div>
        </div>

        {/* UNVERIFIED WARNING */}
        {isUnverified && (
          <div className="bg-red-950/50 border border-red-500/30 p-6 rounded-2xl mb-10 flex items-start gap-4 shadow-lg backdrop-blur-md">
            <Lock className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <h4 className="text-red-400 font-bold mb-1">Store Locked</h4>
              <p className="text-red-300/80 text-sm font-medium mb-3">You must verify your Athletic.net profile on the dashboard before you can make purchases.</p>
              <Link href="/dashboard" className="inline-block bg-red-600/20 border border-red-500/50 text-red-200 font-bold px-4 py-2 rounded-lg text-sm hover:bg-red-600/40 transition-colors">
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* 🚨 NEW: TAB NAVIGATION 🚨 */}
        <div className="flex gap-4 mb-8 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 w-fit backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('cosmetics')}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'cosmetics' ? 'bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Paintbrush className="w-4 h-4" /> Cosmetics
          </button>
          <button 
            onClick={() => setActiveTab('consumables')}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'consumables' ? 'bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <PackageOpen className="w-4 h-4" /> Consumables
          </button>
        </div>

        {/* TAB CONTENT: COSMETICS (BORDERS) */}
        {activeTab === 'cosmetics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-in fade-in duration-500">
            {SHOP_BORDERS.map((border) => {
              const isUnlocked = unlockedBorders.includes(border.id) || border.price === 0;
              const isEquipped = equippedBorder === border.id;
              const isJustPurchased = justPurchased === border.id;
              const rarityStyle = getRarityConfig(border.rarity);
              const RarityIcon = rarityStyle.icon;

              return (
                <div 
                  key={border.id} 
                  className={`bg-slate-900/80 backdrop-blur-sm rounded-[2rem] p-1 transition-all duration-500 relative flex flex-col group ${isEquipped ? 'scale-[1.02] z-10' : ''} ${isJustPurchased ? 'animate-unlock' : ''}`}
                >
                  <div className={`absolute inset-0 rounded-[2rem] border-2 transition-all duration-500 ${isEquipped ? 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : rarityStyle.cardGlow}`}></div>
                  
                  {isJustPurchased && (
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] z-50 rounded-[2rem] flex items-center justify-center pointer-events-none">
                      <div className="bg-amber-400 text-amber-950 font-black text-2xl px-6 py-2 rounded-xl shadow-[0_0_50px_rgba(251,191,36,1)] -rotate-6 scale-125">
                        UNLOCKED!
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-900/90 h-full rounded-[1.8rem] p-6 sm:p-8 flex flex-col relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${rarityStyle.badge}`}>
                        <RarityIcon className="w-3.5 h-3.5 mr-1.5" /> {border.rarity}
                      </div>
                      <div>
                        {isEquipped ? (
                          <span className="bg-amber-500 text-amber-950 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)]">Equipped</span>
                        ) : isUnlocked ? (
                          <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border border-slate-700">Owned</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="h-44 w-full bg-slate-950/50 rounded-2xl mb-6 flex items-center justify-center border border-slate-800 relative overflow-hidden group-hover:bg-slate-950/80 transition-colors shadow-inner">
                      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                      <div className="transform group-hover:scale-110 transition-transform duration-500">
                        <AvatarWithBorder avatarUrl={null} borderId={border.id} sizeClasses="w-28 h-28" />
                      </div>
                    </div>

                    <div className="mb-8 flex-grow text-center">
                      <h3 className={`text-2xl font-black leading-tight mb-2 ${rarityStyle.text}`}>{border.name}</h3>
                      <p className="text-sm font-medium text-slate-400 leading-relaxed px-2">{border.desc}</p>
                    </div>

                    <button 
                      disabled={isProcessingTx || isUnverified || isEquipped || isJustPurchased}
                      onClick={() => handlePurchaseOrEquip(border, false)}
                      className={`w-full py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${
                        isEquipped 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                          : isUnlocked || border.price === 0
                            ? 'bg-slate-100 text-slate-900 hover:bg-white hover:-translate-y-0.5 shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                            : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 hover:from-amber-400 hover:to-yellow-300 hover:-translate-y-0.5 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                      }`}
                    >
                      {isEquipped ? (
                        <><CheckCircle2 className="w-5 h-5" /> Equipped</>
                      ) : isUnlocked || border.price === 0 ? (
                        'Equip Border'
                      ) : (
                        <>
                          Unlock for <ChasedCash className="w-7 h-5 ml-1" /> {border.price}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB CONTENT: CONSUMABLES (BOOSTS) */}
        {activeTab === 'consumables' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-in fade-in duration-500">
            {SHOP_CONSUMABLES.map((item) => {
              const isJustPurchased = justPurchased === item.id;
              const rarityStyle = getRarityConfig(item.rarity);
              const RarityIcon = rarityStyle.icon;

              return (
                <div 
                  key={item.id} 
                  className={`bg-slate-900/80 backdrop-blur-sm rounded-[2rem] p-1 transition-all duration-500 relative flex flex-col group ${isJustPurchased ? 'animate-unlock' : ''}`}
                >
                  <div className={`absolute inset-0 rounded-[2rem] border-2 transition-all duration-500 ${rarityStyle.cardGlow}`}></div>
                  
                  {isJustPurchased && (
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] z-50 rounded-[2rem] flex items-center justify-center pointer-events-none">
                      <div className="bg-amber-400 text-amber-950 font-black text-2xl px-6 py-2 rounded-xl shadow-[0_0_50px_rgba(251,191,36,1)] -rotate-6 scale-125">
                        PURCHASED!
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-900/90 h-full rounded-[1.8rem] p-6 sm:p-8 flex flex-col relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${rarityStyle.badge}`}>
                        <RarityIcon className="w-3.5 h-3.5 mr-1.5" /> {item.rarity}
                      </div>
                    </div>

                    <div className="h-44 w-full bg-slate-950/50 rounded-2xl mb-6 flex flex-col items-center justify-center border border-slate-800 relative overflow-hidden group-hover:bg-slate-950/80 transition-colors shadow-inner">
                      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                      <Zap className={`w-16 h-16 mb-2 transform group-hover:scale-110 transition-transform duration-500 ${rarityStyle.text}`} />
                      <span className="text-white font-black text-xl">+{item.amount}</span>
                    </div>

                    <div className="mb-8 flex-grow text-center">
                      <h3 className={`text-2xl font-black leading-tight mb-2 text-white`}>{item.name}</h3>
                      <p className="text-sm font-medium text-slate-400 leading-relaxed px-2">{item.desc}</p>
                    </div>

                    <button 
                      disabled={isProcessingTx || isUnverified || isJustPurchased || userCoins < item.price}
                      onClick={() => handlePurchaseOrEquip(item, true)}
                      className={`w-full py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${
                        userCoins < item.price
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                          : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 hover:from-amber-400 hover:to-yellow-300 hover:-translate-y-0.5 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                      }`}
                    >
                      {userCoins < item.price ? (
                        'Not Enough Cash'
                      ) : (
                        <>
                          Buy for <ChasedCash className="w-7 h-5 ml-1" /> {item.price}
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