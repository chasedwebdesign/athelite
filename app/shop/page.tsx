'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, Lock, AlertCircle, X, Store, Activity, 
  Sparkles, Flame, Gem, Shield, Crown, Image as ImageIcon, 
  ArrowRight, Hexagon, RefreshCcw, Coins, Zap, 
  MousePointerClick, TrendingUp, PackageSearch, BatteryCharging,
  Crosshair, Fingerprint, HelpCircle, Gift, Package, LayoutTemplate
} from 'lucide-react';
import Link from 'next/link';

import { Points } from '@/components/Points'; 
import { AvatarWithBorder } from '@/components/AnimatedBorders'; 
import { LootBoxVisual } from '@/components/LootBoxVisual';

// --- LOOT BOX ITEM INTERFACE ---
type ShopItem = {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Exotic';
  desc: string;
  type: 'card' | 'border';
  isPremium?: boolean;
};

// --- GAMIFIED SHOP INVENTORIES ---
const SHOP_CARDS: ShopItem[] = [
  { id: 'base', name: 'Standard Slate', rarity: 'Common', desc: 'The clean, minimal starting layout.', isPremium: false, type: 'card' },
  { id: 'obsidian', name: 'Obsidian Stealth', rarity: 'Epic', desc: 'Deep, dark, matte black metallic finish.', isPremium: false, type: 'card' },
  { id: 'crimson', name: 'Crimson Flare', rarity: 'Epic', desc: 'A burning red metallic sheen.', isPremium: false, type: 'card' },
  { id: 'sapphire', name: 'Sapphire Ocean', rarity: 'Epic', desc: 'Deep aquatic blue metallic finish.', isPremium: false, type: 'card' },
  { id: 'hype', name: 'Holo Classic', rarity: 'Legendary', desc: 'The legendary iridescent foil.', isPremium: false, type: 'card' },
  { id: 'amethyst', name: 'Amethyst Void', rarity: 'Legendary', desc: 'Rich, vibrating purple energy.', isPremium: false, type: 'card' },
  { id: 'mythic-flare', name: 'Celestial Void', rarity: 'Mythic', desc: 'A swirling singularity of pure cosmic power.', isPremium: false, type: 'card' },
  { id: 'cyber', name: 'Neon Cyber', rarity: 'Exotic', desc: 'High-voltage toxic green and cyan.', isPremium: false, type: 'card' },
  { id: 'premium', name: 'Chased Gold', rarity: 'Exotic', desc: 'Exclusive 24k gold foil. Pro Members only.', isPremium: true, type: 'card' },
];

const SHOP_BORDERS: ShopItem[] = [
  { id: 'none', name: 'Standard Profile', rarity: 'Common', desc: 'The classic, clean athlete look.', type: 'border' },
  { id: 'pioneer', name: 'The Pioneer', rarity: 'Epic', desc: 'Exclusive Early Adopter HUD Scanner.', type: 'border' },
  { id: 'border-blue-500', name: 'Sapphire Strike', rarity: 'Rare', desc: 'A sharp, focused blue energy rim.', type: 'border' },
  { id: 'border-red-500', name: 'Crimson Phantom', rarity: 'Rare', desc: 'Intimidating red aura.', type: 'border' },
  { id: 'border-emerald-400', name: 'Neon Pulse', rarity: 'Rare', desc: 'Bright, energetic green boundary.', type: 'border' },
  { id: 'animated-silver', name: 'Silver Crest', rarity: 'Epic', desc: 'Shimmering metallic finish for medalists.', type: 'border' },
  { id: 'toxic-slime', name: 'Toxic Slime', rarity: 'Epic', desc: 'Bubbling, radioactive green ooze.', type: 'border' },
  { id: 'glacial-frost', name: 'Glacial Frost', rarity: 'Epic', desc: 'Shattered ice with a freezing aura.', type: 'border' },
  { id: 'animated-gold', name: 'Gold Crest', rarity: 'Epic', desc: 'Pure animated gold. For the champions.', type: 'border' },
  { id: 'animated-diamond', name: 'Diamond Crest', rarity: 'Legendary', desc: 'Flawless, icy perfection. Highly respected.', type: 'border' },
  { id: 'cyber-matrix', name: 'Cyber Matrix', rarity: 'Legendary', desc: 'Digital rain scanner. Enter the system.', type: 'border' },
  { id: 'synthwave', name: 'Synthwave Vapor', rarity: 'Legendary', desc: 'Retro neon pink and cyan aesthetics.', type: 'border' },
  { id: 'neon-glitch', name: 'Neon Glitch', rarity: 'Legendary', desc: 'Unstable cyberpunk aesthetic.', type: 'border' },
  { id: 'ethereal-cosmos', name: 'Ethereal Cosmos', rarity: 'Mythic', desc: 'Harness the energy of a dying star.', type: 'border' },
  { id: 'molten-core', name: 'Molten Core', rarity: 'Mythic', desc: 'Cracked earth leaking pulsating magma.', type: 'border' },
  { id: 'fire', name: 'Inferno', rarity: 'Mythic', desc: 'Blazing with pure, uncontainable heat.', type: 'border' },
  { id: 'abyssal-void', name: 'Abyssal Void', rarity: 'Exotic', desc: 'A singularity that consumes light and competition.', type: 'border' },
  { id: 'celestial-radiance', name: 'Celestial Radiance', rarity: 'Exotic', desc: 'Biblically accurate speed. The ultimate flex.', type: 'border' },
];

const ALL_ITEMS: ShopItem[] = [...SHOP_CARDS, ...SHOP_BORDERS] as ShopItem[];

// --- BOX THEMES & CONFIGURATION ---
const BOX_THEMES = {
  standard: {
    bg: 'bg-slate-900',
    border: 'border-slate-700',
    glow: 'shadow-[0_0_30px_rgba(148,163,184,0.1)]',
    hoverGlow: 'group-hover:shadow-[0_0_40px_rgba(148,163,184,0.3)]',
    iconColor: 'text-slate-300',
    btnGradient: 'from-slate-700 to-slate-600',
    btnHover: 'hover:from-slate-600 hover:to-slate-500'
  },
  premium: {
    bg: 'bg-indigo-950/80',
    border: 'border-indigo-500/40',
    glow: 'shadow-[0_0_30px_rgba(99,102,241,0.15)]',
    hoverGlow: 'group-hover:shadow-[0_0_50px_rgba(99,102,241,0.4)]',
    iconColor: 'text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]',
    btnGradient: 'from-indigo-600 to-blue-600',
    btnHover: 'hover:from-indigo-500 hover:to-blue-500'
  },
  ultra: {
    bg: 'bg-amber-950/80',
    border: 'border-amber-500/40',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
    hoverGlow: 'group-hover:shadow-[0_0_60px_rgba(245,158,11,0.5)]',
    iconColor: 'text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.9)]',
    btnGradient: 'from-amber-500 to-orange-600',
    btnHover: 'hover:from-amber-400 hover:to-orange-500 text-amber-950'
  }
};

const CARD_BOXES = [
  {
    id: 'standard_card', itemType: 'card', name: 'Standard Background', price: 50, pityMax: 30,
    tier: 'standard' as const, theme: BOX_THEMES.standard, icon: ImageIcon,
    desc: 'Base backgrounds. Solid chance for Commons and Rares. Rare chance for Exotic.',
    rates: { Common: 60, Rare: 30, Epic: 9, Legendary: 0.5, Mythic: 0, Exotic: 0.5 }
  },
  {
    id: 'premium_card', itemType: 'card', name: 'Premium Background', price: 100, pityMax: 15,
    tier: 'premium' as const, theme: BOX_THEMES.premium, icon: Sparkles,
    desc: 'Guaranteed Rare or higher. Boosted odds for Epics, Legendaries, and Exotics.',
    rates: { Common: 0, Rare: 45, Epic: 40, Legendary: 11.5, Mythic: 2, Exotic: 1.5 }
  },
  {
    id: 'ultra_card', itemType: 'card', name: 'Ultra Background Vault', price: 200, pityMax: 8,
    tier: 'ultra' as const, theme: BOX_THEMES.ultra, icon: Crown,
    desc: 'High roller. Massive chances for Legendaries, Mythics, and Exotics.',
    rates: { Common: 0, Rare: 0, Epic: 40, Legendary: 42, Mythic: 15, Exotic: 3 }
  }
];

