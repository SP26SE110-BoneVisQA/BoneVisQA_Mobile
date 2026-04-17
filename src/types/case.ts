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
}

export interface VisualQaAnswer {
  answer: string;
  references?: string[];
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
