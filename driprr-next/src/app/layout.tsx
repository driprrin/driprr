import type { Metadata } from "next";
import { Inter, Space_Grotesk, Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import CartFlyAnimation from "@/components/layout/CartFlyAnimation";
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
  title: "DRIPRR",
  description: "Discover and order premium streetwear from stores near you.",
  openGraph: {
    title: "DRIPRR",
    description: "Discover and order premium streetwear from stores near you.",
    type: "website",
  },
  twitter: { card: "summary" },
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
        <ThemeProvider>
          {children}
          <CartFlyAnimation />
        </ThemeProvider>
      </body>
    </html>
  );
}
