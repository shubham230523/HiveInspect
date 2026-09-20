import { supabase } from '../services/supabase';
import { TemplateWithHierarchy, Template } from '../domain/models';

/**
 * Saves a complete template hierarchy using a PostgreSQL RPC function.
 * This ensures the operation is atomic (all or nothing).
 */
export async function saveTemplate(template: TemplateWithHierarchy): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase.rpc('import_template_hierarchy', {
      p_template: {
        id: template.id,
        name: template.name,
        source: template.source,
        metadata: template.metadata || {},
      },
      p_sections: template.sections,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (e) {
    console.error('Error saving template:', e);
    return { data: null, error: e };
  }
}

export async function getTemplates(): Promise<{ data: Template[] | null; error: any }> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getTemplateHierarchy(templateId: string): Promise<{ data: TemplateWithHierarchy | null; error: any }> {
  try {
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select(`
        *,
        items:items (
          *,
          comments:comments (*)
        )
      `)
      .eq('template_id', templateId)
      .order('display_order', { ascending: true });

    if (sectionsError) throw sectionsError;

    const hierarchy: TemplateWithHierarchy = {
      ...template,
      sections: (sections || []).map((s: any) => ({
        id: s.id,
        templateId: s.template_id,
        name: s.name,
        order: s.display_order,
        metadata: s.metadata,
        items: (s.items || []).map((i: any) => ({
          id: i.id,
          sectionId: i.section_id,
          name: i.name,
          order: i.display_order,
          answerType: i.answer_type,
          options: i.options,
          category: i.category,
          commentType: i.comment_type,
          recommendation: i.recommendation,
          defaultValue: i.default_value,
          metadata: i.metadata,
          comments: (i.comments || []).map((c: any) => ({
            id: c.id,
            itemId: c.item_id,
            name: c.name,
            text: c.comment_text,
            type: c.comment_type,
            order: c.display_order,
            metadata: c.metadata,
          })).sort((a: any, b: any) => a.order - b.order),
        })).sort((a: any, b: any) => a.order - b.order),
      })),
    };

    return { data: hierarchy, error: null };
  } catch (e) {
    console.error('Error fetching template hierarchy:', e);
    return { data: null, error: e };
  }
}

export async function deleteTemplate(templateId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', templateId);
  return { error };
}
