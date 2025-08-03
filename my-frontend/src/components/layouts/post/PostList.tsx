import { useState, useEffect, useRef } from "react";
import { UserResponseDTO } from "@/interfaces";
import { getUserPosts, PostDTO } from "@/services/postService";
import PostCard from "./PostCard";

interface PostListProps {
  posts: PostDTO[];
  profile: UserResponseDTO | null;
  onUpdate: (updatedPost: PostDTO) => void;
  userId: string;
}

const PostList = ({ posts, profile, onUpdate, userId }: PostListProps) => {
  const [currentPosts, setCurrentPosts] = useState<PostDTO[]>(posts);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMorePosts = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const newPosts = await getUserPosts(userId, page);
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setCurrentPosts((prevPosts) => [...prevPosts, ...newPosts]);
        setPage((prevPage) => prevPage + 1);
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPosts(posts);
    setPage(1);
    setHasMore(posts.length === 10);
  }, [posts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts();
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, isLoading]);

  return (
    <>
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <small className="card-text text-uppercase text-body-secondary small">
            Posts
          </small>
        </div>
      </div>
      <div className="post-list">
        {currentPosts.length === 0 ? (
          <div className="text-center text-muted py-3">
            No posts yet. Share something!
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
        {hasMore && (
          <div ref={loaderRef} className="text-center py-3">
            {isLoading ? (
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : (
              <span>Loading more posts...</span>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default PostList;