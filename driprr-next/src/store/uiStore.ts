import { create } from "zustand";

interface UIState {
  isSearchOpen: boolean;
  isCartOpen: boolean;
  activeCategory: string;
  setSearchOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setActiveCategory: (category: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSearchOpen: false,
  isCartOpen: false,
  activeCategory: "All",
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setCartOpen: (open) => set({ isCartOpen: open }),
  setActiveCategory: (category) => set({ activeCategory: category }),
}));
