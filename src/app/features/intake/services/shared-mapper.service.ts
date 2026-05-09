import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../../core/services/config.service';
import { UploadResponse, ConfirmMappingResponse } from '../models/intake.models';

@Injectable({
  providedIn: 'root'
})
export class SharedMapperService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  
  private get baseUrl() {
    return `${this.config.apiUrl}/intake`;
  }

  uploadFile(file: File, jobId: string): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${this.baseUrl}/upload`, formData, {
      params: { job_id: jobId }
    });
  }

  confirmMapping(jobId: string, mappings: Record<string, string>, schemaType?: string): Observable<ConfirmMappingResponse> {
    const payload = {
      mappings,
      schema_type: schemaType
    };
    return this.http.post<ConfirmMappingResponse>(`${this.baseUrl}/confirm/${jobId}`, payload);
  }
}
