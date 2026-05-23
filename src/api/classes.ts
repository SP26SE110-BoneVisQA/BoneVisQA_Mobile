import { api } from './client';
import type {
  ClassAnnouncement,
  ClassQuizSummary,
  ClassStudent,
  StudentCaseAssignment,
  StudentClass,
  StudentClassDetail,
} from '../types/class';

interface ClassDto {
  classId?: string;
  className?: string | null;
  semester?: string | null;
  lecturerId?: string | null;
  lecturerName?: string | null;
  expertId?: string | null;
  expertName?: string | null;
  totalAnnouncements?: number;
  totalQuizzes?: number;
  totalCases?: number;
  enrolledAt?: string | null;
}

interface ClassDetailDto extends ClassDto {
  expertEmail?: string | null;
  expertAvatarUrl?: string | null;
  assignedCases?: Array<{
    caseId?: string;
    title?: string | null;
    dueDate?: string | null;
    isMandatory?: boolean;
  }> | null;
  quizzes?: Array<{
    quizId?: string;
    title?: string | null;
    topic?: string | null;
    openTime?: string | null;
    closeTime?: string | null;
    totalQuestions?: number;
    timeLimit?: number | null;
    passingScore?: number | null;
    isCompleted?: boolean;
    score?: number | null;
  }> | null;
  students?: Array<{
    studentId?: string;
    studentName?: string | null;
    studentCode?: string | null;
  }> | null;
  announcements?: Array<{
    id?: string;
    title?: string | null;
    content?: string | null;
    createdAt?: string | null;
    relatedAssignment?: {
      assignmentId?: string | null;
      assignmentTitle?: string | null;
    } | null;
  }> | null;
}

function mapClass(dto: ClassDto): StudentClass {
  return {
    id: dto.classId ?? '',
    name: dto.className ?? 'Class',
    semester: dto.semester ?? undefined,
    lecturerId: dto.lecturerId ?? undefined,
    lecturerName: dto.lecturerName ?? undefined,
    expertId: dto.expertId ?? undefined,
    expertName: dto.expertName ?? undefined,
    totalAnnouncements: dto.totalAnnouncements ?? 0,
    totalQuizzes: dto.totalQuizzes ?? 0,
    totalCases: dto.totalCases ?? 0,
    enrolledAt: dto.enrolledAt ?? undefined,
  };
}

export async function listClasses(): Promise<StudentClass[]> {
  const { data } = await api.get<ClassDto[]>('/api/Students/classes');
  return Array.isArray(data) ? data.map(mapClass).filter((item) => item.id.length > 0) : [];
}

export async function getClass(classId: string): Promise<StudentClassDetail> {
  const { data } = await api.get<ClassDetailDto>(`/api/Students/classes/${classId}`);
  const base = mapClass(data ?? {});
  const assignedCases: StudentCaseAssignment[] = (data?.assignedCases ?? []).map((item) => ({
    caseId: item.caseId ?? '',
    title: item.title ?? 'Case',
    dueDate: item.dueDate ?? undefined,
    isMandatory: item.isMandatory ?? false,
  }));
  const quizzes: ClassQuizSummary[] = (data?.quizzes ?? []).map((item) => ({
    id: item.quizId ?? '',
    title: item.title ?? 'Quiz',
    topic: item.topic ?? undefined,
    openTime: item.openTime ?? undefined,
    closeTime: item.closeTime ?? undefined,
    totalQuestions: item.totalQuestions ?? 0,
    timeLimit: item.timeLimit ?? undefined,
    passingScore: item.passingScore ?? undefined,
    isCompleted: item.isCompleted ?? false,
    score: item.score ?? undefined,
  }));
  const students: ClassStudent[] = (data?.students ?? []).map((item) => ({
    id: item.studentId ?? '',
    name: item.studentName ?? 'Student',
    code: item.studentCode ?? undefined,
  }));
  const announcements: ClassAnnouncement[] = (data?.announcements ?? []).map((item) => ({
    id: item.id ?? '',
    title: item.title ?? 'Announcement',
    content: item.content ?? undefined,
    createdAt: item.createdAt ?? undefined,
    assignmentId: item.relatedAssignment?.assignmentId ?? undefined,
    assignmentTitle: item.relatedAssignment?.assignmentTitle ?? undefined,
  }));
  return {
    ...base,
    expertEmail: data?.expertEmail ?? undefined,
    expertAvatarUrl: data?.expertAvatarUrl ?? undefined,
    assignedCases,
    quizzes,
    students,
    announcements,
  };
}

export async function leaveClass(classId: string): Promise<void> {
  await api.delete(`/api/Students/classes/${classId}`);
}
