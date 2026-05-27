import { api } from './client';
import type {
  Attempt,
  GeneratedPracticeResult,
  PracticeGenerateDto,
  Question,
  QuestionOption,
  QuestionType,
  Quiz,
  QuizListParams,
  ReviewQuestion,
  ReviewResult,
  StartQuizResult,
} from '../types/quiz';

/**
 * Raw DTO shapes — kept `unknown`-ish so we map defensively.
 * See /tmp/bonevisqa-swagger.json for full definitions.
 */
interface RawQuizListItemDto {
  quizId?: string;
  title?: string | null;
  classId?: string;
  className?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  timeLimit?: number | null;
  passingScore?: number | null;
  totalQuestions?: number;
  isCompleted?: boolean;
  score?: number | null;
  topic?: string | null;
  difficulty?: string | null;
  isAiGenerated?: boolean;
}

interface RawStudentQuizQuestionDto {
  questionId?: string;
  questionText?: string | null;
  type?: string | null;
  caseId?: string | null;
  caseTitle?: string | null;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  imageUrl?: string | null;
}

interface RawQuizSessionDto {
  attemptId?: string;
  quizId?: string;
  title?: string | null;
  topic?: string | null;
  timeLimit?: number | null;
  questions?: RawStudentQuizQuestionDto[] | null;
}

interface RawStudentGeneratedQuizAttemptDto {
  attemptId?: string;
  quizId?: string;
  title?: string | null;
  topic?: string | null;
  questions?: RawStudentQuizQuestionDto[] | null;
  savedToHistory?: boolean;
}

interface RawQuestionReviewItemDto {
  questionId?: string;
  questionText?: string | null;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  studentAnswer?: string | null;
  correctAnswer?: string | null;
  isCorrect?: boolean;
  imageUrl?: string | null;
  caseId?: string | null;
}

interface RawQuizAttemptReviewDto {
  attemptId?: string;
  quizTitle?: string | null;
  score?: number | null;
  totalQuestions?: number;
  correctAnswers?: number;
  passed?: boolean;
  questions?: RawQuestionReviewItemDto[] | null;
}

interface RawQuizResultDto {
  attemptId?: string;
  quizId?: string;
  score?: number | null;
  passingScore?: number | null;
  passed?: boolean;
  totalQuestions?: number;
  correctAnswers?: number;
}

interface RawStudentQuizAttemptSummaryDto {
  attemptId?: string;
  quizId?: string;
  quizTitle?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  className?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  score?: number | null;
  passingScore?: number | null;
  passed?: boolean;
  totalQuestions?: number;
  correctAnswers?: number;
  isAiGenerated?: boolean;
}

interface RawStudentSubmitQuestionResponseDto {
  quizTitle?: string | null;
  questionText?: string | null;
  studentAnswer?: string | null;
  correctAnswer?: string | null;
  isCorrect?: boolean | null;
}

// --- Mapping helpers -------------------------------------------------------

const OPTION_LETTERS: ReadonlyArray<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

function buildOptions(
  dto: RawStudentQuizQuestionDto | RawQuestionReviewItemDto,
): QuestionOption[] {
  const entries: Array<{ id: string; label: string | null | undefined }> = [
    { id: 'A', label: dto.optionA },
    { id: 'B', label: dto.optionB },
    { id: 'C', label: dto.optionC },
    { id: 'D', label: dto.optionD },
  ];
  return entries
    .filter((o): o is { id: string; label: string } =>
      typeof o.label === 'string' && o.label.length > 0,
    )
    .map((o) => ({ id: o.id, label: o.label }));
}

function normalizeQuestionType(
  raw: string | null | undefined,
  hasImage: boolean,
): QuestionType {
  const value = (raw ?? '').toLowerCase();
  if (value.includes('multi')) {
    return 'multiple_choice';
  }
  if (value.includes('true') || value.includes('false')) {
    return 'true_false';
  }
  if (value.includes('image') || hasImage) {
    return 'image_choice';
  }
  return 'single_choice';
}

function parseAnswerIds(raw: string | null | undefined): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(/[,;|\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => OPTION_LETTERS.includes(s as 'A' | 'B' | 'C' | 'D'));
}

function mapQuestion(dto: RawStudentQuizQuestionDto): Question {
  const hasImage = typeof dto.imageUrl === 'string' && dto.imageUrl.length > 0;
  return {
    id: dto.questionId ?? '',
    type: normalizeQuestionType(dto.type, hasImage),
    prompt: dto.questionText ?? '',
    options: buildOptions(dto),
    imageUrl: dto.imageUrl ?? undefined,
    caseId: dto.caseId ?? undefined,
    caseTitle: dto.caseTitle ?? undefined,
  };
}

