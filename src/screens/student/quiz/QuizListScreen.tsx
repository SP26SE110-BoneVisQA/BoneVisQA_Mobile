import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BarChart3, ClipboardList, History, Sparkles } from 'lucide-react-native';

import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import QuizCardListItem from '../../../components/quiz/QuizCardListItem';
import { usePracticeList, useQuizzes } from '../../../hooks/useQuiz';
import type { QuizStackParamList } from '../../../navigation/types';
import type { Quiz } from '../../../types/quiz';

type NavProp = NativeStackNavigationProp<QuizStackParamList, 'QuizList'>;

type TabKey = 'assigned' | 'practice';

interface TabDef {
  key: TabKey;
  label: string;
}

const TABS: ReadonlyArray<TabDef> = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'practice', label: 'Practice' },
];

function HeaderActions({
  onHistory,
  onProgress,
}: {
  onHistory: () => void;
  onProgress: () => void;
}): React.ReactElement {
  return (
    <View className="flex-row gap-2">
      <Pressable
        onPress={onHistory}
        className="flex-row items-center px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
      >
        <History size={16} color="#334155" />
        <Text className="ml-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
          History
        </Text>
      </Pressable>
      <Pressable
        onPress={onProgress}
        className="flex-row items-center px-3 py-2 rounded-xl bg-primary/10"
      >
        <BarChart3 size={16} color="#14b8a6" />
        <Text className="ml-1.5 text-xs font-semibold text-primary">Progress</Text>
      </Pressable>
    </View>
  );
}

export default function QuizListScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const [activeTab, setActiveTab] = useState<TabKey>('assigned');

  const assignedQ = useQuizzes();
  const practiceQ = usePracticeList();

  const active = activeTab === 'assigned' ? assignedQ : practiceQ;

  const quizzes: Quiz[] = useMemo(() => active.data ?? [], [active.data]);

  const handleOpen = useCallback(
    (quiz: Quiz): void => {
      navigation.navigate('QuizPlay', { quizId: quiz.id });
    },
    [navigation],
  );

  const handleRefresh = useCallback(() => {
    void assignedQ.refetch();
    void practiceQ.refetch();
  }, [assignedQ, practiceQ]);

  const refreshing = assignedQ.isRefetching || practiceQ.isRefetching;

  const renderEmpty = (): React.ReactElement => {
    if (active.isLoading) {
      return <Loading text="Loading quizzes..." />;
    }
    if (active.isError && active.error) {
      return (
        <ErrorView error={active.error} onRetry={() => void active.refetch()} />
      );
    }
    return (
      <EmptyState
        icon={
          activeTab === 'assigned' ? (
            <ClipboardList size={36} color="#94a3b8" />
          ) : (
            <Sparkles size={36} color="#94a3b8" />
          )
        }
        title={
          activeTab === 'assigned'
            ? 'No assigned quizzes yet'
            : 'No practice quizzes yet'
        }
        subtitle={
          activeTab === 'assigned'
            ? 'Quizzes from lecturers will appear here.'
            : 'Create a practice quiz to get started.'
        }
        actionLabel={activeTab === 'practice' ? 'Create practice quiz' : undefined}
        onAction={
          activeTab === 'practice'
            ? (): void => navigation.navigate('PracticeMode')
            : undefined
        }
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-xs uppercase tracking-widest text-primary font-semibold">
              Quiz
            </Text>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              Your assignments
            </Text>
          </View>
          <HeaderActions
            onHistory={() => navigation.navigate('QuizHistory')}
            onProgress={() => navigation.navigate('Progress')}
          />
        </View>

        <View className="flex-row bg-slate-100 dark:bg-slate-800 rounded-2xl p-1">
          {TABS.map((tab) => {
            const selected = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={[
                  'flex-1 items-center py-2 rounded-xl',
                  selected ? 'bg-white dark:bg-slate-700' : '',
                ].join(' ')}
              >
                <Text
                  className={[
                    'text-sm font-semibold',
                    selected
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400',
                  ].join(' ')}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={quizzes}
        keyExtractor={(item) => item.id || `${item.title}-${item.questionCount}`}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#14b8a6"
          />
        }
        renderItem={({ item }) => (
          <QuizCardListItem quiz={item} onPress={handleOpen} />
        )}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}
