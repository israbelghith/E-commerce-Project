export interface Stats {
  totalLogs: number;
  logsToday: number;
  errorCount: number;
  filesUploaded: number;
  transactionsPerHour: ChartData[];
  errorsByType: ChartData[];
  conversionRate: number;
  averageTransactionAmount: number;
}

export interface ChartData {
  label: string;
  value: number;
}
