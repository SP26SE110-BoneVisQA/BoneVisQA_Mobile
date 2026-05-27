import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Camera, Image as ImageIcon, User, X } from 'lucide-react-native';

export interface AvatarPickerProps {
  currentUrl: string | null | undefined;
  onPicked: (uri: string) => void;
  disabled?: boolean;
}

async function processImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 512 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

export function AvatarPicker({
  currentUrl,
  onPicked,
  disabled = false,
}: AvatarPickerProps): React.ReactElement {
  const [pickerOpen, setPickerOpen] = useState(false);

  const openCamera = async (): Promise<void> => {
    setPickerOpen(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Camera permission required',
        'Please allow camera access in your device settings.',
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!res.canceled && res.assets[0]) {
      const processed = await processImage(res.assets[0].uri);
      onPicked(processed);
    }
  };

  const openGallery = async (): Promise<void> => {
    setPickerOpen(false);
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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!res.canceled && res.assets[0]) {
      const processed = await processImage(res.assets[0].uri);
      onPicked(processed);
    }
  };

  return (
    <View className="items-center mb-6">
      <Pressable
        disabled={disabled}
        onPress={() => setPickerOpen(true)}
        className="w-28 h-28 rounded-full bg-primary/15 border-2 border-primary/30 items-center justify-center overflow-hidden"
      >
        {currentUrl ? (
          <Image
            source={{ uri: currentUrl }}
            contentFit="cover"
            style={{ width: '100%', height: '100%' }}
            transition={200}
          />
        ) : (
          <User size={40} color="#14b8a6" />
        )}
      </Pressable>
      <Pressable
        disabled={disabled}
        onPress={() => setPickerOpen(true)}
        className="mt-3"
      >
        <Text className="text-primary-dark text-sm font-semibold">
          Change avatar
        </Text>
      </Pressable>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setPickerOpen(false)}
        >
          <Pressable
            className="bg-white dark:bg-slate-800 rounded-t-3xl p-6"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-slate-900 dark:text-white text-lg font-bold">
                Choose image
              </Text>
              <Pressable
                onPress={() => setPickerOpen(false)}
                className="w-8 h-8 items-center justify-center"
              >
                <X size={22} color="#64748b" />
              </Pressable>
            </View>
            <Pressable
              onPress={() => {
                void openCamera();
              }}
              className="flex-row items-center py-4 border-b border-slate-100 dark:border-slate-700"
            >
              <View className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center mr-3">
                <Camera size={20} color="#14b8a6" />
              </View>
              <Text className="text-slate-900 dark:text-white text-base font-medium">
                Take a new photo
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void openGallery();
              }}
              className="flex-row items-center py-4"
            >
              <View className="w-10 h-10 rounded-full bg-primary/15 items-center justify-center mr-3">
                <ImageIcon size={20} color="#14b8a6" />
              </View>
              <Text className="text-slate-900 dark:text-white text-base font-medium">
                Choose from library
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default AvatarPicker;
