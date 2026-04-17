import React, { useCallback, useEffect } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { Check } from 'lucide-react-native';

import Screen from '../../../components/common/Screen';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import AvatarPicker from '../../../components/profile/AvatarPicker';
import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from '../../../hooks/useProfile';
import type { ProfileStackParamList } from '../../../navigation/types';
import type { UpdateStudentProfileDto } from '../../../types/user';

type Navigation = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Nam' },
  { value: 'Female', label: 'Nữ' },
  { value: 'Other', label: 'Khác' },
  { value: 'PreferNotToSay', label: 'Không muốn trả lời' },
] as const;

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Họ tên tối thiểu 2 ký tự')
    .max(120, 'Họ tên quá dài'),
  schoolCohort: z.string().max(50, 'Quá dài').optional(),
  avatarUrl: z.string().optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.length === 0 || dateRegex.test(v),
      'Định dạng ngày sinh phải là YYYY-MM-DD',
    ),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.length === 0 || /^[0-9+\-\s]{8,20}$/.test(v),
      'Số điện thoại không hợp lệ',
    ),
  gender: z.string().optional(),
  studentSchoolId: z.string().max(50, 'Quá dài').optional(),
  classCode: z.string().max(50, 'Quá dài').optional(),
  address: z.string().max(500, 'Quá dài').optional(),
  bio: z.string().max(1000, 'Tiểu sử tối đa 1000 ký tự').optional(),
  emergencyContact: z.string().max(200, 'Quá dài').optional(),
});

type ProfileFormInput = z.infer<typeof profileSchema>;

function toFormDefaults(profile: {
  fullName: string | null;
  schoolCohort: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  gender: string | null;
  studentSchoolId: string | null;
  classCode: string | null;
  address: string | null;
  bio: string | null;
  emergencyContact: string | null;
}): ProfileFormInput {
  return {
    fullName: profile.fullName ?? '',
    schoolCohort: profile.schoolCohort ?? '',
    avatarUrl: profile.avatarUrl ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    gender: profile.gender ?? '',
    studentSchoolId: profile.studentSchoolId ?? '',
    classCode: profile.classCode ?? '',
    address: profile.address ?? '',
    bio: profile.bio ?? '',
    emergencyContact: profile.emergencyContact ?? '',
  };
}

