// src/hooks/useGamePlayState.ts
// ===== CUSTOM HOOK: GamePlay State Management =====
// Giúp quản lý state của GamePlayPage một cách sạch sẽ

import { useState, useRef, useCallback, useEffect } from "react";
import type {
    GameDetailDTO,
    GameParticipantDTO,
    QuestionResponseDTO,
    LeaderboardEntryDTO,
    AnswerResultDTO,
} from "@/types/game";

// ==================== TYPES ====================

export interface GamePlayState {
    isHost: boolean;
    gameInfo: GameDetailDTO | null;
    currentQuestion: QuestionResponseDTO | null;
    participants: GameParticipantDTO[];
    leaderboard: LeaderboardEntryDTO[];
    answerResult: AnswerResultDTO | null;
    participantId: string | null;
    isKicked: boolean;
    isDisconnected: boolean;
    isGameEnded: boolean;
    gameEndReason: string | null;
}

export interface GamePlayActions {
    // Game info
    setGameInfo: (info: GameDetailDTO) => void;
    setIsHost: (isHost: boolean) => void;

    // Question & Answer
    setCurrentQuestion: (question: QuestionResponseDTO | null) => void;
    setAnswerResult: (result: AnswerResultDTO | null) => void;
    clearAnswerResult: () => void;

    // Participants & Leaderboard
    setParticipants: (participants: GameParticipantDTO[]) => void;
    setLeaderboard: (leaderboard: LeaderboardEntryDTO[]) => void;
    updateLeaderboardRank: (participantId: string, newRank: number) => void;

    // Game state
    setIsKicked: (kicked: boolean) => void;
    setIsDisconnected: (disconnected: boolean) => void;
    setIsGameEnded: (ended: boolean, reason?: string) => void;

    // Reset
    resetGameState: () => void;
}

// ==================== HOOK ====================

/**
 * ✅ useGamePlayState Hook
 *
 * Quản lý toàn bộ state của GamePlayPage
 * Giúp code sạch sẽ và tái sử dụng
 *
 * Usage:
 * const { state, actions } = useGamePlayState();
 *
 * // Update state
 * actions.setGameInfo(gameData);
 * actions.setCurrentQuestion(question);
 *
 * // Access state
 * console.log(state.gameInfo);
 * console.log(state.leaderboard);
 */
export const useGamePlayState = (participantId: string | null) => {
    const [state, setState] = useState<GamePlayState>({
        isHost: false,
        gameInfo: null,
        currentQuestion: null,
        participants: [],
        leaderboard: [],
        answerResult: null,
        participantId: participantId,
        isKicked: false,
        isDisconnected: false,
        isGameEnded: false,
        gameEndReason: null,
    });

    // ===== GAME INFO ACTIONS =====

    const setGameInfo = useCallback((info: GameDetailDTO) => {
        setState((prev) => ({
            ...prev,
            gameInfo: info,
        }));
    }, []);

    const setIsHost = useCallback((isHost: boolean) => {
        setState((prev) => ({
            ...prev,
            isHost,
        }));
    }, []);

    // ===== QUESTION & ANSWER ACTIONS =====

    const setCurrentQuestion = useCallback(
        (question: QuestionResponseDTO | null) => {
            setState((prev) => ({
                ...prev,
                currentQuestion: question,
                answerResult: null, // Clear previous result when new question appears
            }));
        },
        []
    );

    const setAnswerResult = useCallback((result: AnswerResultDTO | null) => {
        setState((prev) => ({
            ...prev,
            answerResult: result,
        }));
    }, []);

    const clearAnswerResult = useCallback(() => {
        setState((prev) => ({
            ...prev,
            answerResult: null,
        }));
    }, []);

    // ===== PARTICIPANTS & LEADERBOARD ACTIONS =====

    const setParticipants = useCallback(
        (participants: GameParticipantDTO[]) => {
            setState((prev) => ({
                ...prev,
                participants,
            }));
        },
        []
    );

    const setLeaderboard = useCallback((leaderboard: LeaderboardEntryDTO[]) => {
        setState((prev) => ({
            ...prev,
            leaderboard,
        }));
    }, []);

    const updateLeaderboardRank = useCallback(
        (participantId: string, newRank: number) => {
            setState((prev) => ({
                ...prev,
                leaderboard: prev.leaderboard.map((entry) =>
                    entry.participantId === participantId
                        ? { ...entry, rank: newRank }
                        : entry
                ),
            }));
        },
        []
    );

    // ===== GAME STATE ACTIONS =====

    const setIsKicked = useCallback((kicked: boolean) => {
        setState((prev) => ({
            ...prev,
            isKicked: kicked,
        }));
    }, []);

    const setIsDisconnected = useCallback((disconnected: boolean) => {
        setState((prev) => ({
            ...prev,
            isDisconnected: disconnected,
        }));
    }, []);

    const setIsGameEnded = useCallback((ended: boolean, reason?: string) => {
        setState((prev) => ({
            ...prev,
            isGameEnded: ended,
            gameEndReason: reason || null,
        }));
    }, []);

    // ===== RESET =====

    const resetGameState = useCallback(() => {
        setState({
            isHost: false,
            gameInfo: null,
            currentQuestion: null,
            participants: [],
            leaderboard: [],
            answerResult: null,
            participantId: participantId,
            isKicked: false,
            isDisconnected: false,
            isGameEnded: false,
            gameEndReason: null,
        });
    }, [participantId]);

    const actions: GamePlayActions = {
        setGameInfo,
        setIsHost,
        setCurrentQuestion,
        setAnswerResult,
        clearAnswerResult,
        setParticipants,
        setLeaderboard,
        updateLeaderboardRank,
        setIsKicked,
        setIsDisconnected,
        setIsGameEnded,
        resetGameState,
    };

    return { state, actions };
};

