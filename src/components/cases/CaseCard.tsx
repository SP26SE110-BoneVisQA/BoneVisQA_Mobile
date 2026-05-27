import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ImageOff } from 'lucide-react-native';
import type { Case, CaseDifficulty } from '../../types/case';

export interface CaseCardProps {
  caseItem: Case;
  onPress?: (caseItem: Case) => void;
  className?: string;
  testID?: string;
}

const difficultyLabel: Record<CaseDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const difficultyBg: Record<CaseDifficulty, string> = {
  easy: 'bg-emerald-100',
  medium: 'bg-amber-100',
  hard: 'bg-rose-100',
};

const difficultyText: Record<CaseDifficulty, string> = {
  easy: 'text-emerald-700',
  medium: 'text-amber-700',
  hard: 'text-rose-700',
};

export function CaseCard({
  caseItem,
  onPress,
  className,
  testID,
}: CaseCardProps): React.ReactElement {
  const handlePress = (): void => {
    if (onPress) {
      onPress(caseItem);
    }
  };

  const chips: string[] = [];
  if (caseItem.bodyRegion) {
    chips.push(caseItem.bodyRegion);
  }
  if (caseItem.modality) {
    chips.push(caseItem.modality);
  }

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      className={[
        'bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700',
        'active:opacity-80',
        className ?? '',
      ].join(' ')}
    >
      <View className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-900 items-center justify-center">
        {caseItem.thumbnailUrl ? (
          <Image
            source={{ uri: caseItem.thumbnailUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <ImageOff size={32} color="#94a3b8" />
        )}
        {caseItem.difficulty ? (
          <View
            className={[
              'absolute top-2 right-2 px-2 py-0.5 rounded-full',
              difficultyBg[caseItem.difficulty],
            ].join(' ')}
          >
            <Text
              className={[
                'text-[10px] font-semibold',
                difficultyText[caseItem.difficulty],
              ].join(' ')}
            >
              {difficultyLabel[caseItem.difficulty]}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="p-3">
        <Text
          numberOfLines={2}
          className="text-slate-900 dark:text-white text-sm font-semibold mb-1"
        >
          {caseItem.title}
        </Text>
        {chips.length > 0 ? (
          <View className="flex-row flex-wrap mt-1 -mr-1">
            {chips.map((chip) => (
              <View
                key={chip}
                className="bg-primary/10 rounded-full px-2 py-0.5 mr-1 mb-1"
              >
                <Text className="text-primary text-[10px] font-medium">
                  {chip}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default CaseCard;
