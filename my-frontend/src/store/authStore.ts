// src/store/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { loginApi, loginGoogleApi, registerApi } from "@/services/authService";
import axios from "axios";
import { TokenResponse } from "@react-oauth/google";
import { handleApiError } from "@/utils/apiErrorHandler";
import axiosInstance from "@/services/axiosInstance";
import { User } from "@/types/users";
import Cookies from "js-cookie";

interface AuthState {
  user: User | null;
  lastFetchedAt: number | null;
  staleTime: number;
  isFetchingMe: boolean;
  inFlightMe: Promise<void> | null;
  etag: string | null;

  setUser: (user: User | null) => void;
  updateUserPartial: (patch: Partial<User>) => void;

  refreshMe: () => Promise<void>;
  refreshMeIfStale: () => Promise<void>;
  ensureMe: () => Promise<User | null>;

  login: (username: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (tokenResponse: TokenResponse) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  logout: () => Promise<void>;
}

const mapMeDtoToUser = (dto: any): User => ({
  userId: dto.userId,
  username: dto.username,
  email: dto.email,
  avatar: dto.avatar || "",
  name: dto.name || "",
  roles: dto.roles || [],
  school: dto.school || "",
  createdAt: dto.createdAt,
  isActive: dto.isActive,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      lastFetchedAt: null,
      staleTime: 60_000,
      isFetchingMe: false,
      inFlightMe: null,
      etag: null,

      setUser: (user) => set({ user }),

      updateUserPartial: (patch) =>
        set((state) => {
          if (!state.user) return state;
          const patched: User = {
            ...state.user,
            ...patch,
            ...(patch.avatar
              ? { avatar: `${patch.avatar}${patch.avatar.includes("?") ? "&" : "?"}t=${Date.now()}` }
              : {}),
          };
          return { user: patched };
        }),

      // ================== refreshMe ==================
      refreshMe: async () => {
        const { inFlightMe } = get();
        if (inFlightMe) return inFlightMe;

        // 🚫 Nếu không có refreshToken → không gọi /me
        const hasRefresh = Boolean(Cookies.get("refreshToken"));
        if (!hasRefresh) {
          console.info("[authStore] Skip /me — no refresh token found");
          return;
        }

        const p = (async () => {
          set({ isFetchingMe: true });
          try {
            const headers: Record<string, string> = {};
            const etag = get().etag;
            if (etag) headers["If-None-Match"] = etag;

            const resp = await axiosInstance.get("/users/me", {
              headers,
              validateStatus: (s) => [200, 304, 401].includes(s),
            });

            if (resp.status === 200) {
              const mapped = mapMeDtoToUser(resp.data);
              const newEtag = resp.headers?.etag || resp.headers?.ETag || null;
              set({ user: mapped, lastFetchedAt: Date.now(), etag: newEtag });
            } else if (resp.status === 304) {
              set({ lastFetchedAt: Date.now() });
            } else if (resp.status === 401) {
              console.warn("[authStore] /me unauthorized — likely expired session");
              set({ user: null, lastFetchedAt: null });
            }
          } finally {
            set({ isFetchingMe: false, inFlightMe: null });
          }
        })();

        set({ inFlightMe: p });
        return p;
      },

      // ================== refreshMeIfStale ==================
      refreshMeIfStale: async () => {
        const { lastFetchedAt, staleTime, user } = get();
        const hasRefresh = Boolean(Cookies.get("refreshToken"));
        if (!hasRefresh) {
          console.info("[authStore] Skip refreshMeIfStale — no refresh token");
          return;
        }

        if (!user || !lastFetchedAt || Date.now() - lastFetchedAt > staleTime) {
          return get().refreshMe();
        }
      },

      // ================== ensureMe ==================
      ensureMe: async () => {
        const { user } = get();

        if (user) return user;

        const hasRefresh = Boolean(Cookies.get("refreshToken"));
        if (!hasRefresh) {
          console.info("[authStore] No refresh token — skip /me");
          return null;
        }

        await get().refreshMe();
        return get().user;
      },

      // ================== login / register ==================
      login: async (username, password) => {
        try {
          const response = await loginApi(username, password);
          const userData = mapMeDtoToUser(response.userData);
          set({ user: userData, lastFetchedAt: Date.now(), etag: null });
        } catch (error) {
          handleApiError(error, "Login failed");
          throw error;
        }
      },

      register: async (name, username, email, password) => {
        try {
          const response = await registerApi({ name, username, email, password });
          const userData = mapMeDtoToUser(response);
          set({ user: userData, lastFetchedAt: Date.now(), etag: null });
        } catch (error) {
          handleApiError(error, "Registration failed");
          throw error;
        }
      },

      loginWithGoogle: async (tokenResponse: TokenResponse) => {
        try {
          if (!tokenResponse.access_token) throw new Error("Google login failed: no token");
          const response = await loginGoogleApi(tokenResponse.access_token);
          const userData = mapMeDtoToUser(response.userData);
          set({ user: userData, lastFetchedAt: Date.now(), etag: null });
        } catch (error) {
          handleApiError(error, "Google login failed");
          throw error;
        }
      },

      // ================== refresh token ==================
      refreshAccessToken: async () => {
        try {
          await axios.post(`${import.meta.env.VITE_BASE_API_URL}/auth/refresh-token`, {}, {
            withCredentials: true,
          });
          console.info("[authStore] Access token refreshed successfully");
        } catch (error) {
          console.error("[authStore] Refresh token failed:", error);
        }
      },

      // ================== logout ==================
      logout: async () => {
        try {
          await axios.post(`${import.meta.env.VITE_BASE_API_URL}/auth/logout`, {}, {
            withCredentials: true,
          });
        } catch (e) {
          console.warn("Logout API failed:", e);
        }

        set({
          user: null,
          lastFetchedAt: null,
          etag: null,
          inFlightMe: null,
        });

        Cookies.remove("refreshToken");
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ✅ Mặc định mọi request đều gửi cookie
axios.defaults.withCredentials = true;
