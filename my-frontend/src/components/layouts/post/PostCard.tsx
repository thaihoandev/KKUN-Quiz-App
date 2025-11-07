import { formatDateOnly, parseDate } from "@/utils/dateUtils";
import { UserDto } from "@/interfaces";
import { useState, useRef, useCallback, KeyboardEvent, useEffect } from "react";
import {
  createComment,
  getCommentsByPostId,
  likePost,
  PostDTO,
  CommentDTO,
  getPostById,
  unlikePost,
} from "@/services/postService";
import Modal from "react-bootstrap/Modal";
import unknownAvatar from "@/assets/img/avatars/unknown.jpg";
import { Link } from "react-router-dom";

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
  currentUser?: UserDto | null;
  onUpdate: (updatedPost: PostDTO) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  profile,
  currentUser,
  onUpdate,
}) => {
  const [newComment, setNewComment] = useState("");
  const [replyContents, setReplyContents] = useState<{ [id: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiked, setIsLiked] = useState(post.likedByCurrentUser);
  const [isLiking, setIsLiking] = useState(false);
  const [visibleComments, setVisibleComments] = useState(3);
  const [expandedReplies, setExpandedReplies] = useState<{ [id: string]: number }>({});
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const replyInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.body.classList.contains("dark-mode"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const commentingUser = currentUser || profile;

  // Fetch post data on mount
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const updatedPost = await getPostById(post.postId);
        setLikeCount(updatedPost.likeCount);
        setIsLiked(updatedPost.likedByCurrentUser ?? false);
        onUpdate(updatedPost);
      } catch (error) {
        console.error("Failed to fetch post data:", error);
      }
    };
    fetchPost();
  }, [post.postId, onUpdate]);

  // Sync local like state with prop changes
  useEffect(() => {
    setLikeCount(post.likeCount);
    setIsLiked(post.likedByCurrentUser ?? false);
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
            createdAt: parseDate(dto.createdAt),
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
      let updatedPost: PostDTO;
      if (previousIsLiked) {
        updatedPost = await unlikePost(post.postId);
      } else {
        updatedPost = await likePost(post.postId, "LIKE");
      }
      setLikeCount(updatedPost.likeCount ?? previousLikeCount);
      setIsLiked(updatedPost.likedByCurrentUser ?? !previousIsLiked);
      onUpdate({
        ...post,
        likeCount: updatedPost.likeCount ?? previousLikeCount,
        likedByCurrentUser: updatedPost.likedByCurrentUser ?? !previousIsLiked,
        currentUserReactionType: updatedPost.likedByCurrentUser ? "LIKE" : null,
      });
    } catch (error) {
      setLikeCount(previousLikeCount);
      setIsLiked(previousIsLiked);
      onUpdate({
        ...post,
        likeCount: previousLikeCount,
        likedByCurrentUser: previousIsLiked,
        currentUserReactionType: previousIsLiked ? "LIKE" : null,
      });
      console.error("Failed to like/unlike post:", error);
      alert(
        previousIsLiked
          ? "Failed to unlike post. Please try again."
          : "Failed to like post. Please try again."
      );
    } finally {
      setIsLiking(false);
    }
  }, [likeCount, isLiked, post, onUpdate, isLiking]);

  const findCommentById = (id: string, comments: Comment[]): Comment | undefined => {
    for (const comment of comments) {
      if (comment.id === id) return comment;
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
      if (!trimmed || !commentingUser) return;

      if (parentCommentId) {
        const parentComment = findCommentById(parentCommentId, comments);
        if (parentComment?.parentCommentId) {
          alert("Replies to replies are not allowed.");
          return;
        }
      }

      if (parentCommentId) {
        setReplyContents((prev) => ({ ...prev, [parentCommentId]: "" }));
        setActiveReplyId(undefined);
      } else {
        setNewComment("");
      }

      const tempId = `temp-${Date.now()}`;
      const tempComment: Comment = {
        id: tempId,
        content: trimmed,
        createdAt: new Date(),
        user: commentingUser,
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

      try {
        const newCommentDTO: CommentDTO = await createComment(
          post.postId,
          trimmed,
          parentCommentId
        );
        const parsed = newCommentDTO.createdAt ? parseDate(newCommentDTO.createdAt) : null;
        const finalCreatedAt =
          parsed && !isNaN(parsed.getTime()) ? parsed : tempComment.createdAt;

        const newComment: Comment = {
          id: newCommentDTO.commentId,
          content: newCommentDTO.content,
          createdAt: finalCreatedAt,
          user: newCommentDTO.user || commentingUser,
          parentCommentId: newCommentDTO.parentCommentId,
          replies: [],
        };

        if (parentCommentId) {
          setComments((prevComments) =>
            prevComments.map((comment) =>
              comment.id === parentCommentId
                ? {
                    ...comment,
                    replies: comment.replies.map((r) =>
                      r.id === tempId ? newComment : r
                    ),
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
        if (parentCommentId) {
          setComments((prevComments) =>
            prevComments.map((comment) =>
              comment.id === parentCommentId
                ? {
                    ...comment,
                    replies: comment.replies.filter((r) => r.id !== tempId),
                  }
                : comment
            )
          );
        } else {
          setComments((prevComments) => prevComments.filter((c) => c.id !== tempId));
        }
        onUpdate({ ...post, commentCount: post.commentCount - 1 });
        alert("Failed to post comment. Please try again.");
        console.error("Failed to post comment:", error);
      }
    },
    [post, comments, commentingUser, onUpdate]
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
      [commentId]: comments.find((c) => c.id === commentId)?.replies.length || 0,
    }));
  };

  const handleHideReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: 0,
    }));
  };

  const handleImageClick = (index: number) => {
    setZoomedImageIndex(index);
  };

  const handleCloseZoom = () => {
    setZoomedImageIndex(null);
  };

  const handleNextImage = () => {
    if (
      post.media &&
      zoomedImageIndex !== null &&
      zoomedImageIndex < post.media.length - 1
    ) {
      setZoomedImageIndex(zoomedImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (zoomedImageIndex !== null && zoomedImageIndex > 0) {
      setZoomedImageIndex(zoomedImageIndex - 1);
    }
  };

  const renderComment = (comment: Comment, level: number = 0) => {
    const visibleReplyCount = expandedReplies[comment.id] || 0;
    const hasMoreReplies =
      comment.replies && comment.replies.length > visibleReplyCount;
    const isReply = !!comment.parentCommentId;

    const UserWrapper: React.FC<{ children: React.ReactNode }> = ({
      children,
    }) =>
      comment.user?.userId ? (
        <Link
          to={`/profile/${comment.user.userId}`}
          className="d-flex align-items-start text-decoration-none"
          style={{ color: "var(--text-color)", transition: "color 0.25s ease" }}
        >
          {children}
        </Link>
      ) : (
        <div className="d-flex align-items-start">{children}</div>
      );

    return (
      <div
        key={comment.id}
        className={`d-flex mb-3 ${level > 0 ? "ms-4 reply-container" : ""}`}
        style={
          isReply
            ? {
                borderLeft: "2px solid var(--border-color)",
                paddingLeft: "1rem",
              }
            : {}
        }
      >
        <div className="me-2">
          <UserWrapper>
            {comment.user?.avatar ? (
              <img
                src={comment.user.avatar}
                alt={`${comment.user.name || "User"}'s avatar`}
                className="rounded-circle"
                style={{
                  width: "24px",
                  height: "24px",
                  objectFit: "cover",
                  border: "2px solid var(--border-color)",
                }}
                onError={(e) => {
                  e.currentTarget.src = unknownAvatar;
                }}
              />
            ) : (
              <i
                className="bx bxs-user-circle fs-5"
                style={{ color: "var(--primary-color)" }}
                aria-hidden="true"
              />
            )}
          </UserWrapper>
        </div>
        <div className="flex-grow-1 px-2 pb-2 rounded">
          <UserWrapper>
            <small style={{ fontWeight: 600, color: "var(--text-color)" }}>
              {comment.user?.name || "User"}
            </small>
          </UserWrapper>
          <p
            className="mb-1"
            style={{
              color: "var(--text-color)",
              transition: "color 0.25s ease",
            }}
          >
            {comment.content}
          </p>
          <small
            style={{
              color: "var(--text-muted)",
              transition: "color 0.25s ease",
            }}
          >
            {formatDateOnly(comment.createdAt)}
            {!isReply && (
              <button
                type="button"
                className="btn btn-link btn-sm text-primary p-0 ms-2"
                style={{
                  color: "var(--primary-color)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
                onClick={() => handleReply(comment.id)}
                aria-label={`Reply to ${comment.user?.name || "User"}'s comment`}
              >
                Reply
              </button>
            )}
            {!isReply && comment.replies && comment.replies.length > 0 && (
              <>
                {visibleReplyCount > 0 ? (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 ms-2"
                    style={{
                      color: "var(--primary-color)",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                    onClick={() => handleHideReplies(comment.id)}
                    aria-label="Hide replies"
                  >
                    <i className="bx bx-chevron-up me-1"></i>Hide replies
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 ms-2"
                    style={{
                      color: "var(--primary-color)",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                    onClick={() => handleShowReplies(comment.id)}
                    aria-label={`Show ${comment.replies.length} replies`}
                  >
                    <i className="bx bx-chevron-down me-1"></i>
                    Show {comment.replies.length}{" "}
                    {comment.replies.length === 1 ? "reply" : "replies"}
                  </button>
                )}
              </>
            )}
          </small>
          {!isReply && visibleReplyCount > 0 && comment.replies && (
            <div className="mt-2">
              {comment.replies
                .slice(0, visibleReplyCount)
                .map((reply) => renderComment(reply, level + 1))}
              {hasMoreReplies && (
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0"
                  style={{
                    color: "var(--primary-color)",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                  onClick={() => handleShowReplies(comment.id)}
                  aria-label={`Show more replies for ${
                    comment.user?.name || "User"
                  }'s comment`}
                >
                  <i className="bx bx-chevron-down me-1"></i>
                  Show {comment.replies.length - visibleReplyCount} more{" "}
                  {comment.replies.length - visibleReplyCount === 1
                    ? "reply"
                    : "replies"}
                </button>
              )}
            </div>
          )}
          {!isReply && activeReplyId === comment.id && (
            <div className="mt-2 d-flex align-items-center gap-2">
              <div>
                {commentingUser?.avatar ? (
                  <img
                    src={commentingUser.avatar}
                    alt={`${commentingUser.name || "User"}'s avatar`}
                    className="rounded-circle"
                    style={{
                      width: "24px",
                      height: "24px",
                      objectFit: "cover",
                      border: "2px solid var(--border-color)",
                    }}
                    onError={(e) => {
                      e.currentTarget.src = unknownAvatar;
                    }}
                  />
                ) : (
                  <i
                    className="bx bxs-user-circle fs-5"
                    style={{ color: "var(--primary-color)" }}
                    aria-hidden="true"
                  />
                )}
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
                  style={{
                    background: "var(--surface-alt)",
                    color: "var(--text-color)",
                    border: "2px solid var(--border-color)",
                    borderRadius: "12px",
                    transition: "all 0.25s ease",
                  }}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  handleAddComment(replyContents[comment.id] || "", comment.id)
                }
                disabled={!replyContents[comment.id]?.trim()}
                aria-label="Post reply"
                style={{
                  borderRadius: "12px",
                  fontWeight: 600,
                  padding: "0.375rem 0.75rem",
                }}
              >
                Post
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleCancelReply(comment.id)}
                aria-label="Cancel reply"
                style={{
                  borderRadius: "12px",
                  fontWeight: 600,
                  padding: "0.375rem 0.75rem",
                }}
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
    <div
      className="card h-100 shadow-lg rounded-3 mb-4"
      style={{
        background: "var(--surface-color)",
        border: "2px solid var(--border-color)",
        borderRadius: "14px",
        overflow: "hidden",
        transition: "all 0.25s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--hover-shadow)";
        e.currentTarget.style.borderColor = "var(--primary-color)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--card-shadow)";
        e.currentTarget.style.borderColor = "var(--border-color)";
      }}
    >
      <div className="card-body">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="mb-3">
            <Link
              to={`/profile/${post.user?.userId}`}
              className="d-flex align-items-center text-decoration-none"
              style={{
                cursor: "pointer",
                color: "var(--text-color)",
                transition: "color 0.25s ease",
              }}
            >
              <div className="me-2 flex-shrink-0">
                {post.user?.avatar ? (
                  <img
                    src={post.user.avatar}
                    alt={`${post.user.name || "User"}'s avatar`}
                    className="rounded-circle"
                    style={{
                      width: "32px",
                      height: "32px",
                      objectFit: "cover",
                      border: "2px solid var(--border-color)",
                    }}
                    onError={(e) => {
                      e.currentTarget.src = unknownAvatar;
                    }}
                  />
                ) : (
                  <i
                    className="bx bxs-user-circle fs-4"
                    style={{ color: "var(--primary-color)" }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div>
                <p
                  className="mb-0 fw-semibold"
                  style={{ color: "var(--text-color)" }}
                >
                  {post.user?.name || "User"}
                </p>
                <small
                  style={{
                    color: "var(--text-muted)",
                    transition: "color 0.25s ease",
                  }}
                >
                  {formatDateOnly(post.createdAt)} &middot; {post.privacy}
                </small>
              </div>
            </Link>
          </div>
          <button
            type="button"
            className="btn btn-sm rounded-circle"
            onClick={handleMoreOptions}
            title="More options"
            aria-label="More options"
            style={{
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--surface-alt)",
              color: "var(--text-light)",
              border: "2px solid var(--border-color)",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--primary-color)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface-alt)";
              e.currentTarget.style.color = "var(--text-light)";
            }}
          >
            <i className="bx bx-dots-horizontal-rounded" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <p
          className="card-text mb-3"
          style={{
            whiteSpace: "pre-wrap",
            color: "var(--text-color)",
            transition: "color 0.25s ease",
          }}
        >
          {post.content}
        </p>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className="mb-3">
            <div
              className={
                post.media.length === 1 ? "d-flex justify-content-center" : "d-grid gap-2"
              }
              style={
                post.media.length === 1
                  ? { maxWidth: "50%", margin: "0 auto" }
                  : {
                      gridTemplateColumns: `repeat(${Math.min(
                        visibleImages.length,
                        2
                      )}, 1fr)`,
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
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                  onClick={() => handleImageClick(index)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.caption || `Attachment ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
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
                  className="position-relative d-flex align-items-center justify-content-center rounded"
                  style={{
                    aspectRatio: "1",
                    cursor: "pointer",
                    background: "var(--primary-color)20",
                    color: "var(--primary-color)",
                    transition: "all 0.25s ease",
                    border: "2px solid var(--border-color)",
                  }}
                  onClick={() => handleImageClick(maxVisibleImages)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--primary-color)40";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--primary-color)20";
                  }}
                >
                  <span className="fs-4">+{remainingImageCount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Modal */}
        {zoomedImageIndex !== null && post.media && (
          <Modal
            show={zoomedImageIndex !== null}
            onHide={handleCloseZoom}
            size="xl"
            centered
            style={{
              backdropFilter: "blur(10px)",
              backgroundColor: "rgba(0, 0, 0, 0.85)",
            }}
          >
            <Modal.Body style={{ background: "transparent", border: "none" }}>
              <div style={{ position: "relative", textAlign: "center" }}>
                <img
                  src={post.media[zoomedImageIndex].url}
                  alt={`View ${zoomedImageIndex + 1}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "maxHeight:80vh",
                    objectFit: "contain",
                    borderRadius: "12px",
                  }}
                />
                {post.media.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      disabled={zoomedImageIndex === 0}
                      style={{
                        position: "absolute",
                        left: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "var(--surface-color)",
                        border: "2px solid var(--border-color)",
                        borderRadius: "50%",
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: zoomedImageIndex === 0 ? "not-allowed" : "pointer",
                        opacity: zoomedImageIndex === 0 ? 0.5 : 1,
                        transition: "all 0.25s ease",
                        color: "var(--text-color)",
                      }}
                      onMouseEnter={(e) => {
                        if (zoomedImageIndex !== 0) {
                          e.currentTarget.style.background = "var(--primary-color)";
                          e.currentTarget.style.color = "white";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--surface-color)";
                        e.currentTarget.style.color = "var(--text-color)";
                      }}
                    >
                      <i className="bx bx-chevron-left fs-4" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      disabled={zoomedImageIndex === post.media.length - 1}
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "var(--surface-color)",
                        border: "2px solid var(--border-color)",
                        borderRadius: "50%",
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor:
                          zoomedImageIndex === post.media.length - 1
                            ? "not-allowed"
                            : "pointer",
                        opacity: zoomedImageIndex === post.media.length - 1 ? 0.5 : 1,
                        transition: "all 0.25s ease",
                        color: "var(--text-color)",
                      }}
                      onMouseEnter={(e) => {
                        if (zoomedImageIndex !== post.media.length - 1) {
                          e.currentTarget.style.background = "var(--primary-color)";
                          e.currentTarget.style.color = "white";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--surface-color)";
                        e.currentTarget.style.color = "var(--text-color)";
                      }}
                    >
                      <i className="bx bx-chevron-right fs-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={handleCloseZoom}
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    background: "var(--surface-color)",
                    border: "2px solid var(--border-color)",
                    borderRadius: "50%",
                    width: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    color: "var(--text-color)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--danger-color)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--surface-color)";
                    e.currentTarget.style.color = "var(--text-color)";
                  }}
                >
                  <i className="bx bx-x fs-4" />
                </button>
                {post.media[zoomedImageIndex].caption && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "1rem",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "var(--overlay-color)",
                      backdropFilter: "blur(10px)",
                      padding: "1rem 2rem",
                      borderRadius: "12px",
                      color: "white",
                      maxWidth: "80%",
                      textAlign: "center",
                    }}
                  >
                    {post.media[zoomedImageIndex].caption}
                  </div>
                )}
              </div>
            </Modal.Body>
          </Modal>
        )}

        {/* Actions */}
        <div
          className="border-top pt-3 mt-3"
          style={{ borderTopColor: "var(--border-color) !important" }}
        >
          <div className="d-flex w-100 gap-3 justify-content-start align-items-center mb-3">
            <button
              type="button"
              aria-label={isLiked ? "Unlike" : "Like"}
              className="btn btn-sm d-flex align-items-center position-relative"
              onClick={handleLike}
              disabled={isLiking}
              style={{
                background: isLiked ? "var(--gradient-primary)" : "var(--surface-alt)",
                color: isLiked ? "white" : "var(--text-color)",
                border: `2px solid ${isLiked ? "transparent" : "var(--border-color)"}`,
                borderRadius: "12px",
                fontWeight: 600,
                padding: "0.5rem 1rem",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                if (!isLiked) {
                  e.currentTarget.style.borderColor = "var(--primary-color)";
                  e.currentTarget.style.color = "var(--primary-color)";
                } else {
                  e.currentTarget.style.boxShadow = "var(--hover-shadow)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLiked) {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.color = "var(--text-color)";
                } else {
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {isLiking ? (
                <i className="bx bx-loader-alt bx-spin me-1" aria-hidden="true" />
              ) : (
                <i
                  className={`bx ${isLiked ? "bxs-like" : "bx-like"} me-1`}
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
              className="btn btn-sm d-flex align-items-center"
              onClick={focusCommentInput}
              style={{
                background: "var(--surface-alt)",
                color: "var(--text-color)",
                border: "2px solid var(--border-color)",
                borderRadius: "12px",
                fontWeight: 600,
                padding: "0.5rem 1rem",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary-color)";
                e.currentTarget.style.color = "var(--primary-color)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.color = "var(--text-color)";
              }}
            >
              <i className="bx bx-comment me-1" aria-hidden="true" />
              <span>{post.commentCount} Comments</span>
            </button>
            <button
              type="button"
              aria-label="Share"
              className="btn btn-sm d-flex align-items-center"
              onClick={handleShare}
              style={{
                background: "var(--surface-alt)",
                color: "var(--text-color)",
                border: "2px solid var(--border-color)",
                borderRadius: "12px",
                fontWeight: 600,
                padding: "0.5rem 1rem",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary-color)";
                e.currentTarget.style.color = "var(--primary-color)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.color = "var(--text-color)";
              }}
            >
              <i className="bx bx-share me-1" aria-hidden="true" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {topLevelComments.length > 0 && (
          <div
            className="mt-3 border-top pt-3"
            style={{ borderTopColor: "var(--border-color)" }}
          >
            {topLevelComments
              .slice(0, visibleComments)
              .map((comment) => renderComment(comment))}
            {hasMoreComments && (
              <button
                type="button"
                className="btn btn-link btn-sm p-0"
                style={{
                  color: "var(--primary-color)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
                onClick={handleShowMoreComments}
                aria-label={`Show more comments`}
              >
                <i className="bx bx-chevron-down me-1"></i>Show{" "}
                {topLevelComments.length - visibleComments} more{" "}
                {topLevelComments.length - visibleComments === 1
                  ? "comment"
                  : "comments"}
              </button>
            )}
          </div>
        )}

        {/* Comment Input */}
        <div className="mt-3 d-flex align-items-center gap-2">
          <div>
            {commentingUser?.avatar ? (
              <img
                src={commentingUser.avatar}
                alt={`${commentingUser.name || "User"}'s avatar`}
                className="rounded-circle"
                style={{
                  width: "32px",
                  height: "32px",
                  objectFit: "cover",
                  border: "2px solid var(--border-color)",
                }}
                onError={(e) => {
                  e.currentTarget.src = unknownAvatar;
                }}
              />
            ) : (
              <i
                className="bx bxs-user-circle fs-4"
                style={{ color: "var(--primary-color)" }}
                aria-hidden="true"
              />
            )}
          </div>
          <div className="flex-grow-1">
            <input
              id={`comment-input-${post.postId}`}
              ref={commentInputRef}
              className="form-control"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={onCommentKeyDown}
              aria-label="Write a comment"
              style={{
                background: "var(--surface-alt)",
                color: "var(--text-color)",
                border: "2px solid var(--border-color)",
                borderRadius: "12px",
                transition: "all 0.25s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--primary-color)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(96, 165, 250, 0.2)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleAddComment(newComment)}
            disabled={!newComment.trim()}
            aria-label="Post comment"
            style={{
              borderRadius: "12px",
              fontWeight: 600,
              padding: "0.5rem 1.25rem",
              background: newComment.trim()
                ? "var(--gradient-primary)"
                : "var(--surface-alt)",
              color: newComment.trim() ? "white" : "var(--text-muted)",
              border: "none",
              transition: "all 0.25s ease",
            }}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;