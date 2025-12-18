import axiosInstance from "./axiosInstance";
import { PageResponse } from "@/interfaces";
import {
    addQuestionsBulk,
    QuestionRequestDTO,
    OptionRequestDTO,
    mapAiListToCreatePayload,
    QuestionCreatePayload,
} from "./questionService";
import { handleApiError } from "@/utils/apiErrorHandler";

/* =========================
 * Types & Interfaces
 * ========================= */

export enum Visibility {
    PUBLIC = "PUBLIC",
    UNLISTED = "UNLISTED",
    PASSWORD = "PASSWORD",
    PRIVATE = "PRIVATE",
}

export enum Difficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD",
    EXPERT = "EXPERT",
}

export interface QuizCreateRequest {
    title: string;
    description?: string;
    coverImageUrl?: string;
    tags?: string[];
    difficulty?: Difficulty;
    estimatedMinutes?: number;
    visibility?: Visibility;
    accessPassword?: string;
    allowedUserIds?: string[];
}

export interface QuizUpdateRequest {
    title: string;
    description?: string;
    coverImageUrl?: string;
    tags?: string[];
    difficulty?: Difficulty;
    estimatedMinutes?: number;
    visibility?: Visibility;
    accessPassword?: string;
    allowedUserIds?: string[];
}

