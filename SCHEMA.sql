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

-- Remove the existing trigger to avoid the "already exists" error
drop trigger if exists update_templates_updated_at on templates;

create trigger update_templates_updated_at
before update on templates
for each row execute function update_updated_at_column();

-- Atomic Import/Upsert Function
create or replace function import_template_hierarchy(
  p_template jsonb,
  p_sections jsonb
) returns void as $$
declare
  v_section jsonb;
  v_item jsonb;
  v_comment jsonb;
  v_section_id uuid;
  v_item_id uuid;
begin
  -- 1. Insert or Update Template
  insert into templates (id, name, source, metadata, updated_at)
  values (
    (p_template->>'id')::uuid,
    p_template->>'name',
    p_template->>'source',
    coalesce(p_template->'metadata', '{}'::jsonb),
    now()
  )
  on conflict (id) do update set
    name = excluded.name,
    source = excluded.source,
    metadata = excluded.metadata,
    updated_at = now();

  -- 2. Loop through Sections
  if jsonb_typeof(p_sections) = 'array' then
    for v_section in select * from jsonb_array_elements(p_sections) loop
      insert into sections (id, template_id, name, display_order, metadata)
      values (
        (v_section->>'id')::uuid,
        (p_template->>'id')::uuid,
        v_section->>'name',
        coalesce((v_section->>'order')::int, 0),
        coalesce(v_section->'metadata', '{}'::jsonb)
      )
      on conflict (id) do update set
        name = excluded.name,
        display_order = excluded.display_order,
        metadata = excluded.metadata
      returning id into v_section_id;

      -- 3. Loop through Items
      if jsonb_typeof(v_section->'items') = 'array' then
        for v_item in select * from jsonb_array_elements(v_section->'items') loop
          insert into items (id, section_id, name, display_order, answer_type, options, category, comment_type, recommendation, default_value, metadata)
          values (
            (v_item->>'id')::uuid,
            v_section_id,
            v_item->>'name',
            coalesce((v_item->>'order')::int, 0),
            v_item->>'answerType',
            case
              when jsonb_typeof(v_item->'options') = 'array'
              then (select array_agg(x) from jsonb_array_elements_text(v_item->'options') as x)
              else null
            end,
            v_item->>'category',
            v_item->>'commentType',
            v_item->>'recommendation',
            v_item->>'defaultValue',
            coalesce(v_item->'metadata', '{}'::jsonb)
          )
          on conflict (id) do update set
            name = excluded.name,
            display_order = excluded.display_order,
            answer_type = excluded.answer_type,
            options = excluded.options,
            category = excluded.category,
            comment_type = excluded.comment_type,
            recommendation = excluded.recommendation,
            default_value = excluded.default_value,
            metadata = excluded.metadata
          returning id into v_item_id;

          -- 4. Loop through Comments
          if jsonb_typeof(v_item->'comments') = 'array' then
            for v_comment in select * from jsonb_array_elements(v_item->'comments') loop
              insert into comments (id, item_id, name, comment_text, comment_type, display_order, metadata)
              values (
                (v_comment->>'id')::uuid,
                v_item_id,
                v_comment->>'name',
                v_comment->>'text',
                v_comment->>'type',
                coalesce((v_comment->>'order')::int, 0),
                coalesce(v_comment->'metadata', '{}'::jsonb)
              )
              on conflict (id) do update set
                name = excluded.name,
                comment_text = excluded.comment_text,
                comment_type = excluded.comment_type,
                display_order = excluded.display_order,
                metadata = excluded.metadata;
            end loop;
          end if;
        end loop;
      end if;
    end loop;
  end if;
end;
$$ language plpgsql;
