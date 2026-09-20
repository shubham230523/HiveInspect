import { z } from 'zod';

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Template name is required"),
  source: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const SectionSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  name: z.string().min(1, "Section name is required"),
  order: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const ItemSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  name: z.string().min(1, "Item name is required"),
  order: z.number().int().nonnegative(),
  answerType: z.string().optional(),
  options: z.array(z.string()).optional(),
  category: z.string().optional(),
  commentType: z.string().optional(),
  recommendation: z.string().optional(),
  defaultValue: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const CommentSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  name: z.string().min(1, "Comment name is required"),
  text: z.string(),
  type: z.string().optional(),
  order: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const ImportResultSchema = z.object({
  success: z.boolean(),
  rowsProcessed: z.number().int().nonnegative(),
  sectionsCreated: z.number().int().nonnegative(),
  itemsCreated: z.number().int().nonnegative(),
  commentsCreated: z.number().int().nonnegative(),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
  unsupportedFields: z.array(z.string()),
  malformedRows: z.array(z.number()),
});
