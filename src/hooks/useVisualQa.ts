import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { askJson, askMultipart } from '../api/visualQa';
import type { VisualQaCapabilities, VisualQaMessage } from '../types/case';

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
  capabilities?: VisualQaCapabilities;
  clear: () => void;
  seed: (messages: VisualQaMessage[]) => void;
}

export function useVisualQa(
  caseId?: string,
  sessionId?: string,
  initialCapabilities?: VisualQaCapabilities,
): UseVisualQaResult {
  const queryClient = useQueryClient();
  const key = ['visualqa', sessionId ?? caseId ?? 'general'] as const;
  const sessionIdRef = useRef<string | undefined>(sessionId);
  const [capabilities, setCapabilities] = useState<VisualQaCapabilities | undefined>(
    initialCapabilities,
  );

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (initialCapabilities) {
      setCapabilities(initialCapabilities);
    }
  }, [initialCapabilities]);

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
          ? await askMultipart({
              question,
              imageUri,
              sessionId: sessionIdRef.current,
            })
          : await askJson({
              caseId,
              question,
              sessionId: sessionIdRef.current,
            });

        sessionIdRef.current = result.sessionId ?? sessionIdRef.current;
        setCapabilities(result.capabilities);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: result.answer,
                  references: result.references,
                  turnId: result.latestTurn?.id,
                  reviewState: result.reviewState,
                  isLoading: false,
                  createdAt: nowIso(),
                }
              : m,
          ),
        );
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

  return { messages, ask, isLoading, capabilities, clear, seed };
}

export default useVisualQa;
