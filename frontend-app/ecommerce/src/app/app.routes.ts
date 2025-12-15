import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Upload } from './pages/upload/upload';

export const routes: Routes = [
  { path: '', component: Home, title: 'Dashboard - E-Commerce Monitoring' },
  { path: 'upload', component: Upload, title: 'Upload Logs - E-Commerce' },
  { 
    path: 'search', 
    loadComponent: () => import('./pages/search/search').then(m => m.Search),
    title: 'Search Logs - E-Commerce'
  },
  { 
    path: 'results', 
    loadComponent: () => import('./pages/results/results').then(m => m.Results),
    title: 'Search Results - E-Commerce'
  },
  { 
    path: 'files', 
    loadComponent: () => import('./pages/files/files').then(m => m.Files),
    title: 'Uploaded Files - E-Commerce'
  },
  { path: '**', redirectTo: '' }
];
