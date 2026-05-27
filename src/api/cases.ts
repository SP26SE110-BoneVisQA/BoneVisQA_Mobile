import { api, handleApiError } from './client';
import type {
  Annotation,
  Case,
  CaseCatalogParams,
  CaseFilterParams,
  CaseImage,
} from '../types/case';
import { API_BASE_URL } from '../constants/env';

interface CaseListItemDto {
  id: string;
  title?: string | null;
  description?: string | null;
  difficulty?: string | null;
  categoryName?: string | null;
  thumbnailUrl?: string | null;
  createdAt?: string | null;
  isApproved?: boolean;
  tags?: string[] | null;
}

interface MedicalImageDto {
  id: string;
  imageUrl?: string | null;
  modality?: string | null;
}

interface CaseDetailDto {
  id: string;
  title?: string | null;
  description?: string | null;
  difficulty?: string | null;
  categoryName?: string | null;
  expertSummary?: string | null;
  keyFindings?: string | null;
  reflectiveQuestions?: string | null;
  primaryImageUrl?: string | null;
  isApproved?: boolean;
  images?: MedicalImageDto[] | null;
}

interface StudentCaseHistoryItemDto {
  caseId: string;
  caseTitle?: string | null;
  categoryName?: string | null;
  difficulty?: string | null;
  lastInteractedAt: string;
  interactionType?: string | null;
  latestQuestionText?: string | null;
  latestAnswerStatus?: string | null;
  reviewedAt?: string | null;
}

interface AnnotationDto {
  id: string;
  imageId: string;
  label?: string | null;
  coordinates?: string | null;
  createdAt?: string | null;
}

function normalizeDifficulty(
  value?: string | null,
): Case['difficulty'] | undefined {
  if (!value) {
    return undefined;
  }
  const lower = value.toLowerCase();
  if (lower === 'easy' || lower === 'medium' || lower === 'hard') {
    return lower;
  }
  return undefined;
}

function resolveImageUrl(value?: string | null): string | undefined {
  const raw = value?.trim();
  if (!raw) {
    return undefined;
  }
  const normalized = raw.replace(/\\/g, '/');
  if (/^(https?:|file:|data:|blob:)/i.test(normalized)) {
    return normalized;
  }
  if (normalized.startsWith('//')) {
    return `https:${normalized}`;
  }
  return `${API_BASE_URL.replace(/\/+$/, '')}/${normalized.replace(/^\/+/, '')}`;
}

function mapListItemToCase(dto: CaseListItemDto): Case {
  return {
    id: dto.id,
    title: dto.title ?? 'Untitled',
    description: dto.description ?? undefined,
    bodyRegion: dto.categoryName ?? undefined,
    categoryName: dto.categoryName ?? undefined,
    difficulty: normalizeDifficulty(dto.difficulty),
    thumbnailUrl: resolveImageUrl(dto.thumbnailUrl),
    images: [],
    tags: dto.tags ?? undefined,
    isApproved: dto.isApproved,
    createdAt: dto.createdAt ?? undefined,
  };
}

function mapImageToCaseImage(dto: MedicalImageDto, index: number): CaseImage {
  return {
    id: dto.id,
    url: resolveImageUrl(dto.imageUrl) ?? '',
    order: index,
    modality: dto.modality ?? undefined,
  };
}

function mapDetailToCase(dto: CaseDetailDto): Case {
  const images = (dto.images ?? [])
    .map(mapImageToCaseImage)
    .filter((image) => image.url.length > 0);
  const primaryImage = resolveImageUrl(dto.primaryImageUrl) ?? images[0]?.url;
  const displayImages =
    images.length > 0 || !primaryImage
      ? images
      : [
          {
            id: `${dto.id}-primary`,
            url: primaryImage,
            order: 0,
          },
        ];
  const firstModality = images.find((img) => img.modality)?.modality;
  return {
    id: dto.id,
    title: dto.title ?? 'Untitled',
    description: dto.description ?? undefined,
    bodyRegion: dto.categoryName ?? undefined,
    categoryName: dto.categoryName ?? undefined,
    modality: firstModality,
    difficulty: normalizeDifficulty(dto.difficulty),
    thumbnailUrl: primaryImage,
    images: displayImages,
    expertSummary: dto.expertSummary ?? undefined,
    keyFindings: dto.keyFindings ?? undefined,
    reflectiveQuestions: dto.reflectiveQuestions ?? undefined,
    isApproved: dto.isApproved,
  };
}

function mapHistoryItemToCase(dto: StudentCaseHistoryItemDto): Case {
  return {
    id: dto.caseId,
    title: dto.caseTitle ?? 'Untitled',
    description: dto.latestQuestionText ?? undefined,
    bodyRegion: dto.categoryName ?? undefined,
    categoryName: dto.categoryName ?? undefined,
    difficulty: normalizeDifficulty(dto.difficulty),
    images: [],
    createdAt: dto.lastInteractedAt,
  };
}

function mapAnnotationDto(dto: AnnotationDto, caseId: string): Annotation {
  return {
    id: dto.id,
    caseId,
    imageId: dto.imageId,
    shapes: [],
    note: dto.label ?? undefined,
    createdAt: dto.createdAt ?? undefined,
  };
}

export async function getCatalog(
  params?: CaseCatalogParams,
): Promise<Case[]> {
  try {
    const { data } = await api.get<CaseListItemDto[]>(
      '/api/student/cases/catalog',
      {
        params: {
          location: params?.region,
          lesionType: params?.modality,
          difficulty: params?.difficulty,
        },
      },
    );
    return data.map(mapListItemToCase);
  } catch (error) {
    throw await handleApiError(error);
  }
}

export async function filterCases(params: CaseFilterParams): Promise<Case[]> {
  try {
    const { data } = await api.get<CaseListItemDto[]>(
      '/api/student/cases/filter',
      {
        params: {
          CategoryId: params.categoryId,
          Difficulty: params.difficulty,
          Location: params.region,
          LessonType: params.modality,
        },
      },
    );
    return data.map(mapListItemToCase);
  } catch (error) {
    throw await handleApiError(error);
  }
}

export async function getCase(caseId: string): Promise<Case> {
  try {
    const { data } = await api.get<CaseDetailDto>(
      `/api/student/cases/${caseId}`,
    );
    return mapDetailToCase(data);
  } catch (error) {
    throw await handleApiError(error);
  }
}

export async function getCaseHistory(): Promise<Case[]> {
  try {
    const { data } = await api.get<StudentCaseHistoryItemDto[]>(
      '/api/student/cases/history',
    );
    return data.map(mapHistoryItemToCase);
  } catch (error) {
    throw await handleApiError(error);
  }
}

export interface SaveAnnotationInput {
  caseId: string;
  imageId: string;
  shapes: Annotation['shapes'];
  note?: string;
}

export async function saveAnnotation(
  dto: SaveAnnotationInput,
): Promise<Annotation> {
  try {
    const firstShape = dto.shapes[0];
    const payload = {
      imageId: dto.imageId,
      label: dto.note,
      customPolygon: firstShape?.points ?? [],
      coordinates: firstShape ? JSON.stringify(firstShape) : undefined,
    };
    const { data } = await api.post<AnnotationDto>(
      '/api/student/cases/annotations',
      payload,
    );
    return mapAnnotationDto(data, dto.caseId);
  } catch (error) {
    throw await handleApiError(error);
  }
}
