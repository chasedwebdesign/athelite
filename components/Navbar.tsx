'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Activity, Mail, Search, LogOut, LayoutDashboard, User, School, Trophy, Globe, Medal, Menu, X, ShoppingCart, Target, ChevronDown, Crown, Zap, Shield } from 'lucide-react'; 

// 🚨 IMPORTED CHASEDCASH COMPONENT
import { ChasedCash } from '@/components/ChasedCash';

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  
  const [session, setSession] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // --- ECONOMY, ROLE & BILLING STATE ---
  const [coins, setCoins] = useState(0);
  const [isAthlete, setIsAthlete] = useState(false);
  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');
  const [isPremium, setIsPremium] = useState(false);
  
  // --- UI STATE ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  // --- GLOBAL SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); 
  
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  // SMARTER FULL-NAME SEARCH LOGIC
  useEffect(() => {
    const fetchSearch = async () => {
      const queryText = searchQuery.trim();
      
      if (queryText.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);

      let query = supabase
        .from('athletes')
        .select('id, first_name, last_name, avatar_url, high_school')
        .gt('trust_level', 0)
        .limit(5);

      const searchTerms = queryText.split(/\s+/);
      
      if (searchTerms.length > 1) {
        query = query
          .ilike('first_name', `%${searchTerms[0]}%`)
          .ilike('last_name', `%${searchTerms.slice(1).join(' ')}%`);
      } else {
        query = query.or(`first_name.ilike.%${queryText}%,last_name.ilike.%${queryText}%`);
      }
        
      const { data } = await query;

      if (data) {
        setSearchResults(data);
        if (viewerRole === 'coach' && data.length > 0) {
           const idsToUpdate = data.map(athlete => athlete.id);
           supabase.rpc('increment_search_appearances', { athlete_ids: idsToUpdate }).then();
        }
      }
      setIsSearching(false);
    };

    const delayDebounceFn = setTimeout(() => fetchSearch(), 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, supabase, viewerRole]);

  useEffect(() => {
    async function loadNavData() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: athleteProfile } = await supabase
          .from('athletes')
          .select('avatar_url, coins, is_premium')
          .eq('id', session.user.id)
          .maybeSingle();

        if (athleteProfile) {
          setIsAthlete(true);
          setViewerRole('athlete');
          setAvatarUrl(athleteProfile.avatar_url);
          setCoins(athleteProfile.coins || 0);
          setIsPremium(athleteProfile.is_premium || false);
        } else {
          const { data: coachProfile } = await supabase
            .from('coaches')
            .select('id, avatar_url')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (coachProfile) {
            setViewerRole('coach');
            setAvatarUrl(coachProfile.avatar_url);
          }
        }

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

    return () => {
        subscription.unsubscribe();
    };
  }, [pathname, supabase]);

  useEffect(() => {
    if (!session?.user?.id || !isAthlete) return;

    const fetchLatestCoins = async () => {
      const { data } = await supabase.from('athletes').select('coins').eq('id', session.user.id).maybeSingle();
      if (data && typeof data.coins === 'number') {
        setCoins(data.coins);
      }
    };

    const interval = setInterval(fetchLatestCoins, 3000);
    window.addEventListener('focus', fetchLatestCoins);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchLatestCoins);
    };
  }, [session?.user?.id, isAthlete, supabase]);

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
    setIsSearchOpen(false);
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
          
          <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-2 group shrink-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 overflow-hidden group-hover:scale-105 transition-transform">
              <Image 
                src="/icon.png" 
                alt="ChasedSports Icon" 
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

          <div className="flex-1 max-w-md relative hidden md:block" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search athletes..." 
                value={searchQuery} 
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full bg-slate-100 border border-transparent focus:border-blue-300 focus:bg-white text-sm font-medium text-slate-900 rounded-full pl-10 pr-4 py-2 transition-all outline-none"
              />
            </div>
            
            {isSearchOpen && searchQuery.length >= 2 && (
              <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-sm font-bold text-slate-400">Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <Link key={result.id} href={`/athlete/${result.id}`} onClick={() => { setSearchQuery(''); setSearchResults([]); setIsSearchOpen(false); }} className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
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

          <div className="hidden md:flex items-center space-x-6 shrink-0">
            <Link href="/search" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center"><School className="w-4 h-4 mr-1.5" /> College Finder</Link>
            
            {/* 🚨 NEW: Teams Link added specifically for Desktop 🚨 */}
            {session && (
              <Link href="/dashboard/team" className="text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors flex items-center">
                <Shield className="w-4 h-4 mr-1.5" /> Teams
              </Link>
            )}
            
            <div className="relative group">
              <button className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center py-2">
                <Activity className="w-4 h-4 mr-1.5" /> Track & Field <ChevronDown className="w-3 h-3 ml-1 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              
              <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col overflow-hidden transform translate-y-2 group-hover:translate-y-0">
                {session && (
                  <Link href="/dashboard/track" className="px-4 py-3 bg-blue-50/50 hover:bg-blue-100 font-black text-sm text-blue-700 flex items-center border-b border-slate-100 transition-colors">
                    <Activity className="w-4 h-4 mr-2" /> Track Portal
                  </Link>
                )}
                <Link href="/feed" className="px-4 py-3 hover:bg-slate-50 font-bold text-sm text-slate-700 flex items-center transition-colors"><Globe className="w-4 h-4 mr-2 text-indigo-500"/> The Feed</Link>
                <Link href="/leaderboard" className="px-4 py-3 hover:bg-slate-50 font-bold text-sm text-slate-700 flex items-center transition-colors"><Trophy className="w-4 h-4 mr-2 text-amber-500"/> Leaderboards</Link>
                <Link href="/compete" className="px-4 py-3 hover:bg-slate-50 font-bold text-sm text-slate-700 flex items-center transition-colors"><Target className="w-4 h-4 mr-2 text-red-500"/> The Arena</Link>
              </div>
            </div>

            {session ? (
              <>
                <div className="h-4 w-px bg-slate-200 mx-2"></div>
                <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center"><LayoutDashboard className="w-4 h-4 mr-1.5" /> Homebase</Link>
                <Link href="/dashboard/messages" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center relative">
                  <Mail className="w-4 h-4 mr-1.5" /> <span>Inbox</span>
                  {unreadCount > 0 && <span className="absolute -top-2.5 -right-3.5 bg-red-500 text-white text-[10px] leading-none font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm px-1">{unreadCount}</span>}
                </Link>
                
                {isAthlete && (
                  <Link href="/shop" className="flex items-center gap-1 hover:-translate-y-0.5 transition-transform">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <CoinBadge />
                  </Link>
                )}

                {isAthlete && (
                  isPremium ? (
                    <Link href="/pro" title="Manage Subscription" className="ml-2 flex items-center gap-1.5 text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 px-3 py-1.5 rounded-full hover:scale-105 transition-transform shadow-sm">
                      <Crown className="w-3 h-3" />
                      PRO
                    </Link>
                  ) : (
                    <Link href="/pro" className="ml-2 flex items-center gap-1.5 text-xs font-black bg-slate-800 text-amber-400 px-3 py-1.5 rounded-full hover:scale-105 transition-transform shadow-sm">
                      <Zap className="w-3 h-3" />
                      UPGRADE
                    </Link>
                  )
                )}
                
                <button 
                  onClick={handleSignOut} 
                  title="Log Out" 
                  className="relative ml-2 w-10 h-10 rounded-full border-2 border-slate-200 hover:border-red-400 transition-all overflow-hidden flex items-center justify-center bg-slate-100 group shadow-sm shrink-0"
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

          <div className="flex items-center gap-4 md:hidden">
            {session && isAthlete && (
              <Link href="/shop" className="flex items-center">
                <CoinBadge />
              </Link>
            )}

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

      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[64px] z-[50] bg-white overflow-y-auto animate-in slide-in-from-top-5 duration-200 md:hidden">
          <div className="p-6 flex flex-col gap-6">
            
            <div className="relative w-full" ref={mobileSearchRef}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search athletes..." 
                  value={searchQuery} 
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full bg-slate-100 border border-transparent focus:border-blue-300 focus:bg-white text-base font-medium text-slate-900 rounded-2xl pl-12 pr-4 py-4 transition-all outline-none"
                />
              </div>
              
              {isSearchOpen && searchQuery.length >= 2 && (
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

            {/* 🚨 NEW: 2-COLUMN GRID FOR PHONE NAVIGATION 🚨 */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <Link href="/search" onClick={closeMobileMenu} className="bg-slate-50 hover:bg-blue-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors">
                <School className="w-6 h-6 text-blue-500" />
                <span className="font-bold text-slate-700 text-sm">College Finder</span>
              </Link>
              {session ? (
                <Link href="/dashboard/team" onClick={closeMobileMenu} className="bg-slate-50 hover:bg-emerald-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors">
                  <Shield className="w-6 h-6 text-emerald-500" />
                  <span className="font-bold text-slate-700 text-sm">Team HQ</span>
                </Link>
              ) : (
                <Link href="/login" onClick={closeMobileMenu} className="bg-slate-50 hover:bg-emerald-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors">
                  <Shield className="w-6 h-6 text-emerald-500" />
                  <span className="font-bold text-slate-700 text-sm">Teams</span>
                </Link>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100 my-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-2 pl-3">Track & Field</h4>
                {session && (
                  <Link href="/dashboard/track" onClick={closeMobileMenu} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white text-slate-700 font-bold transition-colors">
                    <Activity className="w-5 h-5 text-blue-500" /> Track Portal
                  </Link>
                )}
                <Link href="/feed" onClick={closeMobileMenu} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white text-slate-700 font-bold transition-colors"><Globe className="w-5 h-5 text-indigo-500" /> The Feed</Link>
                <Link href="/leaderboard" onClick={closeMobileMenu} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white text-slate-700 font-bold transition-colors"><Trophy className="w-5 h-5 text-amber-500" /> Leaderboards</Link>
                <Link href="/compete" onClick={closeMobileMenu} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white text-slate-700 font-bold transition-colors"><Target className="w-5 h-5 text-red-500" /> The Arena</Link>
              </div>
              
              {session ? (
                <>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <Link href="/dashboard" onClick={closeMobileMenu} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold text-lg transition-colors"><LayoutDashboard className="w-6 h-6 text-slate-500" /> Homebase</Link>
                  {isAthlete && (
                    <Link href="/shop" onClick={closeMobileMenu} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold text-lg transition-colors">
                      <ShoppingCart className="w-6 h-6 text-blue-600" /> The Shop
                    </Link>
                  )}
                  <Link href="/dashboard/messages" onClick={closeMobileMenu} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold text-lg transition-colors"><Mail className="w-6 h-6 text-slate-500" /> Inbox {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto">{unreadCount} new</span>}</Link>
                  
                  {isAthlete && (
                    isPremium ? (
                      <Link href="/pro" onClick={closeMobileMenu} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-amber-600 font-bold text-lg transition-colors text-left w-full">
                        <Crown className="w-6 h-6" /> Manage Pro
                      </Link>
                    ) : (
                      <Link href="/pro" onClick={closeMobileMenu} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 text-amber-500 font-bold text-lg transition-colors text-left w-full">
                        <Zap className="w-6 h-6" /> Upgrade to Pro
                      </Link>
                    )
                  )}

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