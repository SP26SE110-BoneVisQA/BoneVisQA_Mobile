import React from 'react';
import { Text, View } from 'react-native';
import Button from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  testID?: string;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  className,
  testID,
}: EmptyStateProps): React.ReactElement {
  return (
    <View
      testID={testID}
      className={[
        'flex-1 items-center justify-center p-6',
        className ?? '',
      ].join(' ')}
    >
      {icon ? <View className="mb-4">{icon}</View> : null}
      <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-2 text-center">
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="primary" size="md" onPress={onAction} />
      ) : null}
    </View>
  );
}

export default EmptyState;
