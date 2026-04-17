import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Minus, Plus, Sparkles, Wand2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import EmptyState from '../../../components/common/EmptyState';
import Loading from '../../../components/common/Loading';
import QuizCardListItem from '../../../components/quiz/QuizCardListItem';
import {
  useGeneratePractice,
  usePracticeList,
  useSavePractice,
} from '../../../hooks/useQuiz';
import type { QuizStackParamList } from '../../../navigation/types';
import type { PracticeDifficulty, Quiz } from '../../../types/quiz';

type NavProp = NativeStackNavigationProp<QuizStackParamList, 'PracticeMode'>;

interface DifficultyDef {
  key: PracticeDifficulty;
  label: string;
}

const DIFFICULTIES: ReadonlyArray<DifficultyDef> = [
  { key: 'easy', label: 'Dễ' },
  { key: 'medium', label: 'Trung bình' },
  { key: 'hard', label: 'Khó' },
];

const MIN_COUNT = 5;
const MAX_COUNT = 30;

export default function PracticeModeScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('medium');
  const [count, setCount] = useState<number>(10);
  const [topicError, setTopicError] = useState<string | undefined>(undefined);

  const generate = useGeneratePractice();
  const save = useSavePractice();
  const practiceList = usePracticeList();

  const existingPractice: Quiz[] = useMemo(
    () => practiceList.data ?? [],
    [practiceList.data],
  );

  const handleSubmit = useCallback(async (): Promise<void> => {
    const trimmed = topic.trim();
    if (trimmed.length === 0) {
      setTopicError('Vui lòng nhập chủ đề');
      return;
    }
    setTopicError(undefined);
    try {
      const result = await generate.mutateAsync({
        topic: trimmed,
        difficulty,
        count,
      });
      // Best-effort save in background
      save
        .mutateAsync({ topic: trimmed, difficulty, count })
        .catch(() => undefined);
      Toast.show({
        type: 'success',
        text1: 'Đã tạo bài luyện tập',
      });
      navigation.replace('QuizPlay', { quizId: result.quizId });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Tạo bài luyện tập thất bại',
        text2: (err as { message?: string }).message,
      });
    }
  }, [count, difficulty, generate, navigation, save, topic]);

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
              Tạo bài luyện tập
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              AI sẽ sinh câu hỏi theo chủ đề bạn chọn.
            </Text>
          </View>
        </View>

        <Input
          label="Chủ đề"
          placeholder="VD: Gãy xương cẳng tay"
          value={topic}
          onChangeText={(text) => {
            setTopic(text);
            if (topicError) {
              setTopicError(undefined);
            }
          }}
          error={topicError}
        />

        <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-4 mb-1.5 ml-1">
          Độ khó
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
          Số câu hỏi
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
          Từ {MIN_COUNT} đến {MAX_COUNT} câu
        </Text>

        <View className="mt-4">
          <Button
            label="Tạo bài luyện tập"
            onPress={() => void handleSubmit()}
            loading={generate.isPending}
            leftIcon={<Sparkles size={16} color="#ffffff" />}
            fullWidth
          />
        </View>
      </Card>

      <Text className="text-base font-semibold text-slate-900 dark:text-white mb-2">
        Bài luyện tập đã lưu
      </Text>

      {practiceList.isLoading ? (
        <Loading text="Đang tải…" />
      ) : existingPractice.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={32} color="#94a3b8" />}
          title="Chưa có bài lưu"
          subtitle="Các bài luyện tập bạn tạo sẽ được lưu tại đây."
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
