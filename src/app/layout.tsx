import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SessionProvider } from '@/lib/providers/session-provider';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import '@/styles/globals.css';
import { Metadata } from 'next';
import { Viewport } from 'next';
import { Geist } from 'next/font/google';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { TRPCReactProvider } from '@/trpc/react';
import Footer from '@/app/_components/footer';
import Header from '@/app/_components/navbar';
import { auth } from '@/server/auth';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans' 
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  preload: true,
  display: "swap", // Fast font loading
});

export const metadata: Metadata = {
  title: "FixFlow - Professional Service Business Management",
  description: "Streamline your cleaning, maintenance, and repair business with FixFlow's intuitive platform. Designed for solo operators, field workers, and team managers.",
  keywords: "service business, cleaning management, maintenance software, repair scheduling, mobile-first",
  authors: [{ name: "FixFlow Team" }],
  creator: "FixFlow",
  publisher: "FixFlow",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FixFlow",
  },
  openGraph: {
    type: "website",
    siteName: "FixFlow",
    title: "FixFlow - Professional Service Business Management",
    description: "Mobile-first platform for service businesses. Simple for solo operators, powerful for teams.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom on mobile
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Create Supabase client directly
  const supabase = await createServerSupabaseClient();

  // Fetch the session
  const session = await auth();

  return (
    <html lang="en" className={`${geist.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FixFlow" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground overscroll-none">
        <ErrorBoundary>
          <SessionProvider initialSession={session}>
            <TRPCReactProvider>
              <div className="flex min-h-screen flex-col relative">
                {/* Global Header */}
                <Header />
                
                {/* Main content with proper mobile spacing */}
                <main className="flex-grow relative">
                  <div className="min-h-screen">
                    {children}
                  </div>
                </main>
                
                {/* Global Footer */}
                <Footer />
              </div>
            </TRPCReactProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}