// ==================== HELPER HOOKS ====================

/**
 * ✅ useGamePlayTimer Hook
 * Quản lý timer countdown
 *
 * Usage:
 * const { timeRemaining, startTimer, stopTimer } = useGamePlayTimer();
 * startTimer(30); // 30 seconds
 */
export const useGamePlayTimer = () => {
    const [timeRemaining, setTimeRemaining] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startTimer = (seconds: number) => {
        setTimeRemaining(seconds);

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setTimeRemaining(0);
    };

    const resetTimer = () => {
        stopTimer();
        setTimeRemaining(0);
    };

    return { timeRemaining, startTimer, stopTimer, resetTimer };
};

/**
 * ✅ useAnswerSubmission Hook
 * Quản lý submission logic
 *
 * Usage:
 * const { isSubmitting, selectedAnswer, handleSelect, handleSubmit, handleSkip }
 *   = useAnswerSubmission(onSubmit, onSkip);
 */
export const useAnswerSubmission = (
    onSubmit: (answer: any) => Promise<void>,
    onSkip: () => Promise<void>
) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<any>(null);

    const handleSelect = useCallback((answer: any) => {
        setSelectedAnswer(answer);
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!selectedAnswer || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit(selectedAnswer);
            setSelectedAnswer(null);
        } catch (error) {
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedAnswer, isSubmitting, onSubmit]);

    const handleSkip = useCallback(async () => {
        setIsSubmitting(true);
        try {
            await onSkip();
            setSelectedAnswer(null);
        } catch (error) {
            console.error("Skip error:", error);
        } finally {
            setIsSubmitting(false);
        }
    }, [onSkip]);

    const resetAnswer = useCallback(() => {
        setSelectedAnswer(null);
        setIsSubmitting(false);
    }, []);

    return {
        isSubmitting,
        selectedAnswer,
        handleSelect,
        handleSubmit,
        handleSkip,
        resetAnswer,
    };
};

/**
 * ✅ useDarkMode Hook
 * Detect dark mode changes
 *
 * Usage:
 * const isDark = useDarkMode();
 */
export const useDarkMode = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDark(document.body.classList.contains("dark-mode"));
        };

        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    return isDark;
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * ✅ Calculate timer color based on time remaining
 *
 * @param timeRemaining seconds remaining
 * @param totalSeconds total seconds for the question
 * @returns color string
 */
export const getTimerColor = (
    timeRemaining: number,
    totalSeconds: number = 30
): string => {
    const percent = (timeRemaining / totalSeconds) * 100;

    if (percent > 50) return "var(--success-color)"; // Green
    if (percent > 25) return "var(--warning-color)"; // Yellow
    return "var(--danger-color)"; // Red
};

/**
 * ✅ Calculate timer progress percent
 *
 * @param timeRemaining seconds remaining
 * @param totalSeconds total seconds for the question
 * @returns percent (0-100)
 */
export const getTimerPercent = (
    timeRemaining: number,
    totalSeconds: number = 30
): number => {
    return (timeRemaining / totalSeconds) * 100;
};

/**
 * ✅ Filter out current participant from list
 * Dùng để không hiển thị người chơi hiện tại trong danh sách
 *
 * @param participants list of participants
 * @param currentParticipantId current participant id
 * @returns filtered participants
 */
export const filterCurrentParticipant = (
    participants: GameParticipantDTO[],
    currentParticipantId: string | null
): GameParticipantDTO[] => {
    if (!currentParticipantId) return participants;
    return participants.filter((p) => p.participantId !== currentParticipantId);
};

/**
 * ✅ Check if answer is correct (for UI display)
 *
 * @param answerResult answer result from backend
 * @returns boolean
 */
export const isAnswerCorrect = (answerResult: any): boolean => {
    return answerResult && answerResult.correct === true;
};

/**
 * ✅ Format time for display (e.g., "05:30")
 *
 * @param seconds total seconds
 * @returns formatted time string
 */
export const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

/**
 * ✅ Get leaderboard position for current user
 *
 * @param leaderboard leaderboard entries
 * @param participantId participant id
 * @returns rank (1-indexed) or null
 */
export const getMyLeaderboardRank = (
    leaderboard: LeaderboardEntryDTO[],
    participantId: string | null
): number | null => {
    if (!participantId) return null;

    const entry = leaderboard.find((e) => e.participantId === participantId);
    return entry ? entry.rank : null;
};

/**
 * ✅ Calculate score increase from last known
 *
 * @param currentScore current score
 * @param previousScore previous score
 * @returns score increase
 */
export const getScoreIncrease = (
    currentScore: number,
    previousScore: number
): number => {
    return Math.max(0, currentScore - previousScore);
};
