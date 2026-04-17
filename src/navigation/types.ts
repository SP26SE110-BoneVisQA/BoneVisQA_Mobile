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
