alter table warehouses add column address_str VARCHAR(255);
alter table warehouses add column address JSONB NOT NULL DEFAULT '{}'::jsonb;
alter table warehouses add column address_fields TEXT[] NOT NULL DEFAULT '{}'::TEXT[];


alter table departments add column logo_url text;