import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { History } from 'lucide-react-native';
import Screen from '../../../components/common/Screen';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import Card from '../../../components/common/Card';
import { getCaseHistory } from '../../../api/cases';
import type { ApiError } from '../../../types/api';
import type { Case } from '../../../types/case';
import type { CasesStackParamList } from '../../../navigation/types';

type NavProp = NativeStackNavigationProp<CasesStackParamList, 'CaseHistory'>;

function formatDate(value?: string): string {
  if (!value) {
    return '';
  }
  try {
    return new Date(value).toLocaleString('en-US');
  } catch {
    return value;
  }
}

export default function CaseHistoryScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const {
    data = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<Case[], ApiError>({
    queryKey: ['caseHistory'],
    queryFn: getCaseHistory,
  });

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: 'Viewed case history' });
  }, [navigation]);

  if (isLoading) {
    return (
      <Screen>
        <Loading text="Loading history..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorView error={error} onRetry={refetch} />
      </Screen>
    );
  }

  if (data.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon={<History size={48} color="#14b8a6" />}
          title="No history yet"
          subtitle="Cases you viewed or interacted with will appear here."
        />
      </Screen>
    );
  }

  const renderItem = ({ item }: { item: Case }): React.ReactElement => (
    <Card
      className="mb-3"
      onPress={() => navigation.navigate('CaseDetail', { caseId: item.id })}
    >
      <Text
        className="text-slate-900 dark:text-white text-base font-semibold mb-1"
        numberOfLines={1}
      >
        {item.title}
      </Text>
      {item.categoryName ? (
        <Text className="text-primary text-xs font-semibold mb-1">
          {item.categoryName}
        </Text>
      ) : null}
      {item.description ? (
        <Text
          className="text-slate-600 dark:text-slate-300 text-sm"
          numberOfLines={2}
        >
          {item.description}
        </Text>
      ) : null}
      {item.createdAt ? (
        <Text className="text-slate-400 text-[11px] mt-2">
          {formatDate(item.createdAt)}
        </Text>
      ) : null}
    </Card>
  );

  return (
    <Screen padding={false}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        onRefresh={refetch}
        refreshing={isRefetching}
      />
    </Screen>
  );
}
