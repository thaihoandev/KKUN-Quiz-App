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
 * AI GENERATION TYPES
 * ========================= */

export interface GenerationJobResponse {
    jobId: string;
    status: "accepted";
    message: string;
    pollUrl: string;
}

export interface GenerationStatusResponse {
    jobId: string;
    status: "processing" | "completed" | "failed";
    createdAt: string;
    questions?: QuestionResponseDTO[];
    count?: number;
    error?: string;
    completedAt?: string;
    duration?: string;
    message?: string;
}

export type TopicGenerateRequest = {
    topic: string;
    count?: number;
    questionType?: "AUTO" | "TRUE_FALSE" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
    timeLimit?: number;
    points?: number;
    language?: "vi" | "en";
    quizId?: string;
    dedupe?: boolean;
};

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

/* =========================
 * AI GENERATION - ASYNC ENDPOINTS (RECOMMENDED)
 * ========================= */

/**
 * ✅ START async AI generation
 * Returns jobId immediately, use polling to get results
 *
 * FIXED: Corrected endpoint URL to /ai/questions/generate-by-topic-async
 */
export async function generateQuestionsByTopicAsync(
    req: TopicGenerateRequest
): Promise<string> {
    try {
        const payload: TopicGenerateRequest = {
            topic: (req.topic ?? "").trim(),
            count: Math.max(1, Math.min(req.count ?? 5, 10)),
            questionType: (req.questionType ?? "AUTO") as any,
            timeLimit: Math.max(5, Math.min(req.timeLimit ?? 60, 300)),
            points: Math.max(1, Math.min(req.points ?? 1000, 100000)),
            language: req.language ?? "vi",
            quizId: req.quizId,
            dedupe: req.dedupe ?? false,
        };

        if (!payload.topic) throw new Error("TOPIC_EMPTY");

        const res = await axiosInstance.post(
            `/ai/questions/generate-by-topic-async`, // ✅ FIXED: Added  prefix
            payload,
            {
                headers: { "Content-Type": "application/json" },
                timeout: 10000, // Short timeout since API returns immediately
            }
        );

        const jobId = res.data?.jobId;
        if (!jobId) {
            throw new Error("No jobId returned from server");
        }

        console.log(`📋 Generation job started: ${jobId}`);
        return jobId;
    } catch (error) {
        handleApiError(error, "Failed to start AI generation");
        throw error;
    }
}

/**
 * ✅ POLL job status
 * Call this repeatedly to check if generation is complete
 *
 * FIXED: Corrected endpoint URL to /ai/questions/status/{jobId}
 */
export async function getGenerationStatus(
    jobId: string
): Promise<GenerationStatusResponse> {
    try {
        const res = await axiosInstance.get(
            `/ai/questions/status/${jobId}`, // ✅ FIXED: Changed from /generate-status/ to /status/
            {
                timeout: 5000,
            }
        );

        return res.data as GenerationStatusResponse;
    } catch (error) {
        handleApiError(error, "Failed to fetch generation status");
        throw error;
    }
}

/**
 * ✅ CANCEL job
 * Removes job from cache on server
 *
 * FIXED: Corrected endpoint URL to /ai/questions/status/{jobId}
 */
export async function cancelGeneration(jobId: string): Promise<void> {
    try {
        await axiosInstance.delete(
            `/ai/questions/status/${jobId}`, // ✅ FIXED: Changed from /generate-status/ to /status/ and added
            {
                timeout: 5000,
            }
        );
        console.log(`🛑 Generation job cancelled: ${jobId}`);
    } catch (error) {
        handleApiError(error, "Failed to cancel generation");
        throw error;
    }
}

/**
 * ✅ LIST all active generation jobs
 * Use this to see what's currently running
 */
export async function listActiveGenerationJobs(): Promise<any> {
    try {
        const res = await axiosInstance.get(`/ai/questions/jobs`, {
            timeout: 5000,
        });
        return res.data;
    } catch (error) {
        handleApiError(error, "Failed to list active generation jobs");
        throw error;
    }
}

/**
 * ✅ Helper: Poll until generation completes
 * Automatically polls with interval, returns questions when done or throws on error
 *
 * IMPROVED: Better error handling and logging
 */
