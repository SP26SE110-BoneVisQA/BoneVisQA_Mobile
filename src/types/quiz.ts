/**
 * Quiz domain types for the Student app.
 *
 * The mobile layer intentionally models quizzes with a slightly richer
 * structure than the raw backend DTOs — `QuizListItemDto`, `QuizSessionDto`,
 * etc. (see `/tmp/bonevisqa-swagger.json`). The API layer (`src/api/quizzes.ts`)
 * is responsible for mapping DTOs into these types so the UI stays clean.
 */

export type QuizStatus =
  | 'assigned'
  | 'completed'
  | 'in_progress'
  | 'practice';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  classId?: string;
  className?: string;
  topic?: string;
  difficulty?: string;
  questionCount: number;
  durationMinutes?: number;
  passingScore?: number;
  dueDate?: string;
  openTime?: string;
  status: QuizStatus;
  score?: number;
  createdAt?: string;
  isAiGenerated?: boolean;
}

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'image_choice';

export interface QuestionOption {
  id: string;
  label: string;
  imageUrl?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options: QuestionOption[];
  imageUrl?: string;
  explanation?: string;
  points?: number;
  caseId?: string;
  caseTitle?: string;
}

export interface AttemptAnswer {
  questionId: string;
  selectedOptionIds: string[];
  answeredAt?: string;
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'graded';

export interface Attempt {
  id: string;
  quizId: string;
  quizTitle?: string;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  passed?: boolean;
  status: AttemptStatus;
  answers: AttemptAnswer[];
}

export interface ReviewQuestion extends Question {
  correctOptionIds: string[];
  selected: string[];
  isCorrect: boolean;
}

export interface ReviewResult extends Attempt {
  questions: ReviewQuestion[];
}

export interface ProgressSummary {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  streakDays?: number;
  casesViewed?: number;
  questionsAsked?: number;
  accuracyRate?: number;
}

export interface TopicStat {
  topic: string;
  total: number;
  completed: number;
  averageScore: number;
  accuracyRate?: number;
}

export type RecentActivityType = 'quiz' | 'case' | 'visual_qa';

export interface RecentActivity {
  id: string;
  type: RecentActivityType;
  title: string;
  description?: string;
  topic?: string;
  timestamp: string;
  score?: number;
}

export interface WeeklyScorePoint {
  week: string;
  average: number;
}

export interface Analytics {
  weeklyScores: WeeklyScorePoint[];
  strengths: string[];
  weaknesses: string[];
  questionsAsked?: number;
  casesViewed?: number;
  quizAttempts?: number;
  averageQuizScore?: number;
}

export type AssignmentStatus = 'pending' | 'overdue' | 'completed';

export interface Assignment {
  id: string;
  quizId?: string;
  classId?: string;
  className?: string;
  title: string;
  type?: string;
  dueDate?: string;
  status: AssignmentStatus;
}

export type PracticeDifficulty = 'easy' | 'medium' | 'hard';

export interface PracticeGenerateDto {
  topic: string;
  difficulty: PracticeDifficulty;
  count: number;
}

export interface QuizListParams {
  classId?: string;
  status?: string;
}

export interface StartQuizResult extends Attempt {
  questions: Question[];
  durationMinutes?: number;
}

export interface GeneratedPracticeResult {
  quizId: string;
  attemptId: string;
  title?: string;
  topic?: string;
  questions: Question[];
}
