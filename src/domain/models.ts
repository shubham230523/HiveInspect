export type EntityId = string;

export interface Template {
  id: EntityId;
  name: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface Section {
  id: EntityId;
  templateId: EntityId;
  name: string;
  order: number;
  metadata?: Record<string, any>;
}

export interface Item {
  id: EntityId;
  sectionId: EntityId;
  name: string;
  order: number;
  answerType?: string;
  options?: string[];
  category?: string;
  commentType?: string;
  recommendation?: string;
  defaultValue?: string;
  metadata?: Record<string, any>;
}

export interface Comment {
  id: EntityId;
  itemId: EntityId;
  name: string;
  text: string;
  type?: string;
  order: number;
  metadata?: Record<string, any>;
}

export interface ItemWithComments extends Item {
  comments: Comment[];
}

export interface SectionWithItems extends Section {
  items: ItemWithComments[];
}

export interface TemplateWithHierarchy extends Template {
  sections: SectionWithItems[];
}

export interface ImportResult {
  success: boolean;
  template?: TemplateWithHierarchy;
  rowsProcessed: number;
  sectionsCreated: number;
  itemsCreated: number;
  commentsCreated: number;
  warnings: string[];
  errors: string[];
  unsupportedFields: string[];
  malformedRows: number[];
}
