import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  testID?: string;
  fullWidth?: boolean;
}

const variantContainer: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:bg-primary-dark',
  secondary: 'bg-slate-100 active:bg-slate-200 dark:bg-slate-700 dark:active:bg-slate-600',
  outline: 'bg-transparent border border-primary',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive active:opacity-90',
};

const variantText: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-slate-900 dark:text-white',
  outline: 'text-primary',
  ghost: 'text-primary',
  destructive: 'text-white',
};

const sizeContainer: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 rounded-xl',
  md: 'px-4 py-3 rounded-2xl',
  lg: 'px-5 py-4 rounded-2xl',
};

const sizeText: Record<ButtonSize, string> = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-lg font-bold',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  testID,
  fullWidth = false,
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      className={[
        'flex-row items-center justify-center',
        variantContainer[variant],
        sizeContainer[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#14b8a6' : '#ffffff'}
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
          <Text className={[variantText[variant], sizeText[size]].join(' ')}>
            {label}
          </Text>
          {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

export default Button;
