import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';

export interface ProfileHeaderProps {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string | null;
  cohort: string | null;
}

function getInitials(name: string | null): string {
  if (!name) {
    return '?';
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0][0] ?? '';
  const last = parts[parts.length - 1][0] ?? '';
  return `${first}${last}`.toUpperCase();
}

export function ProfileHeader({
  fullName,
  email,
  avatarUrl,
  role,
  cohort,
}: ProfileHeaderProps): React.ReactElement {
  const initials = getInitials(fullName);

  return (
    <View className="items-center mb-6">
      <View className="w-28 h-28 rounded-full bg-primary/15 border-2 border-primary/30 items-center justify-center overflow-hidden mb-4">
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            contentFit="cover"
            style={{ width: '100%', height: '100%' }}
            transition={200}
          />
        ) : (
          <Text className="text-primary-dark text-3xl font-bold">
            {initials}
          </Text>
        )}
      </View>
      <Text
        className="text-slate-900 dark:text-white text-2xl font-bold text-center"
        numberOfLines={1}
      >
        {fullName ?? 'Học viên'}
      </Text>
      {email ? (
        <Text
          className="text-slate-500 dark:text-slate-400 text-sm mt-1"
          numberOfLines={1}
        >
          {email}
        </Text>
      ) : null}
      <View className="flex-row items-center gap-2 mt-3">
        {role ? (
          <View className="bg-primary/15 px-3 py-1 rounded-full border border-primary/30">
            <Text className="text-primary-dark text-xs font-semibold">
              {role === 'Student' ? 'Học viên' : role}
            </Text>
          </View>
        ) : null}
        {cohort ? (
          <View className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">
              {cohort}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default ProfileHeader;
