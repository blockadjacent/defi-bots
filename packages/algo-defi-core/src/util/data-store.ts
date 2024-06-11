import { supabaseAdmin, TablesInsert, TablesUpdate } from "@blockadjacent/bots-core";

export async function insertAlgoLimitOrder(data: TablesInsert<"algo_limit_orders">) {
    return supabaseAdmin.from("algo_limit_orders").insert(data).select();
}

export async function updateAlgoLimitOrder(data: TablesUpdate<"algo_limit_orders">, id: number) {
    return supabaseAdmin.from("algo_limit_orders").update(data).eq("id", id).select();
}
