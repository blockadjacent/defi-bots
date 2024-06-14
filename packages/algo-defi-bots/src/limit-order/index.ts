import "dotenv/config";
import algosdk from "algosdk";
import sleep from "sleep-promise";
import { tinymanJSSDKConfig } from "@tinymanorg/tinyman-js-sdk";
import {
    AlgoLimitOrderAsset,
    getAlgoLimitOrder,
    getAlgoLimitOrders,
    getAMMClients,
    getAssetHolding,
    getBestQuoteForOrder,
    insertAlgoLimitOrder,
    optInToAsset,
    performSwap,
    SupportedDex,
    updateAlgoLimitOrder,
} from "@blockadjacent/algo-defi-core";
import {
    formatAmount,
    numberToBigNumber,
    simpleSnakeToCamel,
    TablesInsert,
    TablesUpdate,
} from "@blockadjacent/bots-core";
import BigNumber from "bignumber.js";
import { formatISO } from "date-fns";

tinymanJSSDKConfig.setClientName("blockadjacent-algo_limit_order-bot");

async function main() {
    const account = algosdk.mnemonicToSecretKey(process.env.ALGO_ACCOUNT_MNEMONIC!);
    const ammClients = getAMMClients();
    const network = ammClients.network;
    let optInCheckedMap = new Map<number, boolean>();

    console.log("Running Algorand limit orders bot...\n");

    let waitingOnOrders = false;

    while (true) {
        const limitOrders = await getAlgoLimitOrders(account.addr, network);

        if (limitOrders.error) {
            throw new Error("Unable to query off-chain DB for limit orders. Try running the bot again later.");
        } else {
            console.log("---------------------------------------------------------------------------------------\n");

            if (limitOrders.data.length > 1) {
                console.log(`Found ${limitOrders.data.length} orders. Running through each one now...\n`);
                waitingOnOrders = false;
            } else if (limitOrders.data.length === 1) {
                console.log(`Found 1 order. Processing it now...\n`);
                waitingOnOrders = false;
            } else {
                if (!waitingOnOrders) {
                    console.log("No orders found. Waiting on limit orders to be submitted...\n");
                    waitingOnOrders = true;
                }
            }

            for (let i = 0; i < limitOrders.data.length; i++) {
                const limitOrder = limitOrders.data[i];
                const assetIn = limitOrder.asset_in as unknown as AlgoLimitOrderAsset;
                const assetOut = limitOrder.asset_out as unknown as AlgoLimitOrderAsset;

                if (limitOrder.order_type === "buy") {
                    console.log(
                        `Order to buy ${assetOut.unit_name} with ${limitOrder.amount_in} ${assetIn.unit_name} at a maximum price of ${limitOrder.at_price} ${assetIn.unit_name} per ${assetOut.unit_name}`
                    );
                } else {
                    console.log(
                        `Order to sell ${limitOrder.amount_in} ${assetIn.unit_name} for ${assetOut.unit_name} at a minimum price of ${limitOrder.at_price} ${assetOut.unit_name} per ${assetIn.unit_name}`
                    );
                }

                // Get the best available swap quote.
                console.log("Fetching swap quotes...");

                const bestQuote = await getBestQuoteForOrder(
                    {
                        amount_in: limitOrder.amount_in,
                        slippage: limitOrder.slippage,
                        asset_in: assetIn,
                        asset_out: assetOut,
                    },
                    ammClients
                );

                if (!bestQuote) {
                    console.error(
                        `No route found for the given ${assetIn.unit_name} -> ${assetOut.unit_name} swap order. Skipping to next order...`
                    );
                } else {
                    const limitPrice = numberToBigNumber(limitOrder.at_price);
                    const amountIn = numberToBigNumber(limitOrder.amount_in);
                    let minOut: BigNumber;

                    let dexIdentifierText = "";
                    let amountOut: BigNumber;
                    let amountOutWithSlippage: BigNumber;

                    if (bestQuote.dex === SupportedDex.Tinyman) {
                        dexIdentifierText = "Tinyman";
                        amountOut = bestQuote.quote.amountOut;
                        amountOutWithSlippage = bestQuote.quote.amountOutWithSlippage;
                    } else {
                        dexIdentifierText = "Pact";
                        amountOut = bestQuote.quote.amountOut;
                        amountOutWithSlippage = bestQuote.quote.amountOutWithSlippage;
                    }

                    console.log(
                        `Highest quote of ${formatAmount(amountOut.toFixed(), assetOut.decimals)} (minimum ${formatAmount(
                            amountOutWithSlippage.toFixed(),
                            assetOut.decimals
                        )}) ${assetOut.unit_name} found via ${dexIdentifierText}`
                    );

                    console.log("Checking if we've met swap requirements...");

                    if (limitOrder.order_type === "sell") {
                        minOut = limitPrice.times(amountIn);
                    } else {
                        minOut = amountIn.div(limitPrice);
                    }

                    if (amountOutWithSlippage.gte(minOut)) {
                        let holding: BigNumber | null = null;
                        let holdingAfterReceive: BigNumber | null = null;
                        let amountReceived: string | null = null;

                        console.log("Order conditions met. Opting account into receiving asset if needed...");

                        if (assetOut.asset_id !== 0 && !optInCheckedMap.get(assetOut.asset_id)) {
                            await optInToAsset(assetOut.asset_id, account, ammClients.clients.pactfi.pactClient);
                            optInCheckedMap.set(assetOut.asset_id, true);
                        }

                        // Store current balance of the receiving asset before swapping.
                        holding = await getAssetHolding(
                            assetOut.asset_id,
                            account,
                            ammClients.clients.pactfi.pactClient
                        );

                        if (holding === null) {
                            console.error(
                                `Unable to retrieve your ${assetOut.unit_name} balance. A swap attempt will still be made...`
                            );
                        } else {
                            console.log(
                                `Current ${assetOut.unit_name} balance: ${formatAmount(holding.toFixed(), assetOut.decimals)}`
                            );
                            console.log("Initiating swap...");
                        }

                        const swapResult = await performSwap(bestQuote, account, ammClients);

                        // Get new balance of the receiving asset after performing the swap.
                        if (holding !== null) {
                            holdingAfterReceive = await getAssetHolding(
                                assetOut.asset_id,
                                account,
                                ammClients.clients.pactfi.pactClient
                            );

                            if (holdingAfterReceive !== null) {
                                console.log(
                                    `New ${assetOut.unit_name} balance after swap: ${formatAmount(holdingAfterReceive.toFixed(), assetOut.decimals)}`
                                );
                            }
                        }

                        const now = formatISO(new Date());

                        //------------------------------------------------------------------------
                        // Update off-chain DB to mark the trade as completed.
                        //------------------------------------------------------------------------
                        let updateData: TablesUpdate<"algo_limit_orders"> = {
                            is_completed: true,
                            completed_on: now,
                            updated_at: now,
                            dex_used: `${bestQuote.dex}${bestQuote.dex === "tinyman" ? " " + bestQuote.quote.contractVersion : ""}`,
                            txn_id: swapResult.txnId,
                        };

                        ["group_id", "excess_group_id", "excess_txn_id"].forEach(key => {
                            const keyToCamelCase = simpleSnakeToCamel(key);
                            if (Object.hasOwn(swapResult, keyToCamelCase)) {
                                // @ts-ignore
                                updateData[key] = swapResult[keyToCamelCase];
                            }
                        });

                        if (holding !== null && holdingAfterReceive !== null) {
                            amountReceived = holdingAfterReceive.minus(holding).toFixed(assetOut.decimals);
                            updateData.amount_received = amountReceived;
                        }

                        const updateResponse = await updateAlgoLimitOrder(updateData, limitOrder.id);

                        if (updateResponse.error) {
                            console.log("Unable to update fulfilled limit order in the off-chain DB. Terminating bot.");
                            process.exit(1);
                        }

                        //------------------------------------------------------------------------
                        // Create reverse trade if we need to.
                        //------------------------------------------------------------------------
                        if (limitOrder.generate_reverse_trade && amountReceived) {
                            let insertData: TablesInsert<"algo_limit_orders"> = {
                                network: limitOrder.network,
                                wallet_address: limitOrder.wallet_address,
                                order_type: limitOrder.order_type === "sell" ? "buy" : "sell",
                                asset_in: assetOut.id,
                                asset_out: assetIn.id,
                                amount_in: amountReceived,
                                at_price: limitOrder.reverse_trade_at_price!,
                                slippage: limitOrder.slippage,
                                is_completed: false,
                                generate_reverse_trade: true,
                                always_use_starting_amount_in: limitOrder.always_use_starting_amount_in,
                                first_asset_in_linked_trades: limitOrder.first_asset_in_linked_trades ?? assetIn.id,
                                reverse_trade_at_price: limitOrder.at_price,
                                origin_trade: limitOrder.id,
                            };

                            if (
                                limitOrder.always_use_starting_amount_in &&
                                limitOrder.first_asset_in_linked_trades &&
                                insertData.asset_in === limitOrder.first_asset_in_linked_trades &&
                                limitOrder.origin_trade
                            ) {
                                const linkedOrder = await getAlgoLimitOrder(limitOrder.origin_trade);
                                if (linkedOrder && !linkedOrder.error && linkedOrder.data?.amount_in) {
                                    insertData.amount_in = linkedOrder.data?.amount_in ?? amountReceived;
                                }
                            }

                            const insertResponse = await insertAlgoLimitOrder(insertData);

                            if (insertResponse.error) {
                                console.error(
                                    "A reverse trade was generated for this limit order but it could not be saved to the off-chain DB."
                                );
                                console.error(insertResponse.error);
                            } else {
                                console.log(
                                    "A reverse trade was generated for this limit order and stored in the off-chain DB."
                                );
                            }
                        } else {
                            console.log("No reverse trade has been requested for this limit order.");
                        }
                    } else {
                        console.log("Limit price not reached. Not making a swap. Skipping to next order...");
                    }
                }

                console.log("");
            }
        }

        // Delay repeating the loop of limit order checks by 8 seconds.
        await sleep(8000);
    }
}

(async () => {
    while (true) {
        try {
            await main();
            process.exit(0);
        } catch (error) {
            console.error(error);

            // Wait 10 seconds if error was thrown and then try to continue running the bot.
            console.log("\nPausing bot for 10 seconds...\n");

            await sleep(10000);
        }
    }
})();
