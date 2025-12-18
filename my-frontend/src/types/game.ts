// src/types/game.ts - COMPLETE & CORRECTED VERSION

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

export enum GameEventType {
    GAME_CREATED = "GAME_CREATED",
    GAME_STARTED = "GAME_STARTED",
    PARTICIPANT_JOINED = "PARTICIPANT_JOINED",
    PARTICIPANT_LEFT = "PARTICIPANT_LEFT",
    PARTICIPANT_KICKED = "PARTICIPANT_KICKED",
    QUESTION_STARTED = "QUESTION_STARTED",
    QUESTION_ENDED = "QUESTION_ENDED",
    GAME_PAUSED = "GAME_PAUSED",
    GAME_RESUMED = "GAME_RESUMED",
    GAME_ENDED = "GAME_ENDED",
    GAME_CANCELLED = "GAME_CANCELLED",
    GAME_AUTO_ENDED = "GAME_AUTO_ENDED",
    GAME_START_FAILED = "GAME_START_FAILED",
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
    hostParticipantId: string;
    hostNickname: string;
    playerCount: number;
    maxPlayers: number;
    allowAnonymous: boolean;
    showLeaderboard: boolean;
    totalQuestions: number;
    createdAt: string; // ISO string
}

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
    isHost?: boolean;
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
        userId?: string;
        name: string;
        username?: string;
        avatar?: string;
    };
    createdAt?: string;
}

// ==================== CURRENT QUESTION (NEW - WAS MISSING) ====================
/**
 * ✅ Response wrapper for getting current question
 * Includes timing information and metadata
 */
export interface CurrentQuestionResponseDTO {
    question: QuestionResponseDTO;
    questionNumber: number;
    totalQuestions: number;
    timeLimitSeconds: number;
    remainingTimeSeconds: number;
    hasCurrentQuestion: boolean;
}

// ==================== QUESTION UPDATE DTO (FIXED) ====================
/**
 * ✅ FIXED: Participants receive QuestionUpdateDTO (wrapper)
 * Contains the question + metadata
 * This is what's sent via WebSocket events
 */
export interface QuestionUpdateDTO {
    question: QuestionResponseDTO;
    questionNumber: number;
    totalQuestions: number;
    timeLimitSeconds: number; // ✅ FIXED: Matches Java field name
    catchUp?: boolean; // For late joiners
}

// ==================== WEBSOCKET EVENT (NEW - WAS MISSING) ====================
/**
 * ✅ NEW: Generic game event structure
 * Used for all WebSocket events from backend
 */
