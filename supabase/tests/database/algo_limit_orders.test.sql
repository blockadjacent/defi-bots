begin;
select plan(28);

select has_table('algo_limit_orders');

select has_column('algo_limit_orders', 'id');
select has_column('algo_limit_orders', 'network');
select has_column('algo_limit_orders', 'wallet_address');
select has_column('algo_limit_orders', 'order_type');
select has_column('algo_limit_orders', 'asset_in');
select has_column('algo_limit_orders', 'asset_out');
select has_column('algo_limit_orders', 'amount_in');
select has_column('algo_limit_orders', 'at_price');
select has_column('algo_limit_orders', 'slippage');
select has_column('algo_limit_orders', 'is_active');
select has_column('algo_limit_orders', 'generate_reverse_trade');
select has_column('algo_limit_orders', 'is_completed');
select has_column('algo_limit_orders', 'completed_on');
select has_column('algo_limit_orders', 'group_id');
select has_column('algo_limit_orders', 'trx_id');
select has_column('algo_limit_orders', 'excess_group_id');
select has_column('algo_limit_orders', 'excess_trx_id');
select has_column('algo_limit_orders', 'first_asset_in_linked_trades');
select has_column('algo_limit_orders', 'amount_received');
select has_column('algo_limit_orders', 'dex_used');
select has_column('algo_limit_orders', 'reverse_trade_at_price');
select has_column('algo_limit_orders', 'always_use_starting_amount_in');
select has_column('algo_limit_orders', 'origin_trade');
select has_column('algo_limit_orders', 'created_at');
select has_column('algo_limit_orders', 'updated_at');

select col_is_pk('algo_limit_orders', 'id');

select policies_are(
    'public',
    'algo_limit_orders',
    ARRAY[
        'Enable read access for all users'
    ]
);

select * from finish();
rollback;