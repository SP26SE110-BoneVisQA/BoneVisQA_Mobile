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
    .min(2, 'Full name must be at least 2 characters')
    .max(120, 'Full name is too long'),
  studentSchoolId: z
    .string()
    .min(2, 'Please enter your student ID')
    .max(50, 'Too long'),
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
        'Photo library permission required',
        'Please allow photo access in your device settings.',
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
            text1: 'Verification request sent',
            text2: 'An administrator will review it as soon as possible.',
          });
          navigation.goBack();
        },
        onError: (err) => {
          Toast.show({
            type: 'error',
            text1: 'Request failed',
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
          Medical verification
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-5">
          Medical verification lets you access advanced cases and content for medical students. Please provide your details and a photo proving your medical student status.
        </Text>

        <Card className="mb-6 bg-primary/5 border-primary/20">
          <View className="flex-row items-start">
            <View className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center mr-3">
              <BadgeCheck size={22} color="#14b8a6" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-white text-sm font-semibold mb-1">
                Verification process
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 text-xs leading-5">
                1. Enter your full name and student ID accurately.{'\n'}
                2. Upload a student card or confirmation document.{'\n'}
                3. Wait for admin approval (1-3 business days).
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
            name="studentSchoolId"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Student ID"
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
              Proof image (optional)
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
                  Tap to choose a student card image
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View className="mt-6 mb-8">
          <Button
            label="Submit verification request"
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
