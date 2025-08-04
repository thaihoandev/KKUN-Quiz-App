// notificationService.ts
import axios from 'axios';
import axiosInstance from './axiosInstance';

export interface NotificationDTO {
  notificationId: string;
  user?: { userId: string; name?: string; avatar?: string };
  actor?: { userId: string; name?: string; avatar?: string };
  verb: string;
  targetType: string;
  targetId: string;
  read: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export const getNotifications = async (params: { page: number; size: number; sort: string }): Promise<PaginatedResponse<NotificationDTO>> => {
  try {
    const response = await axiosInstance.get<PaginatedResponse<NotificationDTO>>('/notifications', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};