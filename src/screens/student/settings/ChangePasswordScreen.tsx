import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react-native';

import Screen from '../../../components/common/Screen';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Card from '../../../components/common/Card';
import { resetPassword } from '../../../api/auth';
import { useAuthStore } from '../../../stores/authStore';
import type { ApiError } from '../../../types/api';
import type { ProfileStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<
  ProfileStackParamList,
  'ChangePassword'
>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Please enter your current password'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordFormInput = z.infer<typeof passwordSchema>;

interface ChangePasswordMutationInput {
  email: string;
  newPassword: string;
}

export default function ChangePasswordScreen(): React.ReactElement {
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((s) => s.user);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mutation = useMutation<void, ApiError, ChangePasswordMutationInput>({
    mutationFn: async ({ email, newPassword }) => {
      await resetPassword({ email, token: '', newPassword });
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (values: PasswordFormInput): void => {
    if (!user?.email) {
      Toast.show({
        type: 'error',
        text1: 'Email not found',
        text2: 'Please log out and log in again.',
      });
      return;
    }
    mutation.mutate(
      { email: user.email, newPassword: values.newPassword },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: 'Password updated',
          });
          navigation.goBack();
        },
        onError: (err) => {
          Toast.show({
            type: 'error',
            text1: 'Change password failed',
            text2:
              err.message ||
              'The backend does not have a direct change-password endpoint yet. Please use forgot password.',
          });
        },
      },
    );
  };

  return (
    <Screen scroll>
      <View className="flex-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Change password
        </Text>

        <Card className="mb-6 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50">
          <View className="flex-row items-start">
            <View className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/50 items-center justify-center mr-3">
              <AlertTriangle size={18} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-amber-900 dark:text-amber-200 text-sm font-semibold mb-1">
                Note: this feature is waiting for backend support
              </Text>
              <Text className="text-amber-800 dark:text-amber-300 text-xs leading-5">
                The backend does not currently have a dedicated change-password endpoint. For now, the app will call the password reset endpoint. If it fails, please use "Forgot password".
              </Text>
            </View>
          </View>
        </Card>

        <View className="gap-4">
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Current password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showCurrent}
                leftIcon={<Lock size={20} color="#64748b" />}
                rightIcon={
                  <Pressable onPress={() => setShowCurrent((v) => !v)}>
                    {showCurrent ? (
                      <EyeOff size={20} color="#64748b" />
                    ) : (
                      <Eye size={20} color="#64748b" />
                    )}
                  </Pressable>
                }
                error={errors.currentPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="New password"
                placeholder="At least 8 characters"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showNew}
                leftIcon={<Lock size={20} color="#64748b" />}
                rightIcon={
                  <Pressable onPress={() => setShowNew((v) => !v)}>
                    {showNew ? (
                      <EyeOff size={20} color="#64748b" />
                    ) : (
                      <Eye size={20} color="#64748b" />
                    )}
                  </Pressable>
                }
                error={errors.newPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Confirm new password"
                placeholder="Re-enter new password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showConfirm}
                leftIcon={<Lock size={20} color="#64748b" />}
                rightIcon={
                  <Pressable onPress={() => setShowConfirm((v) => !v)}>
                    {showConfirm ? (
                      <EyeOff size={20} color="#64748b" />
                    ) : (
                      <Eye size={20} color="#64748b" />
                    )}
                  </Pressable>
                }
                error={errors.confirmPassword?.message}
              />
            )}
          />
        </View>

        <View className="mt-6 mb-8">
          <Button
            label="Update password"
            variant="primary"
            size="lg"
            fullWidth
            loading={mutation.isPending}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </View>
    </Screen>
  );
}
