import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { listNotifications, markRead } from '../api/notifications';
import { search } from '../api/search';
import { listAnnouncements } from '../api/announcements';
import { useDebounce } from './useDebounce';
import type {
  AppNotification,
  Announcement,
  SearchResult,
} from '../types/notification';
import type { ApiError } from '../types/api';

const NOTIFICATIONS_KEY = ['notifications'] as const;
const ANNOUNCEMENTS_KEY = ['announcements'] as const;

export function useNotifications(): UseQueryResult<AppNotification[], ApiError> {
  return useQuery<AppNotification[], ApiError>({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: listNotifications,
  });
}

export function useMarkRead(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}

export function useUnreadCount(): number {
  const { data } = useNotifications();
  if (!data) {
    return 0;
  }
  return data.reduce((acc, n) => (n.isRead ? acc : acc + 1), 0);
}

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_CHARS = 2;

export function useSearch(
  query: string,
): UseQueryResult<SearchResult[], ApiError> {
  const debounced = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const trimmed = debounced.trim();
  return useQuery<SearchResult[], ApiError>({
    queryKey: ['search', trimmed],
    queryFn: () => search(trimmed),
    enabled: trimmed.length >= SEARCH_MIN_CHARS,
    staleTime: 15_000,
  });
}

export function useAnnouncements(): UseQueryResult<Announcement[], ApiError> {
  return useQuery<Announcement[], ApiError>({
    queryKey: ANNOUNCEMENTS_KEY,
    queryFn: listAnnouncements,
  });
}
