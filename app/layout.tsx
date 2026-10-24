// app/layout.tsx
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import Navbar from '@/components/Navbar';

// @ts-ignore: Silences VS Code's TS Server false-positive on sibling CSS files
// eslint-disable-next-line
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://chasedsports.com'),

  title: 'ChasedSports | The Athletic Recruiting Network',
  description:
    'The data-driven recruiting platform connecting high school athletes with college programs. Build your profile, verify your stats, and discover your true market value.',

  alternates: {
    canonical: 'https://chasedsports.com',
  },

  openGraph: {
    title: 'ChasedSports | The Athletic Recruiting Network',
    description:
      'The data-driven recruiting platform connecting high school athletes with college programs.',
    url: 'https://chasedsports.com',
    siteName: 'ChasedSports',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'ChasedSports Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'ChasedSports | The Athletic Recruiting Network',
    description:
      'The data-driven recruiting platform connecting high school athletes with college programs.',
    images: ['/icon.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-pt-20">
      <body className="bg-[#F8FAFC] min-h-screen flex flex-col overflow-x-clip">
        {/* GLOBAL NAVBAR */}
        <Navbar />

        {/* PAGE CONTENT */}
        <div className="flex-1 w-full relative overflow-x-clip">
          {children}
        </div>

        {/* VERCEL ANALYTICS */}
        <Analytics />
      </body>
    </html>
  );
}