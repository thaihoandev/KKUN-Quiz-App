import { handleApiError } from "@/utils/apiErrorHandler";
import axiosInstance from "./axiosInstance";
import { Option, Question, Quiz, QuizStatus } from "@/interfaces";

interface QuizCreatePayload {
  title: string;
  description?: string;
  status: QuizStatus;
  userId?: string;
}

export const getQuizzesByUser = async (
  userId: string,
  page: number = 0,
  size: number = 10,
  status?: "PUBLISHED" | "DRAFT" | "CLOSED" | "ARCHIVED"
) => {
  try {
    const response = await axiosInstance.get(`/quizzes/users/${userId}`, {
      params: { page, size, status },
    });
    return response.data; // { content: Quiz[], totalPages, totalElements, ... }
  } catch (error) {
    handleApiError(error, "Failed to fetch user quizzes");
  }
};

export const getQuizzById = async (quizId: string) => {
  try {
    const response = await axiosInstance.get(`/quizzes/${quizId}`);
    return response.data as Quiz;
  } catch (error) {
    handleApiError(error, "Failed to fetch quiz");
  }
};

export const getQuestionsByQuizId = async (quizId: string) => {
  try {
    const response = await axiosInstance.get(`/quizzes/${quizId}/questions`);
    return response.data as Question[];
  } catch (error) {
    handleApiError(error, "Failed to fetch questions for quiz");
  }
};

export const createQuiz = async (quiz: QuizCreatePayload) => {
  try {
    const response = await axiosInstance.post(`/quizzes/create`, quiz);
    return response.data as Quiz;
  } catch (error) {
    handleApiError(error, "Failed to create quiz");
  }
};

export const createQuizFromFile = async (
  formData: FormData,
) => {
  try {
    const quizJson = formData.get("quiz");
    if (quizJson instanceof Blob) {
      const quizText = await quizJson.text();
      const quizObj = JSON.parse(quizText);
      formData.set("quiz", new Blob([JSON.stringify(quizObj)], { type: "application/json" }));
    }

    const response = await axiosInstance.post(
      `/quizzes/create/from-file`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data as Quiz;
  } catch (error) {
    handleApiError(error, "Failed to create quiz from file");
  }
};

export const updateQuiz = async (quizId: string, quiz: Partial<Quiz>) => {
  try {
    const response = await axiosInstance.put(`/quizzes/${quizId}/edit`, quiz);
    return response.data as Quiz;
  } catch (error) {
    handleApiError(error, "Failed to update quiz");
  }
};

export const publishedQuiz = async (quizId: string) => {
  try {
    const response = await axiosInstance.put(
      `/quizzes/${quizId}/published`,
      {}
    );
    return response.data as Quiz;
  } catch (error) {
    handleApiError(error, "Failed to publish quiz");
  }
};

export const getPublishedQuizzes = async (
  page: number = 0,
  size: number = 10,
  sort: string = "recommendationScore,desc"
) => {
  try {
    const response = await axiosInstance.get(`/quizzes/published`, {
      params: { page, size, sort },
    });
    return response.data; // { content: Quiz[], totalPages, totalElements, ... }
  } catch (error) {
    handleApiError(error, "Failed to fetch published quizzes");
  }
};