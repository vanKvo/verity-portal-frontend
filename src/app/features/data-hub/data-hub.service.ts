import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../core/services/config.service';

import { ColumnMapping, DataHubResponse } from './models/data-hub.models';

@Injectable({
  providedIn: 'root'
})
export class DataHubService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  
  private readonly baseUrl = `${this.config.apiUrl}/data-hub`;

  uploadPersonnel(file: File, mapping: ColumnMapping | null = null): Observable<DataHubResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (mapping) {
      formData.append('mapping', JSON.stringify(mapping));
    }
    return this.http.post<DataHubResponse>(`${this.baseUrl}/personnel/upload`, formData);
  }

  uploadProjects(file: File, mapping: ColumnMapping | null = null): Observable<DataHubResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (mapping) {
      formData.append('mapping', JSON.stringify(mapping));
    }
    return this.http.post<DataHubResponse>(`${this.baseUrl}/projects/upload`, formData);
  }
}
