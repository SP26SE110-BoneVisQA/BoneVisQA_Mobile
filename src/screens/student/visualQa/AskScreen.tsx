import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Markdown from 'react-native-markdown-display';
import { ImagePlus, X } from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../../components/common/Screen';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { askJson, askMultipart } from '../../../api/visualQa';
import type { VisualQaAnswer } from '../../../types/case';
import type { VisualQaStackParamList } from '../../../navigation/types';

type NavProp = NativeStackNavigationProp<VisualQaStackParamList, 'VisualQaAsk'>;
type AskRoute = RouteProp<VisualQaStackParamList, 'VisualQaAsk'>;

export default function AskScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<AskRoute>();
  const caseId = route.params?.caseId;

  const [question, setQuestion] = React.useState('');
  const [imageUri, setImageUri] = React.useState<string | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);
  const [answer, setAnswer] = React.useState<VisualQaAnswer | null>(null);
  const [errorText, setErrorText] = React.useState<string | null>(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: 'Quick AI question' });
  }, [navigation]);

  const pickImage = async (): Promise<void> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAsk = async (): Promise<void> => {
    const trimmed = question.trim();
    if (trimmed.length === 0 || loading) {
      return;
    }
    setLoading(true);
    setAnswer(null);
    setErrorText(null);
    try {
      const result = imageUri
        ? await askMultipart({ question: trimmed, imageUri })
        : await askJson({ caseId, question: trimmed });
      setAnswer(result);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Something went wrong while calling AI.';
      setErrorText(message);
    } finally {
      setLoading(false);
    }
  };

  const continueInChat = (): void => {
    navigation.navigate('VisualQaChat', {
      caseId,
      sessionId: answer?.sessionId,
    });
  };

  const canSubmit = question.trim().length > 0 && !loading;

  return (
    <Screen padding={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-slate-900 dark:text-white text-xl font-bold mb-2">
            Ask AI a question
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mb-5">
            Describe the issue, diagnosis, or abnormal region. You can attach an X-ray image.
          </Text>

          <Input
            label="Question"
            value={question}
            onChangeText={setQuestion}
            placeholder="Example: Does this image show signs of a fracture?"
            multiline
            numberOfLines={4}
          />

          <View className="mt-4">
            <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5 ml-1">
              Image (optional)
            </Text>
            {imageUri ? (
              <View className="relative">
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: 200, borderRadius: 16 }}
                  contentFit="cover"
                />
                <Pressable
                  onPress={() => setImageUri(undefined)}
                  className="absolute top-2 right-2 bg-slate-900/80 rounded-full p-1.5"
                >
                  <X size={14} color="#ffffff" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={pickImage}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl py-8 items-center"
              >
                <ImagePlus size={24} color="#64748b" />
                <Text className="text-slate-500 mt-2 text-sm">
                  Tap to choose an image
                </Text>
              </Pressable>
            )}
          </View>

          <View className="mt-5">
            <Button
              label="Ask AI"
              onPress={handleAsk}
              loading={loading}
              disabled={!canSubmit}
              fullWidth
            />
          </View>

          {errorText ? (
            <View className="mt-5 p-4 bg-destructive/10 rounded-2xl">
              <Text className="text-destructive text-sm">{errorText}</Text>
            </View>
          ) : null}

          {answer ? (
            <View className="mt-6 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
              <Text className="text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold mb-2">
                AI response
              </Text>
              <Markdown
                style={{
                  body: { color: '#0f172a', fontSize: 15, lineHeight: 22 },
                  strong: { color: '#0f172a', fontWeight: '700' },
                }}
              >
                {answer.answer}
              </Markdown>
              {answer.references && answer.references.length > 0 ? (
                <View className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <Text className="text-[11px] text-slate-500 font-semibold mb-1">
                    References
                  </Text>
                  {answer.references.map((ref, idx) => (
                    <Text
                      key={`ref-${idx}`}
                      className="text-[11px] text-slate-500"
                    >
                      • {ref}
                    </Text>
                  ))}
                </View>
              ) : null}
              <View className="mt-4">
                <Button
                  label="Continue in chat"
                  variant="outline"
                  onPress={continueInChat}
                  fullWidth
                />
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
