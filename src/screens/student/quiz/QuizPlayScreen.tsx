import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const submitLockRef = useRef<boolean>(false);

  // Intercept back nav while in progress
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!attempt || isSubmitting) {
        return;
      }
      e.preventDefault();
      Alert.alert(
        'Leave this attempt?',
        'Your attempt is being autosaved. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel', onPress: () => undefined },
          {
            text: 'Leave',
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
    if (submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
    try {
      const result = await submit();
      Toast.show({
        type: 'success',
        text1: 'Submitted',
        text2:
          typeof result.score === 'number'
            ? `Your score: ${result.score.toFixed(1)}`
            : 'Attempt recorded',
      });
      navigation.replace('QuizReview', { attemptId: result.id });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Submission failed',
        text2:
          (err as { message?: string }).message ?? 'Please try again later.',
      });
    } finally {
      submitLockRef.current = false;
      setConfirmVisible(false);
    }
  }, [navigation, quizId, submit]);

  const confirmSubmit = useCallback((): void => {
    if (isSubmitting || submitLockRef.current) {
      return;
    }
    setConfirmVisible(true);
    Alert.alert(
      'Submit?',
      'Do you want to submit this attempt now?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setConfirmVisible(false),
        },
        {
          text: 'Submit',
          style: 'default',
          onPress: () => void handleSubmit(),
        },
      ],
    );
  }, [handleSubmit, isSubmitting]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900">
        <Loading text="Preparing attempt..." />
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
        <Loading text="No questions available" />
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
            label="Question"
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
            label="Previous"
            variant="outline"
            onPress={prev}
            disabled={isFirst || isSubmitting}
            fullWidth
          />
        </View>
        <View className="flex-1">
          {isLast ? (
            <Button
              label="Submit"
              onPress={confirmSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
            />
          ) : (
            <Button
              label="Next"
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
