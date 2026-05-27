import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { History } from 'lucide-react-native';
import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import ChatList from '../../../components/chat/ChatList';
import ChatInput from '../../../components/chat/ChatInput';
import { getCase } from '../../../api/cases';
import { getVisualQaThread } from '../../../api/visualQa';
import { useVisualQa } from '../../../hooks/useVisualQa';
import type { Case, VisualQaMessage, VisualQaThread } from '../../../types/case';
import type { ApiError } from '../../../types/api';
import type { VisualQaStackParamList } from '../../../navigation/types';

type NavProp = NativeStackNavigationProp<VisualQaStackParamList, 'VisualQaChat'>;
type ChatRoute = RouteProp<VisualQaStackParamList, 'VisualQaChat'>;

export default function ChatScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<ChatRoute>();
  const caseId = route.params?.caseId;
  const sessionId = route.params?.sessionId;
  const imageId = route.params?.imageId;
  const imageUrl = route.params?.imageUrl;
  const coordinates = route.params?.coordinates;

  const { data: caseItem } = useQuery<Case, ApiError>({
    queryKey: ['case', caseId ?? 'none'],
    queryFn: () => getCase(caseId as string),
    enabled: Boolean(caseId),
  });

  const thread = useQuery<VisualQaThread, ApiError>({
    queryKey: ['visual-qa-thread', sessionId],
    queryFn: () => getVisualQaThread(sessionId as string),
    enabled: Boolean(sessionId),
  });

  const { messages, ask, isLoading, capabilities, seed } = useVisualQa(
    {
      caseId,
      imageId,
      imageUrl: imageUrl ?? caseItem?.images[0]?.url,
      coordinates,
    },
    sessionId,
    thread.data?.capabilities,
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: caseItem?.title ?? 'Ask X-ray AI',
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('VisualQaHistory')} className="px-2">
          <History size={21} color="#0f766e" />
        </Pressable>
      ),
    });
  }, [navigation, caseItem?.title]);

  React.useEffect(() => {
    if (sessionId && thread.data) {
      const restored: VisualQaMessage[] = thread.data.turns.flatMap((turn, index) => [
        {
          id: `thread-user-${turn.id ?? index}`,
          role: 'user',
          content: turn.question,
          createdAt: turn.createdAt,
        },
        {
          id: `thread-assistant-${turn.id ?? index}`,
          role: 'assistant',
          content: turn.answer,
          references: turn.citations
            .map((citation) => citation.url ?? citation.label ?? citation.snippet ?? '')
            .filter((reference) => reference.length > 0),
          turnId: turn.id,
          reviewState: turn.reviewState,
          createdAt: turn.createdAt,
        },
      ]);
      seed(restored);
      return;
    }
    if (sessionId) {
      return;
    }
    const greeting = caseItem
      ? `Hi! I will use the image from case **${caseItem.title}** to answer. ${coordinates ? 'You marked the region to ask about.' : 'You can ask directly without uploading the image again.'}`
      : 'Hi! For images outside a case, please upload an X-ray before asking AI.';
    seed([
      {
        id: `greet-${sessionId ?? caseId ?? 'general'}`,
        role: 'assistant',
        content: greeting,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [caseId, caseItem, coordinates, seed, sessionId, thread.data]);

  const handleSend = (text: string, imageUri?: string): void => {
    void ask(text, imageUri);
  };

  if (sessionId && thread.isLoading) {
    return (
      <Screen>
        <Loading text="Loading conversation..." />
      </Screen>
    );
  }

  if (sessionId && thread.isError) {
    return (
      <Screen>
        <ErrorView error={thread.error} onRetry={() => void thread.refetch()} />
      </Screen>
    );
  }

  const canAskNext =
    capabilities?.canAskNext !== false && capabilities?.isReadOnly !== true;

  return (
    <Screen padding={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View className="flex-1">
          <ChatList messages={messages} />
        </View>
        {canAskNext ? (
          <ChatInput
            onSend={handleSend}
            loading={isLoading}
            requireImage={!caseId && !sessionId}
          />
        ) : (
          <Card className="mx-3 mb-3">
            <Text className="text-sm text-slate-600 dark:text-slate-300">
              This conversation is closed or has reached the question limit.
            </Text>
          </Card>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}
