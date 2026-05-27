import React from 'react';
import { Alert, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import { useClass, useLeaveClass } from '../../../hooks/useClasses';
import type { ProfileStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<ProfileStackParamList, 'ClassDetail'>;
type Route = RouteProp<ProfileStackParamList, 'ClassDetail'>;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'S';
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ClassDetailScreen(): React.ReactElement {
  const navigation = useNavigation<Navigation>();
  const { classId } = useRoute<Route>().params;
  const detail = useClass(classId);
  const leave = useLeaveClass();

  const confirmLeave = (): void => {
    Alert.alert('Leave this class?', 'You will no longer have access to this class content.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave class',
        style: 'destructive',
        onPress: () =>
          leave.mutate(classId, {
            onSuccess: () => {
              Toast.show({ type: 'success', text1: 'You left the class' });
              navigation.goBack();
            },
          }),
      },
    ]);
  };

  if (detail.isLoading) {
    return (
      <Screen>
        <Loading text="Loading class details..." />
      </Screen>
    );
  }
  if (detail.isError || !detail.data) {
    return (
      <Screen>
        <ErrorView error={detail.error ?? 'Class not found.'} onRetry={() => void detail.refetch()} />
      </Screen>
    );
  }
  const item = detail.data;
  return (
    <Screen scroll>
      <Text className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
        Class detail
      </Text>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">{item.name}</Text>
      <Text className="text-sm text-slate-500 mt-1 mb-4">
        {item.semester ?? 'Semester not updated'} - {item.lecturerName ?? 'Lecturer'}
      </Text>
      <Card className="mb-4">
        <Text className="text-sm font-semibold text-slate-900 dark:text-white">
          Medical advisor
        </Text>
        <Text className="text-sm text-slate-600 mt-1">{item.expertName ?? 'Not updated'}</Text>
        {item.expertEmail ? <Text className="text-xs text-slate-500 mt-1">{item.expertEmail}</Text> : null}
      </Card>
      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-2">
          Assigned cases
        </Text>
        {item.assignedCases.length === 0 ? (
          <EmptyState title="No cases yet" />
        ) : (
          item.assignedCases.map((caseItem) => (
            <View key={caseItem.caseId} className="py-2 border-b border-slate-100">
              <Text className="text-sm font-semibold text-slate-800">{caseItem.title}</Text>
              {caseItem.isMandatory ? <Text className="text-xs text-primary">Required</Text> : null}
            </View>
          ))
        )}
      </Card>
      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-2">Assignments</Text>
        {item.quizzes.length === 0 ? (
          <Text className="text-xs text-slate-500">No quizzes yet.</Text>
        ) : (
          item.quizzes.map((quiz) => (
            <Text key={quiz.id} className="text-sm text-slate-700 py-2">
              {quiz.title} - {quiz.isCompleted ? 'Completed' : 'Not completed'}
            </Text>
          ))
        )}
      </Card>
      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-2">
          Notifications
        </Text>
        {item.announcements.length === 0 ? (
          <Text className="text-xs text-slate-500">No notifications.</Text>
        ) : (
          item.announcements.map((announcement) => (
            <View key={announcement.id} className="py-2 border-b border-slate-100">
              <Text className="text-sm font-semibold text-slate-800">{announcement.title}</Text>
              {announcement.content ? (
                <Text className="text-xs text-slate-500 mt-1" numberOfLines={2}>
                  {announcement.content}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </Card>
      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-2">
          Students ({item.students.length})
        </Text>
        {item.students.length === 0 ? (
          <EmptyState title="No students yet" />
        ) : (
          item.students.map((student) => (
            <View
              key={student.id || `${student.name}-${student.code ?? 'no-code'}`}
              className="flex-row items-center py-3 border-b border-slate-100 dark:border-slate-700/60 last:border-b-0"
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Text className="text-sm font-bold text-primary">
                  {getInitials(student.name)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                  {student.name}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>
      <Button
        label="Leave class"
        variant="destructive"
        loading={leave.isPending}
        onPress={confirmLeave}
        fullWidth
      />
    </Screen>
  );
}
