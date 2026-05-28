import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { AssetAuditService } from './asset-audit.service';
import { AssetViolation } from './models/asset-audit.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-asset-audit-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './asset-audit-dashboard.component.html',
  styleUrls: ['./asset-audit-dashboard.component.css']
})
export class AssetAuditDashboardComponent implements OnInit {
  private auditService = inject(AssetAuditService);
  public authService = inject(AuthService);

  violations = signal<AssetViolation[]>([]);
  displayedColumns: string[] = ['type', 'asset_tag', 'po_number', 'status', 'created_at', 'actions'];

  ngOnInit() {
    this.loadViolations();
  }

  loadViolations() {
    this.auditService.getViolations().subscribe({
      next: (data) => this.violations.set(data),
      error: (err) => console.error('Failed to load violations', err)
    });
  }

  getViolationChipColor(type: string): string {
    return type === 'GHOST_ASSET' ? 'warn' : 'accent';
  }

  getStatusChipColor(status: string): string {
    return status === 'OPEN' ? 'warn' : 'primary';
  }

  resolveViolation(violation: AssetViolation) {
    const reason = prompt("Enter resolution reason:");
    if (!reason || reason.trim().length < 5) {
      alert("Please provide a valid resolution reason (min 5 characters).");
      return;
    }

    this.auditService.resolveViolation(violation.id, { resolution_reason: reason }).subscribe({
      next: () => {
        alert("Violation resolved successfully!");
        this.loadViolations();
      },
      error: (err) => {
        alert("Failed to resolve violation: " + (err.error?.detail || err.message));
      }
    });
  }
}
