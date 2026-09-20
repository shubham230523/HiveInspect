import { buildHierarchy } from '../hierarchy-builder';
import { NormalizedSpectoraRow } from '../normalized-models';
import { AnswerType } from '../../domain/enums';

describe('Generic Robustness', () => {
  const syntheticRows: Partial<NormalizedSpectoraRow>[] = [
    {
      sectionName: 'New Section',
      itemName: 'New Item',
      commentName: 'New Comment',
      commentText: 'Comment Text',
      order: 10,
      answerType: AnswerType.DATE,
      multipleChoiceOptions: [],
      rawMetadata: {},
    },
    {
      sectionName: 'Another Section',
      itemName: 'Another Item',
      commentName: 'Another Comment',
      commentText: 'Another Text',
      order: 5,
      answerType: 'Custom Type',
      multipleChoiceOptions: ['A', 'B'],
      rawMetadata: { someKey: 'someVal' },
    },
  ];

  test('should handle arbitrary section and item names', () => {
    const template = buildHierarchy('Synthetic', syntheticRows as NormalizedSpectoraRow[]);
    expect(template.sections.length).toBe(2);
    expect(template.sections[0].name).toBe('Another Section'); // Order 5 comes first
    expect(template.sections[1].name).toBe('New Section'); // Order 10 comes last
  });

  test('should preserve custom answer types and metadata', () => {
    const template = buildHierarchy('Synthetic', syntheticRows as NormalizedSpectoraRow[]);
    const anotherSection = template.sections.find(s => s.name === 'Another Section');
    const anotherItem = anotherSection?.items[0];
    expect(anotherItem?.answerType).toBe('Custom Type');
    expect(anotherItem?.metadata?.someKey).toBe('someVal');
    expect(anotherItem?.options).toEqual(['A', 'B']);
  });
});
