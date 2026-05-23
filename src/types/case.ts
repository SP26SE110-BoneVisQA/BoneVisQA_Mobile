export type CaseDifficulty = 'easy' | 'medium' | 'hard';

export interface CaseImage {
  id: string;
  url: string;
  caption?: string;
  order?: number;
  modality?: string;
}

export interface Case {
  id: string;
  title: string;
  description?: string;
  bodyRegion?: string;
  modality?: string;
  difficulty?: CaseDifficulty;
  thumbnailUrl?: string;
  images: CaseImage[];
  tags?: string[];
  createdAt?: string;
  categoryName?: string;
  expertSummary?: string;
  keyFindings?: string;
  reflectiveQuestions?: string;
  isApproved?: boolean;
}

export type ShapeKind = 'rect' | 'point' | 'polygon';

export interface ShapePoint {
  x: number;
  y: number;
}

export interface Shape {
  kind: ShapeKind;
  points: ShapePoint[];
  label?: string;
}

export interface Annotation {
  id: string;
  caseId: string;
  imageId: string;
  shapes: Shape[];
  note?: string;
  createdAt?: string;
}

export interface QaQuestion {
  id: string;
  caseId?: string;
  question: string;
  answer?: string;
  createdAt?: string;
}

export type VisualQaRole = 'user' | 'assistant';

export interface VisualQaMessage {
  id: string;
  role: VisualQaRole;
  content: string;
  imageUri?: string;
  createdAt: string;
  isLoading?: boolean;
  isError?: boolean;
  references?: string[];
  turnId?: string;
  reviewState?: string;
}

export interface VisualQaCitation {
  label?: string;
  url?: string;
  snippet?: string;
}

export interface VisualQaCapabilities {
  canAskNext: boolean;
  isReadOnly: boolean;
  canRequestReview: boolean;
  turnsUsed: number;
  turnLimit: number;
}

export interface VisualQaTurn {
  sessionId: string;
  id?: string;
  question: string;
  answer: string;
  diagnosis?: string;
  findings: string[];
  differentialDiagnoses: string[];
  reflectiveQuestions: string[];
  citations: VisualQaCitation[];
  createdAt: string;
  reviewState?: string;
  lastResponderRole?: string;
  isReviewTarget: boolean;
}

export interface VisualQaAnswer {
  answer: string;
  references?: string[];
  sessionId?: string;
  diagnosis?: string;
  findings: string[];
  differentialDiagnoses: string[];
  reflectiveQuestions: string[];
  citations: VisualQaCitation[];
  capabilities?: VisualQaCapabilities;
  latestTurn?: VisualQaTurn;
  reviewState?: string;
}

export type VisualQaHistoryFilter = 'all' | 'cases' | 'personal';

export interface VisualQaHistoryItem {
  sessionId: string;
  caseId?: string;
  status?: string;
  updatedAt?: string;
  imageUrl?: string;
  questionSnippet?: string;
  reviewState?: string;
  lastResponderRole?: string;
  rejectionReason?: string;
}

export interface VisualQaHistoryResult {
  totalCount: number;
  items: VisualQaHistoryItem[];
}

export interface VisualQaThread {
  sessionId: string;
  imageUrl?: string;
  caseId?: string;
  turns: VisualQaTurn[];
  capabilities?: VisualQaCapabilities;
  reviewState?: string;
  lastResponderRole?: string;
  blockingNotice?: string;
  rejectionReason?: string;
}

export interface CaseCatalogParams {
  page?: number;
  pageSize?: number;
  region?: string;
  modality?: string;
  difficulty?: CaseDifficulty | string;
}

export interface CaseFilterParams {
  categoryId?: string;
  region?: string;
  modality?: string;
  difficulty?: CaseDifficulty | string;
}
