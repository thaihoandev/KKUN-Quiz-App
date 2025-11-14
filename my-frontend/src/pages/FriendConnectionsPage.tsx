import { useEffect, useState, useCallback } from "react";
import { Tabs, Spin, Empty, Button, message } from "antd";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import { useAuthStore } from "@/store/authStore";
import {
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  getIncomingFriendRequestsPaged,
  getOutgoingFriendRequestsPaged,
} from "@/services/userService";
import SuggestionsWidget from "@/components/widgets/SuggestionsWidget";
import { hydrateRequests } from "@/utils/userHydrator";
import { FriendRequestItem } from "@/types/friends";

/**
 * Trang quản lý kết nối: Incoming & Sent
 * \- Sửa phân trang để dùng đúng PageResponse từ BE (Spring) 
 * \- "Load more" dựa trên trường `last` và `number` thay vì `hasNext`/`page`
 */

export default function FriendConnectionsPage() {
  const profile = useAuthStore((s) => s.user);

  // ---------- Incoming state ----------
  const [incoming, setIncoming] = useState<FriendRequestItem[]>([]);
  const [incomingPage, setIncomingPage] = useState(0);
  const [incomingSize] = useState(10);
  const [incomingHasNext, setIncomingHasNext] = useState(false);
  const [loadingIncoming, setLoadingIncoming] = useState(false);

  // ---------- Outgoing state ----------
  const [outgoing, setOutgoing] = useState<FriendRequestItem[]>([]);
  const [outgoingPage, setOutgoingPage] = useState(0);
  const [outgoingSize] = useState(10);
  const [outgoingHasNext, setOutgoingHasNext] = useState(false);
  const [loadingOutgoing, setLoadingOutgoing] = useState(false);

  // ---------- Loaders (đã sửa tham số & cờ phân trang) ----------
  const loadIncoming = useCallback(
    async (page = 0, append = false) => {
      if (!profile?.userId) return;
      setLoadingIncoming(true);
      try {
        const resp = await getIncomingFriendRequestsPaged({ page, size: incomingSize });
        const raw = Array.isArray(resp.content) ? resp.content : [];
        const content = await hydrateRequests(raw, "incoming");

        setIncoming((prev) => (append ? [...(prev ?? []), ...content] : content));
        setIncomingPage(resp.number ?? page);
        setIncomingHasNext(!resp.last); // còn trang kế tiếp khi chưa phải trang cuối
      } catch (e: any) {
        message.error(e?.message || "Failed to load incoming requests");
        setIncoming((prev) => prev ?? []);
        setIncomingHasNext(false);
      } finally {
        setLoadingIncoming(false);
      }
    },
    [profile?.userId, incomingSize]
  );

  const loadOutgoing = useCallback(
    async (page = 0, append = false) => {
      if (!profile?.userId) return;
      setLoadingOutgoing(true);
      try {
        const resp = await getOutgoingFriendRequestsPaged({ page, size: outgoingSize });
        const raw = Array.isArray(resp.content) ? resp.content : [];
        const content = await hydrateRequests(raw, "outgoing");

        setOutgoing((prev) => (append ? [...(prev ?? []), ...content] : content));
        setOutgoingPage(resp.number ?? page);
        setOutgoingHasNext(!resp.last);
      } catch (e: any) {
        message.error(e?.message || "Failed to load sent requests");
        setOutgoing((prev) => prev ?? []);
        setOutgoingHasNext(false);
      } finally {
        setLoadingOutgoing(false);
      }
    },
    [profile?.userId, outgoingSize]
  );

  // Initial load both
  useEffect(() => {
    // reset danh sách khi user thay đổi
    setIncoming([]);
    setOutgoing([]);
    setIncomingPage(0);
    setOutgoingPage(0);
    setIncomingHasNext(false);
    setOutgoingHasNext(false);

    loadIncoming(0, false);
    loadOutgoing(0, false);
  }, [loadIncoming, loadOutgoing]);

  // ---------- Actions ----------
  const onAccept = async (reqId: string) => {
    try {
      await acceptFriendRequest(reqId);
      setIncoming((prev) => prev.filter((r) => r.id !== reqId));
      message.success("Accepted!");
    } catch (e: any) {
      message.error(e?.message || "Failed to accept request");
    }
  };

  const onDecline = async (reqId: string) => {
    try {
      await declineFriendRequest(reqId);
      setIncoming((prev) => prev.filter((r) => r.id !== reqId));
      message.success("Declined.");
    } catch (e: any) {
      message.error(e?.message || "Failed to decline request");
    }
  };

  const onCancel = async (reqId: string) => {
    try {
      await cancelFriendRequest(reqId);
      setOutgoing((prev) => prev.filter((r) => r.id !== reqId));
      message.success("Canceled.");
    } catch (e: any) {
      message.error(e?.message || "Failed to cancel request");
    }
  };

  // ---------- Renderers ----------
  const IncomingList = () => (
    <>
      {loadingIncoming && incoming.length === 0 ? (
        <div className="d-flex align-items-center gap-2">
          <Spin size="small" />
          <span className="text-muted">Loading incoming…</span>
        </div>
      ) : incoming.length === 0 ? (
        <Empty description="No incoming requests" />
      ) : (
        <>
          <div className="d-flex flex-column gap-3">
            {(incoming ?? []).map((r) => (
              <div key={r.id} className="d-flex align-items-center">
                <img
                  src={r.requesterAvatar || unknownAvatar}
                  alt={r.requesterName}
                  width={44}
                  height={44}
                  className="rounded-circle me-3"
                  style={{ objectFit: "cover" }}
                />
                <div className="flex-grow-1">
                  <div className="fw-semibold">
                    {r.requesterName || r.requesterUsername || "Unknown"}
                  </div>
                  <small className="text-muted">Requested you</small>
                </div>
                <div className="d-flex gap-2">
                  <Button size="small" type="primary" onClick={() => onAccept(r.id)}>
                    Accept
                  </Button>
                  <Button size="small" danger onClick={() => onDecline(r.id)}>
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Load more */}
          <div className="text-center mt-3">
            <Button
              onClick={() => loadIncoming(incomingPage + 1, true)}
              disabled={!incomingHasNext || loadingIncoming}
            >
              {loadingIncoming ? "Loading..." : incomingHasNext ? "Load more" : "No more"}
            </Button>
          </div>
        </>
      )}
    </>
  );

  const OutgoingList = () => (
    <>
      {loadingOutgoing && outgoing.length === 0 ? (
        <div className="d-flex align-items-center gap-2">
          <Spin size="small" />
          <span className="text-muted">Loading sent…</span>
        </div>
      ) : outgoing.length === 0 ? (
        <Empty description="No sent requests" />
      ) : (
        <>
          <div className="d-flex flex-column gap-3">
            {(outgoing ?? []).map((r) => (
              <div key={r.id} className="d-flex align-items-center">
                <img
                  src={r.receiverAvatar || unknownAvatar}
                  alt={r.receiverName}
                  width={44}
                  height={44}
                  className="rounded-circle me-3"
                  style={{ objectFit: "cover" }}
                />
                <div className="flex-grow-1">
                  <div className="fw-semibold">
                    {r.receiverName || r.receiverUsername || "Unknown"}
                  </div>
                  <small className="text-muted">You sent a request</small>
                </div>
                <Button size="small" onClick={() => onCancel(r.id)}>
                  Cancel
                </Button>
              </div>
            ))}
          </div>

          {/* Load more */}
          <div className="text-center mt-3">
            <Button
              onClick={() => loadOutgoing(outgoingPage + 1, true)}
              disabled={!outgoingHasNext || loadingOutgoing}
            >
              {loadingOutgoing ? "Loading..." : outgoingHasNext ? "Load more" : "No more"}
            </Button>
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <h4 className="fw-bold mb-3">Manage connections</h4>

              <Tabs
                defaultActiveKey="incoming"
                items={[
                  {
                    key: "incoming",
                    label: `Incoming (${incoming?.length ?? 0})`,
                    children: <IncomingList />,
                  },
                  {
                    key: "outgoing",
                    label: `Sent (${outgoing?.length ?? 0})`,
                    children: <OutgoingList />,
                  },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <SuggestionsWidget />
        </div>
      </div>
    </div>
  );
}
