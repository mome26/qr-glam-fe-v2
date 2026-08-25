export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalDenied?: number;
}