export async function pollGenerationUntilComplete(
    jobId: string,
    maxWaitMs: number = 300000, // 5 minutes default
    pollIntervalMs: number = 2000 // Poll every 2 seconds
): Promise<QuestionResponseDTO[]> {
    const startTime = Date.now();
    let lastStatus = "processing";

    while (Date.now() - startTime < maxWaitMs) {
        try {
            const status = await getGenerationStatus(jobId);
            lastStatus = status.status;

            if (status.status === "completed") {
                const count = status.count || status.questions?.length || 0;
                const duration =
                    status.duration || `${Date.now() - startTime}ms`;
                console.log(
                    `✅ Generation completed: ${count} questions in ${duration}`
                );
                return status.questions || [];
            }

            if (status.status === "failed") {
                console.error(
                    `❌ Generation failed: ${status.error || "Unknown error"}`
                );
                throw new Error(status.error || "Generation failed");
            }

            // Still processing, wait and retry
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(
                `⏳ Still generating (${elapsed}s)... Current: ${status.count || 0} questions`
            );

            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        } catch (error) {
            console.error(`❌ Polling error: ${(error as Error).message}`);
            throw error;
        }
    }

    throw new Error(
        `⏱️ Generation timeout after ${maxWaitMs}ms (last status: ${lastStatus}). ` +
            `Try increasing maxWaitMs or check server logs.`
    );
}

/**
 * ✅ Helper: Start generation with automatic polling
 * Combines generateQuestionsByTopicAsync + pollGenerationUntilComplete
 * Useful for UI that needs to show loading progress
 */
export async function generateQuestionsWithAutoPolling(
    req: TopicGenerateRequest,
    onProgress?: (status: GenerationStatusResponse) => void,
    maxWaitMs?: number,
    pollIntervalMs?: number
): Promise<QuestionResponseDTO[]> {
    // Start generation
    const jobId = await generateQuestionsByTopicAsync(req);

    // Poll until complete with progress callback
    const startTime = Date.now();
    let lastStatus = "processing";

    while (Date.now() - startTime < (maxWaitMs || 300000)) {
        try {
            const status = await getGenerationStatus(jobId);
            lastStatus = status.status;

            // Call progress callback if provided
            if (onProgress) {
                onProgress(status);
            }

            if (status.status === "completed") {
                console.log(
                    `✅ Generation completed: ${status.count} questions`
                );
                return status.questions || [];
            }

            if (status.status === "failed") {
                throw new Error(status.error || "Generation failed");
            }

            await new Promise((resolve) =>
                setTimeout(resolve, pollIntervalMs || 2000)
            );
        } catch (error) {
            throw error;
        }
    }

    throw new Error(
        `Generation timeout after ${maxWaitMs}ms (last status: ${lastStatus})`
    );
}

/**
 * ✅ Helper: Generate with retry logic
 * Retries on failure with exponential backoff
 */
export async function generateQuestionsWithRetry(
    req: TopicGenerateRequest,
    maxRetries: number = 3,
    onProgress?: (status: GenerationStatusResponse) => void
): Promise<QuestionResponseDTO[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(
                `🚀 Generation attempt ${attempt}/${maxRetries}: ${req.topic}`
            );
            return await generateQuestionsWithAutoPolling(
                req,
                onProgress,
                300000 + attempt * 30000
            );
        } catch (error) {
            lastError = error as Error;
            console.warn(`⚠️ Attempt ${attempt} failed: ${lastError.message}`);

            if (attempt < maxRetries) {
                const waitMs = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
                console.log(`⏳ Waiting ${waitMs}ms before retry...`);
                await new Promise((resolve) => setTimeout(resolve, waitMs));
            }
        }
    }

    throw new Error(
        `Failed to generate questions after ${maxRetries} attempts: ${lastError?.message}`
    );
}

/**
 * ❌ DEPRECATED: Sync generation (can timeout)
 * Use generateQuestionsByTopicAsync + polling instead
 *
 * FIXED: Now throws error to force migration to async approach
 */
export async function generateQuestionsByTopic(
    req: TopicGenerateRequest
): Promise<any[]> {
    throw new Error(
        "❌ generateQuestionsByTopic is DEPRECATED and removed to prevent timeouts. " +
            "Please use one of these alternatives:\n" +
            "1. generateQuestionsByTopicAsync(req) - returns jobId immediately\n" +
            "2. pollGenerationUntilComplete(jobId) - polls for results\n" +
            "3. generateQuestionsWithAutoPolling(req) - combines both\n" +
            "4. generateQuestionsWithRetry(req) - with automatic retry logic\n\n" +
            "See documentation for examples."
    );
}

/**
 * Generate similar questions for quiz using AI
 * (Assuming this endpoint exists on backend)
 */
export async function generateSimilarQuestions(
    quizId: string,
    count: number = 3,
    lang: "vi" | "en" = "vi"
): Promise<any[]> {
    try {
        const res = await axiosInstance.post(
            `/quizzes/${quizId}/questions/ai-similar`,
            {},
            { params: { count, lang } }
        );
        return res.data;
    } catch (error) {
        handleApiError(error, "Failed to generate similar questions (AI)");
        throw error;
    }
}
