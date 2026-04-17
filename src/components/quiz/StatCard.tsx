import React from 'react';
import { Text, View } from 'react-native';
import Card from '../common/Card';

export interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: 'primary' | 'emerald' | 'amber' | 'slate';
  className?: string;
}

function tonePalette(tone: StatCardProps['tone']): {
  iconWrap: string;
  value: string;
} {
  switch (tone) {
    case 'emerald':
      return { iconWrap: 'bg-emerald-100', value: 'text-emerald-700' };
    case 'amber':
      return { iconWrap: 'bg-amber-100', value: 'text-amber-700' };
    case 'slate':
      return {
        iconWrap: 'bg-slate-100 dark:bg-slate-700',
        value: 'text-slate-900 dark:text-white',
      };
    case 'primary':
    default:
      return { iconWrap: 'bg-primary/10', value: 'text-primary' };
  }
}

export function StatCard({
  icon,
  label,
  value,
  hint,
  tone = 'primary',
  className,
}: StatCardProps): React.ReactElement {
  const palette = tonePalette(tone);
  return (
    <Card className={['flex-1 min-h-[96px]', className ?? ''].join(' ')}>
      {icon ? (
        <View
          className={['w-9 h-9 rounded-xl items-center justify-center mb-2', palette.iconWrap].join(
            ' ',
          )}
        >
          {icon}
        </View>
      ) : null}
      <Text className="text-xs text-slate-500 dark:text-slate-400">{label}</Text>
      <Text className={['text-2xl font-bold mt-0.5', palette.value].join(' ')}>{value}</Text>
      {hint ? (
        <Text className="text-xs text-slate-400 mt-1">{hint}</Text>
      ) : null}
    </Card>
  );
}

export default StatCard;
