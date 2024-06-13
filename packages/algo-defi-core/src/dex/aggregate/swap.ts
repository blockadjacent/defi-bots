import type { Account } from "algosdk";
import type { FetchedDexQuote } from "./index";

import { AMMClients } from "../../util/client";
import { performTinymanSwap } from "../tinyman/swap";
import { performPactSwap } from "../pact/swap";
import { SupportedDex } from "../index";

export const performSwap = async (quote: FetchedDexQuote, account: Account, ammClients: AMMClients) => {
    if (quote.dex === SupportedDex.Tinyman) {
        return await performTinymanSwap(
            quote.quote,
            account,
            ammClients.clients.tinyman.algodClient,
            ammClients.network
        );
    } else {
        return await performPactSwap(quote.quote, account, ammClients.clients.pactfi.algodClient);
    }
};
