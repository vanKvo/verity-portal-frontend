import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ComplianceViolation, RosterUploadResponse, AuditRunResponse } from '../models/itar.models';
import { ConfigService } from '../../../core/services/config.service';
import { ColumnMapping } from '../../data-hub/models/data-hub.models';

@Injectable({
  providedIn: 'root'
})
export class ItarService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  
  private readonly baseUrl = `${this.config.apiUrl}/api/v1/itar`;
  
  violations = signal<ComplianceViolation[]>([]);
  alert = signal<{ message: string; type: 'success' | 'error' | 'info'; errors?: any[] } | null>(null);

  uploadRoster(file: File, mapping: ColumnMapping): Observable<RosterUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    return this.http.post<RosterUploadResponse>(`${this.baseUrl}/roster/upload`, formData);
  }

  runAudit(): Observable<AuditRunResponse> {
    return this.http.post<AuditRunResponse>(`${this.baseUrl}/audit/run`, {});
  }

  getViolations(): Observable<ComplianceViolation[]> {
    return this.http.get<ComplianceViolation[]>(`${this.baseUrl}/violations`);
  }

  resolveViolation(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/violations/${id}/resolve`, {});
  }
}
