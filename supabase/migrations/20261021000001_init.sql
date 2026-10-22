-- Remarq — schéma initial
-- Clés techniques en anglais, libellés français dans lib/status.ts et lib/labels.ts.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type furniture_status as enum (
  'new', 'info_requested', 'accepted', 'offer_sent', 'offer_accepted',
  'pickup_scheduled', 'in_transit', 'received', 'non_conform', 'preparing',
  'online', 'sold', 'done', 'refused', 'offer_declined', 'returned'
);
create type furniture_mode as enum ('buyout', 'consignment');
create type furniture_category as enum ('seating', 'storage', 'tables_desks', 'lighting_decor');
create type furniture_condition as enum ('new', 'very_good', 'good', 'used', 'to_restore');
create type floor_level as enum ('ground', '1', '2', '3', '4_plus');
create type photo_kind as enum ('deposit', 'certificate', 'conformity', 'listing');
create type photo_slot as enum ('front', 'back', 'side', 'detail', 'defect', 'other');
create type time_type as enum ('cleaning', 'repair', 'photos', 'other');
create type finance_category as enum ('extra_cost', 'adjustment', 'other');
create type appointment_type as enum ('seller_pickup', 'buyer_pickup', 'client_return');
create type day_period as enum ('morning', 'afternoon');
create type refusal_reason as enum ('out_of_selection', 'bad_condition', 'authenticity', 'bad_timing');
create type sale_channel as enum ('site', 'leboncoin', 'other');
create type non_conform_choice as enum ('client_pickup', 'carrier_return');
create type activity_kind as enum ('email_prepared', 'field_update', 'note', 'appointment', 'photo', 'ai_generation', 'finance', 'time');
create type suggestion_status as enum ('pending', 'added', 'dismissed');

-- ---------------------------------------------------------------------------
-- Utilitaires
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Profils (prénom affiché dans l'historique)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default ''
);

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, first_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'first_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Marques
-- ---------------------------------------------------------------------------
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index brands_name_key on brands (lower(name));

-- ---------------------------------------------------------------------------
-- Meubles
-- ---------------------------------------------------------------------------
create table furnitures (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Le meuble
  name text not null,
  category furniture_category not null,
  brand_id uuid references brands (id) on delete set null,
  brand_other text,
  designer text,
  manufacture_year text,
  description text not null,
  width_cm numeric(7,1),
  depth_cm numeric(7,1),
  height_cm numeric(7,1),
  materials text,
  condition furniture_condition not null,
  defects text,
  purchase_year text,
  original_price numeric(10,2),
  desired_price numeric(10,2),

  -- Enlèvement
  floor floor_level,
  has_elevator boolean,
  access_notes text,

  -- Vendeur (pas de table clients)
  seller_first_name text not null,
  seller_last_name text not null,
  seller_email text not null,
  seller_phone text not null,
  seller_street text not null,
  seller_postal_code text not null,
  seller_city text not null,

  -- Certification
  certified_at timestamptz not null,
  certification_text text not null,

  -- Workflow
  status furniture_status not null default 'new',
  status_changed_at timestamptz not null default now(),
  mode furniture_mode,
  is_abandoned boolean not null default false,
  refusal_reason refusal_reason,

  -- Finances (€ TTC)
  offer_buyout_price numeric(10,2),
  expected_sale_price numeric(10,2),
  transport_cost numeric(10,2),
  consignment_terms text,
  final_buyout_price numeric(10,2),
  consignment_commission numeric(10,2),
  listed_price numeric(10,2),
  final_sale_price numeric(10,2),
  sale_channel sale_channel,

  -- Dates clés
  offer_sent_at timestamptz,
  received_at date,
  non_conform_at timestamptz,
  sold_at date,
  picked_up_by_buyer_at date,
  returned_at date,

  -- Conformité
  conformity_report text,
  non_conform_choice non_conform_choice,
  return_quote numeric(10,2),

  -- Mise en ligne
  published_site boolean not null default false,
  published_site_at date,
  published_lbc boolean not null default false,
  published_lbc_at date,
  listing_site jsonb,
  listing_lbc jsonb
);

