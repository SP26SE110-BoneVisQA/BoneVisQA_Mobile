export interface StudentClass {
  id: string;
  name: string;
  semester?: string;
  lecturerId?: string;
  lecturerName?: string;
  expertId?: string;
  expertName?: string;
  totalAnnouncements: number;
  totalQuizzes: number;
  totalCases: number;
  enrolledAt?: string;
}

export interface ClassQuizSummary {
  id: string;
  title: string;
  topic?: string;
  openTime?: string;
  closeTime?: string;
  totalQuestions: number;
  timeLimit?: number;
  passingScore?: number;
  isCompleted: boolean;
  score?: number;
}

export interface StudentCaseAssignment {
  caseId: string;
  title: string;
  dueDate?: string;
  isMandatory: boolean;
}

export interface ClassAnnouncement {
  id: string;
  title: string;
  content?: string;
  createdAt?: string;
  assignmentId?: string;
  assignmentTitle?: string;
}

export interface ClassStudent {
  id: string;
  name: string;
  code?: string;
}

export interface StudentClassDetail extends StudentClass {
  expertEmail?: string;
  expertAvatarUrl?: string;
  assignedCases: StudentCaseAssignment[];
  quizzes: ClassQuizSummary[];
  students: ClassStudent[];
  announcements: ClassAnnouncement[];
}
