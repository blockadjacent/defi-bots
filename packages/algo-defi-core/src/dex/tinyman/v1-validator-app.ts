import { Account, Algodv2 } from "algosdk";
import {
    CONTRACT_VERSION,
    generateOptIntoValidatorTxns,
    getAccountInformation,
    getValidatorAppID,
    isAccountOptedIntoApp,
    sendAndWaitRawTransaction,
    SupportedNetwork,
} from "@tinymanorg/tinyman-js-sdk";
import { signerWithSecretKey } from "../../util/foundation";

export const optInToValidatorApp = async (
    account: Account,
    algodClient: Algodv2,
    network: SupportedNetwork
): Promise<void> => {
    const accountInfo = await getAccountInformation(algodClient, account.addr);
    const isAppOptInRequired = !isAccountOptedIntoApp({
        appID: getValidatorAppID(network, CONTRACT_VERSION.V1_1),
        accountAppsLocalState: accountInfo["apps-local-state"],
    });

    if (isAppOptInRequired) {
        const v1AppOptInTxns = await generateOptIntoValidatorTxns({
            client: algodClient,
            network,
            contractVersion: CONTRACT_VERSION.V1_1,
            initiatorAddr: account.addr,
        });

        const signedTxns = await signerWithSecretKey(account)([v1AppOptInTxns]);
        await sendAndWaitRawTransaction(algodClient, [signedTxns]);
    }
};
