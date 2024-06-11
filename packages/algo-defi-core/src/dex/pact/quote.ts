import type { Pool, Swap as PactSwap } from "@pactfi/pactsdk";
import type { AlgoLimitOrderAsset } from "../../util/data-retriever";
import type { GetQuoteParams } from "../index";
import type { AMMClients } from "../../util/client";
import BigNumber from "bignumber.js";
import { getScaledAmount, getUnScaledAmount, numberToBigNumber } from "@blockadjacent/bots-core";
import { AlgoBots } from "../../util/constants";

export type PactQuote = {
    preparedSwap: PactSwap;
    assetIn: AlgoLimitOrderAsset;
    assetOut: AlgoLimitOrderAsset;
    amountIn: BigNumber;
    amountOut: BigNumber;
    amountOutWithSlippage: BigNumber;
    slippage: number;
};

export const getPactQuote = async (order: GetQuoteParams, ammClients: AMMClients): Promise<PactQuote | null> => {
    const amountInScaled = getScaledAmount(order.amount_in, order.asset_in.decimals);
    const pactClient = ammClients.clients.pactfi.pactClient;
    let pactPools: Pool[];
    let pactQuote: PactQuote | null = null;

    if (order.slippage < AlgoBots.minimumSlippagePct) {
        throw new Error(
            `Slippage configured must be at least 0.1%. Order configured with a slippage percentage of ${order.slippage}`
        );
    }

    try {
        pactPools = await pactClient.fetchPoolsByAssets(order.asset_in.asset_id, order.asset_out.asset_id);
    } catch (_error) {
        pactPools = [];
    }

    if (pactPools.length > 0) {
        try {
            const fromAsset = await pactClient.fetchAsset(order.asset_in.asset_id);
            const preparedPactSwap = pactPools[0].prepareSwap({
                asset: fromAsset,
                amount: Number(amountInScaled),
                slippagePct: order.slippage,
            });
            const swapEffect = preparedPactSwap.effect;

            const amountOut = getUnScaledAmount(BigInt(swapEffect.amountReceived), order.asset_out.decimals);
            const amountOutWithSlippage = getUnScaledAmount(
                BigInt(swapEffect.minimumAmountReceived),
                order.asset_out.decimals
            );

            pactQuote = {
                preparedSwap: preparedPactSwap,
                assetIn: order.asset_in,
                assetOut: order.asset_out,
                amountIn: numberToBigNumber(order.amount_in),
                amountOut,
                amountOutWithSlippage,
                slippage: order.slippage,
            };
        } catch (error) {}
    }

    return pactQuote;
};
