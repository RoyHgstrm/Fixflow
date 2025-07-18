'use client';

import "@/styles/globals.css";

import Script from "next/script";
import Header from "./_components/navbar";
import Footer from "./_components/footer";

import ClientOnly from './_components/ClientOnly';
import dynamic from 'next/dynamic';

const ClientProviders = dynamic(() => import('./_components/ClientProviders').then((mod) => mod.ClientProviders), { ssr: false });

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" translate="no">
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
        <ClientOnly>
          <ClientProviders>
            <div className="flex min-h-screen flex-col relative">
              {/* Mobile-optimized header */}
              <ClientOnly>
                <Header />
              </ClientOnly>
              
              {/* Main content with proper mobile spacing */}
              <main className="flex-grow relative">
                <div className="min-h-screen">
                  {children}
                </div>
              </main>
              
              {/* Footer - hidden on mobile dashboard pages */}
              <ClientOnly>
                <div className="block">
                  <Footer />
                </div>
              </ClientOnly>
            </div>
          </ClientProviders>
        </ClientOnly>
      </body>
    </html>
  );
}
