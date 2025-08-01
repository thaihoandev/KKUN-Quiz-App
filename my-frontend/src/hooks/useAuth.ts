import {useAuthStore} from "@/store/authStore";

export const useAuth = () => {
    const {user, login, register, logout, loginWithGoogle} = useAuthStore();

    return {user, login, register, logout, loginWithGoogle};
};
