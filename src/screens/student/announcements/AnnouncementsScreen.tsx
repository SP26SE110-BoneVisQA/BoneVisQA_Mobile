import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { Megaphone, X } from 'lucide-react-native';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import EmptyState from '../../../components/common/EmptyState';
import Card from '../../../components/common/Card';
import { useAnnouncements } from '../../../hooks/useNotifications';
import type { Announcement } from '../../../types/notification';

function formatDate(iso: string): string {
  const d = dayjs(iso);
  return d.isValid() ? d.format('MM/DD/YYYY HH:mm') : '';
}

interface ClassFilterProps {
  classes: Array<{ id: string; name: string }>;
  selected: string | null;
  onSelect: (id: string | null) => void;
}

function ClassFilter({
  classes,
  selected,
  onSelect,
}: ClassFilterProps): React.ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
    >
      <Pressable
        onPress={() => onSelect(null)}
        className={[
          'px-4 py-2 rounded-full mr-2',
          selected === null
            ? 'bg-primary'
            : 'bg-slate-100 dark:bg-slate-800',
        ].join(' ')}
      >
        <Text
          className={[
            'text-sm font-semibold',
            selected === null
              ? 'text-white'
              : 'text-slate-700 dark:text-slate-200',
          ].join(' ')}
        >
          All classes
        </Text>
      </Pressable>
      {classes.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => onSelect(c.id)}
          className={[
            'px-4 py-2 rounded-full mr-2',
            selected === c.id
              ? 'bg-primary'
              : 'bg-slate-100 dark:bg-slate-800',
          ].join(' ')}
        >
          <Text
            className={[
              'text-sm font-semibold',
              selected === c.id
                ? 'text-white'
                : 'text-slate-700 dark:text-slate-200',
            ].join(' ')}
          >
            {c.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default function AnnouncementsScreen(): React.ReactElement {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useAnnouncements();
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Announcement | null>(null);

  const classes = useMemo<Array<{ id: string; name: string }>>(() => {
    if (!data) {
      return [];
    }
    const seen = new Map<string, string>();
    for (const a of data) {
      if (a.classId && a.className && !seen.has(a.classId)) {
        seen.set(a.classId, a.className);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  const filtered = useMemo<Announcement[]>(() => {
    if (!data) {
      return [];
    }
    if (classFilter === null) {
      return data;
    }
    return data.filter((a) => a.classId === classFilter);
  }, [data, classFilter]);

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-slate-50 dark:bg-slate-900"
        edges={['top']}
      >
        <Loading text="Loading notifications..." />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView
        className="flex-1 bg-slate-50 dark:bg-slate-900"
        edges={['top']}
      >
        <ErrorView
          error={error ?? 'Could not load notifications'}
          onRetry={() => {
            void refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      edges={['top']}
    >
      {classes.length > 0 ? (
        <ClassFilter
          classes={classes}
          selected={classFilter}
          onSelect={setClassFilter}
        />
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor="#14b8a6"
          />
        }
        renderItem={({ item }) => (
          <Card className="mb-3" onPress={() => setSelected(item)}>
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Megaphone size={20} color="#14b8a6" />
              </View>
              <View className="flex-1">
                <Text
                  className="text-slate-900 dark:text-white font-bold text-base"
                  numberOfLines={1}
                >
                  {item.title || 'Notifications'}
                </Text>
                <Text
                  className="text-slate-500 dark:text-slate-400 text-sm mt-1"
                  numberOfLines={2}
                >
                  {item.content}
                </Text>
                <View className="flex-row items-center mt-2">
                  {item.className ? (
                    <Text className="text-xs text-primary font-semibold mr-2">
                      {item.className}
                    </Text>
                  ) : null}
                  <Text className="text-xs text-slate-400">
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View className="flex-1 min-h-[400px]">
            <EmptyState
              icon={<Megaphone size={48} color="#94a3b8" />}
              title="No notifications"
            />
          </View>
        }
      />

      <Modal
        visible={selected !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row items-start justify-between mb-4">
              <Text
                className="text-xl font-bold text-slate-900 dark:text-white flex-1 mr-3"
                numberOfLines={3}
              >
                {selected?.title ?? ''}
              </Text>
              <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                <X size={24} color="#64748b" />
              </Pressable>
            </View>
            {selected?.className ? (
              <Text className="text-xs text-primary font-semibold mb-1">
                {selected.className}
              </Text>
            ) : null}
            <Text className="text-xs text-slate-400 mb-4">
              {selected ? formatDate(selected.createdAt) : ''}
            </Text>
            <ScrollView className="max-h-[60%]">
              <Text className="text-slate-700 dark:text-slate-200 text-base leading-6">
                {selected?.content ?? ''}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
