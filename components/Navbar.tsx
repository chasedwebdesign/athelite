'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Activity, Mail, Search, LogOut, LayoutDashboard, User, School, Trophy, Globe, Medal } from 'lucide-react'; 

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  
  const [session, setSession] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // --- GLOBAL SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
        setSearchQuery('');
      }
      setDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle live search typing
  useEffect(() => {
    const fetchSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      // Search first or last name
      const { data } = await supabase
        .from('athletes')
        .select('id, first_name, last_name, avatar_url, high_school')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .gt('trust_level', 0)
        .limit(5);
        
      if (data) setSearchResults(data);
      setIsSearching(false);
    };

    // Small delay so it doesn't query on every single keystroke instantly
    const delayDebounceFn = setTimeout(() => {
      fetchSearch();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, supabase]);

  // Check auth and load avatar/messages
  useEffect(() => {
    async function loadNavData() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: profile } = await supabase.from('athletes').select('avatar_url').eq('id', session.user.id).single();
        if (profile) setAvatarUrl(profile.avatar_url);

        const { count } = await supabase.from('messages').select('id', { count: 'exact' }).eq('athlete_id', session.user.id).eq('is_read', false);
        setUnreadCount(count || 0);
      }
    }
    
    loadNavData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') loadNavData();
    });

    return () => subscription.unsubscribe();
  }, [pathname, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setDropdownOpen(false);
    router.push('/login');
  };

  if (pathname === '/login') return null;

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-md group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 hidden lg:block">
            Chased<span className="text-blue-600">Sports</span>
          </span>
        </Link>

        {/* GLOBAL SEARCH BAR */}
        <div className="flex-1 max-w-md relative hidden sm:block" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search athletes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-transparent focus:border-blue-300 focus:bg-white text-sm font-medium text-slate-900 rounded-full pl-10 pr-4 py-2 transition-all outline-none"
            />
          </div>

          {/* SEARCH RESULTS DROPDOWN */}
          {searchQuery.length >= 2 && (
            <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-2">
              {isSearching ? (
                <div className="p-4 text-center text-sm font-bold text-slate-400">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(result => (
                  <Link 
                    key={result.id} 
                    href={`/athlete/${result.id}`}
                    onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                  >
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

        {/* RIGHT NAVIGATION */}
        <div className="flex items-center space-x-2 md:space-x-6 shrink-0">
          
          <Link href="/feed" className="hidden md:flex text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors items-center">
            <Globe className="w-4 h-4 mr-1.5" /> Feed
          </Link>

          <Link href="/leaderboard" className="hidden md:flex text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors items-center">
            <Trophy className="w-4 h-4 mr-1.5" /> Leaderboards
          </Link>

          {session ? (
            <>
              <Link href="/dashboard" className="hidden md:flex text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors items-center">
                <LayoutDashboard className="w-4 h-4 mr-1.5" /> Dashboard
              </Link>

              <Link href="/dashboard/messages" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center relative">
                <Mail className="w-5 h-5 md:w-4 md:h-4 md:mr-1.5" /> 
                <span className="hidden md:inline">Inbox</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 md:-top-2.5 md:-right-3.5 bg-red-500 text-white text-[10px] leading-none font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm px-1">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <div className="relative ml-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                  className="w-10 h-10 rounded-full border-2 border-slate-200 hover:border-blue-500 transition-colors overflow-hidden flex items-center justify-center bg-slate-100"
                >
                  {avatarUrl ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-slate-400" />}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 flex flex-col animate-in slide-in-from-top-2 duration-200">
                    <button onClick={handleSignOut} className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 text-left flex items-center w-full rounded-xl">
                      <LogOut className="w-4 h-4 mr-2" /> Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/login" className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-600/20">
              Log In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}