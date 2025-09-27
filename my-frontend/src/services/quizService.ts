import { handleApiError } from "@/utils/apiErrorHandler";
import axiosInstance from "./axiosInstance";
import { Option, PageResponse, Question, Quiz, QuizStatus } from "@/interfaces";

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
    return response.data; // { content: Quiz[], totalPages, totalElements, ... }
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

// Giữ alias cũ để tránh vỡ import hiện có
export const getQuizzById = getQuizById;

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
    // đảm bảo field "quiz" là JSON blob đúng content-type
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
    return response.data; // { content, totalPages, totalElements, ... }
  } catch (error) {
    handleApiError(error, "Failed to fetch published quizzes");
    throw error;
  }
};

export const saveQuizForMe = async (quizId: string) => {
  try {
    const response = await axiosInstance.post(`/quizzes/${quizId}/save-for-me`);
    return response.data as Quiz; // quiz đã clone
  } catch (error) {
    handleApiError(error, "Failed to save quiz for current user");
    throw error;
  }
};

/* =========================
 * AI endpoints
 * ========================= */

// Request body đồng bộ với backend
export type TopicGenerateRequest = {
  topic: string;
  count?: number;            // default 5, server clamp tối đa 10
  questionType?: "AUTO" | "TRUE_FALSE" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  timeLimit?: number;        // default 60 (5..300)
  points?: number;           // default 1000
  language?: "vi" | "en";    // default "vi"
};

/**
 * Sinh câu hỏi theo chủ đề
 * POST /ai/questions/generate-by-topic
 */
export async function generateQuestionsByTopic(req: TopicGenerateRequest): Promise<Question[]> {
  try {
    // client-side normalize (không tin hoàn toàn vào UI form)
    const payload: TopicGenerateRequest = {
      topic: (req.topic ?? "").trim(),
      count: Math.max(1, Math.min(req.count ?? 5, 10)),     // clamp 1..10
      questionType: (req.questionType ?? "AUTO") as any,
      timeLimit: Math.max(5, Math.min(req.timeLimit ?? 60, 300)),
      points: Math.max(1, Math.min(req.points ?? 1000, 100000)),
      language: (req.language ?? "vi"),
    };
    if (!payload.topic) {
      throw new Error("TOPIC_EMPTY");
    }

    const res = await axiosInstance.post(`/ai/questions/generate-by-topic`, payload, {
      headers: { "Content-Type": "application/json" },
      // tùy chọn: tăng timeout nếu axiosInstance cho phép override
      timeout: 100000,
    });

    const data = res?.data;
    // Chuẩn hóa mọi kiểu trả về về Question[]
    const list: any[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.questions)
      ? data.questions
      : [];

    if (!Array.isArray(list) || list.length === 0) {
      // ném lỗi có ngữ cảnh để UI hiện toast tử tế
      const reason = data?.error || data?.message || "AI trả về rỗng";
      const err = new Error(typeof reason === "string" ? reason : JSON.stringify(reason));
      (err as any).__isEmptyAI = true;
      throw err;
    }

    return list as Question[];
  } catch (error: any) {
    // bắt 503/429 để UI biết hiển thị retry message
    const status = error?.response?.status;
    const body = error?.response?.data;
    const msg =
      body?.message ||
      body?.error ||
      error?.message ||
      "Failed to generate questions by topic (AI)";

    // bọc lại lỗi với metadata cho UI
    const wrapped = new Error(msg);
    (wrapped as any).__status = status;
    (wrapped as any).__retryAfter = error?.response?.headers?.["retry-after"];
    (wrapped as any).__isEmptyAI = (error as any)?.__isEmptyAI === true;

    handleApiError(error, "Failed to generate questions by topic (AI)");
    throw wrapped;
  }
}


/**
 * Sinh câu hỏi tương tự theo quiz (hiển thị ở modal)
 * POST /quizzes/{quizId}/questions/ai-similar?count=&lang=
 */
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
