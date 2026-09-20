import { loadWorkbook, getHeaders, getSheetData, validateHeaders } from './excel-parser';
import { mapRawRow } from './mapper';
import { buildHierarchy } from './hierarchy-builder';
import { ImportResult, TemplateWithHierarchy } from '../domain/models';
import { SPECTORA_COLUMNS } from './constants';

export async function importSpectoraXls(
  data: ArrayBuffer | Uint8Array,
  templateName: string
): Promise<ImportResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const unsupportedFields: string[] = [];
  const malformedRows: number[] = [];

  try {
    const workbook = loadWorkbook(data);
    const headers = getHeaders(workbook);
    const validation = validateHeaders(headers);

    if (!validation.valid) {
      errors.push(`Missing required headers: ${validation.missing.join(', ')}`);
      return createEmptyResult(errors);
    }

    // Identify unsupported fields
    const allSpectoraFields = Object.values(SPECTORA_COLUMNS);
    headers.forEach(header => {
      if (!allSpectoraFields.includes(header as any)) {
        unsupportedFields.push(header);
      }
    });

    const rawRows = getSheetData(workbook);
    const normalizedRows = rawRows.map((raw, index) => {
      try {
        return mapRawRow(raw);
      } catch (e) {
        malformedRows.push(index + 2); // +2 for 1-based index and header row
        return null;
      }
    }).filter((r): r is any => r !== null);

    const template = buildHierarchy(templateName, normalizedRows);

    // Additional validation for HTML and statistics
    let commentsCreated = 0;
    let itemsCreated = 0;
    template.sections.forEach(s => {
      itemsCreated += s.items.length;
      s.items.forEach(i => {
        commentsCreated += i.comments.length;
        i.comments.forEach(c => {
          if (c.text.includes('<') && c.text.includes('>')) {
            // HTML detected and preserved
          }
        });
      });
    });

    // Check for specific unsupported fields that have data
    const photoFields = Array.from({ length: 10 }, (_, i) => `Default Photo ${i + 1}`);
    photoFields.forEach(field => {
      const hasData = rawRows.some(row => row[field]);
      if (hasData) {
        warnings.push(`${field} contains data but photo migration is not currently supported.`);
      }
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
      unsupportedFields,
      malformedRows,
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
