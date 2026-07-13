import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/axios";

export interface User {
  id: string;
  phone: string;
  name: string;
  avatar?: string;
  email?: string;
  role: "CUSTOMER" | "STORE_OWNER" | "RIDER" | "ADMIN";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  fetchProfile: () => Promise<User | null>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        // Single source of truth — Zustand persist handles localStorage via "driprr-auth" key
        set({ user, token, isAuthenticated: true });
      },

      fetchProfile: async () => {
        const { token } = get();
        if (!token) return null;
        try {
          const res = await api.get<User>("/auth/me");
          set({ user: res.data, isAuthenticated: true });
          return res.data;
        } catch (error) {
          console.error("fetchProfile failed:", error);
          return null;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "driprr-auth",
      // Only persist what we need — avoids stale function references
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
