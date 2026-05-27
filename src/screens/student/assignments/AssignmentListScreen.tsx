import React, { useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
} from 'lucide-react-native';

import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import { useAssignments } from '../../../hooks/useQuiz';
import type { AssignmentsStackParamList } from '../../../navigation/types';
import type { Assignment, AssignmentStatus } from '../../../types/quiz';

type NavProp = NativeStackNavigationProp<
  AssignmentsStackParamList,
  'AssignmentList'
>;

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  pending: 'Not submitted',
  overdue: 'Overdue',
  submitted: 'Submitted',
  graded: 'Graded',
};

function formatDate(iso: string | undefined): string {
  if (!iso) {
    return 'No due date';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'No due date';
  }
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getStatusColor(status: AssignmentStatus): string {
  switch (status) {
    case 'graded':
      return '#059669';
    case 'submitted':
      return '#0ea5e9';
    case 'overdue':
      return '#ef4444';
    case 'pending':
    default:
      return '#14b8a6';
  }
}

function StatusBadge({ status }: { status: AssignmentStatus }): React.ReactElement {
  const color = getStatusColor(status);
  return (
    <View
      className="rounded-full px-3 py-1"
      style={{ backgroundColor: `${color}1A` }}
    >
      <Text className="text-xs font-semibold" style={{ color }}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

function AssignmentIcon({
  status,
}: {
  status: AssignmentStatus;
}): React.ReactElement {
  const color = getStatusColor(status);
  const icon =
    status === 'graded' || status === 'submitted' ? (
      <CheckCircle2 size={20} color={color} />
    ) : status === 'overdue' ? (
      <AlertCircle size={20} color={color} />
    ) : (
      <Clock3 size={20} color={color} />
    );

  return (
    <View
      className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
      style={{ backgroundColor: `${color}1A` }}
    >
      {icon}
    </View>
  );
}

function AssignmentCard({
  assignment,
  onPress,
}: {
  assignment: Assignment;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Card onPress={onPress} className="mb-3">
      <View className="flex-row items-start">
        <AssignmentIcon status={assignment.status} />
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="text-base font-semibold text-slate-900 dark:text-white flex-1"
              numberOfLines={2}
            >
              {assignment.title}
            </Text>
            <StatusBadge status={assignment.status} />
          </View>
          {assignment.type ? (
            <Text className="text-xs text-slate-500 mt-1">
              {assignment.type}
            </Text>
          ) : null}
          <Text
            className={[
              'text-xs mt-2',
              assignment.status === 'overdue'
                ? 'text-rose-600'
                : 'text-slate-500 dark:text-slate-400',
            ].join(' ')}
          >
            Due: {formatDate(assignment.dueDate)}
          </Text>
          {assignment.submittedAt ? (
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Submitted: {formatDate(assignment.submittedAt)}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

export default function AssignmentListScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const assignments = useAssignments();

  const sortedAssignments = useMemo(() => {
    return [...(assignments.data ?? [])].sort((a, b) => {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [assignments.data]);

  const onRefresh = useCallback((): void => {
    void assignments.refetch();
  }, [assignments]);

  if (assignments.isLoading && !assignments.data) {
    return (
      <Screen>
        <Loading text="Loading assignments..." />
      </Screen>
    );
  }

  if (assignments.isError && assignments.error) {
    return (
      <Screen>
        <ErrorView error={assignments.error} onRetry={onRefresh} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      refresh={{ refreshing: assignments.isRefetching, onRefresh }}
    >
      <View className="mb-5">
        <Text className="text-xs uppercase tracking-widest text-primary font-semibold">
          Assignments
        </Text>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          Written assignments
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Write text answers and submit them directly in the app.
        </Text>
      </View>

      {sortedAssignments.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={32} color="#94a3b8" />}
          title="No assignments yet"
          subtitle="Assigned written work will appear here."
        />
      ) : (
        <View>
          {sortedAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onPress={() =>
                navigation.navigate('AssignmentDetail', {
                  assignmentId: assignment.id,
                })
              }
            />
          ))}
        </View>
      )}

      <View className="mt-2 flex-row items-center">
        <FileText size={14} color="#64748b" />
        <Text className="text-xs text-slate-500 dark:text-slate-400 ml-2">
          Written assignments only accept text content.
        </Text>
      </View>
    </Screen>
  );
}
