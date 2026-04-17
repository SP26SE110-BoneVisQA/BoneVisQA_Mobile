import React from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import XrayViewer from './XrayViewer';
import type { CaseImage } from '../../types/case';

export interface CaseImageGalleryProps {
  images: CaseImage[];
  className?: string;
  testID?: string;
}

export function CaseImageGallery({
  images,
  className,
  testID,
}: CaseImageGalleryProps): React.ReactElement {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const screen = Dimensions.get('window');

  const activeImage =
    activeIndex !== null ? (images[activeIndex] ?? null) : null;

  const renderItem = ({
    item,
    index,
  }: ListRenderItemInfo<CaseImage>): React.ReactElement => (
    <Pressable
      onPress={() => setActiveIndex(index)}
      className="mr-3 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800"
      style={{ width: 160, height: 120 }}
    >
      <Image
        source={{ uri: item.url }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={200}
      />
      {item.modality ? (
        <View className="absolute bottom-2 left-2 bg-black/60 rounded-full px-2 py-0.5">
          <Text className="text-white text-[10px] font-semibold">
            {item.modality}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );

  return (
    <View testID={testID} className={className ?? ''}>
      <FlatList
        data={images}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
      <Modal
        visible={activeImage !== null}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setActiveIndex(null)}
      >
        <View className="flex-1 bg-black">
          {activeImage ? (
            <XrayViewer
              uri={activeImage.url}
              width={screen.width}
              height={screen.height}
            />
          ) : null}
          <Pressable
            onPress={() => setActiveIndex(null)}
            className="absolute top-12 left-4 bg-black/60 rounded-full p-2"
          >
            <X size={22} color="#ffffff" />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

export default CaseImageGallery;
