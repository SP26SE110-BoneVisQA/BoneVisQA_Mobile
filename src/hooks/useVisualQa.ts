import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { askJson, askMultipart } from '../api/visualQa';
import { createQuestion } from '../api/questions';
import type { VisualQaMessage } from '../types/case';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export interface UseVisualQaResult {
  messages: VisualQaMessage[];
  ask: (question: string, imageUri?: string) => Promise<void>;
  isLoading: boolean;
  clear: () => void;
  seed: (messages: VisualQaMessage[]) => void;
}

export function useVisualQa(caseId?: string): UseVisualQaResult {
  const queryClient = useQueryClient();
  const key = ['visualqa', caseId ?? 'general'] as const;

  const { data: messages = [] } = useQuery<VisualQaMessage[]>({
    queryKey: key,
    queryFn: () => Promise.resolve<VisualQaMessage[]>([]),
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: [],
  });

  const setMessages = useCallback(
    (updater: (prev: VisualQaMessage[]) => VisualQaMessage[]): void => {
      queryClient.setQueryData<VisualQaMessage[]>(key, (prev) =>
        updater(prev ?? []),
      );
    },
    [queryClient, key],
  );

  const isLoading = messages.some((m) => m.isLoading);

  const ask = useCallback(
    async (question: string, imageUri?: string): Promise<void> => {
      const userMessage: VisualQaMessage = {
        id: makeId('user'),
        role: 'user',
        content: question,
        imageUri,
        createdAt: nowIso(),
      };
      const loadingId = makeId('assist');
      const loadingMessage: VisualQaMessage = {
        id: loadingId,
        role: 'assistant',
        content: '',
        createdAt: nowIso(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMessage, loadingMessage]);

      try {
        const result = imageUri
          ? await askMultipart({ caseId, question, imageUri })
          : await askJson({ caseId, question });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: result.answer,
                  references: result.references,
                  isLoading: false,
                  createdAt: nowIso(),
                }
              : m,
          ),
        );

        // Best-effort persistence — swallow errors.
        try {
          await createQuestion({ caseId, question });
        } catch {
          // ignore
        }
      } catch (error) {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Đã xảy ra lỗi khi gọi AI.';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: message,
                  isLoading: false,
                  isError: true,
                  createdAt: nowIso(),
                }
              : m,
          ),
        );
      }
    },
    [caseId, setMessages],
  );

  const clear = useCallback((): void => {
    setMessages(() => []);
  }, [setMessages]);

  const seed = useCallback(
    (next: VisualQaMessage[]): void => {
      setMessages((prev) => (prev.length === 0 ? next : prev));
    },
    [setMessages],
  );

  return { messages, ask, isLoading, clear, seed };
}

export default useVisualQa;
