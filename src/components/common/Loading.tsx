import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export interface LoadingProps {
  text?: string;
  className?: string;
  testID?: string;
}

export function Loading({
  text,
  className,
  testID,
}: LoadingProps): React.ReactElement {
  return (
    <View
      testID={testID}
      className={[
        'flex-1 items-center justify-center p-6',
        className ?? '',
      ].join(' ')}
    >
      <ActivityIndicator size="large" color="#14b8a6" />
      {text ? (
        <Text className="text-slate-600 dark:text-slate-300 text-sm mt-3">
          {text}
        </Text>
      ) : null}
    </View>
  );
}

export default Loading;
