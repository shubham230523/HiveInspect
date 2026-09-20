import { mapRawRow } from '../mapper';
import { SPECTORA_COLUMNS } from '../constants';

describe('HTML Handling', () => {
  test('should preserve basic HTML tags', () => {
    const raw: any = {
      [SPECTORA_COLUMNS.SECTION_NAME]: 'S',
      [SPECTORA_COLUMNS.ITEM_NAME]: 'I',
      [SPECTORA_COLUMNS.COMMENT_TEXT]: '<p>Hello <strong>World</strong></p>',
    };
    const normalized = mapRawRow(raw);
    expect(normalized.commentText).toBe('<p>Hello <strong>World</strong></p>');
  });

  test('should preserve HTML entities', () => {
    const raw: any = {
      [SPECTORA_COLUMNS.SECTION_NAME]: 'S',
      [SPECTORA_COLUMNS.ITEM_NAME]: 'I',
      [SPECTORA_COLUMNS.COMMENT_TEXT]: 'Fish & Chips < > " \'',
    };
    const normalized = mapRawRow(raw);
    expect(normalized.commentText).toBe('Fish & Chips < > " \'');
  });

  test('should preserve links', () => {
    const raw: any = {
      [SPECTORA_COLUMNS.SECTION_NAME]: 'S',
      [SPECTORA_COLUMNS.ITEM_NAME]: 'I',
      [SPECTORA_COLUMNS.COMMENT_TEXT]: '<a href="https://example.com">Link</a>',
    };
    const normalized = mapRawRow(raw);
    expect(normalized.commentText).toBe('<a href="https://example.com">Link</a>');
  });
});
