import { useEffect, useRef, useState, useCallback } from "react";
import { PageResponse, UserResponseDTO } from "@/interfaces";
import { getPublicPosts, getUserPosts, PostDTO } from "@/services/postService";
import PostCard from "./PostCard";

type Props = {
  profile: UserResponseDTO | null;
  currentUser?: UserResponseDTO | null; 
  className?: string;
  onUpdate: (updatedPost: PostDTO) => void; // nhận từ ViewProfileTab
  userId: string;                            // userId của profile đang xem
  newPost: PostDTO | null;                   // để prepend khi có post mới (tuỳ chọn)
};

const PAGE_SIZE = 10;
const DEFAULT_SORT = "createdAt,desc";

export default function SelfPostList({
  profile,
  currentUser,
  className = "",
  onUpdate,
  userId,
  newPost,
}: Props) {
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [page, setPage] = useState(0); // 0-based
  const pageRef = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // prepend newPost khi prop thay đổi (nếu muốn realtime)
  useEffect(() => {
    if (!newPost) return;
    setPosts((prev) => {
      const exists = prev.some((p) => p.postId === newPost.postId);
      if (exists) {
        return prev.map((p) => (p.postId === newPost.postId ? newPost : p));
      }
      return [newPost, ...prev];
    });
  }, [newPost]);

  // fetch trang đầu
  // fetch trang đầu
    useEffect(() => {
    const fetchInitial = async () => {
        setLoading(true);
        setErr(null);
        try {
        const resp: PageResponse<PostDTO> = await getUserPosts(
            userId,                                // ✅ pass userId first
            { page: 0, size: PAGE_SIZE, sort: DEFAULT_SORT } // ✅ params second
        );

        const items = Array.isArray(resp?.content) ? resp.content : [];
        setPosts(items);
        const nextPage = (resp?.number ?? 0) + 1;
        setPage(nextPage);
        pageRef.current = nextPage;
        setHasMore(!resp?.last);
        } catch (e: any) {
        setErr(e?.message || "Failed to load posts.");
        setHasMore(false);
        } finally {
        setLoading(false);
        }
    };
    // reset page ref when userId changes (optional but nice)
    pageRef.current = 0;
    fetchInitial();
    }, [userId]);

    // loadMore
    const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setErr(null);
    try {
        const nextPage = pageRef.current;
        const resp: PageResponse<PostDTO> = await getUserPosts(
        userId,                                  // ✅ keep fetching this user's posts
        { page: nextPage, size: PAGE_SIZE, sort: DEFAULT_SORT }
        );

        const items = Array.isArray(resp?.content) ? resp.content : [];
        if (items.length === 0 && resp?.last) {
        setHasMore(false);
        } else {
        setPosts((prev) => {
            const merged = [...prev, ...items];
            return merged.filter(
            (p, i, self) => self.findIndex((x) => x.postId === p.postId) === i
            );
        });
        const advanced = (resp?.number ?? nextPage) + 1;
        setPage(advanced);
        pageRef.current = advanced;
        setHasMore(!resp?.last);
        }
    } catch (e: any) {
        setErr(e?.message || "Failed to load more posts.");
        setHasMore(false);
    } finally {
        setLoading(false);
    }
    }, [loading, hasMore, userId]); // include userId
        

  // IntersectionObserver cho infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const el = loaderRef.current;
    if (el && hasMore) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  }, [hasMore, loading, loadMore]);

  return (
    <div className={`post-list ${className}`}>
      <div className="card mb-3 shadow-sm">
        <div className="card-body d-flex justify-content-between py-3 align-items-center">
          <small className="text-uppercase text-body-secondary">Posts</small>
          {/* chỗ này tuỳ biến filter/sort nếu cần */}
        </div>
      </div>

      {err && <div className="text-center text-danger py-3">{err}</div>}

      {posts.length === 0 && !err ? (
        <div className="text-center text-muted py-3">
          {loading ? "Loading posts..." : "No posts yet."}
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {posts.map((p) => (
            <PostCard
              key={p.postId}
              post={p}
              profile={profile}
              currentUser={currentUser}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}

      {hasMore ? (
        <div ref={loaderRef} className="text-center py-3" style={{ minHeight: 50 }}>
          {loading ? (
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          ) : (
            <span>Loading more posts…</span>
          )}
        </div>
      ) : (
        posts.length > 0 && !err && (
          <div className="text-center py-3 text-muted">No more posts to load.</div>
        )
      )}
    </div>
  );
}
