import { mapRawRow } from '../mapper';
import { SPECTORA_COLUMNS } from '../constants';
import { SpectoraRawRow } from '../types';
import { AnswerType } from '../../domain/enums';

describe('Spectora Mapper', () => {
  const mockRawRow: SpectoraRawRow = {
    [SPECTORA_COLUMNS.SECTION_NAME]: 'Exterior',
    [SPECTORA_COLUMNS.ITEM_NAME]: 'Siding',
    [SPECTORA_COLUMNS.COMMENT_NAME]: 'Cracked',
    [SPECTORA_COLUMNS.COMMENT_TEXT]: '<p>Siding is cracked</p>',
    [SPECTORA_COLUMNS.COMMENT_TYPE]: 'Observation',
    [SPECTORA_COLUMNS.CATEGORY]: 'Major',
    [SPECTORA_COLUMNS.MULTIPLE_CHOICE_OPTIONS]: 'Option 1 | Option 2',
    [SPECTORA_COLUMNS.ORDER]: 5,
    [SPECTORA_COLUMNS.LOCKED]: 'true',
    [SPECTORA_COLUMNS.ANSWER_TYPE]: 'boolean',
    [SPECTORA_COLUMNS.DEFAULT_PHOTO_1]: 'http://example.com/photo1.jpg',
    [SPECTORA_COLUMNS.DEFAULT_PHOTO_1_CAPTION]: 'Photo 1',
  } as any;

  test('should map core fields correctly', () => {
    const normalized = mapRawRow(mockRawRow);
    expect(normalized.sectionName).toBe('Exterior');
    expect(normalized.itemName).toBe('Siding');
    expect(normalized.commentName).toBe('Cracked');
    expect(normalized.commentText).toBe('<p>Siding is cracked</p>');
    expect(normalized.commentType).toBe('Observation');
    expect(normalized.category).toBe('Major');
    expect(normalized.answerType).toBe(AnswerType.BOOLEAN);
  });

  test('should normalize answer type', () => {
    const row = { ...mockRawRow, [SPECTORA_COLUMNS.ANSWER_TYPE]: 'Multiple Choice' };
    const normalized = mapRawRow(row as any);
    expect(normalized.answerType).toBe(AnswerType.CHECKBOX);
  });

  test('should preserve unknown answer type', () => {
    const row = { ...mockRawRow, [SPECTORA_COLUMNS.ANSWER_TYPE]: 'Super Fancy Type' };
    const normalized = mapRawRow(row as any);
    expect(normalized.answerType).toBe('Super Fancy Type');
  });

  test('should parse multiple choice options', () => {
    const normalized = mapRawRow(mockRawRow);
    expect(normalized.multipleChoiceOptions).toEqual(['Option 1', 'Option 2']);
  });

  test('should handle numeric fields', () => {
    const normalized = mapRawRow(mockRawRow);
    expect(normalized.order).toBe(5);
  });

  test('should handle boolean fields', () => {
    const normalized = mapRawRow(mockRawRow);
    expect(normalized.locked).toBe(true);
  });

  test('should map photo fields', () => {
    const normalized = mapRawRow(mockRawRow);
    expect(normalized.photos.length).toBeGreaterThan(0);
    expect(normalized.photos[0].url).toBe('http://example.com/photo1.jpg');
    expect(normalized.photos[0].caption).toBe('Photo 1');
  });

  test('should preserve HTML in comment text', () => {
    const normalized = mapRawRow(mockRawRow);
    expect(normalized.commentText).toContain('<p>');
    expect(normalized.commentText).toContain('</p>');
  });
});
