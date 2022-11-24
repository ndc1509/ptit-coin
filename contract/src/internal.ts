import { FTContract } from "./contract";
import { assert, near, validateAccountId } from "near-sdk-js";

//Send near
export function internalSendNEAR(receiverId: string, amount: bigint) {
    assert(amount > 0, "Sending amount must greater than 0");
    assert(
        near.accountBalance() > amount,
        `Not enough balance ${near.accountBalance()} to send ${amount}`
    );
    const promise = near.promiseBatchCreate(receiverId);
    near.promiseBatchActionTransfer(promise, amount);
    near.promiseReturn(promise);
}

export function internalGetBalance(
    contract: FTContract,
    accountId: string
): string {
    assert(validateAccountId(accountId), "Invalid account ID");
    assert(
        contract.accounts.containsKey(accountId),
        `Account ${accountId} is not registered`
    );
    return contract.accounts.get(accountId).toString();
}
