import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SearchHistoryService } from '../../services/search-history.service';
import { SearchParams } from '../../models/log.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.html'
})
export class Search {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private searchHistoryService = inject(SearchHistoryService);

  searchParams = signal<SearchParams>({
    query: '',
    level: '',
    service: '',
    dateFrom: undefined,
    dateTo: undefined,
    page: 1,
    size: 50
  });

  searchHistory$ = this.searchHistoryService.history$;
  searching = signal(false);
  
  levels = ['', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

  updateQuery(query: string) {
    this.searchParams.update(params => ({ ...params, query }));
  }

  updateLevel(level: string) {
    this.searchParams.update(params => ({ ...params, level }));
  }

  updateService(service: string) {
    this.searchParams.update(params => ({ ...params, service }));
  }

  updateDateFrom(date: string) {
    this.searchParams.update(params => ({ 
      ...params, 
      dateFrom: date ? new Date(date) : undefined 
    }));
  }

  updateDateTo(date: string) {
    this.searchParams.update(params => ({ 
      ...params, 
      dateTo: date ? new Date(date) : undefined 
    }));
  }

  search() {
    const params = this.searchParams();
    
    console.log('🔍 Search params:', params);
    
    this.searching.set(true);
    this.searchHistoryService.addSearch(params);

    this.apiService.searchLogs(params).subscribe({
      next: (results) => {
        this.searching.set(false);
        console.log('✅ Search results received:', results);
        console.log('  - Total:', results.total);
        console.log('  - Results count:', results.results?.length);
        
        // Navigate to results page with search params
        this.router.navigate(['/results'], { 
          state: { results, params } 
        });
      },
      error: (error) => {
        this.searching.set(false);
        console.error('❌ Search error:', error);
        alert('Search failed. Please try again.');
      }
    });
  }

  reset() {
    this.searchParams.set({
      query: '',
      level: '',
      service: '',
      dateFrom: undefined,
      dateTo: undefined,
      page: 1,
      size: 50
    });
  }

  loadFromHistory(params: SearchParams) {
    this.searchParams.set({ ...params });
    this.search();
  }

  clearHistory() {
    if (confirm('Clear all search history?')) {
      this.searchHistoryService.clearHistory();
    }
  }
}
