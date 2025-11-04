import axiosInstance from "./axiosInstance";
import { handleApiError } from "@/utils/apiErrorHandler";
import { ArticleDto } from "@/types/article";

const API_URL = `${import.meta.env.VITE_BASE_API_URL}/series`;

export interface SeriesDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  articles?: ArticleDto[];
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

// ✅ Lấy danh sách series (phân trang)
export const getSeriesList = async (
  page = 0,
  size = 10,
  sort = "createdAt,desc"
): Promise<PageResponse<SeriesDto>> => {
  try {
    const response = await axiosInstance.get(API_URL, {
      params: { page, size, sort },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch series list");
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

// ✅ Lấy danh sách series của một tác giả
export const getSeriesByAuthor = async (
  authorId: string,
  page = 0,
  size = 10,
  sort = "createdAt,desc"
): Promise<PageResponse<SeriesDto>> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/author/${authorId}`, {
      params: { page, size, sort },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch series by author");
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

// ✅ Lấy chi tiết series (gồm danh sách bài viết)
export const getSeriesBySlug = async (slug: string): Promise<SeriesDto | null> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/${slug}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch series detail");
    return null;
  }
};

// ✅ Tạo mới series
export const createSeries = async (
  title: string,
  description: string,
  authorId: string,
  thumbnailUrl?: string
): Promise<SeriesDto | null> => {
  try {
    const response = await axiosInstance.post(API_URL, null, {
      params: { title, description, authorId, thumbnailUrl },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to create series");
    return null;
  }
};

// ✅ Cập nhật series
export const updateSeries = async (
  id: string,
  title: string,
  description: string,
  thumbnailUrl?: string
): Promise<SeriesDto | null> => {
  try {
    const response = await axiosInstance.put(`${API_URL}/${id}`, null, {
      params: { title, description, thumbnailUrl },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to update series");
    return null;
  }
};

// ✅ Xóa series
export const deleteSeries = async (id: string): Promise<boolean> => {
  try {
    await axiosInstance.delete(`${API_URL}/${id}`);
    return true;
  } catch (error) {
    handleApiError(error, "Failed to delete series");
    return false;
  }
};

// ✅ Thêm bài viết vào series
export const addArticleToSeries = async (
  seriesId: string,
  articleId: string,
  orderIndex = 1
): Promise<SeriesDto | null> => {
  try {
    const response = await axiosInstance.post(
      `${API_URL}/${seriesId}/articles/${articleId}`,
      null,
      { params: { orderIndex } }
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to add article to series");
    return null;
  }
};

// ✅ Xóa bài viết khỏi series
export const removeArticleFromSeries = async (
  seriesId: string,
  articleId: string
): Promise<boolean> => {
  try {
    await axiosInstance.delete(`${API_URL}/${seriesId}/articles/${articleId}`);
    return true;
  } catch (error) {
    handleApiError(error, "Failed to remove article from series");
    return false;
  }
};

// ✅ Cập nhật thứ tự bài viết trong series
export const updateArticleOrder = async (
  seriesId: string,
  orderedArticleIds: string[]
): Promise<boolean> => {
  try {
    await axiosInstance.put(`${API_URL}/${seriesId}/articles/order`, orderedArticleIds);
    return true;
  } catch (error) {
    handleApiError(error, "Failed to update article order in series");
    return false;
  }
};

// ✅ Di chuyển bài viết sang series khác
export const moveArticleToSeries = async (
  articleId: string,
  newSeriesId: string
): Promise<boolean> => {
  try {
    await axiosInstance.put(`${API_URL}/articles/${articleId}/move-to/${newSeriesId}`);
    return true;
  } catch (error) {
    handleApiError(error, "Failed to move article to new series");
    return false;
  }
};
