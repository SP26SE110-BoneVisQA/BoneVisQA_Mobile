import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as quizzesApi from '../api/quizzes';
import * as progressApi from '../api/progress';
import * as assignmentsApi from '../api/assignments';
import type {
  Analytics,
  Assignment,
  Attempt,
  GeneratedPracticeResult,
  PracticeGenerateDto,
  ProgressSummary,
  Quiz,
  QuizListParams,
  RecentActivity,
  StartQuizResult,
  TopicStat,
} from '../types/quiz';
import type { ApiError } from '../types/api';

export const quizKeys = {
  all: ['quizzes'] as const,
  list: (params?: QuizListParams) => ['quizzes', params ?? {}] as const,
  history: () => ['quizzes', 'history'] as const,
  practice: () => ['quizzes', 'practice'] as const,
  review: (attemptId: string) => ['attempt', attemptId] as const,
};

export const progressKeys = {
  summary: () => ['progress'] as const,
  topics: () => ['progress', 'topic-stats'] as const,
  recent: () => ['progress', 'recent-activity'] as const,
  analytics: () => ['analytics'] as const,
};

export const assignmentKeys = {
  list: () => ['assignments'] as const,
};

// --- Queries ---------------------------------------------------------------

export function useQuizzes(
  params?: QuizListParams,
): UseQueryResult<Quiz[], ApiError> {
  return useQuery<Quiz[], ApiError>({
    queryKey: quizKeys.list(params),
    queryFn: () => quizzesApi.listQuizzes(params),
  });
}

export function useQuizHistory(): UseQueryResult<Attempt[], ApiError> {
  return useQuery<Attempt[], ApiError>({
    queryKey: quizKeys.history(),
    queryFn: () => quizzesApi.getHistory(),
  });
}

export function usePracticeList(): UseQueryResult<Quiz[], ApiError> {
  return useQuery<Quiz[], ApiError>({
    queryKey: quizKeys.practice(),
    queryFn: () => quizzesApi.getPracticeList(),
  });
}

export function useProgress(): UseQueryResult<ProgressSummary, ApiError> {
  return useQuery<ProgressSummary, ApiError>({
    queryKey: progressKeys.summary(),
    queryFn: () => progressApi.getProgress(),
  });
}

export function useTopicStats(): UseQueryResult<TopicStat[], ApiError> {
  return useQuery<TopicStat[], ApiError>({
    queryKey: progressKeys.topics(),
    queryFn: () => progressApi.getTopicStats(),
  });
}

export function useRecentActivity(): UseQueryResult<RecentActivity[], ApiError> {
  return useQuery<RecentActivity[], ApiError>({
    queryKey: progressKeys.recent(),
    queryFn: () => progressApi.getRecentActivity(),
  });
}

export function useAnalytics(): UseQueryResult<Analytics, ApiError> {
  return useQuery<Analytics, ApiError>({
    queryKey: progressKeys.analytics(),
    queryFn: () => progressApi.getAnalytics(),
  });
}

export function useAssignments(): UseQueryResult<Assignment[], ApiError> {
  return useQuery<Assignment[], ApiError>({
    queryKey: assignmentKeys.list(),
    queryFn: () => assignmentsApi.listAssignments(),
  });
}

// --- Mutations -------------------------------------------------------------

export function useStartQuiz(): UseMutationResult<
  StartQuizResult,
  ApiError,
  string
> {
  return useMutation<StartQuizResult, ApiError, string>({
    mutationFn: (quizId) => quizzesApi.startQuiz(quizId),
  });
}

export function useDeleteAttempt(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (attemptId) => quizzesApi.deleteAttempt(attemptId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: quizKeys.history() });
    },
  });
}

export function useRequestRetake(): UseMutationResult<void, ApiError, string> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (quizId) => quizzesApi.requestRetake(quizId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: quizKeys.all });
    },
  });
}

export function useGeneratePractice(): UseMutationResult<
  GeneratedPracticeResult,
  ApiError,
  PracticeGenerateDto
> {
  return useMutation<GeneratedPracticeResult, ApiError, PracticeGenerateDto>({
    mutationFn: (dto) => quizzesApi.generatePractice(dto),
  });
}

export function useSavePractice(): UseMutationResult<
  void,
  ApiError,
  PracticeGenerateDto
> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, PracticeGenerateDto>({
    mutationFn: (dto) => quizzesApi.savePractice(dto),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: quizKeys.practice() });
    },
  });
}
