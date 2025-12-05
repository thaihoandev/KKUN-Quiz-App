import { handleApiError } from "@/utils/apiErrorHandler";
import axiosInstance from "./axiosInstance";
import { PageResponse } from "@/interfaces";

/* =========================
 * Types & Interfaces
 * ========================= */

export enum QuestionType {
    SINGLE_CHOICE = "SINGLE_CHOICE",
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
    TRUE_FALSE = "TRUE_FALSE",
    FILL_IN_THE_BLANK = "FILL_IN_THE_BLANK",
    MATCHING = "MATCHING",
    ORDERING = "ORDERING",
    DRAG_DROP = "DRAG_DROP",
    SHORT_ANSWER = "SHORT_ANSWER",
    ESSAY = "ESSAY",
    HOTSPOT = "HOTSPOT",
    IMAGE_SELECTION = "IMAGE_SELECTION",
    DROPDOWN = "DROPDOWN",
    MATRIX = "MATRIX",
    RANKING = "RANKING",
}

export interface OptionRequestDTO {
    optionId?: string;
    text?: string;
    imageUrl?: string;
    correct?: boolean;
    matchKey?: string;
    orderIndex?: number;
    explanation?: string;

    // FILL_IN_THE_BLANK
    correctAnswer?: string;
    caseInsensitive?: boolean;
    acceptedVariations?: string;
    typoTolerance?: number;

    // MATCHING
    leftItem?: string;
    rightItem?: string;
    correctMatchKey?: string;

    // ORDERING
    item?: string;
    correctPosition?: number;

    // DRAG_DROP
    draggableItem?: string;
    dropZoneId?: string;
    dropZoneLabel?: string;
    dragImageUrl?: string;

    // SHORT_ANSWER
    expectedAnswer?: string;
    requiredKeywords?: string[];
    optionalKeywords?: string[];
    partialCreditPercentage?: number;

    // ESSAY
    rubricCriteria?: Record<string, any>;
    minWords?: number;
    maxWords?: number;
    sampleAnswer?: string;
    enablePlagiarismCheck?: boolean;

    // HOTSPOT
    hotspotCoordinates?: Record<string, any>; // {x, y, radius}
    hotspotLabel?: string;

    // IMAGE_SELECTION
    imageLabel?: string;
    thumbnailUrl?: string;

    // DROPDOWN
    dropdownValue?: string;
    displayLabel?: string;
    placeholder?: string;

    // MATRIX
    rowId?: string;
    columnId?: string;
    rowLabel?: string;
    columnLabel?: string;
    cellValue?: string;
    isCorrectCell?: boolean;

    // RANKING
    rankableItem?: string;
    correctRank?: number;
    rankingScale?: number;
    allowPartialCredit?: boolean;
}

export interface OptionResponseDTO extends OptionRequestDTO {
    optionId: string;
}

export interface QuestionRequestDTO {
    quizId: string;
    questionText: string;
    questionType: QuestionType | string;
    imageUrl?: string;
    image?: File;
    timeLimitSeconds?: number;
    points?: number;
    orderIndex?: number;
    explanation?: string;
    hint?: string;
    difficulty?: string; // EASY, MEDIUM, HARD, EXPERT
    tags?: string[];
    shuffleOptions?: boolean;
    caseInsensitive?: boolean;
    partialCredit?: boolean;
    allowMultipleCorrect?: boolean;
    answerVariations?: string[];
    options: OptionRequestDTO[];
}

export interface QuestionUpdateRequest {
    questionText?: string;
    explanation?: string;
    hint?: string;
    difficulty?: string;
    tags?: string[];
    points?: number;
    timeLimitSeconds?: number;
    shuffleOptions?: boolean;
    caseInsensitive?: boolean;
    partialCredit?: boolean;
    options?: OptionRequestDTO[];
}

export interface QuestionResponseDTO {
    questionId: string;
    quizId: string;
    questionText: string;
    questionType: string;
    imageUrl?: string;
    timeLimitSeconds: number;
    points: number;
    orderIndex: number;
    explanation?: string;
    hint?: string;
    difficulty: string;
    tags: string[];
    shuffleOptions: boolean;
    caseInsensitive: boolean;
    partialCredit: boolean;
    allowMultipleCorrect: boolean;
    answerVariations: string[];

    // Soft delete
    deleted: boolean;
    deletedAt?: string;
    deletedBy?: string;

    // Audit
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
    version: number;

    // Analytics
    totalAttempts: number;
    correctAttempts: number;
    passRate: number;
    averageTimeSeconds: number;
    difficultyIndex: number;
    discriminationIndex: number;

