import { api } from './client';
import type {
  AnalyticsDashboard,
  StudentCompetency,
  StudentErrorPattern,
  StudentInsight,
} from '../types/analytics';

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function boolean(value: unknown): boolean {
  return value === true;
}

function list(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  const dto = record(value);
  return Array.isArray(dto.items) ? dto.items : [];
}

export async function getStudentDashboard(): Promise<AnalyticsDashboard> {
  const { data } = await api.get<unknown>('/api/analytics/student/dashboard');
  const dto = record(data);
  return {
    title: text(dto.title) ?? text(dto.summary),
    completionRate: number(dto.completionRate) ?? number(dto.completionPercentage),
    accuracyRate: number(dto.accuracyRate) ?? number(dto.accuracy),
    streakDays: number(dto.streakDays) ?? number(dto.currentStreak),
    focusMessage: text(dto.focusMessage) ?? text(dto.recommendation),
  };
}

export async function getCompetencies(): Promise<StudentCompetency[]> {
  const { data } = await api.get<unknown>('/api/analytics/student/competencies');
  return list(data).map((value, index) => {
    const dto = record(value);
    return {
      id: text(dto.id) ?? text(dto.competencyId) ?? `competency-${index}`,
      name: text(dto.name) ?? text(dto.title) ?? text(dto.competency) ?? 'Competency',
      score: number(dto.score) ?? number(dto.percentage),
      level: text(dto.level),
      trend: text(dto.trend),
    };
  });
}

export async function getErrorPatterns(): Promise<StudentErrorPattern[]> {
  const { data } = await api.get<unknown>('/api/analytics/student/error-patterns');
  return list(data).map((value, index) => {
    const dto = record(value);
    return {
      id: text(dto.id) ?? text(dto.patternId) ?? `pattern-${index}`,
      title: text(dto.title) ?? text(dto.name) ?? text(dto.pattern) ?? 'Error pattern',
      description: text(dto.description) ?? text(dto.message),
      occurrences: number(dto.occurrences) ?? number(dto.count),
      resolved: boolean(dto.resolved) || boolean(dto.isResolved),
    };
  });
}

export async function getInsights(): Promise<StudentInsight[]> {
  const { data } = await api.get<unknown>('/api/analytics/student/insights');
  return list(data).map((value, index) => {
    const dto = record(value);
    return {
      id: text(dto.id) ?? text(dto.insightId) ?? `insight-${index}`,
      title: text(dto.title) ?? text(dto.name) ?? 'Learning insight',
      description: text(dto.description) ?? text(dto.message),
      actionLabel: text(dto.actionLabel) ?? text(dto.recommendedAction),
      isRead: boolean(dto.isRead) || boolean(dto.read),
      isActioned: boolean(dto.isActioned) || boolean(dto.actioned),
    };
  });
}

export async function markInsightRead(insightId: string): Promise<void> {
  await api.post(`/api/analytics/student/insights/${insightId}/read`);
}

export async function actionInsight(insightId: string): Promise<void> {
  await api.post(`/api/analytics/student/insights/${insightId}/action`);
}

export async function resolveErrorPattern(patternId: string): Promise<void> {
  await api.post(`/api/analytics/student/error-patterns/${patternId}/resolve`);
}
