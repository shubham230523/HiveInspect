import { NormalizedSpectoraRow } from './normalized-models';
import { TemplateWithHierarchy, SectionWithItems, ItemWithComments, Comment } from '../domain/models';
import { generateId } from '../utils/ids';

export function buildHierarchy(
  templateName: string,
  rows: NormalizedSpectoraRow[]
): TemplateWithHierarchy {
  const templateId = generateId();
  const now = new Date().toISOString();

  const template: TemplateWithHierarchy = {
    id: templateId,
    name: templateName,
    source: 'Spectora',
    createdAt: now,
    updatedAt: now,
    sections: [],
  };

  const sectionsMap = new Map<string, SectionWithItems>();

  rows.forEach((row) => {
    // Get or create section
    let section = sectionsMap.get(row.sectionName);
    if (!section) {
      section = {
        id: generateId(),
        templateId,
        name: row.sectionName,
        order: row.order, // Section order is usually from the first row it appears in
        items: [],
        metadata: { ...row.rawMetadata },
      };
      sectionsMap.set(row.sectionName, section);
      template.sections.push(section);
    }

    // Get or create item within section
    const itemKey = `${row.sectionName}|${row.itemName}`;
    let item = section.items.find((i) => i.name === row.itemName);
    if (!item) {
      item = {
        id: generateId(),
        sectionId: section.id,
        name: row.itemName,
        order: row.order,
        answerType: row.answerType,
        options: row.multipleChoiceOptions,
        category: row.category,
        recommendation: row.recommendation,
        defaultValue: row.defaultValue,
        comments: [],
        metadata: { ...row.rawMetadata },
      };
      section.items.push(item);
    }

    // Add comment to item if it exists
    if (row.commentName || row.commentText) {
      const comment: Comment = {
        id: generateId(),
        itemId: item.id,
        name: row.commentName,
        text: row.commentText,
        type: row.commentType,
        order: row.order,
        metadata: { ...row.rawMetadata },
      };
      item.comments.push(comment);
    }
  });

  // Sort sections, items, and comments by their order field
  template.sections.sort((a, b) => a.order - b.order);
  template.sections.forEach((s) => {
    s.items.sort((a, b) => a.order - b.order);
    s.items.forEach((i) => {
      i.comments.sort((a, b) => a.order - b.order);
    });
  });

  return template;
}
