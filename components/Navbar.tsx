'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Mail, Search, LogOut, LayoutDashboard, User, School, Medal, Menu, X, ShoppingCart, Crown, Zap, Shield, Calculator, Flame } from 'lucide-react'; 

export default function Navbar() {
  const [supabase] = useState(() => createClient());
  
  const router = useRouter();
  const pathname = usePathname();
  
  const [session, setSession] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // --- ROLE & BILLING STATE ---
  const [isAthlete, setIsAthlete] = useState(false);
  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');
  const [isPremium, setIsPremium] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  
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
    let isMounted = true;

    const fetchSearch = async () => {
      const queryText = searchQuery.trim();
      
      if (queryText.length < 2) {
        if (isMounted) setSearchResults([]);
        return;
      }
      if (isMounted) setIsSearching(true);

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
        
      const { data, error } = await query;

      if (error) {
        console.error("Athlete search query failed:", error.message);
        if (isMounted) setIsSearching(false);
        return;
      }

      if (data && isMounted) {
        setSearchResults(data);
        
        if (viewerRole === 'coach' && data.length > 0) {
           const idsToUpdate = data.map((athlete: any) => athlete.id);
           
           const { error: rpcError } = await supabase.rpc('increment_search_appearances', { 
             athlete_ids: idsToUpdate 
           });
           
           if (rpcError) {
             console.error("Failed to increment search appearances:", rpcError.message);
           }
        }
      }
      
      if (isMounted) setIsSearching(false);
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSearch();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(delayDebounceFn);
    };
  }, [searchQuery, viewerRole, supabase]);

  const loadNavData = useCallback(async (currentSession: any) => {
    if (!currentSession) {
      setSession(null);
      setIsAthlete(false);
      setViewerRole('guest');
      return;
    }

    setSession(currentSession);
    const userId = currentSession.user.id;
    const userEmail = currentSession.user.email;

    const [athleteRes, messagesRes] = await Promise.all([
      supabase.from('athletes').select('avatar_url, is_premium, is_founder').eq('id', userId).maybeSingle(),
      supabase.from('messages').select('id, athlete_id, chat_history').or(`athlete_id.eq.${userId},sender_email.eq.${userEmail}`).eq('is_read', false)
    ]);

    if (athleteRes.data) {
      setIsAthlete(true);
      setViewerRole('athlete');
      setAvatarUrl(athleteRes.data.avatar_url);
      setIsPremium(athleteRes.data.is_premium || false);
      setIsFounder(athleteRes.data.is_founder || false);
    } else {
      const { data: coachProfile } = await supabase
        .from('coaches')
        .select('id, avatar_url, is_founder')
        .eq('id', userId)
        .maybeSingle();
        
      if (coachProfile) {
        setViewerRole('coach');
        setAvatarUrl(coachProfile.avatar_url);
        setIsFounder(coachProfile.is_founder || false);
        setIsAthlete(false);
      }
    }

    if (messagesRes.data) {
      const realUnreadCount = messagesRes.data.filter((msg: any) => {
        const history = msg.chat_history || [];
        if (history.length > 0) {
          return history[history.length - 1].sender_id !== userId;
        }
        return msg.athlete_id === userId;
      }).length;
      
      setUnreadCount(realUnreadCount);
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) loadNavData(session);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, newSession: any) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        if (isMounted) loadNavData(newSession);
      }
    });

    return () => {
        isMounted = false;
        subscription.unsubscribe();
    };
  }, [supabase, loadNavData]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAthlete(false);
    setViewerRole('guest');
    setAvatarUrl(null);
    setUnreadCount(0);
    setIsMobileMenuOpen(false);
    router.push('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const isActive = (path: string) => {
    return pathname === path || (path !== '/' && pathname.startsWith(path));
  };

  if (pathname === '/login') return null;

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-lg border-b border-slate-200/80 shadow-sm sticky top-0 z-[60] transition-colors">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Primary Navigation Area */}
          <div className="flex flex-1 items-center justify-start shrink-0">
            <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-2 group">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 overflow-hidden group-hover:scale-105 transition-transform">
                <Image 
                  src="/icon.png" 
                  alt="ChasedSports Icon" 
                  fill
                  sizes="(max-width: 768px) 40px, 48px"
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 hidden sm:block">
                Chased<span className="text-blue-600">Sports</span>
              </span>
            </Link>
          </div>

          {/* Centered Search Bar */}
          <div className="hidden md:flex w-full max-w-2xl px-4 lg:px-8 shrink" ref={searchRef}>
            <div className="w-full relative shadow-sm rounded-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search athletes..." 
                value={searchQuery} 
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full bg-slate-100/80 hover:bg-slate-100 border border-slate-200 focus:border-blue-300 focus:bg-white text-base font-medium text-slate-900 rounded-full pl-14 pr-6 py-3.5 transition-all outline-none focus:shadow-md"
              />
              
              {isSearchOpen && searchQuery.length >= 2 && (
                <div className="absolute top-full mt-3 left-0 w-full min-w-[350px] bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col z-50">
                  {isSearching ? (
                    <div className="p-6 text-center text-sm font-bold text-slate-400">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(result => (
                      <Link key={result.id} href={`/athlete/${result.id}`} onClick={() => { setSearchQuery(''); setSearchResults([]); setIsSearchOpen(false); }} className="flex items-center gap-4 p-4 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {result.avatar_url ? <img src={result.avatar_url} alt="" className="w-full h-full object-cover"/> : <Medal className="w-6 h-6 text-slate-400"/>}
                        </div>
                        <div className="truncate">
                          <p className="text-base font-black text-slate-900 truncate">{result.first_name} {result.last_name}</p>
                          <p className="text-sm font-medium text-slate-500 truncate">{result.high_school}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-6 text-center text-sm font-bold text-slate-400">No athletes found.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side Links & Tools */}
          <div className="hidden md:flex flex-1 items-center justify-end space-x-3 lg:space-x-5 shrink-0">
            <Link href="/division-checker" className={`text-sm font-bold flex items-center whitespace-nowrap transition-colors ${isActive('/division-checker') ? 'text-fuchsia-600' : 'text-slate-500 hover:text-fuchsia-600'}`}>
              <Calculator className="w-4 h-4 mr-1.5" /> <span className="hidden lg:inline">Division Tracker</span>
            </Link>

            <Link href="/search" className={`text-sm font-bold flex items-center whitespace-nowrap transition-colors ${isActive('/search') ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>
              <School className="w-4 h-4 mr-1.5" /> <span className="hidden lg:inline">College Finder</span>
            </Link>

            <Link href="/feed" className={`text-sm font-bold flex items-center whitespace-nowrap transition-colors ${isActive('/feed') ? 'text-orange-600' : 'text-slate-500 hover:text-orange-600'}`}>
              <Flame className="w-4 h-4 mr-1.5" /> <span className="hidden lg:inline">Feed</span>
            </Link>
            
            {session && (
              <Link href="/dashboard/team" className={`text-sm font-bold flex items-center whitespace-nowrap transition-colors ${isActive('/dashboard/team') ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}>
                <Shield className="w-4 h-4 mr-1.5" /> <span className="hidden lg:inline">Teams</span>
              </Link>
            )}

            {session ? (
              <>
                <div className="h-6 w-px bg-slate-200 mx-1 lg:mx-2 shrink-0"></div>
                <Link href="/dashboard" className={`text-sm font-bold flex items-center whitespace-nowrap transition-colors ${isActive('/dashboard') && !isActive('/dashboard/team') && !isActive('/dashboard/messages') ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`} title="Dashboard Homebase">
                  <LayoutDashboard className="w-4 h-4" /><span className="hidden lg:inline ml-1.5">Homebase</span>
                </Link>
                <Link href="/dashboard/messages" className={`text-sm font-bold flex items-center relative whitespace-nowrap transition-colors ${isActive('/dashboard/messages') ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`} title="Inbox">
                  <Mail className="w-4 h-4" /> <span className="hidden lg:inline ml-1.5">Inbox</span>
                  {unreadCount > 0 && <span className="absolute -top-2.5 -right-3 bg-red-500 text-white text-[10px] leading-none font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm px-1">{unreadCount}</span>}
                </Link>
                
                {isAthlete && (
                  <Link href="/shop" className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all ml-1 lg:ml-2 ${isActive('/shop') ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'}`} title="The Shop">
                    <ShoppingCart className="w-5 h-5" />
                  </Link>
                )}

                {/* Main CTA */}
                {isAthlete && (
                  isFounder ? (
                    <Link href="/pro" title="Founder Status" className="ml-1 lg:ml-2 flex items-center gap-1.5 text-xs font-black bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white px-3 py-1.5 rounded-full hover:scale-105 transition-transform shadow-sm whitespace-nowrap">
                      <Crown className="w-3 h-3" /> EARLY ACCESS
                    </Link>
                  ) : isPremium ? (
                    <Link href="/pro" title="Manage Subscription" className="ml-1 lg:ml-2 flex items-center gap-1.5 text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 px-3 py-1.5 rounded-full hover:scale-105 transition-transform shadow-sm whitespace-nowrap">
                      <Crown className="w-3 h-3" /> PRO
                    </Link>
                  ) : (
                    <Link href="/pro" className="ml-1 lg:ml-2 flex items-center gap-1.5 text-xs font-black bg-slate-800 text-amber-400 px-3 py-1.5 rounded-full hover:scale-105 transition-transform shadow-sm whitespace-nowrap">
                      <Zap className="w-3 h-3" /> UPGRADE
                    </Link>
                  )
                )}
                
                {/* Linked Profile Icon */}
                <Link 
                  href="/dashboard/profile"
                  title="My Profile" 
                  className={`relative ml-1 lg:ml-2 w-10 h-10 rounded-full border-2 transition-all overflow-hidden flex items-center justify-center bg-slate-100 group shadow-sm shrink-0 ${isActive('/dashboard/profile') ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-400'}`}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </Link>

                {/* Dedicated Logout Icon */}
                <button 
                  onClick={handleSignOut} 
                  title="Log Out" 
                  className="ml-1 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all shrink-0"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link href="/login" className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-600/20 ml-2 whitespace-nowrap">Log In</Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-4 md:hidden">
            {session && isAthlete && (
              <Link href="/shop" className={`p-2 transition-colors rounded-lg ${isActive('/shop') ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:bg-slate-100 hover:text-emerald-600'}`}>
                <ShoppingCart className="w-6 h-6" />
              </Link>
            )}

            {session && (
               <Link href="/dashboard/messages" className={`relative p-2 transition-colors ${isActive('/dashboard/messages') ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`} onClick={closeMobileMenu}>
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

      {/* Mobile Slide-Out Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[80px] z-[50] bg-white overflow-y-auto animate-in slide-in-from-top-5 duration-200 md:hidden">
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
                      <Link key={result.id} href={`/athlete/${result.id}`} onClick={closeMobileMenu} className="flex items-center gap-4 p-4 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {result.avatar_url ? <img src={result.avatar_url} alt="" className="w-full h-full object-cover"/> : <Medal className="w-6 h-6 text-slate-400"/>}
                        </div>
                        <div className="truncate">
                          <p className="text-base font-bold text-slate-900 truncate">{result.first_name} {result.last_name}</p>
                          <p className="text-sm font-medium text-slate-500 truncate">{result.high_school}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm font-bold text-slate-400">No athletes found.</div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2">
              <Link href="/division-checker" onClick={closeMobileMenu} className={`border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors col-span-1 ${isActive('/division-checker') ? 'bg-fuchsia-50 border-fuchsia-200' : 'bg-slate-50 hover:bg-fuchsia-50 border-slate-100'}`}>
                <Calculator className="w-6 h-6 text-fuchsia-500" />
                <span className="font-bold text-slate-700 text-sm">Division Tracker</span>
              </Link>
              <Link href="/search" onClick={closeMobileMenu} className={`border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors col-span-1 ${isActive('/search') ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 hover:bg-blue-50 border-slate-100'}`}>
                <School className="w-6 h-6 text-blue-500" />
                <span className="font-bold text-slate-700 text-sm">College Finder</span>
              </Link>
              
              <Link href="/feed" onClick={closeMobileMenu} className={`border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors ${session ? 'col-span-1' : 'col-span-2'} ${isActive('/feed') ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 hover:bg-orange-50 border-slate-100'}`}>
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="font-bold text-slate-700 text-sm">Feed</span>
              </Link>

              {session && (
                <Link href="/dashboard/team" onClick={closeMobileMenu} className={`border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors col-span-1 ${isActive('/dashboard/team') ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 hover:bg-emerald-50 border-slate-100'}`}>
                  <Shield className="w-6 h-6 text-emerald-500" />
                  <span className="font-bold text-slate-700 text-sm">Team HQ</span>
                </Link>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {session ? (
                <>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <Link href="/dashboard" onClick={closeMobileMenu} className={`flex items-center gap-4 p-4 rounded-2xl font-bold text-lg transition-colors ${isActive('/dashboard') && !isActive('/dashboard/profile') && !isActive('/dashboard/messages') ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}>
                    <LayoutDashboard className={`w-6 h-6 ${isActive('/dashboard') ? 'text-blue-500' : 'text-slate-500'}`} /> Homebase
                  </Link>
                  {isAthlete && (
                    <Link href="/shop" onClick={closeMobileMenu} className={`flex items-center gap-4 p-4 rounded-2xl font-bold text-lg transition-colors ${isActive('/shop') ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-700'}`}>
                      <ShoppingCart className="w-6 h-6 text-emerald-500" /> The Shop
                    </Link>
                  )}
                  <Link href="/dashboard/messages" onClick={closeMobileMenu} className={`flex items-center gap-4 p-4 rounded-2xl font-bold text-lg transition-colors ${isActive('/dashboard/messages') ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}>
                    <Mail className={`w-6 h-6 ${isActive('/dashboard/messages') ? 'text-blue-500' : 'text-slate-500'}`} /> Inbox {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto">{unreadCount} new</span>}
                  </Link>

                  <Link href="/dashboard/profile" onClick={closeMobileMenu} className={`flex items-center gap-4 p-4 rounded-2xl font-bold text-lg transition-colors ${isActive('/dashboard/profile') ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}>
                    <User className={`w-6 h-6 ${isActive('/dashboard/profile') ? 'text-blue-500' : 'text-slate-500'}`} /> My Profile
                  </Link>
                  
                  {isAthlete && (
                    isFounder ? (
                      <Link href="/pro" onClick={closeMobileMenu} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-fuchsia-50 text-fuchsia-600 font-bold text-lg transition-colors text-left w-full">
                        <Crown className="w-6 h-6" /> Early Access
                      </Link>
                    ) : isPremium ? (
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