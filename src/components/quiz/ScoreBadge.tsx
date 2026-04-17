import React from 'react';
import { Text, View } from 'react-native';

export interface ScoreBadgeProps {
  score?: number | null;
  size?: 'sm' | 'md';
}

function pickPalette(score: number): { bg: string; text: string } {
  if (score >= 80) {
    return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
  }
  if (score >= 60) {
    return { bg: 'bg-amber-100', text: 'text-amber-700' };
  }
  return { bg: 'bg-rose-100', text: 'text-rose-700' };
}

export function ScoreBadge({
  score,
  size = 'md',
}: ScoreBadgeProps): React.ReactElement {
  if (typeof score !== 'number') {
    return (
      <View className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
        <Text className="text-xs text-slate-500 dark:text-slate-300">Chưa có điểm</Text>
      </View>
    );
  }
  const palette = pickPalette(score);
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <View className={['rounded-full', padding, palette.bg].join(' ')}>
      <Text className={['font-semibold', textSize, palette.text].join(' ')}>
        {score.toFixed(1)} điểm
      </Text>
    </View>
  );
}

export default ScoreBadge;
