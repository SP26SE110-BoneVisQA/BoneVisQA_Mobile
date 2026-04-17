import React, { useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookOpen, Brain, LineChart, Target, Trophy } from 'lucide-react-native';

import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import StatCard from '../../../components/quiz/StatCard';
import {
  useProgress,
  useRecentActivity,
  useTopicStats,
} from '../../../hooks/useQuiz';
import type { QuizStackParamList } from '../../../navigation/types';
import type { RecentActivity, TopicStat } from '../../../types/quiz';

type NavProp = NativeStackNavigationProp<QuizStackParamList, 'Progress'>;

interface TopicBarProps {
  stat: TopicStat;
}

function TopicBar({ stat }: TopicBarProps): React.ReactElement {
  const pct = Math.max(0, Math.min(100, stat.averageScore));
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
          {stat.topic}
        </Text>
        <Text className="text-xs text-slate-500">{pct.toFixed(1)} điểm</Text>
      </View>
      <View className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <View className="h-2 bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </View>
      <Text className="text-[11px] text-slate-400 mt-1">
        {stat.completed} lần thử
        {typeof stat.accuracyRate === 'number'
          ? ` · Chính xác ${(stat.accuracyRate * 100).toFixed(0)}%`
          : ''}
      </Text>
    </View>
  );
}

function ActivityRow({ item }: { item: RecentActivity }): React.ReactElement {
  return (
    <View className="flex-row items-start py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <View className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center mr-3">
        <Brain size={16} color="#334155" />
      </View>
      <View className="flex-1">
        <Text
          className="text-sm font-semibold text-slate-900 dark:text-white"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {item.description ? (
          <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function ProgressScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const progress = useProgress();
  const topics = useTopicStats();
  const recent = useRecentActivity();

  const onRefresh = useCallback((): void => {
    void progress.refetch();
    void topics.refetch();
    void recent.refetch();
  }, [progress, recent, topics]);

  const topTopics = useMemo(() => (topics.data ?? []).slice(0, 6), [topics.data]);
  const topActivities = useMemo(() => (recent.data ?? []).slice(0, 5), [recent.data]);

  if (progress.isLoading && !progress.data) {
    return (
      <Screen>
        <Loading text="Đang tải tiến độ…" />
      </Screen>
    );
  }

  if (progress.isError && progress.error) {
    return (
      <Screen>
        <ErrorView error={progress.error} onRetry={onRefresh} />
      </Screen>
    );
  }

  const summary = progress.data;
  const refreshing =
    progress.isRefetching || topics.isRefetching || recent.isRefetching;

  return (
    <Screen scroll refresh={{ refreshing, onRefresh }}>
      <Text className="text-xs uppercase tracking-widest text-primary font-semibold">
        Tiến độ học tập
      </Text>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4 mt-1">
        Tổng quan
      </Text>

      <View className="flex-row gap-3 mb-4">
        <StatCard
          icon={<Trophy size={18} color="#059669" />}
          label="Điểm TB"
          value={(summary?.averageScore ?? 0).toFixed(1)}
          tone="emerald"
        />
        <StatCard
          icon={<Target size={18} color="#14b8a6" />}
          label="Đã hoàn thành"
          value={String(summary?.completedQuizzes ?? 0)}
          hint={`/${summary?.totalQuizzes ?? 0} lần thử`}
          tone="primary"
        />
      </View>

      <View className="flex-row gap-3 mb-5">
        <StatCard
          icon={<BookOpen size={18} color="#0284c7" />}
          label="Ca đã xem"
          value={String(summary?.casesViewed ?? 0)}
          tone="slate"
        />
        <StatCard
          icon={<Brain size={18} color="#8b5cf6" />}
          label="Câu hỏi AI"
          value={String(summary?.questionsAsked ?? 0)}
          tone="slate"
        />
      </View>

      <Card className="mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">
            Thống kê theo chủ đề
          </Text>
        </View>
        {topics.isLoading ? (
          <Loading text="Đang tải…" />
        ) : topTopics.length === 0 ? (
          <EmptyState
            title="Chưa có dữ liệu chủ đề"
            subtitle="Hoàn thành vài bài quiz để xem thống kê."
          />
        ) : (
          topTopics.map((t) => <TopicBar key={t.topic} stat={t} />)
        )}
      </Card>

      <Card className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">
            Hoạt động gần đây
          </Text>
        </View>
        {recent.isLoading ? (
          <Loading text="Đang tải…" />
        ) : topActivities.length === 0 ? (
          <EmptyState
            title="Chưa có hoạt động"
            subtitle="Hãy bắt đầu một bài quiz hoặc đặt câu hỏi AI."
          />
        ) : (
          topActivities.map((r) => <ActivityRow key={r.id} item={r} />)
        )}
      </Card>

      <Button
        label="Xem phân tích chi tiết"
        variant="outline"
        onPress={() => navigation.navigate('Analytics')}
        leftIcon={<LineChart size={16} color="#14b8a6" />}
        fullWidth
      />
    </Screen>
  );
}
