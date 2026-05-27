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
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useLogin } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Please enter your email')
    .email('Invalid email'),
  password: z.string().min(1, 'Please enter your password'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen(): React.ReactElement {
  const navigation = useNavigation<Navigation>();
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues): void => {
    loginMutation.mutate(values, {
      onError: (error) => {
        Toast.show({
          type: 'error',
          text1: 'Login failed',
          text2: error.message,
        });
      },
    });
  };

  return (
    <View className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-6 py-12"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-12 mt-8">
            <View className="w-20 h-20 bg-primary/20 rounded-3xl items-center justify-center mb-6 border border-primary/30">
              <GraduationCap size={40} color="#14b8a6" />
            </View>
            <Text className="text-3xl font-bold text-white text-center">
              BoneVisQA
            </Text>
            <View className="bg-primary/10 px-3 py-1 rounded-full mt-2 border border-primary/20">
              <Text className="text-primary-light text-sm font-medium">
                Student portal
              </Text>
            </View>
          </View>

          <Text className="text-slate-400 text-lg mb-6">Welcome back!</Text>

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
                  containerClassName="mb-1"
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="mb-2">
                <Input
                  label="Password"
                  placeholder="Enter password"
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

          <View className="items-end mb-6">
            <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
              <Text className="text-primary-light text-sm font-medium">
                Forgot password?
              </Text>
            </Pressable>
          </View>

          <Button
            label="Log in"
            variant="primary"
            size="lg"
            fullWidth
            loading={loginMutation.isPending}
            onPress={handleSubmit(onSubmit)}
          />

          <View className="mt-8 flex-row justify-center items-center">
            <Text className="text-slate-500 text-sm">Do not have an account?</Text>
            <Pressable
              className="ml-2"
              onPress={() => navigation.navigate('Register')}
            >
              <Text className="text-primary-light text-sm font-bold">
                Sign up
              </Text>
            </Pressable>
          </View>

          <View className="mt-auto pt-10 items-center opacity-40">
            <Text className="text-slate-500 text-xs italic">
              Bone visualization and Q&A platform
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
