"use client";

import { useTheme } from "./ThemeProvider";

interface DriprrLogoProps {
  className?: string;
  height?: number;
}

export default function DriprrLogo({ className = "", height = 44 }: DriprrLogoProps) {
  const { theme } = useTheme();
  // Off-white on dark, near-black on light
  const color = theme === "dark" ? "#F0EDE8" : "#0f0e0d";

  return (
    <span
      className={`inline-flex items-center select-none ${className}`}
      style={{
        fontFamily: "var(--font-nunito), 'Nunito', sans-serif",
        fontWeight: 900,
        fontSize: height * 0.95,
        lineHeight: 1,
        color,
        letterSpacing: "-0.03em",
      }}
      aria-label="driprr"
    >
      driprr
    </span>
  );
}
