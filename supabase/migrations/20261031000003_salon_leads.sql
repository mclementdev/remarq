-- Landing du salon (Époqu'Auto) : e-mails laissés pour recevoir le lien du formulaire.
-- Insertion uniquement par la route serveur (clé secrète) ; lecture réservée aux comptes connectés.

create table salon_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  remind_at timestamptz,
  source text not null check (source in ('stand', 'carte', 'flyer', 'ig', 'carjager')),
  consent boolean not null check (consent),
  consent_text text not null,
  consented_at timestamptz not null default now(),
  -- HMAC de l'adresse IP (jamais l'IP en clair), pour limiter le débit.
  ip_hash text,
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz not null default now()
);

create index salon_leads_created_at_idx on salon_leads (created_at desc);
create index salon_leads_ip_hash_idx on salon_leads (ip_hash, created_at);

alter table salon_leads enable row level security;

-- Aucune politique d'insertion, de modification ni de suppression : seule la route
-- serveur (clé secrète, qui ignore la RLS) écrit dans cette table.
create policy "authenticated_read" on salon_leads for select to authenticated using (true);
