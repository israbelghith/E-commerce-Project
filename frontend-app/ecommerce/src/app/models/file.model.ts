export interface UploadedFile {
  id: string;
  filename: string;
  name?: string; // For backend compatibility
  uploadDate: Date;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'processed' | 'error';
  logsCount: number;
  errorMessage?: string;
}

export interface UploadResponse {
  message: string;
  fileId: string;
  filename: string;
}
