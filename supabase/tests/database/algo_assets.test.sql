begin;
select plan(13);

select has_table('algo_assets');

select has_column('algo_assets', 'id');
select has_column('algo_assets', 'asset_id');
select has_column('algo_assets', 'name');
select has_column('algo_assets', 'unit_name');
select has_column('algo_assets', 'network');
select has_column('algo_assets', 'decimals');
select has_column('algo_assets', 'is_native');
select has_column('algo_assets', 'is_supported');
select has_column('algo_assets', 'created_at');
select has_column('algo_assets', 'updated_at');

select col_is_pk('algo_assets', 'id');

select policies_are(
    'public',
    'algo_assets',
    ARRAY [
        'Enable read access for all users'
    ]
);

select * from finish();
rollback;