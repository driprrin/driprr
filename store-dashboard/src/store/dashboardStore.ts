import { create } from "zustand";

export type OrderStatus = "Placed" | "Preparing" | "Ready" | "Out for Delivery" | "Delivered" | "Cancelled";

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  size: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  landmark?: string;
  pincode?: string;
  status: OrderStatus;
  paymentMethod: "razorpay" | "cod";
  deliverySlot?: string;
  couponCode?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  placedAt: string;
  eta?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  stock: number;
  imageUrl: string;
  badge?: string;
  published: boolean;
}

export interface DashboardMetrics {
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  pendingOrders: number;
  revenueChange: number;
  ordersChange: number;
}

interface DashboardState {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  addOrder: (order: Order) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  metrics: DashboardMetrics | null;
  setMetrics: (m: DashboardMetrics) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  isOpen: true,
  setIsOpen: (v) => set({ isOpen: v }),

  orders: [],
  setOrders: (orders) => set({ orders }),
  updateOrderStatus: (id, status) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    })),
  addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),

  products: [],
  setProducts: (products) => set({ products }),

  metrics: null,
  setMetrics: (metrics) => set({ metrics }),
}));
