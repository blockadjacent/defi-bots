import { Algodv2 } from "algosdk";
import pactsdk from "@pactfi/pactsdk";
import type { SupportedNetwork } from "@tinymanorg/tinyman-js-sdk";

export type TinymanClientWrapper = {
    algodClient: Algodv2;
};

export type PactClientWrapper = {
    algodClient: Algodv2;
    pactClient: pactsdk.PactClient;
};

export type AMMClients = {
    clients: {
        pactfi: PactClientWrapper;
        tinyman: TinymanClientWrapper;
    };
    network: SupportedNetwork;
};

export const getAMMClients = (): AMMClients => {
    const network = process.env.ALGO_NETWORK! as SupportedNetwork;
    const algodServer = process.env.ALGOD_ENDPOINT!;
    const algodPort = process.env.ALGOD_PORT || "";
    const algodToken = process.env.ALGOD_TOKEN || "";

    const algodClient = new Algodv2(algodToken, algodServer, algodPort);
    const pactClient = new pactsdk.PactClient(algodClient, { network });

    return {
        clients: {
            pactfi: {
                algodClient,
                pactClient,
            },
            tinyman: {
                algodClient,
            },
        },
        network,
    };
};
