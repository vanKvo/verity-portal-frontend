export interface AssetViolation {
  id: string;
  violation_type: 'GHOST_ASSET' | 'WASTED_SPEND';
  asset_tag: string | null;
  po_number: string | null;
  status: 'OPEN' | 'RESOLVED';
  resolution_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResolveViolationPayload {
  resolution_reason: string;
}