    // Rich content flags
    hasLatex: boolean;
    hasCode: boolean;
    hasTable: boolean;
    hasVideo: boolean;
    hasAudio: boolean;

    // Options
    options: OptionResponseDTO[];
}

export interface QuestionAnalyticsDTO {
    questionId: string;
    questionText: string;
    questionType: string;
    totalAttempts: number;
    correctAttempts: number;
    passRate: number;
    averageTimeSeconds: number;
    difficultyIndex: number;
    discriminationIndex: number;
    optionAnalytics: OptionAnalyticsDTO[];
}

export interface OptionAnalyticsDTO {
    optionId: string;
    optionText: string;
    selectCount?: number;
    correctSelectCount?: number;
    selectPercentage?: number;
    isCorrect: boolean;
}

export interface QuestionImportResult {
    rowNumber: number;
    status: "SUCCESS" | "FAILED";
    questionId?: string;
    errorMessage?: string;
}

export interface BulkQuestionImportResponse {
    totalQuestions: number;
    successCount: number;
    failedCount: number;
    results: QuestionImportResult[];
    errors: string[];
}

/* =========================
 * CREATE QUESTION
 * ========================= */

/**
 * Add single question with optional image
 */
export const addQuestion = async (
    request: QuestionRequestDTO,
    image?: File
): Promise<QuestionResponseDTO> => {
    try {
        const formData = new FormData();
        formData.append(
            "question",
            new Blob([JSON.stringify(request)], { type: "application/json" })
        );
        if (image) {
            formData.append("image", image);
        }

        const response = await axiosInstance.post(`/questions`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to add question");
        throw error;
    }
};

/**
 * Add multiple questions in bulk (JSON)
 */
export const addQuestionsBulk = async (
    quizId: string,
    questions: QuestionRequestDTO[]
): Promise<QuestionResponseDTO[]> => {
    try {
        const payload = questions.map((q) => ({ ...q, quizId }));
        const response = await axiosInstance.post(`/questions/bulk`, payload, {
            headers: { "Content-Type": "application/json" },
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to add questions in bulk");
        throw error;
    }
};

/* =========================
 * READ QUESTION
 * ========================= */

/**
 * Get question by ID
 */
export const getQuestionById = async (
    questionId: string
): Promise<QuestionResponseDTO> => {
    try {
        const response = await axiosInstance.get(`/questions/${questionId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch question");
        throw error;
    }
};

/**
 * Get paginated questions by quiz
 */
export const getQuestionsByQuiz = async (
    quizId: string,
    page: number = 0,
    size: number = 20
): Promise<PageResponse<QuestionResponseDTO>> => {
    try {
        const response = await axiosInstance.get(`/questions/quiz/${quizId}`, {
            params: { page, size },
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch questions by quiz");
        throw error;
    }
};

/**
 * Search questions with multiple filters
 */
export const searchQuestions = async (
    keyword?: string,
    questionType?: string,
    difficulty?: string,
    page: number = 0,
    size: number = 20
): Promise<PageResponse<QuestionResponseDTO>> => {
    try {
        const params = new URLSearchParams();
        if (keyword) params.append("keyword", keyword);
        if (questionType) params.append("questionType", questionType);
        if (difficulty) params.append("difficulty", difficulty);
        params.append("page", page.toString());
        params.append("size", size.toString());

        const response = await axiosInstance.get(`/questions/search`, {
            params,
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to search questions");
        throw error;
    }
};

/**
 * Get questions by tag
 */
export const getQuestionsByTag = async (
    tag: string
): Promise<QuestionResponseDTO[]> => {
    try {
        const response = await axiosInstance.get(`/questions/tag/${tag}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch questions by tag");
        throw error;
    }
};

/**
 * Get favorite questions for current user
 */
export const getFavoriteQuestions = async (): Promise<
    QuestionResponseDTO[]
> => {
    try {
        const response = await axiosInstance.get(`/questions/favorites`);
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch favorite questions");
        throw error;
    }
};

/* =========================
 * UPDATE QUESTION
 * ========================= */

/**
 * Update question with optional image
 */
export const updateQuestion = async (
    questionId: string,
    request: QuestionUpdateRequest,
    image?: File
): Promise<QuestionResponseDTO> => {
    try {
        const formData = new FormData();
        formData.append(
            "question",
            new Blob([JSON.stringify(request)], { type: "application/json" })
        );
        if (image) {
            formData.append("image", image);
        }

        const response = await axiosInstance.put(
            `/questions/${questionId}`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to update question");
        throw error;
    }
};

/* =========================
 * DELETE QUESTION
 * ========================= */

/**
 * Soft delete question (can be restored)
 */
export const softDeleteQuestion = async (questionId: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/questions/${questionId}`);
    } catch (error) {
        handleApiError(error, "Failed to soft delete question");
        throw error;
    }
};

/**
 * Hard delete question permanently
 */
export const hardDeleteQuestion = async (questionId: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/questions/${questionId}/hard`);
    } catch (error) {
        handleApiError(error, "Failed to permanently delete question");
        throw error;
    }
};

/**
 * Restore soft-deleted question
 */
export const restoreQuestion = async (questionId: string): Promise<void> => {
    try {
        await axiosInstance.post(`/questions/${questionId}/restore`);
    } catch (error) {
        handleApiError(error, "Failed to restore question");
        throw error;
    }
};

/* =========================
 * DUPLICATE QUESTION
 * ========================= */

/**
 * Duplicate single question to target quiz
 */
export const duplicateQuestion = async (
    questionId: string,
    targetQuizId: string
): Promise<QuestionResponseDTO> => {
    try {
        const response = await axiosInstance.post(
            `/questions/${questionId}/duplicate`,
            {},
            { params: { targetQuizId } }
        );
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to duplicate question");
        throw error;
    }
};

/**
 * Duplicate all questions from source quiz to target quiz
 */
export const duplicateQuestionsFromQuiz = async (
    sourceQuizId: string,
    targetQuizId: string
): Promise<QuestionResponseDTO[]> => {
    try {
        const response = await axiosInstance.post(
            `/questions/duplicate-from-quiz`,
            {},
            { params: { sourceQuizId, targetQuizId } }
        );
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to duplicate questions from quiz");
        throw error;
    }
};

/* =========================
 * BULK IMPORT/EXPORT
 * ========================= */

/**
 * Import questions from CSV file
 */
export const importQuestionsFromCSV = async (
    file: File,
    quizId: string
): Promise<BulkQuestionImportResponse> => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("quizId", quizId);

        const response = await axiosInstance.post(
            `/questions/import/csv`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to import questions from CSV");
        throw error;
    }
};

/**
 * Export questions as CSV file
 */
export const exportQuestionsAsCSV = async (quizId: string): Promise<Blob> => {
    try {
        const response = await axiosInstance.get(`/questions/export/csv`, {
            params: { quizId },
            responseType: "blob",
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to export questions as CSV");
        throw error;
    }
};

/**
 * Download CSV file helper
 */
export const downloadCSV = (
    blob: Blob,
    filename: string = "questions.csv"
): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/* =========================
 * ANALYTICS
 * ========================= */

/**
 * Get analytics for question
 */
export const getQuestionAnalytics = async (
    questionId: string
): Promise<QuestionAnalyticsDTO> => {
    try {
        const response = await axiosInstance.get(
            `/questions/${questionId}/analytics`
        );
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch question analytics");
        throw error;
    }
};

/* =========================
 * FAVORITES
 * ========================= */

/**
 * Mark question as favorite
 */
export const markAsFavorite = async (questionId: string): Promise<void> => {
    try {
        await axiosInstance.post(`/questions/${questionId}/favorite`);
    } catch (error) {
        handleApiError(error, "Failed to mark as favorite");
        throw error;
    }
};

/**
 * Unmark question as favorite
 */
export const unmarkAsFavorite = async (questionId: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/questions/${questionId}/favorite`);
    } catch (error) {
        handleApiError(error, "Failed to unmark as favorite");
        throw error;
    }
};

/* =========================
 * AI PAYLOAD MAPPING HELPERS
 * ========================= */

export type QuestionCreatePayload = {
    questionText: string;
    questionType:
        | "SINGLE_CHOICE"
        | "MULTIPLE_CHOICE"
        | "TRUE_FALSE"
        | "FILL_IN_THE_BLANK"
        | "MATCHING"
        | "ORDERING"
        | "DRAG_DROP"
        | "SHORT_ANSWER"
        | "ESSAY"
        | "HOTSPOT"
        | "IMAGE_SELECTION"
        | "DROPDOWN"
        | "MATRIX"
        | "RANKING";
    timeLimit?: number;
    points?: number;
    imageUrl?: string | null;
    options: Array<{
        text?: string;
        correct?: boolean;
        correctAnswer?: string;
        [key: string]: any;
    }>;
};

/**
 * Map AI-generated question to backend payload format
 */
export function mapAiQuestionToCreatePayload(aiQ: any): QuestionCreatePayload {
    const typeRaw = (aiQ?.questionType ?? aiQ?.type ?? "SINGLE_CHOICE")
        .toString()
        .toUpperCase();

    const normalizeType = ((): QuestionCreatePayload["questionType"] => {
        const validTypes = [
            "SINGLE_CHOICE",
            "MULTIPLE_CHOICE",
            "TRUE_FALSE",
            "FILL_IN_THE_BLANK",
            "MATCHING",
            "ORDERING",
            "DRAG_DROP",
            "SHORT_ANSWER",
            "ESSAY",
            "HOTSPOT",
            "IMAGE_SELECTION",
            "DROPDOWN",
            "MATRIX",
            "RANKING",
        ];

        if (validTypes.includes(typeRaw)) {
            return typeRaw as QuestionCreatePayload["questionType"];
        }

        if (typeRaw === "TRUEFALSE" || typeRaw === "T_F" || typeRaw === "TF")
            return "TRUE_FALSE";
        if (typeRaw === "SINGLE" || typeRaw === "ONE") return "SINGLE_CHOICE";
        if (typeRaw === "MULTI" || typeRaw === "MULTIPLE")
            return "MULTIPLE_CHOICE";
        if (typeRaw === "FIB" || typeRaw === "FILL") return "FILL_IN_THE_BLANK";

        return "SINGLE_CHOICE";
    })();

    const questionText = aiQ?.questionText ?? aiQ?.content ?? aiQ?.text ?? "";
    const timeLimit = Math.max(
        5,
        Math.min(Number(aiQ?.timeLimit ?? 60) || 60, 300)
    );
    const points = Math.max(
        1,
        Math.min(Number(aiQ?.points ?? 1000) || 1000, 100000)
    );
    const imageUrl = aiQ?.imageUrl ?? null;

    // Normalize options based on type
    let options: QuestionCreatePayload["options"] = [];

    if (normalizeType === "TRUE_FALSE") {
        const correct =
            typeof aiQ?.correct === "boolean"
                ? aiQ.correct
                : String(aiQ?.answer ?? "").toLowerCase() === "true";
        options = [
            { text: "True", correct: !!correct },
            { text: "False", correct: !correct },
        ];
    } else if (normalizeType === "FILL_IN_THE_BLANK") {
        const ans =
            aiQ?.correctAnswer ??
            aiQ?.answer ??
            (Array.isArray(aiQ?.answers) ? aiQ.answers[0] : "") ??
            "";
        options = [
            {
                text: String(ans ?? "").trim(),
                correct: true,
                correctAnswer: String(ans ?? "").trim(),
            },
        ];
    } else {
        // SINGLE_CHOICE / MULTIPLE_CHOICE / others
        const src = Array.isArray(aiQ?.options)
            ? aiQ.options
            : Array.isArray(aiQ?.answers)
              ? aiQ.answers
              : [];

        options = src.map((o: any) => {
            const optText = String(o?.text ?? o?.optionText ?? o ?? "");
            const isCorrect =
                typeof o?.correct === "boolean"
                    ? o.correct
                    : Array.isArray(aiQ?.correctAnswers)
                      ? aiQ.correctAnswers.includes(optText)
                      : String(aiQ?.correctAnswer ?? aiQ?.answer ?? "") ===
                        optText;

            return {
                text: optText,
                correct: isCorrect,
            };
        });
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

/**
 * Map array of AI questions to backend payloads
 */
export function mapAiListToCreatePayload(list: any[]): QuestionCreatePayload[] {
    return (list ?? []).map(mapAiQuestionToCreatePayload);
}

/**
 * Add AI-generated questions to quiz
 */
export async function addAiQuestionsToQuiz(
    quizId: string,
    aiQuestions: any[]
): Promise<QuestionResponseDTO[]> {
    try {
        const payload = mapAiListToCreatePayload(aiQuestions).map((q) => ({
            ...q,
            quizId,
        }));

        // Convert payload to QuestionRequestDTO format
        const requests: QuestionRequestDTO[] = payload.map((p) => ({
            quizId,
            questionText: p.questionText,
            questionType: p.questionType,
            timeLimitSeconds: p.timeLimit,
            points: p.points,
            imageUrl: p.imageUrl || undefined,
            options: p.options,
        }));

        return await addQuestionsBulk(quizId, requests);
    } catch (error) {
        handleApiError(error, "Failed to add AI questions to quiz");
        throw error;
    }
}
