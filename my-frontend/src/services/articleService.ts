import axiosInstance from "./axiosInstance";
import { handleApiError } from "@/utils/apiErrorHandler";
import { ArticleDto } from "@/types/article";

const API_URL = `${import.meta.env.VITE_BASE_API_URL}/articles`;

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ✅ Lấy tất cả bài viết đã publish (phân trang)
export const getArticles = async (
  page = 0,
  size = 10,
  sort = "createdAt,desc"
): Promise<PageResponse<ArticleDto>> => {
  try {
    const response = await axiosInstance.get(API_URL, {
      params: { page, size, sort },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch articles");
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

// ✅ Lấy bài viết theo slug
export const getArticleBySlug = async (slug: string): Promise<ArticleDto | null> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/${slug}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch article detail");
    return null;
  }
};

// ✅ Lấy danh sách bài theo category (phân trang)
export const getArticlesByCategory = async (
  categoryId: string,
  page = 0,
  size = 10,
  sort = "createdAt,desc"
): Promise<PageResponse<ArticleDto>> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/category/${categoryId}`, {
      params: { page, size, sort },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch articles by category");
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

// ✅ Tạo mới bài viết (multipart/form-data)
export const createArticle = async (formData: FormData): Promise<ArticleDto | null> => {
  try {
    const response = await axiosInstance.post(API_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to create article");
    return null;
  }
};
