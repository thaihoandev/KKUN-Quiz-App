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
  const [page, setPage] = useState<number>(0); // Start at page 0 to match getUserPosts
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMorePosts = async () => {
    if (isLoading || !hasMore || !userId) return;

    setIsLoading(true);
    try {
      console.log('Fetching more posts for userId:', userId, 'page:', page);
      const newPosts = await getUserPosts(userId, page, 10);
      console.log('Lazy-loaded posts:', newPosts);
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setCurrentPosts((prevPosts) => [...prevPosts, ...newPosts]);
        setPage((prevPage) => prevPage + 1);
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Resetting posts:', posts, 'length:', posts.length);
    setCurrentPosts(posts);
    setPage(0); // Reset to page 0 for new userId or posts
    setHasMore(posts.length >= 10); // Assume more posts if initial fetch returns 10
  }, [posts]);

  useEffect(() => {
    console.log('Setting up IntersectionObserver - hasMore:', hasMore, 'isLoading:', isLoading);
    const observer = new IntersectionObserver(
      (entries) => {
        console.log('IntersectionObserver triggered:', entries[0].isIntersecting);
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 } // Trigger when 10% of loader is visible
    );

    if (loaderRef.current) {
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
          <div ref={loaderRef} className="text-center py-3" style={{ minHeight: '50px' }}>
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