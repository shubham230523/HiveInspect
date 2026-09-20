import { buildHierarchy } from '../hierarchy-builder';
import { NormalizedSpectoraRow } from '../normalized-models';

describe('Hierarchy Builder', () => {
  const mockRows: Partial<NormalizedSpectoraRow>[] = [
    {
      sectionName: 'Exterior',
      itemName: 'Siding',
      commentName: 'Cracked',
      commentText: 'Siding is cracked',
      order: 1,
    },
    {
      sectionName: 'Exterior',
      itemName: 'Siding',
      commentName: 'Missing',
      commentText: 'Siding is missing',
      order: 2,
    },
    {
      sectionName: 'Roof',
      itemName: 'Shingles',
      commentName: 'Damaged',
      commentText: 'Shingles are damaged',
      order: 1,
    },
  ];

  test('should build hierarchy with correct counts', () => {
    const template = buildHierarchy('Test Template', mockRows as NormalizedSpectoraRow[]);
    expect(template.sections.length).toBe(2); // Exterior, Roof
    const exterior = template.sections.find(s => s.name === 'Exterior');
    expect(exterior?.items.length).toBe(1); // Siding
    expect(exterior?.items[0].comments.length).toBe(2); // Cracked, Missing
  });

  test('should preserve ordering', () => {
    const template = buildHierarchy('Test Template', mockRows as NormalizedSpectoraRow[]);
    const exterior = template.sections.find(s => s.name === 'Exterior');
    expect(exterior?.items[0].comments[0].name).toBe('Cracked');
    expect(exterior?.items[0].comments[1].name).toBe('Missing');
  });

  test('should group items under correct sections', () => {
    const template = buildHierarchy('Test Template', mockRows as NormalizedSpectoraRow[]);
    const roof = template.sections.find(s => s.name === 'Roof');
    expect(roof?.items[0].name).toBe('Shingles');
  });
});
