import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers/Providers';
import Navbar from '@/components/layout/Navbar';
import MobileNavbar from '@/components/layout/MobileNavbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Voyage Smart - Travel Planning Made Easy',
  description: 'Plan your trips, manage expenses, and collaborate with friends all in one place.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} transition-theme antialiased`}>
        <Providers>
          <Navbar />
          <div className="pb-16 sm:pb-0"> {/* Add padding bottom on mobile for the navbar */}
            {children}
          </div>
          <MobileNavbar />
        </Providers>
      </body>
    </html>
  );
}
