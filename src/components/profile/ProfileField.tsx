import React from 'react';
import { Text, View } from 'react-native';

export interface ProfileFieldProps {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
  emptyText?: string;
}

export function ProfileField({
  label,
  value,
  icon,
  emptyText = 'Chưa cập nhật',
}: ProfileFieldProps): React.ReactElement {
  const displayValue =
    value && value.trim().length > 0 ? value : emptyText;
  const isEmpty = !value || value.trim().length === 0;

  return (
    <View className="flex-row items-start py-3 border-b border-slate-100 dark:border-slate-700/60 last:border-b-0">
      {icon ? (
        <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center mr-3">
          {icon}
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-0.5">
          {label}
        </Text>
        <Text
          className={[
            'text-base',
            isEmpty
              ? 'text-slate-400 dark:text-slate-500 italic'
              : 'text-slate-900 dark:text-white font-medium',
          ].join(' ')}
        >
          {displayValue}
        </Text>
      </View>
    </View>
  );
}

export default ProfileField;
