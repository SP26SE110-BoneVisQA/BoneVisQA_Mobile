import React, { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { BellOff } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import NotificationItem from '../../../components/notifications/NotificationItem';
import {
  useMarkRead,
  useNotifications,
} from '../../../hooks/useNotifications';
import type { AppNotification } from '../../../types/notification';

export default function NotificationsScreen(): React.ReactElement {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useNotifications();
  const markReadMutation = useMarkRead();

  const handlePress = useCallback(
    (notification: AppNotification) => {
      if (!notification.isRead) {
        markReadMutation.mutate(notification.id);
      }
      // Linking deferred — backend returns targetUrl as string.
      // Agents 2/3/4 will wire deep links once navigation refs are shared.
    },
    [markReadMutation],
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
        <Loading text="Loading notifications..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
        <ErrorView
          error={error ?? 'Could not load notifications'}
          onRetry={() => {
            void refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  const items = data ?? [];

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      edges={['top']}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        renderItem={({ item }) => (
          <NotificationItem notification={item} onPress={handlePress} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor="#14b8a6"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 min-h-[400px]">
            <EmptyState
              icon={<BellOff size={48} color="#94a3b8" />}
              title="No notifications"
              subtitle="You are all caught up"
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
