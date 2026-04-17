import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, RotateCcw, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import ScoreBadge from '../../../components/quiz/ScoreBadge';
import { getReview } from '../../../api/quizzes';
import { useRequestRetake, quizKeys } from '../../../hooks/useQuiz';
import type { QuizStackParamList } from '../../../navigation/types';
import type { ApiError } from '../../../types/api';
import type { ReviewQuestion, ReviewResult } from '../../../types/quiz';

type NavProp = NativeStackNavigationProp<QuizStackParamList, 'QuizReview'>;
type RouteType = RouteProp<QuizStackParamList, 'QuizReview'>;

interface QuestionReviewCardProps {
  question: ReviewQuestion;
  index: number;
}

function QuestionReviewCard({
  question,
  index,
}: QuestionReviewCardProps): React.ReactElement {
  return (
    <Card className="mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs uppercase tracking-wider text-slate-500">
          Câu {index + 1}
        </Text>
        <View
          className={[
            'flex-row items-center px-2 py-0.5 rounded-full',
            question.isCorrect ? 'bg-emerald-100' : 'bg-rose-100',
          ].join(' ')}
        >
          {question.isCorrect ? (
            <Check size={12} color="#059669" />
          ) : (
            <X size={12} color="#e11d48" />
          )}
          <Text
            className={[
              'ml-1 text-xs font-semibold',
              question.isCorrect ? 'text-emerald-700' : 'text-rose-700',
            ].join(' ')}
          >
            {question.isCorrect ? 'Đúng' : 'Sai'}
          </Text>
        </View>
      </View>
      <Text className="text-base font-semibold text-slate-900 dark:text-white mb-3">
        {question.prompt}
      </Text>
      <View>
        {question.options.map((opt) => {
          const isCorrect = question.correctOptionIds.includes(opt.id);
          const isSelected = question.selected.includes(opt.id);
          const bg = isCorrect
            ? 'bg-emerald-50 border-emerald-200'
            : isSelected
              ? 'bg-rose-50 border-rose-200'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
          return (
            <View
              key={opt.id}
              className={['p-3 rounded-xl mb-2 border', bg].join(' ')}
            >
              <Text className="text-sm text-slate-900 dark:text-white">
                <Text className="font-semibold">{opt.id}.</Text> {opt.label}
              </Text>
              {isCorrect ? (
                <Text className="text-[11px] text-emerald-600 mt-1">
                  Đáp án đúng
                </Text>
              ) : isSelected ? (
                <Text className="text-[11px] text-rose-600 mt-1">
                  Bạn đã chọn
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
      {question.explanation ? (
        <View className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <Text className="text-xs font-semibold text-primary mb-1">Giải thích</Text>
          <Text className="text-sm text-slate-700 dark:text-slate-200">
            {question.explanation}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

export default function QuizReviewScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { attemptId } = route.params;
  const retake = useRequestRetake();

  const { data, isLoading, isError, error, refetch } = useQuery<
    ReviewResult,
    ApiError
  >({
    queryKey: quizKeys.review(attemptId),
    queryFn: () => getReview(attemptId),
  });

  const handleRetake = useCallback(async (): Promise<void> => {
    if (!data?.quizId) {
      Toast.show({
        type: 'error',
        text1: 'Không tìm thấy bài quiz gốc',
      });
      return;
    }
    try {
      await retake.mutateAsync(data.quizId);
      Toast.show({
        type: 'success',
        text1: 'Đã gửi yêu cầu làm lại',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Gửi yêu cầu thất bại',
        text2: (err as { message?: string }).message,
      });
    }
  }, [data, retake]);

  if (isLoading) {
    return (
      <Screen>
        <Loading text="Đang tải kết quả…" />
      </Screen>
    );
  }

  if (isError && error) {
    return (
      <Screen>
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <Loading text="Không có dữ liệu" />
      </Screen>
    );
  }

  const correct = data.correctAnswers ?? 0;
  const total = data.totalQuestions ?? data.questions.length;

  return (
    <Screen scroll>
      <Card className="mb-4">
        <Text className="text-xs uppercase tracking-widest text-primary font-semibold">
          Kết quả
        </Text>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {data.quizTitle ?? 'Bài quiz'}
        </Text>
        <View className="flex-row items-center mt-3 gap-3">
          <ScoreBadge score={data.score ?? null} />
          <Text className="text-sm text-slate-500">
            {correct} / {total} câu đúng
          </Text>
        </View>
        {typeof data.passed === 'boolean' ? (
          <Text
            className={[
              'text-sm font-semibold mt-2',
              data.passed ? 'text-emerald-600' : 'text-rose-600',
            ].join(' ')}
          >
            {data.passed ? 'Đã đạt yêu cầu' : 'Chưa đạt yêu cầu'}
          </Text>
        ) : null}
      </Card>

      {data.questions.map((q, idx) => (
        <QuestionReviewCard key={q.id || idx} question={q} index={idx} />
      ))}

      <View className="flex-row gap-3 mt-2 mb-6">
        <View className="flex-1">
          <Button
            label="Làm lại"
            variant="outline"
            onPress={() => void handleRetake()}
            loading={retake.isPending}
            leftIcon={<RotateCcw size={16} color="#14b8a6" />}
            fullWidth
          />
        </View>
        <View className="flex-1">
          <Button
            label="Về danh sách"
            onPress={() => navigation.navigate('QuizList')}
            fullWidth
          />
        </View>
      </View>
    </Screen>
  );
}
