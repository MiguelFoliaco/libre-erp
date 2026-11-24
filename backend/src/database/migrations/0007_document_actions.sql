-- Custom SQL migration file, put your code below! --

create type type_quantity_inventory as enum ('quantity', 'reserved_quantity');

alter table document_types add column modify_inventory boolean default false not null;
alter table document_types add column type_modify_inventory movement_type default null;
alter table document_types add column type_quantity  type_quantity_inventory default null;
