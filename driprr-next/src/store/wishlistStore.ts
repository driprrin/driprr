import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

export interface WishlistItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  image: string;
  addedAt: number;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, "addedAt">) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: Omit<WishlistItem, "addedAt">, userId?: string) => void;
  isWishlisted: (id: string) => boolean;
  totalItems: () => number;
  syncFromDB: (userId: string) => Promise<void>;
  addItemToDB: (userId: string, productId: string) => Promise<void>;
  removeItemFromDB: (userId: string, productId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const exists = get().items.find((i) => i.id === item.id);
        if (!exists) {
          set((state) => ({
            items: [...state.items, { ...item, addedAt: Date.now() }],
          }));
        }
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      toggleItem: (item, userId) => {
        const exists = get().items.find((i) => i.id === item.id);
        if (exists) {
          get().removeItem(item.id);
          if (userId) {
            get().removeItemFromDB(userId, item.id);
          }
        } else {
          get().addItem(item);
          if (userId) {
            get().addItemToDB(userId, item.id);
          }
        }
      },

      isWishlisted: (id) => !!get().items.find((i) => i.id === id),

      totalItems: () => get().items.length,

      // ── DB sync functions ──────────────────────────────────────────────────

      syncFromDB: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from("WishlistItem")
            .select("productId, createdAt")
            .eq("userId", userId);

          if (error) throw error;
          if (!data) return;

          // Merge DB product IDs into local items list.
          // For items only in DB (no local cache), we create a minimal placeholder.
          // Full product details are expected to already be in localStorage from browsing.
          const localItems = get().items;
          const localIds = new Set(localItems.map((i) => i.id));

          const merged: WishlistItem[] = [...localItems];

          for (const row of data) {
            if (!localIds.has(row.productId)) {
              // DB has an item not in localStorage — add a minimal stub.
              // The product page will hydrate full details on next visit.
              merged.push({
                id: row.productId,
                name: "",
                brand: "",
                price: 0,
                originalPrice: 0,
                image: "",
                addedAt: new Date(row.createdAt).getTime(),
              });
            }
          }

          // Remove local items that were deleted from DB (userId was authenticated)
          const dbIds = new Set(data.map((r) => r.productId));
          const reconciled = merged.filter(
            (item) => dbIds.has(item.id) || item.name !== ""
          );

          set({ items: reconciled });
        } catch (err) {
          console.error("[wishlistStore] syncFromDB failed:", err);
        }
      },

      addItemToDB: async (userId: string, productId: string) => {
        try {
          const { error } = await supabase
            .from("WishlistItem")
            .upsert({ userId, productId }, { onConflict: "userId,productId" });
          if (error) throw error;
        } catch (err) {
          console.error("[wishlistStore] addItemToDB failed:", err);
        }
      },

      removeItemFromDB: async (userId: string, productId: string) => {
        try {
          const { error } = await supabase
            .from("WishlistItem")
            .delete()
            .eq("userId", userId)
            .eq("productId", productId);
          if (error) throw error;
        } catch (err) {
          console.error("[wishlistStore] removeItemFromDB failed:", err);
        }
      },
    }),
    { name: "driprr-wishlist" }
  )
);
