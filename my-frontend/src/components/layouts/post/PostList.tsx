import { useState, useEffect, useRef, useCallback } from "react";
import { UserResponseDTO } from "@/interfaces";
import { getUserPosts, PostDTO } from "@/services/postService";
import PostCard from "./PostCard";

interface PostListProps {
  profile: UserResponseDTO | null;
  onUpdate: (updatedPost: PostDTO) => void;
  userId: string;
  newPost?: PostDTO | null;
}

const PAGE_SIZE = 10;

const PostList = ({ profile, onUpdate, userId, newPost }: PostListProps) => {
  const [currentPosts, setCurrentPosts] = useState<PostDTO[]>([]);
  const [page, setPage] = useState<number>(0);
  const pageRef = useRef(0); // tránh race-condition khi loadMore
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const isOwner = profile?.userId === userId;

  // ✅ Reset mọi state khi userId đổi
  useEffect(() => {
    setCurrentPosts([]);
    setPage(0);
    pageRef.current = 0;
    setHasMore(true);
    setError(null);
  }, [userId]);

  // ✅ Luôn fetch initial posts khi userId đổi (KHÔNG early return vì newPost)
  useEffect(() => {
    const fetchInitialPosts = async () => {
      if (!userId) {
        setCurrentPosts([]);
        setHasMore(false);
        setError("No user ID provided.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const initialPosts = await getUserPosts(userId, 0, PAGE_SIZE);
        setCurrentPosts(initialPosts.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        setPage(1);
        pageRef.current = 1;
        setHasMore(initialPosts.length >= PAGE_SIZE);
      } catch (e: any) {
        console.error("Error fetching initial posts:", e);
        setError(e?.message || "Failed to load posts.");
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialPosts();
  }, [userId]);

  // ✅ Chỉ thêm newPost nếu đúng chủ profile hiện tại
  useEffect(() => {
    if (!newPost) return;
    const ownerId = (newPost as any)?.user?.userId; // tuỳ DTO của bạn
    if (ownerId !== userId) return;

    setCurrentPosts((prev) => {
      if (prev.some((p) => p.postId === newPost.postId)) return prev;
      return [newPost, ...prev].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [newPost, userId]);

  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore || !userId) return;

    setIsLoading(true);
    setError(null);
    try {
      const nextPage = pageRef.current; // dùng ref để luôn là giá trị mới nhất
      const newPosts = await getUserPosts(userId, nextPage, PAGE_SIZE);

      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setCurrentPosts((prev) => {
          const merged = [...prev, ...newPosts];
          const unique = merged.filter(
            (post, idx, self) => self.findIndex((p) => p.postId === post.postId) === idx
          );
          return unique.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        setPage((prev) => prev + 1);
        pageRef.current = nextPage + 1;
        setHasMore(newPosts.length >= PAGE_SIZE);
      }
    } catch (e: any) {
      console.error("Error loading more posts:", e);
      setError(e?.message || "Failed to load more posts.");
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, userId]);

  // IntersectionObserver cho lazy load
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts();
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
  }, [hasMore, isLoading, userId, loadMorePosts]);

  return (
    <>
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <small className="card-text text-uppercase text-body-secondary small">
            Posts
          </small>
        </div>
      </div>

      <div className="post-list" style={{ minHeight: "200px" }}>
        {error && <div className="text-center text-danger py-3">{error}</div>}

        {currentPosts.length === 0 && !error ? (
          <div className="text-center text-muted py-3">
            {isLoading
              ? "Loading posts..."
              : isOwner
              ? "No posts yet. Share something!"
              : "No visible posts."}
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {currentPosts.map((post) => (
              <PostCard
                key={post.postId}
                post={post}
                profile={profile}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}

        {hasMore ? (
          <div
            ref={loaderRef}
            className="text-center py-3"
            style={{ minHeight: "50px" }}
          >
            {isLoading ? (
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : (
              <span>Loading more posts...</span>
            )}
          </div>
        ) : (
          currentPosts.length > 0 &&
          !error && (
            <div className="text-center py-3 text-muted">No more posts to load.</div>
          )
        )}
      </div>
    </>
  );
};

export default PostList;
