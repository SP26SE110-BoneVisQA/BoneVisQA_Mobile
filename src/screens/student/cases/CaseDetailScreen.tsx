import React from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../../components/common/Screen';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import Button from '../../../components/common/Button';
import CaseImageGallery from '../../../components/cases/CaseImageGallery';
import { getCase } from '../../../api/cases';
import type { ApiError } from '../../../types/api';
import type { Case, CaseImage } from '../../../types/case';
import type {
  AppTabParamList,
  CasesStackParamList,
} from '../../../navigation/types';

type NavProp = CompositeNavigationProp<
  NativeStackNavigationProp<CasesStackParamList, 'CaseDetail'>,
  BottomTabNavigationProp<AppTabParamList>
>;
type DetailRoute = RouteProp<CasesStackParamList, 'CaseDetail'>;

type DetailTab = 'info' | 'images';

const TABS: ReadonlyArray<{ key: DetailTab; label: string }> = [
  { key: 'info', label: 'Info' },
  { key: 'images', label: 'Images' },
];

interface InfoTabProps {
  caseItem: Case;
}

function InfoTab({ caseItem }: InfoTabProps): React.ReactElement {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <Text className="text-slate-900 dark:text-white text-2xl font-bold mb-2">
        {caseItem.title}
      </Text>
      <View className="flex-row flex-wrap mb-4">
        {caseItem.categoryName ? (
          <View className="bg-primary/10 rounded-full px-3 py-1 mr-2 mb-2">
            <Text className="text-primary text-xs font-semibold">
              {caseItem.categoryName}
            </Text>
          </View>
        ) : null}
        {caseItem.difficulty ? (
          <View className="bg-amber-100 rounded-full px-3 py-1 mr-2 mb-2">
            <Text className="text-amber-700 text-xs font-semibold">
              Difficulty: {caseItem.difficulty}
            </Text>
          </View>
        ) : null}
      </View>
      {caseItem.description ? (
        <View className="mb-5">
          <Text className="text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold mb-1.5">
            Description
          </Text>
          <Text className="text-slate-800 dark:text-slate-100 text-base leading-6">
            {caseItem.description}
          </Text>
        </View>
      ) : null}
      {caseItem.expertSummary ? (
        <View className="mb-5">
          <Text className="text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold mb-1.5">
            Expert summary
          </Text>
          <Text className="text-slate-800 dark:text-slate-100 text-base leading-6">
            {caseItem.expertSummary}
          </Text>
        </View>
      ) : null}
      {caseItem.keyFindings ? (
        <View className="mb-5">
          <Text className="text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold mb-1.5">
            Key findings
          </Text>
          <Text className="text-slate-800 dark:text-slate-100 text-base leading-6">
            {caseItem.keyFindings}
          </Text>
        </View>
      ) : null}
      {caseItem.reflectiveQuestions ? (
        <View className="mb-5">
          <Text className="text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold mb-1.5">
            Reflective questions
          </Text>
          <Text className="text-slate-800 dark:text-slate-100 text-base leading-6">
            {caseItem.reflectiveQuestions}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

interface ImagesTabProps {
  caseItem: Case;
  onAskImage: (image: CaseImage, coordinates?: string) => void;
}

interface RoiRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildCoordinates(rect: RoiRect): string {
  return JSON.stringify({
    type: 'rect',
    x: Number(rect.x.toFixed(4)),
    y: Number(rect.y.toFixed(4)),
    width: Number(rect.width.toFixed(4)),
    height: Number(rect.height.toFixed(4)),
  });
}

function MarkableCaseImage({
  image,
  onAsk,
}: {
  image: CaseImage;
  onAsk: (image: CaseImage, coordinates?: string) => void;
}): React.ReactElement {
  const [start, setStart] = React.useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = React.useState<RoiRect | null>(null);
  const [size, setSize] = React.useState({ width: 1, height: 1 });

  const responder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const x = clamp(event.nativeEvent.locationX, 0, size.width);
          const y = clamp(event.nativeEvent.locationY, 0, size.height);
          setStart({ x, y });
          setRect({ x: x / size.width, y: y / size.height, width: 0, height: 0 });
        },
        onPanResponderMove: (event) => {
          if (!start) {
            return;
          }
          const currentX = clamp(event.nativeEvent.locationX, 0, size.width);
          const currentY = clamp(event.nativeEvent.locationY, 0, size.height);
          const left = Math.min(start.x, currentX);
          const top = Math.min(start.y, currentY);
          setRect({
            x: left / size.width,
            y: top / size.height,
            width: Math.abs(currentX - start.x) / size.width,
            height: Math.abs(currentY - start.y) / size.height,
          });
        },
        onPanResponderRelease: () => setStart(null),
        onPanResponderTerminate: () => setStart(null),
      }),
    [size.height, size.width, start],
  );

  const absoluteRect = rect
    ? {
        left: rect.x * size.width,
        top: rect.y * size.height,
        width: rect.width * size.width,
        height: rect.height * size.height,
      }
    : null;
  const hasUsableRect = Boolean(rect && rect.width > 0.02 && rect.height > 0.02);

  return (
    <View className="mb-5">
      <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-2">
        Mark the region to ask about
      </Text>
      <View
        className="bg-black rounded-2xl overflow-hidden"
        style={{ aspectRatio: 4 / 3 }}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setSize({ width, height });
        }}
        {...responder.panHandlers}
      >
        <Image
          source={{ uri: image.url }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
        />
        {absoluteRect ? (
          <View
            pointerEvents="none"
            className="absolute border-2 border-red-500 bg-red-500/15"
            style={absoluteRect}
          />
        ) : null}
      </View>
      <Text className="text-slate-500 dark:text-slate-400 text-xs mt-2">
        Drag on the image to mark the suspected region. If no region is marked, AI will use the full case image.
      </Text>
      <View className="flex-row mt-3">
        <Button
          label="Clear region"
          variant="outline"
          size="sm"
          onPress={() => setRect(null)}
          disabled={!rect}
          className="mr-2"
        />
        <View className="flex-1">
          <Button
            label={hasUsableRect ? 'Ask AI with marked region' : 'Ask AI with this image'}
            size="sm"
            onPress={() => onAsk(image, hasUsableRect && rect ? buildCoordinates(rect) : undefined)}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

function ImagesTab({ caseItem, onAskImage }: ImagesTabProps): React.ReactElement {
  if (caseItem.images.length === 0) {
    return (
      <EmptyState
        title="No images yet"
        subtitle="This clinical case does not have attached images yet."
      />
    );
  }
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-3">
        {caseItem.images.length} images
      </Text>
      <MarkableCaseImage image={caseItem.images[0]} onAsk={onAskImage} />
      <CaseImageGallery images={caseItem.images} />
      <Text className="text-slate-500 dark:text-slate-400 text-xs mt-3">
        Tap an image to view full screen. Use +/- or pinch to zoom.
      </Text>
    </ScrollView>
  );
}