function toNullable(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

interface GenderRadioProps {
  value: string;
  onChange: (v: string) => void;
}

function GenderRadio({ value, onChange }: GenderRadioProps): React.ReactElement {
  return (
    <View>
      <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5 ml-1">
        Giới tính
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {GENDER_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              className={[
                'flex-row items-center px-4 py-2.5 rounded-2xl border',
                selected
                  ? 'bg-primary/15 border-primary'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
              ].join(' ')}
            >
              {selected ? <Check size={14} color="#0d9488" /> : null}
              <Text
                className={[
                  'text-sm font-medium',
                  selected ? 'ml-1.5 text-primary-dark' : 'text-slate-700 dark:text-slate-300',
                ].join(' ')}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function EditProfileScreen(): React.ReactElement {
  const navigation = useNavigation<Navigation>();
  const { data, isPending, isError, error, refetch } = useProfile();
  const updateMutation = useUpdateProfile();
  const uploadMutation = useUploadAvatar();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      schoolCohort: '',
      avatarUrl: '',
      dateOfBirth: '',
      phoneNumber: '',
      gender: '',
      studentSchoolId: '',
      classCode: '',
      address: '',
      bio: '',
      emergencyContact: '',
    },
  });

  useEffect(() => {
    if (data) {
      reset(toFormDefaults(data));
    }
  }, [data, reset]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      Alert.alert(
        'Hủy thay đổi?',
        'Bạn có thay đổi chưa được lưu. Bạn có chắc muốn thoát?',
        [
          { text: 'Ở lại', style: 'cancel' },
          {
            text: 'Thoát',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ],
      );
      return;
    }
    navigation.goBack();
  }, [isDirty, navigation]);

  const handlePickAvatar = useCallback(
    async (uri: string): Promise<void> => {
      try {
        const result = await uploadMutation.mutateAsync(uri);
        setValue('avatarUrl', result.avatarUrl, { shouldDirty: true });
        Toast.show({
          type: 'success',
          text1: 'Đã cập nhật ảnh đại diện',
        });
      } catch (e) {
        const message =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message: unknown }).message)
            : 'Không thể tải ảnh lên';
        Toast.show({
          type: 'error',
          text1: 'Tải ảnh thất bại',
          text2: message,
        });
      }
    },
    [setValue, uploadMutation],
  );

  const onSubmit = (values: ProfileFormInput): void => {
    const dto: UpdateStudentProfileDto = {
      fullName: values.fullName.trim(),
      schoolCohort: toNullable(values.schoolCohort),
      avatarUrl: toNullable(values.avatarUrl),
      dateOfBirth: toNullable(values.dateOfBirth),
      phoneNumber: toNullable(values.phoneNumber),
      gender: toNullable(values.gender),
      studentSchoolId: toNullable(values.studentSchoolId),
      classCode: toNullable(values.classCode),
      address: toNullable(values.address),
      bio: toNullable(values.bio),
      emergencyContact: toNullable(values.emergencyContact),
    };
    updateMutation.mutate(dto, {
      onSuccess: () => {
        Toast.show({ type: 'success', text1: 'Đã lưu hồ sơ' });
        navigation.goBack();
      },
      onError: (err) => {
        Toast.show({
          type: 'error',
          text1: 'Lưu hồ sơ thất bại',
          text2: err.message,
        });
      },
    });
  };

  if (isPending) {
    return (
      <Screen>
        <Loading text="Đang tải hồ sơ..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorView error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const avatarUrlValue = watch('avatarUrl');

  return (
    <Screen scroll>
      <View className="flex-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Chỉnh sửa hồ sơ
        </Text>

        <AvatarPicker
          currentUrl={avatarUrlValue && avatarUrlValue.length > 0 ? avatarUrlValue : null}
          onPicked={(uri) => {
            void handlePickAvatar(uri);
          }}
          disabled={uploadMutation.isPending}
        />
        {uploadMutation.isPending ? (
          <Text className="text-slate-500 text-xs text-center -mt-4 mb-4">
            Đang tải ảnh lên...
          </Text>
        ) : null}

        <View className="gap-4">
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Họ và tên"
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
            name="dateOfBirth"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Ngày sinh"
                placeholder="YYYY-MM-DD"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                error={errors.dateOfBirth?.message}
                helper="Ví dụ: 2001-05-20"
              />
            )}
          />

          <Controller
            control={control}
            name="gender"
            render={({ field: { value, onChange } }) => (
              <GenderRadio value={value ?? ''} onChange={onChange} />
            )}
          />

          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Số điện thoại"
                placeholder="0901234567"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="phone-pad"
                error={errors.phoneNumber?.message}
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
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="characters"
                error={errors.studentSchoolId?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="schoolCohort"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Khóa"
                placeholder="K45"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.schoolCohort?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="classCode"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Lớp"
                placeholder="Y6A"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.classCode?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Địa chỉ"
                placeholder="Số nhà, đường, quận, thành phố"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.address?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="emergencyContact"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Liên hệ khẩn cấp"
                placeholder="Tên và số điện thoại"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.emergencyContact?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="bio"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Tiểu sử"
                placeholder="Giới thiệu ngắn về bạn"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={4}
                error={errors.bio?.message}
              />
            )}
          />
        </View>

        <View className="flex-row gap-3 mt-6 mb-8">
          <View className="flex-1">
            <Button
              label="Hủy"
              variant="secondary"
              size="lg"
              fullWidth
              onPress={handleCancel}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Lưu"
              variant="primary"
              size="lg"
              fullWidth
              loading={updateMutation.isPending}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}
