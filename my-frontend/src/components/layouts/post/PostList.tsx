import { useState, useEffect, useRef } from "react";
import { UserResponseDTO } from "@/interfaces";
import { getUserPosts, PostDTO } from "@/services/postService";
import PostCard from "./PostCard";

interface PostListProps {
  profile: UserResponseDTO | null;
  onUpdate: (updatedPost: PostDTO) => void;
  userId: string;
  newPost?: PostDTO | null;
}

const PostList = ({ profile, onUpdate, userId, newPost }: PostListProps) => {
  const [currentPosts, setCurrentPosts] = useState<PostDTO[]>([]);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Check if current user is the profile owner
  const isOwner = profile?.userId === userId;

  // Fetch initial posts on mount or userId change
  useEffect(() => {
    const fetchInitialPosts = async () => {
      if (!userId) {
        setCurrentPosts([]);
        setHasMore(false);
        setError("No user ID provided.");
        return;
      }

      if (newPost) {
        console.log('Skipping initial fetch due to new post');
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const initialPosts = await getUserPosts(userId, 0, 10);
        setCurrentPosts((prevPosts) => {
          const newPostIds = prevPosts.map((p) => p.postId);
          const filteredFetchedPosts = initialPosts.filter((post) => !newPostIds.includes(post.postId));
          const updatedPosts = [...prevPosts, ...filteredFetchedPosts].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          return updatedPosts;
        });
        setPage(1);
        setHasMore(initialPosts.length >= 10);
      } catch (error: any) {
        console.error('Error fetching initial posts:', error);
        setError(error.message || 'Failed to load posts.');
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialPosts();
  }, [userId]);

  // Handle new post notifications
  useEffect(() => {
    if (newPost) {
      console.log('Received new post:', newPost);
      setCurrentPosts((prevPosts) => {
        if (prevPosts.some((p) => p.postId === newPost.postId)) {
          return prevPosts;
        }
        const updatedPosts = [newPost, ...prevPosts].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return updatedPosts;
      });
    }
  }, [newPost]);

  const loadMorePosts = async () => {
    if (isLoading || !hasMore || !userId) {
      console.log('Skipping loadMorePosts:', { isLoading, hasMore, userId });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const newPosts = await getUserPosts(userId, page, 10);
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setCurrentPosts((prevPosts) => {
          const uniquePosts = [...prevPosts, ...newPosts].filter(
            (post, index, self) => self.findIndex((p) => p.postId === post.postId) === index
          );
          return uniquePosts.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        setPage((prevPage) => prevPage + 1);
        setHasMore(newPosts.length >= 10);
      }
    } catch (error: any) {
      console.error("Error loading more posts:", error);
      setError(error.message || 'Failed to load more posts.');
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up IntersectionObserver for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        console.log('IntersectionObserver triggered:', entries[0].isIntersecting, 'hasMore:', hasMore, 'isLoading:', isLoading);
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loaderRef.current && hasMore) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, isLoading, userId]);

  return (
    <>
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <small className="card-text text-uppercase text-body-secondary small">
            Posts
          </small>
        </div>
      </div>
      <div className="post-list" style={{ minHeight: '200px' }}>
        {error && (
          <div className="text-center text-danger py-3">
            {error}
          </div>
        )}
        {currentPosts.length === 0 && !error ? (
          <div className="text-center text-muted py-3">
            {isLoading ? 'Loading posts...' : isOwner ? 'No posts yet. Share something!' : 'No visible posts.'}
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
          <div ref={loaderRef} className="text-center py-3" style={{ minHeight: '50px' }}>
            {isLoading ? (
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : (
              <span>Loading more posts...</span>
            )}
          </div>
        ) : (
          currentPosts.length > 0 && !error && (
            <div className="text-center py-3 text-muted">
              No more posts to load.
            </div>
          )
        )}
      </div>
    </>
  );
};

export default PostList;