const BORDER_BOXES = [
  {
    id: 'standard_border', itemType: 'border', name: 'Standard Border', price: 50, pityMax: 30,
    tier: 'standard' as const, theme: BOX_THEMES.standard, icon: Hexagon,
    desc: 'Base cosmetics. Solid chance for Commons and Rares. Rare chance for Exotic.',
    rates: { Common: 60, Rare: 30, Epic: 9, Legendary: 0.5, Mythic: 0, Exotic: 0.5 }
  },
  {
    id: 'premium_border', itemType: 'border', name: 'Premium Border', price: 100, pityMax: 15,
    tier: 'premium' as const, theme: BOX_THEMES.premium, icon: Shield,
    desc: 'Guaranteed Rare or higher. Boosted odds for Epics, Legendaries, and Exotics.',
    rates: { Common: 0, Rare: 45, Epic: 40, Legendary: 11.5, Mythic: 2, Exotic: 1.5 }
  },
  {
    id: 'ultra_border', itemType: 'border', name: 'Ultra Border Vault', price: 200, pityMax: 8,
    tier: 'ultra' as const, theme: BOX_THEMES.ultra, icon: Flame,
    desc: 'High roller. Massive chances for Legendaries, Mythics, and Exotics.',
    rates: { Common: 0, Rare: 0, Epic: 40, Legendary: 42, Mythic: 15, Exotic: 3 }
  }
];

const getRarityConfig = (rarity: string) => {
  switch(rarity) {
    case 'Common': return { badge: 'bg-slate-800 text-slate-300 border-slate-600', cardGlow: 'hover:shadow-[0_0_30px_rgba(148,163,184,0.2)] border-slate-800 hover:border-slate-500', icon: Activity, text: 'text-slate-300', teaseColor: 'rgba(148,163,184,0.8)', salvageValue: 15, bgFx: 'bg-slate-900' };
    case 'Rare': return { badge: 'bg-blue-900/50 text-blue-400 border-blue-700', cardGlow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.3)] border-slate-800 hover:border-blue-500', icon: Shield, text: 'text-blue-400', teaseColor: 'rgba(59,130,246,0.8)', salvageValue: 25, bgFx: 'bg-blue-950' };
    case 'Epic': return { badge: 'bg-purple-900/50 text-purple-400 border-purple-700', cardGlow: 'hover:shadow-[0_0_45px_rgba(168,85,247,0.4)] border-slate-800 hover:border-purple-500', icon: Sparkles, text: 'text-purple-400', teaseColor: 'rgba(168,85,247,0.8)', salvageValue: 50, bgFx: 'bg-purple-950' };
    case 'Legendary': return { badge: 'bg-amber-900/50 text-amber-400 border-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.2)]', cardGlow: 'shadow-[0_0_15px_rgba(251,191,36,0.1)] hover:shadow-[0_0_50px_rgba(251,191,36,0.4)] border-amber-900/40 hover:border-amber-500', icon: Gem, text: 'text-amber-400', teaseColor: 'rgba(251,191,36,0.9)', salvageValue: 100, bgFx: 'bg-amber-950' };
    case 'Mythic': return { badge: 'bg-red-900/50 text-red-400 border-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]', cardGlow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_60px_rgba(239,68,68,0.5)] border-red-900/50 hover:border-red-500', icon: Flame, text: 'text-red-400', teaseColor: 'rgba(239,68,68,1)', salvageValue: 250, bgFx: 'bg-red-950' };
    case 'Exotic': return { badge: 'bg-gradient-to-r from-fuchsia-600 via-cyan-600 to-fuchsia-600 text-white border-transparent bg-[length:200%_auto] animate-[shimmerSlow_3s_linear_infinite] shadow-[0_0_15px_rgba(217,70,239,0.5)]', cardGlow: 'shadow-[0_0_30px_rgba(217,70,239,0.2)] hover:shadow-[0_0_70px_rgba(34,211,238,0.5)] border-fuchsia-500/50 hover:border-cyan-400', icon: Crown, text: 'bg-gradient-to-r from-fuchsia-400 to-cyan-400 text-transparent bg-clip-text', teaseColor: 'rgba(217,70,239,1)', salvageValue: 500, bgFx: 'bg-fuchsia-950' };
    default: return { badge: 'bg-slate-800 text-slate-400 border-slate-700', cardGlow: 'hover:shadow-2xl hover:border-slate-600', icon: Activity, text: 'text-slate-300', teaseColor: 'rgba(255,255,255,0.5)', salvageValue: 10, bgFx: 'bg-slate-900' };
  }
};

const getHypedRarityBadge = (rarity: string) => {
  switch(rarity) {
    case 'Epic': return 'text-xs px-5 py-2 tracking-[0.15em] shadow-[0_0_20px_rgba(168,85,247,0.6)] scale-105';
    case 'Legendary': return 'text-sm px-6 py-2 tracking-[0.2em] shadow-[0_0_30px_rgba(251,191,36,0.7)] scale-110';
    case 'Mythic': return 'text-sm px-8 py-2.5 tracking-[0.25em] shadow-[0_0_40px_rgba(239,68,68,0.8)] scale-110 animate-pulse';
    case 'Exotic': return 'text-base px-8 py-2.5 tracking-[0.3em] shadow-[0_0_50px_rgba(217,70,239,0.9)] scale-125';
    default: return 'text-xs px-4 py-1.5 tracking-widest';
  }
};

