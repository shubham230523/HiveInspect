import { TemplateSchema, SectionSchema, ItemSchema, CommentSchema } from '../../validation/schemas';

describe('Domain Model Validation', () => {
  test('TemplateSchema should validate a valid template', () => {
    const validTemplate = {
      id: 'template-1',
      name: 'Residential Inspection',
      source: 'Spectora',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(TemplateSchema.safeParse(validTemplate).success).toBe(true);
  });

  test('SectionSchema should validate a valid section', () => {
    const validSection = {
      id: 'section-1',
      templateId: 'template-1',
      name: 'Exterior',
      order: 0,
    };
    expect(SectionSchema.safeParse(validSection).success).toBe(true);
  });

  test('ItemSchema should validate a valid item', () => {
    const validItem = {
      id: 'item-1',
      sectionId: 'section-1',
      name: 'Siding',
      order: 0,
      answerType: 'Multiple Choice',
    };
    expect(ItemSchema.safeParse(validItem).success).toBe(true);
  });

  test('CommentSchema should validate a valid comment', () => {
    const validComment = {
      id: 'comment-1',
      itemId: 'item-1',
      name: 'Cracked Siding',
      text: '<p>Siding is cracked.</p>',
      order: 0,
    };
    expect(CommentSchema.safeParse(validComment).success).toBe(true);
  });

  test('SectionSchema should fail if name is empty', () => {
    const invalidSection = {
      id: 'section-1',
      templateId: 'template-1',
      name: '',
      order: 0,
    };
    expect(SectionSchema.safeParse(invalidSection).success).toBe(false);
  });
});
