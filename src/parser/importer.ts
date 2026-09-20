import { loadWorkbook, getHeaders, getSheetData, validateHeaders } from './excel-parser';
import { mapRawRow } from './mapper';
import { buildHierarchy } from './hierarchy-builder';
import { ImportResult, TemplateWithHierarchy, FieldCoverageInfo } from '../domain/models';
import { SPECTORA_COLUMNS, FIELD_COVERAGE, FieldState } from './constants';

export async function importSpectoraXls(
  data: ArrayBuffer | Uint8Array,
  templateName: string
): Promise<ImportResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const malformedRows: number[] = [];

  try {
    const workbook = loadWorkbook(data);
    const headers = getHeaders(workbook);
    const validation = validateHeaders(headers);

    if (!validation.valid) {
      errors.push(`Missing required headers: ${validation.missing.join(', ')}`);
      return createEmptyResult(errors);
    }

    const rawRows = getSheetData(workbook);

    // Analyze Field Coverage
    const fieldCoverage: FieldCoverageInfo = {
      supported: [],
      metadata: [],
      unsupported: [],
      missing: [],
    };

    const allSourceColumns = Object.values(SPECTORA_COLUMNS);
    allSourceColumns.forEach(col => {
      const isPresent = headers.includes(col);
      const classification = FIELD_COVERAGE[col];

      if (!isPresent) {
        fieldCoverage.missing.push(col);
      } else {
        if (classification === FieldState.SUPPORTED) fieldCoverage.supported.push(col);
        else if (classification === FieldState.PRESERVED_METADATA) fieldCoverage.metadata.push(col);
        else if (classification === FieldState.UNSUPPORTED_BUT_DETECTED) {
          // Check if it actually contains data
          const hasData = rawRows.some(row => String(row[col] || '').trim() !== '');
          if (hasData) {
            fieldCoverage.unsupported.push(col);
            warnings.push(`${col} contains data but photo migration is not currently supported.`);
          }
        }
      }
    });

    const normalizedRows = rawRows.map((raw, index) => {
      try {
        return mapRawRow(raw);
      } catch (e) {
        malformedRows.push(index + 2);
        return null;
      }
    }).filter((r): r is any => r !== null);

    const template = buildHierarchy(templateName, normalizedRows);

    let commentsCreated = 0;
    let itemsCreated = 0;
    template.sections.forEach(s => {
      itemsCreated += s.items.length;
      s.items.forEach(i => {
        commentsCreated += i.comments.length;
      });
    });

    return {
      success: true,
      template,
      rowsProcessed: rawRows.length,
      sectionsCreated: template.sections.length,
      itemsCreated,
      commentsCreated,
      warnings,
      errors,
      unsupportedFields: fieldCoverage.unsupported,
      malformedRows,
      fieldCoverage,
    };
  } catch (e) {
    errors.push(`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    return createEmptyResult(errors);
  }
}

function createEmptyResult(errors: string[]): ImportResult {
  return {
    success: false,
    rowsProcessed: 0,
    sectionsCreated: 0,
    itemsCreated: 0,
    commentsCreated: 0,
    warnings: [],
    errors,
    unsupportedFields: [],
    malformedRows: [],
  };
}
