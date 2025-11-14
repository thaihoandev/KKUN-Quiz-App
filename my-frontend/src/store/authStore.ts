import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { loginApi, loginGoogleApi, registerApi } from "@/services/authService";
import { TokenResponse } from "@react-oauth/google";
import { User } from "@/types/users";
import api from "@/services/axiosInstance";
import { handleApiError } from "@/utils/apiErrorHandler";

interface AuthState {
  accessToken: string | null;
  user: User | null;
  hasInitialized: boolean;

  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setInitialized: () => void;

  refreshMe: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (token: TokenResponse) => Promise<void>;
  logout: () => Promise<void>;
}

const mapUser = (dto: any): User => ({
  userId: dto.userId,
  username: dto.username,
  email: dto.email,
  avatar: dto.avatar || "",
  name: dto.name || "",
  roles: dto.roles || [],
  school: dto.school || "",
  phone: dto.phone || "",
  createdAt: dto.createdAt,
  isActive: dto.isActive,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      hasInitialized: false,

      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      setInitialized: () => set({ hasInitialized: true }),

      // ============================
      // LOAD CURRENT USER
      // ============================
      refreshMe: async () => {
        try {
          const resp = await api.get("/users/me");
          set({ user: mapUser(resp.data) });
        } catch (e) {
          console.warn("refreshMe failed", e);
          set({ accessToken: null, user: null });
        }
      },

      // ============================
      // LOGIN
      // ============================
      login: async (username, password) => {
        try {
          const res = await loginApi(username, password);

          set({
            accessToken: res.accessToken,
            user: mapUser(res.user),
          });
        } catch (e) {
          handleApiError(e, "Login failed");
          throw e;
        }
      },

      // ============================
      // REGISTER
      // ============================
      register: async (name, username, email, password) => {
        try {
          const res = await registerApi({ name, username, email, password });

          set({
            accessToken: res.accessToken,
            user: mapUser(res.user),
          });
        } catch (e) {
          handleApiError(e, "Registration failed");
          throw e;
        }
      },

      // ============================
      // GOOGLE LOGIN
      // ============================
      loginWithGoogle: async (tokenResponse) => {
        try {
          const googleAccess = tokenResponse.access_token;
          const res = await loginGoogleApi(googleAccess);

          set({
            accessToken: res.accessToken,
            user: mapUser(res.user),
          });
        } catch (e) {
          handleApiError(e, "Google login failed");
          throw e;
        }
      },

      // ============================
      // LOGOUT
      // ============================
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch (e) {
          console.warn("logout API error", e);
        } finally {
          set({
            accessToken: null,
            user: null,
            hasInitialized: false, // Reset khi logout
          });

          localStorage.removeItem("auth-storage");
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
);
