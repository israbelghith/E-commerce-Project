import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { UploadedFile } from '../../models/file.model';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './files.html',
  styleUrl: './files.scss'
})
export class Files implements OnInit {
  private apiService = inject(ApiService);
  private platformId = inject(PLATFORM_ID);

  files = signal<UploadedFile[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  sortColumn = signal<keyof UploadedFile>('uploadDate');
  sortDirection = signal<'asc' | 'desc'>('desc');

  ngOnInit() {
    // Only make API calls in the browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      this.loadFiles();
    } else {
      this.loading.set(false);
    }
  }

  loadFiles() {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getFiles().subscribe({
      next: (data) => {
        this.files.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load files');
        this.loading.set(false);
        console.error('Error loading files:', err);
      }
    });
  }

  sortBy(column: keyof UploadedFile) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }

    const sorted = [...this.files()].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      
      if (aVal === undefined || bVal === undefined) return 0;
      
      const direction = this.sortDirection() === 'asc' ? 1 : -1;
      
      if (aVal < bVal) return -1 * direction;
      if (aVal > bVal) return 1 * direction;
      return 0;
    });

    this.files.set(sorted);
  }

  getStatusClass(status: string): string {
    // Treat 'processed' as 'completed' for UI
    if (status === 'processed') status = 'completed';
    const classes: Record<string, string> = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'completed': 'status-completed',
      'error': 'status-error'
    };
    return classes[status] || 'status-pending';
  }

  getStatusIcon(status: string): string {
    // Treat 'processed' as 'completed' for UI
    if (status === 'processed') status = 'completed';
    const icons: Record<string, string> = {
      'pending': '⏳',
      'processing': '⚙️',
      'completed': '✅',
      'error': '❌'
    };
    return icons[status] || '⏳';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  refresh() {
    this.loadFiles();
  }

  getCompletedCount(): number {
    // Treat 'processed' as 'completed'
    return this.files().filter(f => f.status === 'completed' || f.status === 'processed').length;
  }

  getProcessingCount(): number {
    return this.files().filter(f => f.status === 'processing').length;
  }

  getErrorCount(): number {
    return this.files().filter(f => f.status === 'error').length;
  }
}
