import { api, handleApiError } from './client';
import type {
  VisualQaAnswer,
  VisualQaCapabilities,
  VisualQaCitation,
  VisualQaHistoryFilter,
  VisualQaHistoryItem,
  VisualQaHistoryResult,
  VisualQaThread,
  VisualQaTurn,
} from '../types/case';

interface CitationDto {
  referenceUrl?: string | null;
  href?: string | null;
  sourceText?: string | null;
  snippet?: string | null;
  displayLabel?: string | null;
  pageLabel?: string | null;
}

interface CapabilitiesDto {
  canAskNext?: boolean;
  isReadOnly?: boolean;
  canRequestReview?: boolean;
  turnsUsed?: number;
  turnLimit?: number;
}

interface TurnDto {
  sessionId?: string | null;
  turnId?: string | null;
  userMessage?: string | null;
  questionText?: string | null;
  messageText?: string | null;
  answerText?: string | null;
  diagnosis?: string | null;
  findings?: string[] | null;
  differentialDiagnoses?: string[] | null;
  reflectiveQuestions?: string[] | null;
  citations?: CitationDto[] | null;
  createdAt?: string | null;
  reviewState?: string | null;
  lastResponderRole?: string | null;
  isReviewTarget?: boolean;
}

interface VisualQaResponseDto {
  sessionId?: string | null;
  diagnosis?: string | null;
  findings?: string[] | null;
  differentialDiagnoses?: string[] | null;
  reflectiveQuestions?: string[] | null;
  citations?: CitationDto[] | null;
  capabilities?: CapabilitiesDto | null;
  latestTurn?: TurnDto | null;
  reviewState?: string | null;
  systemNotice?: string | null;
}

interface HistoryItemDto {
  sessionId?: string | null;
  caseId?: string | null;
  status?: string | null;
  updatedAt?: string | null;
  imageUrl?: string | null;
  questionSnippet?: string | null;
  reviewState?: string | null;
  lastResponderRole?: string | null;
  rejectionReason?: string | null;
}

interface HistoryDto {
  totalCount?: number;
  items?: HistoryItemDto[] | null;
}

interface ThreadDto {
  sessionId?: string | null;
  sessionImageUrl?: string | null;
  imageUrl?: string | null;
  studyImageUrl?: string | null;
  caseId?: string | null;
  turns?: TurnDto[] | null;
  capabilities?: CapabilitiesDto | null;
  reviewState?: string | null;
  lastResponderRole?: string | null;
  blockingNotice?: string | null;
  rejectionReason?: string | null;
}

export interface AskJsonInput {
  caseId?: string;
  question: string;
  imageUrl?: string;
  language?: string;
  sessionId?: string;
}

export interface AskMultipartInput {
  question: string;
  imageUri: string;
  language?: string;
  sessionId?: string;
}

function strings(value: string[] | null | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
}

function mapCitations(value: CitationDto[] | null | undefined): VisualQaCitation[] {
  return Array.isArray(value)
    ? value.map((citation) => ({
        label: citation.displayLabel ?? citation.pageLabel ?? undefined,
        url: citation.href ?? citation.referenceUrl ?? undefined,
        snippet: citation.snippet ?? citation.sourceText ?? undefined,
      }))
    : [];
}

function mapCapabilities(dto?: CapabilitiesDto | null): VisualQaCapabilities | undefined {
  if (!dto) {
    return undefined;
  }
  return {
    canAskNext: dto.canAskNext ?? false,
    isReadOnly: dto.isReadOnly ?? false,
    canRequestReview: dto.canRequestReview ?? false,
    turnsUsed: dto.turnsUsed ?? 0,
    turnLimit: dto.turnLimit ?? 0,
  };
}

function buildStructuredAnswer(
  diagnosis?: string | null,
  findings?: string[] | null,
  differentials?: string[] | null,
  questions?: string[] | null,
  notice?: string | null,
): string {
  const parts: string[] = [];
  if (notice) {
    parts.push(notice);
  }
  if (diagnosis) {
    parts.push(`**Chan doan:** ${diagnosis}`);
  }
  if (strings(findings).length > 0) {
    parts.push(`**Phat hien:**\n${strings(findings).map((item) => `- ${item}`).join('\n')}`);
  }
  if (strings(differentials).length > 0) {
    parts.push(
      `**Chan doan phan biet:**\n${strings(differentials)
        .map((item) => `- ${item}`)
        .join('\n')}`,
    );
  }
  if (strings(questions).length > 0) {
    parts.push(
      `**Cau hoi tu phan hoi:**\n${strings(questions)
        .map((item) => `- ${item}`)
        .join('\n')}`,
    );
  }
  return parts.join('\n\n') || 'Khong nhan duoc phan hoi tu AI.';
}

function mapTurn(dto: TurnDto, fallbackSessionId: string): VisualQaTurn {
  return {
    sessionId: dto.sessionId ?? fallbackSessionId,
    id: dto.turnId ?? undefined,
    question: dto.userMessage ?? dto.questionText ?? dto.messageText ?? '',
    answer:
      dto.answerText ??
      buildStructuredAnswer(
        dto.diagnosis,
        dto.findings,
        dto.differentialDiagnoses,
        dto.reflectiveQuestions,
      ),
    diagnosis: dto.diagnosis ?? undefined,
    findings: strings(dto.findings),
    differentialDiagnoses: strings(dto.differentialDiagnoses),
    reflectiveQuestions: strings(dto.reflectiveQuestions),
    citations: mapCitations(dto.citations),
    createdAt: dto.createdAt ?? new Date().toISOString(),
    reviewState: dto.reviewState ?? undefined,
    lastResponderRole: dto.lastResponderRole ?? undefined,
    isReviewTarget: dto.isReviewTarget ?? false,
  };
}

