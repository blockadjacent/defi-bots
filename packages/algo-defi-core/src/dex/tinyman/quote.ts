import {
    ContractVersionValue,
    PoolReserves,
    poolUtils,
    Swap,
    SwapQuote,
    SwapQuoteType,
    SwapType,
    V1PoolInfo,
} from "@tinymanorg/tinyman-js-sdk";
import type { DirectSwapQuoteAndPool } from "@tinymanorg/tinyman-js-sdk/dist/swap/types";
import type { AlgoLimitOrderAsset } from "../../util/data-retriever";
import type { GetQuoteParams } from "../index";
import type { AMMClients } from "../../util/client";
import BigNumber from "bignumber.js";
import { getScaledAmount, getUnScaledAmount, numberToBigNumber } from "@blockadjacent/bots-core";
import { AlgoBots } from "../../util/constants";

export type TinymanQuote = {
    contractVersion: ContractVersionValue;
    preparedQuote: SwapQuote;
    pool?: V1PoolInfo;
    assetIn: AlgoLimitOrderAsset;
    assetOut: AlgoLimitOrderAsset;
    amountIn: BigNumber;
    amountOut: BigNumber;
    amountOutWithSlippage: BigNumber;
    slippage: number;
};

export const getTinymanQuote = async (order: GetQuoteParams, ammClients: AMMClients): Promise<TinymanQuote | null> => {
    let reserves: PoolReserves;
    let preparedV1Quote: SwapQuote | null = null;
    let preparedV2Quote: SwapQuote | null = null;
    let preparedQuote: SwapQuote;
    let returnedQuote: TinymanQuote | null = null;
    let contractVersion: ContractVersionValue;

    if (order.slippage < AlgoBots.minimumSlippagePct) {
        throw new Error(
            `Slippage configured must be at least 0.1%. Order configured with a slippage percentage of ${order.slippage}`
        );
    }

    try {
        const amountInScaled = getScaledAmount(order.amount_in, order.asset_in.decimals);
        const v1Pool = await poolUtils.v1_1.getPoolInfo({
            network: ammClients.network,
            client: ammClients.clients.tinyman.algodClient,
            asset1ID: order.asset_in.asset_id,
            asset2ID: order.asset_out.asset_id,
        });

        const v2Pool = await poolUtils.v2.getPoolInfo({
            network: ammClients.network,
            client: ammClients.clients.tinyman.algodClient,
            asset1ID: order.asset_in.asset_id,
            asset2ID: order.asset_out.asset_id,
        });

        if (!poolUtils.isPoolReady(v1Pool) && !poolUtils.isPoolReady(v2Pool)) {
            return null;
        }

        if (poolUtils.isPoolReady(v1Pool)) {
            reserves = await poolUtils.v1_1.getPoolReserves(ammClients.clients.tinyman.algodClient, v1Pool);
            preparedV1Quote = Swap.v1_1.getQuote(
                SwapType.FixedInput,
                v1Pool,
                reserves,
                {
                    id: order.asset_in.asset_id,
                    amount: amountInScaled,
                },
                {
                    assetIn: order.asset_in.decimals,
                    assetOut: order.asset_out.decimals,
                }
            );
        }

        if (poolUtils.isPoolReady(v2Pool)) {
            preparedV2Quote = await Swap.v2.getQuote({
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
                pool: v2Pool,
                network: ammClients.network,
                isSwapRouterEnabled: true,
            });
        }

        if (preparedV1Quote === null) {
            preparedQuote = preparedV2Quote!;
            contractVersion = "v2";
        } else if (preparedV2Quote === null) {
            preparedQuote = preparedV1Quote;
            contractVersion = "v1_1";
        } else {
            const v1QuoteAmountOut = (preparedV1Quote.data as DirectSwapQuoteAndPool).quote.assetOutAmount;
            const v2QuoteAmountOut =
                preparedV2Quote.type === SwapQuoteType.Direct
                    ? preparedV2Quote.data.quote.assetOutAmount
                    : BigInt(preparedV2Quote.data.route[preparedV2Quote.data.route.length - 1].quote.amount_out.amount);

            preparedQuote = v1QuoteAmountOut > v2QuoteAmountOut ? preparedV1Quote : preparedV2Quote;
            if (v1QuoteAmountOut > v2QuoteAmountOut) {
                preparedQuote = preparedV1Quote;
                contractVersion = "v1_1";
            } else {
                preparedQuote = preparedV2Quote;
                contractVersion = "v2";
            }
        }

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

        returnedQuote = {
            contractVersion,
            preparedQuote,
            assetIn: order.asset_in,
            assetOut: order.asset_out,
            amountIn: numberToBigNumber(order.amount_in),
            amountOut,
            amountOutWithSlippage,
            slippage: order.slippage,
        };

        if (contractVersion === "v1_1") {
            returnedQuote.pool = v1Pool;
        }
    } catch (_error) {}

    return returnedQuote;
};
