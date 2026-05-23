import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AppTabParamList = {
  HomeTab: undefined;
  QuizTab: undefined;
  AssignmentsTab: NavigatorScreenParams<AssignmentsStackParamList> | undefined;
  CasesTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Search: undefined;
  Announcements: undefined;
};

export type QuizStackParamList = {
  QuizList: undefined;
  QuizPlay: { quizId: string; attemptId?: string };
  QuizReview: { attemptId: string };
  QuizHistory: undefined;
  PracticeMode: undefined;
  Progress: undefined;
  Analytics: undefined;
};

export type CasesStackParamList = {
  CaseList: undefined;
  CaseDetail: { caseId: string };
  CaseHistory: undefined;
  VisualQaAsk: { caseId?: string };
  VisualQaChat: { caseId?: string };
};

export type AssignmentsStackParamList = {
  AssignmentList: undefined;
  AssignmentDetail: { assignmentId: string };
};

export type NotificationsStackParamList = {
  Notifications: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  MedicalVerification: undefined;
};
