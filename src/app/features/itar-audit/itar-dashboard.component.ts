import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ItarService } from './services/itar.service';
import { ComplianceViolation } from './models/itar.models';

import { RouterModule } from '@angular/router';
 
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
    RouterModule
  ],
  templateUrl: './itar-dashboard.component.html',
  styleUrl: './itar-dashboard.component.css'
})
export class ItarDashboardComponent {
  private itarService = inject(ItarService);
  private snackBar = inject(MatSnackBar);

  alert = signal<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);


  violations = signal<ComplianceViolation[]>([]);
  displayedColumns: string[] = ['personnel_id', 'project_id', 'status', 'notes', 'actions'];

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
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.itarService.uploadRoster(file).subscribe({
        next: () => {
          this.alert.set({ message: 'Roster ingested successfully. Starting automated audit...', type: 'success' });
          this.runAudit(); // Auto-audit after upload
        },
        error: (err) => {
          console.error('Ingestion failed', err);
          this.alert.set({ message: 'Ingestion failed: ' + (err.error?.detail || err.message), type: 'error' });
        }
      });
    }
  }

  runAudit() {
    this.itarService.runAudit().subscribe(res => {
      this.alert.set({ 
        message: `Audit complete. Detected ${res.violations_detected} new violations.`, 
        type: res.violations_detected > 0 ? 'info' : 'success' 
      });
      this.loadViolations();
    });
  }

  resolve(id: string) {
    this.itarService.resolveViolation(id).subscribe(() => {
      this.alert.set({ message: 'Violation marked as resolved.', type: 'success' });
      this.loadViolations();
    });
  }
}
