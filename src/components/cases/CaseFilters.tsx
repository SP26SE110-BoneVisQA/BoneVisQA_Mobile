import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { CaseDifficulty } from '../../types/case';

export interface CaseFiltersValue {
  regions: string[];
  modalities: string[];
  difficulties: CaseDifficulty[];
}

export interface CaseFiltersProps {
  value: CaseFiltersValue;
  onChange: (next: CaseFiltersValue) => void;
  className?: string;
}

export const REGION_OPTIONS: string[] = [
  'Cervical spine',
  'Thoracic spine',
  'Lumbar spine',
  'Pelvis',
  'Upper limb',
  'Lower limb',
];

export const MODALITY_OPTIONS: string[] = ['X-ray', 'CT', 'MRI', 'Ultrasound'];

export const DIFFICULTY_OPTIONS: ReadonlyArray<{
  value: CaseDifficulty;
  label: string;
}> = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function Chip({ label, active, onPress }: ChipProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      className={[
        'px-3 py-1.5 rounded-full mr-2 border',
        active
          ? 'bg-primary border-primary'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      ].join(' ')}
    >
      <Text
        className={[
          'text-xs font-semibold',
          active ? 'text-white' : 'text-slate-700 dark:text-slate-200',
        ].join(' ')}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CaseFilters({
  value,
  onChange,
  className,
}: CaseFiltersProps): React.ReactElement {
  const setRegion = (region: string): void => {
    onChange({ ...value, regions: toggleItem(value.regions, region) });
  };
  const setModality = (modality: string): void => {
    onChange({ ...value, modalities: toggleItem(value.modalities, modality) });
  };
  const setDifficulty = (difficulty: CaseDifficulty): void => {
    onChange({
      ...value,
      difficulties: toggleItem(value.difficulties, difficulty),
    });
  };

  return (
    <View className={['gap-y-2', className ?? ''].join(' ')}>
      <View>
        <Text className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1.5 ml-1">
          Anatomic region
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {REGION_OPTIONS.map((region) => (
            <Chip
              key={region}
              label={region}
              active={value.regions.includes(region)}
              onPress={() => setRegion(region)}
            />
          ))}
        </ScrollView>
      </View>
      <View>
        <Text className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1.5 ml-1">
          Modality
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MODALITY_OPTIONS.map((modality) => (
            <Chip
              key={modality}
              label={modality}
              active={value.modalities.includes(modality)}
              onPress={() => setModality(modality)}
            />
          ))}
        </ScrollView>
      </View>
      <View>
        <Text className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1.5 ml-1">
          Difficulty
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DIFFICULTY_OPTIONS.map((d) => (
            <Chip
              key={d.value}
              label={d.label}
              active={value.difficulties.includes(d.value)}
              onPress={() => setDifficulty(d.value)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

export default CaseFilters;
