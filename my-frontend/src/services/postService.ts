import { AxiosResponse } from 'axios';
import axiosInstance from './axiosInstance';
import { UserDto } from '@/interfaces';

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
  user: UserDto;
  content: string;
  privacy: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  replyToPostId?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
  media: MediaResponseDTO[];
}

export interface CommentRequestDTO {
  postId: string;
  content: string;
  parentCommentId?: string; // Thêm parentCommentId
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

export async function likePost(postId: string, reactionType: 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY'): Promise<void> {
  try {
    await axiosInstance.post(`/posts/${postId}/like`, { type: reactionType }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error liking post:', error);
    throw new Error('Failed to like post');
  }
}

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