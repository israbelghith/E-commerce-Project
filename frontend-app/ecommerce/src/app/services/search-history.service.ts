import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { SearchParams } from '../models/log.model';

@Injectable({
  providedIn: 'root'
})
export class SearchHistoryService {
  private historyKey = 'search_history';
  private maxHistory = 10;
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  
  private historySubject = new BehaviorSubject<SearchParams[]>(this.loadHistory());

  get history$(): Observable<SearchParams[]> {
    return this.historySubject.asObservable();
  }

  addSearch(params: SearchParams): void {
    if (!this.isBrowser) return;
    
    const history = this.loadHistory();
    history.unshift(params);
    
    if (history.length > this.maxHistory) {
      history.pop();
    }
    
    localStorage.setItem(this.historyKey, JSON.stringify(history));
    this.historySubject.next(history);
  }

  clearHistory(): void {
    if (!this.isBrowser) return;
    
    localStorage.removeItem(this.historyKey);
    this.historySubject.next([]);
  }

  private loadHistory(): SearchParams[] {
    if (!this.isBrowser) return [];
    
    const stored = localStorage.getItem(this.historyKey);
    return stored ? JSON.parse(stored) : [];
  }
}
