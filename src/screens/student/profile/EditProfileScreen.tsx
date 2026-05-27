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
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'PreferNotToSay', label: 'Prefer not to say' },
] as const;

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(120, 'Full name is too long'),
  schoolCohort: z.string().max(50, 'Too long').optional(),
  avatarUrl: z.string().optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.length === 0 || dateRegex.test(v),
      'Date of birth must use YYYY-MM-DD format',
    ),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.length === 0 || /^[0-9+\-\s]{8,20}$/.test(v),
      'Invalid phone number',
    ),
  gender: z.string().optional(),
  studentSchoolId: z.string().max(50, 'Too long').optional(),
  classCode: z.string().max(50, 'Too long').optional(),
  address: z.string().max(500, 'Too long').optional(),
  bio: z.string().max(1000, 'Bio must be at most 1000 characters').optional(),
  emergencyContact: z.string().max(200, 'Too long').optional(),
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
        Gender
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
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
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
          text1: 'Avatar updated',
        });
      } catch (e) {
        const message =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message: unknown }).message)
            : 'Unable to upload image';
        Toast.show({
          type: 'error',
          text1: 'Image upload failed',
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
        Toast.show({ type: 'success', text1: 'Profile saved' });
        navigation.goBack();
      },
      onError: (err) => {
        Toast.show({
          type: 'error',
          text1: 'Failed to save profile',
          text2: err.message,
        });
      },
    });
  };

  if (isPending) {
    return (
      <Screen>
        <Loading text="Loading profile..." />
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
          Edit profile
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
            Uploading image...
          </Text>
        ) : null}

        <View className="gap-4">
          <Controller
            control={control}
            name="fullName"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Full name"
                placeholder="John Doe"
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
                label="Date of birth"
                placeholder="YYYY-MM-DD"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                error={errors.dateOfBirth?.message}
                helper="Example: 2001-05-20"
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
                label="Phone number"
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
                label="Student ID"
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
                label="Harda"
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
                label="Class"
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
                label="Address"
                placeholder="House number, street, district, city"
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
                label="Emergency contact"
                placeholder="Name and phone number"
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
                label="Bio"
                placeholder="A short note about you"
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
              label="Cancel"
              variant="secondary"
              size="lg"
              fullWidth
              onPress={handleCancel}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Save"
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
