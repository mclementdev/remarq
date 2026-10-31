-- Formulaire de reprise v2 : plusieurs pièces par demande, type de pièce,
-- quantité, note d'état, source, consentement au recontact, barème affiché.

alter table furnitures
  add column submission_id uuid,
  add column item_index smallint check (item_index between 1 and 10),
  add column item_type text check (item_type in (
    'chair', 'sofa', 'armchair', 'stool_bench',
    'table', 'desk', 'side_table',
    'bookcase', 'shelf', 'chest', 'sideboard',
    'mirror', 'small_object', 'lamp', 'vase', 'rug'
  )),
  add column model text,
  add column quantity smallint not null default 1 check (quantity between 1 and 99),
  add column condition_score smallint check (condition_score between 0 and 10),
  add column source text check (source in ('stand', 'carte', 'flyer', 'ig', 'carjager')),
  add column contact_consent_at timestamptz,
  add column contact_consent_text text;

alter table furnitures alter column seller_last_name drop not null;

create index furnitures_submission_idx on furnitures (submission_id, item_index);

-- La vue développe f.* à sa création : on la recrée pour exposer les nouvelles colonnes.
drop view furniture_overview;
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
    where h.furniture_id = f.id and h.to_status = 'refused') as first_refused_at,
  (select count(*) from furnitures s where s.submission_id = f.submission_id)::int as submission_size
from furnitures f
left join brands b on b.id = f.brand_id;

-- Barème de partage affiché sur le formulaire (modifiable dans Réglages).
-- « up_to » = borne haute exclue en euros ; null = « et plus ».
insert into settings (key, value) values
  ('consignment_scale', '[{"up_to": 500, "percent": 40}, {"up_to": 1000, "percent": 50}, {"up_to": 2500, "percent": 60}, {"up_to": null, "percent": 70}]')
on conflict (key) do nothing;
