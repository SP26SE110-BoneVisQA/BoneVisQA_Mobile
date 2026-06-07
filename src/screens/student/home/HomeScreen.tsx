import React, { useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Clock3,
  Flame,
  Gauge,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react-native';

import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import ScoreBadge from '../../../components/quiz/ScoreBadge';
import {
  useAssignments,
  useProgress,
  useQuizzes,
  useRecentActivity,
} from '../../../hooks/useQuiz';
import {
  useCompetencies,
  useErrorPatterns,
  useInsights,
  useStudentDashboard,
} from '../../../hooks/useStudentAnalytics';
import { useAuth } from '../../../hooks/useAuth';
import { useUnreadCount } from '../../../hooks/useNotifications';
import type {
  AppTabParamList,
  HomeStackParamList,
} from '../../../navigation/types';
import type { Assignment, RecentActivity } from '../../../types/quiz';
import type {
  StudentCompetency,
  StudentErrorPattern,
  StudentInsight,
} from '../../../types/analytics';

type HomeNavProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;
type TabNavProp = BottomTabNavigationProp<AppTabParamList>;

function getGreeting(fullName?: string): string {
  const hour = new Date().getHours();
  const firstName = fullName?.trim().split(/\s+/)[0];
  if (hour < 12) {
    return firstName ? `Good morning, ${firstName}` : 'Good morning';
  }
  if (hour < 18) {
    return firstName ? `Good afternoon, ${firstName}` : 'Good afternoon';
  }
  return firstName ? `Good evening, ${firstName}` : 'Good evening';
}

function formatRelative(iso: string | undefined): string {
  if (!iso) {
    return '';
  }
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return '';
  }
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
}

function formatPercent(value: number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '0%';
  }
  const normalized = value <= 1 ? value * 100 : value;
  const clamped = Math.max(0, Math.min(100, normalized));
  return `${Math.round(clamped)}%`;
}

function percentNumber(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value <= 1 ? value * 100 : value));
}

function activityIconColor(type: RecentActivity['type']): string {
  switch (type) {
    case 'quiz':
      return '#14b8a6';
    case 'visual_qa':
      return '#8b5cf6';
    case 'case':
    default:
      return '#0ea5e9';
  }
}

function MetricTile({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: 'teal' | 'blue' | 'amber' | 'emerald';
}): React.ReactElement {
  const palette = {
    teal: ['bg-teal-50 border-teal-100', 'bg-teal-100', '#0f766e'],
    blue: ['bg-sky-50 border-sky-100', 'bg-sky-100', '#0369a1'],
    amber: ['bg-amber-50 border-amber-100', 'bg-amber-100', '#b45309'],
    emerald: ['bg-emerald-50 border-emerald-100', 'bg-emerald-100', '#047857'],
  }[tone];

  return (
    <View className={['flex-1 rounded-2xl border p-3 min-h-[118px]', palette[0]].join(' ')}>
      <View className={['w-9 h-9 rounded-xl items-center justify-center mb-3', palette[1]].join(' ')}>
        {icon}
      </View>
      <Text className="text-[11px] text-slate-500 font-medium" numberOfLines={1}>
        {label}
      </Text>
      <Text className="text-2xl font-bold mt-1" style={{ color: palette[2] }} numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-[11px] text-slate-500 mt-1" numberOfLines={1}>
        {hint}
      </Text>
    </View>
  );
}

function AssignmentItem({
  assignment,
  onPress,
}: {
  assignment: Assignment;
  onPress: () => void;
}): React.ReactElement {
  const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const dueText =
    due && !Number.isNaN(due.getTime())
      ? due.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
      : 'No due date';
  const overdue = assignment.status === 'overdue';

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
    >
      <View
        className={[
          'w-10 h-10 rounded-xl items-center justify-center mr-3',
          overdue ? 'bg-rose-100' : 'bg-teal-50',
        ].join(' ')}
      >
        <AlertCircle size={18} color={overdue ? '#ef4444' : '#14b8a6'} />
      </View>
      <View className="flex-1 pr-2">
        <Text className="text-sm font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
          {assignment.title}
        </Text>
        <Text className={['text-xs mt-0.5', overdue ? 'text-rose-600' : 'text-slate-500'].join(' ')}>
          {overdue ? 'Overdue' : 'Due'} · {dueText}
        </Text>
      </View>
      <ArrowRight size={16} color="#94a3b8" />
    </Pressable>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }): React.ReactElement {
  const color = activityIconColor(activity.type);
  return (
    <View className="flex-row items-start py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${color}1A` }}>
        <Sparkles size={18} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-900 dark:text-white" numberOfLines={2}>
          {activity.title}
        </Text>
        {activity.description ? (
          <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
            {activity.description}
          </Text>
        ) : null}
        <View className="flex-row items-center mt-1">
          <Text className="text-[11px] text-slate-400 mr-2">
            {formatRelative(activity.timestamp)}
          </Text>
          {typeof activity.score === 'number' ? <ScoreBadge score={activity.score} size="sm" /> : null}
        </View>
      </View>
    </View>
  );
}

