import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-grid">
      <div *ngFor="let item of [1,2,3,4,5,6]" class="skeleton-card">
        <div class="skeleton-header">
          <div class="skeleton-pill"></div>
          <div class="skeleton-badge"></div>
        </div>
        <div class="skeleton-title"></div>
        <div class="skeleton-row"></div>
        <div class="skeleton-specs">
          <div class="skeleton-spec-box"></div>
          <div class="skeleton-spec-box"></div>
          <div class="skeleton-spec-box"></div>
        </div>
        <div class="skeleton-footer"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
      gap: 1.25rem;
    }

    .skeleton-card {
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .skeleton-header {
      display: flex;
      justify-content: space-between;
    }

    .skeleton-pill, .skeleton-badge, .skeleton-title, .skeleton-row, .skeleton-spec-box, .skeleton-footer {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.04) 25%, rgba(255, 255, 255, 0.09) 50%, rgba(255, 255, 255, 0.04) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
    }

    .skeleton-pill {
      width: 80px;
      height: 22px;
      border-radius: 20px;
    }

    .skeleton-badge {
      width: 50px;
      height: 22px;
    }

    .skeleton-title {
      width: 70%;
      height: 24px;
    }

    .skeleton-row {
      width: 50%;
      height: 16px;
    }

    .skeleton-specs {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .skeleton-spec-box {
      height: 50px;
    }

    .skeleton-footer {
      width: 100%;
      height: 36px;
      border-radius: 8px;
      margin-top: 0.5rem;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `]
})
export class SkeletonLoaderComponent {}
