import { useState, useEffect, useRef, useCallback } from "react";
import { UserDto } from "@/interfaces";
import { PostDTO } from "@/services/postService";
import axiosInstance from "@/services/axiosInstance";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "@/components/layouts/post/PostCard";
import { Tabs, Button, Spin, Alert } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import PostComposer from "@/components/layouts/post/PostComposer";
import {
  getFriendSuggestions,
  addFriend,
  FriendSuggestion,
} from "@/services/userService";
import { useAuthStore } from "@/store/authStore";

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
  const user = useAuthStore(s => s.user);
  const profile: UserDto | null = user;;

  // ---------- Suggestions (real API) ----------
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [addingSet, setAddingSet] = useState<Set<string>>(new Set()); // track đang add
  const [addedSet, setAddedSet] = useState<Set<string>>(new Set()); // track đã add thành công
  
  const fetchSuggestions = useCallback(async () => {
    if (!profile?.userId) {
      setSuggestions([]);
      return;
    }
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    try {
      const list = await getFriendSuggestions(0, 6);
      setSuggestions(list);
    } catch (e: any) {
      setSuggestionsError(e?.message || "Failed to load suggestions");
    } finally {
      setSuggestionsLoading(false);
    }
  }, [profile?.userId]);

  const handleAddFriend = async (targetUserId: string) => {
    if (!profile?.userId) return;
    if (addingSet.has(targetUserId) || addedSet.has(targetUserId)) return;
    setAddingSet((prev) => new Set(prev).add(targetUserId));
    try {
      await addFriend(targetUserId); // dùng /users/me/friends/{friendId}
      setAddedSet((prev) => new Set(prev).add(targetUserId));
    } catch (e) {
      // có thể hiển thị toast/alert nếu muốn
    } finally {
      setAddingSet((prev) => {
        const n = new Set(prev);
        n.delete(targetUserId);
        return n;
      });
    }
  };
  // -------------------------------------------

  // Fetch public posts
  const fetchPublicPosts = async (page: number = 0, size: number = 10) => {
    try {
      const response = await axiosInstance.get("/posts/public", {
        params: { page, size, sortBy: "createdAt", sortDir: "desc" },
      });
      return response.data as PostDTO[];
    } catch (error: any) {
      console.error("Error fetching public posts:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch public posts");
    }
  };

  // Fetch friends posts
  const fetchFriendsPosts = async (page: number = 0, size: number = 10) => {
    try {
      const response = await axiosInstance.get("/posts/friends", {
        params: { page, size, sortBy: "createdAt", sortDir: "desc" },
      });
      return response.data as PostDTO[];
    } catch (error: any) {
      console.error("Error fetching friends posts:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch friends posts");
    }
  };

  // Combine & sort
  const combineAndSortPosts = (publicPosts: PostDTO[], friendsPosts: PostDTO[]) => {
    const allPosts = [...publicPosts, ...friendsPosts];
    const uniquePosts = allPosts.filter(
      (post, index, self) => self.findIndex((p) => p.postId === post.postId) === index
    );
    return uniquePosts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // Filter tabs
  const getFilteredPosts = () => {
    switch (activeTab) {
      case "public":
        return posts.filter((post) => post.privacy === "PUBLIC");
      case "friends":
        return posts.filter((post) => post.privacy === "FRIENDS");
      default:
        return posts;
    }
  };

  // Initial load
  const loadInitialPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const promises = [
        fetchPublicPosts(0, 10),
        profile ? fetchFriendsPosts(0, 10) : Promise.resolve([]),
      ];
      const [publicResult, friendsResult] = await Promise.allSettled(promises);
      const publicResults: PostDTO[] =
        publicResult.status === "fulfilled" ? publicResult.value : [];
      const friendsResults: PostDTO[] =
        friendsResult.status === "fulfilled" ? friendsResult.value : [];
      const combinedPosts = combineAndSortPosts(publicResults, friendsResults);
      setPosts(combinedPosts);
      setPublicPage(1);
      setFriendsPage(profile ? 1 : 0);
      setHasMorePublic(publicResults.length >= 10);
      setHasMoreFriends(profile ? friendsResults.length >= 10 : false);
    } catch (error: any) {
      console.error("Error loading initial posts:", error);
      setError(error.message || "Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Load more (infinite)
  const loadMorePosts = useCallback(
    async () => {
      if (isLoading || (!hasMorePublic && !hasMoreFriends)) return;
      setIsLoading(true);
      setError(null);
      try {
        const promises: Promise<PostDTO[]>[] = [];
        if (hasMorePublic) promises.push(fetchPublicPosts(publicPage, 5));
        if (hasMoreFriends && profile) promises.push(fetchFriendsPosts(friendsPage, 5));

        const results = await Promise.allSettled(promises);
        let newPublicPosts: PostDTO[] = [];
        let newFriendsPosts: PostDTO[] = [];
        let resultIndex = 0;

        if (hasMorePublic && results[resultIndex]) {
          const result = results[resultIndex];
          newPublicPosts = result.status === "fulfilled" ? result.value : [];
          resultIndex++;
        }
        if (hasMoreFriends && profile && results[resultIndex]) {
          const result = results[resultIndex];
          newFriendsPosts = result.status === "fulfilled" ? result.value : [];
        }

        const combinedNew = combineAndSortPosts(newPublicPosts, newFriendsPosts);
        setPosts((prev) => {
          const all = [...prev, ...combinedNew];
          const unique = all.filter(
            (p, i, self) => self.findIndex((x) => x.postId === p.postId) === i
          );
          return unique.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        if (hasMorePublic) {
          setPublicPage((prev) => prev + 1);
          setHasMorePublic(newPublicPosts.length >= 5);
        }
        if (hasMoreFriends && profile) {
          setFriendsPage((prev) => prev + 1);
          setHasMoreFriends(newFriendsPosts.length >= 5);
        }
      } catch (error: any) {
        console.error("Error loading more posts:", error);
        setError(error.message || "Failed to load more posts");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, hasMorePublic, hasMoreFriends, publicPage, friendsPage, profile]
  );

  // Post update from children
  const handlePostUpdate = useCallback((updatedPost: PostDTO) => {
    setPosts((prev) => prev.map((p) => (p.postId === updatedPost.postId ? updatedPost : p)));
  }, []);

  // Mount
  useEffect(() => {
    loadInitialPosts();
  }, [loadInitialPosts]);

  // Suggestions mount/update
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          (hasMorePublic || hasMoreFriends) &&
          !isLoading
        ) {
          loadMorePosts();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );
    if (loaderRef.current && (hasMorePublic || hasMoreFriends)) {
      observer.observe(loaderRef.current);
    }
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMorePublic, hasMoreFriends, isLoading, loadMorePosts]);

  useEffect(() => {
    // gọi nếu bạn có refreshMeIfStale; nếu không thì gọi refreshMe
    const refresh = async () => {
      try { await useAuthStore.getState().refreshMe(); } catch {}
    };
    refresh();

    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
    
  const filteredPosts = getFilteredPosts();

  // ---------- Sidebar Widgets ----------
  const SuggestionsWidget = () => {
    if (!profile?.userId) return null;
    return (
      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3">People you may know</h6>

          {suggestionsError && (
            <div className="alert alert-danger py-2">{suggestionsError}</div>
          )}

          {suggestionsLoading ? (
            <div className="d-flex align-items-center gap-2">
              <Spin size="small" />
              <span className="text-muted">Loading suggestions…</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-muted">No suggestions right now</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {suggestions.map((s) => {
                const isAdding = addingSet.has(s.userId);
                const isAdded = addedSet.has(s.userId);
                return (
                  <div key={s.userId} className="d-flex align-items-center">
                    <img
                      src={s.avatar || unknownAvatar}
                      alt={s.name}
                      className="rounded-circle me-3"
                      width={40}
                      height={40}
                      style={{ objectFit: "cover" }}
                    />
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{s.name || s.username}</div>
                      <small className="text-muted">
                        {s.mutualFriends} mutual friends
                      </small>
                    </div>
                    <button
                      className={`btn btn-sm rounded-pill px-3 ${
                        isAdded ? "btn-success" : "btn-primary"
                      }`}
                      onClick={() => handleAddFriend(s.userId)}
                      disabled={isAdding || isAdded}
                    >
                      {isAdded ? "Added" : isAdding ? "Adding..." : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const TrendsWidget = () => (
    <div className="card shadow-sm border-0 rounded-4 mb-4">
      <div className="card-body">
        <h6 className="fw-bold mb-3">Trends for you</h6>
        <ul className="list-unstyled mb-0">
          {[
            { tag: "#javascript", posts: 1240 },
            { tag: "#webdev", posts: 980 },
            { tag: "#datascience", posts: 720 },
            { tag: "#uxui", posts: 610 },
          ].map((t) => (
            <li key={t.tag} className="mb-3">
              <div className="fw-semibold">{t.tag}</div>
              <small className="text-muted">{t.posts.toLocaleString()} posts</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const OnlineWidget = () => (
    <div className="card shadow-sm border-0 rounded-4">
      <div className="card-body">
        <h6 className="fw-bold mb-3">Online</h6>
        <div className="d-flex flex-wrap gap-3">
          {[
            { id: "o1", name: "Trang", avatar: unknownAvatar },
            { id: "o2", name: "Phúc", avatar: unknownAvatar },
            { id: "o3", name: "Khoa", avatar: unknownAvatar },
            { id: "o4", name: "Vy", avatar: unknownAvatar },
          ].map((f) => (
            <div key={f.id} className="text-center" title={f.name}>
              <div className="position-relative mx-auto" style={{ width: 44, height: 44 }}>
                <img
                  src={f.avatar}
                  alt={f.name}
                  className="rounded-circle"
                  width={44}
                  height={44}
                  style={{ objectFit: "cover" }}
                />
                <span
                  className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white"
                  style={{ width: 10, height: 10 }}
                />
              </div>
              <small className="d-block mt-1 text-truncate" style={{ maxWidth: 64 }}>
                {f.name}
              </small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  // -------------------------------------

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
                      ? [
                          {
                            key: "friends",
                            label: `Friends (${posts.filter((p) => p.privacy === "FRIENDS").length})`,
                          },
                        ]
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
                  const unique = [post, ...prev].filter(
                    (p, i, self) => self.findIndex((x) => x.postId === p.postId) === i
                  );
                  return unique.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  );
                });
              }}
            />
          ) : (
            <div className="card shadow-sm mb-4 border-0 rounded-4">
              <div className="card-body text-center text-muted">
                Please log in to create a post.
              </div>
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
                <PostCard
                  key={post.postId}
                  post={post}
                  profile={profile}
                  onUpdate={handlePostUpdate}
                />
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
