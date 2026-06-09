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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { LeaverAuditService } from './services/leaver-audit.service';
import { LeaverViolation } from './models/leaver-mover.models';
import { AuthService } from '../../core/services/auth.service';
import { RouterModule } from '@angular/router';
import { DataHubService } from '../data-hub/data-hub.service';
import { SyncStatus } from '../data-hub/models/data-hub.models';
import { MatMenuModule } from '@angular/material/menu';
import { exportToCsv, exportLeaverAuditPdf } from '../../shared/utils/report-exporter';

@Component({
  selector: 'app-leaver-audit-dashboard',
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
    MatProgressSpinnerModule,
    FormsModule,
    RouterModule,
    MatMenuModule
  ],
  templateUrl: './leaver-audit-dashboard.component.html',
  styleUrls: ['./leaver-audit-dashboard.component.css']
})
export class LeaverAuditDashboardComponent implements OnInit {
  private auditService = inject(LeaverAuditService);
  public authService = inject(AuthService);
  private dataHubService = inject(DataHubService);

  violations = signal<LeaverViolation[]>([]);
  syncStatus = signal<SyncStatus | null>(null);
  isLoading = signal(true);

  openViolations = computed(() => this.violations().filter(v => v.status === 'OPEN'));
  resolvedViolations = computed(() => this.violations().filter(v => v.status === 'RESOLVED'));

  isDataIngestionRequired = computed(() => {
    const status = this.syncStatus();
    if (!status) return false;
    return !status.personnel_last_sync || !status.it_activity_last_sync;
  });

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
    this.loadData();
  }

  exportCsv(): void {
    const headers: { key: keyof LeaverViolation; label: string }[] = [
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'hr_termination_date', label: 'Termination Date' },
      { key: 'last_system_login', label: 'Last System Login' },
      { key: 'system_name', label: 'System Name' },
      { key: 'ip_address', label: 'IP Address' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Detected At' },
      { key: 'resolution_reason', label: 'Resolution Reason' },
      { key: 'resolved_by', label: 'Resolved By' },
      { key: 'resolved_at', label: 'Resolved At' }
    ];
    exportToCsv(this.violations(), headers, `Leaver_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  exportPdf(): void {
    exportLeaverAuditPdf(this.violations());
  }

  loadData() {
    this.isLoading.set(true);
    this.dataHubService.getSyncStatus().subscribe({
      next: (status) => {
        this.syncStatus.set(status);
        if (!status.personnel_last_sync || !status.it_activity_last_sync) {
          this.violations.set([]);
          this.isLoading.set(false);
        } else {
          this.loadViolations();
        }
      },
      error: (err) => {
        console.error('Failed to load sync status', err);
        this.loadViolations();
      }
    });
  }

  loadViolations() {
    this.isLoading.set(true);
    this.auditService.getViolations().subscribe({
      next: (data) => {
        this.violations.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load violations', err);
        this.isLoading.set(false);
      }
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
