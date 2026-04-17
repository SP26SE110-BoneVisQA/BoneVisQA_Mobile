import React from 'react';
import { Text, View } from 'react-native';
import { BookOpen, CalendarClock, ChevronRight, Clock } from 'lucide-react-native';
import Card from '../common/Card';
import ScoreBadge from './ScoreBadge';
import type { Quiz } from '../../types/quiz';

export interface QuizCardListItemProps {
  quiz: Quiz;
  onPress: (quiz: Quiz) => void;
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

function statusLabel(status: Quiz['status']): string {
  switch (status) {
    case 'completed':
      return 'Đã hoàn thành';
    case 'in_progress':
      return 'Đang làm';
    case 'practice':
      return 'Luyện tập';
    case 'assigned':
    default:
      return 'Được giao';
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
}: QuizCardListItemProps): React.ReactElement {
  const dueText = formatDueDate(quiz.dueDate);
  const palette = statusPalette(quiz.status);
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
              {quiz.title || 'Bài quiz'}
            </Text>
            <ChevronRight size={18} color="#94a3b8" />
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
                {quiz.questionCount} câu
                {quiz.durationMinutes ? ` · ${quiz.durationMinutes} phút` : ''}
              </Text>
            </View>
            {dueText ? (
              <View className="flex-row items-center">
                <CalendarClock size={12} color="#64748b" />
                <Text className="text-xs text-slate-500 ml-1">{dueText}</Text>
              </View>
            ) : null}
            {typeof quiz.score === 'number' ? (
              <ScoreBadge score={quiz.score} size="sm" />
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}

export default QuizCardListItem;
