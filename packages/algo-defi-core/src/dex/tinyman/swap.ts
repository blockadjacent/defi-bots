import type { Account, Algodv2 } from "algosdk";
import type { SupportedNetwork } from "@tinymanorg/tinyman-js-sdk";
import type { TinymanQuote } from "./quote";

import BigNumber from "bignumber.js";
import { Swap, SwapType } from "@tinymanorg/tinyman-js-sdk";
import { signerWithSecretKey } from "../../util/foundation";

export const performTinymanSwap = async (
    quote: TinymanQuote,
    account: Account,
    algodClient: Algodv2,
    network: SupportedNetwork
): Promise<string> => {
    const slippage = BigNumber(quote.slippage).div(100).toNumber();

    const swapTxns = await Swap.v2.generateTxns({
        client: algodClient,
        network,
        quote: quote.preparedQuote,
        swapType: SwapType.FixedInput,
        slippage,
        initiatorAddr: account.addr,
    });

    const signedTxns = await Swap.v2.signTxns({
        txGroup: swapTxns,
        initiatorSigner: signerWithSecretKey(account),
    });

    const swapExecution = await Swap.v2.execute({
        client: algodClient,
        quote: quote.preparedQuote,
        txGroup: swapTxns,
        signedTxns,
    });

    return swapExecution.txnID;
};
