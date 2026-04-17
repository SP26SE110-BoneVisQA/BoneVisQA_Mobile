import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { BookOpen, MessageSquare, Trophy, TrendingUp } from 'lucide-react-native';

import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import StatCard from '../../../components/quiz/StatCard';
import { useAnalytics } from '../../../hooks/useQuiz';
import type { WeeklyScorePoint } from '../../../types/quiz';

interface BarChartProps {
  data: ReadonlyArray<WeeklyScorePoint>;
}

function BarChart({ data }: BarChartProps): React.ReactElement {
  const max = useMemo(() => {
    const values = data.map((d) => d.average);
    return Math.max(100, ...values);
  }, [data]);
  return (
    <View>
      <View className="flex-row items-end h-40 gap-2">
        {data.map((d, idx) => {
          const heightPct = max > 0 ? (d.average / max) * 100 : 0;
          return (
            <View key={`${d.week}-${idx}`} className="flex-1 items-center">
              <View className="flex-1 w-full justify-end">
                <View
                  className="bg-primary rounded-t-xl w-full"
                  style={{ height: `${Math.max(2, heightPct)}%` }}
                />
              </View>
              <Text className="text-[10px] text-slate-500 mt-1" numberOfLines={1}>
                {d.week}
              </Text>
              <Text className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold">
                {d.average.toFixed(0)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface ChipRowProps {
  items: ReadonlyArray<string>;
  tone: 'emerald' | 'rose';
  emptyLabel: string;
}

function ChipRow({ items, tone, emptyLabel }: ChipRowProps): React.ReactElement {
  const chipBg = tone === 'emerald' ? 'bg-emerald-100' : 'bg-rose-100';
  const chipText = tone === 'emerald' ? 'text-emerald-700' : 'text-rose-700';
  if (items.length === 0) {
    return <Text className="text-xs text-slate-500">{emptyLabel}</Text>;
  }
  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((item) => (
        <View key={item} className={['px-3 py-1 rounded-full', chipBg].join(' ')}>
          <Text className={['text-xs font-semibold', chipText].join(' ')}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function AnalyticsScreen(): React.ReactElement {
  const { data, isLoading, isError, error, refetch } = useAnalytics();

  if (isLoading) {
    return (
      <Screen>
        <Loading text="Đang tải phân tích…" />
      </Screen>
    );
  }

  if (isError && error) {
    return (
      <Screen>
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <EmptyState
          title="Không có dữ liệu"
          subtitle="Hoàn thành thêm bài quiz để xem phân tích."
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text className="text-xs uppercase tracking-widest text-primary font-semibold">
        Phân tích
      </Text>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4 mt-1">
        Hiệu suất tổng thể
      </Text>

      <View className="flex-row gap-3 mb-3">
        <StatCard
          icon={<Trophy size={18} color="#059669" />}
          label="Điểm TB"
          value={(data.averageQuizScore ?? 0).toFixed(1)}
          tone="emerald"
        />
        <StatCard
          icon={<TrendingUp size={18} color="#14b8a6" />}
          label="Lần thử quiz"
          value={String(data.quizAttempts ?? 0)}
          tone="primary"
        />
      </View>
      <View className="flex-row gap-3 mb-4">
        <StatCard
          icon={<BookOpen size={18} color="#0284c7" />}
          label="Ca đã xem"
          value={String(data.casesViewed ?? 0)}
          tone="slate"
        />
        <StatCard
          icon={<MessageSquare size={18} color="#8b5cf6" />}
          label="Câu hỏi AI"
          value={String(data.questionsAsked ?? 0)}
          tone="slate"
        />
      </View>

      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
          Điểm trung bình theo tuần
        </Text>
        {data.weeklyScores.length === 0 ? (
          <EmptyState
            title="Chưa có dữ liệu theo tuần"
            subtitle="Dữ liệu sẽ xuất hiện khi bạn làm bài đều đặn."
          />
        ) : (
          <BarChart data={data.weeklyScores} />
        )}
      </Card>

      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
          Điểm mạnh
        </Text>
        <ChipRow items={data.strengths} tone="emerald" emptyLabel="Chưa xác định" />
      </Card>

      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
          Cần cải thiện
        </Text>
        <ChipRow items={data.weaknesses} tone="rose" emptyLabel="Chưa xác định" />
      </Card>
    </Screen>
  );
}
