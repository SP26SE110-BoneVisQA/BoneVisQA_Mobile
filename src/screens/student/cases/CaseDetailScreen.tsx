import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../../components/common/Screen';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import CaseImageGallery from '../../../components/cases/CaseImageGallery';
import { getCase } from '../../../api/cases';
import type { ApiError } from '../../../types/api';
import type { Case } from '../../../types/case';
import type { CasesStackParamList } from '../../../navigation/types';

type NavProp = NativeStackNavigationProp<CasesStackParamList, 'CaseDetail'>;
type DetailRoute = RouteProp<CasesStackParamList, 'CaseDetail'>;

type DetailTab = 'info' | 'images';

const TABS: ReadonlyArray<{ key: DetailTab; label: string }> = [
  { key: 'info', label: 'Thông tin' },
  { key: 'images', label: 'Hình ảnh' },
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
              Độ khó: {caseItem.difficulty}
            </Text>
          </View>
        ) : null}
      </View>
      {caseItem.description ? (
        <View className="mb-5">
          <Text className="text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold mb-1.5">
            Mô tả
          </Text>
          <Text className="text-slate-800 dark:text-slate-100 text-base leading-6">
            {caseItem.description}
          </Text>
        </View>
      ) : null}
      {caseItem.expertSummary ? (
        <View className="mb-5">
          <Text className="text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold mb-1.5">
            Tóm tắt chuyên gia
          </Text>
          <Text className="text-slate-800 dark:text-slate-100 text-base leading-6">
            {caseItem.expertSummary}
          </Text>
        </View>
      ) : null}
      {caseItem.keyFindings ? (
        <View className="mb-5">
          <Text className="text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold mb-1.5">
            Dấu hiệu chính
          </Text>
          <Text className="text-slate-800 dark:text-slate-100 text-base leading-6">
            {caseItem.keyFindings}
          </Text>
        </View>
      ) : null}
      {caseItem.reflectiveQuestions ? (
        <View className="mb-5">
          <Text className="text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold mb-1.5">
            Câu hỏi phản biện
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
}

function ImagesTab({ caseItem }: ImagesTabProps): React.ReactElement {
  if (caseItem.images.length === 0) {
    return (
      <EmptyState
        title="Chưa có hình ảnh"
        subtitle="Ca lâm sàng này chưa có hình ảnh đính kèm."
      />
    );
  }
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-3">
        {caseItem.images.length} hình ảnh
      </Text>
      <CaseImageGallery images={caseItem.images} />
      <Text className="text-slate-500 dark:text-slate-400 text-xs mt-3">
        Chạm vào ảnh để xem fullscreen với zoom và pan.
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
    navigation.setOptions({ title: caseItem?.title ?? 'Chi tiết ca' });
  }, [navigation, caseItem?.title]);

  if (isLoading) {
    return (
      <Screen>
        <Loading text="Đang tải ca lâm sàng..." />
      </Screen>
    );
  }

  if (error || !caseItem) {
    return (
      <Screen>
        <ErrorView
          error={error ?? 'Không tìm thấy ca lâm sàng.'}
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
        {tab === 'images' ? <ImagesTab caseItem={caseItem} /> : null}
      </View>
    </Screen>
  );
}
