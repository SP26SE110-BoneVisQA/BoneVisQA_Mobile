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
        <Loading text="Loading analytics..." />
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
          title="No data"
          subtitle="Complete more quizzes to view analytics."
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text className="text-xs uppercase tracking-widest text-primary font-semibold">
        Analytics
      </Text>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4 mt-1">
        Overall performance
      </Text>

      <View className="flex-row gap-3 mb-3">
        <StatCard
          icon={<Trophy size={18} color="#059669" />}
          label="Score TB"
          value={(data.averageQuizScore ?? 0).toFixed(1)}
          tone="emerald"
        />
        <StatCard
          icon={<TrendingUp size={18} color="#14b8a6" />}
          label="Quiz attempts"
          value={String(data.quizAttempts ?? 0)}
          tone="primary"
        />
      </View>
      <View className="flex-row gap-3 mb-4">
        <StatCard
          icon={<BookOpen size={18} color="#0284c7" />}
          label="Cases viewed"
          value={String(data.casesViewed ?? 0)}
          tone="slate"
        />
        <StatCard
          icon={<MessageSquare size={18} color="#8b5cf6" />}
          label="Question AI"
          value={String(data.questionsAsked ?? 0)}
          tone="slate"
        />
      </View>

      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
          Average score by week
        </Text>
        {data.weeklyScores.length === 0 ? (
          <EmptyState
            title="No weekly data yet"
            subtitle="Data will appear as you practice regularly."
          />
        ) : (
          <BarChart data={data.weeklyScores} />
        )}
      </Card>

      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
          Strengths
        </Text>
        <ChipRow items={data.strengths} tone="emerald" emptyLabel="Not identified yet" />
      </Card>

      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
          Needs improvement
        </Text>
        <ChipRow items={data.weaknesses} tone="rose" emptyLabel="Not identified yet" />
      </Card>

      <Text className="text-xl font-bold text-slate-900 dark:text-white mt-2 mb-3">
        Advanced analytics
      </Text>

      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-2">
          Learning overview
        </Text>
        {dashboard.isLoading ? (
          <Loading text="Loading overview..." />
        ) : dashboard.isError ? (
          <Text className="text-xs text-slate-500">Unable to load the overview right now.</Text>
        ) : (
          <View>
            {dashboard.data?.title ? (
              <Text className="text-sm text-slate-700 mb-2">{dashboard.data.title}</Text>
            ) : null}
            <View className="flex-row gap-4">
              {typeof dashboard.data?.completionRate === 'number' ? (
                <Text className="text-xs text-slate-600">
                  Completed: {dashboard.data.completionRate.toFixed(0)}%
                </Text>
              ) : null}
              {typeof dashboard.data?.accuracyRate === 'number' ? (
                <Text className="text-xs text-slate-600">
                  Accuracy: {dashboard.data.accuracyRate.toFixed(0)}%
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
          Competencies
        </Text>
        {competencies.isLoading ? (
          <Loading text="Loading competencies..." />
        ) : (competencies.data ?? []).length === 0 ? (
          <Text className="text-xs text-slate-500">No competency data yet.</Text>
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
          Repeated mistakes
        </Text>
        {patterns.isLoading ? (
          <Loading text="Loading mistake patterns..." />
        ) : (patterns.data ?? []).length === 0 ? (
          <Text className="text-xs text-slate-500">No mistake patterns to resolve.</Text>
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
                    label="Mark as resolved"
                    size="sm"
                    variant="outline"
                    loading={resolvePattern.isPending}
                    onPress={() => resolvePattern.mutate(pattern.id)}
                  />
                </View>
              ) : (
                <Text className="text-xs text-emerald-600 mt-1">Resolved</Text>
              )}
            </View>
          ))
        )}
      </Card>

      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
          Personal suggestions
        </Text>
        {insights.isLoading ? (
          <Loading text="Loading suggestions..." />
        ) : (insights.data ?? []).length === 0 ? (
          <Text className="text-xs text-slate-500">No new suggestions yet.</Text>
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
                    label="Read"
                    size="sm"
                    variant="outline"
                    loading={markRead.isPending}
                    onPress={() => markRead.mutate(insight.id)}
                  />
                ) : null}
                {!insight.isActioned ? (
                  <Button
                    label={insight.actionLabel ?? 'Take action'}
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
