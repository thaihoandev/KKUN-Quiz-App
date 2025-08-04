import { formatDateOnly, parseDate } from "@/utils/dateUtils";
import { UserDto } from "@/interfaces";
import { useState, useRef, useCallback, KeyboardEvent, useEffect } from "react";
import { createComment, getCommentsByPostId, likePost, PostDTO, CommentDTO, getPostById, unlikePost } from "@/services/postService";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: UserDto | null;
  parentCommentId?: string;
  replies: Comment[];
}

interface PostCardProps {
  post: PostDTO;
  profile: UserDto | null;
  onUpdate: (updatedPost: PostDTO) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, profile, onUpdate }) => {
  const [newComment, setNewComment] = useState("");
  const [replyContents, setReplyContents] = useState<{ [id: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiked, setIsLiked] = useState(post.likedByCurrentUser);
  const [isLiking, setIsLiking] = useState(false);
  const [visibleComments, setVisibleComments] = useState(3);
  const [expandedReplies, setExpandedReplies] = useState<{ [id: string]: number }>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const replyInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  console.log("PostCard rendered with post:", post);

  // Fetch post data on mount to sync likedByCurrentUser
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const updatedPost = await getPostById(post.postId);
        setLikeCount(updatedPost.likeCount);
        setIsLiked(updatedPost.likedByCurrentUser ?? false); // Fallback to false if undefined
        onUpdate(updatedPost);
      } catch (error) {
        console.error("Failed to fetch post data:", error);
      }
    };
    fetchPost();
  }, [post.postId, onUpdate]);

  // Sync local likeCount and isLiked with prop changes
  useEffect(() => {
    setLikeCount(post.likeCount);
    setIsLiked(post.likedByCurrentUser ?? false); // Fallback to false if undefined
  }, [post.likeCount, post.likedByCurrentUser]);

  // Fetch comments on mount
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const fetchedComments: CommentDTO[] = await getCommentsByPostId(post.postId);
        const mapComments = (dtos: CommentDTO[]): Comment[] =>
          dtos.map((dto) => ({
            id: dto.commentId,
            content: dto.content,
            createdAt: new Date(dto.createdAt),
            user: dto.user || null,
            parentCommentId: dto.parentCommentId,
            replies: dto.replies
              ? dto.replies
                  .filter((reply) => !reply.parentCommentId || reply.parentCommentId === dto.commentId)
                  .map((reply) => ({
                    id: reply.commentId,
                    content: reply.content,
                    createdAt: new Date(reply.createdAt),
                    user: reply.user || null,
                    parentCommentId: reply.parentCommentId,
                    replies: [],
                  }))
              : [],
          }));
        const mappedComments = mapComments(fetchedComments);
        setComments(mappedComments);

        const totalComments = mappedComments.reduce(
          (count, comment) => count + 1 + (comment.replies?.length || 0),
          0
        );
        if (totalComments !== post.commentCount) {
          onUpdate({ ...post, commentCount: totalComments });
        }
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      }
    };
    fetchComments();
  }, [post.postId, post.commentCount, onUpdate]);

  const handleLike = useCallback(async () => {
    if (isLiking) return;
    setIsLiking(true);

    const previousLikeCount = likeCount;
    const previousIsLiked = isLiked;

    try {
      console.log("Before handleLike, isLiked:", isLiked, "likeCount:", likeCount);
      let updatedPost: PostDTO;
      if (previousIsLiked) {
        updatedPost = await unlikePost(post.postId);
      } else {
        updatedPost = await likePost(post.postId, "LIKE");
      }
      console.log("API response:", updatedPost);
      // Update state based on API response with fallback
      setLikeCount(updatedPost.likeCount ?? previousLikeCount);
      setIsLiked(updatedPost.likedByCurrentUser ?? !previousIsLiked); // Fallback to toggle if undefined
      onUpdate({
        ...post,
        likeCount: updatedPost.likeCount ?? previousLikeCount,
        likedByCurrentUser: updatedPost.likedByCurrentUser ?? !previousIsLiked,
        currentUserReactionType: updatedPost.likedByCurrentUser ? "LIKE" : null,
      });
      console.log("After API call, likedByCurrentUser:", updatedPost.likedByCurrentUser, "likeCount:", updatedPost.likeCount);
    } catch (error) {
      // Revert to previous state on error
      setLikeCount(previousLikeCount);
      setIsLiked(previousIsLiked);
      onUpdate({
        ...post,
        likeCount: previousLikeCount,
        likedByCurrentUser: previousIsLiked,
        currentUserReactionType: previousIsLiked ? "LIKE" : null,
      });
      console.error("Failed to like/unlike post:", error);
      alert(previousIsLiked ? "Failed to unlike post. Please try again." : "Failed to like post. Please try again.");
    } finally {
      setIsLiking(false);
    }
  }, [likeCount, isLiked, post, onUpdate, isLiking]);

  const findCommentById = (id: string, comments: Comment[]): Comment | undefined => {
    for (const comment of comments) {
      if (comment.id === id) {
        return comment;
      }
      if (comment.replies) {
        const found = findCommentById(id, comment.replies);
        if (found) return found;
      }
    }
    return undefined;
  };

  const handleAddComment = useCallback(
    async (content: string, parentCommentId?: string) => {
      const trimmed = content.trim();
      if (!trimmed || !profile) return;

      if (parentCommentId) {
        const parentComment = findCommentById(parentCommentId, comments);
        if (parentComment?.parentCommentId) {
          alert("Replies to replies are not allowed.");
          return;
        }
      }

      const tempId = `temp-${Date.now()}`;
      const tempComment: Comment = {
        id: tempId,
        content: trimmed,
        createdAt: new Date(),
        user: profile,
        parentCommentId,
        replies: [],
      };

      if (parentCommentId) {
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === parentCommentId
              ? { ...comment, replies: [...(comment.replies || []), tempComment] }
              : comment
          )
        );
      } else {
        setComments((prevComments) => [...prevComments, tempComment]);
      }
      onUpdate({ ...post, commentCount: post.commentCount + 1 });
      if (parentCommentId) {
        setReplyContents((prev) => ({ ...prev, [parentCommentId]: "" }));
        setActiveReplyId(undefined);
      } else {
        setNewComment("");
      }

      try {
        const newCommentDTO: CommentDTO = await createComment(post.postId, trimmed, parentCommentId);
        const newComment: Comment = {
          id: newCommentDTO.commentId,
          content: newCommentDTO.content,
          createdAt: parseDate(newCommentDTO.createdAt),
          user: newCommentDTO.user || null,
          parentCommentId: newCommentDTO.parentCommentId,
          replies: [],
        };

        if (parentCommentId) {
          setComments((prevComments) =>
            prevComments.map((comment) =>
              comment.id === parentCommentId
                ? {
                    ...comment,
                    replies: comment.replies.map((r) => (r.id === tempId ? newComment : r)),
                  }
                : comment
            )
          );
        } else {
          setComments((prevComments) =>
            prevComments.map((c) => (c.id === tempId ? newComment : c))
          );
        }
      } catch (error) {
        setComments(comments);
        onUpdate({ ...post, commentCount: post.commentCount });
        alert("Failed to post comment. Please try again.");
      }
    },
    [post, comments, profile, onUpdate]
  );

  const handleReply = (id: string) => {
    setActiveReplyId(id);
    setTimeout(() => {
      replyInputRefs.current[id]?.focus();
    }, 0);
  };

  const handleCancelReply = (id: string) => {
    setActiveReplyId(undefined);
    setReplyContents((prev) => ({ ...prev, [id]: "" }));
  };

  const handleReplyChange = (id: string, value: string) => {
    setReplyContents((prev) => ({ ...prev, [id]: value }));
  };

  const handleReplyKeyDown = (e: KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const content = replyContents[id] || "";
      const parentComment = findCommentById(id, comments);
      if (parentComment) {
        handleAddComment(content, parentComment.id);
      }
    } else if (e.key === "Escape") {
      handleCancelReply(id);
    }
  };

  const handleShare = useCallback(() => {
    alert(`Share post ${post.postId}`);
  }, [post.postId]);

  const handleMoreOptions = useCallback(() => {
    alert(`More options for post ${post.postId}`);
  }, [post.postId]);

  const onCommentKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(newComment);
    }
  };

  const focusCommentInput = useCallback(() => {
    commentInputRef.current?.focus();
  }, []);

  const handleShowMoreComments = () => {
    setVisibleComments((prev) => prev + 3);
  };

  const handleShowReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: prev[commentId] ? prev[commentId] + 3 : 3,
    }));
  };

  const handleHideReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: 0,
    }));
  };

  const handleImageClick = (url: string) => {
    setZoomedImage(url);
  };

  const handleCloseZoom = () => {
    setZoomedImage(null);
  };

  const renderComment = (comment: Comment, level: number = 0) => {
    const visibleReplyCount = expandedReplies[comment.id] || 0;
    const hasMoreReplies = comment.replies && comment.replies.length > visibleReplyCount;
    const isReply = !!comment.parentCommentId;

    return (
      <div key={comment.id} className={`d-flex mb-3 ${level > 0 ? "ms-4" : ""}`}>
        <div className="me-2">
          <i className="icon-base bx bxs-user-circle fs-5 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-grow-1 px-2 pb-2 rounded">
          <small className="fw-bold">{comment.user?.name || "User"}</small>
          <p className="mb-1">{comment.content}</p>
          <small className="text-muted">
            {formatDateOnly(comment.createdAt)}
            {!isReply && (
              <button
                type="button"
                className="btn btn-link btn-sm text-primary p-0 ms-2"
                onClick={() => handleReply(comment.id)}
                aria-label={`Reply to ${comment.user?.name || "User"}'s comment`}
              >
                Reply
              </button>
            )}
            {!isReply && comment.replies && comment.replies.length > 0 && (
              <>
                {visibleReplyCount === 0 ? (
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-primary p-0 ms-2"
                    onClick={() => handleShowReplies(comment.id)}
                    aria-label={`Show ${comment.replies.length} replies`}
                  >
                    <i className="bx bx-chevron-down me-1"></i>Show {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-primary p-0 ms-2"
                    onClick={() => handleHideReplies(comment.id)}
                    aria-label="Hide replies"
                  >
                    <i className="bx bx-chevron-up me-1"></i>Hide replies
                  </button>
                )}
              </>
            )}
          </small>
          {!isReply && visibleReplyCount > 0 && comment.replies && (
            <div className="mt-2">
              {comment.replies.slice(0, visibleReplyCount).map((reply) => renderComment(reply, level + 1))}
              {hasMoreReplies && (
                <button
                  type="button"
                  className="btn btn-link btn-sm text-primary p-0"
                  onClick={() => handleShowReplies(comment.id)}
                  aria-label={`Show more replies for ${comment.user?.name || "User"}'s comment`}
                >
                  <i className="bx bx-chevron-down me-1"></i>Show {comment.replies.length - visibleReplyCount} more {comment.replies.length - visibleReplyCount === 1 ? "reply" : "replies"}
                </button>
              )}
            </div>
          )}
          {!isReply && activeReplyId === comment.id && (
            <div className="mt-2 d-flex align-items-center">
              <div className="me-2">
                <i className="icon-base bx bxs-user-circle fs-5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-grow-1">
                <input
                  ref={(el) => {
                    replyInputRefs.current[comment.id] = el;
                  }}
                  className="form-control form-control-sm"
                  placeholder={`Replying to ${comment.user?.name || "User"}...`}
                  value={replyContents[comment.id] || ""}
                  onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                  onKeyDown={(e) => handleReplyKeyDown(e, comment.id)}
                  aria-label={`Reply to ${comment.user?.name || "User"}`}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm ms-2"
                onClick={() => handleAddComment(replyContents[comment.id] || "", comment.id)}
                disabled={!replyContents[comment.id]?.trim()}
                aria-label="Post reply"
              >
                Post
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm ms-2"
                onClick={() => handleCancelReply(comment.id)}
                aria-label="Cancel reply"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const topLevelComments = comments.filter((comment) => !comment.parentCommentId);
  const hasMoreComments = topLevelComments.length > visibleComments;

  const maxVisibleImages = 4;
  const visibleImages = post.media ? post.media.slice(0, maxVisibleImages) : [];
  const remainingImageCount = post.media ? post.media.length - maxVisibleImages : 0;

  return (
    <div className="card h-100 shadow-lg rounded-3 mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <div className="me-2">
              <i className="icon-base bx bxs-user-circle fs-4 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h6 className="mb-0">{post.user?.name || "User"}</h6>
              <small className="text-muted">
                {formatDateOnly(post.createdAt)} | {post.privacy}
              </small>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-icon btn-outline-secondary btn-sm rounded-circle"
            onClick={handleMoreOptions}
            title="More options"
            aria-label="More options"
          >
            <i className="icon-base bx bx-dots-horizontal-rounded" aria-hidden="true" />
          </button>
        </div>

        <p className="card-text mb-3" style={{ whiteSpace: "pre-wrap" }}>
          {post.content}
        </p>

        {post.media && post.media.length > 0 && (
          <div className="mb-3">
            <div
              className={
                post.media.length === 1
                  ? "w-100"
                  : "d-grid gap-2"
              }
              style={
                post.media.length === 1
                  ? {}
                  : {
                      gridTemplateColumns: `repeat(${Math.min(visibleImages.length, 2)}, 1fr)`,
                    }
              }
            >
              {visibleImages.map((image, index) => (
                <div
                  key={index}
                  className="position-relative"
                  style={{
                    aspectRatio: "1",
                    overflow: "hidden",
                  }}
                  onClick={() => handleImageClick(image.url)}
                >
                  <img
                    src={image.url}
                    alt={image.caption || `Attachment ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                    className="rounded"
                    loading="lazy"
                  />
                  {image.caption && (
                    <div
                      className="position-absolute bottom-0 start-0 w-100 p-2 text-white"
                      style={{
                        background: "linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent)",
                      }}
                    >
                      <small>{image.caption}</small>
                    </div>
                  )}
                </div>
              ))}
              {remainingImageCount > 0 && (
                <div
                  className="position-relative d-flex align-items-center justify-content-center bg-secondary text-white rounded"
                  style={{
                    aspectRatio: "1",
                    cursor: "pointer",
                  }}
                  onClick={() => handleImageClick(post.media[maxVisibleImages].url)}
                >
                  <span className="fs-4">+{remainingImageCount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {zoomedImage && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex align-items-center justify-content-center"
            style={{ zIndex: 1050 }}
            onClick={handleCloseZoom}
          >
            <div className="position-relative">
              <img
                src={zoomedImage}
                alt="Zoomed image"
                style={{
                  maxWidth: "90%",
                  maxHeight: "90%",
                  objectFit: "contain",
                }}
                className="rounded"
              />
              {post.media?.find((img) => img.url === zoomedImage)?.caption && (
                <div
                  className="position-absolute bottom-0 start-0 w-100 p-3 text-white text-center"
                  style={{
                    background: "linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent)",
                  }}
                >
                  <small>{post.media.find((img) => img.url === zoomedImage)?.caption}</small>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-top pt-3 mt-3">
          <div className="d-flex w-100 gap-3 justify-content-start align-items-center mb-3">
            <button
              type="button"
              aria-label={isLiked ? "Unlike" : "Like"}
              className={`btn ${isLiked ? "btn-primary" : "btn-outline-secondary"} btn-sm d-flex align-items-center position-relative`}
              onClick={handleLike}
              disabled={isLiking}
              style={{
                transition: "all 0.3s ease",
              }}
            >
              {isLiking ? (
                <i
                  className="icon-base bx bx-loader-alt bx-spin me-1"
                  aria-hidden="true"
                />
              ) : (
                <i
                  className={`icon-base bx ${isLiked ? "bxs-like" : "bx-like"} me-1`}
                  aria-hidden="true"
                  style={{
                    transform: isLiked ? "scale(1.2)" : "scale(1)",
                    transition: "transform 0.2s ease",
                  }}
                />
              )}
              <span>
                {likeCount} {likeCount === 1 ? "Like" : "Likes"}
              </span>
            </button>

            <button
              type="button"
              aria-label="Comment"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center"
              onClick={focusCommentInput}
            >
              <i className="icon-base bx bx-comment me-1" aria-hidden="true" />
              <span>{comments.length} Comments</span>
            </button>

            <button
              type="button"
              aria-label="Share"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center"
              onClick={handleShare}
            >
              <i className="icon-base bx bx-share me-1" aria-hidden="true" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {topLevelComments.length > 0 && (
          <div className="mt-3 border-top pt-3">
            {topLevelComments.slice(0, visibleComments).map((comment) => renderComment(comment))}
            {hasMoreComments && (
              <button
                type="button"
                className="btn btn-link btn-sm text-primary p-0"
                onClick={handleShowMoreComments}
                aria-label={`Show more comments`}
              >
                <i className="bx bx-chevron-down me-1"></i>Show {topLevelComments.length - visibleComments} more {topLevelComments.length - visibleComments === 1 ? "comment" : "comments"}
              </button>
            )}
          </div>
        )}

        <div className="mt-3 d-flex align-items-center">
          <div className="me-2">
            <i className="icon-base bx bxs-user-circle fs-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-grow-1">
            <input
              id={`comment-input-${post.postId}`}
              ref={commentInputRef}
              className="form-control form-control-sm"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={onCommentKeyDown}
              aria-label="Write a comment"
            />
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm ms-2"
            onClick={() => handleAddComment(newComment)}
            disabled={!newComment.trim()}
            aria-label="Post comment"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;