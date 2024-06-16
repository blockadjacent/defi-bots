import type { TinymanQuote } from "../tinyman/quote";
import type { PactQuote } from "../pact/quote";
import type { GetQuoteParams } from "../index";
import type { AMMClients } from "../../util/client";
import type { FetchedDexQuote } from "./index";

import { getTinymanQuote } from "../tinyman/quote";
import { getPactQuote } from "../pact/quote";

export type Quotes = {
    tinyman: TinymanQuote | null;
    pact: PactQuote | null;
};

export const getQuotes = async (order: GetQuoteParams, ammClients: AMMClients): Promise<Quotes> => {
    const quotes = await Promise.allSettled([getTinymanQuote(order, ammClients), getPactQuote(order, ammClients)]);

    return {
        tinyman: quotes[0].status === "fulfilled" ? quotes[0].value : null,
        pact: quotes[1].status === "fulfilled" ? quotes[1].value : null,
    };
};

export const getBestQuote = (quotes: Quotes): FetchedDexQuote | null => {
    let bestQuote: FetchedDexQuote | null = null;

    if (quotes.tinyman) {
        bestQuote = {
            dex: "tinyman",
            quote: quotes.tinyman,
        };
    }

    if (quotes.pact) {
        if (!bestQuote) {
            bestQuote = {
                dex: "pact",
                quote: quotes.pact,
            };
        } else {
            if (quotes.pact.amountOut.gt(bestQuote.quote.amountOut)) {
                bestQuote = {
                    dex: "pact",
                    quote: quotes.pact,
                };
            }
        }
    }

    return bestQuote;
};

export const getBestQuoteForOrder = async (
    order: GetQuoteParams,
    ammClients: AMMClients
): Promise<FetchedDexQuote | null> => {
    try {
        const quotes = await getQuotes(order, ammClients);
        return getBestQuote(quotes);
    } catch (error) {
        return null;
    }
};
