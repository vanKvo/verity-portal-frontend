import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div style="padding: 24px;">
      <h1>Dashboard</h1>
      <p>Welcome, <strong>{{ authService.currentUser()?.email }}</strong>!</p>
      <p>Role: <span class="badge">{{ authService.currentUser()?.role }}</span></p>
      
      <div style="margin-top: 24px; padding: 48px; border: 2px dashed #ccc; text-align: center; border-radius: 8px;">
        <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: #999;">analytics</mat-icon>
        <p>Compliance reconciliation modules will appear here.</p>
      </div>
      
      <button mat-raised-button color="warn" style="margin-top: 24px;" (click)="authService.logout()">
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
