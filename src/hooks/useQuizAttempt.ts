import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import * as quizzesApi from '../api/quizzes';
import type {
  AttemptAnswer,
  Question,
  ReviewResult,
  StartQuizResult,
} from '../types/quiz';
import type { ApiError } from '../types/api';

const DEBOUNCE_MS = 500;
const OFFLINE_QUEUE_KEY = 'BONEVISQA_OFFLINE_QUEUE';

function attemptStorageKey(quizId: string): string {
  return `BONEVISQA_ATTEMPT_${quizId}`;
}

interface QueuedAnswer {
  attemptId: string;
  questionId: string;
  selectedOptionIds: string[];
  queuedAt: number;
}

interface PersistedAttempt {
  attemptId: string;
  quizId: string;
  startedAt: string;
  durationMinutes?: number;
  questions: Question[];
  answers: AttemptAnswer[];
  currentIndex: number;
}

export interface UseQuizAttemptResult {
  isLoading: boolean;
  isSubmitting: boolean;
  error: ApiError | null;
  attempt: PersistedAttempt | null;
  questions: Question[];
  currentIndex: number;
  answers: AttemptAnswer[];
  durationMinutes?: number;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  setAnswer: (questionId: string, optionIds: string[]) => void;
  submit: () => Promise<ReviewResult>;
  discard: () => Promise<void>;
}

async function loadPersisted(quizId: string): Promise<PersistedAttempt | null> {
  try {
    const raw = await AsyncStorage.getItem(attemptStorageKey(quizId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PersistedAttempt;
  } catch {
    return null;
  }
}

async function persist(attempt: PersistedAttempt): Promise<void> {
  try {
    await AsyncStorage.setItem(
      attemptStorageKey(attempt.quizId),
      JSON.stringify(attempt),
    );
  } catch {
    // storage errors are non-fatal
  }
}

async function clearPersisted(quizId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(attemptStorageKey(quizId));
  } catch {
    // ignore
  }
}

async function loadQueue(): Promise<QueuedAnswer[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as QueuedAnswer[]) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedAnswer[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

async function enqueueAnswer(item: QueuedAnswer): Promise<void> {
  const queue = await loadQueue();
  queue.push(item);
  await saveQueue(queue);
}

async function flushQueue(): Promise<void> {
  const queue = await loadQueue();
  if (queue.length === 0) {
    return;
  }
  const remaining: QueuedAnswer[] = [];
  for (const item of queue) {
    try {
      await quizzesApi.submitAnswer(
        item.attemptId,
        item.questionId,
        item.selectedOptionIds,
      );
    } catch {
      remaining.push(item);
    }
  }
  await saveQueue(remaining);
}

function fromStartResult(result: StartQuizResult): PersistedAttempt {
  return {
    attemptId: result.id,
    quizId: result.quizId,
    startedAt: result.startedAt,
    durationMinutes: result.durationMinutes,
    questions: result.questions,
    answers: [],
    currentIndex: 0,
  };
}

export function useQuizAttempt(quizId: string): UseQuizAttemptResult {
  const [attempt, setAttempt] = useState<PersistedAttempt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWriteRef = useRef<Map<string, string[]>>(new Map());

  // Initial load: hydrate from storage or start a new attempt
  useEffect(() => {
    let cancelled = false;

    async function bootstrap(): Promise<void> {
      setIsLoading(true);
      setError(null);
      const persisted = await loadPersisted(quizId);
      if (persisted && !cancelled) {
        setAttempt(persisted);
        setIsLoading(false);
        return;
      }
      try {
        const started = await quizzesApi.startQuiz(quizId);
        if (cancelled) {
          return;
        }
        const next = fromStartResult(started);
        setAttempt(next);
        await persist(next);
      } catch (err) {
        if (!cancelled) {
          setError(err as ApiError);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [quizId]);

  // Flush offline queue when connectivity restored
  useEffect(() => {
    const sub = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected === true) {
        void flushQueue();
      }
    });
    return () => {
      sub();
    };
  }, []);

  // Also try once on mount in case we start online
  useEffect(() => {
    void flushQueue();
  }, []);

  const updateAttempt = useCallback(
    (updater: (prev: PersistedAttempt) => PersistedAttempt) => {
      setAttempt((prev) => {
        if (!prev) {
          return prev;
        }
        const next = updater(prev);
        void persist(next);
        return next;
      });
    },
    [],
  );

  const flushPendingWrites = useCallback(async (): Promise<void> => {
    if (!attempt) {
      return;
    }
    const entries = Array.from(pendingWriteRef.current.entries());
    pendingWriteRef.current.clear();
    for (const [questionId, selectedOptionIds] of entries) {
      try {
        await quizzesApi.submitAnswer(
          attempt.attemptId,
          questionId,
          selectedOptionIds,
        );
      } catch {
        await enqueueAnswer({
          attemptId: attempt.attemptId,
          questionId,
          selectedOptionIds,
          queuedAt: Date.now(),
        });
      }
    }
  }, [attempt]);

  const setAnswer = useCallback(
    (questionId: string, optionIds: string[]) => {
      updateAttempt((prev) => {
        const existing = prev.answers.filter(
          (a) => a.questionId !== questionId,
        );
        return {
          ...prev,
          answers: [
            ...existing,
            {
              questionId,
              selectedOptionIds: optionIds,
              answeredAt: new Date().toISOString(),
            },
          ],
        };
      });
      pendingWriteRef.current.set(questionId, optionIds);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        void flushPendingWrites();
      }, DEBOUNCE_MS);
    },
    [flushPendingWrites, updateAttempt],
  );

  const next = useCallback(() => {
    updateAttempt((prev) => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.questions.length - 1),
    }));
  }, [updateAttempt]);

  const prev = useCallback(() => {
    updateAttempt((p) => ({
      ...p,
      currentIndex: Math.max(p.currentIndex - 1, 0),
    }));
  }, [updateAttempt]);

  const goTo = useCallback(
    (index: number) => {
      updateAttempt((p) => ({
        ...p,
        currentIndex: Math.max(0, Math.min(index, p.questions.length - 1)),
      }));
    },
    [updateAttempt],
  );

  const submit = useCallback(async (): Promise<ReviewResult> => {
    if (!attempt) {
      throw {
        status: 0,
        message: 'There is no attempt to submit',
      } as ApiError;
    }
    setIsSubmitting(true);
    try {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      await flushPendingWrites();
      const result = await quizzesApi.submitQuiz(
        attempt.attemptId,
        attempt.answers,
      );
      await clearPersisted(attempt.quizId);
      return result;
    } finally {
      setIsSubmitting(false);
    }
  }, [attempt, flushPendingWrites]);

  const discard = useCallback(async (): Promise<void> => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    pendingWriteRef.current.clear();
    if (attempt) {
      await clearPersisted(attempt.quizId);
    }
    setAttempt(null);
  }, [attempt]);

  const value = useMemo<UseQuizAttemptResult>(
    () => ({
      isLoading,
      isSubmitting,
      error,
      attempt,
      questions: attempt?.questions ?? [],
      currentIndex: attempt?.currentIndex ?? 0,
      answers: attempt?.answers ?? [],
      durationMinutes: attempt?.durationMinutes,
      next,
      prev,
      goTo,
      setAnswer,
      submit,
      discard,
    }),
    [
      isLoading,
      isSubmitting,
      error,
      attempt,
      next,
      prev,
      goTo,
      setAnswer,
      submit,
      discard,
    ],
  );

  return value;
}
