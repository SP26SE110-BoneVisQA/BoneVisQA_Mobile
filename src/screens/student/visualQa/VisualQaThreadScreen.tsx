import React from 'react';
import { Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import { getVisualQaThread, requestVisualQaReview } from '../../../api/visualQa';
import type { ApiError } from '../../../types/api';
import type { VisualQaStackParamList } from '../../../navigation/types';

type Route = RouteProp<VisualQaStackParamList, 'VisualQaThread'>;
type Navigation = NativeStackNavigationProp<VisualQaStackParamList, 'VisualQaThread'>;

export default function VisualQaThreadScreen(): React.ReactElement {
  const { sessionId } = useRoute<Route>().params;
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const thread = useQuery({
    queryKey: ['visual-qa-thread', sessionId],
    queryFn: () => getVisualQaThread(sessionId),
  }) as ReturnType<typeof useQuery<Awaited<ReturnType<typeof getVisualQaThread>>, ApiError>>;
  const requestReview = useMutation<void, ApiError, string>({
    mutationFn: (turnId) => requestVisualQaReview(turnId, sessionId),
    onSuccess: async () => {
      Toast.show({ type: 'success', text1: 'Review request sent' });
      await queryClient.invalidateQueries({ queryKey: ['visual-qa-thread', sessionId] });
      await queryClient.invalidateQueries({ queryKey: ['visual-qa-history'] });
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: 'Could not request review', text2: error.message });
    },
  });

  const confirmReview = (turnId: string): void => {
    Alert.alert(
      'Request expert review',
      'Send this answer for expert review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request review', onPress: () => requestReview.mutate(turnId) },
      ],
    );
  };

  if (thread.isLoading) {
    return (
      <Screen>
        <Loading text="Loading conversation..." />
      </Screen>
    );
  }
  if (thread.isError) {
    return (
      <Screen>
        <ErrorView error={thread.error} onRetry={() => void thread.refetch()} />
      </Screen>
    );
  }
  const data = thread.data;
  if (!data || data.turns.length === 0) {
    return (
      <Screen>
        <EmptyState title="No content yet" subtitle="This session has no Q&A turns." />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      refresh={{ refreshing: thread.isRefetching, onRefresh: () => void thread.refetch() }}
    >
      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Conversation detail
      </Text>
      {data.blockingNotice ? (
        <Card className="mb-4 bg-amber-50">
          <Text className="text-sm text-amber-800">{data.blockingNotice}</Text>
        </Card>
      ) : null}
      {data.turns.map((turn, index) => (
        <View key={turn.id ?? `turn-${index}`} className="mb-4">
          <Card className="mb-2 bg-primary/5">
            <Text className="text-xs uppercase font-semibold text-primary mb-1">Question</Text>
            <Text className="text-sm text-slate-800 dark:text-white">{turn.question}</Text>
          </Card>
          <Card>
            <Text className="text-xs uppercase font-semibold text-slate-500 mb-1">Answer</Text>
            <Text className="text-sm text-slate-800 dark:text-white">{turn.answer}</Text>
            {turn.reviewState ? (
              <Text className="text-xs font-semibold text-primary mt-3">
                Review status: {turn.reviewState}
              </Text>
            ) : null}
            {data.capabilities?.canRequestReview && turn.isReviewTarget && turn.id ? (
              <View className="mt-3">
                <Button
                  label="Request review"
                  size="sm"
                  variant="outline"
                  loading={requestReview.isPending}
                  onPress={() => confirmReview(turn.id as string)}
                />
              </View>
            ) : null}
          </Card>
        </View>
      ))}
      {data.capabilities?.canAskNext && !data.capabilities.isReadOnly ? (
        <Button
          label="Continue conversation"
          onPress={() =>
            navigation.navigate('VisualQaChat', {
              caseId: data.caseId,
              sessionId: data.sessionId,
            })
          }
          fullWidth
        />
      ) : null}
    </Screen>
  );
}
