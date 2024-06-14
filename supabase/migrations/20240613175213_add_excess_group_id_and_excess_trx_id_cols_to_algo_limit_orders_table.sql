alter table algo_limit_orders add column if not exists excess_group_id text null;
alter table algo_limit_orders add column if not exists excess_trx_id text null;