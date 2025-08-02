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

export async function createPost(userId: string, formData: FormData): Promise<PostDTO> {
  try {
    // Log FormData for debugging
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

export async function getUserPosts(userId: string): Promise<PostDTO[]> {
  try {
    const response: AxiosResponse<PostDTO[]> = await axiosInstance.get(`/posts/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw new Error('Failed to fetch user posts');
  }
}