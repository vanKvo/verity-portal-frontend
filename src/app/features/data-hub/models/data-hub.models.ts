export interface ColumnMapping {
  [key: string]: string;
}

export interface IngestionError {
  row: number;
  error: string;
}

export interface DataHubResponse {
  success_count: number;
  error_count: number;
  errors: IngestionError[];
}

export interface SyncStatus {
  personnel_last_sync: string | null;
  projects_last_sync: string | null;
}
