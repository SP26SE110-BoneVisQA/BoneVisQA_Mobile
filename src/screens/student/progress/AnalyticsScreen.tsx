import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { BookOpen, MessageSquare, Trophy, TrendingUp } from 'lucide-react-native';

import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import StatCard from '../../../components/quiz/StatCard';
import { useAnalytics } from '../../../hooks/useQuiz';
import {
  useActionInsight,
  useCompetencies,
  useErrorPatterns,
  useInsights,
  useMarkInsightRead,
  useResolveErrorPattern,
  useStudentDashboard,
} from '../../../hooks/useStudentAnalytics';
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
  const dashboard = useStudentDashboard();
  const competencies = useCompetencies();
  const patterns = useErrorPatterns();
  const insights = useInsights();
  const markRead = useMarkInsightRead();
  const actionInsight = useActionInsight();
  const resolvePattern = useResolveErrorPattern();

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

      <Text className="text-xl font-bold text-slate-900 dark:text-white mt-2 mb-3">
        Phân tích nâng cao
      </Text>

      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-2">
          Tổng quan học tập
        </Text>
        {dashboard.isLoading ? (
          <Loading text="Đang tải tổng quan..." />
        ) : dashboard.isError ? (
          <Text className="text-xs text-slate-500">Không thể tải tổng quan lúc này.</Text>
        ) : (
          <View>
            {dashboard.data?.title ? (
              <Text className="text-sm text-slate-700 mb-2">{dashboard.data.title}</Text>
            ) : null}
            <View className="flex-row gap-4">
              {typeof dashboard.data?.completionRate === 'number' ? (
                <Text className="text-xs text-slate-600">
                  Hoàn thành: {dashboard.data.completionRate.toFixed(0)}%
                </Text>
              ) : null}
              {typeof dashboard.data?.accuracyRate === 'number' ? (
                <Text className="text-xs text-slate-600">
                  Chính xác: {dashboard.data.accuracyRate.toFixed(0)}%
                </Text>
              ) : null}
            </View>
            {dashboard.data?.focusMessage ? (
              <Text className="text-sm text-primary mt-3">{dashboard.data.focusMessage}</Text>
            ) : null}
          </View>
        )}
      </Card>

      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
          Năng lực
        </Text>
        {competencies.isLoading ? (
          <Loading text="Đang tải năng lực..." />
        ) : (competencies.data ?? []).length === 0 ? (
          <Text className="text-xs text-slate-500">Chưa có dữ liệu năng lực.</Text>
        ) : (
          competencies.data?.map((item) => (
            <View key={item.id} className="flex-row justify-between py-2">
              <Text className="text-sm text-slate-700">{item.name}</Text>
              <Text className="text-sm font-semibold text-primary">
                {typeof item.score === 'number' ? `${item.score.toFixed(0)}%` : item.level ?? '-'}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
          Lỗi lặp lại
        </Text>
        {patterns.isLoading ? (
          <Loading text="Đang tải mẫu lỗi..." />
        ) : (patterns.data ?? []).length === 0 ? (
          <Text className="text-xs text-slate-500">Không có mẫu lỗi cần xử lý.</Text>
        ) : (
          patterns.data?.map((pattern) => (
            <View key={pattern.id} className="border-b border-slate-100 py-2">
              <Text className="text-sm font-semibold text-slate-800">{pattern.title}</Text>
              {pattern.description ? (
                <Text className="text-xs text-slate-500 mt-1">{pattern.description}</Text>
              ) : null}
              {!pattern.resolved ? (
                <View className="mt-2 self-start">
                  <Button
                    label="Đánh dấu đã xử lý"
                    size="sm"
                    variant="outline"
                    loading={resolvePattern.isPending}
                    onPress={() => resolvePattern.mutate(pattern.id)}
                  />
                </View>
              ) : (
                <Text className="text-xs text-emerald-600 mt-1">Đã xử lý</Text>
              )}
            </View>
          ))
        )}
      </Card>

      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
          Gợi ý cá nhân
        </Text>
        {insights.isLoading ? (
          <Loading text="Đang tải gợi ý..." />
        ) : (insights.data ?? []).length === 0 ? (
          <Text className="text-xs text-slate-500">Chưa có gợi ý mới.</Text>
        ) : (
          insights.data?.map((insight) => (
            <View key={insight.id} className="border-b border-slate-100 py-2">
              <Text className="text-sm font-semibold text-slate-800">{insight.title}</Text>
              {insight.description ? (
                <Text className="text-xs text-slate-500 mt-1">{insight.description}</Text>
              ) : null}
              <View className="flex-row gap-2 mt-2">
                {!insight.isRead ? (
                  <Button
                    label="Đã đọc"
                    size="sm"
                    variant="outline"
                    loading={markRead.isPending}
                    onPress={() => markRead.mutate(insight.id)}
                  />
                ) : null}
                {!insight.isActioned ? (
                  <Button
                    label={insight.actionLabel ?? 'Thực hiện'}
                    size="sm"
                    loading={actionInsight.isPending}
                    onPress={() => actionInsight.mutate(insight.id)}
                  />
                ) : null}
              </View>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
