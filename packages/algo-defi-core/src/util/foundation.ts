import type { Account } from "algosdk";
import type { SignerTransaction } from "@tinymanorg/tinyman-js-sdk";

import { waitForConfirmation } from "algosdk";
import pactsdk from "@pactfi/pactsdk";
import BigNumber from "bignumber.js";
import { getUnScaledAmount } from "@blockadjacent/bots-core";

/**
 * @param account Account that will sign the transactions
 * @returns a function that will sign the transactions, can be used as `initiatorSigner`
 */
export function signerWithSecretKey(account: Account) {
    return function (txGroups: SignerTransaction[][]): Promise<Uint8Array[]> {
        // Filter out transactions that don't need to be signed by the account
        const txnsToBeSigned = txGroups.flatMap(txGroup =>
            txGroup.filter(item => item.signers?.includes(account.addr))
        );
        // Sign all transactions that need to be signed by the account
        const signedTxns: Uint8Array[] = txnsToBeSigned.map(({ txn }) => txn.signTxn(account.sk));

        // We wrap this with a Promise since SDK's initiatorSigner expects a Promise
        return new Promise(resolve => {
            resolve(signedTxns);
        });
    };
}

export const optInToAsset = async (
    assetIndex: number,
    account: Account,
    pactClient: pactsdk.PactClient
): Promise<void> => {
    const asset = await pactClient.fetchAsset(assetIndex);
    const isOptedIn = await asset.isOptedIn(account.addr);

    if (!isOptedIn) {
        const optInTx = await asset.prepareOptInTx(account.addr);
        const signedTx = optInTx.signTxn(account.sk);
        const sentTx = await pactClient.algod.sendRawTransaction(signedTx).do();
        await waitForConfirmation(pactClient.algod, sentTx.txId, 10);
    }
};

export const getAssetHolding = async (
    assetIndex: number,
    account: Account,
    pactClient: pactsdk.PactClient
): Promise<BigNumber | null> => {
    const asset = await pactClient.fetchAsset(assetIndex);
    const holding = await asset.getHolding(account.addr);

    return holding === null ? null : getUnScaledAmount(holding, asset.decimals);
};
