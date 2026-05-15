import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
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
    MatTableModule, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule, 
    MatSnackBarModule,
    RouterModule,
    MatStepperModule,
    ShareMapperComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './itar-dashboard.component.html',
  styleUrl: './itar-dashboard.component.css'
})
export class ItarDashboardComponent {
  public authService = inject(AuthService);
  private itarService = inject(ItarService);
  
  violations = this.itarService.violations;
  alert = this.itarService.alert;
  displayedColumns: string[] = ['personnel_id', 'project_id', 'status', 'resolution_reason', 'notes', 'actions'];

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

    // Parse headers
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const text = e.target?.result as string;
      if (text) {
        const firstLine = text.split('\n')[0];
        const extractedHeaders = firstLine.split(',').map((h: string) => h.trim().replace(/^"|"$/g, ''));
        this.headers.set(extractedHeaders);
      }
    };
    reader.readAsText(file.slice(0, 5000));
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
      },
      error: (err) => {
        this.isUploading.set(false);
        this.alert.set({ message: 'Ingestion failed: ' + (err.error?.detail || err.message), type: 'error' });
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
      },
      error: (err) => {
        this.alert.set({ message: 'Audit failed: ' + (err.error?.detail || err.message), type: 'error' });
      }
    });
  }

  resolve(id: string) {
    this.itarService.resolveViolation(id).subscribe(() => {
      this.alert.set({ message: 'Violation marked as resolved.', type: 'success' });
      this.loadViolations();
    });
  }

  reset() {
    this.currentFile.set(null);
    this.headers.set([]);
    this.ingestionSummary.set(null);
    this.isUploading.set(false);
  }
}
