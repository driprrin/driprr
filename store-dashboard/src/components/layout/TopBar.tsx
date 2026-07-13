"use client";

import { Bell, Menu } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";

interface TopBarProps {
  title: string;
  onMenuClick?: () => void;
}

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="h-14 px-5 flex items-center justify-between border-b border-border-low bg-surface-1/80 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-2 text-text-mute"
        >
          <Menu size={18} />
        </button>
        <h1 className="font-display font-black text-lg text-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-2 text-text-dim hover:text-text-primary transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        {/* Avatar */}
        {mounted && user && (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <span className="text-xs font-black text-primary">
              {user.name?.[0]?.toUpperCase() ?? "S"}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
