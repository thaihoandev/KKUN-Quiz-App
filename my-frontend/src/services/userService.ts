import { useAuthStore } from "@/store/authStore";
import axiosInstance from "./axiosInstance";
import { UserRequestDTO, UserResponseDTO } from "@/interfaces";

/**
 * Lấy danh sách tất cả người dùng (Chỉ Admin)
 */
export const getAllUsers = async (): Promise<any[]> => {
    const response = await axiosInstance.get("/users");
    return response.data;
};

/**
 * Lấy thông tin người dùng hiện tại
 */
export const getCurrentUser = async (): Promise<any> => {
    const persistedUser = useAuthStore.getState().user;
    if (persistedUser) {
        const response = await axiosInstance.get("/users/me");
        return response.data;
    }

};

/**
 * Lấy thông tin người dùng theo ID
 */
export const getUserById = async (userId: string): Promise<any> => {
    const response = await axiosInstance.get(`/users/${userId}`);
    return response.data;
};

export const updateUser = async (userId: string, user: Partial<UserRequestDTO>): Promise<UserResponseDTO> => {
  const response = await axiosInstance.put(`/users/${userId}`, user);
  return response.data;
};

export const updateUserAvatar = async (userId: string, file: File): Promise<UserResponseDTO> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await axiosInstance.post(`/users/${userId}/avatar`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};