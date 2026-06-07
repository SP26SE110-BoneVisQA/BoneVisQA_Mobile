import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Minus, Plus, Radio, Sparkles, Wand2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import EmptyState from '../../../components/common/EmptyState';
import Loading from '../../../components/common/Loading';
import QuizCardListItem from '../../../components/quiz/QuizCardListItem';
import {
  useGeneratePracticeFromCases,
  useGeneratePractice,
  usePracticeList,
  useQuizCases,
  useSavePractice,
} from '../../../hooks/useQuiz';
import type { QuizStackParamList } from '../../../navigation/types';
import type {
  GeneratedPracticeResult,
  PracticeDifficulty,
  Quiz,
} from '../../../types/quiz';

type NavProp = NativeStackNavigationProp<QuizStackParamList, 'PracticeMode'>;

interface DifficultyDef {
  key: PracticeDifficulty;
  label: string;
}

const DIFFICULTIES: ReadonlyArray<DifficultyDef> = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
];

const MIN_COUNT = 5;
const MAX_COUNT = 30;
const CASE_COUNT_LIMIT = 3;

type GenerateMode = 'topic' | 'cases';

function buildInitialAttempt(result: GeneratedPracticeResult) {
  return {
    id: result.attemptId,
    quizId: result.quizId,
    quizTitle: result.title,
    startedAt: new Date().toISOString(),
    status: 'in_progress' as const,
    answers: [],
    questions: result.questions,
  };
}

