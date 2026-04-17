import React from 'react';
import {
  FlatList,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { MessageSquareText } from 'lucide-react-native';
import MessageBubble from './MessageBubble';
import type { VisualQaMessage } from '../../types/case';

export interface ChatListProps {
  messages: VisualQaMessage[];
  className?: string;
  testID?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export function ChatList({
  messages,
  className,
  testID,
  emptyTitle = 'Hãy hỏi câu đầu tiên về X-quang',
  emptySubtitle = 'Bạn có thể đính kèm hình ảnh hoặc đặt câu hỏi về ca lâm sàng hiện tại.',
}: ChatListProps): React.ReactElement {
  // We render inverted: newest at bottom. FlatList inverts the array.
  const inverted = React.useMemo<VisualQaMessage[]>(
    () => [...messages].reverse(),
    [messages],
  );

  const renderItem = ({
    item,
  }: ListRenderItemInfo<VisualQaMessage>): React.ReactElement => (
    <MessageBubble message={item} />
  );

  if (messages.length === 0) {
    return (
      <View
        testID={testID}
        className={[
          'flex-1 items-center justify-center p-6',
          className ?? '',
        ].join(' ')}
      >
        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
          <MessageSquareText size={32} color="#14b8a6" />
        </View>
        <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-2 text-center">
          {emptyTitle}
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">
          {emptySubtitle}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      testID={testID}
      data={inverted}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      inverted
      contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
      keyboardShouldPersistTaps="handled"
      className={className ?? ''}
    />
  );
}

export default ChatList;
