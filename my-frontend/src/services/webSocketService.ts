// src/services/webSocketService.ts - FIXED VERSION WITH CORRECT CALLBACK TYPES

import * as StompJs from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { NotificationDTO } from "@/services/notificationService";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import { buildNotificationText } from "@/utils/notificationText";
import type {
    GameEvent,
    GameEventType,
    GameDetailDTO,
    GameStatisticsDTO,
    CurrentQuestionResponseDTO,
} from "@/types/game";

// ==================== TYPES ====================

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    time: string;
    avatar?: string;
}

// ✅ Use GameEvent from types/game (has eventType as enum string)
export type GameEventPayload = GameEvent;

// ✅ Use actual DTO types from types/game
export interface QuestionUpdate extends CurrentQuestionResponseDTO {
    // Extends CurrentQuestionResponseDTO which has:
    // - question: QuestionResponseDTO
    // - questionNumber: number
    // - totalQuestions: number
    // - timeLimitSeconds: number
    // - remainingTimeSeconds: number
    // - hasCurrentQuestion: boolean
    catchUp?: boolean; // Additional field for catch-up
}

export interface LeaderboardUpdate {
    entries: any[];
    timestamp: string;
}

// ✅ Payload types for WebSocket
export interface SubmitAnswerPayload {
    submittedAnswer: any;
    submittedAt: string;
}

export interface SkipQuestionPayload {
    // Empty body, participantId handled by service layer
}

// Callback types - ✅ Use actual DTOs from game types
type NotificationCallback = (notification: AppNotification) => void;
type GameEventCallback = (event: GameEvent) => void; // ✅ FIXED: Use GameEvent
type QuestionCallback = (question: QuestionUpdate) => void;
type LeaderboardCallback = (leaderboard: any[]) => void;
type ParticipantsCallback = (participants: any[]) => void;
type AnswerResultCallback = (result: any) => void;
type GameDetailsCallback = (details: GameDetailDTO) => void; // ✅ FIXED: Use GameDetailDTO
type StatisticsCallback = (stats: GameStatisticsDTO) => void; // ✅ FIXED: Use GameStatisticsDTO
type KickedCallback = (notification: any) => void;
type ErrorCallback = (error: { error: string; type: string }) => void;
type ConnectionCallback = (connected: boolean) => void;

// ==================== LOGGING ====================

const DEBUG =
    String(import.meta.env.VITE_WS_DEBUG || "false").toLowerCase() === "true";
const tag = "[WS]";

const log = {
    debug: (...args: any[]) => DEBUG && console.debug(tag, ...args),
    info: (...args: any[]) => console.info(tag, ...args),
    warn: (...args: any[]) => console.warn(tag, ...args),
    error: (...args: any[]) => console.error(tag, ...args),
};

// ==================== MAIN SERVICE ====================

export class WebSocketService {
    private client: StompJs.Client | null = null;
    private accessToken: string | null = null;
    private guestToken: string | null = null;
    private isConnected = false;

    // Subscriptions
    private subs = {
        notifications: null as StompJs.StompSubscription | null,
        gameRoom: new Map<string, StompJs.StompSubscription>(),
        gameTopic: new Map<string, StompJs.StompSubscription>(),
        userQueue: {
            answerResult: null as StompJs.StompSubscription | null,
            skipAck: null as StompJs.StompSubscription | null,
            leaderboard: null as StompJs.StompSubscription | null,
            gameDetails: null as StompJs.StompSubscription | null,
            participants: null as StompJs.StompSubscription | null,
            question: null as StompJs.StompSubscription | null,
            statistics: null as StompJs.StompSubscription | null,
            kicked: null as StompJs.StompSubscription | null,
            errors: null as StompJs.StompSubscription | null,
            gameUpdates: null as StompJs.StompSubscription | null,
            currentQuestion: null as StompJs.StompSubscription | null,
        },
    };

