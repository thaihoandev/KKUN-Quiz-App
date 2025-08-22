import { AxiosResponse } from "axios";
import axiosInstance from "./axiosInstance";
import { UserDto, PageResponse } from "@/interfaces";
import { handleApiError } from "@/utils/apiErrorHandler";

/* ======================= Types ======================= */

export interface MediaRequestDTO {
  mimeType: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  caption?: string;
  isCover?: boolean;
}

export interface MediaResponseDTO {
  mediaId?: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  caption?: string;
  isCover?: boolean;
}

export interface PostRequestDTO {
  content: string;
  privacy?: "PUBLIC" | "FRIENDS" | "PRIVATE";
  replyToPostId?: string;
  media?: MediaRequestDTO[];
}

export interface PostDTO {
  postId: string;
  user: UserDto | null;
  content: string;
  privacy: "PUBLIC" | "FRIENDS" | "PRIVATE";
  replyToPostId?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
  media: MediaResponseDTO[];
  likedByCurrentUser: boolean; // backend field is isLikedByCurrentUser -> serialized thành likedByCurrentUser
  currentUserReactionType?: "LIKE" | "LOVE" | "HAHA" | "CARE" | "SAD" | "ANGRY" | null;
  actingUser?: UserDto | null;
}

export interface CommentRequestDTO {
  postId: string;
  content: string;
  parentCommentId?: string;
}

export interface CommentDTO {
  commentId: string;
  content: string;
  createdAt: string;
  userId: string;
  postId: string;
  user: UserDto;
  parentCommentId?: string;
  replies?: CommentDTO[];
}

/* ======================= Helpers ======================= */

type PageParams = {
  page?: number; // 0-based
  size?: number;
  sort?: string; // ví dụ "createdAt,desc" hoặc "likeCount,asc"
};

/* ======================= Posts ======================= */

export async function createPost(userId: string, formData: FormData): Promise<PostDTO> {
  try {
    // Debug form data nếu cần
    // for (const [key, value] of formData.entries()) {
    //   console.log(`${key}:`, value instanceof File ? `${value.name} (${value.type})` : value.toString());
    // }

    const response: AxiosResponse<PostDTO> = await axiosInstance.post("/posts/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    throw handleApiError(error, "Failed to create post");
  }
}

export const likePost = async (postId: string, reactionType: string): Promise<PostDTO> => {
  try {
    // gửi JSON string (Spring sẽ bind vào enum ReactionType)
    await axiosInstance.post(`/posts/${postId}/like`, `"${reactionType}"`, {
      headers: { "Content-Type": "application/json" },
    });
    return await getPostById(postId);
  } catch (err) {
    throw handleApiError(err, "Failed to like post");
  }
};

export const unlikePost = async (postId: string): Promise<PostDTO> => {
  try {
    await axiosInstance.post(`/posts/${postId}/unlike`);
    return await getPostById(postId);
  } catch (err) {
    throw handleApiError(err, "Failed to unlike post");
  }
};

/**
 * Lấy bài viết của 1 user (Page<PostDTO>)
 * Backend: GET /api/posts/user/{userId}?page=&size=&sort=
 */
export async function getUserPosts(
  userId: string,
  params: PageParams = { page: 0, size: 10, sort: "createdAt,desc" }
): Promise<PageResponse<PostDTO>> {
  try {
    const response: AxiosResponse<PageResponse<PostDTO>> = await axiosInstance.get(
      `/posts/user/${userId}`,
      { params }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Please log in to view posts.");
    } else if (error.response?.status === 400) {
      throw new Error("Invalid user ID.");
    }
    throw handleApiError(error, "Failed to fetch user posts");
  }
}

/**
 * Lấy bài viết PUBLIC (Page<PostDTO>)
 * Backend: GET /api/posts/public?page=&size=&sort=
 * (nếu đã đăng nhập, backend có thể personalize likedByCurrentUser)
 */
export async function getPublicPosts(
  params: PageParams = { page: 0, size: 10, sort: "createdAt,desc" }
): Promise<PageResponse<PostDTO>> {
  try {
    const response: AxiosResponse<PageResponse<PostDTO>> = await axiosInstance.get("/posts/public", {
      params,
    });
    return response.data;
  } catch (error: any) {
    throw handleApiError(error, "Failed to fetch public posts");
  }
}

/**
 * Lấy bài viết từ bạn bè (Page<PostDTO>)
 * Backend: GET /api/posts/friends?page=&size=&sort=
 * (yêu cầu đã đăng nhập)
 */
export async function getFriendsPosts(
  params: PageParams = { page: 0, size: 10, sort: "createdAt,desc" }
): Promise<PageResponse<PostDTO>> {
  try {
    const response: AxiosResponse<PageResponse<PostDTO>> = await axiosInstance.get("/posts/friends", {
      params,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Please log in to view friends' posts.");
    }
    throw handleApiError(error, "Failed to fetch friends' posts");
  }
}

export async function getPostById(postId: string): Promise<PostDTO> {
  try {
    const response: AxiosResponse<PostDTO> = await axiosInstance.get(`/posts/${postId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Please log in to view this post.");
    } else if (error.response?.status === 400) {
      throw new Error("Invalid post ID.");
    }
    throw handleApiError(error, "Failed to fetch post");
  }
}

/* ======================= Comments ======================= */

export async function getCommentsByPostId(postId: string): Promise<CommentDTO[]> {
  try {
    const response: AxiosResponse<CommentDTO[]> = await axiosInstance.get(`/comments/post/${postId}`);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error, "Failed to fetch comments");
  }
}

export async function createComment(
  postId: string,
  content: string,
  parentCommentId?: string
): Promise<CommentDTO> {
  try {
    const commentRequest: CommentRequestDTO = { postId, content, parentCommentId };
    const response: AxiosResponse<CommentDTO> = await axiosInstance.post("/comments/create", commentRequest, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    throw handleApiError(error, "Failed to create comment");
  }
}
