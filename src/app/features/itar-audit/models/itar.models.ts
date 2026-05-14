export interface ProjectAssignment {
  id: string;
  project_id: string;
  personnel_id: string;
  last_verified_at: string;
}

export interface ComplianceViolation {
  id: string;
  personnel_id: string;
  project_id: string;
  status: 'OPEN' | 'RESOLVED';
  notes: string;
  created_at: string;
}

export interface RosterUploadResponse {
  message: string;
}

export interface AuditRunResponse {
  message: string;
  violations_detected: number;
}
