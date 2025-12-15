export interface UploadedFile {
  id: string;
  filename: string;
  uploadDate: Date;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  logsCount: number;
  errorMessage?: string;
}

export interface UploadResponse {
  message: string;
  fileId: string;
  filename: string;
}
