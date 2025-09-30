import { handleApiError } from "@/utils/apiErrorHandler";
import axiosInstance from "./axiosInstance";
import { Question } from "@/interfaces";

/* =========================
 * Questions (list/detail)
 * ========================= */

export const getAllQuestions = async (): Promise<Question[]> => {
  try {
    const response = await axiosInstance.get(`/questions`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch questions");
    return [];
  }
};

/**
 * Lấy câu hỏi theo quiz (non-paged) — KHUYẾN NGHỊ: dùng bản paged ở quizService.getPagedQuestionsByQuizId
 */
export const getQuestionsByQuizId = async (quizId: string): Promise<Question[]> => {
  try {
    const response = await axiosInstance.get(`/quizzes/${quizId}/questions`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch questions for quiz");
    return [];
  }
};

export const getQuestionById = async (quizId: string, questionId: string): Promise<Question> => {
  try {
    const response = await axiosInstance.get(`/quizzes/${quizId}/questions/${questionId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch question details");
    throw error;
  }
};

export const createQuestion = async (quizId: string, formData: FormData): Promise<Question> => {
  try {
    const response = await axiosInstance.post(
      `/quizzes/${quizId}/questions/create`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to create question");
    throw error;
  }
};

export const updateQuestion = async (
  quizId: string,
  questionId: string,
  formData: FormData
): Promise<Question> => {
  try {
    const response = await axiosInstance.put(
      `/quizzes/${quizId}/questions/${questionId}/edit`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to update question");
    throw error;
  }
};

export const deleteQuestion = async (quizId: string, questionId: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/quizzes/${quizId}/questions/${questionId}/delete`);
  } catch (error) {
    handleApiError(error, "Failed to delete question");
    throw error;
  }
};

export const softDeleteQuestion = async (quizId: string, questionId: string) => {
  try {
    await axiosInstance.patch(`/quizzes/${quizId}/questions/${questionId}/soft-delete`);
  } catch (error) {
    handleApiError(error, "Failed to soft delete question");
  }
};

/* =========================
 * NEW: Bulk add questions
 * ========================= */

/** Kiểu payload tối thiểu backend cần (khớp QuestionRequestDTO) */
export type QuestionCreatePayload = {
  questionText: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_IN_THE_BLANK";
  timeLimit?: number;
  points?: number;
  imageUrl?: string | null;
  options: Array<{
    optionText: string;
    correct?: boolean;
    /** Với FILL_IN_THE_BLANK có thể gửi optionText là đáp án; correct mặc định true ở BE */
    correctAnswer?: string | null;
  }>;
};

/** Thêm nhiều câu hỏi vào 1 quiz (JSON) */
export async function addQuestionsToQuiz(
  quizId: string,
  questions: QuestionCreatePayload[]
): Promise<Question[]> {
  try {
    const res = await axiosInstance.post(`/quizzes/${quizId}/questions/bulk`, questions, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data as Question[];
  } catch (error) {
    handleApiError(error, "Failed to add questions (bulk)");
    throw error;
  }
}

/** Helper: map từ object AI (tự do) → QuestionCreatePayload chuẩn gửi BE */
export function mapAiQuestionToCreatePayload(aiQ: any): QuestionCreatePayload {
  const typeRaw = (aiQ?.questionType ?? aiQ?.type ?? "SINGLE_CHOICE").toString().toUpperCase();
  const normalizeType = ((): QuestionCreatePayload["questionType"] => {
    if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_THE_BLANK"].includes(typeRaw)) {
      return typeRaw as any;
    }
    if (typeRaw === "TRUEFALSE" || typeRaw === "T_F") return "TRUE_FALSE";
    if (typeRaw === "SINGLE" || typeRaw === "ONE") return "SINGLE_CHOICE";
    if (typeRaw === "MULTI" || typeRaw === "MULTIPLE") return "MULTIPLE_CHOICE";
    if (typeRaw === "FIB" || typeRaw === "FILL") return "FILL_IN_THE_BLANK";
    return "SINGLE_CHOICE";
  })();

  const questionText = aiQ?.questionText ?? aiQ?.content ?? aiQ?.text ?? "";
  const timeLimit = Number(aiQ?.timeLimit ?? 60) || 60;
  const points = Number(aiQ?.points ?? 1000) || 1000;
  const imageUrl = aiQ?.imageUrl ?? null;

  // Chuẩn hoá options
  let options: QuestionCreatePayload["options"] = [];

  if (normalizeType === "TRUE_FALSE") {
    // nếu AI không gửi options thì tự dựng True/False, chọn đáp án theo aiQ.correct/answer
    const correct =
      typeof aiQ?.correct === "boolean"
        ? aiQ.correct
        : (String(aiQ?.answer ?? "").toLowerCase() === "true");
    options = [
      { optionText: "True", correct: !!correct },
      { optionText: "False", correct: !correct },
    ];
  } else if (normalizeType === "FILL_IN_THE_BLANK") {
    const ans =
      aiQ?.correctAnswer ??
      aiQ?.answer ??
      (Array.isArray(aiQ?.answers) ? aiQ.answers[0] : "") ??
      "";
    options = [{ optionText: String(ans ?? "").trim(), correct: true, correctAnswer: String(ans ?? "").trim() }];
  } else {
    // SINGLE_CHOICE / MULTIPLE_CHOICE
    const src = Array.isArray(aiQ?.options)
      ? aiQ.options
      : Array.isArray(aiQ?.answers)
      ? aiQ.answers
      : [];
    options = src.map((o: any) => ({
      optionText: String(o?.text ?? o?.optionText ?? o ?? ""),
      correct:
        typeof o?.correct === "boolean"
          ? o.correct
          : Array.isArray(aiQ?.correctAnswers)
          ? aiQ.correctAnswers.includes(o?.text ?? o?.optionText ?? o)
          : (String(aiQ?.correctAnswer ?? aiQ?.answer ?? "") === (o?.text ?? o?.optionText ?? o)),
    }));
  }

  return {
    questionText: String(questionText).trim(),
    questionType: normalizeType,
    timeLimit,
    points,
    imageUrl,
    options,
  };
}

/** Helper: map cả mảng AI → payload chuẩn để gọi bulk */
export function mapAiListToCreatePayload(list: any[]): QuestionCreatePayload[] {
  return (list ?? []).map(mapAiQuestionToCreatePayload);
}
