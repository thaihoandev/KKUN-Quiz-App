import axiosInstance from "./axiosInstance";
import { handleApiError } from "@/utils/apiErrorHandler";

const API_URL = `${import.meta.env.VITE_BASE_API_URL}/tags`;

export interface Tag {
  id: string;
  name: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ✅ Lấy danh sách tag (phân trang)
export const getTags = async (
  page = 0,
  size = 10,
  sort = "name,asc"
): Promise<PageResponse<Tag>> => {
  try {
    const response = await axiosInstance.get(API_URL, {
      params: { page, size, sort },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch tags");
    return {
      content: [],
      totalPages: 0,
      totalElements: 0,
      size,
      number: page,
      first: true,
      last: true,
    };
  }
};

// ✅ Tạo hoặc lấy tag mới
export const createTag = async (name: string): Promise<Tag | null> => {
  try {
    const response = await axiosInstance.post(API_URL, null, {
      params: { name },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to create tag");
    return null;
  }
};
