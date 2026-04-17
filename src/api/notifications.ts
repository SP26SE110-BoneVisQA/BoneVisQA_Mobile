import { api } from './client';
import type { AppNotification, NotificationType } from '../types/notification';

interface NotificationDtoRaw {
  id: string;
  userId?: string;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  targetUrl?: string | null;
  isRead: boolean;
  createdAt?: string | null;
}

const knownTypes: readonly NotificationType[] = [
  'assignment',
  'announcement',
  'quiz',
  'system',
];

function normalizeType(raw: string | null | undefined): NotificationType {
  if (!raw) {
    return 'system';
  }
  const lowered = raw.toLowerCase();
  const match = knownTypes.find((t) => lowered.includes(t));
  return match ?? 'system';
}

function parseTargetUrl(
  url: string | null | undefined,
): AppNotification['link'] {
  if (!url) {
    return undefined;
  }
  // Backend may return "app://screen/param" or a path like "/quiz/123".
  // We keep it simple: screen + raw url for higher layers to route.
  return { screen: url };
}

function mapNotification(dto: NotificationDtoRaw): AppNotification {
  return {
    id: dto.id,
    type: normalizeType(dto.type ?? undefined),
    title: dto.title ?? '',
    body: dto.message ?? '',
    isRead: Boolean(dto.isRead),
    createdAt: dto.createdAt ?? new Date().toISOString(),
    link: parseTargetUrl(dto.targetUrl),
  };
}

export async function listNotifications(): Promise<AppNotification[]> {
  const { data } = await api.get<NotificationDtoRaw[]>('/api/notifications');
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map(mapNotification);
}

export async function markRead(id: string): Promise<void> {
  await api.put(`/api/notifications/${encodeURIComponent(id)}/read`);
}
