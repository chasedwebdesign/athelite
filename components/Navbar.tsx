'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Activity, Mail, Search, LogOut, LayoutDashboard, User, School, Trophy, Globe, Medal, Menu, X, ShoppingCart, Target } from 'lucide-react'; 

// 🚨 IMPORTED CHASEDCASH COMPONENT
import { ChasedCash } from '@/components/ChasedCash';

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  
  const [session, setSession] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // --- ECONOMY STATE ---
  const [coins, setCoins] = useState(0);
  const [isAthlete, setIsAthlete] = useState(false);
  
  // --- UI STATE ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  // --- GLOBAL SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  
  // Close search results if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  // Handle live search typing
  useEffect(() => {
    const fetchSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const { data } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, avatar_url, high_school')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .gt('trust_level', 0)
        .limit(5);
        
      if (data) setSearchResults(data);
      setIsSearching(false);
    };

    const delayDebounceFn = setTimeout(() => fetchSearch(), 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, supabase]);

  // Check auth and load avatar/messages/coins
  useEffect(() => {
    let coinSubscription: any = null; // 🚨 Define subscription variable outside so we can clean it up

    async function loadNavData() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // Smart fetch to determine if user is athlete or coach
        const { data: athleteProfile } = await supabase
          .from('athletes')
          .select('avatar_url, coins')
          .eq('id', session.user.id)
          .maybeSingle();

        if (athleteProfile) {
          setIsAthlete(true);
          setAvatarUrl(athleteProfile.avatar_url);
          setCoins(athleteProfile.coins || 0);

          // 🚨 INSTANT REALTIME COIN UPDATES
          // This listens to the specific athlete's row in the DB.
          // If coins go up (bounty claim) or down (shop purchase), it updates instantly.
          coinSubscription = supabase
            .channel('public:athletes:coins')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'athletes',
                filter: `id=eq.${session.user.id}`
            }, (payload) => {
                if (payload.new && typeof payload.new.coins === 'number') {
                    setCoins(payload.new.coins);
                }
            })
            .subscribe();

        } else {
          // If not an athlete, check if they are a coach
          const { data: coachProfile } = await supabase
            .from('coaches')
            .select('avatar_url')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (coachProfile) {
            setAvatarUrl(coachProfile.avatar_url);
          }
        }

        // "Smart" Unread Counter
        const { data: messageData } = await supabase
          .from('messages')
          .select('id, athlete_id, chat_history')
          .or(`athlete_id.eq.${session.user.id},sender_email.eq.${session.user.email}`)
          .eq('is_read', false);

        if (messageData) {
          const realUnreadCount = messageData.filter((msg: any) => {
            const history = msg.chat_history || [];
            if (history.length > 0) {
              return history[history.length - 1].sender_id !== session.user.id;
            }
            return msg.athlete_id === session.user.id;
          }).length;
          
          setUnreadCount(realUnreadCount);
        }
      }
    }
    
    loadNavData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') loadNavData();
    });

    // 🚨 Cleanup function to prevent memory leaks when component unmounts
    return () => {
        subscription.unsubscribe();
        if (coinSubscription) supabase.removeChannel(coinSubscription);
    };
  }, [pathname, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsMobileMenuOpen(false);
    router.push('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (pathname === '/login') return null;

  const CoinBadge = () => (
    <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/60 px-3 py-1.5 rounded-xl shadow-sm cursor-pointer hover:bg-emerald-100 transition-colors group" title={`${coins} ChasedCash`}>
      <ChasedCash className="w-7 h-5 group-hover:scale-105 transition-transform" />
      <span className="font-black text-emerald-800 text-sm tracking-tight">{coins}</span>
    </div>
  );

  return (
    <>
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* LOGO */}
          <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-2 group shrink-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 overflow-hidden group-hover:scale-105 transition-transform">
              <Image 
                src="/logo.png" 
                alt="ChasedSports Logo" 
                fill
                sizes="(max-width: 768px) 32px, 40px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">
              Chased<span className="text-blue-600">Sports</span>
            </span>
          </Link>

          {/* DESKTOP GLOBAL SEARCH BAR */}
          <div className="flex-1 max-w-md relative hidden md:block" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" placeholder="Search athletes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border border-transparent focus:border-blue-300 focus:bg-white text-sm font-medium text-slate-900 rounded-full pl-10 pr-4 py-2 transition-all outline-none"
              />
            </div>
            {/* DESKTOP SEARCH RESULTS */}
            {searchQuery.length >= 2 && (
              <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-sm font-bold text-slate-400">Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <Link key={result.id} href={`/athlete/${result.id}`} onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {result.avatar_url ? <img src={result.avatar_url} alt="" className="w-full h-full object-cover"/> : <Medal className="w-4 h-4 text-slate-400"/>}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-900 truncate">{result.first_name} {result.last_name}</p>
                        <p className="text-xs font-medium text-slate-500 truncate">{result.high_school}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm font-bold text-slate-400">No athletes found.</div>
                )}
              </div>
            )}
          </div>

          {/* DESKTOP NAVIGATION (Hidden on mobile) */}
          <div className="hidden md:flex items-center space-x-6 shrink-0">
            <Link href="/feed" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center"><Globe className="w-4 h-4 mr-1.5" /> Feed</Link>
            
            {/* 🚨 NEW COMPETE LINK */}
            <Link href="/compete" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center"><Target className="w-4 h-4 mr-1.5" /> Compete</Link>
            
            <Link href="/leaderboard" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center"><Trophy className="w-4 h-4 mr-1.5" /> Ranks</Link>
            <Link href="/search" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center"><School className="w-4 h-4 mr-1.5" /> Colleges</Link>

            {session ? (
              <>
                <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center"><LayoutDashboard className="w-4 h-4 mr-1.5" /> Dashboard</Link>
                <Link href="/dashboard/messages" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center relative">
                  <Mail className="w-4 h-4 mr-1.5" /> <span>Inbox</span>
                  {unreadCount > 0 && <span className="absolute -top-2.5 -right-3.5 bg-red-500 text-white text-[10px] leading-none font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm px-1">{unreadCount}</span>}
                </Link>
                
                {/* 🪙 COIN BADGE & NEW SHOP LINK (Athletes Only) */}
                {isAthlete && (
                  <Link href="/shop" className="flex items-center gap-1 hover:-translate-y-0.5 transition-transform">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <CoinBadge />
                  </Link>
                )}
                
                {/* UPGRADED: ONE-CLICK LOGOUT AVATAR */}
                <button 
                  onClick={handleSignOut} 
                  title="Log Out" 
                  className="relative ml-2 w-10 h-10 rounded-full border-2 border-slate-200 hover:border-red-400 transition-all overflow-hidden flex items-center justify-center bg-slate-100 group shadow-sm"
                >
                  {avatarUrl ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover group-hover:opacity-30 transition-opacity" /> : <User className="w-5 h-5 text-slate-400 group-hover:opacity-30 transition-opacity" />}
                  <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-red-600 drop-shadow-md" />
                  </div>
                </button>
              </>
            ) : (
              <Link href="/login" className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-600/20">Log In</Link>
            )}
          </div>

          {/* MOBILE HAMBURGER BUTTON */}
          <div className="flex items-center gap-4 md:hidden">
            {/* 🪙 MOBILE COIN BADGE & SHOP LINK */}
            {session && isAthlete && (
              <Link href="/shop" className="flex items-center">
                <CoinBadge />
              </Link>
            )}

            {/* Quick Inbox icon for mobile if logged in */}
            {session && (
               <Link href="/dashboard/messages" className="relative p-2 text-slate-500 hover:text-blue-600 transition-colors" onClick={closeMobileMenu}>
                 <Mail className="w-6 h-6" />
                 {unreadCount > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] leading-none font-black min-w-[16px] h-[16px] flex items-center justify-center rounded-full border-2 border-white">{unreadCount}</span>}
               </Link>
            )}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE FULL-SCREEN MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[64px] z-[50] bg-white overflow-y-auto animate-in slide-in-from-top-5 duration-200 md:hidden">
          <div className="p-6 flex flex-col gap-6">
            
            {/* MOBILE SEARCH BAR */}
            <div className="relative w-full" ref={mobileSearchRef}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" placeholder="Search athletes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 border border-transparent focus:border-blue-300 focus:bg-white text-base font-medium text-slate-900 rounded-2xl pl-12 pr-4 py-4 transition-all outline-none"
                />
              </div>
              {/* MOBILE SEARCH RESULTS */}
              {searchQuery.length >= 2 && (
                <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm font-bold text-slate-400">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(result => (
                      <Link key={result.id} href={`/athlete/${result.id}`} onClick={closeMobileMenu} className="flex items-center gap-3 p-4 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {result.avatar_url ? <img src={result.avatar_url} alt="" className="w-full h-full object-cover"/> : <Medal className="w-5 h-5 text-slate-400"/>}
                        </div>
                        <div className="truncate">
                          <p className="text-base font-bold text-slate-900 truncate">{result.first_name} {result.last_name}</p>
                          <p className="text-xs font-medium text-slate-500 truncate">{result.high_school}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm font-bold text-slate-400">No athletes found.</div>
                  )}
                </div>
              )}
            </div>

            {/* MOBILE MENU LINKS */}
            <div className="flex flex-col gap-2">
              <Link href="/feed" onClick={closeMobileMenu} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold text-lg transition-colors"><Globe className="w-6 h-6 text-blue-500" /> The Feed</Link>
              
              {/* 🚨 NEW COMPETE LINK MOBILE */}
              <Link href="/compete" onClick={closeMobileMenu} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold text-lg transition-colors"><Target className="w-6 h-6 text-blue-500" /> Compete</Link>

              <Link href="/leaderboard" onClick={closeMobileMenu} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold text-lg transition-colors"><Trophy className="w-6 h-6 text-blue-500" /> Leaderboards</Link>
              <Link href="/search" onClick={closeMobileMenu} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold text-lg transition-colors"><School className="w-6 h-6 text-blue-500" /> College Finder</Link>
              
              {session ? (
                <>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <Link href="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold text-lg transition-colors"><LayoutDashboard className="w-6 h-6 text-purple-500" /> Dashboard</Link>
                  {/* NEW MOBILE SHOP LINK */}
                  {isAthlete && (
                    <Link href="/shop" onClick={closeMobileMenu} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold text-lg transition-colors">
                      <ShoppingCart className="w-6 h-6 text-blue-600" /> The Shop
                    </Link>
                  )}
                  <Link href="/dashboard/messages" onClick={closeMobileMenu} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold text-lg transition-colors"><Mail className="w-6 h-6 text-purple-500" /> Inbox {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto">{unreadCount} new</span>}</Link>
                  <button onClick={handleSignOut} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 text-red-600 font-bold text-lg transition-colors text-left w-full"><LogOut className="w-6 h-6" /> Log Out</button>
                </>
              ) : (
                <>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <Link href="/login" onClick={closeMobileMenu} className="bg-blue-600 text-white font-black text-center p-4 rounded-2xl shadow-lg shadow-blue-600/20">Log In / Sign Up</Link>
                </>
              )}
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}