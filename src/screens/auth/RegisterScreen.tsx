import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useLogin, useRegister } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Please enter your email')
      .email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen(): React.ReactElement {
  const navigation = useNavigation<Navigation>();
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = useRegister();
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (values: RegisterFormValues): void => {
    registerMutation.mutate(
      {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: 'Student',
      },
      {
        onSuccess: () => {
          loginMutation.mutate(
            { email: values.email, password: values.password },
            {
              onError: () => {
                Toast.show({
                  type: 'success',
                  text1: 'Sign up successful',
                  text2: 'Please log in to continue',
                });
                navigation.navigate('Login');
              },
            },
          );
        },
        onError: (error) => {
          Toast.show({
            type: 'error',
            text1: 'Sign up failed',
            text2: error.message,
          });
        },
      },
    );
  };

  const isSubmitting = registerMutation.isPending || loginMutation.isPending;

  return (
    <View className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full items-center justify-center mb-8 mt-8"
          >
            <ArrowLeft size={20} color="#94a3b8" />
          </Pressable>

          <View className="mb-8">
            <Text className="text-3xl font-bold text-white mb-2">
              Create account
            </Text>
            <Text className="text-slate-400">
              Join the BoneVisQA student portal
            </Text>
          </View>

          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="mb-4">
                <Input
                  label="Full name"
                  placeholder="John Doe"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.fullName?.message}
                  leftIcon={<User size={20} color="#64748b" />}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="mb-4">
                <Input
                  label="Email"
                  placeholder="student@example.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  error={errors.email?.message}
                  leftIcon={<Mail size={20} color="#64748b" />}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="mb-4">
                <Input
                  label="Password"
                  placeholder="At least 8 characters"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                  error={errors.password?.message}
                  leftIcon={<Lock size={20} color="#64748b" />}
                  rightIcon={
                    <Pressable onPress={() => setShowPassword((v) => !v)}>
                      {showPassword ? (
                        <EyeOff size={20} color="#64748b" />
                      ) : (
                        <Eye size={20} color="#64748b" />
                      )}
                    </Pressable>
                  }
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="mb-6">
                <Input
                  label="Confirm password"
                  placeholder="Re-enter password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                  error={errors.confirmPassword?.message}
                  leftIcon={<Lock size={20} color="#64748b" />}
                />
              </View>
            )}
          />

          <Button
            label="Sign up"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
          />

          <View className="mt-6 flex-row justify-center items-center pb-8">
            <Text className="text-slate-500 text-sm">Already have an account?</Text>
            <Pressable
              className="ml-2"
              onPress={() => navigation.navigate('Login')}
            >
              <Text className="text-primary-light text-sm font-bold">
                Log in
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
