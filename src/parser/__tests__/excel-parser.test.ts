import * as fs from 'fs';
import * as path from 'path';
import { loadWorkbookFromBuffer, getSheetData, getHeaders, validateHeaders } from '../excel-parser';
import { SPECTORA_COLUMNS } from '../constants';

describe('Excel Parser', () => {
  const fixturePath = path.join(__dirname, 'fixtures', 'InterNACHI Residential -2026-09-20.xls');

  test('should load the fixture workbook', () => {
    const buffer = fs.readFileSync(fixturePath);
    const workbook = loadWorkbookFromBuffer(buffer);
    expect(workbook.SheetNames.length).toBeGreaterThan(0);
  });

  test('should extract headers correctly', () => {
    const buffer = fs.readFileSync(fixturePath);
    const workbook = loadWorkbookFromBuffer(buffer);
    const headers = getHeaders(workbook);
    expect(headers).toContain(SPECTORA_COLUMNS.SECTION_NAME);
    expect(headers).toContain(SPECTORA_COLUMNS.ITEM_NAME);
    expect(headers.length).toBe(42);
  });

  test('should validate headers successfully', () => {
    const buffer = fs.readFileSync(fixturePath);
    const workbook = loadWorkbookFromBuffer(buffer);
    const headers = getHeaders(workbook);
    const validation = validateHeaders(headers);
    expect(validation.valid).toBe(true);
    expect(validation.missing.length).toBe(0);
  });

  test('should parse rows into objects', () => {
    const buffer = fs.readFileSync(fixturePath);
    const workbook = loadWorkbookFromBuffer(buffer);
    const data = getSheetData(workbook);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty(SPECTORA_COLUMNS.SECTION_NAME);
  });
});
