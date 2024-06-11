import { SupportedDex } from "../index";
import type { TinymanQuote } from "../tinyman/quote";
import type { PactQuote } from "../pact/quote";

export type FetchedDexQuote =
    | {
          dex: (typeof SupportedDex)["Tinyman"];
          quote: TinymanQuote;
      }
    | {
          dex: (typeof SupportedDex)["Pact"];
          quote: PactQuote;
      };
