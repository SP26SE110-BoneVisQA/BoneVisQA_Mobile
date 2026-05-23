export interface AnalyticsDashboard {
  title?: string;
  completionRate?: number;
  accuracyRate?: number;
  streakDays?: number;
  focusMessage?: string;
}

export interface StudentCompetency {
  id: string;
  name: string;
  score?: number;
  level?: string;
  trend?: string;
}

export interface StudentErrorPattern {
  id: string;
  title: string;
  description?: string;
  occurrences?: number;
  resolved: boolean;
}

export interface StudentInsight {
  id: string;
  title: string;
  description?: string;
  actionLabel?: string;
  isRead: boolean;
  isActioned: boolean;
}