export default function CaseDetailScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<DetailRoute>();
  const { caseId } = route.params;
  const [tab, setTab] = React.useState<DetailTab>('info');

  const {
    data: caseItem,
    isLoading,
    error,
    refetch,
  } = useQuery<Case, ApiError>({
    queryKey: ['case', caseId],
    queryFn: () => getCase(caseId),
  });

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: caseItem?.title ?? 'Case detail' });
  }, [navigation, caseItem?.title]);

  const openCaseChat = (): void => {
    const image = caseItem?.images[0];
    navigation.navigate('VisualQaTab', {
      screen: 'VisualQaChat',
      params: {
        caseId,
        imageId: image?.id,
        imageUrl: image?.url,
      },
    });
  };

  const openCaseImageChat = (image: CaseImage, coordinates?: string): void => {
    navigation.navigate('VisualQaTab', {
      screen: 'VisualQaChat',
      params: {
        caseId,
        imageId: image.id,
        imageUrl: image.url,
        coordinates,
      },
    });
  };

  if (isLoading) {
    return (
      <Screen>
        <Loading text="Loading clinical cases..." />
      </Screen>
    );
  }

  if (error || !caseItem) {
    return (
      <Screen>
        <ErrorView
          error={error ?? 'Clinical case not found.'}
          onRetry={refetch}
        />
      </Screen>
    );
  }

  return (
    <Screen padding={false}>
      <View className="flex-row bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            className="flex-1 py-3 items-center"
          >
            <Text
              className={[
                'text-sm font-semibold',
                tab === t.key
                  ? 'text-primary'
                  : 'text-slate-500 dark:text-slate-400',
              ].join(' ')}
            >
              {t.label}
            </Text>
            {tab === t.key ? (
              <View className="h-0.5 w-10 bg-primary rounded-full mt-2" />
            ) : (
              <View className="h-0.5 w-10 mt-2" />
            )}
          </Pressable>
        ))}
      </View>

      <View className="flex-1">
        {tab === 'info' ? <InfoTab caseItem={caseItem} /> : null}
        {tab === 'images' ? (
          <ImagesTab caseItem={caseItem} onAskImage={openCaseImageChat} />
        ) : null}
      </View>

      <View className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <Button
          label="Ask AI about this case"
          onPress={openCaseChat}
          leftIcon={<MessageCircle size={18} color="#ffffff" />}
          fullWidth
          testID="case-detail-ai-chat-button"
        />
      </View>
    </Screen>
  );
}
