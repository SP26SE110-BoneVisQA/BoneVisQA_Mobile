import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Check } from 'lucide-react-native';
import type { Question, QuestionOption } from '../../types/quiz';

export interface QuestionCardProps {
  question: Question;
  selectedIds: string[];
  onChange: (optionIds: string[]) => void;
  disabled?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
}

function toggleSelection(
  currentIds: string[],
  optionId: string,
  allowMultiple: boolean,
): string[] {
  if (!allowMultiple) {
    return currentIds.includes(optionId) ? [] : [optionId];
  }
  return currentIds.includes(optionId)
    ? currentIds.filter((id) => id !== optionId)
    : [...currentIds, optionId];
}

interface OptionRowProps {
  option: QuestionOption;
  selected: boolean;
  allowMultiple: boolean;
  disabled: boolean;
  onPress: () => void;
}

function OptionRow({
  option,
  selected,
  allowMultiple,
  disabled,
  onPress,
}: OptionRowProps): React.ReactElement {
  const indicatorBase =
    'w-6 h-6 mr-3 items-center justify-center border-2';
  const shape = allowMultiple ? 'rounded-md' : 'rounded-full';
  const borderColor = selected ? 'border-primary' : 'border-slate-300 dark:border-slate-600';
  const bg = selected ? 'bg-primary' : 'bg-transparent';

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      className={[
        'flex-row items-center p-4 rounded-2xl mb-3 border',
        selected
          ? 'border-primary bg-primary/10'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
        disabled ? 'opacity-70' : '',
      ].join(' ')}
    >
      <View className={[indicatorBase, shape, borderColor, bg].join(' ')}>
        {selected ? <Check size={14} color="#ffffff" /> : null}
      </View>
      <View className="flex-1">
        {option.imageUrl ? (
          <Image
            source={{ uri: option.imageUrl }}
            style={{ width: '100%', height: 160, borderRadius: 12 }}
            contentFit="cover"
          />
        ) : null}
        <Text className="text-base text-slate-900 dark:text-white mt-1">
          <Text className="font-semibold">{option.id}.</Text> {option.label}
        </Text>
      </View>
    </Pressable>
  );
}

export function QuestionCard({
  question,
  selectedIds,
  onChange,
  disabled = false,
  questionNumber,
  totalQuestions,
}: QuestionCardProps): React.ReactElement {
  const allowMultiple = question.type === 'multiple_choice';

  const handleToggle = useCallback(
    (optionId: string) => {
      onChange(toggleSelection(selectedIds, optionId, allowMultiple));
    },
    [allowMultiple, onChange, selectedIds],
  );

  return (
    <View className="w-full">
      {typeof questionNumber === 'number' && typeof totalQuestions === 'number' ? (
        <Text className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          Question {questionNumber} / {totalQuestions}
        </Text>
      ) : null}
      {question.caseTitle ? (
        <Text className="text-xs text-slate-500 mb-1">Ca: {question.caseTitle}</Text>
      ) : null}
      <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-4 leading-6">
        {question.prompt}
      </Text>
      {question.imageUrl ? (
        <View className="mb-4 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800">
          <Image
            source={{ uri: question.imageUrl }}
            style={{ width: '100%', height: 220 }}
            contentFit="cover"
          />
        </View>
      ) : null}
      {question.options.map((option) => (
        <OptionRow
          key={option.id}
          option={option}
          selected={selectedIds.includes(option.id)}
          allowMultiple={allowMultiple}
          disabled={disabled}
          onPress={() => handleToggle(option.id)}
        />
      ))}
      {allowMultiple ? (
        <Text className="text-xs text-slate-500 mt-1">
          Select all correct answers.
        </Text>
      ) : null}
    </View>
  );
}

export default QuestionCard;
