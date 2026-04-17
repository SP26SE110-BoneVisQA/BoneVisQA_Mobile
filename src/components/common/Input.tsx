import React, { forwardRef } from 'react';
import {
  TextInput,
  Text,
  View,
  type TextInputProps,
} from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    containerClassName,
    className,
    placeholderTextColor,
    ...rest
  },
  ref,
) {
  const borderClass = error
    ? 'border-destructive'
    : 'border-slate-200 dark:border-slate-700';

  return (
    <View className={['w-full', containerClassName ?? ''].join(' ')}>
      {label ? (
        <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5 ml-1">
          {label}
        </Text>
      ) : null}
      <View
        className={[
          'flex-row items-center bg-white dark:bg-slate-800 border',
          borderClass,
          'rounded-2xl px-4 py-3',
        ].join(' ')}
      >
        {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={placeholderTextColor ?? '#94a3b8'}
          className={[
            'flex-1 text-slate-900 dark:text-white text-base',
            className ?? '',
          ].join(' ')}
          {...rest}
        />
        {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text className="text-destructive text-xs mt-1 ml-1">{error}</Text>
      ) : helper ? (
        <Text className="text-slate-500 text-xs mt-1 ml-1">{helper}</Text>
      ) : null}
    </View>
  );
});

export default Input;
