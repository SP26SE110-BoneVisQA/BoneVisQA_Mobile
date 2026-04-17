import React, { useCallback } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, Trash2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import Card from '../../../components/common/Card';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import ScoreBadge from '../../../components/quiz/ScoreBadge';
import { useDeleteAttempt, useQuizHistory } from '../../../hooks/useQuiz';
import type { QuizStackParamList } from '../../../navigation/types';
import type { Attempt } from '../../../types/quiz';

type NavProp = NativeStackNavigationProp<QuizStackParamList, 'QuizHistory'>;

function formatDate(iso: string | undefined): string {
  if (!iso) {
    return '—';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

interface RowProps {
  item: Attempt;
  onPress: () => void;
  onDelete?: () => void;
}

function AttemptRow({ item, onPress, onDelete }: RowProps): React.ReactElement {
  const date = formatDate(item.submittedAt ?? item.startedAt);
  const isDraft = item.status === 'in_progress';
  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-start">
        <View className="flex-1">
          <Text
            className="text-base font-semibold text-slate-900 dark:text-white"
            numberOfLines={1}
          >
            {item.quizTitle ?? 'Bài quiz'}
          </Text>
          <Text className="text-xs text-slate-500 mt-1">{date}</Text>
          <View className="flex-row items-center gap-2 mt-2">
            <ScoreBadge score={item.score ?? null} size="sm" />
            {isDraft ? (
              <View className="px-2 py-0.5 rounded-full bg-amber-100">
                <Text className="text-xs font-semibold text-amber-700">
                  Bản nháp
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View className="flex-row items-center">
          {isDraft && onDelete ? (
            <Pressable
              onPress={onDelete}
              className="w-9 h-9 rounded-xl items-center justify-center mr-1"
            >
              <Trash2 size={18} color="#ef4444" />
            </Pressable>
          ) : null}
          <ChevronRight size={18} color="#94a3b8" />
        </View>
      </View>
    </Card>
  );
}

export default function QuizHistoryScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const history = useQuizHistory();
  const deleteAttempt = useDeleteAttempt();

  const handleDelete = useCallback(
    (attemptId: string): void => {
      Alert.alert('Xoá bản nháp?', 'Bạn có chắc muốn xoá bài làm chưa hoàn thành này?', [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAttempt.mutateAsync(attemptId);
              Toast.show({ type: 'success', text1: 'Đã xoá bản nháp' });
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: 'Xoá thất bại',
                text2: (err as { message?: string }).message,
              });
            }
          },
        },
      ]);
    },
    [deleteAttempt],
  );

  const renderEmpty = (): React.ReactElement => {
    if (history.isLoading) {
      return <Loading text="Đang tải lịch sử…" />;
    }
    if (history.isError && history.error) {
      return (
        <ErrorView error={history.error} onRetry={() => void history.refetch()} />
      );
    }
    return (
      <EmptyState
        title="Chưa có lịch sử"
        subtitle="Các bài làm đã nộp sẽ xuất hiện ở đây."
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['bottom']}>
      <FlatList
        data={history.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={history.isRefetching}
            onRefresh={() => void history.refetch()}
            tintColor="#14b8a6"
          />
        }
        renderItem={({ item }) => (
          <AttemptRow
            item={item}
            onPress={() => navigation.navigate('QuizReview', { attemptId: item.id })}
            onDelete={
              item.status === 'in_progress' ? () => handleDelete(item.id) : undefined
            }
          />
        )}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}
