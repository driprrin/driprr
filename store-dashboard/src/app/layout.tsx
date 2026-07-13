import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "DRIPRR Store",
  description: "Merchant dashboard for DRIPRR store owners.",
};

const themeScript = `(function(){try{var s=localStorage.getItem('driprr-store-theme');if(s==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <Script id="theme-script" strategy="beforeInteractive">{themeScript}</Script>
        {children}
      </body>
    </html>
  );
}
