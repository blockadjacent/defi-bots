import type { Account } from "algosdk";
import type { FetchedDexQuote } from "./index";

import { AMMClients } from "../../util/client";
import { performTinymanSwap } from "../tinyman/swap";
import { performPactSwap } from "../pact/swap";
import { SupportedDex } from "../index";

export const performSwap = async (quote: FetchedDexQuote, account: Account, ammClients: AMMClients) => {
    let txId: string;

    if (quote.dex === SupportedDex.Tinyman) {
        txId = await performTinymanSwap(
            quote.quote,
            account,
            ammClients.clients.tinyman.algodClient,
            ammClients.network
        );
    } else {
        txId = await performPactSwap(quote.quote, account, ammClients.clients.pactfi.algodClient);
    }

    return txId;
};
