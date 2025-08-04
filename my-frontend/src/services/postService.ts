import { AxiosResponse } from 'axios';
import axiosInstance from './axiosInstance';
import { UserDto } from '@/interfaces';
import { handleApiError } from '@/utils/apiErrorHandler';

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
  privacy?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  replyToPostId?: string;
  media?: MediaRequestDTO[];
}

export interface PostDTO {
  postId: string;
  user: UserDto | null;
  content: string;
  privacy: string;
  replyToPostId?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
  media: MediaResponseDTO[];
  likedByCurrentUser: boolean;
  currentUserReactionType?: 'LIKE' | 'LOVE' | 'HAHA' | 'CARE' | 'SAD' | 'ANGRY' | null;
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

export async function createPost(userId: string, formData: FormData): Promise<PostDTO> {
  try {
    console.log('FormData contents:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `${value.name} (${value.type})` : value.toString());
    }

    const response: AxiosResponse<PostDTO> = await axiosInstance.post('/posts/create', formData);
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw new Error('Failed to create post');
  }
}

export const likePost = async (postId: string, reactionType: string): Promise<PostDTO> => {
  try {
    console.log('Sending like request for post:', postId, 'with type:', reactionType);
    await axiosInstance.post(`/posts/${postId}/like`, `"${reactionType}"`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    // Fetch updated post to ensure correct data
    const updatedPost = await getPostById(postId);
    console.log('Fetched updated post after like:', updatedPost);
    return updatedPost;
  } catch (err) {
    handleApiError(err, `Failed to like post`);
    throw err;
  }
};

export const unlikePost = async (postId: string): Promise<PostDTO> => {
  try {
    console.log('Sending unlike request for post:', postId);
    await axiosInstance.post(`/posts/${postId}/unlike`);
    // Fetch updated post to ensure correct data
    const updatedPost = await getPostById(postId);
    console.log('Fetched updated post after unlike:', updatedPost);
    return updatedPost;
  } catch (err) {
    handleApiError(err, `Failed to unlike post`);
    throw err;
  }
};

export async function getUserPosts(userId: string, page: number = 0, size: number = 10): Promise<PostDTO[]> {
  try {
    const response: AxiosResponse<PostDTO[]> = await axiosInstance.get(`/posts/user/${userId}`, {
      params: { page, size },
    });
    console.log('User posts fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw new Error('Failed to fetch user posts');
  }
}

export async function getPostById(postId: string): Promise<PostDTO> {
  try {
    const response: AxiosResponse<PostDTO> = await axiosInstance.get(`/posts/${postId}`);
    console.log('Post fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw new Error('Failed to fetch post');
  }
}

export async function getCommentsByPostId(postId: string): Promise<CommentDTO[]> {
  try {
    const response: AxiosResponse<CommentDTO[]> = await axiosInstance.get(`/comments/post/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw new Error('Failed to fetch comments');
  }
}

export async function createComment(postId: string, content: string, parentCommentId?: string): Promise<CommentDTO> {
  try {
    const commentRequest: CommentRequestDTO = { postId, content, parentCommentId };
    console.log('Creating comment with request:', commentRequest);

    const response: AxiosResponse<CommentDTO> = await axiosInstance.post('/comments/create', commentRequest, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw new Error('Failed to create comment');
  }
}