import { Account, Algodv2 } from "algosdk";
import {
    generateRedeemTxns,
    redeemExcessAsset,
    SignerTransaction,
    SupportedNetwork,
    Swap,
    SwapType,
    V1SwapExecution,
    V2SwapExecution,
} from "@tinymanorg/tinyman-js-sdk";
import type { DirectSwapQuoteAndPool } from "@tinymanorg/tinyman-js-sdk/dist/swap/types";
import type { TinymanQuote } from "./quote";
import BigNumber from "bignumber.js";
import { signerWithSecretKey } from "../../util/foundation";
import { optInToValidatorApp } from "./v1-validator-app";

export const performTinymanSwap = async (
    quote: TinymanQuote,
    account: Account,
    algodClient: Algodv2,
    network: SupportedNetwork
): Promise<string> => {
    const slippage = BigNumber(quote.slippage).div(100).toNumber();
    let swapTxns: SignerTransaction[];
    let signedTxns: Uint8Array[];
    let swapExecution: V1SwapExecution | V2SwapExecution;

    if (quote.contractVersion === "v1_1") {
        const pool = quote.pool!;

        // If it's a Tinyman V1 contracts quote then we need to make sure the
        // account is opted into the validator app.
        await optInToValidatorApp(account, algodClient, network);

        swapTxns = await Swap.v1_1.generateTxns({
            client: algodClient,
            quoteAndPool: quote.preparedQuote.data as DirectSwapQuoteAndPool,
            swapType: SwapType.FixedInput,
            slippage,
            initiatorAddr: account.addr,
        });

        signedTxns = await Swap.v1_1.signTxns({
            pool,
            txGroup: swapTxns,
            initiatorSigner: signerWithSecretKey(account),
        });

        swapExecution = (await Swap.v1_1.execute({
            client: algodClient,
            pool,
            swapType: SwapType.FixedInput,
            txGroup: swapTxns,
            signedTxns,
            initiatorAddr: account.addr,
        })) as V1SwapExecution;

        // Check if any excess remains after the swap and redeem it right away.
        if (swapExecution.excessAmount.totalExcessAmount > 0n) {
            const redeemTxns = await generateRedeemTxns({
                client: algodClient,
                pool,
                assetID: swapExecution.excessAmount.assetID,
                assetOut: swapExecution.excessAmount.totalExcessAmount,
                initiatorAddr: account.addr,
            });

            await redeemExcessAsset({
                client: algodClient,
                pool,
                txGroup: redeemTxns,
                initiatorSigner: signerWithSecretKey(account),
            });
        }
    } else {
        swapTxns = await Swap.v2.generateTxns({
            client: algodClient,
            network,
            quote: quote.preparedQuote,
            swapType: SwapType.FixedInput,
            slippage,
            initiatorAddr: account.addr,
        });

        signedTxns = await Swap.v2.signTxns({
            txGroup: swapTxns,
            initiatorSigner: signerWithSecretKey(account),
        });

        swapExecution = await Swap.v2.execute({
            client: algodClient,
            quote: quote.preparedQuote,
            txGroup: swapTxns,
            signedTxns,
        });
    }

    return swapExecution.txnID;
};
