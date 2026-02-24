import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Activity } from 'lucide-react';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChasedSports | College XC & Track Recruiting',
  description: 'The free college discovery & standards engine for XC/Track athletes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F8FAFC] text-slate-900`}>
        
        {/* Google Analytics */}
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-5WC5D6QFDE" 
          strategy="afterInteractive" 
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5WC5D6QFDE');
          `}
        </Script>

        {/* The Global Navigation Bar */}
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

        {/* This renders whatever specific page you are currently on */}
        {children}
        
      </body>
    </html>
  );
}