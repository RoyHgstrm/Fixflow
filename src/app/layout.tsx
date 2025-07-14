import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import Header from "./_components/navbar";
import Footer from "./_components/footer";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "FixFlow App",
  description: "Streamline your cleaning, maintenance, and small repair business.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} dark`}>
      <body>
        <SessionProvider>
          <TRPCReactProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
