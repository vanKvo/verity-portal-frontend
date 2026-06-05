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
import { AssetAuditService } from './asset-audit.service';
import { AssetViolation } from './models/asset-audit.models';
import { AuthService } from '../../core/services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-asset-audit-dashboard',
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
  templateUrl: './asset-audit-dashboard.component.html',
  styleUrls: ['./asset-audit-dashboard.component.css']
})
export class AssetAuditDashboardComponent implements OnInit {
  private auditService = inject(AssetAuditService);
  public authService = inject(AuthService);

  violations = signal<AssetViolation[]>([]);
  openViolations = computed(() => this.violations().filter(v => v.status === 'OPEN'));
  resolvedViolations = computed(() => this.violations().filter(v => v.status === 'RESOLVED'));

  displayedColumns: string[] = [
    'type', 
    'asset_tag', 
    'po_number', 
    'custody', 
    'status_reconciliation', 
    'location', 
    'directive', 
    'created_at', 
    'actions'
  ];
  
  resolvedColumns: string[] = [
    'type', 
    'asset_tag', 
    'po_number', 
    'custody', 
    'status_reconciliation', 
    'location', 
    'created_at', 
    'resolution_reason'
  ];

  resolvingViolation = signal<AssetViolation | null>(null);
  resolutionReason = '';

  ngOnInit() {
    this.loadViolations();
  }

  loadViolations() {
    this.auditService.getViolations().subscribe({
      next: (data) => this.violations.set(data),
      error: (err) => console.error('Failed to load violations', err)
    });
  }

  getViolationChipColor(type: string): string {
    if (type === 'GHOST_ASSET') return 'warn';
    if (type === 'UNRECOVERED_ASSET') return 'accent';
    return 'primary';
  }

  getStatusChipColor(status: string): string {
    return status === 'OPEN' ? 'warn' : 'primary';
  }

  getActionDirective(element: AssetViolation): string {
    if (element.violation_type === 'GHOST_ASSET') return 'Link / Procure PO';
    if (element.violation_type === 'WASTED_SPEND') return 'Retire / Deactivate PO';
    if (element.violation_type === 'UNRECOVERED_ASSET') return 'Recover Physical Device';
    return 'Review Asset';
  }

  getActionDirectiveIcon(element: AssetViolation): string {
    if (element.violation_type === 'GHOST_ASSET') return 'receipt_long';
    if (element.violation_type === 'WASTED_SPEND') return 'cancel';
    if (element.violation_type === 'UNRECOVERED_ASSET') return 'assignment_return';
    return 'help_outline';
  }

  resolveViolation(violation: AssetViolation) {
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
        alert("Violation resolved successfully!");
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
