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

export default function ClassDetailScreen(): React.ReactElement {
  const navigation = useNavigation<Navigation>();
  const { classId } = useRoute<Route>().params;
  const detail = useClass(classId);
  const leave = useLeaveClass();

  const confirmLeave = (): void => {
    Alert.alert('Bạn có chắc muốn rời lớp?', 'Bạn sẽ không còn truy cập nội dung lớp này.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Rời lớp',
        style: 'destructive',
        onPress: () =>
          leave.mutate(classId, {
            onSuccess: () => {
              Toast.show({ type: 'success', text1: 'Đã rời lớp học' });
              navigation.goBack();
            },
          }),
      },
    ]);
  };

  if (detail.isLoading) {
    return (
      <Screen>
        <Loading text="Đang tải thông tin lớp..." />
      </Screen>
    );
  }
  if (detail.isError || !detail.data) {
    return (
      <Screen>
        <ErrorView error={detail.error ?? 'Không tìm thấy lớp.'} onRetry={() => void detail.refetch()} />
      </Screen>
    );
  }
  const item = detail.data;
  return (
    <Screen scroll>
      <Text className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
        Chi tiết lớp
      </Text>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white">{item.name}</Text>
      <Text className="text-sm text-slate-500 mt-1 mb-4">
        {item.semester ?? 'Học kỳ chưa cập nhật'} - {item.lecturerName ?? 'Giảng viên'}
      </Text>
      <Card className="mb-4">
        <Text className="text-sm font-semibold text-slate-900 dark:text-white">
          Cố vấn chuyên môn
        </Text>
        <Text className="text-sm text-slate-600 mt-1">{item.expertName ?? 'Chưa cập nhật'}</Text>
        {item.expertEmail ? <Text className="text-xs text-slate-500 mt-1">{item.expertEmail}</Text> : null}
      </Card>
      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-2">
          Ca được giao
        </Text>
        {item.assignedCases.length === 0 ? (
          <EmptyState title="Chưa có ca" />
        ) : (
          item.assignedCases.map((caseItem) => (
            <View key={caseItem.caseId} className="py-2 border-b border-slate-100">
              <Text className="text-sm font-semibold text-slate-800">{caseItem.title}</Text>
              {caseItem.isMandatory ? <Text className="text-xs text-primary">Bắt buộc</Text> : null}
            </View>
          ))
        )}
      </Card>
      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-2">Bài tập</Text>
        {item.quizzes.length === 0 ? (
          <Text className="text-xs text-slate-500">Chưa có quiz.</Text>
        ) : (
          item.quizzes.map((quiz) => (
            <Text key={quiz.id} className="text-sm text-slate-700 py-2">
              {quiz.title} - {quiz.isCompleted ? 'Đã làm' : 'Chưa làm'}
            </Text>
          ))
        )}
      </Card>
      <Card className="mb-4">
        <Text className="text-base font-semibold text-slate-900 dark:text-white mb-2">
          Thông báo
        </Text>
        {item.announcements.length === 0 ? (
          <Text className="text-xs text-slate-500">Chưa có thông báo.</Text>
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
        <Text className="text-sm text-slate-600">
          Thành viên trong lớp: {item.students.length}
        </Text>
      </Card>
      <Button
        label="Rời lớp"
        variant="destructive"
        loading={leave.isPending}
        onPress={confirmLeave}
        fullWidth
      />
    </Screen>
  );
}
