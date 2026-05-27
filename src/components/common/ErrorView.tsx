import React from 'react';
import { Text, View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import Button from './Button';
import type { ApiError } from '../../types/api';

export interface ErrorViewProps {
  error: ApiError | Error | string;
  onRetry?: () => void;
  className?: string;
  testID?: string;
}

function getMessage(error: ErrorViewProps['error']): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return error.message;
}

export function ErrorView({
  error,
  onRetry,
  className,
  testID,
}: ErrorViewProps): React.ReactElement {
  return (
    <View
      testID={testID}
      className={[
        'flex-1 items-center justify-center p-6',
        className ?? '',
      ].join(' ')}
    >
      <View className="w-16 h-16 rounded-full bg-destructive/10 items-center justify-center mb-4">
        <AlertCircle size={32} color="#ef4444" />
      </View>
      <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-2 text-center">
        Something went wrong
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
        {getMessage(error)}
      </Text>
      {onRetry ? (
        <Button label="Retry" variant="primary" size="md" onPress={onRetry} />
      ) : null}
    </View>
  );
}

export default ErrorView;
