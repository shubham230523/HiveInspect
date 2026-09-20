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
