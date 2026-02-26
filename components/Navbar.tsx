'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  // If we are on the landing page or the login page, hide this global navbar!
  if (pathname === '/' || pathname === '/login') {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo linked back to Home */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-1.5 rounded-lg shadow-md group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Chased<span className="text-blue-600">Sports</span>
          </span>
        </Link>

        {/* Placeholder for future features, currently just showing the tool status */}
        <div className="flex items-center">
          <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100 hidden sm:block">
            Free Discovery Engine
          </span>
        </div>

      </div>
    </nav>
  );
}