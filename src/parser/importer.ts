import { loadWorkbook, getHeaders, getSheetData, validateHeaders } from './excel-parser';
import { mapRawRow } from \u0027./mapper\u0027;
import { buildHierarchy } from \u0027./hierarchy-builder\u0027;
import { ImportResult, TemplateWithHierarchy, FieldCoverageInfo, RowWarning } from \u0027../domain/models\u0027;
import { SPECTORA_COLUMNS, FIELD_COVERAGE, FieldState } from \u0027./constants\u0027;

export async function importSpectoraXls(
  data: ArrayBuffer | Uint8Array,
  templateName: string
): Promise<ImportResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const malformedRows: number[] = [];
  const rowWarnings: RowWarning[] = [];

  try {
    const workbook = loadWorkbook(data);
    const headers = getHeaders(workbook);
    const validation = validateHeaders(headers);

    if (!validation.valid) {
      errors.push(`Missing required headers: ${validation.missing.join(\u0027, \u0027)}`);
      return createEmptyResult(errors);
    }

    const rawRows = getSheetData(workbook);

    // Identify unsupported fields that contain data per row
    const unsupportedColsWithData = Object.entries(FIELD_COVERAGE)
      .filter(([_, state]) =\u003e state === FieldState.UNSUPPORTED_BUT_DETECTED)
      .map(([col]) =\u003e col)
      .filter(col =\u003e headers.includes(col));

    rawRows.forEach((row, index) =\u003e {
      unsupportedColsWithData.forEach(col =\u003e {
        if (String(row[col] || \u0027\u0027).trim() !== \u0027\u0027) {
          rowWarnings.push({
            row: index + 2,
            section: String(row[SPECTORA_COLUMNS.SECTION_NAME] || \u0027\u0027),
            item: String(row[SPECTORA_COLUMNS.ITEM_NAME] || \u0027\u0027),
            field: col,
            message: `${col} contains data but photo migration is not supported.`,
          });
        }
      });
    });

    // Analyze Field Coverage for the report
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
      rowWarnings,
      preservationStats: {
        source: {
          rows: rawRows.length,
          sections: new Set(rawRows.map(r =\u003e String(r[SPECTORA_COLUMNS.SECTION_NAME] || \u0027\u0027).trim())).size,
          items: new Set(rawRows.map(r =\u003e `${r[SPECTORA_COLUMNS.SECTION_NAME]}|${r[SPECTORA_COLUMNS.ITEM_NAME]}`)).size,
          comments: rawRows.filter(r =\u003e r[SPECTORA_COLUMNS.COMMENT_NAME] || r[SPECTORA_COLUMNS.COMMENT_TEXT]).length,
        },
        imported: {
          sections: template.sections.length,
          items: itemsCreated,
          comments: commentsCreated,
        }
      }
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
