// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/axiosInstance";

// ==================== PROTECTED ROUTE ====================

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    accessToken,
    user,
    setAccessToken,
    setUser,
    hasInitialized,
    setInitialized,
  } = useAuthStore();

  const [checking, setChecking] = React.useState(!hasInitialized);
  const location = useLocation();

  React.useEffect(() => {
    const initSession = async () => {
      if (hasInitialized) {
        console.log("✅ [ProtectedRoute] Already initialized, skipping check");
        setChecking(false);
        return;
      }

      console.log("🔄 [ProtectedRoute] Initializing session...");
      setChecking(true);

      try {
        let token = accessToken;

        if (!token) {
          console.log("⏳ [ProtectedRoute] No accessToken, trying refresh...");
          try {
            const refreshResp = await api.post("/auth/refresh-token");
            token = refreshResp.data.accessToken;
            setAccessToken(token);
            console.log("✅ [ProtectedRoute] Token refreshed successfully");
          } catch (refreshErr) {
            console.warn(
              "⚠️ [ProtectedRoute] Refresh token failed:",
              refreshErr
            );
            token = null;
          }
        } else {
          console.log("✅ [ProtectedRoute] accessToken already available");
        }

        if (token) {
          try {
            console.log("📥 [ProtectedRoute] Loading user info...");
            const meResp = await api.get("/users/me");
            const userData = meResp.data;

            console.log("✅ [ProtectedRoute] User loaded:", {
              userId: userData.userId,
              username: userData.username,
            });

            setUser(userData);
            setAccessToken(token);
          } catch (meErr: any) {
            console.error(
              "❌ [ProtectedRoute] Failed to load user:",
              meErr.response?.status
            );

            if (meErr.response?.status === 401) {
              console.warn(
                "⚠️ [ProtectedRoute] Token is invalid (401), clearing session"
              );
              setAccessToken(null);
              setUser(null);
            }
          }
        } else {
          console.log("⚠️ [ProtectedRoute] No valid token available");
          setAccessToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error("❌ [ProtectedRoute] Unexpected error:", err);
        setAccessToken(null);
        setUser(null);
      } finally {
        console.log("✅ [ProtectedRoute] Initialization complete");
        setInitialized();
        setChecking(false);
      }
    };

    initSession();
  }, [hasInitialized, accessToken, setAccessToken, setUser, setInitialized]);

  if (checking) {
    return (
      <div
        className="vh-100 d-flex justify-content-center align-items-center"
        style={{ background: "var(--bg-color)" }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "1rem",
              animation: "spin 1s linear infinite",
            }}
          >
            <i className="bx bx-loader"></i>
          </div>
          <p style={{ color: "var(--text-muted)" }}>
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    console.warn(
      "⚠️ [ProtectedRoute] No accessToken, redirecting to login from",
      location.pathname
    );
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  console.log("✅ [ProtectedRoute] User authenticated, rendering protected content");
  return <>{children}</>;
};

// ==================== GAME ROOM GUARD ====================

/**
 * ✅ GameRoomGuard Component
 * 
 * Used for: /game-session/:gameId
 * 
 * Validates:
 * - participantId exists
 * - gameId exists
 * - currentPinCode exists
 * 
 * If invalid → clean session + redirect /join-game
 */
export const GameRoomGuard = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const participantId = localStorage.getItem("participantId");
  const gameId = localStorage.getItem("gameId");
  const currentPinCode = localStorage.getItem("currentPinCode");

  const isValidSession = participantId && gameId && currentPinCode;

  if (!isValidSession) {
    console.error(
      "❌ [GameRoomGuard] Invalid session data:",
      {
        participantId: !!participantId,
        gameId: !!gameId,
        currentPinCode: !!currentPinCode,
      }
    );

    // Clean up incomplete session
    localStorage.removeItem("participantId");
    localStorage.removeItem("gameId");
    localStorage.removeItem("currentPinCode");
    localStorage.removeItem("isAnonymous");
    localStorage.removeItem("guestToken");

    console.log("🧹 [GameRoomGuard] Cleaned up incomplete session");
    return <Navigate to="/join-game" replace />;
  }

  console.log("✅ [GameRoomGuard] Session valid, allowing access to waiting room");
  return <>{children}</>;
};

// ==================== GAME PLAY GUARD ====================

/**
 * ✅ GamePlayGuard Component
 * 
 * Used for: /game-play/:gameId
 * 
 * Validates:
 * - participantId exists
 * - gameId exists
 * 
 * If invalid → clean session + redirect /join-game
 */
export const GamePlayGuard = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const participantId = localStorage.getItem("participantId");
  const gameId = localStorage.getItem("gameId");

  const isValidGameSession = participantId && gameId;

  if (!isValidGameSession) {
    console.error(
      "❌ [GamePlayGuard] Invalid game session:",
      {
        participantId: !!participantId,
        gameId: !!gameId,
      }
    );

    // Clean up incomplete session
    localStorage.removeItem("participantId");
    localStorage.removeItem("gameId");
    localStorage.removeItem("currentPinCode");
    localStorage.removeItem("isAnonymous");
    localStorage.removeItem("guestToken");

    console.log("🧹 [GamePlayGuard] Cleaned up incomplete session");
    return <Navigate to="/join-game" replace />;
  }

  console.log("✅ [GamePlayGuard] Session valid, allowing access to game play");
  return <>{children}</>;
};

// ==================== EXPORT DEFAULT ====================

export default ProtectedRoute;