import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react-native';
import Card from '../common/Card';
import ScoreBadge from './ScoreBadge';
import type { Quiz } from '../../types/quiz';

export interface QuizCardListItemProps {
  quiz: Quiz;
  onPress: (quiz: Quiz) => void;
  onReview?: (quiz: Quiz) => void;
  onRetake?: (quiz: Quiz) => void;
  retaking?: boolean;
}

function formatDueDate(due: string | undefined): string {
  if (!due) {
    return '';
  }
  const date = new Date(due);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const dd = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatOpenTime(openTime: string | undefined): string {
  if (!openTime) {
    return '';
  }
  const date = new Date(openTime);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const dd = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function statusLabel(status: Quiz['status']): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In progress';
    case 'practice':
      return 'Practice';
    case 'assigned':
    default:
      return 'Assigned';
  }
}

interface StatusPalette {
  chip: string;
  text: string;
}

function statusPalette(status: Quiz['status']): StatusPalette {
  switch (status) {
    case 'completed':
      return { chip: 'bg-emerald-100', text: 'text-emerald-700' };
    case 'in_progress':
      return { chip: 'bg-amber-100', text: 'text-amber-700' };
    case 'practice':
      return { chip: 'bg-sky-100', text: 'text-sky-700' };
    case 'assigned':
    default:
      return { chip: 'bg-primary/10', text: 'text-primary' };
  }
}

export function QuizCardListItem({
  quiz,
  onPress,
  onReview,
  onRetake,
  retaking = false,
}: QuizCardListItemProps): React.ReactElement {
  const dueText = formatDueDate(quiz.dueDate);
  const openText = formatOpenTime(quiz.openTime);
  const palette = statusPalette(quiz.status);
  const canReview = quiz.status === 'completed' && Boolean(quiz.attemptId);
  const canRetake = canReview && typeof quiz.score === 'number';
  const showStart = !canReview;

  const handleActionPress = (
    e: Parameters<NonNullable<React.ComponentProps<typeof Pressable>['onPress']>>[0],
    action: () => void,
  ): void => {
    e.stopPropagation();
    action();
  };

  return (
    <Card onPress={() => onPress(quiz)} className="mb-3">
      <View className="flex-row items-start">
        <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
          <BookOpen size={20} color="#14b8a6" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className="flex-1 pr-2 text-base font-semibold text-slate-900 dark:text-white"
              numberOfLines={2}
            >
              {quiz.title || 'Quiz'}
            </Text>
          </View>
          {quiz.className ? (
            <Text className="text-xs text-slate-500 mb-2">{quiz.className}</Text>
          ) : null}
          <View className="flex-row items-center flex-wrap gap-2">
            <View className={['px-2 py-0.5 rounded-full', palette.chip].join(' ')}>
              <Text className={['text-xs font-semibold', palette.text].join(' ')}>
                {statusLabel(quiz.status)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={12} color="#64748b" />
              <Text className="text-xs text-slate-500 ml-1">
                {quiz.questionCount} questions
                {quiz.durationMinutes ? ` · ${quiz.durationMinutes} minutes` : ''}
              </Text>
            </View>
            {dueText ? (
              <View className="flex-row items-center">
                <CalendarClock size={12} color="#64748b" />
                <Text className="text-xs text-slate-500 ml-1">Due {dueText}</Text>
              </View>
            ) : null}
            {openText ? (
              <View className="flex-row items-center">
                <CalendarClock size={12} color="#64748b" />
                <Text className="text-xs text-slate-500 ml-1">
                  Opens {openText}
                </Text>
              </View>
            ) : null}
            {typeof quiz.score === 'number' ? (
              <ScoreBadge score={quiz.score} size="sm" />
            ) : null}
          </View>
          {canReview && typeof quiz.score === 'number' ? (
            <Text className="text-xs text-slate-500 mt-2">
              Last score: {quiz.score.toFixed(0)}%
            </Text>
          ) : null}
          <View className="flex-row gap-2 mt-4">
            {canReview && onReview ? (
              <Pressable
                onPress={(e) => handleActionPress(e, () => onReview(quiz))}
                className="flex-1 flex-row items-center justify-center rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5"
              >
                <CheckCircle2 size={15} color="#0f766e" />
                <Text className="ml-1.5 text-sm font-semibold text-primary">
                  Review
                </Text>
              </Pressable>
            ) : null}
            {canRetake && onRetake ? (
              <Pressable
                onPress={(e) => handleActionPress(e, () => onRetake(quiz))}
                disabled={retaking}
                className={[
                  'flex-1 flex-row items-center justify-center rounded-xl bg-primary px-3 py-2.5',
                  retaking ? 'opacity-60' : '',
                ].join(' ')}
              >
                <RotateCcw size={15} color="#ffffff" />
                <Text className="ml-1.5 text-sm font-semibold text-white">
                  Retake
                </Text>
              </Pressable>
            ) : null}
            {showStart ? (
              <Pressable
                onPress={(e) => handleActionPress(e, () => onPress(quiz))}
                className="flex-1 flex-row items-center justify-center rounded-xl bg-primary px-3 py-2.5"
              >
                <Text className="text-sm font-semibold text-white">
                  Start
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}

export default QuizCardListItem;
