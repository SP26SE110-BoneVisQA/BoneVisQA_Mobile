import { api } from './client';
import type {
  RequestMedicalVerificationDto,
  StudentProfile,
  UpdateStudentProfileDto,
} from '../types/user';

export async function getMe(): Promise<StudentProfile> {
  const { data } = await api.get<StudentProfile>('/api/users/me');
  return data;
}

export async function updateMe(
  dto: UpdateStudentProfileDto,
): Promise<StudentProfile> {
  const { data } = await api.put<StudentProfile>('/api/users/me', dto);
  return data;
}

function buildImageFormPart(
  uri: string,
  fieldName: string,
): { uri: string; name: string; type: string } {
  const ext = (() => {
    const match = /\.(\w+)$/.exec(uri);
    if (!match) {
      return 'jpg';
    }
    return match[1].toLowerCase();
  })();
  const mime =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const name = `${fieldName}.${ext === 'jpeg' ? 'jpg' : ext}`;
  return { uri, name, type: mime };
}

export async function uploadAvatar(
  uri: string,
): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  const filePart = buildImageFormPart(uri, 'avatar');
  // React Native FormData accepts { uri, name, type } as a file part.
  formData.append('file', filePart as unknown as Blob);
  const { data } = await api.post<{ avatarUrl: string }>(
    '/api/users/me/avatar',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data;
}

export async function requestMedicalVerification(
  dto: RequestMedicalVerificationDto,
): Promise<void> {
  if (dto.proofImageUri) {
    const formData = new FormData();
    formData.append('fullName', dto.fullName);
    formData.append('studentSchoolId', dto.studentSchoolId);
    const filePart = buildImageFormPart(dto.proofImageUri, 'proof');
    formData.append('file', filePart as unknown as Blob);
    await api.post('/api/Auths/request-medical-verification', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return;
  }
  await api.post('/api/Auths/request-medical-verification', {
    fullName: dto.fullName,
    studentSchoolId: dto.studentSchoolId,
  });
}
