import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { History } from 'lucide-react-native';
import Screen from '../../../components/common/Screen';
import ChatList from '../../../components/chat/ChatList';
import ChatInput from '../../../components/chat/ChatInput';
import { getCase } from '../../../api/cases';
import { useVisualQa } from '../../../hooks/useVisualQa';
import type { Case } from '../../../types/case';
import type { ApiError } from '../../../types/api';
import type { CasesStackParamList } from '../../../navigation/types';

type NavProp = NativeStackNavigationProp<CasesStackParamList, 'VisualQaChat'>;
type ChatRoute = RouteProp<CasesStackParamList, 'VisualQaChat'>;

export default function ChatScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ChatRoute>();
  const caseId = route.params?.caseId;
  const sessionId = route.params?.sessionId;

  const { data: caseItem } = useQuery<Case, ApiError>({
    queryKey: ['case', caseId ?? 'none'],
    queryFn: () => getCase(caseId as string),
    enabled: Boolean(caseId),
  });

  const { messages, ask, isLoading, seed } = useVisualQa(caseId, sessionId);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: caseItem?.title ?? 'Hỏi AI X-quang',
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('VisualQaHistory')} className="px-2">
          <History size={21} color="#0f766e" />
        </Pressable>
      ),
    });
  }, [navigation, caseItem?.title]);

  React.useEffect(() => {
    const greeting = sessionId
      ? 'Bạn đang tiếp tục một hội thoại Visual QA trước đó. Hãy đặt câu hỏi tiếp theo.'
      : caseItem
      ? `Xin chào! Tôi có thể giúp bạn phân tích ca **${caseItem.title}**. Hãy đặt câu hỏi về hình ảnh hoặc các dấu hiệu bạn thấy.`
      : 'Xin chào! Tôi có thể giúp bạn phân tích X-quang. Hãy đặt câu hỏi hoặc đính kèm một hình ảnh.';
    seed([
      {
        id: `greet-${sessionId ?? caseId ?? 'general'}`,
        role: 'assistant',
        content: greeting,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [caseId, caseItem, seed, sessionId]);

  const handleSend = (text: string, imageUri?: string): void => {
    void ask(text, imageUri);
  };

  return (
    <Screen padding={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View className="flex-1">
          <ChatList messages={messages} />
        </View>
        <ChatInput onSend={handleSend} loading={isLoading} />
      </KeyboardAvoidingView>
    </Screen>
  );
}
