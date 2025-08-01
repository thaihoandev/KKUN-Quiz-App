import axiosInstance from "./axiosInstance";

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
    const response = await axiosInstance.get("/users/me");
    return response.data;
};

/**
 * Lấy thông tin người dùng theo ID
 */
export const getUserById = async (userId: string): Promise<any> => {
    const response = await axiosInstance.get(`/users/${userId}`);
    return response.data;
};
