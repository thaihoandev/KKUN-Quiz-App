// notificationService.ts
import { PageResponse } from '@/interfaces';
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
  content: string;
}

export type NotificationQuery = {
  page: number;   // 0-based
  size: number;   // page size
  sort: string;   // e.g. "createdAt,desc"
};

export const getNotifications = async (
  params: NotificationQuery
): Promise<PageResponse<NotificationDTO>> => {
  try {
    const { data } = await axiosInstance.get<PageResponse<NotificationDTO>>(
      '/notifications',
      { params }
    );
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};
