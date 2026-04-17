import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { BadgeCheck, ImagePlus, Trash2 } from 'lucide-react-native';

import Screen from '../../../components/common/Screen';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Card from '../../../components/common/Card';
import { useRequestMedicalVerification } from '../../../hooks/useProfile';
import type { ProfileStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<
  ProfileStackParamList,
  'MedicalVerification'
>;

const medicalSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Họ tên tối thiểu 2 ký tự')
    .max(120, 'Họ tên quá dài'),
  studentSchoolId: z
    .string()
    .min(2, 'Vui lòng nhập mã sinh viên')
    .max(50, 'Quá dài'),
});

type MedicalFormInput = z.infer<typeof medicalSchema>;

async function processProof(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

export default function MedicalVerificationScreen(): React.ReactElement {
  const navigation = useNavigation<Navigation>();
  const mutation = useRequestMedicalVerification();
  const [proofUri, setProofUri] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MedicalFormInput>({
    resolver: zodResolver(medicalSchema),
    defaultValues: {
      fullName: '',
      studentSchoolId: '',
    },
  });

  const pickProof = async (): Promise<void> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Cần quyền truy cập thư viện',
        'Vui lòng cấp quyền truy cập ảnh trong cài đặt thiết bị.',
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (!res.canceled && res.assets[0]) {
      const processed = await processProof(res.assets[0].uri);
      setProofUri(processed);
    }
  };

  const onSubmit = (values: MedicalFormInput): void => {
    mutation.mutate(
      {
        fullName: values.fullName.trim(),
        studentSchoolId: values.studentSchoolId.trim(),
        proofImageUri: proofUri ?? undefined,
      },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: 'Đã gửi yêu cầu xác minh',
            text2: 'Quản trị viên sẽ xem xét trong thời gian sớm nhất.',
          });
          navigation.goBack();
        },
        onError: (err) => {
          Toast.show({
            type: 'error',
            text1: 'Gửi yêu cầu thất bại',
            text2: err.message,
          });
        },
      },
    );
  };

  return (
    <Screen scroll>
      <View className="flex-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Xác minh y khoa
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-5">
          Xác minh y khoa giúp bạn truy cập các ca bệnh và nội dung chuyên sâu
          dành riêng cho sinh viên y. Vui lòng cung cấp thông tin và ảnh chụp
          giấy tờ chứng minh bạn đang là sinh viên y khoa.
        </Text>

        <Card className="mb-6 bg-primary/5 border-primary/20">
          <View className="flex-row items-start">
            <View className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center mr-3">
              <BadgeCheck size={22} color="#14b8a6" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-white text-sm font-semibold mb-1">
                Quy trình xác minh
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 text-xs leading-5">
                1. Điền họ tên và mã sinh viên chính xác.{'\n'}
                2. Tải lên ảnh thẻ sinh viên hoặc giấy xác nhận.{'\n'}
                3. Chờ quản trị viên xác nhận (1-3 ngày làm việc).
              </Text>
            </View>
          </View>
        </Card>

        <View className="gap-4">
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Họ và tên đầy đủ"
                placeholder="Nguyễn Văn A"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="studentSchoolId"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Mã sinh viên"
                placeholder="SV2024001"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="characters"
                error={errors.studentSchoolId?.message}
              />
            )}
          />

          <View>
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5 ml-1">
              Ảnh minh chứng (không bắt buộc)
            </Text>
            {proofUri ? (
              <View className="relative">
                <Image
                  source={{ uri: proofUri }}
                  contentFit="cover"
                  style={{ width: '100%', height: 200, borderRadius: 16 }}
                />
                <Pressable
                  onPress={() => setProofUri(null)}
                  className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 items-center justify-center"
                >
                  <Trash2 size={18} color="#ffffff" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  void pickProof();
                }}
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl py-8 items-center justify-center bg-white dark:bg-slate-800"
              >
                <ImagePlus size={28} color="#94a3b8" />
                <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  Chạm để chọn ảnh thẻ sinh viên
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View className="mt-6 mb-8">
          <Button
            label="Gửi yêu cầu xác minh"
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
