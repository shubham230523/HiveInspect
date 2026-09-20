-- Hive Inspect Template Importer Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Templates Table
create table if not exists templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  source text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  metadata jsonb default '{}'::jsonb
);

-- Sections Table
create table if not exists sections (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid references templates(id) on delete cascade,
  name text not null,
  display_order integer not null default 0,
  metadata jsonb default '{}'::jsonb
);

-- Items Table
create table if not exists items (
  id uuid primary key default uuid_generate_v4(),
  section_id uuid references sections(id) on delete cascade,
  name text not null,
  display_order integer not null default 0,
  answer_type text,
  options text[],
  category text,
  comment_type text,
  recommendation text,
  default_value text,
  metadata jsonb default '{}'::jsonb
);

-- Comments Table
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid references items(id) on delete cascade,
  name text not null,
  comment_text text not null,
  comment_type text,
  display_order integer not null default 0,
  metadata jsonb default '{}'::jsonb
);

-- Indexes
create index if not exists idx_sections_template_id on sections(template_id);
create index if not exists idx_items_section_id on items(section_id);
create index if not exists idx_comments_item_id on comments(item_id);

-- Updated At Trigger Function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_templates_updated_at
before update on templates
for each row execute function update_updated_at_column();

-- Atomic Import Function
create or replace function import_template_hierarchy(
  p_template jsonb,
  p_sections jsonb
) returns void as $$
declare
  v_template_id uuid;
  v_section jsonb;
  v_item jsonb;
  v_comment jsonb;
  v_section_id uuid;
  v_item_id uuid;
begin
  -- 1. Insert Template
  insert into templates (id, name, source, metadata)
  values (
    (p_template->>\u0027id\u0027)::uuid,
    p_template->>\u0027name\u0027,
    p_template->>\u0027source\u0027,
    (p_template->>\u0027metadata\u0027)::jsonb
  );

  -- 2. Loop through Sections
  for v_section in select * from jsonb_array_elements(p_sections) loop
    insert into sections (id, template_id, name, display_order, metadata)
    values (
      (v_section->>\u0027id\u0027)::uuid,
      (p_template->>\u0027id\u0027)::uuid,
      v_section->>\u0027name\u0027,
      (v_section->>\u0027order\u0027)::int,
      (v_section->>\u0027metadata\u0027)::jsonb
    ) returning id into v_section_id;

    -- 3. Loop through Items in Section
    for v_item in select * from jsonb_array_elements(v_section->\u0027items\u0027) loop
      insert into items (id, section_id, name, display_order, answer_type, options, category, comment_type, recommendation, default_value, metadata)
      values (
        (v_item->>\u0027id\u0027)::uuid,
        v_section_id,
        v_item->>\u0027name\u0027,
        (v_item->>\u0027order\u0027)::int,
        v_item->>\u0027answerType\u0027,
        (select array_agg(x) from jsonb_array_elements_text(v_item->\u0027options\u0027) as x),
        v_item->>\u0027category\u0027,
        v_item->>\u0027commentType\u0027,
        v_item->>\u0027recommendation\u0027,
        v_item->>\u0027defaultValue\u0027,
        (v_item->>\u0027metadata\u0027)::jsonb
      ) returning id into v_item_id;

      -- 4. Loop through Comments in Item
      for v_comment in select * from jsonb_array_elements(v_item->\u0027comments\u0027) loop
        insert into comments (id, item_id, name, comment_text, comment_type, display_order, metadata)
        values (
          (v_comment->>\u0027id\u0027)::uuid,
          v_item_id,
          v_comment->>\u0027name\u0027,
          v_comment->>\u0027text\u0027,
          v_comment->>\u0027type\u0027,
          (v_comment->>\u0027order\u0027)::int,
          (v_comment->>\u0027metadata\u0027)::jsonb
        );
      end loop;
    end loop;
  end loop;
end;
$$ language plpgsql;
