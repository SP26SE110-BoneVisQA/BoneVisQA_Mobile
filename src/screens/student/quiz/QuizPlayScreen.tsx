import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import Button from '../../../components/common/Button';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import QuestionCard from '../../../components/quiz/QuestionCard';
import QuizTimer from '../../../components/quiz/QuizTimer';
import QuizProgressBar from '../../../components/quiz/QuizProgressBar';
import { useQuizAttempt } from '../../../hooks/useQuizAttempt';
import type { QuizStackParamList } from '../../../navigation/types';

type NavProp = NativeStackNavigationProp<QuizStackParamList, 'QuizPlay'>;
type RouteType = RouteProp<QuizStackParamList, 'QuizPlay'>;

export default function QuizPlayScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { quizId } = route.params;
  const {
    isLoading,
    isSubmitting,
    error,
    questions,
    currentIndex,
    answers,
    durationMinutes,
    attempt,
    next,
    prev,
    setAnswer,
    submit,
    discard,
  } = useQuizAttempt(quizId);

  const [confirmVisible, setConfirmVisible] = useState<boolean>(false);

  // Intercept back nav while in progress
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!attempt || isSubmitting) {
        return;
      }
      e.preventDefault();
      Alert.alert(
        'Rời khỏi bài làm?',
        'Bài làm đang được lưu tự động. Bạn có chắc muốn rời đi?',
        [
          { text: 'Ở lại', style: 'cancel', onPress: () => undefined },
          {
            text: 'Rời đi',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });
    return unsubscribe;
  }, [attempt, isSubmitting, navigation]);

  const currentQuestion = useMemo(
    () => questions[currentIndex],
    [questions, currentIndex],
  );

  const currentSelected = useMemo((): string[] => {
    if (!currentQuestion) {
      return [];
    }
    const match = answers.find((a) => a.questionId === currentQuestion.id);
    return match?.selectedOptionIds ?? [];
  }, [answers, currentQuestion]);

  const handleChange = useCallback(
    (optionIds: string[]): void => {
      if (!currentQuestion) {
        return;
      }
      setAnswer(currentQuestion.id, optionIds);
    },
    [currentQuestion, setAnswer],
  );

  const isLast = questions.length > 0 && currentIndex === questions.length - 1;
  const isFirst = currentIndex === 0;

  const handleSubmit = useCallback(async (): Promise<void> => {
    try {
      const result = await submit();
      Toast.show({
        type: 'success',
        text1: 'Đã nộp bài',
        text2:
          typeof result.score === 'number'
            ? `Điểm của bạn: ${result.score.toFixed(1)}`
            : 'Đã ghi nhận bài làm',
      });
      navigation.replace('QuizReview', { attemptId: result.id });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Nộp bài thất bại',
        text2:
          (err as { message?: string }).message ?? 'Vui lòng thử lại sau.',
      });
    } finally {
      setConfirmVisible(false);
    }
  }, [navigation, submit]);

  const confirmSubmit = useCallback((): void => {
    setConfirmVisible(true);
    Alert.alert(
      'Nộp bài?',
      'Bạn có muốn nộp bài làm này ngay bây giờ không?',
      [
        {
          text: 'Huỷ',
          style: 'cancel',
          onPress: () => setConfirmVisible(false),
        },
        {
          text: 'Nộp bài',
          style: 'default',
          onPress: () => void handleSubmit(),
        },
      ],
    );
  }, [handleSubmit]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
        <Loading text="Đang chuẩn bị bài làm…" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
        <ErrorView
          error={error}
          onRetry={() => {
            void discard().then(() => navigation.replace('QuizPlay', { quizId }));
          }}
        />
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
        <Loading text="Không có câu hỏi" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['bottom']}>
      <View className="px-5 pt-3 pb-3 flex-row items-center gap-3">
        <View className="flex-1">
          <QuizProgressBar
            current={currentIndex + 1}
            total={questions.length}
            label="Câu hỏi"
          />
        </View>
        {durationMinutes && attempt ? (
          <QuizTimer
            durationMinutes={durationMinutes}
            startedAt={attempt.startedAt}
            onExpire={() => {
              if (!confirmVisible) {
                void handleSubmit();
              }
            }}
          />
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <QuestionCard
          question={currentQuestion}
          selectedIds={currentSelected}
          onChange={handleChange}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          disabled={isSubmitting}
        />
      </ScrollView>

      <View className="px-5 pt-3 pb-4 flex-row gap-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <View className="flex-1">
          <Button
            label="Trước"
            variant="outline"
            onPress={prev}
            disabled={isFirst || isSubmitting}
            fullWidth
          />
        </View>
        <View className="flex-1">
          {isLast ? (
            <Button
              label="Nộp bài"
              onPress={confirmSubmit}
              loading={isSubmitting}
              fullWidth
            />
          ) : (
            <Button
              label="Tiếp"
              onPress={next}
              disabled={isSubmitting}
              fullWidth
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
