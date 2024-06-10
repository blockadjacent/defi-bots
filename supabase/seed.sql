-- seed algo_assets table
insert into algo_assets (asset_id, name, unit_name, decimals, is_native, is_supported)
values
(0, 'Algorand', 'ALGO', 6, true, true),
(312769, 'Tether USDt', 'USDt', 6, false, true),
(31566704, 'USDC', 'USDC', 6, false, true),
(887406851, 'Wrapped Ether', 'WETH', 8, false, true),
(887648583, 'Wrapped SOL', 'SOL', 8, false, true),
(1138500612, 'GORA', 'GORA', 9, false, true),
(1096015467, 'Pepe', 'PEPE', 4, false, true)