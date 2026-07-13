import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Attach Supabase JWT to every request — refresh if expired
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    try {
      // Try to get a fresh session from Supabase (auto-refreshes if expired)
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;

        // Keep Zustand store in sync with refreshed token
        const raw = localStorage.getItem("driprr-auth");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.state?.token !== session.access_token) {
            parsed.state.token = session.access_token;
            localStorage.setItem("driprr-auth", JSON.stringify(parsed));
          }
        }
      } else {
        // Fallback: read from persisted store
        const raw = localStorage.getItem("driprr-auth");
        if (raw) {
          const parsed = JSON.parse(raw);
          const token = parsed?.state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      }
    } catch {
      // Fallback to stored token if supabase import fails
      try {
        const raw = localStorage.getItem("driprr-auth");
        if (raw) {
          const parsed = JSON.parse(raw);
          const token = parsed?.state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch { /* ignore */ }
    }
  }
  return config;
});

// 401 → clear auth state (but don't redirect from checkout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      // Don't redirect from checkout/order pages — let them show the error
      if (path.startsWith("/checkout") || path.startsWith("/order-confirmation")) {
        return Promise.reject(error);
      }
      localStorage.removeItem("driprr-auth");
      if (!path.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