const triggerVibration = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Safely ignore if browser restricts
    }
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
  
  // Economy & Inventory
  const [userCoins, setUserCoins] = useState<number>(0);
  
  // Comprehensive Box Inventory Tracker
  const [boxInventory, setBoxInventory] = useState<Record<string, number>>({
    standard_card: 0, standard_border: 0,
    premium_card: 0, premium_border: 0,
    ultra_card: 0, ultra_border: 0
  });
  
  const [showClaimModal, setShowClaimModal] = useState(false);

  const [unlockedBorders, setUnlockedBorders] = useState<string[]>(['none']);
  const [equippedBorder, setEquippedBorder] = useState<string>('none');
  const [unlockedCards, setUnlockedCards] = useState<string[]>(['base']);
  const [equippedCard, setEquippedCard] = useState<string>('base');
  
  const [duplicateCards, setDuplicateCards] = useState<string[]>([]);
  const [duplicateBorders, setDuplicateBorders] = useState<string[]>([]);
  
  const [boxPity, setBoxPity] = useState<Record<string, number>>({});

  // UI State
  const [activeTab, setActiveTab] = useState<'boxes' | 'cards' | 'borders'>('boxes');
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'salvage' } | null>(null);
  const [selectedRatesBox, setSelectedRatesBox] = useState<any | null>(null);

  // Gamified Unboxing Animation State
  const [openingBox, setOpeningBox] = useState<any | null>(null);
  const [revealStage, setRevealStage] = useState<'idle' | 'ambient_charge' | 'bounce_vibrate' | 'flash' | 'card_back' | 'reveal_flip' | 'fake_glitch' | 'true_reveal'>('idle');
  const [isFastForward, setIsFastForward] = useState(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  
  const [revealedItem, setRevealedItem] = useState<{ 
    item: ShopItem, 
    fakeItem?: ShopItem | null, 
    isDuplicate: boolean, 
    salvageEarned?: number, 
    isFakeOut: boolean 
  } | null>(null);
  
  const [teaseColor, setTeaseColor] = useState<string>('');

  const showToast = (message: string, type: 'error' | 'success' | 'salvage' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
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
        .select(`
          id, avatar_url, trust_level, is_premium, coins, 
          unlocked_borders, equipped_border, unlocked_cards, equipped_card,
          duplicate_cards, duplicate_borders, box_pity, 
          standard_card_boxes, standard_border_boxes,
          premium_card_boxes, premium_border_boxes,
          ultra_card_boxes, ultra_border_boxes
        `)
        .eq('id', session.user.id)
        .maybeSingle();

      if (aData) {
        setAthleteId(aData.id);
        setAvatarUrl(aData.avatar_url);
        setIsUnverified(aData.trust_level === 0);
        setIsPremium(aData.is_premium || false);
        setUserCoins(aData.coins || 0);
        
        // Track All Inventory Tiers
        const currentInventory = {
          standard_card: aData.standard_card_boxes || 0,
          standard_border: aData.standard_border_boxes || 0,
          premium_card: aData.premium_card_boxes || 0,
          premium_border: aData.premium_border_boxes || 0,
          ultra_card: aData.ultra_card_boxes || 0,
          ultra_border: aData.ultra_border_boxes || 0,
        };
        setBoxInventory(currentInventory);

        // Trigger mobile-friendly claim modal if boxes are waiting
        const totalFreeBoxes = Object.values(currentInventory).reduce((acc, curr) => acc + curr, 0);
        if (totalFreeBoxes > 0) {
           setShowClaimModal(true);
        }
        
        setUnlockedBorders(aData.unlocked_borders || ['none']);
        setEquippedBorder(aData.equipped_border || 'none');
        
        let dbCard = aData.equipped_card || 'base';
        if (dbCard === 'default') dbCard = 'base';
        let dbUnlockedCards = aData.unlocked_cards || ['base'];
        if (dbUnlockedCards.includes('default')) dbUnlockedCards = dbUnlockedCards.map((c: string) => c === 'default' ? 'base' : c);

        setUnlockedCards(dbUnlockedCards);
        setEquippedCard(dbCard);
        setDuplicateCards(aData.duplicate_cards || []);
        setDuplicateBorders(aData.duplicate_borders || []);
        
        setBoxPity(aData.box_pity || {});
      }
      setLoading(false);
    }
    loadShopData();
  }, [supabase, router]);

  const rollRarity = (baseRates: any, isPityHit: boolean) => {
    if (isPityHit) {
       const guaranteedRates = { Mythic: 85, Exotic: 15 };
       const rand = Math.random() * 100;
       let cumulative = 0;
       for (const [rarity, chance] of Object.entries(guaranteedRates)) {
         cumulative += (chance as number);
         if (rand <= cumulative) return rarity as ShopItem['rarity'];
       }
       return 'Mythic';
    }

    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const [rarity, chance] of Object.entries(baseRates)) {
      cumulative += (chance as number);
      if (rand <= cumulative) return rarity as ShopItem['rarity'];
    }
    return 'Common';
  };

  const getCascadedRolledItem = (targetRarity: string, itemType: 'card' | 'border', isUserPremium: boolean) => {
    const rarityHierarchy = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Exotic'];
    const targetIdx = rarityHierarchy.indexOf(targetRarity);

    let pool = ALL_ITEMS.filter(i => i.rarity === targetRarity && i.type === itemType && (!i.isPremium || isUserPremium));
    if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];

    for (let i = targetIdx - 1; i >= 0; i--) {
      pool = ALL_ITEMS.filter(item => item.rarity === rarityHierarchy[i] && item.type === itemType && (!item.isPremium || isUserPremium));
      if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
    }

    for (let i = targetIdx + 1; i < rarityHierarchy.length; i++) {
      pool = ALL_ITEMS.filter(item => item.rarity === rarityHierarchy[i] && item.type === itemType && (!item.isPremium || isUserPremium));
      if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
    }

    pool = ALL_ITEMS.filter(item => item.type === itemType && (!item.isPremium || isUserPremium));
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const handlePurchaseBox = async (box: any) => {
    if (!athleteId || isUnverified) {
      showToast("You must verify your profile on the dashboard to open Loot Boxes.", "error");
      return;
    }

    const freeCount = boxInventory[box.id] || 0;
    const isFreeBox = freeCount > 0;

    if (!isFreeBox && userCoins < box.price) {
      showToast("Not enough Points! Hit some PRs or login daily to earn more.", "error");
      return;
    }

    setIsProcessingTx(true);

    try {
      const currentPity = boxPity[box.id] || 0;
      const isPityHit = currentPity + 1 >= box.pityMax;

      const targetRarity = rollRarity(box.rates, isPityHit);
      const rolledItem = getCascadedRolledItem(targetRarity, box.itemType, isPremium);
      const actualRarity = rolledItem.rarity;
      const config = getRarityConfig(actualRarity);
      
      setTeaseColor(config.teaseColor);

      const isHighTier = ['Legendary', 'Mythic', 'Exotic'].includes(actualRarity);
      const triggerFakeOut = isHighTier && Math.random() < 0.35; 
      let fakeItem: ShopItem | null = null;

      if (triggerFakeOut) {
         let rarePool = ALL_ITEMS.filter(i => i.rarity === 'Rare' && i.type === rolledItem.type);
         if (rarePool.length === 0) {
            rarePool = ALL_ITEMS.filter(i => (i.rarity === 'Common' || i.rarity === 'Epic') && i.type === rolledItem.type);
         }
         fakeItem = rarePool[Math.floor(Math.random() * rarePool.length)] || ALL_ITEMS.find(i => i.type === rolledItem.type) || ALL_ITEMS[0];
      }

      let nextPityValue = isPityHit ? 0 : currentPity + 1;
      const updatedBoxPity = { ...boxPity };
      
      if (nextPityValue === 0) {
          delete updatedBoxPity[box.id];
      } else {
          updatedBoxPity[box.id] = nextPityValue;
      }
      
      setBoxPity(updatedBoxPity);

      const isDuplicateCard = rolledItem.type === 'card' && unlockedCards.includes(rolledItem.id);
      const isDuplicateBorder = rolledItem.type === 'border' && unlockedBorders.includes(rolledItem.id);
      const isDuplicate = isDuplicateCard || isDuplicateBorder;
      const salvageEarned = isDuplicate ? config.salvageValue : 0;

      const newBalance = isFreeBox ? userCoins : userCoins - box.price;
      if (!isFreeBox) setUserCoins(newBalance);

      let nextCards = [...unlockedCards];
      let nextBorders = [...unlockedBorders];
      let nextDupCards = [...duplicateCards];
      let nextDupBorders = [...duplicateBorders];

      const updatePayload: any = {
        coins: newBalance,
        box_pity: updatedBoxPity
      };

      // Handle Free Inventory Deduction Dynamically
      if (isFreeBox) {
        updatePayload[`${box.id}_boxes`] = freeCount - 1;
        setBoxInventory(prev => ({ ...prev, [box.id]: prev[box.id] - 1 }));
      }

      if (isDuplicate) {
        if (rolledItem.type === 'card') {
          nextDupCards.push(rolledItem.id);
          setDuplicateCards(nextDupCards);
        } else {
          nextDupBorders.push(rolledItem.id);
          setDuplicateBorders(nextDupBorders);
        }
        updatePayload.duplicate_cards = nextDupCards;
        updatePayload.duplicate_borders = nextDupBorders;
      } else {
        if (rolledItem.type === 'card') {
          nextCards.push(rolledItem.id);
          setUnlockedCards(nextCards);
          updatePayload.unlocked_cards = nextCards;
        } else {
          nextBorders.push(rolledItem.id);
          setUnlockedBorders(nextBorders);
          updatePayload.unlocked_borders = nextBorders;
        }
      }

      const { error: dbError } = await supabase.from('athletes').update(updatePayload).eq('id', athleteId);
      if (dbError) throw dbError;

      triggerVibration([
        50, 400, 50, 400, 50, 200,
        100, 200, 150, 200, 250, 100, 400 
      ]);

      setRevealedItem({ item: rolledItem, fakeItem, isDuplicate, salvageEarned, isFakeOut: triggerFakeOut });
      setOpeningBox({ ...box, snapshotPity: currentPity });
      setIsFastForward(false);
      setRevealStage('ambient_charge'); 

      const t1 = setTimeout(() => setRevealStage('bounce_vibrate'), 1200); 
      const t2 = setTimeout(() => setRevealStage('flash'), 3000); 
      const t3 = setTimeout(() => setRevealStage('card_back'), 3200); 
      timeoutRefs.current = [t1, t2, t3];

      setIsProcessingTx(false);

    } catch (err: any) {
      showToast(`Transaction failed: ${err.message}`, "error");
      setIsProcessingTx(false);
      setOpeningBox(null);
      setRevealStage('idle');
    }
  };

  const handleRecycleDuplicate = async (item: ShopItem) => {
    if (!athleteId || isProcessingTx) return;
    setIsProcessingTx(true);

    try {
      const config = getRarityConfig(item.rarity);
      const rewardCoins = config.salvageValue;

      let nextDupCards = [...duplicateCards];
      let nextDupBorders = [...duplicateBorders];

      if (item.type === 'card') {
        const idx = nextDupCards.indexOf(item.id);
        if (idx !== -1) nextDupCards.splice(idx, 1);
      } else {
        const idx = nextDupBorders.indexOf(item.id);
        if (idx !== -1) nextDupBorders.splice(idx, 1);
      }

      const newBalance = userCoins + rewardCoins;

      setDuplicateCards(nextDupCards);
      setDuplicateBorders(nextDupBorders);
      setUserCoins(newBalance);

      const { error } = await supabase
        .from('athletes')
        .update({
          coins: newBalance,
          duplicate_cards: nextDupCards,
          duplicate_borders: nextDupBorders
        })
        .eq('id', athleteId);

      if (error) throw error;

      showToast(`Recycled duplicate for +${rewardCoins} Points!`, 'salvage');
    } catch (err: any) {
      showToast(`Recycle failed: ${err.message}`, 'error');
    } finally {
      setIsProcessingTx(false);
    }
  };

  const handleRecycleAllDuplicates = async () => {
    if (!athleteId || isProcessingTx) return;
    if (duplicateCards.length === 0 && duplicateBorders.length === 0) return;

    setIsProcessingTx(true);

    try {
      let totalEarned = 0;

      duplicateCards.forEach(id => {
        const item = ALL_ITEMS.find(i => i.id === id && i.type === 'card');
        if (item) totalEarned += getRarityConfig(item.rarity).salvageValue;
      });

      duplicateBorders.forEach(id => {
        const item = ALL_ITEMS.find(i => i.id === id && i.type === 'border');
        if (item) totalEarned += getRarityConfig(item.rarity).salvageValue;
      });

      const newBalance = userCoins + totalEarned;

      setDuplicateCards([]);
      setDuplicateBorders([]);
      setUserCoins(newBalance);

      const { error } = await supabase
        .from('athletes')
        .update({
          coins: newBalance,
          duplicate_cards: [],
          duplicate_borders: []
        })
        .eq('id', athleteId);

      if (error) throw error;

      showToast(`Recycled all duplicates for +${totalEarned} Points!`, 'salvage');
    } catch (err: any) {
      showToast(`Recycle failed: ${err.message}`, 'error');
    } finally {
      setIsProcessingTx(false);
    }
  };

  const handleFastForward = () => {
      if (['ambient_charge', 'bounce_vibrate'].includes(revealStage)) {
          triggerVibration([0]); 
          triggerVibration([100, 50, 200]); 
          
          timeoutRefs.current.forEach(clearTimeout);
          timeoutRefs.current = [];
          setIsFastForward(true);
          setRevealStage('flash');
          setTimeout(() => setRevealStage('card_back'), 250);
      }
  };

  const executeFlip = () => {
      if (revealStage !== 'card_back') return;
      triggerVibration([50, 100, 150]); 
      
      if (revealedItem?.isFakeOut) {
          setRevealStage('reveal_flip');
          setTeaseColor(getRarityConfig(revealedItem.fakeItem?.rarity || 'Rare').teaseColor); 
          setTimeout(() => {
              triggerVibration(300); 
              setRevealStage('fake_glitch');
          }, 1500); 
          setTimeout(() => {
              setTeaseColor(getRarityConfig(revealedItem.item.rarity).teaseColor); 
              setRevealStage('flash'); 
          }, 2300); 
          setTimeout(() => finalReveal(), 2500); 
      } else {
          finalReveal(); 
      }
  };

  const finalReveal = () => {
       setRevealStage('true_reveal');
       triggerVibration(400); 
  };

  const handleEquipItem = async (item: ShopItem) => {
    setIsProcessingTx(true);
    try {
      if (item.type === 'border') {
        const { error } = await supabase.from('athletes').update({ equipped_border: item.id }).eq('id', athleteId);
        if (error) throw error;
        setEquippedBorder(item.id);
      } else {
        const { error } = await supabase.from('athletes').update({ equipped_card: item.id }).eq('id', athleteId);
        if (error) throw error;
        setEquippedCard(item.id);
      }
      showToast(`Equipped ${item.name}!`, "success");
      setRevealedItem(null);
      setOpeningBox(null);
      setRevealStage('idle');
    } catch (err: any) {
      showToast(`Failed to equip: ${err.message}`, "error");
    } finally {
      setIsProcessingTx(false);
    }
  };

  const closeUnboxingModal = () => {
    timeoutRefs.current.forEach(clearTimeout);
    triggerVibration([0]);
    setRevealedItem(null);
    setOpeningBox(null);
    setRevealStage('idle');
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
    const isAnimated = ['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber', 'mythic-flare'].includes(cardId);
    return {
        bgClass: cardId === 'base' ? 'bg-white/[0.02]' : `holo-card-${cardId}`,
        isAnimated: isAnimated,
        borderClass: cardId === 'base' ? 'border-white/5 hover:border-white/10' : 'border-white/20 shadow-xl'
    };
  };
  
  const itemToRender = revealStage === 'fake_glitch' || (revealStage === 'reveal_flip' && revealedItem?.isFakeOut) 
    ? revealedItem?.fakeItem 
    : revealedItem?.item;

  const isShowingRealItem = !revealedItem?.isFakeOut || revealStage === 'true_reveal';

  const renderBoxCard = (box: any) => {
    // Inventory Overrides
    const freeCount = boxInventory[box.id] || 0;
    const isFreeBox = freeCount > 0;
    
    const canAfford = isFreeBox || userCoins >= box.price;
    const currentPity = boxPity[box.id] || 0;
    const boxesLeft = box.pityMax - currentPity;
    const isPityFull = boxesLeft <= 1;
    
    return (
      <div key={box.id} className={`${box.theme.bg} backdrop-blur-md rounded-[3rem] p-1.5 transition-all duration-500 relative flex flex-col group hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] ${isFreeBox ? 'ring-2 ring-emerald-400 ring-offset-4 ring-offset-slate-950 shadow-[0_0_40px_rgba(52,211,153,0.3)]' : ''}`}>
          <div className={`absolute inset-0 rounded-[3rem] border-2 transition-all duration-500 ${box.theme.border} ${box.theme.glow} ${box.theme.hoverGlow} opacity-50 group-hover:opacity-100`}></div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedRatesBox(box); }}
            className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-all border border-slate-700/60 z-30 shadow-lg hover:scale-110 active:scale-95"
            title="View Odds & Probability Breakdown"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="bg-slate-900/90 h-full rounded-[2.7rem] p-8 flex flex-col relative z-10 border border-white/5">
            <div className="animate-float h-56 w-full rounded-[2rem] mb-8 flex items-center justify-center border border-white/10 shadow-inner relative overflow-hidden group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-500 bg-slate-950">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05] mix-blend-overlay"></div>
                <div className="absolute inset-0 flex items-center justify-center scale-[1] group-hover:scale-75 transition-all duration-700 group-hover:rotate-6">
                    <LootBoxVisual tier={box.tier} />
                </div>
            </div>

            <div className="mb-6 flex-grow text-center">
                <h3 className="text-3xl font-black leading-tight mb-2 text-white text-balance break-words">{box.name}</h3>
                <p className="text-sm font-medium text-slate-400 leading-relaxed px-2">{box.desc}</p>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 mb-4 border border-slate-800 relative overflow-hidden">
                <div className="flex justify-start items-center mb-2 relative z-10">
                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isPityFull ? 'text-fuchsia-400 animate-pulse' : 'text-amber-400'}`}>
                        {isPityFull ? <Zap className="w-3 h-3"/> : <Crown className="w-3 h-3"/>}
                        {isPityFull ? 'GUARANTEED MYTHIC NEXT' : `${boxesLeft} Box${boxesLeft === 1 ? '' : 'es'} Until Mythic`}
                    </span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative z-10">
                    <div 
                      className={`h-full transition-all duration-300 ${isPityFull ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]' : 'bg-amber-500'}`} 
                      style={{ width: `${Math.min((currentPity / box.pityMax) * 100, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* We allow unverified users to click through so the toast can trigger */}
            <button 
              disabled={isProcessingTx || openingBox !== null || (!isUnverified && !canAfford)}
              onClick={() => handlePurchaseBox(box)}
              className={`w-full py-5 rounded-2xl font-black transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
                isUnverified
                  ? 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-500 border border-slate-700 active:scale-95'
                  : isFreeBox
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white shadow-[0_0_20px_rgba(52,211,153,0.3)] active:scale-95'
                  : canAfford 
                    ? `bg-gradient-to-r text-white ${box.theme.btnGradient} ${box.theme.btnHover} active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]`
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {isUnverified ? (
                  <><Lock className="w-5 h-5"/> Verify to Open</>
              ) : isFreeBox ? (
                  <><Gift className="w-5 h-5"/> Open Free Box ({freeCount})</>
              ) : canAfford ? (
                  <><MousePointerClick className="w-5 h-5"/> Purchase <Points className="w-6 h-4 ml-1" /> {box.price}</>
              ) : (
                  <><Lock className="w-4 h-4"/> Not Enough Points</>
              )}
            </button>
          </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white font-sans pb-32 selection:bg-amber-500/30 overflow-hidden relative">
      
      <style dangerouslySetInnerHTML={{__html: `
        /* 3D CARD FLIP ENGINE */
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .rotate-y-0 { transform: rotateY(0deg); }
        .flip-spring { transition: transform 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

        /* FLOATING IDLE STATE */
        @keyframes box-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.02); }
        }
        .animate-float { animation: box-float 4s ease-in-out infinite; }

        /* VIGNETTE LAYER */
        .vignette-layer { position: absolute; inset: 0; pointer-events: none; transition: box-shadow 0.3s ease; z-index: 10; }
        .tap-2-vignette { box-shadow: inset 0 0 250px rgba(0,0,0,0.95); }

        /* AMBIENT CHARGE */
        @keyframes ambient-charge {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.2); }
        }
        .animate-ambient { animation: ambient-charge 0.6s ease-in-out infinite; transform: scale(1.05); }

        /* CHEST BOUNCE */
        @keyframes box-bounce {
          0% { transform: translateY(0) scale(1.05); filter: brightness(1.2); }
          20% { transform: translateY(-30px) scale(1.1); filter: brightness(1.4); }
          40% { transform: translateY(0) scale(1.05); filter: brightness(1.2); }
          60% { transform: translateY(-15px) scale(1.1); filter: brightness(1.6); }
          80% { transform: translateY(0) scale(1.05); filter: brightness(1.4); }
          100% { transform: translateY(0) scale(1.3); filter: brightness(3); }
        }
        .animate-bounce-chest { 
           animation: box-bounce 1.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards; 
        }

        /* DYNAMIC COLOR FLASHBANG */
        @keyframes flash-bang {
          0% { opacity: 0; background: transparent; backdrop-filter: blur(0px); }
          10% { opacity: 1; background: #ffffff; backdrop-filter: blur(100px); }
          30% { opacity: 1; background: var(--tease-color); backdrop-filter: blur(50px); }
          100% { opacity: 0; background: transparent; backdrop-filter: blur(0px); pointer-events: none; }
        }
        .animate-flash { animation: flash-bang 2s ease-out forwards; pointer-events: none; mix-blend-mode: screen; z-index: 140; }

        /* THE CARD BACK HOVER */
        @keyframes card-float {
           0%, 100% { transform: translateY(0) scale(1); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
           50% { transform: translateY(-15px) scale(1.02); box-shadow: 0 30px 50px rgba(0,0,0,0.7); }
        }
        .card-unopened { animation: card-float 3s ease-in-out infinite; cursor: pointer; }
        .card-unopened:hover { filter: brightness(1.2); }

        /* THE BAIT & SWITCH GLITCH / SHATTER */
        @keyframes glass-shatter {
           0% { transform: scale(1); filter: hue-rotate(0deg); opacity: 1; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
           10% { transform: translate(-20px, 10px) scale(1.1) skewX(30deg); filter: hue-rotate(90deg) brightness(3); box-shadow: -20px 0 0 red, 20px 0 0 cyan; clip-path: polygon(0 10%, 100% 10%, 100% 20%, 0 20%); }
           20% { transform: translate(20px, -10px) scale(0.9) skewX(-30deg); filter: hue-rotate(-90deg); box-shadow: 20px 0 0 red, -20px 0 0 cyan; clip-path: polygon(0 40%, 100% 40%, 100% 60%, 0 60%); }
           30% { transform: translate(-10px, -20px) scale(1.2) skewY(20deg); filter: brightness(4); clip-path: polygon(0 80%, 100% 80%, 100% 100%, 0 100%); }
           100% { transform: scale(0); filter: brightness(10); opacity: 0; clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); }
        }
        .animate-shatter { animation: glass-shatter 0.8s steps(2, end) forwards; z-index: 200; }

        /* THE TRUE REVEAL ESCALATION */
        @keyframes ethereal-reveal {
          0% { transform: scale(0.8) translateY(20px); opacity: 0; filter: drop-shadow(0 0 100px var(--tease-color)) brightness(2); }
          50% { transform: scale(1.1) translateY(-10px); opacity: 1; filter: brightness(1.5); }
          100% { transform: scale(1) translateY(0); opacity: 1; filter: drop-shadow(0 0 20px var(--tease-color)) brightness(1); }
        }
        .animate-reveal { animation: ethereal-reveal 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

        /* GOD RAYS */
        @keyframes spin-rays { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
        .god-rays {
           position: absolute; top: 50%; left: 50%; width: 250vw; height: 250vw;
           background: conic-gradient(from 0deg, transparent 0deg, var(--tease-color) 20deg, transparent 40deg, var(--tease-color) 60deg, transparent 80deg, var(--tease-color) 100deg, transparent 120deg, var(--tease-color) 140deg, transparent 160deg, var(--tease-color) 180deg, transparent 200deg, var(--tease-color) 220deg, transparent 240deg, var(--tease-color) 260deg, transparent 280deg, var(--tease-color) 300deg, transparent 320deg, var(--tease-color) 340deg, transparent 360deg);
           opacity: 0.15; animation: spin-rays 20s linear infinite; pointer-events: none; mix-blend-mode: screen; z-index: 0;
        }

        /* Holographic Foil FX */
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        
        .holo-card-base { background: transparent; }
        .holo-card-obsidian { background: linear-gradient(135deg, #0f172a 0%, #334155 25%, #000000 50%, #0f172a 75%, #1e293b 100%); background-size: 300% 300%; }
        .holo-card-crimson { background: linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #450a0a 100%); background-size: 300% 300%; }
        .holo-card-sapphire { background: linear-gradient(135deg, #172554 0%, #0ea5e9 50%, #172554 100%); background-size: 300% 300%; }
        
        .holo-card-hype { 
          background: 
            linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent 100%),
            linear-gradient(135deg, #4f46e5 0%, #9333ea 25%, #ec4899 50%, #3b82f6 75%, #4f46e5 100%); 
          background-size: 40px 40px, 300% 300%; 
        }
        .holo-card-premium { 
          background: 
            repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px),
            linear-gradient(135deg, #b45309 0%, #f59e0b 25%, #fef08a 50%, #d97706 75%, #78350f 100%); 
          background-size: 100% 100%, 300% 300%; 
        }
        .holo-card-amethyst { background: radial-gradient(circle at 50% 50%, #c026d3 0%, #7e22ce 30%, #3b0764 80%, #000000 100%); }
        .holo-card-cyber { 
          background: linear-gradient(135deg, #022c22 0%, #064e3b 50%, #083344 100%);
          box-shadow: inset 0 0 40px rgba(6, 182, 212, 0.3);
        }
        .holo-card-mythic-flare {
          background: radial-gradient(circle at 50% 50%, #f43f5e 0%, #881337 40%, #000000 100%);
        }
        .animate-foil { animation: foilShift 15s ease-in-out infinite; }
        .holo-glare { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%); background-size: 200% auto; pointer-events: none; mix-blend-mode: overlay;}
      `}} />

      {/* 🚨 DYNAMIC UNCLAIMED LOOT MODAL 🚨 */}
      {showClaimModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-[2rem] w-full max-w-sm shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 sm:p-8 text-center relative">
               <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none"></div>
               <div className="absolute bottom-0 left-0 w-40 h-40 bg-fuchsia-500/10 blur-[40px] rounded-full pointer-events-none"></div>
               
               <Gift className="w-14 h-14 text-emerald-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-bounce-chest" />
               <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Unclaimed Loot!</h3>
               <p className="text-slate-400 font-medium text-sm mb-6">You have unopened free boxes waiting in your inventory. Claim your rewards now!</p>
               
               <div className="grid grid-cols-2 gap-3 mb-8">
                  {Object.entries(boxInventory)
                    .filter(([key, value]) => value > 0)
                    .map(([key, value]) => {
                      // Formatting names to display nicely in the grid
                      const label = key.replace('_', ' ');
                      const isCard = key.includes('card');
                      const Icon = isCard ? Package : LayoutTemplate;
                      return (
                         <div key={key} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                            <Icon className="w-4 h-4 text-emerald-500/50 absolute top-2 left-2" />
                            <span className="text-xl font-black text-white mb-1 z-10">{value}x</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center z-10">
                               {label}
                            </span>
                         </div>
                      );
                  })}
               </div>

               <button 
                 onClick={() => { 
                   setShowClaimModal(false); 
                   setActiveTab('boxes'); 
                   document.getElementById('loot-section')?.scrollIntoView({ behavior: 'smooth' }); 
                 }} 
                 className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform active:scale-[0.98] text-sm flex items-center justify-center gap-2 relative z-10"
               >
                  Open The Vault <ArrowRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md pointer-events-none">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 backdrop-blur-md 
            ${toast.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-200' : 
              toast.type === 'salvage' ? 'bg-amber-950/90 border-amber-500/50 text-amber-200' :
              'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" /> : 
             toast.type === 'salvage' ? <RefreshCcw className="w-5 h-5 shrink-0 mt-0.5 text-amber-400 animate-spin-slow" /> :
             <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />}
            <p className="text-sm font-bold leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      {/* DROP ODDS PROBABILITY MODAL */}
      {selectedRatesBox && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl">
            <button 
              onClick={() => setSelectedRatesBox(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{selectedRatesBox.name} Drop Rates</h3>
                <p className="text-xs text-slate-400 font-medium">Verified loot probabilities per unboxing</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {Object.entries(selectedRatesBox.rates).map(([rarity, rate]) => {
                const config = getRarityConfig(rarity);
                return (
                  <div key={rarity} className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${config.badge}`}>
                      {rarity}
                    </span>
                    <span className="text-sm font-black text-white">
                      {Number(rate)}%
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs font-medium text-indigo-300 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Pity Protection: Opening this box <strong>{selectedRatesBox.pityMax} times</strong> guarantees a Mythic or higher item drop!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FLASHBANG OVERLAY */}
      {['flash', 'true_reveal'].includes(revealStage) && (
         <div 
           className={`fixed inset-0 z-[140] pointer-events-none ${revealStage === 'flash' ? 'animate-flash' : 'opacity-0'}`}
           style={{ '--tease-color': teaseColor } as React.CSSProperties}
         ></div>
      )}

      {/* UNBOXING ANIMATION MODAL */}
      {openingBox && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-transform duration-75`}>
            
           {/* Dark backdrop */}
           <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500 z-0"></div>
           
           {/* Vignette Layer */}
           <div className={`vignette-layer tap-2-vignette`}></div>

           {/* God Rays for High-Tier reveals */}
           {revealStage === 'true_reveal' && revealedItem?.item.rarity && ['Mythic', 'Exotic'].includes(revealedItem.item.rarity) && (
              <div className="god-rays animate-in fade-in zoom-in duration-1000" style={{ '--tease-color': teaseColor } as React.CSSProperties}></div>
           )}
           
           <div className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center perspective-1000">
             
             {/* PHASE 1: The Automated Animation Sequence */}
             {['ambient_charge', 'bounce_vibrate'].includes(revealStage) && (
               <div className="flex flex-col items-center relative transition-all duration-300">
                 
                 <h3 className={`font-black text-xl mb-6 tracking-widest uppercase flex items-center gap-2 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-colors
                      ${isFastForward ? 'text-amber-500 scale-105' : 'text-slate-400 animate-pulse'}
                 `}>
                     {isFastForward ? 'Skipping...' : 'Click box to speed up'}
                 </h3>

                 {/* DYNAMIC AMBIANCE RAYS */}
                 <div 
                   onClick={handleFastForward}
                   style={{ '--tease-color': teaseColor } as React.CSSProperties}
                   className={`relative z-10 w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center transition-all duration-100 select-none cursor-pointer
                     ${revealStage === 'ambient_charge' ? 'animate-ambient' : ''}
                     ${revealStage === 'bounce_vibrate' ? 'animate-bounce-chest pointer-events-none' : ''}
                   `}
                 >
                     <div className="absolute inset-[-150%] animate-[spin_10s_linear_infinite] pointer-events-none" 
                          style={{ 
                              background: `repeating-conic-gradient(from 0deg, transparent 0deg 15deg, var(--tease-color) 15deg 30deg)`, 
                              opacity: 0.35,
                              maskImage: 'radial-gradient(circle, black 25%, transparent 65%)',
                              WebkitMaskImage: 'radial-gradient(circle, black 25%, transparent 65%)'
                          }} />
                     
                     <div className="absolute inset-0 flex items-center justify-center scale-[0.6] sm:scale-75 pointer-events-none drop-shadow-[0_0_30px_var(--tease-color)] z-10">
                         <LootBoxVisual tier={openingBox.tier} className="transition-all duration-300" />
                     </div>
                 </div>

                 {/* In-Modal Pity Tracking */}
                 <div className="mt-8 flex flex-col items-center bg-slate-900/80 px-6 py-4 rounded-2xl border border-slate-700/50 backdrop-blur-md shadow-xl w-64 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1.5">{openingBox.name}</span>
                     {openingBox.snapshotPity + 1 >= openingBox.pityMax ? (
                        <span className="text-fuchsia-400 font-black text-sm uppercase flex items-center gap-1.5 animate-pulse">
                            <Zap className="w-4 h-4"/> Guaranteed Mythic
                        </span>
                     ) : (
                        <div className="w-full">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-amber-400 font-black text-[10px] uppercase flex items-center gap-1.5">
                                    <Crown className="w-3 h-3"/> Boxes Left
                                </span>
                                <span className="text-slate-300 font-bold text-xs">{openingBox.pityMax - openingBox.snapshotPity}</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${(openingBox.snapshotPity / openingBox.pityMax) * 100}%` }}></div>
                            </div>
                        </div>
                     )}
                 </div>

               </div>
             )}

             {/* PHASE 2 & 3: The Flip and Reveal */}
             {['card_back', 'reveal_flip', 'fake_glitch', 'true_reveal'].includes(revealStage) && (
               <div 
                 className={`relative w-[300px] h-[400px] preserve-3d flip-spring
                   ${revealStage === 'card_back' ? 'card-unopened' : ''}
                   ${['reveal_flip', 'fake_glitch', 'true_reveal'].includes(revealStage) ? 'rotate-y-180' : 'rotate-y-0'}
                   ${revealStage === 'fake_glitch' ? 'animate-shatter' : ''}
                 `}
                 style={{ '--tease-color': teaseColor } as React.CSSProperties}
                 onClick={executeFlip}
               >
                 
                 {/* FRONT (The Mysterious Back of the Card) */}
                 <div className="absolute inset-0 backface-hidden rounded-[3rem] bg-gradient-to-br from-slate-800 to-slate-950 border-4 border-slate-700 shadow-2xl flex flex-col items-center justify-center p-6">
                    <Fingerprint className="w-16 h-16 text-slate-600 mb-6 animate-pulse" />
                    <span className="text-sm font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/30">
                        Click to Reveal
                    </span>
                 </div>

                 {/* BACK (The Actual Item) */}
                 <div className={`absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center w-full transition-opacity duration-300 ${revealStage === 'card_back' ? 'opacity-0' : 'opacity-100'}`}>
                    {itemToRender && (
                      <div className={`flex flex-col items-center w-full ${revealStage === 'true_reveal' && revealedItem?.isFakeOut ? 'animate-reveal' : ''}`}>
                         
                         <div className="mb-6 flex flex-col items-center relative z-10 w-full px-2">
                             <span className={`inline-flex items-center text-center rounded-full font-black uppercase border mb-3 shadow-lg transition-all duration-700 ${getRarityConfig(itemToRender.rarity).badge} ${getHypedRarityBadge(itemToRender.rarity)}`}>
                                {itemToRender.rarity} {itemToRender.type === 'card' ? 'Background' : 'Border'}
                             </span>
                             <h2 className={`font-black tracking-tight text-center leading-none mb-2 drop-shadow-2xl transition-all duration-700 text-balance break-words ${getRarityConfig(itemToRender.rarity).text} ${['Mythic', 'Exotic'].includes(itemToRender.rarity) ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'}`}>
                                {itemToRender.name}
                             </h2>
                             
                             {isShowingRealItem && revealedItem?.isDuplicate && (
                                <div className="bg-amber-950/80 border border-amber-500/50 px-5 py-2 rounded-2xl text-amber-300 text-xs font-bold flex items-center gap-2 mt-2 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                   <RefreshCcw className="w-3 h-3 text-amber-400" />
                                   Duplicate Saved to Inventory!
                                </div>
                             )}
                         </div>

                         {/* Visual Preview Box */}
                         <div className="relative z-10 scale-90 sm:scale-100">
                           {itemToRender.type === 'card' ? (
                               <div className={`h-64 w-[300px] rounded-[3rem] flex items-center justify-center border-2 relative overflow-hidden transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${getCardStyles(itemToRender.id).bgClass} ${getRarityConfig(itemToRender.rarity).cardGlow}`}>
                                 {getCardStyles(itemToRender.id).isAnimated && <div className="holo-glare rounded-2xl"></div>}
                                 <div className="relative z-20 shadow-2xl rounded-full border-2 border-white/40 bg-slate-900">
                                    <AvatarWithBorder avatarUrl={avatarUrl} borderId="none" sizeClasses="w-36 h-36" />
                                 </div>
                               </div>
                           ) : (
                               <div className="h-64 w-[300px] bg-slate-950 rounded-[3rem] flex items-center justify-center border-2 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-slate-700">
                                 <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                                 <div className="relative z-20 shadow-2xl">
                                     <AvatarWithBorder avatarUrl={avatarUrl} borderId={itemToRender.id} sizeClasses="w-48 h-48" />
                                 </div>
                               </div>
                           )}
                         </div>

                         {/* Action Buttons */}
                         {isShowingRealItem && (
                            <div className="flex gap-4 mt-8 w-full max-w-sm relative z-10">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); closeUnboxingModal(); }} 
                                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl transition-colors active:scale-95 border border-slate-700 disabled:opacity-50"
                                >
                                   Close
                                </button>
                                {!revealedItem?.isDuplicate && (
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); handleEquipItem(itemToRender); }} 
                                     disabled={isProcessingTx || revealStage === 'reveal_flip'} 
                                     className="flex-1 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                   >
                                      {isProcessingTx ? 'Equipping...' : 'Equip Now'}
                                   </button>
                                )}
                            </div>
                         )}
                      </div>
                    )}
                 </div>
               </div>
             )}

           </div>
        </div>
      )}

      {/* FIXED DYNAMIC PARALLAX BACKGROUNDS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div 
          className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full transition-transform duration-700 ease-out"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
        <div 
          className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full transition-transform duration-700 ease-out"
          style={{ transform: `translateY(${scrollY * -0.2}px)` }}
        />
        <div 
          className="absolute bottom-[-20%] left-[30%] w-[700px] h-[700px] bg-cyan-600/10 blur-[150px] rounded-full transition-transform duration-700 ease-out"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#020617] to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* SHOP HEADER WITH GAMIFIED WALLET CARD */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
          <div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md">
              <Store className="w-4 h-4 mr-2" /> The Drop Zone
            </div>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-3 drop-shadow-lg text-white">Loot Boxes</h1>
            <p className="text-slate-400 font-medium text-lg max-w-xl">Spend your Points to unbox legendary profile borders and designer backgrounds.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch gap-4 shrink-0 hover:-translate-y-1 transition-transform duration-500 cursor-default group">
            <div className="bg-white/95 backdrop-blur-xl p-4 sm:p-5 rounded-[2rem] shadow-[0_15px_50px_rgba(0,0,0,0.5)] flex items-center gap-5 border border-slate-200 group-hover:shadow-[0_20px_60px_rgba(255,255,255,0.1)] transition-all duration-500">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden border border-slate-700 shrink-0">
                <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
                <Points className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] transform group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex flex-col pr-4 sm:pr-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> POINTS
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
              <p className="text-red-300/80 text-sm font-medium mb-3">You must verify your Athletic.net profile on the dashboard before you can open boxes.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/50 text-red-200 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-red-600/40 hover:scale-105 active:scale-95 transition-all shadow-md">
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* HOW IT WORKS INFORMATIONAL SECTION */}
        {activeTab === 'boxes' && (
           <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 mb-10 flex flex-col md:flex-row gap-8 backdrop-blur-md shadow-xl animate-in fade-in duration-500">
              <div className="flex-1">
                  <h3 className="text-lg font-black text-white flex items-center gap-2 mb-3">
                      <ImageIcon className="w-5 h-5 text-indigo-400" /> What are Backgrounds?
                  </h3>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed">Backgrounds completely redesign the CSS theme of your public athlete profile. Higher tier cards have animated holographic foil effects.</p>
              </div>
              <div className="w-px bg-slate-800 hidden md:block"></div>
              <div className="flex-1">
                  <h3 className="text-lg font-black text-white flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-emerald-400" /> What are Borders?
                  </h3>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed">Borders are gamified rings that surround your profile picture everywhere across the platform. Legendary borders feature high-quality animations.</p>
              </div>
              <div className="w-px bg-slate-800 hidden md:block"></div>
              <div className="flex-1">
                  <h3 className="text-lg font-black text-white flex items-center gap-2 mb-3">
                      <PackageSearch className="w-5 h-5 text-amber-400" /> Guaranteed Loot
                  </h3>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed">Each box tracks its own progress. Open a specific box enough times, and you are guaranteed a Mythic+ item drop!</p>
              </div>
           </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex flex-wrap gap-3 mb-8 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 w-fit backdrop-blur-md shadow-xl">
          <button 
            onClick={() => setActiveTab('boxes')}
            className={`px-6 py-3 rounded-xl font-black transition-all duration-300 flex items-center gap-2 text-sm active:scale-95 ${activeTab === 'boxes' ? 'bg-amber-500 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Hexagon className="w-4 h-4" /> Get Loot Boxes
          </button>
          <button 
            onClick={() => setActiveTab('cards')}
            className={`px-6 py-3 rounded-xl font-black transition-all duration-300 flex items-center gap-2 text-sm active:scale-95 ${activeTab === 'cards' ? 'bg-amber-500 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <ImageIcon className="w-4 h-4" /> My Backgrounds
          </button>
          <button 
            onClick={() => setActiveTab('borders')}
            className={`px-6 py-3 rounded-xl font-black transition-all duration-300 flex items-center gap-2 text-sm active:scale-95 ${activeTab === 'borders' ? 'bg-amber-500 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Shield className="w-4 h-4" /> My Borders
          </button>
        </div>

        {/* TAB CONTENT: LOOT BOXES */}
        {activeTab === 'boxes' && (
           <div id="loot-section" className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
             
             {/* PROFILE BACKGROUNDS SECTION */}
             <div>
                 <h3 className="text-3xl font-black text-white mb-6 flex items-center gap-3 drop-shadow-lg"><ImageIcon className="w-8 h-8 text-indigo-500"/> Profile Backgrounds</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
                   {CARD_BOXES.map(box => renderBoxCard(box))}
                 </div>
             </div>

             {/* PROFILE BORDERS SECTION */}
             <div>
                 <h3 className="text-3xl font-black text-white mb-6 flex items-center gap-3 drop-shadow-lg"><Shield className="w-8 h-8 text-emerald-500"/> Profile Borders</h3>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
                   {BORDER_BOXES.map(box => renderBoxCard(box))}
                 </div>
             </div>
           </div>
        )}

        {/* TAB CONTENT: MY CARDS (BACKGROUNDS) */}
        {activeTab === 'cards' && (
          <div>
            {(duplicateCards.length > 0 || duplicateBorders.length > 0) && (
              <button
                onClick={handleRecycleAllDuplicates}
                disabled={isProcessingTx}
                className="mb-8 px-6 py-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black text-xs uppercase tracking-widest flex items-center gap-2.5 transition-all shadow-lg active:scale-95"
              >
                <RefreshCcw className="w-4 h-4 text-amber-400" />
                Recycle All Duplicates (+{
                  [...duplicateCards, ...duplicateBorders].reduce((acc, id) => {
                    const item = ALL_ITEMS.find(i => i.id === id);
                    return acc + (item ? getRarityConfig(item.rarity).salvageValue : 0);
                  }, 0)
                } Points)
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {SHOP_CARDS.map((card) => {
                const isUnlocked = unlockedCards.includes(card.id) || (card.isPremium && isPremium);
                const isEquipped = equippedCard === card.id;
                const duplicateCount = duplicateCards.filter(id => id === card.id).length;
                const rarityStyle = getRarityConfig(card.rarity);
                const RarityIcon = rarityStyle.icon;
                const cardStyles = getCardStyles(card.id);

                return (
                  <div 
                    key={card.id} 
                    className={`bg-slate-900/80 backdrop-blur-md rounded-[3rem] p-1.5 transition-all duration-500 relative flex flex-col group ${isUnlocked ? 'hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'opacity-60 grayscale-[60%] hover:grayscale-0'}`}
                  >
                    <div className={`absolute inset-0 rounded-[3rem] border-2 transition-all duration-500 ${isEquipped ? 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)]' : isUnlocked ? rarityStyle.cardGlow : 'border-slate-800'}`}></div>

                    <div className={`bg-slate-900/90 h-full rounded-[2.7rem] p-6 sm:p-8 flex flex-col relative z-10 border border-white/5`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${rarityStyle.badge}`}>
                          <RarityIcon className="w-3.5 h-3.5 mr-1.5" /> {card.rarity}
                        </div>
                        <div>
                          {isEquipped ? (
                            <span className="bg-amber-500 text-amber-950 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.6)]">Equipped</span>
                          ) : !isUnlocked ? (
                            <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border border-slate-700 flex items-center gap-1 shadow-inner">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          ) : duplicateCount > 0 ? (
                            <span className="bg-amber-900/30 text-amber-400 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border border-amber-500/30 shadow-inner flex items-center gap-1">
                              <RefreshCcw className="w-3 h-3 text-amber-400" /> x{duplicateCount} Dupe{duplicateCount > 1 ? 's' : ''}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className={`h-56 w-full rounded-2xl mb-8 flex items-center justify-center border shadow-inner relative overflow-hidden transition-all duration-500
                          ${cardStyles.bgClass} ${cardStyles.isAnimated ? 'animate-foil border-white/20' : 'border-white/5 bg-slate-800'}
                          ${isUnlocked ? 'group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : ''}
                      `}>
                          {cardStyles.isAnimated && ['hype', 'premium'].includes(card.id) && <div className="holo-glare rounded-2xl"></div>}
                          {cardStyles.isAnimated && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay"></div>}
                          
                          {!isUnlocked && (
                             <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] z-30 flex items-center justify-center">
                                <Lock className="w-12 h-12 text-slate-500 drop-shadow-md" />
                             </div>
                          )}

                          <div className={`relative z-20 transition-transform duration-500 shadow-2xl rounded-full border-2 border-white/40 bg-slate-900 ${isUnlocked ? 'transform group-hover:scale-110' : ''}`}>
                            <AvatarWithBorder avatarUrl={avatarUrl} borderId="none" sizeClasses="w-28 h-28" />
                          </div>
                      </div>

                      <div className="mb-6 flex-grow text-center">
                        <h3 className={`text-2xl font-black leading-tight mb-2 text-balance break-words ${rarityStyle.text}`}>{card.name}</h3>
                        <p className="text-sm font-medium text-slate-400 leading-relaxed px-2">{card.desc}</p>
                      </div>

                      <button 
                        disabled={isProcessingTx || !isUnlocked || isEquipped}
                        onClick={() => handleEquipItem(card)}
                        className={`w-full py-4 rounded-xl font-black transition-all duration-300 flex items-center justify-center gap-2 ${
                          isEquipped 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                            : isUnlocked
                              ? 'bg-slate-100 text-slate-900 hover:bg-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]' 
                              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        {isEquipped ? (
                          <><CheckCircle2 className="w-5 h-5" /> Equipped</>
                        ) : isUnlocked ? (
                          'Equip Background'
                        ) : (
                          <><PackageSearch className="w-4 h-4"/> Find in Loot Boxes</>
                        )}
                      </button>

                      {duplicateCount > 0 && (
                        <button
                          onClick={() => handleRecycleDuplicate(card)}
                          disabled={isProcessingTx}
                          className="mt-3 w-full py-3 px-4 rounded-xl font-bold text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                        >
                          <RefreshCcw className="w-3.5 h-3.5 text-amber-400" />
                          Recycle 1 Dupe (+{rarityStyle.salvageValue} Points)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB CONTENT: MY BORDERS */}
        {activeTab === 'borders' && (
          <div>
            {(duplicateCards.length > 0 || duplicateBorders.length > 0) && (
              <button
                onClick={handleRecycleAllDuplicates}
                disabled={isProcessingTx}
                className="mb-8 px-6 py-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black text-xs uppercase tracking-widest flex items-center gap-2.5 transition-all shadow-lg active:scale-95"
              >
                <RefreshCcw className="w-4 h-4 text-amber-400" />
                Recycle All Duplicates (+{
                  [...duplicateCards, ...duplicateBorders].reduce((acc, id) => {
                    const item = ALL_ITEMS.find(i => i.id === id);
                    return acc + (item ? getRarityConfig(item.rarity).salvageValue : 0);
                  }, 0)
                } Points)
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {SHOP_BORDERS.map((border) => {
                const isUnlocked = unlockedBorders.includes(border.id);
                const isEquipped = equippedBorder === border.id;
                const duplicateCount = duplicateBorders.filter(id => id === border.id).length;
                const rarityStyle = getRarityConfig(border.rarity);
                const RarityIcon = rarityStyle.icon;

                return (
                  <div 
                    key={border.id} 
                    className={`bg-slate-900/80 backdrop-blur-md rounded-[3rem] p-1.5 transition-all duration-500 relative flex flex-col group ${isUnlocked ? 'hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'opacity-60 grayscale-[60%] hover:grayscale-0'}`}
                  >
                    <div className={`absolute inset-0 rounded-[3rem] border-2 transition-all duration-500 ${isEquipped ? 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)]' : isUnlocked ? rarityStyle.cardGlow : 'border-slate-800'}`}></div>

                    <div className={`bg-slate-900/90 h-full rounded-[2.7rem] p-6 sm:p-8 flex flex-col relative z-10 border border-white/5`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${rarityStyle.badge}`}>
                          <RarityIcon className="w-3.5 h-3.5 mr-1.5" /> {border.rarity}
                        </div>
                        <div>
                          {isEquipped ? (
                            <span className="bg-amber-500 text-amber-950 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.6)]">Equipped</span>
                          ) : !isUnlocked ? (
                            <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border border-slate-700 flex items-center gap-1 shadow-inner">
                               <Lock className="w-3 h-3" /> Locked
                            </span>
                          ) : duplicateCount > 0 ? (
                            <span className="bg-amber-900/30 text-amber-400 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border border-amber-500/30 shadow-inner flex items-center gap-1">
                              <RefreshCcw className="w-3 h-3 text-amber-400" /> x{duplicateCount} Dupe{duplicateCount > 1 ? 's' : ''}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className={`h-56 w-full ${rarityStyle.bgFx} bg-opacity-30 rounded-2xl mb-8 flex items-center justify-center border border-slate-800 relative overflow-hidden transition-colors shadow-inner group-hover:bg-opacity-80 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]`}>
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                        
                        {!isUnlocked && (
                             <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] z-30 flex items-center justify-center">
                                <Lock className="w-12 h-12 text-slate-500 drop-shadow-md" />
                             </div>
                        )}

                        <div className={`relative z-20 transition-transform duration-500 drop-shadow-2xl ${isUnlocked ? 'transform group-hover:scale-110' : ''}`}>
                          <AvatarWithBorder avatarUrl={avatarUrl} borderId={border.id} sizeClasses="w-36 h-36" />
                        </div>
                      </div>

                      <div className="mb-6 flex-grow text-center">
                        <h3 className={`text-2xl font-black leading-tight mb-2 text-balance break-words ${rarityStyle.text}`}>{border.name}</h3>
                        <p className="text-sm font-medium text-slate-400 leading-relaxed px-2">{border.desc}</p>
                      </div>

                      <button 
                        disabled={isProcessingTx || !isUnlocked || isEquipped}
                        onClick={() => handleEquipItem(border)}
                        className={`w-full py-4 rounded-xl font-black transition-all duration-300 flex items-center justify-center gap-2 ${
                          isEquipped 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                            : isUnlocked
                              ? 'bg-slate-100 text-slate-900 hover:bg-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]' 
                              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        {isEquipped ? (
                          <><CheckCircle2 className="w-5 h-5" /> Equipped</>
                        ) : isUnlocked ? (
                          'Equip Border'
                        ) : (
                           <><PackageSearch className="w-4 h-4"/> Find in Loot Boxes</>
                        )}
                      </button>

                      {duplicateCount > 0 && (
                        <button
                          onClick={() => handleRecycleDuplicate(border)}
                          disabled={isProcessingTx}
                          className="mt-3 w-full py-3 px-4 rounded-xl font-bold text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                        >
                          <RefreshCcw className="w-3.5 h-3.5 text-amber-400" />
                          Recycle 1 Dupe (+{rarityStyle.salvageValue} Points)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}