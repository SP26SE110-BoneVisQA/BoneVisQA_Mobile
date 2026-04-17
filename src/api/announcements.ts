import { api } from './client';
import type { Announcement } from '../types/notification';

interface StudentAnnouncementDto {
  id: string;
  classId?: string | null;
  className?: string | null;
  title?: string | null;
  content?: string | null;
  createdAt?: string | null;
  authorName?: string | null;
}

function mapAnnouncement(dto: StudentAnnouncementDto): Announcement {
  return {
    id: dto.id,
    title: dto.title ?? '',
    content: dto.content ?? '',
    authorName: dto.authorName ?? undefined,
    classId: dto.classId ?? undefined,
    className: dto.className ?? undefined,
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const { data } = await api.get<StudentAnnouncementDto[]>(
    '/api/student/announcements',
  );
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map(mapAnnouncement);
}