function mapQuizListItem(dto: RawQuizListItemDto): Quiz {
  const completed = dto.isCompleted === true;
  return {
    id: dto.quizId ?? '',
    title: dto.title ?? '',
    classId: dto.classId,
    className: dto.className ?? undefined,
    topic: dto.topic ?? undefined,
    difficulty: dto.difficulty ?? undefined,
    questionCount: dto.totalQuestions ?? 0,
    durationMinutes: dto.timeLimit ?? undefined,
    passingScore: dto.passingScore ?? undefined,
    dueDate: dto.closeTime ?? undefined,
    openTime: dto.openTime ?? undefined,
    status: completed ? 'completed' : 'assigned',
    score: dto.score ?? undefined,
    isAiGenerated: dto.isAiGenerated,
  };
}

function mapAttemptSummary(dto: RawStudentQuizAttemptSummaryDto): Attempt {
  const submittedAt = dto.completedAt ?? undefined;
  const hasScore = typeof dto.score === 'number';
  const status: Attempt['status'] = submittedAt
    ? hasScore
      ? 'graded'
      : 'submitted'
    : 'in_progress';
  return {
    id: dto.attemptId ?? '',
    quizId: dto.quizId ?? '',
    quizTitle: dto.quizTitle ?? undefined,
    startedAt: dto.startedAt ?? '',
    submittedAt,
    score: dto.score ?? undefined,
    totalQuestions: dto.totalQuestions,
    correctAnswers: dto.correctAnswers,
    passed: dto.passed,
    status,
    answers: [],
  };
}

function mapSession(dto: RawQuizSessionDto): StartQuizResult {
  const questions = (dto.questions ?? []).map(mapQuestion);
  return {
    id: dto.attemptId ?? '',
    quizId: dto.quizId ?? '',
    quizTitle: dto.title ?? undefined,
    startedAt: new Date().toISOString(),
    status: 'in_progress',
    answers: [],
    questions,
    durationMinutes: dto.timeLimit ?? undefined,
  };
}

function mapReviewQuestion(dto: RawQuestionReviewItemDto): ReviewQuestion {
  const hasImage = typeof dto.imageUrl === 'string' && dto.imageUrl.length > 0;
  const options = buildOptions(dto);
  const correct = parseAnswerIds(dto.correctAnswer);
  const selected = parseAnswerIds(dto.studentAnswer);
  return {
    id: dto.questionId ?? '',
    type: normalizeQuestionType(null, hasImage),
    prompt: dto.questionText ?? '',
    options,
    imageUrl: dto.imageUrl ?? undefined,
    caseId: dto.caseId ?? undefined,
    correctOptionIds: correct,
    selected,
    isCorrect: dto.isCorrect === true,
  };
}

function mapReview(
  dto: RawQuizAttemptReviewDto,
  fallbackQuizId?: string,
): ReviewResult {
  const questions = (dto.questions ?? []).map(mapReviewQuestion);
  return {
    id: dto.attemptId ?? '',
    quizId: fallbackQuizId ?? '',
    quizTitle: dto.quizTitle ?? undefined,
    startedAt: '',
    submittedAt: new Date().toISOString(),
    status: 'graded',
    score: dto.score ?? undefined,
    totalQuestions: dto.totalQuestions,
    correctAnswers: dto.correctAnswers,
    passed: dto.passed,
    answers: questions.map((q) => ({
      questionId: q.id,
      selectedOptionIds: q.selected,
    })),
    questions,
  };
}

function mapQuizResultDto(dto: RawQuizResultDto): ReviewResult {
  return {
    id: dto.attemptId ?? '',
    quizId: dto.quizId ?? '',
    startedAt: '',
    submittedAt: new Date().toISOString(),
    status: 'graded',
    score: dto.score ?? undefined,
    totalQuestions: dto.totalQuestions,
    correctAnswers: dto.correctAnswers,
    passed: dto.passed,
    answers: [],
    questions: [],
  };
}

function mapGeneratedAttempt(
  dto: RawStudentGeneratedQuizAttemptDto,
): GeneratedPracticeResult {
  return {
    attemptId: dto.attemptId ?? '',
    quizId: dto.quizId ?? '',
    title: dto.title ?? undefined,
    topic: dto.topic ?? undefined,
    questions: (dto.questions ?? []).map(mapQuestion),
  };
}

