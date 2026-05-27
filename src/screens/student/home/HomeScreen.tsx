import React, { useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Flame,
  Gauge,
  Lightbulb,
  MessageCircle,
  Sparkles,
  Trophy,
} from 'lucide-react-native';

import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import StatCard from '../../../components/quiz/StatCard';
import ScoreBadge from '../../../components/quiz/ScoreBadge';
import {
  useAssignments,
  useProgress,
  useRecentActivity,
} from '../../../hooks/useQuiz';
import { useAuth } from '../../../hooks/useAuth';
import type {
  AppTabParamList,
  HomeStackParamList,
} from '../../../navigation/types';
import type { Assignment, RecentActivity } from '../../../types/quiz';

type HomeNavProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;
type TabNavProp = BottomTabNavigationProp<AppTabParamList>;

function getGreeting(fullName?: string): string {
  const hour = new Date().getHours();
  let prefix = 'Xin chào';
  if (hour < 12) {
    prefix = 'Chào buổi sáng';
  } else if (hour < 18) {
    prefix = 'Chào buổi chiều';
  } else {
    prefix = 'Chào buổi tối';
  }
  return fullName ? `${prefix}, ${fullName}` : prefix;
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
    return 'Vừa xong';
  }
  if (minutes < 60) {
    return `${minutes} phút trước`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} giờ trước`;
  }
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
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

interface AssignmentItemProps {
  assignment: Assignment;
  onPress: () => void;
}

function AssignmentItem({
  assignment,
  onPress,
}: AssignmentItemProps): React.ReactElement {
  const due = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const dueText =
    due && !Number.isNaN(due.getTime())
      ? due.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : 'Không xác định';
  const overdue = assignment.status === 'overdue';
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
    >
      <View
        className={[
          'w-9 h-9 rounded-xl items-center justify-center mr-3',
          overdue ? 'bg-rose-100' : 'bg-primary/10',
        ].join(' ')}
      >
        <AlertCircle size={18} color={overdue ? '#ef4444' : '#14b8a6'} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
          {assignment.title}
        </Text>
        <Text className={['text-xs mt-0.5', overdue ? 'text-rose-600' : 'text-slate-500'].join(' ')}>
          {overdue ? 'Quá hạn · ' : 'Hạn: '} {dueText}
        </Text>
      </View>
    </Pressable>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }): React.ReactElement {
  const color = activityIconColor(activity.type);
  return (
    <View className="flex-row items-start py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: `${color}1A` }}
      >
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
          {typeof activity.score === 'number' ? (
            <ScoreBadge score={activity.score} size="sm" />
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen(): React.ReactElement {
  const navigation = useNavigation<HomeNavProp>();
  const { user } = useAuth();
  const progress = useProgress();
  const assignments = useAssignments();
  const activity = useRecentActivity();

  const onRefresh = useCallback((): void => {
    void progress.refetch();
    void assignments.refetch();
    void activity.refetch();
  }, [activity, assignments, progress]);

  const refreshing =
    progress.isRefetching || assignments.isRefetching || activity.isRefetching;

  const topActivities = useMemo(
    () => (activity.data ?? []).slice(0, 5),
    [activity.data],
  );
  const upcomingAssignments = useMemo(
    () => (assignments.data ?? []).slice(0, 5),
    [assignments.data],
  );

  const goPractice = useCallback((): void => {
    const parent = navigation.getParent<TabNavProp>();
    parent?.navigate('QuizTab');
  }, [navigation]);

  const goAssignments = useCallback((): void => {
    const parent = navigation.getParent<TabNavProp>();
    parent?.navigate('AssignmentsTab');
  }, [navigation]);

  const goAiChat = useCallback((): void => {
    const parent = navigation.getParent<TabNavProp>();
    parent?.navigate('VisualQaTab', {
      screen: 'VisualQaChat',
      params: {},
    });
  }, [navigation]);

  const goAssignmentDetail = useCallback(
    (assignmentId: string): void => {
      const parent = navigation.getParent<TabNavProp>();
      parent?.navigate('AssignmentsTab', {
        screen: 'AssignmentDetail',
        params: { assignmentId },
      });
    },
    [navigation],
  );

  if (progress.isLoading && !progress.data) {
    return (
      <Screen>
        <Loading text="Đang tải trang chủ…" />
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

  return (
    <Screen scroll refresh={{ refreshing, onRefresh }}>
      <View className="mb-5">
        <Text className="text-xs uppercase tracking-widest text-primary font-semibold">
          BoneVisQA
        </Text>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {getGreeting(user?.fullName)}
        </Text>
        <Text className="text-sm text-slate-500 mt-1">
          Hôm nay bạn muốn rèn luyện gì?
        </Text>
      </View>

      <Card className="mb-5 bg-teal-50 border border-primary/20">
        <View className="flex-row items-center mb-4">
          <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center mr-3">
            <MessageCircle size={24} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              Chatbox AI X-quang
            </Text>
            <Text className="text-xs text-slate-600 mt-1">
              Trao đổi trực tiếp với AI hoặc đính kèm ảnh để phân tích.
            </Text>
          </View>
        </View>
        <Button
          label="Mở chatbox AI"
          onPress={goAiChat}
          rightIcon={<ArrowRight size={16} color="#ffffff" />}
          fullWidth
        />
      </Card>

      <View className="flex-row gap-3 mb-5">
        <StatCard
          icon={<BookOpen size={18} color="#14b8a6" />}
          label="Tổng quiz"
          value={String(summary?.totalQuizzes ?? 0)}
          hint={`Hoàn thành ${summary?.completedQuizzes ?? 0}`}
          tone="primary"
        />
        <StatCard
          icon={<Trophy size={18} color="#059669" />}
          label="Điểm trung bình"
          value={(summary?.averageScore ?? 0).toFixed(1)}
          hint="Trên 100"
          tone="emerald"
        />
        <StatCard
          icon={<Flame size={18} color="#d97706" />}
          label="Chuỗi ngày"
          value={String(summary?.streakDays ?? 0)}
          hint="Giữ phong độ"
          tone="amber"
        />
      </View>

      <Card className="mb-5">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">
            Assignments sắp đến hạn
          </Text>
          <Text className="text-xs text-primary font-semibold" onPress={goAssignments}>
            Xem tất cả
          </Text>
        </View>
        {assignments.isLoading ? (
          <View className="py-6">
            <Loading text="Đang tải…" />
          </View>
        ) : upcomingAssignments.length === 0 ? (
          <EmptyState
            icon={<Gauge size={28} color="#94a3b8" />}
            title="Không có bài tập sắp đến hạn"
            subtitle="Bạn đã hoàn thành mọi thứ — hãy thử luyện tập thêm!"
          />
        ) : (
          <View>
            {upcomingAssignments.map((a) => (
              <AssignmentItem
                key={a.id}
                assignment={a}
                onPress={() => goAssignmentDetail(a.id)}
              />
            ))}
          </View>
        )}
      </Card>

      <Card className="mb-5">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-semibold text-slate-900 dark:text-white">
            Hoạt động gần đây
          </Text>
        </View>
        {activity.isLoading ? (
          <View className="py-6">
            <Loading text="Đang tải…" />
          </View>
        ) : topActivities.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={28} color="#94a3b8" />}
            title="Chưa có hoạt động"
            subtitle="Bắt đầu một bài quiz hoặc khám phá ca lâm sàng."
          />
        ) : (
          <View>
            {topActivities.map((a) => (
              <ActivityItem key={a.id} activity={a} />
            ))}
          </View>
        )}
      </Card>

      <Card className="mb-4 bg-primary/5 border border-primary/20">
        <View className="flex-row items-center mb-2">
          <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
            <Lightbulb size={20} color="#14b8a6" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">
              Practice gợi ý
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              Luyện tập theo chủ đề, AI sinh câu hỏi riêng cho bạn.
            </Text>
          </View>
        </View>
        <Button
          label="Làm quiz luyện tập"
          onPress={goPractice}
          rightIcon={<ArrowRight size={16} color="#ffffff" />}
          fullWidth
        />
      </Card>
    </Screen>
  );
}