export interface GameEvent<T = Record<string, any>> {
    gameId: string;
    eventType: GameEventType;
    userId?: string | null;
    data: T;
    timestamp: string; // ISO string
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
    | "SHORT_ANSWER"
    | "ESSAY"
    | "DROPDOWN"
    | "MATRIX"
    | "RANKING";

// ==================== BASE OPTION DTO ====================
export interface BaseOptionDTO {
    optionId: string;
    type: string;
    orderIndex?: number;
    explanation?: string;
    correct?: boolean | null; // ✅ Only shown after question ends
    matchKey?: string;
}

// ==================== SINGLE CHOICE / MULTIPLE_CHOICE / TRUE_FALSE / IMAGE_SELECTION ====================
export interface SingleChoiceOption extends BaseOptionDTO {
    type:
        | "SINGLE_CHOICE"
        | "MULTIPLE_CHOICE"
        | "TRUE_FALSE"
        | "IMAGE_SELECTION";
    text?: string;
    imageUrl?: string;
    imageLabel?: string;
    thumbnailUrl?: string;
}

// ==================== FILL IN THE BLANK ====================
export interface FillInTheBlankOption extends BaseOptionDTO {
    type: "FILL_IN_THE_BLANK";
    correctAnswer: string;
    caseInsensitive?: boolean;
}

// ==================== MATCHING ====================
export interface MatchingOption extends BaseOptionDTO {
    type: "MATCHING";
    leftItem: string;
    rightItem: string;
}

// ==================== ORDERING ====================
export interface OrderingOption extends BaseOptionDTO {
    type: "ORDERING";
    item: string;
    correctPosition: number;
}

// ==================== DRAG DROP ====================
export interface DragDropOption extends BaseOptionDTO {
    type: "DRAG_DROP";
    draggableItem: string;
    dragImageUrl?: string;
    dropZoneId: string;
    dropZoneLabel: string;
}

// ==================== HOTSPOT ====================
export interface HotspotOption extends BaseOptionDTO {
    type: "HOTSPOT";
    imageUrl: string;
    hotspotCoordinates: string;
    hotspotLabel?: string;
}

// ==================== SHORT ANSWER ====================
export interface ShortAnswerOption extends BaseOptionDTO {
    type: "SHORT_ANSWER";
    expectedAnswer: string;
    caseInsensitive?: boolean;
}

// ==================== ESSAY ====================
export interface EssayOption extends BaseOptionDTO {
    type: "ESSAY";
    minWords?: number;
    maxWords?: number;
    sampleAnswer?: string;
}

// ==================== DROPDOWN ====================
export interface DropdownOption extends BaseOptionDTO {
    type: "DROPDOWN";
    dropdownValue: string;
    displayLabel: string;
    placeholder?: string;
}

// ==================== MATRIX ====================
export interface MatrixOption extends BaseOptionDTO {
    type: "MATRIX";
    rowId: string;
    columnId: string;
    rowLabel: string;
    columnLabel: string;
    cellValue: string;
}

// ==================== RANKING ====================
export interface RankingOption extends BaseOptionDTO {
    type: "RANKING";
    rankableItem: string;
    correctRank: number;
    rankingScale?: number;
}

// ==================== UNION TYPE ====================
export type OptionDTO =
    | SingleChoiceOption
    | FillInTheBlankOption
    | MatchingOption
    | OrderingOption
    | DragDropOption
    | HotspotOption
    | ShortAnswerOption
    | EssayOption
    | DropdownOption
    | MatrixOption
    | RankingOption;

// ==================== OPTION TYPE GUARDS ====================
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

export const isShortAnswer = (opt: OptionDTO): opt is ShortAnswerOption =>
    opt.type === "SHORT_ANSWER";

export const isEssay = (opt: OptionDTO): opt is EssayOption =>
    opt.type === "ESSAY";

export const isDropdown = (opt: OptionDTO): opt is DropdownOption =>
    opt.type === "DROPDOWN";

export const isMatrix = (opt: OptionDTO): opt is MatrixOption =>
    opt.type === "MATRIX";

export const isRanking = (opt: OptionDTO): opt is RankingOption =>
    opt.type === "RANKING";

// ==================== QUESTION DTOs ====================

export interface BaseQuestionDTO {
    questionId: string;
    quizId: string;
    questionText: string;
    type: QuestionType;
    timeLimitSeconds: number;
    points: number;
    orderIndex: number;
    imageUrl?: string;
    explanation?: string;
    hint?: string;
    difficulty?: string;
    shuffleOptions?: boolean;
    caseInsensitive?: boolean;
    partialCredit?: boolean;
    allowMultipleCorrect?: boolean;
    tags?: string[]; // ✅ Parsed from JSON
    answerVariations?: string[]; // ✅ Parsed from JSON
    deleted?: boolean;
    deletedAt?: string | null;
    deletedBy?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt?: string;
    updatedAt?: string;
    version?: number;
    totalAttempts?: number;
    correctAttempts?: number;
    passRate?: number;
    averageTimeSeconds?: number;
    difficultyIndex?: number;
    discriminationIndex?: number;
    hasLatex?: boolean;
    hasCode?: boolean;
    hasTable?: boolean;
    hasVideo?: boolean;
    hasAudio?: boolean;
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
    options: FillInTheBlankOption[];
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
    options: HotspotOption[];
}

export interface ShortAnswerQuestion extends BaseQuestionDTO {
    type: "SHORT_ANSWER";
    options: ShortAnswerOption[];
}

export interface EssayQuestion extends BaseQuestionDTO {
    type: "ESSAY";
    options: EssayOption[];
}

export interface DropdownQuestion extends BaseQuestionDTO {
    type: "DROPDOWN";
    options: DropdownOption[];
}

export interface MatrixQuestion extends BaseQuestionDTO {
    type: "MATRIX";
    options: MatrixOption[];
}

export interface RankingQuestion extends BaseQuestionDTO {
    type: "RANKING";
    options: RankingOption[];
}

export type QuestionResponseDTO =
    | SingleChoiceQuestion
    | FillInTheBlankQuestion
    | MatchingQuestion
    | OrderingQuestion
    | DragDropQuestion
    | HotspotQuestion
    | ShortAnswerQuestion
    | EssayQuestion
    | DropdownQuestion
    | MatrixQuestion
    | RankingQuestion;

// ==================== QUESTION TYPE GUARDS ====================
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

export const isShortAnswerQuestion = (
    q: QuestionResponseDTO
): q is ShortAnswerQuestion => q.type === "SHORT_ANSWER";

export const isEssayQuestion = (q: QuestionResponseDTO): q is EssayQuestion =>
    q.type === "ESSAY";

export const isDropdownQuestion = (
    q: QuestionResponseDTO
): q is DropdownQuestion => q.type === "DROPDOWN";

export const isMatrixQuestion = (q: QuestionResponseDTO): q is MatrixQuestion =>
    q.type === "MATRIX";

export const isRankingQuestion = (
    q: QuestionResponseDTO
): q is RankingQuestion => q.type === "RANKING";

// ==================== WEBSOCKET CALLBACK TYPES ====================

/**
 * ✅ Host listener callbacks
 * Host receives:
 * - onQuestion: QuestionUpdateDTO (the full question with metadata)
 * - onGameDetails/onGameStatistics: Full data
 */
export interface HostListenerCallbacks {
    onGameEvent?: (event: GameEvent) => void;
    onQuestion?: (question: QuestionUpdateDTO) => void; // ✅ QuestionUpdateDTO
    onLeaderboard?: (leaderboard: LeaderboardEntryDTO[]) => void;
    onParticipants?: (participants: GameParticipantDTO[]) => void;
    onGameDetails?: (details: GameDetailDTO) => void;
    onGameStatistics?: (stats: GameStatisticsDTO) => void;
    onConnectionChange?: (connected: boolean) => void;
}

/**
 * ✅ Participant listener callbacks
 * Participant receives:
 * - onQuestion: QuestionUpdateDTO (wrapped with metadata)
 * - onGameDetails/onGameStatistics: Full data
 */
export interface ParticipantListenerCallbacks {
    onQuestion?: (question: QuestionUpdateDTO) => void; // ✅ QuestionUpdateDTO
    onLeaderboard?: (leaderboard: LeaderboardEntryDTO[]) => void;
    onParticipants?: (participants: GameParticipantDTO[]) => void;
    onAnswerResult?: (result: AnswerResultDTO) => void;
    onGameDetails?: (details: GameDetailDTO) => void;
    onGameStatistics?: (stats: GameStatisticsDTO) => void;
    onKicked?: (notification: any) => void;
    onConnectionChange?: (connected: boolean) => void;
    onGameEvent?: (event: GameEvent) => void;
}

// ✅ NOTE: Import GameEvent from this file
// Usage: import type { GameEvent, GameEventType } from "@/types/game";
