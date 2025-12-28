import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { StatsCardComponent } from '../../components/stats-card/stats-card.component';
import { Stats } from '../../models/stats.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, StatsCardComponent],
  templateUrl: './home.html'
})
export class Home implements OnInit {
  private apiService = inject(ApiService);
  private platformId = inject(PLATFORM_ID);
  private sanitizer = inject(DomSanitizer);
  
  stats = signal<Stats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  connectionStatus = signal<string>('Connecting...');
  
  // Kibana dashboard URL
  kibanaDashboardUrl: SafeResourceUrl;

  constructor() {
    // Sanitize the Kibana dashboard URL - 5 weeks time range
    const dashboardUrl = 'http://localhost:5601/app/dashboards#/view/baed2430-d360-11f0-8cc1-e14176d70d6e?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:60000),time:(from:now-5w,to:now))';
    this.kibanaDashboardUrl = this.sanitizer.bypassSecurityTrustResourceUrl(dashboardUrl);
  }

  ngOnInit() {
    // Only make API calls in the browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      this.loadStats();
      this.checkHealth();
    } else {
      this.loading.set(false);
      this.connectionStatus.set('Server-side rendering...');
    }
  }

  loadStats() {
    this.loading.set(true);
    this.apiService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load statistics');
        this.loading.set(false);
        console.error('Error loading stats:', err);
      }
    });
  }

  checkHealth() {
    this.apiService.healthCheck().subscribe({
      next: (response) => {
        this.connectionStatus.set(response.message || 'Connected');
      },
      error: () => {
        this.connectionStatus.set('API Connection Error');
      }
    });
  }

  refresh() {
    this.loadStats();
    this.checkHealth();
  }
}
