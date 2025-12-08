// src/services/WebSocketService.ts
import * as StompJs from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { NotificationDTO } from "@/services/notificationService";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import { buildNotificationText } from "@/utils/notificationText";

// ==================== TYPES ====================

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    time: string;
    avatar?: string;
}

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

export interface GameDetailUpdate {
    gameId: string;
    status: string;
    playerCount: number;
    activePlayerCount: number;
    currentQuestionIndex: number;
    totalQuestions: number;
    [key: string]: any;
}

export interface QuestionUpdate {
    questionId: string;
    questionNumber: number;
    totalQuestions: number;
    timeLimit: number;
    question: any;
}

export interface LeaderboardUpdate {
    entries: any[];
    timestamp: string;
}

export interface ParticipantUpdate {
    participantId: string;
    nickname: string;
    status: string;
    score?: number;
    playerCount?: number;
}

export interface KickNotification {
    kicked: boolean;
    reason: string;
    participantId?: string;
    nickname?: string;
}

// Callback types
type NotificationCallback = (notification: AppNotification) => void;
type GameEventCallback = (event: GameEventPayload) => void;
type AnswerResultCallback = (result: any) => void;
type LeaderboardCallback = (leaderboard: any[]) => void;
type ParticipantsCallback = (participants: any[]) => void;
type GameDetailsCallback = (details: GameDetailUpdate) => void;
type QuestionCallback = (question: QuestionUpdate) => void;
type KickCallback = (notification: KickNotification) => void;
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

const maskToken = (t?: string | null) =>
    t ? `${t.slice(0, 8)}…${t.slice(-6)}` : "(none)";

// ==================== MAIN SERVICE ====================

export class WebSocketService {
    private client: StompJs.Client | null = null;
    private accessToken: string | null = null;
    private isConnected = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    // Subscriptions mapping
    private subs = {
        notifications: null as StompJs.StompSubscription | null,
        gameRoom: new Map<string, StompJs.StompSubscription>(),
        gameTopic: new Map<string, StompJs.StompSubscription>(), // /topic/game/{gameId}/*
        userQueue: {
            answerResult: null as StompJs.StompSubscription | null,
            skipAck: null as StompJs.StompSubscription | null,
            leaderboard: null as StompJs.StompSubscription | null,
            gameDetails: null as StompJs.StompSubscription | null,
            participants: null as StompJs.StompSubscription | null,
            question: null as StompJs.StompSubscription | null,
            kicked: null as StompJs.StompSubscription | null,
            errors: null as StompJs.StompSubscription | null,
            gameUpdates: null as StompJs.StompSubscription | null,
        },
    };

    // Callbacks registry
    private callbacks = {
        notification: [] as NotificationCallback[],
        gameEvent: [] as GameEventCallback[],
        answerResult: [] as AnswerResultCallback[],
        leaderboard: [] as LeaderboardCallback[],
        participants: [] as ParticipantsCallback[],
        gameDetails: [] as GameDetailsCallback[],
        question: [] as QuestionCallback[],
        kicked: [] as KickCallback[],
        error: [] as ErrorCallback[],
        connection: [] as ConnectionCallback[],
    };

    constructor(accessToken: string | null = null) {
        this.accessToken = accessToken;
        log.info(
            "WebSocketService initialized. Token:",
            maskToken(accessToken)
        );
        this.connect();
    }

