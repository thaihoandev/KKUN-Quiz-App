import { useState, useEffect, useRef, useCallback } from "react";
import { UserDto } from "@/interfaces";
import { PostDTO } from "@/services/postService";
import axiosInstance from "@/services/axiosInstance";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "@/components/layouts/post/PostCard";
import { Tabs, Button, Spin, Alert } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

interface HomePostPageProps {
  profile: UserDto | null;
}

interface HomePostsResponse {
  publicPosts: PostDTO[];
  friendsPosts: PostDTO[];
}

const HomePostPage = () => {
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [publicPage, setPublicPage] = useState<number>(0);
  const [friendsPage, setFriendsPage] = useState<number>(0);
  const [hasMorePublic, setHasMorePublic] = useState<boolean>(true);
  const [hasMoreFriends, setHasMoreFriends] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const loaderRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const profile = user;

  // Fetch public posts
  const fetchPublicPosts = async (page: number = 0, size: number = 10) => {
    try {
      const response = await axiosInstance.get('/posts/public', {
        params: { page, size, sortBy: 'createdAt', sortDir: 'desc' },
      });
      return response.data as PostDTO[];
    } catch (error: any) {
      console.error('Error fetching public posts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch public posts');
    }
  };

  // Fetch friends posts
  const fetchFriendsPosts = async (page: number = 0, size: number = 10) => {
    try {
      const response = await axiosInstance.get('/posts/friends', {
        params: { page, size, sortBy: 'createdAt', sortDir: 'desc' },
      });
      return response.data as PostDTO[];
    } catch (error: any) {
      console.error('Error fetching friends posts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch friends posts');
    }
  };

  // Combine and sort posts by creation time
  const combineAndSortPosts = (publicPosts: PostDTO[], friendsPosts: PostDTO[]) => {
    const allPosts = [...publicPosts, ...friendsPosts];
    const uniquePosts = allPosts.filter(
      (post, index, self) => self.findIndex(p => p.postId === post.postId) === index
    );
    return uniquePosts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  // Filter posts based on active tab
  const getFilteredPosts = () => {
    switch (activeTab) {
      case 'public':
        return posts.filter(post => post.privacy === 'PUBLIC');
      case 'friends':
        return posts.filter(post => post.privacy === 'FRIENDS');
      default:
        return posts;
    }
  };

  // Load initial posts
  const loadInitialPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const promises = [
        fetchPublicPosts(0, 10),
        profile ? fetchFriendsPosts(0, 10) : Promise.resolve([]),
      ];
      const [publicResult, friendsResult] = await Promise.allSettled(promises);
      const publicResults: PostDTO[] = publicResult.status === 'fulfilled' ? publicResult.value : [];
      const friendsResults: PostDTO[] = friendsResult.status === 'fulfilled' ? friendsResult.value : [];
      const combinedPosts = combineAndSortPosts(publicResults, friendsResults);
      setPosts(combinedPosts);
      setPublicPage(1);
      setFriendsPage(profile ? 1 : 0);
      setHasMorePublic(publicResults.length >= 10);
      setHasMoreFriends(profile ? friendsResults.length >= 10 : false);
    } catch (error: any) {
      console.error('Error loading initial posts:', error);
      setError(error.message || 'Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  // Load more posts
  const loadMorePosts = useCallback(async () => {
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
        newPublicPosts = result.status === 'fulfilled' ? result.value : [];
        resultIndex++;
      }
      if (hasMoreFriends && profile && results[resultIndex]) {
        const result = results[resultIndex];
        newFriendsPosts = result.status === 'fulfilled' ? result.value : [];
      }
      const combinedNewPosts = combineAndSortPosts(newPublicPosts, newFriendsPosts);
      setPosts(prevPosts => {
        const allPosts = [...prevPosts, ...combinedNewPosts];
        const uniquePosts = allPosts.filter(
          (post, index, self) => self.findIndex(p => p.postId === post.postId) === index
        );
        return uniquePosts.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      if (hasMorePublic) {
        setPublicPage(prev => prev + 1);
        setHasMorePublic(newPublicPosts.length >= 5);
      }
      if (hasMoreFriends && profile) {
        setFriendsPage(prev => prev + 1);
        setHasMoreFriends(newFriendsPosts.length >= 5);
      }
    } catch (error: any) {
      console.error('Error loading more posts:', error);
      setError(error.message || 'Failed to load more posts');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMorePublic, hasMoreFriends, publicPage, friendsPage, profile]);

  // Handle post updates
  const handlePostUpdate = useCallback((updatedPost: PostDTO) => {
    setPosts(prevPosts =>
      prevPosts.map(post => (post.postId === updatedPost.postId ? updatedPost : post))
    );
  }, []);

  // Load initial posts on component mount
  useEffect(() => {
    loadInitialPosts();
  }, [loadInitialPosts]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && (hasMorePublic || hasMoreFriends) && !isLoading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    if (loaderRef.current && (hasMorePublic || hasMoreFriends)) {
      observer.observe(loaderRef.current);
    }
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [hasMorePublic, hasMoreFriends, isLoading, loadMorePosts]);

  const filteredPosts = getFilteredPosts();

  // AntD Tabs configuration
  const tabItems = [
    {
      key: 'all',
      label: `All (${posts.length})`,
    },
    {
      key: 'public',
      label: `Public (${posts.filter(p => p.privacy === 'PUBLIC').length})`,
    },
    ...(profile
      ? [
          {
            key: 'friends',
            label: `Friends (${posts.filter(p => p.privacy === 'FRIENDS').length})`,
          },
        ]
      : []),
  ];

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          {/* Header */}
          <div className="card shadow mb-4">
            <div className="card-body p-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <div>
                  <h4 className="card-title mb-1 fs-3">Home Feed</h4>
                  <small className="text-muted">Latest posts from public and friends</small>
                </div>
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={tabItems}
                  className="custom-tabs"
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
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
                <Button
                  size="small"
                  type="primary"
                  danger
                  onClick={loadInitialPosts}
                >
                  Try Again
                </Button>
              }
              className="mb-4 rounded"
            />
          )}

          {/* Posts List */}
          <div className="d-flex flex-column gap-3">
            {filteredPosts.length === 0 && !isLoading && !error ? (
              <div className="card shadow">
                <div className="card-body text-center py-5">
                  <i className="bx bx-message-dots fs-1 text-muted mb-3"></i>
                  <h5 className="text-muted">No posts available</h5>
                  <p className="text-muted">
                    {activeTab === 'friends' && !profile
                      ? 'Please log in to see friends posts'
                      : activeTab === 'friends'
                      ? 'No friends posts available'
                      : activeTab === 'public'
                      ? 'No public posts available'
                      : 'No posts to show'}
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

          {/* Loading Indicator */}
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

          {/* End of Posts Indicator */}
          {!hasMorePublic && !hasMoreFriends && filteredPosts.length > 0 && (
            <div className="text-center py-4">
              <div className="border-top pt-3">
                <i className="bx bx-check-circle text-success me-2 fs-5"></i>
                <span className="text-muted">You've seen all available posts</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
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