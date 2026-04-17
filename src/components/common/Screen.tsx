import React from 'react';
import {
  RefreshControl,
  ScrollView,
  View,
  type ScrollViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface ScreenRefresh {
  refreshing: boolean;
  onRefresh: () => void;
}

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  refresh?: ScreenRefresh;
  padding?: boolean;
  className?: string;
  contentClassName?: string;
  scrollViewProps?: ScrollViewProps;
  testID?: string;
}

export function Screen({
  children,
  scroll = false,
  refresh,
  padding = true,
  className,
  contentClassName,
  scrollViewProps,
  testID,
}: ScreenProps): React.ReactElement {
  const paddingClass = padding ? 'px-5' : '';
  const safeClass = [
    'flex-1 bg-slate-50 dark:bg-slate-900',
    className ?? '',
  ].join(' ');

  if (scroll) {
    return (
      <SafeAreaView className={safeClass} testID={testID} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            refresh ? (
              <RefreshControl
                refreshing={refresh.refreshing}
                onRefresh={refresh.onRefresh}
                tintColor="#14b8a6"
              />
            ) : undefined
          }
          {...scrollViewProps}
        >
          <View
            className={[
              'flex-1',
              paddingClass,
              'py-4',
              contentClassName ?? '',
            ].join(' ')}
          >
            {children}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={safeClass} testID={testID} edges={['top']}>
      <View
        className={[
          'flex-1',
          paddingClass,
          'py-4',
          contentClassName ?? '',
        ].join(' ')}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

export default Screen;
