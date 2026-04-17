import { QueryClient } from '@tanstack/react-query';
import { isAuthError } from '../api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        failureCount < 2 && !isAuthError(error),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
