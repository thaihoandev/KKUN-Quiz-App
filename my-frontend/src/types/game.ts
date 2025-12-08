// src/types/game.ts

// ==================== ENUMS ====================
export enum GameStatus {
    WAITING = "WAITING",
    STARTING = "STARTING",
    IN_PROGRESS = "IN_PROGRESS",
    PAUSED = "PAUSED",
    FINISHED = "FINISHED",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED",
}

export enum ParticipantStatus {
    JOINED = "JOINED",
    READY = "READY",
    PLAYING = "PLAYING",
    COMPLETED = "COMPLETED",
    LEFT = "LEFT",
    DISCONNECTED = "DISCONNECTED",
    KICKED = "KICKED",
    BANNED = "BANNED",
}

// ==================== REQUEST DTOs ====================
export interface GameCreateRequest {
    quizId: string;
    maxPlayers?: number;
    allowAnonymous?: boolean;
    showLeaderboard?: boolean;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
    settings?: Record<string, any>;
}

export interface JoinGameRequest {
    nickname?: string;
}

export interface SubmitAnswerRequest {
    submittedAnswer: any; // UUID | UUID[] | boolean | string
    submittedAt?: string; // ISO string
}

// ==================== RESPONSE DTOs ====================

export interface QuizInfoDTO {
    quizId: string;
    title: string;
    description?: string;
    thumbnailUrl?: string | null;
    questionCount: number;
}

export interface HostInfoDTO {
    userId: string;
    username: string;
    nickname?: string;
    avatarUrl?: string;
}

export interface ParticipantInfoDTO {
    participantId: string;
    nickname: string;
    isAnonymous: boolean;
    score: number;
    correctCount: number;
    status: ParticipantStatus;
}

export interface GameResponseDTO {
    gameId: string;
    pinCode: string;
    status: GameStatus;
    quizTitle: string;
    quizThumbnail?: string;
    hostNickname: string;
    playerCount: number;
    maxPlayers: number;
    allowAnonymous: boolean;
    showLeaderboard: boolean;
    totalQuestions: number;
    createdAt: string; // ISO string
}

/**
 * GameDetailDTO - Match backend response exactly
 * Used by WaitingRoomSessionPage & GamePlayPage
 *
 * Backend response structure:
 * {
 *   gameId: UUID,
 *   pinCode: "6-digit",
 *   gameStatus: "WAITING" | "IN_PROGRESS" | "FINISHED" | etc,
 *   quiz: QuizInfoDTO,
 *   host: HostInfoDTO,
 *   playerCount: number,
 *   activePlayerCount: number,
 *   maxPlayers: number,
 *   allowAnonymous: boolean,
 *   showLeaderboard: boolean,
 *   randomizeQuestions: boolean,
 *   randomizeOptions: boolean,
 *   totalQuestions: number,
 *   currentQuestionIndex: number (-1 = not started),
 *   timeLimitSeconds: number | null,
 *   currentParticipant: null (for host) | ParticipantInfoDTO (for player),
 *   startedAt: ISO string | null,
 *   endedAt: ISO string | null
 * }
 */
export interface GameDetailDTO {
    gameId: string;
    pinCode: string;
    gameStatus: GameStatus;
    quiz: QuizInfoDTO;
    host: HostInfoDTO;
    playerCount: number;
    activePlayerCount: number;
    maxPlayers: number;
    allowAnonymous: boolean;
    showLeaderboard: boolean;
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    totalQuestions: number;
    currentQuestionIndex: number;
    timeLimitSeconds?: number | null;
    currentParticipant?: ParticipantInfoDTO | null;
    startedAt?: string | null;
    endedAt?: string | null;
    isHost?: boolean; // ← Added for convenience (calculated on FE)
}

export interface GameParticipantDTO {
    participantId: string;
    gameId: string;
    nickname: string;
    isAnonymous: boolean;
    guestToken?: string | null;
    guestExpiresAt?: string | null;
    score: number;
    status: ParticipantStatus;
    joinedAt: string; // ISO
}

export interface AnswerResultDTO {
    correct: boolean;
    pointsEarned: number;
    responseTimeMs: number;
    currentScore: number;
    correctAnswer?: string; // text or JSON string
    explanation?: string;
}

