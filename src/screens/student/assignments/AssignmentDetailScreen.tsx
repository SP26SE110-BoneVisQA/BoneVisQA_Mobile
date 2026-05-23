import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react-native';

import Screen from '../../../components/common/Screen';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Loading from '../../../components/common/Loading';
import ErrorView from '../../../components/common/ErrorView';
import { useAssignment, useSubmitAssignment } from '../../../hooks/useQuiz';
import type { AssignmentsStackParamList } from '../../../navigation/types';
import type { AssignmentStatus } from '../../../types/quiz';

type NavProp = NativeStackNavigationProp<
  AssignmentsStackParamList,
  'AssignmentDetail'
>;
type RouteType = RouteProp<AssignmentsStackParamList, 'AssignmentDetail'>;

const DRAFT_SAVE_MS = 450;

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  pending: 'Chưa nộp',
  overdue: 'Quá hạn',
  submitted: 'Đã nộp',
  graded: 'Đã chấm',
};

function draftKey(assignmentId: string): string {
  return `BONEVISQA_ASSIGNMENT_DRAFT_${assignmentId}`;
}

function formatDateTime(iso: string | undefined): string {
  if (!iso) {
    return 'Không có hạn';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Không có hạn';
  }
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusColor(status: AssignmentStatus): string {
  switch (status) {
    case 'graded':
      return '#059669';
    case 'submitted':
      return '#0ea5e9';
    case 'overdue':
      return '#ef4444';
    case 'pending':
    default:
      return '#14b8a6';
  }
}

function StatusPanel({
  status,
  dueDate,
  submittedAt,
}: {
  status: AssignmentStatus;
  dueDate?: string;
  submittedAt?: string;
}): React.ReactElement {
  const color = getStatusColor(status);
  const icon =
    status === 'graded' || status === 'submitted' ? (
      <CheckCircle2 size={20} color={color} />
    ) : status === 'overdue' ? (
      <AlertCircle size={20} color={color} />
    ) : (
      <Clock3 size={20} color={color} />
    );
  return (
    <Card className="mb-4">
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
          style={{ backgroundColor: `${color}1A` }}
        >
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold" style={{ color }}>
            {STATUS_LABELS[status]}
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hạn nộp: {formatDateTime(dueDate)}
          </Text>
          {submittedAt ? (
            <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Đã nộp: {formatDateTime(submittedAt)}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

export default function AssignmentDetailScreen(): React.ReactElement {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { assignmentId } = route.params;
  const assignment = useAssignment(assignmentId);
  const submitAssignment = useSubmitAssignment();

  const [answerText, setAnswerText] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const assignmentData = assignment.data;
  const isReadOnly =
    assignmentData?.status === 'submitted' || assignmentData?.status === 'graded';
  const canSubmit =
    Boolean(assignmentData) &&
    !isReadOnly &&
    answerText.trim().length > 0 &&
    !submitAssignment.isPending;

  useEffect(() => {
    navigation.setOptions({ title: assignmentData?.title ?? 'Assignment' });
  }, [assignmentData?.title, navigation]);

  useEffect(() => {
    let alive = true;
    setDraftLoaded(false);
    const load = async (): Promise<void> => {
      if (!assignmentData) {
        return;
      }
      if (isReadOnly) {
        if (alive) {
          setAnswerText(assignmentData.answerText ?? '');
          setDraftSavedAt(null);
          setDraftLoaded(true);
        }
        return;
      }
      try {
        const saved = await AsyncStorage.getItem(draftKey(assignmentId));
        if (alive) {
          setAnswerText(saved ?? assignmentData.answerText ?? '');
          setDraftSavedAt(saved ? 'Đã khôi phục nháp' : null);
          setDraftLoaded(true);
        }
      } catch {
        if (alive) {
          setAnswerText(assignmentData.answerText ?? '');
          setDraftLoaded(true);
        }
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [assignmentData, assignmentId, isReadOnly]);

  useEffect(() => {
    if (!draftLoaded || !assignmentData || isReadOnly) {
      return;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      const next = answerText;
      void AsyncStorage.setItem(draftKey(assignmentId), next).then(() => {
        setDraftSavedAt('Đã lưu nháp');
      });
    }, DRAFT_SAVE_MS);
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [answerText, assignmentData, assignmentId, draftLoaded, isReadOnly]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!assignmentData || isReadOnly) {
      return;
    }
    const trimmed = answerText.trim();
    if (trimmed.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Chưa có nội dung',
        text2: 'Vui lòng nhập câu trả lời trước khi nộp.',
      });
      return;
    }
    try {
      const result = await submitAssignment.mutateAsync({
        assignmentId,
        answerText: trimmed,
      });
      await AsyncStorage.removeItem(draftKey(assignmentId));
      setAnswerText(result.answerText ?? trimmed);
      setDraftSavedAt(null);
      Toast.show({
        type: 'success',
        text1: 'Đã nộp bài',
        text2: 'Bài tự luận của bạn đã được ghi nhận.',
      });
      void assignment.refetch();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Nộp bài thất bại',
        text2:
          (error as { message?: string }).message ?? 'Vui lòng thử lại sau.',
      });
    }
  }, [
    answerText,
    assignment,
    assignmentData,
    assignmentId,
    isReadOnly,
    submitAssignment,
  ]);

  const confirmSubmit = useCallback((): void => {
    Alert.alert(
      'Nộp assignment?',
      'Sau khi nộp, bạn chỉ có thể xem lại nội dung đã gửi.',
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Nộp bài', onPress: () => void handleSubmit() },
      ],
    );
  }, [handleSubmit]);

  const answerHelper = useMemo(() => {
    if (isReadOnly) {
      return 'Nội dung đã nộp';
    }
    return draftSavedAt ?? 'Nháp được lưu tự động trên thiết bị này';
  }, [draftSavedAt, isReadOnly]);

  if (assignment.isError) {
    return (
      <Screen>
        <ErrorView
          error={assignment.error}
          onRetry={() => {
            void assignment.refetch();
          }}
        />
      </Screen>
    );
  }

  if (assignment.isLoading || !draftLoaded) {
    return (
      <Screen>
        <Loading text="Đang tải assignment..." />
      </Screen>
    );
  }

  if (!assignmentData) {
    return (
      <Screen>
        <ErrorView
          error="Không tìm thấy assignment."
          onRetry={() => {
            void assignment.refetch();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen padding={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Screen
          scroll
          className="bg-transparent"
          contentClassName="px-5 pb-8"
          scrollViewProps={{ keyboardShouldPersistTaps: 'handled' }}
        >
          <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {assignmentData.title}
          </Text>
          {assignmentData.description ? (
            <Text className="text-sm text-slate-600 dark:text-slate-300 leading-5 mb-4">
              {assignmentData.description}
            </Text>
          ) : null}

          <StatusPanel
            status={assignmentData.status}
            dueDate={assignmentData.dueDate}
            submittedAt={assignmentData.submittedAt}
          />

          {assignmentData.instructions ? (
            <Card className="mb-4">
              <Text className="text-xs uppercase font-semibold text-slate-500 mb-2">
                Yêu cầu
              </Text>
              <Text className="text-sm text-slate-800 dark:text-slate-100 leading-5">
                {assignmentData.instructions}
              </Text>
            </Card>
          ) : null}

          {assignmentData.status === 'overdue' ? (
            <View className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <Text className="text-sm font-semibold text-rose-700">
                Assignment đã quá hạn
              </Text>
              <Text className="text-xs text-rose-600 mt-1">
                Bạn vẫn có thể thử nộp; hệ thống sẽ quyết định có chấp nhận bài
                nộp muộn hay không.
              </Text>
            </View>
          ) : null}

          <Input
            label="Bài làm"
            value={answerText}
            onChangeText={setAnswerText}
            placeholder="Nhập câu trả lời tự luận..."
            multiline
            editable={!isReadOnly && !submitAssignment.isPending}
            textAlignVertical="top"
            helper={answerHelper}
            className="min-h-[180px]"
          />

          {assignmentData.feedback ? (
            <Card className="mt-4">
              <Text className="text-xs uppercase font-semibold text-slate-500 mb-2">
                Nhận xét
              </Text>
              <Text className="text-sm text-slate-800 dark:text-slate-100 leading-5">
                {assignmentData.feedback}
              </Text>
            </Card>
          ) : null}

          {typeof assignmentData.score === 'number' ? (
            <Card className="mt-4">
              <Text className="text-xs uppercase font-semibold text-slate-500 mb-1">
                Điểm
              </Text>
              <Text className="text-2xl font-bold text-primary">
                {assignmentData.score.toFixed(1)}
              </Text>
            </Card>
          ) : null}
        </Screen>

        {!isReadOnly ? (
          <View className="px-5 pt-3 pb-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <Button
              label="Nộp bài"
              onPress={confirmSubmit}
              disabled={!canSubmit}
              loading={submitAssignment.isPending}
              fullWidth
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}
