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
  privacy: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  replyToPostId?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
  media: MediaResponseDTO[];
  likedByCurrentUser: boolean;
  currentUserReactionType?: 'LIKE' | 'LOVE' | 'HAHA' | 'CARE' | 'SAD' | 'ANGRY' | null;
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

export async function createPost(userId: string, formData: FormData): Promise<PostDTO> {
  try {
    console.log('FormData contents:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `${value.name} (${value.type})` : value.toString());
    }

    const response: AxiosResponse<PostDTO> = await axiosInstance.post('/posts/create', formData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating post:', error);
    throw handleApiError(error, 'Failed to create post');
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
    const updatedPost = await getPostById(postId);
    console.log('Fetched updated post after like:', updatedPost);
    return updatedPost;
  } catch (err) {
    throw handleApiError(err, 'Failed to like post');
  }
};

export const unlikePost = async (postId: string): Promise<PostDTO> => {
  try {
    console.log('Sending unlike request for post:', postId);
    await axiosInstance.post(`/posts/${postId}/unlike`);
    const updatedPost = await getPostById(postId);
    console.log('Fetched updated post after unlike:', updatedPost);
    return updatedPost;
  } catch (err) {
    throw handleApiError(err, 'Failed to unlike post');
  }
};

export async function getUserPosts(userId: string, page: number = 0, size: number = 10): Promise<PostDTO[]> {
  try {
    const response: AxiosResponse<PostDTO[]> = await axiosInstance.get(`/posts/user/${userId}`, {
      params: { page, size },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Please log in to view posts.');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid user ID.');
    } else {
      console.error('Error fetching user posts:', error);
      throw handleApiError(error, 'Failed to fetch user posts');
    }
  }
}

export async function getPostById(postId: string): Promise<PostDTO> {
  try {
    const response: AxiosResponse<PostDTO> = await axiosInstance.get(`/posts/${postId}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Please log in to view this post.');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid post ID.');
    } else {
      console.error('Error fetching post:', error);
      throw handleApiError(error, 'Failed to fetch post');
    }
  }
}

export async function getCommentsByPostId(postId: string): Promise<CommentDTO[]> {
  try {
    const response: AxiosResponse<CommentDTO[]> = await axiosInstance.get(`/comments/post/${postId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    throw handleApiError(error, 'Failed to fetch comments');
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
  } catch (error: any) {
    console.error('Error creating comment:', error);
    throw handleApiError(error, 'Failed to create comment');
  }
}