import type { Metadata } from "next";
import { Inter, Space_Grotesk, Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import CartFlyAnimation from "@/components/layout/CartFlyAnimation";
import { WebsiteJsonLd, OrganizationJsonLd, LocalBusinessJsonLd } from "@/components/JsonLd";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://driprr.com'),
  title: {
    default: 'Driprr: Fashion Delivery in 30-90 Min',
    template: '%s | Driprr',
  },
  description: 'Driprr is your neighbourhood fashion delivery app, delivering clothing, footwear, streetwear & more from nearby stores to your doorstep in just 30-90 minutes.',
  applicationName: 'Driprr',
  keywords: ['driprr', 'driprr app', 'driprr fashion', 'fashion delivery', 'clothing delivery', 'nearby stores', 'streetwear delivery', 'fast fashion delivery'],
  authors: [{ name: 'Driprr' }],
  creator: 'Driprr',
  publisher: 'Driprr',
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  verification: {
    google: 'L2LjcLzysVozGuYkndImzyf71sUNrUwtpUCYsKPWtyM',
  },
  openGraph: {
    type: 'website',
    siteName: 'Driprr',
    locale: 'en_IN',
    url: 'https://driprr.com',
    title: 'Driprr: Fashion Delivery in 30-90 Min',
    description: 'Driprr is your neighbourhood fashion delivery app, delivering clothing, footwear, streetwear & more from nearby stores to your doorstep in just 30-90 minutes.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Driprr: Fashion Delivery in 30-90 Min',
    description: 'Driprr is your neighbourhood fashion delivery app, delivering clothing, footwear, streetwear & more from nearby stores to your doorstep in just 30-90 minutes.',
  },
};

// Runs before first paint — prevents dark/light flash
// Default: light, unless user explicitly saved "dark"
const themeScript = `(function(){try{var s=localStorage.getItem('driprr-theme');if(s==='dark'){document.documentElement.classList.add('dark');return;}document.documentElement.classList.remove('dark');}catch(e){document.documentElement.classList.remove('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme init — must be first, before any CSS paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined"
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${nunito.variable}`}>
        <GoogleAnalytics />
        <WebsiteJsonLd />
        <OrganizationJsonLd />
        <LocalBusinessJsonLd />
        <ThemeProvider>
          {children}
          <CartFlyAnimation />
        </ThemeProvider>
      </body>
    </html>
  );
}
