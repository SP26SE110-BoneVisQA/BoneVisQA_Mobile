import { api, handleApiError } from './client';
import type { VisualQaAnswer } from '../types/case';

interface VisualQaResponseDto {
  answerText?: string | null;
  suggestedDiagnosis?: string | null;
  differentialDiagnoses?: string | null;
  keyImagingFindings?: string | null;
  reflectiveQuestions?: string | null;
  aiConfidenceScore?: number | null;
  errorMessage?: string | null;
  citations?: Array<{
    chunkId?: string;
    referenceUrl?: string | null;
    pageNumber?: number | null;
    sourceText?: string | null;
  }> | null;
}

export interface AskJsonInput {
  caseId?: string;
  question: string;
  imageBase64?: string;
  imageUrl?: string;
  language?: string;
}

export interface AskMultipartInput {
  caseId?: string;
  question: string;
  imageUri: string;
}

function buildAnswerText(dto: VisualQaResponseDto): string {
  if (dto.errorMessage && dto.errorMessage.length > 0) {
    return dto.errorMessage;
  }
  const parts: string[] = [];
  if (dto.answerText) {
    parts.push(dto.answerText);
  }
  if (dto.suggestedDiagnosis) {
    parts.push(`\n\n**Chẩn đoán đề xuất:** ${dto.suggestedDiagnosis}`);
  }
  if (dto.differentialDiagnoses) {
    parts.push(`\n\n**Chẩn đoán phân biệt:** ${dto.differentialDiagnoses}`);
  }
  if (dto.keyImagingFindings) {
    parts.push(`\n\n**Dấu hiệu hình ảnh chính:** ${dto.keyImagingFindings}`);
  }
  if (dto.reflectiveQuestions) {
    parts.push(`\n\n**Câu hỏi phản biện:** ${dto.reflectiveQuestions}`);
  }
  if (parts.length === 0) {
    return 'Không nhận được phản hồi từ AI.';
  }
  return parts.join('');
}

function buildReferences(dto: VisualQaResponseDto): string[] | undefined {
  if (!dto.citations || dto.citations.length === 0) {
    return undefined;
  }
  return dto.citations
    .map((c) => c.referenceUrl ?? c.sourceText ?? '')
    .filter((v): v is string => v.length > 0);
}

export async function askJson(dto: AskJsonInput): Promise<VisualQaAnswer> {
  try {
    const payload = {
      questionText: dto.question,
      caseId: dto.caseId,
      imageUrl: dto.imageUrl,
      language: dto.language ?? 'vi',
    };
    const { data } = await api.post<VisualQaResponseDto>(
      '/api/student/visual-qa/ask-json',
      payload,
    );
    return {
      answer: buildAnswerText(data),
      references: buildReferences(data),
    };
  } catch (error) {
    throw await handleApiError(error);
  }
}

interface MultipartFile {
  uri: string;
  name: string;
  type: string;
}

function buildFilePart(imageUri: string): MultipartFile {
  const fileName = imageUri.split('/').pop() ?? 'upload.jpg';
  const extMatch = fileName.match(/\.(\w+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
  const mimeType =
    ext === 'png'
      ? 'image/png'
      : ext === 'heic'
        ? 'image/heic'
        : ext === 'webp'
          ? 'image/webp'
          : 'image/jpeg';
  return { uri: imageUri, name: fileName, type: mimeType };
}

export async function askMultipart(
  params: AskMultipartInput,
): Promise<VisualQaAnswer> {
  try {
    const form = new FormData();
    form.append('QuestionText', params.question);
    if (params.caseId) {
      form.append('CaseId', params.caseId);
    }
    const file = buildFilePart(params.imageUri);
    // React Native FormData accepts this object shape for files.
    form.append('CustomImage', file as unknown as Blob);
    const { data } = await api.post<VisualQaResponseDto>(
      '/api/student/visual-qa/ask',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return {
      answer: buildAnswerText(data),
      references: buildReferences(data),
    };
  } catch (error) {
    throw await handleApiError(error);
  }
}
