// src/store/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { loginApi, loginGoogleApi, registerApi } from "@/services/authService";
import axios from "axios";
import Cookies from "js-cookie";
import { TokenResponse } from "@react-oauth/google";
import { handleApiError } from "@/utils/apiErrorHandler";
import axiosInstance from "@/services/axiosInstance";

interface User {
  userId: string;
  username: string;
  email: string;
  avatar: string;
  name: string;
  roles: string[];
}

interface AuthState {
  user: User | null;

  // cache meta
  lastFetchedAt: number | null;
  staleTime: number;              // ms, ví dụ 60s
  isFetchingMe: boolean;
  inFlightMe: Promise<void> | null;
  etag: string | null;            // nếu BE hỗ trợ ETag

  // actions cơ bản
  setUser: (user: User | null) => void;
  updateUserPartial: (patch: Partial<User>) => void;

  // fetch helpers
  refreshMe: () => Promise<void>;
  refreshMeIfStale: () => Promise<void>;
  ensureMe: () => Promise<User | null>;

  // auth flow
  login: (username: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (tokenResponse: TokenResponse) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  logout: () => void;
}

const cookieStorage: StateStorage = {
  getItem: (name) => Cookies.get(name) || null,
  setItem: (name, value) => {
    Cookies.set(name, value, { expires: 7, secure: false, sameSite: "Strict", path: "/" });
  },
  removeItem: (name) => Cookies.remove(name, { path: "/" }),
};

const mapMeDtoToUser = (dto: any): User => ({
  userId: dto.userId,
  username: dto.username,
  email: dto.email,
  avatar: dto.avatar || "",
  name: dto.name || "",
  roles: dto.roles || [],
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      // cache meta
      lastFetchedAt: null,
      staleTime: 60_000,      // 1 phút
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
            // cache-busting avatar nếu BE chưa có version trong URL
            ...(patch.avatar
              ? { avatar: `${patch.avatar}${patch.avatar.includes("?") ? "&" : "?"}t=${Date.now()}` }
              : {}),
          };
          return { user: patched };
        }),

      // authStore.ts
        refreshMe: async () => {
        const { inFlightMe } = get();
        if (inFlightMe) return inFlightMe; // dedupe

        const p = (async () => {
            set({ isFetchingMe: true });
            try {
            // ❌ Bỏ pre-emptive refresh-token ở đây
            // Gọi thẳng /users/me, interceptor sẽ lo 401 -> refresh 1 lần
            const headers: Record<string, string> = {};
            const etag = get().etag;
            if (etag) headers["If-None-Match"] = etag;

            const resp = await axiosInstance.get("/users/me", {
                headers,
                validateStatus: (s) => s === 200 || s === 304 || s === 401
            });

            if (resp.status === 200) {
                const mapped = mapMeDtoToUser(resp.data);
                const newEtag = resp.headers?.etag || resp.headers?.ETag || null;
                set({ user: mapped, lastFetchedAt: Date.now(), etag: newEtag });
            } else if (resp.status === 304) {
                set({ lastFetchedAt: Date.now() });
            } else if (resp.status === 401) {
                // Không có phiên đăng nhập → đánh dấu đã fetch để tránh spam
                set({ lastFetchedAt: Date.now() });
            }
            } finally {
            set({ isFetchingMe: false, inFlightMe: null });
            }
        })();

        set({ inFlightMe: p });
        return p;
        },


      refreshMeIfStale: async () => {
        const { lastFetchedAt, staleTime, user } = get();
        // Chưa có user → fetch ngay
        if (!user) return get().refreshMe();

        // Có user rồi mà quá hạn → revalidate
        if (!lastFetchedAt || Date.now() - lastFetchedAt > staleTime) {
          return get().refreshMe();
        }
      },

      ensureMe: async () => {
        const { user } = get();
        if (!user) {
          await get().refreshMe();
          return get().user;
        }
        // có user rồi thì revalidate nền nếu stale
        get().refreshMeIfStale();
        return user;
      },

      // ===== Auth flow =====
      login: async (username, password) => {
        try {
          const response = await loginApi(username, password);
          const userData: User = {
            userId: response.userData.userId,
            username: response.userData.username,
            email: response.userData.email,
            avatar: response.userData.avatar || "",
            name: response.userData.name || "",
            roles: response.userData.roles || [],
          };
          set({ user: userData, lastFetchedAt: Date.now(), etag: null });
        } catch (error) {
          handleApiError(error, "Login failed");
          throw new Error("An unexpected error occurred");
        }
      },

      register: async (name, username, email, password) => {
        try {
          const response = await registerApi({ name, username, email, password });
          const userData: User = {
            userId: response.userId,
            username: response.username,
            email: response.email,
            avatar: response.avatar || "",
            name: response.name || "",
            roles: response.roles || [],
          };
          set({ user: userData, lastFetchedAt: Date.now(), etag: null });
        } catch (error) {
          handleApiError(error, "Registration failed");
          throw new Error("An unexpected error occurred");
        }
      },

      loginWithGoogle: async (tokenResponse: TokenResponse) => {
        try {
          if (!tokenResponse.access_token) {
            throw new Error("Google login failed. No access token received.");
          }
          const response = await loginGoogleApi(tokenResponse.access_token);
          
          const userData: User = {
            userId: response.userData.userId,
            username: response.userData.username,
            email: response.userData.email,
            avatar: response.userData.avatar || "",
            name: response.userData.name || "",
            roles: response.userData.roles || [],
          };
          set({ user: userData, lastFetchedAt: Date.now(), etag: null });
        } catch (error) {
          handleApiError(error, "Google login failed");
          throw new Error("Google login failed. Try again!");
        }
      },

      refreshAccessToken: async () => {
        try {
          await axios.post(
            `${import.meta.env.VITE_BASE_API_URL}/auth/refresh-token`,
            {},
            { withCredentials: true }
          );
        } catch (error) {
          console.error("Refresh token failed:", error);
          get().logout();
        }
      },

      logout: async () => {
        try {
          await axios.post(
            `${import.meta.env.VITE_BASE_API_URL}/auth/logout`,
            {},
            { withCredentials: true }
          );
        } catch (e) {
          console.warn("Logout API failed:", e);
        }

        set({ user: null, lastFetchedAt: null, etag: null, inFlightMe: null });

        Cookies.remove("auth-storage", { path: "/" });
        Cookies.remove("access-token", { path: "/" });
        Cookies.remove("refresh-token", { path: "/" });
        localStorage.removeItem("access-token");
        localStorage.removeItem("refresh-token");
        delete axios.defaults.headers.common["Authorization"];
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => cookieStorage),
    }
  )
);

axios.defaults.withCredentials = true;
