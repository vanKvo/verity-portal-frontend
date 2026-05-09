export interface IntakeSuggestion {
  header: string;
  target: string;
  confidence: number;
}

export interface UploadResponse {
  file_id: string;
  job_id: string;
  headers: string[];
  suggestions: IntakeSuggestion[];
}

export interface ConfirmMappingResponse {
  status: string;
  records_ingested: number;
}
