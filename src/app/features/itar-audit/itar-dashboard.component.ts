import { Component, inject, signal, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ShareMapperComponent, TargetAttribute } from '../../shared/components/share-mapper/share-mapper.component';
import { ColumnMapping } from '../data-hub/models/data-hub.models';
import { RosterUploadResponse, ComplianceViolation } from './models/itar.models';
import { ItarService } from './services/itar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { DataHubService } from '../data-hub/data-hub.service';
import { SyncStatus } from '../data-hub/models/data-hub.models';
import { MatMenuModule } from '@angular/material/menu';
import { exportToCsv, exportItarAuditPdf } from '../../shared/utils/report-exporter';

@Component({
  selector: 'app-itar-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    RouterModule,
    MatStepperModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    ShareMapperComponent,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  templateUrl: './itar-dashboard.component.html',
  styleUrl: './itar-dashboard.component.css'
})
export class ItarDashboardComponent {
  @ViewChild('stepper') stepper!: MatStepper;

  public authService = inject(AuthService);
  private itarService = inject(ItarService);
  private dataHubService = inject(DataHubService);

  violations = this.itarService.violations;
  syncStatus = signal<SyncStatus | null>(null);
  isLoading = signal(true);

  isDataIngestionRequired = computed(() => {
    const status = this.syncStatus();
    if (!status) return false;
    return !status.personnel_last_sync || !status.projects_last_sync;
  });
  alert = this.itarService.alert;
  activeColumns: string[] = ['employee_id', 'project_id', 'citizenship', 'sensitivity', 'status', 'notes', 'actions'];
  resolvedColumns: string[] = ['employee_id', 'project_id', 'citizenship', 'sensitivity', 'status', 'resolved_by', 'resolved_at', 'resolution_reason', 'notes'];

  // Categorized computed violations lists
  activeViolations = computed(() => this.violations().filter(v => v.status === 'OPEN'));
  resolvedViolations = computed(() => this.violations().filter(v => v.status === 'RESOLVED'));

  // Custom dialog/overlay resolution form state
  resolvingViolation = signal<any | null>(null);
  resolutionReason = '';
  showSuccessDialog = signal(false);
  successMessage = '';

  // Stepper & Mapping State
  currentFile = signal<File | null>(null);
  headers = signal<string[]>([]);
  isUploading = signal(false);
  ingestionSummary = signal<RosterUploadResponse | null>(null);

  readonly targetAttributes: TargetAttribute[] = [
    { key: 'employee_id', label: 'Employee ID', required: true },
    { key: 'project_id', label: 'Project ID', required: true }
  ];

  ngOnInit() {
    this.loadData();
  }

  exportCsv(): void {
    const headers: { key: keyof ComplianceViolation; label: string }[] = [
      { key: 'employee_id', label: 'Employee ID' },
      { key: 'project_id', label: 'Project ID' },
      { key: 'citizenship', label: 'Citizenship' },
      { key: 'sensitivity', label: 'Project Sensitivity' },
      { key: 'status', label: 'Status' },
      { key: 'notes', label: 'Detection Notes' },
      { key: 'created_at', label: 'Detected At' },
      { key: 'resolution_reason', label: 'Resolution Reason' },
      { key: 'resolved_by', label: 'Resolved By' },
      { key: 'resolved_at', label: 'Resolved At' }
    ];
    exportToCsv(this.violations(), headers, `ITAR_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  exportPdf(): void {
    exportItarAuditPdf(this.violations());
  }

  loadData() {
    this.isLoading.set(true);
    this.dataHubService.getSyncStatus().subscribe({
      next: (status) => {
        this.syncStatus.set(status);
        if (!status.personnel_last_sync || !status.projects_last_sync) {
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
    this.itarService.getViolations().subscribe({
      next: (v) => {
        this.violations.set(v);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load violations', err);
        this.isLoading.set(false);
      }
    });
  }

  closeAlert() {
    this.alert.set(null);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file: File = input.files[0];
    this.currentFile.set(file);

    this.isUploading.set(true);
    this.itarService.parseHeaders(file).subscribe({
      next: (res) => {
        this.headers.set(res.headers);
        this.isUploading.set(false);
      },
      error: (err) => {
        this.isUploading.set(false);
        this.alert.set({ message: 'Failed to extract file headers: ' + (err.error?.detail || err.message), type: 'error' });
      }
    });
  }

  onMapped(mapping: ColumnMapping) {
    const file = this.currentFile();
    if (!file) return;

    this.isUploading.set(true);
    this.itarService.uploadRoster(file, mapping).subscribe({
      next: (summary) => {
        this.ingestionSummary.set(summary);
        this.isUploading.set(false);
        this.alert.set({
          message: `Ingestion complete: ${summary.success_count} success, ${summary.error_count} errors.`,
          type: summary.error_count > 0 ? 'info' : 'success',
          errors: summary.errors
        });

        // Auto-advance to Step 2 (Review Ingestion)
        setTimeout(() => {
          this.stepper.next();
        }, 100);
      },
      error: (err) => {
        this.isUploading.set(false);
        let errMsg = 'Ingestion Failed: An unexpected error occurred. Please contact the website administrator for support.';
        if (err.status === 400) {
          errMsg = 'Ingestion Failed: Invalid file format or invalid columns. Please check that you are uploading a valid CSV spreadsheet and try again.';
          if (err.error?.detail) {
            errMsg += ` (${err.error.detail})`;
          }
        } else if (err.status === 401 || err.status === 403) {
          errMsg = 'Ingestion Failed: Insufficient permissions or session expired. Please log in again.';
        } else if (err.error?.detail) {
          errMsg = 'Ingestion Failed: ' + err.error.detail;
        } else if (err.message) {
          errMsg = 'Ingestion Failed: ' + err.message;
        }
        this.alert.set({ message: errMsg, type: 'error' });
      }
    });
  }

  runAudit() {
    this.itarService.runAudit().subscribe({
      next: (res) => {
        this.alert.set({
          message: `Audit complete. Detected ${res.violations_detected} new violations.`,
          type: res.violations_detected > 0 ? 'info' : 'success'
        });
        this.loadViolations();

        // Auto-advance stepper to Step 4 (Results)
        setTimeout(() => {
          this.stepper.next();
        }, 100);
      },
      error: (err) => {
        this.alert.set({ message: 'Audit failed: ' + (err.error?.detail || err.message), type: 'error' });
      }
    });
  }

  openResolveDialog(element: any) {
    this.resolvingViolation.set(element);
    this.resolutionReason = '';
  }

  closeResolveDialog() {
    this.resolvingViolation.set(null);
    this.resolutionReason = '';
  }

  submitResolution() {
    const violation = this.resolvingViolation();
    const reason = this.resolutionReason.trim();
    if (!violation || !reason) return;

    this.itarService.resolveViolation(violation.id, reason).subscribe({
      next: () => {
        this.successMessage = `ITAR Violation for Employee ID ${violation.employee_id} and Project ID ${violation.project_id} was successfully resolved.`;
        this.showSuccessDialog.set(true);
        this.loadViolations();
        this.closeResolveDialog();
      },
      error: (err) => {
        this.alert.set({ message: 'Resolution failed: ' + (err.error?.detail || err.message), type: 'error' });
      }
    });
  }

  reset() {
    this.currentFile.set(null);
    this.headers.set([]);
    this.ingestionSummary.set(null);
    this.isUploading.set(false);
  }
}
