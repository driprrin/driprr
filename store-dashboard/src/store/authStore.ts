import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/axios";

export interface StoreOwner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: "STORE_OWNER" | "ADMIN";
  storeId?: string;
  storeName?: string;
}

interface AuthState {
  user: StoreOwner | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: StoreOwner, token: string) => void;
  fetchProfile: () => Promise<StoreOwner | null>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),

      fetchProfile: async () => {
        const { token } = get();
        if (!token) return null;
        try {
          const res = await api.get<StoreOwner>("/auth/me");
          set({ user: res.data, isAuthenticated: true });
          return res.data;
        } catch {
          return null;
        }
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "driprr-store-auth",
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
);
