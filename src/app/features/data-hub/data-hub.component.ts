import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { DataHubService } from './data-hub.service';
import { ShareMapperComponent, TargetAttribute } from '../../shared/components/share-mapper/share-mapper.component';
import { RouterModule, ActivatedRoute } from '@angular/router';

import { ColumnMapping, DataHubResponse, SyncStatus } from './models/data-hub.models';

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
export class DataHubComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  dataHubService = inject(DataHubService);
  private route = inject(ActivatedRoute);

  // Polling State
  private pollingInterval: any;

  // Ingestion Mode
  auditMode = signal<'asset_audit' | 'leaver_audit' | 'itar_audit' | null>(null);

  // Mapping State
  currentFile = signal<File | null>(null);
  currentType = signal<'personnel' | 'projects' | 'procurement' | 'inventory' | 'it_activity' | null>(null);
  headers = signal<string[]>([]);
  isUploading = signal(false);
  alert = signal<{ message: string; type: 'success' | 'error' | 'info'; errors?: any[] } | null>(null);
  syncStatus = signal<SyncStatus | null>(null);
  activeSidebarTab = signal<'personnel' | 'projects' | 'procurement' | 'inventory' | 'it_activity'>('personnel');

  // Session Ingestion Trackers
  personnelUploadedThisSession = signal(false);
  projectsUploadedThisSession = signal(false);
  procurementUploadedThisSession = signal(false);
  inventoryUploadedThisSession = signal(false);
  itActivityUploadedThisSession = signal(false);

  // Next action messaging
  nextActionMessage = computed(() => {
    const mode = this.auditMode();
    if (!mode) return '';

    if (mode === 'asset_audit') {
      const hasProc = this.procurementUploadedThisSession();
      const hasInv = this.inventoryUploadedThisSession();
      if (hasProc && hasInv) {
        return 'All required files successfully ingested! You can now view the reconciliation audit results.';
      } else if (hasProc && !hasInv) {
        return 'Procurement records ingested successfully! Next action: Select "IT Inventory" in the sidebar and upload the IT Inventory spreadsheet.';
      } else if (!hasProc && hasInv) {
        return 'IT Inventory records ingested successfully! Next action: Select "Procurement Records" in the sidebar and upload the Procurement spreadsheet.';
      } else {
        return 'To begin, select "Procurement Records" in the sidebar and upload your purchase orders spreadsheet.';
      }
    } else if (mode === 'leaver_audit') {
      const hasPers = this.personnelUploadedThisSession();
      const hasIt = this.itActivityUploadedThisSession();
      if (hasPers && hasIt) {
        return 'All required files successfully ingested! You can now view the leaver audit results.';
      } else if (hasPers && !hasIt) {
        return 'Personnel records ingested successfully! Next action: Select "IT Activity Logs" in the sidebar and upload the login activity spreadsheet.';
      } else if (!hasPers && hasIt) {
        return 'IT Activity logs ingested successfully! Next action: Select "Personnel & HR" in the sidebar and upload the HR roster spreadsheet.';
      } else {
        return 'To begin, select "Personnel & HR" in the sidebar and upload the HR roster spreadsheet.';
      }
    } else if (mode === 'itar_audit') {
      const hasPers = this.personnelUploadedThisSession();
      const hasProj = this.projectsUploadedThisSession();
      if (hasPers && hasProj) {
        return 'All required files successfully ingested! You can now view the ITAR compliance dashboard.';
      } else if (hasPers && !hasProj) {
        return 'Personnel records ingested successfully! Next action: Select "Project Governance" in the sidebar and upload the projects registry.';
      } else if (!hasPers && hasProj) {
        return 'Project Governance records ingested successfully! Next action: Select "Personnel & HR" in the sidebar and upload the HR roster spreadsheet.';
      } else {
        return 'To begin, select "Personnel & HR" in the sidebar and upload the HR roster spreadsheet.';
      }
    }
    return '';
  });

  isReconciliationComplete = computed(() => {
    const mode = this.auditMode();
    if (!mode) return false;
    if (mode === 'asset_audit') return this.procurementUploadedThisSession() && this.inventoryUploadedThisSession();
    if (mode === 'leaver_audit') return this.personnelUploadedThisSession() && this.itActivityUploadedThisSession();
    if (mode === 'itar_audit') return this.personnelUploadedThisSession() && this.projectsUploadedThisSession();
    return false;
  });

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

  readonly procurementAttributes: TargetAttribute[] = [
    { key: 'po_number', label: 'PO Number', required: true },
    { key: 'description', label: 'Description', required: false },
    { key: 'purchase_date', label: 'Purchase Date', required: false },
    { key: 'vendor', label: 'Vendor Name', required: false },
    { key: 'asset_category', label: 'Asset Category', required: false },
    { key: 'quantity', label: 'Quantity', required: false },
    { key: 'unit_price', label: 'Unit Price', required: false },
    { key: 'total_cost', label: 'Total Cost', required: false },
    { key: 'status', label: 'Status', required: false },
  ];

  readonly inventoryAttributes: TargetAttribute[] = [
    { key: 'asset_tag', label: 'Asset Tag', required: true },
    { key: 'po_number', label: 'PO Number', required: false },
    { key: 'serial_number', label: 'Serial Number', required: false },
    { key: 'assigned_employee_id', label: 'Assigned To', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'physical_location_site', label: 'Physical Site', required: false },
    { key: 'physical_location_room', label: 'Physical Room', required: false },
  ];

  readonly itActivityAttributes: TargetAttribute[] = [
    { key: 'employee_id', label: 'Employee ID', required: true },
    { key: 'last_system_login', label: 'Last Login Timestamp', required: true },
    { key: 'system_name', label: 'Target System', required: false },
    { key: 'user_name', label: 'User Name', required: false },
    { key: 'system_access_level', label: 'Access Level', required: false },
  ];

  get currentAttributes(): TargetAttribute[] {
    const type = this.currentType();
    if (type === 'personnel') return this.personnelAttributes;
    if (type === 'projects') return this.projectAttributes;
    if (type === 'procurement') return this.procurementAttributes;
    if (type === 'inventory') return this.inventoryAttributes;
    if (type === 'it_activity') return this.itActivityAttributes;
    return [];
  }

  ngOnInit() {
    this.loadSyncStatus();
    
    this.route.queryParams.subscribe(params => {
      const target = params['targetAudit'];
      if (target === 'asset_audit') {
        this.auditMode.set('asset_audit');
        if (this.authService.hasRole('ROLE_FINANCE')) {
          this.activeSidebarTab.set('procurement');
        } else if (this.authService.hasRole('ROLE_IT')) {
          this.activeSidebarTab.set('inventory');
        }
      } else if (target === 'leaver_audit') {
        this.auditMode.set('leaver_audit');
        if (this.authService.hasRole('ROLE_HR')) {
          this.activeSidebarTab.set('personnel');
        } else if (this.authService.hasRole('ROLE_IT') || this.authService.hasRole('ROLE_ECO')) {
          this.activeSidebarTab.set('it_activity');
        }
      } else if (target === 'itar_audit') {
        this.auditMode.set('itar_audit');
        if (this.authService.hasRole('ROLE_HR')) {
          this.activeSidebarTab.set('personnel');
        } else if (this.authService.hasRole('ROLE_ECO')) {
          this.activeSidebarTab.set('projects');
        }
      } else {
        this.auditMode.set(null);
        // Auto-select tab they actually have permissions to see
        if (this.authService.hasRole('ROLE_HR')) {
          this.activeSidebarTab.set('personnel');
        } else if (this.authService.hasRole('ROLE_ECO')) {
          this.activeSidebarTab.set('projects');
        } else if (this.authService.hasRole('ROLE_FINANCE')) {
          this.activeSidebarTab.set('procurement');
        } else if (this.authService.hasRole('ROLE_IT')) {
          this.activeSidebarTab.set('inventory');
        }
      }
    });
  }

  ngOnDestroy() {
    // if (this.pollingInterval) {
    //   clearInterval(this.pollingInterval);
    // }
  }

  loadSyncStatus() {
    this.dataHubService.getSyncStatus().subscribe({
      next: (status) => this.syncStatus.set(status),
      error: (err) => console.error('Failed to load sync status', err)
    });
  }

  onFileSelected(event: Event, type: 'personnel' | 'projects' | 'procurement' | 'inventory' | 'it_activity') {
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

    let upload$: import('rxjs').Observable<DataHubResponse>;
    if (type === 'personnel') upload$ = this.dataHubService.uploadPersonnel(file, mapping);
    else if (type === 'projects') upload$ = this.dataHubService.uploadProjects(file, mapping);
    else if (type === 'procurement') upload$ = this.dataHubService.uploadProcurement(file, mapping);
    else if (type === 'inventory') upload$ = this.dataHubService.uploadInventory(file, mapping);
    else upload$ = this.dataHubService.uploadItActivity(file, mapping);

    upload$.subscribe({
      next: (response: DataHubResponse) => {
        let typeName = 'Data';
        if (type === 'personnel') {
          typeName = 'HR';
          if (response.success_count > 0) {
            this.personnelUploadedThisSession.set(true);
          }
        }
        else if (type === 'projects') {
          typeName = 'Project';
          if (response.success_count > 0) {
            this.projectsUploadedThisSession.set(true);
          }
        }
        else if (type === 'procurement') {
          typeName = 'Procurement';
          if (response.success_count > 0) {
            this.procurementUploadedThisSession.set(true);
          }
        }
        else if (type === 'inventory') {
          typeName = 'Inventory';
          if (response.success_count > 0) {
            this.inventoryUploadedThisSession.set(true);
          }
        }
        else if (type === 'it_activity') {
          typeName = 'IT Activity';
          if (response.success_count > 0) {
            this.itActivityUploadedThisSession.set(true);
          }
        }
        const msg = `${typeName} Data Uploaded: ${response.success_count} success, ${response.error_count} errors`;
        this.alert.set({
          message: msg,
          type: response.error_count > 0 ? 'info' : 'success',
          errors: response.errors
        });
        this.reset();
        this.loadSyncStatus();
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
