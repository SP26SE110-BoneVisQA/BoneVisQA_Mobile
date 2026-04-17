import { api } from './client';
import type { Assignment, AssignmentStatus } from '../types/quiz';

interface RawStudentAssignmentSummaryDto {
  id?: string;
  title?: string | null;
  type?: string | null;
  dueAt?: string | null;
}

function computeStatus(dueAt: string | null | undefined): AssignmentStatus {
  if (!dueAt) {
    return 'pending';
  }
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) {
    return 'pending';
  }
  if (due < Date.now()) {
    return 'overdue';
  }
  return 'pending';
}

function mapAssignment(dto: RawStudentAssignmentSummaryDto): Assignment {
  return {
    id: dto.id ?? '',
    title: dto.title ?? 'Nhiệm vụ',
    type: dto.type ?? undefined,
    dueDate: dto.dueAt ?? undefined,
    status: computeStatus(dto.dueAt),
  };
}

export async function listAssignments(): Promise<Assignment[]> {
  const { data } = await api.get<RawStudentAssignmentSummaryDto[]>(
    '/api/student/assignments',
  );
  return Array.isArray(data) ? data.map(mapAssignment) : [];
}
