import type { Account, Algodv2 } from "algosdk";
import type { PactQuote } from "./quote";

import { waitForConfirmation } from "algosdk";
import { SwapResultTxAndGroupIds } from "../index";

export const performPactSwap = async (
    quote: PactQuote,
    account: Account,
    algodClient: Algodv2
): Promise<SwapResultTxAndGroupIds> => {
    const swapTxGroup = await quote.preparedSwap.prepareTxGroup(account.addr);
    const signedTxs = swapTxGroup.signTxn(account.sk);
    const tx = await algodClient.sendRawTransaction(signedTxs).do();
    await waitForConfirmation(algodClient, tx.txId, 8);

    return {
        txnId: tx.txId,
    };
};
