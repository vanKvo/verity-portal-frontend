import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, RouterModule],
  template: `
    <div style="padding: 24px;">
      <h1>Dashboard</h1>
      <p>Welcome, <strong>{{ authService.currentUser()?.email }}</strong>!</p>
      <p>Role: <span class="badge">{{ authService.currentUser()?.role }}</span></p>
      
      <div class="module-grid" style="margin-top: 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
        <mat-card style="cursor: pointer;" routerLink="/audit">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">security</mat-icon>
            <mat-card-title>Compliance Engine</mat-card-title>
            <mat-card-subtitle>Leaver/Mover & Exports</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Run automated reconciliation between HR and IT records. Identify unauthorized access and generate auditor-ready reports.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary">OPEN MODULE</button>
          </mat-card-actions>
        </mat-card>
      </div>
      
      <button mat-raised-button color="warn" style="margin-top: 48px;" (click)="authService.logout()">
        <mat-icon>logout</mat-icon>
        Logout
      </button>
    </div>
  `,
  styles: [`
    .badge {
      background: #002244;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      text-transform: uppercase;
    }
  `]
})
export class DashboardComponent {
  authService = inject(AuthService);
}
