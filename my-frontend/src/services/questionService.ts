import {handleApiError} from "@/utils/apiErrorHandler";
import axiosInstance from "./axiosInstance";
import {Option, Question} from "@/interfaces";

export const getAllQuestions = async (): Promise<Question[]> => {
    try {
        const response = await axiosInstance.get(`/questions`);
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch questions");
        return [];
    }
};

export const getQuestionsByQuizId = async (
    quizId: string,
): Promise<Question[]> => {
    try {
        const response = await axiosInstance.get(
            `/quizzes/${quizId}/questions`,
        );
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch questions for quiz");
        return [];
    }
};

export const updateQuestion = async (
    quizId: string,
    questionId: string,
    formData: FormData,
): Promise<Question> => {
    try {
        const response = await axiosInstance.put(
            `/quizzes/${quizId}/questions/${questionId}/edit`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            },
        );
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to update question");
        throw error;
    }
};

export const createQuestion = async (
    quizId: string,
    formData: FormData,
): Promise<Question> => {
    try {
        const response = await axiosInstance.post(
            `/quizzes/${quizId}/questions/create`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            },
        );
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to create question");
        throw error;
    }
};

// ✅ Thêm getQuestionById
export const getQuestionById = async (
    quizId: string,
    questionId: string,
): Promise<Question> => {
    try {
        const response = await axiosInstance.get(
            `/quizzes/${quizId}/questions/${questionId}`,
        );
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch question details");
        throw error;
    }
};

export const deleteQuestion = async (
    quizId: string,
    questionId: string,
): Promise<void> => {
    try {
        await axiosInstance.delete(
            `/quizzes/${quizId}/questions/${questionId}/delete`,
        );
    } catch (error) {
        handleApiError(error, "Failed to delete question");
        throw error;
    }
};

export const softDeleteQuestion = async (
    quizId: string,
    questionId: string,
) => {
    try {
        await axiosInstance.patch(
            `/quizzes/${quizId}/questions/${questionId}/soft-delete`,
        );
    } catch (error) {
        handleApiError(error, "Failed to soft delete question");
    }
};
