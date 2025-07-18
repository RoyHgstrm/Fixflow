import { type Metadata, type Viewport } from "next";

export const metadata: Metadata = {
  title: "FixFlow - Professional Service Business Management",
  description: "Streamline your cleaning, maintenance, and repair business with FixFlow's intuitive platform. Designed for solo operators, field workers, and team managers.",
  keywords: "service business, cleaning management, maintenance software, repair scheduling, mobile-first",
  authors: [{
    name: "FixFlow Team"
  }],
  creator: "FixFlow",
  publisher: "FixFlow",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: [{
    rel: "icon",
    url: "/favicon.ico"
  }],
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
  themeColor: [{
    media: "(prefers-color-scheme: light)",
    color: "#ffffff"
  }, {
    media: "(prefers-color-scheme: dark)",
    color: "#0a0a0a"
  }],
};