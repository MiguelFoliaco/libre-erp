alter table document_types
add column end_number bigint not null; -- if -1 no limit