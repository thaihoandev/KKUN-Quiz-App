import * as StompJs from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { PostDTO } from '@/services/postService';
import { NotificationDTO } from '@/services/notificationService';

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
        this.subscribeToPostTopic(postId);
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

  public subscribeToPost(postId: string, callback: PostUpdateCallback) {
    console.log(`Registering callback for postId: ${postId}`);
    if (!this.postUpdateCallbacks.has(postId)) {
      this.postUpdateCallbacks.set(postId, []);
      if (this.isConnected) {
        this.subscribeToPostTopic(postId);
      }
    }
    const callbacks = this.postUpdateCallbacks.get(postId)!;
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
    }
  }

  public unsubscribeFromPost(postId: string, callback: PostUpdateCallback) {
    console.log(`Unsubscribing callback for postId: ${postId}`);
    const callbacks = this.postUpdateCallbacks.get(postId);
    if (callbacks) {
      const updatedCallbacks = callbacks.filter((cb) => cb !== callback);
      if (updatedCallbacks.length === 0) {
        this.postUpdateCallbacks.delete(postId);
        if (this.isConnected && this.client) {
          this.client.unsubscribe(`/topic/posts/${postId}`);
          console.log(`Unsubscribed from topic: /topic/posts/${postId}`);
        }
      } else {
        this.postUpdateCallbacks.set(postId, updatedCallbacks);
      }
    }
  }

  private subscribeToPostTopic(postId: string) {
    if (this.client && this.isConnected) {
      console.log(`Subscribing to topic: /topic/posts/${postId}`);
      this.client.subscribe(`/topic/posts/${postId}`, (message) => {
        try {
          const updatedPost: PostDTO = JSON.parse(message.body);
          console.log('Received post update for postId:', postId, updatedPost);
          const callbacks = this.postUpdateCallbacks.get(postId) || [];
          callbacks.forEach((callback) => callback(updatedPost));
          this.handlePostUpdateNotification(updatedPost, postId);
        } catch (error) {
          console.error('Error parsing post update:', error);
        }
      });
    } else {
      console.warn(`Cannot subscribe to /topic/posts/${postId}: client not connected`);
    }
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
            title: `${notification.actor?.name || 'Someone'} ${notification.verb} your ${notification.targetType}`,
            message: `${notification.actor?.name || 'Someone'} ${notification.verb} your ${notification.targetType}.`,
            time: new Date(notification.createdAt).toLocaleTimeString(),
            avatar: notification.actor?.avatar || '/default-avatar.png',
          };
          console.log('Mapped notification:', mappedNotification);
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

  private handlePostUpdateNotification(post: PostDTO, postId: string) {
    console.log('Checking post update notification for postId:', postId, 'currentUserId:', this.currentUserId, 'post.user?.userId:', post.user?.userId);
    if (this.currentUserId && post.user?.userId === this.currentUserId) {
      const notification: Notification = {
        id: parseInt(`${postId}-${Date.now()}`, 10) || Date.now(),
        title: `${post.actingUser?.name || 'Someone'} ${post.likedByCurrentUser ? 'liked' : 'unliked'} your post`,
        message: `${post.actingUser?.name || 'Someone'} ${post.likedByCurrentUser ? 'liked' : 'unliked'} your post.`,
        time: new Date().toLocaleTimeString(),
        avatar: post.actingUser?.avatar || '/default-avatar.png',
      };
      console.log('Generated post update notification:', notification);
      this.notificationCallbacks.forEach((callback) => callback(notification));
    } else {
      console.log('Post update notification skipped: post not owned by current user');
    }
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