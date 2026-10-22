-- Seed LOCAL uniquement (supabase db reset) : deux comptes de test.
-- En production, les comptes sont créés à la main (voir README.md).
-- Mot de passe local des deux comptes : remarq-local-1234

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated',
   'martin@remarq.test', crypt('remarq-local-1234', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"first_name":"Martin"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated',
   'salarie@remarq.test', crypt('remarq-local-1234', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"first_name":"Camille"}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.email in ('martin@remarq.test', 'salarie@remarq.test');
