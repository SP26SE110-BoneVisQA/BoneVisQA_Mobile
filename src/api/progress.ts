import { api } from './client';
import type {
  Analytics,
  ProgressSummary,
  RecentActivity,
  RecentActivityType,
  TopicStat,
  WeeklyScorePoint,
} from '../types/quiz';

interface RawStudentProgressDto {
  totalCasesViewed?: number;
  totalQuestionsAsked?: number;
  quizzesCompleted?: number;
  totalQuizAnswersSubmitted?: number;
  avgQuizScore?: number | null;
  totalQuizAttempts?: number;
  completedQuizzes?: number;
  escalatedAnswers?: number;
  latestQuizScore?: number | null;
  quizAccuracyRate?: number | null;
}

interface RawStudentTopicStatDto {
  topic?: string | null;
  quizAttempts?: number;
  questionsAsked?: number;
  averageQuizScore?: number | null;
  accuracyRate?: number | null;
  totalInteractions?: number;
}

interface RawStudentRecentActivityDto {
  activityType?: string | null;
  title?: string | null;
  description?: string | null;
  topic?: string | null;
  occurredAt?: string;
}

interface RawStudentAnalyticsSummaryDto {
  questionsAsked?: number;
  casesViewed?: number;
  quizAttempts?: number;
  averageQuizScore?: number | null;
  // Optional extras — backend may or may not provide
  weeklyScores?: Array<{ week?: string | null; average?: number | null }>;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
}

function mapProgress(dto: RawStudentProgressDto): ProgressSummary {
  return {
    totalQuizzes: dto.totalQuizAttempts ?? 0,
    completedQuizzes: dto.completedQuizzes ?? dto.quizzesCompleted ?? 0,
    averageScore: dto.avgQuizScore ?? 0,
    accuracyRate: dto.quizAccuracyRate ?? undefined,
    casesViewed: dto.totalCasesViewed,
    questionsAsked: dto.totalQuestionsAsked,
  };
}

function mapTopicStat(dto: RawStudentTopicStatDto): TopicStat {
  const attempts = dto.quizAttempts ?? 0;
  return {
    topic: dto.topic ?? 'Other',
    total: attempts,
    completed: attempts,
    averageScore: dto.averageQuizScore ?? 0,
    accuracyRate: dto.accuracyRate ?? undefined,
  };
}

function normalizeActivityType(raw: string | null | undefined): RecentActivityType {
  const value = (raw ?? '').toLowerCase();
  if (value.includes('quiz')) {
    return 'quiz';
  }
  if (value.includes('visual') || value.includes('qa') || value.includes('question')) {
    return 'visual_qa';
  }
  return 'case';
}

function mapRecentActivity(
  dto: RawStudentRecentActivityDto,
  index: number,
): RecentActivity {
  return {
    id: `${dto.occurredAt ?? 'activity'}-${index}`,
    type: normalizeActivityType(dto.activityType),
    title: dto.title ?? 'Activity',
    description: dto.description ?? undefined,
    topic: dto.topic ?? undefined,
    timestamp: dto.occurredAt ?? new Date().toISOString(),
  };
}

function mapAnalytics(dto: RawStudentAnalyticsSummaryDto): Analytics {
  const weeklyScores: WeeklyScorePoint[] = Array.isArray(dto.weeklyScores)
    ? dto.weeklyScores
        .filter((w) => w && typeof w === 'object')
        .map((w) => ({
          week: w.week ?? '',
          average: typeof w.average === 'number' ? w.average : 0,
        }))
    : [];
  return {
    weeklyScores,
    strengths: Array.isArray(dto.strengths) ? dto.strengths : [],
    weaknesses: Array.isArray(dto.weaknesses) ? dto.weaknesses : [],
    questionsAsked: dto.questionsAsked,
    casesViewed: dto.casesViewed,
    quizAttempts: dto.quizAttempts,
    averageQuizScore: dto.averageQuizScore ?? undefined,
  };
}

export async function getProgress(): Promise<ProgressSummary> {
  const { data } = await api.get<RawStudentProgressDto>('/api/student/progress');
  return mapProgress(data ?? {});
}

export async function getTopicStats(): Promise<TopicStat[]> {
  const { data } = await api.get<RawStudentTopicStatDto[]>(
    '/api/student/progress/topic-stats',
  );
  return Array.isArray(data) ? data.map(mapTopicStat) : [];
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  const { data } = await api.get<RawStudentRecentActivityDto[]>(
    '/api/student/progress/recent-activity',
  );
  return Array.isArray(data) ? data.map(mapRecentActivity) : [];
}

export async function getAnalytics(): Promise<Analytics> {
  const { data } = await api.get<RawStudentAnalyticsSummaryDto>(
    '/api/student/analytics',
  );
  return mapAnalytics(data ?? {});
}