    // ==================== CONNECTION ====================

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
            connectHeaders: this.accessToken
                ? { Authorization: `Bearer ${this.accessToken}` }
                : {},
            debug: (str) => DEBUG && console.debug("[STOMP]", str),
        });

        this.client.onConnect = () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            log.info("STOMP connected successfully");
            this.emitConnectionChange(true);
            this.resubscribeAll();
        };

        this.client.onStompError = (frame) => {
            log.error("STOMP Error:", frame.headers["message"], frame.body);
        };

        this.client.onWebSocketClose = () => {
            this.isConnected = false;
            log.warn("WebSocket closed");
            this.emitConnectionChange(false);
        };

        this.client.onWebSocketError = (evt) => {
            log.warn("WebSocket error:", evt);
        };

        this.client.activate();
    }

    private resubscribeAll() {
        log.debug("Resubscribing to all channels...");
        this.subscribeToNotifications();
        this.subscribeToUserQueues();
    }

    public setToken(token: string | null) {
        if (token === this.accessToken) return;

        log.info("Token changed → reconnecting...", maskToken(token));
        this.accessToken = token;

        if (this.client) {
            this.client.deactivate().finally(() => this.connect());
        } else {
            this.connect();
        }
    }

    public disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.isConnected = false;
            log.info("WebSocket disconnected manually");
            this.emitConnectionChange(false);
        }
    }

    public isWebSocketConnected(): boolean {
        return this.isConnected;
    }

    // ==================== GAME ROOM MANAGEMENT ====================

    /**
     * Join một game room - subscribe tới /topic/game/{gameId}
     * Nhận tất cả game events cho room này
     */
    public joinGameRoom(gameId: string) {
        if (!this.client?.connected) {
            log.warn("Cannot join game room – not connected");
            return;
        }

        if (this.subs.gameRoom.has(gameId)) {
            log.debug(`Already joined game room: ${gameId}`);
            return;
        }

        const destination = `/topic/game/${gameId}`;
        const sub = this.client.subscribe(destination, (msg) => {
            try {
                const event: GameEventPayload = JSON.parse(msg.body);
                log.debug("Game event:", event.eventType, gameId);
                this.emitGameEvent(event);
            } catch (e) {
                log.error("Failed to parse game event:", e, msg.body);
            }
        });

        this.subs.gameRoom.set(gameId, sub);
        log.info(`Joined game room: ${destination}`);
    }

    /**
     * Leave game room - unsubscribe từ /topic/game/{gameId}
     */
    public leaveGameRoom(gameId: string) {
        const sub = this.subs.gameRoom.get(gameId);
        if (sub) {
            sub.unsubscribe();
            this.subs.gameRoom.delete(gameId);
            log.info(`Left game room: /topic/game/${gameId}`);
        }
    }

    /**
     * Subscribe tới game detail updates - /topic/game/{gameId}/details
     */
    public subscribeToGameDetails(gameId: string) {
        if (!this.client?.connected) return;

        const destination = `/topic/game/${gameId}/details`;
        const sub = this.client.subscribe(destination, (msg) => {
            try {
                const details: GameDetailUpdate = JSON.parse(msg.body);
                this.emitGameDetails(details);
            } catch (e) {
                log.error("Failed to parse game details:", e);
            }
        });

        this.subs.gameTopic.set(destination, sub);
        log.info(`Subscribed to: ${destination}`);
    }
    public subscribeToGameStarted(gameId: string) {
        if (!this.client?.connected) return;
        const dest = `/topic/game/${gameId}/started`;
        const sub = this.client.subscribe(dest, () => {
            this.emitGameEvent({
                gameId,
                eventType: "GAME_STARTED",
                timestamp: new Date().toISOString(),
            });
        });
        this.subs.gameTopic.set(dest, sub);
    }
    /**
     * Subscribe tới question updates - /topic/game/{gameId}/question
     */
    public subscribeToQuestions(gameId: string) {
        if (!this.client?.connected) return;

        const destination = `/topic/game/${gameId}/question`;
        const sub = this.client.subscribe(destination, (msg) => {
            try {
                const question: QuestionUpdate = JSON.parse(msg.body);
                this.emitQuestion(question);
            } catch (e) {
                log.error("Failed to parse question:", e);
            }
        });

        this.subs.gameTopic.set(destination, sub);
        log.info(`Subscribed to: ${destination}`);
    }

    /**
     * Subscribe tới real-time leaderboard updates - /topic/game/{gameId}/leaderboard
     */
    public subscribeToLeaderboard(gameId: string) {
        if (!this.client?.connected) return;

        const destination = `/topic/game/${gameId}/leaderboard`;
        const sub = this.client.subscribe(destination, (msg) => {
            try {
                const leaderboard = JSON.parse(msg.body);
                this.emitLeaderboard(leaderboard);
            } catch (e) {
                log.error("Failed to parse leaderboard:", e);
            }
        });

        this.subs.gameTopic.set(destination, sub);
        log.info(`Subscribed to: ${destination}`);
    }

    /**
     * Subscribe tới kicked notifications - /topic/game/{gameId}/kick/{participantId}
     */
    public subscribeToKickNotifications(gameId: string, participantId: string) {
        if (!this.client?.connected) return;

        const destination = `/topic/game/${gameId}/kick/${participantId}`;
        const sub = this.client.subscribe(destination, (msg) => {
            try {
                const notification: KickNotification = JSON.parse(msg.body);
                this.emitKick(notification);
            } catch (e) {
                log.error("Failed to parse kick notification:", e);
            }
        });

        this.subs.gameTopic.set(destination, sub);
        log.info(`Subscribed to: ${destination}`);
    }

    /**
     * Unsubscribe từ tất cả game-related topics
     */
    public unsubscribeFromAllGameTopics(gameId: string) {
        const prefix = `/topic/game/${gameId}`;
        for (const [dest, sub] of this.subs.gameTopic) {
            if (dest.startsWith(prefix)) {
                sub.unsubscribe();
                this.subs.gameTopic.delete(dest);
                log.info(`Unsubscribed from: ${dest}`);
            }
        }
    }

    // ==================== USER PRIVATE QUEUES ====================

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
                    log.error("Failed to parse notification:", e, msg.body);
                }
            }
        );
        log.info("Subscribed to /user/queue/notifications");
    }

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
                    this.emitAnswerResult(data);
                } catch (e) {
                    log.error("Failed to parse answer result:", e);
                }
            }
        );

        // Skip acknowledgment
        this.subs.userQueue.skipAck = sub("/queue/skip-ack", (msg) => {
            log.debug("Skip acknowledged:", msg.body);
        });

        // Leaderboard
        this.subs.userQueue.leaderboard = sub("/queue/leaderboard", (msg) => {
            try {
                const data = JSON.parse(msg.body);
                this.emitLeaderboard(data);
            } catch (e) {
                log.error("Failed to parse leaderboard:", e);
            }
        });

        // Game details
        this.subs.userQueue.gameDetails = sub("/queue/game-details", (msg) => {
            try {
                const data = JSON.parse(msg.body);
                this.emitGameDetails(data);
            } catch (e) {
                log.error("Failed to parse game details:", e);
            }
        });

        // Participants
        this.subs.userQueue.participants = sub("/queue/participants", (msg) => {
            try {
                const data = JSON.parse(msg.body);
                this.emitParticipants(data);
            } catch (e) {
                log.error("Failed to parse participants:", e);
            }
        });

        // Question
        this.subs.userQueue.question = sub("/queue/question", (msg) => {
            try {
                const data = JSON.parse(msg.body);
                this.emitQuestion(data);
            } catch (e) {
                log.error("Failed to parse question:", e);
            }
        });

        // Kicked
        this.subs.userQueue.kicked = sub("/queue/kicked", (msg) => {
            try {
                const data = JSON.parse(msg.body);
                this.emitKick(data);
            } catch (e) {
                log.error("Failed to parse kick:", e);
            }
        });

        // Errors
        this.subs.userQueue.errors = sub("/queue/errors", (msg) => {
            try {
                const err = JSON.parse(msg.body);
                const errorData = {
                    error: err.error || err.message || "Có lỗi xảy ra",
                    type: err.type || "UNKNOWN_ERROR",
                };
                this.emitError(errorData);

                // Also emit as notification
                const noti: AppNotification = {
                    id: Date.now().toString(),
                    title: "Lỗi từ server",
                    message: errorData.error,
                    time: new Date().toLocaleString(),
                };
                this.emitNotification(noti);
            } catch (e) {
                log.error("Failed to parse error message:", e);
            }
        });

        // Game updates (generic)
        this.subs.userQueue.gameUpdates = sub("/queue/game-updates", (msg) => {
            try {
                const data = JSON.parse(msg.body);
                log.debug("Game update received:", data);
                // Can be any game-related update
                this.emitGameEvent(data);
            } catch (e) {
                log.error("Failed to parse game update:", e);
            }
        });

        log.info("Subscribed to all user private queues");
    }

    // ==================== SEND MESSAGES ====================

    /**
     * Submit answer via WebSocket
     */
    public submitAnswer(gameId: string, participantId: string, answer: any) {
        this.send(
            `/app/game/${gameId}/answer`,
            { submittedAnswer: answer, submittedAt: new Date().toISOString() },
            { participantId }
        );
    }

    /**
     * Skip question via WebSocket
     */
    public skipQuestion(gameId: string, participantId: string) {
        this.send(`/app/game/${gameId}/skip`, {}, { participantId });
    }

    /**
     * Send heartbeat to keep connection alive
     */
    public sendHeartbeat(gameId: string, participantId: string) {
        this.send(`/app/game/${gameId}/heartbeat`, {}, { participantId });
    }

    /**
     * Request leaderboard update
     */
    public requestLeaderboard(gameId: string) {
        this.send(`/app/game/${gameId}/leaderboard`, {});
    }

    /**
     * Request participants list
     */
    public requestParticipants(gameId: string) {
        this.send(`/app/game/${gameId}/participants`, {});
    }

    /**
     * Request game details
     */
    public requestGameDetails(gameId: string) {
        this.send(`/app/game/${gameId}/details`, {});
    }

    /**
     * Request game statistics
     */
    public requestGameStatistics(gameId: string) {
        this.send(`/app/game/${gameId}/statistics`, {});
    }

    /**
     * Request final leaderboard
     */
    public requestFinalLeaderboard(gameId: string) {
        this.send(`/app/game/${gameId}/final-leaderboard`, {});
    }

    /**
     * Generic send method
     */
    private send(
        destination: string,
        body: any = {},
        headers: Record<string, string> = {}
    ) {
        if (!this.client?.connected) {
            log.warn("Cannot send – WebSocket not connected:", destination);
            return;
        }

        try {
            this.client.publish({
                destination,
                body: JSON.stringify(body),
                headers,
            });
            log.debug("Message sent to:", destination);
        } catch (e) {
            log.error("Failed to send message:", e);
        }
    }

    // ==================== CALLBACKS MANAGEMENT ====================

    // Notifications
    public onNotification(cb: NotificationCallback) {
        this.callbacks.notification.push(cb);
        return () => this.offNotification(cb);
    }
    public offNotification(cb: NotificationCallback) {
        this.callbacks.notification = this.callbacks.notification.filter(
            (c) => c !== cb
        );
    }

    // Game Events
    public onGameEvent(cb: GameEventCallback) {
        this.callbacks.gameEvent.push(cb);
        return () => this.offGameEvent(cb);
    }
    public offGameEvent(cb: GameEventCallback) {
        this.callbacks.gameEvent = this.callbacks.gameEvent.filter(
            (c) => c !== cb
        );
    }

    // Answer Results
    public onAnswerResult(cb: AnswerResultCallback) {
        this.callbacks.answerResult.push(cb);
        return () => this.offAnswerResult(cb);
    }
    public offAnswerResult(cb: AnswerResultCallback) {
        this.callbacks.answerResult = this.callbacks.answerResult.filter(
            (c) => c !== cb
        );
    }

    // Leaderboard
    public onLeaderboard(cb: LeaderboardCallback) {
        this.callbacks.leaderboard.push(cb);
        return () => this.offLeaderboard(cb);
    }
    public offLeaderboard(cb: LeaderboardCallback) {
        this.callbacks.leaderboard = this.callbacks.leaderboard.filter(
            (c) => c !== cb
        );
    }

    // Participants
    public onParticipants(cb: ParticipantsCallback) {
        this.callbacks.participants.push(cb);
        return () => this.offParticipants(cb);
    }
    public offParticipants(cb: ParticipantsCallback) {
        this.callbacks.participants = this.callbacks.participants.filter(
            (c) => c !== cb
        );
    }

    // Game Details
    public onGameDetails(cb: GameDetailsCallback) {
        this.callbacks.gameDetails.push(cb);
        return () => this.offGameDetails(cb);
    }
    public offGameDetails(cb: GameDetailsCallback) {
        this.callbacks.gameDetails = this.callbacks.gameDetails.filter(
            (c) => c !== cb
        );
    }

    // Questions
    public onQuestion(cb: QuestionCallback) {
        this.callbacks.question.push(cb);
        return () => this.offQuestion(cb);
    }
    public offQuestion(cb: QuestionCallback) {
        this.callbacks.question = this.callbacks.question.filter(
            (c) => c !== cb
        );
    }

    // Kicked
    public onKicked(cb: KickCallback) {
        this.callbacks.kicked.push(cb);
        return () => this.offKicked(cb);
    }
    public offKicked(cb: KickCallback) {
        this.callbacks.kicked = this.callbacks.kicked.filter((c) => c !== cb);
    }

    // Errors
    public onError(cb: ErrorCallback) {
        this.callbacks.error.push(cb);
        return () => this.offError(cb);
    }
    public offError(cb: ErrorCallback) {
        this.callbacks.error = this.callbacks.error.filter((c) => c !== cb);
    }

    // Connection changes
    public onConnectionChange(cb: ConnectionCallback) {
        this.callbacks.connection.push(cb);
        return () => this.offConnectionChange(cb);
    }
    public offConnectionChange(cb: ConnectionCallback) {
        this.callbacks.connection = this.callbacks.connection.filter(
            (c) => c !== cb
        );
    }

    // ==================== EMIT METHODS ====================

    private emitNotification(notification: AppNotification) {
        this.callbacks.notification.forEach((cb) => {
            try {
                cb(notification);
            } catch (e) {
                log.error("Error in notification callback:", e);
            }
        });
    }

    private emitGameEvent(event: GameEventPayload) {
        this.callbacks.gameEvent.forEach((cb) => {
            try {
                cb(event);
            } catch (e) {
                log.error("Error in gameEvent callback:", e);
            }
        });
    }

    private emitAnswerResult(result: any) {
        this.callbacks.answerResult.forEach((cb) => {
            try {
                cb(result);
            } catch (e) {
                log.error("Error in answerResult callback:", e);
            }
        });
    }

    private emitLeaderboard(leaderboard: any[]) {
        this.callbacks.leaderboard.forEach((cb) => {
            try {
                cb(leaderboard);
            } catch (e) {
                log.error("Error in leaderboard callback:", e);
            }
        });
    }

    private emitParticipants(participants: any[]) {
        this.callbacks.participants.forEach((cb) => {
            try {
                cb(participants);
            } catch (e) {
                log.error("Error in participants callback:", e);
            }
        });
    }

    private emitGameDetails(details: GameDetailUpdate) {
        this.callbacks.gameDetails.forEach((cb) => {
            try {
                cb(details);
            } catch (e) {
                log.error("Error in gameDetails callback:", e);
            }
        });
    }

    private emitQuestion(question: QuestionUpdate) {
        this.callbacks.question.forEach((cb) => {
            try {
                cb(question);
            } catch (e) {
                log.error("Error in question callback:", e);
            }
        });
    }

    private emitKick(notification: KickNotification) {
        this.callbacks.kicked.forEach((cb) => {
            try {
                cb(notification);
            } catch (e) {
                log.error("Error in kicked callback:", e);
            }
        });
    }

    private emitError(error: { error: string; type: string }) {
        this.callbacks.error.forEach((cb) => {
            try {
                cb(error);
            } catch (e) {
                log.error("Error in error callback:", e);
            }
        });
    }

    private emitConnectionChange(connected: boolean) {
        this.callbacks.connection.forEach((cb) => {
            try {
                cb(connected);
            } catch (e) {
                log.error("Error in connection callback:", e);
            }
        });
    }
}

// ==================== SINGLETON ====================

export const webSocketService = new WebSocketService();

export const setWebSocketToken = (token: string | null) => {
    webSocketService.setToken(token);
};
