import React from 'react';
import { Text, View } from 'react-native';
import Card from '../common/Card';

export interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ProfileSection({
  title,
  children,
  className,
}: ProfileSectionProps): React.ReactElement {
  return (
    <View className={['mb-4', className ?? ''].join(' ')}>
      <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
        {title}
      </Text>
      <Card className="py-0 px-4">
        <View>{children}</View>
      </Card>
    </View>
  );
}

export default ProfileSection;
