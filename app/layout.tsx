import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import Navbar from '@/components/Navbar'; // Importing our new smart navbar

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

        {/* The Smart Global Navigation Bar */}
        <Navbar />

        {/* This renders whatever specific page you are currently on */}
        {children}
        
      </body>
    </html>
  );
}