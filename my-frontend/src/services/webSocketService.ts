import * as StompJs from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { PostDTO } from '@/services/postService';
import { NotificationDTO } from '@/services/notificationService';
import unknownAvatar from '@/assets/img/avatars/unknown.jpg';
interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  avatar?: string;
}

type PostUpdateCallback = (post: PostDTO) => void;
type NotificationCallback = (notification: Notification) => void;

export class WebSocketService {
  private client: StompJs.Client | null = null;
  private postUpdateCallbacks: Map<string, PostUpdateCallback[]> = new Map();
  private notificationCallbacks: NotificationCallback[] = [];
  private isConnected: boolean = false;
  private currentUserId: string | null = null;
  private notificationSubscription: StompJs.StompSubscription | null = null;

  constructor(currentUserId: string | null) {
    this.currentUserId = currentUserId;
    this.connect();
  }

  private connect() {
    const WS_ENDPOINT = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
    const socket = new SockJS(WS_ENDPOINT);
    this.client = new StompJs.Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      this.isConnected = true;
      this.postUpdateCallbacks.forEach((_, postId) => {
      });
      if (this.currentUserId) {
        this.subscribeToNotificationTopic(this.currentUserId);
      }
    };

    this.client.onStompError = (frame) => {
      console.error('WebSocket error:', frame.headers['message'], frame.body);
      this.isConnected = false;
    };

    this.client.onWebSocketClose = () => {
      console.error('WebSocket disconnected');
      this.isConnected = false;
    };

    this.client.activate();
  }

  private subscribeToNotificationTopic(userId: string) {
    if (this.client && this.isConnected) {
      this.notificationSubscription = this.client.subscribe(`/topic/notifications/user/${userId}`, (message) => {
        try {
          const notification: NotificationDTO = JSON.parse(message.body);
          const mappedNotification: Notification = {
            id: parseInt(notification.notificationId.split('-')[1], 10) || Date.now(),
            title: `<strong>${notification.actor?.name || 'Someone'}</strong> ${notification.verb} your ${notification.targetType} ${notification.content ? `: "<strong>${notification.content}</strong>"` : ''}.`,
            message: `<strong>${notification.actor?.name || 'Someone'}</strong> ${notification.verb} your ${notification.targetType} ${notification.content ? `: "<strong>${notification.content}</strong>"` : ''}.`,
            time: new Date(notification.createdAt).toLocaleTimeString(),
            avatar: notification.actor?.avatar || unknownAvatar,
          };
          this.notificationCallbacks.forEach((callback) => callback(mappedNotification));
          if (Notification.permission === 'granted') {
            new Notification(mappedNotification.message, {
              body: `Post ID: ${notification.targetId}`,
              icon: mappedNotification.avatar,
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                new Notification(mappedNotification.message, {
                  body: `Post ID: ${notification.targetId}`,
                  icon: mappedNotification.avatar,
                });
              }
            });
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      });
    } else {
      console.warn(`Cannot subscribe to /topic/notifications/user/${userId}: client not connected`);
    }
  }

  public registerNotificationCallback(callback: NotificationCallback) {
    if (!this.notificationCallbacks.includes(callback)) {
      this.notificationCallbacks.push(callback);
    }
  }

  public unregisterNotificationCallback(callback: NotificationCallback) {
    this.notificationCallbacks = this.notificationCallbacks.filter((cb) => cb !== callback);
  }

  public setUserId(userId: string | null) {
    this.currentUserId = userId;
    if (this.isConnected && this.client) {
      if (this.notificationSubscription) {
        this.notificationSubscription.unsubscribe();
        this.notificationSubscription = null;
      }
      if (userId) {
        this.subscribeToNotificationTopic(userId);
      }
    }
  }

  public disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.isConnected = false;
    }
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const webSocketService = new WebSocketService(null);

export const setWebSocketUserId = (userId: string | null) => {
  webSocketService.setUserId(userId);
};