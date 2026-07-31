import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import Navbar from '@/components/Navbar';

// @ts-ignore: Silences VS Code's TS Server false-positive on sibling CSS files
// eslint-disable-next-line
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.chasedsports.com'),
  
  title: 'ChasedSports | The Athletic Recruiting Network',
  description: 'The data-driven recruiting platform connecting high school athletes with college programs. Build your profile, verify your stats, and discover your true market value.',
  
  // These make your links look like rich, clickable cards in iMessage and Social Media
  openGraph: {
    title: 'ChasedSports | The Athletic Recruiting Network',
    description: 'The data-driven recruiting platform connecting high school athletes with college programs.',
    url: 'https://www.chasedsports.com',
    siteName: 'ChasedSports',
    images: [
      {
        url: '/icon.png', // Because of metadataBase, Next.js now knows this is https://www.chasedsports.com/icon.png
        width: 512,       // Standard icon width
        height: 512,      // Standard icon height
        alt: 'ChasedSports Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary', // Changed to "summary" so it formats your square icon perfectly
    title: 'ChasedSports | The Athletic Recruiting Network',
    description: 'The data-driven recruiting platform connecting high school athletes with college programs.',
    images: ['/icon.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC]">
        {/* GLOBAL NAVBAR */}
        <Navbar />
        
        {/* PAGE CONTENT */}
        {children}

        {/* 🚨 VERCEL ANALYTICS */}
        <Analytics />
      </body>
    </html>
  );
}