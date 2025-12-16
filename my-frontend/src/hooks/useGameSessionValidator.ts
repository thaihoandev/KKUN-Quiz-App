// src/hooks/useGameSessionValidator.ts
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { getGameDetails, getParticipants } from "@/services/gameService";
import type { GameDetailDTO, GameParticipantDTO } from "@/types/game";

interface SessionValidationResult {
    isValid: boolean;
    error: string | null;
    gameInfo: GameDetailDTO | null;
    participants: GameParticipantDTO[];
    participantId: string;
    pinCode: string;
    isAnonymous: boolean;
}

/**
 * ✅ Validate game session for WaitingRoom
 *
 * Main checks:
 * 1. gameId, participantId, pinCode exist in localStorage
 * 2. Game exists and not ended/cancelled
 * 3. If NOT host: participant must be in game
 * 4. If IS host: skip participant check (host identified by isHost flag)
 */
export const useGameSessionValidator = (gameId: string | undefined) => {
    const navigate = useNavigate();
    const { accessToken, user } = useAuthStore();

    const [state, setState] = useState<SessionValidationResult>({
        isValid: false,
        error: null,
        gameInfo: null,
        participants: [],
        participantId: "",
        pinCode: "",
        isAnonymous: false,
    });

    const [isValidating, setIsValidating] = useState(true);

    useEffect(() => {
        const validateSession = async () => {
            setIsValidating(true);
            console.log("🔄 [Validator] Starting session validation...");

            try {
                // ===== CHECK 1: GameId from route =====
                if (!gameId) {
                    console.error("❌ Check 1: No gameId in route");
                    setState((prev) => ({
                        ...prev,
                        isValid: false,
                        error: "Invalid game ID",
                    }));
                    setIsValidating(false);
                    setTimeout(
                        () => navigate("/join-game", { replace: true }),
                        1000
                    );
                    return;
                }

                // ===== CHECK 2: ParticipantId from localStorage =====
                const participantId = localStorage.getItem("participantId");
                if (!participantId) {
                    console.error(
                        "❌ Check 2: No participantId in localStorage"
                    );
                    setState((prev) => ({
                        ...prev,
                        isValid: false,
                        error: "Participant session not found. Please join a game first.",
                    }));
                    setIsValidating(false);
                    setTimeout(
                        () => navigate("/join-game", { replace: true }),
                        1000
                    );
                    return;
                }

                // ===== CHECK 3: GameId from localStorage =====
                const storedGameId = localStorage.getItem("gameId");
                if (!storedGameId || storedGameId !== gameId) {
                    console.error("❌ Check 3: GameId mismatch", {
                        route: gameId,
                        storage: storedGameId,
                    });
                    setState((prev) => ({
                        ...prev,
                        isValid: false,
                        error: "Game session mismatch. Please join the game again.",
                    }));
                    localStorage.removeItem("participantId");
                    localStorage.removeItem("gameId");
                    localStorage.removeItem("currentPinCode");
                    setIsValidating(false);
                    setTimeout(
                        () => navigate("/join-game", { replace: true }),
                        1000
                    );
                    return;
                }

                // ===== CHECK 4: PinCode from localStorage =====
                const pinCode = localStorage.getItem("currentPinCode");
                if (!pinCode) {
                    console.error("❌ Check 4: No pinCode in localStorage");
                    setState((prev) => ({
                        ...prev,
                        isValid: false,
                        error: "Room code not found.",
                    }));
                    setIsValidating(false);
                    setTimeout(
                        () => navigate("/join-game", { replace: true }),
                        1000
                    );
                    return;
                }

                // ===== CHECK 5: isAnonymous flag =====
                const isAnonymousStr = localStorage.getItem("isAnonymous");
                const isAnonymous = isAnonymousStr === "true";

                // ===== CHECK 6: Load game info =====
                console.log("🔄 [Validator] Loading game details...");
                const gameInfo = await getGameDetails(gameId);

                if (!gameInfo || !gameInfo.gameId) {
                    console.error("❌ Check 5: Game not found");
                    setState((prev) => ({
                        ...prev,
                        isValid: false,
                        error: "Game not found. It may have been deleted.",
                    }));
                    localStorage.removeItem("participantId");
                    localStorage.removeItem("gameId");
                    localStorage.removeItem("currentPinCode");
                    setIsValidating(false);
                    setTimeout(
                        () => navigate("/join-game", { replace: true }),
                        1000
                    );
                    return;
                }

                // ===== CHECK 7: Game status =====
                console.log("📊 [Validator] Game status:", gameInfo.gameStatus);
                if (
                    gameInfo.gameStatus === "FINISHED" ||
                    gameInfo.gameStatus === "CANCELLED" ||
                    gameInfo.gameStatus === "EXPIRED"
                ) {
                    console.error(
                        "❌ Check 6: Game already ended",
                        gameInfo.gameStatus
                    );
                    setState((prev) => ({
                        ...prev,
                        isValid: false,
                        error: `Game has ${gameInfo.gameStatus.toLowerCase()}.`,
                    }));
                    localStorage.removeItem("participantId");
                    localStorage.removeItem("gameId");
                    localStorage.removeItem("currentPinCode");
                    setIsValidating(false);
                    setTimeout(() => navigate("/", { replace: true }), 1000);
                    return;
                }

                // ===== CHECK 8: If game started, redirect to game-play =====
                if (gameInfo.gameStatus === "IN_PROGRESS") {
                    console.log(
                        "⏭️ [Validator] Game already started, redirecting to game-play"
                    );
                    setIsValidating(false);
                    setTimeout(
                        () =>
                            navigate(`/game-play/${gameId}`, { replace: true }),
                        500
                    );
                    return;
                }

                // ===== CHECK 9: Load participants =====
                console.log("🔄 [Validator] Loading participants...");
                const participantsList = await getParticipants(gameId);

                console.log("📊 [Validator] Participants loaded:", {
                    count: participantsList?.length || 0,
                    ids: participantsList?.map((p) => p.participantId) || [],
                    nicknames: participantsList?.map((p) => p.nickname) || [],
                });

                // ===== CHECK 10: CRITICAL - Check if HOST or PARTICIPANT =====
                console.log("🔍 [Validator] Checking user type:", {
                    isHost: gameInfo.isHost,
                    participantId: participantId,
                });

                if (gameInfo.isHost) {
                    // ✅ HOST: Skip participant check
                    console.log(
                        "✅ Check 7 (HOST BYPASS): User is host, allowing access"
                    );
                    console.log("📊 [Validator] Host info:", {
                        isHost: gameInfo.isHost,
                        hostUserId: gameInfo.host?.userId,
                        hostNickname: gameInfo.host?.nickname,
                        playerCount: gameInfo.playerCount,
                    });
                    // Continue - no participant check needed for host
                } else {
                    // ❌ PARTICIPANT: Must be in participants list
                    console.log(
                        "🔍 [Validator] User is participant, checking in list..."
                    );

                    const currentParticipant = participantsList?.find(
                        (p) => p.participantId === participantId
                    );

                    console.log("🔍 [Validator] Participant search result:", {
                        looking_for: participantId,
                        found: !!currentParticipant,
                        total: participantsList?.length || 0,
                    });

                    if (!currentParticipant) {
                        console.error(
                            "❌ Check 7: Participant not found in game"
                        );
                        setState((prev) => ({
                            ...prev,
                            isValid: false,
                            error: "You are no longer in this game. You may have been kicked.",
                        }));
                        localStorage.removeItem("participantId");
                        localStorage.removeItem("gameId");
                        localStorage.removeItem("currentPinCode");
                        setIsValidating(false);
                        setTimeout(
                            () => navigate("/join-game", { replace: true }),
                            1000
                        );
                        return;
                    }

                    console.log("✅ Check 7: Participant found in game");
                }

                // ===== ALL CHECKS PASSED ✅ =====
                console.log("✅ [Validator] All validation checks passed!");
                setState({
                    isValid: true,
                    error: null,
                    gameInfo,
                    participants: participantsList || [],
                    participantId,
                    pinCode,
                    isAnonymous,
                });
            } catch (err: any) {
                console.error("❌ [Validator] Validation error:", err);
                setState((prev) => ({
                    ...prev,
                    isValid: false,
                    error:
                        err.response?.data?.message ||
                        "Failed to validate session",
                }));
                setIsValidating(false);
                setTimeout(
                    () => navigate("/join-game", { replace: true }),
                    1000
                );
            } finally {
                setIsValidating(false);
            }
        };

        validateSession();
    }, [gameId, navigate, accessToken, user]);

    return {
        ...state,
        isValidating,
    };
};
