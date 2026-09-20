import * as XLSX from 'xlsx';
import { REQUIRED_HEADERS } from './constants';

export function loadWorkbook(data: ArrayBuffer | Uint8Array): XLSX.WorkBook {
  try {
    const workbook = XLSX.read(data, { type: 'array' });
    return workbook;
  } catch (error) {
    throw new Error(`Failed to load workbook: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function loadWorkbookFromBuffer(buffer: Buffer): XLSX.WorkBook {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    return workbook;
  } catch (error) {
    throw new Error(`Failed to load workbook from buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getSheetData(workbook: XLSX.WorkBook, sheetIndex = 0): any[] {
  if (workbook.SheetNames.length === 0) {
    throw new Error('Workbook contains no sheets');
  }
  const sheetName = workbook.SheetNames[sheetIndex];
  if (!sheetName) {
    throw new Error(`Sheet at index ${sheetIndex} not found`);
  }
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { defval: '' });
}

export function validateHeaders(headers: string[]): { valid: boolean; missing: string[] } {
  const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h));
  return {
    valid: missing.length === 0,
    missing,
  };
}

export function getHeaders(workbook: XLSX.WorkBook, sheetIndex = 0): string[] {
  const sheetName = workbook.SheetNames[sheetIndex];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];
  const ref = worksheet['!ref'];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  const headers: string[] = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
    if (cell && cell.t) {
      headers.push(XLSX.utils.format_cell(cell));
    }
  }
  return headers;
}
