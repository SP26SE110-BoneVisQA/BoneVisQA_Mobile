import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Mail, Send } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useForgotPassword } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không hợp lệ'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

type Navigation = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

export default function ForgotPasswordScreen(): React.ReactElement {
  const navigation = useNavigation<Navigation>();
  const forgotMutation = useForgotPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values: ForgotFormValues): void => {
    forgotMutation.mutate(values, {
      onSuccess: () => {
        Toast.show({
          type: 'success',
          text1: 'Đã gửi yêu cầu',
          text2: 'Vui lòng kiểm tra email của bạn',
        });
        navigation.navigate('Login');
      },
      onError: (error) => {
        Toast.show({
          type: 'error',
          text1: 'Gửi yêu cầu thất bại',
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
        <View className="px-6 py-8 flex-1">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full items-center justify-center mb-8 mt-8"
          >
            <ArrowLeft size={20} color="#94a3b8" />
          </Pressable>

          <View className="mb-8">
            <Text className="text-3xl font-bold text-white mb-2">
              Đặt lại mật khẩu
            </Text>
            <Text className="text-slate-400">
              Nhập email và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu cho bạn.
            </Text>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <View className="mb-6">
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

          <Button
            label="Gửi liên kết đặt lại"
            variant="primary"
            size="lg"
            fullWidth
            loading={forgotMutation.isPending}
            onPress={handleSubmit(onSubmit)}
            rightIcon={<Send size={18} color="#ffffff" />}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
