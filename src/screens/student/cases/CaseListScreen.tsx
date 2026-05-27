import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { History, Search as SearchIcon, SlidersHorizontal } from 'lucide-react-native';
import Screen from '../../../components/common/Screen';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import Input from '../../../components/common/Input';
import CaseCard from '../../../components/cases/CaseCard';
import CaseFilters, {
  type CaseFiltersValue,
} from '../../../components/cases/CaseFilters';
import { filterCases, getCatalog } from '../../../api/cases';
import type { ApiError } from '../../../types/api';
import type { Case } from '../../../types/case';
import type { CasesStackParamList } from '../../../navigation/types';

type NavProp = NativeStackNavigationProp<CasesStackParamList, 'CaseList'>;

const EMPTY_FILTERS: CaseFiltersValue = {
  regions: [],
  modalities: [],
  difficulties: [],
};

function hasAnyFilter(value: CaseFiltersValue): boolean {
  return (
    value.regions.length > 0 ||
    value.modalities.length > 0 ||
    value.difficulties.length > 0
  );
}

function applyLocalSearch(list: Case[], query: string): Case[] {
  if (query.trim().length === 0) {
    return list;
  }
  const q = query.trim().toLowerCase();
  return list.filter((c) =>
    [c.title, c.description, c.bodyRegion, c.categoryName]
      .filter((v): v is string => Boolean(v))
      .some((v) => v.toLowerCase().includes(q)),
  );
}

export default function CaseListScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<CaseFiltersValue>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const useFilterEndpoint = hasAnyFilter(filters);

  const queryKey = useFilterEndpoint
    ? (['cases', 'filter', filters] as const)
    : (['cases', 'catalog'] as const);

  const {
    data = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<Case[], ApiError>({
    queryKey,
    queryFn: () =>
      useFilterEndpoint
        ? filterCases({
            region: filters.regions[0],
            modality: filters.modalities[0],
            difficulty: filters.difficulties[0],
          })
        : getCatalog(),
  });

  const filtered = React.useMemo(() => applyLocalSearch(data, search), [
    data,
    search,
  ]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Clinical cases',
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('CaseHistory')}
          className="px-2"
        >
          <History size={22} color="#0f766e" />
        </Pressable>
      ),
    });
  }, [navigation]);

  const renderItem = ({
    item,
    index,
  }: {
    item: Case;
    index: number;
  }): React.ReactElement => (
    <View
      className={['flex-1', index % 2 === 0 ? 'mr-1.5' : 'ml-1.5'].join(' ')}
    >
      <CaseCard
        caseItem={item}
        onPress={() =>
          navigation.navigate('CaseDetail', { caseId: item.id })
        }
      />
    </View>
  );

  const header = (
    <View className="mb-3">
      <Input
        value={search}
        onChangeText={setSearch}
        placeholder="Search cases..."
        leftIcon={<SearchIcon size={18} color="#64748b" />}
      />
      <Pressable
        onPress={() => setFiltersOpen((v) => !v)}
        className="flex-row items-center mt-3"
      >
        <SlidersHorizontal size={16} color="#0f766e" />
        <Text className="ml-2 text-primary font-semibold text-sm">
          {filtersOpen ? 'Hide filters' : 'Show filters'}
        </Text>
        {hasAnyFilter(filters) ? (
          <Pressable
            onPress={() => setFilters(EMPTY_FILTERS)}
            className="ml-auto"
          >
            <Text className="text-rose-600 text-xs font-semibold">
              Clear filters
            </Text>
          </Pressable>
        ) : null}
      </Pressable>
      {filtersOpen ? (
        <View className="mt-3">
          <CaseFilters value={filters} onChange={setFilters} />
        </View>
      ) : null}
    </View>
  );

  if (isLoading) {
    return (
      <Screen>
        <Loading text="Loading clinical cases..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorView error={error} onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen padding={false}>
      <View className="px-5 pt-4">{header}</View>
      {filtered.length === 0 ? (
        <EmptyState
          title="No matching cases"
          subtitle="Try changing the keyword or filters."
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          columnWrapperStyle={{ marginBottom: 12 }}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
    </Screen>
  );
}
