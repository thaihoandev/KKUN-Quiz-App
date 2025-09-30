import { handleApiError } from "@/utils/apiErrorHandler";
import axiosInstance from "./axiosInstance";
import { PageResponse, Question, Quiz, QuizStatus } from "@/interfaces";
import {
  addQuestionsToQuiz,
  mapAiListToCreatePayload,
  QuestionCreatePayload,
} from "./questionService";

interface QuizCreatePayload {
  title: string;
  description?: string;
  status: QuizStatus;
  userId?: string;
}

/* =========================
 * Quizzes (list/detail)
 * ========================= */
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
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch user quizzes");
    throw error;
  }
};

export const getQuizById = async (quizId: string) => {
  try {
    const response = await axiosInstance.get(`/quizzes/${quizId}`);
    return response.data as Quiz;
  } catch (error) {
    handleApiError(error, "Failed to fetch quiz");
    throw error;
  }
};

/* =========================
 * Questions (paging by quiz)
 * ========================= */
export const getPagedQuestionsByQuizId = async (
  quizId: string,
  page = 0,
  size = 10
): Promise<PageResponse<Question>> => {
  try {
    const res = await axiosInstance.get(`/quizzes/${quizId}/questions`, {
      params: { page, size },
    });
    return res.data as PageResponse<Question>;
  } catch (error) {
    handleApiError(error, "Failed to fetch questions by quizId");
    throw error;
  }
};

/* =========================
 * Quiz CRUD
 * ========================= */
export const createQuiz = async (quiz: QuizCreatePayload) => {
  try {
    const response = await axiosInstance.post(`/quizzes/create`, quiz);
    return response.data as Quiz;
  } catch (error) {
    handleApiError(error, "Failed to create quiz");
    throw error;
  }
};

export const createQuizFromFile = async (formData: FormData) => {
  try {
    const quizJson = formData.get("quiz");
    if (quizJson instanceof Blob) {
      const quizText = await quizJson.text();
      const quizObj = JSON.parse(quizText);
      formData.set("quiz", new Blob([JSON.stringify(quizObj)], { type: "application/json" }));
    }

    const response = await axiosInstance.post(`/quizzes/create/from-file`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data as Quiz;
  } catch (error) {
    handleApiError(error, "Failed to create quiz from file");
    throw error;
  }
};

export const updateQuiz = async (quizId: string, quiz: Partial<Quiz>) => {
  try {
    const response = await axiosInstance.put(`/quizzes/${quizId}/edit`, quiz);
    return response.data as Quiz;
  } catch (error) {
    handleApiError(error, "Failed to update quiz");
    throw error;
  }
};

export const publishedQuiz = async (quizId: string) => {
  try {
    const response = await axiosInstance.put(`/quizzes/${quizId}/published`, {});
    return response.data as Quiz;
  } catch (error) {
    handleApiError(error, "Failed to publish quiz");
    throw error;
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
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch published quizzes");
    throw error;
  }
};

export const saveQuizForMe = async (quizId: string) => {
  try {
    const response = await axiosInstance.post(`/quizzes/${quizId}/save-for-me`);
    return response.data as Quiz;
  } catch (error) {
    handleApiError(error, "Failed to save quiz for current user");
    throw error;
  }
};

/* =========================
 * AI endpoints
 * ========================= */

// ✅ mở rộng type để gửi kèm quizId + dedupe
export type TopicGenerateRequest = {
  topic: string;
  count?: number;
  questionType?: "AUTO" | "TRUE_FALSE" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  timeLimit?: number;
  points?: number;
  language?: "vi" | "en";
  quizId?: string;     // ✅ để BE lọc trùng theo quiz
  dedupe?: boolean;    // ✅ bật lọc trùng
};

export async function generateQuestionsByTopic(req: TopicGenerateRequest): Promise<Question[]> {
  try {
    const payload: TopicGenerateRequest = {
      topic: (req.topic ?? "").trim(),
      count: Math.max(1, Math.min(req.count ?? 5, 10)),
      questionType: (req.questionType ?? "AUTO") as any,
      timeLimit: Math.max(5, Math.min(req.timeLimit ?? 60, 300)),
      points: Math.max(1, Math.min(req.points ?? 1000, 100000)),
      language: (req.language ?? "vi"),
      // giữ nguyên các field mở rộng nếu được truyền từ page
      quizId: req.quizId,
      dedupe: req.dedupe,
    };
    if (!payload.topic) throw new Error("TOPIC_EMPTY");

    const res = await axiosInstance.post(`/ai/questions/generate-by-topic`, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 100000,
    });

    const data = res?.data;
    const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.questions) ? data.questions : [];

    if (!Array.isArray(list) || list.length === 0) {
      const reason = data?.error || data?.message || "AI trả về rỗng";
      const err = new Error(typeof reason === "string" ? reason : JSON.stringify(reason));
      (err as any).__isEmptyAI = true;
      throw err;
    }

    return list as Question[];
  } catch (error: any) {
    const status = error?.response?.status;
    const body = error?.response?.data;
    const msg = body?.message || body?.error || error?.message || "Failed to generate questions by topic (AI)";
    const wrapped = new Error(msg);
    (wrapped as any).__status = status;
    (wrapped as any).__retryAfter = error?.response?.headers?.["retry-after"];
    (wrapped as any).__isEmptyAI = (error as any)?.__isEmptyAI === true;

    handleApiError(error, "Failed to generate questions by topic (AI)");
    throw wrapped;
  }
}

export async function generateSimilarQuestions(
  quizId: string,
  count: number = 3,
  lang: "vi" | "en" = "vi"
): Promise<Question[]> {
  try {
    const res = await axiosInstance.post(
      `/quizzes/${quizId}/questions/ai-similar`,
      {},
      { params: { count, lang } }
    );
    return res.data as Question[];
  } catch (error) {
    handleApiError(error, "Failed to generate similar questions (AI)");
    throw error;
  }
}

/* =========================
 * NEW: bulk add AI questions vào quiz
 * ========================= */

export async function addAiQuestionsToQuiz(quizId: string, aiQuestions: any[]): Promise<Question[]> {
  try {
    const payload: QuestionCreatePayload[] = mapAiListToCreatePayload(aiQuestions);
    return await addQuestionsToQuiz(quizId, payload);
  } catch (error) {
    handleApiError(error, "Failed to add AI questions to quiz");
    throw error;
  }
}
