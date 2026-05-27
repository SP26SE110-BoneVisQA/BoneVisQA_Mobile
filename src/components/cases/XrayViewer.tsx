import React from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Minus, Plus, RotateCcw } from 'lucide-react-native';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const SCALE_STEP = 0.5;

export interface XrayViewerProps {
  uri: string;
  width?: number;
  height?: number;
  className?: string;
  testID?: string;
}

export function XrayViewer({
  uri,
  width,
  height,
  className,
  testID,
}: XrayViewerProps): React.ReactElement {
  const screen = Dimensions.get('window');
  const resolvedWidth = width ?? screen.width;
  const resolvedHeight = height ?? screen.height * 0.75;

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const [, setResetTick] = React.useState(0);

  const reset = React.useCallback((): void => {
    scale.value = withTiming(1, { duration: 200 });
    savedScale.value = 1;
    translateX.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    setResetTick((t) => t + 1);
  }, [scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY]);

  const zoomBy = React.useCallback(
    (amount: number): void => {
      const next = Math.min(Math.max(savedScale.value + amount, MIN_SCALE), MAX_SCALE);
      scale.value = withTiming(next, { duration: 180 });
      savedScale.value = next;
      if (next === MIN_SCALE) {
        translateX.value = withTiming(0, { duration: 180 });
        translateY.value = withTiming(0, { duration: 180 });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    },
    [savedScale, savedTranslateX, savedTranslateY, scale, translateX, translateY],
  );

  const clamp = (value: number, min: number, max: number): number => {
    'worklet';
    return Math.min(Math.max(value, min), max);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
      scale.value = next;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE + 0.01) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onUpdate((e) => {
      if (scale.value <= 1) {
        return;
      }
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.05) {
        scale.value = withTiming(1, { duration: 200 });
        savedScale.value = 1;
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE, { duration: 200 });
        savedScale.value = DOUBLE_TAP_SCALE;
      }
      runOnJS(setResetTick)(Date.now());
    });

  const composed = Gesture.Simultaneous(
    doubleTap,
    Gesture.Simultaneous(pinch, pan),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View
      testID={testID}
      className={['bg-black overflow-hidden', className ?? ''].join(' ')}
      style={{ width: resolvedWidth, height: resolvedHeight }}
    >
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            { width: resolvedWidth, height: resolvedHeight },
            animatedStyle,
          ]}
        >
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            transition={150}
          />
        </Animated.View>
      </GestureDetector>
      <View className="absolute bottom-6 left-4 right-4 flex-row justify-between items-center">
        <View className="flex-row bg-black/70 rounded-full p-1">
          <Pressable
            accessibilityLabel="Thu nho anh"
            onPress={() => zoomBy(-SCALE_STEP)}
            className="rounded-full p-3"
          >
            <Minus size={20} color="#ffffff" />
          </Pressable>
          <Pressable
            accessibilityLabel="Phong to anh"
            onPress={() => zoomBy(SCALE_STEP)}
            className="rounded-full p-3"
          >
            <Plus size={20} color="#ffffff" />
          </Pressable>
        </View>
        <Pressable
          accessibilityLabel="Dat lai do phong anh"
          onPress={reset}
          className="bg-black/70 rounded-full p-3"
        >
          <RotateCcw size={20} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}

export default XrayViewer;