function mapAnswer(dto: VisualQaResponseDto): VisualQaAnswer {
  const citations = mapCitations(dto.citations);
  const answer =
    dto.latestTurn?.answerText ??
    buildStructuredAnswer(
      dto.diagnosis,
      dto.findings,
      dto.differentialDiagnoses,
      dto.reflectiveQuestions,
      dto.systemNotice,
    );
  return {
    answer,
    references: citations
      .map((citation) => citation.url ?? citation.label ?? citation.snippet ?? '')
      .filter((value) => value.length > 0),
    sessionId: dto.sessionId ?? undefined,
    diagnosis: dto.diagnosis ?? undefined,
    findings: strings(dto.findings),
    differentialDiagnoses: strings(dto.differentialDiagnoses),
    reflectiveQuestions: strings(dto.reflectiveQuestions),
    citations,
    capabilities: mapCapabilities(dto.capabilities),
    latestTurn:
      dto.latestTurn && dto.sessionId
        ? mapTurn(dto.latestTurn, dto.sessionId)
        : undefined,
    reviewState: dto.reviewState ?? undefined,
  };
}

export async function askJson(dto: AskJsonInput): Promise<VisualQaAnswer> {
  try {
    const { data } = await api.post<VisualQaResponseDto>(
      '/api/student/visual-qa/ask-json',
      {
        questionText: dto.question,
        caseId: dto.caseId,
        imageUrl: dto.imageUrl,
        language: dto.language ?? 'vi',
        sessionId: dto.sessionId,
      },
    );
    return mapAnswer(data ?? {});
  } catch (error) {
    throw await handleApiError(error);
  }
}

function buildFilePart(imageUri: string): { uri: string; name: string; type: string } {
  const fileName = imageUri.split('/').pop() ?? 'upload.jpg';
  const ext = fileName.match(/\.(\w+)$/)?.[1]?.toLowerCase();
  const type =
    ext === 'png'
      ? 'image/png'
      : ext === 'heic'
        ? 'image/heic'
        : ext === 'webp'
          ? 'image/webp'
          : 'image/jpeg';
  return { uri: imageUri, name: fileName, type };
}

export async function askMultipart(params: AskMultipartInput): Promise<VisualQaAnswer> {
  try {
    const form = new FormData();
    form.append('QuestionText', params.question);
    form.append('language', params.language ?? 'vi');
    if (params.sessionId) {
      form.append('sessionId', params.sessionId);
    }
    form.append('CustomImage', buildFilePart(params.imageUri) as unknown as Blob);
    const { data } = await api.post<VisualQaResponseDto>(
      '/api/student/visual-qa/ask',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return mapAnswer(data ?? {});
  } catch (error) {
    throw await handleApiError(error);
  }
}

export async function getVisualQaHistory(
  filter: VisualQaHistoryFilter,
): Promise<VisualQaHistoryResult> {
  const suffix = filter === 'all' ? '' : `/${filter}`;
  const { data } = await api.get<HistoryDto>(`/api/student/visual-qa/history${suffix}`, {
    params: { limit: 40, offset: 0 },
  });
  const items: VisualQaHistoryItem[] = Array.isArray(data?.items)
    ? data.items
        .filter((item): item is HistoryItemDto & { sessionId: string } => Boolean(item.sessionId))
        .map((item) => ({
          sessionId: item.sessionId,
          caseId: item.caseId ?? undefined,
          status: item.status ?? undefined,
          updatedAt: item.updatedAt ?? undefined,
          imageUrl: item.imageUrl ?? undefined,
          questionSnippet: item.questionSnippet ?? undefined,
          reviewState: item.reviewState ?? undefined,
          lastResponderRole: item.lastResponderRole ?? undefined,
          rejectionReason: item.rejectionReason ?? undefined,
        }))
    : [];
  return { totalCount: data?.totalCount ?? items.length, items };
}

export async function getVisualQaThread(sessionId: string): Promise<VisualQaThread> {
  const { data } = await api.get<ThreadDto>(`/api/student/visual-qa/history/${sessionId}`);
  return {
    sessionId: data?.sessionId ?? sessionId,
    imageUrl: data?.sessionImageUrl ?? data?.imageUrl ?? data?.studyImageUrl ?? undefined,
    caseId: data?.caseId ?? undefined,
    turns: Array.isArray(data?.turns)
      ? data.turns.map((turn) => mapTurn(turn, data?.sessionId ?? sessionId))
      : [],
    capabilities: mapCapabilities(data?.capabilities),
    reviewState: data?.reviewState ?? undefined,
    lastResponderRole: data?.lastResponderRole ?? undefined,
    blockingNotice: data?.blockingNotice ?? undefined,
    rejectionReason: data?.rejectionReason ?? undefined,
  };
}

export async function requestVisualQaReview(turnId: string, sessionId: string): Promise<void> {
  await api.post(`/api/student/visual-qa/turns/${turnId}/request-review`, undefined, {
    params: { sessionId },
  });
}
