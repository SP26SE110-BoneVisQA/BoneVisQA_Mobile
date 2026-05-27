import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bell, BookOpen, Info, Megaphone } from 'lucide-react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { AppNotification, NotificationType } from '../../types/notification';

dayjs.extend(relativeTime);

export interface NotificationItemProps {
  notification: AppNotification;
  onPress?: (notification: AppNotification) => void;
  testID?: string;
}

function iconFor(type: NotificationType): React.ReactElement {
  const color = '#14b8a6';
  const size = 20;
  switch (type) {
    case 'assignment':
      return <BookOpen size={size} color={color} />;
    case 'announcement':
      return <Megaphone size={size} color={color} />;
    case 'quiz':
      return <BookOpen size={size} color={color} />;
    case 'system':
    default:
      return <Info size={size} color={color} />;
  }
}

function formatRelative(iso: string): string {
  const parsed = dayjs(iso);
  if (!parsed.isValid()) {
    return '';
  }
  return parsed.fromNow();
}

export function NotificationItem({
  notification,
  onPress,
  testID,
}: NotificationItemProps): React.ReactElement {
  const { title, body, isRead, type, createdAt } = notification;

  return (
    <Pressable
      testID={testID}
      onPress={() => onPress?.(notification)}
      className={[
        'flex-row items-start p-4 mb-2 rounded-2xl',
        isRead
          ? 'bg-white dark:bg-slate-800'
          : 'bg-primary/5 dark:bg-primary/10',
      ].join(' ')}
    >
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
        {iconFor(type)}
      </View>
      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <Text
            className={[
              'flex-1 text-base',
              isRead
                ? 'text-slate-700 dark:text-slate-200 font-medium'
                : 'text-slate-900 dark:text-white font-bold',
            ].join(' ')}
            numberOfLines={1}
          >
            {title || <Bell size={14} color="#64748b" />}
          </Text>
          {!isRead ? (
            <View className="w-2 h-2 rounded-full bg-primary ml-2 mt-2" />
          ) : null}
        </View>
        {body ? (
          <Text
            className="text-slate-500 dark:text-slate-400 text-sm mt-1"
            numberOfLines={2}
          >
            {body}
          </Text>
        ) : null}
        <Text className="text-slate-400 dark:text-slate-500 text-xs mt-1">
          {formatRelative(createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

export default NotificationItem;
