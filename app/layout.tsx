import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
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
        url: '/icon.png', // Pointing directly to your existing icon!
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC]">
        {/* GLOBAL NAVBAR */}
        <Navbar />
        
        {/* PAGE CONTENT */}
        {children}
      </body>
    </html>
  );
}