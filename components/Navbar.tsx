'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
// ADDED: Trophy icon
import { Activity, Mail, Search, LogOut, LayoutDashboard, User, School, Trophy } from 'lucide-react'; 

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  
  const [session, setSession] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Close the profile dropdown if you click anywhere else on the screen
  useEffect(() => {
    const closeDrop = () => setDropdownOpen(false);
    if (dropdownOpen) document.addEventListener('click', closeDrop);
    return () => document.removeEventListener('click', closeDrop);
  }, [dropdownOpen]);

  // Check auth and load avatar/messages every time the page changes
  useEffect(() => {
    async function loadNavData() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // Get profile picture
        const { data: profile } = await supabase.from('athletes').select('avatar_url').eq('id', session.user.id).single();
        if (profile) setAvatarUrl(profile.avatar_url);

        // Get unread messages
        const { count } = await supabase.from('messages').select('id', { count: 'exact' }).eq('athlete_id', session.user.id).eq('is_read', false);
        setUnreadCount(count || 0);
      }
    }
    
    loadNavData();

    // Listen for logins/logouts
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

  // Keep the login page totally clean (no navbar needed there)
  if (pathname === '/login') return null;

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-md group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">
            Chased<span className="text-blue-600">Sports</span>
          </span>
        </Link>

        {/* RIGHT NAVIGATION */}
        <div className="flex items-center space-x-6">
          
          <Link href="/search" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center">
            <School className="w-4 h-4 mr-1.5" /> Find Colleges
          </Link>

          <Link href="/athletes" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center">
            <Search className="w-4 h-4 mr-1.5" /> Find Recruits
          </Link>

          {/* NEW: LEADERBOARDS LINK */}
          <Link href="/leaderboard" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center">
            <Trophy className="w-4 h-4 mr-1.5" /> Leaderboards
          </Link>

          {session ? (
            <>
              {/* DASHBOARD */}
              <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center">
                <LayoutDashboard className="w-4 h-4 mr-1.5" /> Dashboard
              </Link>

              {/* INBOX (LOGGED IN) */}
              <Link href="/dashboard/messages" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center relative">
                <Mail className="w-4 h-4 mr-1.5" /> 
                <span>Inbox</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-2.5 -right-3.5 bg-red-500 text-white text-[10px] leading-none font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm px-1">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* PROFILE DROPDOWN (LOGGED IN) */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
                  className="w-10 h-10 rounded-full border-2 border-slate-200 hover:border-blue-500 transition-colors overflow-hidden flex items-center justify-center bg-slate-100"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {/* THE DROPDOWN MENU */}
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
            /* LOGIN BUTTON (LOGGED OUT) */
            <Link href="/login" className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-600/20">
              Athlete Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}