import { createAlternativeTemplate } from '../fixtures/Alternative_Template';
import { importSpectoraXls } from '../importer';

describe('Alternative Template Robustness', () => {
  test('should import synthetic alternative template correctly', async () => {
    const buffer = createAlternativeTemplate();
    const result = await importSpectoraXls(buffer, 'Alternative');

    expect(result.success).toBe(true);
    expect(result.sectionsCreated).toBe(2); // Kitchen, Basement
    expect(result.itemsCreated).toBe(3); // Sink, Dishwasher, Walls
    expect(result.commentsCreated).toBe(3);

    const kitchen = result.template?.sections.find((s: any) => s.name === 'Kitchen');
    expect(kitchen).toBeDefined();
    expect(kitchen?.items.length).toBe(2);

    const dishwasher = kitchen?.items.find((i: any) => i.name === 'Dishwasher');
    expect(dishwasher?.options).toEqual(['Clogged', 'Pump failure']);
  });
});
