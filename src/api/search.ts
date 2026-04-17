import { api } from './client';
import type { SearchResult } from '../types/notification';

interface GlobalSearchCaseItemDto {
  id: string;
  title?: string | null;
}

interface GlobalSearchQuizItemDto {
  id: string;
  title?: string | null;
  topic?: string | null;
}

interface GlobalSearchDocumentItemDto {
  id: string;
  title?: string | null;
  indexingStatus?: string | null;
}

interface GlobalSearchResponseDto {
  cases?: GlobalSearchCaseItemDto[] | null;
  quizzes?: GlobalSearchQuizItemDto[] | null;
  documents?: GlobalSearchDocumentItemDto[] | null;
}

function flatten(response: GlobalSearchResponseDto): SearchResult[] {
  const out: SearchResult[] = [];
  for (const c of response.cases ?? []) {
    out.push({
      id: c.id,
      type: 'case',
      title: c.title ?? 'Ca lâm sàng',
    });
  }
  for (const q of response.quizzes ?? []) {
    out.push({
      id: q.id,
      type: 'quiz',
      title: q.title ?? 'Quiz',
      snippet: q.topic ?? undefined,
    });
  }
  for (const d of response.documents ?? []) {
    out.push({
      id: d.id,
      type: 'document',
      title: d.title ?? 'Tài liệu',
      snippet: d.indexingStatus ?? undefined,
    });
  }
  return out;
}

export async function search(q: string): Promise<SearchResult[]> {
  const trimmed = q.trim();
  if (trimmed.length === 0) {
    return [];
  }
  const { data } = await api.get<GlobalSearchResponseDto>('/api/search', {
    params: { q: trimmed },
  });
  if (!data || typeof data !== 'object') {
    return [];
  }
  return flatten(data);
}
