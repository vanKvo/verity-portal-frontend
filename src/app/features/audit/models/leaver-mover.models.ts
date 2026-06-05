export interface LeaverViolation {
  id: string;
  employee_id: string;
  hr_termination_date: string; // ISO date format (YYYY-MM-DD)
  last_system_login: string;     // ISO timestamp format
  system_name?: string;
  ip_address?: string;
  status: 'OPEN' | 'RESOLVED';
  resolution_reason?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaverViolationResolve {
  resolution_reason: string;
}
