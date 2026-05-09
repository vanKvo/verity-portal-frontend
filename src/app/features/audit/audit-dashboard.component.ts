import { Component, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { SharedMapperComponent, SchemaField } from '../intake/shared-mapper.component';
import { FileUploadComponent } from '../intake/file-upload.component';
import { AuditService } from './services/audit.service';

@Component({
  selector: 'app-audit-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatSnackBarModule,
    MatIconModule,
    SharedMapperComponent,
    FileUploadComponent
  ],
  templateUrl: './audit-dashboard.component.html',
  styleUrls: ['./audit-dashboard.component.css']
})
export class AuditDashboardComponent {
  private auditService = inject(AuditService);
  private snackBar = inject(MatSnackBar);

  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild('hrMapper') hrMapper?: SharedMapperComponent;
  @ViewChild('itMapper') itMapper?: SharedMapperComponent;

  hrJobId = signal('');
  hrHeaders = signal<string[]>([]);
  hrSuggestions = signal<any[]>([]);

  itJobId = signal('');
  itHeaders = signal<string[]>([]);
  itSuggestions = signal<any[]>([]);

  isLoading = signal(false);
  violations = signal<any[]>([]);

  handleHrUpload(event: { jobId: string, headers: string[], suggestions: any[] }) {
    this.hrJobId.set(event.jobId);
    this.hrHeaders.set(event.headers);
    this.hrSuggestions.set(event.suggestions);
  }

  handleItUpload(event: { jobId: string, headers: string[], suggestions: any[] }) {
    this.itJobId.set(event.jobId);
    this.itHeaders.set(event.headers);
    this.itSuggestions.set(event.suggestions);
  }
  
  onMappingConfirmed() {
    this.stepper.next();
  }

  hrSchema: SchemaField[] = [
    { field: 'employee_id', description: 'Unique Employee ID', required: true },
    { field: 'hr_termination_date', description: 'Termination Date', required: true },
    { field: 'full_name', description: 'Full Name', required: false }
  ];

  itSchema: SchemaField[] = [
    { field: 'employee_id', description: 'Unique Employee ID', required: true },
    { field: 'last_system_login', description: 'Last Login Timestamp', required: true },
    { field: 'system_name', description: 'Target System', required: false }
  ];

  displayedColumns: string[] = ['employee_id', 'risk_level', 'violation_type', 'details'];

  runAudit() {
    if (!this.hrJobId() || !this.itJobId()) return;

    this.isLoading.set(true);
    this.auditService.runAudit(this.hrJobId(), this.itJobId())
      .subscribe({
        next: (response) => {
        this.violations.set(response.violations);
        this.isLoading.set(false);
      },
      error: (err) => {
        const message = err.error?.message || 'An unexpected error occurred during audit.';
        this.snackBar.open(message, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isLoading.set(false);
      }
    });
  }

  exportCsv() {
    this.auditService.exportCsv(this.violations())
      .subscribe(blob => this.downloadFile(blob, 'audit_report.csv'));
  }

  exportPdf() {
    this.auditService.exportPdf(this.violations())
      .subscribe(blob => this.downloadFile(blob, 'audit_report.pdf'));
  }

  private downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
