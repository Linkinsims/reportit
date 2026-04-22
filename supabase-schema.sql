-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Organizations table
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  plan text not null default 'trial' check (plan in ('trial', 'starter', 'pro')),
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User profiles (linked to Supabase auth.users)
create table user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  organization_id uuid references organizations not null,
  role text not null check (role in ('employee', 'manager', 'admin')),
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, organization_id)
);

create index idx_user_profiles_user_id on user_profiles(user_id);
create index idx_user_profiles_org_id on user_profiles(organization_id);

-- Reports table
create table reports (
  id uuid primary key default uuid_generate_v4(),
  report_id text unique not null,
  organization_id uuid references organizations not null,
  title text not null,
  description text,
  category text not null check (category in ('safety', 'hr', 'equipment', 'other')),
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  incident_at bigint,
  reporter_profile_id uuid references user_profiles not null,
  assignee_id uuid references user_profiles,
  resolution_summary text,
  is_archived boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_reports_org_id on reports(organization_id);
create index idx_reports_org_status on reports(organization_id, status);
create index idx_reports_org_category on reports(organization_id, category);
create index idx_reports_org_priority on reports(organization_id, priority);
create index idx_reports_reporter on reports(reporter_profile_id);
create index idx_reports_report_id on reports(report_id);

-- Report photos
create table report_photos (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid references reports on delete cascade not null,
  organization_id uuid references organizations not null,
  storage_path text not null,
  uploaded_by uuid references user_profiles not null,
  file_name text not null,
  content_type text not null,
  size_bytes bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_report_photos_report_id on report_photos(report_id);

-- Status history
create table status_history (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid references reports not null,
  organization_id uuid references organizations not null,
  from_status text,
  to_status text not null,
  changed_by uuid references user_profiles not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_status_history_report_id on status_history(report_id);

-- Internal notes
create table internal_notes (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid references reports on delete cascade not null,
  organization_id uuid references organizations not null,
  author_id uuid references user_profiles not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_internal_notes_report_id on internal_notes(report_id);

-- Audit log
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid references reports,
  organization_id uuid references organizations not null,
  actor_id uuid references user_profiles,
  action text not null,
  metadata jsonb,
  timestamp bigint not null
);

create index idx_audit_log_org_id on audit_log(organization_id);
create index idx_audit_log_report_id on audit_log(report_id);

-- Enable Row Level Security
alter table user_profiles enable row level security;
alter table reports enable row level security;
alter table report_photos enable row level security;
alter table status_history enable row level security;
alter table internal_notes enable row level security;
alter table audit_log enable row level security;

-- RLS Policies

-- User Profiles: Users can view profiles in their org only
create policy "Users can view profiles in their org" on user_profiles
  for select using (
    organization_id in (
      select organization_id from user_profiles where user_id = auth.uid()
    )
  );

-- Reports: Users can view reports in their org only
create policy "Users can view reports in their org" on reports
  for select using (
    organization_id in (
      select organization_id from user_profiles where user_id = auth.uid()
    )
  );

-- Report Photos: Users can view photos in their org only
create policy "Users can view photos in their org" on report_photos
  for select using (
    organization_id in (
      select organization_id from user_profiles where user_id = auth.uid()
    )
  );

-- Status History: Users can view history in their org only
create policy "Users can view status history in their org" on status_history
  for select using (
    organization_id in (
      select organization_id from user_profiles where user_id = auth.uid()
    )
  );

-- Internal Notes: Users can view notes in their org only
create policy "Users can view notes in their org" on internal_notes
  for select using (
    organization_id in (
      select organization_id from user_profiles where user_id = auth.uid()
    )
  );

-- Audit Log: Users can view audit log in their org only
create policy "Users can view audit log in their org" on audit_log
  for select using (
    organization_id in (
      select organization_id from user_profiles where user_id = auth.uid()
    )
  );

-- Realtime: Enable on key tables
alter publication supabase_realtime add table reports;
alter publication supabase_realtime add table report_photos;
alter publication supabase_realtime add table internal_notes;
alter publication supabase_realtime add table status_history;

-- Function to generate report_id (e.g., S-0001)
create or replace function generate_report_id()
returns text as $$
declare
  last_id text;
  next_num int;
begin
  select report_id into last_id from reports 
  where report_id like 'S-%' 
  order by report_id desc limit 1;
  
  if last_id is null then
    next_num := 1;
  else
    next_num := (substring(last_id from 3))::int + 1;
  end if;
  
  return 'S-' || lpad(next_num::text, 4, '0');
end;
$$ language plpgsql security definer;

-- Function to get user's organization
create or replace function get_user_organization()
returns uuid as $$
select organization_id from user_profiles where user_id = auth.uid() limit 1;
$$ language sql stable;

-- Function to get user profile with org
create or replace function get_my_profile()
returns jsonb as $$
select jsonb_build_object(
  'profile', jsonb_build_object(
    'id', up.id,
    'userId', up.user_id,
    'role', up.role,
    'displayName', up.display_name,
    'organizationId', up.organization_id
  ),
  'org', jsonb_build_object(
    'id', o.id,
    'name', o.name,
    'slug', o.slug,
    'plan', o.plan
  )
)
from user_profiles up
join organizations o on up.organization_id = o.id
where up.user_id = auth.uid()
limit 1;
$$ language sql stable;
