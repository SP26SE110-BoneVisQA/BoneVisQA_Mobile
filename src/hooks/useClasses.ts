import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { getClass, leaveClass, listClasses } from '../api/classes';
import type { ApiError } from '../types/api';
import type { StudentClass, StudentClassDetail } from '../types/class';

export const classKeys = {
  all: ['student-classes'] as const,
  detail: (classId: string) => ['student-classes', classId] as const,
};

export function useClasses(): UseQueryResult<StudentClass[], ApiError> {
  return useQuery<StudentClass[], ApiError>({
    queryKey: classKeys.all,
    queryFn: listClasses,
  });
}

export function useClass(classId: string): UseQueryResult<StudentClassDetail, ApiError> {
  return useQuery<StudentClassDetail, ApiError>({
    queryKey: classKeys.detail(classId),
    queryFn: () => getClass(classId),
    enabled: classId.length > 0,
  });
}

export function useLeaveClass(): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: leaveClass,
    onSuccess: async (_, classId) => {
      queryClient.removeQueries({ queryKey: classKeys.detail(classId) });
      await queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}
