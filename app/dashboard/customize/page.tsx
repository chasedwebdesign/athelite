'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Paintbrush, CheckCircle2, ChevronLeft, Store, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';

// 🚨 IMPORTED REUSABLE BORDER COMPONENT
import { AvatarWithBorder } from '@/components/AnimatedBorders'; 

// --- BORDER DICTIONARY (Maps DB IDs to Display Names) ---
const BORDER_DICTIONARY = [
  { id: 'none', name: 'Standard Profile' },
  { id: 'pioneer', name: 'The Pioneer (Early Adopter)' },
  { id: 'plasma-surge', name: 'Plasma Surge (Referral)' },
  { id: 'border-blue-500', name: 'Sapphire Strike' },
  { id: 'border-red-500', name: 'Crimson Phantom' },
  { id: 'border-emerald-400', name: 'Neon Pulse' },
  { id: 'animated-silver', name: 'Silver Crest' },
  { id: 'animated-gold', name: 'Gold Crest' },
  { id: 'animated-diamond', name: 'Diamond Crest' },
  { id: 'neon-glitch', name: 'Neon Glitch' },
  { id: 'ethereal-cosmos', name: 'Ethereal Cosmos' },
  { id: 'fire', name: 'Inferno' },
];

export default function CustomizePage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  
  // Customization State
  const [unlockedBorders, setUnlockedBorders] = useState<string[]>(['none']);
  const [equippedBorder, setEquippedBorder] = useState<string>('none');
  const [isEquipping, setIsEquipping] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    async function loadCustomizationData() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Load Athlete Customization Data
      const { data: aData } = await supabase
        .from('athletes')
        .select('id, unlocked_borders, equipped_border')
        .eq('id', session.user.id)
        .maybeSingle();

      if (aData) {
        setAthleteId(aData.id);
        
        let owned = aData.unlocked_borders || [];
        if (!owned.includes('none')) owned.unshift('none'); // Ensure standard is always an option
        
        setUnlockedBorders(owned);
        setEquippedBorder(aData.equipped_border || 'none');
      } else {
        router.push('/dashboard'); // Kick coaches back out
      }
      
      setLoading(false);
    }
    
    loadCustomizationData();
  }, [supabase, router]);

  const handleEquipBorder = async (borderId: string) => {
    if (!athleteId) return;
    setIsEquipping(true);
    
    try {
      const { error } = await supabase.from('athletes').update({ equipped_border: borderId }).eq('id', athleteId);
      if (error) throw error;
      
      setEquippedBorder(borderId);
      showToast(`Successfully equipped border!`, 'success');
    } catch (err: any) {
      showToast(`Failed to equip border: ${err.message}`);
    } finally {
      setIsEquipping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      
      {/* TOAST NOTIFICATIONS */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />}
            <p className="text-sm font-bold leading-tight">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-auto shrink-0 opacity-50 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 pt-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
              <Paintbrush className="w-10 h-10 text-slate-800" /> My Cosmetics
            </h1>
            <p className="text-slate-500 font-medium text-lg">Manage your unlocked profile borders.</p>
          </div>
          
          <Link href="/shop" className="bg-white border border-slate-200 hover:border-blue-400 p-4 rounded-2xl shadow-sm hover:shadow-md flex items-center justify-between gap-4 transition-all group">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
            <div className="pr-2">
              <p className="text-sm font-black text-slate-900">Visit The Shop</p>
              <p className="text-xs font-medium text-slate-500">Buy more borders</p>
            </div>
          </Link>
        </div>

        {/* INVENTORY GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {unlockedBorders.map((borderId) => {
            const borderInfo = BORDER_DICTIONARY.find(b => b.id === borderId) || { id: borderId, name: 'Unknown Border' };
            const isEquipped = equippedBorder === borderId;

            return (
              <div key={borderId} className={`bg-white rounded-[2rem] p-6 border-2 transition-all relative flex flex-col ${isEquipped ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'}`}>
                
                {/* PREVIEW WINDOW */}
                <div className="h-40 w-full bg-slate-50 rounded-2xl mb-6 flex flex-col items-center justify-center border border-slate-100 relative overflow-hidden">
                  <AvatarWithBorder 
                    avatarUrl={null} 
                    borderId={borderId} 
                    sizeClasses="w-24 h-24" 
                  />
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                </div>

                <div className="mb-6 flex-grow text-center">
                  <h3 className="text-xl font-black text-slate-900 leading-tight">{borderInfo.name}</h3>
                </div>

                <button 
                  disabled={isEquipping || isEquipped}
                  onClick={() => handleEquipBorder(borderId)}
                  className={`w-full py-3.5 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${
                    isEquipped 
                      ? 'bg-blue-50 text-blue-600 cursor-not-allowed' 
                      : 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 shadow-md'
                  }`}
                >
                  {isEquipped ? (
                    <><CheckCircle2 className="w-5 h-5" /> Equipped</>
                  ) : (
                    'Equip Border'
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}