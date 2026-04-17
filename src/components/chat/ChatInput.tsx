import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, Send, X } from 'lucide-react-native';

export interface ChatInputProps {
  onSend: (text: string, imageUri?: string) => void;
  loading?: boolean;
  placeholder?: string;
  className?: string;
  testID?: string;
}

export function ChatInput({
  onSend,
  loading = false,
  placeholder = 'Nhập câu hỏi về X-quang...',
  className,
  testID,
}: ChatInputProps): React.ReactElement {
  const [text, setText] = React.useState('');
  const [imageUri, setImageUri] = React.useState<string | undefined>(undefined);

  const pickImage = async (): Promise<void> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSend = (): void => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || loading) {
      return;
    }
    onSend(trimmed, imageUri);
    setText('');
    setImageUri(undefined);
  };

  const canSend = text.trim().length > 0 && !loading;

  return (
    <View
      testID={testID}
      className={[
        'bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 px-3 pt-2 pb-3',
        className ?? '',
      ].join(' ')}
    >
      {imageUri ? (
        <View className="mb-2 flex-row items-center">
          <View className="relative">
            <Image
              source={{ uri: imageUri }}
              style={{ width: 64, height: 64, borderRadius: 12 }}
              contentFit="cover"
            />
            <Pressable
              onPress={() => setImageUri(undefined)}
              className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-0.5"
            >
              <X size={12} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      ) : null}
      <View className="flex-row items-end">
        <Pressable
          onPress={pickImage}
          disabled={loading}
          className="p-2 mr-1 rounded-full bg-slate-100 dark:bg-slate-700"
        >
          <ImagePlus size={20} color="#475569" />
        </Pressable>
        <View className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-2 max-h-32">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            multiline
            className="text-slate-900 dark:text-white text-base"
            editable={!loading}
          />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          className={[
            'p-3 ml-1 rounded-full',
            canSend ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700',
          ].join(' ')}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Send size={18} color={canSend ? '#ffffff' : '#94a3b8'} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default ChatInput;
