import { getUserById } from "@/services/userService";
import { FriendRequestItem } from "@/types/friends";

const userDetailsCache = new Map<string, any>();
// ---------- Fetchers ----------
const getUserSafe = async (userId?: string) => {
    if (!userId) return undefined;
    if (userDetailsCache.has(userId)) return userDetailsCache.get(userId);
    try {
        const u = await getUserById(userId);
        userDetailsCache.set(userId, u);
        return u;
    } catch {
        return undefined;
    }
};

export type ListKind = "incoming" | "outgoing";
export const hydrateRequests = async (items: FriendRequestItem[], kind: ListKind) => {
    const ids = new Set(
        items
        .map((r) => (kind === "incoming" ? r.requesterId : r.receiverId))
        .filter(Boolean) as string[]
    );
    const entries = await Promise.all(
        Array.from(ids).map(async (id) => {
        const u = await getUserSafe(id);
        return [id, u] as const;
        })
    );
    const byId = new Map(entries);

    return items.map((r) => {
        if (kind === "incoming") {
        const u = byId.get(r.requesterId!);
        return {
            ...r,
            requesterName: r.requesterName ?? u?.name ?? r.requesterUsername,
            requesterUsername: r.requesterUsername ?? u?.username,
            requesterAvatar: r.requesterAvatar ?? u?.avatar,
        };
        } else {
        const u = byId.get(r.receiverId!);
        return {
            ...r,
            receiverName: r.receiverName ?? u?.name ?? r.receiverUsername,
            receiverUsername: r.receiverUsername ?? u?.username,
            receiverAvatar: r.receiverAvatar ?? u?.avatar,
        };
        }
    });
};