import type { Tables } from "@blockadjacent/bots-core";
import type { AlgoLimitOrderAsset } from "../util/data-retriever";

export const SupportedDex = {
    Pact: "pact",
    Tinyman: "tinyman",
} as const;

export type GetQuoteParams = Pick<Tables<"algo_limit_orders">, "amount_in" | "slippage"> & {
    asset_in: AlgoLimitOrderAsset;
    asset_out: AlgoLimitOrderAsset;
};

export type SwapResultTxAndGroupIds = {
    groupId?: string;
    txId: string;
    excessGroupId?: string; // set if swap is executed via Tinyman v1.1 smart contracts
    excessTxId?: string; // set if swap is executed via Tinyman v1.1 smart contracts
};