function CompetencyRow({ item }: { item: StudentCompetency }): React.ReactElement {
  const score = percentNumber(item.score);
  return (
    <View className="py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold text-slate-900 dark:text-white flex-1 pr-3" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs font-bold text-teal-700">{formatPercent(item.score)}</Text>
      </View>
      <View className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <View className="h-2.5 rounded-full bg-teal-500" style={{ width: `${score}%` }} />
      </View>
      {item.level ? (
        <Text className="text-[11px] text-slate-500 mt-1" numberOfLines={1}>
          {item.level}
          {item.trend ? ` · ${item.trend}` : ''}
        </Text>
      ) : null}
    </View>
  );
}

function InsightItem({ item }: { item: StudentInsight }): React.ReactElement {
  return (
    <View className="flex-row items-start py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <View className="w-9 h-9 rounded-xl bg-violet-50 items-center justify-center mr-3">
        <Lightbulb size={17} color="#7c3aed" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
          {item.title}
        </Text>
        {item.description ? (
          <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function ErrorPatternPill({ pattern }: { pattern: StudentErrorPattern }): React.ReactElement {
  return (
    <View className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-100 mr-2 mb-2">
      <Text className="text-xs font-semibold text-rose-700" numberOfLines={1}>
        {pattern.title}
      </Text>
      <Text className="text-[11px] text-rose-500 mt-0.5">
        {pattern.occurrences ?? 0} occurrences
      </Text>
    </View>
  );
}

export default function HomeScreen(): React.ReactElement {
  const navigation = useNavigation<HomeNavProp>();
  const { user } = useAuth();
  const unreadCount = useUnreadCount();
  const progress = useProgress();
  const quizzes = useQuizzes();
  const assignments = useAssignments();
  const activity = useRecentActivity();
  const dashboard = useStudentDashboard();
  const competencies = useCompetencies();
  const errorPatterns = useErrorPatterns();
  const insights = useInsights();

  const onRefresh = useCallback((): void => {
    void progress.refetch();
    void quizzes.refetch();
    void assignments.refetch();
    void activity.refetch();
    void dashboard.refetch();
    void competencies.refetch();
    void errorPatterns.refetch();
    void insights.refetch();
  }, [activity, assignments, competencies, dashboard, errorPatterns, insights, progress, quizzes]);

  const refreshing =
    progress.isRefetching ||
    quizzes.isRefetching ||
    assignments.isRefetching ||
    activity.isRefetching ||
    dashboard.isRefetching ||
    competencies.isRefetching ||
    errorPatterns.isRefetching ||
    insights.isRefetching;

  const topActivities = useMemo(() => (activity.data ?? []).slice(0, 4), [activity.data]);
  const upcomingAssignments = useMemo(() => (assignments.data ?? []).slice(0, 4), [assignments.data]);
  const topCompetencies = useMemo(() => (competencies.data ?? []).slice(0, 4), [competencies.data]);
  const unreadInsights = useMemo(
    () => (insights.data ?? []).filter((item) => !item.isRead).slice(0, 3),
    [insights.data],
  );
  const activePatterns = useMemo(
    () => (errorPatterns.data ?? []).filter((item) => !item.resolved).slice(0, 3),
    [errorPatterns.data],
  );

  const goPractice = useCallback((): void => {
    navigation.getParent<TabNavProp>()?.navigate('QuizTab');
  }, [navigation]);

  const goAssignments = useCallback((): void => {
    navigation.getParent<TabNavProp>()?.navigate('AssignmentsTab');
  }, [navigation]);

  const goCases = useCallback((): void => {
    navigation.getParent<TabNavProp>()?.navigate('CasesTab');
  }, [navigation]);

  const goAiChat = useCallback((): void => {
    navigation.getParent<TabNavProp>()?.navigate('VisualQaTab', {
      screen: 'VisualQaChat',
      params: {},
    });
  }, [navigation]);

  const goNotifications = useCallback((): void => {
    navigation.navigate('Notifications');
  }, [navigation]);

  const goAssignmentDetail = useCallback(
    (assignmentId: string): void => {
      navigation.getParent<TabNavProp>()?.navigate('AssignmentsTab', {
        screen: 'AssignmentDetail',
        params: { assignmentId },
      });
    },
    [navigation],
  );

  if (progress.isLoading && !progress.data) {
    return (
      <Screen>
        <Loading text="Loading home..." />
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
  const dashboardData = dashboard.data;
  const quizList = quizzes.data ?? [];
  const hasQuizList = Array.isArray(quizzes.data);
  const totalQuizzes = hasQuizList
    ? quizList.length
    : dashboardData?.totalQuizzes ?? summary?.totalQuizzes ?? 0;
  const completedQuizzes = hasQuizList
    ? quizList.filter((quiz) => quiz.status === 'completed').length
    : summary?.completedQuizzes ?? 0;
  const averageScore = dashboardData?.averageScore ?? summary?.averageScore ?? 0;
  const completionRate =
    totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;
  const accuracyRate = dashboardData?.accuracyRate ?? summary?.accuracyRate ?? averageScore;
  const streakDays = dashboardData?.streakDays ?? summary?.streakDays ?? 0;

  return (
    <Screen scroll refresh={{ refreshing, onRefresh }}>
      <View className="mb-5">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 pr-4">
            <Text className="text-xs uppercase tracking-widest text-teal-600 font-bold">
              BoneVisQA dashboard
            </Text>
            <Text className="text-2xl font-bold text-slate-950 dark:text-white mt-1" numberOfLines={2}>
              {getGreeting(user?.fullName)}
            </Text>
          </View>
          <Pressable
            onPress={goNotifications}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 items-center justify-center shadow-sm"
          >
            <Bell size={22} color="#0f766e" />
            {unreadCount > 0 ? (
              <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 items-center justify-center">
                <Text className="text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View className="rounded-3xl bg-slate-950 p-5 overflow-hidden">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-slate-300 text-xs font-semibold uppercase tracking-widest">
                Today focus
              </Text>
              <Text className="text-white text-xl font-bold mt-2" numberOfLines={2}>
                {dashboardData?.title ?? 'Build stronger diagnostic reasoning'}
              </Text>
              <Text className="text-slate-300 text-sm mt-2" numberOfLines={3}>
                {dashboardData?.focusMessage ??
                  `You have ${dashboardData?.weakTopicCount ?? 0} weak topics and ${dashboardData?.activeErrorPatterns ?? 0} active patterns to review.`}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-4xl font-bold text-white">{formatPercent(completionRate)}</Text>
              <Text className="text-[11px] text-slate-400 mt-1">complete</Text>
            </View>
          </View>
          <View className="h-2.5 rounded-full bg-slate-800 overflow-hidden mt-5">
            <View className="h-2.5 rounded-full bg-teal-400" style={{ width: `${percentNumber(completionRate)}%` }} />
          </View>
        </View>
      </View>

      <View className="flex-row gap-3 mb-3">
        <MetricTile
          icon={<BookOpen size={18} color="#0f766e" />}
          label="Quizzes"
          value={String(totalQuizzes)}
          hint={`${completedQuizzes} completed`}
          tone="teal"
        />
        <MetricTile
          icon={<Target size={18} color="#0369a1" />}
          label="Accuracy"
          value={formatPercent(accuracyRate)}
          hint="Quiz performance"
          tone="blue"
        />
      </View>

      <View className="flex-row gap-3 mb-5">
        <MetricTile
          icon={<Flame size={18} color="#b45309" />}
          label="Streak"
          value={String(streakDays)}
          hint="days active"
          tone="amber"
        />
        <MetricTile
          icon={<Trophy size={18} color="#047857" />}
          label="Average"
          value={averageScore.toFixed(1)}
          hint="out of 100"
          tone="emerald"
        />
      </View>

      <View className="flex-row gap-3 mb-5">
        <Card className="flex-1 bg-teal-50 border-teal-100" onPress={goAiChat}>
          <MessageCircle size={22} color="#0f766e" />
          <Text className="text-sm font-bold text-slate-900 mt-3" numberOfLines={2}>
            AI X-ray chat
          </Text>
          <Text className="text-xs text-slate-500 mt-1" numberOfLines={2}>
            Ask from an image or case.
          </Text>
        </Card>
        <Card className="flex-1 bg-violet-50 border-violet-100" onPress={goPractice}>
          <Sparkles size={22} color="#7c3aed" />
          <Text className="text-sm font-bold text-slate-900 mt-3" numberOfLines={2}>
            Practice quiz
          </Text>
          <Text className="text-xs text-slate-500 mt-1" numberOfLines={2}>
            Generate focused drills.
          </Text>
        </Card>
      </View>

      <Card className="mb-5">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            <BarChart3 size={18} color="#14b8a6" />
            <Text className="text-base font-bold text-slate-900 dark:text-white ml-2">
              Competency map
            </Text>
          </View>
        </View>
        {competencies.isLoading ? (
          <View className="py-6">
            <Loading text="Loading..." />
          </View>
        ) : topCompetencies.length === 0 ? (
          <EmptyState
            icon={<Gauge size={28} color="#94a3b8" />}
            title="No competency data"
            subtitle="Complete more quizzes to unlock analytics."
          />
        ) : (
          <View>
            {topCompetencies.map((item) => (
              <CompetencyRow key={item.id} item={item} />
            ))}
          </View>
        )}
      </Card>

      {activePatterns.length > 0 ? (
        <Card className="mb-5 bg-rose-50 border-rose-100">
          <View className="flex-row items-center mb-3">
            <AlertCircle size={18} color="#e11d48" />
            <Text className="text-base font-bold text-slate-900 ml-2">
              Watchlist
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            {activePatterns.map((pattern) => (
              <ErrorPatternPill key={pattern.id} pattern={pattern} />
            ))}
          </View>
        </Card>
      ) : null}

      <Card className="mb-5">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-bold text-slate-900 dark:text-white">
            Learning insights
          </Text>
        </View>
        {insights.isLoading ? (
          <View className="py-6">
            <Loading text="Loading..." />
          </View>
        ) : unreadInsights.length === 0 ? (
          <EmptyState
            icon={<Lightbulb size={28} color="#94a3b8" />}
            title="No new insights"
            subtitle="Your next recommendations will appear here."
          />
        ) : (
          <View>
            {unreadInsights.map((item) => (
              <InsightItem key={item.id} item={item} />
            ))}
          </View>
        )}
      </Card>

      <Card className="mb-5">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-bold text-slate-900 dark:text-white">
            Upcoming assignments
          </Text>
          <Text className="text-xs text-teal-600 font-bold" onPress={goAssignments}>
            View all
          </Text>
        </View>
        {assignments.isLoading ? (
          <View className="py-6">
            <Loading text="Loading..." />
          </View>
        ) : upcomingAssignments.length === 0 ? (
          <EmptyState
            icon={<Clock3 size={28} color="#94a3b8" />}
            title="No upcoming assignments"
            subtitle="You are all caught up."
          />
        ) : (
          <View>
            {upcomingAssignments.map((item) => (
              <AssignmentItem
                key={item.id}
                assignment={item}
                onPress={() => goAssignmentDetail(item.id)}
              />
            ))}
          </View>
        )}
      </Card>

      <Card className="mb-5">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-bold text-slate-900 dark:text-white">
            Recent activity
          </Text>
          <Text className="text-xs text-teal-600 font-bold" onPress={goCases}>
            Explore cases
          </Text>
        </View>
        {activity.isLoading ? (
          <View className="py-6">
            <Loading text="Loading..." />
          </View>
        ) : topActivities.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={28} color="#94a3b8" />}
            title="No activity yet"
            subtitle="Start a quiz or explore clinical cases."
          />
        ) : (
          <View>
            {topActivities.map((item) => (
              <ActivityItem key={item.id} activity={item} />
            ))}
          </View>
        )}
      </Card>

      <Button
        label="Continue practice"
        onPress={goPractice}
        rightIcon={<ArrowRight size={16} color="#ffffff" />}
        fullWidth
      />
    </Screen>
  );
}
