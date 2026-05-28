import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../core/services/config.service';
import { AssetViolation, ResolveViolationPayload } from './models/asset-audit.models';

@Injectable({
  providedIn: 'root'
})
export class AssetAuditService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private readonly baseUrl = `${this.config.apiUrl}/asset-audit/violations`;

  getViolations(skip: number = 0, limit: number = 100): Observable<AssetViolation[]> {
    return this.http.get<AssetViolation[]>(`${this.baseUrl}?skip=${skip}&limit=${limit}`);
  }

  resolveViolation(id: string, payload: ResolveViolationPayload): Observable<{message: string}> {
    return this.http.post<{message: string}>(`${this.baseUrl}/${id}/resolve`, payload);
  }
}