export default function PracticeModeScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('medium');
  const [count, setCount] = useState<number>(10);
  const [topicError, setTopicError] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<GenerateMode>('topic');
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

  const generate = useGeneratePractice();
  const generateFromCases = useGeneratePracticeFromCases();
  const save = useSavePractice();
  const practiceList = usePracticeList();
  const quizCases = useQuizCases();

  const existingPractice: Quiz[] = useMemo(
    () => practiceList.data ?? [],
    [practiceList.data],
  );
  const caseOptions = useMemo(
    () => (quizCases.data ?? []).filter((item) => item.caseId).slice(0, 12),
    [quizCases.data],
  );
  const selectedCases = useMemo(
    () =>
      caseOptions.filter(
        (item) => item.caseId && selectedCaseIds.includes(item.caseId),
      ),
    [caseOptions, selectedCaseIds],
  );

  const toggleCase = useCallback((caseId: string): void => {
    setSelectedCaseIds((prev) => {
      if (prev.includes(caseId)) {
        return prev.filter((id) => id !== caseId);
      }
      return [caseId, ...prev].slice(0, CASE_COUNT_LIMIT);
    });
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    const trimmed = topic.trim();
    if (mode === 'topic' && trimmed.length === 0) {
      setTopicError('Please enter a topic');
      return;
    }
    if (mode === 'cases' && selectedCases.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Choose at least one case',
      });
      return;
    }
    setTopicError(undefined);
    try {
      const result =
        mode === 'cases'
          ? await generateFromCases.mutateAsync({
              cases: selectedCases,
              difficulty,
              count,
            })
          : await generate.mutateAsync({
              topic: trimmed,
              difficulty,
              count,
            });
      if (mode === 'topic') {
        save
          .mutateAsync({ topic: trimmed, difficulty, count })
          .catch(() => undefined);
      }
      Toast.show({
        type: 'success',
        text1: 'Practice quiz created',
      });
      navigation.replace('QuizPlay', {
        quizId: result.quizId,
        attemptId: result.attemptId,
        initialAttempt: buildInitialAttempt(result),
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed to create practice quiz',
        text2: (err as { message?: string }).message,
      });
    }
  }, [
    count,
    difficulty,
    generate,
    generateFromCases,
    mode,
    navigation,
    save,
    selectedCases,
    topic,
  ]);

  const handleOpenSaved = useCallback(
    (quiz: Quiz): void => {
      navigation.navigate('QuizPlay', { quizId: quiz.id });
    },
    [navigation],
  );

  return (
    <Screen scroll>
      <Card className="mb-4">
        <View className="flex-row items-center mb-3">
          <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
            <Wand2 size={20} color="#14b8a6" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">
              Create practice quiz
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              AI will generate questions based on your selected topic.
            </Text>
          </View>
        </View>

        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1 mb-1.5 ml-1">
          Generate from
        </Text>
        <View className="flex-row bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-4">
          {[
            { key: 'topic' as const, label: 'Topic' },
            { key: 'cases' as const, label: 'Cases' },
          ].map((item) => {
            const selected = mode === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setMode(item.key)}
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
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Input
          label="Theme"
          placeholder="Example: Forearm fracture"
          value={topic}
          editable={mode === 'topic'}
          onChangeText={(text) => {
            setTopic(text);
            if (topicError) {
              setTopicError(undefined);
            }
          }}
          error={topicError}
        />

        {mode === 'cases' ? (
          <View className="mt-4">
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              Select cases ({selectedCaseIds.length}/{CASE_COUNT_LIMIT})
            </Text>
            {quizCases.isLoading ? (
              <Loading text="Loading cases..." />
            ) : caseOptions.length === 0 ? (
              <EmptyState
                icon={<Radio size={28} color="#94a3b8" />}
                title="No cases available"
                subtitle="Case-based generation will appear when cases are available."
              />
            ) : (
              caseOptions.map((item) => {
                const caseId = item.caseId ?? '';
                const selected = selectedCaseIds.includes(caseId);
                return (
                  <Pressable
                    key={caseId}
                    onPress={() => toggleCase(caseId)}
                    className={[
                      'p-3 rounded-2xl border mb-2',
                      selected
                        ? 'bg-primary/10 border-primary'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                    ].join(' ')}
                  >
                    <Text className="text-sm font-semibold text-slate-900 dark:text-white" numberOfLines={1}>
                      {item.caseTitle ?? 'Clinical case'}
                    </Text>
                    <Text className="text-xs text-slate-500 mt-1" numberOfLines={2}>
                      {item.caseDescription ?? item.keyFindings ?? 'No description'}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        ) : null}

        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-4 mb-1.5 ml-1">
          Difficulty
        </Text>
        <View className="flex-row bg-slate-100 dark:bg-slate-800 rounded-2xl p-1">
          {DIFFICULTIES.map((d) => {
            const selected = d.key === difficulty;
            return (
              <Pressable
                key={d.key}
                onPress={() => setDifficulty(d.key)}
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
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-4 mb-1.5 ml-1">
          Number of questions
        </Text>
        <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-2">
          <Pressable
            onPress={() => setCount((c) => Math.max(MIN_COUNT, c - 1))}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 items-center justify-center"
          >
            <Minus size={18} color="#0f172a" />
          </Pressable>
          <Text className="flex-1 text-center text-xl font-bold text-slate-900 dark:text-white">
            {count}
          </Text>
          <Pressable
            onPress={() => setCount((c) => Math.min(MAX_COUNT, c + 1))}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 items-center justify-center"
          >
            <Plus size={18} color="#0f172a" />
          </Pressable>
        </View>
        <Text className="text-xs text-slate-400 mt-1 ml-1">
          From {MIN_COUNT} to {MAX_COUNT} questions
        </Text>

        <View className="mt-4">
          <Button
            label="Create practice quiz"
            onPress={() => void handleSubmit()}
            loading={generate.isPending || generateFromCases.isPending}
            leftIcon={<Sparkles size={16} color="#ffffff" />}
            fullWidth
          />
        </View>
      </Card>

      <Text className="text-base font-semibold text-slate-900 dark:text-white mb-2">
        Saved practice quizzes
      </Text>

      {practiceList.isLoading ? (
        <Loading text="Loading…" />
      ) : existingPractice.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={32} color="#94a3b8" />}
          title="No saved quizzes yet"
          subtitle="Practice quizzes you create will be saved here."
        />
      ) : (
        existingPractice.map((quiz) => (
          <QuizCardListItem
            key={quiz.id || quiz.title}
            quiz={quiz}
            onPress={handleOpenSaved}
          />
        ))
      )}
    </Screen>
  );
}
