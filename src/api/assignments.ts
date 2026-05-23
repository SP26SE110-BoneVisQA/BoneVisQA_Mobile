import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Assignment } from '../types/quiz';

const LOCAL_SUBMISSION_PREFIX = 'BONEVISQA_ASSIGNMENT_SUBMISSION_';

const DEMO_ASSIGNMENTS: Assignment[] = [
  {
    id: 'demo-assignment-chest-xray',
    title: 'Bao cao quan sat X-quang nguc',
    type: 'Tu luan',
    description: 'Luyen tap mo ta phim X-quang theo cau truc.',
    instructions:
      'Neu chat luong hinh anh, dau hieu quan trong va mot chan doan phan biet.',
    dueDate: '2026-06-01T16:00:00.000Z',
    status: 'pending',
  },
  {
    id: 'demo-assignment-fracture',
    title: 'Nhan dinh xu tri gay xuong',
    type: 'Tu luan',
    description: 'Trinh bay danh gia ban dau doi voi chan thuong chi.',
    instructions:
      'Tom tat dau hieu hinh anh va de xuat buoc lam sang tiep theo.',
    dueDate: '2026-06-05T16:00:00.000Z',
    status: 'pending',
  },
];

function localSubmissionKey(assignmentId: string): string {
  return `${LOCAL_SUBMISSION_PREFIX}${assignmentId}`;
}

function enrichDetail(assignment: Assignment): Assignment {
  return {
    ...assignment,
    description:
      assignment.description ??
      'Bai tap dang o che do demo trong khi backend hoan thien noi dung chi tiet.',
    instructions:
      assignment.instructions ??
      'Viet cau tra loi ngan gon dua tren quan sat ca va lap luan lam sang.',
  };
}

async function withLocalSubmission(assignment: Assignment): Promise<Assignment> {
  const raw = await AsyncStorage.getItem(localSubmissionKey(assignment.id));
  if (!raw) {
    return assignment;
  }
  try {
    const saved = JSON.parse(raw) as { answerText?: string; submittedAt?: string };
    if (!saved.answerText || !saved.submittedAt) {
      return assignment;
    }
    return {
      ...assignment,
      answerText: saved.answerText,
      submittedAt: saved.submittedAt,
      status: 'submitted',
    };
  } catch {
    return assignment;
  }
}

export async function listAssignments(): Promise<Assignment[]> {
  return Promise.all(DEMO_ASSIGNMENTS.map(withLocalSubmission));
}

export async function getAssignment(assignmentId: string): Promise<Assignment> {
  const assignments = await listAssignments();
  const match = assignments.find((assignment) => assignment.id === assignmentId);
  const fallback =
    DEMO_ASSIGNMENTS.find((assignment) => assignment.id === assignmentId) ?? {
      id: assignmentId,
      title: 'Assignment',
      type: 'Tu luan',
      status: 'pending' as const,
    };
  return enrichDetail(await withLocalSubmission(match ?? fallback));
}

export async function submitAssignment(
  assignmentId: string,
  answerText: string,
): Promise<Assignment> {
  const assignment = await getAssignment(assignmentId);
  const submittedAt = new Date().toISOString();
  await AsyncStorage.setItem(
    localSubmissionKey(assignmentId),
    JSON.stringify({ answerText, submittedAt }),
  );
  return {
    ...assignment,
    answerText,
    submittedAt,
    status: 'submitted',
  };
}
