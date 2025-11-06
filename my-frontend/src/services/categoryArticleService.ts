import axiosInstance from "./axiosInstance";
import { handleApiError } from "@/utils/apiErrorHandler";
import { ArticleCategoryDto } from "@/types/article";

const API_URL = `${import.meta.env.VITE_BASE_API_URL}/article-categories`;

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ✅ Lấy danh sách category đang active (phân trang)
export const getCategories = async (
  page = 0,
  size = 10,
  sort = "name,asc"
): Promise<PageResponse<ArticleCategoryDto>> => {
  try {
    const response = await axiosInstance.get(API_URL, {
      params: { page, size, sort },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch categories");
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

// ✅ Tạo mới category (dành cho admin)
export const createCategory = async (
  name: string,
  description?: string
): Promise<ArticleCategoryDto | null> => {
  try {
    const response = await axiosInstance.post(API_URL, null, {
      params: { name, description },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to create category");
    return null;
  }
};
