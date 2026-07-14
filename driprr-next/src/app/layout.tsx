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
    default: 'Driprr | Fashion from Nearby Stores, Delivered Fast',
    template: '%s | Driprr',
  },
  description: 'Discover fashion from nearby stores on Driprr. Shop clothing, footwear, accessories, and streetwear with fast local delivery in Hubli-Dharwad.',
  applicationName: 'Driprr',
  authors: [{ name: 'Driprr' }],
  creator: 'Driprr',
  publisher: 'Driprr',
  formatDetection: { telephone: false, email: false, address: false },
  alternates: { canonical: 'https://driprr.com' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: 'website',
    siteName: 'Driprr',
    locale: 'en_IN',
    url: 'https://driprr.com',
    title: 'Driprr | Fashion from Nearby Stores, Delivered Fast',
    description: 'Shop clothing, footwear, accessories, and streetwear from nearby fashion stores with fast local delivery on Driprr.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Driprr | Fashion from Nearby Stores, Delivered Fast',
    description: 'Shop clothing, footwear, accessories, and streetwear from nearby fashion stores with fast local delivery.',
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
