import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

export interface SavedAddress {
  id: string;
  label: string; // "Home", "Work", "Other"
  name: string;
  phone: string;
  address: string;
  landmark?: string;
  city?: string;
  pincode: string;
  isDefault: boolean;
  createdAt: number;
  lat?: number | null;
  lng?: number | null;
}

type AddressInput = Omit<SavedAddress, "id" | "createdAt">;

interface AddressState {
  addresses: SavedAddress[];
  addAddress: (addr: AddressInput, userId?: string) => Promise<void>;
  updateAddress: (id: string, addr: Partial<AddressInput>, userId?: string) => Promise<void>;
  removeAddress: (id: string, userId?: string) => Promise<void>;
  setDefault: (id: string, userId?: string) => Promise<void>;
  getDefault: () => SavedAddress | undefined;
  syncFromDB: (userId: string) => Promise<void>;
  addAddressToDB: (userId: string, addr: AddressInput) => Promise<SavedAddress | null>;
  updateAddressInDB: (id: string, addr: Partial<AddressInput>) => Promise<void>;
  removeAddressFromDB: (id: string) => Promise<void>;
  setDefaultInDB: (id: string, userId: string) => Promise<void>;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],

      addAddress: async (addr, userId) => {
        if (userId) {
          // Persist to DB first; use the DB-generated id
          const created = await get().addAddressToDB(userId, addr);
          if (created) {
            set((state) => {
              const updated = addr.isDefault
                ? state.addresses.map((a) => ({ ...a, isDefault: false }))
                : state.addresses;
              return { addresses: [...updated, created] };
            });
            return;
          }
        }

        // Offline fallback
        const newAddr: SavedAddress = {
          ...addr,
          id: `addr_${Date.now()}`,
          createdAt: Date.now(),
          isDefault: get().addresses.length === 0 ? true : addr.isDefault,
        };
        set((state) => {
          const updated = addr.isDefault
            ? state.addresses.map((a) => ({ ...a, isDefault: false }))
            : state.addresses;
          return { addresses: [...updated, newAddr] };
        });
      },

      updateAddress: async (id, addr, userId) => {
        // Optimistic local update
        set((state) => {
          let addresses = state.addresses.map((a) =>
            a.id === id ? { ...a, ...addr } : a
          );
          if (addr.isDefault) {
            addresses = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
          }
          return { addresses };
        });

        if (userId) {
          await get().updateAddressInDB(id, addr);
          if (addr.isDefault) {
            await get().setDefaultInDB(id, userId);
          }
        }
      },

      removeAddress: async (id, userId) => {
        set((state) => {
          const remaining = state.addresses.filter((a) => a.id !== id);
          const hadDefault = state.addresses.find((a) => a.id === id)?.isDefault;
          if (hadDefault && remaining.length > 0) {
            remaining[0] = { ...remaining[0], isDefault: true };
          }
          return { addresses: remaining };
        });

        if (userId) {
          await get().removeAddressFromDB(id);
        }
      },

      setDefault: async (id, userId) => {
        set((state) => ({
          addresses: state.addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          })),
        }));

        if (userId) {
          await get().setDefaultInDB(id, userId);
        }
      },

      getDefault: () => get().addresses.find((a) => a.isDefault),

      // ── DB sync functions ──────────────────────────────────────────────────

      syncFromDB: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from("Address")
            .select("*")
            .eq("userId", userId)
            .order("createdAt", { ascending: true });

          if (error) throw error;
          if (!data) return;

          const mapped: SavedAddress[] = data.map((row) => ({
            id: row.id,
            label: row.label ?? "Home",
            name: row.name ?? "",
            phone: row.phone ?? "",
            address: row.address ?? "",
            landmark: row.landmark ?? undefined,
            city: row.city ?? undefined,
            pincode: row.pincode ?? "",
            isDefault: row.isDefault ?? false,
            createdAt: row.createdAt
              ? new Date(row.createdAt).getTime()
              : Date.now(),
            lat: row.lat ?? null,
            lng: row.lng ?? null,
          }));

          set({ addresses: mapped });
        } catch (err) {
          console.error("[addressStore] syncFromDB failed:", err);
        }
      },

      addAddressToDB: async (userId: string, addr: AddressInput) => {
        try {
          const { data, error } = await supabase
            .from("Address")
            .insert({
              userId,
              label: addr.label,
              name: addr.name,
              phone: addr.phone,
              address: addr.address,
              landmark: addr.landmark ?? null,
              city: addr.city ?? null,
              pincode: addr.pincode,
              isDefault: addr.isDefault,
              lat: addr.lat ?? null,
              lng: addr.lng ?? null,
            })
            .select()
            .single();

          if (error) throw error;
          if (!data) return null;

          return {
            id: data.id,
            label: data.label,
            name: data.name,
            phone: data.phone,
            address: data.address,
            landmark: data.landmark ?? undefined,
            city: data.city ?? undefined,
            pincode: data.pincode,
            isDefault: data.isDefault ?? false,
            createdAt: data.createdAt
              ? new Date(data.createdAt).getTime()
              : Date.now(),
            lat: data.lat ?? null,
            lng: data.lng ?? null,
          } satisfies SavedAddress;
        } catch (err) {
          console.error("[addressStore] addAddressToDB failed:", err);
          return null;
        }
      },

      updateAddressInDB: async (id: string, addr: Partial<AddressInput>) => {
        try {
          const patch: Record<string, unknown> = {};
          if (addr.label !== undefined) patch.label = addr.label;
          if (addr.name !== undefined) patch.name = addr.name;
          if (addr.phone !== undefined) patch.phone = addr.phone;
          if (addr.address !== undefined) patch.address = addr.address;
          if (addr.landmark !== undefined) patch.landmark = addr.landmark ?? null;
          if (addr.city !== undefined) patch.city = addr.city ?? null;
          if (addr.pincode !== undefined) patch.pincode = addr.pincode;
          if (addr.isDefault !== undefined) patch.isDefault = addr.isDefault;
          if (addr.lat !== undefined) patch.lat = addr.lat ?? null;
          if (addr.lng !== undefined) patch.lng = addr.lng ?? null;
          patch.updatedAt = new Date().toISOString();

          const { error } = await supabase
            .from("Address")
            .update(patch)
            .eq("id", id);

          if (error) throw error;
        } catch (err) {
          console.error("[addressStore] updateAddressInDB failed:", err);
        }
      },

      removeAddressFromDB: async (id: string) => {
        try {
          const { error } = await supabase
            .from("Address")
            .delete()
            .eq("id", id);
          if (error) throw error;
        } catch (err) {
          console.error("[addressStore] removeAddressFromDB failed:", err);
        }
      },

      setDefaultInDB: async (id: string, userId: string) => {
        try {
          // Unset all defaults for this user, then set the target
          const { error: clearError } = await supabase
            .from("Address")
            .update({ isDefault: false })
            .eq("userId", userId);
          if (clearError) throw clearError;

          const { error: setError } = await supabase
            .from("Address")
            .update({ isDefault: true, updatedAt: new Date().toISOString() })
            .eq("id", id);
          if (setError) throw setError;
        } catch (err) {
          console.error("[addressStore] setDefaultInDB failed:", err);
        }
      },
    }),
    { name: "driprr-addresses" }
  )
);
