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
  CasesTab: NavigatorScreenParams<CasesStackParamList> | undefined;
  VisualQaTab: NavigatorScreenParams<VisualQaStackParamList> | undefined;
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
};

export type VisualQaStackParamList = {
  VisualQaAsk: { caseId?: string };
  VisualQaChat: {
    caseId?: string;
    sessionId?: string;
    imageId?: string;
    imageUrl?: string;
    coordinates?: string;
  };
  VisualQaHistory: undefined;
  VisualQaThread: { sessionId: string };
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
  Classes: undefined;
  ClassDetail: { classId: string };
};
