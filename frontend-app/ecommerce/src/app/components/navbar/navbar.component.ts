import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="container">
        <a routerLink="/" class="navbar-brand">
          <span class="brand-icon">📊</span>
          E-Commerce Monitoring
        </a>
        
        <button class="navbar-toggler" (click)="toggleMenu()" [class.active]="isMenuOpen">
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <div class="navbar-menu" [class.active]="isMenuOpen">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" 
             (click)="closeMenu()">
            Dashboard
          </a>
          <a routerLink="/upload" routerLinkActive="active" (click)="closeMenu()">
            Upload Logs
          </a>
          <a routerLink="/search" routerLinkActive="active" (click)="closeMenu()">
            Search
          </a>
          <a routerLink="/files" routerLinkActive="active" (click)="closeMenu()">
            Files
          </a>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 1rem 0;
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .navbar-brand {
      color: white;
      font-size: 1.5rem;
      font-weight: bold;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .brand-icon {
      font-size: 2rem;
    }

    .navbar-toggler {
      display: none;
      flex-direction: column;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
    }

    .navbar-toggler span {
      width: 25px;
      height: 3px;
      background: white;
      margin: 3px 0;
      transition: 0.3s;
    }

    .navbar-menu {
      display: flex;
      gap: 2rem;
    }

    .navbar-menu a {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 5px;
      transition: background-color 0.3s;
    }

    .navbar-menu a:hover {
      background-color: rgba(255,255,255,0.1);
    }

    .navbar-menu a.active {
      background-color: rgba(255,255,255,0.2);
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .navbar-toggler {
        display: flex;
      }

      .navbar-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #667eea;
        flex-direction: column;
        gap: 0;
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
      }

      .navbar-menu.active {
        max-height: 300px;
      }

      .navbar-menu a {
        padding: 1rem;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
    }
  `]
})
export class NavbarComponent {
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}
