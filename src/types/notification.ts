export type NotificationType =
  | 'assignment'
  | 'announcement'
  | 'quiz'
  | 'system';

export interface NotificationLink {
  screen: string;
  params?: Record<string, unknown>;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  link?: NotificationLink;
}

export type SearchResultType = 'case' | 'quiz' | 'announcement' | 'document';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  snippet?: string;
  thumbnailUrl?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName?: string;
  classId?: string;
  className?: string;
  createdAt: string;
}