    // ✅ FIXED: Proper callback arrays with correct types
    private callbacks = {
        notification: [] as NotificationCallback[],
        gameEvent: [] as GameEventCallback[],
        question: [] as QuestionCallback[],
        leaderboard: [] as LeaderboardCallback[],
        participants: [] as ParticipantsCallback[],
        answerResult: [] as AnswerResultCallback[],
        gameDetails: [] as GameDetailsCallback[],
        statistics: [] as StatisticsCallback[],
        kicked: [] as KickedCallback[],
        error: [] as ErrorCallback[],
        connection: [] as ConnectionCallback[],
    };

    /**
     * Initialize WebSocket service with optional tokens
     * @param accessToken - JWT token for authenticated users
     * @param guestToken - Guest token for anonymous users
     */
    constructor(
        accessToken: string | null = null,
        guestToken: string | null = null
    ) {
        this.accessToken = accessToken;
        this.guestToken = guestToken;
        log.info(
            "WebSocketService initialized. Token:",
            this.maskToken(accessToken),
            "GuestToken:",
            guestToken ? "present" : "none"
        );
        this.connect();
    }

    // ==================== CONNECTION ====================

    /**
     * Establish WebSocket connection
     */
    private connect() {
        const WS_ENDPOINT =
            import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";
        log.info("Connecting to WebSocket endpoint:", WS_ENDPOINT);

        const socket = new SockJS(WS_ENDPOINT);

        this.client = new StompJs.Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            connectHeaders: this.getConnectHeaders(),
            debug: (str) => DEBUG && console.debug("[STOMP]", str),
        });

        this.client.onConnect = () => {
            this.isConnected = true;
            log.info("✅ STOMP connected successfully");
            this.emitConnectionChange(true);
            this.resubscribeAll();
        };

        this.client.onStompError = (frame) => {
            log.error("❌ STOMP Error:", frame.headers["message"], frame.body);
        };

        this.client.onWebSocketClose = () => {
            this.isConnected = false;
            log.warn("⚠️ WebSocket closed");
            this.emitConnectionChange(false);
        };

        this.client.onWebSocketError = (evt) => {
            log.warn("⚠️ WebSocket error:", evt);
        };

        this.client.activate();
    }

    /**
     * Get appropriate connect headers based on user type
     */
    private getConnectHeaders(): Record<string, string> {
        const headers: Record<string, string> = {};

        if (this.accessToken) {
            headers["Authorization"] = `Bearer ${this.accessToken}`;
            log.debug("Connecting as authenticated user");
        } else if (this.guestToken) {
            headers["X-Guest-Token"] = this.guestToken;
            log.debug("Connecting as anonymous user (guest)");
        } else {
            log.debug("Connecting without authentication");
        }

        return headers;
    }

    /**
     * Resubscribe to all channels after reconnection
     */
    private resubscribeAll() {
        log.debug("Resubscribing to all channels...");
        this.subscribeToNotifications();
        this.subscribeToUserQueues();
    }

    /**
     * Update access token and reconnect
     * @param token - New JWT token
     */
    public setToken(token: string | null) {
        if (token === this.accessToken) return;

        log.info("Token changed → reconnecting...", this.maskToken(token));
        this.accessToken = token;
        this.guestToken = null;

        if (this.client) {
            this.client.deactivate().finally(() => this.connect());
        } else {
            this.connect();
        }
    }

    /**
     * Update guest token and reconnect
     * @param guestToken - New guest token
     */
    public setGuestToken(guestToken: string | null) {
        if (guestToken === this.guestToken) return;

        log.info("Guest token changed → reconnecting...");
        this.guestToken = guestToken;
        this.accessToken = null;

        if (this.client) {
            this.client.deactivate().finally(() => this.connect());
        } else {
            this.connect();
        }
    }

    /**
     * Manually disconnect WebSocket
     */
    public disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.isConnected = false;
            log.info("WebSocket disconnected manually");
            this.emitConnectionChange(false);
        }
    }

    /**
     * Check if WebSocket is currently connected
     */
    public isWebSocketConnected(): boolean {
        return this.isConnected;
    }

    // ==================== GAME ROOM MANAGEMENT ====================

    /**
     * Join game room - Subscribe to /topic/game/{gameId}
     * @param gameId - Game ID
     * @param participantId - Optional participant ID for logging
     */
    public joinGameRoom(gameId: string, participantId?: string) {
        if (!this.client?.connected) {
            log.warn("❌ Cannot join game room – not connected");
            return;
        }

        const destination = `/topic/game/${gameId}`;
        if (this.subs.gameRoom.has(gameId)) {
            log.debug("Already in game room:", gameId);
            return;
        }

        const sub = this.client.subscribe(destination, (msg) => {
            try {
                const event: GameEvent = JSON.parse(msg.body);
                log.debug(
                    "📨 Game event received from /topic/game/{gameId}:",
                    event.eventType
                );
                this.emitGameEvent(event);
            } catch (e) {
                log.error("❌ Parse game event error:", e);
            }
        });

        this.subs.gameRoom.set(gameId, sub);
        log.info(
            `✅ Joined game room: ${destination}${
                participantId ? ` (participantId: ${participantId})` : " (HOST)"
            }`
        );
    }

    /**
     * Leave game room and unsubscribe from all related topics
     * @param gameId - Game ID
     */
    public leaveGameRoom(gameId: string) {
        const roomSub = this.subs.gameRoom.get(gameId);
        roomSub?.unsubscribe();
        this.subs.gameRoom.delete(gameId);

        this.unsubscribeFromAllGameTopics(gameId);

        log.info(`✅ Fully left game room: ${gameId}`);
    }

    /**
     * Subscribe to questions
     * @param gameId - Game ID
     */
    public subscribeToQuestions(gameId: string) {
        if (!this.client?.connected) {
            log.warn("❌ Cannot subscribe - not connected");
            return;
        }

        const destination = `/topic/game/${gameId}/question`;

        if (this.subs.gameTopic.has(destination)) {
            log.debug("Already subscribed to questions:", destination);
            return;
        }

        const sub = this.client.subscribe(destination, (msg) => {
            try {
                const data = JSON.parse(msg.body);
                log.info(
                    "✅ QUESTION MESSAGE RECEIVED from /topic/game/{gameId}/question"
                );
                log.debug("Question data:", data);

                // ✅ Parse as CurrentQuestionResponseDTO
                const questionUpdate: QuestionUpdate = {
                    question: data.question || data,
                    questionNumber: data.questionNumber || 0,
                    totalQuestions: data.totalQuestions || 0,
                    timeLimitSeconds:
                        data.timeLimitSeconds ||
                        data.timeLimit ||
                        data.question?.timeLimitSeconds ||
                        0,
                    remainingTimeSeconds: data.remainingTimeSeconds || 0,
                    hasCurrentQuestion: data.hasCurrentQuestion !== false,
                    catchUp: data.catchUp || false,
                };

                this.emitQuestion(questionUpdate);

                // Also emit as GameEvent
                const event: GameEvent = {
                    gameId: gameId,
                    eventType: "QUESTION_STARTED" as any, // ✅ Cast to avoid enum strictness
                    data: { question: data },
                    timestamp: new Date().toISOString(),
                };
                this.emitGameEvent(event);
            } catch (e) {
                log.error("❌ Failed to parse question from topic:", e);
            }
        });

        this.subs.gameTopic.set(destination, sub);
        log.info(`✅ Subscribed to: ${destination}`);
    }

    /**
     * Subscribe to leaderboard updates
     * @param gameId - Game ID
     */
    public subscribeToLeaderboard(gameId: string) {
        if (!this.client?.connected) return;

        const destination = `/topic/game/${gameId}/leaderboard`;

        if (this.subs.gameTopic.has(destination)) {
            log.debug("Already subscribed to leaderboard:", destination);
            return;
        }

        const sub = this.client.subscribe(destination, (msg) => {
            try {
                let leaderboard = JSON.parse(msg.body);

                // Handle both array and object with entries property
                if (!Array.isArray(leaderboard) && leaderboard?.entries) {
                    leaderboard = leaderboard.entries;
                }

                log.debug(
                    "✅ Leaderboard received:",
                    Array.isArray(leaderboard) ? leaderboard.length : "object",
                    "entries"
                );
                this.emitLeaderboard(leaderboard);
            } catch (e) {
                log.error("❌ Failed to parse leaderboard:", e);
            }
        });

        this.subs.gameTopic.set(destination, sub);
        log.info(`✅ Subscribed to: ${destination}`);
    }

    /**
     * Subscribe to participant changes
     * @param gameId - Game ID
     */
    public subscribeToParticipants(gameId: string) {
        if (!this.client?.connected) return;

        // Subscribe to player joined events
        const joinedDest = `/topic/game/${gameId}/player-joined`;
        if (!this.subs.gameTopic.has(joinedDest)) {
            const sub = this.client.subscribe(joinedDest, (msg) => {
                try {
                    const data = JSON.parse(msg.body);
                    log.debug("✅ Player joined:", data.nickname);
                    this.requestParticipantsData(gameId);
                } catch (e) {
                    log.error("❌ Failed to parse player-joined event:", e);
                }
            });
            this.subs.gameTopic.set(joinedDest, sub);
            log.info(`✅ Subscribed to: ${joinedDest}`);
        }

        // Subscribe to player left events
        const leftDest = `/topic/game/${gameId}/player-left`;
        if (!this.subs.gameTopic.has(leftDest)) {
            const sub = this.client.subscribe(leftDest, (msg) => {
                try {
                    const data = JSON.parse(msg.body);
                    log.debug("✅ Player left:", data.nickname);
                    this.requestParticipantsData(gameId);
                } catch (e) {
                    log.error("❌ Failed to parse player-left event:", e);
                }
            });
            this.subs.gameTopic.set(leftDest, sub);
            log.info(`✅ Subscribed to: ${leftDest}`);
        }

        // Subscribe to player kicked events
        const kickedDest = `/topic/game/${gameId}/player-kicked`;
        if (!this.subs.gameTopic.has(kickedDest)) {
            const sub = this.client.subscribe(kickedDest, (msg) => {
                try {
                    const data = JSON.parse(msg.body);
                    log.debug("✅ Player kicked:", data.nickname);
                    this.requestParticipantsData(gameId);
                } catch (e) {
                    log.error("❌ Failed to parse player-kicked event:", e);
                }
            });
            this.subs.gameTopic.set(kickedDest, sub);
            log.info(`✅ Subscribed to: ${kickedDest}`);
        }
    }

    /**
     * Subscribe to kick notifications for specific participant
     * @param gameId - Game ID
     * @param participantId - Participant ID to watch
     */
    public subscribeToKickNotifications(gameId: string, participantId: string) {
        if (!this.client?.connected) return;

        const destination = `/topic/game/${gameId}/kick/${participantId}`;

        if (this.subs.gameTopic.has(destination)) {
            log.debug("Already subscribed to kick:", destination);
            return;
        }

        const sub = this.client.subscribe(destination, (msg) => {
            try {
                const notification = JSON.parse(msg.body);
                log.warn("⚠️ KICK NOTIFICATION:", notification);
                this.emitKicked(notification);
            } catch (e) {
                log.error("❌ Failed to parse kick notification:", e);
            }
        });

        this.subs.gameTopic.set(destination, sub);
        log.info(`✅ Subscribed to kick notifications: ${destination}`);
    }

    /**
     * Unsubscribe from all game-related topics
     * @param gameId - Game ID
     */
    public unsubscribeFromAllGameTopics(gameId: string) {
        const prefix = `/topic/game/${gameId}`;
        for (const [dest, sub] of this.subs.gameTopic) {
            if (dest.startsWith(prefix)) {
                sub.unsubscribe();
                this.subs.gameTopic.delete(dest);
                log.info(`✅ Unsubscribed from: ${dest}`);
            }
        }
    }

    // ==================== REQUEST DATA VIA WEBSOCKET ====================

    /**
     * Request participants data
     * @param gameId - Game ID
     */
    private requestParticipantsData(gameId: string) {
        this.send(`/app/game/${gameId}/participants`, {});
    }

    /**
     * Request current question from server (for catch-up)
     * @param gameId - Game ID
     * @param participantId - Participant ID
     */
    public requestCurrentQuestion(gameId: string, participantId: string) {
        this.sendWithParticipantId(
            `/app/game/${gameId}/request-current-question`,
            {},
            participantId
        );
        log.info(`📡 Requested current question for game ${gameId}`);
    }

    // ==================== USER PRIVATE QUEUES ====================

    /**
     * Subscribe to notification queue
     */
    private subscribeToNotifications() {
        if (!this.client?.connected) return;

        if (this.subs.notifications) {
            this.subs.notifications.unsubscribe();
        }

        this.subs.notifications = this.client.subscribe(
            "/user/queue/notifications",
            (msg) => {
                try {
                    const dto: NotificationDTO = JSON.parse(msg.body);
                    const appNoti: AppNotification = {
                        id:
                            dto.notificationId?.toString() ||
                            Date.now().toString(),
                        title: buildNotificationText(dto),
                        message: buildNotificationText(dto),
                        time: new Date(
                            dto.createdAt || Date.now()
                        ).toLocaleString(),
                        avatar: dto.actor?.avatar || unknownAvatar,
                    };
                    this.emitNotification(appNoti);
                } catch (e) {
                    log.error("❌ Failed to parse notification:", e);
                }
            }
        );
        log.info("✅ Subscribed to /user/queue/notifications");
    }

    /**
     * Subscribe to all user private queues
     */
    private subscribeToUserQueues() {
        if (!this.client?.connected) return;

        const sub = (dest: string, handler: (msg: StompJs.Message) => void) => {
            return this.client!.subscribe(`/user${dest}`, handler);
        };

        // Answer result
        this.subs.userQueue.answerResult = sub(
            "/queue/answer-result",
            (msg) => {
                try {
                    const data = JSON.parse(msg.body);
                    console.log("✅ Answer result received");
                    this.emitAnswerResult(data);
                } catch (e) {
                    log.error("❌ Failed to parse answer result:", e);
                }
            }
        );

        // Skip acknowledgment
        this.subs.userQueue.skipAck = sub("/queue/skip-ack", (msg) => {
            log.debug("✅ Skip acknowledged");
        });

        // Leaderboard from queue
        this.subs.userQueue.leaderboard = sub("/queue/leaderboard", (msg) => {
            try {
                let data = JSON.parse(msg.body);

                if (!Array.isArray(data) && data?.entries) {
                    data = data.entries;
                }

                console.log("✅ Leaderboard from queue received");
                this.emitLeaderboard(data);
            } catch (e) {
                log.error("❌ Failed to parse leaderboard:", e);
            }
        });

        // ✅ FIXED: Game details as GameDetailDTO
        this.subs.userQueue.gameDetails = sub("/queue/game-details", (msg) => {
            try {
                const data = JSON.parse(msg.body) as GameDetailDTO;
                log.debug("✅ Game details from queue received");
                this.emitGameDetails(data);
            } catch (e) {
                log.error("❌ Failed to parse game details:", e);
            }
        });

        // Participants list
        this.subs.userQueue.participants = sub("/queue/participants", (msg) => {
            try {
                let data = JSON.parse(msg.body);

                if (!Array.isArray(data) && data?.content) {
                    data = data.content;
                }

                log.debug(
                    "✅ Participants from queue received:",
                    Array.isArray(data) ? data.length : "object"
                );
                this.emitParticipants(data);
            } catch (e) {
                log.error("❌ Failed to parse participants:", e);
            }
        });

        // ✅ FIXED: Statistics as GameStatisticsDTO
        this.subs.userQueue.statistics = sub("/queue/statistics", (msg) => {
            try {
                const data = JSON.parse(msg.body) as GameStatisticsDTO;
                log.debug("✅ Statistics from queue received");
                this.emitStatistics(data);
            } catch (e) {
                log.error("❌ Failed to parse statistics:", e);
            }
        });

        // Current question for catch-up
        this.subs.userQueue.currentQuestion = sub(
            "/queue/current-question",
            (msg) => {
                try {
                    const payload = JSON.parse(msg.body);

                    if (!payload.hasCurrentQuestion) {
                        log.info(
                            "⏳ No current question - waiting for host to start"
                        );
                        return;
                    }

                    log.info(
                        `🔄 [CATCH-UP] Received current question #${payload.questionNumber}`
                    );

                    const questionUpdate: QuestionUpdate = {
                        question: payload.question,
                        questionNumber: payload.questionNumber,
                        totalQuestions: payload.totalQuestions,
                        timeLimitSeconds: payload.timeLimitSeconds,
                        remainingTimeSeconds: payload.remainingTimeSeconds || 0,
                        hasCurrentQuestion: payload.hasCurrentQuestion,
                        catchUp: true,
                    };

                    this.emitQuestion(questionUpdate);
                } catch (e) {
                    log.error("❌ Failed to parse current-question:", e);
                }
            }
        );

        // Kicked notification
        this.subs.userQueue.kicked = sub("/queue/kicked", (msg) => {
            try {
                const data = JSON.parse(msg.body);
                log.warn("⚠️ Kicked notification received from queue");
                this.emitKicked(data);
            } catch (e) {
                log.error("❌ Failed to parse kick:", e);
            }
        });

        // Error messages
        this.subs.userQueue.errors = sub("/queue/errors", (msg) => {
            try {
                const err = JSON.parse(msg.body);
                const errorData = {
                    error: err.error || err.message || "Có lỗi xảy ra",
                    type: err.type || "UNKNOWN_ERROR",
                };
                this.emitError(errorData);

                const noti: AppNotification = {
                    id: Date.now().toString(),
                    title: "Lỗi từ server",
                    message: errorData.error,
                    time: new Date().toLocaleString(),
                };
                this.emitNotification(noti);
            } catch (e) {
                log.error("❌ Failed to parse error message:", e);
            }
        });

        // Game updates
        this.subs.userQueue.gameUpdates = sub("/queue/game-updates", (msg) => {
            try {
                const data = JSON.parse(msg.body);
                log.debug("✅ Game update received:", data);
                this.emitGameEvent(data);
            } catch (e) {
                log.error("❌ Failed to parse game update:", e);
            }
        });

        log.info("✅ Subscribed to all user private queues");
    }

    // ==================== SEND MESSAGES ====================

    /**
     * Submit answer via WebSocket
     * @param gameId - Game ID
     * @param participantId - Participant ID
     * @param answer - Answer data
     */
    public submitAnswer(gameId: string, participantId: string, answer: any) {
        const payload: SubmitAnswerPayload = {
            submittedAnswer: answer,
            submittedAt: new Date().toISOString(),
        };

        this.sendWithParticipantId(
            `/app/game/${gameId}/answer`,
            payload,
            participantId
        );
    }

    /**
     * Skip current question
     */
    public skipQuestion(gameId: string, participantId: string) {
        this.sendWithParticipantId(
            `/app/game/${gameId}/skip`,
            {},
            participantId
        );
    }

    /**
     * Send heartbeat to keep connection alive
     */
    public sendHeartbeat(gameId: string, participantId: string) {
        this.sendWithParticipantId(
            `/app/game/${gameId}/heartbeat`,
            {},
            participantId
        );
        log.debug("💓 Heartbeat sent");
    }

    /**
     * Request leaderboard update
     */
    public requestLeaderboard(gameId: string, participantId: string) {
        this.sendWithParticipantId(
            `/app/game/${gameId}/leaderboard`,
            {},
            participantId
        );
    }

    /**
     * Request participants list
     */
    public requestParticipants(gameId: string, participantId: string) {
        this.sendWithParticipantId(
            `/app/game/${gameId}/participants`,
            {},
            participantId
        );
        log.debug("📡 Participants requested");
    }

    /**
     * Request game details
     */
    public requestGameDetails(gameId: string, participantId: string) {
        this.sendWithParticipantId(
            `/app/game/${gameId}/details`,
            {},
            participantId
        );
    }

    /**
     * Request game statistics
     */
    public requestGameStatistics(gameId: string, participantId: string) {
        this.sendWithParticipantId(
            `/app/game/${gameId}/statistics`,
            {},
            participantId
        );
    }

    /**
     * Request final leaderboard
     */
    public requestFinalLeaderboard(gameId: string, participantId: string) {
        this.sendWithParticipantId(
            `/app/game/${gameId}/final-leaderboard`,
            {},
            participantId
        );
    }

    /**
     * Send message with participantId in STOMP header
     */
    private sendWithParticipantId(
        destination: string,
        body: any = {},
        participantId: string
    ) {
        if (!this.client?.connected) {
            log.warn("❌ Cannot send – WebSocket not connected:", destination);
            return;
        }

        try {
            this.client.publish({
                destination,
                body: JSON.stringify(body),
                headers: {
                    participantId,
                },
            });
            log.debug(
                "✅ Message sent to:",
                destination,
                "participantId:",
                participantId
            );
        } catch (e) {
            log.error("❌ Failed to send message:", e);
        }
    }

    /**
     * Send generic message without participantId
     */
    private send(destination: string, body: any = {}) {
        if (!this.client?.connected) {
            log.warn("❌ Cannot send – WebSocket not connected:", destination);
            return;
        }

        try {
            this.client.publish({
                destination,
                body: JSON.stringify(body),
            });
            log.debug("✅ Message sent to:", destination);
        } catch (e) {
            log.error("❌ Failed to send message:", e);
        }
    }

    // ==================== CALLBACKS ====================

    public onGameEvent(cb: GameEventCallback) {
        this.callbacks.gameEvent.push(cb);
        return () => this.offGameEvent(cb);
    }

    public offGameEvent(cb: GameEventCallback) {
        this.callbacks.gameEvent = this.callbacks.gameEvent.filter(
            (c) => c !== cb
        );
    }

    public onQuestion(cb: QuestionCallback) {
        this.callbacks.question.push(cb);
        return () => this.offQuestion(cb);
    }

    public offQuestion(cb: QuestionCallback) {
        this.callbacks.question = this.callbacks.question.filter(
            (c) => c !== cb
        );
    }

    public onLeaderboard(cb: LeaderboardCallback) {
        this.callbacks.leaderboard.push(cb);
        return () => this.offLeaderboard(cb);
    }

    public offLeaderboard(cb: LeaderboardCallback) {
        this.callbacks.leaderboard = this.callbacks.leaderboard.filter(
            (c) => c !== cb
        );
    }

    public onParticipants(cb: ParticipantsCallback) {
        this.callbacks.participants.push(cb);
        return () => {
            this.callbacks.participants = this.callbacks.participants.filter(
                (c) => c !== cb
            );
        };
    }

    public onAnswerResult(cb: AnswerResultCallback) {
        this.callbacks.answerResult.push(cb);
        return () => {
            this.callbacks.answerResult = this.callbacks.answerResult.filter(
                (c) => c !== cb
            );
        };
    }

    /**
     * ✅ FIXED: Subscribe to game details (GameDetailDTO)
     */
    public onGameDetails(cb: GameDetailsCallback) {
        this.callbacks.gameDetails.push(cb);
        return () => {
            this.callbacks.gameDetails = this.callbacks.gameDetails.filter(
                (c) => c !== cb
            );
        };
    }

    /**
     * ✅ FIXED: Subscribe to statistics (GameStatisticsDTO)
     */
    public onStatistics(cb: StatisticsCallback) {
        this.callbacks.statistics.push(cb);
        return () => {
            this.callbacks.statistics = this.callbacks.statistics.filter(
                (c) => c !== cb
            );
        };
    }

    public onKicked(cb: KickedCallback) {
        this.callbacks.kicked.push(cb);
        return () => {
            this.callbacks.kicked = this.callbacks.kicked.filter(
                (c) => c !== cb
            );
        };
    }

    public onNotification(cb: NotificationCallback) {
        this.callbacks.notification.push(cb);
        return () => this.offNotification(cb);
    }

    public offNotification(cb: NotificationCallback) {
        this.callbacks.notification = this.callbacks.notification.filter(
            (c) => c !== cb
        );
    }

    public onError(cb: ErrorCallback) {
        this.callbacks.error.push(cb);
        return () => this.offError(cb);
    }

    public offError(cb: ErrorCallback) {
        this.callbacks.error = this.callbacks.error.filter((c) => c !== cb);
    }

    public onConnectionChange(cb: ConnectionCallback) {
        this.callbacks.connection.push(cb);
        return () => this.offConnectionChange(cb);
    }

    public offConnectionChange(cb: ConnectionCallback) {
        this.callbacks.connection = this.callbacks.connection.filter(
            (c) => c !== cb
        );
    }

    // ==================== EMIT ====================

    private emitGameEvent(event: GameEvent) {
        log.info("🔥 Emitting game event:", event.eventType);
        this.callbacks.gameEvent.forEach((cb) => {
            try {
                cb(event);
            } catch (e) {
                log.error("❌ Error in gameEvent callback:", e);
            }
        });
    }

    private emitQuestion(question: QuestionUpdate) {
        log.info("🔥 Emitting question");
        this.callbacks.question.forEach((cb) => {
            try {
                cb(question);
            } catch (e) {
                log.error("❌ Error in question callback:", e);
            }
        });
    }

    private emitLeaderboard(leaderboard: any[]) {
        log.debug("🔥 Emitting leaderboard");
        this.callbacks.leaderboard.forEach((cb) => {
            try {
                cb(leaderboard);
            } catch (e) {
                log.error("❌ Error in leaderboard callback:", e);
            }
        });
    }

    private emitParticipants(participants: any[]) {
        log.debug("🔥 Emitting participants:", participants.length);
        this.callbacks.participants.forEach((cb) => {
            try {
                cb(participants);
            } catch (e) {
                log.error("❌ Error in participants callback:", e);
            }
        });
    }

    private emitAnswerResult(result: any) {
        log.debug("🔥 Emitting answer result");
        this.callbacks.answerResult.forEach((cb) => {
            try {
                cb(result);
            } catch (e) {
                log.error("❌ Error in answerResult callback:", e);
            }
        });
    }

    private emitGameDetails(details: GameDetailDTO) {
        log.debug("🔥 Emitting game details");
        this.callbacks.gameDetails.forEach((cb) => {
            try {
                cb(details);
            } catch (e) {
                log.error("❌ Error in gameDetails callback:", e);
            }
        });
    }

    private emitStatistics(stats: GameStatisticsDTO) {
        log.debug("🔥 Emitting statistics");
        this.callbacks.statistics.forEach((cb) => {
            try {
                cb(stats);
            } catch (e) {
                log.error("❌ Error in statistics callback:", e);
            }
        });
    }

    private emitKicked(notification: any) {
        log.warn("🔥 Emitting kicked notification");
        this.callbacks.kicked.forEach((cb) => {
            try {
                cb(notification);
            } catch (e) {
                log.error("❌ Error in kicked callback:", e);
            }
        });
    }

    private emitNotification(notification: AppNotification) {
        this.callbacks.notification.forEach((cb) => {
            try {
                cb(notification);
            } catch (e) {
                log.error("❌ Error in notification callback:", e);
            }
        });
    }

    private emitError(error: { error: string; type: string }) {
        this.callbacks.error.forEach((cb) => {
            try {
                cb(error);
            } catch (e) {
                log.error("❌ Error in error callback:", e);
            }
        });
    }

    private maskToken(t?: string | null) {
        return t ? `${t.slice(0, 8)}…${t.slice(-6)}` : "(none)";
    }

    private emitConnectionChange(connected: boolean) {
        log.info(
            "🔥 Connection status changed:",
            connected ? "CONNECTED" : "DISCONNECTED"
        );
        this.callbacks.connection.forEach((cb) => {
            try {
                cb(connected);
            } catch (e) {
                log.error("❌ Error in connection callback:", e);
            }
        });
    }
}

// ==================== SINGLETON & EXPORTS ====================

export const webSocketService = new WebSocketService();

/**
 * Set access token and reconnect
 */
export const setWebSocketToken = (token: string | null) => {
    webSocketService.setToken(token);
};

/**
 * Set guest token and reconnect
 */
export const setWebSocketGuestToken = (guestToken: string | null) => {
    webSocketService.setGuestToken(guestToken);
};
