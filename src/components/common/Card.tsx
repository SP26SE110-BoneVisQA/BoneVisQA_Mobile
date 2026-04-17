import React from 'react';
import { Pressable, View } from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  testID?: string;
}

export function Card({
  children,
  onPress,
  className,
  testID,
}: CardProps): React.ReactElement {
  const baseClasses =
    'bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700';
  const merged = [baseClasses, className ?? ''].join(' ');

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        className={merged}
        android_ripple={{ color: '#e2e8f0' }}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={testID} className={merged}>
      {children}
    </View>
  );
}

export default Card;
