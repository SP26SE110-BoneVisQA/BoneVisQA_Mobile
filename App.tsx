import 'react-native-gesture-handler';
import './global.css';
import './src/i18n';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';

import RootNavigator from './src/navigation/RootNavigator';
import NetworkBanner from './src/components/common/NetworkBanner';
import Toast from './src/components/common/Toast';
import { queryClient } from './src/stores/queryClient';

export default function App(): React.ReactElement {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <NetworkBanner />
          <Toast />
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
