import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  
  private get baseUrl() {
    return `${this.config.apiUrl}/audit`;
  }

  runAudit(hrJobId: string, itJobId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/leaver-mover`, {
      hr_job_id: hrJobId,
      access_job_id: itJobId
    });
  }

  exportCsv(violations: any[]): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/export/csv`, violations, {
      responseType: 'blob'
    });
  }

  exportPdf(violations: any[]): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/export/pdf`, violations, {
      responseType: 'blob'
    });
  }
}
