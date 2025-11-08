import { useEffect, useRef, useState, useCallback } from "react";
import { PageResponse } from "@/interfaces";
import { getPublicPosts, getUserPosts, PostDTO } from "@/services/postService";
import PostCard from "./PostCard";
import { User } from "@/types/users";

type Props = {
  profile: User | null;
  currentUser?: User | null;
  className?: string;
  onUpdate: (updatedPost: PostDTO) => void;
  userId: string;
  newPost: PostDTO | null;
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
  const [page, setPage] = useState(0);
  const pageRef = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Detect dark mode
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

  // Prepend newPost khi prop thay đổi
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

  // Fetch trang đầu
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      setErr(null);
      try {
        const resp: PageResponse<PostDTO> = await getUserPosts(userId, {
          page: 0,
          size: PAGE_SIZE,
          sort: DEFAULT_SORT,
        });

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

    pageRef.current = 0;
    fetchInitial();
  }, [userId]);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setErr(null);
    try {
      const nextPage = pageRef.current;
      const resp: PageResponse<PostDTO> = await getUserPosts(userId, {
        page: nextPage,
        size: PAGE_SIZE,
        sort: DEFAULT_SORT,
      });

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
  }, [loading, hasMore, userId]);

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
      {/* Header Card */}
      <div
        className="card mb-3 shadow-sm border-0"
        style={{
          background: "var(--surface-color)",
          border: "2px solid var(--border-color)",
          borderRadius: "14px",
          transition: "all 0.25s ease",
        }}
      >
        <div
          className="card-body d-flex justify-content-between py-3 align-items-center"
          style={{
            padding: "1rem 1.5rem",
          }}
        >
          <small
            style={{
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--text-muted)",
              fontSize: "0.8rem",
              letterSpacing: "0.5px",
            }}
          >
            Posts
          </small>
        </div>
      </div>

      {/* Error State */}
      {err && (
        <div
          className="alert alert-dismissible"
          style={{
            background: "var(--surface-color)",
            borderLeft: "4px solid var(--danger-color)",
            color: "var(--danger-color)",
            padding: "1rem",
            borderRadius: "12px",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <i
            className="bx bx-error-circle"
            style={{
              fontSize: "1.1rem",
              flexShrink: 0,
            }}
          ></i>
          <span style={{ flex: 1 }}>{err}</span>
          <button
            onClick={() => setErr(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--danger-color)",
              cursor: "pointer",
              fontSize: "1.1rem",
            }}
          >
            <i className="bx bx-x"></i>
          </button>
        </div>
      )}

      {/* Empty/Loading State */}
      {posts.length === 0 && !err ? (
        <div
          style={{
            textAlign: "center",
            padding: "2rem 1rem",
            color: "var(--text-muted)",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <i
                className="bx bx-loader-alt bx-spin"
                style={{
                  fontSize: "1.5rem",
                  animation: "spin 1s linear infinite",
                }}
              ></i>
              <span>Loading posts...</span>
            </div>
          ) : (
            <div>
              <i
                className="bx bx-file"
                style={{
                  fontSize: "2rem",
                  display: "block",
                  marginBottom: "0.5rem",
                  opacity: 0.5,
                }}
              ></i>
              <span>No posts yet.</span>
            </div>
          )}
        </div>
      ) : (
        // Posts List
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            animation: "slideInUp 0.5s ease forwards",
          }}
        >
          {posts.map((p, index) => (
            <div
              key={p.postId}
              style={{
                animation: "slideInUp 0.5s ease forwards",
                animationDelay: `${index * 0.05}s`,
              }}
            >
              <PostCard
                post={p}
                profile={profile}
                currentUser={currentUser}
                onUpdate={onUpdate}
              />
            </div>
          ))}
        </div>
      )}

      {/* Loader */}
      {hasMore ? (
        <div
          ref={loaderRef}
          style={{
            textAlign: "center",
            padding: "2rem 1rem",
            minHeight: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            transition: "all 0.25s ease",
          }}
        >
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <i
                className="bx bx-loader-alt bx-spin"
                style={{
                  fontSize: "1.2rem",
                  animation: "spin 1s linear infinite",
                }}
              ></i>
              <span>Loading more posts…</span>
            </div>
          ) : (
            <span style={{ fontSize: "0.9rem" }}>Scroll for more posts…</span>
          )}
        </div>
      ) : (
        posts.length > 0 &&
        !err && (
          <div
            style={{
              textAlign: "center",
              padding: "1.5rem 1rem",
              color: "var(--text-muted)",
              fontSize: "0.9rem",
            }}
          >
            <i
              className="bx bx-check-circle"
              style={{
                fontSize: "1.2rem",
                display: "block",
                marginBottom: "0.5rem",
                opacity: 0.7,
              }}
            ></i>
            No more posts to load.
          </div>
        )
      )}

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}