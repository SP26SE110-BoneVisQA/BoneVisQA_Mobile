import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import * as usersApi from '../api/users';
import { useAuthStore } from '../stores/authStore';
import type { ApiError } from '../types/api';
import type { AuthUser } from '../types/auth';
import type {
  RequestMedicalVerificationDto,
  StudentProfile,
  UpdateStudentProfileDto,
} from '../types/user';

export const PROFILE_QUERY_KEY = ['me'] as const;

function syncAuthUserFromProfile(profile: StudentProfile): void {
  const current = useAuthStore.getState().user;
  if (!current) {
    return;
  }
  const nextUser: AuthUser = {
    id: profile.id,
    email: profile.email ?? current.email,
    fullName: profile.fullName ?? current.fullName,
    role: current.role,
  };
  useAuthStore.getState().setUser(nextUser);
}

export function useProfile(): UseQueryResult<StudentProfile, ApiError> {
  return useQuery<StudentProfile, ApiError>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: usersApi.getMe,
    staleTime: 30_000,
  });
}

export function useUpdateProfile(): UseMutationResult<
  StudentProfile,
  ApiError,
  UpdateStudentProfileDto
> {
  const queryClient = useQueryClient();
  return useMutation<StudentProfile, ApiError, UpdateStudentProfileDto>({
    mutationFn: (dto) => usersApi.updateMe(dto),
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
      syncAuthUserFromProfile(profile);
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}

export function useUploadAvatar(): UseMutationResult<
  { avatarUrl: string },
  ApiError,
  string
> {
  const queryClient = useQueryClient();
  return useMutation<{ avatarUrl: string }, ApiError, string>({
    mutationFn: (uri) => usersApi.uploadAvatar(uri),
    onSuccess: (data) => {
      const current = queryClient.getQueryData<StudentProfile>(PROFILE_QUERY_KEY);
      if (current) {
        const next: StudentProfile = { ...current, avatarUrl: data.avatarUrl };
        queryClient.setQueryData(PROFILE_QUERY_KEY, next);
      }
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}

export function useRequestMedicalVerification(): UseMutationResult<
  void,
  ApiError,
  RequestMedicalVerificationDto
> {
  return useMutation<void, ApiError, RequestMedicalVerificationDto>({
    mutationFn: (dto) => usersApi.requestMedicalVerification(dto),
  });
}