export interface LeaderboardEntryDTO {
    rank: number;
    participantId: string;
    nickname: string;
    score: number;
    correctCount: number;
    currentStreak: number;
    averageTimeMs?: number | null;
    isAnonymous: boolean;
}

export interface GameStatisticsDTO {
    gameId: string;
    totalPlayers: number;
    completedPlayers: number;
    totalQuestions: number;
    totalAnswers: number;
    correctAnswers: number;
    averageScore: number;
    averageAccuracy: number;
}

export interface UserQuizStatsDTO {
    quizId: string;
    quizTitle?: string;
    totalGamesPlayed: number;
    totalGamesCompleted: number;
    highestScore: number;
    averageScore: number;
    accuracy: number;
    totalCorrectAnswers: number;
    totalQuestionsAnswered: number;
    totalTimeSpentMs: number;
    bestRank?: number | null;
    longestStreak: number;
    lastPlayedAt?: string | null;
}

/**
 * QuizSummaryDto - Used in QuizSubCard component
 * Match quiz list API response
 */
export interface QuizSummaryDto {
    quizId: string;
    slug?: string;
    title: string;
    description?: string;
    difficulty?: string;
    coverImageUrl?: string | null;
    totalQuestions: number;
    viewCount: number;
    completionCount: number;
    startCount: number;
    averageScore?: number;
    creator?: {
        id: string;
        name: string;
        avatar?: string;
    };
    createdAt?: string;
}

// ==================== EVENT PAYLOAD (WebSocket + Kafka) ====================

/**
 * GameEventPayload - Real-time events from backend
 *
 * Event types:
 * - GAME_CREATED: Game created by host
 * - GAME_STARTING: Countdown started (3 seconds)
 * - GAME_STARTED: Game actually started
 * - GAME_PAUSED: Game paused by host
 * - GAME_RESUMED: Game resumed by host
 * - GAME_ENDED: Game ended by host
 * - GAME_CANCELLED: Game cancelled by host
 * - GAME_AUTO_ENDED: Game auto-ended (no players left)
 * - GAME_START_FAILED: Game failed to start
 * - PARTICIPANT_JOINED: Player joined
 * - PARTICIPANT_LEFT: Player left
 * - PARTICIPANT_KICKED: Player kicked by host
 * - QUESTION_STARTED: New question broadcasted
 * - QUESTION_ENDED: Question time ended, show results
 */
export interface GameEventPayload {
    gameId: string;
    eventType:
        | "GAME_CREATED"
        | "GAME_STARTING"
        | "GAME_STARTED"
        | "GAME_PAUSED"
        | "GAME_RESUMED"
        | "GAME_ENDED"
        | "GAME_CANCELLED"
        | "GAME_AUTO_ENDED"
        | "GAME_START_FAILED"
        | "PARTICIPANT_JOINED"
        | "PARTICIPANT_LEFT"
        | "PARTICIPANT_KICKED"
        | "QUESTION_STARTED"
        | "QUESTION_ENDED";
    userId?: string | null;
    data?: Record<string, any>;
    timestamp: string;
}
// ==================== QUESTION TYPES ====================

export type QuestionType =
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "FILL_IN_THE_BLANK"
    | "MATCHING"
    | "ORDERING"
    | "DRAG_DROP"
    | "HOTSPOT"
    | "IMAGE_SELECTION"
    | "SHORT_ANSWER";

// ==================== OPTION DISCRIMINATED UNION ====================

export interface BaseOptionDTO {
    optionId: string;
    orderIndex?: number;
    explanation?: string;
    correct?: boolean | null; // Chỉ có khi reveal answer
}

export interface SingleChoiceOption extends BaseOptionDTO {
    type:
        | "SINGLE_CHOICE"
        | "MULTIPLE_CHOICE"
        | "TRUE_FALSE"
        | "IMAGE_SELECTION";
    text?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    imageLabel?: string;
}

export interface FillInTheBlankOption extends BaseOptionDTO {
    type: "FILL_IN_THE_BLANK";
    correctAnswer: string;
    caseInsensitive?: boolean;
}

export interface MatchingOption extends BaseOptionDTO {
    type: "MATCHING";
    leftItem: string; // Câu hỏi bên trái
    rightItem: string; // Đáp án bên phải
    matchKey?: string; // Dùng để ghép cặp (nếu backend cần)
}

