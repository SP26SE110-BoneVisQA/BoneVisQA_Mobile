export interface ApiError {
  status: number;
  code?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
