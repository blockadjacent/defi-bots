import { supabaseAnon, Tables } from "@blockadjacent/bots-core";
import { SupportedNetwork } from "@tinymanorg/tinyman-js-sdk";

export const getAlgoLimitOrders = async (address: string, network: SupportedNetwork) => {
    return supabaseAnon
        .from("algo_limit_orders")
        .select(
            `
            id,
            network,
            wallet_address,
            order_type,
            asset_in (
                id,
                asset_id,
                name,
                unit_name,
                decimals,
                is_native,
                is_supported
            ),
            asset_out (
                id,
                asset_id,
                name,
                unit_name,
                decimals,
                is_native,
                is_supported
            ),
            amount_in,
            at_price,
            slippage,
            generate_reverse_trade,
            reverse_trade_at_price,
            first_asset_in_linked_trades,
            always_use_starting_amount_in,
            origin_trade
        `
        )
        .eq("is_active", true)
        .eq("is_completed", false)
        .eq("wallet_address", address)
        .eq("network", network)
        .order("created_at", { ascending: true });
};

export type AlgoLimitOrderAsset = Omit<Tables<"algo_assets">, "created_at" | "updated_at" | "network">;
