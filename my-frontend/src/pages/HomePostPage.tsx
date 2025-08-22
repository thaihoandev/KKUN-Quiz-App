import { useState, useEffect, useRef, useCallback } from "react";
import { UserDto } from "@/interfaces";
import { PostDTO } from "@/services/postService";
import axiosInstance from "@/services/axiosInstance";
import { Tabs, Button, Spin, Alert } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import PostComposer from "@/components/layouts/post/PostComposer";
import PostCard from "@/components/layouts/post/PostCard";
import { useAuthStore } from "@/store/authStore";

// NEW widgets
import SuggestionsWidget from "@/components/widgets/SuggestionsWidget";
import TrendsWidget from "@/components/widgets/TrendsWidget";
import OnlineWidget from "@/components/widgets/OnlineWidget";

/** ===== Helpers to normalize any response shape to an array of PostDTO ===== */

type PageResponseLike<T> = {
  content?: T[];
  last?: boolean;
  number?: number;
  totalElements?: number;
  totalPages?: number;
  size?: number;
} | T[];

/** Trả về { items, last? } từ mọi response (array hoặc PageResponse) */
function normalizeList<T>(data: PageResponseLike<T>): { items: T[]; last: boolean | undefined } {
  if (Array.isArray(data)) {
    return { items: data, last: undefined };
  }
  if (data && Array.isArray((data as any).content)) {
    const d = data as any;
    return { items: d.content as T[], last: typeof d.last === "boolean" ? d.last : undefined };
  }
  return { items: [], last: undefined };
}

function uniqueByPostId<T extends { postId?: string | number }>(arr: T[]) {
  return arr.filter((p, i, self) => self.findIndex((x) => x.postId === p.postId) === i);
}

function safeDateMs(v: any) {
  const t = new Date(v as any).getTime();
  return Number.isFinite(t) ? t : 0;
}

function combineAndSortPosts(a: PostDTO[], b: PostDTO[]) {
  const merged = uniqueByPostId([...a, ...b]);
  merged.sort((x, y) => safeDateMs(y.createdAt) - safeDateMs(x.createdAt));
  return merged;
}

/** ====================== Component ====================== */

const PAGE_INIT_SIZE = 10;
const PAGE_MORE_SIZE = 5;

