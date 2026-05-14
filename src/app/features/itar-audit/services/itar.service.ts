import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ComplianceViolation, RosterUploadResponse, AuditRunResponse } from '../models/itar.models';
import { ConfigService } from '../../../core/services/config.service';

@Injectable({
  providedIn: 'root'
})
export class ItarService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  
  private readonly baseUrl = `${this.config.apiUrl}/api/v1/itar`;

  private getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }


  uploadRoster(file: File): Observable<RosterUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<RosterUploadResponse>(`${this.baseUrl}/roster/upload`, formData, this.getHeaders());

  }

  runAudit(): Observable<AuditRunResponse> {
    return this.http.post<AuditRunResponse>(`${this.baseUrl}/audit/run`, {}, this.getHeaders());

  }

  getViolations(): Observable<ComplianceViolation[]> {
    return this.http.get<ComplianceViolation[]>(`${this.baseUrl}/violations`, this.getHeaders());

  }

  resolveViolation(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/violations/${id}/resolve`, {}, this.getHeaders());

  }
}
