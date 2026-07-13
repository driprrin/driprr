import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RiderUser {
  id: string; name: string; email?: string; phone?: string;
  zone: string; vehicleType: string; isActive: boolean;
}

export type DeliveryStatus = "ASSIGNED" | "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED";

export interface DeliveryOrder {
  id:             string;
  orderId:        string;
  status:         DeliveryStatus;
  storeName:      string;
  storeAddress:   string;
  customerName:   string;
  customerPhone:  string;
  deliveryAddress: string;
  deliveryPincode: string;
  total:          number;
  itemCount:      number;
  placedAt:       string;
  eta?:           string;
}

interface RiderState {
  user:            RiderUser | null;
  token:           string | null;
  isAuthenticated: boolean;
  isOnline:        boolean;
  activeDelivery:  DeliveryOrder | null;
  deliveryHistory: DeliveryOrder[];
  earnings:        { today: number; week: number; total: number };

  setAuth:         (user: RiderUser, token: string) => void;
  logout:          () => void;
  setOnline:       (v: boolean) => void;
  setActiveDelivery: (d: DeliveryOrder | null) => void;
  addToHistory:    (d: DeliveryOrder) => void;
  updateEarnings:  (amount: number) => void;
}

export const useRiderStore = create<RiderState>()(
  persist(
    (set, get) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      isOnline:        false,
      activeDelivery:  null,
      deliveryHistory: [],
      earnings:        { today: 0, week: 0, total: 0 },

      setAuth:  (user, token) => set({ user, token, isAuthenticated: true }),
      logout:   () => set({ user: null, token: null, isAuthenticated: false, isOnline: false, activeDelivery: null }),
      setOnline: (v) => set({ isOnline: v }),
      setActiveDelivery: (d) => set({ activeDelivery: d }),
      addToHistory: (d) => set((s) => ({ deliveryHistory: [d, ...s.deliveryHistory] })),
      updateEarnings: (amount) => set((s) => ({
        earnings: {
          today: s.earnings.today + amount,
          week:  s.earnings.week  + amount,
          total: s.earnings.total + amount,
        },
      })),
    }),
    {
      name: "driprr-rider-auth",
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated, earnings: s.earnings, deliveryHistory: s.deliveryHistory }),
    }
  )
);
