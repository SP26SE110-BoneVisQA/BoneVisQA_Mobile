import React from 'react';
import { Text, View } from 'react-native';

export interface QuizProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function QuizProgressBar({
  current,
  total,
  label,
}: QuizProgressBarProps): React.ReactElement {
  const safeTotal = total > 0 ? total : 1;
  const pct = Math.min(100, Math.max(0, Math.round((current / safeTotal) * 100)));
  return (
    <View className="w-full">
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          {label ?? 'Progress'}
        </Text>
        <Text className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {current} / {total}
        </Text>
      </View>
      <View className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <View
          className="h-2 bg-primary rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}

export default QuizProgressBar;