const HomePostPage = () => {
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [publicPage, setPublicPage] = useState<number>(0);
  const [friendsPage, setFriendsPage] = useState<number>(0);
  const [hasMorePublic, setHasMorePublic] = useState<boolean>(true);
  const [hasMoreFriends, setHasMoreFriends] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const user = useAuthStore((s) => s.user);
  const profile: UserDto | null = user;

  /** ====== Fetchers (đã normalize) ====== */
  const fetchPublicPosts = useCallback(
    async (page: number = 0, size: number = PAGE_INIT_SIZE) => {
      try {
        const resp = await axiosInstance.get("/posts/public", {
          params: { page, size, sortBy: "createdAt", sortDir: "desc" },
        });
        const { items, last } = normalizeList<PostDTO>(resp?.data);
        // Nếu backend không trả last, ước lượng theo length
        const computedLast = typeof last === "boolean" ? last : !(Array.isArray(items) && items.length >= size);
        return { items, last: computedLast };
      } catch (err: any) {
        console.error("Error fetching public posts:", err);
        throw new Error(err?.response?.data?.message || "Failed to fetch public posts");
      }
    },
    []
  );

  const fetchFriendsPosts = useCallback(
    async (page: number = 0, size: number = PAGE_INIT_SIZE) => {
      try {
        const resp = await axiosInstance.get("/posts/friends", {
          params: { page, size, sortBy: "createdAt", sortDir: "desc" },
        });
        const { items, last } = normalizeList<PostDTO>(resp?.data);
        const computedLast = typeof last === "boolean" ? last : !(Array.isArray(items) && items.length >= size);
        return { items, last: computedLast };
      } catch (err: any) {
        console.error("Error fetching friends posts:", err);
        throw new Error(err?.response?.data?.message || "Failed to fetch friends posts");
      }
    },
    []
  );

  /** ====== Filter tabs ====== */
  const getFilteredPosts = useCallback(() => {
    switch (activeTab) {
      case "public":
        return posts.filter((post) => post.privacy === "PUBLIC");
      case "friends":
        return posts.filter((post) => post.privacy === "FRIENDS");
      default:
        return posts;
    }
  }, [activeTab, posts]);

  /** ====== Initial load ====== */
  const loadInitialPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const promises = [
        fetchPublicPosts(0, PAGE_INIT_SIZE),
        profile ? fetchFriendsPosts(0, PAGE_INIT_SIZE) : Promise.resolve({ items: [], last: true }),
      ] as const;

      const [pubRes, friRes] = await Promise.all(promises);

      const combined = combineAndSortPosts(pubRes.items, friRes.items);
      setPosts(combined);

      setPublicPage(1);
      setFriendsPage(profile ? 1 : 0);

      setHasMorePublic(!pubRes.last);
      setHasMoreFriends(profile ? !friRes.last : false);
    } catch (err: any) {
      console.error("Error loading initial posts:", err);
      setError(err?.message || "Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, [fetchPublicPosts, fetchFriendsPosts, profile]);

  /** ====== Load more (infinite) ====== */
  const loadMorePosts = useCallback(async () => {
    if (isLoading || (!hasMorePublic && !hasMoreFriends)) return;

    setIsLoading(true);
    setError(null);
    try {
      // chạy song song, chỉ fetch cái nào còn
      const tasks: Promise<{ items: PostDTO[]; last: boolean }>[] = [];
      let wantPublic = false;
      let wantFriends = false;

      if (hasMorePublic) {
        tasks.push(fetchPublicPosts(publicPage, PAGE_MORE_SIZE));
        wantPublic = true;
      }
      if (hasMoreFriends && profile) {
        tasks.push(fetchFriendsPosts(friendsPage, PAGE_MORE_SIZE));
        wantFriends = true;
      }

      const results = await Promise.allSettled(tasks);

      // mapping kết quả theo thứ tự push
      let idx = 0;
      let newPublic: PostDTO[] = [];
      let pubLast = true;
      if (wantPublic) {
        const r = results[idx++];
        if (r.status === "fulfilled") {
          newPublic = r.value.items ?? [];
          pubLast = r.value.last;
        } else {
          console.error("Error loading more public posts:", r.reason);
          // để tránh kẹt, có thể tạm thời coi như hết
          pubLast = true;
        }
      }

      let newFriends: PostDTO[] = [];
      let friLast = true;
      if (wantFriends) {
        const r = results[idx++];
        if (r.status === "fulfilled") {
          newFriends = r.value.items ?? [];
          friLast = r.value.last;
        } else {
          console.error("Error loading more friends posts:", r.reason);
          friLast = true;
        }
      }

      const combinedNew = combineAndSortPosts(newPublic, newFriends);

      setPosts((prev) => {
        const all = uniqueByPostId([...prev, ...combinedNew]);
        all.sort((a, b) => safeDateMs(b.createdAt) - safeDateMs(a.createdAt));
        return all;
      });

      if (wantPublic) {
        setPublicPage((p) => p + 1);
        setHasMorePublic(!pubLast);
      }
      if (wantFriends) {
        setFriendsPage((p) => p + 1);
        setHasMoreFriends(!friLast);
      }
    } catch (err: any) {
      console.error("Error loading more posts:", err);
      setError(err?.message || "Failed to load more posts");
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    hasMorePublic,
    hasMoreFriends,
    publicPage,
    friendsPage,
    profile,
    fetchPublicPosts,
    fetchFriendsPosts,
  ]);

  /** ====== Post update from children ====== */
  const handlePostUpdate = useCallback((updatedPost: PostDTO) => {
    setPosts((prev) => {
      const next = prev.map((p) => (p.postId === updatedPost.postId ? updatedPost : p));
      // giữ nguyên order theo createdAt
      next.sort((a, b) => safeDateMs(b.createdAt) - safeDateMs(a.createdAt));
      return next;
    });
  }, []);

  /** ====== Mount: initial fetch ====== */
  useEffect(() => {
    loadInitialPosts();
  }, [loadInitialPosts]);

  /** ====== Refresh current user when window focuses (optional) ====== */
  useEffect(() => {
    const refresh = async () => {
      try {
        await useAuthStore.getState().refreshMe();
      } catch {}
    };
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  /** ====== IntersectionObserver ====== */
  useEffect(() => {
    if (!loaderRef.current) return;

    // cleanup instance cũ
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && (hasMorePublic || hasMoreFriends) && !isLoading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    obs.observe(loaderRef.current);
    observerRef.current = obs;

    return () => {
      obs.disconnect();
    };
  }, [hasMorePublic, hasMoreFriends, isLoading, loadMorePosts]);

  const filteredPosts = getFilteredPosts();

  return (
    <div className="container py-4">
      <div className="row g-4">
        {/* Feed (left) */}
        <div className="col-12 col-lg-8">
          {/* Header + Tabs */}
          <div className="card shadow mb-4 border-0 rounded-4">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <div>
                  <h4 className="card-title mb-1 fs-3">Home Feed</h4>
                  <small className="text-muted">Latest posts from public and friends</small>
                </div>
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={[
                    { key: "all", label: `All (${posts.length})` },
                    { key: "public", label: `Public (${posts.filter((p) => p.privacy === "PUBLIC").length})` },
                    ...(profile
                      ? [{ key: "friends", label: `Friends (${posts.filter((p) => p.privacy === "FRIENDS").length})` }]
                      : []),
                  ]}
                  className="custom-tabs"
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>
          </div>

          {/* Composer */}
          {profile ? (
            <PostComposer
              userId={profile.userId}
              avatarUrl={profile.avatar || unknownAvatar}
              onCreated={(post) => {
                setPosts((prev) => {
                  const unique = uniqueByPostId([post, ...prev]);
                  unique.sort((a, b) => safeDateMs(b.createdAt) - safeDateMs(a.createdAt));
                  return unique;
                });
              }}
            />
          ) : (
            <div className="card shadow-sm mb-4 border-0 rounded-4">
              <div className="card-body text-center text-muted">Please log in to create a post.</div>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert
              message={
                <div className="d-flex align-items-center">
                  <i className="bx bx-error-circle me-2 fs-5 text-danger"></i>
                  {error}
                </div>
              }
              type="error"
              showIcon={false}
              closable
              onClose={() => setError(null)}
              action={
                <Button size="small" type="primary" danger onClick={loadInitialPosts}>
                  Try Again
                </Button>
              }
              className="mb-4 rounded"
            />
          )}

          {/* Posts */}
          <div className="d-flex flex-column gap-3">
            {filteredPosts.length === 0 && !isLoading && !error ? (
              <div className="card shadow border-0 rounded-4">
                <div className="card-body text-center py-5">
                  <i className="bx bx-message-dots fs-1 text-muted mb-3"></i>
                  <h5 className="text-muted">No posts available</h5>
                  <p className="text-muted">
                    {activeTab === "friends" && !profile
                      ? "Please log in to see friends posts"
                      : activeTab === "friends"
                      ? "No friends posts available"
                      : activeTab === "public"
                      ? "No public posts available"
                      : "No posts to show"}
                  </p>
                </div>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <PostCard key={post.postId} post={post} profile={profile} onUpdate={handlePostUpdate} />
              ))
            )}
          </div>

          {/* Infinite loader */}
          {(hasMorePublic || hasMoreFriends) && (
            <div ref={loaderRef} className="text-center py-4">
              {isLoading ? (
                <div className="d-flex justify-content-center align-items-center gap-2">
                  <Spin size="small" />
                  <span className="text-muted">Loading more posts...</span>
                </div>
              ) : (
                <span className="text-muted">Scroll for more posts</span>
              )}
            </div>
          )}

          {/* End indicator */}
          {!hasMorePublic && !hasMoreFriends && filteredPosts.length > 0 && (
            <div className="text-center py-4">
              <div className="border-top pt-3">
                <i className="bx bx-check-circle text-success me-2 fs-5"></i>
                <span className="text-muted">You've seen all available posts</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (right) */}
        <aside className="col-12 col-lg-4">
          <SuggestionsWidget />
          <TrendsWidget />
          <OnlineWidget />
        </aside>
      </div>

      {/* Refresh FAB */}
      <Button
        type="primary"
        shape="circle"
        icon={<ReloadOutlined spin={isLoading} />}
        size="large"
        className="position-fixed bottom-0 end-0 m-4 shadow-lg"
        style={{ width: 56, height: 56, zIndex: 1000 }}
        onClick={loadInitialPosts}
        disabled={isLoading}
        title="Refresh posts"
      />
    </div>
  );
};

export default HomePostPage;
