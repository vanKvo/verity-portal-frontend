import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './audit-dashboard.component.html',
  styleUrls: ['./audit-dashboard.component.css']
})
export class AuditDashboardComponent {
  private http = inject(HttpClient);
  
  hrJobId = signal('');
  accessJobId = signal('');
  isLoading = signal(false);
  violations = signal<any[]>([]);
  
  displayedColumns: string[] = ['employee_id', 'risk_level', 'violation_type', 'details'];
  
  runAudit() {
    if (!this.hrJobId() || !this.accessJobId()) return;
    
    this.isLoading.set(true);
    this.http.post<any>('http://localhost:8000/audit/leaver-mover', {
      hr_job_id: this.hrJobId(),
      access_job_id: this.accessJobId()
    }).subscribe({
      next: (response) => {
        this.violations.set(response.violations);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Audit failed', err);
        this.isLoading.set(false);
      }
    });
  }
  
  exportCsv() {
    this.http.post('http://localhost:8000/audit/export/csv', this.violations(), {
      responseType: 'blob'
    }).subscribe(blob => this.downloadFile(blob, 'audit_report.csv'));
  }
  
  exportPdf() {
    this.http.post('http://localhost:8000/audit/export/pdf', this.violations(), {
      responseType: 'blob'
    }).subscribe(blob => this.downloadFile(blob, 'audit_report.pdf'));
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
