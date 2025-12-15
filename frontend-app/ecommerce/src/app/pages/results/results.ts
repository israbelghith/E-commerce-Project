import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Log, SearchParams, SearchResult } from '../../models/log.model';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.html',
  styleUrl: './results.scss'
})
export class Results implements OnInit {
  private router = inject(Router);
  private apiService = inject(ApiService);

  results = signal<SearchResult | null>(null);
  searchParams = signal<SearchParams | null>(null);
  selectedLog = signal<Log | null>(null);
  loading = signal(false);
  exporting = signal(false);

  ngOnInit() {
    // Get state from history (persists after navigation)
    const state = history.state as any;

    console.log('Results page - state:', state);

    if (state?.results && state?.params) {
      console.log('Results found:', state.results);
      this.results.set(state.results);
      this.searchParams.set(state.params);
    } else {
      console.log('No results in state, redirecting to search');
      this.router.navigate(['/search']);
    }
  }

  viewDetails(log: Log) {
    this.selectedLog.set(log);
  }

  closeDetails() {
    this.selectedLog.set(null);
  }

  getLevelClass(level: string): string {
    const classes: Record<string, string> = {
      'DEBUG': 'level-debug',
      'INFO': 'level-info',
      'WARNING': 'level-warning',
      'ERROR': 'level-error',
      'CRITICAL': 'level-critical'
    };
    return classes[level] || 'level-info';
  }

  getLevelIcon(level: string): string {
    const icons: Record<string, string> = {
      'DEBUG': '🐛',
      'INFO': 'ℹ️',
      'WARNING': '⚠️',
      'ERROR': '❌',
      'CRITICAL': '🚨'
    };
    return icons[level] || 'ℹ️';
  }

  changePage(page: number) {
    const params = this.searchParams();
    if (!params) return;

    this.loading.set(true);
    const newParams = { ...params, page };

    this.apiService.searchLogs(newParams).subscribe({
      next: (results) => {
        this.results.set(results);
        this.searchParams.set(newParams);
        this.loading.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (error) => {
        console.error('Error changing page:', error);
        this.loading.set(false);
        alert('Failed to load page');
      }
    });
  }

  exportResults() {
    const params = this.searchParams();
    if (!params) return;

    this.exporting.set(true);

    this.apiService.exportResults(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `logs-export-${new Date().toISOString()}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: (error) => {
        console.error('Export error:', error);
        this.exporting.set(false);
        alert('Export failed');
      }
    });
  }

  newSearch() {
    this.router.navigate(['/search']);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  getPageNumbers(): number[] {
    const result = this.results();
    if (!result) return [];

    const total = Math.ceil(result.total / result.pageSize);
    const current = result.page;
    const pages: number[] = [];

    // Show max 7 pages
    let start = Math.max(1, current - 3);
    let end = Math.min(total, current + 3);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  getMaxResult(): number {
    const result = this.results();
    if (!result) return 0;
    return Math.min(result.page * result.pageSize, result.total);
  }
}