create index furnitures_status_idx on furnitures (status);
create index furnitures_sold_at_idx on furnitures (sold_at);
create index furnitures_created_at_idx on furnitures (created_at desc);
create trigger furnitures_updated_at before update on furnitures
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Historique des statuts et journal d'activité
-- ---------------------------------------------------------------------------
create table status_history (
  id uuid primary key default gen_random_uuid(),
  furniture_id uuid not null references furnitures (id) on delete cascade,
  from_status furniture_status,
  to_status furniture_status not null,
  changed_at timestamptz not null default now(),
  author_id uuid references auth.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb
);
create index status_history_furniture_idx on status_history (furniture_id, changed_at);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  furniture_id uuid not null references furnitures (id) on delete cascade,
  kind activity_kind not null,
  label text not null,
  payload jsonb not null default '{}'::jsonb,
  author_id uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index activity_log_furniture_idx on activity_log (furniture_id, created_at);

-- ---------------------------------------------------------------------------
-- Photos (furniture_id nul tant que le dépôt n'est pas finalisé)
-- ---------------------------------------------------------------------------
create table photos (
  id uuid primary key default gen_random_uuid(),
  furniture_id uuid references furnitures (id) on delete cascade,
  submission_id uuid,
  kind photo_kind not null,
  slot photo_slot not null default 'other',
  position integer not null default 0,
  is_main boolean not null default false,
  storage_path text not null unique,
  thumb_path text,
  created_at timestamptz not null default now()
);
create index photos_furniture_idx on photos (furniture_id, kind, position);
create index photos_submission_idx on photos (submission_id);

-- ---------------------------------------------------------------------------
-- Temps passé, lignes financières, rendez-vous
-- ---------------------------------------------------------------------------
create table time_entries (
  id uuid primary key default gen_random_uuid(),
  furniture_id uuid not null references furnitures (id) on delete cascade,
  type time_type not null,
  hours numeric(6,2) not null check (hours <> 0),
  entry_date date not null default (now() at time zone 'Europe/Paris')::date,
  note text,
  author_id uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index time_entries_furniture_idx on time_entries (furniture_id);

create table finance_lines (
  id uuid primary key default gen_random_uuid(),
  furniture_id uuid not null references furnitures (id) on delete cascade,
  label text not null,
  amount numeric(10,2) not null,
  category finance_category not null default 'extra_cost',
  line_date date not null default (now() at time zone 'Europe/Paris')::date,
  author_id uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index finance_lines_furniture_idx on finance_lines (furniture_id);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  furniture_id uuid not null references furnitures (id) on delete cascade,
  type appointment_type not null,
  appointment_date date not null,
  period day_period not null,
  note text,
  done boolean not null default false,
  author_id uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index appointments_date_idx on appointments (appointment_date);
create index appointments_furniture_idx on appointments (furniture_id);

-- ---------------------------------------------------------------------------
-- Notes internes et pièces jointes
-- ---------------------------------------------------------------------------
create table notes (
  id uuid primary key default gen_random_uuid(),
  furniture_id uuid not null references furnitures (id) on delete cascade,
  body text not null,
  author_id uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index notes_furniture_idx on notes (furniture_id, created_at);

create table attachments (
  id uuid primary key default gen_random_uuid(),
  furniture_id uuid not null references furnitures (id) on delete cascade,
  note_id uuid references notes (id) on delete cascade,
  storage_path text not null unique,
  filename text not null,
  mime text,
  size_bytes integer,
  author_id uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index attachments_furniture_idx on attachments (furniture_id);

-- ---------------------------------------------------------------------------
-- Suggestions de marques (« Autre » dans le formulaire) et réglages
-- ---------------------------------------------------------------------------
create table brand_suggestions (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  furniture_id uuid references furnitures (id) on delete set null,
  status suggestion_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Vue de synthèse (liste, Kanban, dashboard). La marge est calculée en
-- TypeScript (lib/calc/margin.ts) à partir de ces agrégats.
-- ---------------------------------------------------------------------------
create view furniture_overview with (security_invoker = true) as
select
  f.*,
  coalesce(b.name, f.brand_other) as brand_name,
  (select p.thumb_path from photos p
    where p.furniture_id = f.id and p.kind = 'deposit'
    order by p.is_main desc, p.position asc limit 1) as thumb_path,
  coalesce((select sum(t.hours) from time_entries t where t.furniture_id = f.id), 0)::numeric as hours_total,
  coalesce((select sum(l.amount) from finance_lines l where l.furniture_id = f.id), 0)::numeric as adjustments_total,
  (select min(h.changed_at) from status_history h
    where h.furniture_id = f.id and h.to_status = 'accepted') as first_accepted_at,
  (select min(h.changed_at) from status_history h
    where h.furniture_id = f.id and h.to_status = 'refused') as first_refused_at
from furnitures f
left join brands b on b.id = f.brand_id;

-- ---------------------------------------------------------------------------
-- Changement de statut atomique : met à jour les champs autorisés,
-- le statut et journalise dans status_history.
-- ---------------------------------------------------------------------------
create or replace function change_status(
  p_furniture_id uuid,
  p_to furniture_status,
  p_fields jsonb default '{}'::jsonb,
  p_history_extra jsonb default '{}'::jsonb
) returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_from furniture_status;
  v_key text;
  v_allowed text[] := array[
    'refusal_reason', 'offer_buyout_price', 'expected_sale_price', 'transport_cost',
    'consignment_terms', 'mode', 'final_buyout_price', 'received_at', 'non_conform_at',
    'conformity_report', 'non_conform_choice', 'return_quote', 'is_abandoned',
    'listed_price', 'published_site', 'published_site_at', 'published_lbc', 'published_lbc_at',
    'final_sale_price', 'sale_channel', 'sold_at', 'picked_up_by_buyer_at', 'returned_at',
    'offer_sent_at'
  ];
begin
  select status into v_from from furnitures where id = p_furniture_id for update;
  if not found then
    raise exception 'Meuble introuvable';
  end if;

  for v_key in select jsonb_object_keys(p_fields) loop
    if not v_key = any (v_allowed) then
      raise exception 'Champ non autorisé : %', v_key;
    end if;
    execute format(
      'update furnitures set %1$I = (jsonb_populate_record(null::furnitures, $1)).%1$I where id = $2',
      v_key
    ) using p_fields, p_furniture_id;
  end loop;

  if v_from is distinct from p_to then
    update furnitures set status = p_to, status_changed_at = now() where id = p_furniture_id;
  end if;

  insert into status_history (furniture_id, from_status, to_status, author_id, payload)
  values (p_furniture_id, v_from, p_to, auth.uid(), p_fields || coalesce(p_history_extra, '{}'::jsonb));
end $$;

-- ---------------------------------------------------------------------------
-- RLS : les 2 comptes authentifiés ont tous les droits ; anon n'a rien
-- (le formulaire public passe par une route serveur avec la clé service).
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'brands', 'furnitures', 'status_history', 'activity_log', 'photos',
    'time_entries', 'finance_lines', 'appointments', 'notes', 'attachments',
    'brand_suggestions', 'settings'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "authenticated_all" on %I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

revoke execute on function change_status(uuid, furniture_status, jsonb, jsonb) from anon, public;
grant execute on function change_status(uuid, furniture_status, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Stockage : buckets privés
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('furniture-photos', 'furniture-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp']),
  ('attachments', 'attachments', false, 20971520, null)
on conflict (id) do nothing;

create policy "authenticated_read_write_photos" on storage.objects
  for all to authenticated
  using (bucket_id in ('furniture-photos', 'attachments'))
  with check (bucket_id in ('furniture-photos', 'attachments'));
