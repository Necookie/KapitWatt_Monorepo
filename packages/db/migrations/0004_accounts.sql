-- 0004: household login (email and password) and the Meralco account the bill credit goes to.
-- All nullable: simulated households and households from before this migration have none.

alter table households
  add column email            text,
  add column password_hash    text,                 -- PBKDF2; never the password itself
  add column account_number   text check (account_number ~ '^[0-9]{10}$'),  -- Meralco CAN
  add column account_name     text,                 -- registered account holder
  add column service_address  text;

-- One login per email and one household per Meralco account.
create unique index households_email_key on households (email) where email is not null;
create unique index households_account_number_key
  on households (account_number) where account_number is not null;
