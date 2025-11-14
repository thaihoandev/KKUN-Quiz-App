import { useEffect, useState, useCallback } from "react";
import { Spin } from "antd";
import { Link } from "react-router-dom";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import { useAuthStore } from "@/store/authStore";
import {
  getFriendSuggestions,
  sendFriendRequest,
} from "@/services/userService";
import { FriendSuggestion } from "@/types/friends";

type Props = {
  page?: number;
  size?: number;
  className?: string;
};

export default function SuggestionsWidget({ page = 0, size = 6, className = "" }: Props) {
  const profile = useAuthStore((s) => s.user);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [addingSet, setAddingSet] = useState<Set<string>>(new Set());
  const [addedSet, setAddedSet] = useState<Set<string>>(new Set());

  const fetchSuggestions = useCallback(async () => {
    if (!profile?.userId) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await getFriendSuggestions({ page, size });
      setSuggestions(res?.content ?? []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load suggestions");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.userId, page, size]);

  const handleSendRequest = async (targetUserId: string) => {
    if (!profile?.userId) return;
    if (addingSet.has(targetUserId) || addedSet.has(targetUserId)) return;
    setAddingSet((prev) => new Set(prev).add(targetUserId));
    try {
      await sendFriendRequest(targetUserId);
      setAddedSet((prev) => new Set(prev).add(targetUserId));
    } catch {
      // optional toast
    } finally {
      setAddingSet((prev) => {
        const n = new Set(prev);
        n.delete(targetUserId);
        return n;
      });
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  if (!profile?.userId) return null;

  return (
    <div className={`card shadow-sm border-0 rounded-4 mb-4 ${className}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0">People you may know</h6>
          <Link to="/friends" className="btn btn-link btn-sm text-decoration-none p-0">
            See all
          </Link>
        </div>

        {err && <div className="alert alert-danger py-2">{err}</div>}

        {loading ? (
          <div className="d-flex align-items-center gap-2">
            <Spin size="small" />
            <span className="text-muted">Loading suggestions…</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-muted">Không có thông tin</div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {suggestions.map((s) => {
              const isAdding = addingSet.has(s.userId);
              const isAdded = addedSet.has(s.userId);

              const hasProfile = Boolean(s.userId);
              const displayName = s.name || s.username || "Không có thông tin";
              const mutualText =
                typeof s.mutualFriends === "number"
                  ? `${s.mutualFriends} mutual friends`
                  : "Không có thông tin";

              const ItemWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
                hasProfile ? (
                  <Link
                    to={`/profile/${s.userId}`}
                    className="d-flex align-items-center text-decoration-none text-dark flex-grow-1"
                    aria-label={`Xem hồ sơ của ${displayName}`}
                  >
                    {children}
                  </Link>
                ) : (
                  <div className="d-flex align-items-center flex-grow-1">{children}</div>
                );

              return (
                <div key={s.userId || `unknown-${displayName}`} className="d-flex align-items-center">
                  <ItemWrapper>
                    <img
                      src={s.avatar || unknownAvatar}
                      alt={displayName}
                      className="rounded-circle me-3"
                      width={40}
                      height={40}
                      style={{ objectFit: "cover" }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = unknownAvatar;
                      }}
                    />
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{displayName}</div>
                      <small className="text-muted">{mutualText}</small>
                    </div>
                  </ItemWrapper>

                  <button
                    className={`btn btn-sm rounded-pill px-3 ${isAdded ? "btn-success" : "btn-primary"}`}
                    onClick={() => hasProfile && handleSendRequest(s.userId)}
                    disabled={isAdding || isAdded || !hasProfile}
                    aria-disabled={isAdding || isAdded || !hasProfile}
                    aria-label={isAdded ? "Đã gửi lời mời" : "Thêm bạn"}
                    title={!hasProfile ? "Không thể gửi yêu cầu: thiếu thông tin" : undefined}
                  >
                    {isAdded ? "Requested" : isAdding ? "Requesting..." : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
