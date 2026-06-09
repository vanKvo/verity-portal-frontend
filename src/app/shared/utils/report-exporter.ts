import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { AssetViolation } from '../../features/asset-audit-dashboard/models/asset-audit.models';
import { LeaverViolation } from '../../features/leaver-audit/models/leaver-mover.models';
import { ComplianceViolation } from '../../features/itar-audit/models/itar.models';

// Initialize the virtual file system for pdfmake fonts using default/commonjs compatibility imports
const vfs = pdfFonts && (pdfFonts as any).pdfMake && (pdfFonts as any).pdfMake.vfs
  ? (pdfFonts as any).pdfMake.vfs
  : pdfFonts;
(pdfMake as any).vfs = vfs;

/**
 * Generic utility to export an array of typed objects to CSV format.
 */
export function exportToCsv<T>(data: T[], headers: { key: keyof T; label: string }[], filename: string): void {
  const csvHeaders = headers.map(h => `"${String(h.label).replace(/"/g, '""')}"`).join(',');
  const csvRows = data.map(row => {
    return headers.map(h => {
      const val = row[h.key];
      const valStr = val !== null && val !== undefined ? String(val) : '';
      return `"${valStr.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = '\ufeff' + [csvHeaders, ...csvRows].join('\n'); // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a formal compliance PDF for Asset Reconciliation.
 */
export function exportAssetAuditPdf(violations: AssetViolation[]): void {
  const dateStr = new Date().toLocaleString();
  const bodyData: string[][] = [
    ['Asset Tag', 'PO Number', 'Type', 'Custody', 'Status', 'Location', 'Resolution Reason']
  ];

  violations.forEach(v => {
    bodyData.push([
      v.asset_tag || 'N/A',
      v.po_number || 'N/A',
      v.violation_type || 'N/A',
      v.assigned_employee_id || 'Unassigned',
      v.status || 'OPEN',
      v.physical_location_site ? `${v.physical_location_site} - Room ${v.physical_location_room || 'N/A'}` : 'N/A',
      v.resolution_reason || 'N/A'
    ]);
  });

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'VERITY PORTAL - COMPLIANCE REPORT', style: 'mainHeader' },
      { text: 'Asset & Purchase Order Reconciliation Audit', style: 'subHeader' },
      { text: `Report Generation Date: ${dateStr}`, style: 'metaText' },
      { text: `Total Violation Scope: ${violations.length} anomalies flagged`, style: 'metaText' },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
          body: bodyData
        },
        layout: 'lightHorizontalLines'
      }
    ],
    styles: {
      mainHeader: {
        fontSize: 16,
        bold: true,
        color: '#1a237e',
        margin: [0, 0, 0, 4]
      },
      subHeader: {
        fontSize: 12,
        bold: true,
        color: '#37474f',
        margin: [0, 0, 0, 8]
      },
      metaText: {
        fontSize: 9,
        color: '#666666',
        margin: [0, 2, 0, 2]
      }
    },
    defaultStyle: {
      fontSize: 9
    }
  };

  pdfMake.createPdf(docDefinition).download(`Asset_Audit_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Generates and downloads a formal compliance PDF for Leaver / Access logs.
 */
export function exportLeaverAuditPdf(violations: LeaverViolation[]): void {
  const dateStr = new Date().toLocaleString();
  const bodyData: string[][] = [
    ['Employee ID', 'Termination Date', 'Last System Login', 'System Name', 'IP Address', 'Status', 'Resolution Reason']
  ];

  violations.forEach(v => {
    bodyData.push([
      v.employee_id || 'N/A',
      v.hr_termination_date || 'N/A',
      v.last_system_login || 'N/A',
      v.system_name || 'N/A',
      v.ip_address || 'N/A',
      v.status || 'OPEN',
      v.resolution_reason || 'N/A'
    ]);
  });

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'VERITY PORTAL - COMPLIANCE REPORT', style: 'mainHeader' },
      { text: 'Leaver & Mover Access Audit (NIST SP 800-171 / CMMC)', style: 'subHeader' },
      { text: `Report Generation Date: ${dateStr}`, style: 'metaText' },
      { text: `Total Violation Scope: ${violations.length} anomalies flagged`, style: 'metaText' },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
          body: bodyData
        },
        layout: 'lightHorizontalLines'
      }
    ],
    styles: {
      mainHeader: {
        fontSize: 16,
        bold: true,
        color: '#1a237e',
        margin: [0, 0, 0, 4]
      },
      subHeader: {
        fontSize: 12,
        bold: true,
        color: '#37474f',
        margin: [0, 0, 0, 8]
      },
      metaText: {
        fontSize: 9,
        color: '#666666',
        margin: [0, 2, 0, 2]
      }
    },
    defaultStyle: {
      fontSize: 9
    }
  };

  pdfMake.createPdf(docDefinition).download(`Leaver_Audit_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Generates and downloads a formal compliance PDF for ITAR Project Sensitivity.
 */
export function exportItarAuditPdf(violations: ComplianceViolation[]): void {
  const dateStr = new Date().toLocaleString();
  const bodyData: string[][] = [
    ['Employee ID', 'Project ID', 'Citizenship', 'Sensitivity', 'Status', 'Notes', 'Resolution Reason']
  ];

  violations.forEach(v => {
    bodyData.push([
      v.employee_id || 'N/A',
      v.project_id || 'N/A',
      v.citizenship || 'N/A',
      v.sensitivity || 'N/A',
      v.status || 'OPEN',
      v.notes || 'N/A',
      v.resolution_reason || 'N/A'
    ]);
  });

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'VERITY PORTAL - COMPLIANCE REPORT', style: 'mainHeader' },
      { text: 'ITAR & Export Control - Citizenship and Project Sensitivity Audit', style: 'subHeader' },
      { text: `Report Generation Date: ${dateStr}`, style: 'metaText' },
      { text: `Total Violation Scope: ${violations.length} anomalies flagged`, style: 'metaText' },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
          body: bodyData
        },
        layout: 'lightHorizontalLines'
      }
    ],
    styles: {
      mainHeader: {
        fontSize: 16,
        bold: true,
        color: '#1a237e',
        margin: [0, 0, 0, 4]
      },
      subHeader: {
        fontSize: 12,
        bold: true,
        color: '#37474f',
        margin: [0, 0, 0, 8]
      },
      metaText: {
        fontSize: 9,
        color: '#666666',
        margin: [0, 2, 0, 2]
      }
    },
    defaultStyle: {
      fontSize: 9
    }
  };

  pdfMake.createPdf(docDefinition).download(`ITAR_Audit_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
