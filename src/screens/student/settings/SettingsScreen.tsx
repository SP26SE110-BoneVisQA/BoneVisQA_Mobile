import React, { useCallback } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Globe,
  Info,
  LogOut,
  Lock,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react-native';

import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import { useAuthStore } from '../../../stores/authStore';
import {
  useSettingsStore,
  type AppLanguage,
  type AppTheme,
} from '../../../stores/settingsStore';
import type { ProfileStackParamList } from '../../../navigation/types';

type Navigation = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

interface ThemeOption {
  value: AppTheme;
  label: string;
  icon: React.ReactNode;
}

interface LanguageOption {
  value: AppLanguage;
  label: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Sáng', icon: <Sun size={18} color="#14b8a6" /> },
  { value: 'dark', label: 'Tối', icon: <Moon size={18} color="#14b8a6" /> },
  {
    value: 'system',
    label: 'Theo hệ thống',
    icon: <Monitor size={18} color="#14b8a6" />,
  },
];

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
];

export default function SettingsScreen(): React.ReactElement {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const language = useSettingsStore((s) => s.language);
  const theme = useSettingsStore((s) => s.theme);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const appVersion =
    (Constants.expoConfig?.version as string | undefined) ?? '1.0.0';

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await useAuthStore.getState().logout();
              queryClient.clear();
            })();
          },
        },
      ],
      { cancelable: true },
    );
  }, [queryClient]);

  const handleAbout = useCallback(() => {
    Alert.alert(
      'BoneVisQA Mobile',
      `Phiên bản ${appVersion}\nNền tảng hỏi đáp và trực quan hóa hình ảnh y khoa dành cho sinh viên y.`,
      [{ text: 'OK' }],
    );
  }, [appVersion]);

  return (
    <Screen scroll>
      <View className="flex-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Cài đặt
        </Text>

        {/* Appearance */}
        <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
          Giao diện
        </Text>

        <Card className="mb-4 py-0 px-0">
          <View className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/60">
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center mr-3">
                <Globe size={16} color="#14b8a6" />
              </View>
              <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                Ngôn ngữ
              </Text>
            </View>
            <View className="flex-row gap-2 ml-11">
              {LANGUAGE_OPTIONS.map((opt) => {
                const selected = language === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      void setLanguage(opt.value);
                    }}
                    className={[
                      'flex-row items-center px-3 py-2 rounded-xl border',
                      selected
                        ? 'bg-primary/15 border-primary'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                    ].join(' ')}
                  >
                    {selected ? (
                      <Check size={13} color="#0d9488" />
                    ) : null}
                    <Text
                      className={[
                        'text-sm font-medium',
                        selected
                          ? 'ml-1 text-primary-dark'
                          : 'text-slate-700 dark:text-slate-300',
                      ].join(' ')}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View className="px-4 py-3">
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center mr-3">
                <Monitor size={16} color="#14b8a6" />
              </View>
              <Text className="text-slate-900 dark:text-white text-sm font-semibold">
                Chủ đề
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2 ml-11">
              {THEME_OPTIONS.map((opt) => {
                const selected = theme === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      void setTheme(opt.value);
                    }}
                    className={[
                      'flex-row items-center px-3 py-2 rounded-xl border',
                      selected
                        ? 'bg-primary/15 border-primary'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
                    ].join(' ')}
                  >
                    {opt.icon}
                    <Text
                      className={[
                        'text-sm font-medium ml-1.5',
                        selected
                          ? 'text-primary-dark'
                          : 'text-slate-700 dark:text-slate-300',
                      ].join(' ')}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Account */}
        <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
          Tài khoản
        </Text>
        <Card className="mb-4 py-0 px-0">
          <Pressable
            onPress={() => navigation.navigate('ChangePassword')}
            className="flex-row items-center px-4 py-4 border-b border-slate-100 dark:border-slate-700/60"
          >
            <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center mr-3">
              <Lock size={18} color="#14b8a6" />
            </View>
            <Text className="flex-1 text-slate-900 dark:text-white text-base font-medium">
              Đổi mật khẩu
            </Text>
            <ChevronRight size={18} color="#94a3b8" />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('MedicalVerification')}
            className="flex-row items-center px-4 py-4"
          >
            <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center mr-3">
              <BadgeCheck size={18} color="#14b8a6" />
            </View>
            <Text className="flex-1 text-slate-900 dark:text-white text-base font-medium">
              Xác minh y khoa
            </Text>
            <ChevronRight size={18} color="#94a3b8" />
          </Pressable>
        </Card>

        {/* Other */}
        <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
          Khác
        </Text>
        <Card className="mb-8 py-0 px-0">
          <Pressable
            onPress={handleAbout}
            className="flex-row items-center px-4 py-4 border-b border-slate-100 dark:border-slate-700/60"
          >
            <View className="w-9 h-9 rounded-lg bg-primary/10 items-center justify-center mr-3">
              <Info size={18} color="#14b8a6" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-white text-base font-medium">
                Giới thiệu
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs">
                Phiên bản {appVersion}
              </Text>
            </View>
            <ChevronRight size={18} color="#94a3b8" />
          </Pressable>
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center px-4 py-4"
          >
            <View className="w-9 h-9 rounded-lg bg-destructive/10 items-center justify-center mr-3">
              <LogOut size={18} color="#ef4444" />
            </View>
            <Text className="flex-1 text-destructive text-base font-medium">
              Đăng xuất
            </Text>
          </Pressable>
        </Card>
      </View>
    </Screen>
  );
}
