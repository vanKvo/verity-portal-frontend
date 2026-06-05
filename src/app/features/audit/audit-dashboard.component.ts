import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { AuditService } from './services/audit.service';
import { LeaverViolation } from './models/leaver-mover.models';
import { AuthService } from '../../core/services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-audit-dashboard',
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
    MatTabsModule,
    MatTooltipModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './audit-dashboard.component.html',
  styleUrls: ['./audit-dashboard.component.css']
})
export class AuditDashboardComponent implements OnInit {
  private auditService = inject(AuditService);
  public authService = inject(AuthService);

  violations = signal<LeaverViolation[]>([]);
  openViolations = computed(() => this.violations().filter(v => v.status === 'OPEN'));
  resolvedViolations = computed(() => this.violations().filter(v => v.status === 'RESOLVED'));

  displayedColumns: string[] = [
    'employee_id',
    'hr_termination_date',
    'last_system_login',
    'system_name',
    'ip_address',
    'status',
    'created_at',
    'actions'
  ];

  resolvedColumns: string[] = [
    'employee_id',
    'hr_termination_date',
    'last_system_login',
    'system_name',
    'ip_address',
    'status',
    'created_at',
    'resolved_by',
    'resolved_at',
    'resolution_reason'
  ];

  resolvingViolation = signal<LeaverViolation | null>(null);
  resolutionReason = '';
  showSuccessDialog = signal(false);
  successMessage = '';

  ngOnInit() {
    this.loadViolations();
  }

  loadViolations() {
    this.auditService.getViolations().subscribe({
      next: (data) => this.violations.set(data),
      error: (err) => console.error('Failed to load violations', err)
    });
  }

  getStatusChipColor(status: string): string {
    return status === 'OPEN' ? 'warn' : 'primary';
  }

  resolveViolation(violation: LeaverViolation) {
    this.resolvingViolation.set(violation);
    this.resolutionReason = '';
  }

  closeResolveDialog() {
    this.resolvingViolation.set(null);
    this.resolutionReason = '';
  }

  submitResolution() {
    const violation = this.resolvingViolation();
    if (!violation) return;

    const reason = this.resolutionReason.trim();
    if (reason.length < 5) {
      alert("Please provide a valid resolution reason (min 5 characters).");
      return;
    }

    this.auditService.resolveViolation(violation.id, { resolution_reason: reason }).subscribe({
      next: () => {
        this.successMessage = `Violation for Employee ID ${violation.employee_id} was successfully resolved.`;
        this.showSuccessDialog.set(true);
        this.closeResolveDialog();
        this.loadViolations();
      },
      error: (err) => {
        const errMsg = err.error?.detail?.message || err.error?.detail || err.message;
        alert("Failed to resolve violation: " + errMsg);
      }
    });
  }
}
