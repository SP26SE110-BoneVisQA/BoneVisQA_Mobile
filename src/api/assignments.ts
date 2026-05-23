import { api } from './client';
import type { Assignment, AssignmentStatus } from '../types/quiz';

interface RawStudentAssignmentSummaryDto {
  id?: string;
  title?: string | null;
  type?: string | null;
  status?: string | null;
  dueAt?: string | null;
  dueDate?: string | null;
  submittedAt?: string | null;
}

interface RawStudentAssignmentDetailDto extends RawStudentAssignmentSummaryDto {
  description?: string | null;
  instructions?: string | null;
  answerText?: string | null;
  score?: number | null;
  feedback?: string | null;
}

interface SubmitAssignmentResponseDto extends RawStudentAssignmentDetailDto {
  submissionId?: string;
}

function normalizeStatus(
  status: string | null | undefined,
  dueAt: string | null | undefined,
  submittedAt?: string | null,
  score?: number | null,
): AssignmentStatus {
  const value = (status ?? '').toLowerCase();
  if (value.includes('graded') || typeof score === 'number') {
    return 'graded';
  }
  if (
    value.includes('submitted') ||
    value.includes('completed') ||
    Boolean(submittedAt)
  ) {
    return 'submitted';
  }
  if (value.includes('overdue')) {
    return 'overdue';
  }
  if (!dueAt) {
    return 'pending';
  }
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) {
    return 'pending';
  }
  return due < Date.now() ? 'overdue' : 'pending';
}

function isNotFound(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: unknown }).status;
    return status === 404;
  }
  return false;
}

function mapAssignment(
  dto: RawStudentAssignmentSummaryDto | RawStudentAssignmentDetailDto,
): Assignment {
  const dueDate = dto.dueAt ?? dto.dueDate ?? undefined;
  const detail = dto as RawStudentAssignmentDetailDto;
  return {
    id: dto.id ?? '',
    title: dto.title ?? 'Nhiệm vụ',
    type: dto.type ?? undefined,
    description: detail.description ?? undefined,
    instructions: detail.instructions ?? undefined,
    dueDate,
    submittedAt: dto.submittedAt ?? undefined,
    answerText: detail.answerText ?? undefined,
    score: detail.score ?? undefined,
    feedback: detail.feedback ?? undefined,
    status: normalizeStatus(dto.status, dueDate, dto.submittedAt, detail.score),
  };
}

export async function listAssignments(): Promise<Assignment[]> {
  try {
    const { data } = await api.get<RawStudentAssignmentSummaryDto[]>(
      '/api/student/assignments',
    );
    return Array.isArray(data) ? data.map(mapAssignment) : [];
  } catch (error: unknown) {
    if (isNotFound(error)) {
      return [];
    }
    throw error;
  }
}

export async function getAssignment(assignmentId: string): Promise<Assignment> {
  const { data } = await api.get<RawStudentAssignmentDetailDto>(
    `/api/student/assignments/${assignmentId}`,
  );
  return mapAssignment(data);
}

export async function submitAssignment(
  assignmentId: string,
  answerText: string,
): Promise<Assignment> {
  const { data } = await api.post<SubmitAssignmentResponseDto>(
    `/api/student/assignments/${assignmentId}/submissions`,
    { answerText },
  );
  return mapAssignment(data);
}
