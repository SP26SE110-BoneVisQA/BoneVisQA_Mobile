import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as analyticsApi from '../api/analytics';
import type {
  AnalyticsDashboard,
  StudentCompetency,
  StudentErrorPattern,
  StudentInsight,
} from '../types/analytics';
import type { ApiError } from '../types/api';

const enhancedAnalyticsKeys = {
  dashboard: ['student-analytics', 'dashboard'] as const,
  competencies: ['student-analytics', 'competencies'] as const,
  patterns: ['student-analytics', 'error-patterns'] as const,
  insights: ['student-analytics', 'insights'] as const,
};

export function useStudentDashboard(): UseQueryResult<AnalyticsDashboard, ApiError> {
  return useQuery<AnalyticsDashboard, ApiError>({
    queryKey: enhancedAnalyticsKeys.dashboard,
    queryFn: analyticsApi.getStudentDashboard,
  });
}

export function useCompetencies(): UseQueryResult<StudentCompetency[], ApiError> {
  return useQuery<StudentCompetency[], ApiError>({
    queryKey: enhancedAnalyticsKeys.competencies,
    queryFn: analyticsApi.getCompetencies,
  });
}

export function useErrorPatterns(): UseQueryResult<StudentErrorPattern[], ApiError> {
  return useQuery<StudentErrorPattern[], ApiError>({
    queryKey: enhancedAnalyticsKeys.patterns,
    queryFn: analyticsApi.getErrorPatterns,
  });
}

export function useInsights(): UseQueryResult<StudentInsight[], ApiError> {
  return useQuery<StudentInsight[], ApiError>({
    queryKey: enhancedAnalyticsKeys.insights,
    queryFn: analyticsApi.getInsights,
  });
}

export function useMarkInsightRead(): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: analyticsApi.markInsightRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: enhancedAnalyticsKeys.insights });
    },
  });
}

export function useActionInsight(): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: analyticsApi.actionInsight,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: enhancedAnalyticsKeys.insights });
    },
  });
}

export function useResolveErrorPattern(): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: analyticsApi.resolveErrorPattern,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: enhancedAnalyticsKeys.patterns });
    },
  });
}
