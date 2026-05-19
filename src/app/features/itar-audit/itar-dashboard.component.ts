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
import { RosterUploadResponse } from './models/itar.models';
import { ItarService } from './services/itar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './itar-dashboard.component.html',
  styleUrl: './itar-dashboard.component.css'
})
export class ItarDashboardComponent {
  @ViewChild('stepper') stepper!: MatStepper;

  public authService = inject(AuthService);
  private itarService = inject(ItarService);

  violations = this.itarService.violations;
  alert = this.itarService.alert;
  activeColumns: string[] = ['employee_id', 'project_id', 'citizenship', 'sensitivity', 'status', 'notes', 'actions'];
  resolvedColumns: string[] = ['employee_id', 'project_id', 'citizenship', 'sensitivity', 'status', 'resolution_reason', 'notes'];

  // Categorized computed violations lists
  activeViolations = computed(() => this.violations().filter(v => v.status === 'OPEN'));
  resolvedViolations = computed(() => this.violations().filter(v => v.status === 'RESOLVED'));

  // Custom dialog/overlay resolution form state
  resolvingViolation = signal<any | null>(null);
  resolutionReason = '';

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
    this.loadViolations();
  }

  loadViolations() {
    this.itarService.getViolations().subscribe(v => this.violations.set(v));
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
        this.alert.set({ message: 'Violation marked as resolved.', type: 'success' });
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
