import React from 'react';
import { Text, View } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

export interface NetworkBannerProps {
  className?: string;
  testID?: string;
}

export function NetworkBanner({
  className,
  testID,
}: NetworkBannerProps): React.ReactElement | null {
  const netInfo = useNetInfo();
  const isOffline =
    netInfo.isConnected === false ||
    (netInfo.isConnected === true && netInfo.isInternetReachable === false);

  if (!isOffline) {
    return null;
  }

  return (
    <View
      testID={testID}
      className={[
        'absolute top-0 left-0 right-0 bg-destructive py-2 px-4 z-50',
        className ?? '',
      ].join(' ')}
    >
      <Text className="text-white text-center text-sm font-medium">
        Không có kết nối mạng
      </Text>
    </View>
  );
}

export default NetworkBanner;
