export interface AssetViolation {
  id: string;
  violation_type: 'GHOST_ASSET' | 'WASTED_SPEND' | 'UNRECOVERED_ASSET';
  asset_tag: string | null;
  po_number: string | null;
  status: 'OPEN' | 'RESOLVED';
  resolution_reason: string | null;
  created_at: string;
  updated_at: string;

  // Enriched IT Inventory & Procurement details
  assigned_employee_id: string | null;
  inventory_status: string | null;
  physical_location_site: string | null;
  physical_location_room: string | null;
  procurement_status: string | null;
}

export interface ResolveViolationPayload {
  resolution_reason: string;
}
