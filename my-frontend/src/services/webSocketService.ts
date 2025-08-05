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
    console.log('Connecting to WebSocket endpoint:', WS_ENDPOINT);
    const socket = new SockJS(WS_ENDPOINT);
    this.client = new StompJs.Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('WebSocket connected successfully');
      this.isConnected = true;
      this.postUpdateCallbacks.forEach((_, postId) => {
        console.log('Re-subscribing to post topic:', postId);
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
      console.log(`Subscribing to notification topic: /topic/notifications/user/${userId}`);
      this.notificationSubscription = this.client.subscribe(`/topic/notifications/user/${userId}`, (message) => {
        try {
          const notification: NotificationDTO = JSON.parse(message.body);
          console.log('Received notification for userId:', userId, notification);
          const mappedNotification: Notification = {
            id: parseInt(notification.notificationId.split('-')[1], 10) || Date.now(),
            title: `<strong>${notification.actor?.name || 'Someone'}</strong> ${notification.verb} your ${notification.targetType} ${notification.content ? `: "<strong>${notification.content}</strong>"` : ''}.`,
            message: `<strong>${notification.actor?.name || 'Someone'}</strong> ${notification.verb} your ${notification.targetType} ${notification.content ? `: "<strong>${notification.content}</strong>"` : ''}.`,
            time: new Date(notification.createdAt).toLocaleTimeString(),
            avatar: notification.actor?.avatar || unknownAvatar,
          };
          console.log('Mapped notification:', notification);
          this.notificationCallbacks.forEach((callback) => callback(mappedNotification));
          if (Notification.permission === 'granted') {
            console.log('Showing browser notification:', mappedNotification.message);
            new Notification(mappedNotification.message, {
              body: `Post ID: ${notification.targetId}`,
              icon: mappedNotification.avatar,
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                console.log('Showing browser notification after permission granted:', mappedNotification.message);
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
    console.log('Registering notification callback');
    if (!this.notificationCallbacks.includes(callback)) {
      this.notificationCallbacks.push(callback);
    }
  }

  public unregisterNotificationCallback(callback: NotificationCallback) {
    console.log('Unregistering notification callback');
    this.notificationCallbacks = this.notificationCallbacks.filter((cb) => cb !== callback);
  }

  public setUserId(userId: string | null) {
    console.log('Setting WebSocket userId:', userId);
    this.currentUserId = userId;
    if (this.isConnected && this.client) {
      if (this.notificationSubscription) {
        console.log('Unsubscribing from previous notification topic');
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
      console.log('WebSocket service disconnected');
    }
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const webSocketService = new WebSocketService(null);

export const setWebSocketUserId = (userId: string | null) => {
  console.log('setWebSocketUserId called with userId:', userId);
  webSocketService.setUserId(userId);
};