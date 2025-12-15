import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-card" [class]="color">
      <div class="icon">{{ icon }}</div>
      <div class="content">
        <h3>{{ title }}</h3>
        <p class="value">{{ value }}</p>
        <p class="label">{{ subtitle }}</p>
      </div>
    </div>
  `,
  styles: [`
    .stats-card {
      background: white;
      border-radius: 10px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .stats-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    }

    .icon {
      font-size: 3rem;
      width: 70px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
    }

    .stats-card.primary .icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .stats-card.success .icon {
      background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
    }

    .stats-card.danger .icon {
      background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
    }

    .stats-card.warning .icon {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .content {
      flex: 1;
    }

    .content h3 {
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .value {
      margin: 0;
      font-size: 2rem;
      font-weight: bold;
      color: #2c3e50;
    }

    .label {
      margin: 0.25rem 0 0;
      font-size: 0.85rem;
      color: #95a5a6;
    }

    @media (max-width: 768px) {
      .stats-card {
        padding: 1rem;
      }

      .icon {
        font-size: 2rem;
        width: 50px;
        height: 50px;
      }

      .value {
        font-size: 1.5rem;
      }
    }
  `]
})
export class StatsCardComponent {
  @Input() title = '';
  @Input() value: string | number = 0;
  @Input() subtitle = '';
  @Input() icon = '📊';
  @Input() color: 'primary' | 'success' | 'danger' | 'warning' = 'primary';
}
