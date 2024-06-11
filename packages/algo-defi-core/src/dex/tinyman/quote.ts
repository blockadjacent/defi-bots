import type { SwapQuote, V2PoolInfo } from "@tinymanorg/tinyman-js-sdk";
import type { AlgoLimitOrderAsset } from "../../util/data-retriever";
import type { GetQuoteParams } from "../index";
import type { AMMClients } from "../../util/client";

import BigNumber from "bignumber.js";
import { Swap, SwapQuoteType, SwapType, poolUtils } from "@tinymanorg/tinyman-js-sdk";
import { getScaledAmount, getUnScaledAmount, numberToBigNumber } from "@blockadjacent/bots-core";
import { AlgoBots } from "../../util/constants";

export type TinymanQuote = {
    preparedQuote: SwapQuote;
    assetIn: AlgoLimitOrderAsset;
    assetOut: AlgoLimitOrderAsset;
    amountIn: BigNumber;
    amountOut: BigNumber;
    amountOutWithSlippage: BigNumber;
    slippage: number;
};

export const getTinymanQuote = async (order: GetQuoteParams, ammClients: AMMClients): Promise<TinymanQuote | null> => {
    const amountInScaled = getScaledAmount(order.amount_in, order.asset_in.decimals);
    let tinymanV2Pool: V2PoolInfo;
    let tinymanQuote: TinymanQuote | null = null;

    if (order.slippage < AlgoBots.minimumSlippagePct) {
        throw new Error(
            `Slippage configured must be at least 0.1%. Order configured with a slippage percentage of ${order.slippage}`
        );
    }

    try {
        tinymanV2Pool = await poolUtils.v2.getPoolInfo({
            network: ammClients.network,
            client: ammClients.clients.tinyman.algodClient,
            asset1ID: order.asset_in.asset_id,
            asset2ID: order.asset_out.asset_id,
        });

        if (poolUtils.isPoolReady(tinymanV2Pool)) {
            const preparedQuote = await Swap.v2.getQuote({
                type: SwapType.FixedInput,
                amount: amountInScaled,
                assetIn: {
                    id: order.asset_in.asset_id,
                    decimals: order.asset_in.decimals,
                },
                assetOut: {
                    id: order.asset_out.asset_id,
                    decimals: order.asset_out.decimals,
                },
                pool: tinymanV2Pool,
                network: ammClients.network,
                isSwapRouterEnabled: true,
            });

            const amountOut = getUnScaledAmount(
                preparedQuote.type === SwapQuoteType.Direct
                    ? preparedQuote.data.quote.assetOutAmount
                    : preparedQuote.data.route[preparedQuote.data.route.length - 1].quote.amount_out.amount,
                order.asset_out.decimals
            );

            const slippage = BigNumber(order.slippage).div(100);
            const minimumReceived = amountOut.minus(amountOut.times(slippage));
            const amountOutWithSlippage = BigNumber(
                minimumReceived.toFixed(order.asset_out.decimals, BigNumber.ROUND_DOWN)
            );

            tinymanQuote = {
                preparedQuote,
                assetIn: order.asset_in,
                assetOut: order.asset_out,
                amountIn: numberToBigNumber(order.amount_in),
                amountOut,
                amountOutWithSlippage,
                slippage: order.slippage,
            };
        }
    } catch (_error) {}

    return tinymanQuote;
};
