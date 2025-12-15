import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Log, SearchParams, SearchResult } from '../models/log.model';
import { UploadedFile, UploadResponse } from '../models/file.model';
import { Stats } from '../models/stats.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5000/api';  // Direct call to Flask backend

  // Stats endpoints
  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.baseUrl}/stats`);
  }

  // Logs endpoints
  searchLogs(params: SearchParams): Observable<SearchResult> {
    const body = {
      query: params.query || '',
      level: params.level || '',
      service: params.service || '',
      startDate: params.dateFrom ? params.dateFrom.toISOString() : '',
      endDate: params.dateTo ? params.dateTo.toISOString() : '',
      page: params.page || 1,
      pageSize: params.size || 50
    };

    return this.http.post<SearchResult>(`${this.baseUrl}/search`, body);
  }

  getLogById(id: string): Observable<Log> {
    return this.http.get<Log>(`${this.baseUrl}/logs/${id}`);
  }

  // Upload endpoints
  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('logfile', file);
    
    return this.http.post<UploadResponse>(`${this.baseUrl}/upload`, formData, {
      reportProgress: true
    });
  }

  getFiles(): Observable<UploadedFile[]> {
    return this.http.get<UploadedFile[]>(`${this.baseUrl}/files`);
  }

  // Export endpoint
  exportResults(params: SearchParams): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params.query) httpParams = httpParams.set('query', params.query);
    if (params.level) httpParams = httpParams.set('level', params.level);
    
    return this.http.get(`${this.baseUrl}/export`, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  // Health check
  healthCheck(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.baseUrl}/hello`);
  }
}
