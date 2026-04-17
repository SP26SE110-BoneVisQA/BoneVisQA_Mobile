import { api, handleApiError } from './client';
import type { QaQuestion } from '../types/case';

interface StudentQuestionDto {
  id: string;
  caseId?: string | null;
  studentId?: string;
  annotationId?: string | null;
  questionText?: string | null;
  createdAt?: string | null;
}

interface StudentQuestionHistoryItemDto {
  id: string;
  caseId?: string | null;
  questionText?: string | null;
  createdAt?: string | null;
  answerText?: string | null;
  answerStatus?: string | null;
}

function mapHistoryItem(dto: StudentQuestionHistoryItemDto): QaQuestion {
  return {
    id: dto.id,
    caseId: dto.caseId ?? undefined,
    question: dto.questionText ?? '',
    answer: dto.answerText ?? undefined,
    createdAt: dto.createdAt ?? undefined,
  };
}

function mapCreated(dto: StudentQuestionDto): QaQuestion {
  return {
    id: dto.id,
    caseId: dto.caseId ?? undefined,
    question: dto.questionText ?? '',
    createdAt: dto.createdAt ?? undefined,
  };
}

export async function listQuestions(): Promise<QaQuestion[]> {
  try {
    const { data } = await api.get<StudentQuestionHistoryItemDto[]>(
      '/api/student/questions',
    );
    return data.map(mapHistoryItem);
  } catch (error) {
    throw await handleApiError(error);
  }
}

export interface CreateQuestionInput {
  caseId?: string;
  question: string;
  answer?: string;
  annotationId?: string;
}

export async function createQuestion(
  dto: CreateQuestionInput,
): Promise<QaQuestion> {
  try {
    const payload = {
      caseId: dto.caseId,
      annotationId: dto.annotationId,
      questionText: dto.question,
    };
    const { data } = await api.post<StudentQuestionDto>(
      '/api/student/questions',
      payload,
    );
    return mapCreated(data);
  } catch (error) {
    throw await handleApiError(error);
  }
}
