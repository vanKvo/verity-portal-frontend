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