export interface QuizDetailResponse {
    quizId: string;
    title: string;
    description: string;
    slug: string;
    coverImageUrl?: string;
    tags: string[];
    difficulty: Difficulty;
    estimatedMinutes: number;
    visibility: Visibility;
    published: boolean;
    creator: {
        userId: string;
        name: string;
        email: string;
    };
    isOwner: boolean;
    canPlay: boolean;
    totalQuestions: number;
    averageScore: number;
    viewCount: number;
    startCount: number;
    completionCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface QuizSummaryDto {
    quizId: string;
    title: string;
    description: string;
    slug: string;
    coverImageUrl?: string;
    difficulty: Difficulty;
    estimatedMinutes: number;
    totalQuestions: number;
    averageScore: number;
    viewCount: number;
    startCount: number;
    completionCount: number;
    creator: {
        userId: string;
        name: string;
        avatar?: string;
    };
    createdAt: string;
}

/* =========================
 * PUBLIC ENDPOINTS - Browse Quizzes
 * ========================= */

/**
 * Get all published public quizzes with optional search
 */
export const getPublishedQuizzes = async (
    keyword?: string,
    page: number = 0,
    size: number = 20,
    sortBy: string = "createdAt",
    sortDirection: "ASC" | "DESC" = "DESC"
): Promise<PageResponse<QuizSummaryDto>> => {
    try {
        const params = new URLSearchParams();
        if (keyword) params.append("keyword", keyword);
        params.append("page", page.toString());
        params.append("size", size.toString());
        params.append("sortBy", sortBy);
        params.append("sortDirection", sortDirection);

        const response = await axiosInstance.get(`/quizzes/published`, {
            params,
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch published quizzes");
        throw error;
    }
};

/**
 * Get quiz by slug (public access with optional password)
 */
export const getQuizBySlug = async (
    slug: string,
    password?: string
): Promise<QuizDetailResponse> => {
    try {
        const params = new URLSearchParams();
        if (password) params.append("password", password);

        const response = await axiosInstance.get(`/quizzes/slug/${slug}`, {
            params,
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch quiz by slug");
        throw error;
    }
};

/**
 * Get trending quizzes sorted by popularity
 */
export const getTrendingQuizzes = async (
    page: number = 0,
    size: number = 20
): Promise<PageResponse<QuizSummaryDto>> => {
    try {
        const response = await axiosInstance.get(`/quizzes/trending`, {
            params: { page, size },
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch trending quizzes");
        throw error;
    }
};

/**
 * Get quizzes by difficulty level
 */
export const getQuizzesByDifficulty = async (
    difficulty: Difficulty,
    page: number = 0,
    size: number = 20
): Promise<PageResponse<QuizSummaryDto>> => {
    try {
        const response = await axiosInstance.get(
            `/quizzes/difficulty/${difficulty}`,
            { params: { page, size } }
        );
        return response.data;
    } catch (error) {
        handleApiError(error, `Failed to fetch ${difficulty} quizzes`);
        throw error;
    }
};

/**
 * Get quizzes by category
 */
export const getQuizzesByCategory = async (
    categoryId: number,
    page: number = 0,
    size: number = 20
): Promise<PageResponse<QuizSummaryDto>> => {
    try {
        const response = await axiosInstance.get(
            `/quizzes/category/${categoryId}`,
            { params: { page, size } }
        );
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch quizzes by category");
        throw error;
    }
};

/**
 * Get popular quizzes in a specific category
 */
export const getPopularByCategory = async (
    categoryId: number,
    page: number = 0,
    size: number = 20
): Promise<PageResponse<QuizSummaryDto>> => {
    try {
        const response = await axiosInstance.get(
            `/quizzes/category/${categoryId}/popular`,
            { params: { page, size } }
        );
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch popular quizzes");
        throw error;
    }
};

/**
 * Get all published quizzes by user
 */
export const getQuizzesByUser = async (
    userId: string,
    page: number = 0,
    size: number = 20
): Promise<PageResponse<QuizSummaryDto>> => {
    try {
        const response = await axiosInstance.get(`/quizzes/users/${userId}`, {
            params: { page, size },
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch user quizzes");
        throw error;
    }
};

/**
 * Advanced search with multiple filters
 */
export const searchQuizzes = async (
    keyword?: string,
    difficulty?: Difficulty,
    categoryId?: number,
    page: number = 0,
    size: number = 20
): Promise<PageResponse<QuizSummaryDto>> => {
    try {
        const params = new URLSearchParams();
        if (keyword) params.append("keyword", keyword);
        if (difficulty) params.append("difficulty", difficulty);
        if (categoryId) params.append("categoryId", categoryId.toString());
        params.append("page", page.toString());
        params.append("size", size.toString());

        const response = await axiosInstance.get(`/quizzes/search`, {
            params,
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to search quizzes");
        throw error;
    }
};

/* =========================
 * AUTHENTICATED ENDPOINTS - Quiz Management
 * ========================= */

/**
 * Get quiz by ID (requires auth for private quizzes)
 */
export const getQuizById = async (
    quizId: string
): Promise<QuizDetailResponse> => {
    try {
        const response = await axiosInstance.get(`/quizzes/${quizId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch quiz");
        throw error;
    }
};

/**
 * Get all quizzes created by current user (published + unpublished)
 */
export const getMyQuizzes = async (
    page: number = 0,
    size: number = 20
): Promise<PageResponse<QuizSummaryDto>> => {
    try {
        const response = await axiosInstance.get(`/quizzes/my-quizzes`, {
            params: { page, size },
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch your quizzes");
        throw error;
    }
};

/**
 * Get draft quizzes (unpublished only)
 */
export const getMyDrafts = async (
    page: number = 0,
    size: number = 20
): Promise<PageResponse<QuizSummaryDto>> => {
    try {
        const response = await axiosInstance.get(`/quizzes/my-drafts`, {
            params: { page, size },
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch draft quizzes");
        throw error;
    }
};

/**
 * Create a new quiz
 */
export const createQuiz = async (
    request: QuizCreateRequest
): Promise<QuizDetailResponse> => {
    try {
        const response = await axiosInstance.post(`/quizzes`, request);
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to create quiz");
        throw error;
    }
};

/**
 * Update quiz details
 */
export const updateQuiz = async (
    quizId: string,
    request: QuizUpdateRequest
): Promise<QuizDetailResponse> => {
    try {
        const response = await axiosInstance.put(`/quizzes/${quizId}`, request);
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to update quiz");
        throw error;
    }
};

/**
 * Publish quiz to make it publicly available
 */
export const publishQuiz = async (quizId: string): Promise<void> => {
    try {
        await axiosInstance.post(`/quizzes/${quizId}/publish`);
    } catch (error) {
        handleApiError(error, "Failed to publish quiz");
        throw error;
    }
};

/**
 * Unpublish quiz to make it private/draft
 */
export const unpublishQuiz = async (quizId: string): Promise<void> => {
    try {
        await axiosInstance.post(`/quizzes/${quizId}/unpublish`);
    } catch (error) {
        handleApiError(error, "Failed to unpublish quiz");
        throw error;
    }
};

/**
 * Soft delete quiz (can be restored)
 */
export const softDeleteQuiz = async (quizId: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/quizzes/${quizId}`);
    } catch (error) {
        handleApiError(error, "Failed to delete quiz");
        throw error;
    }
};

/**
 * Hard delete quiz permanently
 */
export const hardDeleteQuiz = async (quizId: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/quizzes/${quizId}/hard`);
    } catch (error) {
        handleApiError(error, "Failed to permanently delete quiz");
        throw error;
    }
};

/**
 * Restore a soft-deleted quiz
 */
export const restoreQuiz = async (quizId: string): Promise<void> => {
    try {
        await axiosInstance.post(`/quizzes/${quizId}/restore`);
    } catch (error) {
        handleApiError(error, "Failed to restore quiz");
        throw error;
    }
};

/**
 * Duplicate quiz with all questions
 */
export const duplicateQuiz = async (
    quizId: string
): Promise<QuizDetailResponse> => {
    try {
        const response = await axiosInstance.post(
            `/quizzes/${quizId}/duplicate`
        );
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to duplicate quiz");
        throw error;
    }
};

/* =========================
 * ANALYTICS & TRACKING
 * ========================= */

/**
 * Increment view count for quiz
 */
export const incrementViewCount = async (quizId: string): Promise<void> => {
    try {
        await axiosInstance.post(`/quizzes/${quizId}/increment-view`);
    } catch (error) {
        console.debug("Failed to increment view count", error);
    }
};

/**
 * Increment start count for quiz
 */
export const incrementStartCount = async (quizId: string): Promise<void> => {
    try {
        await axiosInstance.post(`/quizzes/${quizId}/increment-start`);
    } catch (error) {
        console.debug("Failed to increment start count", error);
    }
};

/**
 * Increment completion count for quiz
 */
export const incrementCompletionCount = async (
    quizId: string
): Promise<void> => {
    try {
        await axiosInstance.post(`/quizzes/${quizId}/increment-completion`);
    } catch (error) {
        console.debug("Failed to increment completion count", error);
    }
};
