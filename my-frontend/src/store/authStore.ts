import {create} from "zustand";
import {persist, createJSONStorage, StateStorage} from "zustand/middleware";
import {loginApi, loginGoogleApi, registerApi} from "@/services/authService";
import axios from "axios";
import {TokenResponse} from "@react-oauth/google";
import Cookies from "js-cookie";

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
                    if (axios.isAxiosError(error)) {
                        throw error.response?.data || "Login failed";
                    }
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
                    if (axios.isAxiosError(error)) {
                        throw error.response?.data || "Registration failed";
                    }
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

            logout: () => {
                set({user: null});
                Cookies.remove("auth-storage", {path: "/"});
                axios.post(
                    `${import.meta.env.VITE_BASE_API_URL}/auth/logout`,
                    {},
                    {withCredentials: true},
                );
            },
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => cookieStorage),
        },
    ),
);

// Configure Axios to send cookies
axios.defaults.withCredentials = true;
