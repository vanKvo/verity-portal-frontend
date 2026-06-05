export interface ProjectAssignment {
  id: string;
  project_id: string;
  employee_id: string;
  last_verified_at: string;
}

export interface ComplianceViolation {
  id: string;
  employee_id: string;
  project_id: string;
  citizenship: string;
  sensitivity: string;
  status: 'OPEN' | 'RESOLVED';
  resolution_reason?: string;
  resolved_by?: string;
  notes: string;
  created_at: string;
  resolved_at?: string;
}

export interface RosterUploadResponse {
  success_count: number;
  error_count: number;
  errors: any[];
}

export interface AuditRunResponse {
  message: string;
  violations_detected: number;
  auto_resolved: number;
}
