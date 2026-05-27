import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { History } from 'lucide-react-native';
import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import { getVisualQaHistory } from '../../../api/visualQa';
import type { ApiError } from '../../../types/api';
import type { VisualQaHistoryFilter } from '../../../types/case';
import type { VisualQaStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<VisualQaStackParamList, 'VisualQaHistory'>;

const FILTERS: Array<{ value: VisualQaHistoryFilter; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'cases', label: 'Theo ca' },
  { value: 'personal', label: 'Cá nhân' },
];

function dateLabel(value?: string): string {
  return value ? new Date(value).toLocaleString('vi-VN') : '';
}

export default function VisualQaHistoryScreen(): React.ReactElement {
  const navigation = useNavigation<Navigation>();
  const [filter, setFilter] = React.useState<VisualQaHistoryFilter>('all');
  const history = useQuery({
    queryKey: ['visual-qa-history', filter],
    queryFn: () => getVisualQaHistory(filter),
  }) as ReturnType<typeof useQuery<Awaited<ReturnType<typeof getVisualQaHistory>>, ApiError>>;

  if (history.isLoading) {
    return (
      <Screen>
        <Loading text="Đang tải lịch sử Visual QA..." />
      </Screen>
    );
  }

  if (history.isError) {
    return (
      <Screen>
        <ErrorView error={history.error} onRetry={() => void history.refetch()} />
      </Screen>
    );
  }

  const items = history.data?.items ?? [];
  return (
    <Screen
      scroll
      refresh={{ refreshing: history.isRefetching, onRefresh: () => void history.refetch() }}
    >
      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Lịch sử Visual QA
      </Text>
      <View className="flex-row gap-2 mb-4">
        {FILTERS.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setFilter(item.value)}
            className={[
              'px-4 py-2 rounded-full border',
              filter === item.value
                ? 'bg-primary border-primary'
                : 'bg-white border-slate-200',
            ].join(' ')}
          >
            <Text className={filter === item.value ? 'text-white font-semibold' : 'text-slate-600'}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {items.length === 0 ? (
        <EmptyState
          icon={<History size={40} color="#14b8a6" />}
          title="Chưa có phiên Visual QA"
          subtitle="Các cuộc trao đổi AI của bạn sẽ hiển thị tại đây."
        />
      ) : (
        items.map((item) => (
          <Card
            key={item.sessionId}
            className="mb-3"
            onPress={() =>
              navigation.navigate('VisualQaThread', { sessionId: item.sessionId })
            }
          >
            <Text className="text-base font-semibold text-slate-900 dark:text-white">
              {item.questionSnippet ?? 'Hội thoại Visual QA'}
            </Text>
            <Text className="text-xs text-slate-500 mt-2">
              {item.caseId ? 'Theo ca' : 'Ảnh cá nhân'}
              {item.updatedAt ? ` - ${dateLabel(item.updatedAt)}` : ''}
            </Text>
            {item.reviewState ? (
              <Text className="text-xs font-semibold text-primary mt-2">
                Trạng thái review: {item.reviewState}
              </Text>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
