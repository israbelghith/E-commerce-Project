export interface Log {
  id: string;
  timestamp: Date;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  service: string;
  message: string;
  user_id?: string;
  transaction_id?: string;
  amount?: number;
  payment_method?: string;
  error_code?: string;
  details?: any;
}

export interface SearchParams {
  query?: string;
  level?: string;
  service?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  size?: number;
}

export interface SearchResult {
  results: Log[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
