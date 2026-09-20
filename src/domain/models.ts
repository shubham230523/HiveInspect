import { AnswerType } from './enums';

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
  answerType?: AnswerType | string;
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

export interface FieldCoverageInfo {
  supported: string[];
  metadata: string[];
  unsupported: string[];
  missing: string[];
}

export interface ImportCounts {
  rows?: number;
  sections: number;
  items: number;
  comments: number;
}

export interface RowWarning {
  row: number;
  section: string;
  item: string;
  field: string;
  message: string;
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
  fieldCoverage?: FieldCoverageInfo;
  preservationStats?: {
    source: ImportCounts;
    imported: ImportCounts;
  };
  rowWarnings?: RowWarning[];
}
