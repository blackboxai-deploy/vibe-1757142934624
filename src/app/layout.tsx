import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LinkTracker - Advanced Link Analytics',
  description: 'Create tracking links and get detailed analytics about your audience location and behavior',
  keywords: 'link tracking, analytics, geolocation, short links, url shortener',
  authors: [{ name: 'LinkTracker' }],
  creator: 'LinkTracker',
  publisher: 'LinkTracker',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://linktracker.app',
    title: 'LinkTracker - Advanced Link Analytics',
    description: 'Create tracking links and get detailed analytics about your audience location and behavior',
    siteName: 'LinkTracker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkTracker - Advanced Link Analytics',
    description: 'Create tracking links and get detailed analytics about your audience location and behavior',
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          {children}
          <Toaster richColors position="top-right" />
        </div>
      </body>
    </html>
  );
}