export interface StudentProfile {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string | null;
  schoolCohort: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  lastLogin: string | null;
  roles: string[] | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  gender: string | null;
  studentSchoolId: string | null;
  classCode: string | null;
  address: string | null;
  bio: string | null;
  emergencyContact: string | null;
}

export interface UpdateStudentProfileDto {
  fullName: string | null;
  schoolCohort: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  gender: string | null;
  studentSchoolId: string | null;
  classCode: string | null;
  address: string | null;
  bio: string | null;
  emergencyContact: string | null;
}

export interface RequestMedicalVerificationDto {
  fullName: string;
  studentSchoolId: string;
  proofImageUri?: string;
}
