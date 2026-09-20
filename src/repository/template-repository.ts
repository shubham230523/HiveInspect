import { supabase } from '../services/supabase';
import { TemplateWithHierarchy, Template, Section, Item, Comment } from '../domain/models';

export async function saveTemplate(template: TemplateWithHierarchy): Promise<{ data: any; error: any }> {
  try {
    // 1. Insert Template
    const { data: templateData, error: templateError } = await supabase
      .from('templates')
      .insert({
        id: template.id,
        name: template.name,
        source: template.source,
        metadata: template.metadata || {},
      })
      .select()
      .single();

    if (templateError) throw templateError;

    // 2. Insert Sections, Items, and Comments
    for (const section of template.sections) {
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .insert({
          id: section.id,
          template_id: template.id,
          name: section.name,
          display_order: section.order,
          metadata: section.metadata || {},
        })
        .select()
        .single();

      if (sectionError) throw sectionError;

      for (const item of section.items) {
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .insert({
            id: item.id,
            section_id: section.id,
            name: item.name,
            display_order: item.order,
            answer_type: item.answerType,
            options: item.options,
            category: item.category,
            comment_type: item.commentType,
            recommendation: item.recommendation,
            default_value: item.defaultValue,
            metadata: item.metadata || {},
          })
          .select()
          .single();

        if (itemError) throw itemError;

        if (item.comments.length > 0) {
          const { error: commentsError } = await supabase
            .from('comments')
            .insert(item.comments.map(c => ({
              id: c.id,
              item_id: item.id,
              name: c.name,
              comment_text: c.text,
              comment_type: c.type,
              display_order: c.order,
              metadata: c.metadata || {},
            })));

          if (commentsError) throw commentsError;
        }
      }
    }

    return { data: templateData, error: null };
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

    // Map back to domain model
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
