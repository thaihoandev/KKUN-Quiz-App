import {create} from "zustand";
import {persist, createJSONStorage, StateStorage} from "zustand/middleware";
import {loginApi, loginGoogleApi, registerApi} from "@/services/authService";
import axios from "axios";
import {TokenResponse} from "@react-oauth/google";
import Cookies from "js-cookie";
import { handleApiError } from "@/utils/apiErrorHandler";

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
    login: (username: string, password: string) => Promise<void>;
    register: (
        name: string,
        username: string,
        email: string,
        password: string,
    ) => Promise<void>;
    loginWithGoogle: (tokenResponse: TokenResponse) => Promise<void>;
    refreshAccessToken: () => Promise<void>;
    logout: () => void;
}

// Custom cookie storage for non-sensitive data
const cookieStorage: StateStorage = {
    getItem: (name) => Cookies.get(name) || null,
    setItem: (name, value) => {
        Cookies.set(name, value, {
            expires: 7,
            secure: false,
            sameSite: "Strict",
            path: "/",
        });
    },
    removeItem: (name) => Cookies.remove(name, {path: "/"}),
};

// Zustand store
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,

            login: async (username, password) => {
                try {
                    const response = await loginApi(username, password);
                    console.log("Login response:", response);

                    const userData: User = {
                        userId: response.userData.userId,
                        username: response.userData.username,
                        email: response.userData.email,
                        avatar: response.userData.avatar || "",
                        name: response.userData.name || "",
                        roles: response.userData.roles || [],
                    };
                    set({ user: userData });
                    
                } catch (error) {
                    handleApiError(error, "Login failed");
                    throw new Error("An unexpected error occurred");
                }
            },

            register: async (name, username, email, password) => {
                try {
                    const response = await registerApi({
                        name,
                        username,
                        email,
                        password,
                    });
                    const userData: User = {
                        userId: response.userId,
                        username: response.username,
                        email: response.email,
                        avatar: response.avatar || "",
                        name: response.name || "",
                        roles: response.roles || [],
                    };
                    set({user: userData});
                } catch (error) {
                    handleApiError(error, "Registration failed");
                    throw new Error("An unexpected error occurred");
                }
            },

            loginWithGoogle: async (tokenResponse: TokenResponse) => {
                try {
                    if (!tokenResponse.access_token) {
                        throw new Error(
                            "Google login failed. No access token received.",
                        );
                    }
                    const response = await loginGoogleApi(
                        tokenResponse.access_token,
                    );
                    const userData: User = {
                        userId: response.userId,
                        username: response.username,
                        email: response.email,
                        avatar: response.avatar || "",
                        name: response.name || "",
                        roles: response.roles || [],
                    };
                    set({user: userData});
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
                        {withCredentials: true},
                    );
                } catch (error) {
                    console.error("Refresh token failed:", error);
                    get().logout();
                }
            },

            logout: async () => {
                // 1. Gọi API logout để back xóa cookie HttpOnly (nếu có)
                try {
                    await axios.post(
                    `${import.meta.env.VITE_BASE_API_URL}/auth/logout`,
                    {},
                    { withCredentials: true }
                    );
                } catch (e) {
                    console.warn("Logout API failed:", e);
                    // vẫn tiếp tục dọn dẹp phía client
                }

                // 2. Xóa user trong store
                set({ user: null });

                // 3. Xóa toàn bộ storage liên quan
                // Zustand persist cookie
                Cookies.remove("auth-storage", { path: "/" });
                // Nếu bạn từng lưu token trong cookie khác
                Cookies.remove("access-token", { path: "/" });
                Cookies.remove("refresh-token", { path: "/" });
                // Nếu bạn có lưu token/refresh trong localStorage:
                localStorage.removeItem("access-token");
                localStorage.removeItem("refresh-token");

                // 4. Dọn header Authorization mặc định (nếu bạn từng thêm vào)
                delete axios.defaults.headers.common["Authorization"];

                // 5. (Tuỳ chọn) Chuyển về trang đăng nhập
                }

        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => cookieStorage),
        },
    ),
);

// Configure Axios to send cookies
axios.defaults.withCredentials = true;
