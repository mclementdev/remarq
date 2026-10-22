-- Données de référence nécessaires en production : marques de départ et réglages.

insert into brands (name) values
  ('Cassina'), ('Vitra'), ('Knoll'), ('Roche Bobois'), ('Ligne Roset'), ('Herman Miller'),
  ('Fritz Hansen'), ('B&B Italia'), ('Poltrona Frau'), ('Artek'), ('Acerbis'), ('Ibisco'),
  ('Serenissimo'), ('Thonet'), ('Molteni & C'), ('Minotti'), ('Flexform'), ('Cappellini'),
  ('Zanotta'), ('Artemide'), ('Flos'), ('Tecno'), ('Kartell'), ('Hay')
on conflict do nothing;

insert into settings (key, value) values
  ('shop_name', '"Remarq"'),
  ('email_signature', '"L''équipe {{boutique}}"'),
  ('workshop_address', '""'),
  ('offer_validity_days', '7'),
  ('hourly_rate', '0'),
  ('non_conform_delay_days', '15')
on conflict (key) do nothing;
