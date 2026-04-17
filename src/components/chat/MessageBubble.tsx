import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Markdown from 'react-native-markdown-display';
import type { VisualQaMessage } from '../../types/case';

export interface MessageBubbleProps {
  message: VisualQaMessage;
  className?: string;
  testID?: string;
}

const userBubble = 'bg-primary self-end rounded-2xl rounded-br-sm';
const assistantBubble =
  'bg-white dark:bg-slate-800 self-start rounded-2xl rounded-bl-sm border border-slate-100 dark:border-slate-700';

export function MessageBubble({
  message,
  className,
  testID,
}: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === 'user';
  const containerClass = [
    'max-w-[85%] px-4 py-3 my-1.5',
    isUser ? userBubble : assistantBubble,
    message.isError ? 'border border-destructive' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View testID={testID} className={containerClass}>
      {message.imageUri ? (
        <Image
          source={{ uri: message.imageUri }}
          style={{
            width: 200,
            height: 140,
            borderRadius: 12,
            marginBottom: message.content ? 8 : 0,
          }}
          contentFit="cover"
          transition={150}
        />
      ) : null}
      {message.isLoading ? (
        <View className="flex-row items-center py-1">
          <ActivityIndicator size="small" color="#14b8a6" />
          <Text className="ml-2 text-slate-500 dark:text-slate-300 text-sm">
            AI đang phân tích...
          </Text>
        </View>
      ) : isUser ? (
        <Text className="text-white text-base leading-6">
          {message.content}
        </Text>
      ) : (
        <Markdown
          style={{
            body: {
              color: '#0f172a',
              fontSize: 15,
              lineHeight: 22,
            },
            strong: { color: '#0f172a', fontWeight: '700' },
            bullet_list: { marginVertical: 4 },
            code_inline: {
              backgroundColor: '#f1f5f9',
              paddingHorizontal: 4,
              borderRadius: 4,
            },
            code_block: {
              backgroundColor: '#f1f5f9',
              padding: 8,
              borderRadius: 8,
            },
            fence: {
              backgroundColor: '#f1f5f9',
              padding: 8,
              borderRadius: 8,
            },
            link: { color: '#0d9488' },
          }}
        >
          {message.content}
        </Markdown>
      )}
      {!message.isLoading && message.references && message.references.length > 0 ? (
        <View className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <Text className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
            Tham khảo
          </Text>
          {message.references.map((ref, idx) => (
            <Text
              key={`${message.id}-ref-${idx}`}
              className="text-[11px] text-slate-500 dark:text-slate-400"
              numberOfLines={2}
            >
              • {ref}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default MessageBubble;
