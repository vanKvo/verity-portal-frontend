import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { DataHubService } from './data-hub.service';
import { ShareMapperComponent, TargetAttribute } from '../../shared/components/share-mapper/share-mapper.component';
import { RouterModule } from '@angular/router';

import { ColumnMapping, DataHubResponse } from './models/data-hub.models';

@Component({
  selector: 'app-data-hub',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    ShareMapperComponent,
    RouterModule
  ],
  templateUrl: './data-hub.component.html',
  styleUrls: ['./data-hub.component.css']
})
export class DataHubComponent {
  authService = inject(AuthService);
  dataHubService = inject(DataHubService);

  // Mapping State
  currentFile = signal<File | null>(null);
  currentType = signal<'personnel' | 'projects' | null>(null);
  headers = signal<string[]>([]);
  isUploading = signal(false);
  alert = signal<{ message: string; type: 'success' | 'error' | 'info'; errors?: any[] } | null>(null);

  readonly personnelAttributes: TargetAttribute[] = [
    { key: 'employee_id', label: 'Employee ID', required: true },
    { key: 'first_name', label: 'First Name', required: true },
    { key: 'last_name', label: 'Last Name', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'citizenship_status', label: 'Citizenship Status', required: true },
    { key: 'termination_date', label: 'Termination Date', required: true },
  ];

  readonly projectAttributes: TargetAttribute[] = [
    { key: 'project_id', label: 'Project ID', required: true },
    { key: 'name', label: 'Project Name', required: true },
    { key: 'sensitivity', label: 'Sensitivity Level', required: true },
    { key: 'department', label: 'Department', required: false },
    { key: 'export_control_status', label: 'Export Control Status', required: false },
  ];

  get currentAttributes(): TargetAttribute[] {
    return this.currentType() === 'personnel' ? this.personnelAttributes : this.projectAttributes;
  }

  onFileSelected(event: Event, type: 'personnel' | 'projects') {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file: File = input.files[0];
    this.currentFile.set(file);
    this.currentType.set(type);

    this.isUploading.set(true);
    this.dataHubService.parseHeaders(file).subscribe({
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
    const type = this.currentType();

    if (!file || !type) return;

    this.isUploading.set(true);
    this.alert.set(null); // Clear previous alerts

    const upload$ = type === 'personnel'
      ? this.dataHubService.uploadPersonnel(file, mapping)
      : this.dataHubService.uploadProjects(file, mapping);

    upload$.subscribe({
      next: (response: DataHubResponse) => {
        const msg = `${type === 'personnel' ? 'HR' : 'Project'} Data Uploaded: ${response.success_count} success, ${response.error_count} errors`;
        this.alert.set({
          message: msg,
          type: response.error_count > 0 ? 'info' : 'success',
          errors: response.errors
        });
        this.reset();
      },
      error: (err) => {
        let errMsg = 'Upload Failed: An unexpected error occurred. Please contact the website administrator for support.';
        if (err.status === 400) {
          errMsg = 'Upload Failed: Invalid file format or invalid columns. Please check that you are uploading a valid CSV spreadsheet and try again.';
          if (err.error?.detail) {
            errMsg += ` (${err.error.detail})`;
          }
        } else if (err.status === 401 || err.status === 403) {
          errMsg = 'Upload Failed: Insufficient permissions or session expired. Please log in again.';
        } else if (err.error?.detail) {
          errMsg = 'Upload Failed: ' + err.error.detail;
        } else if (err.message) {
          errMsg = 'Upload Failed: ' + err.message;
        }
        this.alert.set({ message: errMsg, type: 'error' });
        this.isUploading.set(false);
      }
    });
  }

  closeAlert() {
    this.alert.set(null);
  }

  reset() {
    this.currentFile.set(null);
    this.currentType.set(null);
    this.headers.set([]);
    this.isUploading.set(false);
  }
}