// --- Public API ------------------------------------------------------------

function isNotFound(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: unknown }).status;
    return status === 404;
  }
  return false;
}

export async function listQuizzes(params?: QuizListParams): Promise<Quiz[]> {
  try {
    const { data } = await api.get<RawQuizListItemDto[]>(
      '/api/student/quizzes',
      { params },
    );
    return Array.isArray(data) ? data.map(mapQuizListItem) : [];
  } catch (error: unknown) {
    if (isNotFound(error)) {
      return [];
    }
    throw error;
  }
}

export async function startQuiz(quizId: string): Promise<StartQuizResult> {
  const { data } = await api.post<RawQuizSessionDto>(
    `/api/student/quizzes/${quizId}/start`,
  );
  return mapSession(data);
}

export async function submitAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionIds: string[],
): Promise<void> {
  const studentAnswer = [...selectedOptionIds]
    .map((id) => id.toUpperCase())
    .sort()
    .join(',');
  await api.post<RawStudentSubmitQuestionResponseDto>(
    '/api/student/quizzes/answers',
    { attemptId, questionId, studentAnswer },
  );
}

export async function submitQuiz(
  attemptId: string,
  answers?: ReadonlyArray<{ questionId: string; selectedOptionIds: string[] }>,
): Promise<ReviewResult> {
  const body = {
    attemptId,
    answers: (answers ?? []).map((a) => ({
      questionId: a.questionId,
      studentAnswer: [...a.selectedOptionIds]
        .map((id) => id.toUpperCase())
        .sort()
        .join(','),
    })),
  };
  const { data } = await api.post<RawQuizResultDto>(
    '/api/student/quizzes/submit',
    body,
  );
  const base = mapQuizResultDto(data);
  // Follow-up with review fetch to get question breakdown
  try {
    const review = await getReview(base.id || attemptId);
    return { ...review, quizId: base.quizId || review.quizId };
  } catch {
    return base;
  }
}

export async function getHistory(): Promise<Attempt[]> {
  try {
    const { data } = await api.get<RawStudentQuizAttemptSummaryDto[]>(
      '/api/student/quizzes/history',
    );
    return Array.isArray(data) ? data.map(mapAttemptSummary) : [];
  } catch (error: unknown) {
    if (isNotFound(error)) {
      return [];
    }
    throw error;
  }
}

export async function getReview(attemptId: string): Promise<ReviewResult> {
  const { data } = await api.get<RawQuizAttemptReviewDto>(
    `/api/student/quizzes/${attemptId}/review`,
  );
  return mapReview(data);
}

export async function deleteAttempt(attemptId: string): Promise<void> {
  await api.delete(`/api/student/quizzes/${attemptId}`);
}

export async function requestRetake(quizId: string): Promise<void> {
  await api.post(`/api/student/quizzes/${quizId}/request-retake`);
}

export async function getPracticeList(): Promise<Quiz[]> {
  try {
    const { data } = await api.get<RawQuizSessionDto | RawQuizSessionDto[]>(
      '/api/student/quizzes/practice',
    );
    const sessions: RawQuizSessionDto[] = Array.isArray(data) ? data : [data];
    return sessions
      .filter((s) => s && typeof s === 'object')
      .map<Quiz>((s) => ({
        id: s.quizId ?? '',
        title: s.title ?? 'Practice quiz',
        topic: s.topic ?? undefined,
        questionCount: Array.isArray(s.questions) ? s.questions.length : 0,
        durationMinutes: s.timeLimit ?? undefined,
        status: 'practice',
      }));
  } catch (error: unknown) {
    if (isNotFound(error)) {
      return [];
    }
    throw error;
  }
}

export async function generatePractice(
  dto: PracticeGenerateDto,
): Promise<GeneratedPracticeResult> {
  const body = {
    topic: dto.topic,
    questionCount: dto.count,
    difficulty: dto.difficulty,
  };
  const { data } = await api.post<RawStudentGeneratedQuizAttemptDto>(
    '/api/student/quizzes/practice/generate',
    body,
  );
  return mapGeneratedAttempt(data);
}

export async function savePractice(dto: PracticeGenerateDto): Promise<void> {
  const body = {
    topic: dto.topic,
    questionCount: dto.count,
    difficulty: dto.difficulty,
  };
  await api.post('/api/student/quizzes/practice/save', body);
}
