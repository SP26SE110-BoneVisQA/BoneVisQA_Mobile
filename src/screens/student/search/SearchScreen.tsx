import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  SectionList,
  Text,
  View,
  type SectionListData,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { History, SearchX } from 'lucide-react-native';
import SearchBar from '../../../components/common/SearchBar';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import { useSearch } from '../../../hooks/useNotifications';
import type {
  SearchResult,
  SearchResultType,
} from '../../../types/notification';
import type { HomeStackParamList } from '../../../navigation/types';

const RECENT_KEY = 'BONEVISQA_RECENT_SEARCHES';
const RECENT_MAX = 10;
const MIN_CHARS = 2;

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Search'>;

interface Section {
  title: string;
  type: SearchResultType;
  data: SearchResult[];
}

const SECTION_LABELS: Record<SearchResultType, string> = {
  case: 'Clinical cases',
  quiz: 'Quiz',
  announcement: 'Notifications',
  document: 'Document',
};

async function loadRecent(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

async function saveRecent(list: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function groupResults(results: SearchResult[]): Section[] {
  const order: SearchResultType[] = [
    'case',
    'quiz',
    'announcement',
    'document',
  ];
  const buckets = new Map<SearchResultType, SearchResult[]>();
  for (const t of order) {
    buckets.set(t, []);
  }
  for (const r of results) {
    buckets.get(r.type)?.push(r);
  }
  const sections: Section[] = [];
  for (const type of order) {
    const data = buckets.get(type) ?? [];
    if (data.length > 0) {
      sections.push({ title: SECTION_LABELS[type], type, data });
    }
  }
  return sections;
}

export default function SearchScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const { data, isLoading, isError, error, refetch } = useSearch(query);

  useEffect(() => {
    void loadRecent().then(setRecent);
  }, []);

  const trimmed = query.trim();
  const showRecent = trimmed.length < MIN_CHARS;

  const sections = useMemo<Section[]>(
    () => (data ? groupResults(data) : []),
    [data],
  );

  const pushRecent = useCallback(
    (term: string) => {
      const clean = term.trim();
      if (clean.length < MIN_CHARS) {
        return;
      }
      setRecent((prev) => {
        const next = [clean, ...prev.filter((t) => t !== clean)].slice(
          0,
          RECENT_MAX,
        );
        void saveRecent(next);
        return next;
      });
    },
    [],
  );

  const clearRecent = useCallback(() => {
    setRecent([]);
    void saveRecent([]);
  }, []);

  const handleSubmit = useCallback(
    (text: string) => {
      pushRecent(text);
    },
    [pushRecent],
  );

  const handleResultPress = useCallback(
    (result: SearchResult) => {
      pushRecent(trimmed);
      const parent = navigation.getParent();
      switch (result.type) {
        case 'case':
          parent?.dispatch(
            CommonActions.navigate({
              name: 'CasesTab',
              params: {
                screen: 'CaseDetail',
                params: { caseId: result.id },
              },
            }),
          );
          break;
        case 'quiz':
          parent?.dispatch(
            CommonActions.navigate({
              name: 'QuizTab',
              params: {
                screen: 'QuizPlay',
                params: { quizId: result.id },
              },
            }),
          );
          break;
        case 'announcement':
          navigation.navigate('Announcements');
          break;
        case 'document':
        default:
          // documents not yet supported
          break;
      }
    },
    [navigation, pushRecent, trimmed],
  );

  const renderSectionHeader = ({
    section,
  }: {
    section: SectionListData<SearchResult, Section>;
  }): React.ReactElement => (
    <View className="py-2">
      <Text className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
        {section.title}
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: SearchResult }): React.ReactElement => (
    <Pressable
      onPress={() => handleResultPress(item)}
      className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-2"
    >
      <Text className="text-slate-900 dark:text-white font-semibold" numberOfLines={1}>
        {item.title}
      </Text>
      {item.snippet ? (
        <Text
          className="text-slate-500 dark:text-slate-400 text-sm mt-1"
          numberOfLines={2}
        >
          {item.snippet}
        </Text>
      ) : null}
    </Pressable>
  );

  const renderRecent = (): React.ReactElement => {
    if (recent.length === 0) {
      return (
        <EmptyState
          icon={<History size={40} color="#94a3b8" />}
          title="No recent searches yet"
          subtitle="Enter at least 2 characters to search"
        />
      );
    }
    return (
      <View className="mt-2">
        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
            Recent searches
          </Text>
          <Pressable onPress={clearRecent} hitSlop={8}>
            <Text className="text-xs text-primary font-semibold">
              Clear history
            </Text>
          </Pressable>
        </View>
        {recent.map((term) => (
          <Pressable
            key={term}
            onPress={() => setQuery(term)}
            className="flex-row items-center bg-white dark:bg-slate-800 rounded-2xl p-4 mb-2"
          >
            <History size={16} color="#64748b" />
            <Text className="ml-3 flex-1 text-slate-700 dark:text-slate-200">
              {term}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderBody = (): React.ReactElement => {
    if (showRecent) {
      return renderRecent();
    }
    if (isLoading) {
      return <Loading text="Searching..." />;
    }
    if (isError) {
      return (
        <ErrorView
          error={error ?? 'Search failed'}
          onRetry={() => {
            void refetch();
          }}
        />
      );
    }
    if (sections.length === 0) {
      return (
        <EmptyState
          icon={<SearchX size={40} color="#94a3b8" />}
          title="No results"
          subtitle="Try a different keyword"
        />
      );
    }
    return (
      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.type}:${item.id}`}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      edges={['top']}
    >
      <View className="px-4 pt-2 pb-3">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={handleSubmit}
          placeholder="Search cases, quizzes, announcements..."
          autoFocus
        />
      </View>
      <View className="flex-1 px-4">{renderBody()}</View>
    </SafeAreaView>
  );
}