export interface OrderingOption extends BaseOptionDTO {
    type: "ORDERING";
    item: string;
    correctPosition: number;
}

export interface DragDropOption extends BaseOptionDTO {
    type: "DRAG_DROP";
    draggableItem: string;
    dragImageUrl?: string;
    dropZoneId: string;
    dropZoneLabel: string;
}

export interface HotspotOption extends BaseOptionDTO {
    type: "HOTSPOT";
    imageUrl: string;
    hotspotCoordinates: string; // "x,y" hoặc polygon
    hotspotLabel?: string;
}

// Union type - Đây là chìa khóa!
export type OptionDTO =
    | SingleChoiceOption
    | FillInTheBlankOption
    | MatchingOption
    | OrderingOption
    | DragDropOption
    | HotspotOption;

// Helper để kiểm tra loại option
export const isSingleChoice = (opt: OptionDTO): opt is SingleChoiceOption =>
    [
        "SINGLE_CHOICE",
        "MULTIPLE_CHOICE",
        "TRUE_FALSE",
        "IMAGE_SELECTION",
    ].includes(opt.type);

export const isFillInTheBlank = (opt: OptionDTO): opt is FillInTheBlankOption =>
    opt.type === "FILL_IN_THE_BLANK";

export const isMatching = (opt: OptionDTO): opt is MatchingOption =>
    opt.type === "MATCHING";

export const isOrdering = (opt: OptionDTO): opt is OrderingOption =>
    opt.type === "ORDERING";

export const isDragDrop = (opt: OptionDTO): opt is DragDropOption =>
    opt.type === "DRAG_DROP";

export const isHotspot = (opt: OptionDTO): opt is HotspotOption =>
    opt.type === "HOTSPOT";

// ==================== QUESTION DISCRIMINATED UNION ====================

export interface BaseQuestionDTO {
    questionId: string;
    questionText: string;
    type: QuestionType;
    timeLimitSeconds: number;
    points: number;
    imageUrl?: string;
    explanation?: string;
}

export interface SingleChoiceQuestion extends BaseQuestionDTO {
    type:
        | "SINGLE_CHOICE"
        | "MULTIPLE_CHOICE"
        | "TRUE_FALSE"
        | "IMAGE_SELECTION";
    options: SingleChoiceOption[];
}

export interface FillInTheBlankQuestion extends BaseQuestionDTO {
    type: "FILL_IN_THE_BLANK";
    options: [FillInTheBlankOption]; // Chỉ có 1
}

export interface MatchingQuestion extends BaseQuestionDTO {
    type: "MATCHING";
    options: MatchingOption[];
}

export interface OrderingQuestion extends BaseQuestionDTO {
    type: "ORDERING";
    options: OrderingOption[];
}

export interface DragDropQuestion extends BaseQuestionDTO {
    type: "DRAG_DROP";
    options: DragDropOption[];
}

export interface HotspotQuestion extends BaseQuestionDTO {
    type: "HOTSPOT";
    options: [HotspotOption]; // Chỉ có 1
}

// Union type cho câu hỏi
export type QuestionResponseDTO =
    | SingleChoiceQuestion
    | FillInTheBlankQuestion
    | MatchingQuestion
    | OrderingQuestion
    | DragDropQuestion
    | HotspotQuestion;

// Helper type guards
export const isSingleChoiceQuestion = (
    q: QuestionResponseDTO
): q is SingleChoiceQuestion =>
    [
        "SINGLE_CHOICE",
        "MULTIPLE_CHOICE",
        "TRUE_FALSE",
        "IMAGE_SELECTION",
    ].includes(q.type);

export const isFillInTheBlankQuestion = (
    q: QuestionResponseDTO
): q is FillInTheBlankQuestion => q.type === "FILL_IN_THE_BLANK";

export const isMatchingQuestion = (
    q: QuestionResponseDTO
): q is MatchingQuestion => q.type === "MATCHING";

export const isOrderingQuestion = (
    q: QuestionResponseDTO
): q is OrderingQuestion => q.type === "ORDERING";

export const isDragDropQuestion = (
    q: QuestionResponseDTO
): q is DragDropQuestion => q.type === "DRAG_DROP";

export const isHotspotQuestion = (
    q: QuestionResponseDTO
): q is HotspotQuestion => q.type === "HOTSPOT";
