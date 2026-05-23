import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Users } from 'lucide-react-native';
import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import { useClasses } from '../../../hooks/useClasses';
import type { ProfileStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<ProfileStackParamList, 'Classes'>;

export default function ClassListScreen(): React.ReactElement {
  const navigation = useNavigation<Navigation>();
  const classes = useClasses();
  if (classes.isLoading) {
    return (
      <Screen>
        <Loading text="Đang tải danh sách lớp..." />
      </Screen>
    );
  }
  if (classes.isError) {
    return (
      <Screen>
        <ErrorView error={classes.error} onRetry={() => void classes.refetch()} />
      </Screen>
    );
  }
  return (
    <Screen
      scroll
      refresh={{ refreshing: classes.isRefetching, onRefresh: () => void classes.refetch() }}
    >
      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Lớp học của tôi
      </Text>
      {(classes.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Users size={40} color="#14b8a6" />}
          title="Chưa tham gia lớp"
          subtitle="Lớp học của bạn sẽ hiển thị tại đây."
        />
      ) : (
        classes.data?.map((item) => (
          <Card
            key={item.id}
            className="mb-3"
            onPress={() => navigation.navigate('ClassDetail', { classId: item.id })}
          >
            <Text className="text-lg font-semibold text-slate-900 dark:text-white">
              {item.name}
            </Text>
            <Text className="text-sm text-slate-500 mt-1">
              {item.semester ?? 'Học kỳ chưa cập nhật'} - {item.lecturerName ?? 'Giảng viên'}
            </Text>
            <View className="flex-row gap-4 mt-3">
              <Text className="text-xs text-slate-600">{item.totalCases} ca</Text>
              <Text className="text-xs text-slate-600">{item.totalQuizzes} quiz</Text>
              <Text className="text-xs text-slate-600">{item.totalAnnouncements} tin mới</Text>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
