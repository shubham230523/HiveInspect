import * as XLSX from 'xlsx';
import { importSpectoraXls } from '../importer';

describe('Failure Cases', () => {
  test('should fail gracefully when required headers are missing', async () => {
    // Create a workbook with wrong headers
    const ws = XLSX.utils.json_to_sheet([{ 'Wrong Header': 'Value' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = await importSpectoraXls(buffer, 'Invalid Template');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Missing required headers');
  });

  test('should handle invalid files', async () => {
    const result = await importSpectoraXls(Buffer.from('not an excel file'), 'Garbage');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/Missing required headers|Import failed/);
  });
});
