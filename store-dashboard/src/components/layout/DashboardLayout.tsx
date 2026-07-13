"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import TopBar from "./TopBar";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { supabase } from "@/lib/supabase";

interface Props {
  children: React.ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: Props) {
  const router = useRouter();
  const { isAuthenticated, user, logout, fetchProfile, setAuth, token } = useAuthStore();
  const { setIsOpen } = useDashboardStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        logout();
        router.push("/login");
        return;
      }
      const profile = await fetchProfile();
      if (profile && profile.role !== "STORE_OWNER" && profile.role !== "ADMIN") {
        logout();
        router.push("/login?error=not_store_owner");
        return;
      }

      // Fetch the store for this owner using Supabase directly
      try {
        const userId = data.session.user.id;
        const { supabase } = await import("@/lib/supabase");
        const { data: stores } = await supabase
          .from("Store")
          .select("id, name, isOpen")
          .eq("ownerId", userId)
          .limit(1)
          .single();
        if (stores && profile) {
          setAuth(
            { ...profile, storeId: stores.id, storeName: stores.name },
            data.session.access_token
          );
          setIsOpen(stores.isOpen);
        }
      } catch { /* non-critical */ }

      setChecking(false);
    };
    check();
  }, [router, logout, fetchProfile, setAuth, setIsOpen]);


  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} />
        <main className="flex-1 p-5 pb-24 md:pb-5 overflow-auto">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
