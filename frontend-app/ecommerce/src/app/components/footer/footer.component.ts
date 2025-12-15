import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h3>E-Commerce Monitoring</h3>
            <p>Application de Monitoring et d'Analyse de Logs</p>
          </div>
          
          <div class="footer-section">
            <h4>Technologies</h4>
            <ul>
              <li>Angular 21</li>
              <li>Elasticsearch 8.x</li>
              <li>MongoDB & Redis</li>
              <li>Docker</li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h4>Projet</h4>
            <p>IT Business School</p>
            <p>Mini-Projet - Stack ELK</p>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} E-Commerce Monitoring Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #2c3e50;
      color: white;
      padding: 2rem 0 1rem;
      margin-top: auto;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .footer-section h3 {
      margin: 0 0 1rem;
      font-size: 1.5rem;
    }

    .footer-section h4 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      color: #3498db;
    }

    .footer-section p {
      margin: 0.5rem 0;
      color: #bdc3c7;
    }

    .footer-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-section ul li {
      padding: 0.25rem 0;
      color: #bdc3c7;
    }

    .footer-bottom {
      border-top: 1px solid #34495e;
      padding-top: 1rem;
      text-align: center;
    }

    .footer-bottom p {
      margin: 0;
      color: #95a5a6;
    }

    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
